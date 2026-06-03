import { $ as e, A as t, C as n, D as r, E as i, Et as a, F as o, J as s, K as c, N as l, O as u, P as d, Q as f, S as p, T as m, Tt as h, X as g, Y as _, Z as v, _t as y, ct as b, dt as x, et as S, f as C, gt as w, j as T, k as E, mt as ee, nt as te, ot as ne, q as re, rt as ie, st as ae, t as oe, tt as se, ut as ce, vt as D, w as O, y as le } from "./client-DZE_lzdb.js";
import { C as ue, I as de, T as fe, a as pe, c as me, i as he, l as k, m as ge, n as A, nt as _e, o as ve, r as ye, s as be, t as j, u as xe, x as Se, y as Ce } from "./config-Cxv7acF8.js";
import { B as we, C as Te, D as Ee, E as De, F as M, H as Oe, L as N, M as ke, N as Ae, S as P, T as F, U as je, Y as Me, Z as I, _ as Ne, a as Pe, at as L, c as Fe, d as Ie, f as Le, g as Re, h as ze, i as Be, it as Ve, l as He, m as Ue, n as We, o as Ge, ot as R, p as Ke, r as qe, rt as z, s as Je, t as Ye, u as Xe, v as Ze, w as B, x as V, y as H, z as Qe } from "./mjr-primevue-DeVPqKdl.js";
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
var U = (e, t) => {
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
}, W = (e, t) => {
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
]), mt = (e, t) => Math.max(60, Math.min(600, Math.round(W(e, t)))), ht = (e = {}) => {
	let t = Number(e?.minSize);
	if (Number.isFinite(t)) return mt(t, A.GRID_MIN_SIZE);
	let n = lt(String(e?.minSizePreset || "").toLowerCase(), pt, "");
	return n ? ft[n] : mt(e?.minSize, A.GRID_MIN_SIZE);
}, gt = (e = {}) => mt(e?.minSize, A.FEED_GRID_MIN_SIZE), _t = (e) => {
	let t = Math.round(W(e, A.GRID_MIN_SIZE));
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
		let i = G("div", { style: {
			display: "flex",
			flexDirection: "column",
			gap: "18px",
			padding: "18px 20px 18px 20px"
		} }, [
			G("div", { style: {
				display: "flex",
				alignItems: "center",
				justifyContent: "flex-start"
			} }, [G("div", {
				textContent: t,
				style: {
					fontWeight: "700",
					fontSize: "30px",
					color: "rgba(255,255,255,0.96)",
					lineHeight: "1.2"
				}
			})]),
			G("div", {
				textContent: String(e || ""),
				style: {
					fontSize: "22px",
					color: "rgba(255,255,255,0.86)",
					whiteSpace: "pre-wrap",
					lineHeight: "1.45"
				}
			}),
			G("div", { style: {
				display: "flex",
				justifyContent: "flex-end",
				gap: "10px"
			} }, [G("button", {
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
			title: String(t || k("dialog.confirm", "Confirm")),
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
		}, o = G("div", { style: {
			display: "flex",
			flexDirection: "column",
			gap: "18px",
			padding: "18px 20px 18px 20px"
		} }, [
			G("div", { style: {
				display: "flex",
				alignItems: "center",
				justifyContent: "flex-start"
			} }, [G("div", {
				textContent: t,
				style: {
					fontWeight: "700",
					fontSize: "30px",
					color: "rgba(255,255,255,0.96)",
					lineHeight: "1.2"
				}
			})]),
			G("div", {
				textContent: String(e || ""),
				style: {
					fontSize: "22px",
					color: "rgba(255,255,255,0.86)",
					whiteSpace: "pre-wrap",
					lineHeight: "1.45"
				}
			}),
			G("div", { style: {
				display: "flex",
				justifyContent: "flex-end",
				gap: "10px"
			} }, [G("button", {
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
			}), G("button", {
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
			title: String(n || k("dialog.prompt", "Prompt")),
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
		}, s = G("input", {
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
		}), c = G("div", { style: {
			display: "flex",
			flexDirection: "column",
			gap: "12px",
			padding: "16px"
		} }, [
			G("div", {
				textContent: n,
				style: {
					fontWeight: "600",
					fontSize: "14px",
					color: "rgba(255,255,255,0.95)"
				}
			}),
			G("div", {
				textContent: String(e || ""),
				style: {
					fontSize: "13px",
					color: "rgba(255,255,255,0.80)",
					whiteSpace: "pre-wrap",
					lineHeight: "1.4"
				}
			}),
			s,
			G("div", { style: {
				display: "flex",
				justifyContent: "flex-end",
				gap: "10px"
			} }, [G("button", {
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
			}), G("button", {
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
		return fe()?.ui || null;
	} catch {
		return null;
	}
}, St = () => {
	let e = (e) => !!e && (typeof e.alert == "function" || typeof e.confirm == "function" || typeof e.prompt == "function");
	try {
		let t = Se();
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
}, G = (e, t, n) => {
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
}, K = {
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
}, q = () => {
	try {
		let e = xe.get(a);
		if (!e) return { ...K };
		let t = JSON.parse(e), n = t && typeof t == "object" && Number.isInteger(t.version) && t.data && typeof t.data == "object";
		if (!n && !(t && typeof t == "object" && !Array.isArray(t))) return { ...K };
		if (n && Number(t.version) > 1) return console.warn("[Majoor] settings schema version is newer than this build, using defaults"), { ...K };
		let r = n ? t.data : t, i = new Set(/* @__PURE__ */ "debug.grid.infiniteScroll.siblings.autoScan.scan.watcher.status.viewer.rtHydrate.observability.feed.sidebar.probeBackend.i18n.paths.db.ratingTagsSync.cache.search.ai.executionGrouping.workflowMinimap.ui.security.safety".split(".")), o = {};
		if (r && typeof r == "object") for (let [e, t] of Object.entries(r)) i.has(e) && (o[e] = t);
		let s = dt(K, o);
		if (!n) try {
			J(s);
		} catch (e) {
			console.debug?.(e);
		}
		return s;
	} catch (e) {
		return console.warn("[Majoor] settings load failed, using defaults", e), { ...K };
	}
}, J = (e) => {
	try {
		let t = JSON.parse(JSON.stringify(e || {}));
		t?.security && typeof t.security == "object" && (t.security.apiToken = "");
		let n = {
			version: 1,
			data: t
		};
		if (!xe.set("mjrSettings", JSON.stringify(n))) throw Error("SettingsStore rejected the write");
	} catch (e) {
		console.warn("[Majoor] settings save failed", e);
		try {
			let e = Date.now();
			e - (Number(window?._mjrSettingsSaveFailAt || 0) || 0) > 3e4 && (window._mjrSettingsSaveFailAt = e, vt(k("dialog.settingsSaveFailed", "Majoor: Failed to save settings (browser storage full or blocked).")));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			ct("mjr-settings-save-failed", { error: String(e?.message || e || "") }, { warnPrefix: "[Majoor]" });
		} catch (e) {
			console.debug?.(e);
		}
	}
}, Y = (e) => {
	let t = Number(A.MAX_PAGE_SIZE) || 2e3;
	j.DEFAULT_PAGE_SIZE = Math.max(50, Math.min(t, Number(e.grid?.pageSize) || A.DEFAULT_PAGE_SIZE)), j.AUTO_SCAN_ON_STARTUP = !!e.autoScan?.onStartup, j.EXECUTION_GROUPING_ENABLED = !!(e.executionGrouping?.enabled ?? A.EXECUTION_GROUPING_ENABLED), j.STATUS_POLL_INTERVAL = Math.max(1e3, Number(e.status?.pollInterval) || A.STATUS_POLL_INTERVAL), j.DEBUG_SAFE_CALL = !!e.debug?.safeCall, j.DEBUG_SAFE_LISTENERS = !!e.debug?.safeListeners, j.DEBUG_VIEWER = !!e.debug?.viewer, j.GRID_MIN_SIZE = ht(e.grid), j.FEED_GRID_MIN_SIZE = gt(e.feed), j.GRID_GAP = Math.max(0, Math.min(40, Math.round(W(e.grid?.gap, A.GRID_GAP)))), j.GRID_SHOW_BADGES_EXTENSION = !!(e.grid?.showExtBadge ?? A.GRID_SHOW_BADGES_EXTENSION), j.GRID_SHOW_BADGES_RATING = !!(e.grid?.showRatingBadge ?? A.GRID_SHOW_BADGES_RATING), j.GRID_SHOW_BADGES_TAGS = !!(e.grid?.showTagsBadge ?? A.GRID_SHOW_BADGES_TAGS), j.GRID_SHOW_DETAILS = !!(e.grid?.showDetails ?? A.GRID_SHOW_DETAILS), j.GRID_SHOW_DETAILS_FILENAME = !!(e.grid?.showFilename ?? A.GRID_SHOW_DETAILS_FILENAME), j.GRID_SHOW_DETAILS_DATE = !!(e.grid?.showDate ?? A.GRID_SHOW_DETAILS_DATE), j.GRID_SHOW_DETAILS_DIMENSIONS = !!(e.grid?.showDimensions ?? A.GRID_SHOW_DETAILS_DIMENSIONS), j.GRID_SHOW_DETAILS_GENTIME = !!(e.grid?.showGenTime ?? A.GRID_SHOW_DETAILS_GENTIME), j.GRID_SHOW_HOVER_INFO = !!(e.grid?.showHoverInfo ?? A.GRID_SHOW_HOVER_INFO), j.GRID_SHOW_WORKFLOW_DOT = !!(e.grid?.showWorkflowDot ?? A.GRID_SHOW_WORKFLOW_DOT), j.FEED_SHOW_INFO = !!(e.feed?.showInfo ?? A.FEED_SHOW_INFO), j.FEED_SHOW_FILENAME = !!(e.feed?.showFilename ?? A.FEED_SHOW_FILENAME), j.FEED_SHOW_DIMENSIONS = !!(e.feed?.showDimensions ?? A.FEED_SHOW_DIMENSIONS), j.FEED_SHOW_DATE = !!(e.feed?.showDate ?? A.FEED_SHOW_DATE), j.FEED_SHOW_GENTIME = !!(e.feed?.showGenTime ?? A.FEED_SHOW_GENTIME), j.FEED_SHOW_WORKFLOW_DOT = !!(e.feed?.showWorkflowDot ?? A.FEED_SHOW_WORKFLOW_DOT), j.FEED_SHOW_BADGES_EXTENSION = !!(e.feed?.showExtBadge ?? A.FEED_SHOW_BADGES_EXTENSION), j.FEED_SHOW_BADGES_RATING = !!(e.feed?.showRatingBadge ?? A.FEED_SHOW_BADGES_RATING), j.FEED_SHOW_BADGES_TAGS = !!(e.feed?.showTagsBadge ?? A.FEED_SHOW_BADGES_TAGS);
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
	j.INFINITE_SCROLL_ENABLED = !!e.infiniteScroll?.enabled, j.INFINITE_SCROLL_ROOT_MARGIN = String(e.infiniteScroll?.rootMargin || A.INFINITE_SCROLL_ROOT_MARGIN), j.INFINITE_SCROLL_THRESHOLD = Math.max(0, Math.min(1, W(e.infiniteScroll?.threshold, A.INFINITE_SCROLL_THRESHOLD))), j.BOTTOM_GAP_PX = Math.max(0, Math.min(5e3, Math.round(W(e.infiniteScroll?.bottomGapPx, A.BOTTOM_GAP_PX)))), j.VIEWER_ALLOW_PAN_AT_ZOOM_1 = !!e.viewer?.allowPanAtZoom1, j.VIEWER_DISABLE_WEBGL_VIDEO = !!e.viewer?.disableWebGL, j.VIEWER_PAUSE_DURING_EXECUTION = !!(e.viewer?.pauseDuringExecution ?? A.VIEWER_PAUSE_DURING_EXECUTION), j.FLOATING_VIEWER_PAUSE_DURING_EXECUTION = !!(e.viewer?.floatingPauseDuringExecution ?? A.FLOATING_VIEWER_PAUSE_DURING_EXECUTION), j.MFV_LIVE_DEFAULT = e.viewer?.mfvLiveDefault ?? A.MFV_LIVE_DEFAULT, j.MFV_PREVIEW_DEFAULT = e.viewer?.mfvPreviewDefault ?? A.MFV_PREVIEW_DEFAULT, j.MFV_LIVE_AUTO_OPEN = !1, j.MFV_PREVIEW_AUTO_OPEN = !1, j.MFV_NODE_STREAM_AUTO_OPEN = !1;
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
	j.VIEWER_VIDEO_GRADE_THROTTLE_FPS = Math.max(1, Math.min(60, Math.round(W(e.viewer?.videoGradeThrottleFps, A.VIEWER_VIDEO_GRADE_THROTTLE_FPS)))), j.VIEWER_SCOPES_FPS = Math.max(1, Math.min(60, Math.round(W(e.viewer?.scopesFps, A.VIEWER_SCOPES_FPS)))), j.VIEWER_META_TTL_MS = Math.max(1e3, Math.min(10 * 6e4, Math.round(W(e.viewer?.metaTtlMs, A.VIEWER_META_TTL_MS)))), j.VIEWER_META_MAX_ENTRIES = Math.max(50, Math.min(5e3, Math.round(W(e.viewer?.metaMaxEntries, A.VIEWER_META_MAX_ENTRIES)))), j.WORKFLOW_MINIMAP_ENABLED = !!(e.workflowMinimap?.enabled ?? !1), j.RT_HYDRATE_CONCURRENCY = Math.max(1, Math.min(16, Math.round(W(e.rtHydrate?.concurrency, A.RT_HYDRATE_CONCURRENCY)))), j.RT_HYDRATE_QUEUE_MAX = Math.max(10, Math.min(5e3, Math.round(W(e.rtHydrate?.queueMax, A.RT_HYDRATE_QUEUE_MAX)))), j.RT_HYDRATE_SEEN_MAX = Math.max(1e3, Math.min(2e5, Math.round(W(e.rtHydrate?.seenMax, A.RT_HYDRATE_SEEN_MAX)))), j.RT_HYDRATE_PRUNE_BUDGET = Math.max(10, Math.min(1e4, Math.round(W(e.rtHydrate?.pruneBudget, A.RT_HYDRATE_PRUNE_BUDGET)))), j.RT_HYDRATE_SEEN_TTL_MS = Math.max(5e3, Math.min(360 * 6e4, Math.round(W(e.rtHydrate?.seenTtlMs, A.RT_HYDRATE_SEEN_TTL_MS)))), j.DELETE_CONFIRMATION = !!e.safety?.confirmDeletion, j.DEBUG_VERBOSE_ERRORS = !!e.observability?.verboseErrors, j.WATCHER_MAX_PENDING = Math.max(10, Math.min(5e3, Math.round(W(e.watcher?.maxPending, 500)))), j.WATCHER_MIN_SIZE = Math.max(0, Math.min(1e6, Math.round(W(e.watcher?.minSize, 100)))), j.WATCHER_MAX_SIZE = Math.max(1e5, Math.min(17179869184, Math.round(W(e.watcher?.maxSize, 4294967296)))), j.DB_TIMEOUT_MS = Math.max(1e3, Math.min(3e4, Math.round(W(e.db?.timeoutMs, 5e3)))), j.DB_MAX_CONNECTIONS = Math.max(1, Math.min(100, Math.round(W(e.db?.maxConnections, 10)))), j.DB_QUERY_TIMEOUT_MS = Math.max(500, Math.min(1e4, Math.round(W(e.db?.queryTimeoutMs, 1e3)))), j.SEARCH_REQUEST_LIMIT = Math.max(10, Math.min(A.MAX_PAGE_SIZE || 2e3, Math.round(W(e.search?.maxResults, A.SEARCH_DEFAULT_LIMIT))));
};
async function It() {
	try {
		let e = await t();
		if (!e?.ok) return;
		let n = e.data?.prefs;
		if (!n || typeof n != "object") return;
		let r = q();
		if (r.security = r.security || {}, r.security.safeMode = U(n.safe_mode, r.security.safeMode), r.security.allowWrite = U(n.allow_write, r.security.allowWrite), r.security.requireAuth = U(n.require_auth, r.security.requireAuth), r.security.allowRemoteWrite = U(n.allow_remote_write, r.security.allowRemoteWrite), r.security.allowInsecureTokenTransport = U(n.allow_insecure_token_transport, r.security.allowInsecureTokenTransport), r.security.allowDelete = U(n.allow_delete, r.security.allowDelete), r.security.allowRename = U(n.allow_rename, r.security.allowRename), r.security.allowOpenInFolder = U(n.allow_open_in_folder, r.security.allowOpenInFolder), r.security.allowResetIndex = U(n.allow_reset_index, r.security.allowResetIndex), r.security.tokenConfigured = U(n.token_configured, r.security.tokenConfigured), r.security.tokenHint = String(n.token_hint || "").trim(), !String(r.security.apiToken || "").trim()) try {
			let e = await C(), t = String(e?.data?.token || "").trim();
			e?.ok && t && (r.security.apiToken = t);
		} catch (e) {
			console.debug?.(e);
		}
		J(r), Y(r), ct("mjr-settings-changed", { key: "security" }, { warnPrefix: "[Majoor]" });
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
		let n = q();
		n.ai = n.ai || {}, n.ai.vectorSearchEnabled = U(t.enabled, n.ai.vectorSearchEnabled ?? !0), n.ai.vectorCaptionOnIndex = U(t.caption_on_index ?? t.captionOnIndex, n.ai.vectorCaptionOnIndex ?? !1), J(n), Y(n), ct("mjr-settings-changed", { key: "ai.vectorSearch" }, { warnPrefix: "[Majoor]" });
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
		let n = q();
		n.executionGrouping = n.executionGrouping || {}, n.executionGrouping.enabled = U(t.enabled, n.executionGrouping.enabled ?? A.EXECUTION_GROUPING_ENABLED), J(n), Y(n), ct("mjr-settings-changed", { key: "executionGrouping.enabled" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend execution grouping settings", e);
	}
}
//#endregion
//#region ui/app/settings/settingsRuntime.ts
var zt = "mjr-runtime-status-dashboard", Bt = "__mjr_write_token", Vt = 3e4;
function Ht() {
	try {
		let e = q(), t = String(e?.observability?.runtimeDashboardMode || K.observability.runtimeDashboardMode);
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
		let [i, a] = await Promise.all([E(), t()]), o = k("runtime.unavailable", "Runtime: unavailable");
		if (!i?.ok || !i?.data) n.textContent = o;
		else {
			let e = i.data.db || {}, t = i.data.index || {}, r = i.data.watcher || {}, a = Number(e.active_connections || 0), s = Number(t.enrichment_queue_length || 0), c = Number(r.pending_files || 0);
			n.textContent = k("runtime.metricsLine", "DB active: {active} | Enrich Q: {enrichQ} | Watcher pending: {pending}", {
				active: a,
				enrichQ: s,
				pending: c
			}), o = k("runtime.metricsTitle", "Runtime Metrics\nDB active connections: {active}\nEnrichment queue: {enrichQ}\nWatcher pending files: {pending}", {
				active: a,
				enrichQ: s,
				pending: c
			});
		}
		let s = qt(a?.data?.prefs || null);
		return r.textContent = s.text, r.style.color = s.color, e.title = `${o}\n${s.text}`, !0;
	} catch {
		return n.textContent = k("runtime.unavailable", "Runtime: unavailable"), r.textContent = k("runtime.writeAuthUnknown", "Write auth: unknown"), r.style.color = "#c8ced8", e.title = `${k("runtime.unavailable", "Runtime: unavailable")}\n${r.textContent}`, !0;
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
var X = "Majoor", $t = "Majoor Assets Manager";
function en(e, t, n) {
	let r = (e, t) => [
		$t,
		e,
		t
	], i = (e) => [
		$t,
		k("cat.cards", "Cards"),
		e
	], a = (e) => [
		$t,
		k("cat.badges", "Badges"),
		e
	], o = (e) => [
		$t,
		k("cat.badges", "Badges"),
		e
	], s = (e, t) => {
		let n = String(e || "").trim();
		return /^[0-9a-fA-F]{6}$/.test(n) && (n = `#${n}`), /^#[0-9a-fA-F]{6}$/.test(n) ? n.toUpperCase() : t;
	};
	t.grid?.minSizePreset || (t.grid = t.grid || {}, t.grid.minSizePreset = _t(t.grid.minSize), J(t)), e({
		id: `${X}.Cards.ThumbSize`,
		category: i(k("setting.grid.cardSize.group", "Card size")),
		name: k("setting.grid.cardSize.name", "Majoor: Card Size"),
		tooltip: k("setting.grid.cardSize.desc", "Choose the card size preset used by the grid layout."),
		type: "combo",
		defaultValue: (() => {
			let e = lt(String(t.grid?.minSizePreset || "").toLowerCase(), pt, _t(t.grid?.minSize)), n = {
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
			r === i || r === "small" || r === "petit" ? s = "small" : r === o || r === "large" || r === "grand" ? s = "large" : (r === a || r === "medium" || r === "moyen") && (s = "medium"), t.grid.minSizePreset = s, t.grid.minSize = ft[s], J(t), Y(t), n("grid.minSizePreset");
		}
	}), e({
		id: `${X}.Cards.CustomThumbSize`,
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
			t.grid.minSize = r, t.grid.minSizePreset = _t(r), J(t), Y(t), n("grid.minSize");
		}
	}), e({
		id: `${X}.Grid.ShowDetails`,
		category: i("Show card details"),
		name: "Show metadata panel",
		tooltip: "Show the bottom details panel on asset cards (filename, date, etc.)",
		type: "boolean",
		defaultValue: !!t.grid?.showDetails,
		onChange: (e) => {
			t.grid.showDetails = !!e, J(t), Y(t), n("grid.showDetails");
		}
	}), e({
		id: `${X}.Grid.ShowFilename`,
		category: i("Show filename"),
		name: "Show filename",
		tooltip: "Display filename in details panel",
		type: "boolean",
		defaultValue: !!t.grid?.showFilename,
		onChange: (e) => {
			t.grid.showFilename = !!e, J(t), Y(t), n("grid.showFilename");
		}
	}), e({
		id: `${X}.Grid.ShowDate`,
		category: i("Show date/time"),
		name: "Show date/time",
		tooltip: "Display date and time in details panel",
		type: "boolean",
		defaultValue: !!t.grid?.showDate,
		onChange: (e) => {
			t.grid.showDate = !!e, J(t), Y(t), n("grid.showDate");
		}
	}), e({
		id: `${X}.Grid.ShowDimensions`,
		category: i("Show dimensions"),
		name: "Show dimensions",
		tooltip: "Display resolution (WxH) in details panel",
		type: "boolean",
		defaultValue: !!t.grid?.showDimensions,
		onChange: (e) => {
			t.grid.showDimensions = !!e, J(t), Y(t), n("grid.showDimensions");
		}
	}), e({
		id: `${X}.Grid.ShowGenTime`,
		category: i("Show generation time"),
		name: "Show generation time",
		tooltip: "Display seconds taken to generate the asset (if available)",
		type: "boolean",
		defaultValue: !!(t.grid?.showGenTime ?? A.GRID_SHOW_DETAILS_GENTIME),
		onChange: (e) => {
			t.grid.showGenTime = !!e, J(t), Y(t), n("grid.showGenTime");
		}
	}), e({
		id: `${X}.Grid.ShowHoverInfo`,
		category: i("Show prompt on hover"),
		name: "Show prompt on hover",
		tooltip: "Show positive prompt and generation time as a tooltip overlay when hovering over a card thumbnail. Does not block video play-on-hover.",
		type: "boolean",
		defaultValue: !!(t.grid?.showHoverInfo ?? A.GRID_SHOW_HOVER_INFO),
		onChange: (e) => {
			t.grid.showHoverInfo = !!e, J(t), Y(t), n("grid.showHoverInfo");
		}
	}), e({
		id: `${X}.Grid.ShowWorkflowDot`,
		category: i("Show workflow dot"),
		name: "Show workflow indicator",
		tooltip: "Display the green dot indicating workflow metadata availability (bottom right of card)",
		type: "boolean",
		defaultValue: !!t.grid?.showWorkflowDot,
		onChange: (e) => {
			t.grid.showWorkflowDot = !!e, J(t), Y(t), n("grid.showWorkflowDot");
		}
	}), e({
		id: `${X}.Grid.ShowExtBadge`,
		category: a("Show format badges"),
		name: "Show format badges",
		tooltip: "Display format badges (e.g. JPG, MP4) on thumbnails",
		type: "boolean",
		defaultValue: !!t.grid?.showExtBadge,
		onChange: (e) => {
			t.grid.showExtBadge = !!e, J(t), Y(t), n("grid.showExtBadge");
		}
	}), e({
		id: `${X}.Grid.ShowRatingBadge`,
		category: a("Show rating badges"),
		name: "Show ratings",
		tooltip: "Display star ratings on thumbnails",
		type: "boolean",
		defaultValue: !!t.grid?.showRatingBadge,
		onChange: (e) => {
			t.grid.showRatingBadge = !!e, J(t), Y(t), n("grid.showRatingBadge");
		}
	}), e({
		id: `${X}.Grid.ShowTagsBadge`,
		category: a("Show tags badges"),
		name: "Show tags",
		tooltip: "Display a small indicator if an asset has tags",
		type: "boolean",
		defaultValue: !!t.grid?.showTagsBadge,
		onChange: (e) => {
			t.grid.showTagsBadge = !!e, J(t), Y(t), n("grid.showTagsBadge");
		}
	}), e({
		id: `${X}.Badges.StarColor`,
		category: o(k("setting.starColor", "Star color")),
		name: k("setting.starColor", "Majoor: Star color"),
		tooltip: k("setting.starColor.tooltip", "Color of rating stars on thumbnails (hex, e.g. #FFD45A)"),
		type: "color",
		defaultValue: s(t.grid?.starColor, A.BADGE_STAR_COLOR),
		onChange: (e) => {
			t.grid.starColor = s(e, A.BADGE_STAR_COLOR), J(t), Y(t), n("grid.starColor");
		}
	}), e({
		id: `${X}.Badges.ImageColor`,
		category: o(k("setting.badgeImageColor", "Image badge color")),
		name: k("setting.badgeImageColor", "Majoor: Image badge color"),
		tooltip: k("setting.badgeImageColor.tooltip", "Color for image badges: PNG, JPG, WEBP, GIF, BMP, TIF (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeImageColor, A.BADGE_IMAGE_COLOR),
		onChange: (e) => {
			t.grid.badgeImageColor = s(e, A.BADGE_IMAGE_COLOR), J(t), Y(t), n("grid.badgeImageColor");
		}
	}), e({
		id: `${X}.Badges.VideoColor`,
		category: o(k("setting.badgeVideoColor", "Video badge color")),
		name: k("setting.badgeVideoColor", "Majoor: Video badge color"),
		tooltip: k("setting.badgeVideoColor.tooltip", "Color for video badges: MP4, WEBM, MOV, AVI, MKV (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeVideoColor, A.BADGE_VIDEO_COLOR),
		onChange: (e) => {
			t.grid.badgeVideoColor = s(e, A.BADGE_VIDEO_COLOR), J(t), Y(t), n("grid.badgeVideoColor");
		}
	}), e({
		id: `${X}.Badges.AudioColor`,
		category: o(k("setting.badgeAudioColor", "Audio badge color")),
		name: k("setting.badgeAudioColor", "Majoor: Audio badge color"),
		tooltip: k("setting.badgeAudioColor.tooltip", "Color for audio badges: MP3, WAV, OGG, FLAC (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeAudioColor, A.BADGE_AUDIO_COLOR),
		onChange: (e) => {
			t.grid.badgeAudioColor = s(e, A.BADGE_AUDIO_COLOR), J(t), Y(t), n("grid.badgeAudioColor");
		}
	}), e({
		id: `${X}.Badges.Model3dColor`,
		category: o(k("setting.badgeModel3dColor", "3D model badge color")),
		name: k("setting.badgeModel3dColor", "Majoor: 3D model badge color"),
		tooltip: k("setting.badgeModel3dColor.tooltip", "Color for 3D model badges: OBJ, FBX, GLB, GLTF (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeModel3dColor, A.BADGE_MODEL3D_COLOR),
		onChange: (e) => {
			t.grid.badgeModel3dColor = s(e, A.BADGE_MODEL3D_COLOR), J(t), Y(t), n("grid.badgeModel3dColor");
		}
	}), e({
		id: `${X}.Badges.DuplicateAlertColor`,
		category: o(k("setting.badgeDuplicateAlertColor", "Duplicate alert badge color")),
		name: k("setting.badgeDuplicateAlertColor", "Majoor: Duplicate alert badge color"),
		tooltip: k("setting.badgeDuplicateAlertColor.tooltip", "Color for duplicate extension badges (PNG+, JPG+, etc)."),
		type: "color",
		defaultValue: s(t.grid?.badgeDuplicateAlertColor, A.BADGE_DUPLICATE_ALERT_COLOR),
		onChange: (e) => {
			t.grid.badgeDuplicateAlertColor = s(e, A.BADGE_DUPLICATE_ALERT_COLOR), J(t), Y(t), n("grid.badgeDuplicateAlertColor");
		}
	}), e({
		id: `${X}.Grid.PageSize`,
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
			t.grid.pageSize = Math.max(50, Math.min(r, Number(e) || A.DEFAULT_PAGE_SIZE)), J(t), Y(t), n("grid.pageSize");
		}
	}), e({
		id: `${X}.InfiniteScroll.Enabled`,
		category: r(k("cat.grid"), k("setting.nav.infinite.name").replace("Majoor: ", "")),
		name: k("setting.nav.infinite.name"),
		tooltip: k("setting.nav.infinite.desc"),
		type: "boolean",
		defaultValue: !!t.infiniteScroll?.enabled,
		onChange: (e) => {
			t.infiniteScroll = t.infiniteScroll || {}, t.infiniteScroll.enabled = !!e, J(t), Y(t), n("infiniteScroll.enabled");
		}
	}), e({
		id: `${X}.Sidebar.Position`,
		category: r(k("cat.grid"), k("setting.sidebar.pos.name").replace("Majoor: ", "")),
		name: k("setting.sidebar.pos.name"),
		tooltip: k("setting.sidebar.pos.desc"),
		type: "combo",
		defaultValue: t.sidebar?.position || "right",
		options: ["left", "right"],
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.position = e === "left" ? "left" : "right", J(t), n("sidebar.position");
		}
	}), e({
		id: `${X}.Sidebar.ShowPreviewThumb`,
		category: r(k("cat.grid"), "Sidebar preview"),
		name: "Show sidebar preview thumb",
		tooltip: "Show/hide the large media preview at the top of the sidebar metadata panel.",
		type: "boolean",
		defaultValue: !!(t.sidebar?.showPreviewThumb ?? !0),
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.showPreviewThumb = !!e, J(t), n("sidebar.showPreviewThumb");
		}
	}), e({
		id: `${X}.Sidebar.WidthPx`,
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
			t.sidebar = t.sidebar || {}, t.sidebar.widthPx = Math.max(240, Math.min(640, Math.round(Number(e) || 360))), J(t), n("sidebar.widthPx");
		}
	}), e({
		id: `${X}.General.HideSiblings`,
		category: r(k("cat.grid"), k("setting.siblings.hide.name").replace("Majoor: ", "")),
		name: k("setting.siblings.hide.name"),
		tooltip: k("setting.siblings.hide.desc"),
		type: "boolean",
		defaultValue: !!t.siblings?.hidePngSiblings,
		onChange: (e) => {
			t.siblings = t.siblings || {}, t.siblings.hidePngSiblings = !!e, J(t), n("siblings.hidePngSiblings");
		}
	}), e({
		id: `${X}.Grid.VideoAutoplayMode`,
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
			t.grid = t.grid || {}, t.grid.videoAutoplayMode = r, delete t.grid.videoHoverAutoplay, J(t), Y(t), n("grid.videoAutoplayMode");
		}
	}), e({
		id: `${X}.Cards.HoverColor`,
		category: i("Hover color"),
		name: "Majoor: Card hover color",
		tooltip: "Background tint used when hovering a card (hex, e.g. #3D3D3D).",
		type: "color",
		defaultValue: s(t.ui?.cardHoverColor, A.UI_CARD_HOVER_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.cardHoverColor = s(e, A.UI_CARD_HOVER_COLOR), J(t), Y(t), n("ui.cardHoverColor");
		}
	}), e({
		id: `${X}.Cards.SelectionColor`,
		category: i("Selection color"),
		name: "Majoor: Card selection color",
		tooltip: "Outline/accent color used for selected cards (hex, e.g. #4A90E2).",
		type: "color",
		defaultValue: s(t.ui?.cardSelectionColor, A.UI_CARD_SELECTION_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.cardSelectionColor = s(e, A.UI_CARD_SELECTION_COLOR), J(t), Y(t), n("ui.cardSelectionColor");
		}
	}), e({
		id: `${X}.Badges.RatingColor`,
		category: a("Rating color"),
		name: "Majoor: Rating badge color",
		tooltip: "Color used for rating badge text/accent (hex, e.g. #FF9500).",
		type: "color",
		defaultValue: s(t.ui?.ratingColor, A.UI_RATING_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.ratingColor = s(e, A.UI_RATING_COLOR), J(t), Y(t), n("ui.ratingColor");
		}
	}), e({
		id: `${X}.Badges.TagColor`,
		category: a("Tag color"),
		name: "Majoor: Tags badge color",
		tooltip: "Color used for tags badge text/accent (hex, e.g. #4A90E2).",
		type: "color",
		defaultValue: s(t.ui?.tagColor, A.UI_TAG_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.tagColor = s(e, A.UI_TAG_COLOR), J(t), Y(t), n("ui.tagColor");
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
	], i = (e) => r(k("cat.viewer", "Viewer"), e), a = (e) => r(k("cat.floatingViewer", "Floating Viewer"), e);
	e({
		id: `${tn}.Viewer.AllowPanAtZoom1`,
		category: i(k("setting.viewer.pan.name").replace("Majoor: ", "")),
		name: k("setting.viewer.pan.name"),
		tooltip: k("setting.viewer.pan.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.allowPanAtZoom1,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.allowPanAtZoom1 = !!e, J(t), Y(t), n("viewer.allowPanAtZoom1");
		}
	}), e({
		id: `${tn}.Viewer.DisableWebGL`,
		category: i("Disable WebGL Video"),
		name: "Disable WebGL Video",
		tooltip: "Use CPU rendering (Canvas 2D) for video playback. Fixes 'black screen' issues on incompatible hardware/browsers.",
		type: "boolean",
		defaultValue: !!t.viewer?.disableWebGL,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.disableWebGL = !!e, J(t), Y(t), n("viewer.disableWebGL");
		}
	}), e({
		id: `${tn}.Viewer.PauseDuringExecution`,
		category: i(k("setting.viewer.pauseExecution.name").replace("Majoor: ", "")),
		name: k("setting.viewer.pauseExecution.name"),
		tooltip: k("setting.viewer.pauseExecution.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.pauseDuringExecution,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.pauseDuringExecution = !!e, J(t), Y(t), n("viewer.pauseDuringExecution");
		}
	}), e({
		id: `${tn}.Viewer.FloatingPauseDuringExecution`,
		category: a(k("setting.viewer.floatingPauseExecution.name").replace("Majoor: ", "")),
		name: k("setting.viewer.floatingPauseExecution.name"),
		tooltip: k("setting.viewer.floatingPauseExecution.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.floatingPauseDuringExecution,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.floatingPauseDuringExecution = !!e, J(t), Y(t), n("viewer.floatingPauseDuringExecution");
		}
	}), e({
		id: `${tn}.Viewer.MfvLiveDefault`,
		category: a(k("setting.viewer.mfvLiveDefault.name").replace("Majoor: ", "")),
		name: k("setting.viewer.mfvLiveDefault.name"),
		tooltip: k("setting.viewer.mfvLiveDefault.desc"),
		type: "boolean",
		defaultValue: !!(t.viewer?.mfvLiveDefault ?? A.MFV_LIVE_DEFAULT),
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.mfvLiveDefault = !!e, J(t), Y(t), n("viewer.mfvLiveDefault");
		}
	}), e({
		id: `${tn}.Viewer.MfvPreviewDefault`,
		category: a(k("setting.viewer.mfvPreviewDefault.name").replace("Majoor: ", "")),
		name: k("setting.viewer.mfvPreviewDefault.name"),
		tooltip: k("setting.viewer.mfvPreviewDefault.desc"),
		type: "boolean",
		defaultValue: !!(t.viewer?.mfvPreviewDefault ?? A.MFV_PREVIEW_DEFAULT),
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.mfvPreviewDefault = !!e, J(t), Y(t), n("viewer.mfvPreviewDefault");
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
			t.viewer = t.viewer || {}, t.viewer.mfvSidebarPosition = r, J(t), Y(t), n("viewer.mfvSidebarPosition");
		}
	}), e({
		id: `${tn}.Viewer.MfvPreviewMethod`,
		category: a(k("setting.viewer.mfvPreviewMethod.name").replace("Majoor: ", "")),
		name: k("setting.viewer.mfvPreviewMethod.name"),
		tooltip: k("setting.viewer.mfvPreviewMethod.desc"),
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
			let r = [
				"taesd",
				"latent2rgb",
				"auto",
				"default",
				"none"
			].includes(e) ? e : A.MFV_PREVIEW_METHOD;
			t.viewer = t.viewer || {}, t.viewer.mfvPreviewMethod = r, J(t), Y(t), n("viewer.mfvPreviewMethod");
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
			t.viewer = t.viewer || {}, t.viewer.ltxavRgbFallback = r, J(t), Y(t), n("viewer.ltxavRgbFallback");
			try {
				let e = await g(r);
				if (!e?.ok) throw Error(e?.error || "Failed to update LTXAV RGB preview fallback setting");
			} catch (e) {
				t.viewer.ltxavRgbFallback = i, J(t), Y(t), n("viewer.ltxavRgbFallback"), y(e?.message || "Failed to update LTXAV RGB preview fallback setting", "error");
			}
		}
	});
	try {
		m().then((e) => {
			if (!e?.ok) return;
			let r = !!e?.data?.prefs?.enabled, i = q();
			i.viewer = i.viewer || {}, !!i.viewer.ltxavRgbFallback !== r && (i.viewer.ltxavRgbFallback = r, Object.assign(t, i), J(i), Y(i), n("viewer.ltxavRgbFallback"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	((r, a, o, s) => {
		e({
			id: `${tn}.WorkflowMinimap.${r}`,
			category: i(k(o).replace("Majoor: ", "")),
			name: k(o),
			tooltip: k(s),
			type: "boolean",
			defaultValue: !!t.workflowMinimap?.[a],
			onChange: (e) => {
				t.workflowMinimap = t.workflowMinimap || {}, t.workflowMinimap[a] = !!e, J(t), n(`workflowMinimap.${a}`);
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
		category: r(k("cat.scanning"), "Execution grouping"),
		name: "Execution job/stack grouping",
		tooltip: "Enable or disable all live job_id / stack_id tracking, grouping, and stack finalization logic.",
		type: "boolean",
		defaultValue: !!(t.executionGrouping?.enabled ?? A.EXECUTION_GROUPING_ENABLED),
		onChange: async (e) => {
			let r = !!(t.executionGrouping?.enabled ?? A.EXECUTION_GROUPING_ENABLED), i = !!e;
			t.executionGrouping = t.executionGrouping || {}, t.executionGrouping.enabled = i, J(t), Y(t), n("executionGrouping.enabled");
			try {
				let e = await re(i);
				if (!e?.ok) throw Error(e?.error || "Failed to update execution grouping setting");
				t.executionGrouping.enabled = !!e?.data?.prefs?.enabled, J(t), Y(t), n("executionGrouping.enabled");
			} catch (e) {
				t.executionGrouping.enabled = r, J(t), Y(t), n("executionGrouping.enabled"), y(e?.message || "Failed to update execution grouping setting", "error");
			}
		}
	}), e({
		id: `${an}.AutoScan.OnStartup`,
		category: r(k("cat.scanning"), k("setting.scan.startup.name").replace("Majoor: ", "")),
		name: k("setting.scan.startup.name"),
		tooltip: k("setting.scan.startup.desc"),
		type: "boolean",
		defaultValue: !!t.autoScan?.onStartup,
		onChange: (e) => {
			t.autoScan = t.autoScan || {}, t.autoScan.onStartup = !!e, J(t), Y(t), n("autoScan.onStartup");
		}
	}), e({
		id: `${an}.Scan.FastMode`,
		category: r(k("cat.scanning"), "Scan mode"),
		name: "Fast scan mode",
		tooltip: "Use fast scan mode for manual backfill scans (skip heavier metadata work during scan).",
		type: "boolean",
		defaultValue: !!(t.scan?.fastMode ?? !0),
		onChange: (e) => {
			t.scan = t.scan || {}, t.scan.fastMode = !!e, J(t), n("scan.fastMode");
		}
	}), e({
		id: `${an}.RtHydrate.Concurrency`,
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
			t.rtHydrate = t.rtHydrate || {}, t.rtHydrate.concurrency = Math.max(1, Math.min(20, Math.round(W(e, A.RT_HYDRATE_CONCURRENCY || 5)))), J(t), Y(t), n("rtHydrate.concurrency");
		}
	});
	let i = (e, t, n, r) => {
		let i = Math.round(W(e, t));
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
		r.length && (J(t), r.forEach((e) => n(e)));
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
		category: r(k("cat.scanning"), k("setting.watcher.enabled.label", "Enable watcher")),
		name: k("setting.watcher.name"),
		tooltip: k("setting.watcher.desc") + " (env: MJR_ENABLE_WATCHER)",
		type: "boolean",
		defaultValue: !!t.watcher?.enabled,
		onChange: async (e) => {
			t.watcher = t.watcher || {}, t.watcher.enabled = !!e, J(t), n("watcher.enabled");
			try {
				let r = await ne(!!e);
				r?.ok || (t.watcher.enabled = !e, J(t), n("watcher.enabled"), y(r?.error || k("toast.failedToggleWatcher", "Failed to toggle watcher"), "error"));
			} catch {
				t.watcher.enabled = !e, J(t), n("watcher.enabled");
			}
		}
	}), e({
		id: `${an}.Watcher.DebounceDelay`,
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
			let r = A.WATCHER_DEBOUNCE_MS, a = i(e, r, 50, 6e4), o = t.watcher?.debounceMs ?? r;
			if (a !== o) {
				t.watcher = t.watcher || {}, t.watcher.debounceMs = a, J(t);
				try {
					let e = await ae({ debounce_ms: a });
					if (!e?.ok) throw Error(e?.error || k("setting.watcher.debounce.error"));
					let r = Math.round(Number(e?.data?.debounce_ms ?? a));
					t.watcher.debounceMs = r, J(t), n("watcher.debounceMs");
				} catch (e) {
					t.watcher.debounceMs = o, J(t), n("watcher.debounceMs"), y(e?.message || k("setting.watcher.debounce.error"), "error");
				}
			}
		}
	}), e({
		id: `${an}.Watcher.DedupeWindow`,
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
			let r = A.WATCHER_DEDUPE_TTL_MS, a = i(e, r, 100, 12e4), o = t.watcher?.dedupeTtlMs ?? r;
			if (a !== o) {
				t.watcher = t.watcher || {}, t.watcher.dedupeTtlMs = a, J(t);
				try {
					let e = await ae({ dedupe_ttl_ms: a });
					if (!e?.ok) throw Error(e?.error || k("setting.watcher.dedupe.error"));
					let r = Math.round(Number(e?.data?.dedupe_ttl_ms ?? a));
					t.watcher.dedupeTtlMs = r, J(t), n("watcher.dedupeTtlMs");
				} catch (e) {
					t.watcher.dedupeTtlMs = o, J(t), n("watcher.dedupeTtlMs"), y(e?.message || k("setting.watcher.dedupe.error"), "error");
				}
			}
		}
	}), e({
		id: `${an}.Watcher.MaxPending`,
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
			t.watcher = t.watcher || {}, t.watcher.maxPending = Math.max(10, Math.min(5e3, Math.round(W(e, 500)))), J(t), Y(t), n("watcher.maxPending");
		}
	}), e({
		id: `${an}.Watcher.MinSize`,
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
			t.watcher = t.watcher || {}, t.watcher.minSize = Math.max(0, Math.min(1e6, Math.round(W(e, 100)))), J(t), Y(t), n("watcher.minSize");
		}
	}), e({
		id: `${an}.Watcher.MaxSize`,
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
			t.watcher = t.watcher || {}, t.watcher.maxSize = Math.max(1e5, Math.min(17179869184, Math.round(W(e, 4294967296)))), J(t), Y(t), n("watcher.maxSize");
		}
	});
	try {
		o().catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	e({
		id: `${an}.RatingTagsSync.Enabled`,
		category: r(k("cat.scanning"), k("setting.sync.rating.name").replace("Majoor: ", "")),
		name: k("setting.sync.rating.name"),
		tooltip: k("setting.sync.rating.desc"),
		type: "boolean",
		defaultValue: !!t.ratingTagsSync?.enabled,
		onChange: (e) => {
			t.ratingTagsSync = t.ratingTagsSync || {}, t.ratingTagsSync.enabled = !!e, J(t), n("ratingTagsSync.enabled");
		}
	});
}
//#endregion
//#region ui/app/settings/settingsFeed.ts
var cn = "Majoor", ln = "Majoor Assets Manager";
function un(e, t, n) {
	let r = (e) => [
		ln,
		k("cat.feed", "Generated Feed"),
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
			i(), t.feed.minSize = Math.max(60, Math.min(600, Math.round(Number(e) || 120))), J(t), Y(t), n("feed.minSize");
		}
	}), e({
		id: `${cn}.Feed.ShowInfo`,
		category: r("Show info section"),
		name: "Show card info section",
		tooltip: "Show or hide the entire info section (filename, metadata, dots) below thumbnails in the Generated Feed.",
		type: "boolean",
		defaultValue: !!(t.feed?.showInfo ?? A.FEED_SHOW_INFO),
		onChange: (e) => {
			i(), t.feed.showInfo = !!e, J(t), Y(t), n("feed.showInfo");
		}
	}), e({
		id: `${cn}.Feed.ShowFilename`,
		category: r("Show filename"),
		name: "Show filename",
		tooltip: "Display the filename on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showFilename ?? A.FEED_SHOW_FILENAME),
		onChange: (e) => {
			i(), t.feed.showFilename = !!e, J(t), Y(t), n("feed.showFilename");
		}
	}), e({
		id: `${cn}.Feed.ShowDimensions`,
		category: r("Show dimensions"),
		name: "Show dimensions",
		tooltip: "Display resolution (WxH) and duration on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDimensions ?? A.FEED_SHOW_DIMENSIONS),
		onChange: (e) => {
			i(), t.feed.showDimensions = !!e, J(t), Y(t), n("feed.showDimensions");
		}
	}), e({
		id: `${cn}.Feed.ShowDate`,
		category: r("Show date/time"),
		name: "Show date/time",
		tooltip: "Display date and time on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDate ?? A.FEED_SHOW_DATE),
		onChange: (e) => {
			i(), t.feed.showDate = !!e, J(t), Y(t), n("feed.showDate");
		}
	}), e({
		id: `${cn}.Feed.ShowGenTime`,
		category: r("Show generation time"),
		name: "Show generation time",
		tooltip: "Display the generation time badge on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showGenTime ?? A.FEED_SHOW_GENTIME),
		onChange: (e) => {
			i(), t.feed.showGenTime = !!e, J(t), Y(t), n("feed.showGenTime");
		}
	}), e({
		id: `${cn}.Feed.ShowWorkflowDot`,
		category: r("Show workflow dot"),
		name: "Show workflow indicator",
		tooltip: "Display the workflow availability dot on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showWorkflowDot ?? A.FEED_SHOW_WORKFLOW_DOT),
		onChange: (e) => {
			i(), t.feed.showWorkflowDot = !!e, J(t), Y(t), n("feed.showWorkflowDot");
		}
	}), e({
		id: `${cn}.Feed.ShowExtBadge`,
		category: r("Show format badges"),
		name: "Show format badges",
		tooltip: "Display format badges (e.g. JPG, MP4) on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showExtBadge ?? A.FEED_SHOW_BADGES_EXTENSION),
		onChange: (e) => {
			i(), t.feed.showExtBadge = !!e, J(t), Y(t), n("feed.showExtBadge");
		}
	}), e({
		id: `${cn}.Feed.ShowRatingBadge`,
		category: r("Show rating badges"),
		name: "Show ratings",
		tooltip: "Display star ratings on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showRatingBadge ?? A.FEED_SHOW_BADGES_RATING),
		onChange: (e) => {
			i(), t.feed.showRatingBadge = !!e, J(t), Y(t), n("feed.showRatingBadge");
		}
	}), e({
		id: `${cn}.Feed.ShowTagsBadge`,
		category: r("Show tags badges"),
		name: "Show tags",
		tooltip: "Display tag indicators on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showTagsBadge ?? A.FEED_SHOW_BADGES_TAGS),
		onChange: (e) => {
			i(), t.feed.showTagsBadge = !!e, J(t), Y(t), n("feed.showTagsBadge");
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
	return String(e?.apiToken || "").trim().length >= pn && U(e?.allowWrite, !0) && U(e?.requireAuth, !1) && !U(e?.allowRemoteWrite, !1);
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
		safe_mode: U(t.safeMode, !1),
		allow_write: U(t.allowWrite, !0),
		require_auth: U(t.requireAuth, !1),
		allow_remote_write: U(t.allowRemoteWrite, !1),
		allow_insecure_token_transport: U(t.allowInsecureTokenTransport, !1),
		allow_delete: U(t.allowDelete, !0),
		allow_rename: U(t.allowRename, !0),
		allow_open_in_folder: U(t.allowOpenInFolder, !0),
		allow_reset_index: U(t.allowResetIndex, !0),
		...String(t.apiToken || "").trim() ? { api_token: String(t.apiToken || "").trim() } : {}
	};
}
function Dn(e) {
	return se(En(e));
}
function On(e) {
	let t = String(e?.security?.tokenHint || "").trim();
	return t ? k("setting.sec.token.placeholderConfigured", "Token configured on server ({tokenHint}). Leave blank to keep the current server token.", { tokenHint: t }) : e?.security?.tokenConfigured ? k("setting.sec.token.placeholderConfiguredGeneric", "Token configured on server. Leave blank to keep the current server token.") : k("setting.sec.token.placeholder", "Auto-generated for this browser session.");
}
function kn(e, t, n) {
	let r = (e, t) => [
		fn,
		e,
		t
	];
	e({
		id: `${dn}.Safety.ConfirmDeletion`,
		category: r(k("cat.security"), "Confirm before deleting"),
		name: "Confirm before deleting",
		tooltip: "Show a confirmation dialog before deleting files. Disabling this allows instant deletion.",
		type: "boolean",
		defaultValue: t.safety?.confirmDeletion !== !1,
		onChange: (e) => {
			gn(t.safety?.confirmDeletion !== !1, e) || (t.safety = t.safety || {}, t.safety.confirmDeletion = !!e, J(t), Y(t), n("safety.confirmDeletion"));
		}
	});
	let i = (i, a, o, s = "cat.security") => {
		e({
			id: `${dn}.Security.${i}`,
			category: r(k(s), k(a).replace("Majoor: ", "")),
			name: k(a),
			tooltip: k(o),
			type: "boolean",
			defaultValue: U(t.security?.[i], mn[i] ?? !1),
			onChange: (e) => {
				if (!gn(t.security?.[i], e)) {
					t.security = t.security || {}, t.security[i] = !!e, J(t), n(`security.${i}`);
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
		category: r(k("cat.remote"), k("setting.sec.remoteLanPreset.name").replace("Majoor: ", "")),
		name: k("setting.sec.remoteLanPreset.name"),
		tooltip: k("setting.sec.remoteLanPreset.desc"),
		type: "boolean",
		defaultValue: wn(t.security),
		onChange: (e) => {
			if (t.security = t.security || {}, gn(t.security.remoteLanPreset, e)) return;
			if (t.security.remoteLanPreset = !!e, !e) {
				J(t), n("security.remoteLanPreset");
				return;
			}
			let r;
			try {
				r = Tn(t.security);
			} catch (e) {
				y(e?.message || k("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				return;
			}
			Object.assign(t.security, r), t.security.tokenConfigured = !0, t.security.tokenHint = String(r.apiToken || "").trim() ? `...${String(r.apiToken).trim().slice(-4)}` : "", r.apiToken && w(r.apiToken), J(t), n("security.remoteLanPreset"), n("security.apiToken"), n("security.allowWrite"), n("security.requireAuth"), n("security.allowRemoteWrite"), n("security.allowInsecureTokenTransport");
			try {
				Dn(t.security).then((e) => {
					e?.ok && e.data?.prefs ? (It(), y(k("toast.remoteLanPresetApplied", "Recommended remote LAN setup applied. This browser session is now authorized for Majoor write operations."), "success")) : e && e.ok === !1 && (y(e.error || k("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error"), console.warn("[Majoor] backend remote LAN preset update failed", e.error || e));
				}).catch((e) => {
					y(e?.message || k("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), e({
		id: `${dn}.Security.ApiToken`,
		category: r(k("cat.remote"), k("setting.sec.token.name").replace("Majoor: ", "")),
		name: k("setting.sec.token.name", "Majoor: API Token"),
		tooltip: k("setting.sec.token.desc", "Store the API token used for write operations. Majoor sends it via X-MJR-Token and Authorization headers."),
		type: "text",
		defaultValue: t.security?.apiToken || "",
		attrs: { placeholder: On(t) },
		onChange: (e) => {
			t.security = t.security || {};
			let r = _n(e);
			if (_n(t.security.apiToken) !== r && (t.security.apiToken = r, t.security.apiToken && (t.security.tokenConfigured = !0, t.security.tokenHint = `...${t.security.apiToken.slice(-4)}`, w(t.security.apiToken)), J(t), n("security.apiToken"), t.security.apiToken)) try {
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
var Z = "Majoor", An = "Majoor Assets Manager";
function jn(t, a, o, l) {
	let d = (e, t) => [
		An,
		e,
		t
	], p = String(a.paths?.outputDirectory || ""), m = null, h = 0, g = null;
	t({
		id: `${Z}.Paths.OutputDirectory`,
		category: d(k("cat.advanced"), "Paths / Output"),
		name: "Majoor: Generation Output Directory",
		tooltip: "Override the ComfyUI generation output directory used by Majoor (equivalent to --output-directory). Leave empty to keep the current backend default.",
		type: "text",
		defaultValue: String(a.paths?.outputDirectory || ""),
		attrs: { placeholder: "D:\\\\____COMFY_OUTPUTS" },
		onChange: async (e) => {
			let t = String(e || "").trim();
			a.paths = a.paths || {}, a.paths.outputDirectory = t, J(a);
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
					if (!n?.ok) throw Error(n?.error || k("toast.failedSetOutputDirectory", "Failed to set output directory"));
					let r = String(n?.data?.output_directory || t).trim();
					a.paths.outputDirectory = r, p = r, J(a), o("paths.outputDirectory");
				} catch (t) {
					if (e !== h || String(t?.name || "") === "AbortError" || String(t?.code || "") === "ABORTED") return;
					a.paths.outputDirectory = p, J(a), o("paths.outputDirectory"), y(t?.message || k("toast.failedSetOutputDirectory", "Failed to set output directory"), "error");
				}
			}, 700);
		}
	});
	try {
		r().then((e) => {
			if (!e?.ok) return;
			let t = String(e?.data?.output_directory || "").trim();
			a.paths = a.paths || {}, a.paths.outputDirectory !== t && (a.paths.outputDirectory = t, p = t, J(a), o("paths.outputDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let x = String(a.paths?.indexDirectory || ""), C = null, w = 0, E = null;
	t({
		id: `${Z}.Paths.IndexDirectory`,
		category: d(k("cat.advanced"), "Paths / Index"),
		name: "Majoor: Index Database Directory",
		tooltip: "Override the Majoor index database directory. Use this to keep the SQLite index on a different local disk. Requires restart.",
		type: "text",
		defaultValue: String(a.paths?.indexDirectory || ""),
		attrs: { placeholder: "D:\\MajoorIndex" },
		onChange: async (e) => {
			let t = String(e || "").trim();
			a.paths = a.paths || {}, a.paths.indexDirectory = t, J(a);
			try {
				C &&= (clearTimeout(C), null);
			} catch (e) {
				console.debug?.(e);
			}
			C = setTimeout(async () => {
				C = null;
				let e = ++w;
				try {
					E?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				E = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let n = await _(t, E ? { signal: E.signal } : {});
					if (e !== w) return;
					if (!n?.ok) throw Error(n?.error || k("toast.failedSetIndexDirectory", "Failed to set index directory"));
					let r = String(n?.data?.index_directory || t).trim(), i = r !== x;
					a.paths.indexDirectory = r, x = r, J(a), o("paths.indexDirectory"), i && y(k("toast.indexDirectorySavedRestart", "Index directory saved. Restart ComfyUI to apply."), "success", void 0, { history: { trackId: "settings:index-directory-saved" } });
				} catch (t) {
					if (e !== w || String(t?.name || "") === "AbortError" || String(t?.code || "") === "ABORTED") return;
					a.paths.indexDirectory = x, J(a), o("paths.indexDirectory"), y(t?.message || k("toast.failedSetIndexDirectory", "Failed to set index directory"), "error");
				}
			}, 700);
		}
	});
	try {
		O().then((e) => {
			if (!e?.ok) return;
			let t = String(e?.data?.index_directory || "").trim();
			a.paths = a.paths || {}, a.paths.indexDirectory !== t && (a.paths.indexDirectory = t, x = t, J(a), o("paths.indexDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let ne = he().map((e) => e.code), re = ["auto", ...ne];
	t({
		id: `${Z}.Language`,
		category: d(k("cat.advanced"), k("setting.language.name", "Language")),
		name: k("setting.language.name", "Majoor: Language"),
		tooltip: "Use auto to detect and follow ComfyUI language. Or choose a fixed language for Majoor only.",
		type: "combo",
		defaultValue: a.i18n?.followComfyLanguage ? "auto" : ye(),
		options: re,
		onChange: (e) => {
			if (a.i18n = a.i18n || {}, e === "auto") {
				a.i18n.followComfyLanguage = !0, ve(!0), pe(l), J(a), o("language");
				return;
			}
			ne.includes(e) && (a.i18n.followComfyLanguage = !1, ve(!1), be(e), J(a), o("language"));
		}
	}), t({
		id: `${Z}.ProbeBackend.Mode`,
		category: d(k("cat.advanced"), k("setting.probe.mode.name").replace("Majoor: ", "")),
		name: k("setting.probe.mode.name"),
		tooltip: k("setting.probe.mode.desc") + " (env: MAJOOR_MEDIA_PROBE_BACKEND)",
		type: "combo",
		defaultValue: a.probeBackend?.mode || K.probeBackend.mode,
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
			], K.probeBackend.mode);
			a.probeBackend = a.probeBackend || {}, a.probeBackend.mode = n, J(a), Y(a), o("probeBackend.mode"), e(n).catch(() => {});
		}
	}), t({
		id: `${Z}.MetadataFallback.Image`,
		category: d(k("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Images)",
		tooltip: "Enable Pillow fallback when ExifTool is missing or fails.",
		type: "boolean",
		defaultValue: a.metadataFallback?.image ?? K.metadataFallback.image,
		onChange: async (e) => {
			let t = !!e, n = !!(a.metadataFallback?.image ?? K.metadataFallback.image);
			a.metadataFallback = a.metadataFallback || {}, a.metadataFallback.image = t, J(a), o("metadataFallback.image");
			try {
				let e = await v({
					image: t,
					media: a.metadataFallback?.media ?? K.metadataFallback.media
				});
				if (!e?.ok) throw Error(e?.error || k("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				a.metadataFallback.image = n, J(a), o("metadataFallback.image"), y(e?.message || k("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	}), t({
		id: `${Z}.MetadataFallback.Media`,
		category: d(k("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Audio/Video)",
		tooltip: "Enable hachoir fallback when ffprobe is missing or fails.",
		type: "boolean",
		defaultValue: a.metadataFallback?.media ?? K.metadataFallback.media,
		onChange: async (e) => {
			let t = !!e, n = !!(a.metadataFallback?.media ?? K.metadataFallback.media);
			a.metadataFallback = a.metadataFallback || {}, a.metadataFallback.media = t, J(a), o("metadataFallback.media");
			try {
				let e = await v({
					image: a.metadataFallback?.image ?? K.metadataFallback.image,
					media: t
				});
				if (!e?.ok) throw Error(e?.error || k("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				a.metadataFallback.media = n, J(a), o("metadataFallback.media"), y(e?.message || k("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	});
	try {
		i().then((e) => {
			if (!e?.ok || !e?.data?.prefs) return;
			let t = e.data.prefs || {}, n = !!(t.image ?? K.metadataFallback.image), r = !!(t.media ?? K.metadataFallback.media);
			a.metadataFallback = a.metadataFallback || {};
			let i = !1;
			a.metadataFallback.image !== n && (a.metadataFallback.image = n, i = !0), a.metadataFallback.media !== r && (a.metadataFallback.media = r, i = !0), i && (J(a), o("metadataFallback"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	t({
		id: `${Z}.Db.Timeout`,
		category: d(k("cat.advanced"), "Database"),
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
			a.db = a.db || {}, a.db.timeoutMs = Math.max(1e3, Math.min(3e4, Math.round(W(e, 5e3)))), J(a), Y(a), o("db.timeoutMs");
		}
	}), t({
		id: `${Z}.Db.MaxConnections`,
		category: d(k("cat.advanced"), "Database"),
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
			a.db = a.db || {}, a.db.maxConnections = Math.max(1, Math.min(100, Math.round(W(e, 10)))), J(a), Y(a), o("db.maxConnections");
		}
	}), t({
		id: `${Z}.Db.QueryTimeout`,
		category: d(k("cat.advanced"), "Database"),
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
			a.db = a.db || {}, a.db.queryTimeoutMs = Math.max(500, Math.min(1e4, Math.round(W(e, 1e3)))), J(a), Y(a), o("db.queryTimeoutMs");
		}
	}), t({
		id: `${Z}.Observability.Enabled`,
		category: d(k("cat.advanced"), k("setting.obs.enabled.name").replace("Majoor: ", "")),
		name: k("setting.obs.enabled.name"),
		tooltip: k("setting.obs.enabled.desc"),
		type: "boolean",
		defaultValue: !!a.observability?.enabled,
		onChange: (e) => {
			a.observability = a.observability || {}, a.observability.enabled = !!e, J(a), Y(a), o("observability.enabled");
		}
	}), t({
		id: `${Z}.Observability.RuntimeDashboardMode`,
		category: d(k("cat.advanced"), "Runtime metrics badge"),
		name: "Majoor: Runtime metrics badge",
		tooltip: "Controls the small DB/enrichment/watcher metrics badge in the Assets Manager panel.",
		type: "combo",
		defaultValue: a.observability?.runtimeDashboardMode || K.observability.runtimeDashboardMode,
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
			], K.observability.runtimeDashboardMode);
			a.observability = a.observability || {}, a.observability.runtimeDashboardMode = t, J(a), o("observability.runtimeDashboardMode");
		}
	}), t({
		id: `${Z}.Observability.VerboseErrors`,
		category: d(k("cat.advanced"), "Verbose error logging"),
		name: "Verbose error logging",
		tooltip: "Show detailed error messages in toasts and console. Useful for debugging.",
		type: "boolean",
		defaultValue: !!a.observability?.verboseErrors,
		onChange: (e) => {
			a.observability = a.observability || {}, a.observability.verboseErrors = !!e, J(a), Y(a), o("observability.verboseErrors");
		}
	}), t({
		id: `${Z}.Observability.VerboseRouteRegistrationLogs`,
		category: d(k("cat.advanced"), "Logs"),
		name: "Majoor: Verbose route registration logs",
		tooltip: "When disabled, Majoor prints a compact startup summary instead of listing every registered API route. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(a.observability?.verboseRouteRegistrationLogs ?? K.observability?.verboseRouteRegistrationLogs ?? !1),
		onChange: async (e) => {
			let t = !!e, n = !!(a.observability?.verboseRouteRegistrationLogs ?? K.observability?.verboseRouteRegistrationLogs ?? !1);
			a.observability = a.observability || {}, a.observability.verboseRouteRegistrationLogs = t, J(a), o("observability.verboseRouteRegistrationLogs");
			try {
				let e = await S(t);
				if (!e?.ok) throw Error(e?.error || "Failed to update route logging settings");
			} catch (e) {
				a.observability.verboseRouteRegistrationLogs = n, J(a), o("observability.verboseRouteRegistrationLogs"), y(e?.message || "Failed to update route logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let e = !!(await u())?.data?.prefs?.enabled;
			a.observability = a.observability || {}, a.observability.verboseRouteRegistrationLogs !== e && (a.observability.verboseRouteRegistrationLogs = e, J(a), o("observability.verboseRouteRegistrationLogs"));
		} catch (e) {
			console.debug?.(e);
		}
	})(), t({
		id: `${Z}.Observability.VerboseStartupLogs`,
		category: d(k("cat.advanced"), "Logs"),
		name: "Majoor: Verbose startup logs",
		tooltip: "When disabled, Majoor suppresses most informational bootstrap logs during backend startup while keeping warnings and errors. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(a.observability?.verboseStartupLogs ?? K.observability?.verboseStartupLogs ?? !1),
		onChange: async (e) => {
			let t = !!e, n = !!(a.observability?.verboseStartupLogs ?? K.observability?.verboseStartupLogs ?? !1);
			a.observability = a.observability || {}, a.observability.verboseStartupLogs = t, J(a), o("observability.verboseStartupLogs");
			try {
				let e = await te(t);
				if (!e?.ok) throw Error(e?.error || "Failed to update startup logging settings");
			} catch (e) {
				a.observability.verboseStartupLogs = n, J(a), o("observability.verboseStartupLogs"), y(e?.message || "Failed to update startup logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let e = !!(await T())?.data?.prefs?.enabled;
			a.observability = a.observability || {}, a.observability.verboseStartupLogs !== e && (a.observability.verboseStartupLogs = e, J(a), o("observability.verboseStartupLogs"));
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
			id: `${Z}.AI.HuggingFaceTokenVisible`,
			category: d(k("cat.advanced"), e),
			name: "Show HuggingFace token",
			tooltip: "Show or hide the HuggingFace token while editing.",
			type: "boolean",
			defaultValue: u,
			onChange: (e) => {
				let t = !!e;
				u = t, a.ai = a.ai || {}, a.ai.huggingFaceTokenVisible = t, J(a), o("ai.huggingFaceTokenVisible"), setTimeout(f, 0);
			}
		}), t({
			id: `${Z}.AI.HuggingFaceToken`,
			category: d(k("cat.advanced"), e),
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
			id: `${Z}.AI.VerboseLogs`,
			category: d(k("cat.advanced"), e),
			name: "Majoor: Verbose AI logs",
			tooltip: "Enable detailed HuggingFace/SigLIP2/X-CLIP logs and progress bars during model download/loading.",
			type: "boolean",
			defaultValue: !!(a.ai?.verboseAiLogs ?? K.ai?.verboseAiLogs ?? !1),
			onChange: async (e) => {
				let t = !!e, n = !!(a.ai?.verboseAiLogs ?? K.ai?.verboseAiLogs ?? !1);
				a.ai = a.ai || {}, a.ai.verboseAiLogs = t, J(a), o("ai.verboseAiLogs");
				try {
					let e = await c(t);
					if (!e?.ok) throw Error(e?.error || "Failed to update AI logging settings");
				} catch (e) {
					a.ai.verboseAiLogs = n, J(a), o("ai.verboseAiLogs"), y(e?.message || "Failed to update AI logging settings", "error");
				}
			}
		}), (async () => {
			try {
				let e = !!(await le())?.data?.prefs?.enabled;
				a.ai = a.ai || {}, a.ai.verboseAiLogs !== e && (a.ai.verboseAiLogs = e, J(a), o("ai.verboseAiLogs"));
			} catch (e) {
				console.debug?.(e);
			}
		})();
	}
	t({
		id: `${Z}.AI.VectorStats`,
		category: d(k("cat.advanced"), "AI / Vector Search"),
		name: "Vector Index Status",
		tooltip: "Current status of the SigLIP2/X-CLIP vector index used for semantic search",
		type: "text",
		defaultValue: "Loading vector status..."
	}), (async () => {
		try {
			let e = await ee();
			e?.ok ? console.debug?.("[Majoor] Vector status:", `${e.data?.total || 0} assets indexed | Model: ${e.data?.model || "N/A"}`) : console.debug?.("[Majoor] Vector status unavailable");
		} catch (e) {
			console.debug?.("[Majoor] Vector status fetch failed", e);
		}
	})(), t({
		id: `${Z}.AI.VectorBackfillAction`,
		category: d(k("cat.advanced"), "AI / Vector Search"),
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
				y(k("toast.vectorBackfillStarting", "Starting vector backfill... This may take a while."), "info", void 0, { history: {
					...t.history,
					status: "started",
					detail: "Starting vector backfill... This may take a while."
				} });
				let e = await b(64, { onProgress: (e) => {
					let n = String(e?.status || "running").toLowerCase() || "running", r = e?.progress || e?.result || {}, i = Number(r?.candidates ?? r?.processed ?? 0), a = Number(r?.indexed ?? 0), o = Number(r?.skipped ?? 0), s = Number(r?.errors ?? 0), c = Math.max(i, a + o + s), l = c > 0 ? Math.round((a + o + s) / c * 100) : null, u = n === "queued" ? "Vector backfill queued" : `Candidates ${i}, indexed ${a}, skipped ${o}, errors ${s}`;
					D({
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
						y(k("toast.vectorBackfillRunning", "Vector backfill still running in background{job}.", { job: e ? ` (job ${e.slice(0, 8)})` : "" }), "info", void 0, { history: {
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
					} else y(k("toast.vectorBackfillComplete", "Vector backfill complete! Processed: {processed}, Indexed: {indexed}, Skipped: {skipped}", {
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
						let e = await ee();
						e?.ok && console.debug?.("[Majoor] Vector stats after backfill:", e.data);
					} catch (e) {
						console.debug?.("[Majoor] Failed to refresh vector stats:", e);
					}
				} else throw Error(e?.error || k("toast.vectorBackfillFailedGeneric", "Backfill failed"));
			} catch (e) {
				let n = e?.message || String(e || k("status.unknown", "unknown"));
				y(k("toast.vectorBackfillFailedDetail", "Vector backfill failed: {error}", { error: n }), "error", void 0, { history: {
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
		category: r(k("cat.search", "Search"), "AI"),
		name: k("setting.ai.vector.enabled.name", "Enable AI semantic search"),
		tooltip: k("setting.ai.vector.enabled.desc", "Enable/disable AI vector search features (SigLIP2/X-CLIP: description search, prompt alignment, AI tag suggestions, smart collections)."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorSearchEnabled ?? !0),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let r = !!(t.ai.vectorSearchEnabled ?? !0), i = !!e;
			t.ai.vectorSearchEnabled = i, J(t), Y(t), n("ai.vectorSearchEnabled");
			try {
				let e = await ie(i);
				if (!e?.ok) {
					t.ai.vectorSearchEnabled = r, J(t), Y(t), n("ai.vectorSearchEnabled"), y(e?.error || "Failed to update AI vector search setting", "error");
					return;
				}
				y(i ? "AI semantic search enabled" : "AI semantic search disabled", "info", 2200);
			} catch (e) {
				t.ai.vectorSearchEnabled = r, J(t), Y(t), n("ai.vectorSearchEnabled"), y(e?.message || "Failed to update AI vector search setting", "error");
			}
		}
	}), e({
		id: `${Mn}.AI.VectorCaptionOnIndex`,
		category: r(k("cat.search", "Search"), "AI"),
		name: k("setting.ai.vector.captionOnIndex.name", "Generate AI captions during indexing"),
		tooltip: k("setting.ai.vector.captionOnIndex.desc", "Allow automatic vector indexing and backfill to run Florence-2 captions for image assets. This is slower and can use significant VRAM/CPU; leave it off for faster grid startup."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorCaptionOnIndex ?? !1),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let r = !!(t.ai.vectorCaptionOnIndex ?? !1), i = !!e;
			t.ai.vectorCaptionOnIndex = i, J(t), Y(t), n("ai.vectorCaptionOnIndex");
			try {
				let e = await ie({ caption_on_index: i });
				if (!e?.ok) {
					t.ai.vectorCaptionOnIndex = r, J(t), Y(t), n("ai.vectorCaptionOnIndex"), y(e?.error || "Failed to update AI caption indexing setting", "error");
					return;
				}
				i && y("AI captions during indexing enabled", "info", 2600);
			} catch (e) {
				t.ai.vectorCaptionOnIndex = r, J(t), Y(t), n("ai.vectorCaptionOnIndex"), y(e?.message || "Failed to update AI caption indexing setting", "error");
			}
		}
	}), e({
		id: `${Mn}.Search.MaxResults`,
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
			t.search = t.search || {}, t.search.maxResults = Math.max(10, Math.min(A.MAX_PAGE_SIZE || 2e3, Number(e) || A.SEARCH_DEFAULT_LIMIT)), J(t), Y(t), n("search.maxResults");
		}
	}), e({
		id: `${Mn}.EnvVars.Reference`,
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
var Fn = "Majoor Assets Manager", In = /^\s*Majoor:\s*/i, Ln = Object.freeze({
	ASSETS_PANEL: "Assets Panel",
	GENERATED_FEED: "Generated Feed",
	VIEWER: "Viewer & Floating Viewer",
	INDEXING: "Indexing & Watcher",
	SEARCH_AI: "Search & AI",
	GENERAL: "General",
	ADVANCED: "Advanced",
	SECURITY: "Security"
}), Rn = new Set([
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
function zn(e) {
	let t = String(e || "").trim();
	return t ? /^Majoor\.(Safety|Security)\./.test(t) ? Ln.SECURITY : /^Majoor\.(Paths|ProbeBackend|MetadataFallback|Db|Observability)\./.test(t) || t === "Majoor.EnvVars.Reference" || t === "Majoor.AI.HuggingFaceTokenVisible" || t === "Majoor.AI.HuggingFaceToken" || t === "Majoor.AI.VerboseLogs" || t === "Majoor.AI.VectorStats" || t === "Majoor.AI.VectorBackfillAction" ? Ln.ADVANCED : /^Majoor\.(Viewer|WorkflowMinimap)\./.test(t) ? Ln.VIEWER : /^Majoor\.Feed\./.test(t) ? Ln.GENERATED_FEED : /^Majoor\.(AutoScan|Scan|Watcher|ExecutionGrouping|RatingTagsSync)\./.test(t) ? Ln.INDEXING : t === "Majoor.RtHydrate.Concurrency" ? Ln.ADVANCED : t === "Majoor.AI.VectorSearchEnabled" || t === "Majoor.AI.VectorCaptionOnIndex" || /^Majoor\.Search\./.test(t) ? Ln.SEARCH_AI : /^Majoor\.(Grid|Cards|Badges|Sidebar|InfiniteScroll|General)\./.test(t) ? Ln.ASSETS_PANEL : Ln.GENERAL : Ln.GENERAL;
}
function Bn(e) {
	let t = Array.isArray(e?.category) ? e.category.filter(Boolean) : [], n = zn(e?.id), r = String(t[1] || t[0] || "").trim(), i = String(t[2] || "").trim(), a = String(e?.name || "").replace(In, "").trim();
	return [
		Fn,
		n,
		i || r || a || n
	];
}
var Vn = !1, Hn = null, Un = null, Wn = !1, Gn = /* @__PURE__ */ new Set();
function Kn(e) {
	if (!e || typeof e != "object") return null;
	let t = { ...e };
	try {
		typeof t.name == "string" && (t.name = t.name.replace(In, "").trim());
	} catch (e) {
		console.debug?.(e);
	}
	try {
		t.category = Bn(t);
	} catch {
		t.category = [Fn, Ln.GENERAL];
	}
	return !t.tooltip && typeof t.name == "string" && t.name.trim() && (t.tooltip = t.name.trim()), t;
}
function qn(e, t, n) {
	let r = String(t?.id || "").trim();
	if (!r || Gn.has(r)) return !1;
	Gn.add(r);
	try {
		return de(e, r, n);
	} finally {
		Gn.delete(r);
	}
}
function Jn(e, t) {
	if (!t || typeof t != "object") return t;
	let n = { ...t };
	qn(e, n, n.defaultValue);
	let r = n.onChange;
	return n.onChange = (t, ...i) => {
		if (qn(e, n, t), typeof r == "function") return r(t, ...i);
		n.defaultValue = t;
	}, n;
}
function Yn(e, t, { initRuntime: n = !1 } = {}) {
	if (Un) typeof t == "function" && Un.onAppliedListeners.add(t), e && !Un.app && (Un.app = e);
	else {
		let n = q();
		n.i18n = n.i18n || {}, typeof n.i18n.followComfyLanguage == "boolean" ? ve(!!n.i18n.followComfyLanguage) : (n.i18n.followComfyLanguage = !0, ve(!0), J(n));
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
			let e = q();
			Object.assign(n, e), Y(n), u("storage");
		}, p = (e) => {
			!e || e.key !== "mjrSettings" || e.newValue !== e.oldValue && f();
		};
		if (!Vn) {
			if (Hn && typeof window < "u") try {
				window.removeEventListener("storage", Hn);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				window.addEventListener("storage", p), Vn = !0, Hn = p;
			} catch (e) {
				console.debug?.(e);
			}
		}
		Un = {
			app: e,
			notifyApplied: (e) => {
				for (let t of r) try {
					t(n, e);
				} catch (e) {
					console.debug?.(e);
				}
				Rn.has(String(e || "")) ? d(e) : u(e);
			},
			onAppliedListeners: r,
			refreshFromStorage: f,
			settings: n
		};
	}
	if (n && !Wn) {
		let t = e || Un.app, n = Un.settings;
		pe(t), Y(n), me(t), It(), Lt(), Rt(), n?.watcher && typeof n.watcher.enabled == "boolean" && ne(!!n.watcher.enabled).catch(() => {}), Xt(), Wn = !0;
	}
	return Un;
}
var Xn = (e, t) => Yn(e, t, { initRuntime: !0 }).settings, Zn = (e, t) => {
	let n = Yn(e, t, { initRuntime: !1 });
	Object.assign(n.settings, q());
	let r = (t) => {
		let r = Kn(t);
		r && i.push(Jn(e || n.app, r));
	}, i = [];
	return en(r, n.settings, n.notifyApplied), un(r, n.settings, n.notifyApplied), rn(r, n.settings, n.notifyApplied), sn(r, n.settings, n.notifyApplied), kn(r, n.settings, n.notifyApplied), jn(r, n.settings, n.notifyApplied, e), Pn(r, n.settings, n.notifyApplied), i;
};
try {
	let e = q();
	e?.watcher && typeof e.watcher.enabled == "boolean" && o().then((e) => {
		let t = !!e?.ok && !!e?.data?.enabled, n = q();
		n.watcher = n.watcher || {}, typeof t == "boolean" && t !== !!n.watcher.enabled && (n.watcher.enabled = t, J(n), ct("mjr-settings-changed", { key: "watcher.enabled" }, { warnPrefix: "[Majoor]" }));
	}).catch(() => {});
} catch (e) {
	console.debug?.(e);
}
//#endregion
//#region ui/features/status/AssetStatusDotTheme.ts
function Qn(e) {
	return String(e || "").trim().toLowerCase();
}
function $n({ dot: e = null, asset: t = null, scope: n = "" } = {}) {
	let r = Qn(n);
	if (r) return r === "custom";
	let i = Qn(t?.type || t?.scope);
	if (i) return i === "custom";
	try {
		let t = Qn(e?.closest?.(".mjr-grid")?.dataset?.mjrScope);
		if (t) return t === "custom";
	} catch (e) {
		console.debug?.(e);
	}
	return !1;
}
function er(e, t = {}) {
	let n = Qn(e);
	return $n(t) ? n === "pending" || n === "info" ? "var(--mjr-browser-status-info, #4DB6AC)" : n === "success" ? "var(--mjr-browser-status-success, #2E7D32)" : n === "warning" ? "var(--mjr-browser-status-warning, #FFB74D)" : n === "error" ? "var(--mjr-browser-status-error, #EF5350)" : "var(--mjr-browser-status-neutral, #90A4AE)" : n === "pending" || n === "info" ? "var(--mjr-status-info, #64B5F6)" : n === "success" ? "var(--mjr-status-success, #4CAF50)" : n === "warning" ? "var(--mjr-status-warning, #FFA726)" : n === "error" ? "var(--mjr-status-error, #f44336)" : "var(--mjr-status-neutral, #666)";
}
//#endregion
//#region ui/stores/useRuntimeStore.ts
var tr = $e("mjr-runtime", () => {
	let e = I(null), t = I(null), n = I(!1), r = I(0), i = I(null), a = I(null), o = I(null), s = I(null), c = I(null), l = I([]), u = V(() => !!i.value), d = V(() => {
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
function nr() {
	try {
		return et() ? tr() : null;
	} catch {
		return null;
	}
}
//#endregion
//#region ui/stores/runtimeEnrichmentState.ts
var rr = Symbol.for("majoor.assets_manager.runtime_state");
function ir() {
	return {
		api: null,
		assetsDeletedHandler: null,
		enrichmentActive: !1,
		enrichmentQueueLength: 0
	};
}
function ar() {
	try {
		let e = typeof globalThis < "u" ? globalThis : {};
		return (!e[rr] || typeof e[rr] != "object") && (e[rr] = ir()), e[rr];
	} catch {
		return ir();
	}
}
function or(e, t) {
	let n = nr();
	if (n) {
		n.setEnrichmentState(e, t);
		return;
	}
	let r = ar();
	r.enrichmentActive = !!e, r.enrichmentQueueLength = Math.max(0, Number(t || 0) || 0);
}
function sr() {
	let e = nr();
	if (e) return e.getEnrichmentState();
	let t = ar();
	return {
		active: !!t.enrichmentActive,
		queueLength: Math.max(0, Number(t.enrichmentQueueLength || 0) || 0)
	};
}
//#endregion
//#region ui/features/grid/AssetCardRenderer.ts
function cr(e) {
	try {
		return String(e || "").trim().toLowerCase();
	} catch {
		return "";
	}
}
function lr(e) {
	try {
		return (String(e || "").split(".").pop() || "").toUpperCase();
	} catch {
		return "";
	}
}
function ur(e) {
	try {
		let t = String(e || ""), n = t.lastIndexOf("."), r = n > 0 ? t.slice(0, n) : t;
		return String(r || "").trim().toLowerCase();
	} catch {
		return "";
	}
}
function dr(e) {
	try {
		if (String(e?.kind || "").toLowerCase() !== "video") return !1;
		let t = String(e?.filename || "").toLowerCase();
		return t.includes("-audio") || t.includes("_audio");
	} catch {
		return !1;
	}
}
function fr(e) {
	try {
		let t = String(e?.kind || "").toLowerCase(), n = 0;
		dr(e) ? n = 2 : t === "video" && (n = 1);
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
function pr(e, t) {
	for (let n = 0; n < Math.max(e.length, t.length); n++) {
		let r = (e[n] || 0) - (t[n] || 0);
		if (r !== 0) return r;
	}
	return 0;
}
function mr(e) {
	if (!Array.isArray(e) || e.length === 0) return null;
	if (e.length === 1) return e[0];
	let t = e[0], n = fr(t);
	for (let r = 1; r < e.length; r++) {
		let i = e[r], a = fr(i);
		pr(a, n) > 0 && (t = i, n = a);
	}
	return t;
}
function hr(e, t) {
	if (!e || !Array.isArray(t) || t.length === 0 || (Number(e?.generation_time_ms ?? e?.metadata?.generation_time_ms ?? 0) || 0) > 0) return e;
	let n = t.find((e) => (Number(e?.generation_time_ms ?? e?.metadata?.generation_time_ms ?? 0) || 0) > 0);
	if (!n) return e;
	let r = Number(n?.generation_time_ms ?? n?.metadata?.generation_time_ms ?? 0) || 0;
	return r <= 0 ? e : (e.generation_time_ms = r, !e.has_generation_data && n?.has_generation_data && (e.has_generation_data = n.has_generation_data), e);
}
function gr(e, t) {
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
function _r(e) {
	try {
		return !!e()?.siblings?.hidePngSiblings;
	} catch {
		return !1;
	}
}
function vr(e) {
	return `${String(e?.source || e?.type || "").trim().toLowerCase()}|${String(e?.root_id || e?.custom_root_id || "").trim().toLowerCase()}|${String(e?.subfolder || "").trim().toLowerCase()}`;
}
function yr(e) {
	let t = cr(e?.filename);
	return t ? `${vr(e)}|${t}` : "";
}
function br(e, t = lr(e?.filename || "")) {
	let n = gr(e, t), r = String(e?.filename || "").trim();
	if (!r) return "";
	let i = vr(e);
	if (n === "model3d") return `${i}|model3d|${r.toLowerCase()}`;
	let a = ur(r);
	return a ? `${i}|media|${a}` : "";
}
function xr(e) {
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
function Sr(e, t, n) {
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
function Cr(e, t, n, r) {
	let i = n.stemMap.get(t);
	if (!i?.length) return [];
	let a = [];
	for (let e = i.length - 1; e >= 0; e--) r(i[e]) && (a.push(i[e]), i.splice(e, 1));
	return i.length || n.stemMap.delete(t), a;
}
function wr(e, t, n) {
	if (!_r(n)) return {
		hidden: !1,
		hideEnabled: !1,
		removed: []
	};
	let r = xr(t), i = String(e?.filename || ""), a = lr(i), o = gr(e, a), s = br(e, a);
	if (!s) return {
		hidden: !1,
		hideEnabled: !0,
		removed: []
	};
	if (o === "video" || o === "audio" || o === "model3d" || a === "WEBP") return r.nonImageSiblingKeys.add(s), {
		hidden: !1,
		hideEnabled: !0,
		removed: Cr(t, s, r, (e) => lr(e?.filename || "") === "PNG")
	};
	if (a === "PNG") {
		let t = `${vr(e)}|model3d|${ur(i)}`;
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
function Tr(e, t, n, r) {
	let i = _r(r.loadMajoorSettings), a = n.filenameCounts || /* @__PURE__ */ new Map();
	n.filenameCounts = a, r.clearGridMessage(e);
	let o = r.ensureVirtualGrid(e, n);
	if (!o) return 0;
	i || (n.hiddenPngSiblings = 0), n.assetKeyFn = r.assetKey;
	let s = xr(n), c = /* @__PURE__ */ new Map();
	for (let e of n.assets || []) {
		let t = yr(e);
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
				let l = hr(mr(s), s), u = s.filter((e) => e !== l);
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
		let t = lr(String(e?.filename || "")), i = wr(e, n, r.loadMajoorSettings);
		for (let e of i.removed || []) f.add(e);
		if (i.hidden) {
			n.hiddenPngSiblings += 1;
			continue;
		}
		let a = yr(e);
		if (a) {
			let t = c.get(a);
			t || (t = [], c.set(a, t)), t.push(e);
		}
		let o = r.assetKey(e);
		if (!o || s.seenKeys.has(o) || e.id != null && s.assetIdSet.has(String(e.id))) continue;
		s.seenKeys.add(o), e.id != null && s.assetIdSet.add(String(e.id)), d.push(e);
		let u = br(e, t);
		if (u) {
			let t = s.stemMap.get(u);
			t || (t = [], s.stemMap.set(u, t)), t.push(e);
		}
		l++;
	}
	if (f.size > 0) {
		n.hiddenPngSiblings += f.size, n.assets = n.assets.filter((e) => !f.has(e));
		for (let e = d.length - 1; e >= 0; e--) f.has(d[e]) && (d.splice(e, 1), l = Math.max(0, l - 1));
		for (let e of f) Sr(n, e, s);
		try {
			for (let e of f) {
				let t = yr(e);
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
function Er({ ext: e = "", filename: t = "", count: n = 0, paths: r = [] } = {}) {
	let i = String(e || "").trim(), a = String(t || "").trim(), o = Math.max(0, Number(n) || 0), s = Array.isArray(r) ? r.map((e) => String(e || "").trim()).filter(Boolean) : [];
	if (o < 2) return `${i} file`;
	let c = [`${i}+ name collision in current view (${o})`];
	if (a && c.push(k("badge.collisionName", "Name: {name}", { name: a })), s.length) {
		c.push(k("badge.collisionPaths", "Paths:"));
		for (let e of s.slice(0, 4)) c.push(`- ${e}`);
		s.length > 4 && c.push(`- ... +${s.length - 4} more`);
	}
	return c.push(k("badge.collisionSelect", "Click to select collisions in current view")), c.join("\n");
}
function Dr(e, t, n = !1, r = null) {
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
	}[gr({ kind: t }, a)], s = o ? `var(${o}, #607D8B)` : "#607D8B", c = n ? "var(--mjr-badge-duplicate-alert, #ff1744)" : s;
	i.textContent = a + (n ? "+" : ""), i.title = n ? Er({
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
function Or(e, t, n = null) {
	if (e) try {
		let r = e.dataset?.mjrExt || "", i = e.dataset?.mjrBadgeBg || "var(--mjr-badge-image, #607D8B)";
		e.textContent = String(r || "") + (t ? "+" : ""), e.title = t ? Er({
			ext: r,
			filename: n?.filename || "",
			count: n?.count,
			paths: n?.paths
		}) : `${r} file`, e.style.background = t ? "var(--mjr-badge-duplicate-alert, #ff1744)" : i, e.style.cursor = t ? "pointer" : "default";
	} catch (e) {
		console.debug?.(e);
	}
}
function kr(e) {
	return e === !0 ? !0 : e === !1 ? !1 : e === 1 || e === "1" ? !0 : e === 0 || e === "0" ? !1 : null;
}
function Ar(e, t = []) {
	if (!e || typeof e != "object") return null;
	for (let n of t) if (e[n] != null) return e[n];
	return null;
}
function jr(e) {
	return typeof e == "string" && e.trim().length > 0;
}
function Mr(e) {
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
function Nr(e) {
	let t = Ar(e, [
		"auto_tags",
		"autoTags",
		"ai_auto_tags",
		"aiAutoTags",
		"suggested_tags",
		"suggestedTags"
	]), n = Ar(e, [
		"enhanced_caption",
		"enhancedCaption",
		"enhanced_prompt",
		"enhancedPrompt",
		"ai_enhanced_prompt",
		"aiEnhancedPrompt"
	]), r = kr(Ar(e, [
		"has_ai_auto_tags",
		"hasAiAutoTags",
		"ai_has_auto_tags",
		"aiHasAutoTags"
	])), i = kr(Ar(e, [
		"has_ai_enhanced_caption",
		"hasAiEnhancedCaption",
		"ai_has_enhanced_caption",
		"aiHasEnhancedCaption"
	])), a = kr(Ar(e, [
		"has_ai_vector",
		"hasAiVector",
		"has_vector_embedding",
		"hasVectorEmbedding",
		"vector_indexed",
		"vectorIndexed"
	])), o = kr(Ar(e, [
		"has_ai_info",
		"hasAiInfo",
		"ai_indexed",
		"aiIndexed"
	])), s = r === !0 || r === null && Mr(t), c = i === !0 || i === null && jr(n), l = a === !0 || o === !0;
	return {
		hasAiInfo: o === !0 || s || c || l,
		hasAutoTags: s,
		hasEnhancedPrompt: c,
		hasVectorIndexed: l
	};
}
function Pr(e) {
	let t = document.createElement("span");
	t.className = "mjr-workflow-dot mjr-asset-status-dot";
	let n = kr(e?.has_workflow ?? e?.hasWorkflow), r = kr(e?.has_generation_data ?? e?.hasGenerationData), i = sr(), a = i.queueLength, o = i.active || a > 0, s = k("badge.workflow.pendingParsing", "Pending: parsing metadata..."), c = n === !0 || r === !0, l = n === !1 || r === !1, u = n === null || r === null;
	n === !0 && r === !0 ? s = k("badge.workflow.complete", "Complete: workflow + generation data detected") : c ? s = n === !0 ? k("badge.workflow.partialWorkflowOnly", "Partial: workflow only (generation data missing)") : k("badge.workflow.partialGenerationOnly", "Partial: generation data only (workflow missing)") : l && !c && !u ? s = k("badge.workflow.none", "None: no workflow or generation data found") : u && (s = k("badge.workflow.pendingNotParsed", "Pending: metadata not parsed yet"));
	let d = u ? "pending" : n === !0 && r === !0 ? "success" : c ? "warning" : "error";
	o && d !== "success" && (d = "pending", s = a > 0 ? k("badge.workflow.enrichmentQueued", "Pending: database metadata enrichment in progress ({count} queued)", { count: a }) : k("badge.workflow.enrichment", "Pending: database metadata enrichment in progress")), Fr(t, d, s, { asset: e });
	let f = Nr(e);
	if (f.hasAiInfo) {
		let e = [];
		f.hasVectorIndexed && e.push(k("badge.ai.vectorIndexed", "vector indexed")), f.hasAutoTags && e.push(k("badge.ai.tagSuggestions", "AI tag suggestions")), f.hasEnhancedPrompt && e.push(k("badge.ai.enhancedPrompt", "enhanced prompt")), t.textContent = "";
		let n = document.createElement("i");
		n.className = "pi pi-sparkles", n.setAttribute("aria-hidden", "true"), n.style.fontSize = "11px", n.style.lineHeight = "1", t.appendChild(n);
		try {
			t.dataset.mjrAi = "1";
		} catch (e) {
			console.debug?.(e);
		}
		t.title = k("badge.workflow.aiTooltip", "{title}\nAI: {ai}\nClick to rescan this file", {
			title: s,
			ai: e.length ? e.join(", ") : k("badge.ai.indexed", "indexed")
		});
	} else {
		try {
			t.dataset.mjrAi = "0";
		} catch (e) {
			console.debug?.(e);
		}
		t.textContent = "●", t.title = k("badge.workflow.tooltip", "{title}\nClick to rescan this file", { title: s });
	}
	return t;
}
function Fr(e, t, n = "", r = {}) {
	if (!e) return;
	let i = String(t || "").toLowerCase(), a = er(i, {
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
function Ir(e) {
	let t = Math.max(0, Math.min(5, Number(e) || 0));
	if (t <= 0) return null;
	let n = document.createElement("div");
	n.className = "mjr-rating-badge", n.title = k("badge.rating", "Rating: {rating} star{plural}", {
		rating: t,
		plural: t > 1 ? "s" : ""
	}), n.style.cssText = "\n        position: absolute;\n        top: 6px;\n        right: 6px;\n        background: rgba(0, 0, 0, 0.55);\n        border: 1px solid rgba(255, 255, 255, 0.12);\n        padding: 2px 6px;\n        border-radius: 6px;\n        font-size: 13px;\n        letter-spacing: 1px;\n        display: inline-flex;\n        align-items: center;\n        justify-content: center;\n        pointer-events: none;\n        z-index: 10;\n        text-shadow: 0 2px 6px rgba(0,0,0,0.6);\n        box-shadow: 0 6px 18px rgba(0,0,0,0.25);\n    ";
	for (let e = 1; e <= t; e++) {
		let r = document.createElement("span");
		r.textContent = "★", r.style.color = "var(--mjr-rating-color, var(--mjr-star-active, #FFD45A))", r.style.marginRight = e < t ? "2px" : "0", n.appendChild(r);
	}
	return n;
}
function Lr(e) {
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
function Rr(e) {
	let t = Number(e) / 1e3;
	return t >= 60 ? "#FF9800" : t >= 30 ? "#FFC107" : t >= 10 ? "#8BC34A" : "#4CAF50";
}
function zr(e) {
	let t = e / 1e3;
	if (t >= 60) {
		let e = (t / 60).toFixed(1);
		return {
			text: `${e}m`,
			title: k("badge.generationTimeMinutes", "Generation time: {minutes} minutes ({seconds}s)", {
				minutes: e,
				seconds: t.toFixed(1)
			})
		};
	}
	let n = t.toFixed(1);
	return {
		text: `${n}s`,
		title: k("badge.generationTimeSeconds", "Generation time: {seconds} seconds", { seconds: n })
	};
}
function Br(e, { maxMs: t = 864e5 } = {}) {
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
function Vr(e) {
	let t = document.createElement("div");
	t.className = "mjr-tags-badge";
	let n = Lr(e);
	return n.length === 0 ? (t.style.display = "none", t) : (t.textContent = n.join(", "), t.title = k("badge.tags", "Tags: {tags}", { tags: n.join(", ") }), t.style.cssText = "\n        position: absolute;\n        bottom: 6px;\n        left: 6px;\n        padding: 3px 6px;\n        border-radius: 4px;\n        background: rgba(0,0,0,0.8);\n        color: var(--mjr-tag-color, #90CAF9);\n        font-size: 9px;\n        max-width: 80%;\n        overflow: hidden;\n        text-overflow: ellipsis;\n        white-space: nowrap;\n        pointer-events: none;\n        z-index: 10;\n        box-shadow: 0 2px 4px rgba(0,0,0,0.3);\n    ", t);
}
//#endregion
//#region ui/utils/safeCall.ts
var Hr = () => {};
function Ur(e) {
	try {
		return !!j?.[e];
	} catch {
		return !1;
	}
}
function Wr(e, t) {
	try {
		console.warn(`[Majoor] ${e}`, t);
	} catch (e) {
		console.debug?.(e);
	}
}
function Gr(e, t = "safeCall") {
	try {
		return e?.();
	} catch (e) {
		Ur("DEBUG_SAFE_CALL") && Wr(t, e);
		return;
	}
}
function Kr(e, t, n, r, i = "safeAddListener") {
	try {
		return e?.addEventListener?.(t, n, r), () => {
			try {
				e?.removeEventListener?.(t, n, r);
			} catch (e) {
				Ur("DEBUG_SAFE_LISTENERS") && Wr(`${i}:remove:${String(t || "")}`, e);
			}
		};
	} catch (e) {
		return Ur("DEBUG_SAFE_LISTENERS") && Wr(`${i}:add:${String(t || "")}`, e), Hr;
	}
}
//#endregion
//#region ui/utils/mediaFps.ts
function qr(e) {
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
function Jr(e) {
	try {
		let t = e, n = t.metadata_raw || {}, r = (n.raw_ffprobe || {}).video_stream || {};
		return qr(t.fps) ?? qr(n.fps) ?? qr(n.frame_rate) ?? qr(r.avg_frame_rate) ?? qr(r.r_frame_rate);
	} catch {
		return null;
	}
}
function Yr(e, t) {
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
function Xr(e) {
	let t = Number(e);
	return !Number.isFinite(t) || t <= 0 ? "" : Math.abs(t - Math.round(t)) < .001 ? `${Math.round(t)} fps` : `${t.toFixed(3).replace(/\.?0+$/, "")} fps`;
}
function Zr(e, t = 30) {
	let n = qr(e);
	if (n != null) return Math.max(1, Math.round(n * 1e3) / 1e3);
	let r = qr(t);
	return r == null ? 30 : Math.max(1, Math.round(r * 1e3) / 1e3);
}
//#endregion
//#region ui/vue/majoorPrimeVue.ts
var Qr = {
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
function $r(e) {
	return e.use(ze, {
		ripple: !1,
		unstyled: !0,
		zIndex: { overlay: 10100 }
	}), e.use(Ue), e.use(Ke), Object.entries(Qr).forEach(([t, n]) => {
		e.component(`M${t}`, n);
	}), e;
}
//#endregion
//#region ui/vue/createVueApp.ts
function ei(e, t = void 0) {
	let n = tt(), r = Re(e, t);
	return r.use(n), $r(r), {
		app: r,
		pinia: n
	};
}
var ti = /* @__PURE__ */ new Map();
function ni(e, t, n) {
	try {
		window.dispatchEvent(new CustomEvent("mjr:keepalive-attached", { detail: {
			mountKey: String(e || "_mjrVueApp"),
			host: t || null,
			container: n || null
		} }));
	} catch {}
}
function ri(e) {
	let t = document.createElement("div");
	return t.dataset.mjrKeepAliveHost = String(e || "_mjrVueApp"), t.style.height = "100%", t.style.width = "100%", t.style.minHeight = "0", t.style.display = "flex", t.style.flexDirection = "column", t.style.overflow = "hidden", t;
}
function ii(e, t) {
	!e || !t || (e.style.height = "100%", e.style.minHeight = "0", e.style.display = "flex", e.style.flexDirection = "column", e.style.overflow = "hidden", !(e.firstChild === t && e.childNodes.length === 1) && (e.replaceChildren(t), ni(t?.dataset?.mjrKeepAliveHost, t, e)));
}
function ai(e, t, n = "_mjrVueApp") {
	if (!e) return !1;
	let r = ti.get(n), i = !1;
	if (!r) {
		let e = ri(n), { app: a } = ei(t);
		a.mount(e), r = {
			app: a,
			host: e,
			container: null
		}, ti.set(n, r), i = !0;
	}
	return ii(e, r.host), r.container = e, i;
}
function oi(e, t = "_mjrVueApp") {
	let n = ti.get(t);
	if (n?.app) {
		try {
			n.app.unmount();
		} catch {}
		try {
			n.host?.remove?.();
		} catch {}
		ti.delete(t);
	}
}
//#endregion
//#region ui/utils/format.ts
function si(e) {
	if (!e) return null;
	let t = Number(e);
	if (!isNaN(t)) return /* @__PURE__ */ new Date(t * 1e3);
	let n = new Date(e);
	return isNaN(n.getTime()) ? null : n;
}
function ci(e) {
	let t = si(e);
	return t ? `${t.getDate().toString().padStart(2, "0")}/${(t.getMonth() + 1).toString().padStart(2, "0")}` : "";
}
function li(e) {
	let t = si(e);
	return t ? `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}` : "";
}
function ui(e) {
	return e ? e < 60 ? `${Math.round(e)}s` : `${Math.floor(e / 60)}m ${Math.round(e % 60)}s` : "";
}
//#endregion
//#region ui/stores/usePanelStore.ts
var di = "mjr_panel_state", fi = new Set([
	"output",
	"input",
	"all",
	"custom"
]);
function pi(e, t = !1) {
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
}
function mi(e, t = 0) {
	let n = Number(e);
	return Number.isFinite(n) ? n : t;
}
function Q(e, t = "") {
	return e == null ? t : String(e);
}
function hi(e, t = 0, n = Infinity) {
	return Math.max(t, Math.min(n, Math.floor(mi(e, t))));
}
function gi(e) {
	let t = Q(e || "output").toLowerCase(), n = t === "outputs" ? "output" : t === "inputs" ? "input" : t;
	return fi.has(n) ? n : "output";
}
function _i(e) {
	if (!e || typeof e != "object") return {};
	let t = e;
	return {
		scope: gi(t.scope),
		customRootId: Q(t.customRootId),
		customRootLabel: Q(t.customRootLabel),
		currentFolderRelativePath: Q(t.currentFolderRelativePath || t.subfolder),
		collectionId: Q(t.collectionId),
		collectionName: Q(t.collectionName),
		kindFilter: Q(t.kindFilter),
		dateRangeFilter: Q(t.dateRangeFilter),
		dateExactFilter: Q(t.dateExactFilter),
		workflowOnly: pi(t.workflowOnly, !1),
		minRating: hi(t.minRating, 0, 5),
		minSizeMB: Math.max(0, mi(t.minSizeMB, 0)),
		maxSizeMB: Math.max(0, mi(t.maxSizeMB, 0)),
		resolutionCompare: t.resolutionCompare === "lte" ? "lte" : "gte",
		minWidth: hi(t.minWidth),
		minHeight: hi(t.minHeight),
		maxWidth: hi(t.maxWidth),
		maxHeight: hi(t.maxHeight),
		workflowType: Q(t.workflowType),
		workflowId: Q(t.workflowId || t.workflow_id),
		sort: Q(t.sort || "mtime_desc"),
		searchQuery: Q(t.searchQuery),
		scrollTop: hi(t.scrollTop),
		activeAssetId: Q(t.activeAssetId),
		selectedAssetIds: Array.isArray(t.selectedAssetIds) ? t.selectedAssetIds.map((e) => Q(e).trim()).filter(Boolean).slice(0, 5e3) : [],
		sidebarOpen: pi(t.sidebarOpen, !1)
	};
}
function vi() {
	try {
		let e = localStorage.getItem(di);
		if (e) return _i(JSON.parse(e));
	} catch {}
	return {};
}
function yi(e) {
	try {
		let t = { ...e };
		delete t.lastGridCount, delete t.lastGridTotal, delete t.viewScope, delete t.similarResults, delete t.similarTitle, delete t.similarSourceAssetId, localStorage.setItem(di, JSON.stringify(t));
	} catch {}
}
var bi = $e("mjr-panel", () => {
	let e = vi(), t = I(e.scope || "output"), n = I(e.customRootId || ""), r = I(e.customRootLabel || ""), i = I(e.currentFolderRelativePath || ""), a = I(e.collectionId || ""), o = I(e.collectionName || ""), s = I(e.kindFilter || ""), c = I(e.dateRangeFilter || ""), l = I(e.dateExactFilter || ""), u = I(e.workflowOnly || !1), d = I(e.minRating || 0), f = I(e.minSizeMB || 0), p = I(e.maxSizeMB || 0), m = I(e.resolutionCompare || "gte"), h = I(e.minWidth || 0), g = I(e.minHeight || 0), _ = I(e.maxWidth || 0), v = I(e.maxHeight || 0), y = I(e.workflowType || ""), b = I(e.workflowId || ""), x = I(e.sort || "mtime_desc"), S = I(e.searchQuery || ""), C = I(e.scrollTop || 0), w = I(e.activeAssetId || ""), T = I(e.selectedAssetIds || []), E = I(e.sidebarOpen || !1), ee = I(0), te = I(0), ne = I(""), re = I([]), ie = I(""), ae = I(""), se = null;
	we([
		t,
		n,
		r,
		i,
		a,
		o,
		s,
		c,
		l,
		u,
		d,
		f,
		p,
		m,
		h,
		g,
		_,
		v,
		y,
		b,
		x,
		S,
		C,
		w,
		T,
		E
	], () => {
		se && clearTimeout(se), se = setTimeout(() => {
			se = null, yi({
				scope: t.value,
				customRootId: n.value,
				customRootLabel: r.value,
				currentFolderRelativePath: i.value,
				collectionId: a.value,
				collectionName: o.value,
				kindFilter: s.value,
				dateRangeFilter: c.value,
				dateExactFilter: l.value,
				workflowOnly: u.value,
				minRating: d.value,
				minSizeMB: f.value,
				maxSizeMB: p.value,
				resolutionCompare: m.value,
				minWidth: h.value,
				minHeight: g.value,
				maxWidth: _.value,
				maxHeight: v.value,
				workflowType: y.value,
				workflowId: b.value,
				sort: x.value,
				searchQuery: S.value,
				scrollTop: C.value,
				activeAssetId: w.value,
				selectedAssetIds: T.value,
				sidebarOpen: E.value
			});
		}, 750);
	}, { deep: !0 });
	let ce = (e) => {
		if (!(e.key !== di || !e.newValue)) try {
			let n = _i(JSON.parse(e.newValue));
			n.scope !== void 0 && (t.value = n.scope), n.customRootLabel !== void 0 && (r.value = n.customRootLabel), n.searchQuery !== void 0 && (S.value = n.searchQuery), n.sort !== void 0 && (x.value = n.sort), n.sidebarOpen !== void 0 && (E.value = n.sidebarOpen);
		} catch {}
	};
	try {
		window.addEventListener("storage", ce);
	} catch {}
	Me(() => {
		try {
			window.removeEventListener("storage", ce);
		} catch {}
	});
	function D() {
		s.value = "", c.value = "", l.value = "", u.value = !1, d.value = 0, f.value = 0, p.value = 0, m.value = "gte", h.value = 0, g.value = 0, _.value = 0, v.value = 0, y.value = "", b.value = "", S.value = "";
	}
	function O() {
		T.value = [], w.value = "";
	}
	function le(e, t = "") {
		T.value = Array.isArray(e) ? e.map(String).filter(Boolean) : [], w.value = t || T.value[0] || "";
	}
	function ue(e, s = {}) {
		t.value = e, i.value = s.folder || "", a.value = s.collectionId || "", o.value = s.collectionName || "", n.value = s.customRootId || "", r.value = s.customRootLabel || "", ne.value = "", re.value = [], ie.value = "", ae.value = "", O();
	}
	async function de() {
		let e = String(n.value || "").trim();
		if (e) try {
			let a = await oe("/mjr/am/custom-roots"), o = (Array.isArray(a?.data) ? a.data : []).find((t) => String(t?.id || "") === e);
			if (!o) {
				n.value = "", r.value = "", t.value === "custom" && (t.value = "output", i.value = "");
				return;
			}
			let s = String(o.label || "").trim();
			s && s !== r.value && (r.value = s);
		} catch {}
	}
	return {
		scope: t,
		customRootId: n,
		customRootLabel: r,
		currentFolderRelativePath: i,
		collectionId: a,
		collectionName: o,
		kindFilter: s,
		dateRangeFilter: c,
		dateExactFilter: l,
		workflowOnly: u,
		minRating: d,
		minSizeMB: f,
		maxSizeMB: p,
		resolutionCompare: m,
		minWidth: h,
		minHeight: g,
		maxWidth: _,
		maxHeight: v,
		workflowType: y,
		workflowId: b,
		sort: x,
		searchQuery: S,
		scrollTop: C,
		activeAssetId: w,
		selectedAssetIds: T,
		sidebarOpen: E,
		lastGridCount: ee,
		lastGridTotal: te,
		viewScope: ne,
		similarResults: re,
		similarTitle: ie,
		similarSourceAssetId: ae,
		resetFilters: D,
		clearSelection: O,
		setSelection: le,
		navigateToScope: ue,
		validatePersistedCustomRoot: de
	};
}), xi = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "rgba(255, 255, 255, 0.03)",
		border: "1px solid var(--mjr-border, rgba(255, 255, 255, 0.12))",
		"border-radius": "8px",
		padding: "10px"
	}
}, Si = { style: {
	"font-size": "12px",
	"font-weight": "700",
	color: "#607d8b",
	"margin-bottom": "8px",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Ci = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "6px"
} }, wi = ["title"], Ti = ["title", "onClick"], Ei = ["title"], Di = {
	__name: "SidebarFileInfoSection",
	props: { asset: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e;
		function n(e) {
			let t = String(e || "").trim();
			if (t) {
				try {
					let e = bi();
					e.workflowId = t;
				} catch (e) {
					console.debug?.(e);
				}
				try {
					window.dispatchEvent(new CustomEvent("mjr:filters-changed"));
				} catch (e) {
					console.debug?.(e);
				}
			}
		}
		function r(e) {
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
		function i(e) {
			try {
				if (String(e?.kind || "").toLowerCase() === "video") return !0;
				let t = String(e?.filename || e?.filepath || e?.path || "").toLowerCase();
				return /\.(gif|webp|webm)$/.test(t);
			} catch {
				return !1;
			}
		}
		function a(e, t) {
			let n = e?.[t] ?? e?.file_info?.[t];
			return n != null && n !== "" ? n : t === "workflow_id" ? e?.user_metadata?.workflow?.id ?? e?.metadata?.workflow_id ?? "" : "";
		}
		let o = V(() => {
			let e = t.asset || {}, n = [];
			if (e.width && e.height && n.push({
				label: k("sidebar.dimensions", "Dimensions"),
				value: `${e.width} x ${e.height}`,
				tooltip: k("sidebar.fileInfo.dimensionsTooltip", "Image/video resolution in pixels")
			}), e.duration && e.duration > 0 && n.push({
				label: k("sidebar.fileInfo.duration", "Duration"),
				value: ui(e.duration),
				tooltip: k("sidebar.fileInfo.durationTooltip", "Video duration")
			}), i(e)) {
				let t = Jr(e);
				t != null && n.push({
					label: "FPS",
					value: Xr(t),
					tooltip: k("sidebar.fileInfo.fpsTooltip", "Native frame rate")
				});
				let r = Yr(e, t);
				if (r != null) {
					let e = Math.max(0, Math.floor(r));
					n.push({
						label: k("sidebar.fileInfo.length", "Length"),
						value: k("sidebar.fileInfo.frames", "{count} frames", { count: e }),
						tooltip: k("sidebar.fileInfo.lengthTooltip", "Total frame count")
					});
				}
			}
			let o = Br(e.generation_time_ms ?? e.metadata?.generation_time_ms ?? 0);
			o > 0 && n.push({
				label: k("sidebar.fileInfo.generationTime", "Generation Time"),
				value: `${(Number(o) / 1e3).toFixed(1)}s`,
				tooltip: k("sidebar.fileInfo.generationTimeTooltip", "Time taken to generate this asset (workflow execution time)"),
				valueStyle: `color: ${Rr(o)}; font-weight: 600;`
			});
			let s = e.generation_time || e.file_creation_time || e.mtime || e.created_at;
			if (s) {
				let e = ci(s), t = li(s);
				e && n.push({
					label: k("sidebar.date", "Date"),
					value: e,
					tooltip: k("sidebar.fileInfo.dateTooltip", "File creation/generation date")
				}), t && n.push({
					label: k("sidebar.fileInfo.time", "Time"),
					value: t,
					tooltip: k("sidebar.fileInfo.timeTooltip", "File creation/generation time")
				});
			}
			e.size && e.size > 0 && n.push({
				label: k("sidebar.fileInfo.fileSize", "File Size"),
				value: r(e.size),
				tooltip: k("sidebar.fileInfo.fileSizeTooltip", "File size on disk")
			}), e.id != null && n.push({
				label: k("sidebar.fileInfo.assetId", "Asset ID"),
				value: String(e.id),
				tooltip: k("sidebar.fileInfo.assetIdTooltip", "Internal database asset identifier")
			});
			let c = String(a(e, "job_id") || "").trim();
			c && n.push({
				label: k("sidebar.fileInfo.jobId", "Job ID"),
				value: c,
				tooltip: k("sidebar.fileInfo.jobIdTooltip", "Workflow execution job identifier (prompt_id)")
			});
			let l = String(a(e, "source_node_id") || "").trim();
			l && n.push({
				label: k("sidebar.fileInfo.sourceNode", "Source Node"),
				value: l,
				tooltip: k("sidebar.fileInfo.sourceNodeTooltip", "ComfyUI node id that produced this file")
			});
			let u = String(a(e, "source_node_type") || "").trim();
			u && n.push({
				label: k("sidebar.fileInfo.nodeType", "Node Type"),
				value: u,
				tooltip: k("sidebar.fileInfo.nodeTypeTooltip", "ComfyUI node class that produced this file")
			});
			let d = String(a(e, "workflow_id") || "").trim();
			return d && n.push({
				label: k("sidebar.fileInfo.workflowId", "Workflow ID"),
				value: d,
				tooltip: k("sidebar.fileInfo.workflowIdTooltip", "ComfyUI workflow identifier (from workflow.id in extra_data)"),
				action: "sameWorkflow"
			}), n;
		});
		return (e, t) => o.value.length ? (M(), F("div", xi, [P("div", Si, R(z(k)("sidebar.fileInfo.title", "File Info")), 1), P("div", Ci, [(M(!0), F(H, null, N(o.value, (e) => (M(), F("div", {
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
		}, R(e.label), 9, wi), e.action === "sameWorkflow" ? (M(), F("button", {
			key: 0,
			type: "button",
			title: z(k)("tooltip.filterWorkflowId", "Filter assets generated from the same embedded workflow id"),
			style: {
				appearance: "none",
				border: "0",
				background: "transparent",
				color: "inherit",
				font: "inherit",
				"font-size": "12px",
				"text-align": "right",
				"word-break": "break-word",
				cursor: "pointer",
				padding: "0",
				"text-decoration": "underline",
				"text-decoration-color": "rgba(255,255,255,0.25)",
				"text-underline-offset": "3px"
			},
			onClick: (t) => n(e.value)
		}, R(e.value), 9, Ti)) : (M(), F("div", {
			key: 1,
			style: L(e.valueStyle || "font-size: 12px; text-align: right; word-break: break-word"),
			title: String(e.value || "")
		}, R(e.value), 13, Ei))]))), 128))])])) : B("", !0);
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
		return !!(q()?.ai?.vectorSearchEnabled ?? !0);
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
		let r = _e(t, n, e);
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
function $(e) {
	return e == null || e === "" ? "-" : String(e);
}
function Ri(e, t) {
	let n = String(e?.pass_stage || e?.stage || e?.kind || "").trim().toLowerCase();
	if (n === "txt2img" || n === "text_to_image" || n === "text-to-image") return k("sidebar.generation.stageTextToImage", "Text-to-Image");
	if (n === "img2img" || n === "image_to_image" || n === "image-to-image") return k("sidebar.generation.stageImageToImage", "Image-to-Image");
	if (n === "inpaint" || n === "inpainting") return k("sidebar.generation.stageInpaint", "Inpaint");
	if (n === "upscale" || n === "upscaling") return k("sidebar.generation.stageUpscale", "Upscale");
	if (n === "refine" || n === "refiner") return k("sidebar.generation.stageRefine", "Refine");
	let r = String(e?.pass_name || "").trim();
	if (r && r.toLowerCase() !== "base") return r;
	let i = Number(e?.denoise);
	return t === 0 || i === 1 ? k("sidebar.generation.stageBase", "Base") : Number.isFinite(i) && i < 1 ? k("sidebar.generation.stageRefineUpscale", "Refine / Upscale") : k("sidebar.generation.stagePassN", "Pass {n}", { n: t + 1 });
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
		label: k("sidebar.generation.highNoise", "High Noise"),
		model: Vi(r.unet_high_noise)
	}, {
		key: "low_noise",
		label: k("sidebar.generation.lowNoise", "Low Noise"),
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
		value: t ? k("state.on", "on") : k("state.off", "off")
	};
}
function Ki(e) {
	return e != null && String(e).trim() !== "";
}
function qi(e) {
	return new Set(Array.isArray(e.override_fields) ? e.override_fields.map((e) => String(e || "").trim()).filter(Boolean) : []);
}
function Ji(e, ...t) {
	return t.some((t) => e.has(t));
}
function Yi(e) {
	return Array.isArray(e) ? e.filter((e) => e && typeof e == "object").map((e, t) => ({
		title: String(e.title || k("sidebar.generation.customInfoN", "Custom Info {n}", { n: t + 1 })).trim(),
		content: String(e.content ?? e.value ?? "").trim(),
		color: /^#[0-9a-fA-F]{6}$/.test(String(e.color || "").trim()) ? String(e.color).trim() : "#2196F3"
	})).filter((e) => e.content) : [];
}
function Xi(e) {
	let t = rt(zi(e)), n = {
		kind: "empty",
		title: k("sidebar.generation.title", "Generation"),
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
		captionLabel: k("sidebar.generation.imageDescription", "Image Description"),
		emptyCaptionText: k("sidebar.generation.noImageDescription", "No image description yet."),
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
			mediaOnlyMessage: k("sidebar.generation.mediaOnlyPipeline", "This file looks like a media-only pipeline (e.g. LoadVideo/VideoCombine) and does not contain generation parameters.")
		} : Ai(e) || ji(e) ? {
			...n,
			kind: "caption-only",
			showAlignment: !1
		} : n;
	}
	let r = t, i = qi(r), a = r.engine && typeof r.engine == "object" ? r.engine : null, o = !!(r.is_override || a?.mode === "override" || a?.parser_version === "geninfo-override-v1" || a?.source === "majoor_geninfo"), s = st(r), c = nt(typeof r.prompt == "string" ? r.prompt : null, typeof (r.negative_prompt || r.negativePrompt) == "string" ? r.negative_prompt || r.negativePrompt : null), l = Array.isArray(r.all_positive_prompts) && r.all_positive_prompts.length > 1 ? r.all_positive_prompts.map((e, t) => {
		let n = nt(typeof e == "string" ? e : "", typeof r.all_negative_prompts?.[t] == "string" ? r.all_negative_prompts[t] : "");
		return {
			label: k("sidebar.generation.promptN", "Prompt {n}", { n: t + 1 }),
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
			Hi(u, d, k("sidebar.generation.checkpointN", "Checkpoint {n}", { n: t + 1 }), n);
		});
		else {
			let t = Vi(f.checkpoint);
			t && !e.has(t) && Hi(u, d, k("sidebar.generation.checkpoint", "Checkpoint"), t);
		}
		[
			["UNet", Vi(f.unet)],
			["Diffusion", Vi(f.diffusion)],
			[k("sidebar.generation.upscaler", "Upscaler"), Vi(f.upscaler)],
			["CLIP", Vi(f.clip)],
			["VAE", Vi(f.vae)]
		].forEach(([t, n]) => {
			e.has(n) || Hi(u, d, t, n);
		});
	} else (r.model || r.checkpoint) && Hi(u, d, k("sidebar.generation.model", "Model"), ot(r.model || r.checkpoint));
	if (Array.isArray(r.loras) && r.loras.length > 0) {
		let e = r.loras.map((e) => it(e)).filter(Boolean).join("\n");
		e && Hi(u, d, r.loras.length > 1 ? k("sidebar.generation.loras", "LoRAs") : "LoRA", e);
	}
	!f && r.clip && Hi(u, d, "CLIP", ot(r.clip)), !f && r.vae && Hi(u, d, "VAE", ot(r.vae)), !f && r.unet && Hi(u, d, "UNet", ot(r.unet)), !f && r.diffusion && Hi(u, d, "Diffusion", ot(r.diffusion)), f && r.clip && Hi(u, d, "CLIP", ot(r.clip)), f && r.vae && Hi(u, d, "VAE", ot(r.vae));
	for (let e of u) {
		let t = String(e.label || "").toLowerCase();
		(t.includes("checkpoint") || t === "model") && (e.override = Ji(i, "checkpoint", "model")), t === "clip" && (e.override = Ji(i, "clip")), t === "vae" && (e.override = Ji(i, "vae")), t.includes("lora") && (e.override = Ji(i, "loras"));
	}
	let g = [];
	Ki(r.seed) && g.push({
		label: k("sidebar.generation.seed", "Seed"),
		value: r.seed,
		override: Ji(i, "seed")
	}), (r.sampler || r.sampler_name) && g.push({
		label: k("sidebar.generation.sampler", "Sampler"),
		value: r.sampler || r.sampler_name,
		override: Ji(i, "sampler", "sampler_name")
	}), Ki(r.steps) && g.push({
		label: k("sidebar.generation.steps", "Steps"),
		value: r.steps,
		override: Ji(i, "steps")
	});
	let _ = Ki(r.cfg) ? r.cfg : r.cfg_scale;
	Ki(_) && g.push({
		label: k("sidebar.generation.cfgScale", "CFG Scale"),
		value: _,
		override: Ji(i, "cfg", "cfg_scale")
	}), r.cfg_high_noise !== void 0 && r.cfg_high_noise !== null && g.push({
		label: k("sidebar.generation.cfgHighNoise", "CFG High Noise"),
		value: r.cfg_high_noise
	}), r.cfg_low_noise !== void 0 && r.cfg_low_noise !== null && g.push({
		label: k("sidebar.generation.cfgLowNoise", "CFG Low Noise"),
		value: r.cfg_low_noise
	}), r.scheduler && g.push({
		label: k("sidebar.generation.scheduler", "Scheduler"),
		value: r.scheduler,
		override: Ji(i, "scheduler")
	});
	let v = Ki(r.denoise) ? r.denoise : r.denoising;
	Ki(v) && g.push({
		label: k("sidebar.generation.denoise", "Denoise"),
		value: v,
		override: Ji(i, "denoise", "denoising")
	});
	let y = [];
	Array.isArray(r.chained_passes) && r.chained_passes.length > 1 ? y = r.chained_passes.filter((e) => e && typeof e == "object").map((e, t) => ({
		label: Ri(e, t),
		fields: [
			{
				label: k("sidebar.generation.model", "Model"),
				value: $(e?.model)
			},
			{
				label: k("sidebar.generation.sampler", "Sampler"),
				value: $(e?.sampler_name || e?.sampler)
			},
			{
				label: k("sidebar.generation.scheduler", "Scheduler"),
				value: $(e?.scheduler)
			},
			{
				label: k("sidebar.generation.steps", "Steps"),
				value: $(e?.steps)
			},
			{
				label: "CFG",
				value: $(e?.cfg)
			},
			{
				label: k("sidebar.generation.denoise", "Denoise"),
				value: $(e?.denoise)
			},
			{
				label: k("sidebar.generation.seed", "Seed"),
				value: $(e?.seed_val || e?.seed)
			}
		]
	})) : Array.isArray(r.all_samplers) && r.all_samplers.length > 1 && (y = r.all_samplers.filter((e) => e && typeof e == "object").map((e, t) => ({
		label: Ri(e, t),
		fields: [
			{
				label: k("sidebar.generation.model", "Model"),
				value: $(e?.model)
			},
			{
				label: k("sidebar.generation.sampler", "Sampler"),
				value: $(e?.sampler_name || e?.sampler)
			},
			{
				label: k("sidebar.generation.scheduler", "Scheduler"),
				value: $(e?.scheduler)
			},
			{
				label: k("sidebar.generation.steps", "Steps"),
				value: $(e?.steps)
			},
			{
				label: "CFG",
				value: $(e?.cfg)
			},
			{
				label: k("sidebar.generation.denoise", "Denoise"),
				value: $(e?.denoise)
			},
			{
				label: k("sidebar.generation.seed", "Seed"),
				value: $(e?.seed_val || e?.seed)
			}
		]
	})));
	let b = [];
	r.voice && b.push({
		label: k("sidebar.generation.narratorVoice", "Narrator Voice"),
		value: r.voice
	}), r.language && b.push({
		label: k("sidebar.generation.language", "Language"),
		value: r.language
	}), r.top_k !== void 0 && r.top_k !== null && b.push({
		label: "Top-k",
		value: r.top_k
	}), r.top_p !== void 0 && r.top_p !== null && b.push({
		label: "Top-p",
		value: r.top_p
	}), r.temperature !== void 0 && r.temperature !== null && b.push({
		label: k("sidebar.generation.temperature", "Temperature"),
		value: r.temperature
	}), r.repetition_penalty !== void 0 && r.repetition_penalty !== null && b.push({
		label: k("sidebar.generation.repetitionPenalty", "Repetition Penalty"),
		value: r.repetition_penalty
	}), r.max_new_tokens !== void 0 && r.max_new_tokens !== null && b.push({
		label: k("sidebar.generation.maxNewTokens", "Max New Tokens"),
		value: r.max_new_tokens
	});
	let x = [];
	r.device && x.push({
		label: k("sidebar.generation.device", "Device"),
		value: r.device
	}), r.voice_preset && x.push({
		label: k("sidebar.generation.voicePreset", "Voice Preset"),
		value: r.voice_preset
	}), r.dtype && x.push({
		label: k("sidebar.generation.dtype", "Dtype"),
		value: r.dtype
	}), r.attn_implementation && x.push({
		label: k("sidebar.generation.attention", "Attention"),
		value: r.attn_implementation
	}), r.compile_mode && x.push({
		label: k("sidebar.generation.compileMode", "Compile Mode"),
		value: r.compile_mode
	}), [
		Gi(k("sidebar.generation.torchCompile", "Torch Compile"), r.use_torch_compile),
		Gi(k("sidebar.generation.cudaGraphs", "CUDA Graphs"), r.use_cuda_graphs),
		Gi(k("sidebar.generation.xVectorOnly", "X-Vector Only"), r.x_vector_only_mode)
	].filter(Boolean).forEach((e) => x.push(e));
	let S = [];
	[
		Gi(k("sidebar.generation.chunking", "Chunking"), r.enable_chunking),
		r.max_chars_per_chunk !== void 0 && r.max_chars_per_chunk !== null ? {
			label: k("sidebar.generation.maxCharsChunk", "Max Chars/Chunk"),
			value: r.max_chars_per_chunk
		} : null,
		r.chunk_combination_method ? {
			label: k("sidebar.generation.chunkMethod", "Chunk Method"),
			value: r.chunk_combination_method
		} : null,
		r.silence_between_chunks_ms !== void 0 && r.silence_between_chunks_ms !== null ? {
			label: k("sidebar.generation.silenceBetweenChunks", "Silence Between Chunks (ms)"),
			value: r.silence_between_chunks_ms
		} : null,
		Gi(k("sidebar.generation.audioCache", "Audio Cache"), r.enable_audio_cache),
		r.batch_size !== void 0 && r.batch_size !== null ? {
			label: k("sidebar.generation.batchSize", "Batch Size"),
			value: r.batch_size
		} : null
	].filter(Boolean).forEach((e) => S.push(e));
	let C = [];
	r.lyrics_strength !== void 0 && r.lyrics_strength !== null && C.push({
		label: k("sidebar.generation.lyricsStrength", "Lyrics Strength"),
		value: r.lyrics_strength
	});
	let w = [];
	Ki(v) && !g.some((e) => e.label === "Denoise") && w.push({
		label: k("sidebar.generation.denoise", "Denoise"),
		value: v
	}), Ki(r.clip_skip) && w.push({
		label: k("sidebar.generation.clipSkip", "Clip Skip"),
		value: r.clip_skip
	});
	let T = [], E = String(r.workflow_notes || r.notes || "").trim();
	E && T.push({
		label: k("sidebar.generation.workflowNotes", "Workflow Notes"),
		value: E,
		override: Ji(i, "workflow_notes", "notes")
	});
	let ee = Yi(r.custom_info), te = Array.isArray(r.inputs) ? r.inputs.filter((e) => e && typeof e == "object" && e.filename).map((e, t) => ({
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
		positivePromptOverride: Ji(i, "prompt", "positive", "positive_prompt"),
		negativePromptOverride: Ji(i, "negative_prompt", "negative", "negativePrompt"),
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
var Zi = ["title"], Qi = ["src"], $i = ["src"], ea = {
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
}, ta = {
	key: 3,
	title: "Video file",
	style: {
		position: "absolute",
		color: "white",
		opacity: "0.7",
		"font-size": "16px",
		"pointer-events": "none"
	}
}, na = {
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
		}, null, 40, Qi)) : (M(), F("img", {
			key: 1,
			src: i(),
			style: {
				width: "100%",
				height: "100%",
				"object-fit": "cover"
			},
			onError: a
		}, null, 40, $i)), e.inputFile.role && e.inputFile.role !== "secondary" ? (M(), F("div", ea, R(e.inputFile.roleLabel), 1)) : e.inputFile.isVideo ? (M(), F("div", ta, " ▶ ")) : B("", !0)], 44, Zi));
	}
}, ra = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "12px"
	}
}, ia = {
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
}, aa = { style: { opacity: "0.85" } }, oa = { style: {
	display: "flex",
	"align-items": "center",
	gap: "8px",
	"flex-wrap": "wrap",
	"justify-content": "flex-end"
} }, sa = ["title"], ca = ["title"], la = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, ua = { style: {
	"font-size": "11px",
	"font-weight": "700",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.6px"
} }, da = { style: {
	"font-size": "11px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"font-weight": "600"
} }, fa = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#FF9800",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, pa = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, ma = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9E9E9E",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, ha = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, ga = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, _a = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"margin-bottom": "10px"
} }, va = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "#4CAF50",
	"letter-spacing": "0.4px"
} }, ya = ["onClick"], ba = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "#F44336",
	"letter-spacing": "0.4px",
	"margin-top": "4px"
} }, xa = ["onClick"], Sa = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Ca = ["title"], wa = ["title"], Ta = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#F44336",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Ea = ["title"], Da = ["title"], Oa = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between"
} }, ka = ["title"], Aa = { style: {
	display: "flex",
	"align-items": "center",
	gap: "10px"
} }, ja = { style: {
	flex: "1",
	height: "8px",
	background: "rgba(255,255,255,0.1)",
	"border-radius": "4px",
	overflow: "hidden"
} }, Ma = {
	key: 0,
	style: {
		"font-size": "10px",
		color: "rgba(255,255,255,0.65)",
		border: "1px dashed rgba(255,255,255,0.25)",
		"border-radius": "4px",
		padding: "6px 8px",
		background: "rgba(255,255,255,0.04)"
	}
}, Na = { style: {
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
} }, Pa = ["title"], Fa = { style: {
	display: "flex",
	"align-items": "center",
	gap: "6px"
} }, Ia = ["title"], La = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Ra = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, za = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#FF9800",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Ba = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"margin-bottom": "10px"
} }, Va = { style: {
	"font-size": "10px",
	"font-weight": "600",
	color: "rgba(255,255,255,0.6)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Ha = ["onClick"], Ua = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9C27B0",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Wa = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(220px, 1fr))",
	gap: "10px"
} }, Ga = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, Ka = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "4px"
} }, qa = ["onClick"], Ja = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "6px"
	}
}, Ya = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.58)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Xa = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "5px"
} }, Za = ["onClick"], Qa = { style: {
	display: "grid",
	"grid-template-columns": "auto 1fr",
	gap: "8px 12px",
	"align-items": "start"
} }, $a = ["title"], eo = ["title"], to = ["title", "onClick"], no = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, ro = ["title", "onClick"], io = ["title", "onClick"], ao = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#26A69A",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, oo = ["title"], so = { style: {
	"font-size": "11px",
	"font-weight": "700",
	color: "#E91E63",
	"text-transform": "uppercase",
	"letter-spacing": "1px"
} }, co = ["title"], lo = ["title"], uo = { style: {
	display: "flex",
	gap: "8px",
	"flex-wrap": "wrap"
} }, fo = {
	__name: "SidebarGenerationSection",
	props: { asset: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = I(0), r = I(0), i = I(""), a = I(k("action.copy", "Copy")), o = I(k("action.generate", "Generate")), s = I(!1), c = I(u()), l = 0;
		function u() {
			return {
				scoreText: "...",
				scoreColor: "#888",
				qualityText: k("status.loading", "Loading"),
				qualityColor: "#888",
				qualityBackground: "rgba(127,127,127,0.3)",
				fillWidth: "0%",
				fillColor: "#666",
				aiStatusVisible: !1,
				aiStatusText: k("sidebar.generation.aiDisabledEnv", "AI features are disabled (enable vector search env var).")
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
		let h = V(() => Xi(t.asset)), g = V(() => Mi()), _ = V(() => h.value.kind === "full" || h.value.kind === "caption-only"), v = V(() => Fi(i.value) || h.value.emptyCaptionText), y = V(() => g.value && h.value.isImageAsset && !!t.asset?.id), b = V(() => g.value && !!Fi(v.value) && v.value !== h.value.emptyCaptionText), S = V(() => {
			let e = [];
			return h.value.modelFields.length && e.push({
				key: "model",
				title: k("sidebar.generation.modelLora", "Model & LoRA"),
				accent: "#9C27B0",
				emphasis: !0,
				fields: h.value.modelFields
			}), !h.value.pipelineTabs.length && h.value.samplingFields.length && e.push({
				key: "sampling",
				title: k("sidebar.generation.sampling", "Sampling"),
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
				title: k("sidebar.generation.audio", "Audio"),
				accent: "#00BCD4",
				emphasis: !1,
				fields: h.value.audioFields
			}), h.value.imageFields.length && e.push({
				key: "image",
				title: k("sidebar.generation.image", "Image"),
				accent: "#2196F3",
				emphasis: !1,
				fields: h.value.imageFields
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
			c.value = {
				scoreText: "AI OFF",
				scoreColor: "#9E9E9E",
				qualityText: k("status.disabled", "Disabled"),
				qualityColor: "#BDBDBD",
				qualityBackground: "rgba(158,158,158,0.25)",
				fillWidth: "0%",
				fillColor: "#777",
				aiStatusVisible: !0,
				aiStatusText: k("sidebar.generation.aiDisabledSettings", "AI features are disabled in settings.")
			};
		}
		function te() {
			c.value = u();
		}
		async function ne() {
			l += 1;
			let e = l;
			if (!h.value.showAlignment || !t.asset?.id) {
				te();
				return;
			}
			if (!g.value) {
				ee();
				return;
			}
			te();
			try {
				let n = await x(t.asset.id);
				if (e !== l) return;
				if (!n?.ok && (String(n?.code || "").toUpperCase() === "SERVICE_UNAVAILABLE" || /vector search is not enabled/i.test(String(n?.error || "")))) {
					ee();
					return;
				}
				let r = n?.ok && n.data != null ? Number(n.data) : null;
				if (!Number.isFinite(r)) {
					c.value = {
						scoreText: "N/A",
						scoreColor: "#888",
						qualityText: k("status.na", "N/A"),
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
					qualityText: k("status.unavailable", "Unavailable"),
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
			if (!(!y.value || s.value)) {
				s.value = !0, o.value = k("status.generating", "Generating...");
				try {
					let e = await ce(t.asset.id);
					e?.ok && (i.value = String(e?.data || "").trim());
				} catch (e) {
					console.debug?.(e);
				} finally {
					s.value = !1, o.value = k("action.generate", "Generate");
				}
			}
		}
		async function ie() {
			if (b.value) try {
				await navigator.clipboard.writeText(v.value), a.value = k("viewer.copySuccessShort", "Copied!"), setTimeout(() => {
					a.value = k("action.copy", "Copy");
				}, 900);
			} catch (e) {
				console.debug?.(e);
			}
		}
		return we(() => t.asset, () => {
			n.value = 0, r.value = 0, i.value = String(t.asset?.enhanced_caption || "").trim(), a.value = k("action.copy", "Copy"), o.value = k("action.generate", "Generate");
		}, { immediate: !0 }), we(() => [
			t.asset?.id,
			h.value.kind,
			h.value.showAlignment,
			g.value
		], () => {
			ne();
		}, { immediate: !0 }), (e, t) => {
			let i = Qe("MButton");
			return h.value.kind === "empty" ? B("", !0) : (M(), F("div", ra, [
				h.value.workflowType ? (M(), F("div", ia, [P("span", aa, R(z(k)("viewer.workflow", "Workflow")), 1), P("div", oa, [P("span", {
					title: z(k)("sidebar.generation.workflowEngine", "Workflow engine: {value}", { value: h.value.workflowType }),
					style: {
						background: "#2196F3",
						color: "white",
						padding: "2px 8px",
						"border-radius": "999px",
						"font-weight": "bold",
						"font-size": "10px",
						"letter-spacing": "0.2px"
					}
				}, R(h.value.workflowLabel || h.value.workflowType), 9, sa), h.value.workflowBadge ? (M(), F("span", {
					key: 0,
					title: z(k)("sidebar.generation.apiProvider", "API provider: {value}", { value: h.value.workflowBadge }),
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
				}, R(h.value.workflowBadge), 9, ca)) : B("", !0)])])) : B("", !0),
				h.value.isOverride ? (M(), F("div", {
					key: 1,
					style: L(f("#00BCD4", {
						emphasis: !0,
						startAlpha: .14,
						endAlpha: .08
					}))
				}, [P("div", la, [P("span", ua, R(z(k)("sidebar.generation.override", "Override")), 1), P("span", da, R(h.value.overrideLabel), 1)])], 4)) : B("", !0),
				h.value.isTruncated ? (M(), F("div", {
					key: 2,
					style: L(f("#FF9800", {
						emphasis: !0,
						startAlpha: .12,
						endAlpha: .08
					}))
				}, [P("div", fa, R(z(k)("sidebar.generation.metadataTruncated", "Metadata Truncated")), 1), P("div", pa, R(z(k)("sidebar.generation.metadataTruncatedBody", "Generation data is incomplete because it exceeded the size limit.")), 1)], 4)) : B("", !0),
				h.value.kind === "media-only" ? (M(), F("div", {
					key: 3,
					style: L(f("#9E9E9E", {
						emphasis: !0,
						startAlpha: .1,
						endAlpha: .06
					}))
				}, [P("div", ma, R(z(k)("sidebar.generation.generationData", "Generation Data")), 1), P("div", ha, R(h.value.mediaOnlyMessage), 1)], 4)) : B("", !0),
				h.value.kind === "full" ? (M(), F(H, { key: 4 }, [h.value.promptTabs.length ? (M(), F("div", {
					key: 0,
					style: L(f("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [
					P("div", ga, R(z(k)("sidebar.generation.promptPipeline", "Prompt Pipeline ({count} variants)", { count: h.value.promptTabs.length })), 1),
					P("div", _a, [(M(!0), F(H, null, N(h.value.promptTabs, (e, t) => (M(), Te(i, {
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
						default: Oe(() => [De(R(e.label), 1)]),
						_: 2
					}, 1032, ["style", "onClick"]))), 128))]),
					(M(!0), F(H, null, N(h.value.promptTabs, (e, t) => je((M(), F("div", {
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
						P("div", va, R(z(k)("sidebar.generation.positive", "POSITIVE")), 1),
						P("div", {
							style: {
								"font-size": "12px",
								color: "var(--fg-color, #ddd)",
								"white-space": "pre-wrap",
								"line-height": "1.35",
								cursor: "pointer"
							},
							onClick: (t) => E(e.positive, t.currentTarget)
						}, R(e.positive), 9, ya),
						e.negative ? (M(), F(H, { key: 0 }, [P("div", ba, R(z(k)("sidebar.generation.negative", "NEGATIVE")), 1), P("div", {
							style: {
								"font-size": "12px",
								color: "var(--fg-color, #ddd)",
								"white-space": "pre-wrap",
								"line-height": "1.35",
								cursor: "pointer"
							},
							onClick: (t) => E(e.negative, t.currentTarget)
						}, R(e.negative), 9, xa)], 64)) : B("", !0)
					])), [[Ne, n.value === t]])), 128))
				], 4)) : h.value.positivePrompt ? (M(), F("div", {
					key: 1,
					style: L(f("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [P("div", Sa, [P("span", null, R(z(k)("sidebar.generation.positivePrompt", "Positive Prompt")), 1), h.value.positivePromptOverride ? (M(), F("span", {
					key: 0,
					style: L(m()),
					title: z(k)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
				}, R(z(k)("sidebar.generation.override", "override")), 13, Ca)) : B("", !0)]), P("div", {
					title: z(k)("action.clickToCopy", "Click to copy"),
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: t[0] ||= (e) => E(h.value.positivePrompt, e.currentTarget)
				}, R(h.value.positivePrompt), 9, wa)], 4)) : B("", !0), !h.value.promptTabs.length && h.value.negativePrompt ? (M(), F("div", {
					key: 2,
					style: L(f("#F44336", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [P("div", Ta, [P("span", null, R(z(k)("sidebar.generation.negativePrompt", "Negative Prompt")), 1), h.value.negativePromptOverride ? (M(), F("span", {
					key: 0,
					style: L(m()),
					title: z(k)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
				}, R(z(k)("sidebar.generation.override", "override")), 13, Ea)) : B("", !0)]), P("div", {
					title: z(k)("action.clickToCopy", "Click to copy"),
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: t[1] ||= (e) => E(h.value.negativePrompt, e.currentTarget)
				}, R(h.value.negativePrompt), 9, Da)], 4)) : B("", !0)], 64)) : B("", !0),
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
					class: Ve({ "mjr-ai-disabled-block": !g.value })
				}, [
					h.value.showAlignment ? (M(), F(H, { key: 0 }, [
						P("div", Oa, [P("span", { title: z(k)("sidebar.generation.promptAlignmentTooltip", "How closely the generated image matches the prompt (SigLIP2 score)") }, R(z(k)("sidebar.generation.promptAlignment", "Prompt Alignment")), 9, ka)]),
						P("div", Aa, [
							P("div", ja, [P("div", { style: L({
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
						c.value.aiStatusVisible ? (M(), F("div", Ma, R(c.value.aiStatusText), 1)) : B("", !0)
					], 64)) : B("", !0),
					P("div", Na, [P("span", { title: z(k)("sidebar.generation.aiCaptionTooltip", "AI caption generated by Florence-2") }, R(h.value.captionLabel), 9, Pa), P("div", Fa, [Ee(i, {
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
						onClick: Ze(re, ["stop"])
					}, {
						default: Oe(() => [De(R(o.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"]), Ee(i, {
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
						onClick: Ze(ie, ["stop"])
					}, {
						default: Oe(() => [De(R(a.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"])])]),
					P("div", {
						title: g.value ? z(k)("sidebar.generation.copyCaptionTooltip", "Click to copy caption") : z(k)("sidebar.generation.aiCaptionDisabled", "AI caption controls are disabled"),
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
					}, R(v.value), 13, Ia)
				], 2)) : B("", !0),
				h.value.lyrics ? (M(), F("div", {
					key: 6,
					style: L(f("#00BCD4", { emphasis: !1 }))
				}, [P("div", La, [P("span", null, R(z(k)("sidebar.generation.lyrics", "Lyrics")), 1)]), P("div", Ra, R(h.value.lyrics), 1)], 4)) : B("", !0),
				h.value.pipelineTabs.length ? (M(), F("div", {
					key: 7,
					style: L(f("#FF9800", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [
					P("div", za, R(z(k)("sidebar.generation.pipeline", "Generation Pipeline")), 1),
					P("div", Ba, [(M(!0), F(H, null, N(h.value.pipelineTabs, (e, t) => (M(), Te(i, {
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
						default: Oe(() => [De(R(e.label), 1)]),
						_: 2
					}, 1032, ["style", "onClick"]))), 128))]),
					(M(!0), F(H, null, N(h.value.pipelineTabs, (e, t) => je((M(), F("div", {
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
					}, [(M(!0), F(H, null, N(e.fields, (t) => (M(), F("div", {
						key: `${e.label}-${t.label}`,
						style: {
							display: "flex",
							"flex-direction": "column",
							gap: "2px",
							"min-width": "0"
						}
					}, [P("span", Va, R(t.label), 1), P("span", {
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
					}, R(t.value), 9, Ha)]))), 128))])), [[Ne, r.value === t]])), 128))
				], 4)) : B("", !0),
				h.value.modelGroups.length ? (M(), F("div", {
					key: 8,
					style: L(f("#9C27B0", {
						emphasis: !0,
						startAlpha: .18,
						endAlpha: .1
					}))
				}, [P("div", Ua, R(z(k)("sidebar.generation.modelBranches", "Model Branches")), 1), P("div", Wa, [(M(!0), F(H, null, N(h.value.modelGroups, (e) => (M(), F("div", {
					key: `model-group-${e.key}`,
					style: L(w(T(e.key), !0))
				}, [
					P("div", Ga, [P("div", { style: L({
						fontSize: "10px",
						fontWeight: "800",
						color: T(e.key),
						letterSpacing: "0.6px",
						textTransform: "uppercase"
					}) }, R(e.label), 5), P("span", { style: L({
						fontSize: "9px",
						fontWeight: "700",
						color: "#fff",
						background: d(T(e.key), .22),
						border: `1px solid ${d(T(e.key), .48)}`,
						borderRadius: "999px",
						padding: "2px 8px",
						letterSpacing: "0.4px",
						textTransform: "uppercase"
					}) }, R(e.loras?.length || 0) + " LoRA ", 5)]),
					P("div", Ka, [t[4] ||= P("div", { style: {
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
					}, R(e.model || "-"), 9, qa)]),
					e.loras?.length ? (M(), F("div", Ja, [P("div", Ya, R(z(k)("sidebar.generation.loraStack", "LoRA Stack")), 1), P("div", Xa, [(M(!0), F(H, null, N(e.loras, (t, n) => (M(), F("div", {
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
					}, R(t), 9, Za))), 128))])])) : B("", !0)
				], 4))), 128))])], 4)) : B("", !0),
				(M(!0), F(H, null, N(S.value, (e) => (M(), F("div", {
					key: e.key,
					style: L(f(e.accent, { emphasis: e.emphasis }))
				}, [P("div", { style: L({
					fontSize: "11px",
					fontWeight: "600",
					color: e.accent,
					textTransform: "uppercase",
					letterSpacing: "0.5px",
					marginBottom: "10px"
				}) }, R(e.title), 5), P("div", Qa, [(M(!0), F(H, null, N(e.fields, (t) => (M(), F(H, { key: `${e.key}-${t.label}` }, [P("div", {
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
					title: z(k)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
				}, R(z(k)("sidebar.generation.override", "override")), 13, eo)) : B("", !0)], 8, $a), P("div", {
					title: `${t.label}: ${t.value}`,
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.95))",
						"word-break": "break-word",
						"white-space": "pre-wrap",
						cursor: "pointer"
					},
					onClick: (e) => E(t.value, e.currentTarget)
				}, R(t.value), 9, to)], 64))), 128))])], 4))), 128)),
				h.value.notesFields.length ? (M(), F("div", {
					key: 9,
					style: L(f("#4CAF50", { emphasis: !1 }))
				}, [P("div", no, R(z(k)("sidebar.generation.notes", "Notes")), 1), (M(!0), F(H, null, N(h.value.notesFields, (e) => (M(), F("div", {
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
				}, R(e.value), 9, ro))), 128))], 4)) : B("", !0),
				(M(!0), F(H, null, N(h.value.customInfoBlocks, (e) => (M(), F("div", {
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
					onClick: (t) => E(e.content, t.currentTarget)
				}, R(e.content), 9, io)], 4))), 128)),
				h.value.ttsInstruction ? (M(), F("div", {
					key: 10,
					style: L(f("#26A69A", { emphasis: !1 }))
				}, [P("div", ao, [P("span", null, R(z(k)("sidebar.generation.ttsInstruction", "TTS Instruction")), 1)]), P("div", {
					title: z(k)("action.clickToCopy", "Click to copy"),
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: t[2] ||= (e) => E(h.value.ttsInstruction, e.currentTarget)
				}, R(h.value.ttsInstruction), 9, oo)], 4)) : B("", !0),
				h.value.seed !== null && h.value.seed !== void 0 && h.value.seed !== "" ? (M(), F("div", {
					key: 11,
					style: L(p())
				}, [P("div", so, R(z(k)("sidebar.generation.seed", "SEED")), 1), P("div", {
					title: z(k)("sidebar.generation.copySeedTooltip", "Click to copy seed: {seed}", { seed: h.value.seed }),
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
					onClick: t[3] ||= (e) => E(h.value.seed, e.currentTarget, "rgba(76, 175, 80, 0.4)")
				}, R(h.value.seed), 9, co)], 4)) : B("", !0),
				h.value.inputFiles.length ? (M(), F("div", {
					key: 12,
					style: L(f("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [P("div", {
					title: z(k)("tooltip.generationInputs", "Input files used in generation"),
					style: {
						"font-size": "11px",
						"font-weight": "600",
						color: "#4CAF50",
						"text-transform": "uppercase",
						"letter-spacing": "0.5px",
						"margin-bottom": "8px"
					}
				}, R(z(k)("sidebar.generation.sourceFiles", "Source Files")), 9, lo), P("div", uo, [(M(!0), F(H, null, N(h.value.inputFiles, (e) => (M(), Te(na, {
					key: e.id,
					"input-file": e
				}, null, 8, ["input-file"]))), 128))])], 4)) : B("", !0)
			]));
		};
	}
}, po = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, mo = /^[0-9a-f]{20,}$/i;
function ho(...e) {
	for (let t of e) {
		let e = String(t || "").trim();
		if (e) return e;
	}
	return "";
}
function go(e) {
	let t = String(e || "").trim();
	return !!t && (po.test(t) || mo.test(t));
}
function _o(e) {
	return String(e?.type || e?.class_type || e?.comfyClass || e?.classType || "").trim();
}
function vo(e) {
	return ho(e?.properties?.subgraph_name, e?.title, e?.properties?.title, e?.properties?.name, e?.properties?.label, e?.name, e?.subgraph?.name, e?.subgraph_instance?.name);
}
function yo(e) {
	let t = _o(e), n = vo(e);
	return n && (!t || go(t) || n !== t) ? n : t && !go(t) ? t : n || (t ? "Subgraph" : String(e?.id || "Node").trim() || "Node");
}
function bo(e) {
	let t = _o(e);
	return t && !go(t) ? t : t ? "Subgraph" : "Node";
}
//#endregion
//#region ui/components/sidebar/utils/minimap.ts
var xo = 6, So = 1, Co = 8, wo = 74, To = 42, Eo = [
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
], Do = (e, t, n) => {
	let r = Number(e);
	return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
}, Oo = (e, t = !1) => {
	let n = String(e || "").toUpperCase();
	return n.includes("IMAGE") ? "rgba(145,198,99,0.9)" : n.includes("LATENT") ? "rgba(89,178,118,0.9)" : n.includes("MODEL") ? "rgba(112,155,255,0.9)" : n.includes("CONDITIONING") ? "rgba(191,123,226,0.9)" : n.includes("CLIP") ? "rgba(220,178,77,0.9)" : n.includes("VAE") ? "rgba(72,184,214,0.9)" : n.includes("MASK") ? "rgba(190,190,190,0.88)" : n.includes("STRING") || n.includes("TEXT") ? "rgba(230,230,230,0.86)" : n.includes("INT") || n.includes("FLOAT") || n.includes("NUMBER") ? "rgba(130,210,220,0.88)" : t ? "rgba(170,220,255,0.82)" : "rgba(255,255,255,0.72)";
}, ko = (e, t, n) => {
	let r = String(t || "").replace(/\s+/g, " ").trim(), i = Math.max(1, Number(n) || 1);
	if (!r || e.measureText(r).width <= i) return r;
	let a = r;
	for (; a.length > 3 && e.measureText(`${a}...`).width > i;) a = a.slice(0, -1);
	return a.length > 3 ? `${a}...` : r.slice(0, 3);
};
function Ao(e, t, n = null) {
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
	}, a = i.expandSubgraphs === !1 ? t : jo(t), o = Array.isArray(a?.nodes) ? a.nodes : [], s = Array.isArray(a?.groups) && a.groups || Array.isArray(a?.extra?.groups) && a.extra.groups || Array.isArray(a?.extra?.groupNodes) && a.extra.groupNodes || Array.isArray(a?.extra?.group_nodes) && a.extra.group_nodes || [], c = Array.isArray(a?.links) && a.links || Array.isArray(a?.extra?.links) && a.extra.links || [], l = Math.max(1, e.clientWidth || e.width || 1), u = Math.max(1, e.clientHeight || e.height || 1);
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
		for (let [e, t] of Eo) if (n.includes(e)) return t;
		let r = 0;
		for (let e = 0; e < n.length; e += 1) r = r * 31 + n.charCodeAt(e) | 0;
		return `hsl(${Math.abs(r) % 360} 42% 42%)`;
	}, p = (e) => {
		let t = [], n = e?.inputs && typeof e.inputs == "object" && !Array.isArray(e.inputs) ? e.inputs : null;
		if (n) {
			for (let [e, r] of Object.entries(n)) if (!(Array.isArray(r) || r && typeof r == "object") && (t.push([e, r]), t.length >= 3)) return t;
		}
		let r = Array.isArray(e?.widgets_values) ? e.widgets_values : [], i = Array.isArray(e?.widgets) ? e.widgets : [], a = Array.isArray(e?.inputs) ? e.inputs : [], o = a.filter((e) => e?.widget === !0 || e?.widget && typeof e.widget == "object" || typeof e?.widget == "string" && e.widget.trim()), s = a.filter((e) => e?.link == null && zo(e?.type)), c = (o.length ? o : s.length ? s : a).map((e) => String(e?.label || e?.localized_name || e?.name || e?.widget?.name || e?.widget?.label || "").trim());
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
			label: yo(e).replace(/\s+/g, " ").trim()
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
	let S = Math.max(1, b - v), C = Math.max(1, x - y), w = v + S / 2, T = y + C / 2, E = i.view && typeof i.view == "object" ? i.view : Object.create(null), ee = Do(E.zoom ?? 1, So, Co), te = Math.max(1, S / ee), ne = Math.max(1, C / ee), re = te / 2, ie = ne / 2, ae = te >= S ? w : Do(E.centerX ?? w, v + re, b - re), oe = ne >= C ? T : Do(E.centerY ?? T, y + ie, x - ie), se = ae - re, ce = oe - ie, D = xo, O = Math.min((l - D * 2) / te, (u - D * 2) / ne), le = E.hoveredNodeId !== null && E.hoveredNodeId !== void 0 ? String(E.hoveredNodeId) : null;
	r.clearRect(0, 0, l, u), r.fillStyle = "rgba(0,0,0,0.22)", r.fillRect(0, 0, l, u);
	let ue = (e, t) => ({
		x: D + (e - se) * O,
		y: D + (t - ce) * O
	}), de = (e, t) => ({
		x: Do(se + (Number(e) - D) / O, v, b),
		y: Do(ce + (Number(t) - D) / O, y, x)
	}), fe = (e) => ({
		x: D + (e.x - se) * O,
		y: D + (e.y - ce) * O,
		w: Math.max(1, e.w * O),
		h: Math.max(1, e.h * O)
	}), pe = (e) => Math.max(10, Math.min(24, Math.floor(Number(e) * .2))), me = (e, t, n) => {
		let r = fe(e), i = pe(r.h), a = n === "output" ? e.outputs : e.inputs, o = Math.max(1, Array.isArray(a) ? a.length : Number(e[`${n}Count`]) || 0), s = Do(t, 0, Math.max(0, o - 1));
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
	} : null, k = (e) => {
		let t = String(e || "").toUpperCase();
		return t.includes("IMAGE") ? "rgba(145,198,99,0.38)" : t.includes("LATENT") ? "rgba(89,178,118,0.38)" : t.includes("MODEL") ? "rgba(112,155,255,0.38)" : t.includes("CONDITIONING") ? "rgba(191,123,226,0.38)" : t.includes("CLIP") ? "rgba(220,178,77,0.38)" : t.includes("VAE") ? "rgba(72,184,214,0.38)" : t.includes("MASK") ? "rgba(190,190,190,0.36)" : "rgba(255,255,255,0.2)";
	}, ge = () => {
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
				r.strokeStyle = k(t?.type), r.beginPath(), r.moveTo(l.x, l.y), r.bezierCurveTo(l.x + d, l.y, u.x - d, u.y, u.x, u.y), r.stroke();
			}
			r.restore();
		}
	}, A = (e) => {
		let { x: t, y: n, w: a, h: o } = fe(e), s = e.kind === "node", c = e.kind === "group", l = !!e.bypassed, u = !!e.errored, f = c ? .18 : l && i.renderBypassState ? .14 : .62, p = c ? .55 : l && i.renderBypassState ? .32 : .8, m = d(e.fill, f), h = d(e.stroke, p), g = s && i.showNodeLabels && a >= wo && o >= To, _ = Math.max(2, Math.min(g ? 7 : 8, Math.floor(Math.min(a, o) * .08))), v = s ? pe(o) : 0;
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
				r.fillStyle = Oo(e.inputs?.[i]?.type, !1), r.beginPath(), r.arc(t, n, g ? 3 : 2.2, 0, Math.PI * 2), r.fill(), r.stroke();
			}
			for (let n = 0; n < i; n += 1) {
				let i = me(e, n, "output");
				r.fillStyle = Oo(e.outputs?.[n]?.type, !0), r.beginPath(), r.arc(t + a, i, g ? 3 : 2.2, 0, Math.PI * 2), r.fill(), r.stroke();
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
				s && r.fillText(ko(r, s, i), t + 7, me(e, a, "input") + n * .35, i);
			}
			for (let o = 0; o < Math.min(8, e.outputs?.length || 0); o += 1) {
				let s = e.outputs[o], c = String(s?.label || s?.localized_name || s?.name || "").trim();
				if (!c) continue;
				let l = ko(r, c, i);
				r.fillText(l, t + a - 7 - Math.min(i, r.measureText(l).width), me(e, o, "output") + n * .35, i);
			}
			r.restore();
		}
	};
	for (let e of m.filter((e) => e.kind === "group")) A(e);
	ge();
	for (let e of m.filter((e) => e.kind === "node")) A(e);
	if (i.showViewport) try {
		let e = Ce();
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
function jo(e) {
	if (!e || typeof e != "object") return e;
	let t = Array.isArray(e.nodes) ? e.nodes.filter(Boolean) : [], n = Mo(e);
	if (!t.length) return e;
	let r = [], i = Array.isArray(e.links) ? [...e.links] : [], a = [...Array.isArray(e.groups) ? e.groups : [], ...Array.isArray(e.extra?.groups) ? e.extra.groups : []];
	for (let e of t) {
		r.push(e);
		let t = No(e, n);
		if (!t || !Array.isArray(t.nodes) || !t.nodes.length) continue;
		let o = Fo(e, jo(t));
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
function Mo(e) {
	let t = [
		...Array.isArray(e?.definitions?.subgraphs) ? e.definitions.subgraphs : [],
		...Array.isArray(e?.subgraphs) ? e.subgraphs : [],
		...Array.isArray(e?.rootGraph?.subgraphs) ? e.rootGraph.subgraphs : []
	], n = /* @__PURE__ */ new Map();
	for (let e of t) for (let t of Po(e)) t != null && n.set(String(t), e);
	return n;
}
function No(e, t) {
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
function Po(e) {
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
function Fo(e, t) {
	let n = String(e?.id ?? e?.ID ?? ""), r = Lo(e?.pos) || [0, 0], i = Ro(e?.size) || [260, 180], a = t.nodes.filter(Boolean), o = Io(a), s = Math.min(22, Math.max(8, i[0] * .08)), c = Math.min(34, Math.max(18, i[1] * .18)), l = Math.min(18, Math.max(8, i[1] * .08)), u = Math.max(40, i[0] - s * 2), d = Math.max(34, i[1] - c - l), f = Math.min(1, u / o.width, d / o.height), p = r[0] + s + (u - o.width * f) / 2, m = r[1] + c + (d - o.height * f) / 2, h = a.map((r) => {
		let i = Lo(r?.pos) || [o.minX, o.minY], a = Ro(r?.size) || [140, 60];
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
function Io(e) {
	let t = Infinity, n = Infinity, r = -Infinity, i = -Infinity;
	for (let a of e) {
		let e = Lo(a?.pos);
		if (!e) continue;
		let o = Ro(a?.size) || [140, 60];
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
function Lo(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.x ?? e.left ?? null, n = e[1] ?? e[1] ?? e.y ?? e.top ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function Ro(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.w ?? e.width ?? null, n = e[1] ?? e[1] ?? e.h ?? e.height ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function zo(e) {
	if (Array.isArray(e)) return !0;
	let t = String(e || "").trim().toUpperCase();
	return t === "INT" || t === "FLOAT" || t === "STRING" || t === "BOOLEAN" || t === "BOOL" || t === "COMBO" || t === "ENUM";
}
function Bo(e, t = null) {
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
var Vo = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "var(--comfy-menu-bg, rgba(0,0,0,0.2))",
		border: "1px solid var(--border-color, rgba(255,255,255,0.14))",
		"border-radius": "8px",
		padding: "12px",
		"min-width": "300px"
	}
}, Ho = { style: {
	"font-size": "13px",
	"font-weight": "600",
	color: "var(--fg-color, #eaeaea)",
	"margin-bottom": "12px",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px"
} }, Uo = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "8px",
	"margin-bottom": "10px"
} }, Wo = { style: {
	padding: "4px 9px",
	"border-radius": "999px",
	background: "rgba(33,150,243,0.14)",
	border: "1px solid rgba(33,150,243,0.30)",
	"font-size": "11px",
	"font-weight": "700",
	color: "#90CAF9",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Go = {
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
}, Ko = { style: {
	display: "grid",
	"grid-template-columns": "repeat(3, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, qo = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, Jo = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.55)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Yo = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, Xo = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, Zo = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.55)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Qo = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, $o = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, es = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.55)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, ts = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, ns = {
	key: 0,
	class: "mjr-workflow-tree-wrap"
}, rs = { class: "mjr-section-title" }, is = { class: "mjr-workflow-tree-node" }, as = { class: "mjr-workflow-tree-node-name" }, os = {
	key: 0,
	class: "mjr-workflow-tree-node-type"
}, ss = { class: "mjr-menu-item-hint" }, cs = {
	key: 0,
	class: "mjr-section-hint"
}, ls = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px",
	"margin-top": "8px"
} }, us = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"align-items": "center"
} }, ds = {
	key: 1,
	style: {
		display: "grid",
		"grid-template-columns": "repeat(auto-fit, minmax(180px, 1fr))",
		gap: "8px",
		"align-items": "stretch",
		"margin-top": "10px",
		"margin-bottom": "10px"
	}
}, fs = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "2px",
	"min-width": "0"
} }, ps = { style: {
	"font-size": "13px",
	"font-weight": "600"
} }, ms = { style: {
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, hs = { style: {
	display: "flex",
	gap: "10px",
	"align-items": "stretch",
	"margin-top": "10px"
} }, gs = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	gap: "10px",
	"margin-top": "8px",
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, _s = ["open"], vs = { style: {
	cursor: "pointer",
	color: "var(--mjr-muted, rgba(255,255,255,0.65))",
	"font-size": "12px",
	"user-select": "none"
} }, ys = { style: {
	background: "rgba(0,0,0,0.5)",
	padding: "10px",
	"border-radius": "6px",
	"font-size": "11px",
	overflow: "auto",
	"max-height": "180px",
	margin: "10px 0 0 0",
	color: "#90CAF9",
	"font-family": "'Consolas', 'Monaco', monospace"
} }, bs = 1, xs = 8, Ss = 250, Cs = {
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
				labelKey: "workflowSidebar.sizeCompact",
				fallback: "Compact",
				height: 120
			},
			{
				key: "comfortable",
				labelKey: "workflowSidebar.sizeComfort",
				fallback: "Comfort",
				height: 160
			},
			{
				key: "expanded",
				labelKey: "workflowSidebar.sizeExpanded",
				fallback: "Expanded",
				height: 220
			}
		]), a = I(null), o = I(!1), s = I(!1), c = I(C()), l = I({ ...r }), u = I("crosshair"), d = I(""), f = null, p = null, m = null;
		function g(e, t, n) {
			let r = Number(e);
			return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
		}
		function _(e) {
			!e || typeof e != "object" || (l.value = {
				...l.value,
				zoom: g(e.zoom ?? l.value.zoom, bs, xs),
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
		function S(e) {
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
		function C() {
			try {
				let e = q?.()?.workflowMinimap;
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
					let e = q();
					e.workflowMinimap = {
						...e.workflowMinimap,
						...r
					}, J(e), localStorage?.removeItem?.(h);
				} catch (e) {
					console.debug?.(e);
				}
				return r;
			} catch {
				return { ...n };
			}
		}
		function w(e) {
			try {
				let t = q();
				t.workflowMinimap = {
					...t.workflowMinimap,
					...e
				}, J(t);
			} catch (e) {
				console.debug?.(e);
			}
		}
		let T = V(() => {
			let e = x(t.asset), n = S(t.asset);
			return !e && !n ? null : e || Bo(n);
		}), E = V(() => t.asset?.has_generation_data ? "Complete" : "Partial"), ee = V(() => T.value ? JSON.stringify(T.value, null, 2) : "");
		function te(e, t) {
			let n = e?.id ?? e?.key ?? t + 1;
			return String(e?.title || e?._meta?.title || e?.type || e?.class_type || e?.name || `Node ${n}`);
		}
		function ne(e) {
			return String(e?.type || e?.class_type || e?.name || "").trim();
		}
		let re = V(() => (Array.isArray(T.value?.nodes) ? T.value.nodes : []).slice(0, Ss).map((e, t) => {
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
		})), ie = V(() => Math.max(0, Number(ae.value.nodes || 0) - re.value.length)), ae = V(() => {
			let e = T.value;
			return e ? {
				nodes: Array.isArray(e?.nodes) ? e.nodes.length : 0,
				links: Array.isArray(e?.links) && e.links.length || Array.isArray(e?.extra?.links) && e.extra.links.length || 0,
				groups: Array.isArray(e?.groups) && e.groups.length || Array.isArray(e?.extra?.groups) && e.extra.groups.length || Array.isArray(e?.extra?.groupNodes) && e.extra.groupNodes.length || Array.isArray(e?.extra?.group_nodes) && e.extra.group_nodes.length || 0,
				source: e?.extra?.synthetic ? k("workflowSidebar.sourceSynthetic", "Synthetic") : k("workflowSidebar.sourceEmbedded", "Embedded")
			} : {
				nodes: 0,
				links: 0,
				groups: 0,
				source: ""
			};
		}), oe = V(() => {
			let e = String(c.value?.size || "comfortable");
			return i.find((t) => t.key === e) || i[1];
		}), se = V(() => `${oe.value.height}px`), ce = V(() => [
			{
				key: "showNodeLabels",
				label: k("workflowSidebar.nodeLabels", "Node Labels"),
				iconClass: "pi pi-tag"
			},
			{
				key: "nodeColors",
				label: k("workflowSidebar.nodeColors", "Node Colors"),
				iconClass: "pi pi-palette"
			},
			{
				key: "showLinks",
				label: k("workflowSidebar.showLinks", "Show Links"),
				iconClass: "pi pi-share-alt"
			},
			{
				key: "showGroups",
				label: k("workflowSidebar.showFramesGroups", "Show Frames/Groups"),
				iconClass: "pi pi-th-large"
			},
			{
				key: "renderBypassState",
				label: k("workflowSidebar.renderBypassState", "Render Bypass State"),
				iconClass: "pi pi-ban"
			},
			{
				key: "renderErrorState",
				label: k("workflowSidebar.renderErrorState", "Render Error State"),
				iconClass: "pi pi-exclamation-triangle"
			},
			{
				key: "showViewport",
				label: k("workflowSidebar.showViewport", "Show Viewport"),
				iconClass: "pi pi-window-maximize"
			}
		]);
		function D() {
			let e = a.value, t = T.value;
			if (!e || !t) return;
			let n = Math.max(1, e.clientWidth || 320), r = Math.max(1, e.clientHeight || 120), i = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
			e.width = Math.floor(n * i), e.height = Math.floor(r * i);
			let o = e.getContext("2d");
			o && o.setTransform(i, 0, 0, i, 0, 0), p = Ao(e, t, {
				...c.value,
				view: l.value
			}) || null, _(p?.resolvedView);
		}
		function O(e) {
			ge(e);
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
		function ue(e) {
			let t = le(e);
			return !t || !p?.canvasToWorld ? null : {
				local: t,
				world: p.canvasToWorld(t.x, t.y)
			};
		}
		function de(e) {
			let t = le(e), n = t && p?.hitTestNode ? p.hitTestNode(t.x, t.y) : null, r = n?.id !== null && n?.id !== void 0 ? String(n.id) : null, i = l.value.hoveredNodeId !== null && l.value.hoveredNodeId !== void 0 ? String(l.value.hoveredNodeId) : null;
			d.value = n?.label || "", r !== i && (l.value = {
				...l.value,
				hoveredNodeId: r
			}, D());
		}
		function fe(e) {
			e && (O(e), l.value = {
				...l.value,
				centerX: Number(e.x),
				centerY: Number(e.y)
			}, D());
		}
		function pe(e) {
			if (Number(e?.button ?? 0) !== 0) return;
			let t = ue(e);
			t && (m = e.pointerId ?? 1, u.value = "grabbing", a.value?.setPointerCapture?.(m), fe(t.world), de(e), e.preventDefault?.(), e.stopPropagation?.());
		}
		function me(e) {
			if (m !== null && e.pointerId === m) {
				let t = ue(e);
				t && fe(t.world), e.preventDefault?.(), e.stopPropagation?.();
				return;
			}
			de(e);
		}
		function he(e) {
			m !== null && e?.pointerId === m && (a.value?.releasePointerCapture?.(m), m = null, u.value = "crosshair"), e?.type === "pointerleave" && (d.value = "", l.value.hoveredNodeId !== null && (l.value = {
				...l.value,
				hoveredNodeId: null
			}, D()));
		}
		function A(e) {
			let t = ue(e), n = p?.resolvedView;
			if (!t || !n) return;
			let r = g(Number(e?.deltaY) || 0, -240, 240), i = Math.exp(-r * .0025), a = g((Number(l.value.zoom) || 1) * i, bs, xs);
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
			}, D(), de(e), e.preventDefault?.(), e.stopPropagation?.();
		}
		function _e(e) {
			let t = ue(e);
			v(), t && O(t.world), D(), e.preventDefault?.(), e.stopPropagation?.();
		}
		function ve(e) {
			c.value = {
				...c.value,
				[e]: !c.value?.[e]
			}, w(c.value);
		}
		function ye(e) {
			i.some((t) => t.key === e) && (c.value = {
				...c.value,
				size: e
			}, w(c.value));
		}
		return Ae(() => {
			a.value && typeof ResizeObserver == "function" && (f = new ResizeObserver(() => D()), f.observe(a.value)), D();
		}), we(T, () => {
			v(), D();
		}, { flush: "post" }), we(c, () => {
			D();
		}, {
			deep: !0,
			flush: "post"
		}), we(o, () => {
			D();
		}, { flush: "post" }), ke(() => {
			try {
				f?.disconnect?.();
			} catch (e) {
				console.debug?.(e);
			}
			f = null, m = null;
		}), (e, t) => {
			let n = Qe("MTree"), r = Qe("MButton");
			return T.value ? (M(), F("div", Vo, [
				P("div", Ho, R(z(k)("workflowSidebar.comfyWorkflow", "ComfyUI Workflow")), 1),
				P("div", Uo, [P("div", Wo, R(E.value), 1), ae.value.source ? (M(), F("div", Go, R(ae.value.source), 1)) : B("", !0)]),
				P("div", Ko, [
					P("div", qo, [P("div", Jo, R(z(k)("workflowSidebar.nodes", "Nodes")), 1), P("div", Yo, R(ae.value.nodes), 1)]),
					P("div", Xo, [P("div", Zo, R(z(k)("workflowSidebar.links", "Links")), 1), P("div", Qo, R(ae.value.links), 1)]),
					P("div", $o, [P("div", es, R(z(k)("workflowSidebar.groups", "Groups")), 1), P("div", ts, R(ae.value.groups), 1)])
				]),
				re.value.length ? (M(), F("div", ns, [
					P("div", rs, R(z(k)("workflowSidebar.workflowNodes", "Workflow Nodes")), 1),
					Ee(n, {
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
						default: Oe(({ node: e }) => [P("span", is, [
							P("span", as, R(e.label), 1),
							e.data?.type ? (M(), F("span", os, R(e.data.type), 1)) : B("", !0),
							P("span", ss, "#" + R(e.data?.id), 1)
						])]),
						_: 1
					}, 8, ["value"]),
					ie.value ? (M(), F("div", cs, R(z(k)("workflowSidebar.moreNodes", "+{count} more nodes", { count: ie.value })), 1)) : B("", !0)
				])) : B("", !0),
				P("div", ls, [P("div", us, [(M(!0), F(H, null, N(z(i), (e) => (M(), Te(r, {
					key: e.key,
					type: "button",
					severity: "secondary",
					text: "",
					rounded: "",
					title: z(k)("workflowSidebar.minimapSizeTitle", "{label} minimap", { label: z(k)(e.labelKey, e.fallback) }),
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
					onClick: (t) => ye(e.key)
				}, {
					default: Oe(() => [De(R(z(k)(e.labelKey, e.fallback)), 1)]),
					_: 2
				}, 1032, [
					"title",
					"style",
					"onClick"
				]))), 128))]), Ee(r, {
					type: "button",
					class: "mjr-btn mjr-icon-btn",
					severity: "secondary",
					text: "",
					rounded: "",
					title: z(k)("tooltip.minimapSettings", "Minimap settings"),
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
					default: Oe(() => [...t[2] ||= [P("i", { class: "pi pi-sliders-h" }, null, -1)]]),
					_: 1
				}, 8, ["title"])]),
				o.value ? (M(), F("div", ds, [(M(!0), F(H, null, N(ce.value, (e) => (M(), Te(r, {
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
					onClick: (t) => ve(e.key)
				}, {
					default: Oe(() => [
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
							class: Ve(e.iconClass),
							style: {
								"font-size": "18px",
								opacity: "0.9",
								width: "18px"
							}
						}, null, 2),
						P("div", fs, [P("div", ps, R(e.label), 1), P("div", ms, R(c.value?.[e.key] ? z(k)("state.on", "on") : z(k)("state.off", "off")), 1)])
					]),
					_: 2
				}, 1032, ["style", "onClick"]))), 128))])) : B("", !0),
				P("div", hs, [P("canvas", {
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
					onPointerdown: pe,
					onPointermove: me,
					onPointerup: he,
					onPointercancel: he,
					onPointerleave: he,
					onWheel: A,
					onDblclick: _e
				}, null, 36)]),
				P("div", gs, [P("span", null, R(d.value || z(k)("workflowSidebar.minimapHint", "Click/drag to navigate - wheel to zoom")), 1), P("span", null, R(Math.round((l.value.zoom || 1) * 100)) + "% - " + R(z(k)(oe.value.labelKey, oe.value.fallback)), 1)]),
				P("details", {
					open: s.value,
					style: { "margin-top": "10px" },
					onToggle: t[1] ||= (e) => s.value = e.target.open
				}, [P("summary", vs, R(z(k)("workflowSidebar.showRawJson", "Show raw JSON")), 1), P("pre", ys, R(ee.value), 1)], 40, _s)
			])) : B("", !0);
		};
	}
};
//#endregion
export { Rr as A, or as B, Gr as C, Vr as D, Ir as E, hr as F, q as G, Xn as H, mr as I, bt as J, J as K, wr as L, Or as M, Tr as N, Pr as O, cr as P, Sr as R, Kr as S, Dr as T, Qt as U, Zn as V, Y as W, ct as Y, Zr as _, _o as a, Yr as b, Xi as c, ci as d, ui as f, oi as g, ai as h, yo as i, Br as j, zr as k, Di as l, ei as m, Ao as n, bo as o, li as p, yt as q, Bo as r, fo as s, Cs as t, bi as u, qr as v, Fr as w, Hr as x, Jr as y, sr as z };
