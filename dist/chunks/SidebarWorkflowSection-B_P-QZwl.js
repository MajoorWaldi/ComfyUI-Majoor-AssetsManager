import { $ as e, At as t, Bt as n, Ct as r, Dt as i, Et as a, I as o, It as s, K as c, Mt as l, N as u, Nt as d, O as f, Ot as p, Pt as m, Q as h, Qt as g, R as _, Rt as v, S as y, St as b, T as x, Tt as S, Ut as C, Vt as ee, Wt as te, X as w, Xt as T, Y as ne, Yt as re, Z as ie, Zt as E, an as ae, at as oe, ct as se, et as ce, ht as le, it as ue, jt as de, k as D, kt as fe, lt as pe, nt as me, on as he, p as ge, qt as _e, rt as ve, st as ye, tt as be, ut as xe, w as Se, wt as Ce, xt as we, zt as Te } from "./viewerRuntimeHosts-CIiyEfr6.js";
import { Ct as Ee, K as De, N as Oe, T as ke, c as Ae, d as je, f as Me, h as Ne, j as Pe, l as Fe, m as O, o as k, p as Ie, pt as Le, s as A, tt as Re, u as ze, x as Be, y as Ve } from "./events-DjjLASfV.js";
import { F as He, K as Ue, P as We, Y as Ge, f as Ke, m as qe, p as Je } from "./Viewer-DDNDTRcP.js";
import { t as Ye } from "./floatingViewerManager-Bnd82Qrd.js";
import { A as Xe, C as j, D as Ze, E as M, G as Qe, J as $e, K as et, N as tt, O as N, R as nt, S as rt, T as P, U as F, V as I, Y as it, _ as at, a as ot, b as st, c as ct, d as lt, dt as L, f as ut, ft as R, g as dt, h as ft, i as pt, j as mt, k as z, l as ht, lt as B, m as gt, n as _t, nt as vt, o as yt, p as bt, r as xt, rt as V, s as St, t as Ct, u as wt, ut as Tt, y as Et, z as Dt } from "./mjr-primevue-C955bvXT.js";
import { t as Ot } from "./mjr-vue-vendor-CF0zsqr1.js";
import { t as kt } from "./viewerOpenRequest-CzyrZA71.js";
import { a as At, i as jt, n as Mt, o as Nt, r as Pt, t as Ft } from "./geninfoParser-DS9m_bHm.js";
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
}, It = (e, t, n) => {
	let r = typeof e == "string" ? e.trim() : String(e ?? "");
	return t.includes(r) ? r : n;
}, Lt = (e) => e === "__proto__" || e === "prototype" || e === "constructor", Rt = (e, t) => {
	let n = { ...e };
	return !t || typeof t != "object" || Object.keys(t).forEach((r) => {
		if (Lt(r)) return;
		let i = t[r];
		i && typeof i == "object" && !Array.isArray(i) ? n[r] = Rt(e[r] || {}, i) : i !== void 0 && (n[r] = i);
	}), n;
}, zt = Object.freeze({
	small: 80,
	medium: 120,
	large: 180
}), Bt = Object.freeze([
	"small",
	"medium",
	"large"
]), Vt = (e, t) => Math.max(60, Math.min(600, Math.round(U(e, t)))), Ht = (e = {}) => {
	let t = Number(e?.minSize);
	if (Number.isFinite(t)) return Vt(t, A.GRID_MIN_SIZE);
	let n = It(String(e?.minSizePreset || "").toLowerCase(), Bt, "");
	return n ? zt[n] : Vt(e?.minSize, A.GRID_MIN_SIZE);
}, Ut = (e = {}) => Vt(e?.minSize, A.FEED_GRID_MIN_SIZE), Wt = (e) => {
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
		minSizePreset: Wt(A.GRID_MIN_SIZE),
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
		mfvTopbarButton: A.MFV_TOPBAR_BUTTON,
		videoGradeThrottleFps: A.VIEWER_VIDEO_GRADE_THROTTLE_FPS,
		scopesFps: A.VIEWER_SCOPES_FPS,
		metaTtlMs: A.VIEWER_META_TTL_MS,
		metaMaxEntries: A.VIEWER_META_MAX_ENTRIES,
		mfvSidebarPosition: "right",
		mfvPreviewMethod: A.MFV_PREVIEW_METHOD,
		mfvKjPreviewOverrideEnabled: A.MFV_KJ_PREVIEW_OVERRIDE_ENABLED,
		ltxavRgbFallback: !1
	},
	browser: { showFolders: !1 },
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
}, Gt = () => {
	try {
		let e = Ne.get(he);
		if (!e) return { ...W };
		let t = JSON.parse(e), n = t && typeof t == "object" && Number.isInteger(t.version) && t.data && typeof t.data == "object";
		if (!n && !(t && typeof t == "object" && !Array.isArray(t))) return { ...W };
		if (n && Number(t.version) > 1) return console.warn("[Majoor] settings schema version is newer than this build, using defaults"), { ...W };
		let r = n ? t.data : t, i = /* @__PURE__ */ new Set(/* @__PURE__ */ "debug.grid.infiniteScroll.siblings.autoScan.scan.watcher.status.viewer.rtHydrate.observability.feed.sidebar.probeBackend.i18n.paths.db.ratingTagsSync.cache.search.ai.executionGrouping.workflowMinimap.ui.security.safety".split(".")), a = {};
		if (r && typeof r == "object") for (let [e, t] of Object.entries(r)) i.has(e) && (a[e] = t);
		let o = Rt(W, a);
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
		if (!Ne.set("mjrSettings", JSON.stringify(n))) throw Error("SettingsStore rejected the write");
	} catch (e) {
		console.warn("[Majoor] settings save failed", e);
		try {
			let e = Date.now();
			e - (Number(window?._mjrSettingsSaveFailAt || 0) || 0) > 3e4 && (window._mjrSettingsSaveFailAt = e, Ue(O("dialog.settingsSaveFailed", "Majoor: Failed to save settings (browser storage full or blocked).")));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			Ge("mjr-settings-save-failed", { error: String(e?.message || e || "") }, { warnPrefix: "[Majoor]" });
		} catch (e) {
			console.debug?.(e);
		}
	}
}, K = (e) => {
	let t = Number(A.MAX_PAGE_SIZE) || 2e3, n = Math.max(50, Math.min(t, Number(e.grid?.pageSize) || A.DEFAULT_PAGE_SIZE));
	k.DEFAULT_PAGE_SIZE = n, k.AUTO_SCAN_ON_STARTUP = !!e.autoScan?.onStartup, k.EXECUTION_GROUPING_ENABLED = !!(e.executionGrouping?.enabled ?? A.EXECUTION_GROUPING_ENABLED), k.STATUS_POLL_INTERVAL = Math.max(1e3, Number(e.status?.pollInterval) || A.STATUS_POLL_INTERVAL), k.DEBUG_SAFE_CALL = !!e.debug?.safeCall, k.DEBUG_SAFE_LISTENERS = !!e.debug?.safeListeners, k.DEBUG_VIEWER = !!e.debug?.viewer, k.GRID_MIN_SIZE = Ht(e.grid), k.FEED_GRID_MIN_SIZE = Ut(e.feed), k.GRID_GAP = Math.max(0, Math.min(40, Math.round(U(e.grid?.gap, A.GRID_GAP)))), k.GRID_SHOW_BADGES_EXTENSION = !!(e.grid?.showExtBadge ?? A.GRID_SHOW_BADGES_EXTENSION), k.GRID_SHOW_BADGES_RATING = !!(e.grid?.showRatingBadge ?? A.GRID_SHOW_BADGES_RATING), k.GRID_SHOW_BADGES_TAGS = !!(e.grid?.showTagsBadge ?? A.GRID_SHOW_BADGES_TAGS), k.GRID_SHOW_DETAILS = !!(e.grid?.showDetails ?? A.GRID_SHOW_DETAILS), k.GRID_SHOW_DETAILS_FILENAME = !!(e.grid?.showFilename ?? A.GRID_SHOW_DETAILS_FILENAME), k.GRID_SHOW_DETAILS_DATE = !!(e.grid?.showDate ?? A.GRID_SHOW_DETAILS_DATE), k.GRID_SHOW_DETAILS_DIMENSIONS = !!(e.grid?.showDimensions ?? A.GRID_SHOW_DETAILS_DIMENSIONS), k.GRID_SHOW_DETAILS_GENTIME = !!(e.grid?.showGenTime ?? A.GRID_SHOW_DETAILS_GENTIME), k.GRID_SHOW_HOVER_INFO = !!(e.grid?.showHoverInfo ?? A.GRID_SHOW_HOVER_INFO), k.GRID_SHOW_WORKFLOW_DOT = !!(e.grid?.showWorkflowDot ?? A.GRID_SHOW_WORKFLOW_DOT);
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
	let r = (e, t) => {
		let n = String(e || "").trim();
		return /^[0-9a-fA-F]{6}$/.test(n) && (n = `#${n}`), /^#[0-9a-fA-F]{3,8}$/.test(n) ? n : t;
	};
	k.BADGE_STAR_COLOR = r(e.grid?.starColor, A.BADGE_STAR_COLOR), k.BADGE_IMAGE_COLOR = r(e.grid?.badgeImageColor, A.BADGE_IMAGE_COLOR), k.BADGE_VIDEO_COLOR = r(e.grid?.badgeVideoColor, A.BADGE_VIDEO_COLOR), k.BADGE_AUDIO_COLOR = r(e.grid?.badgeAudioColor, A.BADGE_AUDIO_COLOR), k.BADGE_MODEL3D_COLOR = r(e.grid?.badgeModel3dColor, A.BADGE_MODEL3D_COLOR), k.BADGE_DUPLICATE_ALERT_COLOR = r(e.grid?.badgeDuplicateAlertColor, A.BADGE_DUPLICATE_ALERT_COLOR), k.UI_CARD_HOVER_COLOR = r(e.ui?.cardHoverColor, A.UI_CARD_HOVER_COLOR), k.UI_CARD_SELECTION_COLOR = r(e.ui?.cardSelectionColor, A.UI_CARD_SELECTION_COLOR), k.UI_RATING_COLOR = r(e.ui?.ratingColor, A.UI_RATING_COLOR), k.UI_TAG_COLOR = r(e.ui?.tagColor, A.UI_TAG_COLOR);
	try {
		let e = Array.from(document.querySelectorAll(".mjr-assets-manager"));
		for (let t of e) t.style.setProperty("--mjr-star-active", k.BADGE_STAR_COLOR), t.style.setProperty("--mjr-badge-image", k.BADGE_IMAGE_COLOR), t.style.setProperty("--mjr-badge-video", k.BADGE_VIDEO_COLOR), t.style.setProperty("--mjr-badge-audio", k.BADGE_AUDIO_COLOR), t.style.setProperty("--mjr-badge-model3d", k.BADGE_MODEL3D_COLOR), t.style.setProperty("--mjr-badge-duplicate-alert", k.BADGE_DUPLICATE_ALERT_COLOR), t.style.setProperty("--mjr-card-hover-color", k.UI_CARD_HOVER_COLOR), t.style.setProperty("--mjr-card-selection-color", k.UI_CARD_SELECTION_COLOR), t.style.setProperty("--mjr-rating-color", k.UI_RATING_COLOR), t.style.setProperty("--mjr-tag-color", k.UI_TAG_COLOR);
	} catch (e) {
		console.debug?.(e);
	}
	k.INFINITE_SCROLL_ENABLED = !!e.infiniteScroll?.enabled, k.INFINITE_SCROLL_ROOT_MARGIN = String(e.infiniteScroll?.rootMargin || A.INFINITE_SCROLL_ROOT_MARGIN), k.INFINITE_SCROLL_THRESHOLD = Math.max(0, Math.min(1, U(e.infiniteScroll?.threshold, A.INFINITE_SCROLL_THRESHOLD))), k.BOTTOM_GAP_PX = Math.max(0, Math.min(5e3, Math.round(U(e.infiniteScroll?.bottomGapPx, A.BOTTOM_GAP_PX)))), k.VIEWER_ALLOW_PAN_AT_ZOOM_1 = !!e.viewer?.allowPanAtZoom1, k.VIEWER_DISABLE_WEBGL_VIDEO = !!e.viewer?.disableWebGL, k.VIEWER_PAUSE_DURING_EXECUTION = !!(e.viewer?.pauseDuringExecution ?? A.VIEWER_PAUSE_DURING_EXECUTION), k.FLOATING_VIEWER_PAUSE_DURING_EXECUTION = !!(e.viewer?.floatingPauseDuringExecution ?? A.FLOATING_VIEWER_PAUSE_DURING_EXECUTION), k.MFV_LIVE_DEFAULT = e.viewer?.mfvLiveDefault ?? A.MFV_LIVE_DEFAULT, k.MFV_PREVIEW_DEFAULT = e.viewer?.mfvPreviewDefault ?? A.MFV_PREVIEW_DEFAULT, k.MFV_KJ_PREVIEW_OVERRIDE_ENABLED = !!(e.viewer?.mfvKjPreviewOverrideEnabled ?? A.MFV_KJ_PREVIEW_OVERRIDE_ENABLED), k.MFV_TOPBAR_BUTTON = !!(e.viewer?.mfvTopbarButton ?? A.MFV_TOPBAR_BUTTON), k.MFV_LIVE_AUTO_OPEN = !1, k.MFV_PREVIEW_AUTO_OPEN = !1, k.MFV_NODE_STREAM_AUTO_OPEN = !1;
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
	k.VIEWER_VIDEO_GRADE_THROTTLE_FPS = Math.max(1, Math.min(60, Math.round(U(e.viewer?.videoGradeThrottleFps, A.VIEWER_VIDEO_GRADE_THROTTLE_FPS)))), k.VIEWER_SCOPES_FPS = Math.max(1, Math.min(60, Math.round(U(e.viewer?.scopesFps, A.VIEWER_SCOPES_FPS)))), k.VIEWER_META_TTL_MS = Math.max(1e3, Math.min(6e5, Math.round(U(e.viewer?.metaTtlMs, A.VIEWER_META_TTL_MS)))), k.VIEWER_META_MAX_ENTRIES = Math.max(50, Math.min(5e3, Math.round(U(e.viewer?.metaMaxEntries, A.VIEWER_META_MAX_ENTRIES)))), k.WORKFLOW_MINIMAP_ENABLED = !!(e.workflowMinimap?.enabled ?? A.WORKFLOW_MINIMAP_ENABLED), k.RT_HYDRATE_CONCURRENCY = Math.max(1, Math.min(16, Math.round(U(e.rtHydrate?.concurrency, A.RT_HYDRATE_CONCURRENCY)))), k.RT_HYDRATE_QUEUE_MAX = Math.max(10, Math.min(5e3, Math.round(U(e.rtHydrate?.queueMax, A.RT_HYDRATE_QUEUE_MAX)))), k.RT_HYDRATE_SEEN_MAX = Math.max(1e3, Math.min(2e5, Math.round(U(e.rtHydrate?.seenMax, A.RT_HYDRATE_SEEN_MAX)))), k.RT_HYDRATE_PRUNE_BUDGET = Math.max(10, Math.min(1e4, Math.round(U(e.rtHydrate?.pruneBudget, A.RT_HYDRATE_PRUNE_BUDGET)))), k.RT_HYDRATE_SEEN_TTL_MS = Math.max(5e3, Math.min(216e5, Math.round(U(e.rtHydrate?.seenTtlMs, A.RT_HYDRATE_SEEN_TTL_MS)))), k.DELETE_CONFIRMATION = !!e.safety?.confirmDeletion, k.DEBUG_VERBOSE_ERRORS = !!e.observability?.verboseErrors, k.WATCHER_MAX_PENDING = Math.max(10, Math.min(5e3, Math.round(U(e.watcher?.maxPending, 500)))), k.WATCHER_MIN_SIZE = Math.max(0, Math.min(1e6, Math.round(U(e.watcher?.minSize, 100)))), k.WATCHER_MAX_SIZE = Math.max(1e5, Math.min(17179869184, Math.round(U(e.watcher?.maxSize, 4294967296)))), k.DB_TIMEOUT_MS = Math.max(1e3, Math.min(3e4, Math.round(U(e.db?.timeoutMs, 5e3)))), k.DB_MAX_CONNECTIONS = Math.max(1, Math.min(100, Math.round(U(e.db?.maxConnections, 10)))), k.DB_QUERY_TIMEOUT_MS = Math.max(500, Math.min(1e4, Math.round(U(e.db?.queryTimeoutMs, 1e3)))), k.SIDEBAR_ASSET_BADGE_ENABLED = !!(e.sidebar?.assetBadgeEnabled ?? A.SIDEBAR_ASSET_BADGE_ENABLED), k.SEARCH_REQUEST_LIMIT = Math.max(10, Math.min(A.MAX_PAGE_SIZE || 2e3, Math.round(U(e.search?.maxResults, A.SEARCH_DEFAULT_LIMIT))));
};
async function Kt() {
	try {
		let e = await ue();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = Gt();
		if (n.security = n.security || {}, n.security.safeMode = H(t.safe_mode, n.security.safeMode), n.security.allowWrite = H(t.allow_write, n.security.allowWrite), n.security.requireAuth = H(t.require_auth, n.security.requireAuth), n.security.allowRemoteWrite = H(t.allow_remote_write, n.security.allowRemoteWrite), n.security.allowInsecureTokenTransport = H(t.allow_insecure_token_transport, n.security.allowInsecureTokenTransport), n.security.allowDelete = H(t.allow_delete, n.security.allowDelete), n.security.allowRename = H(t.allow_rename, n.security.allowRename), n.security.allowOpenInFolder = H(t.allow_open_in_folder, n.security.allowOpenInFolder), n.security.allowResetIndex = H(t.allow_reset_index, n.security.allowResetIndex), n.security.tokenConfigured = H(t.token_configured, n.security.tokenConfigured), n.security.tokenHint = String(t.token_hint || "").trim(), !String(n.security.apiToken || "").trim()) try {
			let e = await _(), t = String(e?.data?.token || "").trim();
			e?.ok && t && T(t);
		} catch (e) {
			console.debug?.(e);
		}
		G(n), K(n), Ge("mjr-settings-changed", { key: "security" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend security settings", e);
	}
}
async function qt() {
	try {
		let e = await ye();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = Gt();
		n.ai = n.ai || {}, n.ai.vectorSearchEnabled = H(t.enabled, n.ai.vectorSearchEnabled ?? !0), n.ai.vectorCaptionOnIndex = H(t.caption_on_index ?? t.captionOnIndex, n.ai.vectorCaptionOnIndex ?? !1), n.ai.vectorIndexOnScan = H(t.index_on_scan ?? t.indexOnScan, n.ai.vectorIndexOnScan ?? !1), n.ai.vectorUnloadAfterUse = H(t.unload_after_use ?? t.unloadAfterUse, n.ai.vectorUnloadAfterUse ?? !1), n.ai.vectorConcurrency = Math.max(1, Math.min(16, Math.floor(Number(t.concurrency ?? n.ai.vectorConcurrency ?? 1) || 1))), G(n), K(n), Ge("mjr-settings-changed", { key: "ai.vectorSearch" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend vector search settings", e);
	}
}
async function Jt() {
	try {
		let e = await ne();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = Gt();
		n.executionGrouping = n.executionGrouping || {}, n.executionGrouping.enabled = H(t.enabled, n.executionGrouping.enabled ?? A.EXECUTION_GROUPING_ENABLED), G(n), K(n), Ge("mjr-settings-changed", { key: "executionGrouping.enabled" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend execution grouping settings", e);
	}
}
//#endregion
//#region ui/app/settings/settingsRuntime.ts
var Yt = "mjr-runtime-status-dashboard", Xt = 3e4;
function Zt() {
	try {
		let e = Gt(), t = String(e?.observability?.runtimeDashboardMode || W.observability.runtimeDashboardMode);
		return [
			"autoHide30",
			"always",
			"hidden"
		].includes(t) ? t : "autoHide30";
	} catch {
		return "autoHide30";
	}
}
function Qt() {
	try {
		document.getElementById(Yt)?.remove?.();
	} catch (e) {
		console.debug?.(e);
	}
}
function $t() {
	try {
		window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ && (clearTimeout(window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__), window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ = null);
	} catch (e) {
		console.debug?.(e);
	}
}
function en(e, t) {
	let n = t === "auth" ? "__mjrAuthLine" : "__mjrMetricsLine";
	if (e?.[n]) return e[n];
	let r = document.createElement("div");
	return r.style.whiteSpace = "nowrap", r.style.lineHeight = "1.35", t === "auth" && (r.style.marginTop = "4px", r.style.fontWeight = "600"), e.appendChild(r), e[n] = r, r;
}
function tn(e) {
	let t = String(e?.token_hint || "").trim(), n = re(), r = t || (n ? "(session)" : ""), i = e?.allow_write !== !1, a = e?.require_auth === !0, o = e?.token_configured === !0;
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
function nn() {
	try {
		if (Zt() === "hidden" || window.__MJR_RUNTIME_STATUS_HIDDEN__) return Qt(), null;
		let e = document.querySelector(".mjr-assets-manager.mjr-am-container"), t = document.getElementById(Yt);
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
		let n = document.getElementById(Yt);
		return n ? n.parentElement !== e && e.appendChild(n) : (n = document.createElement("div"), n.id = Yt, n.style.position = "absolute", n.style.bottom = "10px", n.style.right = "10px", n.style.zIndex = "9999", n.style.padding = "6px 10px", n.style.borderRadius = "10px", n.style.border = "1px solid rgba(255,255,255,0.16)", n.style.background = "rgba(0,0,0,0.45)", n.style.backdropFilter = "blur(4px)", n.style.color = "var(--content-fg, #fff)", n.style.fontSize = "11px", n.style.pointerEvents = "none", n.style.display = "flex", n.style.flexDirection = "column", e.appendChild(n)), n;
	} catch {
		return null;
	}
}
async function rn() {
	let e = nn();
	if (!e) return !1;
	let t = en(e, "metrics"), n = en(e, "auth");
	try {
		let [r, i] = await Promise.all([ve(), ue()]), a = O("runtime.unavailable", "Runtime: unavailable");
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
		let o = tn(i?.data?.prefs || null);
		return n.textContent = o.text, n.style.color = o.color, e.title = `${a}\n${o.text}`, !0;
	} catch {
		return t.textContent = O("runtime.unavailable", "Runtime: unavailable"), n.textContent = O("runtime.writeAuthUnknown", "Write auth: unknown"), n.style.color = "#c8ced8", e.title = `${O("runtime.unavailable", "Runtime: unavailable")}\n${n.textContent}`, !0;
	}
}
function an() {
	try {
		let e = Zt();
		if (e === "hidden") {
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = !0, $t(), Qt();
			return;
		}
		window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__ || (window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__ = (e) => {
			if (e?.detail?.key !== "observability.runtimeDashboardMode") return;
			let t = Zt();
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = t === "hidden", $t(), Qt(), t !== "hidden" && an();
		}, window.addEventListener?.("mjr-settings-changed", window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__)), window.__MJR_RUNTIME_STATUS_HIDDEN__ = !1, $t(), e === "autoHide30" && (window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ = setTimeout(() => {
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = !0, Qt();
		}, Xt)), rn().catch(() => {}), window.__MJR_RUNTIME_STATUS_INFLIGHT__ ?? (window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !1), window.__MJR_RUNTIME_STATUS_MISS_COUNT__ ?? (window.__MJR_RUNTIME_STATUS_MISS_COUNT__ = 0), window.__MJR_RUNTIME_STATUS_INTERVAL__ || (window.__MJR_RUNTIME_STATUS_INTERVAL__ = setInterval(() => {
			window.__MJR_RUNTIME_STATUS_INFLIGHT__ || (window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !0, rn().then((e) => {
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
var on = 300;
function sn(e, t = on) {
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
var q = "Majoor", cn = "Majoor Assets Manager";
function ln(e, t, n) {
	let r = (e, t) => [
		cn,
		e,
		t
	], i = (e) => [
		cn,
		O("cat.cards", "Cards"),
		e
	], a = (e) => [
		cn,
		O("cat.badges", "Badges"),
		e
	], o = (e) => [
		cn,
		O("cat.badges", "Badges"),
		e
	], s = (e, t) => {
		let n = String(e || "").trim();
		return /^[0-9a-fA-F]{6}$/.test(n) && (n = `#${n}`), /^#[0-9a-fA-F]{6}$/.test(n) ? n.toUpperCase() : t;
	};
	t.grid?.minSizePreset || (t.grid = t.grid || {}, t.grid.minSizePreset = Wt(t.grid.minSize), G(t)), e({
		id: `${q}.Cards.ThumbSize`,
		category: i(O("setting.grid.cardSize.group", "Card size")),
		name: O("setting.grid.cardSize.name", "Majoor: Card Size"),
		tooltip: O("setting.grid.cardSize.desc", "Choose the card size preset used by the grid layout."),
		type: "combo",
		defaultValue: (() => {
			let e = It(String(t.grid?.minSizePreset || "").toLowerCase(), Bt, Wt(t.grid?.minSize)), n = {
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
			r === i || r === "small" || r === "petit" ? s = "small" : r === o || r === "large" || r === "grand" ? s = "large" : (r === a || r === "medium" || r === "moyen") && (s = "medium"), t.grid.minSizePreset = s, t.grid.minSize = zt[s], G(t), K(t), n("grid.minSizePreset");
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
			t.grid.minSize = r, t.grid.minSizePreset = Wt(r), G(t), K(t), n("grid.minSize");
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
var un = "Majoor", dn = "Majoor Assets Manager";
function fn(t, n, r) {
	let a = (e, t) => [
		dn,
		e,
		t
	], o = (e) => a(O("cat.viewer", "Viewer"), e), s = (e) => a(O("cat.floatingViewer", "Floating Viewer"), e);
	t({
		id: `${un}.Viewer.AllowPanAtZoom1`,
		category: o(O("setting.viewer.pan.name").replace("Majoor: ", "")),
		name: O("setting.viewer.pan.name"),
		tooltip: O("setting.viewer.pan.desc"),
		type: "boolean",
		defaultValue: !!n.viewer?.allowPanAtZoom1,
		onChange: (e) => {
			n.viewer = n.viewer || {}, n.viewer.allowPanAtZoom1 = !!e, G(n), K(n), r("viewer.allowPanAtZoom1");
		}
	}), t({
		id: `${un}.Viewer.DisableWebGL`,
		category: o("Disable WebGL Video"),
		name: "Disable WebGL Video",
		tooltip: "Use CPU rendering (Canvas 2D) for video playback. Fixes 'black screen' issues on incompatible hardware/browsers.",
		type: "boolean",
		defaultValue: !!n.viewer?.disableWebGL,
		onChange: (e) => {
			n.viewer = n.viewer || {}, n.viewer.disableWebGL = !!e, G(n), K(n), r("viewer.disableWebGL");
		}
	}), t({
		id: `${un}.Viewer.PauseDuringExecution`,
		category: o(O("setting.viewer.pauseExecution.name").replace("Majoor: ", "")),
		name: O("setting.viewer.pauseExecution.name"),
		tooltip: O("setting.viewer.pauseExecution.desc"),
		type: "boolean",
		defaultValue: !!n.viewer?.pauseDuringExecution,
		onChange: (e) => {
			n.viewer = n.viewer || {}, n.viewer.pauseDuringExecution = !!e, G(n), K(n), r("viewer.pauseDuringExecution");
		}
	}), t({
		id: `${un}.Viewer.FloatingPauseDuringExecution`,
		category: s(O("setting.viewer.floatingPauseExecution.name").replace("Majoor: ", "")),
		name: O("setting.viewer.floatingPauseExecution.name"),
		tooltip: O("setting.viewer.floatingPauseExecution.desc"),
		type: "boolean",
		defaultValue: !!n.viewer?.floatingPauseDuringExecution,
		onChange: (e) => {
			n.viewer = n.viewer || {}, n.viewer.floatingPauseDuringExecution = !!e, G(n), K(n), r("viewer.floatingPauseDuringExecution");
		}
	}), t({
		id: `${un}.Browser.ShowFolders`,
		category: o("Browser"),
		name: "Show folders in Input / Output panels",
		tooltip: "When enabled, subdirectories under the Input and Output roots are shown as folder cards in the browser grid. Disable to see only files.",
		type: "boolean",
		defaultValue: !!(n.browser?.showFolders ?? !1),
		onChange: async (e) => {
			let t = !!e, i = !!(n.browser?.showFolders ?? !1);
			n.browser = n.browser || {}, n.browser.showFolders = t, G(n), K(n), r("browser.showFolders");
			try {
				let e = await b(t);
				if (!e?.ok) throw Error(e?.error || "Failed to update show folders setting");
			} catch (e) {
				n.browser.showFolders = i, G(n), K(n), r("browser.showFolders"), E(e?.message || "Failed to update show folders setting", "error");
			}
		}
	}), t({
		id: `${un}.Viewer.MfvLiveDefault`,
		category: s(O("setting.viewer.mfvLiveDefault.name").replace("Majoor: ", "")),
		name: O("setting.viewer.mfvLiveDefault.name"),
		tooltip: O("setting.viewer.mfvLiveDefault.desc"),
		type: "boolean",
		defaultValue: !!(n.viewer?.mfvLiveDefault ?? A.MFV_LIVE_DEFAULT),
		onChange: (e) => {
			n.viewer = n.viewer || {}, n.viewer.mfvLiveDefault = !!e, G(n), K(n), r("viewer.mfvLiveDefault");
		}
	}), t({
		id: `${un}.Viewer.MfvPreviewDefault`,
		category: s(O("setting.viewer.mfvPreviewDefault.name").replace("Majoor: ", "")),
		name: O("setting.viewer.mfvPreviewDefault.name"),
		tooltip: O("setting.viewer.mfvPreviewDefault.desc"),
		type: "boolean",
		defaultValue: !!(n.viewer?.mfvPreviewDefault ?? A.MFV_PREVIEW_DEFAULT),
		onChange: (e) => {
			n.viewer = n.viewer || {}, n.viewer.mfvPreviewDefault = !!e, G(n), K(n), r("viewer.mfvPreviewDefault");
		}
	}), t({
		id: `${un}.Viewer.MfvTopbarButton`,
		category: s("Top bar Viewer button"),
		name: "Show Viewer button in the top bar",
		tooltip: "Show a Viewer toggle button in the ComfyUI top bar next to the queue controls. Disable to hide it (the V shortcut keeps working).",
		type: "boolean",
		defaultValue: !!(n.viewer?.mfvTopbarButton ?? A.MFV_TOPBAR_BUTTON),
		onChange: (e) => {
			n.viewer = n.viewer || {}, n.viewer.mfvTopbarButton = !!e, G(n), K(n), r("viewer.mfvTopbarButton");
		}
	}), t({
		id: `${un}.Viewer.MfvSidebarPosition`,
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
		id: `${un}.Viewer.MfvPreviewMethod`,
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
		id: `${un}.Viewer.MfvKjPreviewOverrideEnabled`,
		category: s(O("setting.viewer.mfvKjPreviewOverride.name").replace("Majoor: ", "")),
		name: O("setting.viewer.mfvKjPreviewOverride.name"),
		tooltip: O("setting.viewer.mfvKjPreviewOverride.desc"),
		type: "boolean",
		defaultValue: !!(n.viewer?.mfvKjPreviewOverrideEnabled ?? A.MFV_KJ_PREVIEW_OVERRIDE_ENABLED),
		onChange: (e) => {
			n.viewer = n.viewer || {}, n.viewer.mfvKjPreviewOverrideEnabled = !!e, G(n), K(n), r("viewer.mfvKjPreviewOverrideEnabled");
		}
	}), t({
		id: `${un}.Viewer.LtxavRgbFallback`,
		category: s("LTXAV preview fallback"),
		name: "Majoor: LTXAV RGB Preview Fallback (experimental)",
		tooltip: "Reuse LTXV RGB projection for LTXAV when native latent preview is unavailable. Experimental; quality may be approximate.",
		type: "boolean",
		defaultValue: !!n.viewer?.ltxavRgbFallback,
		onChange: async (e) => {
			let t = !!e, a = !!n.viewer?.ltxavRgbFallback;
			n.viewer = n.viewer || {}, n.viewer.ltxavRgbFallback = t, G(n), K(n), r("viewer.ltxavRgbFallback");
			try {
				let e = await i(t);
				if (!e?.ok) throw Error(e?.error || "Failed to update LTXAV RGB preview fallback setting");
			} catch (e) {
				n.viewer.ltxavRgbFallback = a, G(n), K(n), r("viewer.ltxavRgbFallback"), E(e?.message || "Failed to update LTXAV RGB preview fallback setting", "error");
			}
		}
	});
	try {
		e().then((e) => {
			if (!e?.ok) return;
			let t = !!e?.data?.prefs?.enabled, i = Gt();
			i.viewer = i.viewer || {}, !!i.viewer.ltxavRgbFallback !== t && (i.viewer.ltxavRgbFallback = t, Object.assign(n, i), G(i), K(i), r("viewer.ltxavRgbFallback"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	((e, i, a, s) => {
		t({
			id: `${un}.WorkflowMinimap.${e}`,
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
var pn = "Majoor", mn = "Majoor Assets Manager";
function hn(e, t, i) {
	let o = (e, t) => [
		mn,
		e,
		t
	];
	e({
		id: `${pn}.ExecutionGrouping.Enabled`,
		category: o(O("cat.scanning"), "Execution grouping"),
		name: "Execution job/stack grouping",
		tooltip: "Enable or disable all live job_id / stack_id tracking, grouping, and stack finalization logic.",
		type: "boolean",
		defaultValue: !!(t.executionGrouping?.enabled ?? A.EXECUTION_GROUPING_ENABLED),
		onChange: async (e) => {
			let n = !!(t.executionGrouping?.enabled ?? A.EXECUTION_GROUPING_ENABLED), a = !!e;
			t.executionGrouping = t.executionGrouping || {}, t.executionGrouping.enabled = a, G(t), K(t), i("executionGrouping.enabled");
			try {
				let e = await r(a);
				if (!e?.ok) throw Error(e?.error || "Failed to update execution grouping setting");
				t.executionGrouping.enabled = !!e?.data?.prefs?.enabled, G(t), K(t), i("executionGrouping.enabled");
			} catch (e) {
				t.executionGrouping.enabled = n, G(t), K(t), i("executionGrouping.enabled"), E(e?.message || "Failed to update execution grouping setting", "error");
			}
		}
	}), e({
		id: `${pn}.AutoScan.OnStartup`,
		category: o(O("cat.scanning"), O("setting.scan.startup.name").replace("Majoor: ", "")),
		name: O("setting.scan.startup.name"),
		tooltip: O("setting.scan.startup.desc"),
		type: "boolean",
		defaultValue: !!t.autoScan?.onStartup,
		onChange: (e) => {
			t.autoScan = t.autoScan || {}, t.autoScan.onStartup = !!e, G(t), K(t), i("autoScan.onStartup");
		}
	}), e({
		id: `${pn}.Scan.FastMode`,
		category: o(O("cat.scanning"), "Scan mode"),
		name: "Fast scan mode",
		tooltip: "Use fast scan mode for manual backfill scans (skip heavier metadata work during scan).",
		type: "boolean",
		defaultValue: !!(t.scan?.fastMode ?? !0),
		onChange: (e) => {
			t.scan = t.scan || {}, t.scan.fastMode = !!e, G(t), i("scan.fastMode");
		}
	}), e({
		id: `${pn}.Scan.JpegXL`,
		category: o(O("cat.scanning"), "Image formats"),
		name: "JPEG XL (JXL) support (Experimental)",
		tooltip: "Index and preview .jxl images. Preview generation requires JPEG XL support in Pillow or FFmpeg. Run a new scan after enabling.",
		type: "boolean",
		defaultValue: !!t.scan?.jxlEnabled,
		onChange: async (e) => {
			let n = !!t.scan?.jxlEnabled, r = !!e;
			t.scan = t.scan || {}, t.scan.jxlEnabled = r, G(t), i("scan.jxlEnabled");
			try {
				let e = await a(r);
				if (!e?.ok) throw Error(e?.error || "Failed to update JPEG XL support");
			} catch (e) {
				t.scan.jxlEnabled = n, G(t), i("scan.jxlEnabled"), E(e?.message || "Failed to update JPEG XL support", "error");
			}
		}
	}), h().then((e) => {
		e?.ok && (t.scan = t.scan || {}, t.scan.jxlEnabled = !!e?.data?.prefs?.enabled, G(t), i("scan.jxlEnabled"));
	}).catch(() => {}), e({
		id: `${pn}.RtHydrate.Concurrency`,
		category: o(O("cat.scanning"), "Hydration"),
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
			t.rtHydrate = t.rtHydrate || {}, t.rtHydrate.concurrency = Math.max(1, Math.min(20, Math.round(U(e, A.RT_HYDRATE_CONCURRENCY || 5)))), G(t), K(t), i("rtHydrate.concurrency");
		}
	});
	let s = (e, t, n, r) => {
		let i = Math.round(U(e, t));
		return Math.max(n, Math.min(r, i));
	}, c = (e = {}) => {
		let n = [];
		if (t.watcher = t.watcher || {}, typeof e.debounce_ms == "number") {
			let r = Math.max(50, Math.min(5e3, Math.round(e.debounce_ms)));
			t.watcher.debounceMs !== r && (t.watcher.debounceMs = r, n.push("watcher.debounceMs"));
		}
		if (typeof e.dedupe_ttl_ms == "number") {
			let r = Math.max(100, Math.min(3e4, Math.round(e.dedupe_ttl_ms)));
			t.watcher.dedupeTtlMs !== r && (t.watcher.dedupeTtlMs = r, n.push("watcher.dedupeTtlMs"));
		}
		n.length && (G(t), n.forEach((e) => i(e)));
	}, l = async () => {
		try {
			let e = await se();
			if (!e?.ok) return;
			c(e.data || {});
		} catch (e) {
			console.debug?.(e);
		}
	};
	e({
		id: `${pn}.Watcher.Enabled`,
		category: o(O("cat.scanning"), O("setting.watcher.enabled.label", "Enable watcher")),
		name: O("setting.watcher.name"),
		tooltip: O("setting.watcher.desc") + " (env: MJR_ENABLE_WATCHER)",
		type: "boolean",
		defaultValue: !!t.watcher?.enabled,
		onChange: async (e) => {
			t.watcher = t.watcher || {}, t.watcher.enabled = !!e, G(t), i("watcher.enabled");
			try {
				let n = await v(!!e);
				n?.ok || (t.watcher.enabled = !e, G(t), i("watcher.enabled"), E(n?.error || O("toast.failedToggleWatcher", "Failed to toggle watcher"), "error"));
			} catch {
				t.watcher.enabled = !e, G(t), i("watcher.enabled");
			}
		}
	}), e({
		id: `${pn}.Watcher.DebounceDelay`,
		category: o(O("cat.scanning"), O("setting.watcher.debounce.label", "Watcher debounce delay")),
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
			let r = A.WATCHER_DEBOUNCE_MS, a = s(e, r, 50, 6e4), o = t.watcher?.debounceMs ?? r;
			if (a !== o) {
				t.watcher = t.watcher || {}, t.watcher.debounceMs = a, G(t);
				try {
					let e = await n({ debounce_ms: a });
					if (!e?.ok) throw Error(e?.error || O("setting.watcher.debounce.error"));
					let r = Math.round(Number(e?.data?.debounce_ms ?? a));
					t.watcher.debounceMs = r, G(t), i("watcher.debounceMs");
				} catch (e) {
					t.watcher.debounceMs = o, G(t), i("watcher.debounceMs"), E(e?.message || O("setting.watcher.debounce.error"), "error");
				}
			}
		}
	}), e({
		id: `${pn}.Watcher.DedupeWindow`,
		category: o(O("cat.scanning"), O("setting.watcher.dedupe.label", "Watcher dedupe window")),
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
			let r = A.WATCHER_DEDUPE_TTL_MS, a = s(e, r, 100, 12e4), o = t.watcher?.dedupeTtlMs ?? r;
			if (a !== o) {
				t.watcher = t.watcher || {}, t.watcher.dedupeTtlMs = a, G(t);
				try {
					let e = await n({ dedupe_ttl_ms: a });
					if (!e?.ok) throw Error(e?.error || O("setting.watcher.dedupe.error"));
					let r = Math.round(Number(e?.data?.dedupe_ttl_ms ?? a));
					t.watcher.dedupeTtlMs = r, G(t), i("watcher.dedupeTtlMs");
				} catch (e) {
					t.watcher.dedupeTtlMs = o, G(t), i("watcher.dedupeTtlMs"), E(e?.message || O("setting.watcher.dedupe.error"), "error");
				}
			}
		}
	}), e({
		id: `${pn}.Watcher.MaxPending`,
		category: o(O("cat.scanning"), "Watcher queue"),
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
			t.watcher = t.watcher || {}, t.watcher.maxPending = Math.max(10, Math.min(5e3, Math.round(U(e, 500)))), G(t), K(t), i("watcher.maxPending");
		}
	}), e({
		id: `${pn}.Watcher.MinSize`,
		category: o(O("cat.scanning"), "Watcher file size"),
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
			t.watcher = t.watcher || {}, t.watcher.minSize = Math.max(0, Math.min(1e6, Math.round(U(e, 100)))), G(t), K(t), i("watcher.minSize");
		}
	}), e({
		id: `${pn}.Watcher.MaxSize`,
		category: o(O("cat.scanning"), "Watcher file size"),
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
			t.watcher = t.watcher || {}, t.watcher.maxSize = Math.max(1e5, Math.min(17179869184, Math.round(U(e, 4294967296)))), G(t), K(t), i("watcher.maxSize");
		}
	});
	try {
		l().catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	e({
		id: `${pn}.RatingTagsSync.Enabled`,
		category: o(O("cat.scanning"), O("setting.sync.rating.name").replace("Majoor: ", "")),
		name: O("setting.sync.rating.name"),
		tooltip: O("setting.sync.rating.desc"),
		type: "boolean",
		defaultValue: !!t.ratingTagsSync?.enabled,
		onChange: (e) => {
			t.ratingTagsSync = t.ratingTagsSync || {}, t.ratingTagsSync.enabled = !!e, G(t), i("ratingTagsSync.enabled");
		}
	});
}
//#endregion
//#region ui/app/settings/settingsFeed.ts
var gn = "Majoor", _n = "Majoor Assets Manager";
function vn(e, t, n) {
	let r = (e) => [
		_n,
		O("cat.feed", "Generated Feed"),
		e
	], i = () => {
		t.feed = t.feed || {};
	};
	e({
		id: `${gn}.Feed.CardSize`,
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
		id: `${gn}.Feed.ShowInfo`,
		category: r("Show info section"),
		name: "Show card info section",
		tooltip: "Show or hide the entire info section (filename, metadata, dots) below thumbnails in the Generated Feed.",
		type: "boolean",
		defaultValue: !!(t.feed?.showInfo ?? A.FEED_SHOW_INFO),
		onChange: (e) => {
			i(), t.feed.showInfo = !!e, G(t), K(t), n("feed.showInfo");
		}
	}), e({
		id: `${gn}.Feed.ShowFilename`,
		category: r("Show filename"),
		name: "Show filename",
		tooltip: "Display the filename on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showFilename ?? A.FEED_SHOW_FILENAME),
		onChange: (e) => {
			i(), t.feed.showFilename = !!e, G(t), K(t), n("feed.showFilename");
		}
	}), e({
		id: `${gn}.Feed.ShowDimensions`,
		category: r("Show dimensions"),
		name: "Show dimensions",
		tooltip: "Display resolution (WxH) and duration on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDimensions ?? A.FEED_SHOW_DIMENSIONS),
		onChange: (e) => {
			i(), t.feed.showDimensions = !!e, G(t), K(t), n("feed.showDimensions");
		}
	}), e({
		id: `${gn}.Feed.ShowDate`,
		category: r("Show date/time"),
		name: "Show date/time",
		tooltip: "Display date and time on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDate ?? A.FEED_SHOW_DATE),
		onChange: (e) => {
			i(), t.feed.showDate = !!e, G(t), K(t), n("feed.showDate");
		}
	}), e({
		id: `${gn}.Feed.ShowGenTime`,
		category: r("Show generation time"),
		name: "Show generation time",
		tooltip: "Display the generation time badge on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showGenTime ?? A.FEED_SHOW_GENTIME),
		onChange: (e) => {
			i(), t.feed.showGenTime = !!e, G(t), K(t), n("feed.showGenTime");
		}
	}), e({
		id: `${gn}.Feed.ShowWorkflowDot`,
		category: r("Show workflow dot"),
		name: "Show workflow indicator",
		tooltip: "Display the workflow availability dot on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showWorkflowDot ?? A.FEED_SHOW_WORKFLOW_DOT),
		onChange: (e) => {
			i(), t.feed.showWorkflowDot = !!e, G(t), K(t), n("feed.showWorkflowDot");
		}
	}), e({
		id: `${gn}.Feed.ShowExtBadge`,
		category: r("Show format badges"),
		name: "Show format badges",
		tooltip: "Display format badges (e.g. JPG, MP4) on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showExtBadge ?? A.FEED_SHOW_BADGES_EXTENSION),
		onChange: (e) => {
			i(), t.feed.showExtBadge = !!e, G(t), K(t), n("feed.showExtBadge");
		}
	}), e({
		id: `${gn}.Feed.ShowRatingBadge`,
		category: r("Show rating badges"),
		name: "Show ratings",
		tooltip: "Display star ratings on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showRatingBadge ?? A.FEED_SHOW_BADGES_RATING),
		onChange: (e) => {
			i(), t.feed.showRatingBadge = !!e, G(t), K(t), n("feed.showRatingBadge");
		}
	}), e({
		id: `${gn}.Feed.ShowTagsBadge`,
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
var yn = "Majoor", bn = "Majoor Assets Manager", xn = 16, Sn = {
	safeMode: !1,
	allowWrite: !0,
	allowDelete: !0,
	allowRename: !0,
	allowOpenInFolder: !0,
	allowResetIndex: !0
};
function Cn(e) {
	return !!e;
}
function wn(e, t) {
	return Cn(e) === Cn(t);
}
function Tn(e) {
	return typeof e == "string" ? e.trim() : "";
}
function En(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "localhost" || t === "127.0.0.1" || t === "::1";
}
function Dn() {
	return globalThis.location || globalThis.window?.location || null;
}
function On() {
	let e = Dn();
	if (!e) return !1;
	let t = String(e.protocol || "").toLowerCase(), n = String(e.hostname || "").trim();
	return t === "http:" && !En(n);
}
function kn(e) {
	let t = globalThis.crypto;
	if (!t?.getRandomValues) throw Error("Secure token generation requires crypto.getRandomValues().");
	return t.getRandomValues(e);
}
function An(e) {
	let t = Math.max(4, Number(e) || 0), n = new Uint8Array(t);
	return kn(n), Array.from(n, (e) => e.toString(16).padStart(2, "0")).join("");
}
function jn() {
	return `mjr_${An(18)}`;
}
function Mn(e) {
	return String(e?.apiToken || "").trim().length >= xn && H(e?.allowWrite, !0) && H(e?.requireAuth, !1) && !H(e?.allowRemoteWrite, !1);
}
function Nn(e) {
	let t = String((e && typeof e == "object" ? e : {}).apiToken || "").trim();
	return {
		apiToken: t.length >= xn ? t : jn(),
		allowWrite: !0,
		requireAuth: !0,
		allowRemoteWrite: !1,
		allowInsecureTokenTransport: On()
	};
}
function Pn(e) {
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
function Fn(e) {
	return l(Pn(e));
}
function In(e) {
	let t = String(e?.security?.tokenHint || "").trim();
	return t ? O("setting.sec.token.placeholderConfigured", "Token configured on server ({tokenHint}). Leave blank to keep the current server token.", { tokenHint: t }) : e?.security?.tokenConfigured ? O("setting.sec.token.placeholderConfiguredGeneric", "Token configured on server. Leave blank to keep the current server token.") : O("setting.sec.token.placeholder", "Auto-generated for this browser session.");
}
function Ln(e, t, n) {
	let r = (e, t) => [
		bn,
		e,
		t
	];
	e({
		id: `${yn}.Safety.ConfirmDeletion`,
		category: r(O("cat.security"), "Confirm before deleting"),
		name: "Confirm before deleting",
		tooltip: "Show a confirmation dialog before deleting files. Disabling this allows instant deletion.",
		type: "boolean",
		defaultValue: t.safety?.confirmDeletion !== !1,
		onChange: (e) => {
			wn(t.safety?.confirmDeletion !== !1, e) || (t.safety = t.safety || {}, t.safety.confirmDeletion = !!e, G(t), K(t), n("safety.confirmDeletion"));
		}
	});
	let i = (i, a, o, s = "cat.security") => {
		e({
			id: `${yn}.Security.${i}`,
			category: r(O(s), O(a).replace("Majoor: ", "")),
			name: O(a),
			tooltip: O(o),
			type: "boolean",
			defaultValue: H(t.security?.[i], Sn[i] ?? !1),
			onChange: (e) => {
				if (!wn(t.security?.[i], e)) {
					t.security = t.security || {}, t.security[i] = !!e, G(t), n(`security.${i}`);
					try {
						Fn(t.security).then((e) => {
							e?.ok && e.data?.prefs ? Kt() : e && e.ok === !1 && console.warn("[Majoor] backend security settings update failed", e.error || e);
						}).catch(() => {});
					} catch (e) {
						console.debug?.(e);
					}
				}
			}
		});
	};
	i("safeMode", "setting.sec.safe.name", "setting.sec.safe.desc"), i("allowWrite", "setting.sec.write.name", "setting.sec.write.desc"), i("allowDelete", "setting.sec.del.name", "setting.sec.del.desc"), i("allowRename", "setting.sec.ren.name", "setting.sec.ren.desc"), i("allowOpenInFolder", "setting.sec.open.name", "setting.sec.open.desc"), i("allowResetIndex", "setting.sec.reset.name", "setting.sec.reset.desc"), e({
		id: `${yn}.Security.RemoteLanPreset`,
		category: r(O("cat.remote"), O("setting.sec.remoteLanPreset.name").replace("Majoor: ", "")),
		name: O("setting.sec.remoteLanPreset.name"),
		tooltip: O("setting.sec.remoteLanPreset.desc"),
		type: "boolean",
		defaultValue: Mn(t.security),
		onChange: (e) => {
			if (t.security = t.security || {}, wn(t.security.remoteLanPreset, e)) return;
			if (t.security.remoteLanPreset = !!e, !e) {
				G(t), n("security.remoteLanPreset");
				return;
			}
			let r;
			try {
				r = Nn(t.security);
			} catch (e) {
				E(e?.message || O("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				return;
			}
			Object.assign(t.security, r), t.security.tokenConfigured = !0, t.security.tokenHint = String(r.apiToken || "").trim() ? `...${String(r.apiToken).trim().slice(-4)}` : "", r.apiToken && T(r.apiToken), G(t), n("security.remoteLanPreset"), n("security.apiToken"), n("security.allowWrite"), n("security.requireAuth"), n("security.allowRemoteWrite"), n("security.allowInsecureTokenTransport");
			try {
				Fn(t.security).then((e) => {
					e?.ok && e.data?.prefs ? (Kt(), E(O("toast.remoteLanPresetApplied", "Recommended remote LAN setup applied. This browser session is now authorized for Majoor write operations."), "success")) : e && e.ok === !1 && (E(e.error || O("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error"), console.warn("[Majoor] backend remote LAN preset update failed", e.error || e));
				}).catch((e) => {
					E(e?.message || O("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), e({
		id: `${yn}.Security.ApiToken`,
		category: r(O("cat.remote"), O("setting.sec.token.name").replace("Majoor: ", "")),
		name: O("setting.sec.token.name", "Majoor: API Token"),
		tooltip: O("setting.sec.token.desc", "Store the API token used for write operations. Majoor sends it via X-MJR-Token and Authorization headers."),
		type: "text",
		defaultValue: t.security?.apiToken || "",
		attrs: { placeholder: In(t) },
		onChange: (e) => {
			t.security = t.security || {};
			let r = Tn(e);
			if (Tn(t.security.apiToken) !== r && (t.security.apiToken = r, t.security.apiToken && (t.security.tokenConfigured = !0, t.security.tokenHint = `...${t.security.apiToken.slice(-4)}`, T(t.security.apiToken)), G(t), n("security.apiToken"), t.security.apiToken)) try {
				l({ api_token: t.security.apiToken }).then((e) => {
					e?.ok && e.data?.prefs ? Kt() : e && e.ok === !1 && console.warn("[Majoor] backend token update failed", e.error || e);
				}).catch(() => {});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), i("requireAuth", "setting.sec.requireAuth.name", "setting.sec.requireAuth.desc", "cat.remote"), i("allowRemoteWrite", "setting.sec.remote.name", "setting.sec.remote.desc", "cat.remote"), i("allowInsecureTokenTransport", "setting.sec.insecureTransport.name", "setting.sec.insecureTransport.desc", "cat.remote");
}
//#endregion
//#region ui/app/settings/settingsAdvanced.ts
var J = "Majoor", Rn = "Majoor Assets Manager";
function zn(e, n, r, i) {
	let a = (e, t) => [
		Rn,
		e,
		t
	], o = String(n.paths?.outputDirectory || ""), l = null, u = 0, f = null;
	e({
		id: `${J}.Paths.OutputDirectory`,
		category: a(O("cat.advanced"), "Paths / Output"),
		name: "Majoor: Generation Output Directory",
		tooltip: "Override the ComfyUI generation output directory used by Majoor (equivalent to --output-directory). Leave empty to keep the current backend default.",
		type: "text",
		defaultValue: String(n.paths?.outputDirectory || ""),
		attrs: { placeholder: "D:\\\\____COMFY_OUTPUTS" },
		onChange: async (e) => {
			let t = String(e || "").trim();
			n.paths = n.paths || {}, n.paths.outputDirectory = t, G(n);
			try {
				l &&= (clearTimeout(l), null);
			} catch (e) {
				console.debug?.(e);
			}
			l = setTimeout(async () => {
				l = null;
				let e = ++u;
				try {
					f?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				f = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let i = await fe(t, f ? { signal: f.signal } : {});
					if (e !== u) return;
					if (!i?.ok) throw Error(i?.error || O("toast.failedSetOutputDirectory", "Failed to set output directory"));
					let a = String(i?.data?.output_directory || t).trim();
					n.paths.outputDirectory = a, o = a, G(n), r("paths.outputDirectory");
				} catch (t) {
					if (e !== u || String(t?.name || "") === "AbortError" || String(t?.code || "") === "ABORTED") return;
					n.paths.outputDirectory = o, G(n), r("paths.outputDirectory"), E(t?.message || O("toast.failedSetOutputDirectory", "Failed to set output directory"), "error");
				}
			}, 700);
		}
	});
	try {
		be().then((e) => {
			if (!e?.ok) return;
			let t = String(e?.data?.output_directory || "").trim();
			n.paths = n.paths || {}, n.paths.outputDirectory !== t && (n.paths.outputDirectory = t, o = t, G(n), r("paths.outputDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let m = String(n.paths?.indexDirectory || ""), h = null, _ = 0, v = null;
	e({
		id: `${J}.Paths.IndexDirectory`,
		category: a(O("cat.advanced"), "Paths / Index"),
		name: "Majoor: Index Database Directory",
		tooltip: "Override the Majoor index database directory. Use this to keep the SQLite index on a different local disk. Requires restart.",
		type: "text",
		defaultValue: String(n.paths?.indexDirectory || ""),
		attrs: { placeholder: "D:\\MajoorIndex" },
		onChange: async (e) => {
			let t = String(e || "").trim();
			n.paths = n.paths || {}, n.paths.indexDirectory = t, G(n);
			try {
				h &&= (clearTimeout(h), null);
			} catch (e) {
				console.debug?.(e);
			}
			h = setTimeout(async () => {
				h = null;
				let e = ++_;
				try {
					v?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				v = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let i = await S(t, v ? { signal: v.signal } : {});
					if (e !== _) return;
					if (!i?.ok) throw Error(i?.error || O("toast.failedSetIndexDirectory", "Failed to set index directory"));
					let a = String(i?.data?.index_directory || t).trim(), o = a !== m;
					n.paths.indexDirectory = a, m = a, G(n), r("paths.indexDirectory"), o && E(O("toast.indexDirectorySavedRestart", "Index directory saved. Restart ComfyUI to apply."), "success", void 0, { history: { trackId: "settings:index-directory-saved" } });
				} catch (t) {
					if (e !== _ || String(t?.name || "") === "AbortError" || String(t?.code || "") === "ABORTED") return;
					n.paths.indexDirectory = m, G(n), r("paths.indexDirectory"), E(t?.message || O("toast.failedSetIndexDirectory", "Failed to set index directory"), "error");
				}
			}, 700);
		}
	});
	try {
		ie().then((e) => {
			if (!e?.ok) return;
			let t = String(e?.data?.index_directory || "").trim();
			n.paths = n.paths || {}, n.paths.indexDirectory !== t && (n.paths.indexDirectory = t, m = t, G(n), r("paths.indexDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let y = String(n.paths?.workflowRoots || ""), b = null, x = 0, C = null;
	e({
		id: `${J}.Paths.WorkflowRoots`,
		category: a(O("cat.advanced"), "Paths / Workflows"),
		name: "Majoor: Workflow Roots",
		tooltip: "Folders scanned by the Workflow tab. Use one folder per line, or separate folders with semicolons. Leave empty to use ComfyUI defaults and MJR_AM_WORKFLOW_DIRECTORY.",
		type: "text",
		defaultValue: String(n.paths?.workflowRoots || ""),
		attrs: { placeholder: "D:\\\\ComfyUI\\\\user\\\\default\\\\workflows" },
		onChange: async (e) => {
			let t = String(e || "").trim();
			n.paths = n.paths || {}, n.paths.workflowRoots = t, G(n);
			try {
				b &&= (clearTimeout(b), null);
			} catch (e) {
				console.debug?.(e);
			}
			b = setTimeout(async () => {
				b = null;
				let e = ++x;
				try {
					C?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				C = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let i = await s(t, C ? { signal: C.signal } : {});
					if (e !== x) return;
					if (!i?.ok) throw Error(i?.error || O("toast.failedSetWorkflowRoots", "Failed to set workflow roots"));
					let a = String(i?.data?.workflow_roots_text || t).trim();
					n.paths.workflowRoots = a, y = a, G(n), r("paths.workflowRoots"), E(O("toast.workflowRootsSaved", "Workflow roots saved"), "success", 1800);
				} catch (t) {
					if (e !== x || String(t?.name || "") === "AbortError" || String(t?.code || "") === "ABORTED") return;
					n.paths.workflowRoots = y, G(n), r("paths.workflowRoots"), E(t?.message || O("toast.failedSetWorkflowRoots", "Failed to set workflow roots"), "error");
				}
			}, 700);
		}
	});
	try {
		xe().then((e) => {
			if (!e?.ok) return;
			let t = String(e?.data?.workflow_roots_text || "").trim();
			n.paths = n.paths || {}, n.paths.workflowRoots !== t && (n.paths.workflowRoots = t, y = t, G(n), r("paths.workflowRoots"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let te = Fe().map((e) => e.code), T = ["auto", ...te];
	e({
		id: `${J}.Language`,
		category: a(O("cat.advanced"), O("setting.language.name", "Language")),
		name: O("setting.language.name", "Majoor: Language"),
		tooltip: "Use auto to detect and follow ComfyUI language. Or choose a fixed language for Majoor only.",
		type: "combo",
		defaultValue: n.i18n?.followComfyLanguage ? "auto" : Ae(),
		options: T,
		onChange: (e) => {
			if (n.i18n = n.i18n || {}, e === "auto") {
				n.i18n.followComfyLanguage = !0, je(!0), ze(i), G(n), r("language");
				return;
			}
			te.includes(e) && (n.i18n.followComfyLanguage = !1, je(!1), Me(e), G(n), r("language"));
		}
	}), e({
		id: `${J}.ProbeBackend.Mode`,
		category: a(O("cat.advanced"), O("setting.probe.mode.name").replace("Majoor: ", "")),
		name: O("setting.probe.mode.name"),
		tooltip: O("setting.probe.mode.desc") + " (env: MAJOOR_MEDIA_PROBE_BACKEND)",
		type: "combo",
		defaultValue: n.probeBackend?.mode || W.probeBackend.mode,
		options: [
			"auto",
			"exiftool",
			"ffprobe",
			"both"
		],
		onChange: (e) => {
			let i = It(e, [
				"auto",
				"exiftool",
				"ffprobe",
				"both"
			], W.probeBackend.mode);
			n.probeBackend = n.probeBackend || {}, n.probeBackend.mode = i, G(n), K(n), r("probeBackend.mode"), t(i).catch(() => {});
		}
	}), e({
		id: `${J}.MetadataFallback.Image`,
		category: a(O("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Images)",
		tooltip: "Enable Pillow fallback when ExifTool is missing or fails.",
		type: "boolean",
		defaultValue: n.metadataFallback?.image ?? W.metadataFallback.image,
		onChange: async (e) => {
			let t = !!e, i = !!(n.metadataFallback?.image ?? W.metadataFallback.image);
			n.metadataFallback = n.metadataFallback || {}, n.metadataFallback.image = t, G(n), r("metadataFallback.image");
			try {
				let e = await p({
					image: t,
					media: n.metadataFallback?.media ?? W.metadataFallback.media
				});
				if (!e?.ok) throw Error(e?.error || O("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				n.metadataFallback.image = i, G(n), r("metadataFallback.image"), E(e?.message || O("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	}), e({
		id: `${J}.MetadataFallback.Media`,
		category: a(O("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Audio/Video)",
		tooltip: "Enable hachoir fallback when ffprobe is missing or fails.",
		type: "boolean",
		defaultValue: n.metadataFallback?.media ?? W.metadataFallback.media,
		onChange: async (e) => {
			let t = !!e, i = !!(n.metadataFallback?.media ?? W.metadataFallback.media);
			n.metadataFallback = n.metadataFallback || {}, n.metadataFallback.media = t, G(n), r("metadataFallback.media");
			try {
				let e = await p({
					image: n.metadataFallback?.image ?? W.metadataFallback.image,
					media: t
				});
				if (!e?.ok) throw Error(e?.error || O("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				n.metadataFallback.media = i, G(n), r("metadataFallback.media"), E(e?.message || O("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	});
	try {
		ce().then((e) => {
			if (!e?.ok || !e?.data?.prefs) return;
			let t = e.data.prefs || {}, i = !!(t.image ?? W.metadataFallback.image), a = !!(t.media ?? W.metadataFallback.media);
			n.metadataFallback = n.metadataFallback || {};
			let o = !1;
			n.metadataFallback.image !== i && (n.metadataFallback.image = i, o = !0), n.metadataFallback.media !== a && (n.metadataFallback.media = a, o = !0), o && (G(n), r("metadataFallback"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	e({
		id: `${J}.Db.Timeout`,
		category: a(O("cat.advanced"), "Database"),
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
			n.db = n.db || {}, n.db.timeoutMs = Math.max(1e3, Math.min(3e4, Math.round(U(e, 5e3)))), G(n), K(n), r("db.timeoutMs");
		}
	}), e({
		id: `${J}.Db.MaxConnections`,
		category: a(O("cat.advanced"), "Database"),
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
			n.db = n.db || {}, n.db.maxConnections = Math.max(1, Math.min(100, Math.round(U(e, 10)))), G(n), K(n), r("db.maxConnections");
		}
	}), e({
		id: `${J}.Db.QueryTimeout`,
		category: a(O("cat.advanced"), "Database"),
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
			n.db = n.db || {}, n.db.queryTimeoutMs = Math.max(500, Math.min(1e4, Math.round(U(e, 1e3)))), G(n), K(n), r("db.queryTimeoutMs");
		}
	}), e({
		id: `${J}.Observability.Enabled`,
		category: a(O("cat.advanced"), O("setting.obs.enabled.name").replace("Majoor: ", "")),
		name: O("setting.obs.enabled.name"),
		tooltip: O("setting.obs.enabled.desc"),
		type: "boolean",
		defaultValue: !!n.observability?.enabled,
		onChange: (e) => {
			n.observability = n.observability || {}, n.observability.enabled = !!e, G(n), K(n), r("observability.enabled");
		}
	}), e({
		id: `${J}.Observability.RuntimeDashboardMode`,
		category: a(O("cat.advanced"), "Runtime metrics badge"),
		name: "Majoor: Runtime metrics badge",
		tooltip: "Controls the small DB/enrichment/watcher metrics badge in the Assets Manager panel.",
		type: "combo",
		defaultValue: n.observability?.runtimeDashboardMode || W.observability.runtimeDashboardMode,
		options: [
			"autoHide30",
			"always",
			"hidden"
		],
		onChange: (e) => {
			let t = It(e, [
				"autoHide30",
				"always",
				"hidden"
			], W.observability.runtimeDashboardMode);
			n.observability = n.observability || {}, n.observability.runtimeDashboardMode = t, G(n), r("observability.runtimeDashboardMode");
		}
	}), e({
		id: `${J}.Observability.VerboseErrors`,
		category: a(O("cat.advanced"), "Verbose error logging"),
		name: "Verbose error logging",
		tooltip: "Show detailed error messages in toasts and console. Useful for debugging.",
		type: "boolean",
		defaultValue: !!n.observability?.verboseErrors,
		onChange: (e) => {
			n.observability = n.observability || {}, n.observability.verboseErrors = !!e, G(n), K(n), r("observability.verboseErrors");
		}
	}), e({
		id: `${J}.Observability.VerboseRouteRegistrationLogs`,
		category: a(O("cat.advanced"), "Logs"),
		name: "Majoor: Verbose route registration logs",
		tooltip: "When disabled, Majoor prints a compact startup summary instead of listing every registered API route. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(n.observability?.verboseRouteRegistrationLogs ?? W.observability?.verboseRouteRegistrationLogs ?? !1),
		onChange: async (e) => {
			let t = !!e, i = !!(n.observability?.verboseRouteRegistrationLogs ?? W.observability?.verboseRouteRegistrationLogs ?? !1);
			n.observability = n.observability || {}, n.observability.verboseRouteRegistrationLogs = t, G(n), r("observability.verboseRouteRegistrationLogs");
			try {
				let e = await de(t);
				if (!e?.ok) throw Error(e?.error || "Failed to update route logging settings");
			} catch (e) {
				n.observability.verboseRouteRegistrationLogs = i, G(n), r("observability.verboseRouteRegistrationLogs"), E(e?.message || "Failed to update route logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let e = !!(await me())?.data?.prefs?.enabled;
			n.observability = n.observability || {}, n.observability.verboseRouteRegistrationLogs !== e && (n.observability.verboseRouteRegistrationLogs = e, G(n), r("observability.verboseRouteRegistrationLogs"));
		} catch (e) {
			console.debug?.(e);
		}
	})(), e({
		id: `${J}.Observability.VerboseStartupLogs`,
		category: a(O("cat.advanced"), "Logs"),
		name: "Majoor: Verbose startup logs",
		tooltip: "When disabled, Majoor suppresses most informational bootstrap logs during backend startup while keeping warnings and errors. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(n.observability?.verboseStartupLogs ?? W.observability?.verboseStartupLogs ?? !1),
		onChange: async (e) => {
			let t = !!e, i = !!(n.observability?.verboseStartupLogs ?? W.observability?.verboseStartupLogs ?? !1);
			n.observability = n.observability || {}, n.observability.verboseStartupLogs = t, G(n), r("observability.verboseStartupLogs");
			try {
				let e = await d(t);
				if (!e?.ok) throw Error(e?.error || "Failed to update startup logging settings");
			} catch (e) {
				n.observability.verboseStartupLogs = i, G(n), r("observability.verboseStartupLogs"), E(e?.message || "Failed to update startup logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let e = !!(await oe())?.data?.prefs?.enabled;
			n.observability = n.observability || {}, n.observability.verboseStartupLogs !== e && (n.observability.verboseStartupLogs = e, G(n), r("observability.verboseStartupLogs"));
		} catch (e) {
			console.debug?.(e);
		}
	})();
	{
		let t = "HuggingFace Token", i = "", o = null, s = 0, l = !!n.ai?.huggingFaceTokenVisible, u = () => {
			try {
				let e = Array.from(document.querySelectorAll("input[data-mjr-hf-token=\"1\"]"));
				for (let t of e) try {
					t.type = l ? "text" : "password";
				} catch (e) {
					console.debug?.(e);
				}
			} catch (e) {
				console.debug?.(e);
			}
		}, d = (e) => {
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
			category: a(O("cat.advanced"), t),
			name: "Show HuggingFace token",
			tooltip: "Show or hide the HuggingFace token while editing.",
			type: "boolean",
			defaultValue: l,
			onChange: (e) => {
				let t = !!e;
				l = t, n.ai = n.ai || {}, n.ai.huggingFaceTokenVisible = t, G(n), r("ai.huggingFaceTokenVisible"), setTimeout(u, 0);
			}
		}), e({
			id: `${J}.AI.HuggingFaceToken`,
			category: a(O("cat.advanced"), t),
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
				type: l ? "text" : "password",
				autocomplete: "new-password",
				name: "mjr_huggingface_token",
				"data-mjr-hf-token": "1"
			},
			onChange: (e) => {
				let t = String(e || "").trim();
				if (t !== i) {
					try {
						o &&= (clearTimeout(o), null);
					} catch (e) {
						console.debug?.(e);
					}
					o = setTimeout(async () => {
						o = null;
						let e = ++s;
						try {
							let n = await Ce(t);
							if (e !== s) return;
							if (!n?.ok) throw Error(n?.error || "Failed to update HuggingFace token");
							i = t, r("ai.huggingFaceToken"), t ? E("HuggingFace token saved", "success") : E("HuggingFace token cleared", "success", void 0, { noHistory: !0 });
						} catch (t) {
							if (e !== s) return;
							E(t?.message || "Failed to update HuggingFace token", "error");
						}
					}, 900);
				}
			}
		}), setTimeout(u, 0), (async () => {
			try {
				let e = (await w())?.data?.prefs || {}, t = !!e?.has_token, n = String(e?.token_hint || "").trim(), r = t ? `Configured ${n || "(saved)"}` : "Paste HuggingFace token (hf_...)";
				d(r);
			} catch (e) {
				console.debug?.(e);
			}
		})(), e({
			id: `${J}.AI.VerboseLogs`,
			category: a(O("cat.advanced"), t),
			name: "Majoor: Verbose AI logs",
			tooltip: "Enable detailed HuggingFace/SigLIP2/X-CLIP logs and progress bars during model download/loading.",
			type: "boolean",
			defaultValue: !!(n.ai?.verboseAiLogs ?? W.ai?.verboseAiLogs ?? !1),
			onChange: async (e) => {
				let t = !!e, i = !!(n.ai?.verboseAiLogs ?? W.ai?.verboseAiLogs ?? !1);
				n.ai = n.ai || {}, n.ai.verboseAiLogs = t, G(n), r("ai.verboseAiLogs");
				try {
					let e = await we(t);
					if (!e?.ok) throw Error(e?.error || "Failed to update AI logging settings");
				} catch (e) {
					n.ai.verboseAiLogs = i, G(n), r("ai.verboseAiLogs"), E(e?.message || "Failed to update AI logging settings", "error");
				}
			}
		}), (async () => {
			try {
				let e = !!(await c())?.data?.prefs?.enabled;
				n.ai = n.ai || {}, n.ai.verboseAiLogs !== e && (n.ai.verboseAiLogs = e, G(n), r("ai.verboseAiLogs"));
			} catch (e) {
				console.debug?.(e);
			}
		})();
	}
	e({
		id: `${J}.AI.VectorStats`,
		category: a(O("cat.advanced"), "AI / Vector Search"),
		name: "Vector Index Status",
		tooltip: "Current status of the SigLIP2/X-CLIP vector index used for semantic search",
		type: "text",
		defaultValue: "Loading vector status..."
	}), (async () => {
		try {
			let e = await _e();
			e?.ok ? console.debug?.("[Majoor] Vector status:", `${e.data?.total || 0} assets indexed | Model: ${e.data?.model || "N/A"}`) : console.debug?.("[Majoor] Vector status unavailable");
		} catch (e) {
			console.debug?.("[Majoor] Vector status fetch failed", e);
		}
	})(), e({
		id: `${J}.AI.VectorBackfillAction`,
		category: a(O("cat.advanced"), "AI / Vector Search"),
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
				E(O("toast.vectorBackfillStarting", "Starting vector backfill... This may take a while."), "info", void 0, { history: {
					...t.history,
					status: "started",
					detail: "Starting vector backfill... This may take a while."
				} });
				let e = await ee(64, { onProgress: (e) => {
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
					let n = e.data || {}, r = String(n?.status || "").toLowerCase(), i = !!n?.pending || [
						"queued",
						"running",
						"pending"
					].includes(r), a = n?.progress || {}, o = Number(n?.processed ?? a?.candidates ?? 0), s = Number(n?.indexed ?? a?.indexed ?? 0), c = Number(n?.skipped ?? a?.skipped ?? 0);
					if (i) {
						let e = String(n?.job_id || "").trim();
						E(O("toast.vectorBackfillRunning", "Vector backfill still running in background{job}.", { job: e ? ` (job ${e.slice(0, 8)})` : "" }), "info", void 0, { history: {
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
					} else {
						let e = O("toast.vectorBackfillComplete", "Vector backfill complete! Processed: {processed}, Indexed: {indexed}, Skipped: {skipped}", {
							processed: o,
							indexed: s,
							skipped: c
						});
						E(e, "success", void 0, { history: {
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
					}
					try {
						let e = await _e();
						e?.ok && console.debug?.("[Majoor] Vector stats after backfill:", e.data);
					} catch (e) {
						console.debug?.("[Majoor] Failed to refresh vector stats:", e);
					}
				} else throw Error(e?.error || O("toast.vectorBackfillFailedGeneric", "Backfill failed"));
			} catch (e) {
				let n = e?.message || String(e || O("status.unknown", "unknown"));
				E(O("toast.vectorBackfillFailedDetail", "Vector backfill failed: {error}", { error: n }), "error", void 0, { history: {
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
var Bn = "Majoor", Vn = "Majoor Assets Manager";
function Hn(e, t, n) {
	let r = (e, t) => [
		Vn,
		e,
		t
	];
	e({
		id: `${Bn}.AI.VectorSearchEnabled`,
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
				let e = await m(i);
				if (!e?.ok) {
					t.ai.vectorSearchEnabled = r, G(t), K(t), n("ai.vectorSearchEnabled"), E(e?.error || "Failed to update AI vector search setting", "error");
					return;
				}
				E(i ? "AI semantic search enabled" : "AI semantic search disabled", "info", 2200);
			} catch (e) {
				t.ai.vectorSearchEnabled = r, G(t), K(t), n("ai.vectorSearchEnabled"), E(e?.message || "Failed to update AI vector search setting", "error");
			}
		}
	}), e({
		id: `${Bn}.AI.VectorCaptionOnIndex`,
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
				let e = await m({ caption_on_index: i });
				if (!e?.ok) {
					t.ai.vectorCaptionOnIndex = r, G(t), K(t), n("ai.vectorCaptionOnIndex"), E(e?.error || "Failed to update AI caption indexing setting", "error");
					return;
				}
				i && E("AI captions during indexing enabled", "info", 2600);
			} catch (e) {
				t.ai.vectorCaptionOnIndex = r, G(t), K(t), n("ai.vectorCaptionOnIndex"), E(e?.message || "Failed to update AI caption indexing setting", "error");
			}
		}
	}), e({
		id: `${Bn}.AI.VectorIndexOnScan`,
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
				let e = await m({ index_on_scan: i });
				if (!e?.ok) {
					t.ai.vectorIndexOnScan = r, G(t), K(t), n("ai.vectorIndexOnScan"), E(e?.error || "Failed to update vector scan indexing", "error");
					return;
				}
				E(i ? "Vector indexing during scans enabled" : "Vector indexing during scans disabled", "info", 2400);
			} catch (e) {
				t.ai.vectorIndexOnScan = r, G(t), K(t), n("ai.vectorIndexOnScan"), E(e?.message || "Failed to update vector scan indexing", "error");
			}
		}
	}), e({
		id: `${Bn}.AI.VectorConcurrency`,
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
				let e = await m({ concurrency: i });
				e?.ok || (t.ai.vectorConcurrency = r, G(t), K(t), n("ai.vectorConcurrency"), E(e?.error || "Failed to update vector concurrency", "error"));
			} catch (e) {
				t.ai.vectorConcurrency = r, G(t), K(t), n("ai.vectorConcurrency"), E(e?.message || "Failed to update vector concurrency", "error");
			}
		}
	}), e({
		id: `${Bn}.AI.VectorUnloadAfterUse`,
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
				let e = await m({ unload_after_use: i });
				if (!e?.ok) {
					t.ai.vectorUnloadAfterUse = r, G(t), K(t), n("ai.vectorUnloadAfterUse"), E(e?.error || "Failed to update model unload setting", "error");
					return;
				}
				E(i ? "AI model unload after use enabled" : "AI model unload after use disabled", "info", 2400);
			} catch (e) {
				t.ai.vectorUnloadAfterUse = r, G(t), K(t), n("ai.vectorUnloadAfterUse"), E(e?.message || "Failed to update model unload setting", "error");
			}
		}
	}), e({
		id: `${Bn}.AI.VectorUnloadNow`,
		category: r(O("cat.search", "Search"), "AI"),
		name: O("setting.ai.vector.unloadNow.name", "Memory purge now"),
		tooltip: O("setting.ai.vector.unloadNow.desc", "Immediately unload Majoor AI vector/caption models, ask ComfyUI to unload loaded models, and clear torch CUDA cache when idle."),
		type: "combo",
		options: ["Idle", "Unload now"],
		defaultValue: "Idle",
		onChange: async (e) => {
			if (String(e || "") === "Unload now") try {
				let e = await Te();
				E(e?.ok ? "Majoor AI model cache unloaded" : e?.error || "Failed to unload Majoor AI model cache", e?.ok ? "info" : "error", 2600);
			} catch (e) {
				E(e?.message || "Failed to unload Majoor AI model cache", "error");
			}
		}
	}), e({
		id: `${Bn}.Search.MaxResults`,
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
		id: `${Bn}.EnvVars.Reference`,
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
var Un = "Majoor Assets Manager", Wn = /^\s*Majoor:\s*/i, Gn = Object.freeze({
	ASSETS_PANEL: "Assets Panel",
	GENERATED_FEED: "Generated Feed",
	VIEWER: "Viewer & Floating Viewer",
	INDEXING: "Indexing & Watcher",
	SEARCH_AI: "Search & AI",
	GENERAL: "General",
	ADVANCED: "Advanced",
	SECURITY: "Security"
}), Kn = /* @__PURE__ */ new Set([
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
]), qn = "Majoor.General.ResetAllSettings", Jn = "mjr-settings-reset-btn", Yn = null, Xn = null;
function Zn(e) {
	let t = String(e || "").trim();
	return !t || t === qn || t === "Majoor.Language" ? Gn.GENERAL : /^Majoor\.(Safety|Security)\./.test(t) ? Gn.SECURITY : /^Majoor\.(Paths|Db|ProbeBackend|MetadataFallback|Observability)\./.test(t) || t === "Majoor.EnvVars.Reference" ? Gn.ADVANCED : /^Majoor\.(Viewer|WorkflowMinimap)\./.test(t) ? Gn.VIEWER : /^Majoor\.Feed\./.test(t) ? Gn.GENERATED_FEED : /^Majoor\.(AutoScan|Scan|Watcher|ExecutionGrouping|RatingTagsSync)\./.test(t) || t === "Majoor.RtHydrate.Concurrency" ? Gn.INDEXING : /^Majoor\.AI\.(HuggingFaceTokenVisible|HuggingFaceToken|VerboseLogs|VectorStats|VectorBackfillAction|VectorSearchEnabled|VectorCaptionOnIndex|VectorIndexOnScan|VectorConcurrency|VectorUnloadAfterUse|VectorUnloadNow)$/.test(t) || /^Majoor\.Search\./.test(t) ? Gn.SEARCH_AI : /^Majoor\.(Grid|Cards|Badges|Sidebar|InfiniteScroll|General)\./.test(t) ? Gn.ASSETS_PANEL : Gn.GENERAL;
}
function Qn(e) {
	let t = Array.isArray(e?.category) ? e.category.filter(Boolean) : [], n = Zn(e?.id), r = String(t[1] || t[0] || "").trim(), i = String(t[2] || "").trim(), a = String(e?.name || "").replace(Wn, "").trim();
	return [
		Un,
		n,
		i || r || a || n
	];
}
var $n = !1, er = null, tr = null, nr = !1, rr = /* @__PURE__ */ new Set();
function ir(e) {
	if (!e || typeof e != "object") return null;
	let t = { ...e };
	try {
		typeof t.name == "string" && (t.name = t.name.replace(Wn, "").trim());
	} catch (e) {
		console.debug?.(e);
	}
	try {
		t.category = Qn(t);
	} catch {
		t.category = [Un, Gn.GENERAL];
	}
	return !t.tooltip && typeof t.name == "string" && t.name.trim() && (t.tooltip = t.name.trim()), t;
}
function ar(e, t, n) {
	let r = String(t?.id || "").trim();
	if (!r || rr.has(r)) return !1;
	rr.add(r);
	try {
		return De(e, r, n);
	} finally {
		rr.delete(r);
	}
}
function or(e, t) {
	if (!t || typeof t != "object") return t;
	let n = { ...t };
	ar(e, n, n.defaultValue);
	let r = n.onChange;
	return n.onChange = (t, ...i) => {
		if (ar(e, n, t), typeof r == "function") return r(t, ...i);
		n.defaultValue = t;
	}, n;
}
function sr(e) {
	try {
		return JSON.parse(JSON.stringify(e || {}));
	} catch {
		return { ...W };
	}
}
function cr(e, t, n, { wrapForComfy: r = !0 } = {}) {
	let i = [], a = (e) => {
		let n = ir(e);
		n && i.push(r ? or(t, n) : n);
	};
	return ln(a, e, n), vn(a, e, n), fn(a, e, n), hn(a, e, n), Ln(a, e, n), zn(a, e, n, t), Hn(a, e, n), i;
}
function lr(e, t) {
	if (e === t) return !0;
	try {
		return JSON.stringify(e) === JSON.stringify(t);
	} catch {
		return !1;
	}
}
function ur(e) {
	return e ? e.querySelector(".form-input") || e.querySelector(".p-inputgroup") || e.querySelector(".setting-input") || e.querySelector("[class*='input']") : null;
}
function dr(e, t) {
	let n = document.createElement("button");
	return n.type = "button", n.className = Jn, n.textContent = e, n.title = t, n.style.marginLeft = "8px", n.style.minWidth = e.length > 2 ? "auto" : "24px", n.style.height = "24px", n.style.padding = e.length > 2 ? "0 10px" : "0", n.style.borderRadius = "6px", n.style.border = "1px solid var(--border-color, #555)", n.style.background = "var(--comfy-input-bg, #2b2b2b)", n.style.color = "var(--input-text, inherit)", n.style.cursor = "pointer", n.style.fontSize = "12px", n.style.lineHeight = "22px", n.style.flexShrink = "0", n;
}
function fr(e, t, n) {
	String(e?.id || "").trim() && (ar(n, e, t), typeof e?.onChange == "function" && e.onChange(t));
}
function pr(e, t, n, r) {
	let i = !lr(Oe(r, t.id, t.defaultValue), n);
	e.disabled = !i, e.style.opacity = i ? "1" : "0.45";
}
function mr() {
	if (typeof document > "u" || !Xn) return;
	let { app: e, definitions: t, defaultValues: n } = Xn, r = document.querySelector(`[data-setting-id="${qn}"]`), i = ur(r);
	if (r && i && !r.getAttribute("data-mjr-reset-injected")) {
		r.setAttribute("data-mjr-reset-injected", "true"), i.innerHTML = "";
		let a = dr("Reset all settings", "Reset all Majoor settings to defaults");
		a.onclick = (r) => {
			r.preventDefault(), r.stopPropagation();
			for (let r of t) r.id !== qn && n.has(r.id) && fr(r, n.get(r.id), e);
			mr();
		}, i.appendChild(a);
	}
	for (let r of t) {
		if (!r?.id || r.id === qn || !n.has(r.id)) continue;
		let t = document.querySelector(`[data-setting-id="${r.id}"]`);
		if (!t || t.getAttribute("data-mjr-reset-injected")) continue;
		let i = ur(t);
		if (!i) continue;
		t.setAttribute("data-mjr-reset-injected", "true");
		let a = dr("Reset", "Reset this setting to default");
		pr(a, r, n.get(r.id), e), a.onclick = (t) => {
			t.preventDefault(), t.stopPropagation();
			let i = n.get(r.id);
			fr(r, i, e), pr(a, r, i, e);
		}, i.appendChild(a);
	}
}
function hr(e, t, n) {
	typeof document > "u" || typeof MutationObserver > "u" || (Xn = {
		app: e,
		definitions: t,
		defaultValues: new Map(n.filter((e) => e?.id && e.id !== qn).map((e) => [e.id, e.defaultValue]))
	}, mr(), !Yn && (Yn = new MutationObserver(() => mr()), Yn.observe(document.body, {
		childList: !0,
		subtree: !0
	})));
}
function gr(e, t, { initRuntime: n = !1 } = {}) {
	if (tr) typeof t == "function" && tr.onAppliedListeners.add(t), e && !tr.app && (tr.app = e);
	else {
		let n = Gt();
		n.i18n = n.i18n || {}, typeof n.i18n.followComfyLanguage == "boolean" ? je(!!n.i18n.followComfyLanguage) : (n.i18n.followComfyLanguage = !0, je(!0), G(n));
		let r = /* @__PURE__ */ new Set();
		typeof t == "function" && r.add(t);
		let i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set(), o = () => {
			if (!i.size) return;
			let e = Array.from(i);
			i.clear();
			for (let t of e) Ge("mjr-settings-changed", { key: t }, { warnPrefix: "[Majoor]" });
		}, s = () => {
			if (!a.size) return;
			let e = Array.from(a);
			a.clear();
			for (let t of e) Ge("mjr-settings-changed", { key: t }, { warnPrefix: "[Majoor]" });
		}, c = sn(o, 120), l = sn(s, 450), u = (e) => {
			typeof e == "string" && i.add(e), c();
		}, d = (e) => {
			typeof e == "string" && a.add(e), l();
		}, f = () => {
			let e = Gt();
			Object.assign(n, e), K(n), u("storage");
		}, p = (e) => {
			!e || e.key !== "mjrSettings" || e.newValue !== e.oldValue && f();
		};
		if (!$n) {
			if (er && typeof window < "u") try {
				window.removeEventListener("storage", er);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				window.addEventListener("storage", p), $n = !0, er = p;
			} catch (e) {
				console.debug?.(e);
			}
		}
		tr = {
			app: e,
			notifyApplied: (e) => {
				for (let t of r) try {
					t(n, e);
				} catch (e) {
					console.debug?.(e);
				}
				Kn.has(String(e || "")) ? d(e) : u(e);
			},
			onAppliedListeners: r,
			refreshFromStorage: f,
			settings: n
		};
	}
	if (n && !nr) {
		let t = e || tr.app, n = tr.settings;
		ze(t), K(n), Ie(t), Kt(), qt(), Jt(), n?.watcher && typeof n.watcher.enabled == "boolean" && v(!!n.watcher.enabled).catch(() => {}), an(), nr = !0;
	}
	return tr;
}
var _r = (e, t) => gr(e, t, { initRuntime: !0 }).settings, vr = (e, t) => {
	let n = gr(e, t, { initRuntime: !1 });
	Object.assign(n.settings, Gt());
	let r = e || n.app, i = cr(n.settings, r, n.notifyApplied), a = cr(sr(W), r, () => {}, { wrapForComfy: !1 });
	return i.unshift(or(r, {
		id: qn,
		category: [
			Un,
			Gn.GENERAL,
			"Reset"
		],
		name: "Reset all settings to defaults",
		tooltip: "Reset every Majoor Assets Manager setting to its default value.",
		type: "text",
		defaultValue: ""
	})), hr(r, i, a), i;
};
try {
	let e = Gt();
	e?.watcher && typeof e.watcher.enabled == "boolean" && pe().then((e) => {
		let t = !!e?.ok && !!e?.data?.enabled, n = Gt();
		n.watcher = n.watcher || {}, typeof t == "boolean" && t !== !!n.watcher.enabled && (n.watcher.enabled = t, G(n), Ge("mjr-settings-changed", { key: "watcher.enabled" }, { warnPrefix: "[Majoor]" }));
	}).catch(() => {});
} catch (e) {
	console.debug?.(e);
}
//#endregion
//#region ui/features/contextmenu/gridContextMenuState.ts
function yr() {
	return {
		open: !1,
		x: 0,
		y: 0,
		items: [],
		title: ""
	};
}
var Y = vt({
	portalOwnerId: "",
	mountedPortalIds: [],
	main: yr(),
	submenu: yr(),
	tags: {
		open: !1,
		x: 0,
		y: 0,
		asset: null,
		onChanged: null
	}
}), br = 1;
function xr(e) {
	e && (e.open = !1, e.x = 0, e.y = 0, e.items = [], e.title = "");
}
function Sr(e = "") {
	try {
		window.dispatchEvent(new CustomEvent("mjr-close-all-menus", { detail: { source: String(e || "") } }));
	} catch (e) {
		console.debug?.(e);
	}
}
function Cr() {
	let e = `mjr-grid-context-menu-portal-${br++}`;
	return Y.mountedPortalIds.push(e), Y.portalOwnerId ||= e, e;
}
function wr(e) {
	let t = Y.mountedPortalIds.filter((t) => t !== e);
	Y.mountedPortalIds.splice(0, Y.mountedPortalIds.length, ...t), Y.portalOwnerId === e && (Y.portalOwnerId = Y.mountedPortalIds[0] || "");
}
function Tr(e) {
	return String(Y.portalOwnerId || "") === String(e || "");
}
function Er({ x: e = 0, y: t = 0, items: n = [], title: r = "" } = {}) {
	Sr("grid"), jr(), kr(), Y.main.open = !0, Y.main.x = Number(e) || 0, Y.main.y = Number(t) || 0, Y.main.items = Array.isArray(n) ? n.filter(Boolean) : [], Y.main.title = String(r || "");
}
function Dr() {
	xr(Y.main), kr();
}
function Or({ x: e = 0, y: t = 0, items: n = [], title: r = "" } = {}) {
	Y.submenu.open = !0, Y.submenu.x = Number(e) || 0, Y.submenu.y = Number(t) || 0, Y.submenu.items = Array.isArray(n) ? n.filter(Boolean) : [], Y.submenu.title = String(r || "");
}
function kr() {
	xr(Y.submenu);
}
function Ar({ x: e = 0, y: t = 0, asset: n = null, onChanged: r = null } = {}) {
	Dr(), Y.tags.open = !!n, Y.tags.x = Number(e) || 0, Y.tags.y = Number(t) || 0, Y.tags.asset = n || null, Y.tags.onChanged = typeof r == "function" ? r : null;
}
function jr() {
	Y.tags.open = !1, Y.tags.x = 0, Y.tags.y = 0, Y.tags.asset = null, Y.tags.onChanged = null;
}
function Mr() {
	Dr(), jr();
}
//#endregion
//#region ui/features/dnd/utils/constants.ts
var Nr = "application/x-mjr-asset", Pr = "application/x-mjr-assets", Fr = "application/x-comfy-asset-info", Ir = /* @__PURE__ */ new Set([
	".png",
	".jpg",
	".jpeg",
	".webp",
	".gif",
	".bmp",
	".avif",
	".jxl"
]), Lr = /* @__PURE__ */ new Set([
	".mp4",
	".mov",
	".mkv",
	".webm",
	".avi"
]), Rr = /* @__PURE__ */ new Set([
	".wav",
	".mp3",
	".flac",
	".ogg",
	".m4a",
	".aac",
	".opus"
]), zr = /* @__PURE__ */ new Set([
	".obj",
	".fbx",
	".glb",
	".gltf",
	".stl",
	".ply",
	".splat",
	".ksplat",
	".spz"
]), Br = (e) => {
	if (!e) return !1;
	let t = e.lastIndexOf(".");
	return t !== -1 && Ir.has(e.slice(t).toLowerCase());
}, Vr = (e) => e ? String(e.kind || "").toLowerCase() === "image" || Br(e.filename) : !1, Hr = (e) => {
	if (!e) return !1;
	let t = e.lastIndexOf(".");
	return t !== -1 && Lr.has(e.slice(t).toLowerCase());
}, Ur = (e) => e ? String(e.kind || "").toLowerCase() === "video" || Hr(e.filename) : !1, Wr = (e) => {
	if (!e) return !1;
	let t = e.lastIndexOf(".");
	return t !== -1 && Rr.has(e.slice(t).toLowerCase());
}, Gr = (e) => e ? String(e.kind || "").toLowerCase() === "audio" || Wr(e.filename) : !1, Kr = (e) => {
	if (!e) return !1;
	let t = e.lastIndexOf(".");
	return t !== -1 && zr.has(e.slice(t).toLowerCase());
}, qr = (e) => e ? String(e.kind || "").toLowerCase() === "model3d" || Kr(e.filename) : !1, Jr = (e) => Vr(e) || Ur(e) || Gr(e) || qr(e) || String(e?.kind || "").toLowerCase() === "workflow", Yr = {
	mp4: "video/mp4",
	mov: "video/quicktime",
	webm: "video/webm",
	mkv: "video/x-matroska",
	glb: "model/gltf-binary",
	gltf: "model/gltf+json",
	obj: "model/obj",
	stl: "model/stl",
	ply: "application/ply"
}, Xr = (e) => Yr[String(e || "").split(".").pop()?.toLowerCase()] ?? "application/octet-stream", Zr = (e, t) => {
	if (typeof e != "string") return !1;
	let n = e.trim().toLowerCase();
	if (!n) return !1;
	let r = (n.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
	return r ? t && r === String(t).toLowerCase() ? !0 : Lr.has(`.${r}`) : !1;
}, Qr = (e, t, n) => {
	if (!e || e.type !== "combo" || !e.options) return !1;
	let r = Array.isArray(e.options.values) && e.options.values || e.options.values && Array.isArray(e.options.values.values) && e.options.values.values || null;
	return Array.isArray(r) ? r.some((e) => n(typeof e == "string" ? e : e?.content ?? e?.value ?? e?.text, t)) : !1;
}, $r = (e, t) => Qr(e, t, Zr), ei = (e, t) => {
	if (typeof e != "string") return !1;
	let n = e.trim().toLowerCase();
	if (!n) return !1;
	let r = (n.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
	return r ? t && r === String(t).toLowerCase() ? !0 : Ir.has(`.${r}`) : !1;
}, ti = (e, t) => Qr(e, t, ei), ni = (e, t) => {
	if (typeof e != "string") return !1;
	let n = e.trim().toLowerCase();
	if (!n) return !1;
	let r = (n.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
	return r ? t && r === String(t).toLowerCase() ? !0 : Rr.has(`.${r}`) : !1;
}, ri = (e, t) => Qr(e, t, ni), ii = (e, t) => {
	if (typeof e != "string") return !1;
	let n = e.trim().toLowerCase();
	if (!n) return !1;
	let r = (n.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
	return r ? t && r === String(t).toLowerCase() ? !0 : zr.has(`.${r}`) : !1;
}, ai = (e, t) => Qr(e, t, ii), oi = /* @__PURE__ */ new WeakMap(), si = (e) => {
	if (!e || typeof e != "object") return {
		node: null,
		prev: null
	};
	let t = oi.get(e);
	return t || (t = {
		node: null,
		prev: null
	}, oi.set(e, t)), t;
}, ci = (e, t, n) => {
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
}, li = (e, t, n) => {
	let r = si(e);
	!t || r.node === t || (ui(e, n), r.node = t, r.prev = {
		color: t.color,
		bgcolor: t.bgcolor
	}, t.bgcolor = "#3355ff", t.color = "#a9c4ff", n(e));
}, ui = (e, t) => {
	let n = si(e);
	if (n.node) {
		try {
			n.prev && (n.node.color = n.prev.color, n.node.bgcolor = n.prev.bgcolor);
		} catch (e) {
			console.debug?.(e);
		}
		n.node = null, n.prev = null, t(e);
	}
}, di = (e, t) => {
	if (!e || e.type !== "combo" || !e.options) return;
	let n = e.options.values, r = e.options;
	if (typeof n != "function") {
		if (!Array.isArray(n)) {
			if (n && typeof n == "object" && Array.isArray(n.values)) r = n, n = n.values;
			else return;
		}
		n.some((e) => typeof e == "string" ? e === t : (e?.content ?? e?.value ?? e?.text) === t) || (n.length === 0 || typeof n[0] == "string" ? n.unshift(t) : n.unshift({
			content: t,
			text: t,
			value: t
		}), r.values = n);
	}
}, fi = /* @__PURE__ */ new Set([
	"number",
	"int",
	"float",
	"boolean",
	"toggle",
	"checkbox",
	"button",
	"hidden"
]), pi = [
	"output",
	"save",
	"export",
	"folder",
	"dir"
], mi = ["file", "path"], hi = [
	"path",
	"file",
	"input",
	"src",
	"source"
], gi = (e, t, n) => {
	let r = e?.widgets;
	if (!Array.isArray(r) || !r.length) return null;
	let i = String(t || "").toLowerCase().replace(/^\./, ""), a = String(e?.type || "").toLowerCase(), o = n.knownNodeIncludes.some((e) => a.includes(e)), s = [];
	for (let e of r) {
		if (!e) continue;
		let t = String(e?.type || "").toLowerCase(), r = e?.value;
		if (fi.has(t) || typeof r == "number" || typeof r == "boolean") continue;
		let a = t === "text" || t === "string" || t === "combo", c = typeof e?.callback == "function" && typeof r == "string";
		if (!a && !c) continue;
		let l = String(e?.name || e?.label || "").toLowerCase().trim(), u = 0;
		n.exactNames.has(l) && (u += 100), l === "file" && o && t === "combo" && n.comboChecker(e, i) && (u += 100);
		let d = n.mediaTerms.some((e) => l.includes(e)), f = hi.some((e) => l.includes(e));
		d && f && (u += 80), mi.some((e) => l.includes(e)) && (u += 35);
		for (let { terms: e, score: t } of n.extraTerms) e.some((e) => l.includes(e)) && (u += t);
		pi.some((e) => l.includes(e)) && (u -= 90), n.exactSingleNames.has(l) && (typeof r == "string" && r.trim() === "" || n.looksLikeFn(r, i) ? u += 25 : u -= 10), o && (u += 15);
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
}, _i = {
	exactNames: /* @__PURE__ */ new Set([
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
	exactSingleNames: /* @__PURE__ */ new Set(["video"]),
	looksLikeFn: Zr,
	comboChecker: $r,
	scoreKey: "__mjrVideoPickScore"
}, vi = {
	exactNames: /* @__PURE__ */ new Set([
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
	exactSingleNames: /* @__PURE__ */ new Set(["image", "face"]),
	looksLikeFn: ei,
	comboChecker: ti,
	scoreKey: "__mjrImagePickScore"
}, yi = {
	exactNames: /* @__PURE__ */ new Set([
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
	exactSingleNames: /* @__PURE__ */ new Set(["audio", "voice"]),
	looksLikeFn: ni,
	comboChecker: ri,
	scoreKey: "__mjrAudioPickScore"
}, bi = {
	exactNames: /* @__PURE__ */ new Set([
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
	exactSingleNames: /* @__PURE__ */ new Set([
		"model",
		"mesh",
		"geometry"
	]),
	looksLikeFn: ii,
	comboChecker: ai,
	scoreKey: "__mjrModel3DPickScore"
}, xi = (e, t, n) => {
	let r = String(t?.kind || "").toLowerCase();
	return gi(e, n, r === "model3d" ? bi : r === "audio" ? yi : r === "image" ? vi : _i);
}, Si = (e, t, n, r) => {
	if (!t || !t.inputs || !t.inputs.length) return null;
	let i = e?.canvas?.canvas || document.querySelector("canvas"), a = e?.canvas?.ds;
	if (!i || !a) return null;
	let o = i.getBoundingClientRect(), s = Number(a.scale) || 1, c = a.offset || [0, 0], l = Array.isArray(c) ? Number(c[0]) || 0 : Number(c?.x) || 0, u = Array.isArray(c) ? Number(c[1]) || 0 : Number(c?.y) || 0, d = (n - o.left) / s - l, f = (r - o.top) / s - u, p = t.pos[0], m = t.pos[1], h = t.constructor.title_height || 30;
	for (let e = 0; e < t.inputs.length; e++) {
		let n = t.inputs[e], r = m + h + e * 20 + 10, i = d - p, a = f - r;
		if (Math.abs(i) <= 18 && Math.abs(a) <= 12) return {
			index: e,
			input: n
		};
	}
	return null;
}, Ci = (e) => {
	let t = e?.canvas?.canvas || document.querySelector("canvas");
	return t ? t.getBoundingClientRect() : null;
}, wi = (e, t) => {
	let n = Ci(e);
	if (!n) return !1;
	let r = t.clientX, i = t.clientY;
	return r >= n.left && r <= n.right && i >= n.top && i <= n.bottom;
}, Ti = (e) => {
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
}, Ei = (e) => {
	let t = String(e?.filename || ""), n = t.lastIndexOf(".");
	return n >= 0 ? t.slice(n).toLowerCase() : "";
}, Di = (e) => {
	let t = String(e?.kind || "").toLowerCase(), n = Ei(e);
	return t === "image" || Ir.has(n) ? ["LoadImage"] : t === "video" || Lr.has(n) ? [
		"LoadVideo",
		"VHS_LoadVideo",
		"VideoLoader"
	] : t === "audio" || Rr.has(n) ? [
		"LoadAudio",
		"VHS_LoadAudioUpload",
		"VHS_LoadAudio",
		"AudioLoader"
	] : t === "model3d" || zr.has(n) ? [
		"Load3D",
		"LoadModel",
		"LoadMesh",
		"LoadGLB",
		"LoadOBJ",
		"LoadSTL",
		"LoadPLY"
	] : [];
}, Oi = (e, t) => {
	if (e) {
		e.type === "combo" && di(e, t), e.value = t;
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
}, ki = (e) => {
	let t = e?.canvas?.canvas || document.querySelector("canvas"), n = t?.getBoundingClientRect?.(), r = n ? Number(n.width || n.right - n.left) : 0, i = n ? Number(n.height || n.bottom - n.top) : 0, a = Number(r || t?.width || 800), o = Number(i || t?.height || 600);
	if (!n) return [Math.max(0, a / 2), Math.max(0, o / 2)];
	let s = n && Number(n.left) || 0, c = n && Number(n.top) || 0;
	return Ai(e, s + Math.max(0, a / 2), c + Math.max(0, o / 2));
}, Ai = (e, t, n) => {
	let r = (e?.canvas?.canvas || document.querySelector("canvas"))?.getBoundingClientRect?.(), i = e?.canvas?.ds || {}, a = Number(i.scale) || 1, o = i.offset || [0, 0], s = Array.isArray(o) ? Number(o[0]) || 0 : Number(o?.x) || 0, c = Array.isArray(o) ? Number(o[1]) || 0 : Number(o?.y) || 0;
	return !r || !Number.isFinite(Number(t)) || !Number.isFinite(Number(n)) ? ki(e) : [(Number(t) - r.left) / a - s, (Number(n) - r.top) / a - c];
}, ji = (e, t = null) => {
	if (Number.isFinite(Number(t?.clientX)) && Number.isFinite(Number(t?.clientY))) return Ai(e, t.clientX, t.clientY);
	try {
		let n = e?.canvas?.convertEventToCanvasOffset?.(t);
		if (Array.isArray(n)) return [Number(n[0]) || 0, Number(n[1]) || 0];
	} catch (e) {
		console.debug?.(e);
	}
	return Ai(e, t?.clientX, t?.clientY);
}, Mi = ({ app: e, payload: t, relativePath: n, event: r = null, droppedExt: i = "", position: a = null }) => {
	let o = e?.graph ?? e?.canvas?.graph ?? null;
	if (!o || typeof o.add != "function") return !1;
	let s = null;
	for (let n of Di(t)) try {
		if (s = Be(n, e), s) break;
	} catch (e) {
		console.debug?.(e);
	}
	if (!s) return !1;
	s.pos = Array.isArray(a) ? [Number(a[0]) || 0, Number(a[1]) || 0] : ji(e, r), o.add(s);
	let c = xi(s, t, i);
	return c && Oi(c, n), Ti(e), !0;
}, Ni = ({ app: e, items: t = [], event: n = null, gap: r = 90 }) => {
	let i = Array.isArray(t) ? t.filter(Boolean) : [];
	if (!i.length) return 0;
	let a = ji(e, n), o = 0;
	for (let t of i) Mi({
		app: e,
		payload: t.payload,
		relativePath: t.relativePath,
		event: n,
		droppedExt: t.droppedExt,
		position: [a[0] + o * Number(r || 90), a[1]]
	}) && (o += 1);
	return o;
}, Pi = Oi, Fi = ({ app: e, payload: t, relativePath: n, targetNode: r, inputSlotIndex: i, event: a = null }) => {
	let o = e?.graph ?? e?.canvas?.graph ?? null;
	if (!o || typeof o.add != "function" || !r) return !1;
	let s = null;
	for (let n of Di(t)) try {
		if (s = Be(n, e), s) break;
	} catch (e) {
		console.debug?.(e);
	}
	if (!s) return !1;
	let c = Number(r.pos[0]) || 0, l = Number(r.pos[1]) || 0, u = Array.isArray(s.size) && Number(s.size[0]) || 220;
	s.pos = [c - u - 60, l + Number(i) * 20], o.add(s);
	let d = Ei(t), f = xi(s, t, d);
	f && Oi(f, n);
	try {
		s.connect(0, r, i);
	} catch (e) {
		console.debug?.(e);
	}
	return Ti(e), !0;
}, Ii = async ({ post: e, endpoint: t, payload: n, index: r = !0, purpose: i = null }) => {
	let a = {
		index: !!r,
		files: [{
			filename: n.filename,
			subfolder: n.subfolder || "",
			dest_subfolder: "",
			type: n.type || "output",
			root_id: Ee(n) || void 0
		}]
	};
	return i && (a.purpose = i), e(t, a);
}, Li = async ({ post: e, endpoint: t, payload: n, index: r = !0, purpose: i = null }) => {
	let a = await Ii({
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
}, Ri = async ({ post: e, endpoint: t, payload: n, index: r = !0, purpose: i = null }) => (await Li({
	post: e,
	endpoint: t,
	payload: n,
	index: r,
	purpose: i
}))?.relativePath || null, zi = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, Bi = /^[0-9a-f]{20,}$/i;
function Vi(...e) {
	for (let t of e) {
		let e = String(t || "").trim();
		if (e) return e;
	}
	return "";
}
function Hi(e) {
	let t = String(e || "").trim();
	return !!t && (zi.test(t) || Bi.test(t));
}
function Ui(e) {
	return String(e?.type || e?.class_type || e?.comfyClass || e?.classType || "").trim();
}
function Wi(e) {
	return Vi(e?.properties?.subgraph_name, e?.title, e?.properties?.title, e?.properties?.name, e?.properties?.label, e?.name, e?.subgraph?.name, e?.subgraph_instance?.name);
}
function Gi(e) {
	let t = Ui(e), n = Wi(e);
	return n && (!t || Hi(t) || n !== t) ? n : t && !Hi(t) ? t : n || (t ? "Subgraph" : String(e?.id || "Node").trim() || "Node");
}
function Ki(e) {
	let t = Ui(e);
	return t && !Hi(t) ? t : t ? "Subgraph" : "Node";
}
//#endregion
//#region ui/components/sidebar/utils/minimap.ts
var qi = 6, Ji = 1, Yi = 64, Xi = 74, Zi = 42, Qi = [
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
], $i = (e, t, n) => {
	let r = Number(e);
	return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
}, ea = (e, t = !1) => {
	let n = String(e || "").toUpperCase();
	return n.includes("IMAGE") ? "rgba(145,198,99,0.9)" : n.includes("LATENT") ? "rgba(89,178,118,0.9)" : n.includes("MODEL") ? "rgba(112,155,255,0.9)" : n.includes("CONDITIONING") ? "rgba(191,123,226,0.9)" : n.includes("CLIP") ? "rgba(220,178,77,0.9)" : n.includes("VAE") ? "rgba(72,184,214,0.9)" : n.includes("MASK") ? "rgba(190,190,190,0.88)" : n.includes("STRING") || n.includes("TEXT") ? "rgba(230,230,230,0.86)" : n.includes("INT") || n.includes("FLOAT") || n.includes("NUMBER") ? "rgba(130,210,220,0.88)" : t ? "rgba(170,220,255,0.82)" : "rgba(255,255,255,0.72)";
}, ta = (e, t, n) => {
	let r = String(t || "").replace(/\s+/g, " ").trim(), i = Math.max(1, Number(n) || 1);
	if (!r || e.measureText(r).width <= i) return r;
	let a = r;
	for (; a.length > 3 && e.measureText(`${a}...`).width > i;) a = a.slice(0, -1);
	return a.length > 3 ? `${a}...` : r.slice(0, 3);
};
function na(e, t, n = null) {
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
	}, a = i.expandSubgraphs === !1 ? t : ra(t), o = Array.isArray(a?.nodes) ? a.nodes : [], s = Array.isArray(a?.groups) && a.groups || Array.isArray(a?.extra?.groups) && a.extra.groups || Array.isArray(a?.extra?.groupNodes) && a.extra.groupNodes || Array.isArray(a?.extra?.group_nodes) && a.extra.group_nodes || [], c = Array.isArray(a?.links) && a.links || Array.isArray(a?.extra?.links) && a.extra.links || [], l = Math.max(1, e.clientWidth || e.width || 1), u = Math.max(1, e.clientHeight || e.height || 1);
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
		for (let [e, t] of Qi) if (n.includes(e)) return t;
		let r = 0;
		for (let e = 0; e < n.length; e += 1) r = r * 31 + n.charCodeAt(e) | 0;
		return `hsl(${Math.abs(r) % 360} 42% 42%)`;
	}, p = (e) => {
		let t = [], n = e?.inputs && typeof e.inputs == "object" && !Array.isArray(e.inputs) ? e.inputs : null;
		if (n) {
			for (let [e, r] of Object.entries(n)) if (!(Array.isArray(r) || r && typeof r == "object") && (t.push([e, r]), t.length >= 3)) return t;
		}
		let r = Array.isArray(e?.widgets_values) ? e.widgets_values : [], i = Array.isArray(e?.widgets) ? e.widgets : [], a = Array.isArray(e?.inputs) ? e.inputs : [], o = a.filter((e) => e?.widget === !0 || e?.widget && typeof e.widget == "object" || typeof e?.widget == "string" && e.widget.trim()), s = a.filter((e) => e?.link == null && da(e?.type)), c = (o.length ? o : s.length ? s : a).map((e) => String(e?.label || e?.localized_name || e?.name || e?.widget?.name || e?.widget?.label || "").trim());
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
			label: Gi(e).replace(/\s+/g, " ").trim()
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
	let S = Math.max(1, b - v), C = Math.max(1, x - y), ee = v + S / 2, te = y + C / 2, w = i.view && typeof i.view == "object" ? i.view : Object.create(null), T = $i(w.zoom ?? 1, Ji, Yi), ne = Math.max(1, S / T), re = Math.max(1, C / T), ie = ne / 2, E = re / 2, ae = ne >= S ? ee : $i(w.centerX ?? ee, v + ie, b - ie), oe = re >= C ? te : $i(w.centerY ?? te, y + E, x - E), se = ae - ie, ce = oe - E, le = qi, ue = Math.min((l - 12) / ne, (u - 12) / re), de = w.hoveredNodeId !== null && w.hoveredNodeId !== void 0 ? String(w.hoveredNodeId) : null;
	r.clearRect(0, 0, l, u), r.fillStyle = "rgba(0,0,0,0.22)", r.fillRect(0, 0, l, u);
	let D = (e, t) => ({
		x: le + (e - se) * ue,
		y: le + (t - ce) * ue
	}), fe = (e, t) => ({
		x: $i(se + (Number(e) - le) / ue, v, b),
		y: $i(ce + (Number(t) - le) / ue, y, x)
	}), pe = (e) => ({
		x: le + (e.x - se) * ue,
		y: le + (e.y - ce) * ue,
		w: Math.max(1, e.w * ue),
		h: Math.max(1, e.h * ue)
	}), me = (e) => Math.max(10, Math.min(24, Math.floor(Number(e) * .2))), he = (e, t, n) => {
		let r = pe(e), i = me(r.h), a = n === "output" ? e.outputs : e.inputs, o = Math.max(1, Array.isArray(a) ? a.length : Number(e[`${n}Count`]) || 0), s = $i(t, 0, Math.max(0, o - 1));
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
		let { x: t, y: n, w: a, h: o } = pe(e), s = e.kind === "node", c = e.kind === "group", l = !!e.bypassed, u = !!e.errored, f = c ? .18 : l && i.renderBypassState ? .14 : .62, p = c ? .55 : l && i.renderBypassState ? .32 : .8, m = d(e.fill, f), h = d(e.stroke, p), g = s && i.showNodeLabels && a >= Xi && o >= Zi, _ = Math.max(2, Math.min(g ? 7 : 8, Math.floor(Math.min(a, o) * .08))), v = s ? me(o) : 0;
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
				r.fillStyle = ea(e.inputs?.[i]?.type, !1), r.beginPath(), r.arc(t, n, g ? 3 : 2.2, 0, Math.PI * 2), r.fill(), r.stroke();
			}
			for (let n = 0; n < i; n += 1) {
				let i = he(e, n, "output");
				r.fillStyle = ea(e.outputs?.[n]?.type, !0), r.beginPath(), r.arc(t + a, i, g ? 3 : 2.2, 0, Math.PI * 2), r.fill(), r.stroke();
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
		if (s && de && String(e.id || "") === de) {
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
				s && r.fillText(ta(r, s, i), t + 7, he(e, a, "input") + n * .35, i);
			}
			for (let o = 0; o < Math.min(8, e.outputs?.length || 0); o += 1) {
				let s = e.outputs[o], c = String(s?.label || s?.localized_name || s?.name || "").trim();
				if (!c) continue;
				let l = ta(r, c, i);
				r.fillText(l, t + a - 7 - Math.min(i, r.measureText(l).width), he(e, o, "output") + n * .35, i);
			}
			r.restore();
		}
	};
	for (let e of m.filter((e) => e.kind === "group")) ye(e);
	ve();
	for (let e of m.filter((e) => e.kind === "node")) ye(e);
	if (i.showViewport) try {
		let e = ke();
		if (e) {
			let t = D(e.x0, e.y0), n = D(e.x1, e.y1), i = Math.min(t.x, n.x), a = Math.min(t.y, n.y), o = Math.abs(n.x - t.x), s = Math.abs(n.y - t.y);
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
			centerX: ae,
			centerY: oe,
			visibleW: ne,
			visibleH: re,
			viewMinX: se,
			viewMinY: ce,
			pad: le,
			renderScale: ue
		},
		canvasToWorld: fe,
		worldToCanvas: D,
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
function ra(e, t = null) {
	if (!e || typeof e != "object") return e;
	let n = Array.isArray(e.nodes) ? e.nodes.filter(Boolean) : [], r = ia(e, t);
	if (!n.length) return e;
	let i = [], a = Array.isArray(e.links) ? [...e.links] : [], o = [...Array.isArray(e.groups) ? e.groups : [], ...Array.isArray(e.extra?.groups) ? e.extra.groups : []];
	for (let e of n) {
		i.push(e);
		let t = aa(e, r);
		if (!t || !Array.isArray(t.nodes) || !t.nodes.length) continue;
		let n = sa(e, ra(t, r));
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
function ia(e, t = null) {
	let n = [
		...Array.isArray(e?.definitions?.subgraphs) ? e.definitions.subgraphs : [],
		...Array.isArray(e?.subgraphs) ? e.subgraphs : [],
		...Array.isArray(e?.rootGraph?.subgraphs) ? e.rootGraph.subgraphs : []
	], r = new Map(t || []);
	for (let e of n) for (let t of oa(e)) t != null && r.set(String(t), e);
	return r;
}
function aa(e, t) {
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
function oa(e) {
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
function sa(e, t) {
	let n = String(e?.id ?? e?.ID ?? ""), r = la(e?.pos) || [0, 0], i = ua(e?.size) || [260, 180], a = t.nodes.filter(Boolean), o = ca(a), s = Math.min(22, Math.max(8, i[0] * .08)), c = Math.min(34, Math.max(18, i[1] * .18)), l = Math.min(18, Math.max(8, i[1] * .08)), u = Math.max(40, i[0] - s * 2), d = Math.max(34, i[1] - c - l), f = Math.min(1, u / o.width, d / o.height), p = r[0] + s + (u - o.width * f) / 2, m = r[1] + c + (d - o.height * f) / 2, h = a.map((r) => {
		let i = la(r?.pos) || [o.minX, o.minY], a = ua(r?.size) || [140, 60];
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
function ca(e) {
	let t = Infinity, n = Infinity, r = -Infinity, i = -Infinity;
	for (let a of e) {
		let e = la(a?.pos);
		if (!e) continue;
		let o = ua(a?.size) || [140, 60];
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
function la(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.x ?? e.left ?? null, n = e[1] ?? e[1] ?? e.y ?? e.top ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function ua(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.w ?? e.width ?? null, n = e[1] ?? e[1] ?? e.h ?? e.height ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function da(e) {
	if (Array.isArray(e)) return !0;
	let t = String(e || "").trim().toUpperCase();
	return t === "INT" || t === "FLOAT" || t === "STRING" || t === "BOOLEAN" || t === "BOOL" || t === "COMBO" || t === "ENUM";
}
function fa(e, t = null) {
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
var X = vt({
	open: !1,
	mode: "workflow",
	title: "",
	sourceAsset: null,
	workflow: null,
	items: [],
	resolve: null
});
function pa({ title: e = "Select workflow", sourceAsset: t = null } = {}) {
	return ha(null), X.open = !0, X.mode = "workflow", X.title = String(e || "Select workflow"), X.sourceAsset = t || null, X.workflow = null, X.items = [], new Promise((e) => {
		X.resolve = e;
	});
}
function ma({ title: e = "Select asset", workflow: t = null, items: n = [] } = {}) {
	return ha(null), X.open = !0, X.mode = "asset", X.title = String(e || "Select asset"), X.sourceAsset = null, X.workflow = t || null, X.items = Array.isArray(n) ? n.filter(Boolean) : [], new Promise((e) => {
		X.resolve = e;
	});
}
function ha(e = null) {
	let t = X.resolve;
	if (X.open = !1, X.mode = "workflow", X.title = "", X.sourceAsset = null, X.workflow = null, X.items = [], X.resolve = null, typeof t == "function") try {
		t(e || null);
	} catch (e) {
		console.debug?.(e);
	}
}
//#endregion
//#region ui/vue/majoorPrimeVue.ts
var ga = {
	Button: ut,
	Checkbox: lt,
	InputText: wt,
	Textarea: ht,
	Select: St,
	ToggleButton: yt,
	Badge: bt,
	Tag: ot,
	Dialog: pt,
	Menu: xt,
	Listbox: _t,
	Tree: Ct,
	VirtualScroller: ct
};
function _a(e) {
	return e.use(dt, {
		ripple: !1,
		unstyled: !0,
		zIndex: { overlay: 10100 }
	}), e.use(ft), e.use(gt), Object.entries(ga).forEach(([t, n]) => {
		e.component(`M${t}`, n);
	}), e;
}
//#endregion
//#region ui/vue/createVueApp.ts
function va(e, t = void 0) {
	let n = Ot(), r = at(e, t);
	return r.use(n), _a(r), {
		app: r,
		pinia: n
	};
}
var ya = /* @__PURE__ */ new Map();
function ba(e, t, n) {
	try {
		window.dispatchEvent(new CustomEvent("mjr:keepalive-attached", { detail: {
			mountKey: String(e || "_mjrVueApp"),
			host: t || null,
			container: n || null
		} }));
	} catch {}
}
function xa(e) {
	let t = document.createElement("div");
	return t.dataset.mjrKeepAliveHost = String(e || "_mjrVueApp"), t.style.height = "100%", t.style.width = "100%", t.style.minHeight = "0", t.style.display = "flex", t.style.flexDirection = "column", t.style.overflow = "hidden", t;
}
function Sa(e, t) {
	!e || !t || (e.style.height = "100%", e.style.minHeight = "0", e.style.display = "flex", e.style.flexDirection = "column", e.style.overflow = "hidden", (e.firstChild !== t || e.childNodes.length !== 1) && (e.replaceChildren(t), ba(t?.dataset?.mjrKeepAliveHost, t, e)));
}
function Ca(e, t, n = "_mjrVueApp", { attachIfExists: r = !0 } = {}) {
	if (!e) return !1;
	let i = ya.get(n), a = !1;
	if (!i) {
		let e = xa(n), { app: r } = va(t);
		r.mount(e), i = {
			app: r,
			host: e,
			container: null
		}, ya.set(n, i), a = !0;
	}
	return (a || r) && (Sa(e, i.host), i.container = e), a;
}
function wa(e = "_mjrVueApp") {
	return ya.has(e);
}
function Ta(e, t = "_mjrVueApp") {
	let n = ya.get(t);
	if (n?.app) {
		try {
			n.app.unmount();
		} catch {}
		try {
			n.host?.remove?.();
		} catch {}
		ya.delete(t);
	}
}
//#endregion
//#region ui/utils/format.ts
function Ea(e) {
	if (!e) return null;
	let t = Number(e);
	if (!isNaN(t)) return /* @__PURE__ */ new Date(t * 1e3);
	let n = new Date(e);
	return isNaN(n.getTime()) ? null : n;
}
function Da(e) {
	let t = Ea(e);
	return t ? `${t.getDate().toString().padStart(2, "0")}/${(t.getMonth() + 1).toString().padStart(2, "0")}` : "";
}
function Oa(e) {
	let t = Ea(e);
	return t ? `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}` : "";
}
function ka(e) {
	return e ? e < 60 ? `${Math.round(e)}s` : `${Math.floor(e / 60)}m ${Math.round(e % 60)}s` : "";
}
var Aa = {
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
function ja() {
	let e = {};
	for (let t of Aa.sections) {
		e[t.key] = t.searchField, e[t.searchField] = t.searchField;
		for (let n of t.aliases || []) e[String(n).toLowerCase()] = t.searchField;
	}
	return e;
}
function Ma(e) {
	let t = String(e || "").trim().toLowerCase();
	return ja()[t] || "";
}
function Na(e) {
	let t = String(e || "").trim().toLowerCase();
	return t && Aa.sections.find((e) => e.key === t) || null;
}
//#endregion
//#region ui/vue/components/panel/sidebar/SidebarFileInfoSection.vue?vue&type=script&setup=true&lang.ts
var Pa = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "rgba(255, 255, 255, 0.03)",
		border: "1px solid var(--mjr-border, rgba(255, 255, 255, 0.12))",
		"border-radius": "8px",
		padding: "10px"
	}
}, Fa = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "6px"
} }, Ia = ["title"], La = ["title"], Ra = /* @__PURE__ */ tt({
	__name: "SidebarFileInfoSection",
	props: { asset: {} },
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
		function a(e) {
			if (e == null) return !1;
			let t = String(e).trim();
			return t !== "" && t.toUpperCase() !== "N/A";
		}
		function o(e, t) {
			let n = i(e.bits_per_raw_sample, e.bits_per_sample, t.bits_per_channel, t.bitsperchannel, t.bit_depth), r = String(i(e.pix_fmt, t.pixel_format, t.pix_fmt) || ""), a = Number(r.match(/(?:p|gray|gbrp)(\d+)(?:le|be)?$/i)?.[1]), o = Number(n) || (a >= 8 ? a : 0), s = String(i(e.sample_fmt, t.sample_format) || "").toLowerCase(), c = s.includes("flt") || s.includes("dbl") || /(?:16|32)f\b/i.test(r);
			return o > 0 ? `${o}-bit ${c ? "float" : "fixed"}` : r ? `8-bit ${c ? "float" : "fixed"}` : c ? "float" : "N/A";
		}
		function s(e, t) {
			let n = e?.[t] ?? e?.file_info?.[t];
			return n != null && n !== "" ? n : t === "workflow_id" ? e?.user_metadata?.workflow?.id ?? e?.metadata?.workflow_id ?? "" : "";
		}
		let c = P(() => {
			let e = t.asset || {}, c = r(e), l = c?.raw_ffprobe && typeof c.raw_ffprobe == "object" ? c.raw_ffprobe : {}, u = l?.video_stream && typeof l.video_stream == "object" ? l.video_stream : {}, d = l?.format && typeof l.format == "object" ? l.format : {}, f = [];
			e.width && e.height && f.push({
				label: "Dimensions",
				value: `${e.width} x ${e.height}`,
				tooltip: "Image/video resolution in pixels"
			}), e.duration && e.duration > 0 && f.push({
				label: "Duration",
				value: ka(e.duration),
				tooltip: "Video duration"
			});
			let p = Je(e);
			p != null && f.push({
				label: "FPS",
				value: Ke(p),
				tooltip: "Native frame rate"
			});
			let m = qe(e, p);
			f.push({
				label: "Frames",
				value: m == null ? "N/A" : String(Math.max(0, Math.floor(m))),
				tooltip: "Total frame count"
			}), f.push({
				label: "Bits / Channel",
				value: o(u, c),
				tooltip: "Channel precision and numeric representation"
			}), f.push({
				label: "Pixel Aspect",
				value: String(i(u.sample_aspect_ratio, c.pixel_aspect_ratio) || "N/A"),
				tooltip: "Pixel sample aspect ratio"
			}), f.push({
				label: "Codec ID",
				value: String(i(u.codec_tag_string, u.codec_tag, c.codec_id) || "N/A"),
				tooltip: "Container codec identifier"
			}), f.push({
				label: "Codec Name",
				value: String(i(u.codec_long_name, u.codec_name, c.codec_name) || "N/A"),
				tooltip: "Video codec name"
			}), f.push({
				label: "Encoder",
				value: String(i(u.tags?.encoder, d.tags?.encoder, c.encoder) || "N/A"),
				tooltip: "Encoder recorded in file metadata"
			}), f.push({
				label: "Pixel Format",
				value: String(i(u.pix_fmt, c.pixel_format, c.pix_fmt) || "N/A"),
				tooltip: "Stored pixel format"
			}), f.push({
				label: "Color Space",
				value: String(i(u.color_space, c.color_space, c.colorspace) || "N/A"),
				tooltip: "Encoded color space"
			});
			let h = He(e.generation_time_ms ?? e.metadata?.generation_time_ms ?? 0);
			h > 0 && f.push({
				label: "Generation Time",
				value: `${(Number(h) / 1e3).toFixed(1)}s`,
				tooltip: "Time taken to generate this asset (workflow execution time)",
				valueStyle: `color: ${We(h)}; font-weight: 600;`
			});
			let g = e.generation_time || e.file_creation_time || e.mtime || e.created_at;
			if (g) {
				let e = Da(g), t = Oa(g);
				e && f.push({
					label: "Date",
					value: e,
					tooltip: "File creation/generation date"
				}), t && f.push({
					label: "Time",
					value: t,
					tooltip: "File creation/generation time"
				});
			}
			f.push({
				label: "File Size",
				value: n(i(e.size_bytes, e.size, e.file_info?.size_bytes, e.file_info?.size)),
				tooltip: "File size on disk"
			}), e.id != null && f.push({
				label: "Asset ID",
				value: String(e.id),
				tooltip: "Internal database asset identifier"
			});
			let _ = String(s(e, "job_id") || "").trim();
			_ && f.push({
				label: "Job ID",
				value: _,
				tooltip: "Workflow execution job identifier (prompt_id)"
			});
			let v = String(s(e, "source_node_id") || "").trim();
			v && f.push({
				label: "Source Node",
				value: v,
				tooltip: "ComfyUI node id that produced this file"
			});
			let y = String(s(e, "source_node_type") || "").trim();
			y && f.push({
				label: "Node Type",
				value: y,
				tooltip: "ComfyUI node class that produced this file"
			});
			let b = String(s(e, "workflow_id") || "").trim();
			return b && f.push({
				label: "Workflow ID",
				value: b,
				tooltip: "ComfyUI workflow identifier (from workflow.id in extra_data)"
			}), f.filter((e) => a(e.value));
		});
		return (e, t) => c.value.length ? (I(), z("div", Pa, [t[0] ||= M("div", { style: {
			"font-size": "12px",
			"font-weight": "700",
			color: "#607d8b",
			"margin-bottom": "8px",
			"text-transform": "uppercase",
			"letter-spacing": "0.4px"
		} }, " File Info ", -1), M("div", Fa, [(I(!0), z(j, null, F(c.value, (e) => (I(), z("div", {
			key: e.label,
			style: {
				display: "flex",
				gap: "10px",
				"align-items": "flex-start",
				"justify-content": "space-between"
			}
		}, [M("div", {
			title: e.tooltip || "",
			style: {
				"font-size": "12px",
				opacity: "0.68",
				"min-width": "92px"
			}
		}, R(e.label), 9, Ia), M("div", {
			style: L(e.valueStyle || "font-size: 12px; text-align: right; word-break: break-word"),
			title: String(e.value || "")
		}, R(e.value), 13, La)]))), 128))])])) : N("", !0);
	}
}), za = /* @__PURE__ */ new Set([
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
function Ba(e) {
	let t = String(e?.filename || e?.name || e?.filepath || e?.path || "").trim().toLowerCase();
	return !t || !t.includes(".") ? "" : t.split(".").pop() || "";
}
function Va(e) {
	return String(e?.kind || "").trim().toLowerCase() === "image" || String(e?.mime || e?.mimetype || "").trim().toLowerCase().startsWith("image/") ? !0 : za.has(Ba(e));
}
function Ha(e) {
	let t = Ba(e);
	return t === "jpg" || t === "jpeg";
}
function Ua() {
	try {
		return !!(Gt()?.ai?.vectorSearchEnabled ?? !0);
	} catch {
		return !0;
	}
}
function Wa(e) {
	return e >= .75 ? "#4CAF50" : e >= .5 ? "#8BC34A" : e >= .3 ? "#FF9800" : "#F44336";
}
function Ga(e) {
	return e >= .85 ? "Excellent" : e >= .7 ? "Good" : e >= .5 ? "Fair" : e >= .3 ? "Low" : "Very Low";
}
function Ka(e) {
	let t = String(e || "").trim();
	if (!t) return "";
	let n = [];
	for (let e of t.replace(/\r\n/g, "\n").split("\n")) {
		let t = String(e || "").trim();
		t && (/^title\s*:/i.test(t) || (/^caption\s*:/i.test(t) && (t = t.replace(/^caption\s*:/i, "").trim()), t && n.push(t)));
	}
	return (n.length ? n.join(" ") : t).replace(/\s+/g, " ").replace(/:{2,}\s*$/, "").trim();
}
function qa(e) {
	let t = String(e?.filename || "").trim();
	if (!t) return [];
	let n = String(e?.subfolder || "").trim(), r = String(e?.folder_type || "input").trim().toLowerCase(), i = [], a = (e) => {
		if (!e) return;
		let r = Le(t, n, e);
		r && !i.includes(r) && i.push(r);
	};
	return (r === "input" || r === "output") && a(r), a("input"), a("output"), i;
}
function Ja(e) {
	let t = String(e?.filepath || "").trim(), n = String(e?.filename || "").trim();
	return !t || t === n ? "" : t;
}
function Ya(e) {
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
function Xa(e, t) {
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
function Za(e) {
	let t = [];
	return e?.metadata_raw && t.push(e.metadata_raw), e?.workflow && t.push(e.workflow), e?.metadata_raw?.workflow && t.push(e.metadata_raw.workflow), e?.metadata_raw?.raw_ffprobe?.format?.tags && t.push(e.metadata_raw.raw_ffprobe.format.tags), e?.metadata_raw?.ffprobe?.format?.tags && t.push(e.metadata_raw.ffprobe.format.tags), e?.geninfo && typeof e.geninfo == "object" && t.push({ geninfo: e.geninfo }), e?.metadata && (typeof e.metadata == "object" || typeof e.metadata == "string") && t.push(e.metadata), e?.prompt && (typeof e.prompt == "object" || typeof e.prompt == "string") && t.push(e.prompt), e?.exif && t.push(e.exif), e && typeof e == "object" && t.push(e), t;
}
function Qa(e, t) {
	for (let [n, r] of Object.entries(t)) r != null && r !== "" && (e[n] === void 0 || e[n] === null || e[n] === "") && (e[n] = r);
}
function $a(e) {
	let t = Za(e), n = {};
	for (let e of t) {
		let t = jt(e);
		!t || typeof t != "object" || Qa(n, t);
	}
	return Object.keys(n).length ? n : null;
}
function eo(e) {
	try {
		if (!e || typeof e != "object") return !1;
		if (e.is_override || typeof e.workflow_notes == "string" && e.workflow_notes.trim() || typeof e.notes == "string" && e.notes.trim() || Array.isArray(e.custom_info) && e.custom_info.length > 0 || e.engine && typeof e.engine == "object" && e.engine.type || Nt(e.prompt) || typeof (e.negative_prompt || e.negativePrompt) == "string" && Nt(e.negative_prompt || e.negativePrompt) || e.models || e.model || e.checkpoint || e.loras || e.ltx_director && typeof e.ltx_director == "object" || e.ideogram && typeof e.ideogram == "object" || e.sampler || e.sampler_name || e.steps || e.cfg || e.cfg_scale || e.cfg_high_noise || e.cfg_low_noise || e.scheduler || Array.isArray(e.chained_passes) && e.chained_passes.length > 0 || Array.isArray(e.all_samplers) && e.all_samplers.length > 0 || e.seed || e.denoise || e.denoising || e.clip_skip || e.voice || e.language || e.temperature || e.top_k || e.top_p || e.repetition_penalty || e.max_new_tokens || e.device || e.voice_preset || e.instruct || e.dtype || e.attn_implementation || e.enable_chunking !== void 0 || e.max_chars_per_chunk || e.chunk_combination_method || e.silence_between_chunks_ms || e.enable_audio_cache !== void 0 || e.batch_size !== void 0 || e.use_torch_compile !== void 0 || e.use_cuda_graphs !== void 0 || e.compile_mode || typeof e.lyrics == "string" && e.lyrics.trim()) return !0;
	} catch {
		return !1;
	}
	return !1;
}
function Q(e) {
	return e ? typeof e == "string" ? Pt(e) : typeof e == "object" ? Pt(e.name || e.value || "") : "" : "";
}
function to(e, t, n, r) {
	let i = String(r || "").trim();
	if (!i) return;
	let a = `${n}::${i}`;
	t.has(a) || (t.add(a), e.push({
		label: n,
		value: i
	}));
}
function no(e) {
	let t = `${String(e?.source || "").toLowerCase()} ${String(e?.name || e?.lora_name || "").toLowerCase()}`;
	return t.includes("high_noise") || t.includes("high noise") ? "high_noise" : t.includes("low_noise") || t.includes("low noise") ? "low_noise" : "";
}
function ro(e) {
	let t = [], n = Array.isArray(e.model_groups) ? e.model_groups : [];
	if (n.length) return n.forEach((e) => {
		if (!e || typeof e != "object") return;
		let n = Q(e.model), r = Array.isArray(e.loras) ? e.loras.map((e) => Mt(e)).filter(Boolean) : [];
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
		let n = i.filter((t) => no(t) === e.key).map((e) => Mt(e)).filter(Boolean);
		!e.model && !n.length || t.push({
			...e,
			loras: n
		});
	}), t;
}
function io(e, t) {
	return t == null ? null : {
		label: e,
		value: t ? O("state.on", "on") : O("state.off", "off")
	};
}
function $(e) {
	return e != null && String(e).trim() !== "";
}
function ao(e) {
	let t = String(e || "").toLowerCase();
	return t.includes("high") ? "#52ffe8" : t.includes("low") ? "#42A5F5" : t.includes("refine") ? "#AB47BC" : t.includes("upscale") ? "#66BB6A" : t.includes("interpolation") || t.includes("video") ? "#dace26" : "#9C27B0";
}
function oo(e) {
	return String(e || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function so(e, t) {
	let n = String(t || e || "").trim(), r = String(e || n).toLowerCase(), i = r.match(/^pass_(\d+)$/);
	return i ? O("sidebar.generation.stagePassN", "Pass {n}", { n: Number(i[1]) }) : r.includes("high") ? "High" : r.includes("low") ? "Low" : r.includes("refine") ? "Refiner" : r.includes("upscale") ? "Upscale" : r.includes("text_to_image") || r.includes("image_to_image") || r === "base" ? "Base" : n || "Branch";
}
function co(e, t) {
	let n = new Set(t.map((e) => String(e).toLowerCase()));
	return e.find((e) => n.has(String(e.label || "").toLowerCase())) || null;
}
function lo(e, t) {
	return $(t) ? {
		label: e,
		value: t
	} : null;
}
function uo(e) {
	let t = String(e || "").toLowerCase();
	return t.includes("high_noise") || t.includes("high-noise") || t.includes("high noise") ? "high" : t.includes("low_noise") || t.includes("low-noise") || t.includes("low noise") ? "low" : "";
}
function fo(e) {
	return Array.isArray(e) || e && typeof e == "object" ? !1 : $(e) && String(e).trim() !== "-";
}
function po(e) {
	return typeof e == "number" ? Math.abs(e - Math.round(e)) < 1e-9 ? String(Math.round(e)) : e.toFixed(2).replace(/0+$/g, "").replace(/\.$/, "") : String(e ?? "").trim();
}
function mo(e) {
	if (!$(e)) return null;
	let t = Number(e);
	return !Number.isFinite(t) || t <= 0 ? null : e;
}
function ho(e, t) {
	let n = mo(e.seed);
	if (n !== null) return n;
	let r = [Array.isArray(e.chained_passes) ? e.chained_passes : [], Array.isArray(e.all_samplers) ? e.all_samplers : []];
	for (let e of r) for (let t of e) {
		let e = mo(t?.seed_val ?? t?.seed);
		if (e !== null) return e;
	}
	for (let e of t || []) {
		let t = mo(co(e.fields || [], ["Seed"])?.value);
		if (t !== null) return t;
	}
	return null;
}
function go(e, t) {
	if (!t || !fo(t.value)) return;
	let n = `${String(t.label || "").toLowerCase()}::${po(t.value)}`;
	e.some((e) => `${String(e.label || "").toLowerCase()}::${po(e.value)}` === n) || e.push({
		...t,
		value: po(t.value)
	});
}
function _o(e, t, n, r) {
	let i = /* @__PURE__ */ new Map(), a = (e, t) => {
		let n = oo(e || t || "branch") || "branch";
		n.includes("high") && (n = "high"), n.includes("low") && (n = "low");
		let r = i.get(n);
		if (r) return r;
		let a = {
			key: n,
			label: so(n, t),
			accent: ao(n),
			modelFields: [],
			samplingFields: [],
			loras: []
		};
		return i.set(n, a), a;
	}, o = (e, t, n) => {
		let r = String(n || "").trim();
		r && (e.modelFields.some((e) => String(e.label || "").toLowerCase() === String(t || "").toLowerCase() && Pt(e.value) === Pt(r)) || e.modelFields.push({
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
		let t = Q(c.unet), n = uo(t), r = Q(c.checkpoint || (n ? null : c.unet) || e.model || e.checkpoint), i = Q(c.unet_high_noise) || (n === "high" ? t : ""), l = Q(c.unet_low_noise) || (n === "low" ? t : ""), u = Q(c.clip), d = Q(c.vae), f = Array.isArray(e.loras) ? e.loras.map((e) => Mt(e)).filter(Boolean) : [], p = !!(i || l), m = !p && (r || u || d || f.length) ? a("base", "Base") : null, h = p && (u || d) ? a("shared", "Shared") : null, g = i ? a("high", "High") : null, _ = l ? a("low", "Low") : null;
		if (m) {
			r && o(m, e.model || e.checkpoint || c.checkpoint ? "Model" : "UNet", r), u && o(m, "CLIP", u), d && o(m, "VAE", d);
			for (let e of f) s(m, e);
		}
		h && (u && o(h, "CLIP", u), d && o(h, "VAE", d)), g && o(g, "UNet", i), _ && o(_, "UNet", l);
	}
	let l = i.get("high") || i.get("high_noise"), u = i.get("low") || i.get("low_noise"), d = [
		co(n, ["Sampler"]),
		co(n, ["Scheduler"]),
		co(n, ["Steps"]),
		co(n, ["Seed"])
	].filter(Boolean), f = lo("CFG", e.cfg_high_noise), p = lo("CFG", e.cfg_low_noise);
	l && [...d, ...f ? [f] : []].forEach((e) => go(l.samplingFields, e)), u && [...d, ...p ? [p] : []].forEach((e) => go(u.samplingFields, e));
	let m = (r || []).some((e) => oo(e.label).includes("upscale")), h = (r || []).length === 2 && (r || []).every((e) => ["base", "pass_2"].includes(oo(e.label)));
	for (let [e, t] of (r || []).entries()) {
		let n = oo(t.label);
		if (!n) continue;
		let i = (r || []).filter((e) => oo(e.label) === oo(t.label)).length, o = oo(t.stage), s = o ? (r || []).filter((e) => oo(e.stage) === o).length : 0, c = co(t.fields || [], ["Model"]), d = uo(c?.value);
		["high", "low"].includes(n) || (d ? n = d : s > 1 || i > 1 ? n = `pass_${e + 1}` : h ? n = e === 0 ? "high" : "low" : n === "base" && l && u ? n = "high" : ["text_to_image", "image_to_image"].includes(n) && (n = m ? "low" : "base")), n.includes("upscale") && m && (n = "high");
		let f = a(n, t.label);
		if (!/^pass_\d+$/i.test(n) && c && String(c.value || "") !== "-") {
			let e = Pt(c.value);
			f.modelFields.some((t) => Pt(t.value) === e) || f.modelFields.push(c);
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
		].includes(String(e.label || "")) && go(f.samplingFields, e);
	}
	return Array.from(i.values()).filter((e) => e.modelFields.length || e.samplingFields.length || e.loras.length);
}
function vo(e, t, n, r) {
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
		let t = oo(n.label), r = (n.fields || []).some((e) => {
			let t = String(e?.label || "").toLowerCase(), n = String(e?.value || "").toLowerCase();
			return t.includes("upscaler") || n.includes("upscale") || n.includes("upscaler") || /(?:^|[_\s-])to[_\s-]?\d{3,5}(?:[_\s.-]|$)/i.test(n);
		});
		t.includes("upscale") && (e.upscaler || r) && a("upscale", "Upscale", "#66BB6A", n.fields || []), (t.includes("interpolation") || t.includes("rife") || t.includes("film")) && a("interpolation", "Interpolation", "#26C6DA", n.fields || []);
	}
	a("audio", "MMAudio", "#26A69A", [
		lo("Voice", e.voice),
		lo("Language", e.language),
		lo("Temperature", e.temperature),
		lo("Lyrics Strength", e.lyrics_strength)
	].filter(Boolean)), a("interpolation", "Interpolation", "#26C6DA", [
		lo("Engine", e.interpolation_engine || e.frame_interpolation || e.interpolator),
		lo("Source FPS", e.source_fps || e.input_fps),
		lo("Final FPS", e.final_fps || e.output_fps || e.fps)
	].filter(Boolean));
	for (let e of n || []) i.push({
		key: oo(e.title) || `module_${i.length}`,
		title: e.title,
		accent: e.color || "#2196F3",
		fields: [{
			label: "Info",
			value: e.content
		}]
	});
	r && !i.some((e) => String(e.title).toLowerCase() === String(r).toLowerCase()) && a("workflow_engine", r, "#2196F3", [lo("Engine", r)].filter(Boolean));
	let o = /* @__PURE__ */ new Set();
	return i.filter((e) => {
		let t = `${e.key}:${e.title}:${JSON.stringify(e.fields)}`;
		return !o.has(t) && (o.add(t), !0);
	});
}
function yo(e) {
	return new Set(Array.isArray(e.override_fields) ? e.override_fields.map((e) => String(e || "").trim()).filter(Boolean) : []);
}
function bo(e, ...t) {
	return t.some((t) => e.has(t));
}
function xo(e) {
	return Array.isArray(e) ? e.filter((e) => e && typeof e == "object").map((e, t) => ({
		title: String(e.title || O("sidebar.generation.customInfoN", "Custom Info {n}", { n: t + 1 })).trim(),
		content: String(e.content ?? e.value ?? "").trim(),
		color: /^#[0-9a-fA-F]{6}$/.test(String(e.color || "").trim()) ? String(e.color).trim() : "#2196F3"
	})).filter((e) => e.content) : [];
}
function So(e) {
	if (!e || typeof e != "object") return null;
	let t = [], n = (e, n) => {
		$(n) && t.push({
			label: e,
			value: po(n)
		});
	};
	n("FPS", e.frame_rate), n("Frames", e.duration_frames), n("Duration", e.duration_seconds), ($(e.width) || $(e.height)) && t.push({
		label: "Size",
		value: `${e.width || "?"} x ${e.height || "?"}`
	});
	let r = Array.isArray(e.segments) ? e.segments.map((e, t) => {
		if (!e || typeof e != "object") return null;
		let n = Nt(e.prompt || e.text || ""), r = String(e.filename || e.imageFile || e.videoFile || e.audioFile || "").trim(), i = String(e.filepath || e.path || r).trim(), a = String(e.in || e.in_label || e.start || e.start_frame || "").trim(), o = String(e.out || e.out_label || e.end || e.end_frame || "").trim();
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
			previewCandidates: r ? qa({
				filename: r,
				filepath: i,
				folder_type: String(e.folder_type || e.folderType || "input").trim(),
				subfolder: String(e.subfolder || "").trim()
			}) : []
		};
	}).filter(Boolean) : [], i = Nt(e.global_prompt || e.globalPrompt || "");
	return !i && !r.length && !t.length ? null : {
		title: String(e.title || "LTX Director").trim(),
		globalPrompt: i,
		fields: t,
		segments: r
	};
}
function Co(e) {
	if (!e || typeof e != "object") return null;
	let t = e.payload && typeof e.payload == "object" ? e.payload : e, n = typeof e.json == "string" && e.json.trim() ? e.json.trim() : JSON.stringify(t, null, 2), r = Nt(e.high_level_description || e.highLevelDescription || t.high_level_description || ""), i = Nt(e.background || t.background || ""), a = [], o = (e, t) => {
		$(t) && a.push({
			label: e,
			value: po(t)
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
function wo(e) {
	let t = $a(e), n = {
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
		isImageAsset: Va(e),
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
	if (!t || typeof t == "object" && Object.keys(t).length === 0 || !eo(t)) {
		let t = e?.metadata_raw?.geninfo_status || e?.geninfo_status;
		return t && typeof t == "object" && t.kind === "media_pipeline" ? {
			...n,
			kind: "media-only",
			mediaOnlyMessage: O("sidebar.generation.mediaOnlyPipeline", "This file looks like a media-only pipeline (e.g. LoadVideo/VideoCombine) and does not contain generation parameters.")
		} : Va(e) || Ha(e) ? {
			...n,
			kind: "caption-only",
			showAlignment: !1
		} : n;
	}
	let r = t, i = So(r.ltx_director), a = Co(r.ideogram), o = yo(r), s = r.engine && typeof r.engine == "object" ? r.engine : null, c = !!(r.is_override || s?.mode === "override" || s?.parser_version === "geninfo-override-v1" || s?.source === "majoor_geninfo"), l = Ft(r), u = At(typeof r.prompt == "string" ? r.prompt : null, typeof (r.negative_prompt || r.negativePrompt) == "string" ? r.negative_prompt || r.negativePrompt : null), d = Array.isArray(r.all_positive_prompts) && r.all_positive_prompts.length > 1 ? r.all_positive_prompts.map((e, t) => {
		let n = At(typeof e == "string" ? e : "", typeof r.all_negative_prompts?.[t] == "string" ? r.all_negative_prompts[t] : "");
		return {
			label: O("sidebar.generation.promptN", "Prompt {n}", { n: t + 1 }),
			positive: Nt(n.positive),
			negative: Nt(n.negative)
		};
	}).filter((e) => e.positive) : [], f = [], p = /* @__PURE__ */ new Set(), m = r.models && typeof r.models == "object" ? r.models : null, h = ro(r), g = new Set(h.map((e) => String(e.model || "").trim()).filter(Boolean)), _ = Array.isArray(r.all_checkpoints) && r.all_checkpoints.length > 1 ? r.all_checkpoints : null;
	if (m) {
		let e = new Set([
			Q(m.unet_high_noise),
			Q(m.unet_low_noise),
			...g
		].filter(Boolean));
		if (_) _.forEach((e, t) => {
			let n = Q(e);
			to(f, p, O("sidebar.generation.checkpointN", "Checkpoint {n}", { n: t + 1 }), n);
		});
		else {
			let t = Q(m.checkpoint);
			t && !e.has(t) && to(f, p, O("sidebar.generation.checkpoint", "Checkpoint"), t);
		}
		[
			["UNet", Q(m.unet)],
			["Diffusion", Q(m.diffusion)],
			[O("sidebar.generation.upscaler", "Upscaler"), Q(m.upscaler)],
			["CLIP", Q(m.clip)],
			["VAE", Q(m.vae)]
		].forEach(([t, n]) => {
			e.has(n) || to(f, p, t, n);
		});
	} else (r.model || r.checkpoint) && to(f, p, O("sidebar.generation.model", "Model"), Pt(r.model || r.checkpoint));
	if (Array.isArray(r.loras) && r.loras.length > 0) {
		let e = r.loras.map((e) => Mt(e)).filter(Boolean).join("\n");
		e && to(f, p, r.loras.length > 1 ? O("sidebar.generation.loras", "LoRAs") : "LoRA", e);
	}
	!m && r.clip && to(f, p, "CLIP", Pt(r.clip)), !m && r.vae && to(f, p, "VAE", Pt(r.vae)), !m && r.unet && to(f, p, "UNet", Pt(r.unet)), !m && r.diffusion && to(f, p, "Diffusion", Pt(r.diffusion)), !m && r.upscaler && to(f, p, O("sidebar.generation.upscaler", "Upscaler"), Pt(r.upscaler)), m && r.clip && to(f, p, "CLIP", Pt(r.clip)), m && r.vae && to(f, p, "VAE", Pt(r.vae));
	for (let e of f) {
		let t = String(e.label || "").toLowerCase();
		(t.includes("checkpoint") || t === "model") && (e.override = bo(o, "checkpoint", "model")), t === "clip" && (e.override = bo(o, "clip")), t === "vae" && (e.override = bo(o, "vae")), t.includes("lora") && (e.override = bo(o, "loras"));
	}
	let v = [];
	$(r.seed) && v.push({
		label: O("sidebar.generation.seed", "Seed"),
		value: r.seed,
		override: bo(o, "seed")
	}), (r.sampler || r.sampler_name) && v.push({
		label: O("sidebar.generation.sampler", "Sampler"),
		value: r.sampler || r.sampler_name,
		override: bo(o, "sampler", "sampler_name")
	}), $(r.steps) && v.push({
		label: O("sidebar.generation.steps", "Steps"),
		value: r.steps,
		override: bo(o, "steps")
	});
	let y = $(r.cfg) ? r.cfg : r.cfg_scale;
	$(y) && v.push({
		label: O("sidebar.generation.cfgScale", "CFG Scale"),
		value: y,
		override: bo(o, "cfg", "cfg_scale")
	}), r.cfg_high_noise !== void 0 && r.cfg_high_noise !== null && v.push({
		label: O("sidebar.generation.cfgHighNoise", "CFG High Noise"),
		value: r.cfg_high_noise
	}), r.cfg_low_noise !== void 0 && r.cfg_low_noise !== null && v.push({
		label: O("sidebar.generation.cfgLowNoise", "CFG Low Noise"),
		value: r.cfg_low_noise
	}), r.scheduler && v.push({
		label: O("sidebar.generation.scheduler", "Scheduler"),
		value: r.scheduler,
		override: bo(o, "scheduler")
	});
	let b = $(r.denoise) ? r.denoise : r.denoising;
	$(b) && v.push({
		label: O("sidebar.generation.denoise", "Denoise"),
		value: b,
		override: bo(o, "denoise", "denoising")
	});
	let x = [];
	Array.isArray(r.chained_passes) && r.chained_passes.length > 1 ? x = r.chained_passes.filter((e) => e && typeof e == "object").map((e, t) => ({
		label: Xa(e, t),
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
		label: Xa(e, t),
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
		io(O("sidebar.generation.torchCompile", "Torch Compile"), r.use_torch_compile),
		io(O("sidebar.generation.cudaGraphs", "CUDA Graphs"), r.use_cuda_graphs),
		io(O("sidebar.generation.xVectorOnly", "X-Vector Only"), r.x_vector_only_mode)
	].filter(Boolean).forEach((e) => C.push(e));
	let ee = [];
	[
		io(O("sidebar.generation.chunking", "Chunking"), r.enable_chunking),
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
		io(O("sidebar.generation.audioCache", "Audio Cache"), r.enable_audio_cache),
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
	let T = [], ne = String(r.workflow_notes || r.notes || "").trim();
	ne && T.push({
		label: O("sidebar.generation.workflowNotes", "Workflow Notes"),
		value: ne,
		override: bo(o, "workflow_notes", "notes")
	});
	let re = xo(r.custom_info), ie = _o(r, h, v, x), E = vo(r, x, re, l.workflowType), ae = ho(r, x), oe = Array.isArray(r.inputs) ? r.inputs.filter((e) => e && typeof e == "object" && e.filename).map((e, t) => ({
		id: `${e.filename}-${t}`,
		filename: String(e.filename || "").trim(),
		subfolder: String(e.subfolder || "").trim(),
		type: String(e.folder_type || "input").trim().toLowerCase(),
		root_id: String(e.root_id || e.rootId || "").trim(),
		kind: String(e.kind || e.media_kind || e.type || "").trim().toLowerCase(),
		filepath: Ja(e),
		role: String(e.role || "").trim(),
		roleLabel: String(e.role || "").trim().replace(/_/g, " "),
		isVideo: String(e.type || "").toLowerCase() === "video" || /\.(mp4|mov|webm)$/i.test(String(e.filename || "")),
		isAudio: String(e.type || "").toLowerCase() === "audio" || /\.(wav|mp3|flac|ogg|m4a|aac|opus)$/i.test(String(e.filename || "")),
		previewCandidates: qa(e)
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
		positivePromptOverride: bo(o, "prompt", "positive", "positive_prompt"),
		negativePromptOverride: bo(o, "negative_prompt", "negative", "negativePrompt"),
		promptTabs: d,
		showAlignment: !!e?.id && (!!String(u.positive || "").trim() || d.length > 0),
		isImageAsset: Va(e),
		lyrics: String(r.lyrics || "").trim(),
		modelFields: f,
		modelGroups: h,
		branchCards: ie,
		pipelineTabs: x,
		samplingFields: v,
		ttsFields: S,
		ttsEngineFields: C,
		ttsInstruction: String(r.instruct || "").trim(),
		ttsRuntimeFields: ee,
		audioFields: te,
		seed: ae,
		imageFields: w,
		inputFiles: oe,
		isOverride: c,
		overrideLabel: c ? "Gen Info Override" : "",
		notesFields: T,
		customInfoBlocks: re,
		moduleBlocks: E,
		ltxDirector: i,
		ideogram: a
	};
}
//#endregion
//#region ui/vue/components/panel/sidebar/GenerationInputThumb.vue?vue&type=script&setup=true&lang.ts
var To = ["title"], Eo = ["src"], Do = {
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
}, Oo = { style: {
	"font-size": "8px",
	"font-weight": "700",
	"max-width": "54px",
	"white-space": "nowrap",
	overflow: "hidden",
	"text-overflow": "ellipsis"
} }, ko = ["src"], Ao = {
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
}, jo = {
	key: 4,
	title: "Video file",
	style: {
		position: "absolute",
		color: "white",
		opacity: "0.7",
		"font-size": "16px",
		"pointer-events": "none"
	}
}, Mo = /* @__PURE__ */ tt({
	__name: "GenerationInputThumb",
	props: { inputFile: {} },
	setup(e) {
		let t = e, n = V(0), r = V(!1), i = null;
		function a() {
			return i ||= import("./floatingViewerManager-Bnd82Qrd.js").then((e) => e.n), i;
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
			return Ya(o()) || !!t.inputFile?.filename || !!t.inputFile?.filepath;
		}
		function h() {
			let e = u();
			if (kt({
				asset: e,
				index: 0
			})) return;
			let t = o();
			if (Ya(t)) try {
				window.open(t, "_blank", "noopener,noreferrer");
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
				console.debug?.(e), E(O("toast.viewerOpenFailed", "Failed to open viewer."), "error");
			}
		}
		async function _() {
			let e = await le(u());
			if (!e?.ok) {
				E(e?.error || O("toast.openFolderFailed", "Failed to open folder."), "error");
				return;
			}
			E(O("toast.openedInFolder", "Opened in folder"), "info", 1600);
		}
		async function v() {
			let e = u(), t = {
				filename: e.filename,
				subfolder: e.subfolder,
				type: e.type || "input",
				root_id: e.root_id || void 0,
				kind: e.kind
			}, n = await Li({
				post: D,
				endpoint: Re.STAGE_TO_INPUT,
				payload: t,
				index: !1
			});
			if (!n?.relativePath) {
				E(O("toast.loadAssetFailed", "Failed to load asset."), "error");
				return;
			}
			if (!Ni({
				app: Pe(),
				items: [{
					payload: t,
					relativePath: n.relativePath,
					droppedExt: String(t.filename || "").split(".").pop() || ""
				}],
				event: null
			})) {
				E(O("toast.loadAssetFailed", "Failed to load asset."), "error");
				return;
			}
			let r = e.kind ? e.kind.charAt(0).toUpperCase() + e.kind.slice(1) : "Asset";
			E(O("toast.assetLoadedToCanvas", "{kind} loader added to canvas.", { kind: r }), "success", 1800);
		}
		function y(e) {
			e?.preventDefault?.(), e?.stopPropagation?.();
			let n = d(), r = n === "video" ? O("ctx.loadVideo", "Load video") : n === "audio" ? O("ctx.loadAudio", "Load audio") : n === "model3d" ? O("ctx.loadModel3d", "Load 3D model") : O("ctx.loadImage", "Load image");
			Er({
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
		return (t, n) => (I(), z("div", {
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
			onClick: c,
			onDblclick: l,
			onContextmenu: y
		}, [e.inputFile.isVideo ? (I(), z("video", {
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
		}, null, 40, Eo)) : S() ? (I(), z("div", Do, [n[0] ||= M("div", { style: {
			"font-size": "18px",
			"line-height": "1"
		} }, "♪", -1), M("div", Oo, R(e.inputFile.filename), 1)])) : (I(), z("img", {
			key: 2,
			src: o(),
			style: {
				width: "100%",
				height: "100%",
				"object-fit": "cover"
			},
			onError: s
		}, null, 40, ko)), e.inputFile.role && e.inputFile.role !== "secondary" ? (I(), z("div", Ao, R(e.inputFile.roleLabel), 1)) : e.inputFile.isVideo ? (I(), z("div", jo, " Play ")) : N("", !0)], 44, To));
	}
}), No = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "12px"
	}
}, Po = {
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
}, Fo = { style: { opacity: "0.85" } }, Io = { style: {
	display: "flex",
	"align-items": "center",
	gap: "8px",
	"flex-wrap": "wrap",
	"justify-content": "flex-end"
} }, Lo = ["title"], Ro = ["title"], zo = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, Bo = { style: {
	"font-size": "11px",
	"font-weight": "700",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.6px"
} }, Vo = { style: {
	"font-size": "11px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"font-weight": "600"
} }, Ho = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#FF9800",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Uo = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, Wo = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9E9E9E",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Go = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, Ko = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "10px"
} }, qo = { style: {
	"font-size": "11px",
	"font-weight": "800",
	color: "#26C6DA",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px"
} }, Jo = {
	key: 0,
	style: {
		display: "grid",
		"grid-template-columns": "repeat(auto-fit,minmax(92px,1fr))",
		gap: "8px",
		"margin-bottom": "10px"
	}
}, Yo = { style: {
	"font-size": "9px",
	"font-weight": "800",
	color: "rgba(255,255,255,0.55)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Xo = { style: {
	"font-size": "12px",
	color: "var(--fg-color,#eee)",
	"font-weight": "650",
	"word-break": "break-word"
} }, Zo = {
	key: 1,
	style: {
		border: "1px solid rgba(76,175,80,0.36)",
		"border-radius": "6px",
		background: "rgba(76,175,80,0.10)",
		padding: "10px",
		"margin-bottom": "10px"
	}
}, Qo = ["title"], $o = {
	key: 2,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "8px"
	}
}, es = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "7px"
} }, ts = { style: {
	"font-size": "10px",
	"font-weight": "800",
	color: "#26C6DA",
	"text-transform": "uppercase",
	"letter-spacing": "0.45px"
} }, ns = { style: {
	display: "flex",
	"align-items": "center",
	gap: "5px",
	"flex-wrap": "wrap",
	"justify-content": "flex-end"
} }, rs = {
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
}, is = {
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
}, as = { style: {
	display: "flex",
	gap: "10px",
	"align-items": "flex-start",
	"min-width": "0"
} }, os = { style: {
	"min-width": "0",
	flex: "1"
} }, ss = ["title", "onClick"], cs = {
	key: 1,
	style: {
		"font-size": "10px",
		color: "rgba(255,255,255,0.58)",
		"margin-top": "7px",
		display: "flex",
		gap: "6px",
		"flex-wrap": "wrap"
	}
}, ls = { key: 0 }, us = { key: 1 }, ds = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "10px"
} }, fs = { style: {
	"font-size": "11px",
	"font-weight": "800",
	color: "#FFB300",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px"
} }, ps = {
	key: 0,
	style: {
		display: "grid",
		"grid-template-columns": "repeat(auto-fit,minmax(100px,1fr))",
		gap: "8px",
		"margin-bottom": "10px"
	}
}, ms = { style: {
	"font-size": "9px",
	"font-weight": "800",
	color: "rgba(255,255,255,0.55)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, hs = { style: {
	"font-size": "12px",
	color: "var(--fg-color,#eee)",
	"font-weight": "650",
	"word-break": "break-word"
} }, gs = {
	key: 1,
	style: {
		border: "1px solid rgba(76,175,80,0.34)",
		"border-radius": "6px",
		background: "rgba(76,175,80,0.09)",
		padding: "10px",
		"margin-bottom": "10px"
	}
}, _s = ["title"], vs = {
	key: 2,
	style: {
		border: "1px solid rgba(33,150,243,0.32)",
		"border-radius": "6px",
		background: "rgba(33,150,243,0.08)",
		padding: "10px",
		"margin-bottom": "10px"
	}
}, ys = ["title"], bs = {
	key: 3,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "8px",
		"margin-bottom": "10px"
	}
}, xs = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "7px"
} }, Ss = { style: {
	"font-size": "10px",
	"font-weight": "800",
	color: "#FFCA28",
	"text-transform": "uppercase",
	"letter-spacing": "0.45px"
} }, Cs = {
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
}, ws = ["title", "onClick"], Ts = {
	key: 1,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "5px",
		"margin-top": "8px"
	}
}, Es = ["title", "onClick"], Ds = { style: {
	border: "1px solid rgba(255,179,0,0.30)",
	"border-radius": "6px",
	background: "rgba(0,0,0,0.16)",
	overflow: "hidden"
} }, Os = ["title"], ks = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, As = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"margin-bottom": "10px"
} }, js = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "#4CAF50",
	"letter-spacing": "0.4px"
} }, Ms = ["onClick"], Ns = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "#F44336",
	"letter-spacing": "0.4px",
	"margin-top": "4px"
} }, Ps = ["onClick"], Fs = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Is = ["title"], Ls = ["title"], Rs = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#F44336",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, zs = ["title"], Bs = ["title"], Vs = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between"
} }, Hs = ["title"], Us = { style: {
	display: "flex",
	"align-items": "center",
	gap: "10px"
} }, Ws = { style: {
	flex: "1",
	height: "8px",
	background: "rgba(255,255,255,0.1)",
	"border-radius": "4px",
	overflow: "hidden"
} }, Gs = {
	key: 0,
	style: {
		"font-size": "10px",
		color: "rgba(255,255,255,0.65)",
		border: "1px dashed rgba(255,255,255,0.25)",
		"border-radius": "4px",
		padding: "6px 8px",
		background: "rgba(255,255,255,0.04)"
	}
}, Ks = { style: {
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
} }, qs = ["title"], Js = { style: {
	display: "flex",
	"align-items": "center",
	gap: "6px"
} }, Ys = ["title"], Xs = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9C27B0",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Zs = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(190px, 1fr))",
	gap: "10px"
} }, Qs = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.58)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, $s = ["onClick"], ec = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "5px"
	}
}, tc = ["onClick"], nc = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, rc = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, ic = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#FF9800",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, ac = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(130px, 1fr))",
	gap: "8px"
} }, oc = ["onClick"], sc = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9C27B0",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, cc = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(220px, 1fr))",
	gap: "10px"
} }, lc = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, uc = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "4px"
} }, dc = ["onClick"], fc = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "6px"
	}
}, pc = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.58)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, mc = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "5px"
} }, hc = ["onClick"], gc = { style: {
	display: "grid",
	"grid-template-columns": "auto 1fr",
	gap: "8px 12px",
	"align-items": "start"
} }, _c = ["title"], vc = ["title"], yc = ["title", "onClick"], bc = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, xc = ["title", "onClick"], Sc = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#26C6DA",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Cc = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(190px, 1fr))",
	gap: "10px"
} }, wc = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.58)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Tc = ["title", "onClick"], Ec = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#26A69A",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Dc = ["title"], Oc = { style: {
	"font-size": "11px",
	"font-weight": "700",
	color: "#E91E63",
	"text-transform": "uppercase",
	"letter-spacing": "1px"
} }, kc = ["title"], Ac = ["title"], jc = { style: {
	display: "flex",
	gap: "8px",
	"flex-wrap": "wrap"
} }, Mc = /* @__PURE__ */ tt({
	__name: "SidebarGenerationSection",
	props: { asset: {} },
	setup(e) {
		let t = e, n = V(0), r = V(0), i = V(""), a = V(O("action.copy", "Copy")), o = V(O("action.generate", "Generate")), s = V(!1), c = V(u()), l = 0;
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
		let h = P(() => wo(t.asset)), g = P(() => Ua()), _ = P(() => h.value.kind === "full" || h.value.kind === "caption-only"), v = P(() => Ka(i.value) || h.value.emptyCaptionText), y = P(() => g.value && h.value.isImageAsset && !!t.asset?.id), b = P(() => g.value && !!Ka(v.value) && v.value !== h.value.emptyCaptionText), x = P(() => h.value.branchCards.filter((e) => e.modelFields.length || e.loras.length)), S = P(() => h.value.branchCards.filter((e) => e.samplingFields.length));
		P(() => h.value.branchCards.filter((e) => e.loras.length));
		let ee = P(() => {
			let e = [], t = (e, t) => Na(e)?.title || t;
			return !x.value.length && h.value.modelFields.length && e.push({
				key: "model",
				title: t("model", O("sidebar.generation.modelLora", "Model & LoRA")),
				accent: "#9C27B0",
				emphasis: !0,
				fields: h.value.modelFields
			}), !S.value.length && h.value.samplingFields.length && e.push({
				key: "sampling",
				title: t("sampler", O("sidebar.generation.sampling", "Sampling")),
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
		function w(e, t, n = 450) {
			if (!e) return;
			let r = e.style.background;
			e.style.background = t, setTimeout(() => {
				e.style.background = r || "";
			}, n);
		}
		function T(e, t = !0) {
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
		function ne(e) {
			return "#CE6DE0";
		}
		function re(e) {
			let t = String(e?.key || "").toLowerCase();
			return t.includes("high") ? "#FFC107" : t.includes("low") ? "#FFB300" : t.includes("base") ? "#FF9800" : t.includes("upscale") || t.includes("refine") ? "#FFCA28" : t.includes("pass") ? "#FDD835" : "#FF9800";
		}
		function ie(e) {
			return e === "high_noise" ? "#FF7043" : e === "low_noise" ? "#29B6F6" : "#AB47BC";
		}
		async function E(e, t = null, n = "rgba(76, 175, 80, 0.35)") {
			let r = String(e ?? "").trim();
			if (!(!r || r === "-")) try {
				await navigator.clipboard.writeText(r), w(t, n);
			} catch (e) {
				console.debug?.(e);
			}
		}
		function ae() {
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
		function oe() {
			c.value = u();
		}
		async function se() {
			l += 1;
			let e = l;
			if (!h.value.showAlignment || !t.asset?.id) {
				oe();
				return;
			}
			if (!g.value) {
				ae();
				return;
			}
			oe();
			try {
				let n = await te(t.asset.id);
				if (e !== l) return;
				if (!n?.ok && (String(n?.code || "").toUpperCase() === "SERVICE_UNAVAILABLE" || /vector search is not enabled/i.test(String(n?.error || "")))) {
					ae();
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
				let i = Math.round(r * 100), a = Wa(r);
				c.value = {
					scoreText: `${i}%`,
					scoreColor: a,
					qualityText: Ga(r),
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
		async function ce() {
			if (!(!y.value || s.value)) {
				s.value = !0, o.value = O("status.generating", "Generating...");
				try {
					let e = await C(t.asset.id);
					e?.ok && (i.value = String(e?.data || "").trim());
				} catch (e) {
					console.debug?.(e);
				} finally {
					s.value = !1, o.value = O("action.generate", "Generate");
				}
			}
		}
		async function le() {
			if (b.value) try {
				await navigator.clipboard.writeText(v.value), a.value = O("viewer.copySuccessShort", "Copied!"), setTimeout(() => {
					a.value = O("action.copy", "Copy");
				}, 900);
			} catch (e) {
				console.debug?.(e);
			}
		}
		return et(() => t.asset, () => {
			n.value = 0, r.value = 0, i.value = String(t.asset?.enhanced_caption || "").trim(), a.value = O("action.copy", "Copy"), o.value = O("action.generate", "Generate");
		}, { immediate: !0 }), et(() => [
			t.asset?.id,
			h.value.kind,
			h.value.showAlignment,
			g.value
		], () => {
			se();
		}, { immediate: !0 }), (e, t) => {
			let r = Qe("MButton");
			return h.value.kind === "empty" ? N("", !0) : (I(), z("div", No, [
				h.value.workflowType ? (I(), z("div", Po, [M("span", Fo, R(B(O)("viewer.workflow", "Workflow")), 1), M("div", Io, [M("span", {
					title: B(O)("sidebar.generation.workflowEngine", "Workflow engine: {value}", { value: h.value.workflowType }),
					style: {
						background: "#2196F3",
						color: "white",
						padding: "2px 8px",
						"border-radius": "999px",
						"font-weight": "bold",
						"font-size": "10px",
						"letter-spacing": "0.2px"
					}
				}, R(h.value.workflowLabel || h.value.workflowType), 9, Lo), h.value.workflowBadge ? (I(), z("span", {
					key: 0,
					title: B(O)("sidebar.generation.apiProvider", "API provider: {value}", { value: h.value.workflowBadge }),
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
				}, R(h.value.workflowBadge), 9, Ro)) : N("", !0)])])) : N("", !0),
				h.value.isOverride ? (I(), z("div", {
					key: 1,
					style: L(f("#00BCD4", {
						emphasis: !0,
						startAlpha: .14,
						endAlpha: .08
					}))
				}, [M("div", zo, [M("span", Bo, R(B(O)("sidebar.generation.override", "Override")), 1), M("span", Vo, R(h.value.overrideLabel), 1)])], 4)) : N("", !0),
				h.value.isTruncated ? (I(), z("div", {
					key: 2,
					style: L(f("#FF9800", {
						emphasis: !0,
						startAlpha: .12,
						endAlpha: .08
					}))
				}, [M("div", Ho, R(B(O)("sidebar.generation.metadataTruncated", "Metadata Truncated")), 1), M("div", Uo, R(B(O)("sidebar.generation.metadataTruncatedBody", "Generation data is incomplete because it exceeded the size limit.")), 1)], 4)) : N("", !0),
				h.value.kind === "media-only" ? (I(), z("div", {
					key: 3,
					style: L(f("#9E9E9E", {
						emphasis: !0,
						startAlpha: .1,
						endAlpha: .06
					}))
				}, [M("div", Wo, R(B(O)("sidebar.generation.generationData", "Generation Data")), 1), M("div", Go, R(h.value.mediaOnlyMessage), 1)], 4)) : N("", !0),
				h.value.kind === "full" ? (I(), z(j, { key: 4 }, [
					h.value.ltxDirector ? (I(), z("div", {
						key: 0,
						style: L(f("#26C6DA", {
							emphasis: !0,
							startAlpha: .15,
							endAlpha: .08
						}))
					}, [
						M("div", Ko, [M("div", qo, R(h.value.ltxDirector.title || "LTX Director"), 1), t[8] ||= M("span", { style: {
							"font-size": "10px",
							"font-weight": "700",
							color: "#26C6DA",
							background: "rgba(38,198,218,0.14)",
							border: "1px solid rgba(38,198,218,0.32)",
							"border-radius": "999px",
							padding: "2px 8px"
						} }, " Director ", -1)]),
						h.value.ltxDirector.fields.length ? (I(), z("div", Jo, [(I(!0), z(j, null, F(h.value.ltxDirector.fields, (e) => (I(), z("div", {
							key: `ltx-field-${e.label}`,
							style: {
								border: "1px solid rgba(255,255,255,0.10)",
								"border-radius": "6px",
								background: "rgba(255,255,255,0.045)",
								padding: "7px 8px",
								"min-width": "0"
							}
						}, [M("div", Yo, R(e.label), 1), M("div", Xo, R(e.value), 1)]))), 128))])) : N("", !0),
						h.value.ltxDirector.globalPrompt ? (I(), z("div", Zo, [t[9] ||= M("div", { style: {
							"font-size": "10px",
							"font-weight": "800",
							color: "#66BB6A",
							"text-transform": "uppercase",
							"letter-spacing": "0.45px",
							"margin-bottom": "6px"
						} }, " Global Prompt ", -1), M("div", {
							title: B(O)("action.clickToCopy", "Click to copy"),
							style: {
								"font-size": "12px",
								color: "var(--fg-color,#eee)",
								"line-height": "1.45",
								"white-space": "pre-wrap",
								"word-break": "break-word",
								cursor: "pointer"
							},
							onClick: t[0] ||= (e) => E(h.value.ltxDirector.globalPrompt, e.currentTarget)
						}, R(h.value.ltxDirector.globalPrompt), 9, Qo)])) : N("", !0),
						h.value.ltxDirector.segments.length ? (I(), z("div", $o, [(I(!0), z(j, null, F(h.value.ltxDirector.segments, (e) => (I(), z("div", {
							key: e.key,
							style: {
								border: "1px solid rgba(38,198,218,0.30)",
								"border-radius": "6px",
								background: "rgba(38,198,218,0.075)",
								padding: "10px"
							}
						}, [M("div", es, [M("div", ts, R(e.label), 1), M("div", ns, [e.inLabel ? (I(), z("span", rs, " in " + R(e.inLabel), 1)) : N("", !0), e.outLabel ? (I(), z("span", is, " out " + R(e.outLabel), 1)) : N("", !0)])]), M("div", as, [e.filename ? (I(), Ze(Mo, {
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
						}, null, 8, ["input-file"])) : N("", !0), M("div", os, [e.prompt ? (I(), z("div", {
							key: 0,
							title: B(O)("action.clickToCopy", "Click to copy"),
							style: {
								"font-size": "12px",
								color: "var(--fg-color,#eee)",
								"line-height": "1.45",
								"white-space": "pre-wrap",
								"word-break": "break-word",
								cursor: "pointer"
							},
							onClick: (t) => E(e.prompt, t.currentTarget)
						}, R(e.prompt), 9, ss)) : N("", !0), e.filename || e.type ? (I(), z("div", cs, [e.type ? (I(), z("span", ls, R(e.type), 1)) : N("", !0), e.filename ? (I(), z("span", us, R(e.filename), 1)) : N("", !0)])) : N("", !0)])])]))), 128))])) : N("", !0)
					], 4)) : N("", !0),
					h.value.ideogram ? (I(), z("div", {
						key: 1,
						style: L(f("#FFB300", {
							emphasis: !0,
							startAlpha: .15,
							endAlpha: .08
						}))
					}, [
						M("div", ds, [M("div", fs, R(h.value.ideogram.title || "Ideogram 4"), 1), t[10] ||= M("span", { style: {
							"font-size": "10px",
							"font-weight": "700",
							color: "#FFCA28",
							background: "rgba(255,179,0,0.14)",
							border: "1px solid rgba(255,179,0,0.32)",
							"border-radius": "999px",
							padding: "2px 8px"
						} }, " Prompt JSON ", -1)]),
						h.value.ideogram.fields.length ? (I(), z("div", ps, [(I(!0), z(j, null, F(h.value.ideogram.fields, (e) => (I(), z("div", {
							key: `ideogram-field-${e.label}`,
							style: {
								border: "1px solid rgba(255,255,255,0.10)",
								"border-radius": "6px",
								background: "rgba(255,255,255,0.045)",
								padding: "7px 8px",
								"min-width": "0"
							}
						}, [M("div", ms, R(e.label), 1), M("div", hs, R(e.value), 1)]))), 128))])) : N("", !0),
						h.value.ideogram.highLevelDescription ? (I(), z("div", gs, [t[11] ||= M("div", { style: {
							"font-size": "10px",
							"font-weight": "800",
							color: "#81C784",
							"text-transform": "uppercase",
							"letter-spacing": "0.45px",
							"margin-bottom": "6px"
						} }, " High Level Description ", -1), M("div", {
							title: B(O)("action.clickToCopy", "Click to copy"),
							style: {
								"font-size": "12px",
								color: "var(--fg-color,#eee)",
								"line-height": "1.45",
								"white-space": "pre-wrap",
								"word-break": "break-word",
								cursor: "pointer"
							},
							onClick: t[1] ||= (e) => E(h.value.ideogram.highLevelDescription, e.currentTarget)
						}, R(h.value.ideogram.highLevelDescription), 9, _s)])) : N("", !0),
						h.value.ideogram.background ? (I(), z("div", vs, [t[12] ||= M("div", { style: {
							"font-size": "10px",
							"font-weight": "800",
							color: "#64B5F6",
							"text-transform": "uppercase",
							"letter-spacing": "0.45px",
							"margin-bottom": "6px"
						} }, " Background ", -1), M("div", {
							title: B(O)("action.clickToCopy", "Click to copy"),
							style: {
								"font-size": "12px",
								color: "var(--fg-color,#eee)",
								"line-height": "1.45",
								"white-space": "pre-wrap",
								"word-break": "break-word",
								cursor: "pointer"
							},
							onClick: t[2] ||= (e) => E(h.value.ideogram.background, e.currentTarget)
						}, R(h.value.ideogram.background), 9, ys)])) : N("", !0),
						h.value.ideogram.elements.length ? (I(), z("div", bs, [(I(!0), z(j, null, F(h.value.ideogram.elements, (e) => (I(), z("div", {
							key: e.key,
							style: {
								border: "1px solid rgba(255,179,0,0.30)",
								"border-radius": "6px",
								background: "rgba(255,179,0,0.075)",
								padding: "10px"
							}
						}, [
							M("div", xs, [M("div", Ss, R(e.label), 1), e.bbox ? (I(), z("span", Cs, " bbox " + R(e.bbox), 1)) : N("", !0)]),
							e.description ? (I(), z("div", {
								key: 0,
								title: B(O)("action.clickToCopy", "Click to copy"),
								style: {
									"font-size": "12px",
									color: "var(--fg-color,#eee)",
									"line-height": "1.45",
									"white-space": "pre-wrap",
									"word-break": "break-word",
									cursor: "pointer"
								},
								onClick: (t) => E(e.description, t.currentTarget)
							}, R(e.description), 9, ws)) : N("", !0),
							e.palette.length ? (I(), z("div", Ts, [(I(!0), z(j, null, F(e.palette, (t) => (I(), z("span", {
								key: `${e.key}-${t}`,
								title: t,
								style: L({
									width: "18px",
									height: "18px",
									borderRadius: "4px",
									border: "1px solid rgba(255,255,255,0.28)",
									background: t
								}),
								onClick: (e) => E(t, e.currentTarget)
							}, null, 12, Es))), 128))])) : N("", !0)
						]))), 128))])) : N("", !0),
						M("details", Ds, [t[13] ||= M("summary", { style: {
							cursor: "pointer",
							padding: "8px 10px",
							"font-size": "10px",
							"font-weight": "800",
							color: "#FFCA28",
							"text-transform": "uppercase",
							"letter-spacing": "0.45px"
						} }, " JSON sent to text encoder ", -1), M("pre", {
							title: B(O)("action.clickToCopy", "Click to copy"),
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
							onClick: t[3] ||= (e) => E(h.value.ideogram.json, e.currentTarget)
						}, R(h.value.ideogram.json), 9, Os)])
					], 4)) : N("", !0),
					!h.value.ltxDirector && !h.value.ideogram && h.value.promptTabs.length ? (I(), z("div", {
						key: 2,
						style: L(f("#4CAF50", {
							emphasis: !0,
							startAlpha: .16,
							endAlpha: .1
						}))
					}, [
						M("div", ks, R(B(O)("sidebar.generation.promptPipeline", "Prompt Pipeline ({count} variants)", { count: h.value.promptTabs.length })), 1),
						M("div", As, [(I(!0), z(j, null, F(h.value.promptTabs, (e, t) => (I(), Ze(r, {
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
							default: $e(() => [Xe(R(e.label), 1)]),
							_: 2
						}, 1032, ["style", "onClick"]))), 128))]),
						(I(!0), z(j, null, F(h.value.promptTabs, (e, t) => it((I(), z("div", {
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
							M("div", js, R(B(O)("sidebar.generation.positive", "POSITIVE")), 1),
							M("div", {
								style: {
									"font-size": "12px",
									color: "var(--fg-color, #ddd)",
									"white-space": "pre-wrap",
									"line-height": "1.35",
									cursor: "pointer"
								},
								onClick: (t) => E(e.positive, t.currentTarget)
							}, R(e.positive), 9, Ms),
							e.negative ? (I(), z(j, { key: 0 }, [M("div", Ns, R(B(O)("sidebar.generation.negative", "NEGATIVE")), 1), M("div", {
								style: {
									"font-size": "12px",
									color: "var(--fg-color, #ddd)",
									"white-space": "pre-wrap",
									"line-height": "1.35",
									cursor: "pointer"
								},
								onClick: (t) => E(e.negative, t.currentTarget)
							}, R(e.negative), 9, Ps)], 64)) : N("", !0)
						])), [[st, n.value === t]])), 128))
					], 4)) : !h.value.ltxDirector && !h.value.ideogram && h.value.positivePrompt ? (I(), z("div", {
						key: 3,
						style: L(f("#4CAF50", {
							emphasis: !0,
							startAlpha: .16,
							endAlpha: .1
						}))
					}, [M("div", Fs, [M("span", null, R(B(O)("sidebar.generation.positivePrompt", "Positive Prompt")), 1), h.value.positivePromptOverride ? (I(), z("span", {
						key: 0,
						style: L(m()),
						title: B(O)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
					}, R(B(O)("sidebar.generation.override", "override")), 13, Is)) : N("", !0)]), M("div", {
						title: B(O)("action.clickToCopy", "Click to copy"),
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.9))",
							"line-height": "1.5",
							"white-space": "pre-wrap",
							"word-break": "break-word",
							cursor: "pointer"
						},
						onClick: t[4] ||= (e) => E(h.value.positivePrompt, e.currentTarget)
					}, R(h.value.positivePrompt), 9, Ls)], 4)) : N("", !0),
					!h.value.ltxDirector && !h.value.ideogram && !h.value.promptTabs.length && h.value.negativePrompt ? (I(), z("div", {
						key: 4,
						style: L(f("#F44336", {
							emphasis: !0,
							startAlpha: .16,
							endAlpha: .1
						}))
					}, [M("div", Rs, [M("span", null, R(B(O)("sidebar.generation.negativePrompt", "Negative Prompt")), 1), h.value.negativePromptOverride ? (I(), z("span", {
						key: 0,
						style: L(m()),
						title: B(O)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
					}, R(B(O)("sidebar.generation.override", "override")), 13, zs)) : N("", !0)]), M("div", {
						title: B(O)("action.clickToCopy", "Click to copy"),
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.9))",
							"line-height": "1.5",
							"white-space": "pre-wrap",
							"word-break": "break-word",
							cursor: "pointer"
						},
						onClick: t[5] ||= (e) => E(h.value.negativePrompt, e.currentTarget)
					}, R(h.value.negativePrompt), 9, Bs)], 4)) : N("", !0)
				], 64)) : N("", !0),
				_.value ? (I(), z("div", {
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
					class: Tt({ "mjr-ai-disabled-block": !g.value })
				}, [
					h.value.showAlignment ? (I(), z(j, { key: 0 }, [
						M("div", Vs, [M("span", { title: B(O)("sidebar.generation.promptAlignmentTooltip", "How closely the generated image matches the prompt (SigLIP2 score)") }, R(B(O)("sidebar.generation.promptAlignment", "Prompt Alignment")), 9, Hs)]),
						M("div", Us, [
							M("div", Ws, [M("div", { style: L({
								height: "100%",
								width: c.value.fillWidth,
								background: c.value.fillColor,
								borderRadius: "4px",
								transition: "width 0.6s ease, background 0.4s ease"
							}) }, null, 4)]),
							M("span", { style: L({
								fontSize: "13px",
								fontWeight: "700",
								color: c.value.scoreColor,
								minWidth: "60px",
								textAlign: "right",
								fontFamily: "'Consolas', 'Monaco', monospace"
							}) }, R(c.value.scoreText), 5),
							M("span", { style: L({
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
						c.value.aiStatusVisible ? (I(), z("div", Gs, R(c.value.aiStatusText), 1)) : N("", !0)
					], 64)) : N("", !0),
					M("div", Ks, [M("span", { title: B(O)("sidebar.generation.aiCaptionTooltip", "AI caption generated by Florence-2") }, R(h.value.captionLabel), 9, qs), M("div", Js, [mt(r, {
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
						onClick: rt(ce, ["stop"])
					}, {
						default: $e(() => [Xe(R(o.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"]), mt(r, {
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
						onClick: rt(le, ["stop"])
					}, {
						default: $e(() => [Xe(R(a.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"])])]),
					M("div", {
						title: g.value ? B(O)("sidebar.generation.copyCaptionTooltip", "Click to copy caption") : B(O)("sidebar.generation.aiCaptionDisabled", "AI caption controls are disabled"),
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
						onClick: le
					}, R(v.value), 13, Ys)
				], 2)) : N("", !0),
				x.value.length ? (I(), z("div", {
					key: 6,
					style: L(f("#9C27B0", {
						emphasis: !0,
						startAlpha: .18,
						endAlpha: .1
					}))
				}, [M("div", Xs, R(B(O)("sidebar.generation.models", "Models")), 1), M("div", Zs, [(I(!0), z(j, null, F(x.value, (e) => (I(), z("div", {
					key: `models-top-${e.key}`,
					style: L(T(ne(e), !0))
				}, [
					M("div", { style: L({
						fontSize: "10px",
						fontWeight: "800",
						color: ne(e),
						letterSpacing: "0.6px",
						textTransform: "uppercase"
					}) }, R(e.label), 5),
					(I(!0), z(j, null, F(e.modelFields, (t) => (I(), z("div", {
						key: `model-top-${e.key}-${t.label}`,
						style: {
							display: "flex",
							"flex-direction": "column",
							gap: "3px",
							"min-width": "0"
						}
					}, [M("span", Qs, R(t.label), 1), M("span", {
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.96))",
							"line-height": "1.35",
							"word-break": "break-word",
							cursor: "pointer"
						},
						onClick: (e) => E(t.value, e.currentTarget)
					}, R(t.value || "-"), 9, $s)]))), 128)),
					e.loras.length ? (I(), z("div", ec, [t[14] ||= M("span", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.58)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "LoRA", -1), (I(!0), z(j, null, F(e.loras, (t, n) => (I(), z("span", {
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
						onClick: (e) => E(t, e.currentTarget)
					}, R(t), 9, tc))), 128))])) : N("", !0)
				], 4))), 128))])], 4)) : N("", !0),
				h.value.lyrics ? (I(), z("div", {
					key: 7,
					style: L(f("#00BCD4", { emphasis: !1 }))
				}, [M("div", nc, [M("span", null, R(B(O)("sidebar.generation.lyrics", "Lyrics")), 1)]), M("div", rc, R(h.value.lyrics), 1)], 4)) : N("", !0),
				h.value.branchCards.length ? (I(), z(j, { key: 8 }, [
					N("", !0),
					S.value.length ? (I(), z("div", {
						key: 1,
						style: L(f("#FF9800", {
							emphasis: !0,
							startAlpha: .16,
							endAlpha: .1
						}))
					}, [M("div", ic, R(B(O)("sidebar.generation.sampling", "Sampling")), 1), M("div", ac, [(I(!0), z(j, null, F(S.value, (e) => (I(), z("div", {
						key: `sampling-${e.key}`,
						style: L(T(re(e), !0))
					}, [M("div", { style: L({
						fontSize: "10px",
						fontWeight: "800",
						color: re(e),
						letterSpacing: "0.6px",
						textTransform: "uppercase"
					}) }, R(e.label), 5), (I(!0), z(j, null, F(e.samplingFields, (t) => (I(), z("div", {
						key: `sampling-row-${e.key}-${t.label}`,
						style: {
							display: "grid",
							"grid-template-columns": "minmax(48px,0.8fr) minmax(0,1fr)",
							gap: "8px",
							"font-size": "11px",
							color: "rgba(255,255,255,0.72)",
							"align-items": "start"
						}
					}, [M("span", null, R(t.label), 1), M("span", {
						style: {
							color: "var(--fg-color, #ddd)",
							"word-break": "break-word",
							"text-align": "right",
							cursor: "pointer"
						},
						onClick: (e) => E(t.value, e.currentTarget)
					}, R(t.value), 9, oc)]))), 128))], 4))), 128))])], 4)) : N("", !0),
					N("", !0)
				], 64)) : h.value.modelGroups.length ? (I(), z("div", {
					key: 9,
					style: L(f("#9C27B0", {
						emphasis: !0,
						startAlpha: .18,
						endAlpha: .1
					}))
				}, [M("div", sc, R(B(O)("sidebar.generation.models", "Models")), 1), M("div", cc, [(I(!0), z(j, null, F(h.value.modelGroups, (e) => (I(), z("div", {
					key: `model-group-${e.key}`,
					style: L(T(ie(e.key), !0))
				}, [
					M("div", lc, [M("div", { style: L({
						fontSize: "10px",
						fontWeight: "800",
						color: ie(e.key),
						letterSpacing: "0.6px",
						textTransform: "uppercase"
					}) }, R(e.label), 5), M("span", { style: L({
						fontSize: "9px",
						fontWeight: "700",
						color: "#fff",
						background: d(ie(e.key), .22),
						border: `1px solid ${d(ie(e.key), .48)}`,
						borderRadius: "999px",
						padding: "2px 8px",
						letterSpacing: "0.4px",
						textTransform: "uppercase"
					}) }, R(e.loras?.length || 0) + " LoRA ", 5)]),
					M("div", uc, [t[15] ||= M("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.58)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, " UNet ", -1), M("div", {
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.96))",
							"line-height": "1.45",
							"word-break": "break-word",
							cursor: "pointer"
						},
						onClick: (t) => E(e.model, t.currentTarget)
					}, R(e.model || "-"), 9, dc)]),
					e.loras?.length ? (I(), z("div", fc, [M("div", pc, R(B(O)("sidebar.generation.loraStack", "LoRA Stack")), 1), M("div", mc, [(I(!0), z(j, null, F(e.loras, (t, n) => (I(), z("div", {
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
					}, R(t), 9, hc))), 128))])])) : N("", !0)
				], 4))), 128))])], 4)) : N("", !0),
				(I(!0), z(j, null, F(ee.value, (e) => (I(), z("div", {
					key: e.key,
					style: L(f(e.accent, { emphasis: e.emphasis }))
				}, [M("div", { style: L({
					fontSize: "11px",
					fontWeight: "600",
					color: e.accent,
					textTransform: "uppercase",
					letterSpacing: "0.5px",
					marginBottom: "10px"
				}) }, R(e.title), 5), M("div", gc, [(I(!0), z(j, null, F(e.fields, (t) => (I(), z(j, { key: `${e.key}-${t.label}` }, [M("div", {
					title: t.label,
					style: {
						"font-size": "11px",
						color: "var(--mjr-muted, rgba(127,127,127,0.9))",
						"font-weight": "500",
						display: "flex",
						"align-items": "center",
						gap: "6px"
					}
				}, [M("span", null, R(t.label) + ":", 1), t.override ? (I(), z("span", {
					key: 0,
					style: L(m()),
					title: B(O)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
				}, R(B(O)("sidebar.generation.override", "override")), 13, vc)) : N("", !0)], 8, _c), M("div", {
					title: `${t.label}: ${t.value}`,
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.95))",
						"word-break": "break-word",
						"white-space": "pre-wrap",
						cursor: "pointer"
					},
					onClick: (e) => E(t.value, e.currentTarget)
				}, R(t.value), 9, yc)], 64))), 128))])], 4))), 128)),
				h.value.notesFields.length ? (I(), z("div", {
					key: 10,
					style: L(f("#4CAF50", { emphasis: !1 }))
				}, [M("div", bc, R(B(O)("sidebar.generation.notes", "Notes")), 1), (I(!0), z(j, null, F(h.value.notesFields, (e) => (I(), z("div", {
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
				}, R(e.value), 9, xc))), 128))], 4)) : N("", !0),
				h.value.moduleBlocks.length ? (I(), z("div", {
					key: 11,
					style: L(f("#26C6DA", {
						emphasis: !0,
						startAlpha: .14,
						endAlpha: .08
					}))
				}, [M("div", Sc, R(B(O)("sidebar.generation.modules", "Modules")), 1), M("div", Cc, [(I(!0), z(j, null, F(h.value.moduleBlocks, (e) => (I(), z("div", {
					key: `module-${e.key}-${e.title}`,
					style: L(T(e.accent, !1))
				}, [M("div", { style: L({
					fontSize: "10px",
					fontWeight: "800",
					color: e.accent,
					letterSpacing: "0.6px",
					textTransform: "uppercase"
				}) }, R(e.title), 5), (I(!0), z(j, null, F(e.fields, (t) => (I(), z("div", {
					key: `module-${e.key}-${t.label}`,
					style: {
						display: "flex",
						"flex-direction": "column",
						gap: "3px",
						"min-width": "0"
					}
				}, [M("span", wc, R(t.label), 1), M("span", {
					title: `${t.label}: ${t.value}`,
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.35",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: (e) => E(t.value, e.currentTarget)
				}, R(t.value), 9, Tc)]))), 128))], 4))), 128))])], 4)) : N("", !0),
				h.value.ttsInstruction ? (I(), z("div", {
					key: 12,
					style: L(f("#26A69A", { emphasis: !1 }))
				}, [M("div", Ec, [M("span", null, R(B(O)("sidebar.generation.ttsInstruction", "TTS Instruction")), 1)]), M("div", {
					title: B(O)("action.clickToCopy", "Click to copy"),
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: t[6] ||= (e) => E(h.value.ttsInstruction, e.currentTarget)
				}, R(h.value.ttsInstruction), 9, Dc)], 4)) : N("", !0),
				h.value.seed !== null && h.value.seed !== void 0 && h.value.seed !== "" ? (I(), z("div", {
					key: 13,
					style: L(p())
				}, [M("div", Oc, R(B(O)("sidebar.generation.seed", "SEED")), 1), M("div", {
					title: B(O)("sidebar.generation.copySeedTooltip", "Click to copy seed: {seed}", { seed: h.value.seed }),
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
					onClick: t[7] ||= (e) => E(h.value.seed, e.currentTarget, "rgba(76, 175, 80, 0.4)")
				}, R(h.value.seed), 9, kc)], 4)) : N("", !0),
				h.value.inputFiles.length ? (I(), z("div", {
					key: 14,
					style: L(f("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [M("div", {
					title: B(O)("tooltip.generationInputs", "Input files used in generation"),
					style: {
						"font-size": "11px",
						"font-weight": "600",
						color: "#4CAF50",
						"text-transform": "uppercase",
						"letter-spacing": "0.5px",
						"margin-bottom": "8px"
					}
				}, R(B(O)("sidebar.generation.sourceFiles", "Source Files")), 9, Ac), M("div", jc, [(I(!0), z(j, null, F(h.value.inputFiles, (e) => (I(), Ze(Mo, {
					key: e.id,
					"input-file": e
				}, null, 8, ["input-file"]))), 128))])], 4)) : N("", !0)
			]));
		};
	}
}), Nc = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "var(--comfy-menu-bg, rgba(0,0,0,0.2))",
		border: "1px solid var(--border-color, rgba(255,255,255,0.14))",
		"border-radius": "8px",
		padding: "12px",
		"min-width": "300px"
	}
}, Pc = { style: { "margin-bottom": "12px" } }, Fc = { style: {
	"font-size": "16px",
	"font-weight": "800",
	color: "rgba(255,255,255,0.94)",
	"line-height": "1.25",
	overflow: "hidden",
	"text-overflow": "ellipsis"
} }, Ic = ["title"], Lc = {
	key: 1,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "6px",
		"margin-top": "8px",
		"min-width": "0"
	},
	"aria-label": "Workflow metadata badges"
}, Rc = ["title"], zc = { style: {
	overflow: "hidden",
	"text-overflow": "ellipsis",
	"white-space": "nowrap"
} }, Bc = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "8px",
	"margin-bottom": "10px"
} }, Vc = { style: {
	padding: "4px 9px",
	"border-radius": "999px",
	background: "rgba(33,150,243,0.14)",
	border: "1px solid rgba(33,150,243,0.30)",
	"font-size": "11px",
	"font-weight": "700",
	color: "#90CAF9",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Hc = {
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
}, Uc = { style: {
	display: "grid",
	"grid-template-columns": "repeat(2, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, Wc = {
	key: 0,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, Gc = { style: {
	"font-size": "13px",
	"font-weight": "750",
	color: "rgba(255,255,255,0.92)",
	"margin-top": "3px"
} }, Kc = {
	key: 1,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, qc = { style: {
	"font-size": "13px",
	"font-weight": "750",
	color: "rgba(255,255,255,0.92)",
	"margin-top": "3px"
} }, Jc = {
	key: 2,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, Yc = { style: {
	"font-size": "13px",
	"font-weight": "750",
	color: "rgba(255,255,255,0.92)",
	"margin-top": "3px"
} }, Xc = {
	key: 3,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, Zc = { style: {
	"font-size": "12px",
	"font-weight": "650",
	color: "rgba(255,255,255,0.84)",
	"margin-top": "3px"
} }, Qc = {
	key: 0,
	style: {
		"font-size": "11px",
		color: "rgba(255,255,255,0.54)",
		"margin-top": "2px"
	}
}, $c = {
	key: 0,
	style: {
		"margin-bottom": "12px",
		padding: "10px",
		"border-radius": "10px",
		background: "rgba(244,67,54,0.08)",
		border: "1px solid rgba(244,67,54,0.25)"
	}
}, el = {
	key: 1,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "5px"
	}
}, tl = {
	key: 1,
	style: {
		"margin-bottom": "12px",
		padding: "10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.035)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, nl = {
	key: 0,
	style: {
		"font-size": "12px",
		"line-height": "1.45",
		color: "rgba(255,255,255,0.82)",
		"white-space": "pre-wrap"
	}
}, rl = { style: {
	display: "grid",
	"grid-template-columns": "repeat(3, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, il = {
	key: 2,
	style: {
		"margin-bottom": "12px",
		padding: "10px",
		"border-radius": "10px",
		background: "rgba(76,175,80,0.07)",
		border: "1px solid rgba(76,175,80,0.22)"
	}
}, al = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "7px"
} }, ol = { style: {
	"font-size": "11px",
	color: "rgba(255,255,255,0.62)"
} }, sl = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "6px"
	}
}, cl = {
	key: 0,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "5px"
	}
}, ll = {
	key: 1,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "5px"
	}
}, ul = {
	key: 1,
	style: {
		"font-size": "12px",
		color: "rgba(255,255,255,0.78)"
	}
}, dl = {
	key: 2,
	style: {
		"margin-top": "7px",
		"font-size": "11px",
		color: "rgba(255,255,255,0.58)"
	}
}, fl = {
	key: 3,
	style: {
		"margin-top": "8px",
		"font-size": "11px",
		color: "rgba(255,255,255,0.62)"
	}
}, pl = { key: 0 }, ml = { style: {
	display: "grid",
	"grid-template-columns": "repeat(3, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, hl = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, gl = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, _l = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, vl = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, yl = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, bl = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, xl = { style: {
	"margin-bottom": "12px",
	padding: "10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.03)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, Sl = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px",
	"margin-bottom": "8px",
	"min-width": "0"
} }, Cl = { style: {
	"min-width": "0",
	flex: "1 1 auto"
} }, wl = ["title"], Tl = ["title"], El = { style: {
	display: "flex",
	gap: "8px",
	"align-items": "center"
} }, Dl = ["placeholder"], Ol = {
	key: 3,
	class: "mjr-workflow-tree-wrap"
}, kl = { class: "mjr-workflow-tree-node" }, Al = { class: "mjr-workflow-tree-node-name" }, jl = {
	key: 0,
	class: "mjr-workflow-tree-node-type"
}, Ml = { class: "mjr-menu-item-hint" }, Nl = {
	key: 0,
	class: "mjr-section-hint"
}, Pl = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px",
	"margin-top": "8px"
} }, Fl = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"align-items": "center"
} }, Il = {
	key: 4,
	style: {
		display: "grid",
		"grid-template-columns": "repeat(auto-fit, minmax(180px, 1fr))",
		gap: "8px",
		"align-items": "stretch",
		"margin-top": "10px",
		"margin-bottom": "10px"
	}
}, Ll = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "2px",
	"min-width": "0"
} }, Rl = { style: {
	"font-size": "13px",
	"font-weight": "600"
} }, zl = { style: {
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, Bl = { style: {
	display: "flex",
	gap: "10px",
	"align-items": "stretch",
	"margin-top": "10px"
} }, Vl = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	gap: "10px",
	"margin-top": "8px",
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, Hl = ["open"], Ul = { style: {
	background: "rgba(0,0,0,0.5)",
	padding: "10px",
	"border-radius": "6px",
	"font-size": "11px",
	overflow: "auto",
	"max-height": "180px",
	margin: "10px 0 0 0",
	color: "#90CAF9",
	"font-family": "'Consolas', 'Monaco', monospace"
} }, Wl = 1, Gl = 8, Kl = 250, ql = /* @__PURE__ */ tt({
	__name: "SidebarWorkflowSection",
	props: { asset: {} },
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
		]), a = V(null), s = V(""), c = V(!1), l = V(!1), d = V(null), p = V(!1), m = V(null), h = V([]), g = V(null), _ = V(!1), v = V(!1), b = V(ue()), S = V({ ...r }), C = V("crosshair"), ee = V(""), te = null, w = null, T = null;
		function ne(e, t, n) {
			let r = Number(e);
			return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
		}
		function re(e) {
			!e || typeof e != "object" || (S.value = {
				...S.value,
				zoom: ne(e.zoom ?? S.value.zoom, Wl, Gl),
				centerX: Number.isFinite(Number(e.centerX)) ? Number(e.centerX) : null,
				centerY: Number.isFinite(Number(e.centerY)) ? Number(e.centerY) : null
			});
		}
		function ie() {
			S.value = { ...r }, ee.value = "";
		}
		function oe(e) {
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
		function se(e) {
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
		function ce(e) {
			let t = oe(e), n = e?.workflow || e?.Workflow || e?.comfy_workflow || t?.workflow || t?.Workflow || t?.comfy_workflow || null;
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
		function le(e) {
			let t = oe(e), n = e?.prompt || e?.Prompt || t?.prompt || t?.Prompt || null;
			if (!n) return null;
			if (typeof n == "object") return se(n) ? n : null;
			if (typeof n == "string") {
				let e = n.trim();
				if (!e) return null;
				try {
					let t = JSON.parse(e);
					return se(t) ? t : null;
				} catch {
					return null;
				}
			}
			return null;
		}
		function ue() {
			try {
				let e = Gt?.()?.workflowMinimap;
				if (e && typeof e == "object") return {
					...n,
					...e
				};
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let e = localStorage?.getItem?.(ae);
				if (!e) return { ...n };
				let t = JSON.parse(e);
				if (!t || typeof t != "object") return { ...n };
				let r = {
					...n,
					...t
				};
				try {
					let e = Gt();
					e.workflowMinimap = {
						...e.workflowMinimap,
						...r
					}, G(e), localStorage?.removeItem?.(ae);
				} catch (e) {
					console.debug?.(e);
				}
				return r;
			} catch {
				return { ...n };
			}
		}
		function de(e) {
			try {
				let t = Gt();
				t.workflowMinimap = {
					...t.workflowMinimap,
					...e
				}, G(t);
			} catch (e) {
				console.debug?.(e);
			}
		}
		let D = P(() => {
			let e = ce(t.asset) || ce(d.value), n = le(t.asset) || le(d.value);
			return !e && !n ? null : e || fa(n);
		}), fe = P(() => String(t.asset?.filepath || t.asset?.path || t.asset?.file_info?.filepath || "").trim()), pe = P(() => String(t.asset?.display_name || t.asset?.name || t.asset?.filename || t.asset?.title || "Workflow").trim()), me = P(() => String(t.asset?.task || t.asset?.workflow_task || "").trim()), he = P(() => String(t.asset?.model_family || t.asset?.workflow_model_family || "").trim()), _e = P(() => String(t.asset?.provider || t.asset?.workflow_provider || "").trim()), ve = P(() => String(t.asset?.runs_on || t.asset?.runsOn || "").trim().toLowerCase()), ye = P(() => {
			let e = ve.value, t = _e.value;
			return e === "api" && t ? `API · ${t}` : e ? t && t.toLowerCase() !== e ? `${e} · ${t}` : e : t;
		}), be = P(() => String(t.asset?.notes || "").trim()), xe = P(() => [
			t.asset?.detected_task ? `detected: ${t.asset.detected_task}` : "",
			t.asset?.detected_model_family ? t.asset.detected_model_family : "",
			t.asset?.detected_provider ? t.asset.detected_provider : ""
		].filter(Boolean).join(" · ")), Ce = P(() => A(t.asset?.missing_nodes || t.asset?.missingNodes)), we = P(() => A(t.asset?.missing_models || t.asset?.missingModels)), Te = P(() => A(t.asset?.tags || t.asset?.workflow_tags || t.asset?.tags_json)), Ee = P(() => Te.value.slice(0, 3)), De = P(() => Math.max(0, Te.value.length - Ee.value.length)), Oe = P(() => A(m.value?.missing_nodes)), ke = P(() => A(m.value?.missing_models)), Ae = P(() => A(m.value?.warnings)), je = P(() => {
			let e = m.value;
			return e ? `${Number(e.node_count || 0)} nodes | ${Number(e.subgraph_count || 0)} subgraphs | ${Array.isArray(e.required_nodes) ? e.required_nodes.length : 0} node types` : "";
		}), Me = P(() => {
			let e = h.value?.[0];
			return e ? String(e.filename || "").replace(/\.json$/i, "") : "";
		}), Ne = P(() => {
			let e = g.value;
			return e ? `${Number(e.changed?.length || 0)} changed | ${Number(e.added?.length || 0)} added | ${Number(e.removed?.length || 0)} removed` : "";
		}), Pe = P(() => {
			let e = Number(t.asset?.usage_count || t.asset?.usageCount || 0);
			return !Number.isFinite(e) || e <= 0 ? "" : `${Math.floor(e)} use${e === 1 ? "" : "s"}`;
		}), Fe = P(() => Re(t.asset?.last_loaded_at || t.asset?.lastLoadedAt)), k = P(() => Re(t.asset?.mtime || t.asset?.modified_at || t.asset?.updated_at)), Ie = P(() => {
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
			}), Fe.value && e.push({
				key: "last-loaded",
				label: `Loaded ${Fe.value}`,
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
		function Le(e) {
			let t = "display:inline-flex;align-items:center;gap:5px;max-width:100%;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:750;line-height:1.1;overflow:hidden";
			return e === "favorite" ? `${t};background:rgba(255,193,7,0.15);border:1px solid rgba(255,193,7,0.34);color:#ffe082` : e === "usage" ? `${t};background:rgba(33,150,243,0.14);border:1px solid rgba(33,150,243,0.30);color:#90caf9` : e === "loaded" ? `${t};background:rgba(76,175,80,0.13);border:1px solid rgba(76,175,80,0.28);color:#a5d6a7` : `${t};background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.14);color:rgba(255,255,255,0.82)`;
		}
		function A(e) {
			if (Array.isArray(e)) return e.map((e) => String(e || "").trim()).filter(Boolean);
			if (typeof e == "string") {
				let t = e.trim();
				if (!t) return [];
				try {
					let e = JSON.parse(t);
					if (Array.isArray(e)) return A(e);
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
			if (D.value) return;
			let e = fe.value;
			if (e && !l.value) {
				l.value = !0;
				try {
					let t = await y(e, { timeoutMs: 25e3 });
					if (!t?.ok) return;
					let n = t?.data?.workflow || t?.workflow || null, r = t?.data?.prompt || t?.prompt || null;
					if (!n && !r) return;
					d.value = {
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
		let Be = P(() => t.asset?.has_generation_data ? "Complete" : "Partial"), He = P(() => D.value ? JSON.stringify(D.value, null, 2) : ""), Ue = P(() => String(t.asset?.category || t.asset?.subfolder || t.asset?.folder || "").trim().replace(/^\/+|\/+$/g, "")), We = P(() => Ue.value ? Ue.value.split(/[\\/]+/).filter(Boolean) : []), Ge = P(() => We.value.at(-1) || Ue.value || "Root"), Ke = P(() => We.value.slice(-1));
		function qe(e, t) {
			let n = e?.id ?? e?.key ?? t + 1;
			return String(e?.title || e?._meta?.title || e?.type || e?.class_type || e?.name || `Node ${n}`);
		}
		function Je(e) {
			return String(e?.type || e?.class_type || e?.name || "").trim();
		}
		function tt() {
			s.value = Ue.value;
		}
		async function rt() {
			let e = String(t.asset?.filepath || t.asset?.path || t.asset?.file_info?.filepath || "").trim();
			if (!e) {
				E(O("toast.workflowMissingPath", "Workflow file path is missing."), "error");
				return;
			}
			let n = String(s.value || "").trim();
			if (n !== Ue.value) {
				c.value = !0;
				try {
					let t = await f({
						filepath: e,
						category: n
					}, { timeoutMs: 3e4 });
					if (!t?.ok) {
						E(t?.error || O("toast.workflowMoveFailed", "Failed to move workflow."), "error");
						return;
					}
					s.value = String(t?.data?.workflow?.category || n || "").trim(), E(O("toast.workflowCategoryUpdated", "Workflow category updated"), "success", 1800);
				} catch {
					E(O("toast.workflowMoveFailed", "Failed to move workflow."), "error");
				} finally {
					c.value = !1;
				}
			}
		}
		async function at() {
			let e = fe.value;
			if (!e) {
				E(O("toast.workflowMissingPath", "Workflow file path is missing."), "error");
				return;
			}
			let n = await Se({
				filepath: e,
				limit: 12
			}, { timeoutMs: 15e3 });
			if (!n?.ok) {
				E(n?.error || O("toast.workflowLoadFailed", "Failed to load workflow."), "error");
				return;
			}
			let r = Array.isArray(n.data) ? n.data : [];
			if (!r.length) {
				E(O("toast.workflowThumbnailNoCandidates", "No linked outputs are available for this workflow yet."), "warning", 2600);
				return;
			}
			let i = await ma({
				title: O("ctx.setWorkflowThumbnail", "Set workflow thumbnail"),
				workflow: t.asset,
				items: r
			});
			if (!i?.filepath) return;
			let a = await u({
				filepath: e,
				source_filepath: i.filepath
			}, { timeoutMs: 3e4 });
			if (!a?.ok) {
				E(a?.error || O("toast.workflowSaveFailed", "Failed to save workflow."), "error");
				return;
			}
			E(O("toast.workflowUpdated", "Workflow updated"), "success", 1800), window?.dispatchEvent?.(new CustomEvent("mjr:reload-grid", { detail: { reason: "workflow-thumbnail-sidebar" } }));
		}
		async function ot() {
			if (await ze(), !D.value) {
				E(O("toast.workflowLoadFailed", "Failed to load workflow."), "error");
				return;
			}
			try {
				await Ye.openAssets({
					assets: [{
						...t.asset,
						workflow: D.value,
						Workflow: D.value
					}],
					index: 0,
					mode: "graph"
				});
			} catch (e) {
				console.debug?.(e), E(O("toast.workflowLoadFailed", "Failed to load workflow."), "error");
			}
		}
		async function st() {
			let e = fe.value;
			if (!e) {
				E(O("toast.workflowMissingPath", "Workflow file path is missing."), "error");
				return;
			}
			p.value = !0, m.value = null, h.value = [], g.value = null;
			try {
				let [t, n] = await Promise.all([o(e, { timeoutMs: 2e4 }), x(e, { timeoutMs: 15e3 })]);
				if (!t?.ok) {
					E(t?.error || O("toast.workflowLoadFailed", "Failed to load workflow."), "error");
					return;
				}
				m.value = t.data || {}, h.value = Array.isArray(n?.data?.versions) ? n.data.versions : [];
				let r = h.value[0];
				if (r?.filepath) {
					let t = await ge(e, r.filepath, { timeoutMs: 15e3 });
					t?.ok && (g.value = t.data || null);
				}
			} catch (e) {
				console.debug?.(e), E(O("toast.workflowLoadFailed", "Failed to load workflow."), "error");
			} finally {
				p.value = !1;
			}
		}
		let ct = P(() => (Array.isArray(D.value?.nodes) ? D.value.nodes : []).slice(0, Kl).map((e, t) => {
			let n = e?.id ?? e?.key ?? t + 1, r = Je(e);
			return {
				key: String(n),
				label: qe(e, t),
				icon: "pi pi-circle-fill",
				data: {
					id: n,
					type: r
				}
			};
		})), lt = P(() => Math.max(0, Number(ut.value.nodes || 0) - ct.value.length)), ut = P(() => {
			let e = D.value;
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
		}), dt = P(() => {
			let e = String(b.value?.size || "comfortable");
			return i.find((t) => t.key === e) || i[1];
		}), ft = P(() => `${dt.value.height}px`), pt = P(() => [
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
		function ht() {
			let e = a.value, t = D.value;
			if (!e || !t) return;
			let n = Math.max(1, e.clientWidth || 320), r = Math.max(1, e.clientHeight || 120), i = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
			e.width = Math.floor(n * i), e.height = Math.floor(r * i);
			let o = e.getContext("2d");
			o && o.setTransform(i, 0, 0, i, 0, 0), w = na(e, t, {
				...b.value,
				view: S.value
			}) || null, re(w?.resolvedView);
		}
		function gt(e) {
			Ve(e);
		}
		function _t(e) {
			let t = a.value;
			if (!t) return null;
			let n = t.getBoundingClientRect?.();
			return n ? {
				x: Number(e?.clientX) - n.left,
				y: Number(e?.clientY) - n.top
			} : null;
		}
		function vt(e) {
			let t = _t(e);
			return !t || !w?.canvasToWorld ? null : {
				local: t,
				world: w.canvasToWorld(t.x, t.y)
			};
		}
		function yt(e) {
			let t = _t(e), n = t && w?.hitTestNode ? w.hitTestNode(t.x, t.y) : null, r = n?.id !== null && n?.id !== void 0 ? String(n.id) : null, i = S.value.hoveredNodeId !== null && S.value.hoveredNodeId !== void 0 ? String(S.value.hoveredNodeId) : null;
			ee.value = n?.label || "", r !== i && (S.value = {
				...S.value,
				hoveredNodeId: r
			}, ht());
		}
		function bt(e) {
			e && (gt(e), S.value = {
				...S.value,
				centerX: Number(e.x),
				centerY: Number(e.y)
			}, ht());
		}
		function xt(e) {
			if (Number(e?.button ?? 0) !== 0) return;
			let t = vt(e);
			t && (T = e.pointerId ?? 1, C.value = "grabbing", a.value?.setPointerCapture?.(T), bt(t.world), yt(e), e.preventDefault?.(), e.stopPropagation?.());
		}
		function St(e) {
			if (T !== null && e.pointerId === T) {
				let t = vt(e);
				t && bt(t.world), e.preventDefault?.(), e.stopPropagation?.();
				return;
			}
			yt(e);
		}
		function Ct(e) {
			T !== null && e?.pointerId === T && (a.value?.releasePointerCapture?.(T), T = null, C.value = "crosshair"), e?.type === "pointerleave" && (ee.value = "", S.value.hoveredNodeId !== null && (S.value = {
				...S.value,
				hoveredNodeId: null
			}, ht()));
		}
		function wt(e) {
			let t = vt(e), n = w?.resolvedView;
			if (!t || !n) return;
			let r = ne(Number(e?.deltaY) || 0, -240, 240), i = Math.exp(-r * .0025), a = ne((Number(S.value.zoom) || 1) * i, Wl, Gl);
			if (Math.abs(a - (Number(S.value.zoom) || 1)) < .001) {
				e.preventDefault?.(), e.stopPropagation?.();
				return;
			}
			let o = Math.max(1, Number(w?.bounds?.width || 1) / a), s = Math.max(1, Number(w?.bounds?.height || 1) / a), c = ne((Number(t.world.x) - Number(n.viewMinX || 0)) / Math.max(1, Number(n.visibleW || 1)), 0, 1), l = ne((Number(t.world.y) - Number(n.viewMinY || 0)) / Math.max(1, Number(n.visibleH || 1)), 0, 1);
			S.value = {
				...S.value,
				zoom: a,
				centerX: Number(t.world.x) + (.5 - c) * o,
				centerY: Number(t.world.y) + (.5 - l) * s
			}, ht(), yt(e), e.preventDefault?.(), e.stopPropagation?.();
		}
		function Ot(e) {
			let t = vt(e);
			ie(), t && gt(t.world), ht(), e.preventDefault?.(), e.stopPropagation?.();
		}
		function kt(e) {
			b.value = {
				...b.value,
				[e]: !b.value?.[e]
			}, de(b.value);
		}
		function At(e) {
			i.some((t) => t.key === e) && (b.value = {
				...b.value,
				size: e
			}, de(b.value));
		}
		return Dt(() => {
			a.value && typeof ResizeObserver == "function" && (te = new ResizeObserver(() => ht()), te.observe(a.value)), tt(), ze(), ht();
		}), et(D, () => {
			ie(), ht();
		}, { flush: "post" }), et(fe, () => {
			d.value = null, ze();
		}, { immediate: !0 }), et(Ue, () => {
			tt();
		}), et(b, () => {
			ht();
		}, {
			deep: !0,
			flush: "post"
		}), et(_, () => {
			ht();
		}, { flush: "post" }), nt(() => {
			try {
				te?.disconnect?.();
			} catch (e) {
				console.debug?.(e);
			}
			te = null, T = null;
		}), (e, t) => {
			let n = Qe("MButton"), r = Qe("MTree");
			return D.value ? (I(), z("div", Nc, [
				t[18] ||= M("div", { style: {
					"font-size": "13px",
					"font-weight": "600",
					color: "var(--fg-color, #eaeaea)",
					"margin-bottom": "12px",
					"text-transform": "uppercase",
					"letter-spacing": "0.5px"
				} }, " ComfyUI Workflow ", -1),
				M("div", Pc, [
					M("div", Fc, R(pe.value), 1),
					fe.value ? (I(), z("div", {
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
					}, R(fe.value), 9, Ic)) : N("", !0),
					Ie.value.length ? (I(), z("div", Lc, [(I(!0), z(j, null, F(Ie.value, (e) => (I(), z("span", {
						key: e.key,
						style: L(Le(e.tone)),
						title: e.label
					}, [M("i", {
						class: Tt(e.icon),
						style: {
							"font-size": "10px",
							flex: "0 0 auto"
						}
					}, null, 2), M("span", zc, R(e.label), 1)], 12, Rc))), 128))])) : N("", !0)
				]),
				M("div", Bc, [M("div", Vc, R(Be.value), 1), ut.value.source ? (I(), z("div", Hc, R(ut.value.source), 1)) : N("", !0)]),
				M("div", Uc, [
					me.value ? (I(), z("div", Wc, [t[3] ||= M("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Task", -1), M("div", Gc, R(me.value), 1)])) : N("", !0),
					he.value ? (I(), z("div", Kc, [t[4] ||= M("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Model", -1), M("div", qc, R(he.value), 1)])) : N("", !0),
					ye.value ? (I(), z("div", Jc, [t[5] ||= M("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Runs on", -1), M("div", Yc, R(ye.value), 1)])) : N("", !0),
					Pe.value || k.value ? (I(), z("div", Xc, [
						t[6] ||= M("div", { style: {
							"font-size": "10px",
							"font-weight": "700",
							color: "rgba(255,255,255,0.55)",
							"text-transform": "uppercase",
							"letter-spacing": "0.4px"
						} }, "Library", -1),
						M("div", Zc, R(Pe.value || k.value), 1),
						Pe.value && k.value ? (I(), z("div", Qc, R(k.value), 1)) : N("", !0)
					])) : N("", !0)
				]),
				Ce.value.length || we.value.length ? (I(), z("div", $c, [
					t[7] ||= M("div", { style: {
						"font-size": "10px",
						"font-weight": "800",
						color: "#ef9a9a",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px",
						"margin-bottom": "6px"
					} }, "Missing dependencies", -1),
					Ce.value.length ? (I(), z("div", {
						key: 0,
						style: L({
							display: "flex",
							flexWrap: "wrap",
							gap: "5px",
							marginBottom: we.value.length ? "7px" : "0"
						})
					}, [(I(!0), z(j, null, F(Ce.value, (e) => (I(), z("span", {
						key: `node-${e}`,
						style: {
							padding: "3px 7px",
							"border-radius": "999px",
							background: "rgba(244,67,54,0.16)",
							"font-size": "10px",
							"font-weight": "700",
							color: "#ffcdd2"
						}
					}, R(e), 1))), 128))], 4)) : N("", !0),
					we.value.length ? (I(), z("div", el, [(I(!0), z(j, null, F(we.value, (e) => (I(), z("span", {
						key: `model-${e}`,
						style: {
							padding: "3px 7px",
							"border-radius": "999px",
							background: "rgba(255,152,0,0.16)",
							"font-size": "10px",
							"font-weight": "700",
							color: "#ffe0b2"
						}
					}, R(e), 1))), 128))])) : N("", !0)
				])) : N("", !0),
				be.value || xe.value ? (I(), z("div", tl, [be.value ? (I(), z("div", nl, R(be.value), 1)) : N("", !0), xe.value ? (I(), z("div", {
					key: 1,
					style: L({
						fontSize: "11px",
						color: "rgba(255,255,255,0.48)",
						marginTop: be.value ? "7px" : "0"
					})
				}, R(xe.value), 5)) : N("", !0)])) : N("", !0),
				M("div", rl, [
					mt(n, {
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
						default: $e(() => [t[8] ||= M("i", { class: "pi pi-image" }, null, -1), M("span", null, R(B(O)("ctx.setWorkflowThumbnail", "Set workflow thumbnail")), 1)]),
						_: 1
					}),
					mt(n, {
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
						default: $e(() => [t[9] ||= M("i", { class: "pi pi-search" }, null, -1), M("span", null, R(B(O)("ctx.inspect", "Inspect")), 1)]),
						_: 1
					}),
					mt(n, {
						type: "button",
						severity: "secondary",
						text: "",
						rounded: "",
						disabled: p.value,
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
						default: $e(() => [M("i", { class: Tt(p.value ? "pi pi-spin pi-spinner" : "pi pi-check-circle") }, null, 2), M("span", null, R(p.value ? "Checking" : "Validate"), 1)]),
						_: 1
					}, 8, ["disabled"])
				]),
				m.value ? (I(), z("div", il, [
					M("div", al, [t[10] ||= M("div", { style: {
						"font-size": "10px",
						"font-weight": "800",
						color: "#a5d6a7",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Workflow diagnostics", -1), M("div", ol, R(je.value), 1)]),
					Oe.value.length || ke.value.length ? (I(), z("div", sl, [Oe.value.length ? (I(), z("div", cl, [(I(!0), z(j, null, F(Oe.value, (e) => (I(), z("span", {
						key: `diag-node-${e}`,
						style: {
							padding: "3px 7px",
							"border-radius": "999px",
							background: "rgba(244,67,54,0.16)",
							"font-size": "10px",
							"font-weight": "700",
							color: "#ffcdd2"
						}
					}, " Missing node: " + R(e), 1))), 128))])) : N("", !0), ke.value.length ? (I(), z("div", ll, [(I(!0), z(j, null, F(ke.value, (e) => (I(), z("span", {
						key: `diag-model-${e}`,
						style: {
							padding: "3px 7px",
							"border-radius": "999px",
							background: "rgba(255,152,0,0.16)",
							"font-size": "10px",
							"font-weight": "700",
							color: "#ffe0b2"
						}
					}, " Missing model: " + R(e), 1))), 128))])) : N("", !0)])) : (I(), z("div", ul, " No missing dependencies detected by the current ComfyUI runtime. ")),
					Ae.value.length ? (I(), z("div", dl, R(Ae.value.join(" | ")), 1)) : N("", !0),
					Me.value || Ne.value ? (I(), z("div", fl, [Xe(" Latest version: " + R(Me.value || "none"), 1), Ne.value ? (I(), z("span", pl, " | Diff: " + R(Ne.value), 1)) : N("", !0)])) : N("", !0)
				])) : N("", !0),
				M("div", ml, [
					M("div", hl, [t[11] ||= M("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Nodes", -1), M("div", gl, R(ut.value.nodes), 1)]),
					M("div", _l, [t[12] ||= M("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Links", -1), M("div", vl, R(ut.value.links), 1)]),
					M("div", yl, [t[13] ||= M("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Groups", -1), M("div", bl, R(ut.value.groups), 1)])
				]),
				M("div", xl, [M("div", Sl, [M("div", Cl, [t[14] ||= M("div", { style: {
					"font-size": "10px",
					"font-weight": "700",
					color: "rgba(255,255,255,0.55)",
					"text-transform": "uppercase",
					"letter-spacing": "0.4px"
				} }, "Category", -1), M("div", {
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
				}, R(Ge.value), 9, wl)]), Ke.value.length ? (I(), z("div", {
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
				}, [(I(!0), z(j, null, F(Ke.value, (e) => (I(), z("span", {
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
				}, R(e), 1))), 128))], 8, Tl)) : N("", !0)]), M("div", El, [it(M("input", {
					"onUpdate:modelValue": t[0] ||= (e) => s.value = e,
					type: "text",
					placeholder: B(O)("dialog.workflowCategory", "Workflow category"),
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
				}, null, 8, Dl), [[Et, s.value]]), mt(n, {
					type: "button",
					severity: "secondary",
					text: "",
					rounded: "",
					disabled: c.value,
					style: L({
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
					onClick: rt
				}, {
					default: $e(() => [Xe(R(c.value ? "Saving..." : "Move"), 1)]),
					_: 1
				}, 8, ["disabled", "style"])])]),
				ct.value.length ? (I(), z("div", Ol, [
					t[15] ||= M("div", { class: "mjr-section-title" }, " Workflow Nodes ", -1),
					mt(r, {
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
						default: $e(({ node: e }) => [M("span", kl, [
							M("span", Al, R(e.label), 1),
							e.data?.type ? (I(), z("span", jl, R(e.data.type), 1)) : N("", !0),
							M("span", Ml, "#" + R(e.data?.id), 1)
						])]),
						_: 1
					}, 8, ["value"]),
					lt.value ? (I(), z("div", Nl, " +" + R(lt.value) + " more nodes ", 1)) : N("", !0)
				])) : N("", !0),
				M("div", Pl, [M("div", Fl, [(I(!0), z(j, null, F(B(i), (e) => (I(), Ze(n, {
					key: e.key,
					type: "button",
					severity: "secondary",
					text: "",
					rounded: "",
					title: `${e.label} minimap`,
					style: L({
						appearance: "none",
						border: b.value.size === e.key ? "1px solid rgba(33,150,243,0.55)" : "1px solid rgba(255,255,255,0.12)",
						borderRadius: "999px",
						padding: "4px 10px",
						background: b.value.size === e.key ? "rgba(33,150,243,0.18)" : "rgba(255,255,255,0.04)",
						color: b.value.size === e.key ? "#90CAF9" : "rgba(255,255,255,0.78)",
						fontSize: "11px",
						fontWeight: b.value.size === e.key ? "700" : "600",
						cursor: "pointer"
					}),
					onClick: (t) => At(e.key)
				}, {
					default: $e(() => [Xe(R(e.label), 1)]),
					_: 2
				}, 1032, [
					"title",
					"style",
					"onClick"
				]))), 128))]), mt(n, {
					type: "button",
					class: "mjr-btn mjr-icon-btn",
					severity: "secondary",
					text: "",
					rounded: "",
					title: B(O)("tooltip.minimapSettings", "Minimap settings"),
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
					default: $e(() => [...t[16] ||= [M("i", { class: "pi pi-sliders-h" }, null, -1)]]),
					_: 1
				}, 8, ["title"])]),
				_.value ? (I(), z("div", Il, [(I(!0), z(j, null, F(pt.value, (e) => (I(), Ze(n, {
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
						border: b.value?.[e.key] ? "1px solid rgba(76,175,80,0.40)" : "1px solid rgba(255,255,255,0.12)",
						background: b.value?.[e.key] ? "rgba(76,175,80,0.10)" : "rgba(255,255,255,0.04)",
						cursor: "pointer",
						color: "rgba(255,255,255,0.92)",
						textAlign: "left"
					}),
					onClick: (t) => kt(e.key)
				}, {
					default: $e(() => [
						M("span", { style: L({
							width: "22px",
							height: "22px",
							borderRadius: "6px",
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							background: b.value?.[e.key] ? "rgba(76,175,80,0.95)" : "rgba(255,255,255,0.08)",
							border: b.value?.[e.key] ? "1px solid rgba(76,175,80,0.35)" : "1px solid rgba(255,255,255,0.12)",
							flex: "0 0 auto"
						}) }, [M("i", {
							class: "pi pi-check",
							style: L({
								fontSize: "12px",
								opacity: b.value?.[e.key] ? "1" : "0"
							})
						}, null, 4)], 4),
						M("i", {
							class: Tt(e.iconClass),
							style: {
								"font-size": "18px",
								opacity: "0.9",
								width: "18px"
							}
						}, null, 2),
						M("div", Ll, [M("div", Rl, R(e.label), 1), M("div", zl, R(b.value?.[e.key] ? "On" : "Off"), 1)])
					]),
					_: 2
				}, 1032, ["style", "onClick"]))), 128))])) : N("", !0),
				M("div", Bl, [M("canvas", {
					ref_key: "canvasRef",
					ref: a,
					style: L({
						width: "100%",
						height: ft.value,
						cursor: C.value,
						touchAction: "none",
						borderRadius: "10px",
						marginTop: "0",
						background: "linear-gradient(180deg, rgba(7, 12, 18, 0.95) 0%, rgba(10, 16, 24, 0.92) 100%)",
						border: "1px solid var(--mjr-border, rgba(255,255,255,0.12))",
						boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03)"
					}),
					onPointerdown: xt,
					onPointermove: St,
					onPointerup: Ct,
					onPointercancel: Ct,
					onPointerleave: Ct,
					onWheel: wt,
					onDblclick: Ot
				}, null, 36)]),
				M("div", Vl, [M("span", null, R(ee.value || "Click/drag to navigate | wheel to zoom"), 1), M("span", null, R(Math.round((S.value.zoom || 1) * 100)) + "% | " + R(dt.value.label), 1)]),
				M("details", {
					open: v.value,
					style: { "margin-top": "10px" },
					onToggle: t[2] ||= (e) => v.value = e.target.open
				}, [t[17] ||= M("summary", { style: {
					cursor: "pointer",
					color: "var(--mjr-muted, rgba(255,255,255,0.65))",
					"font-size": "12px",
					"user-select": "none"
				} }, " Show raw JSON ", -1), M("pre", Ul, R(He.value), 1)], 40, Hl)
			])) : N("", !0);
		};
	}
});
//#endregion
export { Gt as $, li as A, Cr as B, Ri as C, Pi as D, Fi as E, Xr as F, Er as G, kr as H, Jr as I, wr as J, Or as K, Fr as L, Si as M, ci as N, wi as O, xi as P, K as Q, Nr as R, Ki as S, Ni as T, Y as U, Mr as V, Tr as W, _r as X, vr as Y, sn as Z, X as _, ja as a, Gi as b, ka as c, wa as d, G as et, Ca as f, pa as g, ma as h, Ra as i, ui as j, Ti as k, Oa as l, ha as m, Mc as n, Ma as o, Ta as p, Ar as q, wo as r, Da as s, ql as t, va as u, na as v, Li as w, Ui as x, fa as y, Pr as z };
