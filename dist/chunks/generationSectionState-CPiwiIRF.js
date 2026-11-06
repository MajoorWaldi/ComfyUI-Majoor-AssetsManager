import { $ as e, $t as t, B as n, Bn as r, Bt as i, Cn as a, Ct as o, Dt as s, Et as c, Fn as l, G as u, H as d, Ht as f, J as p, K as m, Kt as h, L as g, Mt as _, Nt as v, On as y, Pt as b, Qt as x, Rn as S, St as C, Tt as w, U as ee, Ut as T, V as te, W as E, Wt as D, X as O, Y as k, Z as ne, _n as re, _t as ie, an as A, ar as j, bt as M, en as ae, et as oe, gt as se, hn as ce, ht as le, in as N, jt as ue, k as de, kt as fe, mt as pe, nn as me, nt as he, pr as ge, pt as _e, q as ve, rn as ye, tn as be, tt as xe, vt as Se, wt as Ce, xn as we, xt as Te, yn as Ee, yt as De } from "./client-Cpp57JNr.js";
import { n as P, t as F } from "./config-BFDzOF1N.js";
// ui/utils/events.ts
function Oe(e, t, { target: n = null, warnPrefix: r = "[Majoor]" } = {}) {
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
// ui/app/settings/settingsUtils.ts
var I = (e, t) => {
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
}, L = (e, t) => {
	let n = Number(e);
	return Number.isFinite(n) ? n : Number(t);
}, ke = (e, t, n) => {
	let r = typeof e == "string" ? e.trim() : String(e ?? "");
	return t.includes(r) ? r : n;
}, Ae = (e) => e === "__proto__" || e === "prototype" || e === "constructor", je = (e, t) => {
	let n = { ...e };
	return !t || typeof t != "object" || Object.keys(t).forEach((r) => {
		if (Ae(r)) return;
		let i = t[r];
		i && typeof i == "object" && !Array.isArray(i) ? n[r] = je(e[r] || {}, i) : i !== void 0 && (n[r] = i);
	}), n;
}, Me = Object.freeze({
	small: 80,
	medium: 120,
	large: 180
}), Ne = Object.freeze([
	"small",
	"medium",
	"large"
]), Pe = (e, t) => Math.max(60, Math.min(600, Math.round(L(e, t)))), Fe = (e = {}) => {
	let t = Number(e?.minSize);
	if (Number.isFinite(t)) return Pe(t, P.GRID_MIN_SIZE);
	let n = ke(String(e?.minSizePreset || "").toLowerCase(), Ne, "");
	return n ? Me[n] : Pe(e?.minSize, P.GRID_MIN_SIZE);
}, Ie = (e = {}) => Pe(e?.minSize, P.FEED_GRID_MIN_SIZE), Le = (e) => {
	let t = Math.round(L(e, P.GRID_MIN_SIZE));
	return t <= 100 ? "small" : t >= 150 ? "large" : "medium";
}, Re = async (e, t = "Majoor", n = {}) => {
	let r = He();
	if (r && typeof r.alert == "function") try {
		await r.alert({
			title: String(t || "Majoor"),
			message: String(e || "")
		});
		return;
	} catch (e) {
		console.debug?.(e);
	}
	let i = Ue();
	if (i) try {
		let n = String(e || "");
		typeof i.info == "function" ? i.info(String(t || "Majoor"), {
			description: n,
			duration: 5e3,
			closable: !0
		}) : typeof i.addAlert == "function" ? i.addAlert(n) : typeof i.add == "function" && i.add({
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
		let n = We();
		if (n) try {
			n.show(Ge(e, t));
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
	let a = Xe();
	if (a) return new Promise((n) => {
		let r = new a();
		et(r);
		let i = R("div", { style: {
			display: "flex",
			flexDirection: "column",
			gap: "18px",
			padding: "18px 20px 18px 20px"
		} }, [
			R("div", { style: {
				display: "flex",
				alignItems: "center",
				justifyContent: "flex-start"
			} }, [R("div", {
				textContent: t,
				style: {
					fontWeight: "700",
					fontSize: "30px",
					color: "rgba(255,255,255,0.96)",
					lineHeight: "1.2"
				}
			})]),
			R("div", {
				textContent: String(e || ""),
				style: {
					fontSize: "22px",
					color: "rgba(255,255,255,0.86)",
					whiteSpace: "pre-wrap",
					lineHeight: "1.45"
				}
			}),
			R("div", { style: {
				display: "flex",
				justifyContent: "flex-end",
				gap: "10px"
			} }, [R("button", {
				textContent: N("dialog.confirm", "Confirm"),
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
			r.show(i), setTimeout(() => tt(r), 0);
		} catch {
			try {
				window.alert(e);
			} catch (e) {
				console.debug?.(e);
			}
			n();
		}
	});
	try {
		window.alert(e);
	} catch (e) {
		console.debug?.(e);
	}
}, ze = async (e, t = "Majoor") => {
	let n = He();
	if (n) try {
		let r = {
			title: String(t || N("dialog.confirm", "Confirm")),
			message: String(e || "")
		};
		return !!(typeof n.confirm == "function" && await n.confirm(r));
	} catch (e) {
		console.debug?.(e);
	}
	let r = Xe();
	if (!r) try {
		return window.confirm(e);
	} catch {
		return !1;
	}
	return new Promise((n) => {
		let i = new r();
		et(i);
		let a = (e) => {
			try {
				i.close();
			} catch (e) {
				console.debug?.(e);
			}
			n(!!e);
		}, o = R("div", { style: {
			display: "flex",
			flexDirection: "column",
			gap: "18px",
			padding: "18px 20px 18px 20px"
		} }, [
			R("div", { style: {
				display: "flex",
				alignItems: "center",
				justifyContent: "flex-start"
			} }, [R("div", {
				textContent: t,
				style: {
					fontWeight: "700",
					fontSize: "30px",
					color: "rgba(255,255,255,0.96)",
					lineHeight: "1.2"
				}
			})]),
			R("div", {
				textContent: String(e || ""),
				style: {
					fontSize: "22px",
					color: "rgba(255,255,255,0.86)",
					whiteSpace: "pre-wrap",
					lineHeight: "1.45"
				}
			}),
			R("div", { style: {
				display: "flex",
				justifyContent: "flex-end",
				gap: "10px"
			} }, [R("button", {
				textContent: N("dialog.cancel", "Cancel"),
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
			}), R("button", {
				textContent: N("dialog.confirm", "Confirm"),
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
			i.show(o), setTimeout(() => tt(i), 0);
		} catch {
			try {
				n(!!window.confirm(e));
			} catch {
				n(!1);
			}
		}
	});
}, Be = async (e, t = "", n = "Majoor") => {
	let r = He();
	if (r) try {
		let i = {
			title: String(n || N("dialog.prompt", "Prompt")),
			message: String(e || ""),
			defaultValue: String(t ?? "")
		}, a = typeof r.prompt == "function" ? await r.prompt(i) : null;
		return a == null ? null : String(a);
	} catch (e) {
		console.debug?.(e);
	}
	let i = Xe();
	if (!i) try {
		return window.prompt(e, t);
	} catch {
		return null;
	}
	return new Promise((r) => {
		let a = new i();
		et(a);
		let o = (e) => {
			try {
				a.close();
			} catch (e) {
				console.debug?.(e);
			}
			r(e ?? null);
		}, s = R("input", {
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
		}), c = R("div", { style: {
			display: "flex",
			flexDirection: "column",
			gap: "12px",
			padding: "16px"
		} }, [
			R("div", {
				textContent: n,
				style: {
					fontWeight: "600",
					fontSize: "14px",
					color: "rgba(255,255,255,0.95)"
				}
			}),
			R("div", {
				textContent: String(e || ""),
				style: {
					fontSize: "13px",
					color: "rgba(255,255,255,0.80)",
					whiteSpace: "pre-wrap",
					lineHeight: "1.4"
				}
			}),
			s,
			R("div", { style: {
				display: "flex",
				justifyContent: "flex-end",
				gap: "10px"
			} }, [R("button", {
				textContent: N("dialog.cancel", "Cancel"),
				onclick: () => o(null),
				style: {
					padding: "8px 12px",
					borderRadius: "8px",
					border: "1px solid rgba(255,255,255,0.12)",
					background: "rgba(0,0,0,0.25)",
					color: "rgba(255,255,255,0.85)",
					cursor: "pointer"
				}
			}), R("button", {
				textContent: N("dialog.ok", "OK"),
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
			a.show(c), setTimeout(() => tt(a), 0), setTimeout(() => {
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
}, Ve = () => {
	try {
		return we()?.ui || null;
	} catch {
		return null;
	}
}, He = () => {
	let e = (e) => !!e && (typeof e.alert == "function" || typeof e.confirm == "function" || typeof e.prompt == "function");
	try {
		let t = re();
		if (e(t)) return t;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}, Ue = () => {
	try {
		let e = Ee();
		if (e) return e;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}, We = () => {
	try {
		let e = Ve();
		if (e?.dialog && typeof e.dialog.show == "function") return e.dialog;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}, Ge = (e, t = "Majoor") => {
	let n = String(e ?? ""), r = String(t ?? "").trim();
	return !r || r.toLowerCase() === "majoor" ? n : `${r}<br><br>${n}`;
}, Ke = /* @__PURE__ */ new Set(/* @__PURE__ */ "abort.blur.change.click.close.contextmenu.dblclick.dragend.dragenter.dragleave.dragover.dragstart.drop.error.focus.input.keydown.keypress.keyup.load.mousedown.mouseenter.mouseleave.mousemove.mouseout.mouseover.mouseup.reset.resize.scroll.select.submit.touchcancel.touchend.touchmove.touchstart.transitionend.unload.wheel".split(".")), qe = /* @__PURE__ */ new Set([
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
]), Je = /* @__PURE__ */ new Set([
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
]), Ye = (e, t = {}, n = []) => {
	let r = document.createElement(e);
	return Object.entries(t || {}).forEach(([e, t]) => {
		let n = String(e || "");
		if (n && !qe.has(n)) {
			if (e === "style" && t && typeof t == "object") Object.assign(r.style, t);
			else if (e === "className") r.className = String(t);
			else if (n.startsWith("on")) {
				if (typeof t == "function") {
					let e = n.slice(2).toLowerCase();
					Ke.has(e) && r.addEventListener(e, t);
				}
			} else {
				if (Je.has(n)) try {
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
		}
	}), (Array.isArray(n) ? n : [n]).filter(Boolean).forEach((e) => {
		try {
			r.appendChild(e);
		} catch {
			r.appendChild(document.createTextNode(String(e)));
		}
	}), r;
}, R = (e, t, n) => {
	let r = Ve();
	if (r?.$el) try {
		return r.$el(e, t, n);
	} catch {}
	return Ye(e, t, n);
}, Xe = () => Ve()?.ComfyDialog || null, Ze = 999999, Qe = 560, $e = 12, et = (e) => {
	try {
		e.element.style.zIndex = String(Ze), e.element.style.width = `${Qe}px`, e.element.style.padding = "0", e.element.style.backgroundColor = "var(--comfy-menu-bg, #131722)", e.element.style.border = "1px solid rgba(255,255,255,0.14)", e.element.style.borderRadius = `${$e}px`, e.element.style.boxSizing = "border-box", e.element.style.overflow = "hidden", e.element.style.boxShadow = "0 18px 48px rgba(0,0,0,0.48)";
	} catch (e) {
		console.debug?.(e);
	}
}, tt = (e) => {
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
}, z = {
	debug: {
		safeCall: P.DEBUG_SAFE_CALL,
		safeListeners: P.DEBUG_SAFE_LISTENERS,
		viewer: P.DEBUG_VIEWER
	},
	grid: {
		pageSize: P.DEFAULT_PAGE_SIZE,
		minSize: P.GRID_MIN_SIZE,
		minSizePreset: Le(P.GRID_MIN_SIZE),
		gap: P.GRID_GAP,
		showExtBadge: P.GRID_SHOW_BADGES_EXTENSION,
		showRatingBadge: P.GRID_SHOW_BADGES_RATING,
		showTagsBadge: P.GRID_SHOW_BADGES_TAGS,
		showDetails: P.GRID_SHOW_DETAILS,
		showFilename: P.GRID_SHOW_DETAILS_FILENAME,
		showDate: P.GRID_SHOW_DETAILS_DATE,
		showDimensions: P.GRID_SHOW_DETAILS_DIMENSIONS,
		showGenTime: P.GRID_SHOW_DETAILS_GENTIME,
		showHoverInfo: P.GRID_SHOW_HOVER_INFO,
		showWorkflowDot: P.GRID_SHOW_WORKFLOW_DOT,
		workflowGroupBy: P.WORKFLOW_GRID_GROUP_BY,
		videoAutoplayMode: P.GRID_VIDEO_AUTOPLAY_MODE,
		starColor: P.BADGE_STAR_COLOR,
		badgeImageColor: P.BADGE_IMAGE_COLOR,
		badgeVideoColor: P.BADGE_VIDEO_COLOR,
		badgeAudioColor: P.BADGE_AUDIO_COLOR,
		badgeModel3dColor: P.BADGE_MODEL3D_COLOR,
		badgeDuplicateAlertColor: P.BADGE_DUPLICATE_ALERT_COLOR
	},
	infiniteScroll: {
		enabled: P.INFINITE_SCROLL_ENABLED,
		rootMargin: P.INFINITE_SCROLL_ROOT_MARGIN,
		threshold: P.INFINITE_SCROLL_THRESHOLD,
		bottomGapPx: P.BOTTOM_GAP_PX
	},
	siblings: { hidePngSiblings: !0 },
	autoScan: { onStartup: P.AUTO_SCAN_ON_STARTUP },
	scan: {
		fastMode: !0,
		jxlEnabled: !1
	},
	watcher: {
		enabled: !0,
		debounceMs: P.WATCHER_DEBOUNCE_MS,
		dedupeTtlMs: P.WATCHER_DEDUPE_TTL_MS,
		maxPending: 500,
		minSize: 100,
		maxSize: 4294967296
	},
	safety: { confirmDeletion: !0 },
	status: { pollInterval: P.STATUS_POLL_INTERVAL },
	viewer: {
		pauseDuringExecution: P.VIEWER_PAUSE_DURING_EXECUTION,
		floatingPauseDuringExecution: P.FLOATING_VIEWER_PAUSE_DURING_EXECUTION,
		mfvLiveDefault: P.MFV_LIVE_DEFAULT,
		mfvPreviewDefault: P.MFV_PREVIEW_DEFAULT,
		mfvTopbarButton: P.MFV_TOPBAR_BUTTON,
		mfvSidebarPosition: "right",
		mfvPreviewMethod: P.MFV_PREVIEW_METHOD,
		mfvKjPreviewOverrideEnabled: P.MFV_KJ_PREVIEW_OVERRIDE_ENABLED,
		ltxavRgbFallback: !1
	},
	browser: { showFolders: !1 },
	rtHydrate: {
		concurrency: P.RT_HYDRATE_CONCURRENCY,
		queueMax: P.RT_HYDRATE_QUEUE_MAX,
		seenMax: P.RT_HYDRATE_SEEN_MAX,
		pruneBudget: P.RT_HYDRATE_PRUNE_BUDGET,
		seenTtlMs: P.RT_HYDRATE_SEEN_TTL_MS
	},
	observability: {
		enabled: !1,
		runtimeDashboardMode: "autoHide30",
		verboseErrors: !1,
		verboseRouteRegistrationLogs: !1,
		verboseStartupLogs: !1
	},
	feed: {
		minSize: P.FEED_GRID_MIN_SIZE,
		showInfo: P.FEED_SHOW_INFO,
		showFilename: P.FEED_SHOW_FILENAME,
		showDimensions: P.FEED_SHOW_DIMENSIONS,
		showDate: P.FEED_SHOW_DATE,
		showGenTime: P.FEED_SHOW_GENTIME,
		showWorkflowDot: P.FEED_SHOW_WORKFLOW_DOT,
		showExtBadge: P.FEED_SHOW_BADGES_EXTENSION,
		showRatingBadge: P.FEED_SHOW_BADGES_RATING,
		showTagsBadge: P.FEED_SHOW_BADGES_TAGS
	},
	sidebar: {
		position: "right",
		showPreviewThumb: !0,
		widthPx: 360,
		assetBadgeEnabled: P.SIDEBAR_ASSET_BADGE_ENABLED
	},
	integration: { hideNativeAssetsTab: !1 },
	probeBackend: { mode: "auto" },
	i18n: { followComfyLanguage: !0 },
	metadataFallback: {
		image: !0,
		media: !0
	},
	paths: {
		outputDirectory: "",
		inputDirectory: "",
		indexDirectory: "",
		workflowRoots: ""
	},
	db: {
		timeoutMs: 5e3,
		maxConnections: 10,
		queryTimeoutMs: 1e3
	},
	ratingTagsSync: { enabled: !0 },
	cache: { tagsTTLms: 3e4 },
	search: { maxResults: P.SEARCH_DEFAULT_LIMIT },
	ai: {
		vectorSearchEnabled: !0,
		vectorCaptionOnIndex: !1,
		verboseAiLogs: !1
	},
	executionGrouping: { enabled: P.EXECUTION_GROUPING_ENABLED },
	workflowMinimap: {
		enabled: P.WORKFLOW_MINIMAP_ENABLED,
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
		cardHoverColor: P.UI_CARD_HOVER_COLOR,
		cardSelectionColor: P.UI_CARD_SELECTION_COLOR,
		ratingColor: P.UI_RATING_COLOR,
		tagColor: P.UI_TAG_COLOR
	},
	security: {
		safeMode: !1,
		allowWrite: !0,
		requireAuth: !1,
		allowRemoteWrite: !1,
		allowInsecureTokenTransport: !1,
		allowDelete: !0,
		allowRename: !0,
		allowOpenInFolder: !0,
		allowResetIndex: !0,
		apiToken: "",
		tokenConfigured: !1,
		tokenHint: ""
	}
}, B = () => {
	try {
		let e = A.get(ge);
		if (!e) return { ...z };
		let t = JSON.parse(e), n = t && typeof t == "object" && Number.isInteger(t.version) && t.data && typeof t.data == "object";
		if (!n && (!t || typeof t != "object" || Array.isArray(t))) return { ...z };
		if (n && Number(t.version) > 1) return console.warn("[Majoor] settings schema version is newer than this build, using defaults"), { ...z };
		let r = n ? t.data : t, i = /* @__PURE__ */ new Set(/* @__PURE__ */ "debug.grid.infiniteScroll.siblings.autoScan.scan.watcher.status.viewer.rtHydrate.observability.feed.sidebar.probeBackend.i18n.paths.db.ratingTagsSync.cache.search.ai.executionGrouping.workflowMinimap.ui.security.safety".split(".")), a = {};
		if (r && typeof r == "object") for (let [e, t] of Object.entries(r)) i.has(e) && (a[e] = t);
		let o = je(z, a);
		if (!n) try {
			V(o);
		} catch (e) {
			console.debug?.(e);
		}
		return o;
	} catch (e) {
		return console.warn("[Majoor] settings load failed, using defaults", e), { ...z };
	}
}, V = (e) => {
	try {
		let t = JSON.parse(JSON.stringify(e || {}));
		t?.security && typeof t.security == "object" && (t.security.apiToken = "");
		let n = {
			version: 1,
			data: t
		};
		if (!A.set("mjrSettings", JSON.stringify(n))) throw Error("SettingsStore rejected the write");
	} catch (e) {
		console.warn("[Majoor] settings save failed", e);
		try {
			let e = Date.now();
			e - (Number(window?._mjrSettingsSaveFailAt || 0) || 0) > 3e4 && (window._mjrSettingsSaveFailAt = e, Re(N("dialog.settingsSaveFailed", "Majoor: Failed to save settings (browser storage full or blocked).")));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			Oe("mjr-settings-save-failed", { error: String(e?.message || e || "") }, { warnPrefix: "[Majoor]" });
		} catch (e) {
			console.debug?.(e);
		}
	}
}, H = (e) => {
	let t = Number(P.MAX_PAGE_SIZE) || 2e3, n = Math.max(50, Math.min(t, Number(e.grid?.pageSize) || P.DEFAULT_PAGE_SIZE));
	F.DEFAULT_PAGE_SIZE = n, F.AUTO_SCAN_ON_STARTUP = !!e.autoScan?.onStartup, F.EXECUTION_GROUPING_ENABLED = !!(e.executionGrouping?.enabled ?? P.EXECUTION_GROUPING_ENABLED), F.STATUS_POLL_INTERVAL = Math.max(1e3, Number(e.status?.pollInterval) || P.STATUS_POLL_INTERVAL), F.DEBUG_SAFE_CALL = !!e.debug?.safeCall, F.DEBUG_SAFE_LISTENERS = !!e.debug?.safeListeners, F.DEBUG_VIEWER = !!e.debug?.viewer, F.GRID_MIN_SIZE = Fe(e.grid), F.FEED_GRID_MIN_SIZE = Ie(e.feed), F.GRID_GAP = Math.max(0, Math.min(40, Math.round(L(e.grid?.gap, P.GRID_GAP)))), F.GRID_SHOW_BADGES_EXTENSION = !!(e.grid?.showExtBadge ?? P.GRID_SHOW_BADGES_EXTENSION), F.GRID_SHOW_BADGES_RATING = !!(e.grid?.showRatingBadge ?? P.GRID_SHOW_BADGES_RATING), F.GRID_SHOW_BADGES_TAGS = !!(e.grid?.showTagsBadge ?? P.GRID_SHOW_BADGES_TAGS), F.GRID_SHOW_DETAILS = !!(e.grid?.showDetails ?? P.GRID_SHOW_DETAILS), F.GRID_SHOW_DETAILS_FILENAME = !!(e.grid?.showFilename ?? P.GRID_SHOW_DETAILS_FILENAME), F.GRID_SHOW_DETAILS_DATE = !!(e.grid?.showDate ?? P.GRID_SHOW_DETAILS_DATE), F.GRID_SHOW_DETAILS_DIMENSIONS = !!(e.grid?.showDimensions ?? P.GRID_SHOW_DETAILS_DIMENSIONS), F.GRID_SHOW_DETAILS_GENTIME = !!(e.grid?.showGenTime ?? P.GRID_SHOW_DETAILS_GENTIME), F.GRID_SHOW_HOVER_INFO = !!(e.grid?.showHoverInfo ?? P.GRID_SHOW_HOVER_INFO), F.GRID_SHOW_WORKFLOW_DOT = !!(e.grid?.showWorkflowDot ?? P.GRID_SHOW_WORKFLOW_DOT);
	{
		let t = String(e.grid?.workflowGroupBy ?? P.WORKFLOW_GRID_GROUP_BY).toLowerCase();
		F.WORKFLOW_GRID_GROUP_BY = [
			"none",
			"task",
			"model",
			"category"
		].includes(t) ? t : P.WORKFLOW_GRID_GROUP_BY;
	}
	F.FEED_SHOW_INFO = !!(e.feed?.showInfo ?? P.FEED_SHOW_INFO), F.FEED_SHOW_FILENAME = !!(e.feed?.showFilename ?? P.FEED_SHOW_FILENAME), F.FEED_SHOW_DIMENSIONS = !!(e.feed?.showDimensions ?? P.FEED_SHOW_DIMENSIONS), F.FEED_SHOW_DATE = !!(e.feed?.showDate ?? P.FEED_SHOW_DATE), F.FEED_SHOW_GENTIME = !!(e.feed?.showGenTime ?? P.FEED_SHOW_GENTIME), F.FEED_SHOW_WORKFLOW_DOT = !!(e.feed?.showWorkflowDot ?? P.FEED_SHOW_WORKFLOW_DOT), F.FEED_SHOW_BADGES_EXTENSION = !!(e.feed?.showExtBadge ?? P.FEED_SHOW_BADGES_EXTENSION), F.FEED_SHOW_BADGES_RATING = !!(e.feed?.showRatingBadge ?? P.FEED_SHOW_BADGES_RATING), F.FEED_SHOW_BADGES_TAGS = !!(e.feed?.showTagsBadge ?? P.FEED_SHOW_BADGES_TAGS);
	{
		let t = e.grid?.videoAutoplayMode ?? P.GRID_VIDEO_AUTOPLAY_MODE;
		t ??= e.grid?.videoHoverAutoplay === !1 ? "off" : "hover", t === !0 && (t = "hover"), t === !1 && (t = "off"), t !== "hover" && t !== "always" && t !== "off" && (t = "hover"), F.GRID_VIDEO_AUTOPLAY_MODE = t;
	}
	let r = (e, t) => {
		let n = String(e || "").trim();
		return /^[0-9a-fA-F]{6}$/.test(n) && (n = `#${n}`), /^#[0-9a-fA-F]{3,8}$/.test(n) ? n : t;
	};
	F.BADGE_STAR_COLOR = r(e.grid?.starColor, P.BADGE_STAR_COLOR), F.BADGE_IMAGE_COLOR = r(e.grid?.badgeImageColor, P.BADGE_IMAGE_COLOR), F.BADGE_VIDEO_COLOR = r(e.grid?.badgeVideoColor, P.BADGE_VIDEO_COLOR), F.BADGE_AUDIO_COLOR = r(e.grid?.badgeAudioColor, P.BADGE_AUDIO_COLOR), F.BADGE_MODEL3D_COLOR = r(e.grid?.badgeModel3dColor, P.BADGE_MODEL3D_COLOR), F.BADGE_DUPLICATE_ALERT_COLOR = r(e.grid?.badgeDuplicateAlertColor, P.BADGE_DUPLICATE_ALERT_COLOR), F.UI_CARD_HOVER_COLOR = r(e.ui?.cardHoverColor, P.UI_CARD_HOVER_COLOR), F.UI_CARD_SELECTION_COLOR = r(e.ui?.cardSelectionColor, P.UI_CARD_SELECTION_COLOR), F.UI_RATING_COLOR = r(e.ui?.ratingColor, P.UI_RATING_COLOR), F.UI_TAG_COLOR = r(e.ui?.tagColor, P.UI_TAG_COLOR);
	try {
		let e = Array.from(document.querySelectorAll(".mjr-assets-manager"));
		for (let t of e) t.style.setProperty("--mjr-star-active", F.BADGE_STAR_COLOR), t.style.setProperty("--mjr-badge-image", F.BADGE_IMAGE_COLOR), t.style.setProperty("--mjr-badge-video", F.BADGE_VIDEO_COLOR), t.style.setProperty("--mjr-badge-audio", F.BADGE_AUDIO_COLOR), t.style.setProperty("--mjr-badge-model3d", F.BADGE_MODEL3D_COLOR), t.style.setProperty("--mjr-badge-duplicate-alert", F.BADGE_DUPLICATE_ALERT_COLOR), t.style.setProperty("--mjr-card-hover-color", F.UI_CARD_HOVER_COLOR), t.style.setProperty("--mjr-card-selection-color", F.UI_CARD_SELECTION_COLOR), t.style.setProperty("--mjr-rating-color", F.UI_RATING_COLOR), t.style.setProperty("--mjr-tag-color", F.UI_TAG_COLOR);
	} catch (e) {
		console.debug?.(e);
	}
	F.INFINITE_SCROLL_ENABLED = !!e.infiniteScroll?.enabled, F.INFINITE_SCROLL_ROOT_MARGIN = String(e.infiniteScroll?.rootMargin || P.INFINITE_SCROLL_ROOT_MARGIN), F.INFINITE_SCROLL_THRESHOLD = Math.max(0, Math.min(1, L(e.infiniteScroll?.threshold, P.INFINITE_SCROLL_THRESHOLD))), F.BOTTOM_GAP_PX = Math.max(0, Math.min(5e3, Math.round(L(e.infiniteScroll?.bottomGapPx, P.BOTTOM_GAP_PX)))), F.VIEWER_PAUSE_DURING_EXECUTION = !!(e.viewer?.pauseDuringExecution ?? P.VIEWER_PAUSE_DURING_EXECUTION), F.FLOATING_VIEWER_PAUSE_DURING_EXECUTION = !!(e.viewer?.floatingPauseDuringExecution ?? P.FLOATING_VIEWER_PAUSE_DURING_EXECUTION), F.MFV_LIVE_DEFAULT = e.viewer?.mfvLiveDefault ?? P.MFV_LIVE_DEFAULT, F.MFV_PREVIEW_DEFAULT = e.viewer?.mfvPreviewDefault ?? P.MFV_PREVIEW_DEFAULT, F.MFV_KJ_PREVIEW_OVERRIDE_ENABLED = !!(e.viewer?.mfvKjPreviewOverrideEnabled ?? P.MFV_KJ_PREVIEW_OVERRIDE_ENABLED), F.MFV_TOPBAR_BUTTON = !!(e.viewer?.mfvTopbarButton ?? P.MFV_TOPBAR_BUTTON), F.MFV_LIVE_AUTO_OPEN = !1, F.MFV_PREVIEW_AUTO_OPEN = !1, F.MFV_NODE_STREAM_AUTO_OPEN = !1;
	{
		let t = String(e.viewer?.mfvPreviewMethod || P.MFV_PREVIEW_METHOD).toLowerCase();
		F.MFV_PREVIEW_METHOD = [
			"default",
			"auto",
			"latent2rgb",
			"taesd",
			"none"
		].includes(t) ? t : P.MFV_PREVIEW_METHOD;
	}
	{
		let t = String(e.viewer?.mfvSidebarPosition || "right").toLowerCase();
		F.MFV_SIDEBAR_POSITION = [
			"left",
			"right",
			"bottom"
		].includes(t) ? t : "right";
	}
	F.WORKFLOW_MINIMAP_ENABLED = !!(e.workflowMinimap?.enabled ?? P.WORKFLOW_MINIMAP_ENABLED), F.RT_HYDRATE_CONCURRENCY = Math.max(1, Math.min(16, Math.round(L(e.rtHydrate?.concurrency, P.RT_HYDRATE_CONCURRENCY)))), F.RT_HYDRATE_QUEUE_MAX = Math.max(10, Math.min(5e3, Math.round(L(e.rtHydrate?.queueMax, P.RT_HYDRATE_QUEUE_MAX)))), F.RT_HYDRATE_SEEN_MAX = Math.max(1e3, Math.min(2e5, Math.round(L(e.rtHydrate?.seenMax, P.RT_HYDRATE_SEEN_MAX)))), F.RT_HYDRATE_PRUNE_BUDGET = Math.max(10, Math.min(1e4, Math.round(L(e.rtHydrate?.pruneBudget, P.RT_HYDRATE_PRUNE_BUDGET)))), F.RT_HYDRATE_SEEN_TTL_MS = Math.max(5e3, Math.min(216e5, Math.round(L(e.rtHydrate?.seenTtlMs, P.RT_HYDRATE_SEEN_TTL_MS)))), F.DELETE_CONFIRMATION = !!e.safety?.confirmDeletion, F.DEBUG_VERBOSE_ERRORS = !!e.observability?.verboseErrors, F.WATCHER_MAX_PENDING = Math.max(10, Math.min(5e3, Math.round(L(e.watcher?.maxPending, 500)))), F.WATCHER_MIN_SIZE = Math.max(0, Math.min(1e6, Math.round(L(e.watcher?.minSize, 100)))), F.WATCHER_MAX_SIZE = Math.max(1e5, Math.min(17179869184, Math.round(L(e.watcher?.maxSize, 4294967296)))), F.DB_TIMEOUT_MS = Math.max(1e3, Math.min(3e4, Math.round(L(e.db?.timeoutMs, 5e3)))), F.DB_MAX_CONNECTIONS = Math.max(1, Math.min(100, Math.round(L(e.db?.maxConnections, 10)))), F.DB_QUERY_TIMEOUT_MS = Math.max(500, Math.min(1e4, Math.round(L(e.db?.queryTimeoutMs, 1e3)))), F.SIDEBAR_ASSET_BADGE_ENABLED = !!(e.sidebar?.assetBadgeEnabled ?? P.SIDEBAR_ASSET_BADGE_ENABLED), F.SEARCH_REQUEST_LIMIT = Math.max(10, Math.min(P.MAX_PAGE_SIZE || 2e3, Math.round(L(e.search?.maxResults, P.SEARCH_DEFAULT_LIMIT))));
};
async function nt() {
	try {
		let e = await O();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = B();
		if (n.security = n.security || {}, n.security.safeMode = I(t.safe_mode, n.security.safeMode), n.security.allowWrite = I(t.allow_write, n.security.allowWrite), n.security.requireAuth = I(t.require_auth, n.security.requireAuth), n.security.allowRemoteWrite = I(t.allow_remote_write, n.security.allowRemoteWrite), n.security.allowInsecureTokenTransport = I(t.allow_insecure_token_transport, n.security.allowInsecureTokenTransport), n.security.allowDelete = I(t.allow_delete, n.security.allowDelete), n.security.allowRename = I(t.allow_rename, n.security.allowRename), n.security.allowOpenInFolder = I(t.allow_open_in_folder, n.security.allowOpenInFolder), n.security.allowResetIndex = I(t.allow_reset_index, n.security.allowResetIndex), n.security.tokenConfigured = I(t.token_configured, n.security.tokenConfigured), n.security.tokenHint = String(t.token_hint || "").trim(), !String(n.security.apiToken || "").trim()) try {
			let e = await de(), t = String(e?.data?.token || "").trim();
			e?.ok && t && T(t);
		} catch (e) {
			console.debug?.(e);
		}
		V(n), H(n), Oe("mjr-settings-changed", { key: "security" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend security settings", e);
	}
}
async function rt() {
	try {
		let t = await e();
		if (!t?.ok) return;
		let n = t.data?.prefs;
		if (!n || typeof n != "object") return;
		let r = B();
		r.ai = r.ai || {}, r.ai.vectorSearchEnabled = I(n.enabled, r.ai.vectorSearchEnabled ?? !0), r.ai.vectorCaptionOnIndex = I(n.caption_on_index ?? n.captionOnIndex, r.ai.vectorCaptionOnIndex ?? !1), r.ai.vectorIndexOnScan = I(n.index_on_scan ?? n.indexOnScan, r.ai.vectorIndexOnScan ?? !1), r.ai.vectorUnloadAfterUse = I(n.unload_after_use ?? n.unloadAfterUse, r.ai.vectorUnloadAfterUse ?? !1), r.ai.vectorConcurrency = Math.max(1, Math.min(16, Math.floor(Number(n.concurrency ?? r.ai.vectorConcurrency ?? 1) || 1))), V(r), H(r), Oe("mjr-settings-changed", { key: "ai.vectorSearch" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend vector search settings", e);
	}
}
async function it() {
	try {
		let e = await n();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let r = B();
		r.executionGrouping = r.executionGrouping || {}, r.executionGrouping.enabled = I(t.enabled, r.executionGrouping.enabled ?? P.EXECUTION_GROUPING_ENABLED), V(r), H(r), Oe("mjr-settings-changed", { key: "executionGrouping.enabled" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend execution grouping settings", e);
	}
}
// ui/app/settings/settingsRuntime.ts
var at = "mjr-runtime-status-dashboard", ot = 3e4;
function st() {
	try {
		let e = B(), t = String(e?.observability?.runtimeDashboardMode || z.observability.runtimeDashboardMode);
		return [
			"autoHide30",
			"always",
			"hidden"
		].includes(t) ? t : "autoHide30";
	} catch {
		return "autoHide30";
	}
}
function ct() {
	try {
		document.getElementById(at)?.remove?.();
	} catch (e) {
		console.debug?.(e);
	}
}
function lt() {
	try {
		window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ && (clearTimeout(window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__), window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ = null);
	} catch (e) {
		console.debug?.(e);
	}
}
function ut(e, t) {
	let n = t === "auth" ? "__mjrAuthLine" : "__mjrMetricsLine";
	if (e?.[n]) return e[n];
	let r = document.createElement("div");
	return r.style.whiteSpace = "nowrap", r.style.lineHeight = "1.35", t === "auth" && (r.style.marginTop = "4px", r.style.fontWeight = "600"), e.appendChild(r), e[n] = r, r;
}
function dt(e) {
	let t = String(e?.token_hint || "").trim(), n = f(), r = t || (n ? "(session)" : ""), i = e?.allow_write !== !1, a = e?.require_auth === !0, o = e?.token_configured === !0;
	return i ? n ? {
		text: N("runtime.writeAuthActive", "Write auth: active {tokenHint}", { tokenHint: r || "(session)" }),
		color: "#7ee0a0"
	} : a && o ? {
		text: N("runtime.writeAuthMissing", "Write auth: missing in this browser {tokenHint}", { tokenHint: r || "(server token configured)" }),
		color: "#f1c36d"
	} : a ? {
		text: N("runtime.writeAuthRequired", "Write auth: required"),
		color: "#f1c36d"
	} : e && typeof e == "object" ? {
		text: N("runtime.writeAuthNotRequired", "Write auth: not required"),
		color: "#8fd0ff"
	} : {
		text: N("runtime.writeAuthUnknown", "Write auth: unknown"),
		color: "#c8ced8"
	} : {
		text: N("runtime.writeAuthBlocked", "Write auth: writes blocked by server"),
		color: "#ff9b9b"
	};
}
function ft() {
	try {
		if (st() === "hidden" || window.__MJR_RUNTIME_STATUS_HIDDEN__) return ct(), null;
		let e = document.querySelector(".mjr-assets-manager.mjr-am-container"), t = document.getElementById(at);
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
			t && t !== "static" || (e.style.position = "relative");
		} catch (e) {
			console.debug?.(e);
		}
		let n = document.getElementById(at);
		return n ? n.parentElement !== e && e.appendChild(n) : (n = document.createElement("div"), n.id = at, n.style.position = "absolute", n.style.bottom = "10px", n.style.right = "10px", n.style.zIndex = "9999", n.style.padding = "6px 10px", n.style.borderRadius = "10px", n.style.border = "1px solid rgba(255,255,255,0.16)", n.style.background = "rgba(0,0,0,0.45)", n.style.backdropFilter = "blur(4px)", n.style.color = "var(--content-fg, #fff)", n.style.fontSize = "11px", n.style.pointerEvents = "none", n.style.display = "flex", n.style.flexDirection = "column", e.appendChild(n)), n;
	} catch {
		return null;
	}
}
async function pt() {
	let e = ft();
	if (!e) return !1;
	let t = ut(e, "metrics"), n = ut(e, "auth");
	try {
		let [r, i] = await Promise.all([k(), O()]), a = N("runtime.unavailable", "Runtime: unavailable");
		if (!r?.ok || !r?.data) t.textContent = a;
		else {
			let e = r.data.db || {}, n = r.data.index || {}, i = r.data.watcher || {}, o = Number(e.active_connections || 0), s = Number(n.enrichment_queue_length || 0), c = Number(i.pending_files || 0);
			t.textContent = N("runtime.metricsLine", "DB active: {active} | Enrich Q: {enrichQ} | Watcher pending: {pending}", {
				active: o,
				enrichQ: s,
				pending: c
			}), a = N("runtime.metricsTitle", "Runtime Metrics\nDB active connections: {active}\nEnrichment queue: {enrichQ}\nWatcher pending files: {pending}", {
				active: o,
				enrichQ: s,
				pending: c
			});
		}
		let o = dt(i?.data?.prefs || null);
		return n.textContent = o.text, n.style.color = o.color, e.title = `${a}\n${o.text}`, !0;
	} catch {
		return t.textContent = N("runtime.unavailable", "Runtime: unavailable"), n.textContent = N("runtime.writeAuthUnknown", "Write auth: unknown"), n.style.color = "#c8ced8", e.title = `${N("runtime.unavailable", "Runtime: unavailable")}\n${n.textContent}`, !0;
	}
}
function mt() {
	try {
		let e = st();
		if (e === "hidden") {
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = !0, lt(), ct();
			return;
		}
		window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__ || (window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__ = (e) => {
			if (e?.detail?.key !== "observability.runtimeDashboardMode") return;
			let t = st();
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = t === "hidden", lt(), ct(), t !== "hidden" && mt();
		}, window.addEventListener?.("mjr-settings-changed", window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__)), window.__MJR_RUNTIME_STATUS_HIDDEN__ = !1, lt(), e === "autoHide30" && (window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ = setTimeout(() => {
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = !0, ct();
		}, ot)), pt().catch(() => {}), window.__MJR_RUNTIME_STATUS_INFLIGHT__ ?? (window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !1), window.__MJR_RUNTIME_STATUS_MISS_COUNT__ ?? (window.__MJR_RUNTIME_STATUS_MISS_COUNT__ = 0), window.__MJR_RUNTIME_STATUS_INTERVAL__ || (window.__MJR_RUNTIME_STATUS_INTERVAL__ = setInterval(() => {
			window.__MJR_RUNTIME_STATUS_INFLIGHT__ || (window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !0, pt().then((e) => {
				e ? window.__MJR_RUNTIME_STATUS_MISS_COUNT__ = 0 : window.__MJR_RUNTIME_STATUS_MISS_COUNT__ = Number(window.__MJR_RUNTIME_STATUS_MISS_COUNT__ || 0) + 1;
			}).catch(() => {}).finally(() => {
				window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !1;
			}));
		}, 1e4));
	} catch (e) {
		console.debug?.(e);
	}
}
// ui/utils/debounce.ts
var ht = 300;
function gt(e, t = ht) {
	let n, r = (...r) => {
		clearTimeout(n), n = setTimeout(() => e(...r), t);
	};
	return r.cancel = () => {
		clearTimeout(n);
	}, r.flush = (...t) => {
		clearTimeout(n), e(...t);
	}, r;
}
// ui/features/runtime/nativeAssetsTab.ts
var _t = /* @__PURE__ */ new Set([
	"assets",
	"media-assets",
	"assets-sidebar"
]), vt = [
	500,
	2e3,
	6e3
], yt = !1, bt = /* @__PURE__ */ new Map(), xt = [];
function St(e) {
	let t = String(e?.id || "").trim().toLowerCase();
	return !t || t.startsWith("majoor") || t.startsWith("mjr") ? !1 : _t.has(t);
}
function Ct() {
	for (let e of xt.splice(0)) clearTimeout(e);
}
function wt() {
	let e = 0;
	for (let t of y()) {
		if (!St(t)) continue;
		let n = String(t.id);
		r(n) && (bt.set(n, t), e += 1);
	}
	return e;
}
function Tt() {
	for (let [e, t] of [...bt.entries()]) (y().some((t) => String(t?.id || "") === e) || l(t)) && bt.delete(e);
}
function Et(e) {
	if (yt = !!e, Ct(), !yt) Tt();
	else {
		wt();
		for (let e of vt) xt.push(setTimeout(() => {
			yt && wt();
		}, e));
	}
}
function Dt() {
	yt = !1, Ct(), Tt();
}
// ui/app/settings/settingsGrid.ts
var U = "Majoor", Ot = "Majoor Assets Manager";
function kt(e, t, n) {
	let r = (e, t) => [
		Ot,
		e,
		t
	], i = (e) => [
		Ot,
		N("cat.cards", "Cards"),
		e
	], a = (e) => [
		Ot,
		N("cat.badges", "Badges"),
		e
	], o = (e) => [
		Ot,
		N("cat.badges", "Badges"),
		e
	], s = (e, t) => {
		let n = String(e || "").trim();
		return /^[0-9a-fA-F]{6}$/.test(n) && (n = `#${n}`), /^#[0-9a-fA-F]{6}$/.test(n) ? n.toUpperCase() : t;
	};
	t.grid?.minSizePreset || (t.grid = t.grid || {}, t.grid.minSizePreset = Le(t.grid.minSize), V(t)), e({
		id: `${U}.Cards.ThumbSize`,
		category: i(N("setting.grid.cardSize.group", "Card size")),
		name: N("setting.grid.cardSize.name", "Majoor: Card Size"),
		tooltip: N("setting.grid.cardSize.desc", "Choose the card size preset used by the grid layout."),
		type: "combo",
		defaultValue: (() => {
			let e = ke(String(t.grid?.minSizePreset || "").toLowerCase(), Ne, Le(t.grid?.minSize)), n = {
				small: N("setting.grid.cardSize.small", "Small"),
				medium: N("setting.grid.cardSize.medium", "Medium"),
				large: N("setting.grid.cardSize.large", "Large")
			};
			return n[e] || n.medium;
		})(),
		options: [
			N("setting.grid.cardSize.small", "Small"),
			N("setting.grid.cardSize.medium", "Medium"),
			N("setting.grid.cardSize.large", "Large")
		],
		onChange: (e) => {
			let r = String(e || "").trim().toLowerCase(), i = N("setting.grid.cardSize.small", "Small").toLowerCase(), a = N("setting.grid.cardSize.medium", "Medium").toLowerCase(), o = N("setting.grid.cardSize.large", "Large").toLowerCase(), s = "medium";
			r === i || r === "small" || r === "petit" ? s = "small" : r === o || r === "large" || r === "grand" ? s = "large" : (r === a || r === "medium" || r === "moyen") && (s = "medium"), t.grid.minSizePreset = s, t.grid.minSize = Me[s], V(t), H(t), n("grid.minSizePreset");
		}
	}), e({
		id: `${U}.Cards.CustomThumbSize`,
		category: i(N("setting.grid.cardSize.group", "Card size")),
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
			t.grid.minSize = r, t.grid.minSizePreset = Le(r), V(t), H(t), n("grid.minSize");
		}
	}), e({
		id: `${U}.Grid.ShowDetails`,
		category: i("Show card details"),
		name: "Show metadata panel",
		tooltip: "Show the bottom details panel on asset cards (filename, date, etc.)",
		type: "boolean",
		defaultValue: !!t.grid?.showDetails,
		onChange: (e) => {
			t.grid.showDetails = !!e, V(t), H(t), n("grid.showDetails");
		}
	}), e({
		id: `${U}.Grid.ShowFilename`,
		category: i("Show filename"),
		name: "Show filename",
		tooltip: "Display filename in details panel",
		type: "boolean",
		defaultValue: !!t.grid?.showFilename,
		onChange: (e) => {
			t.grid.showFilename = !!e, V(t), H(t), n("grid.showFilename");
		}
	}), e({
		id: `${U}.Grid.ShowDate`,
		category: i("Show date/time"),
		name: "Show date/time",
		tooltip: "Display date and time in details panel",
		type: "boolean",
		defaultValue: !!t.grid?.showDate,
		onChange: (e) => {
			t.grid.showDate = !!e, V(t), H(t), n("grid.showDate");
		}
	}), e({
		id: `${U}.Grid.ShowDimensions`,
		category: i("Show dimensions"),
		name: "Show dimensions",
		tooltip: "Display resolution (WxH) in details panel",
		type: "boolean",
		defaultValue: !!t.grid?.showDimensions,
		onChange: (e) => {
			t.grid.showDimensions = !!e, V(t), H(t), n("grid.showDimensions");
		}
	}), e({
		id: `${U}.Grid.ShowGenTime`,
		category: i("Show generation time"),
		name: "Show generation time",
		tooltip: "Display seconds taken to generate the asset (if available)",
		type: "boolean",
		defaultValue: !!(t.grid?.showGenTime ?? P.GRID_SHOW_DETAILS_GENTIME),
		onChange: (e) => {
			t.grid.showGenTime = !!e, V(t), H(t), n("grid.showGenTime");
		}
	}), e({
		id: `${U}.Grid.ShowHoverInfo`,
		category: i("Show prompt on hover"),
		name: "Show prompt on hover",
		tooltip: "Show positive prompt and generation time as a tooltip overlay when hovering over a card thumbnail. Does not block video play-on-hover.",
		type: "boolean",
		defaultValue: !!(t.grid?.showHoverInfo ?? P.GRID_SHOW_HOVER_INFO),
		onChange: (e) => {
			t.grid.showHoverInfo = !!e, V(t), H(t), n("grid.showHoverInfo");
		}
	}), e({
		id: `${U}.Grid.ShowWorkflowDot`,
		category: i("Show workflow dot"),
		name: "Show workflow indicator",
		tooltip: "Display the green dot indicating workflow metadata availability (bottom right of card)",
		type: "boolean",
		defaultValue: !!t.grid?.showWorkflowDot,
		onChange: (e) => {
			t.grid.showWorkflowDot = !!e, V(t), H(t), n("grid.showWorkflowDot");
		}
	}), e({
		id: `${U}.Grid.ShowExtBadge`,
		category: a("Show format badges"),
		name: "Show format badges",
		tooltip: "Display format badges (e.g. JPG, MP4) on thumbnails",
		type: "boolean",
		defaultValue: !!t.grid?.showExtBadge,
		onChange: (e) => {
			t.grid.showExtBadge = !!e, V(t), H(t), n("grid.showExtBadge");
		}
	}), e({
		id: `${U}.Grid.ShowRatingBadge`,
		category: a("Show rating badges"),
		name: "Show ratings",
		tooltip: "Display star ratings on thumbnails",
		type: "boolean",
		defaultValue: !!t.grid?.showRatingBadge,
		onChange: (e) => {
			t.grid.showRatingBadge = !!e, V(t), H(t), n("grid.showRatingBadge");
		}
	}), e({
		id: `${U}.Grid.ShowTagsBadge`,
		category: a("Show tags badges"),
		name: "Show tags",
		tooltip: "Display a small indicator if an asset has tags",
		type: "boolean",
		defaultValue: !!t.grid?.showTagsBadge,
		onChange: (e) => {
			t.grid.showTagsBadge = !!e, V(t), H(t), n("grid.showTagsBadge");
		}
	}), e({
		id: `${U}.Badges.StarColor`,
		category: o(N("setting.starColor", "Star color")),
		name: N("setting.starColor", "Majoor: Star color"),
		tooltip: N("setting.starColor.tooltip", "Color of rating stars on thumbnails (hex, e.g. #FFD45A)"),
		type: "color",
		defaultValue: s(t.grid?.starColor, P.BADGE_STAR_COLOR),
		onChange: (e) => {
			t.grid.starColor = s(e, P.BADGE_STAR_COLOR), V(t), H(t), n("grid.starColor");
		}
	}), e({
		id: `${U}.Badges.ImageColor`,
		category: o(N("setting.badgeImageColor", "Image badge color")),
		name: N("setting.badgeImageColor", "Majoor: Image badge color"),
		tooltip: N("setting.badgeImageColor.tooltip", "Color for image badges: PNG, JPG, WEBP, GIF, BMP, TIF (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeImageColor, P.BADGE_IMAGE_COLOR),
		onChange: (e) => {
			t.grid.badgeImageColor = s(e, P.BADGE_IMAGE_COLOR), V(t), H(t), n("grid.badgeImageColor");
		}
	}), e({
		id: `${U}.Badges.VideoColor`,
		category: o(N("setting.badgeVideoColor", "Video badge color")),
		name: N("setting.badgeVideoColor", "Majoor: Video badge color"),
		tooltip: N("setting.badgeVideoColor.tooltip", "Color for video badges: MP4, WEBM, MOV, AVI, MKV (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeVideoColor, P.BADGE_VIDEO_COLOR),
		onChange: (e) => {
			t.grid.badgeVideoColor = s(e, P.BADGE_VIDEO_COLOR), V(t), H(t), n("grid.badgeVideoColor");
		}
	}), e({
		id: `${U}.Badges.AudioColor`,
		category: o(N("setting.badgeAudioColor", "Audio badge color")),
		name: N("setting.badgeAudioColor", "Majoor: Audio badge color"),
		tooltip: N("setting.badgeAudioColor.tooltip", "Color for audio badges: MP3, WAV, OGG, FLAC (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeAudioColor, P.BADGE_AUDIO_COLOR),
		onChange: (e) => {
			t.grid.badgeAudioColor = s(e, P.BADGE_AUDIO_COLOR), V(t), H(t), n("grid.badgeAudioColor");
		}
	}), e({
		id: `${U}.Badges.Model3dColor`,
		category: o(N("setting.badgeModel3dColor", "3D model badge color")),
		name: N("setting.badgeModel3dColor", "Majoor: 3D model badge color"),
		tooltip: N("setting.badgeModel3dColor.tooltip", "Color for 3D model badges: OBJ, FBX, GLB, GLTF (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeModel3dColor, P.BADGE_MODEL3D_COLOR),
		onChange: (e) => {
			t.grid.badgeModel3dColor = s(e, P.BADGE_MODEL3D_COLOR), V(t), H(t), n("grid.badgeModel3dColor");
		}
	}), e({
		id: `${U}.Badges.DuplicateAlertColor`,
		category: o(N("setting.badgeDuplicateAlertColor", "Duplicate alert badge color")),
		name: N("setting.badgeDuplicateAlertColor", "Majoor: Duplicate alert badge color"),
		tooltip: N("setting.badgeDuplicateAlertColor.tooltip", "Color for duplicate extension badges (PNG+, JPG+, etc)."),
		type: "color",
		defaultValue: s(t.grid?.badgeDuplicateAlertColor, P.BADGE_DUPLICATE_ALERT_COLOR),
		onChange: (e) => {
			t.grid.badgeDuplicateAlertColor = s(e, P.BADGE_DUPLICATE_ALERT_COLOR), V(t), H(t), n("grid.badgeDuplicateAlertColor");
		}
	}), e({
		id: `${U}.Grid.PageSize`,
		category: r(N("cat.grid"), N("setting.grid.pagesize.name").replace("Majoor: ", "")),
		name: N("setting.grid.pagesize.name"),
		tooltip: N("setting.grid.pagesize.desc"),
		type: "number",
		defaultValue: t.grid.pageSize,
		attrs: {
			min: 50,
			max: Number(F.MAX_PAGE_SIZE) || 2e3,
			step: 50
		},
		onChange: (e) => {
			let r = Number(F.MAX_PAGE_SIZE) || 2e3;
			t.grid.pageSize = Math.max(50, Math.min(r, Number(e) || P.DEFAULT_PAGE_SIZE)), V(t), H(t), n("grid.pageSize");
		}
	}), e({
		id: `${U}.Grid.WorkflowGroupBy`,
		category: r(N("cat.grid"), "Workflow grouping"),
		name: "Workflow grid grouping",
		tooltip: "In Workflow scope, insert titled separators and group cards by Task, Model, or Category.",
		type: "combo",
		defaultValue: (() => {
			let e = String(t.grid?.workflowGroupBy || P.WORKFLOW_GRID_GROUP_BY).trim().toLowerCase(), n = {
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
			t.grid = t.grid || {}, t.grid.workflowGroupBy = r, V(t), H(t), n("grid.workflowGroupBy");
		}
	}), e({
		id: `${U}.InfiniteScroll.Enabled`,
		category: r(N("cat.grid"), N("setting.nav.infinite.name").replace("Majoor: ", "")),
		name: N("setting.nav.infinite.name"),
		tooltip: N("setting.nav.infinite.desc"),
		type: "boolean",
		defaultValue: !!t.infiniteScroll?.enabled,
		onChange: (e) => {
			t.infiniteScroll = t.infiniteScroll || {}, t.infiniteScroll.enabled = !!e, V(t), H(t), n("infiniteScroll.enabled");
		}
	}), e({
		id: `${U}.Sidebar.Position`,
		category: r(N("cat.grid"), N("setting.sidebar.pos.name").replace("Majoor: ", "")),
		name: N("setting.sidebar.pos.name"),
		tooltip: N("setting.sidebar.pos.desc"),
		type: "combo",
		defaultValue: t.sidebar?.position || "right",
		options: ["left", "right"],
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.position = e === "left" ? "left" : "right", V(t), n("sidebar.position");
		}
	}), e({
		id: `${U}.Sidebar.ShowPreviewThumb`,
		category: r(N("cat.grid"), "Sidebar preview"),
		name: "Show sidebar preview thumb",
		tooltip: "Show/hide the large media preview at the top of the sidebar metadata panel.",
		type: "boolean",
		defaultValue: !!(t.sidebar?.showPreviewThumb ?? !0),
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.showPreviewThumb = !!e, V(t), n("sidebar.showPreviewThumb");
		}
	}), e({
		id: `${U}.Sidebar.AssetBadgeEnabled`,
		category: r(N("cat.grid"), "Sidebar asset notification badge"),
		name: "Show new asset badge on sidebar icon",
		tooltip: "Display a small counter on the Majoor sidebar icon only when a new asset is indexed by Assets Manager.",
		type: "boolean",
		defaultValue: !!(t.sidebar?.assetBadgeEnabled ?? P.SIDEBAR_ASSET_BADGE_ENABLED),
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.assetBadgeEnabled = !!e, V(t), H(t), n("sidebar.assetBadgeEnabled");
		}
	}), e({
		id: `${U}.Integration.HideNativeAssetsTab`,
		category: r(N("cat.grid"), "Hide ComfyUI native Assets tab"),
		name: "Hide ComfyUI's native Assets sidebar tab",
		tooltip: "Optional. Removes ComfyUI's built-in Assets tab from the sidebar so only Majoor Assets Manager is shown. Turning it off restores the native tab. Your files and the native tab's data are not affected.",
		type: "boolean",
		defaultValue: !!t.integration?.hideNativeAssetsTab,
		onChange: (e) => {
			t.integration = t.integration || {}, t.integration.hideNativeAssetsTab = !!e, V(t), Et(!!e), n("integration.hideNativeAssetsTab");
		}
	}), e({
		id: `${U}.Sidebar.WidthPx`,
		category: r(N("cat.grid"), "Sidebar width"),
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
			t.sidebar = t.sidebar || {}, t.sidebar.widthPx = Math.max(240, Math.min(640, Math.round(Number(e) || 360))), V(t), n("sidebar.widthPx");
		}
	}), e({
		id: `${U}.General.HideSiblings`,
		category: r(N("cat.grid"), N("setting.siblings.hide.name").replace("Majoor: ", "")),
		name: N("setting.siblings.hide.name"),
		tooltip: N("setting.siblings.hide.desc"),
		type: "boolean",
		defaultValue: !!t.siblings?.hidePngSiblings,
		onChange: (e) => {
			t.siblings = t.siblings || {}, t.siblings.hidePngSiblings = !!e, V(t), n("siblings.hidePngSiblings");
		}
	}), e({
		id: `${U}.Grid.VideoAutoplayMode`,
		category: r(N("cat.grid"), N("setting.grid.videoAutoplayMode.name", "Video autoplay").replace("Majoor: ", "")),
		name: N("setting.grid.videoAutoplayMode.name", "Majoor: Video autoplay"),
		tooltip: N("setting.grid.videoAutoplayMode.desc", "Controls video thumbnail playback in the grid. Off: static frame. Hover: play on mouse hover. Always: loop while visible."),
		type: "combo",
		defaultValue: (() => {
			let e = t.grid?.videoAutoplayMode;
			e ??= t.grid?.videoHoverAutoplay === !1 ? "off" : "hover", e === !0 && (e = "hover"), e === !1 && (e = "off"), e !== "hover" && e !== "always" && e !== "off" && (e = "hover");
			let n = {
				off: N("setting.grid.videoAutoplayMode.off", "Off"),
				hover: N("setting.grid.videoAutoplayMode.hover", "Hover"),
				always: N("setting.grid.videoAutoplayMode.always", "Always")
			};
			return n[e] || n.off;
		})(),
		options: [
			N("setting.grid.videoAutoplayMode.off", "Off"),
			N("setting.grid.videoAutoplayMode.hover", "Hover"),
			N("setting.grid.videoAutoplayMode.always", "Always")
		],
		onChange: (e) => {
			let r = {
				[N("setting.grid.videoAutoplayMode.off", "Off")]: "off",
				[N("setting.grid.videoAutoplayMode.hover", "Hover")]: "hover",
				[N("setting.grid.videoAutoplayMode.always", "Always")]: "always"
			}[e] || "off";
			t.grid = t.grid || {}, t.grid.videoAutoplayMode = r, delete t.grid.videoHoverAutoplay, V(t), H(t), n("grid.videoAutoplayMode");
		}
	}), e({
		id: `${U}.Cards.HoverColor`,
		category: i("Hover color"),
		name: "Majoor: Card hover color",
		tooltip: "Background tint used when hovering a card (hex, e.g. #3D3D3D).",
		type: "color",
		defaultValue: s(t.ui?.cardHoverColor, P.UI_CARD_HOVER_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.cardHoverColor = s(e, P.UI_CARD_HOVER_COLOR), V(t), H(t), n("ui.cardHoverColor");
		}
	}), e({
		id: `${U}.Cards.SelectionColor`,
		category: i("Selection color"),
		name: "Majoor: Card selection color",
		tooltip: "Outline/accent color used for selected cards (hex, e.g. #4A90E2).",
		type: "color",
		defaultValue: s(t.ui?.cardSelectionColor, P.UI_CARD_SELECTION_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.cardSelectionColor = s(e, P.UI_CARD_SELECTION_COLOR), V(t), H(t), n("ui.cardSelectionColor");
		}
	}), e({
		id: `${U}.Badges.RatingColor`,
		category: a("Rating color"),
		name: "Majoor: Rating badge color",
		tooltip: "Color used for rating badge text/accent (hex, e.g. #FF9500).",
		type: "color",
		defaultValue: s(t.ui?.ratingColor, P.UI_RATING_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.ratingColor = s(e, P.UI_RATING_COLOR), V(t), H(t), n("ui.ratingColor");
		}
	}), e({
		id: `${U}.Badges.TagColor`,
		category: a("Tag color"),
		name: "Majoor: Tags badge color",
		tooltip: "Color used for tags badge text/accent (hex, e.g. #4A90E2).",
		type: "color",
		defaultValue: s(t.ui?.tagColor, P.UI_TAG_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.tagColor = s(e, P.UI_TAG_COLOR), V(t), H(t), n("ui.tagColor");
		}
	});
}
// ui/app/settings/settingsViewer.ts
var At = "Majoor", jt = "Majoor Assets Manager";
function Mt(e, t, n) {
	let r = (e, t) => [
		jt,
		e,
		t
	], i = (e) => r(N("cat.viewer", "Viewer"), e), a = (e) => r(N("cat.floatingViewer", "Floating Viewer"), e);
	e({
		id: `${At}.Viewer.PauseDuringExecution`,
		category: i(N("setting.viewer.pauseExecution.name").replace("Majoor: ", "")),
		name: N("setting.viewer.pauseExecution.name"),
		tooltip: N("setting.viewer.pauseExecution.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.pauseDuringExecution,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.pauseDuringExecution = !!e, V(t), H(t), n("viewer.pauseDuringExecution");
		}
	}), e({
		id: `${At}.Viewer.FloatingPauseDuringExecution`,
		category: a(N("setting.viewer.floatingPauseExecution.name").replace("Majoor: ", "")),
		name: N("setting.viewer.floatingPauseExecution.name"),
		tooltip: N("setting.viewer.floatingPauseExecution.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.floatingPauseDuringExecution,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.floatingPauseDuringExecution = !!e, V(t), H(t), n("viewer.floatingPauseDuringExecution");
		}
	}), e({
		id: `${At}.Browser.ShowFolders`,
		category: i("Browser"),
		name: "Show folders in Input / Output panels",
		tooltip: "When enabled, subdirectories under the Input and Output roots are shown as folder cards in the browser grid. Disable to see only files.",
		type: "boolean",
		defaultValue: !!(t.browser?.showFolders ?? !1),
		onChange: async (e) => {
			let r = !!e, i = !!(t.browser?.showFolders ?? !1);
			t.browser = t.browser || {}, t.browser.showFolders = r, V(t), H(t), n("browser.showFolders");
			try {
				let e = await pe(r);
				if (!e?.ok) throw Error(e?.error || "Failed to update show folders setting");
			} catch (e) {
				t.browser.showFolders = i, V(t), H(t), n("browser.showFolders"), D(e?.message || "Failed to update show folders setting", "error");
			}
		}
	}), e({
		id: `${At}.Viewer.MfvLiveDefault`,
		category: a(N("setting.viewer.mfvLiveDefault.name").replace("Majoor: ", "")),
		name: N("setting.viewer.mfvLiveDefault.name"),
		tooltip: N("setting.viewer.mfvLiveDefault.desc"),
		type: "boolean",
		defaultValue: !!(t.viewer?.mfvLiveDefault ?? P.MFV_LIVE_DEFAULT),
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.mfvLiveDefault = !!e, V(t), H(t), n("viewer.mfvLiveDefault");
		}
	}), e({
		id: `${At}.Viewer.MfvPreviewDefault`,
		category: a(N("setting.viewer.mfvPreviewDefault.name").replace("Majoor: ", "")),
		name: N("setting.viewer.mfvPreviewDefault.name"),
		tooltip: N("setting.viewer.mfvPreviewDefault.desc"),
		type: "boolean",
		defaultValue: !!(t.viewer?.mfvPreviewDefault ?? P.MFV_PREVIEW_DEFAULT),
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.mfvPreviewDefault = !!e, V(t), H(t), n("viewer.mfvPreviewDefault");
		}
	}), e({
		id: `${At}.Viewer.MfvTopbarButton`,
		category: a("Top bar Viewer button"),
		name: "Show Viewer button in the top bar",
		tooltip: "Show a Viewer toggle button in the ComfyUI top bar next to the queue controls. Disable to hide it (the V shortcut keeps working).",
		type: "boolean",
		defaultValue: !!(t.viewer?.mfvTopbarButton ?? P.MFV_TOPBAR_BUTTON),
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.mfvTopbarButton = !!e, V(t), H(t), n("viewer.mfvTopbarButton");
		}
	}), e({
		id: `${At}.Viewer.MfvSidebarPosition`,
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
			t.viewer = t.viewer || {}, t.viewer.mfvSidebarPosition = r, V(t), H(t), n("viewer.mfvSidebarPosition");
		}
	}), e({
		id: `${At}.Viewer.MfvPreviewMethod`,
		category: a(N("setting.viewer.mfvPreviewMethod.name").replace("Majoor: ", "")),
		name: N("setting.viewer.mfvPreviewMethod.name"),
		tooltip: N("setting.viewer.mfvPreviewMethod.desc"),
		type: "combo",
		defaultValue: t.viewer?.mfvPreviewMethod || P.MFV_PREVIEW_METHOD,
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
			].includes(e) ? e : P.MFV_PREVIEW_METHOD;
			t.viewer = t.viewer || {}, t.viewer.mfvPreviewMethod = r, V(t), H(t), n("viewer.mfvPreviewMethod");
		}
	}), e({
		id: `${At}.Viewer.MfvKjPreviewOverrideEnabled`,
		category: a(N("setting.viewer.mfvKjPreviewOverride.name").replace("Majoor: ", "")),
		name: N("setting.viewer.mfvKjPreviewOverride.name"),
		tooltip: N("setting.viewer.mfvKjPreviewOverride.desc"),
		type: "boolean",
		defaultValue: !!(t.viewer?.mfvKjPreviewOverrideEnabled ?? P.MFV_KJ_PREVIEW_OVERRIDE_ENABLED),
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.mfvKjPreviewOverrideEnabled = !!e, V(t), H(t), n("viewer.mfvKjPreviewOverrideEnabled");
		}
	}), e({
		id: `${At}.Viewer.LtxavRgbFallback`,
		category: a("LTXAV preview fallback"),
		name: "Majoor: LTXAV RGB Preview Fallback (experimental)",
		tooltip: "Reuse LTXV RGB projection for LTXAV when native latent preview is unavailable. Experimental; quality may be approximate.",
		type: "boolean",
		defaultValue: !!t.viewer?.ltxavRgbFallback,
		onChange: async (e) => {
			let r = !!e, i = !!t.viewer?.ltxavRgbFallback;
			t.viewer = t.viewer || {}, t.viewer.ltxavRgbFallback = r, V(t), H(t), n("viewer.ltxavRgbFallback");
			try {
				let e = await M(r);
				if (!e?.ok) throw Error(e?.error || "Failed to update LTXAV RGB preview fallback setting");
			} catch (e) {
				t.viewer.ltxavRgbFallback = i, V(t), H(t), n("viewer.ltxavRgbFallback"), D(e?.message || "Failed to update LTXAV RGB preview fallback setting", "error");
			}
		}
	});
	try {
		u().then((e) => {
			if (!e?.ok) return;
			let r = !!e?.data?.prefs?.enabled, i = B();
			i.viewer = i.viewer || {}, !!i.viewer.ltxavRgbFallback !== r && (i.viewer.ltxavRgbFallback = r, Object.assign(t, i), V(i), H(i), n("viewer.ltxavRgbFallback"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	((r, a, o, s) => {
		e({
			id: `${At}.WorkflowMinimap.${r}`,
			category: i(N(o).replace("Majoor: ", "")),
			name: N(o),
			tooltip: N(s),
			type: "boolean",
			defaultValue: !!t.workflowMinimap?.[a],
			onChange: (e) => {
				t.workflowMinimap = t.workflowMinimap || {}, t.workflowMinimap[a] = !!e, V(t), n(`workflowMinimap.${a}`);
			}
		});
	})("Enabled", "enabled", "setting.minimap.enabled.name", "setting.minimap.enabled.desc");
}
// ui/app/settings/settingsScanning.ts
var W = "Majoor", Nt = "Majoor Assets Manager";
function Pt(e, t, n) {
	let r = (e, t) => [
		Nt,
		e,
		t
	];
	e({
		id: `${W}.ExecutionGrouping.Enabled`,
		category: r(N("cat.scanning"), "Execution grouping"),
		name: "Execution job/stack grouping",
		tooltip: "Enable or disable all live job_id / stack_id tracking, grouping, and stack finalization logic.",
		type: "boolean",
		defaultValue: !!(t.executionGrouping?.enabled ?? P.EXECUTION_GROUPING_ENABLED),
		onChange: async (e) => {
			let r = !!(t.executionGrouping?.enabled ?? P.EXECUTION_GROUPING_ENABLED), i = !!e;
			t.executionGrouping = t.executionGrouping || {}, t.executionGrouping.enabled = i, V(t), H(t), n("executionGrouping.enabled");
			try {
				let e = await le(i);
				if (!e?.ok) throw Error(e?.error || "Failed to update execution grouping setting");
				t.executionGrouping.enabled = !!e?.data?.prefs?.enabled, V(t), H(t), n("executionGrouping.enabled");
			} catch (e) {
				t.executionGrouping.enabled = r, V(t), H(t), n("executionGrouping.enabled"), D(e?.message || "Failed to update execution grouping setting", "error");
			}
		}
	}), e({
		id: `${W}.AutoScan.OnStartup`,
		category: r(N("cat.scanning"), N("setting.scan.startup.name").replace("Majoor: ", "")),
		name: N("setting.scan.startup.name"),
		tooltip: N("setting.scan.startup.desc"),
		type: "boolean",
		defaultValue: !!t.autoScan?.onStartup,
		onChange: (e) => {
			t.autoScan = t.autoScan || {}, t.autoScan.onStartup = !!e, V(t), H(t), n("autoScan.onStartup");
		}
	}), e({
		id: `${W}.Scan.FastMode`,
		category: r(N("cat.scanning"), "Scan mode"),
		name: "Fast scan mode",
		tooltip: "Use fast scan mode for manual backfill scans (skip heavier metadata work during scan).",
		type: "boolean",
		defaultValue: !!(t.scan?.fastMode ?? !0),
		onChange: (e) => {
			t.scan = t.scan || {}, t.scan.fastMode = !!e, V(t), n("scan.fastMode");
		}
	}), e({
		id: `${W}.Scan.JpegXL`,
		category: r(N("cat.scanning"), "Image formats"),
		name: "JPEG XL (JXL) support (Experimental)",
		tooltip: "Index and preview .jxl images. Preview generation requires JPEG XL support in Pillow or FFmpeg. Run a new scan after enabling.",
		type: "boolean",
		defaultValue: !!t.scan?.jxlEnabled,
		onChange: async (e) => {
			let r = !!t.scan?.jxlEnabled, i = !!e;
			t.scan = t.scan || {}, t.scan.jxlEnabled = i, V(t), n("scan.jxlEnabled");
			try {
				let e = await De(i);
				if (!e?.ok) throw Error(e?.error || "Failed to update JPEG XL support");
			} catch (e) {
				t.scan.jxlEnabled = r, V(t), n("scan.jxlEnabled"), D(e?.message || "Failed to update JPEG XL support", "error");
			}
		}
	}), E().then((e) => {
		e?.ok && (t.scan = t.scan || {}, t.scan.jxlEnabled = !!e?.data?.prefs?.enabled, V(t), n("scan.jxlEnabled"));
	}).catch(() => {}), e({
		id: `${W}.RtHydrate.Concurrency`,
		category: r(N("cat.scanning"), "Hydration"),
		name: "Hydrate Concurrency",
		tooltip: "Maximum concurrent hydration requests for rating/tags.",
		type: "number",
		defaultValue: Number(t.rtHydrate?.concurrency || P.RT_HYDRATE_CONCURRENCY || 5),
		attrs: {
			min: 1,
			max: 20,
			step: 1
		},
		onChange: (e) => {
			t.rtHydrate = t.rtHydrate || {}, t.rtHydrate.concurrency = Math.max(1, Math.min(20, Math.round(L(e, P.RT_HYDRATE_CONCURRENCY || 5)))), V(t), H(t), n("rtHydrate.concurrency");
		}
	});
	let i = (e, t, n, r) => {
		let i = Math.round(L(e, t));
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
		r.length && (V(t), r.forEach((e) => n(e)));
	}, o = async () => {
		try {
			let e = await oe();
			if (!e?.ok) return;
			a(e.data || {});
		} catch (e) {
			console.debug?.(e);
		}
	};
	e({
		id: `${W}.Watcher.Enabled`,
		category: r(N("cat.scanning"), N("setting.watcher.enabled.label", "Enable watcher")),
		name: N("setting.watcher.name"),
		tooltip: N("setting.watcher.desc") + " (env: MJR_ENABLE_WATCHER)",
		type: "boolean",
		defaultValue: !!t.watcher?.enabled,
		onChange: async (e) => {
			t.watcher = t.watcher || {}, t.watcher.enabled = !!e, V(t), n("watcher.enabled");
			try {
				let r = await ue(!!e);
				r?.ok || (t.watcher.enabled = !e, V(t), n("watcher.enabled"), D(r?.error || N("toast.failedToggleWatcher", "Failed to toggle watcher"), "error"));
			} catch {
				t.watcher.enabled = !e, V(t), n("watcher.enabled");
			}
		}
	}), e({
		id: `${W}.Watcher.DebounceDelay`,
		category: r(N("cat.scanning"), N("setting.watcher.debounce.label", "Watcher debounce delay")),
		name: N("setting.watcher.debounce.name"),
		tooltip: N("setting.watcher.debounce.desc") + " (env: MJR_WATCHER_DEBOUNCE_MS)",
		type: "number",
		defaultValue: t.watcher?.debounceMs ?? P.WATCHER_DEBOUNCE_MS,
		attrs: {
			min: 50,
			max: 6e4,
			step: 50
		},
		onChange: async (e) => {
			let r = P.WATCHER_DEBOUNCE_MS, a = i(e, r, 50, 6e4), o = t.watcher?.debounceMs ?? r;
			if (a !== o) {
				t.watcher = t.watcher || {}, t.watcher.debounceMs = a, V(t);
				try {
					let e = await v({ debounce_ms: a });
					if (!e?.ok) throw Error(e?.error || N("setting.watcher.debounce.error"));
					let r = Math.round(Number(e?.data?.debounce_ms ?? a));
					t.watcher.debounceMs = r, V(t), n("watcher.debounceMs");
				} catch (e) {
					t.watcher.debounceMs = o, V(t), n("watcher.debounceMs"), D(e?.message || N("setting.watcher.debounce.error"), "error");
				}
			}
		}
	}), e({
		id: `${W}.Watcher.DedupeWindow`,
		category: r(N("cat.scanning"), N("setting.watcher.dedupe.label", "Watcher dedupe window")),
		name: N("setting.watcher.dedupe.name"),
		tooltip: N("setting.watcher.dedupe.desc") + " (env: MJR_WATCHER_DEDUPE_TTL_MS)",
		type: "number",
		defaultValue: t.watcher?.dedupeTtlMs ?? P.WATCHER_DEDUPE_TTL_MS,
		attrs: {
			min: 100,
			max: 12e4,
			step: 100
		},
		onChange: async (e) => {
			let r = P.WATCHER_DEDUPE_TTL_MS, a = i(e, r, 100, 12e4), o = t.watcher?.dedupeTtlMs ?? r;
			if (a !== o) {
				t.watcher = t.watcher || {}, t.watcher.dedupeTtlMs = a, V(t);
				try {
					let e = await v({ dedupe_ttl_ms: a });
					if (!e?.ok) throw Error(e?.error || N("setting.watcher.dedupe.error"));
					let r = Math.round(Number(e?.data?.dedupe_ttl_ms ?? a));
					t.watcher.dedupeTtlMs = r, V(t), n("watcher.dedupeTtlMs");
				} catch (e) {
					t.watcher.dedupeTtlMs = o, V(t), n("watcher.dedupeTtlMs"), D(e?.message || N("setting.watcher.dedupe.error"), "error");
				}
			}
		}
	}), e({
		id: `${W}.Watcher.MaxPending`,
		category: r(N("cat.scanning"), "Watcher queue"),
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
			t.watcher = t.watcher || {}, t.watcher.maxPending = Math.max(10, Math.min(5e3, Math.round(L(e, 500)))), V(t), H(t), n("watcher.maxPending");
		}
	}), e({
		id: `${W}.Watcher.MinSize`,
		category: r(N("cat.scanning"), "Watcher file size"),
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
			t.watcher = t.watcher || {}, t.watcher.minSize = Math.max(0, Math.min(1e6, Math.round(L(e, 100)))), V(t), H(t), n("watcher.minSize");
		}
	}), e({
		id: `${W}.Watcher.MaxSize`,
		category: r(N("cat.scanning"), "Watcher file size"),
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
			t.watcher = t.watcher || {}, t.watcher.maxSize = Math.max(1e5, Math.min(17179869184, Math.round(L(e, 4294967296)))), V(t), H(t), n("watcher.maxSize");
		}
	});
	try {
		o().catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	e({
		id: `${W}.RatingTagsSync.Enabled`,
		category: r(N("cat.scanning"), N("setting.sync.rating.name").replace("Majoor: ", "")),
		name: N("setting.sync.rating.name"),
		tooltip: N("setting.sync.rating.desc"),
		type: "boolean",
		defaultValue: !!t.ratingTagsSync?.enabled,
		onChange: (e) => {
			t.ratingTagsSync = t.ratingTagsSync || {}, t.ratingTagsSync.enabled = !!e, V(t), n("ratingTagsSync.enabled");
		}
	});
}
// ui/app/settings/settingsFeed.ts
var Ft = "Majoor", It = "Majoor Assets Manager";
function Lt(e, t, n) {
	let r = (e) => [
		It,
		N("cat.feed", "Generated Feed"),
		e
	], i = () => {
		t.feed = t.feed || {};
	};
	e({
		id: `${Ft}.Feed.CardSize`,
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
			i(), t.feed.minSize = Math.max(60, Math.min(600, Math.round(Number(e) || 120))), V(t), H(t), n("feed.minSize");
		}
	}), e({
		id: `${Ft}.Feed.ShowInfo`,
		category: r("Show info section"),
		name: "Show card info section",
		tooltip: "Show or hide the entire info section (filename, metadata, dots) below thumbnails in the Generated Feed.",
		type: "boolean",
		defaultValue: !!(t.feed?.showInfo ?? P.FEED_SHOW_INFO),
		onChange: (e) => {
			i(), t.feed.showInfo = !!e, V(t), H(t), n("feed.showInfo");
		}
	}), e({
		id: `${Ft}.Feed.ShowFilename`,
		category: r("Show filename"),
		name: "Show filename",
		tooltip: "Display the filename on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showFilename ?? P.FEED_SHOW_FILENAME),
		onChange: (e) => {
			i(), t.feed.showFilename = !!e, V(t), H(t), n("feed.showFilename");
		}
	}), e({
		id: `${Ft}.Feed.ShowDimensions`,
		category: r("Show dimensions"),
		name: "Show dimensions",
		tooltip: "Display resolution (WxH) and duration on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDimensions ?? P.FEED_SHOW_DIMENSIONS),
		onChange: (e) => {
			i(), t.feed.showDimensions = !!e, V(t), H(t), n("feed.showDimensions");
		}
	}), e({
		id: `${Ft}.Feed.ShowDate`,
		category: r("Show date/time"),
		name: "Show date/time",
		tooltip: "Display date and time on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDate ?? P.FEED_SHOW_DATE),
		onChange: (e) => {
			i(), t.feed.showDate = !!e, V(t), H(t), n("feed.showDate");
		}
	}), e({
		id: `${Ft}.Feed.ShowGenTime`,
		category: r("Show generation time"),
		name: "Show generation time",
		tooltip: "Display the generation time badge on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showGenTime ?? P.FEED_SHOW_GENTIME),
		onChange: (e) => {
			i(), t.feed.showGenTime = !!e, V(t), H(t), n("feed.showGenTime");
		}
	}), e({
		id: `${Ft}.Feed.ShowWorkflowDot`,
		category: r("Show workflow dot"),
		name: "Show workflow indicator",
		tooltip: "Display the workflow availability dot on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showWorkflowDot ?? P.FEED_SHOW_WORKFLOW_DOT),
		onChange: (e) => {
			i(), t.feed.showWorkflowDot = !!e, V(t), H(t), n("feed.showWorkflowDot");
		}
	}), e({
		id: `${Ft}.Feed.ShowExtBadge`,
		category: r("Show format badges"),
		name: "Show format badges",
		tooltip: "Display format badges (e.g. JPG, MP4) on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showExtBadge ?? P.FEED_SHOW_BADGES_EXTENSION),
		onChange: (e) => {
			i(), t.feed.showExtBadge = !!e, V(t), H(t), n("feed.showExtBadge");
		}
	}), e({
		id: `${Ft}.Feed.ShowRatingBadge`,
		category: r("Show rating badges"),
		name: "Show ratings",
		tooltip: "Display star ratings on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showRatingBadge ?? P.FEED_SHOW_BADGES_RATING),
		onChange: (e) => {
			i(), t.feed.showRatingBadge = !!e, V(t), H(t), n("feed.showRatingBadge");
		}
	}), e({
		id: `${Ft}.Feed.ShowTagsBadge`,
		category: r("Show tags badges"),
		name: "Show tags",
		tooltip: "Display tag indicators on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showTagsBadge ?? P.FEED_SHOW_BADGES_TAGS),
		onChange: (e) => {
			i(), t.feed.showTagsBadge = !!e, V(t), H(t), n("feed.showTagsBadge");
		}
	});
}
// ui/app/settings/settingsSecurity.ts
var Rt = "Majoor", zt = "Majoor Assets Manager", Bt = 16, Vt = {
	safeMode: !1,
	allowWrite: !0,
	allowDelete: !0,
	allowRename: !0,
	allowOpenInFolder: !0,
	allowResetIndex: !0
};
function Ht(e) {
	return !!e;
}
function Ut(e, t) {
	return Ht(e) === Ht(t);
}
function Wt(e) {
	return typeof e == "string" ? e.trim() : "";
}
function Gt(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "localhost" || t === "127.0.0.1" || t === "::1";
}
function Kt() {
	return globalThis.location || globalThis.window?.location || null;
}
function qt() {
	let e = Kt();
	if (!e) return !1;
	let t = String(e.protocol || "").toLowerCase(), n = String(e.hostname || "").trim();
	return t === "http:" && !Gt(n);
}
function Jt(e) {
	let t = globalThis.crypto;
	if (!t?.getRandomValues) throw Error("Secure token generation requires crypto.getRandomValues().");
	return t.getRandomValues(e);
}
function Yt(e) {
	let t = Math.max(4, Number(e) || 0), n = new Uint8Array(t);
	return Jt(n), Array.from(n, (e) => e.toString(16).padStart(2, "0")).join("");
}
function Xt() {
	return `mjr_${Yt(18)}`;
}
function Zt(e) {
	return String(e?.apiToken || "").trim().length >= Bt && I(e?.allowWrite, !0) && I(e?.requireAuth, !1) && !I(e?.allowRemoteWrite, !1);
}
function Qt(e) {
	let t = String((e && typeof e == "object" ? e : {}).apiToken || "").trim();
	return {
		apiToken: t.length >= Bt ? t : Xt(),
		allowWrite: !0,
		requireAuth: !0,
		allowRemoteWrite: !1,
		allowInsecureTokenTransport: qt()
	};
}
function $t(e) {
	let t = e || {};
	return {
		safe_mode: I(t.safeMode, !1),
		allow_write: I(t.allowWrite, !0),
		require_auth: I(t.requireAuth, !1),
		allow_remote_write: I(t.allowRemoteWrite, !1),
		allow_insecure_token_transport: I(t.allowInsecureTokenTransport, !1),
		allow_delete: I(t.allowDelete, !0),
		allow_rename: I(t.allowRename, !0),
		allow_open_in_folder: I(t.allowOpenInFolder, !0),
		allow_reset_index: I(t.allowResetIndex, !0),
		...String(t.apiToken || "").trim() ? { api_token: String(t.apiToken || "").trim() } : {}
	};
}
function en(e) {
	return w($t(e));
}
function tn(e) {
	let t = String(e?.security?.tokenHint || "").trim();
	return t ? N("setting.sec.token.placeholderConfigured", "Token configured on server ({tokenHint}). Leave blank to keep the current server token.", { tokenHint: t }) : e?.security?.tokenConfigured ? N("setting.sec.token.placeholderConfiguredGeneric", "Token configured on server. Leave blank to keep the current server token.") : N("setting.sec.token.placeholder", "Auto-generated for this browser session.");
}
function nn(e, t, n) {
	let r = (e, t) => [
		zt,
		e,
		t
	];
	e({
		id: `${Rt}.Safety.ConfirmDeletion`,
		category: r(N("cat.security"), "Confirm before deleting"),
		name: "Confirm before deleting",
		tooltip: "Show a confirmation dialog before deleting files. Disabling this allows instant deletion.",
		type: "boolean",
		defaultValue: t.safety?.confirmDeletion !== !1,
		onChange: (e) => {
			Ut(t.safety?.confirmDeletion !== !1, e) || (t.safety = t.safety || {}, t.safety.confirmDeletion = !!e, V(t), H(t), n("safety.confirmDeletion"));
		}
	});
	let i = (i, a, o, s = "cat.security") => {
		e({
			id: `${Rt}.Security.${i}`,
			category: r(N(s), N(a).replace("Majoor: ", "")),
			name: N(a),
			tooltip: N(o),
			type: "boolean",
			defaultValue: I(t.security?.[i], Vt[i] ?? !1),
			onChange: (e) => {
				if (!Ut(t.security?.[i], e)) {
					t.security = t.security || {}, t.security[i] = !!e, V(t), n(`security.${i}`);
					try {
						en(t.security).then((e) => {
							e?.ok && e.data?.prefs ? nt() : e && e.ok === !1 && console.warn("[Majoor] backend security settings update failed", e.error || e);
						}).catch(() => {});
					} catch (e) {
						console.debug?.(e);
					}
				}
			}
		});
	};
	i("safeMode", "setting.sec.safe.name", "setting.sec.safe.desc"), i("allowWrite", "setting.sec.write.name", "setting.sec.write.desc"), i("allowDelete", "setting.sec.del.name", "setting.sec.del.desc"), i("allowRename", "setting.sec.ren.name", "setting.sec.ren.desc"), i("allowOpenInFolder", "setting.sec.open.name", "setting.sec.open.desc"), i("allowResetIndex", "setting.sec.reset.name", "setting.sec.reset.desc"), e({
		id: `${Rt}.Security.RemoteLanPreset`,
		category: r(N("cat.remote"), N("setting.sec.remoteLanPreset.name").replace("Majoor: ", "")),
		name: N("setting.sec.remoteLanPreset.name"),
		tooltip: N("setting.sec.remoteLanPreset.desc"),
		type: "boolean",
		defaultValue: Zt(t.security),
		onChange: (e) => {
			if (t.security = t.security || {}, Ut(t.security.remoteLanPreset, e)) return;
			if (t.security.remoteLanPreset = !!e, !e) {
				V(t), n("security.remoteLanPreset");
				return;
			}
			let r;
			try {
				r = Qt(t.security);
			} catch (e) {
				D(e?.message || N("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				return;
			}
			Object.assign(t.security, r), t.security.tokenConfigured = !0, t.security.tokenHint = String(r.apiToken || "").trim() ? `...${String(r.apiToken).trim().slice(-4)}` : "", r.apiToken && T(r.apiToken), V(t), n("security.remoteLanPreset"), n("security.apiToken"), n("security.allowWrite"), n("security.requireAuth"), n("security.allowRemoteWrite"), n("security.allowInsecureTokenTransport");
			try {
				en(t.security).then((e) => {
					e?.ok && e.data?.prefs ? (nt(), D(N("toast.remoteLanPresetApplied", "Recommended remote LAN setup applied. This browser session is now authorized for Majoor write operations."), "success")) : e && e.ok === !1 && (D(e.error || N("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error"), console.warn("[Majoor] backend remote LAN preset update failed", e.error || e));
				}).catch((e) => {
					D(e?.message || N("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), e({
		id: `${Rt}.Security.ApiToken`,
		category: r(N("cat.remote"), N("setting.sec.token.name").replace("Majoor: ", "")),
		name: N("setting.sec.token.name", "Majoor: API Token"),
		tooltip: N("setting.sec.token.desc", "Store the API token used for write operations. Majoor sends it via X-MJR-Token and Authorization headers."),
		type: "text",
		defaultValue: t.security?.apiToken || "",
		attrs: { placeholder: tn(t) },
		onChange: (e) => {
			t.security = t.security || {};
			let r = Wt(e);
			if (Wt(t.security.apiToken) !== r && (t.security.apiToken = r, t.security.apiToken && (t.security.tokenConfigured = !0, t.security.tokenHint = `...${t.security.apiToken.slice(-4)}`, T(t.security.apiToken)), V(t), n("security.apiToken"), t.security.apiToken)) try {
				w({ api_token: t.security.apiToken }).then((e) => {
					e?.ok && e.data?.prefs ? nt() : e && e.ok === !1 && console.warn("[Majoor] backend token update failed", e.error || e);
				}).catch(() => {});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), i("requireAuth", "setting.sec.requireAuth.name", "setting.sec.requireAuth.desc", "cat.remote"), i("allowRemoteWrite", "setting.sec.remote.name", "setting.sec.remote.desc", "cat.remote"), i("allowInsecureTokenTransport", "setting.sec.insecureTransport.name", "setting.sec.insecureTransport.desc", "cat.remote");
}
// ui/app/settings/settingsAdvanced.ts
var G = "Majoor", rn = "Majoor Assets Manager";
function an(e, n, r, a) {
	let s = (e, t) => [
		rn,
		e,
		t
	], l = String(n.paths?.outputDirectory || ""), u = null, f = 0, _ = null;
	e({
		id: `${G}.Paths.OutputDirectory`,
		category: s(N("cat.advanced"), "Paths / Output"),
		name: "Majoor: Generation Output Directory",
		tooltip: "Override the ComfyUI generation output directory used by Majoor (equivalent to --output-directory). Leave empty to keep the current backend default.",
		type: "text",
		defaultValue: String(n.paths?.outputDirectory || ""),
		attrs: { placeholder: "D:\\\\____COMFY_OUTPUTS" },
		onChange: async (e) => {
			let t = String(e || "").trim();
			n.paths = n.paths || {}, n.paths.outputDirectory = t, V(n);
			try {
				u &&= (clearTimeout(u), null);
			} catch (e) {
				console.debug?.(e);
			}
			u = setTimeout(async () => {
				u = null;
				let e = ++f;
				try {
					_?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				_ = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let i = await C(t, _ ? { signal: _.signal } : {});
					if (e !== f) return;
					if (!i?.ok) throw Error(i?.error || N("toast.failedSetOutputDirectory", "Failed to set output directory"));
					let a = String(i?.data?.output_directory || t).trim();
					n.paths.outputDirectory = a, l = a, V(n), r("paths.outputDirectory");
				} catch (t) {
					if (e !== f || String(t?.name || "") === "AbortError" || String(t?.code || "") === "ABORTED") return;
					n.paths.outputDirectory = l, V(n), r("paths.outputDirectory"), D(t?.message || N("toast.failedSetOutputDirectory", "Failed to set output directory"), "error");
				}
			}, 700);
		}
	});
	try {
		ve().then((e) => {
			if (!e?.ok) return;
			let t = String(e?.data?.output_directory || "").trim();
			n.paths = n.paths || {}, n.paths.outputDirectory !== t && (n.paths.outputDirectory = t, l = t, V(n), r("paths.outputDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let v = String(n.paths?.inputDirectory || ""), y = null, w = 0, T = null, E = (e) => {
		n.paths = n.paths || {}, n.paths.inputDirectory = e, V(n), S(a, `${G}.Paths.InputDirectory`, e), r("paths.inputDirectory");
	};
	e({
		id: `${G}.Paths.InputDirectory`,
		category: s(N("cat.advanced"), "Paths / Input"),
		name: "Majoor: Input Directory",
		tooltip: "Override the folder indexed by the Inputs tab. Leave empty to use ComfyUI's input directory (--input-directory). Run a scan after changing it.",
		type: "text",
		defaultValue: String(n.paths?.inputDirectory || ""),
		attrs: { placeholder: "D:\\ComfyUI\\input" },
		onChange: (e) => {
			let t = String(e || "").trim();
			if (t === String(n.paths?.inputDirectory || "")) return;
			n.paths = n.paths || {}, n.paths.inputDirectory = t, V(n), y && clearTimeout(y);
			let r = ++w;
			T?.abort(), y = setTimeout(async () => {
				y = null, T = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let e = await Se(t, T ? { signal: T.signal } : {});
					if (r !== w) return;
					if (!e?.ok) throw Error(e?.error || "Failed to set input directory");
					let n = String(e?.data?.input_directory ?? t).trim();
					v = n, E(n);
				} catch (e) {
					if (r !== w || e?.name === "AbortError" || e?.code === "ABORTED") return;
					E(v), D(e?.message || "Failed to set input directory", "error");
				}
			}, 700);
		}
	});
	try {
		ee().then((e) => {
			if (!e?.ok || w !== 0) return;
			let t = String(e?.data?.input_directory || "").trim();
			v = t, E(t);
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let O = String(n.paths?.indexDirectory || ""), k = null, re = 0, A = null;
	e({
		id: `${G}.Paths.IndexDirectory`,
		category: s(N("cat.advanced"), "Paths / Index"),
		name: "Majoor: Index Database Directory",
		tooltip: "Override the Majoor index database directory. Use this to keep the SQLite index on a different local disk. Requires restart.",
		type: "text",
		defaultValue: String(n.paths?.indexDirectory || ""),
		attrs: { placeholder: "D:\\MajoorIndex" },
		onChange: async (e) => {
			let t = String(e || "").trim();
			n.paths = n.paths || {}, n.paths.indexDirectory = t, V(n);
			try {
				k &&= (clearTimeout(k), null);
			} catch (e) {
				console.debug?.(e);
			}
			k = setTimeout(async () => {
				k = null;
				let e = ++re;
				try {
					A?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				A = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let i = await ie(t, A ? { signal: A.signal } : {});
					if (e !== re) return;
					if (!i?.ok) throw Error(i?.error || N("toast.failedSetIndexDirectory", "Failed to set index directory"));
					let a = String(i?.data?.index_directory || t).trim(), o = a !== O;
					n.paths.indexDirectory = a, O = a, V(n), r("paths.indexDirectory"), o && D(N("toast.indexDirectorySavedRestart", "Index directory saved. Restart ComfyUI to apply."), "success", void 0, { history: { trackId: "settings:index-directory-saved" } });
				} catch (t) {
					if (e !== re || String(t?.name || "") === "AbortError" || String(t?.code || "") === "ABORTED") return;
					n.paths.indexDirectory = O, V(n), r("paths.indexDirectory"), D(t?.message || N("toast.failedSetIndexDirectory", "Failed to set index directory"), "error");
				}
			}, 700);
		}
	});
	try {
		d().then((e) => {
			if (!e?.ok) return;
			let t = String(e?.data?.index_directory || "").trim();
			n.paths = n.paths || {}, n.paths.indexDirectory !== t && (n.paths.indexDirectory = t, O = t, V(n), r("paths.indexDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let j = String(n.paths?.workflowRoots || ""), M = null, oe = 0, ce = null;
	e({
		id: `${G}.Paths.WorkflowRoots`,
		category: s(N("cat.advanced"), "Paths / Workflows"),
		name: "Majoor: Workflow Roots",
		tooltip: "Folders scanned by the Workflow tab. Use one folder per line, or separate folders with semicolons. Leave empty to use ComfyUI defaults and MJR_AM_WORKFLOW_DIRECTORY.",
		type: "text",
		defaultValue: String(n.paths?.workflowRoots || ""),
		attrs: { placeholder: "D:\\\\ComfyUI\\\\user\\\\default\\\\workflows" },
		onChange: async (e) => {
			let t = String(e || "").trim();
			n.paths = n.paths || {}, n.paths.workflowRoots = t, V(n);
			try {
				M &&= (clearTimeout(M), null);
			} catch (e) {
				console.debug?.(e);
			}
			M = setTimeout(async () => {
				M = null;
				let e = ++oe;
				try {
					ce?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				ce = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let i = await fe(t, ce ? { signal: ce.signal } : {});
					if (e !== oe) return;
					if (!i?.ok) throw Error(i?.error || N("toast.failedSetWorkflowRoots", "Failed to set workflow roots"));
					let a = String(i?.data?.workflow_roots_text || t).trim();
					n.paths.workflowRoots = a, j = a, V(n), r("paths.workflowRoots"), D(N("toast.workflowRootsSaved", "Workflow roots saved"), "success", 1800);
				} catch (t) {
					if (e !== oe || String(t?.name || "") === "AbortError" || String(t?.code || "") === "ABORTED") return;
					n.paths.workflowRoots = j, V(n), r("paths.workflowRoots"), D(t?.message || N("toast.failedSetWorkflowRoots", "Failed to set workflow roots"), "error");
				}
			}, 700);
		}
	});
	try {
		he().then((e) => {
			if (!e?.ok) return;
			let t = String(e?.data?.workflow_roots_text || "").trim();
			n.paths = n.paths || {}, n.paths.workflowRoots !== t && (n.paths.workflowRoots = t, j = t, V(n), r("paths.workflowRoots"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let le = t().map((e) => e.code), ue = ["auto", ...le];
	e({
		id: `${G}.Language`,
		category: s(N("cat.advanced"), N("setting.language.name", "Language")),
		name: N("setting.language.name", "Majoor: Language"),
		tooltip: "Use auto to detect and follow ComfyUI language. Or choose a fixed language for Majoor only.",
		type: "combo",
		defaultValue: n.i18n?.followComfyLanguage ? "auto" : x(),
		options: ue,
		onChange: (e) => {
			n.i18n = n.i18n || {}, e === "auto" ? (n.i18n.followComfyLanguage = !0, be(!0), ae(a), V(n), r("language")) : le.includes(e) && (n.i18n.followComfyLanguage = !1, be(!1), me(e), V(n), r("language"));
		}
	}), e({
		id: `${G}.ProbeBackend.Mode`,
		category: s(N("cat.advanced"), N("setting.probe.mode.name").replace("Majoor: ", "")),
		name: N("setting.probe.mode.name"),
		tooltip: N("setting.probe.mode.desc") + " (env: MAJOOR_MEDIA_PROBE_BACKEND)",
		type: "combo",
		defaultValue: n.probeBackend?.mode || z.probeBackend.mode,
		options: [
			"auto",
			"exiftool",
			"ffprobe",
			"both"
		],
		onChange: (e) => {
			let t = ke(e, [
				"auto",
				"exiftool",
				"ffprobe",
				"both"
			], z.probeBackend.mode);
			n.probeBackend = n.probeBackend || {}, n.probeBackend.mode = t, V(n), H(n), r("probeBackend.mode"), o(t).catch(() => {});
		}
	}), e({
		id: `${G}.MetadataFallback.Image`,
		category: s(N("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Images)",
		tooltip: "Enable Pillow fallback when ExifTool is missing or fails.",
		type: "boolean",
		defaultValue: n.metadataFallback?.image ?? z.metadataFallback.image,
		onChange: async (e) => {
			let t = !!e, i = !!(n.metadataFallback?.image ?? z.metadataFallback.image);
			n.metadataFallback = n.metadataFallback || {}, n.metadataFallback.image = t, V(n), r("metadataFallback.image");
			try {
				let e = await Te({
					image: t,
					media: n.metadataFallback?.media ?? z.metadataFallback.media
				});
				if (!e?.ok) throw Error(e?.error || N("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				n.metadataFallback.image = i, V(n), r("metadataFallback.image"), D(e?.message || N("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	}), e({
		id: `${G}.MetadataFallback.Media`,
		category: s(N("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Audio/Video)",
		tooltip: "Enable hachoir fallback when ffprobe is missing or fails.",
		type: "boolean",
		defaultValue: n.metadataFallback?.media ?? z.metadataFallback.media,
		onChange: async (e) => {
			let t = !!e, i = !!(n.metadataFallback?.media ?? z.metadataFallback.media);
			n.metadataFallback = n.metadataFallback || {}, n.metadataFallback.media = t, V(n), r("metadataFallback.media");
			try {
				let e = await Te({
					image: n.metadataFallback?.image ?? z.metadataFallback.image,
					media: t
				});
				if (!e?.ok) throw Error(e?.error || N("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				n.metadataFallback.media = i, V(n), r("metadataFallback.media"), D(e?.message || N("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	});
	try {
		m().then((e) => {
			if (!e?.ok || !e?.data?.prefs) return;
			let t = e.data.prefs || {}, i = !!(t.image ?? z.metadataFallback.image), a = !!(t.media ?? z.metadataFallback.media);
			n.metadataFallback = n.metadataFallback || {};
			let o = !1;
			n.metadataFallback.image !== i && (n.metadataFallback.image = i, o = !0), n.metadataFallback.media !== a && (n.metadataFallback.media = a, o = !0), o && (V(n), r("metadataFallback"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	e({
		id: `${G}.Db.Timeout`,
		category: s(N("cat.advanced"), "Database"),
		name: "DB Timeout (ms)",
		tooltip: "Client-side DB timeout preference (stored locally).",
		type: "number",
		defaultValue: Number(n.db?.timeoutMs || 5e3),
		attrs: {
			min: 1e3,
			max: 3e4,
			step: 1e3
		},
		onChange: (e) => {
			n.db = n.db || {}, n.db.timeoutMs = Math.max(1e3, Math.min(3e4, Math.round(L(e, 5e3)))), V(n), H(n), r("db.timeoutMs");
		}
	}), e({
		id: `${G}.Db.MaxConnections`,
		category: s(N("cat.advanced"), "Database"),
		name: "DB Max Connections",
		tooltip: "Client-side DB max connections preference (stored locally).",
		type: "number",
		defaultValue: Number(n.db?.maxConnections || 10),
		attrs: {
			min: 1,
			max: 100,
			step: 1
		},
		onChange: (e) => {
			n.db = n.db || {}, n.db.maxConnections = Math.max(1, Math.min(100, Math.round(L(e, 10)))), V(n), H(n), r("db.maxConnections");
		}
	}), e({
		id: `${G}.Db.QueryTimeout`,
		category: s(N("cat.advanced"), "Database"),
		name: "DB Query Timeout (ms)",
		tooltip: "Client-side DB query timeout preference (stored locally).",
		type: "number",
		defaultValue: Number(n.db?.queryTimeoutMs || 1e3),
		attrs: {
			min: 500,
			max: 1e4,
			step: 500
		},
		onChange: (e) => {
			n.db = n.db || {}, n.db.queryTimeoutMs = Math.max(500, Math.min(1e4, Math.round(L(e, 1e3)))), V(n), H(n), r("db.queryTimeoutMs");
		}
	}), e({
		id: `${G}.Observability.Enabled`,
		category: s(N("cat.advanced"), N("setting.obs.enabled.name").replace("Majoor: ", "")),
		name: N("setting.obs.enabled.name"),
		tooltip: N("setting.obs.enabled.desc"),
		type: "boolean",
		defaultValue: !!n.observability?.enabled,
		onChange: (e) => {
			n.observability = n.observability || {}, n.observability.enabled = !!e, V(n), H(n), r("observability.enabled");
		}
	}), e({
		id: `${G}.Observability.RuntimeDashboardMode`,
		category: s(N("cat.advanced"), "Runtime metrics badge"),
		name: "Majoor: Runtime metrics badge",
		tooltip: "Controls the small DB/enrichment/watcher metrics badge in the Assets Manager panel.",
		type: "combo",
		defaultValue: n.observability?.runtimeDashboardMode || z.observability.runtimeDashboardMode,
		options: [
			"autoHide30",
			"always",
			"hidden"
		],
		onChange: (e) => {
			let t = ke(e, [
				"autoHide30",
				"always",
				"hidden"
			], z.observability.runtimeDashboardMode);
			n.observability = n.observability || {}, n.observability.runtimeDashboardMode = t, V(n), r("observability.runtimeDashboardMode");
		}
	}), e({
		id: `${G}.Observability.VerboseErrors`,
		category: s(N("cat.advanced"), "Verbose error logging"),
		name: "Verbose error logging",
		tooltip: "Show detailed error messages in toasts and console. Useful for debugging.",
		type: "boolean",
		defaultValue: !!n.observability?.verboseErrors,
		onChange: (e) => {
			n.observability = n.observability || {}, n.observability.verboseErrors = !!e, V(n), H(n), r("observability.verboseErrors");
		}
	}), e({
		id: `${G}.Observability.VerboseRouteRegistrationLogs`,
		category: s(N("cat.advanced"), "Logs"),
		name: "Majoor: Verbose route registration logs",
		tooltip: "When disabled, Majoor prints a compact startup summary instead of listing every registered API route. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(n.observability?.verboseRouteRegistrationLogs ?? z.observability?.verboseRouteRegistrationLogs ?? !1),
		onChange: async (e) => {
			let t = !!e, i = !!(n.observability?.verboseRouteRegistrationLogs ?? z.observability?.verboseRouteRegistrationLogs ?? !1);
			n.observability = n.observability || {}, n.observability.verboseRouteRegistrationLogs = t, V(n), r("observability.verboseRouteRegistrationLogs");
			try {
				let e = await Ce(t);
				if (!e?.ok) throw Error(e?.error || "Failed to update route logging settings");
			} catch (e) {
				n.observability.verboseRouteRegistrationLogs = i, V(n), r("observability.verboseRouteRegistrationLogs"), D(e?.message || "Failed to update route logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let e = !!(await p())?.data?.prefs?.enabled;
			n.observability = n.observability || {}, n.observability.verboseRouteRegistrationLogs !== e && (n.observability.verboseRouteRegistrationLogs = e, V(n), r("observability.verboseRouteRegistrationLogs"));
		} catch (e) {
			console.debug?.(e);
		}
	})(), e({
		id: `${G}.Observability.VerboseStartupLogs`,
		category: s(N("cat.advanced"), "Logs"),
		name: "Majoor: Verbose startup logs",
		tooltip: "When disabled, Majoor suppresses most informational bootstrap logs during backend startup while keeping warnings and errors. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(n.observability?.verboseStartupLogs ?? z.observability?.verboseStartupLogs ?? !1),
		onChange: async (e) => {
			let t = !!e, i = !!(n.observability?.verboseStartupLogs ?? z.observability?.verboseStartupLogs ?? !1);
			n.observability = n.observability || {}, n.observability.verboseStartupLogs = t, V(n), r("observability.verboseStartupLogs");
			try {
				let e = await c(t);
				if (!e?.ok) throw Error(e?.error || "Failed to update startup logging settings");
			} catch (e) {
				n.observability.verboseStartupLogs = i, V(n), r("observability.verboseStartupLogs"), D(e?.message || "Failed to update startup logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let e = !!(await ne())?.data?.prefs?.enabled;
			n.observability = n.observability || {}, n.observability.verboseStartupLogs !== e && (n.observability.verboseStartupLogs = e, V(n), r("observability.verboseStartupLogs"));
		} catch (e) {
			console.debug?.(e);
		}
	})();
	{
		let t = "HuggingFace Token", i = "", a = null, o = 0, c = !!n.ai?.huggingFaceTokenVisible, l = () => {
			try {
				let e = Array.from(document.querySelectorAll("input[data-mjr-hf-token=\"1\"]"));
				for (let t of e) try {
					t.type = c ? "text" : "password";
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
		e({
			id: `${G}.AI.HuggingFaceTokenVisible`,
			category: s(N("cat.advanced"), t),
			name: "Show HuggingFace token",
			tooltip: "Show or hide the HuggingFace token while editing.",
			type: "boolean",
			defaultValue: c,
			onChange: (e) => {
				let t = !!e;
				c = t, n.ai = n.ai || {}, n.ai.huggingFaceTokenVisible = t, V(n), r("ai.huggingFaceTokenVisible"), setTimeout(l, 0);
			}
		}), e({
			id: `${G}.AI.HuggingFaceToken`,
			category: s(N("cat.advanced"), t),
			name: "HuggingFace Token",
			tooltip: "Optional token for HuggingFace Hub downloads (higher rate limits).\nSaved server-side and used by CLIP model loading.\nLeave empty to clear the stored token.",
			type: "text",
			defaultValue: "",
			attrs: {
				placeholder: "Paste HuggingFace token (hf_...)",
				type: c ? "text" : "password",
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
						let e = ++o;
						try {
							let n = await se(t);
							if (e !== o) return;
							if (!n?.ok) throw Error(n?.error || "Failed to update HuggingFace token");
							i = t, r("ai.huggingFaceToken"), t ? D("HuggingFace token saved", "success") : D("HuggingFace token cleared", "success", void 0, { noHistory: !0 });
						} catch (t) {
							if (e !== o) return;
							D(t?.message || "Failed to update HuggingFace token", "error");
						}
					}, 900);
				}
			}
		}), setTimeout(l, 0), (async () => {
			try {
				let e = (await te())?.data?.prefs || {}, t = !!e?.has_token, n = String(e?.token_hint || "").trim(), r = t ? `Configured ${n || "(saved)"}` : "Paste HuggingFace token (hf_...)";
				u(r);
			} catch (e) {
				console.debug?.(e);
			}
		})(), e({
			id: `${G}.AI.VerboseLogs`,
			category: s(N("cat.advanced"), t),
			name: "Majoor: Verbose AI logs",
			tooltip: "Enable detailed HuggingFace/SigLIP2/X-CLIP logs and progress bars during model download/loading.",
			type: "boolean",
			defaultValue: !!(n.ai?.verboseAiLogs ?? z.ai?.verboseAiLogs ?? !1),
			onChange: async (e) => {
				let t = !!e, i = !!(n.ai?.verboseAiLogs ?? z.ai?.verboseAiLogs ?? !1);
				n.ai = n.ai || {}, n.ai.verboseAiLogs = t, V(n), r("ai.verboseAiLogs");
				try {
					let e = await _e(t);
					if (!e?.ok) throw Error(e?.error || "Failed to update AI logging settings");
				} catch (e) {
					n.ai.verboseAiLogs = i, V(n), r("ai.verboseAiLogs"), D(e?.message || "Failed to update AI logging settings", "error");
				}
			}
		}), (async () => {
			try {
				let e = !!(await g())?.data?.prefs?.enabled;
				n.ai = n.ai || {}, n.ai.verboseAiLogs !== e && (n.ai.verboseAiLogs = e, V(n), r("ai.verboseAiLogs"));
			} catch (e) {
				console.debug?.(e);
			}
		})();
	}
	e({
		id: `${G}.AI.VectorStats`,
		category: s(N("cat.advanced"), "AI / Vector Search"),
		name: "Vector Index Status",
		tooltip: "Current status of the SigLIP2/X-CLIP vector index used for semantic search",
		type: "text",
		defaultValue: "Loading vector status..."
	}), (async () => {
		try {
			let e = await i();
			e?.ok ? console.debug?.("[Majoor] Vector status:", `${e.data?.total || 0} assets indexed | Model: ${e.data?.model || "N/A"}`) : console.debug?.("[Majoor] Vector status unavailable");
		} catch (e) {
			console.debug?.("[Majoor] Vector status fetch failed", e);
		}
	})(), e({
		id: `${G}.AI.VectorBackfillAction`,
		category: s(N("cat.advanced"), "AI / Vector Search"),
		name: "Vector Index Action",
		tooltip: "Compute CLIP embeddings for all assets that don't have them yet.\nThis is required for AI semantic search to work.\n\nChoose 'Run backfill now' to start indexing.\nThis may take several minutes for large libraries.\n\nNote: New assets are indexed automatically during scanning.",
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
				D(N("toast.vectorBackfillStarting", "Starting vector backfill... This may take a while."), "info", void 0, { history: {
					...t.history,
					status: "started",
					detail: "Starting vector backfill... This may take a while."
				} });
				let e = await b(64, { onProgress: (e) => {
					let n = String(e?.status || "running").toLowerCase() || "running", r = e?.progress || e?.result || {}, i = Number(r?.candidates ?? r?.processed ?? 0), a = Number(r?.indexed ?? 0), o = Number(r?.skipped ?? 0), s = Number(r?.errors ?? 0), c = Math.max(i, a + o + s), l = c > 0 ? Math.round((a + o + s) / c * 100) : null, u = n === "queued" ? "Vector backfill queued" : `Candidates ${i}, indexed ${a}, skipped ${o}, errors ${s}`;
					h({
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
					let n = e.data || {}, r = String(n?.status || "").toLowerCase(), a = !!n?.pending || [
						"queued",
						"running",
						"pending"
					].includes(r), o = n?.progress || {}, s = Number(n?.processed ?? o?.candidates ?? 0), c = Number(n?.indexed ?? o?.indexed ?? 0), l = Number(n?.skipped ?? o?.skipped ?? 0);
					if (a) {
						let e = String(n?.job_id || "").trim();
						D(N("toast.vectorBackfillRunning", "Vector backfill still running in background{job}.", { job: e ? ` (job ${e.slice(0, 8)})` : "" }), "info", void 0, { history: {
							...t.history,
							status: "running",
							detail: `Vector backfill still running in background${e ? ` (${e.slice(0, 8)})` : ""}.`,
							progress: {
								current: c + l,
								total: Math.max(s, c + l),
								percent: Math.max(s, c + l) > 0 ? Math.round((c + l) / Math.max(s, c + l) * 100) : null,
								indexed: c,
								skipped: l,
								label: "running"
							}
						} });
					} else {
						let e = N("toast.vectorBackfillComplete", "Vector backfill complete! Processed: {processed}, Indexed: {indexed}, Skipped: {skipped}", {
							processed: s,
							indexed: c,
							skipped: l
						});
						D(e, "success", void 0, { history: {
							...t.history,
							status: "succeeded",
							detail: `Processed ${s}, indexed ${c}, skipped ${l}`,
							progress: {
								current: s,
								total: s,
								percent: s > 0 ? 100 : null,
								indexed: c,
								skipped: l,
								label: "done"
							}
						} });
					}
					try {
						let e = await i();
						e?.ok && console.debug?.("[Majoor] Vector stats after backfill:", e.data);
					} catch (e) {
						console.debug?.("[Majoor] Failed to refresh vector stats:", e);
					}
				} else throw Error(e?.error || N("toast.vectorBackfillFailedGeneric", "Backfill failed"));
			} catch (e) {
				let n = e?.message || String(e || N("status.unknown", "unknown"));
				D(N("toast.vectorBackfillFailedDetail", "Vector backfill failed: {error}", { error: n }), "error", void 0, { history: {
					...t.history,
					status: "failed",
					detail: n
				} }), console.error("[Majoor] Vector backfill error:", e);
			}
		}
	});
}
// ui/app/settings/settingsSearch.ts
var on = "Majoor", sn = "Majoor Assets Manager";
function cn(e, t, n) {
	let r = (e, t) => [
		sn,
		e,
		t
	];
	e({
		id: `${on}.AI.VectorSearchEnabled`,
		category: r(N("cat.search", "Search"), "AI"),
		name: N("setting.ai.vector.enabled.name", "Enable AI semantic search"),
		tooltip: N("setting.ai.vector.enabled.desc", "Enable/disable AI vector search features (SigLIP2/X-CLIP: description search, prompt alignment, AI tag suggestions, smart collections)."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorSearchEnabled ?? !0),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let r = !!(t.ai.vectorSearchEnabled ?? !0), i = !!e;
			t.ai.vectorSearchEnabled = i, V(t), H(t), n("ai.vectorSearchEnabled");
			try {
				let e = await s(i);
				if (!e?.ok) {
					t.ai.vectorSearchEnabled = r, V(t), H(t), n("ai.vectorSearchEnabled"), D(e?.error || "Failed to update AI vector search setting", "error");
					return;
				}
				D(i ? "AI semantic search enabled" : "AI semantic search disabled", "info", 2200);
			} catch (e) {
				t.ai.vectorSearchEnabled = r, V(t), H(t), n("ai.vectorSearchEnabled"), D(e?.message || "Failed to update AI vector search setting", "error");
			}
		}
	}), e({
		id: `${on}.AI.VectorCaptionOnIndex`,
		category: r(N("cat.search", "Search"), "AI"),
		name: N("setting.ai.vector.captionOnIndex.name", "Generate AI captions during indexing"),
		tooltip: N("setting.ai.vector.captionOnIndex.desc", "Allow automatic vector indexing and backfill to run Florence-2 captions for image assets. This is slower and can use significant VRAM/CPU; leave it off for faster grid startup."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorCaptionOnIndex ?? !1),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let r = !!(t.ai.vectorCaptionOnIndex ?? !1), i = !!e;
			t.ai.vectorCaptionOnIndex = i, V(t), H(t), n("ai.vectorCaptionOnIndex");
			try {
				let e = await s({ caption_on_index: i });
				if (!e?.ok) {
					t.ai.vectorCaptionOnIndex = r, V(t), H(t), n("ai.vectorCaptionOnIndex"), D(e?.error || "Failed to update AI caption indexing setting", "error");
					return;
				}
				i && D("AI captions during indexing enabled", "info", 2600);
			} catch (e) {
				t.ai.vectorCaptionOnIndex = r, V(t), H(t), n("ai.vectorCaptionOnIndex"), D(e?.message || "Failed to update AI caption indexing setting", "error");
			}
		}
	}), e({
		id: `${on}.AI.VectorIndexOnScan`,
		category: r(N("cat.search", "Search"), "AI"),
		name: N("setting.ai.vector.indexOnScan.name", "Index vectors during scans"),
		tooltip: N("setting.ai.vector.indexOnScan.desc", "Compute SigLIP/X-CLIP embeddings while assets are scanned. Disable to avoid surprise VRAM use; run vector backfill manually when needed."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorIndexOnScan ?? !1),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let r = !!(t.ai.vectorIndexOnScan ?? !1), i = !!e;
			t.ai.vectorIndexOnScan = i, V(t), H(t), n("ai.vectorIndexOnScan");
			try {
				let e = await s({ index_on_scan: i });
				if (!e?.ok) {
					t.ai.vectorIndexOnScan = r, V(t), H(t), n("ai.vectorIndexOnScan"), D(e?.error || "Failed to update vector scan indexing", "error");
					return;
				}
				D(i ? "Vector indexing during scans enabled" : "Vector indexing during scans disabled", "info", 2400);
			} catch (e) {
				t.ai.vectorIndexOnScan = r, V(t), H(t), n("ai.vectorIndexOnScan"), D(e?.message || "Failed to update vector scan indexing", "error");
			}
		}
	}), e({
		id: `${on}.AI.VectorConcurrency`,
		category: r(N("cat.search", "Search"), "AI"),
		name: N("setting.ai.vector.concurrency.name", "Vector indexing concurrency"),
		tooltip: N("setting.ai.vector.concurrency.desc", "Maximum concurrent vector embedding workers. Use 1 to minimize transient VRAM spikes."),
		type: "number",
		defaultValue: Number(t.ai?.vectorConcurrency || 1),
		attrs: {
			min: 1,
			max: 16,
			step: 1
		},
		onChange: async (e) => {
			t.ai = t.ai || {};
			let r = Number(t.ai.vectorConcurrency || 1), i = Math.max(1, Math.min(16, Math.floor(Number(e) || 1)));
			t.ai.vectorConcurrency = i, V(t), H(t), n("ai.vectorConcurrency");
			try {
				let e = await s({ concurrency: i });
				e?.ok || (t.ai.vectorConcurrency = r, V(t), H(t), n("ai.vectorConcurrency"), D(e?.error || "Failed to update vector concurrency", "error"));
			} catch (e) {
				t.ai.vectorConcurrency = r, V(t), H(t), n("ai.vectorConcurrency"), D(e?.message || "Failed to update vector concurrency", "error");
			}
		}
	}), e({
		id: `${on}.AI.VectorUnloadAfterUse`,
		category: r(N("cat.search", "Search"), "AI"),
		name: N("setting.ai.vector.unloadAfterUse.name", "Unload AI models after use"),
		tooltip: N("setting.ai.vector.unloadAfterUse.desc", "Unload Majoor SigLIP/X-CLIP/Florence models after heavy AI actions and call torch CUDA cache cleanup. This frees VRAM but makes the next AI action slower."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorUnloadAfterUse ?? !1),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let r = !!(t.ai.vectorUnloadAfterUse ?? !1), i = !!e;
			t.ai.vectorUnloadAfterUse = i, V(t), H(t), n("ai.vectorUnloadAfterUse");
			try {
				let e = await s({ unload_after_use: i });
				if (!e?.ok) {
					t.ai.vectorUnloadAfterUse = r, V(t), H(t), n("ai.vectorUnloadAfterUse"), D(e?.error || "Failed to update model unload setting", "error");
					return;
				}
				D(i ? "AI model unload after use enabled" : "AI model unload after use disabled", "info", 2400);
			} catch (e) {
				t.ai.vectorUnloadAfterUse = r, V(t), H(t), n("ai.vectorUnloadAfterUse"), D(e?.message || "Failed to update model unload setting", "error");
			}
		}
	}), e({
		id: `${on}.AI.VectorUnloadNow`,
		category: r(N("cat.search", "Search"), "AI"),
		name: N("setting.ai.vector.unloadNow.name", "Memory purge now"),
		tooltip: N("setting.ai.vector.unloadNow.desc", "Immediately unload Majoor AI vector/caption models, ask ComfyUI to unload loaded models, and clear torch CUDA cache when idle."),
		type: "combo",
		options: ["Idle", "Unload now"],
		defaultValue: "Idle",
		onChange: async (e) => {
			if (String(e || "") === "Unload now") try {
				let e = await _();
				D(e?.ok ? "Majoor AI model cache unloaded" : e?.error || "Failed to unload Majoor AI model cache", e?.ok ? "info" : "error", 2600);
			} catch (e) {
				D(e?.message || "Failed to unload Majoor AI model cache", "error");
			}
		}
	}), e({
		id: `${on}.Search.MaxResults`,
		category: r(N("cat.search", "Search")),
		name: N("setting.search.maxResults.name", "Max search results (client)"),
		tooltip: N("setting.search.maxResults.desc", "Maximum number of results requested per search. The backend still enforces MAJOOR_SEARCH_MAX_LIMIT; increase that env var if you need a higher hard cap."),
		type: "number",
		defaultValue: Number(t.search?.maxResults || P.SEARCH_DEFAULT_LIMIT),
		attrs: {
			min: 10,
			max: P.MAX_PAGE_SIZE || 2e3,
			step: 1
		},
		onChange: (e) => {
			t.search = t.search || {}, t.search.maxResults = Math.max(10, Math.min(P.MAX_PAGE_SIZE || 2e3, Number(e) || P.SEARCH_DEFAULT_LIMIT)), V(t), H(t), n("search.maxResults");
		}
	}), e({
		id: `${on}.EnvVars.Reference`,
		category: r(N("cat.advanced"), "Environment variables"),
		name: "Environment variables reference",
		tooltip: "Set these env vars before starting ComfyUI to override defaults:\n\nMAJOOR_OUTPUT_DIRECTORY - Override output root directory\nMAJOOR_EXIFTOOL_PATH - Path to exiftool binary\nMAJOOR_FFPROBE_PATH - Path to ffprobe binary\nMAJOOR_MEDIA_PROBE_BACKEND - Probe mode: auto|exiftool|ffprobe|both\nMAJOOR_EXIFTOOL_TIMEOUT - ExifTool timeout in seconds (default: 15)\nMAJOOR_FFPROBE_TIMEOUT - FFprobe timeout in seconds (default: 10)\nMAJOOR_DB_TIMEOUT - Database timeout in seconds (default: 30)\nMAJOOR_DB_MAX_CONNECTIONS - Max DB connections (default: 8)\nMAJOOR_METADATA_CACHE_MAX - Metadata cache max entries (default: 100000)\nMAJOOR_METADATA_EXTRACT_CONCURRENCY - Parallel metadata workers (default: 1)\nMJR_ENABLE_WATCHER - Enable file watcher: 1|0 (default: 1)\nMJR_WATCHER_DEBOUNCE_MS - Watcher debounce delay in ms (default: 3000)\nMJR_WATCHER_DEDUPE_TTL_MS - Watcher dedupe window in ms (default: 3000)\nMJR_WATCHER_MAX_FILE_SIZE_BYTES - Max file size to index (default: 512MB)\nMJR_WATCHER_FLUSH_MAX_FILES - Max files per flush batch (default: 256)\nMJR_WATCHER_PENDING_MAX - Max pending watcher queue (default: 5000)\nMJR_AM_ENABLE_VECTOR_SEARCH - Enable AI vector/semantic search: 1|0 (default: 1)\nMJR_AM_VECTOR_INDEX_ON_SCAN - Compute vectors during scans: 1|0 (default: 0)\nMJR_AM_VECTOR_CAPTION_ON_INDEX - Generate Florence captions during vector indexing: 1|0 (default: 0)\nMJR_VECTOR_CONCURRENCY - Concurrent vector workers (default: 2, use 1 for lower VRAM spikes)\nMJR_AM_VECTOR_UNLOAD_AFTER_USE - Unload Majoor AI models after heavy vector actions: 1|0 (default: 0)\nMAJOOR_SEARCH_MAX_LIMIT - Max search results (default: 500)\nMAJOOR_BG_SCAN_ON_LIST - Scan on directory list: 0|1 (default: 0)",
		type: "text",
		defaultValue: "Hover for full list of environment variables"
	});
}
// ui/app/settings/SettingsPanel.ts
var ln = "Majoor Assets Manager", un = /^\s*Majoor:\s*/i, dn = Object.freeze({
	ASSETS_PANEL: "Assets Panel",
	GENERATED_FEED: "Generated Feed",
	VIEWER: "Viewer & Floating Viewer",
	INDEXING: "Indexing & Watcher",
	SEARCH_AI: "Search & AI",
	GENERAL: "General",
	ADVANCED: "Advanced",
	SECURITY: "Security"
}), fn = /* @__PURE__ */ new Set([
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
]), pn = "Majoor.General.ResetAllSettings", mn = "mjr-settings-reset-btn", hn = null, gn = null;
function _n(e) {
	let t = String(e || "").trim();
	return !t || t === pn || t === "Majoor.Language" ? dn.GENERAL : /^Majoor\.(Safety|Security)\./.test(t) ? dn.SECURITY : /^Majoor\.(Paths|Db|ProbeBackend|MetadataFallback|Observability)\./.test(t) || t === "Majoor.EnvVars.Reference" ? dn.ADVANCED : /^Majoor\.(Viewer|WorkflowMinimap)\./.test(t) ? dn.VIEWER : /^Majoor\.Feed\./.test(t) ? dn.GENERATED_FEED : /^Majoor\.(AutoScan|Scan|Watcher|ExecutionGrouping|RatingTagsSync)\./.test(t) || t === "Majoor.RtHydrate.Concurrency" ? dn.INDEXING : /^Majoor\.AI\.(HuggingFaceTokenVisible|HuggingFaceToken|VerboseLogs|VectorStats|VectorBackfillAction|VectorSearchEnabled|VectorCaptionOnIndex|VectorIndexOnScan|VectorConcurrency|VectorUnloadAfterUse|VectorUnloadNow)$/.test(t) || /^Majoor\.Search\./.test(t) ? dn.SEARCH_AI : /^Majoor\.(Grid|Cards|Badges|Sidebar|InfiniteScroll|General)\./.test(t) ? dn.ASSETS_PANEL : dn.GENERAL;
}
function vn(e) {
	let t = Array.isArray(e?.category) ? e.category.filter(Boolean) : [], n = _n(e?.id), r = String(t[1] || t[0] || "").trim(), i = String(t[2] || "").trim(), a = String(e?.name || "").replace(un, "").trim();
	return [
		ln,
		n,
		i || r || a || n
	];
}
var yn = !1, bn = null, xn = null, Sn = !1, Cn = /* @__PURE__ */ new Set();
function wn(e) {
	if (!e || typeof e != "object") return null;
	let t = { ...e };
	try {
		typeof t.name == "string" && (t.name = t.name.replace(un, "").trim());
	} catch (e) {
		console.debug?.(e);
	}
	try {
		t.category = vn(t);
	} catch {
		t.category = [ln, dn.GENERAL];
	}
	return !t.tooltip && typeof t.name == "string" && t.name.trim() && (t.tooltip = t.name.trim()), t;
}
function Tn(e, t, n) {
	let r = String(t?.id || "").trim();
	if (!r || Cn.has(r)) return !1;
	Cn.add(r);
	try {
		return S(e, r, n);
	} finally {
		Cn.delete(r);
	}
}
function En(e, t) {
	if (!t || typeof t != "object") return t;
	let n = { ...t };
	Tn(e, n, n.defaultValue);
	let r = n.onChange;
	return n.onChange = (t, ...i) => {
		if (Tn(e, n, t), typeof r == "function") return r(t, ...i);
		n.defaultValue = t;
	}, n;
}
function Dn(e) {
	try {
		return JSON.parse(JSON.stringify(e || {}));
	} catch {
		return { ...z };
	}
}
function On(e, t, n, { wrapForComfy: r = !0 } = {}) {
	let i = [], a = (e) => {
		let n = wn(e);
		n && i.push(r ? En(t, n) : n);
	};
	return kt(a, e, n), Lt(a, e, n), Mt(a, e, n), Pt(a, e, n), nn(a, e, n), an(a, e, n, t), cn(a, e, n), i;
}
function kn(e, t) {
	if (e === t) return !0;
	try {
		return JSON.stringify(e) === JSON.stringify(t);
	} catch {
		return !1;
	}
}
function An(e) {
	return e ? e.querySelector(".form-input") || e.querySelector(".p-inputgroup") || e.querySelector(".setting-input") || e.querySelector("[class*='input']") : null;
}
function jn(e, t) {
	let n = document.createElement("button");
	return n.type = "button", n.className = mn, n.textContent = e, n.title = t, n.style.marginLeft = "8px", n.style.minWidth = e.length > 2 ? "auto" : "24px", n.style.height = "24px", n.style.padding = e.length > 2 ? "0 10px" : "0", n.style.borderRadius = "6px", n.style.border = "1px solid var(--border-color, #555)", n.style.background = "var(--comfy-input-bg, #2b2b2b)", n.style.color = "var(--input-text, inherit)", n.style.cursor = "pointer", n.style.fontSize = "12px", n.style.lineHeight = "22px", n.style.flexShrink = "0", n;
}
function Mn(e, t, n) {
	String(e?.id || "").trim() && (Tn(n, e, t), typeof e?.onChange == "function" && e.onChange(t));
}
function Nn(e, t, n, r) {
	let i = !kn(a(r, t.id, t.defaultValue), n);
	e.disabled = !i, e.style.opacity = i ? "1" : "0.45";
}
function Pn() {
	if (typeof document > "u" || !gn) return;
	let { app: e, definitions: t, defaultValues: n } = gn, r = document.querySelector(`[data-setting-id="${pn}"]`), i = An(r);
	if (r && i && !r.getAttribute("data-mjr-reset-injected")) {
		r.setAttribute("data-mjr-reset-injected", "true"), i.innerHTML = "";
		let a = jn("Reset all settings", "Reset all Majoor settings to defaults");
		a.onclick = (r) => {
			r.preventDefault(), r.stopPropagation();
			for (let r of t) r.id !== pn && n.has(r.id) && Mn(r, n.get(r.id), e);
			Pn();
		}, i.appendChild(a);
	}
	for (let r of t) {
		if (!r?.id || r.id === pn || !n.has(r.id)) continue;
		let t = document.querySelector(`[data-setting-id="${r.id}"]`);
		if (!t || t.getAttribute("data-mjr-reset-injected")) continue;
		let i = An(t);
		if (!i) continue;
		t.setAttribute("data-mjr-reset-injected", "true");
		let a = jn("Reset", "Reset this setting to default");
		Nn(a, r, n.get(r.id), e), a.onclick = (t) => {
			t.preventDefault(), t.stopPropagation();
			let i = n.get(r.id);
			Mn(r, i, e), Nn(a, r, i, e);
		}, i.appendChild(a);
	}
}
function Fn(e, t, n) {
	typeof document < "u" && typeof MutationObserver < "u" && (gn = {
		app: e,
		definitions: t,
		defaultValues: new Map(n.filter((e) => e?.id && e.id !== pn).map((e) => [e.id, e.defaultValue]))
	}, Pn(), !hn && (hn = new MutationObserver(() => Pn()), hn.observe(document.body, {
		childList: !0,
		subtree: !0
	})));
}
function In(e, t, { initRuntime: n = !1 } = {}) {
	if (xn) typeof t == "function" && xn.onAppliedListeners.add(t), e && !xn.app && (xn.app = e);
	else {
		let n = B();
		n.i18n = n.i18n || {}, typeof n.i18n.followComfyLanguage == "boolean" ? be(!!n.i18n.followComfyLanguage) : (n.i18n.followComfyLanguage = !0, be(!0), V(n));
		let r = /* @__PURE__ */ new Set();
		typeof t == "function" && r.add(t);
		let i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set(), o = () => {
			if (!i.size) return;
			let e = Array.from(i);
			i.clear();
			for (let t of e) Oe("mjr-settings-changed", { key: t }, { warnPrefix: "[Majoor]" });
		}, s = () => {
			if (!a.size) return;
			let e = Array.from(a);
			a.clear();
			for (let t of e) Oe("mjr-settings-changed", { key: t }, { warnPrefix: "[Majoor]" });
		}, c = gt(o, 120), l = gt(s, 450), u = (e) => {
			typeof e == "string" && i.add(e), c();
		}, d = (e) => {
			typeof e == "string" && a.add(e), l();
		}, f = () => {
			let e = B();
			Object.assign(n, e), H(n), u("storage");
		}, p = (e) => {
			e && e.key === "mjrSettings" && e.newValue !== e.oldValue && f();
		};
		if (!yn) {
			if (bn && typeof window < "u") try {
				window.removeEventListener("storage", bn);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				window.addEventListener("storage", p), yn = !0, bn = p;
			} catch (e) {
				console.debug?.(e);
			}
		}
		xn = {
			app: e,
			notifyApplied: (e) => {
				for (let t of r) try {
					t(n, e);
				} catch (e) {
					console.debug?.(e);
				}
				fn.has(String(e || "")) ? d(e) : u(e);
			},
			onAppliedListeners: r,
			refreshFromStorage: f,
			settings: n
		};
	}
	if (n && !Sn) {
		let t = e || xn.app, n = xn.settings;
		ae(t), H(n), ye(t), nt(), rt(), it(), n?.watcher && typeof n.watcher.enabled == "boolean" && ue(!!n.watcher.enabled).catch(() => {}), mt(), Sn = !0;
	}
	return xn;
}
var Ln = (e, t) => In(e, t, { initRuntime: !0 }).settings, Rn = (e, t) => {
	let n = In(e, t, { initRuntime: !1 });
	Object.assign(n.settings, B());
	let r = e || n.app, i = On(n.settings, r, n.notifyApplied), a = On(Dn(z), r, () => {}, { wrapForComfy: !1 });
	return i.unshift(En(r, {
		id: pn,
		category: [
			ln,
			dn.GENERAL,
			"Reset"
		],
		name: "Reset all settings to defaults",
		tooltip: "Reset every Majoor Assets Manager setting to its default value.",
		type: "text",
		defaultValue: ""
	})), Fn(r, i, a), i;
};
try {
	let e = B();
	e?.watcher && typeof e.watcher.enabled == "boolean" && xe().then((e) => {
		let t = !!e?.ok && !!e?.data?.enabled, n = B();
		n.watcher = n.watcher || {}, typeof t == "boolean" && t !== !!n.watcher.enabled && (n.watcher.enabled = t, V(n), Oe("mjr-settings-changed", { key: "watcher.enabled" }, { warnPrefix: "[Majoor]" }));
	}).catch(() => {});
} catch (e) {
	console.debug?.(e);
}
// ui/features/viewer/workflowGraphMap/workflowNodeLabeling.ts
var zn = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, Bn = /^[0-9a-f]{20,}$/i;
function Vn(...e) {
	for (let t of e) {
		let e = String(t || "").trim();
		if (e) return e;
	}
	return "";
}
function Hn(e) {
	let t = String(e || "").trim();
	return !!t && (zn.test(t) || Bn.test(t));
}
function Un(e) {
	return String(e?.type || e?.class_type || e?.comfyClass || e?.classType || "").trim();
}
function Wn(e) {
	return Vn(e?.properties?.subgraph_name, e?.title, e?.properties?.title, e?.properties?.name, e?.properties?.label, e?.name, e?.subgraph?.name, e?.subgraph_instance?.name);
}
function Gn(e) {
	let t = Un(e), n = Wn(e);
	return n && (!t || Hn(t) || n !== t) ? n : t && !Hn(t) ? t : n || (t ? "Subgraph" : String(e?.id || "Node").trim() || "Node");
}
function Kn(e) {
	let t = Un(e);
	return t && !Hn(t) ? t : t ? "Subgraph" : "Node";
}
// ui/components/sidebar/utils/minimap.ts
var qn = 6, Jn = 1, Yn = 64, Xn = 74, Zn = 42, Qn = [
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
], $n = (e, t, n) => {
	let r = Number(e);
	return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
}, er = (e, t = !1) => {
	let n = String(e || "").toUpperCase();
	return n.includes("IMAGE") ? "rgba(145,198,99,0.9)" : n.includes("LATENT") ? "rgba(89,178,118,0.9)" : n.includes("MODEL") ? "rgba(112,155,255,0.9)" : n.includes("CONDITIONING") ? "rgba(191,123,226,0.9)" : n.includes("CLIP") ? "rgba(220,178,77,0.9)" : n.includes("VAE") ? "rgba(72,184,214,0.9)" : n.includes("MASK") ? "rgba(190,190,190,0.88)" : n.includes("STRING") || n.includes("TEXT") ? "rgba(230,230,230,0.86)" : n.includes("INT") || n.includes("FLOAT") || n.includes("NUMBER") ? "rgba(130,210,220,0.88)" : t ? "rgba(170,220,255,0.82)" : "rgba(255,255,255,0.72)";
}, tr = (e, t, n) => {
	let r = String(t || "").replace(/\s+/g, " ").trim(), i = Math.max(1, Number(n) || 1);
	if (!r || e.measureText(r).width <= i) return r;
	let a = r;
	for (; a.length > 3 && e.measureText(`${a}...`).width > i;) a = a.slice(0, -1);
	return a.length > 3 ? `${a}...` : r.slice(0, 3);
};
function nr(e, t, n = null) {
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
	}, a = i.expandSubgraphs === !1 ? t : rr(t), o = Array.isArray(a?.nodes) ? a.nodes : [], s = Array.isArray(a?.groups) && a.groups || Array.isArray(a?.extra?.groups) && a.extra.groups || Array.isArray(a?.extra?.groupNodes) && a.extra.groupNodes || Array.isArray(a?.extra?.group_nodes) && a.extra.group_nodes || [], c = Array.isArray(a?.links) && a.links || Array.isArray(a?.extra?.links) && a.extra.links || [], l = Math.max(1, e.clientWidth || e.width || 1), u = Math.max(1, e.clientHeight || e.height || 1);
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
		for (let [e, t] of Qn) if (n.includes(e)) return t;
		let r = 0;
		for (let e = 0; e < n.length; e += 1) r = r * 31 + n.charCodeAt(e) | 0;
		return `hsl(${Math.abs(r) % 360} 42% 42%)`;
	}, p = (e) => {
		let t = [], n = e?.inputs && typeof e.inputs == "object" && !Array.isArray(e.inputs) ? e.inputs : null;
		if (n) {
			for (let [e, r] of Object.entries(n)) if (!(Array.isArray(r) || r && typeof r == "object") && (t.push([e, r]), t.length >= 3)) return t;
		}
		let r = Array.isArray(e?.widgets_values) ? e.widgets_values : [], i = Array.isArray(e?.widgets) ? e.widgets : [], a = Array.isArray(e?.inputs) ? e.inputs : [], o = a.filter((e) => e?.widget === !0 || e?.widget && typeof e.widget == "object" || typeof e?.widget == "string" && e.widget.trim()), s = a.filter((e) => e?.link == null && dr(e?.type)), c = (o.length ? o : s.length ? s : a).map((e) => String(e?.label || e?.localized_name || e?.name || e?.widget?.name || e?.widget?.label || "").trim());
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
			label: Gn(e).replace(/\s+/g, " ").trim()
		}), n && h.set(n, m[m.length - 1]);
	}
	if (i.showGroups) for (let e of s || []) {
		let t = Array.isArray(e?.bounding) && e.bounding.length >= 4 ? e.bounding : null, n = t ? [Number(t[0]), Number(t[1])] : g(e?.pos), r = t ? [Number(t[2]), Number(t[3])] : _(e?.size);
		if (!n || !r) continue;
		let i = Number(n[0]), a = Number(n[1]), o = Math.max(1, Number(r[0])), s = Math.max(1, Number(r[1]));
		Number.isFinite(i) && Number.isFinite(a) && Number.isFinite(o) && Number.isFinite(s) && m.push({
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
	let S = Math.max(1, b - v), C = Math.max(1, x - y), w = v + S / 2, ee = y + C / 2, T = i.view && typeof i.view == "object" ? i.view : Object.create(null), te = $n(T.zoom ?? 1, Jn, Yn), E = Math.max(1, S / te), D = Math.max(1, C / te), O = E / 2, k = D / 2, ne = E >= S ? w : $n(T.centerX ?? w, v + O, b - O), re = D >= C ? ee : $n(T.centerY ?? ee, y + k, x - k), ie = ne - O, A = re - k, j = qn, M = Math.min((l - 12) / E, (u - 12) / D), ae = T.hoveredNodeId !== null && T.hoveredNodeId !== void 0 ? String(T.hoveredNodeId) : null;
	r.clearRect(0, 0, l, u), r.fillStyle = "rgba(0,0,0,0.22)", r.fillRect(0, 0, l, u);
	let oe = (e, t) => ({
		x: j + (e - ie) * M,
		y: j + (t - A) * M
	}), se = (e, t) => ({
		x: $n(ie + (Number(e) - j) / M, v, b),
		y: $n(A + (Number(t) - j) / M, y, x)
	}), le = (e) => ({
		x: j + (e.x - ie) * M,
		y: j + (e.y - A) * M,
		w: Math.max(1, e.w * M),
		h: Math.max(1, e.h * M)
	}), N = (e) => Math.max(10, Math.min(24, Math.floor(Number(e) * .2))), ue = (e, t, n) => {
		let r = le(e), i = N(r.h), a = n === "output" ? e.outputs : e.inputs, o = Math.max(1, Array.isArray(a) ? a.length : Number(e[`${n}Count`]) || 0), s = $n(t, 0, Math.max(0, o - 1));
		return r.y + i + (r.h - i) * (s + 1) / (o + 1);
	}, de = (e) => Array.isArray(e) && e.length >= 5 ? {
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
	} : null, fe = (e) => {
		let t = String(e || "").toUpperCase();
		return t.includes("IMAGE") ? "rgba(145,198,99,0.38)" : t.includes("LATENT") ? "rgba(89,178,118,0.38)" : t.includes("MODEL") ? "rgba(112,155,255,0.38)" : t.includes("CONDITIONING") ? "rgba(191,123,226,0.38)" : t.includes("CLIP") ? "rgba(220,178,77,0.38)" : t.includes("VAE") ? "rgba(72,184,214,0.38)" : t.includes("MASK") ? "rgba(190,190,190,0.36)" : "rgba(255,255,255,0.2)";
	}, pe = () => {
		if (i.showLinks && c && c.length !== 0) {
			r.save(), r.globalAlpha = 1, r.lineWidth = 1;
			for (let e of c) {
				let t = de(e), n = t?.originId, i = t?.targetId;
				if (n === null || i === null) continue;
				let a = h.get(String(n)), o = h.get(String(i));
				if (!a || !o) continue;
				let s = le(a), c = le(o), l = {
					x: s.x + s.w,
					y: ue(a, t?.originSlot ?? 0, "output")
				}, u = {
					x: c.x,
					y: ue(o, t?.targetSlot ?? 0, "input")
				}, d = Math.max(12, Math.min(80, Math.abs(u.x - l.x) * .35));
				r.strokeStyle = fe(t?.type), r.beginPath(), r.moveTo(l.x, l.y), r.bezierCurveTo(l.x + d, l.y, u.x - d, u.y, u.x, u.y), r.stroke();
			}
			r.restore();
		}
	}, me = (e) => {
		let { x: t, y: n, w: a, h: o } = le(e), s = e.kind === "node", c = e.kind === "group", l = !!e.bypassed, u = !!e.errored, f = c ? .18 : l && i.renderBypassState ? .14 : .62, p = c ? .55 : l && i.renderBypassState ? .32 : .8, m = d(e.fill, f), h = d(e.stroke, p), g = s && i.showNodeLabels && a >= Xn && o >= Zn, _ = Math.max(2, Math.min(g ? 7 : 8, Math.floor(Math.min(a, o) * .08))), v = s ? N(o) : 0;
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
				let n = ue(e, i, "input");
				r.fillStyle = er(e.inputs?.[i]?.type, !1), r.beginPath(), r.arc(t, n, g ? 3 : 2.2, 0, Math.PI * 2), r.fill(), r.stroke();
			}
			for (let n = 0; n < i; n += 1) {
				let i = ue(e, n, "output");
				r.fillStyle = er(e.outputs?.[n]?.type, !0), r.beginPath(), r.arc(t + a, i, g ? 3 : 2.2, 0, Math.PI * 2), r.fill(), r.stroke();
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
		if (s && ae && String(e.id || "") === ae) {
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
				s && r.fillText(tr(r, s, i), t + 7, ue(e, a, "input") + n * .35, i);
			}
			for (let o = 0; o < Math.min(8, e.outputs?.length || 0); o += 1) {
				let s = e.outputs[o], c = String(s?.label || s?.localized_name || s?.name || "").trim();
				if (!c) continue;
				let l = tr(r, c, i);
				r.fillText(l, t + a - 7 - Math.min(i, r.measureText(l).width), ue(e, o, "output") + n * .35, i);
			}
			r.restore();
		}
	};
	for (let e of m.filter((e) => e.kind === "group")) me(e);
	pe();
	for (let e of m.filter((e) => e.kind === "node")) me(e);
	if (i.showViewport) try {
		let e = ce();
		if (e) {
			let t = oe(e.x0, e.y0), n = oe(e.x1, e.y1), i = Math.min(t.x, n.x), a = Math.min(t.y, n.y), o = Math.abs(n.x - t.x), s = Math.abs(n.y - t.y);
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
			zoom: te,
			centerX: ne,
			centerY: re,
			visibleW: E,
			visibleH: D,
			viewMinX: ie,
			viewMinY: A,
			pad: j,
			renderScale: M
		},
		canvasToWorld: se,
		worldToCanvas: oe,
		hitTestNode: (e, t) => {
			let n = se(e, t);
			for (let e = m.length - 1; e >= 0; --e) {
				let t = m[e];
				if (t.kind === "node" && n.x >= t.x && n.x <= t.x + t.w && n.y >= t.y && n.y <= t.y + t.h) return t;
			}
			return null;
		}
	};
}
function rr(e, t = null) {
	if (!e || typeof e != "object") return e;
	let n = Array.isArray(e.nodes) ? e.nodes.filter(Boolean) : [], r = ir(e, t);
	if (!n.length) return e;
	let i = [], a = Array.isArray(e.links) ? [...e.links] : [], o = [...Array.isArray(e.groups) ? e.groups : [], ...Array.isArray(e.extra?.groups) ? e.extra.groups : []];
	for (let e of n) {
		i.push(e);
		let t = ar(e, r);
		if (!t || !Array.isArray(t.nodes) || !t.nodes.length) continue;
		let n = sr(e, rr(t, r));
		i.push(...n.nodes), a.push(...n.links), n.group && o.push(n.group);
	}
	return {
		...e,
		nodes: i,
		links: a,
		groups: o,
		extra: {
			...e.extra || {},
			groups: o
		}
	};
}
function ir(e, t = null) {
	let n = [
		...Array.isArray(e?.definitions?.subgraphs) ? e.definitions.subgraphs : [],
		...Array.isArray(e?.subgraphs) ? e.subgraphs : [],
		...Array.isArray(e?.rootGraph?.subgraphs) ? e.rootGraph.subgraphs : []
	], r = new Map(t || []);
	for (let e of n) for (let t of or(e)) t != null && r.set(String(t), e);
	return r;
}
function ar(e, t) {
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
function or(e) {
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
function sr(e, t) {
	let n = String(e?.id ?? e?.ID ?? ""), r = lr(e?.pos) || [0, 0], i = ur(e?.size) || [260, 180], a = t.nodes.filter(Boolean), o = cr(a), s = Math.min(22, Math.max(8, i[0] * .08)), c = Math.min(34, Math.max(18, i[1] * .18)), l = Math.min(18, Math.max(8, i[1] * .08)), u = Math.max(40, i[0] - s * 2), d = Math.max(34, i[1] - c - l), f = Math.min(1, u / o.width, d / o.height), p = r[0] + s + (u - o.width * f) / 2, m = r[1] + c + (d - o.height * f) / 2, h = a.map((r) => {
		let i = lr(r?.pos) || [o.minX, o.minY], a = ur(r?.size) || [140, 60];
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
function cr(e) {
	let t = Infinity, n = Infinity, r = -Infinity, i = -Infinity;
	for (let a of e) {
		let e = lr(a?.pos);
		if (!e) continue;
		let o = ur(a?.size) || [140, 60];
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
function lr(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.x ?? e.left ?? null, n = e[1] ?? e[1] ?? e.y ?? e.top ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function ur(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.w ?? e.width ?? null, n = e[1] ?? e[1] ?? e.h ?? e.height ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function dr(e) {
	if (Array.isArray(e)) return !0;
	let t = String(e || "").trim().toUpperCase();
	return t === "INT" || t === "FLOAT" || t === "STRING" || t === "BOOLEAN" || t === "BOOL" || t === "COMBO" || t === "ENUM";
}
function fr(e, t = null) {
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
// ui/utils/safeCall.ts
var pr = () => {};
function mr(e) {
	try {
		return !!F?.[e];
	} catch {
		return !1;
	}
}
function hr(e, t) {
	try {
		console.warn(`[Majoor] ${e}`, t);
	} catch (e) {
		console.debug?.(e);
	}
}
function gr(e, t = "safeCall") {
	try {
		return e?.();
	} catch (e) {
		mr("DEBUG_SAFE_CALL") && hr(t, e);
		return;
	}
}
function _r(e, t, n, r, i = "safeAddListener") {
	try {
		return e?.addEventListener?.(t, n, r), () => {
			try {
				e?.removeEventListener?.(t, n, r);
			} catch (e) {
				mr("DEBUG_SAFE_LISTENERS") && hr(`${i}:remove:${String(t || "")}`, e);
			}
		};
	} catch (e) {
		return mr("DEBUG_SAFE_LISTENERS") && hr(`${i}:add:${String(t || "")}`, e), pr;
	}
}
// ui/utils/mediaFps.ts
function vr(e) {
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
function yr(e) {
	try {
		let t = e, n = t.metadata_raw || {}, r = (n.raw_ffprobe || {}).video_stream || {};
		return vr(r.avg_frame_rate) ?? vr(r.r_frame_rate) ?? vr(n.fps_raw) ?? vr(n.fps) ?? vr(n.frame_rate) ?? vr(t.fps);
	} catch {
		return null;
	}
}
function br(e, t) {
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
function xr(e) {
	let t = Number(e);
	return !Number.isFinite(t) || t <= 0 ? "" : Math.abs(t - Math.round(t)) < .001 ? `${Math.round(t)} fps` : `${t.toFixed(3).replace(/\.?0+$/, "")} fps`;
}
// ui/components/sidebar/parsers/a1111ParamsParser.ts
function Sr(e) {
	if (!e || typeof e != "string") return null;
	let t = {}, n = e.split(/\nNegative prompt:\s*/i);
	if (n[0] && (t.prompt = n[0].trim()), n[1]) {
		let e = n[1].match(/^(.*?)\n?(Steps:.*)$/s);
		if (e) {
			t.negative_prompt = e[1].trim();
			let n = e[2], r = (e) => {
				let t = n.match(e);
				return t ? t[1].trim() : null;
			};
			t.steps = r(/Steps:\s*(\d+)/i), t.sampler = r(/Sampler:\s*([^,\n]+)/i), t.cfg = r(/CFG scale:\s*([\d.]+)/i), t.seed = r(/Seed:\s*(\d+)/i), t.width = r(/Size:\s*(\d+)x\d+/i), t.height = r(/Size:\s*\d+x(\d+)/i), t.model = r(/Model:\s*([^,\n]+)/i), t.denoising = r(/Denoising strength:\s*([\d.]+)/i), t.clip_skip = r(/Clip skip:\s*(\d+)/i);
		} else t.negative_prompt = n[1].trim();
	}
	return Object.keys(t).length > 0 ? t : null;
}
// ui/components/sidebar/parsers/comfyWorkflowParser.ts
function Cr(e) {
	try {
		let t = Object.entries(e || {});
		if (!t.length) return !1;
		let n = 0;
		for (let [, e] of t.slice(0, 50)) if (e && typeof e == "object" && (e.inputs && typeof e.inputs == "object" && (n += 1), n >= 2)) return !0;
		return !1;
	} catch {
		return !1;
	}
}
function wr(e) {
	if (!e || typeof e != "object") return null;
	let t = {}, n = [], r = zr(e), i = [], a = Jr(e);
	for (let e of a) {
		if (!e || typeof e != "object") continue;
		let a = Qr(e);
		if (!a || typeof a != "object") continue;
		let o = String(e?.class_type || e?.type || "").toLowerCase(), s = String(e?.title || e?._meta?.title || "").toLowerCase(), c = (e, n) => {
			if (t[e] || typeof n != "string") return;
			let r = n.trim();
			r && (/^[\d\s.,+-]+$/.test(r) || (t[e] = r));
		};
		if ((o.includes("cliptextencode") || o.includes("clip_text_encode") || s.includes("clip text encode")) && typeof a.text == "string") {
			let e = s.includes("negative");
			s.includes("positive") || s.includes("(prompt)") || s.includes("prompt"), c(e ? "negative_prompt" : "prompt", a.text);
		}
		if (c("negative_prompt", a.negative_prompt), c("negative_prompt", a.negative), !t.prompt && typeof a.text == "string") {
			let e = a.text.trim();
			(o.includes("prompt") || o.includes("encode") || o.includes("positive") || o.includes("negative") || s.includes("prompt") || s.includes("positive") || s.includes("negative")) && e.length >= 12 && /[a-zA-Z]/.test(e) && c("prompt", e);
		}
		let l = q(a.seed, r), u = q(a.steps, r), d = q(a.cfg, r), f = q(a.denoise, r);
		if (l !== void 0 && t.seed === void 0 && (t.seed = l), u !== void 0 && t.steps === void 0 && (t.steps = u), d !== void 0 && t.cfg === void 0 && (t.cfg = d), a.sampler_name && !t.sampler && (t.sampler = a.sampler_name), a.scheduler && !t.scheduler && (t.scheduler = a.scheduler), f !== void 0 && t.denoise === void 0 && (t.denoise = f), Br(o)) {
			let t = Vr(e, r), n = Gr(e, r), o = Kr(e?.inputs?.model, r) || Kr(n.model_link, r);
			i.push({
				sampler_name: a.sampler_name || n.sampler_name || a.sampler,
				scheduler: a.scheduler || n.scheduler,
				steps: q(a.steps, r) ?? n.steps,
				cfg: q(a.cfg, r) ?? n.cfg,
				denoise: q(a.denoise, r) ?? n.denoise,
				seed: q(a.seed ?? a.noise_seed, r) ?? n.seed,
				start_at_step: q(a.start_at_step, r),
				end_at_step: q(a.end_at_step, r),
				model: o,
				pass_stage: t
			});
		}
		a.width !== void 0 && t.width === void 0 && (t.width = a.width), a.height !== void 0 && t.height === void 0 && (t.height = a.height);
		let p = (e, n) => {
			if (t[e] || typeof n != "string") return;
			let r = n.trim();
			r && (t[e] = r);
		}, m = [
			a.ckpt_name,
			a.checkpoint,
			a.checkpoint_name,
			a.model_name,
			a.model
		];
		for (let e of m) !t.model && !o.includes("upscale") && p("model", e);
		o.includes("upscale") && p("upscaler", a.model_name || a.upscale_model || a.model), p("vae", a.vae_name || a.vae), p("clip", a.clip_name || a.clip);
		let h = a.unet_name || a.unet;
		if (typeof h == "string" && h.trim()) {
			let e = t.models && typeof t.models == "object" ? t.models : {};
			/high[_\s-]?noise/i.test(h) ? e.unet_high_noise = { name: h.trim() } : /low[_\s-]?noise/i.test(h) ? e.unet_low_noise = { name: h.trim() } : p("unet", h), Object.keys(e).length && (t.models = e);
		}
		if (p("diffusion", a.diffusion_name || a.diffusion_model || a.diffusion), o.includes("lora") || o.includes("loraloader")) {
			let e = a.lora_name || a.lora || a.name || null, t = a.strength_model ?? a.strength ?? a.weight ?? a.lora_strength ?? null;
			if (e) {
				let r = { name: e };
				a.strength_model === void 0 ? r.weight = t : r.strength_model = a.strength_model, n.push(r);
			}
		}
	}
	let o = Rr(n), s = Rr(i, Lr);
	if (o.length && (t.loras = o), s.length > 1 && (t.all_samplers = s), t.seed === void 0) {
		let e = s.find((e) => e?.seed !== void 0 && e?.seed !== null)?.seed;
		e != null && (t.seed = e);
	}
	return Dr(t, a, r), Tr(t, a), Object.keys(t).length > 0 ? t : null;
}
function Tr(e, t) {
	if (e.ideogram) return;
	let n = t.find((e) => {
		let t = String(e?.class_type || e?.type || e?.comfyClass || "").toLowerCase();
		return t.includes("ideogram4promptbuilderkj") || t.includes("ideogram4promptbuilder");
	});
	if (!n) return;
	let r = Qr(n) || {}, i = Er(K(r.elements_data, r.elements, r.bboxes)), a = Er(K(r.style_palette_data, r.palette, r.color_palette)), o = Fr({
		width: K(r.width, r.custom_width),
		height: K(r.height, r.custom_height),
		high_level_description: r.high_level_description,
		background: r.background,
		style: r.style,
		photo_style: r["style.photo"] || r.photo_style,
		aesthetics: r.aesthetics,
		lighting: r.lighting,
		medium: r.medium,
		bg_brightness: r.bg_brightness,
		coord_mode: r.coord_mode,
		bbox_order: r.bbox_order,
		color_palette: a,
		elements: i
	});
	if (!Object.keys(o).length) return;
	let s = JSON.stringify(o, null, 2);
	e.ideogram = Fr({
		title: String(n?._meta?.title || n?.title || "Ideogram 4").trim(),
		json: s,
		payload: o,
		high_level_description: o.high_level_description,
		background: o.background,
		elements: Array.isArray(i) ? i : [],
		color_palette: Array.isArray(a) ? a : []
	}), e.prompt = s, e.workflow_type = e.workflow_type || "ideogram";
}
function Er(e) {
	if (e && typeof e == "object" || typeof e != "string" || !e.trim()) return e;
	try {
		return JSON.parse(e);
	} catch {
		return e;
	}
}
function Dr(e, t, n) {
	if (e.ltx_director) return;
	let r = t.find((e) => {
		let t = String(e?.class_type || e?.type || e?.comfyClass || "").toLowerCase();
		return t === "ltxdirector" || t === "ltxdirectorguide";
	});
	if (!r) return;
	let i = Qr(r) || {}, a = r?.properties && typeof r.properties == "object" ? r.properties : {}, o = Or(K(i.timeline_data, a.timeline_data)), s = K(i.frame_rate, a.frame_rate, o.frame_rate, 0), c = Number(s), l = Number.isFinite(c) && c > 0 ? c : null, u = kr(o.segments, l), d = String(K(o.global_prompt, i.global_prompt, a.global_prompt, "") || "").trim(), f = Pr(t, r, n), p = K(i.custom_width, a.custom_width, i.width), m = K(i.custom_height, a.custom_height, i.height);
	e.ltx_director = Fr({
		title: String(r?._meta?.title || r?.title || "LTX Director").trim(),
		global_prompt: d,
		frame_rate: s,
		duration_frames: K(i.duration_frames, a.duration_frames),
		duration_seconds: K(i.duration_seconds, a.duration_seconds),
		width: p,
		height: m,
		segments: u,
		models: f
	});
	let h = [d, ...u.map((e) => e.prompt)].filter((e) => String(e || "").trim());
	!e.prompt && h.length && (e.prompt = h.join("\n")), !e.models && Object.keys(f).length && (e.models = f), !e.width && p && (e.width = p), !e.height && m && (e.height = m);
}
function K(...e) {
	return e.find((e) => e != null && e !== "");
}
function Or(e) {
	if (e && typeof e == "object") return e;
	if (typeof e != "string" || !e.trim()) return {};
	try {
		let t = JSON.parse(e);
		return t && typeof t == "object" ? t : {};
	} catch {
		return {};
	}
}
function kr(e, t) {
	return Array.isArray(e) ? e.map((e, n) => Ar(e, n, t)).filter((e) => e.prompt || e.filename || e.in !== "" || e.out !== "") : [];
}
function Ar(e, t, n) {
	let r = K(e?.start, e?.startFrame, e?.in, e?.from, e?.start_frame), i = K(e?.end, e?.endFrame, e?.out, e?.to, e?.end_frame), a = K(e?.length, e?.duration, e?.frames, e?.duration_frames), o = i === void 0 ? jr(r, a) : i, s = String(K(e?.prompt, e?.text, e?.caption, "") || "").trim(), c = String(K(e?.imageFile, e?.videoFile, e?.audioFile, e?.filename, e?.file, e?.path, "") || "").trim();
	return Fr({
		index: t + 1,
		id: e?.id,
		prompt: s,
		in: Mr(r, n),
		out: Mr(o, n),
		in_frame: r,
		out_frame: o,
		filename: c,
		type: e?.type
	});
}
function jr(e, t) {
	let n = Number(e), r = Number(t);
	if (Number.isFinite(n) && Number.isFinite(r)) return n + r;
}
function Mr(e, t) {
	if (e == null || e === "") return "";
	let n = Number(e);
	return !Number.isFinite(n) || !t ? String(e) : Nr(n / t);
}
function Nr(e) {
	if (!Number.isFinite(e)) return "";
	let t = Math.max(0, e);
	if (t < 60) return `${t < 10 && Math.abs(t - Math.round(t)) > .05 ? Math.round(t * 10) / 10 : Math.round(t)}s`;
	let n = Math.floor(t / 60), r = Math.round(t % 60);
	return r === 0 ? `${n}m` : `${n}m ${r}s`;
}
function Pr(e, t, n) {
	let r = {}, i = (e, t) => {
		if (r[e] || typeof t != "string") return;
		let n = t.trim();
		n && (r[e] = n);
	}, a = Qr(t) || {};
	i("unet", Kr(a.model, n)), i("clip", Kr(a.clip, n)), i("audio_vae", Kr(a.audio_vae, n)), i("video_vae", Kr(a.video_vae, n));
	for (let t of e) {
		let e = Qr(t) || {}, n = String(t?.class_type || t?.type || "").toLowerCase();
		if (n.includes("unet") && i("unet", e.unet_name || e.model_name), n.includes("latentupscale") && i("upscaler", e.model_name || e.upscale_model), n.includes("clip") && i("clip", e.clip_name || e.clip_name1), n.includes("vae")) {
			let t = e.vae_name || e.model_name;
			/audio/i.test(String(t || "")) || n.includes("audio") ? i("audio_vae", t) : /tae|tiny/i.test(String(t || "")) ? i("tiny_vae", t) : i("video_vae", t);
		}
	}
	return r;
}
function Fr(e) {
	let t = {};
	for (let [n, r] of Object.entries(e || {})) r != null && r !== "" && (Array.isArray(r) && r.length === 0 || (!r || typeof r != "object" || Array.isArray(r) || Object.keys(r).length !== 0) && (t[n] = r));
	return t;
}
function Ir(e) {
	if (!e || typeof e != "object") return JSON.stringify(e);
	let t = {};
	for (let n of Object.keys(e).sort()) {
		let r = e[n];
		r != null && r !== "" && (t[n] = r);
	}
	return JSON.stringify(t);
}
function Lr(e) {
	return !e || typeof e != "object" ? Ir(e) : [
		e.sampler_name || e.sampler || "",
		e.scheduler || "",
		e.steps ?? "",
		e.cfg ?? "",
		e.denoise ?? "",
		e.seed ?? "",
		e.start_at_step ?? "",
		e.end_at_step ?? ""
	].map((e) => String(e)).join("::");
}
function Rr(e, t = Ir) {
	let n = /* @__PURE__ */ new Set(), r = [];
	for (let i of e) {
		let e = t(i);
		n.has(e) || (n.add(e), r.push(i));
	}
	return r;
}
function zr(e) {
	if (!e || typeof e != "object") return null;
	let t = e.prompt;
	if (typeof t == "string" && t.trim()) try {
		t = JSON.parse(t);
	} catch {
		t = null;
	}
	let n = t && typeof t == "object" ? t : e;
	return Cr(n) ? n : null;
}
function Br(e) {
	return e.includes("ksamplerselect") || e.includes("samplerselect") ? !1 : e.includes("ksampler") || e.includes("samplercustom") || e.includes("sampler_custom");
}
function Vr(e, t) {
	if (!t) return "";
	let n = Kr(e?.inputs?.model, t).toLowerCase();
	if (Hr(n)) return "high";
	if (Ur(n)) return "low";
	if (/\b(upscale|upscaler|_to_\d{3,5}|to[_-]?\d{3,5})\b/i.test(n)) return "upscale";
	let r = Wr(e, t).join(" ");
	if (Hr(r)) return "high";
	if (Ur(r)) return "low";
	if (/\b(pidconditioning|imageupscalewithmodel|ultimate|supir|esrgan|realesrgan)\b/i.test(r)) return "upscale";
	let i = Wr(e, t, "latent_image").join(" ");
	return /\b(inpaint|vaeencodeforinpaint|setlatentnoise mask|masktoimage)\b/i.test(i) ? "inpaint" : /\b(latentupscale|latentupsampler|imageupscalewithmodel|ultimate|supir|esrgan|realesrgan)\b/i.test(i) && !Hr(r) && !Ur(r) ? "upscale" : /\b(vaeencode|loadimage|imagebatch|imagetolatent)\b/i.test(i) ? "img2img" : /\b(emptylatentimage|emptysd3latentimage|emptychromaradiancelatentimage|empty latent)\b/i.test(i) ? "txt2img" : "";
}
function Hr(e) {
	return /(?:^|[^a-z0-9])high[_\s-]?noise(?:[^a-z0-9]|$)/i.test(String(e || ""));
}
function Ur(e) {
	return /(?:^|[^a-z0-9])low[_\s-]?noise(?:[^a-z0-9]|$)/i.test(String(e || ""));
}
function Wr(e, t, n) {
	let r = n ? [e?.inputs?.[n]] : Object.values(e?.inputs || {}), i = [], a = /* @__PURE__ */ new Set(), o = (e) => {
		let n = String(e?._mjrPromptId || e?.id || "");
		if (n && a.has(n)) return;
		n && a.add(n);
		let r = String(e?.class_type || e?.type || e?._meta?.title || "");
		r && i.push(r.toLowerCase());
		let s = e?.inputs && typeof e.inputs == "object" ? e.inputs : {};
		for (let e of Object.values(s)) {
			let n = qr(e, t);
			n && o(n);
		}
	};
	for (let e of r) {
		let n = qr(e, t);
		n && o(n);
	}
	return i;
}
function Gr(e, t) {
	let n = {};
	if (!t) return n;
	let r = qr(e?.inputs?.noise, t)?.inputs || {};
	r.noise_seed !== void 0 && (n.seed = r.noise_seed), r.seed !== void 0 && (n.seed = r.seed);
	let i = qr(e?.inputs?.guider, t)?.inputs || {};
	i.cfg !== void 0 && (n.cfg = i.cfg), i.model !== void 0 && (n.model_link = i.model);
	let a = qr(e?.inputs?.sampler, t)?.inputs || {};
	a.sampler_name && (n.sampler_name = a.sampler_name);
	let o = qr(e?.inputs?.sigmas, t)?.inputs || {};
	if (o.scheduler && (n.scheduler = o.scheduler), o.steps !== void 0 && (n.steps = q(o.steps, t)), o.denoise !== void 0 && (n.denoise = q(o.denoise, t)), n.steps === void 0 && typeof o.sigmas == "string") {
		let e = o.sigmas.split(",").map((e) => e.trim()).filter(Boolean).length;
		e > 1 && (n.steps = Math.max(1, e - 1));
	}
	return n;
}
function q(e, t, n = /* @__PURE__ */ new Set()) {
	if (e == null || !Array.isArray(e)) return e;
	if (!t) return;
	let r = qr(e, t);
	if (!r) return;
	let i = String(r?._mjrPromptId || r?.id || e[0] || "");
	if (i && n.has(i)) return;
	i && n.add(i);
	let a = r?.inputs && typeof r.inputs == "object" ? r.inputs : {};
	if (String(r?.class_type || r?.type || "").toLowerCase().includes("switch")) return q(q(a.switch, t, n) ? a.on_true : a.on_false, t, n);
	if (Object.prototype.hasOwnProperty.call(a, "value")) return a.value;
	for (let e of [
		"number",
		"int",
		"float",
		"seed",
		"steps",
		"cfg"
	]) if (Object.prototype.hasOwnProperty.call(a, e)) return a[e];
}
function Kr(e, t) {
	if (!t) return "";
	let n = /* @__PURE__ */ new Set(), r = (e) => {
		let i = qr(e, t);
		if (!i) return "";
		let a = String(i?._mjrPromptId || i?.id || "");
		if (a && n.has(a)) return "";
		a && n.add(a);
		let o = i?.inputs || {};
		if (String(i?.class_type || i?.type || "").toLowerCase().includes("switch")) {
			let e = q(o.switch, t), n = r(e ? o.on_true : o.on_false);
			if (n) return n;
		}
		let s = o.unet_name || o.ckpt_name || o.model_name || o.model || o.checkpoint || o.checkpoint_name || "";
		if (typeof s == "string" && s.trim()) return s.trim();
		for (let e of Object.values(o)) {
			let t = r(e);
			if (t) return t;
		}
		return "";
	};
	return r(e);
}
function qr(e, t) {
	if (!Array.isArray(e) || e.length < 1) return null;
	let n = String(e[0]), r = t[n];
	if (!r || typeof r != "object") return null;
	if (!r._mjrPromptId) try {
		Object.defineProperty(r, "_mjrPromptId", {
			value: n,
			enumerable: !1
		});
	} catch {}
	return r;
}
function Jr(e, t = /* @__PURE__ */ new WeakSet()) {
	if (!e || typeof e != "object" || t.has(e)) return [];
	t.add(e);
	let n = e.prompt;
	if (typeof n == "string" && n.trim()) try {
		n = JSON.parse(n);
	} catch {
		n = null;
	}
	let r = n && typeof n == "object" ? n : null;
	if (r && Cr(r)) return Object.values(r);
	let i = [];
	Cr(e) && i.push(...Object.values(e));
	for (let n of Yr(e)) {
		let e = Array.isArray(n?.nodes) ? n.nodes.filter(Boolean) : [];
		i.push(...e);
		for (let n of e) for (let e of Zr(n)) i.push(...Jr(e, t));
		for (let e of Xr(n)) i.push(...Jr(e, t));
	}
	return i;
}
function Yr(e) {
	if (!e || typeof e != "object") return [];
	let t = [], n = (e) => {
		e && typeof e == "object" && Array.isArray(e.nodes) && t.push(e);
	};
	n(e);
	for (let t of [
		"workflow",
		"Workflow",
		"template",
		"Template",
		"subgraph",
		"Subgraph",
		"graph",
		"lgraph"
	]) n(e?.[t]);
	return t;
}
function Xr(e) {
	return [
		...Array.isArray(e?.definitions?.subgraphs) ? e.definitions.subgraphs : [],
		...Array.isArray(e?.subgraphs) ? e.subgraphs : [],
		...Array.isArray(e?.rootGraph?.subgraphs) ? e.rootGraph.subgraphs : []
	].filter((e) => e && typeof e == "object" && Array.isArray(e.nodes));
}
function Zr(e) {
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
	].filter((e) => e && typeof e == "object" && Array.isArray(e.nodes));
}
function Qr(e) {
	let t = e?.inputs;
	if (t && typeof t == "object" && !Array.isArray(t)) return t;
	let n = e?.widgets_values, r = {};
	if (n && typeof n == "object" && !Array.isArray(n)) {
		for (let [e, t] of Object.entries(n)) r[e] = t;
		return r;
	}
	if (!Array.isArray(t) || !Array.isArray(n)) return null;
	let i = t.filter($r);
	for (let e = 0; e < n.length; e += 1) {
		let a = i[e] || t[e] || null, o = String(a?.label || a?.localized_name || a?.name || a?.widget?.name || a?.widget?.label || "").trim();
		r[o || `param_${e + 1}`] = n[e];
	}
	return r;
}
function $r(e) {
	if (!e || typeof e != "object") return !1;
	if (e.widget === !0 || e.widget && typeof e.widget == "object" || typeof e.widget == "string" && e.widget.trim()) return !0;
	if (e.link != null) return !1;
	let t = String(e.type || "").trim().toUpperCase();
	return [
		"INT",
		"FLOAT",
		"STRING",
		"BOOLEAN",
		"BOOL",
		"COMBO",
		"ENUM"
	].includes(t);
}
// ui/components/sidebar/parsers/geninfoParser.ts
var ei = /^(?:[a-z]:[\\/]|[\\/]{1,2}|\.{1,2}[\\/]|~[\\/]).+?[\\/][^\\/\n]+\.(?:png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif|apng|hdr|svg|mp4|webm|mov|mkv|avi|m4v|mp3|wav|flac|ogg|glb|gltf|obj|fbx|ply|stl|ckpt|safetensors|pt|pth|bin|gguf|json|ya?ml)$/i, ti = /^(?!.*[,;])(?!.*\b(?:cinematic|portrait|landscape|lighting|style|detailed|masterpiece|photo|render)\b).*(?:[\\/][^\\/\n]+){2,}\.(?:png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif|apng|hdr|svg|mp4|webm|mov|mkv|avi|m4v|mp3|wav|flac|ogg|glb|gltf|obj|fbx|ply|stl|ckpt|safetensors|pt|pth|bin|gguf|json|ya?ml)$/i, ni = /* @__PURE__ */ new Set([
	"workflow",
	"quicktime:workflow",
	"keys:workflow",
	"comfyui:workflow",
	"comfy_workflow",
	"comfyuiworkflow"
]), ri = /* @__PURE__ */ new Set([
	"prompt",
	"quicktime:prompt",
	"keys:prompt",
	"comfyui:prompt",
	"comfy_prompt",
	"comfyuiprompt"
]);
function ii(e) {
	if (!e) return null;
	if (typeof e == "object") {
		let t = e.geninfo || e.GenInfo || e.generation || null;
		if (t && typeof t == "object") {
			let n = {}, r = /* @__PURE__ */ new Set(), i = (e, t) => {
				if (t && typeof t == "object" && (t.confidence === "override" || t.source === "majoor_geninfo")) for (let t of Array.isArray(e) ? e : [e]) r.add(t);
			}, a = t.positive?.value ?? t.positive?.text ?? null, o = t.negative?.value ?? t.negative?.text ?? null;
			typeof a == "string" && a.trim() && (n.prompt = a), typeof o == "string" && o.trim() && (n.negative_prompt = o), i("prompt", t.positive), i("negative_prompt", t.negative);
			let s = t.checkpoint?.name ?? t.checkpoint ?? null;
			typeof s == "string" && s.trim() && (n.model = s), i(["model", "checkpoint"], t.checkpoint);
			let c = t.clip?.name ?? t.clip ?? null;
			typeof c == "string" && c.trim() && (n.clip = c), i("clip", t.clip);
			let l = t.vae?.name ?? t.vae ?? null;
			typeof l == "string" && l.trim() && (n.vae = l), i("vae", t.vae);
			let u = t.models;
			u && typeof u == "object" && (n.models = u);
			let d = Array.isArray(t.model_groups) ? t.model_groups : null;
			d && d.length && (n.model_groups = d);
			let f = Array.isArray(t.loras) ? t.loras : null;
			f && (n.loras = f), f?.some((e) => e?.confidence === "override" || e?.source === "majoor_geninfo") && r.add("loras");
			let p = t.sampler?.name ?? t.sampler ?? null;
			typeof p == "string" && p.trim() && (n.sampler = p), i("sampler", t.sampler);
			let m = t.scheduler?.name ?? t.scheduler ?? null;
			typeof m == "string" && m.trim() && (n.scheduler = m), i("scheduler", t.scheduler);
			let h = t.steps?.value ?? t.steps ?? null;
			h != null && (n.steps = h), i("steps", t.steps);
			let g = t.cfg?.value ?? t.cfg ?? null;
			g != null && (n.cfg = g), i(["cfg", "cfg_scale"], t.cfg);
			let _ = t.cfg_high_noise?.value ?? t.cfg_high_noise ?? null;
			_ != null && (n.cfg_high_noise = _);
			let v = t.cfg_low_noise?.value ?? t.cfg_low_noise ?? null;
			v != null && (n.cfg_low_noise = v);
			let y = t.seed?.value ?? t.seed ?? null;
			y != null && (n.seed = y), i("seed", t.seed);
			let b = t.voice?.name ?? t.voice?.value ?? t.voice ?? null;
			b != null && String(b).trim() && (n.voice = String(b).trim());
			let x = t.language?.value ?? t.language ?? null;
			x != null && String(x).trim() && (n.language = String(x).trim());
			let S = t.temperature?.value ?? t.temperature ?? null;
			S != null && (n.temperature = S);
			let C = t.top_k?.value ?? t.top_k ?? null;
			C != null && (n.top_k = C);
			let w = t.top_p?.value ?? t.top_p ?? null;
			w != null && (n.top_p = w);
			let ee = t.repetition_penalty?.value ?? t.repetition_penalty ?? null;
			ee != null && (n.repetition_penalty = ee);
			let T = t.max_new_tokens?.value ?? t.max_new_tokens ?? null;
			T != null && (n.max_new_tokens = T);
			let te = t.device?.value ?? t.device ?? null;
			te != null && String(te).trim() && (n.device = String(te).trim());
			let E = t.voice_preset?.value ?? t.voice_preset ?? null;
			E != null && String(E).trim() && (n.voice_preset = String(E).trim());
			let D = t.instruct?.value ?? t.instruct ?? null;
			D != null && String(D).trim() && (n.instruct = String(D).trim());
			let O = t.dtype?.value ?? t.dtype ?? null;
			O != null && String(O).trim() && (n.dtype = String(O).trim());
			let k = t.attn_implementation?.value ?? t.attn_implementation ?? null;
			k != null && String(k).trim() && (n.attn_implementation = String(k).trim());
			let ne = t.x_vector_only_mode?.value ?? t.x_vector_only_mode ?? null;
			ne != null && (n.x_vector_only_mode = ne);
			let re = t.use_torch_compile?.value ?? t.use_torch_compile ?? null;
			re != null && (n.use_torch_compile = re);
			let ie = t.use_cuda_graphs?.value ?? t.use_cuda_graphs ?? null;
			ie != null && (n.use_cuda_graphs = ie);
			let A = t.compile_mode?.value ?? t.compile_mode ?? null;
			A != null && String(A).trim() && (n.compile_mode = String(A).trim());
			let j = t.enable_chunking?.value ?? t.enable_chunking ?? null;
			j != null && (n.enable_chunking = j);
			let M = t.max_chars_per_chunk?.value ?? t.max_chars_per_chunk ?? null;
			M != null && (n.max_chars_per_chunk = M);
			let ae = t.chunk_combination_method?.value ?? t.chunk_combination_method ?? null;
			ae != null && String(ae).trim() && (n.chunk_combination_method = String(ae).trim());
			let oe = t.silence_between_chunks_ms?.value ?? t.silence_between_chunks_ms ?? null;
			oe != null && (n.silence_between_chunks_ms = oe);
			let se = t.enable_audio_cache?.value ?? t.enable_audio_cache ?? null;
			se != null && (n.enable_audio_cache = se);
			let ce = t.batch_size?.value ?? t.batch_size ?? null;
			ce != null && (n.batch_size = ce);
			let le = t.denoise?.value ?? t.denoise ?? null;
			le != null && (n.denoise = le), i(["denoise", "denoising"], t.denoise);
			let N = t.clip_skip?.value ?? t.clip_skip ?? t.clipSkip ?? null;
			N != null && (n.clip_skip = N);
			let ue = t.inputs;
			Array.isArray(ue) && (n.inputs = ue), t.ltx_director && typeof t.ltx_director == "object" && (n.ltx_director = t.ltx_director);
			let de = t.lyrics?.value ?? t.lyrics ?? null;
			typeof de == "string" && de.trim() && (n.lyrics = de);
			let fe = t.lyrics_strength?.value ?? t.lyrics_strength ?? null;
			fe != null && (n.lyrics_strength = fe);
			let pe = t.notes?.value ?? t.workflow_notes?.value ?? t.notes ?? t.workflow_notes ?? null;
			typeof pe == "string" && pe.trim() && (n.workflow_notes = pe.trim()), i(["workflow_notes", "notes"], t.notes ?? t.workflow_notes), Array.isArray(t.custom_info) && (n.custom_info = t.custom_info), Array.isArray(t.custom_info) && t.engine?.mode === "override" && r.add("custom_info"), Array.isArray(t.all_positive_prompts) && t.all_positive_prompts.length > 1 && (n.all_positive_prompts = t.all_positive_prompts), Array.isArray(t.all_negative_prompts) && t.all_negative_prompts.length > 1 && (n.all_negative_prompts = t.all_negative_prompts), Array.isArray(t.all_samplers) && t.all_samplers.length > 1 && (n.all_samplers = t.all_samplers), Array.isArray(t.chained_passes) && t.chained_passes.length > 1 && (n.chained_passes = t.chained_passes), Array.isArray(t.all_checkpoints) && t.all_checkpoints.length > 1 && (n.all_checkpoints = t.all_checkpoints);
			let me = t.size || null;
			if (me && typeof me == "object" && (me.width !== void 0 && (n.width = me.width), me.height !== void 0 && (n.height = me.height)), t.engine && typeof t.engine == "object" && (n.engine = t.engine, (t.engine.mode === "override" || t.engine.parser_version === "geninfo-override-v1" || t.engine.source === "majoor_geninfo") && (n.is_override = !0)), r.size && (n.override_fields = Array.from(r)), li(n, fi(e)), pi(n, e), Object.keys(n).length) return n;
		}
		let n = wr(e);
		if (n) return n;
		if (Cr(e)) {
			let t = wr({ prompt: e });
			if (t) return t;
		}
		let r = fi(e);
		if (r) return r;
		if ([
			"prompt",
			"negative_prompt",
			"negativePrompt",
			"steps",
			"sampler",
			"sampler_name",
			"cfg",
			"cfg_scale",
			"seed",
			"width",
			"height"
		].some((t) => Object.prototype.hasOwnProperty.call(e, t))) return e;
		let i = e.parameters || e["PNG:Parameters"] || e["EXIF:UserComment"] || e.UserComment || e.ImageDescription || null;
		if (typeof i == "string") {
			let e = Sr(i);
			if (e) return e;
		}
		let a = e.workflow || e.Workflow || e.comfy || e.comfyui || e.ComfyUI || null;
		if (a && typeof a == "object") {
			let e = wr(a);
			if (e) return e;
		}
		return e;
	}
	if (typeof e == "string") {
		let t = e.trim();
		if (!t) return null;
		let n = Sr(t);
		if (n) return n;
		if (t.startsWith("{") && t.endsWith("}") || t.startsWith("[") && t.endsWith("]")) try {
			return ii(JSON.parse(t));
		} catch {
			return null;
		}
		return { prompt: t };
	}
	return null;
}
function ai(e) {
	return String(e || "").trim().replace(/\\/g, "/").toLowerCase();
}
function oi(e) {
	if (!e) return null;
	if (typeof e == "object") return e;
	if (typeof e != "string") return null;
	let t = e.trim();
	if (!t || !(t.startsWith("{") || t.startsWith("["))) return null;
	try {
		return JSON.parse(t);
	} catch {
		return null;
	}
}
function si(e) {
	if (!e || typeof e != "object") return [];
	let t = [], n = (e) => {
		e && typeof e == "object" && !t.includes(e) && t.push(e);
	};
	n(e), n(e.metadata_raw), n(e.metadata), n(e.raw), n(e.exif), n(e.metadata_raw?.exif), n(e.metadata?.exif), n(e.format?.tags), n(e.ffprobe?.format?.tags), n(e.raw_ffprobe?.format?.tags), n(e.metadata_raw?.raw_ffprobe?.format?.tags), n(e.metadata_raw?.ffprobe?.format?.tags), n(e.metadata?.raw_ffprobe?.format?.tags), n(e.metadata?.ffprobe?.format?.tags);
	let r = [
		e.streams,
		e.ffprobe?.streams,
		e.raw_ffprobe?.streams,
		e.metadata_raw?.raw_ffprobe?.streams,
		e.metadata_raw?.ffprobe?.streams,
		e.metadata?.raw_ffprobe?.streams,
		e.metadata?.ffprobe?.streams
	];
	for (let e of r) if (Array.isArray(e)) for (let t of e) n(t?.tags);
	return t;
}
function ci(e, t) {
	if (!e || typeof e != "object") return null;
	for (let [n, r] of Object.entries(e)) if (t.has(ai(n))) return r;
	return null;
}
function li(e, t) {
	if (t && typeof t == "object") for (let [n, r] of Object.entries(t)) r != null && r !== "" && (Array.isArray(r) && Array.isArray(e[n]) ? e[n] = di(e[n], r) : r && typeof r == "object" && !Array.isArray(r) && e[n] && typeof e[n] == "object" && !Array.isArray(e[n]) ? e[n] = {
		...r,
		...e[n]
	} : (e[n] === void 0 || e[n] === null || e[n] === "") && (e[n] = r));
}
function ui(e) {
	if (!e || typeof e != "object") return JSON.stringify(e);
	let t = e.name || e.lora_name || e.model || e.sampler_name || e.sampler || "", n = e.key || e.pass_stage || e.source || "";
	return t || n ? `${String(n).toLowerCase()}::${String(t).toLowerCase()}` : JSON.stringify(e);
}
function di(e, t) {
	let n = [...e], r = new Set(n.map((e) => ui(e)));
	for (let e of t) {
		let t = ui(e);
		r.has(t) || (r.add(t), n.push(e));
	}
	return n;
}
function fi(e) {
	let t = null, n = null;
	for (let r of si(e)) if (t ||= oi(ci(r, ni)), n ||= oi(ci(r, ri)), t && n) break;
	let r = {};
	return (t || n) && (li(r, wr({
		workflow: t,
		prompt: n
	})), li(r, wr(t)), n && Cr(n) && li(r, wr({ prompt: n }))), Object.keys(r).length ? r : null;
}
function pi(e, t) {
	let n = t?.workflow || t?.Workflow || t?.comfy_workflow || t?.comfy || t?.comfyui || t?.ComfyUI || null;
	if (!n || typeof n != "object") return;
	let r = wr(n), i = Array.isArray(r?.all_samplers) ? r.all_samplers : [];
	if (i.length) {
		for (let t of ["all_samplers", "chained_passes"]) {
			let n = Array.isArray(e[t]) ? e[t] : [];
			n.length && (e[t] = n.map((e, t) => {
				let n = i[t]?.pass_stage;
				return !n || e?.pass_stage ? e : {
					...e,
					pass_stage: n
				};
			}));
		}
		!Array.isArray(e.all_samplers) && i.length > 1 && (e.all_samplers = i);
	}
}
function mi(e) {
	let t = typeof e == "string" ? e.trim() : "";
	return !t || t.includes("\n") ? !1 : ei.test(t) || ti.test(t);
}
function J(e) {
	let t = typeof e == "string" ? e.trim() : "";
	return t ? mi(t) ? "" : t : "";
}
function hi(e, t) {
	let n = J(e), r = J(t);
	if (n) {
		let e = /(?:^|\n)\s*Negative prompt:\s*/i;
		if (e.test(n)) {
			let t = n.split(e), i = (t[0] || "").trim(), a = t.slice(1).join("Negative prompt:").trim(), o = a.search(/\n\s*Steps:\s*\d+/i), s = (o >= 0 ? a.slice(0, o) : a).trim();
			i && (n = J(i)), !r && s && (r = J(s));
		}
	}
	return n && r && n.trim() === r.trim() && (r = ""), {
		positive: n,
		negative: r
	};
}
function Y(e) {
	if (!e) return "";
	let t = String(e).trim().replace(/\\/g, "/");
	return (t.split("/").pop() || t).replace(/\.(safetensors|ckpt|pt|pth|bin|gguf|json)$/i, "");
}
function gi(e) {
	let t = Number(e);
	return Number.isFinite(t) ? Math.abs(t - Math.round(t)) < 1e-9 ? String(Math.round(t)) : t.toFixed(2).replace(/0+$/g, "").replace(/\.$/, "") : String(e ?? "").trim();
}
function _i(e) {
	if (!e) return "";
	if (typeof e == "string") return Y(e);
	let t = Y(e.name || e.lora_name || "");
	if (!t) return "";
	let n = e.weight ?? e.strength ?? null, r = e.strength_model ?? null, i = e.strength_clip ?? null;
	if (r !== null || i !== null) {
		let e = [];
		return r != null && e.push(`m=${gi(r)}`), i != null && e.push(`c=${gi(i)}`), e.length ? `${t} (${e.join(", ")})` : t;
	}
	return n == null ? t : `${t} (${gi(n)})`;
}
function vi(e) {
	let t = String(e || "").trim().toLowerCase();
	return t ? t === "img2vid" ? "Image-to-Video" : t === "txt2vid" ? "Text-to-Video" : t === "img2img" ? "Image-to-Image" : t === "txt2img" ? "Text-to-Image" : t === "vid2vid" ? "Video-to-Video" : t === "tts" ? "Text-to-Speech" : t === "audio" ? "Audio" : t.split(/[_\s-]+/).filter(Boolean).map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(" ") : "";
}
function yi(e) {
	let t = String(e || "").trim().toLowerCase();
	if (!t || t === "api") return "";
	let n = {
		happy_horse: "Happy Horse",
		google_gemini: "Google Gemini",
		google_veo: "Google Veo",
		openai: "OpenAI",
		anthropic: "Anthropic",
		black_forest_labs: "Black Forest Labs",
		stability_ai: "Stability AI",
		alibaba_wan: "Alibaba Wan",
		kling_ai: "Kling AI",
		luma_dream_machine: "Luma Dream Machine",
		minimax_hailuo: "MiniMax Hailuo",
		xai_grok: "xAI Grok",
		ltxv_api: "LTXV API",
		eleven_labs: "ElevenLabs",
		bytedance_seedance: "ByteDance Seedance"
	};
	return n[t] ? n[t] : t.split(/[_\s-]+/).filter(Boolean).map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(" ");
}
function bi(e) {
	let t = e?.engine && typeof e.engine == "object" ? e.engine : null, n = String(t?.type || "").trim(), r = String(t?.sampler_mode || "").trim().toLowerCase(), i = vi(n) || n, a = yi(t?.api_provider), o = r === "api" ? `API ${i || "Workflow"}` : i;
	return {
		workflowType: n,
		workflowLabel: String(o || n).trim(),
		workflowBadge: a
	};
}
// ui/vue/components/panel/sidebar/generationSectionState.ts
var xi = /* @__PURE__ */ new Set([
	"png",
	"jpg",
	"jpeg",
	"webp",
	"gif",
	"bmp",
	"tiff",
	"tif",
	"avif",
	"jxl",
	"heic",
	"heif",
	"apng",
	"hdr",
	"svg"
]);
function Si(e) {
	let t = String(e?.filename || e?.name || e?.filepath || e?.path || "").trim().toLowerCase();
	return !t || !t.includes(".") ? "" : t.split(".").pop() || "";
}
function Ci(e) {
	return String(e?.kind || "").trim().toLowerCase() === "image" || String(e?.mime || e?.mimetype || "").trim().toLowerCase().startsWith("image/") ? !0 : xi.has(Si(e));
}
function wi(e) {
	let t = Si(e);
	return t === "jpg" || t === "jpeg";
}
function Ti() {
	try {
		return !!(B()?.ai?.vectorSearchEnabled ?? !0);
	} catch {
		return !0;
	}
}
function Ei(e) {
	return e >= .75 ? "#4CAF50" : e >= .5 ? "#8BC34A" : e >= .3 ? "#FF9800" : "#F44336";
}
function Di(e) {
	return e >= .85 ? "Excellent" : e >= .7 ? "Good" : e >= .5 ? "Fair" : e >= .3 ? "Low" : "Very Low";
}
function Oi(e) {
	let t = String(e || "").trim();
	if (!t) return "";
	let n = [];
	for (let e of t.replace(/\r\n/g, "\n").split("\n")) {
		let t = String(e || "").trim();
		t && (/^title\s*:/i.test(t) || (/^caption\s*:/i.test(t) && (t = t.replace(/^caption\s*:/i, "").trim()), t && n.push(t)));
	}
	return (n.length ? n.join(" ") : t).replace(/\s+/g, " ").replace(/:{2,}\s*$/, "").trim();
}
function ki(e) {
	let t = String(e?.filename || "").trim();
	if (!t) return [];
	let n = String(e?.subfolder || "").trim(), r = String(e?.folder_type || "input").trim().toLowerCase(), i = [], a = (e) => {
		if (!e) return;
		let r = j(t, n, e);
		r && !i.includes(r) && i.push(r);
	};
	return (r === "input" || r === "output") && a(r), a("input"), a("output"), i;
}
function Ai(e) {
	let t = String(e?.filepath || "").trim(), n = String(e?.filename || "").trim();
	return !t || t === n ? "" : t;
}
function ji(e) {
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
function X(e) {
	return e == null || e === "" ? "-" : String(e);
}
function Mi(e, t) {
	let n = String(e?.pass_stage || e?.stage || e?.kind || "").trim().toLowerCase();
	if (n === "txt2img" || n === "text_to_image" || n === "text-to-image") return N("sidebar.generation.stageTextToImage", "Text-to-Image");
	if (n === "img2img" || n === "image_to_image" || n === "image-to-image") return N("sidebar.generation.stageImageToImage", "Image-to-Image");
	if (n === "inpaint" || n === "inpainting") return N("sidebar.generation.stageInpaint", "Inpaint");
	if (n === "upscale" || n === "upscaling") return N("sidebar.generation.stageUpscale", "Upscale");
	if (n === "refine" || n === "refiner") return N("sidebar.generation.stageRefine", "Refine");
	let r = String(e?.pass_name || "").trim();
	if (r && r.toLowerCase() !== "base") return r;
	let i = Number(e?.denoise);
	return t === 0 || i === 1 ? N("sidebar.generation.stageBase", "Base") : Number.isFinite(i) && i < 1 ? N("sidebar.generation.stageRefineUpscale", "Refine / Upscale") : N("sidebar.generation.stagePassN", "Pass {n}", { n: t + 1 });
}
function Ni(e) {
	let t = [];
	return e?.metadata_raw && t.push(e.metadata_raw), e?.workflow && t.push(e.workflow), e?.metadata_raw?.workflow && t.push(e.metadata_raw.workflow), e?.metadata_raw?.raw_ffprobe?.format?.tags && t.push(e.metadata_raw.raw_ffprobe.format.tags), e?.metadata_raw?.ffprobe?.format?.tags && t.push(e.metadata_raw.ffprobe.format.tags), e?.geninfo && typeof e.geninfo == "object" && t.push({ geninfo: e.geninfo }), e?.metadata && (typeof e.metadata == "object" || typeof e.metadata == "string") && t.push(e.metadata), e?.prompt && (typeof e.prompt == "object" || typeof e.prompt == "string") && t.push(e.prompt), e?.exif && t.push(e.exif), e && typeof e == "object" && t.push(e), t;
}
function Pi(e, t) {
	for (let [n, r] of Object.entries(t)) r != null && r !== "" && (e[n] === void 0 || e[n] === null || e[n] === "") && (e[n] = r);
}
function Fi(e) {
	let t = Ni(e), n = {};
	for (let e of t) {
		let t = ii(e);
		t && typeof t == "object" && Pi(n, t);
	}
	return Object.keys(n).length ? n : null;
}
function Ii(e) {
	try {
		if (!e || typeof e != "object") return !1;
		if (e.is_override || typeof e.workflow_notes == "string" && e.workflow_notes.trim() || typeof e.notes == "string" && e.notes.trim() || Array.isArray(e.custom_info) && e.custom_info.length > 0 || e.engine && typeof e.engine == "object" && e.engine.type || J(e.prompt) || typeof (e.negative_prompt || e.negativePrompt) == "string" && J(e.negative_prompt || e.negativePrompt) || e.models || e.model || e.checkpoint || e.loras || e.ltx_director && typeof e.ltx_director == "object" || e.ideogram && typeof e.ideogram == "object" || e.sampler || e.sampler_name || e.steps || e.cfg || e.cfg_scale || e.cfg_high_noise || e.cfg_low_noise || e.scheduler || Array.isArray(e.chained_passes) && e.chained_passes.length > 0 || Array.isArray(e.all_samplers) && e.all_samplers.length > 0 || e.seed || e.denoise || e.denoising || e.clip_skip || e.voice || e.language || e.temperature || e.top_k || e.top_p || e.repetition_penalty || e.max_new_tokens || e.device || e.voice_preset || e.instruct || e.dtype || e.attn_implementation || e.enable_chunking !== void 0 || e.max_chars_per_chunk || e.chunk_combination_method || e.silence_between_chunks_ms || e.enable_audio_cache !== void 0 || e.batch_size !== void 0 || e.use_torch_compile !== void 0 || e.use_cuda_graphs !== void 0 || e.compile_mode || typeof e.lyrics == "string" && e.lyrics.trim()) return !0;
	} catch {
		return !1;
	}
	return !1;
}
function Z(e) {
	return e ? typeof e == "string" ? Y(e) : typeof e == "object" ? Y(e.name || e.value || "") : "" : "";
}
function Li(e, t, n, r) {
	let i = String(r || "").trim();
	if (!i) return;
	let a = `${n}::${i}`;
	t.has(a) || (t.add(a), e.push({
		label: n,
		value: i
	}));
}
function Ri(e) {
	let t = `${String(e?.source || "").toLowerCase()} ${String(e?.name || e?.lora_name || "").toLowerCase()}`;
	return t.includes("high_noise") || t.includes("high noise") ? "high_noise" : t.includes("low_noise") || t.includes("low noise") ? "low_noise" : "";
}
function zi(e) {
	let t = [], n = Array.isArray(e.model_groups) ? e.model_groups : [];
	if (n.length) return n.forEach((e) => {
		if (!e || typeof e != "object") return;
		let n = Z(e.model), r = Array.isArray(e.loras) ? e.loras.map((e) => _i(e)).filter(Boolean) : [];
		(n || r.length) && t.push({
			key: String(e.key || "").trim() || `group-${t.length + 1}`,
			label: String(e.label || "").trim() || `Group ${t.length + 1}`,
			model: n,
			loras: r
		});
	}), t;
	let r = e.models && typeof e.models == "object" ? e.models : null, i = Array.isArray(e.loras) ? e.loras : [];
	return r && [{
		key: "high_noise",
		label: N("sidebar.generation.highNoise", "High Noise"),
		model: Z(r.unet_high_noise)
	}, {
		key: "low_noise",
		label: N("sidebar.generation.lowNoise", "Low Noise"),
		model: Z(r.unet_low_noise)
	}].forEach((e) => {
		let n = i.filter((t) => Ri(t) === e.key).map((e) => _i(e)).filter(Boolean);
		(e.model || n.length) && t.push({
			...e,
			loras: n
		});
	}), t;
}
function Bi(e, t) {
	return t == null ? null : {
		label: e,
		value: t ? N("state.on", "on") : N("state.off", "off")
	};
}
function Q(e) {
	return e != null && String(e).trim() !== "";
}
function Vi(e) {
	let t = String(e || "").toLowerCase();
	return t.includes("high") ? "#52ffe8" : t.includes("low") ? "#42A5F5" : t.includes("refine") ? "#AB47BC" : t.includes("upscale") ? "#66BB6A" : t.includes("interpolation") || t.includes("video") ? "#dace26" : "#9C27B0";
}
function Hi(e) {
	return String(e || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function Ui(e, t) {
	let n = String(t || e || "").trim(), r = String(e || n).toLowerCase(), i = r.match(/^pass_(\d+)$/);
	return i ? N("sidebar.generation.stagePassN", "Pass {n}", { n: Number(i[1]) }) : r.includes("high") ? "High" : r.includes("low") ? "Low" : r.includes("refine") ? "Refiner" : r.includes("upscale") ? "Upscale" : r.includes("text_to_image") || r.includes("image_to_image") || r === "base" ? "Base" : n || "Branch";
}
function Wi(e, t) {
	let n = new Set(t.map((e) => String(e).toLowerCase()));
	return e.find((e) => n.has(String(e.label || "").toLowerCase())) || null;
}
function Gi(e, t) {
	return Q(t) ? {
		label: e,
		value: t
	} : null;
}
function Ki(e) {
	let t = String(e || "").toLowerCase();
	return t.includes("high_noise") || t.includes("high-noise") || t.includes("high noise") ? "high" : t.includes("low_noise") || t.includes("low-noise") || t.includes("low noise") ? "low" : "";
}
function qi(e) {
	return Array.isArray(e) || e && typeof e == "object" ? !1 : Q(e) && String(e).trim() !== "-";
}
function Ji(e) {
	return typeof e == "number" ? Math.abs(e - Math.round(e)) < 1e-9 ? String(Math.round(e)) : e.toFixed(2).replace(/0+$/g, "").replace(/\.$/, "") : String(e ?? "").trim();
}
function Yi(e) {
	if (!Q(e)) return null;
	let t = Number(e);
	return !Number.isFinite(t) || t <= 0 ? null : e;
}
function Xi(e, t) {
	let n = Yi(e.seed);
	if (n !== null) return n;
	let r = [Array.isArray(e.chained_passes) ? e.chained_passes : [], Array.isArray(e.all_samplers) ? e.all_samplers : []];
	for (let e of r) for (let t of e) {
		let e = Yi(t?.seed_val ?? t?.seed);
		if (e !== null) return e;
	}
	for (let e of t || []) {
		let t = Yi(Wi(e.fields || [], ["Seed"])?.value);
		if (t !== null) return t;
	}
	return null;
}
function Zi(e, t) {
	if (!t || !qi(t.value)) return;
	let n = `${String(t.label || "").toLowerCase()}::${Ji(t.value)}`;
	e.some((e) => `${String(e.label || "").toLowerCase()}::${Ji(e.value)}` === n) || e.push({
		...t,
		value: Ji(t.value)
	});
}
function Qi(e, t, n, r) {
	let i = /* @__PURE__ */ new Map(), a = (e, t) => {
		let n = Hi(e || t || "branch") || "branch";
		n.includes("high") && (n = "high"), n.includes("low") && (n = "low");
		let r = i.get(n);
		if (r) return r;
		let a = {
			key: n,
			label: Ui(n, t),
			accent: Vi(n),
			modelFields: [],
			samplingFields: [],
			loras: []
		};
		return i.set(n, a), a;
	}, o = (e, t, n) => {
		let r = String(n || "").trim();
		r && (e.modelFields.some((e) => String(e.label || "").toLowerCase() === String(t || "").toLowerCase() && Y(e.value) === Y(r)) || e.modelFields.push({
			label: t,
			value: r
		}));
	}, s = (e, t) => {
		let n = String(t || "").trim();
		n && !e.loras.includes(n) && e.loras.push(n);
	};
	for (let e of t || []) {
		let t = a(e.key, e.label);
		e.model && o(t, "UNet", e.model);
		for (let n of e.loras || []) s(t, n);
	}
	let c = e.models && typeof e.models == "object" ? e.models : null;
	if (c) {
		let t = Z(c.unet), n = Ki(t), r = Z(c.checkpoint || (n ? null : c.unet) || e.model || e.checkpoint), i = Z(c.unet_high_noise) || (n === "high" ? t : ""), l = Z(c.unet_low_noise) || (n === "low" ? t : ""), u = Z(c.clip), d = Z(c.vae), f = Array.isArray(e.loras) ? e.loras.map((e) => _i(e)).filter(Boolean) : [], p = !!(i || l), m = !p && (r || u || d || f.length) ? a("base", "Base") : null, h = p && (u || d) ? a("shared", "Shared") : null, g = i ? a("high", "High") : null, _ = l ? a("low", "Low") : null;
		if (m) {
			r && o(m, e.model || e.checkpoint || c.checkpoint ? "Model" : "UNet", r), u && o(m, "CLIP", u), d && o(m, "VAE", d);
			for (let e of f) s(m, e);
		}
		h && (u && o(h, "CLIP", u), d && o(h, "VAE", d)), g && o(g, "UNet", i), _ && o(_, "UNet", l);
	}
	let l = i.get("high") || i.get("high_noise"), u = i.get("low") || i.get("low_noise"), d = [
		Wi(n, ["Sampler"]),
		Wi(n, ["Scheduler"]),
		Wi(n, ["Steps"]),
		Wi(n, ["Seed"])
	].filter(Boolean), f = Gi("CFG", e.cfg_high_noise), p = Gi("CFG", e.cfg_low_noise);
	l && [...d, ...f ? [f] : []].forEach((e) => Zi(l.samplingFields, e)), u && [...d, ...p ? [p] : []].forEach((e) => Zi(u.samplingFields, e));
	let m = (r || []).some((e) => Hi(e.label).includes("upscale")), h = (r || []).length === 2 && (r || []).every((e) => ["base", "pass_2"].includes(Hi(e.label)));
	for (let [e, t] of (r || []).entries()) {
		let n = Hi(t.label);
		if (!n) continue;
		let i = (r || []).filter((e) => Hi(e.label) === Hi(t.label)).length, o = Hi(t.stage), s = o ? (r || []).filter((e) => Hi(e.stage) === o).length : 0, c = Wi(t.fields || [], ["Model"]), d = Ki(c?.value);
		["high", "low"].includes(n) || (d ? n = d : s > 1 || i > 1 ? n = `pass_${e + 1}` : h ? n = e === 0 ? "high" : "low" : n === "base" && l && u ? n = "high" : ["text_to_image", "image_to_image"].includes(n) && (n = m ? "low" : "base")), n.includes("upscale") && m && (n = "high");
		let f = a(n, t.label);
		if (!/^pass_\d+$/i.test(n) && c && String(c.value || "") !== "-") {
			let e = Y(c.value);
			f.modelFields.some((t) => Y(t.value) === e) || f.modelFields.push(c);
		}
		for (let e of t.fields || []) [
			"Sampler",
			"Scheduler",
			"Steps",
			"CFG",
			"Denoise",
			"Seed",
			"Start",
			"End"
		].includes(String(e.label || "")) && Zi(f.samplingFields, e);
	}
	return Array.from(i.values()).filter((e) => e.modelFields.length || e.samplingFields.length || e.loras.length);
}
function $i(e, t, n, r) {
	let i = [], a = (e, t, n, r) => {
		let a = r.filter((e) => e && Q(e.value) && String(e.value) !== "-");
		a.length && i.push({
			key: e,
			title: t,
			accent: n,
			fields: a
		});
	};
	for (let n of t || []) {
		let t = Hi(n.label), r = (n.fields || []).some((e) => {
			let t = String(e?.label || "").toLowerCase(), n = String(e?.value || "").toLowerCase();
			return t.includes("upscaler") || n.includes("upscale") || n.includes("upscaler") || /(?:^|[_\s-])to[_\s-]?\d{3,5}(?:[_\s.-]|$)/i.test(n);
		});
		t.includes("upscale") && (e.upscaler || r) && a("upscale", "Upscale", "#66BB6A", n.fields || []), (t.includes("interpolation") || t.includes("rife") || t.includes("film")) && a("interpolation", "Interpolation", "#26C6DA", n.fields || []);
	}
	a("audio", "MMAudio", "#26A69A", [
		Gi("Voice", e.voice),
		Gi("Language", e.language),
		Gi("Temperature", e.temperature),
		Gi("Lyrics Strength", e.lyrics_strength)
	].filter(Boolean)), a("interpolation", "Interpolation", "#26C6DA", [
		Gi("Engine", e.interpolation_engine || e.frame_interpolation || e.interpolator),
		Gi("Source FPS", e.source_fps || e.input_fps),
		Gi("Final FPS", e.final_fps || e.output_fps || e.fps)
	].filter(Boolean));
	for (let e of n || []) i.push({
		key: Hi(e.title) || `module_${i.length}`,
		title: e.title,
		accent: e.color || "#2196F3",
		fields: [{
			label: "Info",
			value: e.content
		}]
	});
	r && !i.some((e) => String(e.title).toLowerCase() === String(r).toLowerCase()) && a("workflow_engine", r, "#2196F3", [Gi("Engine", r)].filter(Boolean));
	let o = /* @__PURE__ */ new Set();
	return i.filter((e) => {
		let t = `${e.key}:${e.title}:${JSON.stringify(e.fields)}`;
		return !o.has(t) && (o.add(t), !0);
	});
}
function ea(e) {
	return new Set(Array.isArray(e.override_fields) ? e.override_fields.map((e) => String(e || "").trim()).filter(Boolean) : []);
}
function $(e, ...t) {
	return t.some((t) => e.has(t));
}
function ta(e) {
	return Array.isArray(e) ? e.filter((e) => e && typeof e == "object").map((e, t) => ({
		title: String(e.title || N("sidebar.generation.customInfoN", "Custom Info {n}", { n: t + 1 })).trim(),
		content: String(e.content ?? e.value ?? "").trim(),
		color: /^#[0-9a-fA-F]{6}$/.test(String(e.color || "").trim()) ? String(e.color).trim() : "#2196F3"
	})).filter((e) => e.content) : [];
}
function na(e) {
	if (!e || typeof e != "object") return null;
	let t = [], n = (e, n) => {
		Q(n) && t.push({
			label: e,
			value: Ji(n)
		});
	};
	n("FPS", e.frame_rate), n("Frames", e.duration_frames), n("Duration", e.duration_seconds), (Q(e.width) || Q(e.height)) && t.push({
		label: "Size",
		value: `${e.width || "?"} x ${e.height || "?"}`
	});
	let r = Array.isArray(e.segments) ? e.segments.map((e, t) => {
		if (!e || typeof e != "object") return null;
		let n = J(e.prompt || e.text || ""), r = String(e.filename || e.imageFile || e.videoFile || e.audioFile || "").trim(), i = String(e.filepath || e.path || r).trim(), a = String(e.in || e.in_label || e.start || e.start_frame || "").trim(), o = String(e.out || e.out_label || e.end || e.end_frame || "").trim();
		if (!n && !r && !a && !o) return null;
		let s = String(e.type || "").trim().toLowerCase(), c = s === "video" || /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(r), l = s === "audio" || /\.(mp3|wav|flac|ogg|m4a|aac|opus)$/i.test(r);
		return {
			key: String(e.id || `segment-${t + 1}`),
			label: `Segment ${t + 1}`,
			prompt: n,
			inLabel: a,
			outLabel: o,
			filename: r,
			filepath: i,
			type: String(e.type || "").trim(),
			isVideo: c,
			isAudio: l,
			previewCandidates: r ? ki({
				filename: r,
				filepath: i,
				folder_type: String(e.folder_type || e.folderType || "input").trim(),
				subfolder: String(e.subfolder || "").trim()
			}) : []
		};
	}).filter(Boolean) : [], i = J(e.global_prompt || e.globalPrompt || "");
	return !i && !r.length && !t.length ? null : {
		title: String(e.title || "LTX Director").trim(),
		globalPrompt: i,
		fields: t,
		segments: r
	};
}
function ra(e) {
	if (!e || typeof e != "object") return null;
	let t = e.payload && typeof e.payload == "object" ? e.payload : e, n = typeof e.json == "string" && e.json.trim() ? e.json.trim() : JSON.stringify(t, null, 2), r = J(e.high_level_description || e.highLevelDescription || t.high_level_description || ""), i = J(e.background || t.background || ""), a = [], o = (e, t) => {
		Q(t) && a.push({
			label: e,
			value: Ji(t)
		});
	};
	o("Style", t.style), o("Photo Style", t.photo_style || t["style.photo"]), o("Medium", t.medium), o("Lighting", t.lighting), o("Aesthetics", t.aesthetics), o("BG Brightness", t.bg_brightness), (Q(t.width) || Q(t.height)) && a.push({
		label: "Size",
		value: `${t.width || "?"} x ${t.height || "?"}`
	});
	let s = (Array.isArray(e.elements) ? e.elements : Array.isArray(t.elements) ? t.elements : []).map((e, t) => {
		if (!e || typeof e != "object") return null;
		let n = [
			e.x,
			e.y,
			e.w,
			e.h
		].map((e) => Number(e)).map((e) => Number.isFinite(e) ? e.toFixed(3).replace(/0+$/g, "").replace(/\.$/, "") : "").join(", "), r = Array.isArray(e.palette) ? e.palette.map((e) => String(e || "").trim()).filter(Boolean) : [], i = String(e.desc || e.description || "").trim(), a = String(e.text || "").trim();
		return !i && !a && !n && !r.length ? null : {
			key: String(e.id || `ideogram-element-${t + 1}`),
			label: `Element ${t + 1}`,
			description: i,
			text: a,
			bbox: n,
			palette: r
		};
	}).filter(Boolean), c = Array.isArray(e.color_palette) ? e.color_palette : Array.isArray(t.color_palette) ? t.color_palette : [];
	return !n && !r && !i && !s.length ? null : {
		title: String(e.title || "Ideogram 4").trim(),
		json: n,
		highLevelDescription: r,
		background: i,
		fields: a,
		elements: s,
		colorPalette: c.map((e) => String(e || "").trim()).filter(Boolean)
	};
}
function ia(e) {
	let t = Fi(e), n = {
		kind: "empty",
		title: N("sidebar.generation.title", "Generation"),
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
		captionLabel: N("sidebar.generation.imageDescription", "Image Description"),
		emptyCaptionText: N("sidebar.generation.noImageDescription", "No image description yet."),
		isImageAsset: Ci(e),
		lyrics: "",
		modelFields: [],
		modelGroups: [],
		branchCards: [],
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
		customInfoBlocks: [],
		moduleBlocks: [],
		ltxDirector: null,
		ideogram: null
	};
	if (!t || typeof t == "object" && Object.keys(t).length === 0 || !Ii(t)) {
		let t = e?.metadata_raw?.geninfo_status || e?.geninfo_status;
		return t && typeof t == "object" && t.kind === "media_pipeline" ? {
			...n,
			kind: "media-only",
			mediaOnlyMessage: N("sidebar.generation.mediaOnlyPipeline", "This file looks like a media-only pipeline (e.g. LoadVideo/VideoCombine) and does not contain generation parameters.")
		} : Ci(e) || wi(e) ? {
			...n,
			kind: "caption-only",
			showAlignment: !1
		} : n;
	}
	let r = t, i = na(r.ltx_director), a = ra(r.ideogram), o = ea(r), s = r.engine && typeof r.engine == "object" ? r.engine : null, c = !!(r.is_override || s?.mode === "override" || s?.parser_version === "geninfo-override-v1" || s?.source === "majoor_geninfo"), l = bi(r), u = hi(typeof r.prompt == "string" ? r.prompt : null, typeof (r.negative_prompt || r.negativePrompt) == "string" ? r.negative_prompt || r.negativePrompt : null), d = Array.isArray(r.all_positive_prompts) && r.all_positive_prompts.length > 1 ? r.all_positive_prompts.map((e, t) => {
		let n = hi(typeof e == "string" ? e : "", typeof r.all_negative_prompts?.[t] == "string" ? r.all_negative_prompts[t] : "");
		return {
			label: N("sidebar.generation.promptN", "Prompt {n}", { n: t + 1 }),
			positive: J(n.positive),
			negative: J(n.negative)
		};
	}).filter((e) => e.positive) : [], f = [], p = /* @__PURE__ */ new Set(), m = r.models && typeof r.models == "object" ? r.models : null, h = zi(r), g = new Set(h.map((e) => String(e.model || "").trim()).filter(Boolean)), _ = Array.isArray(r.all_checkpoints) && r.all_checkpoints.length > 1 ? r.all_checkpoints : null;
	if (m) {
		let e = new Set([
			Z(m.unet_high_noise),
			Z(m.unet_low_noise),
			...g
		].filter(Boolean));
		if (_) _.forEach((e, t) => {
			let n = Z(e);
			Li(f, p, N("sidebar.generation.checkpointN", "Checkpoint {n}", { n: t + 1 }), n);
		});
		else {
			let t = Z(m.checkpoint);
			t && !e.has(t) && Li(f, p, N("sidebar.generation.checkpoint", "Checkpoint"), t);
		}
		[
			["UNet", Z(m.unet)],
			["Diffusion", Z(m.diffusion)],
			[N("sidebar.generation.upscaler", "Upscaler"), Z(m.upscaler)],
			["CLIP", Z(m.clip)],
			["VAE", Z(m.vae)]
		].forEach(([t, n]) => {
			e.has(n) || Li(f, p, t, n);
		});
	} else (r.model || r.checkpoint) && Li(f, p, N("sidebar.generation.model", "Model"), Y(r.model || r.checkpoint));
	if (Array.isArray(r.loras) && r.loras.length > 0) {
		let e = r.loras.map((e) => _i(e)).filter(Boolean).join("\n");
		e && Li(f, p, r.loras.length > 1 ? N("sidebar.generation.loras", "LoRAs") : "LoRA", e);
	}
	!m && r.clip && Li(f, p, "CLIP", Y(r.clip)), !m && r.vae && Li(f, p, "VAE", Y(r.vae)), !m && r.unet && Li(f, p, "UNet", Y(r.unet)), !m && r.diffusion && Li(f, p, "Diffusion", Y(r.diffusion)), !m && r.upscaler && Li(f, p, N("sidebar.generation.upscaler", "Upscaler"), Y(r.upscaler)), m && r.clip && Li(f, p, "CLIP", Y(r.clip)), m && r.vae && Li(f, p, "VAE", Y(r.vae));
	for (let e of f) {
		let t = String(e.label || "").toLowerCase();
		(t.includes("checkpoint") || t === "model") && (e.override = $(o, "checkpoint", "model")), t === "clip" && (e.override = $(o, "clip")), t === "vae" && (e.override = $(o, "vae")), t.includes("lora") && (e.override = $(o, "loras"));
	}
	let v = [];
	Q(r.seed) && v.push({
		label: N("sidebar.generation.seed", "Seed"),
		value: r.seed,
		override: $(o, "seed")
	}), (r.sampler || r.sampler_name) && v.push({
		label: N("sidebar.generation.sampler", "Sampler"),
		value: r.sampler || r.sampler_name,
		override: $(o, "sampler", "sampler_name")
	}), Q(r.steps) && v.push({
		label: N("sidebar.generation.steps", "Steps"),
		value: r.steps,
		override: $(o, "steps")
	});
	let y = Q(r.cfg) ? r.cfg : r.cfg_scale;
	Q(y) && v.push({
		label: N("sidebar.generation.cfgScale", "CFG Scale"),
		value: y,
		override: $(o, "cfg", "cfg_scale")
	}), r.cfg_high_noise !== void 0 && r.cfg_high_noise !== null && v.push({
		label: N("sidebar.generation.cfgHighNoise", "CFG High Noise"),
		value: r.cfg_high_noise
	}), r.cfg_low_noise !== void 0 && r.cfg_low_noise !== null && v.push({
		label: N("sidebar.generation.cfgLowNoise", "CFG Low Noise"),
		value: r.cfg_low_noise
	}), r.scheduler && v.push({
		label: N("sidebar.generation.scheduler", "Scheduler"),
		value: r.scheduler,
		override: $(o, "scheduler")
	});
	let b = Q(r.denoise) ? r.denoise : r.denoising;
	Q(b) && v.push({
		label: N("sidebar.generation.denoise", "Denoise"),
		value: b,
		override: $(o, "denoise", "denoising")
	});
	let x = [];
	Array.isArray(r.chained_passes) && r.chained_passes.length > 1 ? x = r.chained_passes.filter((e) => e && typeof e == "object").map((e, t) => ({
		label: Mi(e, t),
		stage: String(e?.pass_stage || "").trim(),
		fields: [
			{
				label: N("sidebar.generation.model", "Model"),
				value: X(e?.model)
			},
			{
				label: N("sidebar.generation.sampler", "Sampler"),
				value: X(e?.sampler_name || e?.sampler)
			},
			{
				label: N("sidebar.generation.scheduler", "Scheduler"),
				value: X(e?.scheduler)
			},
			{
				label: N("sidebar.generation.steps", "Steps"),
				value: X(e?.steps)
			},
			{
				label: "CFG",
				value: X(e?.cfg)
			},
			{
				label: N("sidebar.generation.denoise", "Denoise"),
				value: X(e?.denoise)
			},
			{
				label: "Start",
				value: X(e?.start_at_step)
			},
			{
				label: "End",
				value: X(e?.end_at_step)
			},
			{
				label: N("sidebar.generation.seed", "Seed"),
				value: X(e?.seed_val ?? e?.seed)
			}
		]
	})) : Array.isArray(r.all_samplers) && r.all_samplers.length > 1 && (x = r.all_samplers.filter((e) => e && typeof e == "object").map((e, t) => ({
		label: Mi(e, t),
		stage: String(e?.pass_stage || "").trim(),
		fields: [
			{
				label: N("sidebar.generation.model", "Model"),
				value: X(e?.model)
			},
			{
				label: N("sidebar.generation.sampler", "Sampler"),
				value: X(e?.sampler_name || e?.sampler)
			},
			{
				label: N("sidebar.generation.scheduler", "Scheduler"),
				value: X(e?.scheduler)
			},
			{
				label: N("sidebar.generation.steps", "Steps"),
				value: X(e?.steps)
			},
			{
				label: "CFG",
				value: X(e?.cfg)
			},
			{
				label: N("sidebar.generation.denoise", "Denoise"),
				value: X(e?.denoise)
			},
			{
				label: "Start",
				value: X(e?.start_at_step)
			},
			{
				label: "End",
				value: X(e?.end_at_step)
			},
			{
				label: N("sidebar.generation.seed", "Seed"),
				value: X(e?.seed_val ?? e?.seed)
			}
		]
	})));
	let S = [];
	r.voice && S.push({
		label: N("sidebar.generation.narratorVoice", "Narrator Voice"),
		value: r.voice
	}), r.language && S.push({
		label: N("sidebar.generation.language", "Language"),
		value: r.language
	}), r.top_k !== void 0 && r.top_k !== null && S.push({
		label: "Top-k",
		value: r.top_k
	}), r.top_p !== void 0 && r.top_p !== null && S.push({
		label: "Top-p",
		value: r.top_p
	}), r.temperature !== void 0 && r.temperature !== null && S.push({
		label: N("sidebar.generation.temperature", "Temperature"),
		value: r.temperature
	}), r.repetition_penalty !== void 0 && r.repetition_penalty !== null && S.push({
		label: N("sidebar.generation.repetitionPenalty", "Repetition Penalty"),
		value: r.repetition_penalty
	}), r.max_new_tokens !== void 0 && r.max_new_tokens !== null && S.push({
		label: N("sidebar.generation.maxNewTokens", "Max New Tokens"),
		value: r.max_new_tokens
	});
	let C = [];
	r.device && C.push({
		label: N("sidebar.generation.device", "Device"),
		value: r.device
	}), r.voice_preset && C.push({
		label: N("sidebar.generation.voicePreset", "Voice Preset"),
		value: r.voice_preset
	}), r.dtype && C.push({
		label: N("sidebar.generation.dtype", "Dtype"),
		value: r.dtype
	}), r.attn_implementation && C.push({
		label: N("sidebar.generation.attention", "Attention"),
		value: r.attn_implementation
	}), r.compile_mode && C.push({
		label: N("sidebar.generation.compileMode", "Compile Mode"),
		value: r.compile_mode
	}), [
		Bi(N("sidebar.generation.torchCompile", "Torch Compile"), r.use_torch_compile),
		Bi(N("sidebar.generation.cudaGraphs", "CUDA Graphs"), r.use_cuda_graphs),
		Bi(N("sidebar.generation.xVectorOnly", "X-Vector Only"), r.x_vector_only_mode)
	].filter(Boolean).forEach((e) => C.push(e));
	let w = [];
	[
		Bi(N("sidebar.generation.chunking", "Chunking"), r.enable_chunking),
		r.max_chars_per_chunk !== void 0 && r.max_chars_per_chunk !== null ? {
			label: N("sidebar.generation.maxCharsChunk", "Max Chars/Chunk"),
			value: r.max_chars_per_chunk
		} : null,
		r.chunk_combination_method ? {
			label: N("sidebar.generation.chunkMethod", "Chunk Method"),
			value: r.chunk_combination_method
		} : null,
		r.silence_between_chunks_ms !== void 0 && r.silence_between_chunks_ms !== null ? {
			label: N("sidebar.generation.silenceBetweenChunks", "Silence Between Chunks (ms)"),
			value: r.silence_between_chunks_ms
		} : null,
		Bi(N("sidebar.generation.audioCache", "Audio Cache"), r.enable_audio_cache),
		r.batch_size !== void 0 && r.batch_size !== null ? {
			label: N("sidebar.generation.batchSize", "Batch Size"),
			value: r.batch_size
		} : null
	].filter(Boolean).forEach((e) => w.push(e));
	let ee = [];
	r.lyrics_strength !== void 0 && r.lyrics_strength !== null && ee.push({
		label: N("sidebar.generation.lyricsStrength", "Lyrics Strength"),
		value: r.lyrics_strength
	});
	let T = [];
	Q(b) && !v.some((e) => e.label === "Denoise") && T.push({
		label: N("sidebar.generation.denoise", "Denoise"),
		value: b
	}), Q(r.clip_skip) && T.push({
		label: N("sidebar.generation.clipSkip", "Clip Skip"),
		value: r.clip_skip
	});
	let te = [], E = String(r.workflow_notes || r.notes || "").trim();
	E && te.push({
		label: N("sidebar.generation.workflowNotes", "Workflow Notes"),
		value: E,
		override: $(o, "workflow_notes", "notes")
	});
	let D = ta(r.custom_info), O = Qi(r, h, v, x), k = $i(r, x, D, l.workflowType), ne = Xi(r, x), re = Array.isArray(r.inputs) ? r.inputs.filter((e) => e && typeof e == "object" && e.filename).map((e, t) => ({
		id: `${e.filename}-${t}`,
		filename: String(e.filename || "").trim(),
		subfolder: String(e.subfolder || "").trim(),
		type: String(e.folder_type || "input").trim().toLowerCase(),
		root_id: String(e.root_id || e.rootId || "").trim(),
		kind: String(e.kind || e.media_kind || e.type || "").trim().toLowerCase(),
		filepath: Ai(e),
		role: String(e.role || "").trim(),
		roleLabel: String(e.role || "").trim().replace(/_/g, " "),
		isVideo: String(e.type || "").toLowerCase() === "video" || /\.(mp4|mov|webm)$/i.test(String(e.filename || "")),
		isAudio: String(e.type || "").toLowerCase() === "audio" || /\.(wav|mp3|flac|ogg|m4a|aac|opus)$/i.test(String(e.filename || "")),
		previewCandidates: ki(e)
	})) : [];
	return {
		...n,
		kind: "full",
		metadata: r,
		workflowType: l.workflowType,
		workflowLabel: l.workflowLabel,
		workflowBadge: l.workflowBadge,
		isTruncated: !!(e?.geninfo?._truncated || e?.metadata?._truncated || e?.prompt?._truncated),
		positivePrompt: d.length || a ? "" : String(u.positive || "").trim(),
		negativePrompt: d.length ? "" : String(u.negative || "").trim(),
		positivePromptOverride: $(o, "prompt", "positive", "positive_prompt"),
		negativePromptOverride: $(o, "negative_prompt", "negative", "negativePrompt"),
		promptTabs: d,
		showAlignment: !!e?.id && (!!String(u.positive || "").trim() || d.length > 0),
		isImageAsset: Ci(e),
		lyrics: String(r.lyrics || "").trim(),
		modelFields: f,
		modelGroups: h,
		branchCards: O,
		pipelineTabs: x,
		samplingFields: v,
		ttsFields: S,
		ttsEngineFields: C,
		ttsInstruction: String(r.instruct || "").trim(),
		ttsRuntimeFields: w,
		audioFields: ee,
		seed: ne,
		imageFields: T,
		inputFiles: re,
		isOverride: c,
		overrideLabel: c ? "Gen Info Override" : "",
		notesFields: te,
		customInfoBlocks: D,
		moduleBlocks: k,
		ltxDirector: i,
		ideogram: a
	};
}
export { V as A, Rn as C, gt as D, Dt as E, Be as M, Oe as N, H as O, Kn as S, Et as T, gr as _, ji as a, Gn as b, Y as c, xr as d, vr as f, _r as g, pr as h, Ti as i, ze as j, B as k, ii as l, br as m, Ei as n, Oi as o, yr as p, Di as r, bi as s, ia as t, J as u, nr as v, Ln as w, Un as x, fr as y };
