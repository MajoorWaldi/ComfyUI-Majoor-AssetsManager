import { $ as e, At as t, Bt as n, Ct as r, Dt as i, Et as a, Ft as o, Ht as s, I as c, Jt as l, K as u, Kt as d, Lt as f, Mt as p, N as m, Nt as h, O as g, Ot as _, Q as v, R as y, Rt as b, S as x, St as S, T as C, Tt as ee, Ut as te, X as w, Xt as T, Y as E, Yt as ne, Z as re, Zt as D, an as ie, at as ae, ct as oe, et as se, ht as ce, in as le, it as ue, jt as de, k as fe, kt as pe, lt as me, nt as he, p as ge, rt as _e, st as ve, tt as ye, ut as be, w as xe, wt as Se, xt as Ce, zt as we } from "./viewerRuntimeHosts-B0n5DSKG.js";
import { Ct as Te, K as Ee, N as De, T as Oe, c as ke, d as Ae, f as je, h as Me, j as Ne, l as Pe, m as O, o as k, p as Fe, pt as Ie, s as A, tt as Le, u as Re, x as ze, y as Be } from "./events-CwzwyUFJ.js";
import { F as Ve, K as He, P as Ue, Y as We, f as Ge, m as Ke, p as qe } from "./Viewer--Cuhs0TQ.js";
import { t as Je } from "./floatingViewerManager-CGdpmtv-.js";
import { A as Ye, B as j, C as M, D as Xe, E as N, G as Ze, H as P, J as Qe, L as $e, O as F, R as et, S as tt, T as I, W as nt, _ as rt, a as it, b as at, c as ot, ct as L, d as st, dt as R, f as ct, g as lt, h as ut, i as dt, j as ft, k as z, l as pt, lt as mt, m as ht, n as gt, nt as B, o as _t, p as vt, q as yt, r as bt, s as xt, t as St, tt as Ct, u as wt, ut as V, y as Tt } from "./mjr-primevue-n1rsQYJg.js";
import { t as Et } from "./mjr-vue-vendor-D2GeV7Qd.js";
import { t as Dt } from "./viewerOpenRequest-DeJyXX9z.js";
import { a as Ot, i as kt, n as At, o as jt, r as Mt, t as Nt } from "./geninfoParser-D91g5NYg.js";
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
}, Pt = (e, t, n) => {
	let r = typeof e == "string" ? e.trim() : String(e ?? "");
	return t.includes(r) ? r : n;
}, Ft = (e) => e === "__proto__" || e === "prototype" || e === "constructor", It = (e, t) => {
	let n = { ...e };
	return !t || typeof t != "object" || Object.keys(t).forEach((r) => {
		if (Ft(r)) return;
		let i = t[r];
		i && typeof i == "object" && !Array.isArray(i) ? n[r] = It(e[r] || {}, i) : i !== void 0 && (n[r] = i);
	}), n;
}, Lt = Object.freeze({
	small: 80,
	medium: 120,
	large: 180
}), Rt = Object.freeze([
	"small",
	"medium",
	"large"
]), zt = (e, t) => Math.max(60, Math.min(600, Math.round(U(e, t)))), Bt = (e = {}) => {
	let t = Number(e?.minSize);
	if (Number.isFinite(t)) return zt(t, A.GRID_MIN_SIZE);
	let n = Pt(String(e?.minSizePreset || "").toLowerCase(), Rt, "");
	return n ? Lt[n] : zt(e?.minSize, A.GRID_MIN_SIZE);
}, Vt = (e = {}) => zt(e?.minSize, A.FEED_GRID_MIN_SIZE), Ht = (e) => {
	let t = Math.round(U(e, A.GRID_MIN_SIZE));
	return t <= 100 ? "small" : t >= 150 ? "large" : "medium";
}, W = {
	debug: {
		safeCall: A.DEBUG_SAFE_CALL,
		safeListeners: A.DEBUG_SAFE_LISTENERS,
		viewer: A.DEBUG_VIEWER
	},
	grid: {
		pageSize: A.DEFAULT_PAGE_SIZE,
		minSize: A.GRID_MIN_SIZE,
		minSizePreset: Ht(A.GRID_MIN_SIZE),
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
		workflowGroupBy: A.WORKFLOW_GRID_GROUP_BY,
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
	scan: {
		fastMode: !0,
		jxlEnabled: !1
	},
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
		widthPx: 360,
		assetBadgeEnabled: A.SIDEBAR_ASSET_BADGE_ENABLED
	},
	probeBackend: { mode: "auto" },
	i18n: { followComfyLanguage: !0 },
	metadataFallback: {
		image: !0,
		media: !0
	},
	paths: {
		outputDirectory: "",
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
	search: { maxResults: A.SEARCH_DEFAULT_LIMIT },
	ai: {
		vectorSearchEnabled: !0,
		vectorCaptionOnIndex: !1,
		verboseAiLogs: !1
	},
	executionGrouping: { enabled: A.EXECUTION_GROUPING_ENABLED },
	workflowMinimap: {
		enabled: A.WORKFLOW_MINIMAP_ENABLED,
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
}, Ut = () => {
	try {
		let e = Me.get(ie);
		if (!e) return { ...W };
		let t = JSON.parse(e), n = t && typeof t == "object" && Number.isInteger(t.version) && t.data && typeof t.data == "object";
		if (!n && !(t && typeof t == "object" && !Array.isArray(t))) return { ...W };
		if (n && Number(t.version) > 1) return console.warn("[Majoor] settings schema version is newer than this build, using defaults"), { ...W };
		let r = n ? t.data : t, i = new Set(/* @__PURE__ */ "debug.grid.infiniteScroll.siblings.autoScan.scan.watcher.status.viewer.rtHydrate.observability.feed.sidebar.probeBackend.i18n.paths.db.ratingTagsSync.cache.search.ai.executionGrouping.workflowMinimap.ui.security.safety".split(".")), a = {};
		if (r && typeof r == "object") for (let [e, t] of Object.entries(r)) i.has(e) && (a[e] = t);
		let o = It(W, a);
		if (!n) try {
			G(o);
		} catch (e) {
			console.debug?.(e);
		}
		return o;
	} catch (e) {
		return console.warn("[Majoor] settings load failed, using defaults", e), { ...W };
	}
}, G = (e) => {
	try {
		let t = JSON.parse(JSON.stringify(e || {}));
		t?.security && typeof t.security == "object" && (t.security.apiToken = "");
		let n = {
			version: 1,
			data: t
		};
		if (!Me.set("mjrSettings", JSON.stringify(n))) throw Error("SettingsStore rejected the write");
	} catch (e) {
		console.warn("[Majoor] settings save failed", e);
		try {
			let e = Date.now();
			e - (Number(window?._mjrSettingsSaveFailAt || 0) || 0) > 3e4 && (window._mjrSettingsSaveFailAt = e, He(O("dialog.settingsSaveFailed", "Majoor: Failed to save settings (browser storage full or blocked).")));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			We("mjr-settings-save-failed", { error: String(e?.message || e || "") }, { warnPrefix: "[Majoor]" });
		} catch (e) {
			console.debug?.(e);
		}
	}
}, K = (e) => {
	let t = Number(A.MAX_PAGE_SIZE) || 2e3;
	k.DEFAULT_PAGE_SIZE = Math.max(50, Math.min(t, Number(e.grid?.pageSize) || A.DEFAULT_PAGE_SIZE)), k.AUTO_SCAN_ON_STARTUP = !!e.autoScan?.onStartup, k.EXECUTION_GROUPING_ENABLED = !!(e.executionGrouping?.enabled ?? A.EXECUTION_GROUPING_ENABLED), k.STATUS_POLL_INTERVAL = Math.max(1e3, Number(e.status?.pollInterval) || A.STATUS_POLL_INTERVAL), k.DEBUG_SAFE_CALL = !!e.debug?.safeCall, k.DEBUG_SAFE_LISTENERS = !!e.debug?.safeListeners, k.DEBUG_VIEWER = !!e.debug?.viewer, k.GRID_MIN_SIZE = Bt(e.grid), k.FEED_GRID_MIN_SIZE = Vt(e.feed), k.GRID_GAP = Math.max(0, Math.min(40, Math.round(U(e.grid?.gap, A.GRID_GAP)))), k.GRID_SHOW_BADGES_EXTENSION = !!(e.grid?.showExtBadge ?? A.GRID_SHOW_BADGES_EXTENSION), k.GRID_SHOW_BADGES_RATING = !!(e.grid?.showRatingBadge ?? A.GRID_SHOW_BADGES_RATING), k.GRID_SHOW_BADGES_TAGS = !!(e.grid?.showTagsBadge ?? A.GRID_SHOW_BADGES_TAGS), k.GRID_SHOW_DETAILS = !!(e.grid?.showDetails ?? A.GRID_SHOW_DETAILS), k.GRID_SHOW_DETAILS_FILENAME = !!(e.grid?.showFilename ?? A.GRID_SHOW_DETAILS_FILENAME), k.GRID_SHOW_DETAILS_DATE = !!(e.grid?.showDate ?? A.GRID_SHOW_DETAILS_DATE), k.GRID_SHOW_DETAILS_DIMENSIONS = !!(e.grid?.showDimensions ?? A.GRID_SHOW_DETAILS_DIMENSIONS), k.GRID_SHOW_DETAILS_GENTIME = !!(e.grid?.showGenTime ?? A.GRID_SHOW_DETAILS_GENTIME), k.GRID_SHOW_HOVER_INFO = !!(e.grid?.showHoverInfo ?? A.GRID_SHOW_HOVER_INFO), k.GRID_SHOW_WORKFLOW_DOT = !!(e.grid?.showWorkflowDot ?? A.GRID_SHOW_WORKFLOW_DOT);
	{
		let t = String(e.grid?.workflowGroupBy ?? A.WORKFLOW_GRID_GROUP_BY).toLowerCase();
		k.WORKFLOW_GRID_GROUP_BY = [
			"none",
			"task",
			"model",
			"category"
		].includes(t) ? t : A.WORKFLOW_GRID_GROUP_BY;
	}
	k.FEED_SHOW_INFO = !!(e.feed?.showInfo ?? A.FEED_SHOW_INFO), k.FEED_SHOW_FILENAME = !!(e.feed?.showFilename ?? A.FEED_SHOW_FILENAME), k.FEED_SHOW_DIMENSIONS = !!(e.feed?.showDimensions ?? A.FEED_SHOW_DIMENSIONS), k.FEED_SHOW_DATE = !!(e.feed?.showDate ?? A.FEED_SHOW_DATE), k.FEED_SHOW_GENTIME = !!(e.feed?.showGenTime ?? A.FEED_SHOW_GENTIME), k.FEED_SHOW_WORKFLOW_DOT = !!(e.feed?.showWorkflowDot ?? A.FEED_SHOW_WORKFLOW_DOT), k.FEED_SHOW_BADGES_EXTENSION = !!(e.feed?.showExtBadge ?? A.FEED_SHOW_BADGES_EXTENSION), k.FEED_SHOW_BADGES_RATING = !!(e.feed?.showRatingBadge ?? A.FEED_SHOW_BADGES_RATING), k.FEED_SHOW_BADGES_TAGS = !!(e.feed?.showTagsBadge ?? A.FEED_SHOW_BADGES_TAGS);
	{
		let t = e.grid?.videoAutoplayMode ?? A.GRID_VIDEO_AUTOPLAY_MODE;
		t ??= e.grid?.videoHoverAutoplay === !1 ? "off" : "hover", t === !0 && (t = "hover"), t === !1 && (t = "off"), t !== "hover" && t !== "always" && t !== "off" && (t = "hover"), k.GRID_VIDEO_AUTOPLAY_MODE = t;
	}
	let n = (e, t) => {
		let n = String(e || "").trim();
		return /^[0-9a-fA-F]{6}$/.test(n) && (n = `#${n}`), /^#[0-9a-fA-F]{3,8}$/.test(n) ? n : t;
	};
	k.BADGE_STAR_COLOR = n(e.grid?.starColor, A.BADGE_STAR_COLOR), k.BADGE_IMAGE_COLOR = n(e.grid?.badgeImageColor, A.BADGE_IMAGE_COLOR), k.BADGE_VIDEO_COLOR = n(e.grid?.badgeVideoColor, A.BADGE_VIDEO_COLOR), k.BADGE_AUDIO_COLOR = n(e.grid?.badgeAudioColor, A.BADGE_AUDIO_COLOR), k.BADGE_MODEL3D_COLOR = n(e.grid?.badgeModel3dColor, A.BADGE_MODEL3D_COLOR), k.BADGE_DUPLICATE_ALERT_COLOR = n(e.grid?.badgeDuplicateAlertColor, A.BADGE_DUPLICATE_ALERT_COLOR), k.UI_CARD_HOVER_COLOR = n(e.ui?.cardHoverColor, A.UI_CARD_HOVER_COLOR), k.UI_CARD_SELECTION_COLOR = n(e.ui?.cardSelectionColor, A.UI_CARD_SELECTION_COLOR), k.UI_RATING_COLOR = n(e.ui?.ratingColor, A.UI_RATING_COLOR), k.UI_TAG_COLOR = n(e.ui?.tagColor, A.UI_TAG_COLOR);
	try {
		let e = Array.from(document.querySelectorAll(".mjr-assets-manager"));
		for (let t of e) t.style.setProperty("--mjr-star-active", k.BADGE_STAR_COLOR), t.style.setProperty("--mjr-badge-image", k.BADGE_IMAGE_COLOR), t.style.setProperty("--mjr-badge-video", k.BADGE_VIDEO_COLOR), t.style.setProperty("--mjr-badge-audio", k.BADGE_AUDIO_COLOR), t.style.setProperty("--mjr-badge-model3d", k.BADGE_MODEL3D_COLOR), t.style.setProperty("--mjr-badge-duplicate-alert", k.BADGE_DUPLICATE_ALERT_COLOR), t.style.setProperty("--mjr-card-hover-color", k.UI_CARD_HOVER_COLOR), t.style.setProperty("--mjr-card-selection-color", k.UI_CARD_SELECTION_COLOR), t.style.setProperty("--mjr-rating-color", k.UI_RATING_COLOR), t.style.setProperty("--mjr-tag-color", k.UI_TAG_COLOR);
	} catch (e) {
		console.debug?.(e);
	}
	k.INFINITE_SCROLL_ENABLED = !!e.infiniteScroll?.enabled, k.INFINITE_SCROLL_ROOT_MARGIN = String(e.infiniteScroll?.rootMargin || A.INFINITE_SCROLL_ROOT_MARGIN), k.INFINITE_SCROLL_THRESHOLD = Math.max(0, Math.min(1, U(e.infiniteScroll?.threshold, A.INFINITE_SCROLL_THRESHOLD))), k.BOTTOM_GAP_PX = Math.max(0, Math.min(5e3, Math.round(U(e.infiniteScroll?.bottomGapPx, A.BOTTOM_GAP_PX)))), k.VIEWER_ALLOW_PAN_AT_ZOOM_1 = !!e.viewer?.allowPanAtZoom1, k.VIEWER_DISABLE_WEBGL_VIDEO = !!e.viewer?.disableWebGL, k.VIEWER_PAUSE_DURING_EXECUTION = !!(e.viewer?.pauseDuringExecution ?? A.VIEWER_PAUSE_DURING_EXECUTION), k.FLOATING_VIEWER_PAUSE_DURING_EXECUTION = !!(e.viewer?.floatingPauseDuringExecution ?? A.FLOATING_VIEWER_PAUSE_DURING_EXECUTION), k.MFV_LIVE_DEFAULT = e.viewer?.mfvLiveDefault ?? A.MFV_LIVE_DEFAULT, k.MFV_PREVIEW_DEFAULT = e.viewer?.mfvPreviewDefault ?? A.MFV_PREVIEW_DEFAULT, k.MFV_LIVE_AUTO_OPEN = !1, k.MFV_PREVIEW_AUTO_OPEN = !1, k.MFV_NODE_STREAM_AUTO_OPEN = !1;
	{
		let t = String(e.viewer?.mfvPreviewMethod || A.MFV_PREVIEW_METHOD).toLowerCase();
		k.MFV_PREVIEW_METHOD = [
			"default",
			"auto",
			"latent2rgb",
			"taesd",
			"none"
		].includes(t) ? t : A.MFV_PREVIEW_METHOD;
	}
	{
		let t = String(e.viewer?.mfvSidebarPosition || "right").toLowerCase();
		k.MFV_SIDEBAR_POSITION = [
			"left",
			"right",
			"bottom"
		].includes(t) ? t : "right";
	}
	k.VIEWER_VIDEO_GRADE_THROTTLE_FPS = Math.max(1, Math.min(60, Math.round(U(e.viewer?.videoGradeThrottleFps, A.VIEWER_VIDEO_GRADE_THROTTLE_FPS)))), k.VIEWER_SCOPES_FPS = Math.max(1, Math.min(60, Math.round(U(e.viewer?.scopesFps, A.VIEWER_SCOPES_FPS)))), k.VIEWER_META_TTL_MS = Math.max(1e3, Math.min(10 * 6e4, Math.round(U(e.viewer?.metaTtlMs, A.VIEWER_META_TTL_MS)))), k.VIEWER_META_MAX_ENTRIES = Math.max(50, Math.min(5e3, Math.round(U(e.viewer?.metaMaxEntries, A.VIEWER_META_MAX_ENTRIES)))), k.WORKFLOW_MINIMAP_ENABLED = !!(e.workflowMinimap?.enabled ?? A.WORKFLOW_MINIMAP_ENABLED), k.RT_HYDRATE_CONCURRENCY = Math.max(1, Math.min(16, Math.round(U(e.rtHydrate?.concurrency, A.RT_HYDRATE_CONCURRENCY)))), k.RT_HYDRATE_QUEUE_MAX = Math.max(10, Math.min(5e3, Math.round(U(e.rtHydrate?.queueMax, A.RT_HYDRATE_QUEUE_MAX)))), k.RT_HYDRATE_SEEN_MAX = Math.max(1e3, Math.min(2e5, Math.round(U(e.rtHydrate?.seenMax, A.RT_HYDRATE_SEEN_MAX)))), k.RT_HYDRATE_PRUNE_BUDGET = Math.max(10, Math.min(1e4, Math.round(U(e.rtHydrate?.pruneBudget, A.RT_HYDRATE_PRUNE_BUDGET)))), k.RT_HYDRATE_SEEN_TTL_MS = Math.max(5e3, Math.min(360 * 6e4, Math.round(U(e.rtHydrate?.seenTtlMs, A.RT_HYDRATE_SEEN_TTL_MS)))), k.DELETE_CONFIRMATION = !!e.safety?.confirmDeletion, k.DEBUG_VERBOSE_ERRORS = !!e.observability?.verboseErrors, k.WATCHER_MAX_PENDING = Math.max(10, Math.min(5e3, Math.round(U(e.watcher?.maxPending, 500)))), k.WATCHER_MIN_SIZE = Math.max(0, Math.min(1e6, Math.round(U(e.watcher?.minSize, 100)))), k.WATCHER_MAX_SIZE = Math.max(1e5, Math.min(17179869184, Math.round(U(e.watcher?.maxSize, 4294967296)))), k.DB_TIMEOUT_MS = Math.max(1e3, Math.min(3e4, Math.round(U(e.db?.timeoutMs, 5e3)))), k.DB_MAX_CONNECTIONS = Math.max(1, Math.min(100, Math.round(U(e.db?.maxConnections, 10)))), k.DB_QUERY_TIMEOUT_MS = Math.max(500, Math.min(1e4, Math.round(U(e.db?.queryTimeoutMs, 1e3)))), k.SIDEBAR_ASSET_BADGE_ENABLED = !!(e.sidebar?.assetBadgeEnabled ?? A.SIDEBAR_ASSET_BADGE_ENABLED), k.SEARCH_REQUEST_LIMIT = Math.max(10, Math.min(A.MAX_PAGE_SIZE || 2e3, Math.round(U(e.search?.maxResults, A.SEARCH_DEFAULT_LIMIT))));
};
async function Wt() {
	try {
		let e = await ue();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = Ut();
		if (n.security = n.security || {}, n.security.safeMode = H(t.safe_mode, n.security.safeMode), n.security.allowWrite = H(t.allow_write, n.security.allowWrite), n.security.requireAuth = H(t.require_auth, n.security.requireAuth), n.security.allowRemoteWrite = H(t.allow_remote_write, n.security.allowRemoteWrite), n.security.allowInsecureTokenTransport = H(t.allow_insecure_token_transport, n.security.allowInsecureTokenTransport), n.security.allowDelete = H(t.allow_delete, n.security.allowDelete), n.security.allowRename = H(t.allow_rename, n.security.allowRename), n.security.allowOpenInFolder = H(t.allow_open_in_folder, n.security.allowOpenInFolder), n.security.allowResetIndex = H(t.allow_reset_index, n.security.allowResetIndex), n.security.tokenConfigured = H(t.token_configured, n.security.tokenConfigured), n.security.tokenHint = String(t.token_hint || "").trim(), !String(n.security.apiToken || "").trim()) try {
			let e = await y(), t = String(e?.data?.token || "").trim();
			e?.ok && t && ne(t);
		} catch (e) {
			console.debug?.(e);
		}
		G(n), K(n), We("mjr-settings-changed", { key: "security" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend security settings", e);
	}
}
async function Gt() {
	try {
		let e = await ve();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = Ut();
		n.ai = n.ai || {}, n.ai.vectorSearchEnabled = H(t.enabled, n.ai.vectorSearchEnabled ?? !0), n.ai.vectorCaptionOnIndex = H(t.caption_on_index ?? t.captionOnIndex, n.ai.vectorCaptionOnIndex ?? !1), n.ai.vectorIndexOnScan = H(t.index_on_scan ?? t.indexOnScan, n.ai.vectorIndexOnScan ?? !1), n.ai.vectorUnloadAfterUse = H(t.unload_after_use ?? t.unloadAfterUse, n.ai.vectorUnloadAfterUse ?? !1), n.ai.vectorConcurrency = Math.max(1, Math.min(16, Math.floor(Number(t.concurrency ?? n.ai.vectorConcurrency ?? 1) || 1))), G(n), K(n), We("mjr-settings-changed", { key: "ai.vectorSearch" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend vector search settings", e);
	}
}
async function Kt() {
	try {
		let e = await E();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = Ut();
		n.executionGrouping = n.executionGrouping || {}, n.executionGrouping.enabled = H(t.enabled, n.executionGrouping.enabled ?? A.EXECUTION_GROUPING_ENABLED), G(n), K(n), We("mjr-settings-changed", { key: "executionGrouping.enabled" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend execution grouping settings", e);
	}
}
//#endregion
//#region ui/app/settings/settingsRuntime.ts
var qt = "mjr-runtime-status-dashboard", Jt = 3e4;
function Yt() {
	try {
		let e = Ut(), t = String(e?.observability?.runtimeDashboardMode || W.observability.runtimeDashboardMode);
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
		document.getElementById(qt)?.remove?.();
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
function Qt(e, t) {
	let n = t === "auth" ? "__mjrAuthLine" : "__mjrMetricsLine";
	if (e?.[n]) return e[n];
	let r = document.createElement("div");
	return r.style.whiteSpace = "nowrap", r.style.lineHeight = "1.35", t === "auth" && (r.style.marginTop = "4px", r.style.fontWeight = "600"), e.appendChild(r), e[n] = r, r;
}
function $t(e) {
	let t = String(e?.token_hint || "").trim(), n = l(), r = t || (n ? "(session)" : ""), i = e?.allow_write !== !1, a = e?.require_auth === !0, o = e?.token_configured === !0;
	return i ? n ? {
		text: O("runtime.writeAuthActive", "Write auth: active {tokenHint}", { tokenHint: r || "(session)" }),
		color: "#7ee0a0"
	} : a && o ? {
		text: O("runtime.writeAuthMissing", "Write auth: missing in this browser {tokenHint}", { tokenHint: r || "(server token configured)" }),
		color: "#f1c36d"
	} : a ? {
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
function en() {
	try {
		if (Yt() === "hidden" || window.__MJR_RUNTIME_STATUS_HIDDEN__) return Xt(), null;
		let e = document.querySelector(".mjr-assets-manager.mjr-am-container"), t = document.getElementById(qt);
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
		let n = document.getElementById(qt);
		return n ? n.parentElement !== e && e.appendChild(n) : (n = document.createElement("div"), n.id = qt, n.style.position = "absolute", n.style.bottom = "10px", n.style.right = "10px", n.style.zIndex = "9999", n.style.padding = "6px 10px", n.style.borderRadius = "10px", n.style.border = "1px solid rgba(255,255,255,0.16)", n.style.background = "rgba(0,0,0,0.45)", n.style.backdropFilter = "blur(4px)", n.style.color = "var(--content-fg, #fff)", n.style.fontSize = "11px", n.style.pointerEvents = "none", n.style.display = "flex", n.style.flexDirection = "column", e.appendChild(n)), n;
	} catch {
		return null;
	}
}
async function tn() {
	let e = en();
	if (!e) return !1;
	let t = Qt(e, "metrics"), n = Qt(e, "auth");
	try {
		let [r, i] = await Promise.all([_e(), ue()]), a = O("runtime.unavailable", "Runtime: unavailable");
		if (!r?.ok || !r?.data) t.textContent = a;
		else {
			let e = r.data.db || {}, n = r.data.index || {}, i = r.data.watcher || {}, o = Number(e.active_connections || 0), s = Number(n.enrichment_queue_length || 0), c = Number(i.pending_files || 0);
			t.textContent = O("runtime.metricsLine", "DB active: {active} | Enrich Q: {enrichQ} | Watcher pending: {pending}", {
				active: o,
				enrichQ: s,
				pending: c
			}), a = O("runtime.metricsTitle", "Runtime Metrics\nDB active connections: {active}\nEnrichment queue: {enrichQ}\nWatcher pending files: {pending}", {
				active: o,
				enrichQ: s,
				pending: c
			});
		}
		let o = $t(i?.data?.prefs || null);
		return n.textContent = o.text, n.style.color = o.color, e.title = `${a}\n${o.text}`, !0;
	} catch {
		return t.textContent = O("runtime.unavailable", "Runtime: unavailable"), n.textContent = O("runtime.writeAuthUnknown", "Write auth: unknown"), n.style.color = "#c8ced8", e.title = `${O("runtime.unavailable", "Runtime: unavailable")}\n${n.textContent}`, !0;
	}
}
function nn() {
	try {
		let e = Yt();
		if (e === "hidden") {
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = !0, Zt(), Xt();
			return;
		}
		window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__ || (window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__ = (e) => {
			if (e?.detail?.key !== "observability.runtimeDashboardMode") return;
			let t = Yt();
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = t === "hidden", Zt(), Xt(), t !== "hidden" && nn();
		}, window.addEventListener?.("mjr-settings-changed", window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__)), window.__MJR_RUNTIME_STATUS_HIDDEN__ = !1, Zt(), e === "autoHide30" && (window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ = setTimeout(() => {
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = !0, Xt();
		}, Jt)), tn().catch(() => {}), window.__MJR_RUNTIME_STATUS_INFLIGHT__ ?? (window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !1), window.__MJR_RUNTIME_STATUS_MISS_COUNT__ ?? (window.__MJR_RUNTIME_STATUS_MISS_COUNT__ = 0), window.__MJR_RUNTIME_STATUS_INTERVAL__ || (window.__MJR_RUNTIME_STATUS_INTERVAL__ = setInterval(() => {
			window.__MJR_RUNTIME_STATUS_INFLIGHT__ || (window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !0, tn().then((e) => {
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
var rn = 300;
function an(e, t = rn) {
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
var q = "Majoor", on = "Majoor Assets Manager";
function sn(e, t, n) {
	let r = (e, t) => [
		on,
		e,
		t
	], i = (e) => [
		on,
		O("cat.cards", "Cards"),
		e
	], a = (e) => [
		on,
		O("cat.badges", "Badges"),
		e
	], o = (e) => [
		on,
		O("cat.badges", "Badges"),
		e
	], s = (e, t) => {
		let n = String(e || "").trim();
		return /^[0-9a-fA-F]{6}$/.test(n) && (n = `#${n}`), /^#[0-9a-fA-F]{6}$/.test(n) ? n.toUpperCase() : t;
	};
	t.grid?.minSizePreset || (t.grid = t.grid || {}, t.grid.minSizePreset = Ht(t.grid.minSize), G(t)), e({
		id: `${q}.Cards.ThumbSize`,
		category: i(O("setting.grid.cardSize.group", "Card size")),
		name: O("setting.grid.cardSize.name", "Majoor: Card Size"),
		tooltip: O("setting.grid.cardSize.desc", "Choose the card size preset used by the grid layout."),
		type: "combo",
		defaultValue: (() => {
			let e = Pt(String(t.grid?.minSizePreset || "").toLowerCase(), Rt, Ht(t.grid?.minSize)), n = {
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
			r === i || r === "small" || r === "petit" ? s = "small" : r === o || r === "large" || r === "grand" ? s = "large" : (r === a || r === "medium" || r === "moyen") && (s = "medium"), t.grid.minSizePreset = s, t.grid.minSize = Lt[s], G(t), K(t), n("grid.minSizePreset");
		}
	}), e({
		id: `${q}.Cards.CustomThumbSize`,
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
			t.grid.minSize = r, t.grid.minSizePreset = Ht(r), G(t), K(t), n("grid.minSize");
		}
	}), e({
		id: `${q}.Grid.ShowDetails`,
		category: i("Show card details"),
		name: "Show metadata panel",
		tooltip: "Show the bottom details panel on asset cards (filename, date, etc.)",
		type: "boolean",
		defaultValue: !!t.grid?.showDetails,
		onChange: (e) => {
			t.grid.showDetails = !!e, G(t), K(t), n("grid.showDetails");
		}
	}), e({
		id: `${q}.Grid.ShowFilename`,
		category: i("Show filename"),
		name: "Show filename",
		tooltip: "Display filename in details panel",
		type: "boolean",
		defaultValue: !!t.grid?.showFilename,
		onChange: (e) => {
			t.grid.showFilename = !!e, G(t), K(t), n("grid.showFilename");
		}
	}), e({
		id: `${q}.Grid.ShowDate`,
		category: i("Show date/time"),
		name: "Show date/time",
		tooltip: "Display date and time in details panel",
		type: "boolean",
		defaultValue: !!t.grid?.showDate,
		onChange: (e) => {
			t.grid.showDate = !!e, G(t), K(t), n("grid.showDate");
		}
	}), e({
		id: `${q}.Grid.ShowDimensions`,
		category: i("Show dimensions"),
		name: "Show dimensions",
		tooltip: "Display resolution (WxH) in details panel",
		type: "boolean",
		defaultValue: !!t.grid?.showDimensions,
		onChange: (e) => {
			t.grid.showDimensions = !!e, G(t), K(t), n("grid.showDimensions");
		}
	}), e({
		id: `${q}.Grid.ShowGenTime`,
		category: i("Show generation time"),
		name: "Show generation time",
		tooltip: "Display seconds taken to generate the asset (if available)",
		type: "boolean",
		defaultValue: !!(t.grid?.showGenTime ?? A.GRID_SHOW_DETAILS_GENTIME),
		onChange: (e) => {
			t.grid.showGenTime = !!e, G(t), K(t), n("grid.showGenTime");
		}
	}), e({
		id: `${q}.Grid.ShowHoverInfo`,
		category: i("Show prompt on hover"),
		name: "Show prompt on hover",
		tooltip: "Show positive prompt and generation time as a tooltip overlay when hovering over a card thumbnail. Does not block video play-on-hover.",
		type: "boolean",
		defaultValue: !!(t.grid?.showHoverInfo ?? A.GRID_SHOW_HOVER_INFO),
		onChange: (e) => {
			t.grid.showHoverInfo = !!e, G(t), K(t), n("grid.showHoverInfo");
		}
	}), e({
		id: `${q}.Grid.ShowWorkflowDot`,
		category: i("Show workflow dot"),
		name: "Show workflow indicator",
		tooltip: "Display the green dot indicating workflow metadata availability (bottom right of card)",
		type: "boolean",
		defaultValue: !!t.grid?.showWorkflowDot,
		onChange: (e) => {
			t.grid.showWorkflowDot = !!e, G(t), K(t), n("grid.showWorkflowDot");
		}
	}), e({
		id: `${q}.Grid.ShowExtBadge`,
		category: a("Show format badges"),
		name: "Show format badges",
		tooltip: "Display format badges (e.g. JPG, MP4) on thumbnails",
		type: "boolean",
		defaultValue: !!t.grid?.showExtBadge,
		onChange: (e) => {
			t.grid.showExtBadge = !!e, G(t), K(t), n("grid.showExtBadge");
		}
	}), e({
		id: `${q}.Grid.ShowRatingBadge`,
		category: a("Show rating badges"),
		name: "Show ratings",
		tooltip: "Display star ratings on thumbnails",
		type: "boolean",
		defaultValue: !!t.grid?.showRatingBadge,
		onChange: (e) => {
			t.grid.showRatingBadge = !!e, G(t), K(t), n("grid.showRatingBadge");
		}
	}), e({
		id: `${q}.Grid.ShowTagsBadge`,
		category: a("Show tags badges"),
		name: "Show tags",
		tooltip: "Display a small indicator if an asset has tags",
		type: "boolean",
		defaultValue: !!t.grid?.showTagsBadge,
		onChange: (e) => {
			t.grid.showTagsBadge = !!e, G(t), K(t), n("grid.showTagsBadge");
		}
	}), e({
		id: `${q}.Badges.StarColor`,
		category: o(O("setting.starColor", "Star color")),
		name: O("setting.starColor", "Majoor: Star color"),
		tooltip: O("setting.starColor.tooltip", "Color of rating stars on thumbnails (hex, e.g. #FFD45A)"),
		type: "color",
		defaultValue: s(t.grid?.starColor, A.BADGE_STAR_COLOR),
		onChange: (e) => {
			t.grid.starColor = s(e, A.BADGE_STAR_COLOR), G(t), K(t), n("grid.starColor");
		}
	}), e({
		id: `${q}.Badges.ImageColor`,
		category: o(O("setting.badgeImageColor", "Image badge color")),
		name: O("setting.badgeImageColor", "Majoor: Image badge color"),
		tooltip: O("setting.badgeImageColor.tooltip", "Color for image badges: PNG, JPG, WEBP, GIF, BMP, TIF (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeImageColor, A.BADGE_IMAGE_COLOR),
		onChange: (e) => {
			t.grid.badgeImageColor = s(e, A.BADGE_IMAGE_COLOR), G(t), K(t), n("grid.badgeImageColor");
		}
	}), e({
		id: `${q}.Badges.VideoColor`,
		category: o(O("setting.badgeVideoColor", "Video badge color")),
		name: O("setting.badgeVideoColor", "Majoor: Video badge color"),
		tooltip: O("setting.badgeVideoColor.tooltip", "Color for video badges: MP4, WEBM, MOV, AVI, MKV (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeVideoColor, A.BADGE_VIDEO_COLOR),
		onChange: (e) => {
			t.grid.badgeVideoColor = s(e, A.BADGE_VIDEO_COLOR), G(t), K(t), n("grid.badgeVideoColor");
		}
	}), e({
		id: `${q}.Badges.AudioColor`,
		category: o(O("setting.badgeAudioColor", "Audio badge color")),
		name: O("setting.badgeAudioColor", "Majoor: Audio badge color"),
		tooltip: O("setting.badgeAudioColor.tooltip", "Color for audio badges: MP3, WAV, OGG, FLAC (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeAudioColor, A.BADGE_AUDIO_COLOR),
		onChange: (e) => {
			t.grid.badgeAudioColor = s(e, A.BADGE_AUDIO_COLOR), G(t), K(t), n("grid.badgeAudioColor");
		}
	}), e({
		id: `${q}.Badges.Model3dColor`,
		category: o(O("setting.badgeModel3dColor", "3D model badge color")),
		name: O("setting.badgeModel3dColor", "Majoor: 3D model badge color"),
		tooltip: O("setting.badgeModel3dColor.tooltip", "Color for 3D model badges: OBJ, FBX, GLB, GLTF (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeModel3dColor, A.BADGE_MODEL3D_COLOR),
		onChange: (e) => {
			t.grid.badgeModel3dColor = s(e, A.BADGE_MODEL3D_COLOR), G(t), K(t), n("grid.badgeModel3dColor");
		}
	}), e({
		id: `${q}.Badges.DuplicateAlertColor`,
		category: o(O("setting.badgeDuplicateAlertColor", "Duplicate alert badge color")),
		name: O("setting.badgeDuplicateAlertColor", "Majoor: Duplicate alert badge color"),
		tooltip: O("setting.badgeDuplicateAlertColor.tooltip", "Color for duplicate extension badges (PNG+, JPG+, etc)."),
		type: "color",
		defaultValue: s(t.grid?.badgeDuplicateAlertColor, A.BADGE_DUPLICATE_ALERT_COLOR),
		onChange: (e) => {
			t.grid.badgeDuplicateAlertColor = s(e, A.BADGE_DUPLICATE_ALERT_COLOR), G(t), K(t), n("grid.badgeDuplicateAlertColor");
		}
	}), e({
		id: `${q}.Grid.PageSize`,
		category: r(O("cat.grid"), O("setting.grid.pagesize.name").replace("Majoor: ", "")),
		name: O("setting.grid.pagesize.name"),
		tooltip: O("setting.grid.pagesize.desc"),
		type: "number",
		defaultValue: t.grid.pageSize,
		attrs: {
			min: 50,
			max: Number(k.MAX_PAGE_SIZE) || 2e3,
			step: 50
		},
		onChange: (e) => {
			let r = Number(k.MAX_PAGE_SIZE) || 2e3;
			t.grid.pageSize = Math.max(50, Math.min(r, Number(e) || A.DEFAULT_PAGE_SIZE)), G(t), K(t), n("grid.pageSize");
		}
	}), e({
		id: `${q}.Grid.WorkflowGroupBy`,
		category: r(O("cat.grid"), "Workflow grouping"),
		name: "Workflow grid grouping",
		tooltip: "In Workflow scope, insert titled separators and group cards by Task, Model, or Category.",
		type: "combo",
		defaultValue: (() => {
			let e = String(t.grid?.workflowGroupBy || A.WORKFLOW_GRID_GROUP_BY).trim().toLowerCase(), n = {
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
			t.grid = t.grid || {}, t.grid.workflowGroupBy = r, G(t), K(t), n("grid.workflowGroupBy");
		}
	}), e({
		id: `${q}.InfiniteScroll.Enabled`,
		category: r(O("cat.grid"), O("setting.nav.infinite.name").replace("Majoor: ", "")),
		name: O("setting.nav.infinite.name"),
		tooltip: O("setting.nav.infinite.desc"),
		type: "boolean",
		defaultValue: !!t.infiniteScroll?.enabled,
		onChange: (e) => {
			t.infiniteScroll = t.infiniteScroll || {}, t.infiniteScroll.enabled = !!e, G(t), K(t), n("infiniteScroll.enabled");
		}
	}), e({
		id: `${q}.Sidebar.Position`,
		category: r(O("cat.grid"), O("setting.sidebar.pos.name").replace("Majoor: ", "")),
		name: O("setting.sidebar.pos.name"),
		tooltip: O("setting.sidebar.pos.desc"),
		type: "combo",
		defaultValue: t.sidebar?.position || "right",
		options: ["left", "right"],
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.position = e === "left" ? "left" : "right", G(t), n("sidebar.position");
		}
	}), e({
		id: `${q}.Sidebar.ShowPreviewThumb`,
		category: r(O("cat.grid"), "Sidebar preview"),
		name: "Show sidebar preview thumb",
		tooltip: "Show/hide the large media preview at the top of the sidebar metadata panel.",
		type: "boolean",
		defaultValue: !!(t.sidebar?.showPreviewThumb ?? !0),
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.showPreviewThumb = !!e, G(t), n("sidebar.showPreviewThumb");
		}
	}), e({
		id: `${q}.Sidebar.AssetBadgeEnabled`,
		category: r(O("cat.grid"), "Sidebar asset notification badge"),
		name: "Show new asset badge on sidebar icon",
		tooltip: "Display a small counter on the Majoor sidebar icon only when a new asset is indexed by Assets Manager.",
		type: "boolean",
		defaultValue: !!(t.sidebar?.assetBadgeEnabled ?? A.SIDEBAR_ASSET_BADGE_ENABLED),
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.assetBadgeEnabled = !!e, G(t), K(t), n("sidebar.assetBadgeEnabled");
		}
	}), e({
		id: `${q}.Sidebar.WidthPx`,
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
			t.sidebar = t.sidebar || {}, t.sidebar.widthPx = Math.max(240, Math.min(640, Math.round(Number(e) || 360))), G(t), n("sidebar.widthPx");
		}
	}), e({
		id: `${q}.General.HideSiblings`,
		category: r(O("cat.grid"), O("setting.siblings.hide.name").replace("Majoor: ", "")),
		name: O("setting.siblings.hide.name"),
		tooltip: O("setting.siblings.hide.desc"),
		type: "boolean",
		defaultValue: !!t.siblings?.hidePngSiblings,
		onChange: (e) => {
			t.siblings = t.siblings || {}, t.siblings.hidePngSiblings = !!e, G(t), n("siblings.hidePngSiblings");
		}
	}), e({
		id: `${q}.Grid.VideoAutoplayMode`,
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
			t.grid = t.grid || {}, t.grid.videoAutoplayMode = r, delete t.grid.videoHoverAutoplay, G(t), K(t), n("grid.videoAutoplayMode");
		}
	}), e({
		id: `${q}.Cards.HoverColor`,
		category: i("Hover color"),
		name: "Majoor: Card hover color",
		tooltip: "Background tint used when hovering a card (hex, e.g. #3D3D3D).",
		type: "color",
		defaultValue: s(t.ui?.cardHoverColor, A.UI_CARD_HOVER_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.cardHoverColor = s(e, A.UI_CARD_HOVER_COLOR), G(t), K(t), n("ui.cardHoverColor");
		}
	}), e({
		id: `${q}.Cards.SelectionColor`,
		category: i("Selection color"),
		name: "Majoor: Card selection color",
		tooltip: "Outline/accent color used for selected cards (hex, e.g. #4A90E2).",
		type: "color",
		defaultValue: s(t.ui?.cardSelectionColor, A.UI_CARD_SELECTION_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.cardSelectionColor = s(e, A.UI_CARD_SELECTION_COLOR), G(t), K(t), n("ui.cardSelectionColor");
		}
	}), e({
		id: `${q}.Badges.RatingColor`,
		category: a("Rating color"),
		name: "Majoor: Rating badge color",
		tooltip: "Color used for rating badge text/accent (hex, e.g. #FF9500).",
		type: "color",
		defaultValue: s(t.ui?.ratingColor, A.UI_RATING_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.ratingColor = s(e, A.UI_RATING_COLOR), G(t), K(t), n("ui.ratingColor");
		}
	}), e({
		id: `${q}.Badges.TagColor`,
		category: a("Tag color"),
		name: "Majoor: Tags badge color",
		tooltip: "Color used for tags badge text/accent (hex, e.g. #4A90E2).",
		type: "color",
		defaultValue: s(t.ui?.tagColor, A.UI_TAG_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.tagColor = s(e, A.UI_TAG_COLOR), G(t), K(t), n("ui.tagColor");
		}
	});
}
//#endregion
//#region ui/app/settings/settingsViewer.ts
var cn = "Majoor", ln = "Majoor Assets Manager";
function un(t, n, r) {
	let i = (e, t) => [
		ln,
		e,
		t
	], o = (e) => i(O("cat.viewer", "Viewer"), e), s = (e) => i(O("cat.floatingViewer", "Floating Viewer"), e);
	t({
		id: `${cn}.Viewer.AllowPanAtZoom1`,
		category: o(O("setting.viewer.pan.name").replace("Majoor: ", "")),
		name: O("setting.viewer.pan.name"),
		tooltip: O("setting.viewer.pan.desc"),
		type: "boolean",
		defaultValue: !!n.viewer?.allowPanAtZoom1,
		onChange: (e) => {
			n.viewer = n.viewer || {}, n.viewer.allowPanAtZoom1 = !!e, G(n), K(n), r("viewer.allowPanAtZoom1");
		}
	}), t({
		id: `${cn}.Viewer.DisableWebGL`,
		category: o("Disable WebGL Video"),
		name: "Disable WebGL Video",
		tooltip: "Use CPU rendering (Canvas 2D) for video playback. Fixes 'black screen' issues on incompatible hardware/browsers.",
		type: "boolean",
		defaultValue: !!n.viewer?.disableWebGL,
		onChange: (e) => {
			n.viewer = n.viewer || {}, n.viewer.disableWebGL = !!e, G(n), K(n), r("viewer.disableWebGL");
		}
	}), t({
		id: `${cn}.Viewer.PauseDuringExecution`,
		category: o(O("setting.viewer.pauseExecution.name").replace("Majoor: ", "")),
		name: O("setting.viewer.pauseExecution.name"),
		tooltip: O("setting.viewer.pauseExecution.desc"),
		type: "boolean",
		defaultValue: !!n.viewer?.pauseDuringExecution,
		onChange: (e) => {
			n.viewer = n.viewer || {}, n.viewer.pauseDuringExecution = !!e, G(n), K(n), r("viewer.pauseDuringExecution");
		}
	}), t({
		id: `${cn}.Viewer.FloatingPauseDuringExecution`,
		category: s(O("setting.viewer.floatingPauseExecution.name").replace("Majoor: ", "")),
		name: O("setting.viewer.floatingPauseExecution.name"),
		tooltip: O("setting.viewer.floatingPauseExecution.desc"),
		type: "boolean",
		defaultValue: !!n.viewer?.floatingPauseDuringExecution,
		onChange: (e) => {
			n.viewer = n.viewer || {}, n.viewer.floatingPauseDuringExecution = !!e, G(n), K(n), r("viewer.floatingPauseDuringExecution");
		}
	}), t({
		id: `${cn}.Viewer.MfvLiveDefault`,
		category: s(O("setting.viewer.mfvLiveDefault.name").replace("Majoor: ", "")),
		name: O("setting.viewer.mfvLiveDefault.name"),
		tooltip: O("setting.viewer.mfvLiveDefault.desc"),
		type: "boolean",
		defaultValue: !!(n.viewer?.mfvLiveDefault ?? A.MFV_LIVE_DEFAULT),
		onChange: (e) => {
			n.viewer = n.viewer || {}, n.viewer.mfvLiveDefault = !!e, G(n), K(n), r("viewer.mfvLiveDefault");
		}
	}), t({
		id: `${cn}.Viewer.MfvPreviewDefault`,
		category: s(O("setting.viewer.mfvPreviewDefault.name").replace("Majoor: ", "")),
		name: O("setting.viewer.mfvPreviewDefault.name"),
		tooltip: O("setting.viewer.mfvPreviewDefault.desc"),
		type: "boolean",
		defaultValue: !!(n.viewer?.mfvPreviewDefault ?? A.MFV_PREVIEW_DEFAULT),
		onChange: (e) => {
			n.viewer = n.viewer || {}, n.viewer.mfvPreviewDefault = !!e, G(n), K(n), r("viewer.mfvPreviewDefault");
		}
	}), t({
		id: `${cn}.Viewer.MfvSidebarPosition`,
		category: s("Node Parameters sidebar position"),
		name: "Node Parameters sidebar position",
		tooltip: "Position of the Node Parameters sidebar in the Floating Viewer (right, left, or bottom).",
		type: "combo",
		defaultValue: n.viewer?.mfvSidebarPosition || "right",
		options: [
			"right",
			"left",
			"bottom"
		],
		onChange: (e) => {
			let t = [
				"left",
				"right",
				"bottom"
			].includes(e) ? e : "right";
			n.viewer = n.viewer || {}, n.viewer.mfvSidebarPosition = t, G(n), K(n), r("viewer.mfvSidebarPosition");
		}
	}), t({
		id: `${cn}.Viewer.MfvPreviewMethod`,
		category: s(O("setting.viewer.mfvPreviewMethod.name").replace("Majoor: ", "")),
		name: O("setting.viewer.mfvPreviewMethod.name"),
		tooltip: O("setting.viewer.mfvPreviewMethod.desc"),
		type: "combo",
		defaultValue: n.viewer?.mfvPreviewMethod || A.MFV_PREVIEW_METHOD,
		options: [
			"taesd",
			"latent2rgb",
			"auto",
			"default",
			"none"
		],
		onChange: (e) => {
			let t = [
				"taesd",
				"latent2rgb",
				"auto",
				"default",
				"none"
			].includes(e) ? e : A.MFV_PREVIEW_METHOD;
			n.viewer = n.viewer || {}, n.viewer.mfvPreviewMethod = t, G(n), K(n), r("viewer.mfvPreviewMethod");
		}
	}), t({
		id: `${cn}.Viewer.LtxavRgbFallback`,
		category: s("LTXAV preview fallback"),
		name: "Majoor: LTXAV RGB Preview Fallback (experimental)",
		tooltip: "Reuse LTXV RGB projection for LTXAV when native latent preview is unavailable. Experimental; quality may be approximate.",
		type: "boolean",
		defaultValue: !!n.viewer?.ltxavRgbFallback,
		onChange: async (e) => {
			let t = !!e, i = !!n.viewer?.ltxavRgbFallback;
			n.viewer = n.viewer || {}, n.viewer.ltxavRgbFallback = t, G(n), K(n), r("viewer.ltxavRgbFallback");
			try {
				let e = await a(t);
				if (!e?.ok) throw Error(e?.error || "Failed to update LTXAV RGB preview fallback setting");
			} catch (e) {
				n.viewer.ltxavRgbFallback = i, G(n), K(n), r("viewer.ltxavRgbFallback"), T(e?.message || "Failed to update LTXAV RGB preview fallback setting", "error");
			}
		}
	});
	try {
		e().then((e) => {
			if (!e?.ok) return;
			let t = !!e?.data?.prefs?.enabled, i = Ut();
			i.viewer = i.viewer || {}, !!i.viewer.ltxavRgbFallback !== t && (i.viewer.ltxavRgbFallback = t, Object.assign(n, i), G(i), K(i), r("viewer.ltxavRgbFallback"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	((e, i, a, s) => {
		t({
			id: `${cn}.WorkflowMinimap.${e}`,
			category: o(O(a).replace("Majoor: ", "")),
			name: O(a),
			tooltip: O(s),
			type: "boolean",
			defaultValue: !!n.workflowMinimap?.[i],
			onChange: (e) => {
				n.workflowMinimap = n.workflowMinimap || {}, n.workflowMinimap[i] = !!e, G(n), r(`workflowMinimap.${i}`);
			}
		});
	})("Enabled", "enabled", "setting.minimap.enabled.name", "setting.minimap.enabled.desc");
}
//#endregion
//#region ui/app/settings/settingsScanning.ts
var dn = "Majoor", fn = "Majoor Assets Manager";
function pn(e, t, n) {
	let r = (e, t) => [
		fn,
		e,
		t
	];
	e({
		id: `${dn}.ExecutionGrouping.Enabled`,
		category: r(O("cat.scanning"), "Execution grouping"),
		name: "Execution job/stack grouping",
		tooltip: "Enable or disable all live job_id / stack_id tracking, grouping, and stack finalization logic.",
		type: "boolean",
		defaultValue: !!(t.executionGrouping?.enabled ?? A.EXECUTION_GROUPING_ENABLED),
		onChange: async (e) => {
			let r = !!(t.executionGrouping?.enabled ?? A.EXECUTION_GROUPING_ENABLED), i = !!e;
			t.executionGrouping = t.executionGrouping || {}, t.executionGrouping.enabled = i, G(t), K(t), n("executionGrouping.enabled");
			try {
				let e = await S(i);
				if (!e?.ok) throw Error(e?.error || "Failed to update execution grouping setting");
				t.executionGrouping.enabled = !!e?.data?.prefs?.enabled, G(t), K(t), n("executionGrouping.enabled");
			} catch (e) {
				t.executionGrouping.enabled = r, G(t), K(t), n("executionGrouping.enabled"), T(e?.message || "Failed to update execution grouping setting", "error");
			}
		}
	}), e({
		id: `${dn}.AutoScan.OnStartup`,
		category: r(O("cat.scanning"), O("setting.scan.startup.name").replace("Majoor: ", "")),
		name: O("setting.scan.startup.name"),
		tooltip: O("setting.scan.startup.desc"),
		type: "boolean",
		defaultValue: !!t.autoScan?.onStartup,
		onChange: (e) => {
			t.autoScan = t.autoScan || {}, t.autoScan.onStartup = !!e, G(t), K(t), n("autoScan.onStartup");
		}
	}), e({
		id: `${dn}.Scan.FastMode`,
		category: r(O("cat.scanning"), "Scan mode"),
		name: "Fast scan mode",
		tooltip: "Use fast scan mode for manual backfill scans (skip heavier metadata work during scan).",
		type: "boolean",
		defaultValue: !!(t.scan?.fastMode ?? !0),
		onChange: (e) => {
			t.scan = t.scan || {}, t.scan.fastMode = !!e, G(t), n("scan.fastMode");
		}
	}), e({
		id: `${dn}.Scan.JpegXL`,
		category: r(O("cat.scanning"), "Image formats"),
		name: "JPEG XL (JXL) support (Experimental)",
		tooltip: "Index and preview .jxl images. Preview generation requires JPEG XL support in Pillow or FFmpeg. Run a new scan after enabling.",
		type: "boolean",
		defaultValue: !!t.scan?.jxlEnabled,
		onChange: async (e) => {
			let r = !!t.scan?.jxlEnabled, i = !!e;
			t.scan = t.scan || {}, t.scan.jxlEnabled = i, G(t), n("scan.jxlEnabled");
			try {
				let e = await ee(i);
				if (!e?.ok) throw Error(e?.error || "Failed to update JPEG XL support");
			} catch (e) {
				t.scan.jxlEnabled = r, G(t), n("scan.jxlEnabled"), T(e?.message || "Failed to update JPEG XL support", "error");
			}
		}
	}), v().then((e) => {
		e?.ok && (t.scan = t.scan || {}, t.scan.jxlEnabled = !!e?.data?.prefs?.enabled, G(t), n("scan.jxlEnabled"));
	}).catch(() => {}), e({
		id: `${dn}.RtHydrate.Concurrency`,
		category: r(O("cat.scanning"), "Hydration"),
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
			t.rtHydrate = t.rtHydrate || {}, t.rtHydrate.concurrency = Math.max(1, Math.min(20, Math.round(U(e, A.RT_HYDRATE_CONCURRENCY || 5)))), G(t), K(t), n("rtHydrate.concurrency");
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
		r.length && (G(t), r.forEach((e) => n(e)));
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
		id: `${dn}.Watcher.Enabled`,
		category: r(O("cat.scanning"), O("setting.watcher.enabled.label", "Enable watcher")),
		name: O("setting.watcher.name"),
		tooltip: O("setting.watcher.desc") + " (env: MJR_ENABLE_WATCHER)",
		type: "boolean",
		defaultValue: !!t.watcher?.enabled,
		onChange: async (e) => {
			t.watcher = t.watcher || {}, t.watcher.enabled = !!e, G(t), n("watcher.enabled");
			try {
				let r = await f(!!e);
				r?.ok || (t.watcher.enabled = !e, G(t), n("watcher.enabled"), T(r?.error || O("toast.failedToggleWatcher", "Failed to toggle watcher"), "error"));
			} catch {
				t.watcher.enabled = !e, G(t), n("watcher.enabled");
			}
		}
	}), e({
		id: `${dn}.Watcher.DebounceDelay`,
		category: r(O("cat.scanning"), O("setting.watcher.debounce.label", "Watcher debounce delay")),
		name: O("setting.watcher.debounce.name"),
		tooltip: O("setting.watcher.debounce.desc") + " (env: MJR_WATCHER_DEBOUNCE_MS)",
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
				t.watcher = t.watcher || {}, t.watcher.debounceMs = a, G(t);
				try {
					let e = await we({ debounce_ms: a });
					if (!e?.ok) throw Error(e?.error || O("setting.watcher.debounce.error"));
					let r = Math.round(Number(e?.data?.debounce_ms ?? a));
					t.watcher.debounceMs = r, G(t), n("watcher.debounceMs");
				} catch (e) {
					t.watcher.debounceMs = o, G(t), n("watcher.debounceMs"), T(e?.message || O("setting.watcher.debounce.error"), "error");
				}
			}
		}
	}), e({
		id: `${dn}.Watcher.DedupeWindow`,
		category: r(O("cat.scanning"), O("setting.watcher.dedupe.label", "Watcher dedupe window")),
		name: O("setting.watcher.dedupe.name"),
		tooltip: O("setting.watcher.dedupe.desc") + " (env: MJR_WATCHER_DEDUPE_TTL_MS)",
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
				t.watcher = t.watcher || {}, t.watcher.dedupeTtlMs = a, G(t);
				try {
					let e = await we({ dedupe_ttl_ms: a });
					if (!e?.ok) throw Error(e?.error || O("setting.watcher.dedupe.error"));
					let r = Math.round(Number(e?.data?.dedupe_ttl_ms ?? a));
					t.watcher.dedupeTtlMs = r, G(t), n("watcher.dedupeTtlMs");
				} catch (e) {
					t.watcher.dedupeTtlMs = o, G(t), n("watcher.dedupeTtlMs"), T(e?.message || O("setting.watcher.dedupe.error"), "error");
				}
			}
		}
	}), e({
		id: `${dn}.Watcher.MaxPending`,
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
			t.watcher = t.watcher || {}, t.watcher.maxPending = Math.max(10, Math.min(5e3, Math.round(U(e, 500)))), G(t), K(t), n("watcher.maxPending");
		}
	}), e({
		id: `${dn}.Watcher.MinSize`,
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
			t.watcher = t.watcher || {}, t.watcher.minSize = Math.max(0, Math.min(1e6, Math.round(U(e, 100)))), G(t), K(t), n("watcher.minSize");
		}
	}), e({
		id: `${dn}.Watcher.MaxSize`,
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
			t.watcher = t.watcher || {}, t.watcher.maxSize = Math.max(1e5, Math.min(17179869184, Math.round(U(e, 4294967296)))), G(t), K(t), n("watcher.maxSize");
		}
	});
	try {
		o().catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	e({
		id: `${dn}.RatingTagsSync.Enabled`,
		category: r(O("cat.scanning"), O("setting.sync.rating.name").replace("Majoor: ", "")),
		name: O("setting.sync.rating.name"),
		tooltip: O("setting.sync.rating.desc"),
		type: "boolean",
		defaultValue: !!t.ratingTagsSync?.enabled,
		onChange: (e) => {
			t.ratingTagsSync = t.ratingTagsSync || {}, t.ratingTagsSync.enabled = !!e, G(t), n("ratingTagsSync.enabled");
		}
	});
}
//#endregion
//#region ui/app/settings/settingsFeed.ts
var mn = "Majoor", hn = "Majoor Assets Manager";
function gn(e, t, n) {
	let r = (e) => [
		hn,
		O("cat.feed", "Generated Feed"),
		e
	], i = () => {
		t.feed = t.feed || {};
	};
	e({
		id: `${mn}.Feed.CardSize`,
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
			i(), t.feed.minSize = Math.max(60, Math.min(600, Math.round(Number(e) || 120))), G(t), K(t), n("feed.minSize");
		}
	}), e({
		id: `${mn}.Feed.ShowInfo`,
		category: r("Show info section"),
		name: "Show card info section",
		tooltip: "Show or hide the entire info section (filename, metadata, dots) below thumbnails in the Generated Feed.",
		type: "boolean",
		defaultValue: !!(t.feed?.showInfo ?? A.FEED_SHOW_INFO),
		onChange: (e) => {
			i(), t.feed.showInfo = !!e, G(t), K(t), n("feed.showInfo");
		}
	}), e({
		id: `${mn}.Feed.ShowFilename`,
		category: r("Show filename"),
		name: "Show filename",
		tooltip: "Display the filename on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showFilename ?? A.FEED_SHOW_FILENAME),
		onChange: (e) => {
			i(), t.feed.showFilename = !!e, G(t), K(t), n("feed.showFilename");
		}
	}), e({
		id: `${mn}.Feed.ShowDimensions`,
		category: r("Show dimensions"),
		name: "Show dimensions",
		tooltip: "Display resolution (WxH) and duration on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDimensions ?? A.FEED_SHOW_DIMENSIONS),
		onChange: (e) => {
			i(), t.feed.showDimensions = !!e, G(t), K(t), n("feed.showDimensions");
		}
	}), e({
		id: `${mn}.Feed.ShowDate`,
		category: r("Show date/time"),
		name: "Show date/time",
		tooltip: "Display date and time on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDate ?? A.FEED_SHOW_DATE),
		onChange: (e) => {
			i(), t.feed.showDate = !!e, G(t), K(t), n("feed.showDate");
		}
	}), e({
		id: `${mn}.Feed.ShowGenTime`,
		category: r("Show generation time"),
		name: "Show generation time",
		tooltip: "Display the generation time badge on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showGenTime ?? A.FEED_SHOW_GENTIME),
		onChange: (e) => {
			i(), t.feed.showGenTime = !!e, G(t), K(t), n("feed.showGenTime");
		}
	}), e({
		id: `${mn}.Feed.ShowWorkflowDot`,
		category: r("Show workflow dot"),
		name: "Show workflow indicator",
		tooltip: "Display the workflow availability dot on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showWorkflowDot ?? A.FEED_SHOW_WORKFLOW_DOT),
		onChange: (e) => {
			i(), t.feed.showWorkflowDot = !!e, G(t), K(t), n("feed.showWorkflowDot");
		}
	}), e({
		id: `${mn}.Feed.ShowExtBadge`,
		category: r("Show format badges"),
		name: "Show format badges",
		tooltip: "Display format badges (e.g. JPG, MP4) on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showExtBadge ?? A.FEED_SHOW_BADGES_EXTENSION),
		onChange: (e) => {
			i(), t.feed.showExtBadge = !!e, G(t), K(t), n("feed.showExtBadge");
		}
	}), e({
		id: `${mn}.Feed.ShowRatingBadge`,
		category: r("Show rating badges"),
		name: "Show ratings",
		tooltip: "Display star ratings on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showRatingBadge ?? A.FEED_SHOW_BADGES_RATING),
		onChange: (e) => {
			i(), t.feed.showRatingBadge = !!e, G(t), K(t), n("feed.showRatingBadge");
		}
	}), e({
		id: `${mn}.Feed.ShowTagsBadge`,
		category: r("Show tags badges"),
		name: "Show tags",
		tooltip: "Display tag indicators on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showTagsBadge ?? A.FEED_SHOW_BADGES_TAGS),
		onChange: (e) => {
			i(), t.feed.showTagsBadge = !!e, G(t), K(t), n("feed.showTagsBadge");
		}
	});
}
//#endregion
//#region ui/app/settings/settingsSecurity.ts
var _n = "Majoor", vn = "Majoor Assets Manager", yn = 16, bn = {
	safeMode: !1,
	allowWrite: !0,
	allowDelete: !0,
	allowRename: !0,
	allowOpenInFolder: !0,
	allowResetIndex: !0
};
function xn(e) {
	return !!e;
}
function Sn(e, t) {
	return xn(e) === xn(t);
}
function Cn(e) {
	return typeof e == "string" ? e.trim() : "";
}
function wn(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "localhost" || t === "127.0.0.1" || t === "::1";
}
function Tn() {
	return globalThis.location || globalThis.window?.location || null;
}
function En() {
	let e = Tn();
	if (!e) return !1;
	let t = String(e.protocol || "").toLowerCase(), n = String(e.hostname || "").trim();
	return t === "http:" && !wn(n);
}
function Dn(e) {
	let t = globalThis.crypto;
	if (!t?.getRandomValues) throw Error("Secure token generation requires crypto.getRandomValues().");
	return t.getRandomValues(e);
}
function On(e) {
	let t = Math.max(4, Number(e) || 0), n = new Uint8Array(t);
	return Dn(n), Array.from(n, (e) => e.toString(16).padStart(2, "0")).join("");
}
function kn() {
	return `mjr_${On(18)}`;
}
function An(e) {
	return String(e?.apiToken || "").trim().length >= yn && H(e?.allowWrite, !0) && H(e?.requireAuth, !1) && !H(e?.allowRemoteWrite, !1);
}
function jn(e) {
	let t = String((e && typeof e == "object" ? e : {}).apiToken || "").trim();
	return {
		apiToken: t.length >= yn ? t : kn(),
		allowWrite: !0,
		requireAuth: !0,
		allowRemoteWrite: !1,
		allowInsecureTokenTransport: En()
	};
}
function Mn(e) {
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
function Nn(e) {
	return de(Mn(e));
}
function Pn(e) {
	let t = String(e?.security?.tokenHint || "").trim();
	return t ? O("setting.sec.token.placeholderConfigured", "Token configured on server ({tokenHint}). Leave blank to keep the current server token.", { tokenHint: t }) : e?.security?.tokenConfigured ? O("setting.sec.token.placeholderConfiguredGeneric", "Token configured on server. Leave blank to keep the current server token.") : O("setting.sec.token.placeholder", "Auto-generated for this browser session.");
}
function Fn(e, t, n) {
	let r = (e, t) => [
		vn,
		e,
		t
	];
	e({
		id: `${_n}.Safety.ConfirmDeletion`,
		category: r(O("cat.security"), "Confirm before deleting"),
		name: "Confirm before deleting",
		tooltip: "Show a confirmation dialog before deleting files. Disabling this allows instant deletion.",
		type: "boolean",
		defaultValue: t.safety?.confirmDeletion !== !1,
		onChange: (e) => {
			Sn(t.safety?.confirmDeletion !== !1, e) || (t.safety = t.safety || {}, t.safety.confirmDeletion = !!e, G(t), K(t), n("safety.confirmDeletion"));
		}
	});
	let i = (i, a, o, s = "cat.security") => {
		e({
			id: `${_n}.Security.${i}`,
			category: r(O(s), O(a).replace("Majoor: ", "")),
			name: O(a),
			tooltip: O(o),
			type: "boolean",
			defaultValue: H(t.security?.[i], bn[i] ?? !1),
			onChange: (e) => {
				if (!Sn(t.security?.[i], e)) {
					t.security = t.security || {}, t.security[i] = !!e, G(t), n(`security.${i}`);
					try {
						Nn(t.security).then((e) => {
							e?.ok && e.data?.prefs ? Wt() : e && e.ok === !1 && console.warn("[Majoor] backend security settings update failed", e.error || e);
						}).catch(() => {});
					} catch (e) {
						console.debug?.(e);
					}
				}
			}
		});
	};
	i("safeMode", "setting.sec.safe.name", "setting.sec.safe.desc"), i("allowWrite", "setting.sec.write.name", "setting.sec.write.desc"), i("allowDelete", "setting.sec.del.name", "setting.sec.del.desc"), i("allowRename", "setting.sec.ren.name", "setting.sec.ren.desc"), i("allowOpenInFolder", "setting.sec.open.name", "setting.sec.open.desc"), i("allowResetIndex", "setting.sec.reset.name", "setting.sec.reset.desc"), e({
		id: `${_n}.Security.RemoteLanPreset`,
		category: r(O("cat.remote"), O("setting.sec.remoteLanPreset.name").replace("Majoor: ", "")),
		name: O("setting.sec.remoteLanPreset.name"),
		tooltip: O("setting.sec.remoteLanPreset.desc"),
		type: "boolean",
		defaultValue: An(t.security),
		onChange: (e) => {
			if (t.security = t.security || {}, Sn(t.security.remoteLanPreset, e)) return;
			if (t.security.remoteLanPreset = !!e, !e) {
				G(t), n("security.remoteLanPreset");
				return;
			}
			let r;
			try {
				r = jn(t.security);
			} catch (e) {
				T(e?.message || O("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				return;
			}
			Object.assign(t.security, r), t.security.tokenConfigured = !0, t.security.tokenHint = String(r.apiToken || "").trim() ? `...${String(r.apiToken).trim().slice(-4)}` : "", r.apiToken && ne(r.apiToken), G(t), n("security.remoteLanPreset"), n("security.apiToken"), n("security.allowWrite"), n("security.requireAuth"), n("security.allowRemoteWrite"), n("security.allowInsecureTokenTransport");
			try {
				Nn(t.security).then((e) => {
					e?.ok && e.data?.prefs ? (Wt(), T(O("toast.remoteLanPresetApplied", "Recommended remote LAN setup applied. This browser session is now authorized for Majoor write operations."), "success")) : e && e.ok === !1 && (T(e.error || O("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error"), console.warn("[Majoor] backend remote LAN preset update failed", e.error || e));
				}).catch((e) => {
					T(e?.message || O("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), e({
		id: `${_n}.Security.ApiToken`,
		category: r(O("cat.remote"), O("setting.sec.token.name").replace("Majoor: ", "")),
		name: O("setting.sec.token.name", "Majoor: API Token"),
		tooltip: O("setting.sec.token.desc", "Store the API token used for write operations. Majoor sends it via X-MJR-Token and Authorization headers."),
		type: "text",
		defaultValue: t.security?.apiToken || "",
		attrs: { placeholder: Pn(t) },
		onChange: (e) => {
			t.security = t.security || {};
			let r = Cn(e);
			if (Cn(t.security.apiToken) !== r && (t.security.apiToken = r, t.security.apiToken && (t.security.tokenConfigured = !0, t.security.tokenHint = `...${t.security.apiToken.slice(-4)}`, ne(t.security.apiToken)), G(t), n("security.apiToken"), t.security.apiToken)) try {
				de({ api_token: t.security.apiToken }).then((e) => {
					e?.ok && e.data?.prefs ? Wt() : e && e.ok === !1 && console.warn("[Majoor] backend token update failed", e.error || e);
				}).catch(() => {});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), i("requireAuth", "setting.sec.requireAuth.name", "setting.sec.requireAuth.desc", "cat.remote"), i("allowRemoteWrite", "setting.sec.remote.name", "setting.sec.remote.desc", "cat.remote"), i("allowInsecureTokenTransport", "setting.sec.insecureTransport.name", "setting.sec.insecureTransport.desc", "cat.remote");
}
//#endregion
//#region ui/app/settings/settingsAdvanced.ts
var J = "Majoor", In = "Majoor Assets Manager";
function Ln(e, a, s, c) {
	let l = (e, t) => [
		In,
		e,
		t
	], f = String(a.paths?.outputDirectory || ""), m = null, h = 0, g = null;
	e({
		id: `${J}.Paths.OutputDirectory`,
		category: l(O("cat.advanced"), "Paths / Output"),
		name: "Majoor: Generation Output Directory",
		tooltip: "Override the ComfyUI generation output directory used by Majoor (equivalent to --output-directory). Leave empty to keep the current backend default.",
		type: "text",
		defaultValue: String(a.paths?.outputDirectory || ""),
		attrs: { placeholder: "D:\\\\____COMFY_OUTPUTS" },
		onChange: async (e) => {
			let t = String(e || "").trim();
			a.paths = a.paths || {}, a.paths.outputDirectory = t, G(a);
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
					let n = await _(t, g ? { signal: g.signal } : {});
					if (e !== h) return;
					if (!n?.ok) throw Error(n?.error || O("toast.failedSetOutputDirectory", "Failed to set output directory"));
					let r = String(n?.data?.output_directory || t).trim();
					a.paths.outputDirectory = r, f = r, G(a), s("paths.outputDirectory");
				} catch (t) {
					if (e !== h || String(t?.name || "") === "AbortError" || String(t?.code || "") === "ABORTED") return;
					a.paths.outputDirectory = f, G(a), s("paths.outputDirectory"), T(t?.message || O("toast.failedSetOutputDirectory", "Failed to set output directory"), "error");
				}
			}, 700);
		}
	});
	try {
		ye().then((e) => {
			if (!e?.ok) return;
			let t = String(e?.data?.output_directory || "").trim();
			a.paths = a.paths || {}, a.paths.outputDirectory !== t && (a.paths.outputDirectory = t, f = t, G(a), s("paths.outputDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let v = String(a.paths?.indexDirectory || ""), y = null, b = 0, x = null;
	e({
		id: `${J}.Paths.IndexDirectory`,
		category: l(O("cat.advanced"), "Paths / Index"),
		name: "Majoor: Index Database Directory",
		tooltip: "Override the Majoor index database directory. Use this to keep the SQLite index on a different local disk. Requires restart.",
		type: "text",
		defaultValue: String(a.paths?.indexDirectory || ""),
		attrs: { placeholder: "D:\\MajoorIndex" },
		onChange: async (e) => {
			let t = String(e || "").trim();
			a.paths = a.paths || {}, a.paths.indexDirectory = t, G(a);
			try {
				y &&= (clearTimeout(y), null);
			} catch (e) {
				console.debug?.(e);
			}
			y = setTimeout(async () => {
				y = null;
				let e = ++b;
				try {
					x?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				x = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let n = await Se(t, x ? { signal: x.signal } : {});
					if (e !== b) return;
					if (!n?.ok) throw Error(n?.error || O("toast.failedSetIndexDirectory", "Failed to set index directory"));
					let r = String(n?.data?.index_directory || t).trim(), i = r !== v;
					a.paths.indexDirectory = r, v = r, G(a), s("paths.indexDirectory"), i && T(O("toast.indexDirectorySavedRestart", "Index directory saved. Restart ComfyUI to apply."), "success", void 0, { history: { trackId: "settings:index-directory-saved" } });
				} catch (t) {
					if (e !== b || String(t?.name || "") === "AbortError" || String(t?.code || "") === "ABORTED") return;
					a.paths.indexDirectory = v, G(a), s("paths.indexDirectory"), T(t?.message || O("toast.failedSetIndexDirectory", "Failed to set index directory"), "error");
				}
			}, 700);
		}
	});
	try {
		re().then((e) => {
			if (!e?.ok) return;
			let t = String(e?.data?.index_directory || "").trim();
			a.paths = a.paths || {}, a.paths.indexDirectory !== t && (a.paths.indexDirectory = t, v = t, G(a), s("paths.indexDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let S = String(a.paths?.workflowRoots || ""), C = null, ee = 0, te = null;
	e({
		id: `${J}.Paths.WorkflowRoots`,
		category: l(O("cat.advanced"), "Paths / Workflows"),
		name: "Majoor: Workflow Roots",
		tooltip: "Folders scanned by the Workflow tab. Use one folder per line, or separate folders with semicolons. Leave empty to use ComfyUI defaults and MJR_AM_WORKFLOW_DIRECTORY.",
		type: "text",
		defaultValue: String(a.paths?.workflowRoots || ""),
		attrs: { placeholder: "D:\\\\ComfyUI\\\\user\\\\default\\\\workflows" },
		onChange: async (e) => {
			let t = String(e || "").trim();
			a.paths = a.paths || {}, a.paths.workflowRoots = t, G(a);
			try {
				C &&= (clearTimeout(C), null);
			} catch (e) {
				console.debug?.(e);
			}
			C = setTimeout(async () => {
				C = null;
				let e = ++ee;
				try {
					te?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				te = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let n = await o(t, te ? { signal: te.signal } : {});
					if (e !== ee) return;
					if (!n?.ok) throw Error(n?.error || O("toast.failedSetWorkflowRoots", "Failed to set workflow roots"));
					let r = String(n?.data?.workflow_roots_text || t).trim();
					a.paths.workflowRoots = r, S = r, G(a), s("paths.workflowRoots"), T(O("toast.workflowRootsSaved", "Workflow roots saved"), "success", 1800);
				} catch (t) {
					if (e !== ee || String(t?.name || "") === "AbortError" || String(t?.code || "") === "ABORTED") return;
					a.paths.workflowRoots = S, G(a), s("paths.workflowRoots"), T(t?.message || O("toast.failedSetWorkflowRoots", "Failed to set workflow roots"), "error");
				}
			}, 700);
		}
	});
	try {
		be().then((e) => {
			if (!e?.ok) return;
			let t = String(e?.data?.workflow_roots_text || "").trim();
			a.paths = a.paths || {}, a.paths.workflowRoots !== t && (a.paths.workflowRoots = t, S = t, G(a), s("paths.workflowRoots"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let E = Pe().map((e) => e.code), ne = ["auto", ...E];
	e({
		id: `${J}.Language`,
		category: l(O("cat.advanced"), O("setting.language.name", "Language")),
		name: O("setting.language.name", "Majoor: Language"),
		tooltip: "Use auto to detect and follow ComfyUI language. Or choose a fixed language for Majoor only.",
		type: "combo",
		defaultValue: a.i18n?.followComfyLanguage ? "auto" : ke(),
		options: ne,
		onChange: (e) => {
			if (a.i18n = a.i18n || {}, e === "auto") {
				a.i18n.followComfyLanguage = !0, Ae(!0), Re(c), G(a), s("language");
				return;
			}
			E.includes(e) && (a.i18n.followComfyLanguage = !1, Ae(!1), je(e), G(a), s("language"));
		}
	}), e({
		id: `${J}.ProbeBackend.Mode`,
		category: l(O("cat.advanced"), O("setting.probe.mode.name").replace("Majoor: ", "")),
		name: O("setting.probe.mode.name"),
		tooltip: O("setting.probe.mode.desc") + " (env: MAJOOR_MEDIA_PROBE_BACKEND)",
		type: "combo",
		defaultValue: a.probeBackend?.mode || W.probeBackend.mode,
		options: [
			"auto",
			"exiftool",
			"ffprobe",
			"both"
		],
		onChange: (e) => {
			let t = Pt(e, [
				"auto",
				"exiftool",
				"ffprobe",
				"both"
			], W.probeBackend.mode);
			a.probeBackend = a.probeBackend || {}, a.probeBackend.mode = t, G(a), K(a), s("probeBackend.mode"), pe(t).catch(() => {});
		}
	}), e({
		id: `${J}.MetadataFallback.Image`,
		category: l(O("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Images)",
		tooltip: "Enable Pillow fallback when ExifTool is missing or fails.",
		type: "boolean",
		defaultValue: a.metadataFallback?.image ?? W.metadataFallback.image,
		onChange: async (e) => {
			let t = !!e, n = !!(a.metadataFallback?.image ?? W.metadataFallback.image);
			a.metadataFallback = a.metadataFallback || {}, a.metadataFallback.image = t, G(a), s("metadataFallback.image");
			try {
				let e = await i({
					image: t,
					media: a.metadataFallback?.media ?? W.metadataFallback.media
				});
				if (!e?.ok) throw Error(e?.error || O("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				a.metadataFallback.image = n, G(a), s("metadataFallback.image"), T(e?.message || O("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	}), e({
		id: `${J}.MetadataFallback.Media`,
		category: l(O("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Audio/Video)",
		tooltip: "Enable hachoir fallback when ffprobe is missing or fails.",
		type: "boolean",
		defaultValue: a.metadataFallback?.media ?? W.metadataFallback.media,
		onChange: async (e) => {
			let t = !!e, n = !!(a.metadataFallback?.media ?? W.metadataFallback.media);
			a.metadataFallback = a.metadataFallback || {}, a.metadataFallback.media = t, G(a), s("metadataFallback.media");
			try {
				let e = await i({
					image: a.metadataFallback?.image ?? W.metadataFallback.image,
					media: t
				});
				if (!e?.ok) throw Error(e?.error || O("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				a.metadataFallback.media = n, G(a), s("metadataFallback.media"), T(e?.message || O("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	});
	try {
		se().then((e) => {
			if (!e?.ok || !e?.data?.prefs) return;
			let t = e.data.prefs || {}, n = !!(t.image ?? W.metadataFallback.image), r = !!(t.media ?? W.metadataFallback.media);
			a.metadataFallback = a.metadataFallback || {};
			let i = !1;
			a.metadataFallback.image !== n && (a.metadataFallback.image = n, i = !0), a.metadataFallback.media !== r && (a.metadataFallback.media = r, i = !0), i && (G(a), s("metadataFallback"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	e({
		id: `${J}.Db.Timeout`,
		category: l(O("cat.advanced"), "Database"),
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
			a.db = a.db || {}, a.db.timeoutMs = Math.max(1e3, Math.min(3e4, Math.round(U(e, 5e3)))), G(a), K(a), s("db.timeoutMs");
		}
	}), e({
		id: `${J}.Db.MaxConnections`,
		category: l(O("cat.advanced"), "Database"),
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
			a.db = a.db || {}, a.db.maxConnections = Math.max(1, Math.min(100, Math.round(U(e, 10)))), G(a), K(a), s("db.maxConnections");
		}
	}), e({
		id: `${J}.Db.QueryTimeout`,
		category: l(O("cat.advanced"), "Database"),
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
			a.db = a.db || {}, a.db.queryTimeoutMs = Math.max(500, Math.min(1e4, Math.round(U(e, 1e3)))), G(a), K(a), s("db.queryTimeoutMs");
		}
	}), e({
		id: `${J}.Observability.Enabled`,
		category: l(O("cat.advanced"), O("setting.obs.enabled.name").replace("Majoor: ", "")),
		name: O("setting.obs.enabled.name"),
		tooltip: O("setting.obs.enabled.desc"),
		type: "boolean",
		defaultValue: !!a.observability?.enabled,
		onChange: (e) => {
			a.observability = a.observability || {}, a.observability.enabled = !!e, G(a), K(a), s("observability.enabled");
		}
	}), e({
		id: `${J}.Observability.RuntimeDashboardMode`,
		category: l(O("cat.advanced"), "Runtime metrics badge"),
		name: "Majoor: Runtime metrics badge",
		tooltip: "Controls the small DB/enrichment/watcher metrics badge in the Assets Manager panel.",
		type: "combo",
		defaultValue: a.observability?.runtimeDashboardMode || W.observability.runtimeDashboardMode,
		options: [
			"autoHide30",
			"always",
			"hidden"
		],
		onChange: (e) => {
			let t = Pt(e, [
				"autoHide30",
				"always",
				"hidden"
			], W.observability.runtimeDashboardMode);
			a.observability = a.observability || {}, a.observability.runtimeDashboardMode = t, G(a), s("observability.runtimeDashboardMode");
		}
	}), e({
		id: `${J}.Observability.VerboseErrors`,
		category: l(O("cat.advanced"), "Verbose error logging"),
		name: "Verbose error logging",
		tooltip: "Show detailed error messages in toasts and console. Useful for debugging.",
		type: "boolean",
		defaultValue: !!a.observability?.verboseErrors,
		onChange: (e) => {
			a.observability = a.observability || {}, a.observability.verboseErrors = !!e, G(a), K(a), s("observability.verboseErrors");
		}
	}), e({
		id: `${J}.Observability.VerboseRouteRegistrationLogs`,
		category: l(O("cat.advanced"), "Logs"),
		name: "Majoor: Verbose route registration logs",
		tooltip: "When disabled, Majoor prints a compact startup summary instead of listing every registered API route. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(a.observability?.verboseRouteRegistrationLogs ?? W.observability?.verboseRouteRegistrationLogs ?? !1),
		onChange: async (e) => {
			let n = !!e, r = !!(a.observability?.verboseRouteRegistrationLogs ?? W.observability?.verboseRouteRegistrationLogs ?? !1);
			a.observability = a.observability || {}, a.observability.verboseRouteRegistrationLogs = n, G(a), s("observability.verboseRouteRegistrationLogs");
			try {
				let e = await t(n);
				if (!e?.ok) throw Error(e?.error || "Failed to update route logging settings");
			} catch (e) {
				a.observability.verboseRouteRegistrationLogs = r, G(a), s("observability.verboseRouteRegistrationLogs"), T(e?.message || "Failed to update route logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let e = !!(await he())?.data?.prefs?.enabled;
			a.observability = a.observability || {}, a.observability.verboseRouteRegistrationLogs !== e && (a.observability.verboseRouteRegistrationLogs = e, G(a), s("observability.verboseRouteRegistrationLogs"));
		} catch (e) {
			console.debug?.(e);
		}
	})(), e({
		id: `${J}.Observability.VerboseStartupLogs`,
		category: l(O("cat.advanced"), "Logs"),
		name: "Majoor: Verbose startup logs",
		tooltip: "When disabled, Majoor suppresses most informational bootstrap logs during backend startup while keeping warnings and errors. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(a.observability?.verboseStartupLogs ?? W.observability?.verboseStartupLogs ?? !1),
		onChange: async (e) => {
			let t = !!e, n = !!(a.observability?.verboseStartupLogs ?? W.observability?.verboseStartupLogs ?? !1);
			a.observability = a.observability || {}, a.observability.verboseStartupLogs = t, G(a), s("observability.verboseStartupLogs");
			try {
				let e = await p(t);
				if (!e?.ok) throw Error(e?.error || "Failed to update startup logging settings");
			} catch (e) {
				a.observability.verboseStartupLogs = n, G(a), s("observability.verboseStartupLogs"), T(e?.message || "Failed to update startup logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let e = !!(await ae())?.data?.prefs?.enabled;
			a.observability = a.observability || {}, a.observability.verboseStartupLogs !== e && (a.observability.verboseStartupLogs = e, G(a), s("observability.verboseStartupLogs"));
		} catch (e) {
			console.debug?.(e);
		}
	})();
	{
		let t = "HuggingFace Token", n = "", i = null, o = 0, c = !!a.ai?.huggingFaceTokenVisible, d = () => {
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
			id: `${J}.AI.HuggingFaceTokenVisible`,
			category: l(O("cat.advanced"), t),
			name: "Show HuggingFace token",
			tooltip: "Show or hide the HuggingFace token while editing.",
			type: "boolean",
			defaultValue: c,
			onChange: (e) => {
				let t = !!e;
				c = t, a.ai = a.ai || {}, a.ai.huggingFaceTokenVisible = t, G(a), s("ai.huggingFaceTokenVisible"), setTimeout(d, 0);
			}
		}), e({
			id: `${J}.AI.HuggingFaceToken`,
			category: l(O("cat.advanced"), t),
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
				type: c ? "text" : "password",
				autocomplete: "new-password",
				name: "mjr_huggingface_token",
				"data-mjr-hf-token": "1"
			},
			onChange: (e) => {
				let t = String(e || "").trim();
				if (t !== n) {
					try {
						i &&= (clearTimeout(i), null);
					} catch (e) {
						console.debug?.(e);
					}
					i = setTimeout(async () => {
						i = null;
						let e = ++o;
						try {
							let i = await r(t);
							if (e !== o) return;
							if (!i?.ok) throw Error(i?.error || "Failed to update HuggingFace token");
							n = t, s("ai.huggingFaceToken"), t ? T("HuggingFace token saved", "success") : T("HuggingFace token cleared", "success", void 0, { noHistory: !0 });
						} catch (t) {
							if (e !== o) return;
							T(t?.message || "Failed to update HuggingFace token", "error");
						}
					}, 900);
				}
			}
		}), setTimeout(d, 0), (async () => {
			try {
				let e = (await w())?.data?.prefs || {}, t = !!e?.has_token, n = String(e?.token_hint || "").trim();
				f(t ? `Configured ${n || "(saved)"}` : "Paste HuggingFace token (hf_...)");
			} catch (e) {
				console.debug?.(e);
			}
		})(), e({
			id: `${J}.AI.VerboseLogs`,
			category: l(O("cat.advanced"), t),
			name: "Majoor: Verbose AI logs",
			tooltip: "Enable detailed HuggingFace/SigLIP2/X-CLIP logs and progress bars during model download/loading.",
			type: "boolean",
			defaultValue: !!(a.ai?.verboseAiLogs ?? W.ai?.verboseAiLogs ?? !1),
			onChange: async (e) => {
				let t = !!e, n = !!(a.ai?.verboseAiLogs ?? W.ai?.verboseAiLogs ?? !1);
				a.ai = a.ai || {}, a.ai.verboseAiLogs = t, G(a), s("ai.verboseAiLogs");
				try {
					let e = await Ce(t);
					if (!e?.ok) throw Error(e?.error || "Failed to update AI logging settings");
				} catch (e) {
					a.ai.verboseAiLogs = n, G(a), s("ai.verboseAiLogs"), T(e?.message || "Failed to update AI logging settings", "error");
				}
			}
		}), (async () => {
			try {
				let e = !!(await u())?.data?.prefs?.enabled;
				a.ai = a.ai || {}, a.ai.verboseAiLogs !== e && (a.ai.verboseAiLogs = e, G(a), s("ai.verboseAiLogs"));
			} catch (e) {
				console.debug?.(e);
			}
		})();
	}
	e({
		id: `${J}.AI.VectorStats`,
		category: l(O("cat.advanced"), "AI / Vector Search"),
		name: "Vector Index Status",
		tooltip: "Current status of the SigLIP2/X-CLIP vector index used for semantic search",
		type: "text",
		defaultValue: "Loading vector status..."
	}), (async () => {
		try {
			let e = await d();
			e?.ok ? console.debug?.("[Majoor] Vector status:", `${e.data?.total || 0} assets indexed | Model: ${e.data?.model || "N/A"}`) : console.debug?.("[Majoor] Vector status unavailable");
		} catch (e) {
			console.debug?.("[Majoor] Vector status fetch failed", e);
		}
	})(), e({
		id: `${J}.AI.VectorBackfillAction`,
		category: l(O("cat.advanced"), "AI / Vector Search"),
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
				T(O("toast.vectorBackfillStarting", "Starting vector backfill... This may take a while."), "info", void 0, { history: {
					...t.history,
					status: "started",
					detail: "Starting vector backfill... This may take a while."
				} });
				let e = await n(64, { onProgress: (e) => {
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
						T(O("toast.vectorBackfillRunning", "Vector backfill still running in background{job}.", { job: e ? ` (job ${e.slice(0, 8)})` : "" }), "info", void 0, { history: {
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
					} else T(O("toast.vectorBackfillComplete", "Vector backfill complete! Processed: {processed}, Indexed: {indexed}, Skipped: {skipped}", {
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
						let e = await d();
						e?.ok && console.debug?.("[Majoor] Vector stats after backfill:", e.data);
					} catch (e) {
						console.debug?.("[Majoor] Failed to refresh vector stats:", e);
					}
				} else throw Error(e?.error || O("toast.vectorBackfillFailedGeneric", "Backfill failed"));
			} catch (e) {
				let n = e?.message || String(e || O("status.unknown", "unknown"));
				T(O("toast.vectorBackfillFailedDetail", "Vector backfill failed: {error}", { error: n }), "error", void 0, { history: {
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
var Rn = "Majoor", zn = "Majoor Assets Manager";
function Bn(e, t, n) {
	let r = (e, t) => [
		zn,
		e,
		t
	];
	e({
		id: `${Rn}.AI.VectorSearchEnabled`,
		category: r(O("cat.search", "Search"), "AI"),
		name: O("setting.ai.vector.enabled.name", "Enable AI semantic search"),
		tooltip: O("setting.ai.vector.enabled.desc", "Enable/disable AI vector search features (SigLIP2/X-CLIP: description search, prompt alignment, AI tag suggestions, smart collections)."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorSearchEnabled ?? !0),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let r = !!(t.ai.vectorSearchEnabled ?? !0), i = !!e;
			t.ai.vectorSearchEnabled = i, G(t), K(t), n("ai.vectorSearchEnabled");
			try {
				let e = await h(i);
				if (!e?.ok) {
					t.ai.vectorSearchEnabled = r, G(t), K(t), n("ai.vectorSearchEnabled"), T(e?.error || "Failed to update AI vector search setting", "error");
					return;
				}
				T(i ? "AI semantic search enabled" : "AI semantic search disabled", "info", 2200);
			} catch (e) {
				t.ai.vectorSearchEnabled = r, G(t), K(t), n("ai.vectorSearchEnabled"), T(e?.message || "Failed to update AI vector search setting", "error");
			}
		}
	}), e({
		id: `${Rn}.AI.VectorCaptionOnIndex`,
		category: r(O("cat.search", "Search"), "AI"),
		name: O("setting.ai.vector.captionOnIndex.name", "Generate AI captions during indexing"),
		tooltip: O("setting.ai.vector.captionOnIndex.desc", "Allow automatic vector indexing and backfill to run Florence-2 captions for image assets. This is slower and can use significant VRAM/CPU; leave it off for faster grid startup."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorCaptionOnIndex ?? !1),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let r = !!(t.ai.vectorCaptionOnIndex ?? !1), i = !!e;
			t.ai.vectorCaptionOnIndex = i, G(t), K(t), n("ai.vectorCaptionOnIndex");
			try {
				let e = await h({ caption_on_index: i });
				if (!e?.ok) {
					t.ai.vectorCaptionOnIndex = r, G(t), K(t), n("ai.vectorCaptionOnIndex"), T(e?.error || "Failed to update AI caption indexing setting", "error");
					return;
				}
				i && T("AI captions during indexing enabled", "info", 2600);
			} catch (e) {
				t.ai.vectorCaptionOnIndex = r, G(t), K(t), n("ai.vectorCaptionOnIndex"), T(e?.message || "Failed to update AI caption indexing setting", "error");
			}
		}
	}), e({
		id: `${Rn}.AI.VectorIndexOnScan`,
		category: r(O("cat.search", "Search"), "AI"),
		name: O("setting.ai.vector.indexOnScan.name", "Index vectors during scans"),
		tooltip: O("setting.ai.vector.indexOnScan.desc", "Compute SigLIP/X-CLIP embeddings while assets are scanned. Disable to avoid surprise VRAM use; run vector backfill manually when needed."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorIndexOnScan ?? !1),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let r = !!(t.ai.vectorIndexOnScan ?? !1), i = !!e;
			t.ai.vectorIndexOnScan = i, G(t), K(t), n("ai.vectorIndexOnScan");
			try {
				let e = await h({ index_on_scan: i });
				if (!e?.ok) {
					t.ai.vectorIndexOnScan = r, G(t), K(t), n("ai.vectorIndexOnScan"), T(e?.error || "Failed to update vector scan indexing", "error");
					return;
				}
				T(i ? "Vector indexing during scans enabled" : "Vector indexing during scans disabled", "info", 2400);
			} catch (e) {
				t.ai.vectorIndexOnScan = r, G(t), K(t), n("ai.vectorIndexOnScan"), T(e?.message || "Failed to update vector scan indexing", "error");
			}
		}
	}), e({
		id: `${Rn}.AI.VectorConcurrency`,
		category: r(O("cat.search", "Search"), "AI"),
		name: O("setting.ai.vector.concurrency.name", "Vector indexing concurrency"),
		tooltip: O("setting.ai.vector.concurrency.desc", "Maximum concurrent vector embedding workers. Use 1 to minimize transient VRAM spikes."),
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
			t.ai.vectorConcurrency = i, G(t), K(t), n("ai.vectorConcurrency");
			try {
				let e = await h({ concurrency: i });
				e?.ok || (t.ai.vectorConcurrency = r, G(t), K(t), n("ai.vectorConcurrency"), T(e?.error || "Failed to update vector concurrency", "error"));
			} catch (e) {
				t.ai.vectorConcurrency = r, G(t), K(t), n("ai.vectorConcurrency"), T(e?.message || "Failed to update vector concurrency", "error");
			}
		}
	}), e({
		id: `${Rn}.AI.VectorUnloadAfterUse`,
		category: r(O("cat.search", "Search"), "AI"),
		name: O("setting.ai.vector.unloadAfterUse.name", "Unload AI models after use"),
		tooltip: O("setting.ai.vector.unloadAfterUse.desc", "Unload Majoor SigLIP/X-CLIP/Florence models after heavy AI actions and call torch CUDA cache cleanup. This frees VRAM but makes the next AI action slower."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorUnloadAfterUse ?? !1),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let r = !!(t.ai.vectorUnloadAfterUse ?? !1), i = !!e;
			t.ai.vectorUnloadAfterUse = i, G(t), K(t), n("ai.vectorUnloadAfterUse");
			try {
				let e = await h({ unload_after_use: i });
				if (!e?.ok) {
					t.ai.vectorUnloadAfterUse = r, G(t), K(t), n("ai.vectorUnloadAfterUse"), T(e?.error || "Failed to update model unload setting", "error");
					return;
				}
				T(i ? "AI model unload after use enabled" : "AI model unload after use disabled", "info", 2400);
			} catch (e) {
				t.ai.vectorUnloadAfterUse = r, G(t), K(t), n("ai.vectorUnloadAfterUse"), T(e?.message || "Failed to update model unload setting", "error");
			}
		}
	}), e({
		id: `${Rn}.AI.VectorUnloadNow`,
		category: r(O("cat.search", "Search"), "AI"),
		name: O("setting.ai.vector.unloadNow.name", "Memory purge now"),
		tooltip: O("setting.ai.vector.unloadNow.desc", "Immediately unload Majoor AI vector/caption models, ask ComfyUI to unload loaded models, and clear torch CUDA cache when idle."),
		type: "combo",
		options: ["Idle", "Unload now"],
		defaultValue: "Idle",
		onChange: async (e) => {
			if (String(e || "") === "Unload now") try {
				let e = await b();
				T(e?.ok ? "Majoor AI model cache unloaded" : e?.error || "Failed to unload Majoor AI model cache", e?.ok ? "info" : "error", 2600);
			} catch (e) {
				T(e?.message || "Failed to unload Majoor AI model cache", "error");
			}
		}
	}), e({
		id: `${Rn}.Search.MaxResults`,
		category: r(O("cat.search", "Search")),
		name: O("setting.search.maxResults.name", "Max search results (client)"),
		tooltip: O("setting.search.maxResults.desc", "Maximum number of results requested per search. The backend still enforces MAJOOR_SEARCH_MAX_LIMIT; increase that env var if you need a higher hard cap."),
		type: "number",
		defaultValue: Number(t.search?.maxResults || A.SEARCH_DEFAULT_LIMIT),
		attrs: {
			min: 10,
			max: A.MAX_PAGE_SIZE || 2e3,
			step: 1
		},
		onChange: (e) => {
			t.search = t.search || {}, t.search.maxResults = Math.max(10, Math.min(A.MAX_PAGE_SIZE || 2e3, Number(e) || A.SEARCH_DEFAULT_LIMIT)), G(t), K(t), n("search.maxResults");
		}
	}), e({
		id: `${Rn}.EnvVars.Reference`,
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
			"MJR_AM_VECTOR_INDEX_ON_SCAN - Compute vectors during scans: 1|0 (default: 0)",
			"MJR_AM_VECTOR_CAPTION_ON_INDEX - Generate Florence captions during vector indexing: 1|0 (default: 0)",
			"MJR_VECTOR_CONCURRENCY - Concurrent vector workers (default: 2, use 1 for lower VRAM spikes)",
			"MJR_AM_VECTOR_UNLOAD_AFTER_USE - Unload Majoor AI models after heavy vector actions: 1|0 (default: 0)",
			"MAJOOR_SEARCH_MAX_LIMIT - Max search results (default: 500)",
			"MAJOOR_BG_SCAN_ON_LIST - Scan on directory list: 0|1 (default: 0)"
		].join("\n"),
		type: "text",
		defaultValue: "Hover for full list of environment variables"
	});
}
//#endregion
//#region ui/app/settings/SettingsPanel.ts
var Vn = "Majoor Assets Manager", Hn = /^\s*Majoor:\s*/i, Un = Object.freeze({
	ASSETS_PANEL: "Assets Panel",
	GENERATED_FEED: "Generated Feed",
	VIEWER: "Viewer & Floating Viewer",
	INDEXING: "Indexing & Watcher",
	SEARCH_AI: "Search & AI",
	GENERAL: "General",
	ADVANCED: "Advanced",
	SECURITY: "Security"
}), Wn = new Set([
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
]), Gn = "Majoor.General.ResetAllSettings", Kn = "mjr-settings-reset-btn", qn = null, Jn = null;
function Yn(e) {
	let t = String(e || "").trim();
	return !t || t === Gn || t === "Majoor.Language" ? Un.GENERAL : /^Majoor\.(Safety|Security)\./.test(t) ? Un.SECURITY : /^Majoor\.(Paths|Db|ProbeBackend|MetadataFallback|Observability)\./.test(t) || t === "Majoor.EnvVars.Reference" ? Un.ADVANCED : /^Majoor\.(Viewer|WorkflowMinimap)\./.test(t) ? Un.VIEWER : /^Majoor\.Feed\./.test(t) ? Un.GENERATED_FEED : /^Majoor\.(AutoScan|Scan|Watcher|ExecutionGrouping|RatingTagsSync)\./.test(t) || t === "Majoor.RtHydrate.Concurrency" ? Un.INDEXING : /^Majoor\.AI\.(HuggingFaceTokenVisible|HuggingFaceToken|VerboseLogs|VectorStats|VectorBackfillAction|VectorSearchEnabled|VectorCaptionOnIndex|VectorIndexOnScan|VectorConcurrency|VectorUnloadAfterUse|VectorUnloadNow)$/.test(t) || /^Majoor\.Search\./.test(t) ? Un.SEARCH_AI : /^Majoor\.(Grid|Cards|Badges|Sidebar|InfiniteScroll|General)\./.test(t) ? Un.ASSETS_PANEL : Un.GENERAL;
}
function Xn(e) {
	let t = Array.isArray(e?.category) ? e.category.filter(Boolean) : [], n = Yn(e?.id), r = String(t[1] || t[0] || "").trim(), i = String(t[2] || "").trim(), a = String(e?.name || "").replace(Hn, "").trim();
	return [
		Vn,
		n,
		i || r || a || n
	];
}
var Zn = !1, Qn = null, $n = null, er = !1, tr = /* @__PURE__ */ new Set();
function nr(e) {
	if (!e || typeof e != "object") return null;
	let t = { ...e };
	try {
		typeof t.name == "string" && (t.name = t.name.replace(Hn, "").trim());
	} catch (e) {
		console.debug?.(e);
	}
	try {
		t.category = Xn(t);
	} catch {
		t.category = [Vn, Un.GENERAL];
	}
	return !t.tooltip && typeof t.name == "string" && t.name.trim() && (t.tooltip = t.name.trim()), t;
}
function rr(e, t, n) {
	let r = String(t?.id || "").trim();
	if (!r || tr.has(r)) return !1;
	tr.add(r);
	try {
		return Ee(e, r, n);
	} finally {
		tr.delete(r);
	}
}
function ir(e, t) {
	if (!t || typeof t != "object") return t;
	let n = { ...t };
	rr(e, n, n.defaultValue);
	let r = n.onChange;
	return n.onChange = (t, ...i) => {
		if (rr(e, n, t), typeof r == "function") return r(t, ...i);
		n.defaultValue = t;
	}, n;
}
function ar(e) {
	try {
		return JSON.parse(JSON.stringify(e || {}));
	} catch {
		return { ...W };
	}
}
function or(e, t, n, { wrapForComfy: r = !0 } = {}) {
	let i = [], a = (e) => {
		let n = nr(e);
		n && i.push(r ? ir(t, n) : n);
	};
	return sn(a, e, n), gn(a, e, n), un(a, e, n), pn(a, e, n), Fn(a, e, n), Ln(a, e, n, t), Bn(a, e, n), i;
}
function sr(e, t) {
	if (e === t) return !0;
	try {
		return JSON.stringify(e) === JSON.stringify(t);
	} catch {
		return !1;
	}
}
function cr(e) {
	return e ? e.querySelector(".form-input") || e.querySelector(".p-inputgroup") || e.querySelector(".setting-input") || e.querySelector("[class*='input']") : null;
}
function lr(e, t) {
	let n = document.createElement("button");
	return n.type = "button", n.className = Kn, n.textContent = e, n.title = t, n.style.marginLeft = "8px", n.style.minWidth = e.length > 2 ? "auto" : "24px", n.style.height = "24px", n.style.padding = e.length > 2 ? "0 10px" : "0", n.style.borderRadius = "6px", n.style.border = "1px solid var(--border-color, #555)", n.style.background = "var(--comfy-input-bg, #2b2b2b)", n.style.color = "var(--input-text, inherit)", n.style.cursor = "pointer", n.style.fontSize = "12px", n.style.lineHeight = "22px", n.style.flexShrink = "0", n;
}
function ur(e, t, n) {
	String(e?.id || "").trim() && (rr(n, e, t), typeof e?.onChange == "function" && e.onChange(t));
}
function dr(e, t, n, r) {
	let i = !sr(De(r, t.id, t.defaultValue), n);
	e.disabled = !i, e.style.opacity = i ? "1" : "0.45";
}
function fr() {
	if (typeof document > "u" || !Jn) return;
	let { app: e, definitions: t, defaultValues: n } = Jn, r = document.querySelector(`[data-setting-id="${Gn}"]`), i = cr(r);
	if (r && i && !r.getAttribute("data-mjr-reset-injected")) {
		r.setAttribute("data-mjr-reset-injected", "true"), i.innerHTML = "";
		let a = lr("Reset all settings", "Reset all Majoor settings to defaults");
		a.onclick = (r) => {
			r.preventDefault(), r.stopPropagation();
			for (let r of t) r.id !== Gn && n.has(r.id) && ur(r, n.get(r.id), e);
			fr();
		}, i.appendChild(a);
	}
	for (let r of t) {
		if (!r?.id || r.id === Gn || !n.has(r.id)) continue;
		let t = document.querySelector(`[data-setting-id="${r.id}"]`);
		if (!t || t.getAttribute("data-mjr-reset-injected")) continue;
		let i = cr(t);
		if (!i) continue;
		t.setAttribute("data-mjr-reset-injected", "true");
		let a = lr("Reset", "Reset this setting to default");
		dr(a, r, n.get(r.id), e), a.onclick = (t) => {
			t.preventDefault(), t.stopPropagation();
			let i = n.get(r.id);
			ur(r, i, e), dr(a, r, i, e);
		}, i.appendChild(a);
	}
}
function pr(e, t, n) {
	typeof document > "u" || typeof MutationObserver > "u" || (Jn = {
		app: e,
		definitions: t,
		defaultValues: new Map(n.filter((e) => e?.id && e.id !== Gn).map((e) => [e.id, e.defaultValue]))
	}, fr(), !qn && (qn = new MutationObserver(() => fr()), qn.observe(document.body, {
		childList: !0,
		subtree: !0
	})));
}
function mr(e, t, { initRuntime: n = !1 } = {}) {
	if ($n) typeof t == "function" && $n.onAppliedListeners.add(t), e && !$n.app && ($n.app = e);
	else {
		let n = Ut();
		n.i18n = n.i18n || {}, typeof n.i18n.followComfyLanguage == "boolean" ? Ae(!!n.i18n.followComfyLanguage) : (n.i18n.followComfyLanguage = !0, Ae(!0), G(n));
		let r = /* @__PURE__ */ new Set();
		typeof t == "function" && r.add(t);
		let i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set(), o = () => {
			if (!i.size) return;
			let e = Array.from(i);
			i.clear();
			for (let t of e) We("mjr-settings-changed", { key: t }, { warnPrefix: "[Majoor]" });
		}, s = () => {
			if (!a.size) return;
			let e = Array.from(a);
			a.clear();
			for (let t of e) We("mjr-settings-changed", { key: t }, { warnPrefix: "[Majoor]" });
		}, c = an(o, 120), l = an(s, 450), u = (e) => {
			typeof e == "string" && i.add(e), c();
		}, d = (e) => {
			typeof e == "string" && a.add(e), l();
		}, f = () => {
			let e = Ut();
			Object.assign(n, e), K(n), u("storage");
		}, p = (e) => {
			!e || e.key !== "mjrSettings" || e.newValue !== e.oldValue && f();
		};
		if (!Zn) {
			if (Qn && typeof window < "u") try {
				window.removeEventListener("storage", Qn);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				window.addEventListener("storage", p), Zn = !0, Qn = p;
			} catch (e) {
				console.debug?.(e);
			}
		}
		$n = {
			app: e,
			notifyApplied: (e) => {
				for (let t of r) try {
					t(n, e);
				} catch (e) {
					console.debug?.(e);
				}
				Wn.has(String(e || "")) ? d(e) : u(e);
			},
			onAppliedListeners: r,
			refreshFromStorage: f,
			settings: n
		};
	}
	if (n && !er) {
		let t = e || $n.app, n = $n.settings;
		Re(t), K(n), Fe(t), Wt(), Gt(), Kt(), n?.watcher && typeof n.watcher.enabled == "boolean" && f(!!n.watcher.enabled).catch(() => {}), nn(), er = !0;
	}
	return $n;
}
var hr = (e, t) => mr(e, t, { initRuntime: !0 }).settings, gr = (e, t) => {
	let n = mr(e, t, { initRuntime: !1 });
	Object.assign(n.settings, Ut());
	let r = e || n.app, i = or(n.settings, r, n.notifyApplied), a = or(ar(W), r, () => {}, { wrapForComfy: !1 });
	return i.unshift(ir(r, {
		id: Gn,
		category: [
			Vn,
			Un.GENERAL,
			"Reset"
		],
		name: "Reset all settings to defaults",
		tooltip: "Reset every Majoor Assets Manager setting to its default value.",
		type: "text",
		defaultValue: ""
	})), pr(r, i, a), i;
};
try {
	let e = Ut();
	e?.watcher && typeof e.watcher.enabled == "boolean" && me().then((e) => {
		let t = !!e?.ok && !!e?.data?.enabled, n = Ut();
		n.watcher = n.watcher || {}, typeof t == "boolean" && t !== !!n.watcher.enabled && (n.watcher.enabled = t, G(n), We("mjr-settings-changed", { key: "watcher.enabled" }, { warnPrefix: "[Majoor]" }));
	}).catch(() => {});
} catch (e) {
	console.debug?.(e);
}
//#endregion
//#region ui/features/contextmenu/gridContextMenuState.ts
function _r() {
	return {
		open: !1,
		x: 0,
		y: 0,
		items: [],
		title: ""
	};
}
var Y = Ct({
	portalOwnerId: "",
	mountedPortalIds: [],
	main: _r(),
	submenu: _r(),
	tags: {
		open: !1,
		x: 0,
		y: 0,
		asset: null,
		onChanged: null
	}
}), vr = 1;
function yr(e) {
	e && (e.open = !1, e.x = 0, e.y = 0, e.items = [], e.title = "");
}
function br(e = "") {
	try {
		window.dispatchEvent(new CustomEvent("mjr-close-all-menus", { detail: { source: String(e || "") } }));
	} catch (e) {
		console.debug?.(e);
	}
}
function xr() {
	let e = `mjr-grid-context-menu-portal-${vr++}`;
	return Y.mountedPortalIds.push(e), Y.portalOwnerId ||= e, e;
}
function Sr(e) {
	let t = Y.mountedPortalIds.filter((t) => t !== e);
	Y.mountedPortalIds.splice(0, Y.mountedPortalIds.length, ...t), Y.portalOwnerId === e && (Y.portalOwnerId = Y.mountedPortalIds[0] || "");
}
function Cr(e) {
	return String(Y.portalOwnerId || "") === String(e || "");
}
function wr({ x: e = 0, y: t = 0, items: n = [], title: r = "" } = {}) {
	br("grid"), kr(), Dr(), Y.main.open = !0, Y.main.x = Number(e) || 0, Y.main.y = Number(t) || 0, Y.main.items = Array.isArray(n) ? n.filter(Boolean) : [], Y.main.title = String(r || "");
}
function Tr() {
	yr(Y.main), Dr();
}
function Er({ x: e = 0, y: t = 0, items: n = [], title: r = "" } = {}) {
	Y.submenu.open = !0, Y.submenu.x = Number(e) || 0, Y.submenu.y = Number(t) || 0, Y.submenu.items = Array.isArray(n) ? n.filter(Boolean) : [], Y.submenu.title = String(r || "");
}
function Dr() {
	yr(Y.submenu);
}
function Or({ x: e = 0, y: t = 0, asset: n = null, onChanged: r = null } = {}) {
	Tr(), Y.tags.open = !!n, Y.tags.x = Number(e) || 0, Y.tags.y = Number(t) || 0, Y.tags.asset = n || null, Y.tags.onChanged = typeof r == "function" ? r : null;
}
function kr() {
	Y.tags.open = !1, Y.tags.x = 0, Y.tags.y = 0, Y.tags.asset = null, Y.tags.onChanged = null;
}
function Ar() {
	Tr(), kr();
}
//#endregion
//#region ui/features/dnd/utils/constants.ts
var jr = "application/x-mjr-asset", Mr = "application/x-mjr-assets", Nr = "application/x-comfy-asset-info", Pr = new Set([
	".png",
	".jpg",
	".jpeg",
	".webp",
	".gif",
	".bmp",
	".avif",
	".jxl"
]), Fr = new Set([
	".mp4",
	".mov",
	".mkv",
	".webm",
	".avi"
]), Ir = new Set([
	".wav",
	".mp3",
	".flac",
	".ogg",
	".m4a",
	".aac",
	".opus"
]), Lr = new Set([
	".obj",
	".fbx",
	".glb",
	".gltf",
	".stl",
	".ply",
	".splat",
	".ksplat",
	".spz"
]), Rr = (e) => {
	if (!e) return !1;
	let t = e.lastIndexOf(".");
	return t === -1 ? !1 : Pr.has(e.slice(t).toLowerCase());
}, zr = (e) => e ? String(e.kind || "").toLowerCase() === "image" ? !0 : Rr(e.filename) : !1, Br = (e) => {
	if (!e) return !1;
	let t = e.lastIndexOf(".");
	return t === -1 ? !1 : Fr.has(e.slice(t).toLowerCase());
}, Vr = (e) => e ? String(e.kind || "").toLowerCase() === "video" ? !0 : Br(e.filename) : !1, Hr = (e) => {
	if (!e) return !1;
	let t = e.lastIndexOf(".");
	return t === -1 ? !1 : Ir.has(e.slice(t).toLowerCase());
}, Ur = (e) => e ? String(e.kind || "").toLowerCase() === "audio" ? !0 : Hr(e.filename) : !1, Wr = (e) => {
	if (!e) return !1;
	let t = e.lastIndexOf(".");
	return t === -1 ? !1 : Lr.has(e.slice(t).toLowerCase());
}, Gr = (e) => e ? String(e.kind || "").toLowerCase() === "model3d" ? !0 : Wr(e.filename) : !1, Kr = (e) => zr(e) || Vr(e) || Ur(e) || Gr(e) || String(e?.kind || "").toLowerCase() === "workflow", qr = {
	mp4: "video/mp4",
	mov: "video/quicktime",
	webm: "video/webm",
	mkv: "video/x-matroska",
	glb: "model/gltf-binary",
	gltf: "model/gltf+json",
	obj: "model/obj",
	stl: "model/stl",
	ply: "application/ply"
}, Jr = (e) => qr[String(e || "").split(".").pop()?.toLowerCase()] ?? "application/octet-stream", Yr = (e, t) => {
	if (typeof e != "string") return !1;
	let n = e.trim().toLowerCase();
	if (!n) return !1;
	let r = (n.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
	return r ? t && r === String(t).toLowerCase() ? !0 : Fr.has(`.${r}`) : !1;
}, Xr = (e, t, n) => {
	if (!e || e.type !== "combo" || !e.options) return !1;
	let r = Array.isArray(e.options.values) && e.options.values || e.options.values && Array.isArray(e.options.values.values) && e.options.values.values || null;
	return Array.isArray(r) ? r.some((e) => n(typeof e == "string" ? e : e?.content ?? e?.value ?? e?.text, t)) : !1;
}, Zr = (e, t) => Xr(e, t, Yr), Qr = (e, t) => {
	if (typeof e != "string") return !1;
	let n = e.trim().toLowerCase();
	if (!n) return !1;
	let r = (n.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
	return r ? t && r === String(t).toLowerCase() ? !0 : Pr.has(`.${r}`) : !1;
}, $r = (e, t) => Xr(e, t, Qr), ei = (e, t) => {
	if (typeof e != "string") return !1;
	let n = e.trim().toLowerCase();
	if (!n) return !1;
	let r = (n.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
	return r ? t && r === String(t).toLowerCase() ? !0 : Ir.has(`.${r}`) : !1;
}, ti = (e, t) => Xr(e, t, ei), ni = (e, t) => {
	if (typeof e != "string") return !1;
	let n = e.trim().toLowerCase();
	if (!n) return !1;
	let r = (n.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
	return r ? t && r === String(t).toLowerCase() ? !0 : Lr.has(`.${r}`) : !1;
}, ri = (e, t) => Xr(e, t, ni), ii = /* @__PURE__ */ new WeakMap(), ai = (e) => {
	if (!e || typeof e != "object") return {
		node: null,
		prev: null
	};
	let t = ii.get(e);
	return t || (t = {
		node: null,
		prev: null
	}, ii.set(e, t)), t;
}, oi = (e, t, n) => {
	let r = e?.canvas?.canvas || document.querySelector("canvas"), i = e?.canvas?.graph, a = e?.canvas?.ds;
	if (!r || !i || !a) return null;
	let o = r.getBoundingClientRect();
	if (t < o.left || t > o.right || n < o.top || n > o.bottom) return null;
	let s = Number(a.scale) || 1, c = a.offset || [0, 0], l = Array.isArray(c) ? Number(c[0]) || 0 : Number(c?.x) || 0, u = Array.isArray(c) ? Number(c[1]) || 0 : Number(c?.y) || 0, d = (t - o.left) / s - l, f = (n - o.top) / s - u;
	if (typeof i.getNodeOnPos == "function") return i.getNodeOnPos(d, f);
	let p = i._nodes || [];
	for (let e = p.length - 1; e >= 0; e--) {
		let t = p[e];
		if (!t?.pos || !t?.size) continue;
		let n = t.size[0], r = t.size[1];
		if (t.flags && t.flags.collapsed && (r = 30), d >= t.pos[0] && f >= t.pos[1] && d <= t.pos[0] + n && f <= t.pos[1] + r) return t;
	}
	return null;
}, si = (e, t, n) => {
	let r = ai(e);
	!t || r.node === t || (ci(e, n), r.node = t, r.prev = {
		color: t.color,
		bgcolor: t.bgcolor
	}, t.bgcolor = "#3355ff", t.color = "#a9c4ff", n(e));
}, ci = (e, t) => {
	let n = ai(e);
	if (n.node) {
		try {
			n.prev && (n.node.color = n.prev.color, n.node.bgcolor = n.prev.bgcolor);
		} catch (e) {
			console.debug?.(e);
		}
		n.node = null, n.prev = null, t(e);
	}
}, li = (e, t) => {
	if (!e || e.type !== "combo" || !e.options) return;
	let n = e.options.values, r = e.options;
	if (typeof n != "function") {
		if (!Array.isArray(n)) if (n && typeof n == "object" && Array.isArray(n.values)) r = n, n = n.values;
		else return;
		n.some((e) => typeof e == "string" ? e === t : (e?.content ?? e?.value ?? e?.text) === t) || (n.length === 0 || typeof n[0] == "string" ? n.unshift(t) : n.unshift({
			content: t,
			text: t,
			value: t
		}), r.values = n);
	}
}, ui = new Set([
	"number",
	"int",
	"float",
	"boolean",
	"toggle",
	"checkbox",
	"button",
	"hidden"
]), di = [
	"output",
	"save",
	"export",
	"folder",
	"dir"
], fi = ["file", "path"], pi = [
	"path",
	"file",
	"input",
	"src",
	"source"
], mi = (e, t, n) => {
	let r = e?.widgets;
	if (!Array.isArray(r) || !r.length) return null;
	let i = String(t || "").toLowerCase().replace(/^\./, ""), a = String(e?.type || "").toLowerCase(), o = n.knownNodeIncludes.some((e) => a.includes(e)), s = [];
	for (let e of r) {
		if (!e) continue;
		let t = String(e?.type || "").toLowerCase(), r = e?.value;
		if (ui.has(t) || typeof r == "number" || typeof r == "boolean") continue;
		let a = t === "text" || t === "string" || t === "combo", c = typeof e?.callback == "function" && typeof r == "string";
		if (!a && !c) continue;
		let l = String(e?.name || e?.label || "").toLowerCase().trim(), u = 0;
		n.exactNames.has(l) && (u += 100), l === "file" && o && t === "combo" && n.comboChecker(e, i) && (u += 100);
		let d = n.mediaTerms.some((e) => l.includes(e)), f = pi.some((e) => l.includes(e));
		d && f && (u += 80), fi.some((e) => l.includes(e)) && (u += 35);
		for (let { terms: e, score: t } of n.extraTerms) e.some((e) => l.includes(e)) && (u += t);
		di.some((e) => l.includes(e)) && (u -= 90), n.exactSingleNames.has(l) && (typeof r == "string" && r.trim() === "" || n.looksLikeFn(r, i) ? u += 25 : u -= 10), o && (u += 15);
		let p = typeof r == "string" && r.trim() === "";
		p && (u += 3), t === "combo" && n.comboChecker(e, i) && (u += 12), s.push({
			w: e,
			score: u,
			emptyValue: p,
			combo: t === "combo"
		});
	}
	if (!s.length) return null;
	s.sort((e, t) => t.score === e.score ? t.emptyValue === e.emptyValue ? t.combo === e.combo ? 0 : t.combo ? 1 : -1 : t.emptyValue ? 1 : -1 : t.score - e.score);
	let c = s[0];
	if (!c || c.score < 20) return null;
	try {
		c.w[n.scoreKey] = c.score;
	} catch (e) {
		console.debug?.(e);
	}
	return c.w;
}, hi = {
	exactNames: new Set([
		"video_path",
		"input_video",
		"source_video",
		"video",
		"driven_video",
		"footage",
		"input_path",
		"directory",
		"folder_path",
		"folder",
		"path",
		"video_directory"
	]),
	knownNodeIncludes: [
		"loadvideo",
		"vhs_loadvideo",
		"videoloader",
		"sadtalker",
		"wav2lip",
		"reactor",
		"multiimageloader",
		"ltxdirector",
		"ltxsequencer",
		"ltxkeyframer"
	],
	mediaTerms: [
		"video",
		"footage",
		"clip",
		"movie"
	],
	extraTerms: [{
		terms: [
			"media",
			"clip",
			"footage",
			"drive"
		],
		score: 45
	}],
	exactSingleNames: new Set(["video"]),
	looksLikeFn: Yr,
	comboChecker: Zr,
	scoreKey: "__mjrVideoPickScore"
}, gi = {
	exactNames: new Set([
		"image",
		"image_path",
		"input_image",
		"source_image",
		"ref_image",
		"pose_image",
		"hint_image",
		"target_image",
		"ipadapter_image",
		"input_path",
		"directory",
		"folder_path",
		"folder",
		"path",
		"image_directory"
	]),
	knownNodeIncludes: [
		"loadimage",
		"loadimagemask",
		"imageloader",
		"reactor",
		"roop",
		"ipadapter",
		"controlnet",
		"instantid",
		"pulid",
		"multiimageloader",
		"ltxdirector",
		"ltxsequencer",
		"ltxkeyframer"
	],
	mediaTerms: [
		"image",
		"img",
		"mask",
		"frame",
		"photo",
		"picture",
		"face",
		"ipadapter"
	],
	extraTerms: [{
		terms: [
			"media",
			"source",
			"first",
			"last",
			"target",
			"reference"
		],
		score: 35
	}],
	exactSingleNames: new Set(["image", "face"]),
	looksLikeFn: Qr,
	comboChecker: $r,
	scoreKey: "__mjrImagePickScore"
}, _i = {
	exactNames: new Set([
		"audio_path",
		"input_audio",
		"source_audio",
		"audio",
		"driven_audio",
		"voice",
		"bgm",
		"soundtrack",
		"input_path",
		"directory",
		"folder_path",
		"folder",
		"path",
		"audio_directory"
	]),
	knownNodeIncludes: [
		"loadaudio",
		"vhs_loadaudioupload",
		"vhs_loadaudio",
		"audioloader",
		"inputaudio",
		"sadtalker",
		"wav2lip",
		"multiimageloader",
		"ltxdirector",
		"ltxsequencer",
		"ltxkeyframer"
	],
	mediaTerms: [
		"audio",
		"sound",
		"music",
		"voice",
		"speech",
		"wav",
		"mp3"
	],
	extraTerms: [{
		terms: [
			"media",
			"track",
			"drive"
		],
		score: 45
	}],
	exactSingleNames: new Set(["audio", "voice"]),
	looksLikeFn: ei,
	comboChecker: ti,
	scoreKey: "__mjrAudioPickScore"
}, vi = {
	exactNames: new Set([
		"model_path",
		"input_model",
		"source_model",
		"mesh_path",
		"input_mesh",
		"geometry_path",
		"scene_path",
		"point_cloud_path",
		"splat_path",
		"model",
		"mesh",
		"geometry",
		"input_path",
		"directory",
		"folder_path",
		"folder",
		"path",
		"model_directory"
	]),
	knownNodeIncludes: [
		"load3d",
		"loadmodel",
		"loadmesh",
		"loadobj",
		"loadgltf",
		"loadglb",
		"loadstl",
		"loadply",
		"pointcloud",
		"meshloader",
		"modelloader",
		"tripo3d",
		"unique3d",
		"multiimageloader",
		"ltxdirector",
		"ltxsequencer",
		"ltxkeyframer"
	],
	mediaTerms: [
		"model",
		"mesh",
		"geometry",
		"scene",
		"object",
		"point",
		"cloud",
		"splat"
	],
	extraTerms: [{
		terms: ["asset", "resource"],
		score: 30
	}],
	exactSingleNames: new Set([
		"model",
		"mesh",
		"geometry"
	]),
	looksLikeFn: ni,
	comboChecker: ri,
	scoreKey: "__mjrModel3DPickScore"
}, yi = (e, t, n) => {
	let r = String(t?.kind || "").toLowerCase();
	return mi(e, n, r === "model3d" ? vi : r === "audio" ? _i : r === "image" ? gi : hi);
}, bi = (e, t, n, r) => {
	if (!t || !t.inputs || !t.inputs.length) return null;
	let i = e?.canvas?.canvas || document.querySelector("canvas"), a = e?.canvas?.ds;
	if (!i || !a) return null;
	let o = i.getBoundingClientRect(), s = Number(a.scale) || 1, c = a.offset || [0, 0], l = Array.isArray(c) ? Number(c[0]) || 0 : Number(c?.x) || 0, u = Array.isArray(c) ? Number(c[1]) || 0 : Number(c?.y) || 0, d = (n - o.left) / s - l, f = (r - o.top) / s - u, p = t.pos[0], m = t.pos[1], h = t.constructor.title_height || 30;
	for (let e = 0; e < t.inputs.length; e++) {
		let n = t.inputs[e], r = m + h + e * 20 + 20 / 2, i = d - p, a = f - r;
		if (Math.abs(i) <= 18 && Math.abs(a) <= 12) return {
			index: e,
			input: n
		};
	}
	return null;
}, xi = (e) => {
	let t = e?.canvas?.canvas || document.querySelector("canvas");
	return t ? t.getBoundingClientRect() : null;
}, Si = (e, t) => {
	let n = xi(e);
	if (!n) return !1;
	let r = t.clientX, i = t.clientY;
	return r >= n.left && r <= n.right && i >= n.top && i <= n.bottom;
}, Ci = (e) => {
	try {
		e?.graph?.setDirtyCanvas?.(!0, !0);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e?.canvas?.setDirty?.(!0, !0);
	} catch (e) {
		console.debug?.(e);
	}
}, wi = (e) => {
	let t = String(e?.filename || ""), n = t.lastIndexOf(".");
	return n >= 0 ? t.slice(n).toLowerCase() : "";
}, Ti = (e) => {
	let t = String(e?.kind || "").toLowerCase(), n = wi(e);
	return t === "image" || Pr.has(n) ? ["LoadImage"] : t === "video" || Fr.has(n) ? [
		"LoadVideo",
		"VHS_LoadVideo",
		"VideoLoader"
	] : t === "audio" || Ir.has(n) ? [
		"LoadAudio",
		"VHS_LoadAudioUpload",
		"VHS_LoadAudio",
		"AudioLoader"
	] : t === "model3d" || Lr.has(n) ? [
		"Load3D",
		"LoadModel",
		"LoadMesh",
		"LoadGLB",
		"LoadOBJ",
		"LoadSTL",
		"LoadPLY"
	] : [];
}, Ei = (e, t) => {
	if (e) {
		e.type === "combo" && li(e, t), e.value = t;
		try {
			e.callback?.(e.value);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			typeof e.onchange == "function" && e.onchange(t);
		} catch (e) {
			console.debug?.(e);
		}
	}
}, Di = (e) => {
	let t = e?.canvas?.canvas || document.querySelector("canvas"), n = t?.getBoundingClientRect?.(), r = n ? Number(n.width || n.right - n.left) : 0, i = n ? Number(n.height || n.bottom - n.top) : 0, a = Number(r || t?.width || 800), o = Number(i || t?.height || 600);
	if (!n) return [Math.max(0, a / 2), Math.max(0, o / 2)];
	let s = n && Number(n.left) || 0, c = n && Number(n.top) || 0;
	return Oi(e, s + Math.max(0, a / 2), c + Math.max(0, o / 2));
}, Oi = (e, t, n) => {
	let r = (e?.canvas?.canvas || document.querySelector("canvas"))?.getBoundingClientRect?.(), i = e?.canvas?.ds || {}, a = Number(i.scale) || 1, o = i.offset || [0, 0], s = Array.isArray(o) ? Number(o[0]) || 0 : Number(o?.x) || 0, c = Array.isArray(o) ? Number(o[1]) || 0 : Number(o?.y) || 0;
	return !r || !Number.isFinite(Number(t)) || !Number.isFinite(Number(n)) ? Di(e) : [(Number(t) - r.left) / a - s, (Number(n) - r.top) / a - c];
}, ki = (e, t = null) => {
	if (Number.isFinite(Number(t?.clientX)) && Number.isFinite(Number(t?.clientY))) return Oi(e, t.clientX, t.clientY);
	try {
		let n = e?.canvas?.convertEventToCanvasOffset?.(t);
		if (Array.isArray(n)) return [Number(n[0]) || 0, Number(n[1]) || 0];
	} catch (e) {
		console.debug?.(e);
	}
	return Oi(e, t?.clientX, t?.clientY);
}, Ai = ({ app: e, payload: t, relativePath: n, event: r = null, droppedExt: i = "", position: a = null }) => {
	let o = e?.graph ?? e?.canvas?.graph ?? null;
	if (!o || typeof o.add != "function") return !1;
	let s = null;
	for (let n of Ti(t)) try {
		if (s = ze(n, e), s) break;
	} catch (e) {
		console.debug?.(e);
	}
	if (!s) return !1;
	s.pos = Array.isArray(a) ? [Number(a[0]) || 0, Number(a[1]) || 0] : ki(e, r), o.add(s);
	let c = yi(s, t, i);
	return c && Ei(c, n), Ci(e), !0;
}, ji = ({ app: e, items: t = [], event: n = null, gap: r = 90 }) => {
	let i = Array.isArray(t) ? t.filter(Boolean) : [];
	if (!i.length) return 0;
	let a = ki(e, n), o = 0;
	for (let t of i) Ai({
		app: e,
		payload: t.payload,
		relativePath: t.relativePath,
		event: n,
		droppedExt: t.droppedExt,
		position: [a[0] + o * Number(r || 90), a[1]]
	}) && (o += 1);
	return o;
}, Mi = Ei, Ni = ({ app: e, payload: t, relativePath: n, targetNode: r, inputSlotIndex: i, event: a = null }) => {
	let o = e?.graph ?? e?.canvas?.graph ?? null;
	if (!o || typeof o.add != "function" || !r) return !1;
	let s = null;
	for (let n of Ti(t)) try {
		if (s = ze(n, e), s) break;
	} catch (e) {
		console.debug?.(e);
	}
	if (!s) return !1;
	let c = Number(r.pos[0]) || 0, l = Number(r.pos[1]) || 0, u = Array.isArray(s.size) && Number(s.size[0]) || 220;
	s.pos = [c - u - 60, l + Number(i) * 20], o.add(s);
	let d = wi(t), f = yi(s, t, d);
	f && Ei(f, n);
	try {
		s.connect(0, r, i);
	} catch (e) {
		console.debug?.(e);
	}
	return Ci(e), !0;
}, Pi = async ({ post: e, endpoint: t, payload: n, index: r = !0, purpose: i = null }) => {
	let a = {
		index: !!r,
		files: [{
			filename: n.filename,
			subfolder: n.subfolder || "",
			dest_subfolder: "",
			type: n.type || "output",
			root_id: Te(n) || void 0
		}]
	};
	return i && (a.purpose = i), e(t, a);
}, Fi = async ({ post: e, endpoint: t, payload: n, index: r = !0, purpose: i = null }) => {
	let a = await Pi({
		post: e,
		endpoint: t,
		payload: n,
		index: r,
		purpose: i
	});
	if (!a?.ok) return console.warn("Majoor: stage-to-input failed", a?.error || a), null;
	let o = Array.isArray(a.data?.staged) ? a.data.staged[0] : null;
	return o ? {
		relativePath: (o?.subfolder ? `${o.subfolder}/${o.name}` : o?.name) || null,
		absPath: o?.path || null,
		name: o?.name || null,
		subfolder: o?.subfolder || ""
	} : null;
}, Ii = async ({ post: e, endpoint: t, payload: n, index: r = !0, purpose: i = null }) => (await Fi({
	post: e,
	endpoint: t,
	payload: n,
	index: r,
	purpose: i
}))?.relativePath || null, Li = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, Ri = /^[0-9a-f]{20,}$/i;
function zi(...e) {
	for (let t of e) {
		let e = String(t || "").trim();
		if (e) return e;
	}
	return "";
}
function Bi(e) {
	let t = String(e || "").trim();
	return !!t && (Li.test(t) || Ri.test(t));
}
function Vi(e) {
	return String(e?.type || e?.class_type || e?.comfyClass || e?.classType || "").trim();
}
function Hi(e) {
	return zi(e?.properties?.subgraph_name, e?.title, e?.properties?.title, e?.properties?.name, e?.properties?.label, e?.name, e?.subgraph?.name, e?.subgraph_instance?.name);
}
function Ui(e) {
	let t = Vi(e), n = Hi(e);
	return n && (!t || Bi(t) || n !== t) ? n : t && !Bi(t) ? t : n || (t ? "Subgraph" : String(e?.id || "Node").trim() || "Node");
}
function Wi(e) {
	let t = Vi(e);
	return t && !Bi(t) ? t : t ? "Subgraph" : "Node";
}
//#endregion
//#region ui/components/sidebar/utils/minimap.ts
var Gi = 6, Ki = 1, qi = 64, Ji = 74, Yi = 42, Xi = [
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
], Zi = (e, t, n) => {
	let r = Number(e);
	return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
}, Qi = (e, t = !1) => {
	let n = String(e || "").toUpperCase();
	return n.includes("IMAGE") ? "rgba(145,198,99,0.9)" : n.includes("LATENT") ? "rgba(89,178,118,0.9)" : n.includes("MODEL") ? "rgba(112,155,255,0.9)" : n.includes("CONDITIONING") ? "rgba(191,123,226,0.9)" : n.includes("CLIP") ? "rgba(220,178,77,0.9)" : n.includes("VAE") ? "rgba(72,184,214,0.9)" : n.includes("MASK") ? "rgba(190,190,190,0.88)" : n.includes("STRING") || n.includes("TEXT") ? "rgba(230,230,230,0.86)" : n.includes("INT") || n.includes("FLOAT") || n.includes("NUMBER") ? "rgba(130,210,220,0.88)" : t ? "rgba(170,220,255,0.82)" : "rgba(255,255,255,0.72)";
}, $i = (e, t, n) => {
	let r = String(t || "").replace(/\s+/g, " ").trim(), i = Math.max(1, Number(n) || 1);
	if (!r || e.measureText(r).width <= i) return r;
	let a = r;
	for (; a.length > 3 && e.measureText(`${a}...`).width > i;) a = a.slice(0, -1);
	return a.length > 3 ? `${a}...` : r.slice(0, 3);
};
function ea(e, t, n = null) {
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
	}, a = i.expandSubgraphs === !1 ? t : ta(t), o = Array.isArray(a?.nodes) ? a.nodes : [], s = Array.isArray(a?.groups) && a.groups || Array.isArray(a?.extra?.groups) && a.extra.groups || Array.isArray(a?.extra?.groupNodes) && a.extra.groupNodes || Array.isArray(a?.extra?.group_nodes) && a.extra.group_nodes || [], c = Array.isArray(a?.links) && a.links || Array.isArray(a?.extra?.links) && a.extra.links || [], l = Math.max(1, e.clientWidth || e.width || 1), u = Math.max(1, e.clientHeight || e.height || 1);
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
		for (let [e, t] of Xi) if (n.includes(e)) return t;
		let r = 0;
		for (let e = 0; e < n.length; e += 1) r = r * 31 + n.charCodeAt(e) | 0;
		return `hsl(${Math.abs(r) % 360} 42% 42%)`;
	}, p = (e) => {
		let t = [], n = e?.inputs && typeof e.inputs == "object" && !Array.isArray(e.inputs) ? e.inputs : null;
		if (n) {
			for (let [e, r] of Object.entries(n)) if (!(Array.isArray(r) || r && typeof r == "object") && (t.push([e, r]), t.length >= 3)) return t;
		}
		let r = Array.isArray(e?.widgets_values) ? e.widgets_values : [], i = Array.isArray(e?.widgets) ? e.widgets : [], a = Array.isArray(e?.inputs) ? e.inputs : [], o = a.filter((e) => e?.widget === !0 || e?.widget && typeof e.widget == "object" || typeof e?.widget == "string" && e.widget.trim()), s = a.filter((e) => e?.link == null && la(e?.type)), c = (o.length ? o : s.length ? s : a).map((e) => String(e?.label || e?.localized_name || e?.name || e?.widget?.name || e?.widget?.label || "").trim());
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
			label: Ui(e).replace(/\s+/g, " ").trim()
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
	let S = Math.max(1, b - v), C = Math.max(1, x - y), ee = v + S / 2, te = y + C / 2, w = i.view && typeof i.view == "object" ? i.view : Object.create(null), T = Zi(w.zoom ?? 1, Ki, qi), E = Math.max(1, S / T), ne = Math.max(1, C / T), re = E / 2, D = ne / 2, ie = E >= S ? ee : Zi(w.centerX ?? ee, v + re, b - re), ae = ne >= C ? te : Zi(w.centerY ?? te, y + D, x - D), oe = ie - re, se = ae - D, ce = Gi, le = Math.min((l - ce * 2) / E, (u - ce * 2) / ne), ue = w.hoveredNodeId !== null && w.hoveredNodeId !== void 0 ? String(w.hoveredNodeId) : null;
	r.clearRect(0, 0, l, u), r.fillStyle = "rgba(0,0,0,0.22)", r.fillRect(0, 0, l, u);
	let de = (e, t) => ({
		x: ce + (e - oe) * le,
		y: ce + (t - se) * le
	}), fe = (e, t) => ({
		x: Zi(oe + (Number(e) - ce) / le, v, b),
		y: Zi(se + (Number(t) - ce) / le, y, x)
	}), pe = (e) => ({
		x: ce + (e.x - oe) * le,
		y: ce + (e.y - se) * le,
		w: Math.max(1, e.w * le),
		h: Math.max(1, e.h * le)
	}), me = (e) => Math.max(10, Math.min(24, Math.floor(Number(e) * .2))), he = (e, t, n) => {
		let r = pe(e), i = me(r.h), a = n === "output" ? e.outputs : e.inputs, o = Math.max(1, Array.isArray(a) ? a.length : Number(e[`${n}Count`]) || 0), s = Zi(t, 0, Math.max(0, o - 1));
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
	} : null, _e = (e) => {
		let t = String(e || "").toUpperCase();
		return t.includes("IMAGE") ? "rgba(145,198,99,0.38)" : t.includes("LATENT") ? "rgba(89,178,118,0.38)" : t.includes("MODEL") ? "rgba(112,155,255,0.38)" : t.includes("CONDITIONING") ? "rgba(191,123,226,0.38)" : t.includes("CLIP") ? "rgba(220,178,77,0.38)" : t.includes("VAE") ? "rgba(72,184,214,0.38)" : t.includes("MASK") ? "rgba(190,190,190,0.36)" : "rgba(255,255,255,0.2)";
	}, ve = () => {
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
				r.strokeStyle = _e(t?.type), r.beginPath(), r.moveTo(l.x, l.y), r.bezierCurveTo(l.x + d, l.y, u.x - d, u.y, u.x, u.y), r.stroke();
			}
			r.restore();
		}
	}, ye = (e) => {
		let { x: t, y: n, w: a, h: o } = pe(e), s = e.kind === "node", c = e.kind === "group", l = !!e.bypassed, u = !!e.errored, f = c ? .18 : l && i.renderBypassState ? .14 : .62, p = c ? .55 : l && i.renderBypassState ? .32 : .8, m = d(e.fill, f), h = d(e.stroke, p), g = s && i.showNodeLabels && a >= Ji && o >= Yi, _ = Math.max(2, Math.min(g ? 7 : 8, Math.floor(Math.min(a, o) * .08))), v = s ? me(o) : 0;
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
				r.fillStyle = Qi(e.inputs?.[i]?.type, !1), r.beginPath(), r.arc(t, n, g ? 3 : 2.2, 0, Math.PI * 2), r.fill(), r.stroke();
			}
			for (let n = 0; n < i; n += 1) {
				let i = he(e, n, "output");
				r.fillStyle = Qi(e.outputs?.[n]?.type, !0), r.beginPath(), r.arc(t + a, i, g ? 3 : 2.2, 0, Math.PI * 2), r.fill(), r.stroke();
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
				s && r.fillText($i(r, s, i), t + 7, he(e, a, "input") + n * .35, i);
			}
			for (let o = 0; o < Math.min(8, e.outputs?.length || 0); o += 1) {
				let s = e.outputs[o], c = String(s?.label || s?.localized_name || s?.name || "").trim();
				if (!c) continue;
				let l = $i(r, c, i);
				r.fillText(l, t + a - 7 - Math.min(i, r.measureText(l).width), he(e, o, "output") + n * .35, i);
			}
			r.restore();
		}
	};
	for (let e of m.filter((e) => e.kind === "group")) ye(e);
	ve();
	for (let e of m.filter((e) => e.kind === "node")) ye(e);
	if (i.showViewport) try {
		let e = Oe();
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
			height: C
		},
		resolvedView: {
			zoom: T,
			centerX: ie,
			centerY: ae,
			visibleW: E,
			visibleH: ne,
			viewMinX: oe,
			viewMinY: se,
			pad: ce,
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
function ta(e, t = null) {
	if (!e || typeof e != "object") return e;
	let n = Array.isArray(e.nodes) ? e.nodes.filter(Boolean) : [], r = na(e, t);
	if (!n.length) return e;
	let i = [], a = Array.isArray(e.links) ? [...e.links] : [], o = [...Array.isArray(e.groups) ? e.groups : [], ...Array.isArray(e.extra?.groups) ? e.extra.groups : []];
	for (let e of n) {
		i.push(e);
		let t = ra(e, r);
		if (!t || !Array.isArray(t.nodes) || !t.nodes.length) continue;
		let n = aa(e, ta(t, r));
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
function na(e, t = null) {
	let n = [
		...Array.isArray(e?.definitions?.subgraphs) ? e.definitions.subgraphs : [],
		...Array.isArray(e?.subgraphs) ? e.subgraphs : [],
		...Array.isArray(e?.rootGraph?.subgraphs) ? e.rootGraph.subgraphs : []
	], r = new Map(t || []);
	for (let e of n) for (let t of ia(e)) t != null && r.set(String(t), e);
	return r;
}
function ra(e, t) {
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
function ia(e) {
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
function aa(e, t) {
	let n = String(e?.id ?? e?.ID ?? ""), r = sa(e?.pos) || [0, 0], i = ca(e?.size) || [260, 180], a = t.nodes.filter(Boolean), o = oa(a), s = Math.min(22, Math.max(8, i[0] * .08)), c = Math.min(34, Math.max(18, i[1] * .18)), l = Math.min(18, Math.max(8, i[1] * .08)), u = Math.max(40, i[0] - s * 2), d = Math.max(34, i[1] - c - l), f = Math.min(1, u / o.width, d / o.height), p = r[0] + s + (u - o.width * f) / 2, m = r[1] + c + (d - o.height * f) / 2, h = a.map((r) => {
		let i = sa(r?.pos) || [o.minX, o.minY], a = ca(r?.size) || [140, 60];
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
function oa(e) {
	let t = Infinity, n = Infinity, r = -Infinity, i = -Infinity;
	for (let a of e) {
		let e = sa(a?.pos);
		if (!e) continue;
		let o = ca(a?.size) || [140, 60];
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
function sa(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.x ?? e.left ?? null, n = e[1] ?? e[1] ?? e.y ?? e.top ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function ca(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.w ?? e.width ?? null, n = e[1] ?? e[1] ?? e.h ?? e.height ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function la(e) {
	if (Array.isArray(e)) return !0;
	let t = String(e || "").trim().toUpperCase();
	return t === "INT" || t === "FLOAT" || t === "STRING" || t === "BOOLEAN" || t === "BOOL" || t === "COMBO" || t === "ENUM";
}
function ua(e, t = null) {
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
//#region ui/features/workflows/workflowPickerState.ts
var X = Ct({
	open: !1,
	mode: "workflow",
	title: "",
	sourceAsset: null,
	workflow: null,
	items: [],
	resolve: null
});
function da({ title: e = "Select workflow", sourceAsset: t = null } = {}) {
	return pa(null), X.open = !0, X.mode = "workflow", X.title = String(e || "Select workflow"), X.sourceAsset = t || null, X.workflow = null, X.items = [], new Promise((e) => {
		X.resolve = e;
	});
}
function fa({ title: e = "Select asset", workflow: t = null, items: n = [] } = {}) {
	return pa(null), X.open = !0, X.mode = "asset", X.title = String(e || "Select asset"), X.sourceAsset = null, X.workflow = t || null, X.items = Array.isArray(n) ? n.filter(Boolean) : [], new Promise((e) => {
		X.resolve = e;
	});
}
function pa(e = null) {
	let t = X.resolve;
	if (X.open = !1, X.mode = "workflow", X.title = "", X.sourceAsset = null, X.workflow = null, X.items = [], X.resolve = null, typeof t == "function") try {
		t(e || null);
	} catch (e) {
		console.debug?.(e);
	}
}
//#endregion
//#region ui/vue/majoorPrimeVue.ts
var ma = {
	Button: ct,
	Checkbox: st,
	InputText: wt,
	Textarea: pt,
	Select: xt,
	ToggleButton: _t,
	Badge: vt,
	Tag: it,
	Dialog: dt,
	Menu: bt,
	Listbox: gt,
	Tree: St,
	VirtualScroller: ot
};
function ha(e) {
	return e.use(lt, {
		ripple: !1,
		unstyled: !0,
		zIndex: { overlay: 10100 }
	}), e.use(ut), e.use(ht), Object.entries(ma).forEach(([t, n]) => {
		e.component(`M${t}`, n);
	}), e;
}
//#endregion
//#region ui/vue/createVueApp.ts
function ga(e, t = void 0) {
	let n = Et(), r = rt(e, t);
	return r.use(n), ha(r), {
		app: r,
		pinia: n
	};
}
var _a = /* @__PURE__ */ new Map();
function va(e, t, n) {
	try {
		window.dispatchEvent(new CustomEvent("mjr:keepalive-attached", { detail: {
			mountKey: String(e || "_mjrVueApp"),
			host: t || null,
			container: n || null
		} }));
	} catch {}
}
function ya(e) {
	let t = document.createElement("div");
	return t.dataset.mjrKeepAliveHost = String(e || "_mjrVueApp"), t.style.height = "100%", t.style.width = "100%", t.style.minHeight = "0", t.style.display = "flex", t.style.flexDirection = "column", t.style.overflow = "hidden", t;
}
function ba(e, t) {
	!e || !t || (e.style.height = "100%", e.style.minHeight = "0", e.style.display = "flex", e.style.flexDirection = "column", e.style.overflow = "hidden", !(e.firstChild === t && e.childNodes.length === 1) && (e.replaceChildren(t), va(t?.dataset?.mjrKeepAliveHost, t, e)));
}
function xa(e, t, n = "_mjrVueApp") {
	if (!e) return !1;
	let r = _a.get(n), i = !1;
	if (!r) {
		let e = ya(n), { app: a } = ga(t);
		a.mount(e), r = {
			app: a,
			host: e,
			container: null
		}, _a.set(n, r), i = !0;
	}
	return ba(e, r.host), r.container = e, i;
}
function Sa(e, t = "_mjrVueApp") {
	let n = _a.get(t);
	if (n?.app) {
		try {
			n.app.unmount();
		} catch {}
		try {
			n.host?.remove?.();
		} catch {}
		_a.delete(t);
	}
}
//#endregion
//#region ui/utils/format.ts
function Ca(e) {
	if (!e) return null;
	let t = Number(e);
	if (!isNaN(t)) return /* @__PURE__ */ new Date(t * 1e3);
	let n = new Date(e);
	return isNaN(n.getTime()) ? null : n;
}
function wa(e) {
	let t = Ca(e);
	return t ? `${t.getDate().toString().padStart(2, "0")}/${(t.getMonth() + 1).toString().padStart(2, "0")}` : "";
}
function Ta(e) {
	let t = Ca(e);
	return t ? `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}` : "";
}
function Ea(e) {
	return e ? e < 60 ? `${Math.round(e)}s` : `${Math.floor(e / 60)}m ${Math.round(e % 60)}s` : "";
}
var Da = {
	version: 1,
	parser_family_version: "geninfo-catalog-v1",
	sections: [
		{
			key: "file_info",
			title: "File Info",
			searchField: "file",
			aliases: [
				"filename",
				"path",
				"size",
				"resolution"
			]
		},
		{
			key: "prompt",
			title: "Prompt",
			searchField: "prompt",
			aliases: [
				"positive",
				"negative",
				"text"
			]
		},
		{
			key: "model",
			title: "Models",
			searchField: "model",
			aliases: [
				"checkpoint",
				"ckpt",
				"vae",
				"clip"
			]
		},
		{
			key: "sampler",
			title: "Sampling",
			searchField: "sampler",
			aliases: [
				"sampling",
				"scheduler",
				"steps",
				"cfg",
				"seed",
				"denoise"
			]
		},
		{
			key: "lora",
			title: "LoRAs",
			searchField: "lora",
			aliases: ["loras", "lycoris"]
		},
		{
			key: "control",
			title: "Control",
			searchField: "control",
			aliases: [
				"controlnet",
				"adapter",
				"ipadapter"
			]
		},
		{
			key: "upscale",
			title: "Upscaling",
			searchField: "upscale",
			aliases: [
				"upscaler",
				"upscaling",
				"scale"
			]
		},
		{
			key: "workflow_nodes",
			title: "Workflow Nodes",
			searchField: "node",
			aliases: [
				"nodes",
				"workflow_node",
				"workflow_nodes"
			]
		},
		{
			key: "tags",
			title: "Tags",
			searchField: "tag",
			aliases: ["tags", "rating"]
		}
	]
};
function Oa() {
	let e = {};
	for (let t of Da.sections) {
		e[t.key] = t.searchField, e[t.searchField] = t.searchField;
		for (let n of t.aliases || []) e[String(n).toLowerCase()] = t.searchField;
	}
	return e;
}
function ka(e) {
	let t = String(e || "").trim().toLowerCase();
	return Oa()[t] || "";
}
function Aa(e) {
	let t = String(e || "").trim().toLowerCase();
	return t && Da.sections.find((e) => e.key === t) || null;
}
//#endregion
//#region ui/vue/components/panel/sidebar/SidebarFileInfoSection.vue
var ja = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "rgba(255, 255, 255, 0.03)",
		border: "1px solid var(--mjr-border, rgba(255, 255, 255, 0.12))",
		"border-radius": "8px",
		padding: "10px"
	}
}, Ma = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "6px"
} }, Na = ["title"], Pa = ["title"], Fa = {
	__name: "SidebarFileInfoSection",
	props: { asset: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e;
		function n(e) {
			let t = Number(e);
			if (!Number.isFinite(t) || t < 0) return "N/A";
			if (t === 0) return "0 bytes";
			let n = [
				"B",
				"KB",
				"MB",
				"GB"
			], r = 0, i = t;
			for (; i >= 1024 && r < n.length - 1;) i /= 1024, r += 1;
			return r === 0 ? `${Math.round(i)} bytes` : `${i.toFixed(1)} ${n[r]}`;
		}
		function r(e) {
			let t = e?.metadata_raw;
			if (t && typeof t == "object") return t;
			if (typeof t != "string" || !t.trim()) return {};
			try {
				let e = JSON.parse(t);
				return e && typeof e == "object" ? e : {};
			} catch {
				return {};
			}
		}
		function i(...e) {
			return e.find((e) => e != null && e !== "");
		}
		function a(e, t) {
			let n = i(e.bits_per_raw_sample, e.bits_per_sample, t.bits_per_channel, t.bitsperchannel, t.bit_depth), r = String(i(e.pix_fmt, t.pixel_format, t.pix_fmt) || ""), a = Number(r.match(/(?:p|gray|gbrp)(\d+)(?:le|be)?$/i)?.[1]), o = Number(n) || (a >= 8 ? a : 0), s = String(i(e.sample_fmt, t.sample_format) || "").toLowerCase(), c = s.includes("flt") || s.includes("dbl") || /(?:16|32)f\b/i.test(r);
			return o > 0 ? `${o}-bit ${c ? "float" : "fixed"}` : r ? `8-bit ${c ? "float" : "fixed"}` : c ? "float" : "N/A";
		}
		function o(e, t) {
			let n = e?.[t] ?? e?.file_info?.[t];
			return n != null && n !== "" ? n : t === "workflow_id" ? e?.user_metadata?.workflow?.id ?? e?.metadata?.workflow_id ?? "" : "";
		}
		let s = I(() => {
			let e = t.asset || {}, s = r(e), c = s?.raw_ffprobe && typeof s.raw_ffprobe == "object" ? s.raw_ffprobe : {}, l = c?.video_stream && typeof c.video_stream == "object" ? c.video_stream : {}, u = c?.format && typeof c.format == "object" ? c.format : {}, d = [];
			e.width && e.height && d.push({
				label: "Dimensions",
				value: `${e.width} x ${e.height}`,
				tooltip: "Image/video resolution in pixels"
			}), e.duration && e.duration > 0 && d.push({
				label: "Duration",
				value: Ea(e.duration),
				tooltip: "Video duration"
			});
			let f = qe(e);
			f != null && d.push({
				label: "FPS",
				value: Ge(f),
				tooltip: "Native frame rate"
			});
			let p = Ke(e, f);
			d.push({
				label: "Frames",
				value: p == null ? "N/A" : String(Math.max(0, Math.floor(p))),
				tooltip: "Total frame count"
			}), d.push({
				label: "Bits / Channel",
				value: a(l, s),
				tooltip: "Channel precision and numeric representation"
			}), d.push({
				label: "Pixel Aspect",
				value: String(i(l.sample_aspect_ratio, s.pixel_aspect_ratio) || "N/A"),
				tooltip: "Pixel sample aspect ratio"
			}), d.push({
				label: "Codec ID",
				value: String(i(l.codec_tag_string, l.codec_tag, s.codec_id) || "N/A"),
				tooltip: "Container codec identifier"
			}), d.push({
				label: "Codec Name",
				value: String(i(l.codec_long_name, l.codec_name, s.codec_name) || "N/A"),
				tooltip: "Video codec name"
			}), d.push({
				label: "Encoder",
				value: String(i(l.tags?.encoder, u.tags?.encoder, s.encoder) || "N/A"),
				tooltip: "Encoder recorded in file metadata"
			}), d.push({
				label: "Pixel Format",
				value: String(i(l.pix_fmt, s.pixel_format, s.pix_fmt) || "N/A"),
				tooltip: "Stored pixel format"
			}), d.push({
				label: "Color Space",
				value: String(i(l.color_space, s.color_space, s.colorspace) || "N/A"),
				tooltip: "Encoded color space"
			});
			let m = Ve(e.generation_time_ms ?? e.metadata?.generation_time_ms ?? 0);
			m > 0 && d.push({
				label: "Generation Time",
				value: `${(Number(m) / 1e3).toFixed(1)}s`,
				tooltip: "Time taken to generate this asset (workflow execution time)",
				valueStyle: `color: ${Ue(m)}; font-weight: 600;`
			});
			let h = e.generation_time || e.file_creation_time || e.mtime || e.created_at;
			if (h) {
				let e = wa(h), t = Ta(h);
				e && d.push({
					label: "Date",
					value: e,
					tooltip: "File creation/generation date"
				}), t && d.push({
					label: "Time",
					value: t,
					tooltip: "File creation/generation time"
				});
			}
			d.push({
				label: "File Size",
				value: n(i(e.size_bytes, e.size, e.file_info?.size_bytes, e.file_info?.size)),
				tooltip: "File size on disk"
			}), e.id != null && d.push({
				label: "Asset ID",
				value: String(e.id),
				tooltip: "Internal database asset identifier"
			});
			let g = String(o(e, "job_id") || "").trim();
			g && d.push({
				label: "Job ID",
				value: g,
				tooltip: "Workflow execution job identifier (prompt_id)"
			});
			let _ = String(o(e, "source_node_id") || "").trim();
			_ && d.push({
				label: "Source Node",
				value: _,
				tooltip: "ComfyUI node id that produced this file"
			});
			let v = String(o(e, "source_node_type") || "").trim();
			v && d.push({
				label: "Node Type",
				value: v,
				tooltip: "ComfyUI node class that produced this file"
			});
			let y = String(o(e, "workflow_id") || "").trim();
			return y && d.push({
				label: "Workflow ID",
				value: y,
				tooltip: "ComfyUI workflow identifier (from workflow.id in extra_data)"
			}), d;
		});
		return (e, t) => s.value.length ? (j(), z("div", ja, [t[0] ||= N("div", { style: {
			"font-size": "12px",
			"font-weight": "700",
			color: "#607d8b",
			"margin-bottom": "8px",
			"text-transform": "uppercase",
			"letter-spacing": "0.4px"
		} }, " File Info ", -1), N("div", Ma, [(j(!0), z(M, null, P(s.value, (e) => (j(), z("div", {
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
		}, R(e.label), 9, Na), N("div", {
			style: V(e.valueStyle || "font-size: 12px; text-align: right; word-break: break-word"),
			title: String(e.value || "")
		}, R(e.value), 13, Pa)]))), 128))])])) : F("", !0);
	}
}, Ia = new Set([
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
function La(e) {
	let t = String(e?.filename || e?.name || e?.filepath || e?.path || "").trim().toLowerCase();
	return !t || !t.includes(".") ? "" : t.split(".").pop() || "";
}
function Ra(e) {
	return String(e?.kind || "").trim().toLowerCase() === "image" || String(e?.mime || e?.mimetype || "").trim().toLowerCase().startsWith("image/") ? !0 : Ia.has(La(e));
}
function za(e) {
	let t = La(e);
	return t === "jpg" || t === "jpeg";
}
function Ba() {
	try {
		return !!(Ut()?.ai?.vectorSearchEnabled ?? !0);
	} catch {
		return !0;
	}
}
function Va(e) {
	return e >= .75 ? "#4CAF50" : e >= .5 ? "#8BC34A" : e >= .3 ? "#FF9800" : "#F44336";
}
function Ha(e) {
	return e >= .85 ? "Excellent" : e >= .7 ? "Good" : e >= .5 ? "Fair" : e >= .3 ? "Low" : "Very Low";
}
function Ua(e) {
	let t = String(e || "").trim();
	if (!t) return "";
	let n = [];
	for (let e of t.replace(/\r\n/g, "\n").split("\n")) {
		let t = String(e || "").trim();
		t && (/^title\s*:/i.test(t) || (/^caption\s*:/i.test(t) && (t = t.replace(/^caption\s*:/i, "").trim()), t && n.push(t)));
	}
	return (n.length ? n.join(" ") : t).replace(/\s+/g, " ").replace(/:{2,}\s*$/, "").trim();
}
function Wa(e) {
	let t = String(e?.filename || "").trim();
	if (!t) return [];
	let n = String(e?.subfolder || "").trim(), r = String(e?.folder_type || "input").trim().toLowerCase(), i = [], a = (e) => {
		if (!e) return;
		let r = Ie(t, n, e);
		r && !i.includes(r) && i.push(r);
	};
	return (r === "input" || r === "output") && a(r), a("input"), a("output"), i;
}
function Ga(e) {
	let t = String(e?.filepath || "").trim(), n = String(e?.filename || "").trim();
	return !t || t === n ? "" : t;
}
function Ka(e) {
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
function qa(e, t) {
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
function Ja(e) {
	let t = [];
	return e?.metadata_raw && t.push(e.metadata_raw), e?.workflow && t.push(e.workflow), e?.metadata_raw?.workflow && t.push(e.metadata_raw.workflow), e?.metadata_raw?.raw_ffprobe?.format?.tags && t.push(e.metadata_raw.raw_ffprobe.format.tags), e?.metadata_raw?.ffprobe?.format?.tags && t.push(e.metadata_raw.ffprobe.format.tags), e?.geninfo && typeof e.geninfo == "object" && t.push({ geninfo: e.geninfo }), e?.metadata && (typeof e.metadata == "object" || typeof e.metadata == "string") && t.push(e.metadata), e?.prompt && (typeof e.prompt == "object" || typeof e.prompt == "string") && t.push(e.prompt), e?.exif && t.push(e.exif), e && typeof e == "object" && t.push(e), t;
}
function Ya(e, t) {
	for (let [n, r] of Object.entries(t)) r == null || r === "" || (e[n] === void 0 || e[n] === null || e[n] === "") && (e[n] = r);
}
function Xa(e) {
	let t = Ja(e), n = {};
	for (let e of t) {
		let t = kt(e);
		!t || typeof t != "object" || Ya(n, t);
	}
	return Object.keys(n).length ? n : null;
}
function Za(e) {
	try {
		if (!e || typeof e != "object") return !1;
		if (e.is_override || typeof e.workflow_notes == "string" && e.workflow_notes.trim() || typeof e.notes == "string" && e.notes.trim() || Array.isArray(e.custom_info) && e.custom_info.length > 0 || e.engine && typeof e.engine == "object" && e.engine.type || jt(e.prompt) || typeof (e.negative_prompt || e.negativePrompt) == "string" && jt(e.negative_prompt || e.negativePrompt) || e.models || e.model || e.checkpoint || e.loras || e.ltx_director && typeof e.ltx_director == "object" || e.ideogram && typeof e.ideogram == "object" || e.sampler || e.sampler_name || e.steps || e.cfg || e.cfg_scale || e.cfg_high_noise || e.cfg_low_noise || e.scheduler || Array.isArray(e.chained_passes) && e.chained_passes.length > 0 || Array.isArray(e.all_samplers) && e.all_samplers.length > 0 || e.seed || e.denoise || e.denoising || e.clip_skip || e.voice || e.language || e.temperature || e.top_k || e.top_p || e.repetition_penalty || e.max_new_tokens || e.device || e.voice_preset || e.instruct || e.dtype || e.attn_implementation || e.enable_chunking !== void 0 || e.max_chars_per_chunk || e.chunk_combination_method || e.silence_between_chunks_ms || e.enable_audio_cache !== void 0 || e.batch_size !== void 0 || e.use_torch_compile !== void 0 || e.use_cuda_graphs !== void 0 || e.compile_mode || typeof e.lyrics == "string" && e.lyrics.trim()) return !0;
	} catch {
		return !1;
	}
	return !1;
}
function Q(e) {
	return e ? typeof e == "string" ? Mt(e) : typeof e == "object" ? Mt(e.name || e.value || "") : "" : "";
}
function Qa(e, t, n, r) {
	let i = String(r || "").trim();
	if (!i) return;
	let a = `${n}::${i}`;
	t.has(a) || (t.add(a), e.push({
		label: n,
		value: i
	}));
}
function $a(e) {
	let t = `${String(e?.source || "").toLowerCase()} ${String(e?.name || e?.lora_name || "").toLowerCase()}`;
	return t.includes("high_noise") || t.includes("high noise") ? "high_noise" : t.includes("low_noise") || t.includes("low noise") ? "low_noise" : "";
}
function eo(e) {
	let t = [], n = Array.isArray(e.model_groups) ? e.model_groups : [];
	if (n.length) return n.forEach((e) => {
		if (!e || typeof e != "object") return;
		let n = Q(e.model), r = Array.isArray(e.loras) ? e.loras.map((e) => At(e)).filter(Boolean) : [];
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
		model: Q(r.unet_high_noise)
	}, {
		key: "low_noise",
		label: O("sidebar.generation.lowNoise", "Low Noise"),
		model: Q(r.unet_low_noise)
	}].forEach((e) => {
		let n = i.filter((t) => $a(t) === e.key).map((e) => At(e)).filter(Boolean);
		!e.model && !n.length || t.push({
			...e,
			loras: n
		});
	}), t;
}
function to(e, t) {
	return t == null ? null : {
		label: e,
		value: t ? O("state.on", "on") : O("state.off", "off")
	};
}
function $(e) {
	return e != null && String(e).trim() !== "";
}
function no(e) {
	let t = String(e || "").toLowerCase();
	return t.includes("high") ? "#52ffe8" : t.includes("low") ? "#42A5F5" : t.includes("refine") ? "#AB47BC" : t.includes("upscale") ? "#66BB6A" : t.includes("interpolation") || t.includes("video") ? "#dace26" : "#9C27B0";
}
function ro(e) {
	return String(e || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function io(e, t) {
	let n = String(t || e || "").trim(), r = String(e || n).toLowerCase(), i = r.match(/^pass_(\d+)$/);
	return i ? O("sidebar.generation.stagePassN", "Pass {n}", { n: Number(i[1]) }) : r.includes("high") ? "High" : r.includes("low") ? "Low" : r.includes("refine") ? "Refiner" : r.includes("upscale") ? "Upscale" : r.includes("text_to_image") || r.includes("image_to_image") || r === "base" ? "Base" : n || "Branch";
}
function ao(e, t) {
	let n = new Set(t.map((e) => String(e).toLowerCase()));
	return e.find((e) => n.has(String(e.label || "").toLowerCase())) || null;
}
function oo(e, t) {
	return $(t) ? {
		label: e,
		value: t
	} : null;
}
function so(e) {
	let t = String(e || "").toLowerCase();
	return t.includes("high_noise") || t.includes("high-noise") || t.includes("high noise") ? "high" : t.includes("low_noise") || t.includes("low-noise") || t.includes("low noise") ? "low" : "";
}
function co(e) {
	return Array.isArray(e) || e && typeof e == "object" ? !1 : $(e) && String(e).trim() !== "-";
}
function lo(e) {
	return typeof e == "number" ? Math.abs(e - Math.round(e)) < 1e-9 ? String(Math.round(e)) : e.toFixed(2).replace(/0+$/g, "").replace(/\.$/, "") : String(e ?? "").trim();
}
function uo(e) {
	if (!$(e)) return null;
	let t = Number(e);
	return !Number.isFinite(t) || t <= 0 ? null : e;
}
function fo(e, t) {
	let n = uo(e.seed);
	if (n !== null) return n;
	let r = [Array.isArray(e.chained_passes) ? e.chained_passes : [], Array.isArray(e.all_samplers) ? e.all_samplers : []];
	for (let e of r) for (let t of e) {
		let e = uo(t?.seed_val ?? t?.seed);
		if (e !== null) return e;
	}
	for (let e of t || []) {
		let t = uo(ao(e.fields || [], ["Seed"])?.value);
		if (t !== null) return t;
	}
	return null;
}
function po(e, t) {
	if (!t || !co(t.value)) return;
	let n = `${String(t.label || "").toLowerCase()}::${lo(t.value)}`;
	e.some((e) => `${String(e.label || "").toLowerCase()}::${lo(e.value)}` === n) || e.push({
		...t,
		value: lo(t.value)
	});
}
function mo(e, t, n, r) {
	let i = /* @__PURE__ */ new Map(), a = (e, t) => {
		let n = ro(e || t || "branch") || "branch";
		n.includes("high") && (n = "high"), n.includes("low") && (n = "low");
		let r = i.get(n);
		if (r) return r;
		let a = {
			key: n,
			label: io(n, t),
			accent: no(n),
			modelFields: [],
			samplingFields: [],
			loras: []
		};
		return i.set(n, a), a;
	}, o = (e, t, n) => {
		let r = String(n || "").trim();
		r && (e.modelFields.some((e) => String(e.label || "").toLowerCase() === String(t || "").toLowerCase() && Mt(e.value) === Mt(r)) || e.modelFields.push({
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
		let t = Q(c.unet), n = so(t), r = Q(c.checkpoint || (n ? null : c.unet) || e.model || e.checkpoint), i = Q(c.unet_high_noise) || (n === "high" ? t : ""), l = Q(c.unet_low_noise) || (n === "low" ? t : ""), u = Q(c.clip), d = Q(c.vae), f = Array.isArray(e.loras) ? e.loras.map((e) => At(e)).filter(Boolean) : [], p = !!(i || l), m = !p && (r || u || d || f.length) ? a("base", "Base") : null, h = p && (u || d) ? a("shared", "Shared") : null, g = i ? a("high", "High") : null, _ = l ? a("low", "Low") : null;
		if (m) {
			r && o(m, e.model || e.checkpoint || c.checkpoint ? "Model" : "UNet", r), u && o(m, "CLIP", u), d && o(m, "VAE", d);
			for (let e of f) s(m, e);
		}
		h && (u && o(h, "CLIP", u), d && o(h, "VAE", d)), g && o(g, "UNet", i), _ && o(_, "UNet", l);
	}
	let l = i.get("high") || i.get("high_noise"), u = i.get("low") || i.get("low_noise"), d = [
		ao(n, ["Sampler"]),
		ao(n, ["Scheduler"]),
		ao(n, ["Steps"]),
		ao(n, ["Seed"])
	].filter(Boolean), f = oo("CFG", e.cfg_high_noise), p = oo("CFG", e.cfg_low_noise);
	l && [...d, ...f ? [f] : []].forEach((e) => po(l.samplingFields, e)), u && [...d, ...p ? [p] : []].forEach((e) => po(u.samplingFields, e));
	let m = (r || []).some((e) => ro(e.label).includes("upscale")), h = (r || []).length === 2 && (r || []).every((e) => ["base", "pass_2"].includes(ro(e.label)));
	for (let [e, t] of (r || []).entries()) {
		let n = ro(t.label);
		if (!n) continue;
		let i = (r || []).filter((e) => ro(e.label) === ro(t.label)).length, o = ro(t.stage), s = o ? (r || []).filter((e) => ro(e.stage) === o).length : 0, c = ao(t.fields || [], ["Model"]), d = so(c?.value);
		["high", "low"].includes(n) || (d ? n = d : s > 1 || i > 1 ? n = `pass_${e + 1}` : h ? n = e === 0 ? "high" : "low" : n === "base" && l && u ? n = "high" : ["text_to_image", "image_to_image"].includes(n) && (n = m ? "low" : "base")), n.includes("upscale") && m && (n = "high");
		let f = a(n, t.label);
		if (!/^pass_\d+$/i.test(n) && c && String(c.value || "") !== "-") {
			let e = Mt(c.value);
			f.modelFields.some((t) => Mt(t.value) === e) || f.modelFields.push(c);
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
		].includes(String(e.label || "")) && po(f.samplingFields, e);
	}
	return Array.from(i.values()).filter((e) => e.modelFields.length || e.samplingFields.length || e.loras.length);
}
function ho(e, t, n, r) {
	let i = [], a = (e, t, n, r) => {
		let a = r.filter((e) => e && $(e.value) && String(e.value) !== "-");
		a.length && i.push({
			key: e,
			title: t,
			accent: n,
			fields: a
		});
	};
	for (let n of t || []) {
		let t = ro(n.label), r = (n.fields || []).some((e) => {
			let t = String(e?.label || "").toLowerCase(), n = String(e?.value || "").toLowerCase();
			return t.includes("upscaler") || n.includes("upscale") || n.includes("upscaler") || /(?:^|[_\s-])to[_\s-]?\d{3,5}(?:[_\s.-]|$)/i.test(n);
		});
		t.includes("upscale") && (e.upscaler || r) && a("upscale", "Upscale", "#66BB6A", n.fields || []), (t.includes("interpolation") || t.includes("rife") || t.includes("film")) && a("interpolation", "Interpolation", "#26C6DA", n.fields || []);
	}
	a("audio", "MMAudio", "#26A69A", [
		oo("Voice", e.voice),
		oo("Language", e.language),
		oo("Temperature", e.temperature),
		oo("Lyrics Strength", e.lyrics_strength)
	].filter(Boolean)), a("interpolation", "Interpolation", "#26C6DA", [
		oo("Engine", e.interpolation_engine || e.frame_interpolation || e.interpolator),
		oo("Source FPS", e.source_fps || e.input_fps),
		oo("Final FPS", e.final_fps || e.output_fps || e.fps)
	].filter(Boolean));
	for (let e of n || []) i.push({
		key: ro(e.title) || `module_${i.length}`,
		title: e.title,
		accent: e.color || "#2196F3",
		fields: [{
			label: "Info",
			value: e.content
		}]
	});
	r && !i.some((e) => String(e.title).toLowerCase() === String(r).toLowerCase()) && a("workflow_engine", r, "#2196F3", [oo("Engine", r)].filter(Boolean));
	let o = /* @__PURE__ */ new Set();
	return i.filter((e) => {
		let t = `${e.key}:${e.title}:${JSON.stringify(e.fields)}`;
		return o.has(t) ? !1 : (o.add(t), !0);
	});
}
function go(e) {
	return new Set(Array.isArray(e.override_fields) ? e.override_fields.map((e) => String(e || "").trim()).filter(Boolean) : []);
}
function _o(e, ...t) {
	return t.some((t) => e.has(t));
}
function vo(e) {
	return Array.isArray(e) ? e.filter((e) => e && typeof e == "object").map((e, t) => ({
		title: String(e.title || O("sidebar.generation.customInfoN", "Custom Info {n}", { n: t + 1 })).trim(),
		content: String(e.content ?? e.value ?? "").trim(),
		color: /^#[0-9a-fA-F]{6}$/.test(String(e.color || "").trim()) ? String(e.color).trim() : "#2196F3"
	})).filter((e) => e.content) : [];
}
function yo(e) {
	if (!e || typeof e != "object") return null;
	let t = [], n = (e, n) => {
		$(n) && t.push({
			label: e,
			value: lo(n)
		});
	};
	n("FPS", e.frame_rate), n("Frames", e.duration_frames), n("Duration", e.duration_seconds), ($(e.width) || $(e.height)) && t.push({
		label: "Size",
		value: `${e.width || "?"} x ${e.height || "?"}`
	});
	let r = Array.isArray(e.segments) ? e.segments.map((e, t) => {
		if (!e || typeof e != "object") return null;
		let n = jt(e.prompt || e.text || ""), r = String(e.filename || e.imageFile || e.videoFile || e.audioFile || "").trim(), i = String(e.filepath || e.path || r).trim(), a = String(e.in || e.in_label || e.start || e.start_frame || "").trim(), o = String(e.out || e.out_label || e.end || e.end_frame || "").trim();
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
			previewCandidates: r ? Wa({
				filename: r,
				filepath: i,
				folder_type: String(e.folder_type || e.folderType || "input").trim(),
				subfolder: String(e.subfolder || "").trim()
			}) : []
		};
	}).filter(Boolean) : [], i = jt(e.global_prompt || e.globalPrompt || "");
	return !i && !r.length && !t.length ? null : {
		title: String(e.title || "LTX Director").trim(),
		globalPrompt: i,
		fields: t,
		segments: r
	};
}
function bo(e) {
	if (!e || typeof e != "object") return null;
	let t = e.payload && typeof e.payload == "object" ? e.payload : e, n = typeof e.json == "string" && e.json.trim() ? e.json.trim() : JSON.stringify(t, null, 2), r = jt(e.high_level_description || e.highLevelDescription || t.high_level_description || ""), i = jt(e.background || t.background || ""), a = [], o = (e, t) => {
		$(t) && a.push({
			label: e,
			value: lo(t)
		});
	};
	o("Style", t.style), o("Photo Style", t.photo_style || t["style.photo"]), o("Medium", t.medium), o("Lighting", t.lighting), o("Aesthetics", t.aesthetics), o("BG Brightness", t.bg_brightness), ($(t.width) || $(t.height)) && a.push({
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
function xo(e) {
	let t = Xa(e), n = {
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
		isImageAsset: Ra(e),
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
	if (!t || typeof t == "object" && Object.keys(t).length === 0 || !Za(t)) {
		let t = e?.metadata_raw?.geninfo_status || e?.geninfo_status;
		return t && typeof t == "object" && t.kind === "media_pipeline" ? {
			...n,
			kind: "media-only",
			mediaOnlyMessage: O("sidebar.generation.mediaOnlyPipeline", "This file looks like a media-only pipeline (e.g. LoadVideo/VideoCombine) and does not contain generation parameters.")
		} : Ra(e) || za(e) ? {
			...n,
			kind: "caption-only",
			showAlignment: !1
		} : n;
	}
	let r = t, i = yo(r.ltx_director), a = bo(r.ideogram), o = go(r), s = r.engine && typeof r.engine == "object" ? r.engine : null, c = !!(r.is_override || s?.mode === "override" || s?.parser_version === "geninfo-override-v1" || s?.source === "majoor_geninfo"), l = Nt(r), u = Ot(typeof r.prompt == "string" ? r.prompt : null, typeof (r.negative_prompt || r.negativePrompt) == "string" ? r.negative_prompt || r.negativePrompt : null), d = Array.isArray(r.all_positive_prompts) && r.all_positive_prompts.length > 1 ? r.all_positive_prompts.map((e, t) => {
		let n = Ot(typeof e == "string" ? e : "", typeof r.all_negative_prompts?.[t] == "string" ? r.all_negative_prompts[t] : "");
		return {
			label: O("sidebar.generation.promptN", "Prompt {n}", { n: t + 1 }),
			positive: jt(n.positive),
			negative: jt(n.negative)
		};
	}).filter((e) => e.positive) : [], f = [], p = /* @__PURE__ */ new Set(), m = r.models && typeof r.models == "object" ? r.models : null, h = eo(r), g = new Set(h.map((e) => String(e.model || "").trim()).filter(Boolean)), _ = Array.isArray(r.all_checkpoints) && r.all_checkpoints.length > 1 ? r.all_checkpoints : null;
	if (m) {
		let e = new Set([
			Q(m.unet_high_noise),
			Q(m.unet_low_noise),
			...g
		].filter(Boolean));
		if (_) _.forEach((e, t) => {
			let n = Q(e);
			Qa(f, p, O("sidebar.generation.checkpointN", "Checkpoint {n}", { n: t + 1 }), n);
		});
		else {
			let t = Q(m.checkpoint);
			t && !e.has(t) && Qa(f, p, O("sidebar.generation.checkpoint", "Checkpoint"), t);
		}
		[
			["UNet", Q(m.unet)],
			["Diffusion", Q(m.diffusion)],
			[O("sidebar.generation.upscaler", "Upscaler"), Q(m.upscaler)],
			["CLIP", Q(m.clip)],
			["VAE", Q(m.vae)]
		].forEach(([t, n]) => {
			e.has(n) || Qa(f, p, t, n);
		});
	} else (r.model || r.checkpoint) && Qa(f, p, O("sidebar.generation.model", "Model"), Mt(r.model || r.checkpoint));
	if (Array.isArray(r.loras) && r.loras.length > 0) {
		let e = r.loras.map((e) => At(e)).filter(Boolean).join("\n");
		e && Qa(f, p, r.loras.length > 1 ? O("sidebar.generation.loras", "LoRAs") : "LoRA", e);
	}
	!m && r.clip && Qa(f, p, "CLIP", Mt(r.clip)), !m && r.vae && Qa(f, p, "VAE", Mt(r.vae)), !m && r.unet && Qa(f, p, "UNet", Mt(r.unet)), !m && r.diffusion && Qa(f, p, "Diffusion", Mt(r.diffusion)), !m && r.upscaler && Qa(f, p, O("sidebar.generation.upscaler", "Upscaler"), Mt(r.upscaler)), m && r.clip && Qa(f, p, "CLIP", Mt(r.clip)), m && r.vae && Qa(f, p, "VAE", Mt(r.vae));
	for (let e of f) {
		let t = String(e.label || "").toLowerCase();
		(t.includes("checkpoint") || t === "model") && (e.override = _o(o, "checkpoint", "model")), t === "clip" && (e.override = _o(o, "clip")), t === "vae" && (e.override = _o(o, "vae")), t.includes("lora") && (e.override = _o(o, "loras"));
	}
	let v = [];
	$(r.seed) && v.push({
		label: O("sidebar.generation.seed", "Seed"),
		value: r.seed,
		override: _o(o, "seed")
	}), (r.sampler || r.sampler_name) && v.push({
		label: O("sidebar.generation.sampler", "Sampler"),
		value: r.sampler || r.sampler_name,
		override: _o(o, "sampler", "sampler_name")
	}), $(r.steps) && v.push({
		label: O("sidebar.generation.steps", "Steps"),
		value: r.steps,
		override: _o(o, "steps")
	});
	let y = $(r.cfg) ? r.cfg : r.cfg_scale;
	$(y) && v.push({
		label: O("sidebar.generation.cfgScale", "CFG Scale"),
		value: y,
		override: _o(o, "cfg", "cfg_scale")
	}), r.cfg_high_noise !== void 0 && r.cfg_high_noise !== null && v.push({
		label: O("sidebar.generation.cfgHighNoise", "CFG High Noise"),
		value: r.cfg_high_noise
	}), r.cfg_low_noise !== void 0 && r.cfg_low_noise !== null && v.push({
		label: O("sidebar.generation.cfgLowNoise", "CFG Low Noise"),
		value: r.cfg_low_noise
	}), r.scheduler && v.push({
		label: O("sidebar.generation.scheduler", "Scheduler"),
		value: r.scheduler,
		override: _o(o, "scheduler")
	});
	let b = $(r.denoise) ? r.denoise : r.denoising;
	$(b) && v.push({
		label: O("sidebar.generation.denoise", "Denoise"),
		value: b,
		override: _o(o, "denoise", "denoising")
	});
	let x = [];
	Array.isArray(r.chained_passes) && r.chained_passes.length > 1 ? x = r.chained_passes.filter((e) => e && typeof e == "object").map((e, t) => ({
		label: qa(e, t),
		stage: String(e?.pass_stage || "").trim(),
		fields: [
			{
				label: O("sidebar.generation.model", "Model"),
				value: Z(e?.model)
			},
			{
				label: O("sidebar.generation.sampler", "Sampler"),
				value: Z(e?.sampler_name || e?.sampler)
			},
			{
				label: O("sidebar.generation.scheduler", "Scheduler"),
				value: Z(e?.scheduler)
			},
			{
				label: O("sidebar.generation.steps", "Steps"),
				value: Z(e?.steps)
			},
			{
				label: "CFG",
				value: Z(e?.cfg)
			},
			{
				label: O("sidebar.generation.denoise", "Denoise"),
				value: Z(e?.denoise)
			},
			{
				label: "Start",
				value: Z(e?.start_at_step)
			},
			{
				label: "End",
				value: Z(e?.end_at_step)
			},
			{
				label: O("sidebar.generation.seed", "Seed"),
				value: Z(e?.seed_val ?? e?.seed)
			}
		]
	})) : Array.isArray(r.all_samplers) && r.all_samplers.length > 1 && (x = r.all_samplers.filter((e) => e && typeof e == "object").map((e, t) => ({
		label: qa(e, t),
		stage: String(e?.pass_stage || "").trim(),
		fields: [
			{
				label: O("sidebar.generation.model", "Model"),
				value: Z(e?.model)
			},
			{
				label: O("sidebar.generation.sampler", "Sampler"),
				value: Z(e?.sampler_name || e?.sampler)
			},
			{
				label: O("sidebar.generation.scheduler", "Scheduler"),
				value: Z(e?.scheduler)
			},
			{
				label: O("sidebar.generation.steps", "Steps"),
				value: Z(e?.steps)
			},
			{
				label: "CFG",
				value: Z(e?.cfg)
			},
			{
				label: O("sidebar.generation.denoise", "Denoise"),
				value: Z(e?.denoise)
			},
			{
				label: "Start",
				value: Z(e?.start_at_step)
			},
			{
				label: "End",
				value: Z(e?.end_at_step)
			},
			{
				label: O("sidebar.generation.seed", "Seed"),
				value: Z(e?.seed_val ?? e?.seed)
			}
		]
	})));
	let S = [];
	r.voice && S.push({
		label: O("sidebar.generation.narratorVoice", "Narrator Voice"),
		value: r.voice
	}), r.language && S.push({
		label: O("sidebar.generation.language", "Language"),
		value: r.language
	}), r.top_k !== void 0 && r.top_k !== null && S.push({
		label: "Top-k",
		value: r.top_k
	}), r.top_p !== void 0 && r.top_p !== null && S.push({
		label: "Top-p",
		value: r.top_p
	}), r.temperature !== void 0 && r.temperature !== null && S.push({
		label: O("sidebar.generation.temperature", "Temperature"),
		value: r.temperature
	}), r.repetition_penalty !== void 0 && r.repetition_penalty !== null && S.push({
		label: O("sidebar.generation.repetitionPenalty", "Repetition Penalty"),
		value: r.repetition_penalty
	}), r.max_new_tokens !== void 0 && r.max_new_tokens !== null && S.push({
		label: O("sidebar.generation.maxNewTokens", "Max New Tokens"),
		value: r.max_new_tokens
	});
	let C = [];
	r.device && C.push({
		label: O("sidebar.generation.device", "Device"),
		value: r.device
	}), r.voice_preset && C.push({
		label: O("sidebar.generation.voicePreset", "Voice Preset"),
		value: r.voice_preset
	}), r.dtype && C.push({
		label: O("sidebar.generation.dtype", "Dtype"),
		value: r.dtype
	}), r.attn_implementation && C.push({
		label: O("sidebar.generation.attention", "Attention"),
		value: r.attn_implementation
	}), r.compile_mode && C.push({
		label: O("sidebar.generation.compileMode", "Compile Mode"),
		value: r.compile_mode
	}), [
		to(O("sidebar.generation.torchCompile", "Torch Compile"), r.use_torch_compile),
		to(O("sidebar.generation.cudaGraphs", "CUDA Graphs"), r.use_cuda_graphs),
		to(O("sidebar.generation.xVectorOnly", "X-Vector Only"), r.x_vector_only_mode)
	].filter(Boolean).forEach((e) => C.push(e));
	let ee = [];
	[
		to(O("sidebar.generation.chunking", "Chunking"), r.enable_chunking),
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
		to(O("sidebar.generation.audioCache", "Audio Cache"), r.enable_audio_cache),
		r.batch_size !== void 0 && r.batch_size !== null ? {
			label: O("sidebar.generation.batchSize", "Batch Size"),
			value: r.batch_size
		} : null
	].filter(Boolean).forEach((e) => ee.push(e));
	let te = [];
	r.lyrics_strength !== void 0 && r.lyrics_strength !== null && te.push({
		label: O("sidebar.generation.lyricsStrength", "Lyrics Strength"),
		value: r.lyrics_strength
	});
	let w = [];
	$(b) && !v.some((e) => e.label === "Denoise") && w.push({
		label: O("sidebar.generation.denoise", "Denoise"),
		value: b
	}), $(r.clip_skip) && w.push({
		label: O("sidebar.generation.clipSkip", "Clip Skip"),
		value: r.clip_skip
	});
	let T = [], E = String(r.workflow_notes || r.notes || "").trim();
	E && T.push({
		label: O("sidebar.generation.workflowNotes", "Workflow Notes"),
		value: E,
		override: _o(o, "workflow_notes", "notes")
	});
	let ne = vo(r.custom_info), re = mo(r, h, v, x), D = ho(r, x, ne, l.workflowType), ie = fo(r, x), ae = Array.isArray(r.inputs) ? r.inputs.filter((e) => e && typeof e == "object" && e.filename).map((e, t) => ({
		id: `${e.filename}-${t}`,
		filename: String(e.filename || "").trim(),
		subfolder: String(e.subfolder || "").trim(),
		type: String(e.folder_type || "input").trim().toLowerCase(),
		root_id: String(e.root_id || e.rootId || "").trim(),
		kind: String(e.kind || e.media_kind || e.type || "").trim().toLowerCase(),
		filepath: Ga(e),
		role: String(e.role || "").trim(),
		roleLabel: String(e.role || "").trim().replace(/_/g, " "),
		isVideo: String(e.type || "").toLowerCase() === "video" || /\.(mp4|mov|webm)$/i.test(String(e.filename || "")),
		isAudio: String(e.type || "").toLowerCase() === "audio" || /\.(wav|mp3|flac|ogg|m4a|aac|opus)$/i.test(String(e.filename || "")),
		previewCandidates: Wa(e)
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
		positivePromptOverride: _o(o, "prompt", "positive", "positive_prompt"),
		negativePromptOverride: _o(o, "negative_prompt", "negative", "negativePrompt"),
		promptTabs: d,
		showAlignment: !!e?.id && (!!String(u.positive || "").trim() || d.length > 0),
		isImageAsset: Ra(e),
		lyrics: String(r.lyrics || "").trim(),
		modelFields: f,
		modelGroups: h,
		branchCards: re,
		pipelineTabs: x,
		samplingFields: v,
		ttsFields: S,
		ttsEngineFields: C,
		ttsInstruction: String(r.instruct || "").trim(),
		ttsRuntimeFields: ee,
		audioFields: te,
		seed: ie,
		imageFields: w,
		inputFiles: ae,
		isOverride: c,
		overrideLabel: c ? "Gen Info Override" : "",
		notesFields: T,
		customInfoBlocks: ne,
		moduleBlocks: D,
		ltxDirector: i,
		ideogram: a
	};
}
//#endregion
//#region ui/vue/components/panel/sidebar/GenerationInputThumb.vue
var So = ["title"], Co = ["src"], wo = {
	key: 1,
	style: {
		width: "100%",
		height: "100%",
		display: "flex",
		"flex-direction": "column",
		"align-items": "center",
		"justify-content": "center",
		gap: "4px",
		background: "linear-gradient(135deg, rgba(0,188,212,0.28), rgba(156,39,176,0.20))",
		color: "white",
		padding: "6px",
		"text-align": "center"
	}
}, To = { style: {
	"font-size": "8px",
	"font-weight": "700",
	"max-width": "54px",
	"white-space": "nowrap",
	overflow: "hidden",
	"text-overflow": "ellipsis"
} }, Eo = ["src"], Do = {
	key: 3,
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
}, Oo = {
	key: 4,
	title: "Video file",
	style: {
		position: "absolute",
		color: "white",
		opacity: "0.7",
		"font-size": "16px",
		"pointer-events": "none"
	}
}, ko = {
	__name: "GenerationInputThumb",
	props: { inputFile: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = B(0), r = B(!1), i = null;
		function a() {
			return i ||= import("./floatingViewerManager-CGdpmtv-.js").then((e) => e.n), i;
		}
		function o() {
			return (Array.isArray(t.inputFile?.previewCandidates) ? t.inputFile.previewCandidates : [])[n.value] || "";
		}
		function s() {
			let e = Array.isArray(t.inputFile?.previewCandidates) ? t.inputFile.previewCandidates : [];
			n.value < e.length - 1 && (n.value += 1);
		}
		async function c(e) {
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
		function l(e) {
			e?.stopPropagation?.(), h();
		}
		function u() {
			let e = t.inputFile || {}, n = String(e.filepath || "").trim();
			return {
				filename: e.filename || "",
				name: e.filename || "",
				filepath: n,
				path: n,
				subfolder: e.subfolder || "",
				type: e.type || "input",
				source: e.type || "input",
				kind: d(e),
				root_id: e.root_id || "",
				preview_url: o()
			};
		}
		function d(e = t.inputFile || {}) {
			let n = String(e.kind || "").trim().toLowerCase();
			if (n === "image" || n === "video" || n === "audio" || n === "model3d") return n;
			if (e.isVideo) return "video";
			if (e.isAudio) return "audio";
			let r = String(e.filename || "").toLowerCase();
			return /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(r) ? "video" : /\.(wav|mp3|flac|ogg|m4a|aac|opus)$/i.test(r) ? "audio" : /\.(glb|gltf|obj|stl|ply|fbx)$/i.test(r) ? "model3d" : "image";
		}
		function f(e, t, n, { disabled: r = !1 } = {}) {
			return {
				id: `mjr-generation-source-${String(e).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
				type: "item",
				label: e,
				iconClass: t,
				rightHint: "",
				tone: String(e).toLowerCase().includes("floating") ? "floating-viewer" : "",
				disabled: r,
				action: n
			};
		}
		function p() {
			return {
				id: "mjr-generation-source-separator",
				type: "separator"
			};
		}
		function m() {
			return Ka(o()) || !!t.inputFile?.filename || !!t.inputFile?.filepath;
		}
		function h() {
			if (Dt({
				asset: u(),
				index: 0
			})) return;
			let e = o();
			if (Ka(e)) try {
				window.open(e, "_blank", "noopener,noreferrer");
			} catch (e) {
				console.debug?.(e);
			}
		}
		async function g() {
			try {
				let { floatingViewerManager: e } = await a();
				await e.openAssets({
					assets: [u()],
					index: 0
				});
			} catch (e) {
				console.debug?.(e), T(O("toast.viewerOpenFailed", "Failed to open viewer."), "error");
			}
		}
		async function _() {
			let e = await ce(u());
			if (!e?.ok) {
				T(e?.error || O("toast.openFolderFailed", "Failed to open folder."), "error");
				return;
			}
			T(O("toast.openedInFolder", "Opened in folder"), "info", 1600);
		}
		async function v() {
			let e = u(), t = {
				filename: e.filename,
				subfolder: e.subfolder,
				type: e.type || "input",
				root_id: e.root_id || void 0,
				kind: e.kind
			}, n = await Fi({
				post: fe,
				endpoint: Le.STAGE_TO_INPUT,
				payload: t,
				index: !1
			});
			if (!n?.relativePath) {
				T(O("toast.loadAssetFailed", "Failed to load asset."), "error");
				return;
			}
			if (!ji({
				app: Ne(),
				items: [{
					payload: t,
					relativePath: n.relativePath,
					droppedExt: String(t.filename || "").split(".").pop() || ""
				}],
				event: null
			})) {
				T(O("toast.loadAssetFailed", "Failed to load asset."), "error");
				return;
			}
			T(O("toast.assetLoadedToCanvas", "{kind} loader added to canvas.", { kind: e.kind ? e.kind.charAt(0).toUpperCase() + e.kind.slice(1) : "Asset" }), "success", 1800);
		}
		function y(e) {
			e?.preventDefault?.(), e?.stopPropagation?.();
			let n = d(), r = n === "video" ? O("ctx.loadVideo", "Load video") : n === "audio" ? O("ctx.loadAudio", "Load audio") : n === "model3d" ? O("ctx.loadModel3d", "Load 3D model") : O("ctx.loadImage", "Load image");
			wr({
				x: e?.clientX || 0,
				y: e?.clientY || 0,
				items: [
					f(O("ctx.openInViewer", "Open in viewer"), "pi pi-eye", h, { disabled: !m() }),
					f(O("ctx.openInFloatingViewer", "Open in Floating Viewer"), "pi pi-window-maximize", g, { disabled: !m() }),
					f(O("ctx.openInFolder", "Open in folder"), "pi pi-folder-open", _, { disabled: !t.inputFile?.filepath }),
					p(),
					f(r, "pi pi-plus-circle", v, { disabled: !t.inputFile?.filename }),
					f(O("ctx.copyPath", "Copy path"), "pi pi-copy", c, { disabled: !(t.inputFile?.filepath || t.inputFile?.filename) })
				]
			});
		}
		function b(e) {
			e.target?.play?.().catch?.(() => {});
		}
		function x(e) {
			try {
				e.target?.pause?.();
			} catch (e) {
				console.debug?.(e);
			}
		}
		function S() {
			return !!t.inputFile?.isAudio;
		}
		return (t, n) => (j(), z("div", {
			title: `${e.inputFile.filename} (click to copy, double-click to open in new tab)`,
			style: V({
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
			onClick: c,
			onDblclick: l,
			onContextmenu: y
		}, [e.inputFile.isVideo ? (j(), z("video", {
			key: 0,
			src: o(),
			muted: "",
			loop: "",
			playsinline: "",
			preload: "metadata",
			style: {
				width: "100%",
				height: "100%",
				"object-fit": "cover"
			},
			onError: s,
			onMouseover: b,
			onMouseout: x
		}, null, 40, Co)) : S() ? (j(), z("div", wo, [n[0] ||= N("div", { style: {
			"font-size": "18px",
			"line-height": "1"
		} }, "♪", -1), N("div", To, R(e.inputFile.filename), 1)])) : (j(), z("img", {
			key: 2,
			src: o(),
			style: {
				width: "100%",
				height: "100%",
				"object-fit": "cover"
			},
			onError: s
		}, null, 40, Eo)), e.inputFile.role && e.inputFile.role !== "secondary" ? (j(), z("div", Do, R(e.inputFile.roleLabel), 1)) : e.inputFile.isVideo ? (j(), z("div", Oo, " Play ")) : F("", !0)], 44, So));
	}
}, Ao = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "12px"
	}
}, jo = {
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
}, Mo = { style: { opacity: "0.85" } }, No = { style: {
	display: "flex",
	"align-items": "center",
	gap: "8px",
	"flex-wrap": "wrap",
	"justify-content": "flex-end"
} }, Po = ["title"], Fo = ["title"], Io = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, Lo = { style: {
	"font-size": "11px",
	"font-weight": "700",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.6px"
} }, Ro = { style: {
	"font-size": "11px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"font-weight": "600"
} }, zo = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#FF9800",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Bo = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, Vo = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9E9E9E",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Ho = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, Uo = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "10px"
} }, Wo = { style: {
	"font-size": "11px",
	"font-weight": "800",
	color: "#26C6DA",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px"
} }, Go = {
	key: 0,
	style: {
		display: "grid",
		"grid-template-columns": "repeat(auto-fit,minmax(92px,1fr))",
		gap: "8px",
		"margin-bottom": "10px"
	}
}, Ko = { style: {
	"font-size": "9px",
	"font-weight": "800",
	color: "rgba(255,255,255,0.55)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, qo = { style: {
	"font-size": "12px",
	color: "var(--fg-color,#eee)",
	"font-weight": "650",
	"word-break": "break-word"
} }, Jo = {
	key: 1,
	style: {
		border: "1px solid rgba(76,175,80,0.36)",
		"border-radius": "6px",
		background: "rgba(76,175,80,0.10)",
		padding: "10px",
		"margin-bottom": "10px"
	}
}, Yo = ["title"], Xo = {
	key: 2,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "8px"
	}
}, Zo = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "7px"
} }, Qo = { style: {
	"font-size": "10px",
	"font-weight": "800",
	color: "#26C6DA",
	"text-transform": "uppercase",
	"letter-spacing": "0.45px"
} }, $o = { style: {
	display: "flex",
	"align-items": "center",
	gap: "5px",
	"flex-wrap": "wrap",
	"justify-content": "flex-end"
} }, es = {
	key: 0,
	style: {
		"font-size": "10px",
		color: "#A7FFEB",
		background: "rgba(0,150,136,0.16)",
		border: "1px solid rgba(0,150,136,0.30)",
		"border-radius": "4px",
		padding: "2px 6px",
		"font-weight": "700"
	}
}, ts = {
	key: 1,
	style: {
		"font-size": "10px",
		color: "#FFE082",
		background: "rgba(255,193,7,0.14)",
		border: "1px solid rgba(255,193,7,0.30)",
		"border-radius": "4px",
		padding: "2px 6px",
		"font-weight": "700"
	}
}, ns = { style: {
	display: "flex",
	gap: "10px",
	"align-items": "flex-start",
	"min-width": "0"
} }, rs = { style: {
	"min-width": "0",
	flex: "1"
} }, is = ["title", "onClick"], as = {
	key: 1,
	style: {
		"font-size": "10px",
		color: "rgba(255,255,255,0.58)",
		"margin-top": "7px",
		display: "flex",
		gap: "6px",
		"flex-wrap": "wrap"
	}
}, os = { key: 0 }, ss = { key: 1 }, cs = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "10px"
} }, ls = { style: {
	"font-size": "11px",
	"font-weight": "800",
	color: "#FFB300",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px"
} }, us = {
	key: 0,
	style: {
		display: "grid",
		"grid-template-columns": "repeat(auto-fit,minmax(100px,1fr))",
		gap: "8px",
		"margin-bottom": "10px"
	}
}, ds = { style: {
	"font-size": "9px",
	"font-weight": "800",
	color: "rgba(255,255,255,0.55)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, fs = { style: {
	"font-size": "12px",
	color: "var(--fg-color,#eee)",
	"font-weight": "650",
	"word-break": "break-word"
} }, ps = {
	key: 1,
	style: {
		border: "1px solid rgba(76,175,80,0.34)",
		"border-radius": "6px",
		background: "rgba(76,175,80,0.09)",
		padding: "10px",
		"margin-bottom": "10px"
	}
}, ms = ["title"], hs = {
	key: 2,
	style: {
		border: "1px solid rgba(33,150,243,0.32)",
		"border-radius": "6px",
		background: "rgba(33,150,243,0.08)",
		padding: "10px",
		"margin-bottom": "10px"
	}
}, gs = ["title"], _s = {
	key: 3,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "8px",
		"margin-bottom": "10px"
	}
}, vs = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "7px"
} }, ys = { style: {
	"font-size": "10px",
	"font-weight": "800",
	color: "#FFCA28",
	"text-transform": "uppercase",
	"letter-spacing": "0.45px"
} }, bs = {
	key: 0,
	style: {
		"font-size": "10px",
		color: "#FFE082",
		background: "rgba(255,193,7,0.14)",
		border: "1px solid rgba(255,193,7,0.30)",
		"border-radius": "4px",
		padding: "2px 6px",
		"font-weight": "700"
	}
}, xs = ["title", "onClick"], Ss = {
	key: 1,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "5px",
		"margin-top": "8px"
	}
}, Cs = ["title", "onClick"], ws = { style: {
	border: "1px solid rgba(255,179,0,0.30)",
	"border-radius": "6px",
	background: "rgba(0,0,0,0.16)",
	overflow: "hidden"
} }, Ts = ["title"], Es = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Ds = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"margin-bottom": "10px"
} }, Os = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "#4CAF50",
	"letter-spacing": "0.4px"
} }, ks = ["onClick"], As = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "#F44336",
	"letter-spacing": "0.4px",
	"margin-top": "4px"
} }, js = ["onClick"], Ms = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Ns = ["title"], Ps = ["title"], Fs = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#F44336",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Is = ["title"], Ls = ["title"], Rs = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between"
} }, zs = ["title"], Bs = { style: {
	display: "flex",
	"align-items": "center",
	gap: "10px"
} }, Vs = { style: {
	flex: "1",
	height: "8px",
	background: "rgba(255,255,255,0.1)",
	"border-radius": "4px",
	overflow: "hidden"
} }, Hs = {
	key: 0,
	style: {
		"font-size": "10px",
		color: "rgba(255,255,255,0.65)",
		border: "1px dashed rgba(255,255,255,0.25)",
		"border-radius": "4px",
		padding: "6px 8px",
		background: "rgba(255,255,255,0.04)"
	}
}, Us = { style: {
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
} }, Ws = ["title"], Gs = { style: {
	display: "flex",
	"align-items": "center",
	gap: "6px"
} }, Ks = ["title"], qs = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9C27B0",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Js = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(190px, 1fr))",
	gap: "10px"
} }, Ys = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.58)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Xs = ["onClick"], Zs = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "5px"
	}
}, Qs = ["onClick"], $s = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, ec = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, tc = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#FF9800",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, nc = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(130px, 1fr))",
	gap: "8px"
} }, rc = ["onClick"], ic = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9C27B0",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, ac = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(220px, 1fr))",
	gap: "10px"
} }, oc = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, sc = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "4px"
} }, cc = ["onClick"], lc = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "6px"
	}
}, uc = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.58)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, dc = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "5px"
} }, fc = ["onClick"], pc = { style: {
	display: "grid",
	"grid-template-columns": "auto 1fr",
	gap: "8px 12px",
	"align-items": "start"
} }, mc = ["title"], hc = ["title"], gc = ["title", "onClick"], _c = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, vc = ["title", "onClick"], yc = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#26C6DA",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, bc = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(190px, 1fr))",
	gap: "10px"
} }, xc = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.58)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Sc = ["title", "onClick"], Cc = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#26A69A",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, wc = ["title"], Tc = { style: {
	"font-size": "11px",
	"font-weight": "700",
	color: "#E91E63",
	"text-transform": "uppercase",
	"letter-spacing": "1px"
} }, Ec = ["title"], Dc = ["title"], Oc = { style: {
	display: "flex",
	gap: "8px",
	"flex-wrap": "wrap"
} }, kc = {
	__name: "SidebarGenerationSection",
	props: { asset: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = B(0), r = B(0), i = B(""), a = B(O("action.copy", "Copy")), o = B(O("action.generate", "Generate")), c = B(!1), l = B(d()), u = 0;
		function d() {
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
		let g = I(() => xo(t.asset)), _ = I(() => Ba()), v = I(() => g.value.kind === "full" || g.value.kind === "caption-only"), y = I(() => Ua(i.value) || g.value.emptyCaptionText), b = I(() => _.value && g.value.isImageAsset && !!t.asset?.id), x = I(() => _.value && !!Ua(y.value) && y.value !== g.value.emptyCaptionText), S = I(() => g.value.branchCards.filter((e) => e.modelFields.length || e.loras.length)), C = I(() => g.value.branchCards.filter((e) => e.samplingFields.length));
		I(() => g.value.branchCards.filter((e) => e.loras.length));
		let ee = I(() => {
			let e = [], t = (e, t) => Aa(e)?.title || t;
			return !S.value.length && g.value.modelFields.length && e.push({
				key: "model",
				title: t("model", O("sidebar.generation.modelLora", "Model & LoRA")),
				accent: "#9C27B0",
				emphasis: !0,
				fields: g.value.modelFields
			}), !C.value.length && g.value.samplingFields.length && e.push({
				key: "sampling",
				title: t("sampler", O("sidebar.generation.sampling", "Sampling")),
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
				title: O("sidebar.generation.audio", "Audio"),
				accent: "#00BCD4",
				emphasis: !1,
				fields: g.value.audioFields
			}), g.value.imageFields.length && e.push({
				key: "image",
				title: O("sidebar.generation.image", "Image"),
				accent: "#2196F3",
				emphasis: !1,
				fields: g.value.imageFields
			}), e;
		});
		function w(e, t, n = 450) {
			if (!e) return;
			let r = e.style.background;
			e.style.background = t, setTimeout(() => {
				e.style.background = r || "";
			}, n);
		}
		function T(e, t = !0) {
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
		function E(e) {
			return "#CE6DE0";
		}
		function ne(e) {
			let t = String(e?.key || "").toLowerCase();
			return t.includes("high") ? "#FFC107" : t.includes("low") ? "#FFB300" : t.includes("base") ? "#FF9800" : t.includes("upscale") || t.includes("refine") ? "#FFCA28" : t.includes("pass") ? "#FDD835" : "#FF9800";
		}
		function re(e) {
			return e === "high_noise" ? "#FF7043" : e === "low_noise" ? "#29B6F6" : "#AB47BC";
		}
		async function D(e, t = null, n = "rgba(76, 175, 80, 0.35)") {
			let r = String(e ?? "").trim();
			if (!(!r || r === "-")) try {
				await navigator.clipboard.writeText(r), w(t, n);
			} catch (e) {
				console.debug?.(e);
			}
		}
		function ie() {
			l.value = {
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
		function ae() {
			l.value = d();
		}
		async function oe() {
			u += 1;
			let e = u;
			if (!g.value.showAlignment || !t.asset?.id) {
				ae();
				return;
			}
			if (!_.value) {
				ie();
				return;
			}
			ae();
			try {
				let n = await te(t.asset.id);
				if (e !== u) return;
				if (!n?.ok && (String(n?.code || "").toUpperCase() === "SERVICE_UNAVAILABLE" || /vector search is not enabled/i.test(String(n?.error || "")))) {
					ie();
					return;
				}
				let r = n?.ok && n.data != null ? Number(n.data) : null;
				if (!Number.isFinite(r)) {
					l.value = {
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
				let i = Math.round(r * 100), a = Va(r);
				l.value = {
					scoreText: `${i}%`,
					scoreColor: a,
					qualityText: Ha(r),
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
		async function se() {
			if (!(!b.value || c.value)) {
				c.value = !0, o.value = O("status.generating", "Generating...");
				try {
					let e = await s(t.asset.id);
					e?.ok && (i.value = String(e?.data || "").trim());
				} catch (e) {
					console.debug?.(e);
				} finally {
					c.value = !1, o.value = O("action.generate", "Generate");
				}
			}
		}
		async function ce() {
			if (x.value) try {
				await navigator.clipboard.writeText(y.value), a.value = O("viewer.copySuccessShort", "Copied!"), setTimeout(() => {
					a.value = O("action.copy", "Copy");
				}, 900);
			} catch (e) {
				console.debug?.(e);
			}
		}
		return Ze(() => t.asset, () => {
			n.value = 0, r.value = 0, i.value = String(t.asset?.enhanced_caption || "").trim(), a.value = O("action.copy", "Copy"), o.value = O("action.generate", "Generate");
		}, { immediate: !0 }), Ze(() => [
			t.asset?.id,
			g.value.kind,
			g.value.showAlignment,
			_.value
		], () => {
			oe();
		}, { immediate: !0 }), (e, t) => {
			let r = nt("MButton");
			return g.value.kind === "empty" ? F("", !0) : (j(), z("div", Ao, [
				g.value.workflowType ? (j(), z("div", jo, [N("span", Mo, R(L(O)("viewer.workflow", "Workflow")), 1), N("div", No, [N("span", {
					title: L(O)("sidebar.generation.workflowEngine", "Workflow engine: {value}", { value: g.value.workflowType }),
					style: {
						background: "#2196F3",
						color: "white",
						padding: "2px 8px",
						"border-radius": "999px",
						"font-weight": "bold",
						"font-size": "10px",
						"letter-spacing": "0.2px"
					}
				}, R(g.value.workflowLabel || g.value.workflowType), 9, Po), g.value.workflowBadge ? (j(), z("span", {
					key: 0,
					title: L(O)("sidebar.generation.apiProvider", "API provider: {value}", { value: g.value.workflowBadge }),
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
				}, R(g.value.workflowBadge), 9, Fo)) : F("", !0)])])) : F("", !0),
				g.value.isOverride ? (j(), z("div", {
					key: 1,
					style: V(p("#00BCD4", {
						emphasis: !0,
						startAlpha: .14,
						endAlpha: .08
					}))
				}, [N("div", Io, [N("span", Lo, R(L(O)("sidebar.generation.override", "Override")), 1), N("span", Ro, R(g.value.overrideLabel), 1)])], 4)) : F("", !0),
				g.value.isTruncated ? (j(), z("div", {
					key: 2,
					style: V(p("#FF9800", {
						emphasis: !0,
						startAlpha: .12,
						endAlpha: .08
					}))
				}, [N("div", zo, R(L(O)("sidebar.generation.metadataTruncated", "Metadata Truncated")), 1), N("div", Bo, R(L(O)("sidebar.generation.metadataTruncatedBody", "Generation data is incomplete because it exceeded the size limit.")), 1)], 4)) : F("", !0),
				g.value.kind === "media-only" ? (j(), z("div", {
					key: 3,
					style: V(p("#9E9E9E", {
						emphasis: !0,
						startAlpha: .1,
						endAlpha: .06
					}))
				}, [N("div", Vo, R(L(O)("sidebar.generation.generationData", "Generation Data")), 1), N("div", Ho, R(g.value.mediaOnlyMessage), 1)], 4)) : F("", !0),
				g.value.kind === "full" ? (j(), z(M, { key: 4 }, [
					g.value.ltxDirector ? (j(), z("div", {
						key: 0,
						style: V(p("#26C6DA", {
							emphasis: !0,
							startAlpha: .15,
							endAlpha: .08
						}))
					}, [
						N("div", Uo, [N("div", Wo, R(g.value.ltxDirector.title || "LTX Director"), 1), t[8] ||= N("span", { style: {
							"font-size": "10px",
							"font-weight": "700",
							color: "#26C6DA",
							background: "rgba(38,198,218,0.14)",
							border: "1px solid rgba(38,198,218,0.32)",
							"border-radius": "999px",
							padding: "2px 8px"
						} }, " Director ", -1)]),
						g.value.ltxDirector.fields.length ? (j(), z("div", Go, [(j(!0), z(M, null, P(g.value.ltxDirector.fields, (e) => (j(), z("div", {
							key: `ltx-field-${e.label}`,
							style: {
								border: "1px solid rgba(255,255,255,0.10)",
								"border-radius": "6px",
								background: "rgba(255,255,255,0.045)",
								padding: "7px 8px",
								"min-width": "0"
							}
						}, [N("div", Ko, R(e.label), 1), N("div", qo, R(e.value), 1)]))), 128))])) : F("", !0),
						g.value.ltxDirector.globalPrompt ? (j(), z("div", Jo, [t[9] ||= N("div", { style: {
							"font-size": "10px",
							"font-weight": "800",
							color: "#66BB6A",
							"text-transform": "uppercase",
							"letter-spacing": "0.45px",
							"margin-bottom": "6px"
						} }, " Global Prompt ", -1), N("div", {
							title: L(O)("action.clickToCopy", "Click to copy"),
							style: {
								"font-size": "12px",
								color: "var(--fg-color,#eee)",
								"line-height": "1.45",
								"white-space": "pre-wrap",
								"word-break": "break-word",
								cursor: "pointer"
							},
							onClick: t[0] ||= (e) => D(g.value.ltxDirector.globalPrompt, e.currentTarget)
						}, R(g.value.ltxDirector.globalPrompt), 9, Yo)])) : F("", !0),
						g.value.ltxDirector.segments.length ? (j(), z("div", Xo, [(j(!0), z(M, null, P(g.value.ltxDirector.segments, (e) => (j(), z("div", {
							key: e.key,
							style: {
								border: "1px solid rgba(38,198,218,0.30)",
								"border-radius": "6px",
								background: "rgba(38,198,218,0.075)",
								padding: "10px"
							}
						}, [N("div", Zo, [N("div", Qo, R(e.label), 1), N("div", $o, [e.inLabel ? (j(), z("span", es, " in " + R(e.inLabel), 1)) : F("", !0), e.outLabel ? (j(), z("span", ts, " out " + R(e.outLabel), 1)) : F("", !0)])]), N("div", ns, [e.filename ? (j(), Xe(ko, {
							key: 0,
							"input-file": {
								filename: e.filename,
								filepath: e.filepath || e.filename,
								role: e.type || "segment",
								roleLabel: e.type || "segment",
								isVideo: e.isVideo,
								isAudio: e.isAudio,
								previewCandidates: e.previewCandidates
							}
						}, null, 8, ["input-file"])) : F("", !0), N("div", rs, [e.prompt ? (j(), z("div", {
							key: 0,
							title: L(O)("action.clickToCopy", "Click to copy"),
							style: {
								"font-size": "12px",
								color: "var(--fg-color,#eee)",
								"line-height": "1.45",
								"white-space": "pre-wrap",
								"word-break": "break-word",
								cursor: "pointer"
							},
							onClick: (t) => D(e.prompt, t.currentTarget)
						}, R(e.prompt), 9, is)) : F("", !0), e.filename || e.type ? (j(), z("div", as, [e.type ? (j(), z("span", os, R(e.type), 1)) : F("", !0), e.filename ? (j(), z("span", ss, R(e.filename), 1)) : F("", !0)])) : F("", !0)])])]))), 128))])) : F("", !0)
					], 4)) : F("", !0),
					g.value.ideogram ? (j(), z("div", {
						key: 1,
						style: V(p("#FFB300", {
							emphasis: !0,
							startAlpha: .15,
							endAlpha: .08
						}))
					}, [
						N("div", cs, [N("div", ls, R(g.value.ideogram.title || "Ideogram 4"), 1), t[10] ||= N("span", { style: {
							"font-size": "10px",
							"font-weight": "700",
							color: "#FFCA28",
							background: "rgba(255,179,0,0.14)",
							border: "1px solid rgba(255,179,0,0.32)",
							"border-radius": "999px",
							padding: "2px 8px"
						} }, " Prompt JSON ", -1)]),
						g.value.ideogram.fields.length ? (j(), z("div", us, [(j(!0), z(M, null, P(g.value.ideogram.fields, (e) => (j(), z("div", {
							key: `ideogram-field-${e.label}`,
							style: {
								border: "1px solid rgba(255,255,255,0.10)",
								"border-radius": "6px",
								background: "rgba(255,255,255,0.045)",
								padding: "7px 8px",
								"min-width": "0"
							}
						}, [N("div", ds, R(e.label), 1), N("div", fs, R(e.value), 1)]))), 128))])) : F("", !0),
						g.value.ideogram.highLevelDescription ? (j(), z("div", ps, [t[11] ||= N("div", { style: {
							"font-size": "10px",
							"font-weight": "800",
							color: "#81C784",
							"text-transform": "uppercase",
							"letter-spacing": "0.45px",
							"margin-bottom": "6px"
						} }, " High Level Description ", -1), N("div", {
							title: L(O)("action.clickToCopy", "Click to copy"),
							style: {
								"font-size": "12px",
								color: "var(--fg-color,#eee)",
								"line-height": "1.45",
								"white-space": "pre-wrap",
								"word-break": "break-word",
								cursor: "pointer"
							},
							onClick: t[1] ||= (e) => D(g.value.ideogram.highLevelDescription, e.currentTarget)
						}, R(g.value.ideogram.highLevelDescription), 9, ms)])) : F("", !0),
						g.value.ideogram.background ? (j(), z("div", hs, [t[12] ||= N("div", { style: {
							"font-size": "10px",
							"font-weight": "800",
							color: "#64B5F6",
							"text-transform": "uppercase",
							"letter-spacing": "0.45px",
							"margin-bottom": "6px"
						} }, " Background ", -1), N("div", {
							title: L(O)("action.clickToCopy", "Click to copy"),
							style: {
								"font-size": "12px",
								color: "var(--fg-color,#eee)",
								"line-height": "1.45",
								"white-space": "pre-wrap",
								"word-break": "break-word",
								cursor: "pointer"
							},
							onClick: t[2] ||= (e) => D(g.value.ideogram.background, e.currentTarget)
						}, R(g.value.ideogram.background), 9, gs)])) : F("", !0),
						g.value.ideogram.elements.length ? (j(), z("div", _s, [(j(!0), z(M, null, P(g.value.ideogram.elements, (e) => (j(), z("div", {
							key: e.key,
							style: {
								border: "1px solid rgba(255,179,0,0.30)",
								"border-radius": "6px",
								background: "rgba(255,179,0,0.075)",
								padding: "10px"
							}
						}, [
							N("div", vs, [N("div", ys, R(e.label), 1), e.bbox ? (j(), z("span", bs, " bbox " + R(e.bbox), 1)) : F("", !0)]),
							e.description ? (j(), z("div", {
								key: 0,
								title: L(O)("action.clickToCopy", "Click to copy"),
								style: {
									"font-size": "12px",
									color: "var(--fg-color,#eee)",
									"line-height": "1.45",
									"white-space": "pre-wrap",
									"word-break": "break-word",
									cursor: "pointer"
								},
								onClick: (t) => D(e.description, t.currentTarget)
							}, R(e.description), 9, xs)) : F("", !0),
							e.palette.length ? (j(), z("div", Ss, [(j(!0), z(M, null, P(e.palette, (t) => (j(), z("span", {
								key: `${e.key}-${t}`,
								title: t,
								style: V({
									width: "18px",
									height: "18px",
									borderRadius: "4px",
									border: "1px solid rgba(255,255,255,0.28)",
									background: t
								}),
								onClick: (e) => D(t, e.currentTarget)
							}, null, 12, Cs))), 128))])) : F("", !0)
						]))), 128))])) : F("", !0),
						N("details", ws, [t[13] ||= N("summary", { style: {
							cursor: "pointer",
							padding: "8px 10px",
							"font-size": "10px",
							"font-weight": "800",
							color: "#FFCA28",
							"text-transform": "uppercase",
							"letter-spacing": "0.45px"
						} }, " JSON sent to text encoder ", -1), N("pre", {
							title: L(O)("action.clickToCopy", "Click to copy"),
							style: {
								margin: "0",
								padding: "10px",
								"max-height": "260px",
								overflow: "auto",
								"font-size": "11px",
								"line-height": "1.35",
								color: "rgba(255,255,255,0.9)",
								"white-space": "pre-wrap",
								"word-break": "break-word",
								cursor: "pointer"
							},
							onClick: t[3] ||= (e) => D(g.value.ideogram.json, e.currentTarget)
						}, R(g.value.ideogram.json), 9, Ts)])
					], 4)) : F("", !0),
					!g.value.ltxDirector && !g.value.ideogram && g.value.promptTabs.length ? (j(), z("div", {
						key: 2,
						style: V(p("#4CAF50", {
							emphasis: !0,
							startAlpha: .16,
							endAlpha: .1
						}))
					}, [
						N("div", Es, R(L(O)("sidebar.generation.promptPipeline", "Prompt Pipeline ({count} variants)", { count: g.value.promptTabs.length })), 1),
						N("div", Ds, [(j(!0), z(M, null, P(g.value.promptTabs, (e, t) => (j(), Xe(r, {
							key: e.label,
							type: "button",
							severity: "secondary",
							text: "",
							rounded: "",
							style: V({
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
							default: yt(() => [Ye(R(e.label), 1)]),
							_: 2
						}, 1032, ["style", "onClick"]))), 128))]),
						(j(!0), z(M, null, P(g.value.promptTabs, (e, t) => Qe((j(), z("div", {
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
							N("div", Os, R(L(O)("sidebar.generation.positive", "POSITIVE")), 1),
							N("div", {
								style: {
									"font-size": "12px",
									color: "var(--fg-color, #ddd)",
									"white-space": "pre-wrap",
									"line-height": "1.35",
									cursor: "pointer"
								},
								onClick: (t) => D(e.positive, t.currentTarget)
							}, R(e.positive), 9, ks),
							e.negative ? (j(), z(M, { key: 0 }, [N("div", As, R(L(O)("sidebar.generation.negative", "NEGATIVE")), 1), N("div", {
								style: {
									"font-size": "12px",
									color: "var(--fg-color, #ddd)",
									"white-space": "pre-wrap",
									"line-height": "1.35",
									cursor: "pointer"
								},
								onClick: (t) => D(e.negative, t.currentTarget)
							}, R(e.negative), 9, js)], 64)) : F("", !0)
						])), [[at, n.value === t]])), 128))
					], 4)) : !g.value.ltxDirector && !g.value.ideogram && g.value.positivePrompt ? (j(), z("div", {
						key: 3,
						style: V(p("#4CAF50", {
							emphasis: !0,
							startAlpha: .16,
							endAlpha: .1
						}))
					}, [N("div", Ms, [N("span", null, R(L(O)("sidebar.generation.positivePrompt", "Positive Prompt")), 1), g.value.positivePromptOverride ? (j(), z("span", {
						key: 0,
						style: V(h()),
						title: L(O)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
					}, R(L(O)("sidebar.generation.override", "override")), 13, Ns)) : F("", !0)]), N("div", {
						title: L(O)("action.clickToCopy", "Click to copy"),
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.9))",
							"line-height": "1.5",
							"white-space": "pre-wrap",
							"word-break": "break-word",
							cursor: "pointer"
						},
						onClick: t[4] ||= (e) => D(g.value.positivePrompt, e.currentTarget)
					}, R(g.value.positivePrompt), 9, Ps)], 4)) : F("", !0),
					!g.value.ltxDirector && !g.value.ideogram && !g.value.promptTabs.length && g.value.negativePrompt ? (j(), z("div", {
						key: 4,
						style: V(p("#F44336", {
							emphasis: !0,
							startAlpha: .16,
							endAlpha: .1
						}))
					}, [N("div", Fs, [N("span", null, R(L(O)("sidebar.generation.negativePrompt", "Negative Prompt")), 1), g.value.negativePromptOverride ? (j(), z("span", {
						key: 0,
						style: V(h()),
						title: L(O)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
					}, R(L(O)("sidebar.generation.override", "override")), 13, Is)) : F("", !0)]), N("div", {
						title: L(O)("action.clickToCopy", "Click to copy"),
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.9))",
							"line-height": "1.5",
							"white-space": "pre-wrap",
							"word-break": "break-word",
							cursor: "pointer"
						},
						onClick: t[5] ||= (e) => D(g.value.negativePrompt, e.currentTarget)
					}, R(g.value.negativePrompt), 9, Ls)], 4)) : F("", !0)
				], 64)) : F("", !0),
				v.value ? (j(), z("div", {
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
					class: mt({ "mjr-ai-disabled-block": !_.value })
				}, [
					g.value.showAlignment ? (j(), z(M, { key: 0 }, [
						N("div", Rs, [N("span", { title: L(O)("sidebar.generation.promptAlignmentTooltip", "How closely the generated image matches the prompt (SigLIP2 score)") }, R(L(O)("sidebar.generation.promptAlignment", "Prompt Alignment")), 9, zs)]),
						N("div", Bs, [
							N("div", Vs, [N("div", { style: V({
								height: "100%",
								width: l.value.fillWidth,
								background: l.value.fillColor,
								borderRadius: "4px",
								transition: "width 0.6s ease, background 0.4s ease"
							}) }, null, 4)]),
							N("span", { style: V({
								fontSize: "13px",
								fontWeight: "700",
								color: l.value.scoreColor,
								minWidth: "60px",
								textAlign: "right",
								fontFamily: "'Consolas', 'Monaco', monospace"
							}) }, R(l.value.scoreText), 5),
							N("span", { style: V({
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
						l.value.aiStatusVisible ? (j(), z("div", Hs, R(l.value.aiStatusText), 1)) : F("", !0)
					], 64)) : F("", !0),
					N("div", Us, [N("span", { title: L(O)("sidebar.generation.aiCaptionTooltip", "AI caption generated by Florence-2") }, R(g.value.captionLabel), 9, Ws), N("div", Gs, [ft(r, {
						type: "button",
						class: "mjr-ai-control",
						severity: "secondary",
						text: "",
						disabled: !b.value || c.value,
						style: V([{
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
						onClick: tt(se, ["stop"])
					}, {
						default: yt(() => [Ye(R(o.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"]), ft(r, {
						type: "button",
						class: "mjr-ai-control",
						severity: "secondary",
						text: "",
						disabled: !x.value,
						style: V([{
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
						onClick: tt(ce, ["stop"])
					}, {
						default: yt(() => [Ye(R(a.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"])])]),
					N("div", {
						title: _.value ? L(O)("sidebar.generation.copyCaptionTooltip", "Click to copy caption") : L(O)("sidebar.generation.aiCaptionDisabled", "AI caption controls are disabled"),
						style: V({
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
						onClick: ce
					}, R(y.value), 13, Ks)
				], 2)) : F("", !0),
				S.value.length ? (j(), z("div", {
					key: 6,
					style: V(p("#9C27B0", {
						emphasis: !0,
						startAlpha: .18,
						endAlpha: .1
					}))
				}, [N("div", qs, R(L(O)("sidebar.generation.models", "Models")), 1), N("div", Js, [(j(!0), z(M, null, P(S.value, (e) => (j(), z("div", {
					key: `models-top-${e.key}`,
					style: V(T(E(e), !0))
				}, [
					N("div", { style: V({
						fontSize: "10px",
						fontWeight: "800",
						color: E(e),
						letterSpacing: "0.6px",
						textTransform: "uppercase"
					}) }, R(e.label), 5),
					(j(!0), z(M, null, P(e.modelFields, (t) => (j(), z("div", {
						key: `model-top-${e.key}-${t.label}`,
						style: {
							display: "flex",
							"flex-direction": "column",
							gap: "3px",
							"min-width": "0"
						}
					}, [N("span", Ys, R(t.label), 1), N("span", {
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.96))",
							"line-height": "1.35",
							"word-break": "break-word",
							cursor: "pointer"
						},
						onClick: (e) => D(t.value, e.currentTarget)
					}, R(t.value || "-"), 9, Xs)]))), 128)),
					e.loras.length ? (j(), z("div", Zs, [t[14] ||= N("span", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.58)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "LoRA", -1), (j(!0), z(M, null, P(e.loras, (t, n) => (j(), z("span", {
						key: `model-top-${e.key}-lora-${n}`,
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.92))",
							"line-height": "1.35",
							"word-break": "break-word",
							padding: "6px 8px",
							"border-radius": "6px",
							background: "rgba(255,255,255,0.05)",
							border: "1px solid rgba(255,255,255,0.08)",
							cursor: "pointer"
						},
						onClick: (e) => D(t, e.currentTarget)
					}, R(t), 9, Qs))), 128))])) : F("", !0)
				], 4))), 128))])], 4)) : F("", !0),
				g.value.lyrics ? (j(), z("div", {
					key: 7,
					style: V(p("#00BCD4", { emphasis: !1 }))
				}, [N("div", $s, [N("span", null, R(L(O)("sidebar.generation.lyrics", "Lyrics")), 1)]), N("div", ec, R(g.value.lyrics), 1)], 4)) : F("", !0),
				g.value.branchCards.length ? (j(), z(M, { key: 8 }, [
					F("", !0),
					C.value.length ? (j(), z("div", {
						key: 1,
						style: V(p("#FF9800", {
							emphasis: !0,
							startAlpha: .16,
							endAlpha: .1
						}))
					}, [N("div", tc, R(L(O)("sidebar.generation.sampling", "Sampling")), 1), N("div", nc, [(j(!0), z(M, null, P(C.value, (e) => (j(), z("div", {
						key: `sampling-${e.key}`,
						style: V(T(ne(e), !0))
					}, [N("div", { style: V({
						fontSize: "10px",
						fontWeight: "800",
						color: ne(e),
						letterSpacing: "0.6px",
						textTransform: "uppercase"
					}) }, R(e.label), 5), (j(!0), z(M, null, P(e.samplingFields, (t) => (j(), z("div", {
						key: `sampling-row-${e.key}-${t.label}`,
						style: {
							display: "grid",
							"grid-template-columns": "minmax(48px,0.8fr) minmax(0,1fr)",
							gap: "8px",
							"font-size": "11px",
							color: "rgba(255,255,255,0.72)",
							"align-items": "start"
						}
					}, [N("span", null, R(t.label), 1), N("span", {
						style: {
							color: "var(--fg-color, #ddd)",
							"word-break": "break-word",
							"text-align": "right",
							cursor: "pointer"
						},
						onClick: (e) => D(t.value, e.currentTarget)
					}, R(t.value), 9, rc)]))), 128))], 4))), 128))])], 4)) : F("", !0),
					F("", !0)
				], 64)) : g.value.modelGroups.length ? (j(), z("div", {
					key: 9,
					style: V(p("#9C27B0", {
						emphasis: !0,
						startAlpha: .18,
						endAlpha: .1
					}))
				}, [N("div", ic, R(L(O)("sidebar.generation.models", "Models")), 1), N("div", ac, [(j(!0), z(M, null, P(g.value.modelGroups, (e) => (j(), z("div", {
					key: `model-group-${e.key}`,
					style: V(T(re(e.key), !0))
				}, [
					N("div", oc, [N("div", { style: V({
						fontSize: "10px",
						fontWeight: "800",
						color: re(e.key),
						letterSpacing: "0.6px",
						textTransform: "uppercase"
					}) }, R(e.label), 5), N("span", { style: V({
						fontSize: "9px",
						fontWeight: "700",
						color: "#fff",
						background: f(re(e.key), .22),
						border: `1px solid ${f(re(e.key), .48)}`,
						borderRadius: "999px",
						padding: "2px 8px",
						letterSpacing: "0.4px",
						textTransform: "uppercase"
					}) }, R(e.loras?.length || 0) + " LoRA ", 5)]),
					N("div", sc, [t[15] ||= N("div", { style: {
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
						onClick: (t) => D(e.model, t.currentTarget)
					}, R(e.model || "-"), 9, cc)]),
					e.loras?.length ? (j(), z("div", lc, [N("div", uc, R(L(O)("sidebar.generation.loraStack", "LoRA Stack")), 1), N("div", dc, [(j(!0), z(M, null, P(e.loras, (t, n) => (j(), z("div", {
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
						onClick: (e) => D(t, e.currentTarget)
					}, R(t), 9, fc))), 128))])])) : F("", !0)
				], 4))), 128))])], 4)) : F("", !0),
				(j(!0), z(M, null, P(ee.value, (e) => (j(), z("div", {
					key: e.key,
					style: V(p(e.accent, { emphasis: e.emphasis }))
				}, [N("div", { style: V({
					fontSize: "11px",
					fontWeight: "600",
					color: e.accent,
					textTransform: "uppercase",
					letterSpacing: "0.5px",
					marginBottom: "10px"
				}) }, R(e.title), 5), N("div", pc, [(j(!0), z(M, null, P(e.fields, (t) => (j(), z(M, { key: `${e.key}-${t.label}` }, [N("div", {
					title: t.label,
					style: {
						"font-size": "11px",
						color: "var(--mjr-muted, rgba(127,127,127,0.9))",
						"font-weight": "500",
						display: "flex",
						"align-items": "center",
						gap: "6px"
					}
				}, [N("span", null, R(t.label) + ":", 1), t.override ? (j(), z("span", {
					key: 0,
					style: V(h()),
					title: L(O)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
				}, R(L(O)("sidebar.generation.override", "override")), 13, hc)) : F("", !0)], 8, mc), N("div", {
					title: `${t.label}: ${t.value}`,
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.95))",
						"word-break": "break-word",
						"white-space": "pre-wrap",
						cursor: "pointer"
					},
					onClick: (e) => D(t.value, e.currentTarget)
				}, R(t.value), 9, gc)], 64))), 128))])], 4))), 128)),
				g.value.notesFields.length ? (j(), z("div", {
					key: 10,
					style: V(p("#4CAF50", { emphasis: !1 }))
				}, [N("div", _c, R(L(O)("sidebar.generation.notes", "Notes")), 1), (j(!0), z(M, null, P(g.value.notesFields, (e) => (j(), z("div", {
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
					onClick: (t) => D(e.value, t.currentTarget)
				}, R(e.value), 9, vc))), 128))], 4)) : F("", !0),
				g.value.moduleBlocks.length ? (j(), z("div", {
					key: 11,
					style: V(p("#26C6DA", {
						emphasis: !0,
						startAlpha: .14,
						endAlpha: .08
					}))
				}, [N("div", yc, R(L(O)("sidebar.generation.modules", "Modules")), 1), N("div", bc, [(j(!0), z(M, null, P(g.value.moduleBlocks, (e) => (j(), z("div", {
					key: `module-${e.key}-${e.title}`,
					style: V(T(e.accent, !1))
				}, [N("div", { style: V({
					fontSize: "10px",
					fontWeight: "800",
					color: e.accent,
					letterSpacing: "0.6px",
					textTransform: "uppercase"
				}) }, R(e.title), 5), (j(!0), z(M, null, P(e.fields, (t) => (j(), z("div", {
					key: `module-${e.key}-${t.label}`,
					style: {
						display: "flex",
						"flex-direction": "column",
						gap: "3px",
						"min-width": "0"
					}
				}, [N("span", xc, R(t.label), 1), N("span", {
					title: `${t.label}: ${t.value}`,
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.35",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: (e) => D(t.value, e.currentTarget)
				}, R(t.value), 9, Sc)]))), 128))], 4))), 128))])], 4)) : F("", !0),
				g.value.ttsInstruction ? (j(), z("div", {
					key: 12,
					style: V(p("#26A69A", { emphasis: !1 }))
				}, [N("div", Cc, [N("span", null, R(L(O)("sidebar.generation.ttsInstruction", "TTS Instruction")), 1)]), N("div", {
					title: L(O)("action.clickToCopy", "Click to copy"),
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: t[6] ||= (e) => D(g.value.ttsInstruction, e.currentTarget)
				}, R(g.value.ttsInstruction), 9, wc)], 4)) : F("", !0),
				g.value.seed !== null && g.value.seed !== void 0 && g.value.seed !== "" ? (j(), z("div", {
					key: 13,
					style: V(m())
				}, [N("div", Tc, R(L(O)("sidebar.generation.seed", "SEED")), 1), N("div", {
					title: L(O)("sidebar.generation.copySeedTooltip", "Click to copy seed: {seed}", { seed: g.value.seed }),
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
					onClick: t[7] ||= (e) => D(g.value.seed, e.currentTarget, "rgba(76, 175, 80, 0.4)")
				}, R(g.value.seed), 9, Ec)], 4)) : F("", !0),
				g.value.inputFiles.length ? (j(), z("div", {
					key: 14,
					style: V(p("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [N("div", {
					title: L(O)("tooltip.generationInputs", "Input files used in generation"),
					style: {
						"font-size": "11px",
						"font-weight": "600",
						color: "#4CAF50",
						"text-transform": "uppercase",
						"letter-spacing": "0.5px",
						"margin-bottom": "8px"
					}
				}, R(L(O)("sidebar.generation.sourceFiles", "Source Files")), 9, Dc), N("div", Oc, [(j(!0), z(M, null, P(g.value.inputFiles, (e) => (j(), Xe(ko, {
					key: e.id,
					"input-file": e
				}, null, 8, ["input-file"]))), 128))])], 4)) : F("", !0)
			]));
		};
	}
}, Ac = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "var(--comfy-menu-bg, rgba(0,0,0,0.2))",
		border: "1px solid var(--border-color, rgba(255,255,255,0.14))",
		"border-radius": "8px",
		padding: "12px",
		"min-width": "300px"
	}
}, jc = { style: { "margin-bottom": "12px" } }, Mc = { style: {
	"font-size": "16px",
	"font-weight": "800",
	color: "rgba(255,255,255,0.94)",
	"line-height": "1.25",
	overflow: "hidden",
	"text-overflow": "ellipsis"
} }, Nc = ["title"], Pc = {
	key: 1,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "6px",
		"margin-top": "8px",
		"min-width": "0"
	},
	"aria-label": "Workflow metadata badges"
}, Fc = ["title"], Ic = { style: {
	overflow: "hidden",
	"text-overflow": "ellipsis",
	"white-space": "nowrap"
} }, Lc = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "8px",
	"margin-bottom": "10px"
} }, Rc = { style: {
	padding: "4px 9px",
	"border-radius": "999px",
	background: "rgba(33,150,243,0.14)",
	border: "1px solid rgba(33,150,243,0.30)",
	"font-size": "11px",
	"font-weight": "700",
	color: "#90CAF9",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, zc = {
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
}, Bc = { style: {
	display: "grid",
	"grid-template-columns": "repeat(2, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, Vc = {
	key: 0,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, Hc = { style: {
	"font-size": "13px",
	"font-weight": "750",
	color: "rgba(255,255,255,0.92)",
	"margin-top": "3px"
} }, Uc = {
	key: 1,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, Wc = { style: {
	"font-size": "13px",
	"font-weight": "750",
	color: "rgba(255,255,255,0.92)",
	"margin-top": "3px"
} }, Gc = {
	key: 2,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, Kc = { style: {
	"font-size": "13px",
	"font-weight": "750",
	color: "rgba(255,255,255,0.92)",
	"margin-top": "3px"
} }, qc = {
	key: 3,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, Jc = { style: {
	"font-size": "12px",
	"font-weight": "650",
	color: "rgba(255,255,255,0.84)",
	"margin-top": "3px"
} }, Yc = {
	key: 0,
	style: {
		"font-size": "11px",
		color: "rgba(255,255,255,0.54)",
		"margin-top": "2px"
	}
}, Xc = {
	key: 0,
	style: {
		"margin-bottom": "12px",
		padding: "10px",
		"border-radius": "10px",
		background: "rgba(244,67,54,0.08)",
		border: "1px solid rgba(244,67,54,0.25)"
	}
}, Zc = {
	key: 1,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "5px"
	}
}, Qc = {
	key: 1,
	style: {
		"margin-bottom": "12px",
		padding: "10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.035)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, $c = {
	key: 0,
	style: {
		"font-size": "12px",
		"line-height": "1.45",
		color: "rgba(255,255,255,0.82)",
		"white-space": "pre-wrap"
	}
}, el = { style: {
	display: "grid",
	"grid-template-columns": "repeat(3, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, tl = {
	key: 2,
	style: {
		"margin-bottom": "12px",
		padding: "10px",
		"border-radius": "10px",
		background: "rgba(76,175,80,0.07)",
		border: "1px solid rgba(76,175,80,0.22)"
	}
}, nl = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "7px"
} }, rl = { style: {
	"font-size": "11px",
	color: "rgba(255,255,255,0.62)"
} }, il = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "6px"
	}
}, al = {
	key: 0,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "5px"
	}
}, ol = {
	key: 1,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "5px"
	}
}, sl = {
	key: 1,
	style: {
		"font-size": "12px",
		color: "rgba(255,255,255,0.78)"
	}
}, cl = {
	key: 2,
	style: {
		"margin-top": "7px",
		"font-size": "11px",
		color: "rgba(255,255,255,0.58)"
	}
}, ll = {
	key: 3,
	style: {
		"margin-top": "8px",
		"font-size": "11px",
		color: "rgba(255,255,255,0.62)"
	}
}, ul = { key: 0 }, dl = { style: {
	display: "grid",
	"grid-template-columns": "repeat(3, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, fl = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, pl = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, ml = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, hl = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, gl = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, _l = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, vl = { style: {
	"margin-bottom": "12px",
	padding: "10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.03)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, yl = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px",
	"margin-bottom": "8px",
	"min-width": "0"
} }, bl = { style: {
	"min-width": "0",
	flex: "1 1 auto"
} }, xl = ["title"], Sl = ["title"], Cl = { style: {
	display: "flex",
	gap: "8px",
	"align-items": "center"
} }, wl = ["placeholder"], Tl = {
	key: 3,
	class: "mjr-workflow-tree-wrap"
}, El = { class: "mjr-workflow-tree-node" }, Dl = { class: "mjr-workflow-tree-node-name" }, Ol = {
	key: 0,
	class: "mjr-workflow-tree-node-type"
}, kl = { class: "mjr-menu-item-hint" }, Al = {
	key: 0,
	class: "mjr-section-hint"
}, jl = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px",
	"margin-top": "8px"
} }, Ml = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"align-items": "center"
} }, Nl = {
	key: 4,
	style: {
		display: "grid",
		"grid-template-columns": "repeat(auto-fit, minmax(180px, 1fr))",
		gap: "8px",
		"align-items": "stretch",
		"margin-top": "10px",
		"margin-bottom": "10px"
	}
}, Pl = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "2px",
	"min-width": "0"
} }, Fl = { style: {
	"font-size": "13px",
	"font-weight": "600"
} }, Il = { style: {
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, Ll = { style: {
	display: "flex",
	gap: "10px",
	"align-items": "stretch",
	"margin-top": "10px"
} }, Rl = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	gap: "10px",
	"margin-top": "8px",
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, zl = ["open"], Bl = { style: {
	background: "rgba(0,0,0,0.5)",
	padding: "10px",
	"border-radius": "6px",
	"font-size": "11px",
	overflow: "auto",
	"max-height": "180px",
	margin: "10px 0 0 0",
	color: "#90CAF9",
	"font-family": "'Consolas', 'Monaco', monospace"
} }, Vl = 1, Hl = 8, Ul = 250, Wl = {
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
		]), a = B(null), o = B(""), s = B(!1), l = B(!1), u = B(null), d = B(!1), f = B(null), p = B([]), h = B(null), _ = B(!1), v = B(!1), y = B(ce()), b = B({ ...r }), S = B("crosshair"), ee = B(""), te = null, w = null, E = null;
		function ne(e, t, n) {
			let r = Number(e);
			return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
		}
		function re(e) {
			!e || typeof e != "object" || (b.value = {
				...b.value,
				zoom: ne(e.zoom ?? b.value.zoom, Vl, Hl),
				centerX: Number.isFinite(Number(e.centerX)) ? Number(e.centerX) : null,
				centerY: Number.isFinite(Number(e.centerY)) ? Number(e.centerY) : null
			});
		}
		function D() {
			b.value = { ...r }, ee.value = "";
		}
		function ie(e) {
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
		function ae(e) {
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
		function oe(e) {
			let t = ie(e), n = e?.workflow || e?.Workflow || e?.comfy_workflow || t?.workflow || t?.Workflow || t?.comfy_workflow || null;
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
		function se(e) {
			let t = ie(e), n = e?.prompt || e?.Prompt || t?.prompt || t?.Prompt || null;
			if (!n) return null;
			if (typeof n == "object") return ae(n) ? n : null;
			if (typeof n == "string") {
				let e = n.trim();
				if (!e) return null;
				try {
					let t = JSON.parse(e);
					return ae(t) ? t : null;
				} catch {
					return null;
				}
			}
			return null;
		}
		function ce() {
			try {
				let e = Ut?.()?.workflowMinimap;
				if (e && typeof e == "object") return {
					...n,
					...e
				};
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let e = localStorage?.getItem?.(le);
				if (!e) return { ...n };
				let t = JSON.parse(e);
				if (!t || typeof t != "object") return { ...n };
				let r = {
					...n,
					...t
				};
				try {
					let e = Ut();
					e.workflowMinimap = {
						...e.workflowMinimap,
						...r
					}, G(e), localStorage?.removeItem?.(le);
				} catch (e) {
					console.debug?.(e);
				}
				return r;
			} catch {
				return { ...n };
			}
		}
		function ue(e) {
			try {
				let t = Ut();
				t.workflowMinimap = {
					...t.workflowMinimap,
					...e
				}, G(t);
			} catch (e) {
				console.debug?.(e);
			}
		}
		let de = I(() => {
			let e = oe(t.asset) || oe(u.value), n = se(t.asset) || se(u.value);
			return !e && !n ? null : e || ua(n);
		}), fe = I(() => String(t.asset?.filepath || t.asset?.path || t.asset?.file_info?.filepath || "").trim()), pe = I(() => String(t.asset?.display_name || t.asset?.name || t.asset?.filename || t.asset?.title || "Workflow").trim()), me = I(() => String(t.asset?.task || t.asset?.workflow_task || "").trim()), he = I(() => String(t.asset?.model_family || t.asset?.workflow_model_family || "").trim()), _e = I(() => String(t.asset?.provider || t.asset?.workflow_provider || "").trim()), ve = I(() => String(t.asset?.runs_on || t.asset?.runsOn || "").trim().toLowerCase()), ye = I(() => {
			let e = ve.value, t = _e.value;
			return e === "api" && t ? `API · ${t}` : e ? t && t.toLowerCase() !== e ? `${e} · ${t}` : e : t;
		}), be = I(() => String(t.asset?.notes || "").trim()), Se = I(() => [
			t.asset?.detected_task ? `detected: ${t.asset.detected_task}` : "",
			t.asset?.detected_model_family ? t.asset.detected_model_family : "",
			t.asset?.detected_provider ? t.asset.detected_provider : ""
		].filter(Boolean).join(" · ")), Ce = I(() => Le(t.asset?.missing_nodes || t.asset?.missingNodes)), we = I(() => Le(t.asset?.missing_models || t.asset?.missingModels)), Te = I(() => Le(t.asset?.tags || t.asset?.workflow_tags || t.asset?.tags_json)), Ee = I(() => Te.value.slice(0, 3)), De = I(() => Math.max(0, Te.value.length - Ee.value.length)), Oe = I(() => Le(f.value?.missing_nodes)), ke = I(() => Le(f.value?.missing_models)), Ae = I(() => Le(f.value?.warnings)), je = I(() => {
			let e = f.value;
			return e ? `${Number(e.node_count || 0)} nodes | ${Number(e.subgraph_count || 0)} subgraphs | ${Array.isArray(e.required_nodes) ? e.required_nodes.length : 0} node types` : "";
		}), Me = I(() => {
			let e = p.value?.[0];
			return e ? String(e.filename || "").replace(/\.json$/i, "") : "";
		}), Ne = I(() => {
			let e = h.value;
			return e ? `${Number(e.changed?.length || 0)} changed | ${Number(e.added?.length || 0)} added | ${Number(e.removed?.length || 0)} removed` : "";
		}), Pe = I(() => {
			let e = Number(t.asset?.usage_count || t.asset?.usageCount || 0);
			return !Number.isFinite(e) || e <= 0 ? "" : `${Math.floor(e)} use${e === 1 ? "" : "s"}`;
		}), k = I(() => Re(t.asset?.last_loaded_at || t.asset?.lastLoadedAt)), Fe = I(() => Re(t.asset?.mtime || t.asset?.modified_at || t.asset?.updated_at)), Ie = I(() => {
			let e = [];
			t.asset?.favorite && e.push({
				key: "favorite",
				label: "Favorite",
				icon: "pi pi-star-fill",
				tone: "favorite"
			}), Pe.value && e.push({
				key: "usage",
				label: Pe.value,
				icon: "pi pi-play-circle",
				tone: "usage"
			}), k.value && e.push({
				key: "last-loaded",
				label: `Loaded ${k.value}`,
				icon: "pi pi-clock",
				tone: "loaded"
			});
			for (let t of Ee.value) e.push({
				key: `tag-${t}`,
				label: t,
				icon: "pi pi-tag",
				tone: "tag"
			});
			return De.value && e.push({
				key: "tags-more",
				label: `+${De.value} tags`,
				icon: "pi pi-tags",
				tone: "tag"
			}), e;
		});
		function A(e) {
			let t = "display:inline-flex;align-items:center;gap:5px;max-width:100%;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:750;line-height:1.1;overflow:hidden";
			return e === "favorite" ? `${t};background:rgba(255,193,7,0.15);border:1px solid rgba(255,193,7,0.34);color:#ffe082` : e === "usage" ? `${t};background:rgba(33,150,243,0.14);border:1px solid rgba(33,150,243,0.30);color:#90caf9` : e === "loaded" ? `${t};background:rgba(76,175,80,0.13);border:1px solid rgba(76,175,80,0.28);color:#a5d6a7` : `${t};background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.14);color:rgba(255,255,255,0.82)`;
		}
		function Le(e) {
			if (Array.isArray(e)) return e.map((e) => String(e || "").trim()).filter(Boolean);
			if (typeof e == "string") {
				let t = e.trim();
				if (!t) return [];
				try {
					let e = JSON.parse(t);
					if (Array.isArray(e)) return Le(e);
				} catch {
					return t.split(/[,\n]/).map((e) => e.trim()).filter(Boolean);
				}
			}
			return [];
		}
		function Re(e) {
			let t = Number(e);
			if (!Number.isFinite(t) || t <= 0) return "";
			let n = t > 1e10 ? t : t * 1e3;
			try {
				return new Date(n).toLocaleString();
			} catch {
				return "";
			}
		}
		async function ze() {
			if (de.value) return;
			let e = fe.value;
			if (e && !l.value) {
				l.value = !0;
				try {
					let t = await x(e, { timeoutMs: 25e3 });
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
		let Ve = I(() => t.asset?.has_generation_data ? "Complete" : "Partial"), He = I(() => de.value ? JSON.stringify(de.value, null, 2) : ""), Ue = I(() => String(t.asset?.category || t.asset?.subfolder || t.asset?.folder || "").trim().replace(/^\/+|\/+$/g, "")), We = I(() => Ue.value ? Ue.value.split(/[\\/]+/).filter(Boolean) : []), Ge = I(() => We.value.at(-1) || Ue.value || "Root"), Ke = I(() => We.value.slice(-1));
		function qe(e, t) {
			let n = e?.id ?? e?.key ?? t + 1;
			return String(e?.title || e?._meta?.title || e?.type || e?.class_type || e?.name || `Node ${n}`);
		}
		function tt(e) {
			return String(e?.type || e?.class_type || e?.name || "").trim();
		}
		function rt() {
			o.value = Ue.value;
		}
		async function it() {
			let e = String(t.asset?.filepath || t.asset?.path || t.asset?.file_info?.filepath || "").trim();
			if (!e) {
				T(O("toast.workflowMissingPath", "Workflow file path is missing."), "error");
				return;
			}
			let n = String(o.value || "").trim();
			if (n !== Ue.value) {
				s.value = !0;
				try {
					let t = await g({
						filepath: e,
						category: n
					}, { timeoutMs: 3e4 });
					if (!t?.ok) {
						T(t?.error || O("toast.workflowMoveFailed", "Failed to move workflow."), "error");
						return;
					}
					o.value = String(t?.data?.workflow?.category || n || "").trim(), T(O("toast.workflowCategoryUpdated", "Workflow category updated"), "success", 1800);
				} catch {
					T(O("toast.workflowMoveFailed", "Failed to move workflow."), "error");
				} finally {
					s.value = !1;
				}
			}
		}
		async function at() {
			let e = fe.value;
			if (!e) {
				T(O("toast.workflowMissingPath", "Workflow file path is missing."), "error");
				return;
			}
			let n = await xe({
				filepath: e,
				limit: 12
			}, { timeoutMs: 15e3 });
			if (!n?.ok) {
				T(n?.error || O("toast.workflowLoadFailed", "Failed to load workflow."), "error");
				return;
			}
			let r = Array.isArray(n.data) ? n.data : [];
			if (!r.length) {
				T(O("toast.workflowThumbnailNoCandidates", "No linked outputs are available for this workflow yet."), "warning", 2600);
				return;
			}
			let i = await fa({
				title: O("ctx.setWorkflowThumbnail", "Set workflow thumbnail"),
				workflow: t.asset,
				items: r
			});
			if (!i?.filepath) return;
			let a = await m({
				filepath: e,
				source_filepath: i.filepath
			}, { timeoutMs: 3e4 });
			if (!a?.ok) {
				T(a?.error || O("toast.workflowSaveFailed", "Failed to save workflow."), "error");
				return;
			}
			T(O("toast.workflowUpdated", "Workflow updated"), "success", 1800), window?.dispatchEvent?.(new CustomEvent("mjr:reload-grid", { detail: { reason: "workflow-thumbnail-sidebar" } }));
		}
		async function ot() {
			if (await ze(), !de.value) {
				T(O("toast.workflowLoadFailed", "Failed to load workflow."), "error");
				return;
			}
			try {
				await Je.openAssets({
					assets: [{
						...t.asset,
						workflow: de.value,
						Workflow: de.value
					}],
					index: 0,
					mode: "graph"
				});
			} catch (e) {
				console.debug?.(e), T(O("toast.workflowLoadFailed", "Failed to load workflow."), "error");
			}
		}
		async function st() {
			let e = fe.value;
			if (!e) {
				T(O("toast.workflowMissingPath", "Workflow file path is missing."), "error");
				return;
			}
			d.value = !0, f.value = null, p.value = [], h.value = null;
			try {
				let [t, n] = await Promise.all([c(e, { timeoutMs: 2e4 }), C(e, { timeoutMs: 15e3 })]);
				if (!t?.ok) {
					T(t?.error || O("toast.workflowLoadFailed", "Failed to load workflow."), "error");
					return;
				}
				f.value = t.data || {}, p.value = Array.isArray(n?.data?.versions) ? n.data.versions : [];
				let r = p.value[0];
				if (r?.filepath) {
					let t = await ge(e, r.filepath, { timeoutMs: 15e3 });
					t?.ok && (h.value = t.data || null);
				}
			} catch (e) {
				console.debug?.(e), T(O("toast.workflowLoadFailed", "Failed to load workflow."), "error");
			} finally {
				d.value = !1;
			}
		}
		let ct = I(() => (Array.isArray(de.value?.nodes) ? de.value.nodes : []).slice(0, Ul).map((e, t) => {
			let n = e?.id ?? e?.key ?? t + 1, r = tt(e);
			return {
				key: String(n),
				label: qe(e, t),
				icon: "pi pi-circle-fill",
				data: {
					id: n,
					type: r
				}
			};
		})), lt = I(() => Math.max(0, Number(ut.value.nodes || 0) - ct.value.length)), ut = I(() => {
			let e = de.value;
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
		}), dt = I(() => {
			let e = String(y.value?.size || "comfortable");
			return i.find((t) => t.key === e) || i[1];
		}), pt = I(() => `${dt.value.height}px`), ht = I(() => [
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
		function gt() {
			let e = a.value, t = de.value;
			if (!e || !t) return;
			let n = Math.max(1, e.clientWidth || 320), r = Math.max(1, e.clientHeight || 120), i = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
			e.width = Math.floor(n * i), e.height = Math.floor(r * i);
			let o = e.getContext("2d");
			o && o.setTransform(i, 0, 0, i, 0, 0), w = ea(e, t, {
				...y.value,
				view: b.value
			}) || null, re(w?.resolvedView);
		}
		function _t(e) {
			Be(e);
		}
		function vt(e) {
			let t = a.value;
			if (!t) return null;
			let n = t.getBoundingClientRect?.();
			return n ? {
				x: Number(e?.clientX) - n.left,
				y: Number(e?.clientY) - n.top
			} : null;
		}
		function bt(e) {
			let t = vt(e);
			return !t || !w?.canvasToWorld ? null : {
				local: t,
				world: w.canvasToWorld(t.x, t.y)
			};
		}
		function xt(e) {
			let t = vt(e), n = t && w?.hitTestNode ? w.hitTestNode(t.x, t.y) : null, r = n?.id !== null && n?.id !== void 0 ? String(n.id) : null, i = b.value.hoveredNodeId !== null && b.value.hoveredNodeId !== void 0 ? String(b.value.hoveredNodeId) : null;
			ee.value = n?.label || "", r !== i && (b.value = {
				...b.value,
				hoveredNodeId: r
			}, gt());
		}
		function St(e) {
			e && (_t(e), b.value = {
				...b.value,
				centerX: Number(e.x),
				centerY: Number(e.y)
			}, gt());
		}
		function Ct(e) {
			if (Number(e?.button ?? 0) !== 0) return;
			let t = bt(e);
			t && (E = e.pointerId ?? 1, S.value = "grabbing", a.value?.setPointerCapture?.(E), St(t.world), xt(e), e.preventDefault?.(), e.stopPropagation?.());
		}
		function wt(e) {
			if (E !== null && e.pointerId === E) {
				let t = bt(e);
				t && St(t.world), e.preventDefault?.(), e.stopPropagation?.();
				return;
			}
			xt(e);
		}
		function Et(e) {
			E !== null && e?.pointerId === E && (a.value?.releasePointerCapture?.(E), E = null, S.value = "crosshair"), e?.type === "pointerleave" && (ee.value = "", b.value.hoveredNodeId !== null && (b.value = {
				...b.value,
				hoveredNodeId: null
			}, gt()));
		}
		function Dt(e) {
			let t = bt(e), n = w?.resolvedView;
			if (!t || !n) return;
			let r = ne(Number(e?.deltaY) || 0, -240, 240), i = Math.exp(-r * .0025), a = ne((Number(b.value.zoom) || 1) * i, Vl, Hl);
			if (Math.abs(a - (Number(b.value.zoom) || 1)) < .001) {
				e.preventDefault?.(), e.stopPropagation?.();
				return;
			}
			let o = Math.max(1, Number(w?.bounds?.width || 1) / a), s = Math.max(1, Number(w?.bounds?.height || 1) / a), c = ne((Number(t.world.x) - Number(n.viewMinX || 0)) / Math.max(1, Number(n.visibleW || 1)), 0, 1), l = ne((Number(t.world.y) - Number(n.viewMinY || 0)) / Math.max(1, Number(n.visibleH || 1)), 0, 1);
			b.value = {
				...b.value,
				zoom: a,
				centerX: Number(t.world.x) + (.5 - c) * o,
				centerY: Number(t.world.y) + (.5 - l) * s
			}, gt(), xt(e), e.preventDefault?.(), e.stopPropagation?.();
		}
		function Ot(e) {
			let t = bt(e);
			D(), t && _t(t.world), gt(), e.preventDefault?.(), e.stopPropagation?.();
		}
		function kt(e) {
			y.value = {
				...y.value,
				[e]: !y.value?.[e]
			}, ue(y.value);
		}
		function At(e) {
			i.some((t) => t.key === e) && (y.value = {
				...y.value,
				size: e
			}, ue(y.value));
		}
		return et(() => {
			a.value && typeof ResizeObserver == "function" && (te = new ResizeObserver(() => gt()), te.observe(a.value)), rt(), ze(), gt();
		}), Ze(de, () => {
			D(), gt();
		}, { flush: "post" }), Ze(fe, () => {
			u.value = null, ze();
		}, { immediate: !0 }), Ze(Ue, () => {
			rt();
		}), Ze(y, () => {
			gt();
		}, {
			deep: !0,
			flush: "post"
		}), Ze(_, () => {
			gt();
		}, { flush: "post" }), $e(() => {
			try {
				te?.disconnect?.();
			} catch (e) {
				console.debug?.(e);
			}
			te = null, E = null;
		}), (e, t) => {
			let n = nt("MButton"), r = nt("MTree");
			return de.value ? (j(), z("div", Ac, [
				t[18] ||= N("div", { style: {
					"font-size": "13px",
					"font-weight": "600",
					color: "var(--fg-color, #eaeaea)",
					"margin-bottom": "12px",
					"text-transform": "uppercase",
					"letter-spacing": "0.5px"
				} }, " ComfyUI Workflow ", -1),
				N("div", jc, [
					N("div", Mc, R(pe.value), 1),
					fe.value ? (j(), z("div", {
						key: 0,
						style: {
							"font-size": "11px",
							color: "rgba(255,255,255,0.48)",
							"margin-top": "4px",
							overflow: "hidden",
							"text-overflow": "ellipsis",
							"white-space": "nowrap"
						},
						title: fe.value
					}, R(fe.value), 9, Nc)) : F("", !0),
					Ie.value.length ? (j(), z("div", Pc, [(j(!0), z(M, null, P(Ie.value, (e) => (j(), z("span", {
						key: e.key,
						style: V(A(e.tone)),
						title: e.label
					}, [N("i", {
						class: mt(e.icon),
						style: {
							"font-size": "10px",
							flex: "0 0 auto"
						}
					}, null, 2), N("span", Ic, R(e.label), 1)], 12, Fc))), 128))])) : F("", !0)
				]),
				N("div", Lc, [N("div", Rc, R(Ve.value), 1), ut.value.source ? (j(), z("div", zc, R(ut.value.source), 1)) : F("", !0)]),
				N("div", Bc, [
					me.value ? (j(), z("div", Vc, [t[3] ||= N("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Task", -1), N("div", Hc, R(me.value), 1)])) : F("", !0),
					he.value ? (j(), z("div", Uc, [t[4] ||= N("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Model", -1), N("div", Wc, R(he.value), 1)])) : F("", !0),
					ye.value ? (j(), z("div", Gc, [t[5] ||= N("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Runs on", -1), N("div", Kc, R(ye.value), 1)])) : F("", !0),
					Pe.value || Fe.value ? (j(), z("div", qc, [
						t[6] ||= N("div", { style: {
							"font-size": "10px",
							"font-weight": "700",
							color: "rgba(255,255,255,0.55)",
							"text-transform": "uppercase",
							"letter-spacing": "0.4px"
						} }, "Library", -1),
						N("div", Jc, R(Pe.value || Fe.value), 1),
						Pe.value && Fe.value ? (j(), z("div", Yc, R(Fe.value), 1)) : F("", !0)
					])) : F("", !0)
				]),
				Ce.value.length || we.value.length ? (j(), z("div", Xc, [
					t[7] ||= N("div", { style: {
						"font-size": "10px",
						"font-weight": "800",
						color: "#ef9a9a",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px",
						"margin-bottom": "6px"
					} }, "Missing dependencies", -1),
					Ce.value.length ? (j(), z("div", {
						key: 0,
						style: V({
							display: "flex",
							flexWrap: "wrap",
							gap: "5px",
							marginBottom: we.value.length ? "7px" : "0"
						})
					}, [(j(!0), z(M, null, P(Ce.value, (e) => (j(), z("span", {
						key: `node-${e}`,
						style: {
							padding: "3px 7px",
							"border-radius": "999px",
							background: "rgba(244,67,54,0.16)",
							"font-size": "10px",
							"font-weight": "700",
							color: "#ffcdd2"
						}
					}, R(e), 1))), 128))], 4)) : F("", !0),
					we.value.length ? (j(), z("div", Zc, [(j(!0), z(M, null, P(we.value, (e) => (j(), z("span", {
						key: `model-${e}`,
						style: {
							padding: "3px 7px",
							"border-radius": "999px",
							background: "rgba(255,152,0,0.16)",
							"font-size": "10px",
							"font-weight": "700",
							color: "#ffe0b2"
						}
					}, R(e), 1))), 128))])) : F("", !0)
				])) : F("", !0),
				be.value || Se.value ? (j(), z("div", Qc, [be.value ? (j(), z("div", $c, R(be.value), 1)) : F("", !0), Se.value ? (j(), z("div", {
					key: 1,
					style: V({
						fontSize: "11px",
						color: "rgba(255,255,255,0.48)",
						marginTop: be.value ? "7px" : "0"
					})
				}, R(Se.value), 5)) : F("", !0)])) : F("", !0),
				N("div", el, [
					ft(n, {
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
						onClick: at
					}, {
						default: yt(() => [t[8] ||= N("i", { class: "pi pi-image" }, null, -1), N("span", null, R(L(O)("ctx.setWorkflowThumbnail", "Set workflow thumbnail")), 1)]),
						_: 1
					}),
					ft(n, {
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
						onClick: ot
					}, {
						default: yt(() => [t[9] ||= N("i", { class: "pi pi-search" }, null, -1), N("span", null, R(L(O)("ctx.inspect", "Inspect")), 1)]),
						_: 1
					}),
					ft(n, {
						type: "button",
						severity: "secondary",
						text: "",
						rounded: "",
						disabled: d.value,
						style: {
							height: "34px",
							"border-radius": "9px",
							border: "1px solid rgba(255,255,255,0.12)",
							background: "rgba(76,175,80,0.12)",
							color: "rgba(255,255,255,0.92)",
							"font-size": "12px",
							"font-weight": "750",
							display: "inline-flex",
							"align-items": "center",
							"justify-content": "center",
							gap: "7px"
						},
						onClick: st
					}, {
						default: yt(() => [N("i", { class: mt(d.value ? "pi pi-spin pi-spinner" : "pi pi-check-circle") }, null, 2), N("span", null, R(d.value ? "Checking" : "Validate"), 1)]),
						_: 1
					}, 8, ["disabled"])
				]),
				f.value ? (j(), z("div", tl, [
					N("div", nl, [t[10] ||= N("div", { style: {
						"font-size": "10px",
						"font-weight": "800",
						color: "#a5d6a7",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Workflow diagnostics", -1), N("div", rl, R(je.value), 1)]),
					Oe.value.length || ke.value.length ? (j(), z("div", il, [Oe.value.length ? (j(), z("div", al, [(j(!0), z(M, null, P(Oe.value, (e) => (j(), z("span", {
						key: `diag-node-${e}`,
						style: {
							padding: "3px 7px",
							"border-radius": "999px",
							background: "rgba(244,67,54,0.16)",
							"font-size": "10px",
							"font-weight": "700",
							color: "#ffcdd2"
						}
					}, " Missing node: " + R(e), 1))), 128))])) : F("", !0), ke.value.length ? (j(), z("div", ol, [(j(!0), z(M, null, P(ke.value, (e) => (j(), z("span", {
						key: `diag-model-${e}`,
						style: {
							padding: "3px 7px",
							"border-radius": "999px",
							background: "rgba(255,152,0,0.16)",
							"font-size": "10px",
							"font-weight": "700",
							color: "#ffe0b2"
						}
					}, " Missing model: " + R(e), 1))), 128))])) : F("", !0)])) : (j(), z("div", sl, " No missing dependencies detected by the current ComfyUI runtime. ")),
					Ae.value.length ? (j(), z("div", cl, R(Ae.value.join(" | ")), 1)) : F("", !0),
					Me.value || Ne.value ? (j(), z("div", ll, [Ye(" Latest version: " + R(Me.value || "none"), 1), Ne.value ? (j(), z("span", ul, " | Diff: " + R(Ne.value), 1)) : F("", !0)])) : F("", !0)
				])) : F("", !0),
				N("div", dl, [
					N("div", fl, [t[11] ||= N("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Nodes", -1), N("div", pl, R(ut.value.nodes), 1)]),
					N("div", ml, [t[12] ||= N("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Links", -1), N("div", hl, R(ut.value.links), 1)]),
					N("div", gl, [t[13] ||= N("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Groups", -1), N("div", _l, R(ut.value.groups), 1)])
				]),
				N("div", vl, [N("div", yl, [N("div", bl, [t[14] ||= N("div", { style: {
					"font-size": "10px",
					"font-weight": "700",
					color: "rgba(255,255,255,0.55)",
					"text-transform": "uppercase",
					"letter-spacing": "0.4px"
				} }, "Category", -1), N("div", {
					title: Ue.value || "Root",
					style: {
						"font-size": "12px",
						color: "rgba(255,255,255,0.8)",
						"margin-top": "2px",
						overflow: "hidden",
						"text-overflow": "ellipsis",
						"white-space": "nowrap",
						"max-width": "100%"
					}
				}, R(Ge.value), 9, xl)]), Ke.value.length ? (j(), z("div", {
					key: 0,
					title: Ue.value,
					style: {
						display: "flex",
						"flex-wrap": "wrap",
						gap: "4px",
						"justify-content": "flex-end",
						"min-width": "0",
						"max-width": "45%"
					}
				}, [(j(!0), z(M, null, P(Ke.value, (e) => (j(), z("span", {
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
						"letter-spacing": "0.3px",
						"max-width": "100%",
						overflow: "hidden",
						"text-overflow": "ellipsis",
						"white-space": "nowrap"
					}
				}, R(e), 1))), 128))], 8, Sl)) : F("", !0)]), N("div", Cl, [Qe(N("input", {
					"onUpdate:modelValue": t[0] ||= (e) => o.value = e,
					type: "text",
					placeholder: L(O)("dialog.workflowCategory", "Workflow category"),
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
				}, null, 8, wl), [[Tt, o.value]]), ft(n, {
					type: "button",
					severity: "secondary",
					text: "",
					rounded: "",
					disabled: s.value,
					style: V({
						padding: "8px 12px",
						borderRadius: "8px",
						border: "1px solid rgba(255,255,255,0.12)",
						background: s.value ? "rgba(255,255,255,0.06)" : "rgba(33,150,243,0.16)",
						color: "rgba(255,255,255,0.92)",
						cursor: s.value ? "wait" : "pointer",
						fontSize: "12px",
						fontWeight: "700",
						whiteSpace: "nowrap"
					}),
					onClick: it
				}, {
					default: yt(() => [Ye(R(s.value ? "Saving..." : "Move"), 1)]),
					_: 1
				}, 8, ["disabled", "style"])])]),
				ct.value.length ? (j(), z("div", Tl, [
					t[15] ||= N("div", { class: "mjr-section-title" }, " Workflow Nodes ", -1),
					ft(r, {
						value: ct.value,
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
						default: yt(({ node: e }) => [N("span", El, [
							N("span", Dl, R(e.label), 1),
							e.data?.type ? (j(), z("span", Ol, R(e.data.type), 1)) : F("", !0),
							N("span", kl, "#" + R(e.data?.id), 1)
						])]),
						_: 1
					}, 8, ["value"]),
					lt.value ? (j(), z("div", Al, " +" + R(lt.value) + " more nodes ", 1)) : F("", !0)
				])) : F("", !0),
				N("div", jl, [N("div", Ml, [(j(!0), z(M, null, P(L(i), (e) => (j(), Xe(n, {
					key: e.key,
					type: "button",
					severity: "secondary",
					text: "",
					rounded: "",
					title: `${e.label} minimap`,
					style: V({
						appearance: "none",
						border: y.value.size === e.key ? "1px solid rgba(33,150,243,0.55)" : "1px solid rgba(255,255,255,0.12)",
						borderRadius: "999px",
						padding: "4px 10px",
						background: y.value.size === e.key ? "rgba(33,150,243,0.18)" : "rgba(255,255,255,0.04)",
						color: y.value.size === e.key ? "#90CAF9" : "rgba(255,255,255,0.78)",
						fontSize: "11px",
						fontWeight: y.value.size === e.key ? "700" : "600",
						cursor: "pointer"
					}),
					onClick: (t) => At(e.key)
				}, {
					default: yt(() => [Ye(R(e.label), 1)]),
					_: 2
				}, 1032, [
					"title",
					"style",
					"onClick"
				]))), 128))]), ft(n, {
					type: "button",
					class: "mjr-btn mjr-icon-btn",
					severity: "secondary",
					text: "",
					rounded: "",
					title: L(O)("tooltip.minimapSettings", "Minimap settings"),
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
					onClick: t[1] ||= (e) => _.value = !_.value
				}, {
					default: yt(() => [...t[16] ||= [N("i", { class: "pi pi-sliders-h" }, null, -1)]]),
					_: 1
				}, 8, ["title"])]),
				_.value ? (j(), z("div", Nl, [(j(!0), z(M, null, P(ht.value, (e) => (j(), Xe(n, {
					key: e.key,
					type: "button",
					severity: "secondary",
					text: "",
					style: V({
						display: "flex",
						alignItems: "center",
						gap: "10px",
						padding: "9px 10px",
						borderRadius: "10px",
						border: y.value?.[e.key] ? "1px solid rgba(76,175,80,0.40)" : "1px solid rgba(255,255,255,0.12)",
						background: y.value?.[e.key] ? "rgba(76,175,80,0.10)" : "rgba(255,255,255,0.04)",
						cursor: "pointer",
						color: "rgba(255,255,255,0.92)",
						textAlign: "left"
					}),
					onClick: (t) => kt(e.key)
				}, {
					default: yt(() => [
						N("span", { style: V({
							width: "22px",
							height: "22px",
							borderRadius: "6px",
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							background: y.value?.[e.key] ? "rgba(76,175,80,0.95)" : "rgba(255,255,255,0.08)",
							border: y.value?.[e.key] ? "1px solid rgba(76,175,80,0.35)" : "1px solid rgba(255,255,255,0.12)",
							flex: "0 0 auto"
						}) }, [N("i", {
							class: "pi pi-check",
							style: V({
								fontSize: "12px",
								opacity: y.value?.[e.key] ? "1" : "0"
							})
						}, null, 4)], 4),
						N("i", {
							class: mt(e.iconClass),
							style: {
								"font-size": "18px",
								opacity: "0.9",
								width: "18px"
							}
						}, null, 2),
						N("div", Pl, [N("div", Fl, R(e.label), 1), N("div", Il, R(y.value?.[e.key] ? "On" : "Off"), 1)])
					]),
					_: 2
				}, 1032, ["style", "onClick"]))), 128))])) : F("", !0),
				N("div", Ll, [N("canvas", {
					ref_key: "canvasRef",
					ref: a,
					style: V({
						width: "100%",
						height: pt.value,
						cursor: S.value,
						touchAction: "none",
						borderRadius: "10px",
						marginTop: "0",
						background: "linear-gradient(180deg, rgba(7, 12, 18, 0.95) 0%, rgba(10, 16, 24, 0.92) 100%)",
						border: "1px solid var(--mjr-border, rgba(255,255,255,0.12))",
						boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03)"
					}),
					onPointerdown: Ct,
					onPointermove: wt,
					onPointerup: Et,
					onPointercancel: Et,
					onPointerleave: Et,
					onWheel: Dt,
					onDblclick: Ot
				}, null, 36)]),
				N("div", Rl, [N("span", null, R(ee.value || "Click/drag to navigate | wheel to zoom"), 1), N("span", null, R(Math.round((b.value.zoom || 1) * 100)) + "% | " + R(dt.value.label), 1)]),
				N("details", {
					open: v.value,
					style: { "margin-top": "10px" },
					onToggle: t[2] ||= (e) => v.value = e.target.open
				}, [t[17] ||= N("summary", { style: {
					cursor: "pointer",
					color: "var(--mjr-muted, rgba(255,255,255,0.65))",
					"font-size": "12px",
					"user-select": "none"
				} }, " Show raw JSON ", -1), N("pre", Bl, R(He.value), 1)], 40, zl)
			])) : F("", !0);
		};
	}
};
//#endregion
export { G as $, ci as A, Ar as B, Fi as C, Si as D, Mi as E, Kr as F, Er as G, Y as H, Nr as I, gr as J, Or as K, jr as L, oi as M, yi as N, Ci as O, Jr as P, Ut as Q, Mr as R, Ii as S, Ni as T, Cr as U, Dr as V, wr as W, an as X, hr as Y, K as Z, ea as _, Oa as a, Vi as b, Ea as c, xa as d, Sa as f, X as g, da as h, Fa as i, bi as j, si as k, Ta as l, fa as m, kc as n, ka as o, pa as p, Sr as q, xo as r, wa as s, Wl as t, ga as u, ua as v, ji as w, Wi as x, Ui as y, xr as z };
