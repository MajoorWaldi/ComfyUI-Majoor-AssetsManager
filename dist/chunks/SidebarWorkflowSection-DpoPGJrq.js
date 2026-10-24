import { $ as e, $t as t, At as n, Bt as r, Ct as i, Dt as a, Et as o, Ft as s, Gt as c, Ht as l, I as u, It as d, K as f, Kt as p, Mt as m, N as h, Nt as g, O as _, Ot as v, Pt as y, Q as b, Qt as x, R as S, Rt as C, S as ee, St as te, T as ne, Tt as w, Ut as T, Vt as E, X as re, Y as D, Yt as ie, Z as ae, Zt as oe, at as se, cn as ce, ct as le, dt as ue, en as de, et as fe, gt as pe, it as me, jt as he, k as ge, kt as _e, lt as ve, nt as ye, ot as be, p as xe, rt as Se, sn as Ce, tt as we, ut as Te, w as Ee, wt as De } from "./viewerRuntimeHosts-BBd8uK6j.js";
import { Ct as Oe, K as ke, N as Ae, T as je, c as Me, d as Ne, f as Pe, h as Fe, j as Ie, l as Le, m as O, o as k, p as Re, pt as ze, s as A, tt as Be, u as Ve, x as He, y as Ue } from "./events-CoI83paj.js";
import { F as We, K as Ge, P as Ke, Y as qe, f as Je, m as Ye, p as Xe } from "./Viewer-DWgaGos-.js";
import { t as Ze } from "./floatingViewerManager-XH4AFW4G.js";
import { A as Qe, C as j, D as $e, E as M, G as et, J as tt, K as nt, N as rt, O as N, R as it, S as at, T as P, U as F, V as I, Y as ot, _ as st, a as ct, b as lt, c as ut, d as dt, dt as L, f as ft, ft as R, g as pt, h as mt, i as ht, j as gt, k as z, l as _t, lt as B, m as vt, n as yt, nt as bt, o as xt, p as St, r as Ct, rt as V, s as wt, t as Tt, u as Et, ut as Dt, y as Ot, z as kt } from "./mjr-primevue-BOf2ACk_.js";
import { t as At } from "./mjr-vue-vendor-BKZZuiuB.js";
import { t as jt } from "./viewerOpenRequest-CwB6clm0.js";
import { a as Mt, i as Nt, n as Pt, o as Ft, r as It, t as Lt } from "./geninfoParser-Bwtqk4p6.js";
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
}, Rt = (e, t, n) => {
	let r = typeof e == "string" ? e.trim() : String(e ?? "");
	return t.includes(r) ? r : n;
}, zt = (e) => e === "__proto__" || e === "prototype" || e === "constructor", Bt = (e, t) => {
	let n = { ...e };
	return !t || typeof t != "object" || Object.keys(t).forEach((r) => {
		if (zt(r)) return;
		let i = t[r];
		i && typeof i == "object" && !Array.isArray(i) ? n[r] = Bt(e[r] || {}, i) : i !== void 0 && (n[r] = i);
	}), n;
}, Vt = Object.freeze({
	small: 80,
	medium: 120,
	large: 180
}), Ht = Object.freeze([
	"small",
	"medium",
	"large"
]), Ut = (e, t) => Math.max(60, Math.min(600, Math.round(U(e, t)))), Wt = (e = {}) => {
	let t = Number(e?.minSize);
	if (Number.isFinite(t)) return Ut(t, A.GRID_MIN_SIZE);
	let n = Rt(String(e?.minSizePreset || "").toLowerCase(), Ht, "");
	return n ? Vt[n] : Ut(e?.minSize, A.GRID_MIN_SIZE);
}, Gt = (e = {}) => Ut(e?.minSize, A.FEED_GRID_MIN_SIZE), Kt = (e) => {
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
		minSizePreset: Kt(A.GRID_MIN_SIZE),
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
}, qt = () => {
	try {
		let e = Fe.get(ce);
		if (!e) return { ...W };
		let t = JSON.parse(e), n = t && typeof t == "object" && Number.isInteger(t.version) && t.data && typeof t.data == "object";
		if (!n && (!t || typeof t != "object" || Array.isArray(t))) return { ...W };
		if (n && Number(t.version) > 1) return console.warn("[Majoor] settings schema version is newer than this build, using defaults"), { ...W };
		let r = n ? t.data : t, i = /* @__PURE__ */ new Set(/* @__PURE__ */ "debug.grid.infiniteScroll.siblings.autoScan.scan.watcher.status.viewer.rtHydrate.observability.feed.sidebar.probeBackend.i18n.paths.db.ratingTagsSync.cache.search.ai.executionGrouping.workflowMinimap.ui.security.safety".split(".")), a = {};
		if (r && typeof r == "object") for (let [e, t] of Object.entries(r)) i.has(e) && (a[e] = t);
		let o = Bt(W, a);
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
		if (!Fe.set("mjrSettings", JSON.stringify(n))) throw Error("SettingsStore rejected the write");
	} catch (e) {
		console.warn("[Majoor] settings save failed", e);
		try {
			let e = Date.now();
			e - (Number(window?._mjrSettingsSaveFailAt || 0) || 0) > 3e4 && (window._mjrSettingsSaveFailAt = e, Ge(O("dialog.settingsSaveFailed", "Majoor: Failed to save settings (browser storage full or blocked).")));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			qe("mjr-settings-save-failed", { error: String(e?.message || e || "") }, { warnPrefix: "[Majoor]" });
		} catch (e) {
			console.debug?.(e);
		}
	}
}, K = (e) => {
	let t = Number(A.MAX_PAGE_SIZE) || 2e3, n = Math.max(50, Math.min(t, Number(e.grid?.pageSize) || A.DEFAULT_PAGE_SIZE));
	k.DEFAULT_PAGE_SIZE = n, k.AUTO_SCAN_ON_STARTUP = !!e.autoScan?.onStartup, k.EXECUTION_GROUPING_ENABLED = !!(e.executionGrouping?.enabled ?? A.EXECUTION_GROUPING_ENABLED), k.STATUS_POLL_INTERVAL = Math.max(1e3, Number(e.status?.pollInterval) || A.STATUS_POLL_INTERVAL), k.DEBUG_SAFE_CALL = !!e.debug?.safeCall, k.DEBUG_SAFE_LISTENERS = !!e.debug?.safeListeners, k.DEBUG_VIEWER = !!e.debug?.viewer, k.GRID_MIN_SIZE = Wt(e.grid), k.FEED_GRID_MIN_SIZE = Gt(e.feed), k.GRID_GAP = Math.max(0, Math.min(40, Math.round(U(e.grid?.gap, A.GRID_GAP)))), k.GRID_SHOW_BADGES_EXTENSION = !!(e.grid?.showExtBadge ?? A.GRID_SHOW_BADGES_EXTENSION), k.GRID_SHOW_BADGES_RATING = !!(e.grid?.showRatingBadge ?? A.GRID_SHOW_BADGES_RATING), k.GRID_SHOW_BADGES_TAGS = !!(e.grid?.showTagsBadge ?? A.GRID_SHOW_BADGES_TAGS), k.GRID_SHOW_DETAILS = !!(e.grid?.showDetails ?? A.GRID_SHOW_DETAILS), k.GRID_SHOW_DETAILS_FILENAME = !!(e.grid?.showFilename ?? A.GRID_SHOW_DETAILS_FILENAME), k.GRID_SHOW_DETAILS_DATE = !!(e.grid?.showDate ?? A.GRID_SHOW_DETAILS_DATE), k.GRID_SHOW_DETAILS_DIMENSIONS = !!(e.grid?.showDimensions ?? A.GRID_SHOW_DETAILS_DIMENSIONS), k.GRID_SHOW_DETAILS_GENTIME = !!(e.grid?.showGenTime ?? A.GRID_SHOW_DETAILS_GENTIME), k.GRID_SHOW_HOVER_INFO = !!(e.grid?.showHoverInfo ?? A.GRID_SHOW_HOVER_INFO), k.GRID_SHOW_WORKFLOW_DOT = !!(e.grid?.showWorkflowDot ?? A.GRID_SHOW_WORKFLOW_DOT);
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
async function Jt() {
	try {
		let e = await se();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = qt();
		if (n.security = n.security || {}, n.security.safeMode = H(t.safe_mode, n.security.safeMode), n.security.allowWrite = H(t.allow_write, n.security.allowWrite), n.security.requireAuth = H(t.require_auth, n.security.requireAuth), n.security.allowRemoteWrite = H(t.allow_remote_write, n.security.allowRemoteWrite), n.security.allowInsecureTokenTransport = H(t.allow_insecure_token_transport, n.security.allowInsecureTokenTransport), n.security.allowDelete = H(t.allow_delete, n.security.allowDelete), n.security.allowRename = H(t.allow_rename, n.security.allowRename), n.security.allowOpenInFolder = H(t.allow_open_in_folder, n.security.allowOpenInFolder), n.security.allowResetIndex = H(t.allow_reset_index, n.security.allowResetIndex), n.security.tokenConfigured = H(t.token_configured, n.security.tokenConfigured), n.security.tokenHint = String(t.token_hint || "").trim(), !String(n.security.apiToken || "").trim()) try {
			let e = await S(), t = String(e?.data?.token || "").trim();
			e?.ok && t && x(t);
		} catch (e) {
			console.debug?.(e);
		}
		G(n), K(n), qe("mjr-settings-changed", { key: "security" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend security settings", e);
	}
}
async function Yt() {
	try {
		let e = await le();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = qt();
		n.ai = n.ai || {}, n.ai.vectorSearchEnabled = H(t.enabled, n.ai.vectorSearchEnabled ?? !0), n.ai.vectorCaptionOnIndex = H(t.caption_on_index ?? t.captionOnIndex, n.ai.vectorCaptionOnIndex ?? !1), n.ai.vectorIndexOnScan = H(t.index_on_scan ?? t.indexOnScan, n.ai.vectorIndexOnScan ?? !1), n.ai.vectorUnloadAfterUse = H(t.unload_after_use ?? t.unloadAfterUse, n.ai.vectorUnloadAfterUse ?? !1), n.ai.vectorConcurrency = Math.max(1, Math.min(16, Math.floor(Number(t.concurrency ?? n.ai.vectorConcurrency ?? 1) || 1))), G(n), K(n), qe("mjr-settings-changed", { key: "ai.vectorSearch" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend vector search settings", e);
	}
}
async function Xt() {
	try {
		let e = await D();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = qt();
		n.executionGrouping = n.executionGrouping || {}, n.executionGrouping.enabled = H(t.enabled, n.executionGrouping.enabled ?? A.EXECUTION_GROUPING_ENABLED), G(n), K(n), qe("mjr-settings-changed", { key: "executionGrouping.enabled" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend execution grouping settings", e);
	}
}
//#endregion
//#region ui/app/settings/settingsRuntime.ts
var Zt = "mjr-runtime-status-dashboard", Qt = 3e4;
function $t() {
	try {
		let e = qt(), t = String(e?.observability?.runtimeDashboardMode || W.observability.runtimeDashboardMode);
		return [
			"autoHide30",
			"always",
			"hidden"
		].includes(t) ? t : "autoHide30";
	} catch {
		return "autoHide30";
	}
}
function en() {
	try {
		document.getElementById(Zt)?.remove?.();
	} catch (e) {
		console.debug?.(e);
	}
}
function tn() {
	try {
		window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ && (clearTimeout(window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__), window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ = null);
	} catch (e) {
		console.debug?.(e);
	}
}
function nn(e, t) {
	let n = t === "auth" ? "__mjrAuthLine" : "__mjrMetricsLine";
	if (e?.[n]) return e[n];
	let r = document.createElement("div");
	return r.style.whiteSpace = "nowrap", r.style.lineHeight = "1.35", t === "auth" && (r.style.marginTop = "4px", r.style.fontWeight = "600"), e.appendChild(r), e[n] = r, r;
}
function rn(e) {
	let t = String(e?.token_hint || "").trim(), n = oe(), r = t || (n ? "(session)" : ""), i = e?.allow_write !== !1, a = e?.require_auth === !0, o = e?.token_configured === !0;
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
function an() {
	try {
		if ($t() === "hidden" || window.__MJR_RUNTIME_STATUS_HIDDEN__) return en(), null;
		let e = document.querySelector(".mjr-assets-manager.mjr-am-container"), t = document.getElementById(Zt);
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
		let n = document.getElementById(Zt);
		return n ? n.parentElement !== e && e.appendChild(n) : (n = document.createElement("div"), n.id = Zt, n.style.position = "absolute", n.style.bottom = "10px", n.style.right = "10px", n.style.zIndex = "9999", n.style.padding = "6px 10px", n.style.borderRadius = "10px", n.style.border = "1px solid rgba(255,255,255,0.16)", n.style.background = "rgba(0,0,0,0.45)", n.style.backdropFilter = "blur(4px)", n.style.color = "var(--content-fg, #fff)", n.style.fontSize = "11px", n.style.pointerEvents = "none", n.style.display = "flex", n.style.flexDirection = "column", e.appendChild(n)), n;
	} catch {
		return null;
	}
}
async function on() {
	let e = an();
	if (!e) return !1;
	let t = nn(e, "metrics"), n = nn(e, "auth");
	try {
		let [r, i] = await Promise.all([me(), se()]), a = O("runtime.unavailable", "Runtime: unavailable");
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
		let o = rn(i?.data?.prefs || null);
		return n.textContent = o.text, n.style.color = o.color, e.title = `${a}\n${o.text}`, !0;
	} catch {
		return t.textContent = O("runtime.unavailable", "Runtime: unavailable"), n.textContent = O("runtime.writeAuthUnknown", "Write auth: unknown"), n.style.color = "#c8ced8", e.title = `${O("runtime.unavailable", "Runtime: unavailable")}\n${n.textContent}`, !0;
	}
}
function sn() {
	try {
		let e = $t();
		if (e === "hidden") {
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = !0, tn(), en();
			return;
		}
		window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__ || (window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__ = (e) => {
			if (e?.detail?.key !== "observability.runtimeDashboardMode") return;
			let t = $t();
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = t === "hidden", tn(), en(), t !== "hidden" && sn();
		}, window.addEventListener?.("mjr-settings-changed", window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__)), window.__MJR_RUNTIME_STATUS_HIDDEN__ = !1, tn(), e === "autoHide30" && (window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ = setTimeout(() => {
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = !0, en();
		}, Qt)), on().catch(() => {}), window.__MJR_RUNTIME_STATUS_INFLIGHT__ ?? (window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !1), window.__MJR_RUNTIME_STATUS_MISS_COUNT__ ?? (window.__MJR_RUNTIME_STATUS_MISS_COUNT__ = 0), window.__MJR_RUNTIME_STATUS_INTERVAL__ || (window.__MJR_RUNTIME_STATUS_INTERVAL__ = setInterval(() => {
			window.__MJR_RUNTIME_STATUS_INFLIGHT__ || (window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !0, on().then((e) => {
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
var cn = 300;
function ln(e, t = cn) {
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
var q = "Majoor", un = "Majoor Assets Manager";
function dn(e, t, n) {
	let r = (e, t) => [
		un,
		e,
		t
	], i = (e) => [
		un,
		O("cat.cards", "Cards"),
		e
	], a = (e) => [
		un,
		O("cat.badges", "Badges"),
		e
	], o = (e) => [
		un,
		O("cat.badges", "Badges"),
		e
	], s = (e, t) => {
		let n = String(e || "").trim();
		return /^[0-9a-fA-F]{6}$/.test(n) && (n = `#${n}`), /^#[0-9a-fA-F]{6}$/.test(n) ? n.toUpperCase() : t;
	};
	t.grid?.minSizePreset || (t.grid = t.grid || {}, t.grid.minSizePreset = Kt(t.grid.minSize), G(t)), e({
		id: `${q}.Cards.ThumbSize`,
		category: i(O("setting.grid.cardSize.group", "Card size")),
		name: O("setting.grid.cardSize.name", "Majoor: Card Size"),
		tooltip: O("setting.grid.cardSize.desc", "Choose the card size preset used by the grid layout."),
		type: "combo",
		defaultValue: (() => {
			let e = Rt(String(t.grid?.minSizePreset || "").toLowerCase(), Ht, Kt(t.grid?.minSize)), n = {
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
			r === i || r === "small" || r === "petit" ? s = "small" : r === o || r === "large" || r === "grand" ? s = "large" : (r === a || r === "medium" || r === "moyen") && (s = "medium"), t.grid.minSizePreset = s, t.grid.minSize = Vt[s], G(t), K(t), n("grid.minSizePreset");
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
			t.grid.minSize = r, t.grid.minSizePreset = Kt(r), G(t), K(t), n("grid.minSize");
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
var fn = "Majoor", pn = "Majoor Assets Manager";
function mn(e, n, r) {
	let a = (e, t) => [
		pn,
		e,
		t
	], o = (e) => a(O("cat.viewer", "Viewer"), e), s = (e) => a(O("cat.floatingViewer", "Floating Viewer"), e);
	e({
		id: `${fn}.Viewer.AllowPanAtZoom1`,
		category: o(O("setting.viewer.pan.name").replace("Majoor: ", "")),
		name: O("setting.viewer.pan.name"),
		tooltip: O("setting.viewer.pan.desc"),
		type: "boolean",
		defaultValue: !!n.viewer?.allowPanAtZoom1,
		onChange: (e) => {
			n.viewer = n.viewer || {}, n.viewer.allowPanAtZoom1 = !!e, G(n), K(n), r("viewer.allowPanAtZoom1");
		}
	}), e({
		id: `${fn}.Viewer.DisableWebGL`,
		category: o("Disable WebGL Video"),
		name: "Disable WebGL Video",
		tooltip: "Use CPU rendering (Canvas 2D) for video playback. Fixes 'black screen' issues on incompatible hardware/browsers.",
		type: "boolean",
		defaultValue: !!n.viewer?.disableWebGL,
		onChange: (e) => {
			n.viewer = n.viewer || {}, n.viewer.disableWebGL = !!e, G(n), K(n), r("viewer.disableWebGL");
		}
	}), e({
		id: `${fn}.Viewer.PauseDuringExecution`,
		category: o(O("setting.viewer.pauseExecution.name").replace("Majoor: ", "")),
		name: O("setting.viewer.pauseExecution.name"),
		tooltip: O("setting.viewer.pauseExecution.desc"),
		type: "boolean",
		defaultValue: !!n.viewer?.pauseDuringExecution,
		onChange: (e) => {
			n.viewer = n.viewer || {}, n.viewer.pauseDuringExecution = !!e, G(n), K(n), r("viewer.pauseDuringExecution");
		}
	}), e({
		id: `${fn}.Viewer.FloatingPauseDuringExecution`,
		category: s(O("setting.viewer.floatingPauseExecution.name").replace("Majoor: ", "")),
		name: O("setting.viewer.floatingPauseExecution.name"),
		tooltip: O("setting.viewer.floatingPauseExecution.desc"),
		type: "boolean",
		defaultValue: !!n.viewer?.floatingPauseDuringExecution,
		onChange: (e) => {
			n.viewer = n.viewer || {}, n.viewer.floatingPauseDuringExecution = !!e, G(n), K(n), r("viewer.floatingPauseDuringExecution");
		}
	}), e({
		id: `${fn}.Browser.ShowFolders`,
		category: o("Browser"),
		name: "Show folders in Input / Output panels",
		tooltip: "When enabled, subdirectories under the Input and Output roots are shown as folder cards in the browser grid. Disable to see only files.",
		type: "boolean",
		defaultValue: !!(n.browser?.showFolders ?? !1),
		onChange: async (e) => {
			let a = !!e, o = !!(n.browser?.showFolders ?? !1);
			n.browser = n.browser || {}, n.browser.showFolders = a, G(n), K(n), r("browser.showFolders");
			try {
				let e = await i(a);
				if (!e?.ok) throw Error(e?.error || "Failed to update show folders setting");
			} catch (e) {
				n.browser.showFolders = o, G(n), K(n), r("browser.showFolders"), t(e?.message || "Failed to update show folders setting", "error");
			}
		}
	}), e({
		id: `${fn}.Viewer.MfvLiveDefault`,
		category: s(O("setting.viewer.mfvLiveDefault.name").replace("Majoor: ", "")),
		name: O("setting.viewer.mfvLiveDefault.name"),
		tooltip: O("setting.viewer.mfvLiveDefault.desc"),
		type: "boolean",
		defaultValue: !!(n.viewer?.mfvLiveDefault ?? A.MFV_LIVE_DEFAULT),
		onChange: (e) => {
			n.viewer = n.viewer || {}, n.viewer.mfvLiveDefault = !!e, G(n), K(n), r("viewer.mfvLiveDefault");
		}
	}), e({
		id: `${fn}.Viewer.MfvPreviewDefault`,
		category: s(O("setting.viewer.mfvPreviewDefault.name").replace("Majoor: ", "")),
		name: O("setting.viewer.mfvPreviewDefault.name"),
		tooltip: O("setting.viewer.mfvPreviewDefault.desc"),
		type: "boolean",
		defaultValue: !!(n.viewer?.mfvPreviewDefault ?? A.MFV_PREVIEW_DEFAULT),
		onChange: (e) => {
			n.viewer = n.viewer || {}, n.viewer.mfvPreviewDefault = !!e, G(n), K(n), r("viewer.mfvPreviewDefault");
		}
	}), e({
		id: `${fn}.Viewer.MfvTopbarButton`,
		category: s("Top bar Viewer button"),
		name: "Show Viewer button in the top bar",
		tooltip: "Show a Viewer toggle button in the ComfyUI top bar next to the queue controls. Disable to hide it (the V shortcut keeps working).",
		type: "boolean",
		defaultValue: !!(n.viewer?.mfvTopbarButton ?? A.MFV_TOPBAR_BUTTON),
		onChange: (e) => {
			n.viewer = n.viewer || {}, n.viewer.mfvTopbarButton = !!e, G(n), K(n), r("viewer.mfvTopbarButton");
		}
	}), e({
		id: `${fn}.Viewer.MfvSidebarPosition`,
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
	}), e({
		id: `${fn}.Viewer.MfvPreviewMethod`,
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
	}), e({
		id: `${fn}.Viewer.MfvKjPreviewOverrideEnabled`,
		category: s(O("setting.viewer.mfvKjPreviewOverride.name").replace("Majoor: ", "")),
		name: O("setting.viewer.mfvKjPreviewOverride.name"),
		tooltip: O("setting.viewer.mfvKjPreviewOverride.desc"),
		type: "boolean",
		defaultValue: !!(n.viewer?.mfvKjPreviewOverrideEnabled ?? A.MFV_KJ_PREVIEW_OVERRIDE_ENABLED),
		onChange: (e) => {
			n.viewer = n.viewer || {}, n.viewer.mfvKjPreviewOverrideEnabled = !!e, G(n), K(n), r("viewer.mfvKjPreviewOverrideEnabled");
		}
	}), e({
		id: `${fn}.Viewer.LtxavRgbFallback`,
		category: s("LTXAV preview fallback"),
		name: "Majoor: LTXAV RGB Preview Fallback (experimental)",
		tooltip: "Reuse LTXV RGB projection for LTXAV when native latent preview is unavailable. Experimental; quality may be approximate.",
		type: "boolean",
		defaultValue: !!n.viewer?.ltxavRgbFallback,
		onChange: async (e) => {
			let i = !!e, a = !!n.viewer?.ltxavRgbFallback;
			n.viewer = n.viewer || {}, n.viewer.ltxavRgbFallback = i, G(n), K(n), r("viewer.ltxavRgbFallback");
			try {
				let e = await _e(i);
				if (!e?.ok) throw Error(e?.error || "Failed to update LTXAV RGB preview fallback setting");
			} catch (e) {
				n.viewer.ltxavRgbFallback = a, G(n), K(n), r("viewer.ltxavRgbFallback"), t(e?.message || "Failed to update LTXAV RGB preview fallback setting", "error");
			}
		}
	});
	try {
		fe().then((e) => {
			if (!e?.ok) return;
			let t = !!e?.data?.prefs?.enabled, i = qt();
			i.viewer = i.viewer || {}, !!i.viewer.ltxavRgbFallback !== t && (i.viewer.ltxavRgbFallback = t, Object.assign(n, i), G(i), K(i), r("viewer.ltxavRgbFallback"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	((t, i, a, s) => {
		e({
			id: `${fn}.WorkflowMinimap.${t}`,
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
var hn = "Majoor", gn = "Majoor Assets Manager";
function _n(n, i, a) {
	let o = (e, t) => [
		gn,
		e,
		t
	];
	n({
		id: `${hn}.ExecutionGrouping.Enabled`,
		category: o(O("cat.scanning"), "Execution grouping"),
		name: "Execution job/stack grouping",
		tooltip: "Enable or disable all live job_id / stack_id tracking, grouping, and stack finalization logic.",
		type: "boolean",
		defaultValue: !!(i.executionGrouping?.enabled ?? A.EXECUTION_GROUPING_ENABLED),
		onChange: async (e) => {
			let n = !!(i.executionGrouping?.enabled ?? A.EXECUTION_GROUPING_ENABLED), r = !!e;
			i.executionGrouping = i.executionGrouping || {}, i.executionGrouping.enabled = r, G(i), K(i), a("executionGrouping.enabled");
			try {
				let e = await De(r);
				if (!e?.ok) throw Error(e?.error || "Failed to update execution grouping setting");
				i.executionGrouping.enabled = !!e?.data?.prefs?.enabled, G(i), K(i), a("executionGrouping.enabled");
			} catch (e) {
				i.executionGrouping.enabled = n, G(i), K(i), a("executionGrouping.enabled"), t(e?.message || "Failed to update execution grouping setting", "error");
			}
		}
	}), n({
		id: `${hn}.AutoScan.OnStartup`,
		category: o(O("cat.scanning"), O("setting.scan.startup.name").replace("Majoor: ", "")),
		name: O("setting.scan.startup.name"),
		tooltip: O("setting.scan.startup.desc"),
		type: "boolean",
		defaultValue: !!i.autoScan?.onStartup,
		onChange: (e) => {
			i.autoScan = i.autoScan || {}, i.autoScan.onStartup = !!e, G(i), K(i), a("autoScan.onStartup");
		}
	}), n({
		id: `${hn}.Scan.FastMode`,
		category: o(O("cat.scanning"), "Scan mode"),
		name: "Fast scan mode",
		tooltip: "Use fast scan mode for manual backfill scans (skip heavier metadata work during scan).",
		type: "boolean",
		defaultValue: !!(i.scan?.fastMode ?? !0),
		onChange: (e) => {
			i.scan = i.scan || {}, i.scan.fastMode = !!e, G(i), a("scan.fastMode");
		}
	}), n({
		id: `${hn}.Scan.JpegXL`,
		category: o(O("cat.scanning"), "Image formats"),
		name: "JPEG XL (JXL) support (Experimental)",
		tooltip: "Index and preview .jxl images. Preview generation requires JPEG XL support in Pillow or FFmpeg. Run a new scan after enabling.",
		type: "boolean",
		defaultValue: !!i.scan?.jxlEnabled,
		onChange: async (e) => {
			let n = !!i.scan?.jxlEnabled, r = !!e;
			i.scan = i.scan || {}, i.scan.jxlEnabled = r, G(i), a("scan.jxlEnabled");
			try {
				let e = await v(r);
				if (!e?.ok) throw Error(e?.error || "Failed to update JPEG XL support");
			} catch (e) {
				i.scan.jxlEnabled = n, G(i), a("scan.jxlEnabled"), t(e?.message || "Failed to update JPEG XL support", "error");
			}
		}
	}), e().then((e) => {
		e?.ok && (i.scan = i.scan || {}, i.scan.jxlEnabled = !!e?.data?.prefs?.enabled, G(i), a("scan.jxlEnabled"));
	}).catch(() => {}), n({
		id: `${hn}.RtHydrate.Concurrency`,
		category: o(O("cat.scanning"), "Hydration"),
		name: "Hydrate Concurrency",
		tooltip: "Maximum concurrent hydration requests for rating/tags.",
		type: "number",
		defaultValue: Number(i.rtHydrate?.concurrency || A.RT_HYDRATE_CONCURRENCY || 5),
		attrs: {
			min: 1,
			max: 20,
			step: 1
		},
		onChange: (e) => {
			i.rtHydrate = i.rtHydrate || {}, i.rtHydrate.concurrency = Math.max(1, Math.min(20, Math.round(U(e, A.RT_HYDRATE_CONCURRENCY || 5)))), G(i), K(i), a("rtHydrate.concurrency");
		}
	});
	let s = (e, t, n, r) => {
		let i = Math.round(U(e, t));
		return Math.max(n, Math.min(r, i));
	}, c = (e = {}) => {
		let t = [];
		if (i.watcher = i.watcher || {}, typeof e.debounce_ms == "number") {
			let n = Math.max(50, Math.min(5e3, Math.round(e.debounce_ms)));
			i.watcher.debounceMs !== n && (i.watcher.debounceMs = n, t.push("watcher.debounceMs"));
		}
		if (typeof e.dedupe_ttl_ms == "number") {
			let n = Math.max(100, Math.min(3e4, Math.round(e.dedupe_ttl_ms)));
			i.watcher.dedupeTtlMs !== n && (i.watcher.dedupeTtlMs = n, t.push("watcher.dedupeTtlMs"));
		}
		t.length && (G(i), t.forEach((e) => a(e)));
	}, u = async () => {
		try {
			let e = await ve();
			if (!e?.ok) return;
			c(e.data || {});
		} catch (e) {
			console.debug?.(e);
		}
	};
	n({
		id: `${hn}.Watcher.Enabled`,
		category: o(O("cat.scanning"), O("setting.watcher.enabled.label", "Enable watcher")),
		name: O("setting.watcher.name"),
		tooltip: O("setting.watcher.desc") + " (env: MJR_ENABLE_WATCHER)",
		type: "boolean",
		defaultValue: !!i.watcher?.enabled,
		onChange: async (e) => {
			i.watcher = i.watcher || {}, i.watcher.enabled = !!e, G(i), a("watcher.enabled");
			try {
				let n = await r(!!e);
				n?.ok || (i.watcher.enabled = !e, G(i), a("watcher.enabled"), t(n?.error || O("toast.failedToggleWatcher", "Failed to toggle watcher"), "error"));
			} catch {
				i.watcher.enabled = !e, G(i), a("watcher.enabled");
			}
		}
	}), n({
		id: `${hn}.Watcher.DebounceDelay`,
		category: o(O("cat.scanning"), O("setting.watcher.debounce.label", "Watcher debounce delay")),
		name: O("setting.watcher.debounce.name"),
		tooltip: O("setting.watcher.debounce.desc") + " (env: MJR_WATCHER_DEBOUNCE_MS)",
		type: "number",
		defaultValue: i.watcher?.debounceMs ?? A.WATCHER_DEBOUNCE_MS,
		attrs: {
			min: 50,
			max: 6e4,
			step: 50
		},
		onChange: async (e) => {
			let n = A.WATCHER_DEBOUNCE_MS, r = s(e, n, 50, 6e4), o = i.watcher?.debounceMs ?? n;
			if (r !== o) {
				i.watcher = i.watcher || {}, i.watcher.debounceMs = r, G(i);
				try {
					let e = await l({ debounce_ms: r });
					if (!e?.ok) throw Error(e?.error || O("setting.watcher.debounce.error"));
					let t = Math.round(Number(e?.data?.debounce_ms ?? r));
					i.watcher.debounceMs = t, G(i), a("watcher.debounceMs");
				} catch (e) {
					i.watcher.debounceMs = o, G(i), a("watcher.debounceMs"), t(e?.message || O("setting.watcher.debounce.error"), "error");
				}
			}
		}
	}), n({
		id: `${hn}.Watcher.DedupeWindow`,
		category: o(O("cat.scanning"), O("setting.watcher.dedupe.label", "Watcher dedupe window")),
		name: O("setting.watcher.dedupe.name"),
		tooltip: O("setting.watcher.dedupe.desc") + " (env: MJR_WATCHER_DEDUPE_TTL_MS)",
		type: "number",
		defaultValue: i.watcher?.dedupeTtlMs ?? A.WATCHER_DEDUPE_TTL_MS,
		attrs: {
			min: 100,
			max: 12e4,
			step: 100
		},
		onChange: async (e) => {
			let n = A.WATCHER_DEDUPE_TTL_MS, r = s(e, n, 100, 12e4), o = i.watcher?.dedupeTtlMs ?? n;
			if (r !== o) {
				i.watcher = i.watcher || {}, i.watcher.dedupeTtlMs = r, G(i);
				try {
					let e = await l({ dedupe_ttl_ms: r });
					if (!e?.ok) throw Error(e?.error || O("setting.watcher.dedupe.error"));
					let t = Math.round(Number(e?.data?.dedupe_ttl_ms ?? r));
					i.watcher.dedupeTtlMs = t, G(i), a("watcher.dedupeTtlMs");
				} catch (e) {
					i.watcher.dedupeTtlMs = o, G(i), a("watcher.dedupeTtlMs"), t(e?.message || O("setting.watcher.dedupe.error"), "error");
				}
			}
		}
	}), n({
		id: `${hn}.Watcher.MaxPending`,
		category: o(O("cat.scanning"), "Watcher queue"),
		name: "Watcher: max pending files",
		tooltip: "Maximum number of pending watcher files kept in memory.",
		type: "number",
		defaultValue: Number(i.watcher?.maxPending ?? 500),
		attrs: {
			min: 10,
			max: 5e3,
			step: 10
		},
		onChange: (e) => {
			i.watcher = i.watcher || {}, i.watcher.maxPending = Math.max(10, Math.min(5e3, Math.round(U(e, 500)))), G(i), K(i), a("watcher.maxPending");
		}
	}), n({
		id: `${hn}.Watcher.MinSize`,
		category: o(O("cat.scanning"), "Watcher file size"),
		name: "Watcher: min size (bytes)",
		tooltip: "Minimum file size indexed by watcher.",
		type: "number",
		defaultValue: Number(i.watcher?.minSize ?? 100),
		attrs: {
			min: 0,
			max: 1e6,
			step: 100
		},
		onChange: (e) => {
			i.watcher = i.watcher || {}, i.watcher.minSize = Math.max(0, Math.min(1e6, Math.round(U(e, 100)))), G(i), K(i), a("watcher.minSize");
		}
	}), n({
		id: `${hn}.Watcher.MaxSize`,
		category: o(O("cat.scanning"), "Watcher file size"),
		name: "Watcher: max size (bytes)",
		tooltip: "Maximum file size indexed by watcher.",
		type: "number",
		defaultValue: Number(i.watcher?.maxSize ?? 4294967296),
		attrs: {
			min: 1e5,
			max: 17179869184,
			step: 1e5
		},
		onChange: (e) => {
			i.watcher = i.watcher || {}, i.watcher.maxSize = Math.max(1e5, Math.min(17179869184, Math.round(U(e, 4294967296)))), G(i), K(i), a("watcher.maxSize");
		}
	});
	try {
		u().catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	n({
		id: `${hn}.RatingTagsSync.Enabled`,
		category: o(O("cat.scanning"), O("setting.sync.rating.name").replace("Majoor: ", "")),
		name: O("setting.sync.rating.name"),
		tooltip: O("setting.sync.rating.desc"),
		type: "boolean",
		defaultValue: !!i.ratingTagsSync?.enabled,
		onChange: (e) => {
			i.ratingTagsSync = i.ratingTagsSync || {}, i.ratingTagsSync.enabled = !!e, G(i), a("ratingTagsSync.enabled");
		}
	});
}
//#endregion
//#region ui/app/settings/settingsFeed.ts
var vn = "Majoor", yn = "Majoor Assets Manager";
function bn(e, t, n) {
	let r = (e) => [
		yn,
		O("cat.feed", "Generated Feed"),
		e
	], i = () => {
		t.feed = t.feed || {};
	};
	e({
		id: `${vn}.Feed.CardSize`,
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
		id: `${vn}.Feed.ShowInfo`,
		category: r("Show info section"),
		name: "Show card info section",
		tooltip: "Show or hide the entire info section (filename, metadata, dots) below thumbnails in the Generated Feed.",
		type: "boolean",
		defaultValue: !!(t.feed?.showInfo ?? A.FEED_SHOW_INFO),
		onChange: (e) => {
			i(), t.feed.showInfo = !!e, G(t), K(t), n("feed.showInfo");
		}
	}), e({
		id: `${vn}.Feed.ShowFilename`,
		category: r("Show filename"),
		name: "Show filename",
		tooltip: "Display the filename on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showFilename ?? A.FEED_SHOW_FILENAME),
		onChange: (e) => {
			i(), t.feed.showFilename = !!e, G(t), K(t), n("feed.showFilename");
		}
	}), e({
		id: `${vn}.Feed.ShowDimensions`,
		category: r("Show dimensions"),
		name: "Show dimensions",
		tooltip: "Display resolution (WxH) and duration on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDimensions ?? A.FEED_SHOW_DIMENSIONS),
		onChange: (e) => {
			i(), t.feed.showDimensions = !!e, G(t), K(t), n("feed.showDimensions");
		}
	}), e({
		id: `${vn}.Feed.ShowDate`,
		category: r("Show date/time"),
		name: "Show date/time",
		tooltip: "Display date and time on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDate ?? A.FEED_SHOW_DATE),
		onChange: (e) => {
			i(), t.feed.showDate = !!e, G(t), K(t), n("feed.showDate");
		}
	}), e({
		id: `${vn}.Feed.ShowGenTime`,
		category: r("Show generation time"),
		name: "Show generation time",
		tooltip: "Display the generation time badge on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showGenTime ?? A.FEED_SHOW_GENTIME),
		onChange: (e) => {
			i(), t.feed.showGenTime = !!e, G(t), K(t), n("feed.showGenTime");
		}
	}), e({
		id: `${vn}.Feed.ShowWorkflowDot`,
		category: r("Show workflow dot"),
		name: "Show workflow indicator",
		tooltip: "Display the workflow availability dot on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showWorkflowDot ?? A.FEED_SHOW_WORKFLOW_DOT),
		onChange: (e) => {
			i(), t.feed.showWorkflowDot = !!e, G(t), K(t), n("feed.showWorkflowDot");
		}
	}), e({
		id: `${vn}.Feed.ShowExtBadge`,
		category: r("Show format badges"),
		name: "Show format badges",
		tooltip: "Display format badges (e.g. JPG, MP4) on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showExtBadge ?? A.FEED_SHOW_BADGES_EXTENSION),
		onChange: (e) => {
			i(), t.feed.showExtBadge = !!e, G(t), K(t), n("feed.showExtBadge");
		}
	}), e({
		id: `${vn}.Feed.ShowRatingBadge`,
		category: r("Show rating badges"),
		name: "Show ratings",
		tooltip: "Display star ratings on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showRatingBadge ?? A.FEED_SHOW_BADGES_RATING),
		onChange: (e) => {
			i(), t.feed.showRatingBadge = !!e, G(t), K(t), n("feed.showRatingBadge");
		}
	}), e({
		id: `${vn}.Feed.ShowTagsBadge`,
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
var xn = "Majoor", Sn = "Majoor Assets Manager", Cn = 16, wn = {
	safeMode: !1,
	allowWrite: !0,
	allowDelete: !0,
	allowRename: !0,
	allowOpenInFolder: !0,
	allowResetIndex: !0
};
function Tn(e) {
	return !!e;
}
function En(e, t) {
	return Tn(e) === Tn(t);
}
function Dn(e) {
	return typeof e == "string" ? e.trim() : "";
}
function On(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "localhost" || t === "127.0.0.1" || t === "::1";
}
function kn() {
	return globalThis.location || globalThis.window?.location || null;
}
function An() {
	let e = kn();
	if (!e) return !1;
	let t = String(e.protocol || "").toLowerCase(), n = String(e.hostname || "").trim();
	return t === "http:" && !On(n);
}
function jn(e) {
	let t = globalThis.crypto;
	if (!t?.getRandomValues) throw Error("Secure token generation requires crypto.getRandomValues().");
	return t.getRandomValues(e);
}
function Mn(e) {
	let t = Math.max(4, Number(e) || 0), n = new Uint8Array(t);
	return jn(n), Array.from(n, (e) => e.toString(16).padStart(2, "0")).join("");
}
function Nn() {
	return `mjr_${Mn(18)}`;
}
function Pn(e) {
	return String(e?.apiToken || "").trim().length >= Cn && H(e?.allowWrite, !0) && H(e?.requireAuth, !1) && !H(e?.allowRemoteWrite, !1);
}
function Fn(e) {
	let t = String((e && typeof e == "object" ? e : {}).apiToken || "").trim();
	return {
		apiToken: t.length >= Cn ? t : Nn(),
		allowWrite: !0,
		requireAuth: !0,
		allowRemoteWrite: !1,
		allowInsecureTokenTransport: An()
	};
}
function In(e) {
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
function Ln(e) {
	return y(In(e));
}
function Rn(e) {
	let t = String(e?.security?.tokenHint || "").trim();
	return t ? O("setting.sec.token.placeholderConfigured", "Token configured on server ({tokenHint}). Leave blank to keep the current server token.", { tokenHint: t }) : e?.security?.tokenConfigured ? O("setting.sec.token.placeholderConfiguredGeneric", "Token configured on server. Leave blank to keep the current server token.") : O("setting.sec.token.placeholder", "Auto-generated for this browser session.");
}
function zn(e, n, r) {
	let i = (e, t) => [
		Sn,
		e,
		t
	];
	e({
		id: `${xn}.Safety.ConfirmDeletion`,
		category: i(O("cat.security"), "Confirm before deleting"),
		name: "Confirm before deleting",
		tooltip: "Show a confirmation dialog before deleting files. Disabling this allows instant deletion.",
		type: "boolean",
		defaultValue: n.safety?.confirmDeletion !== !1,
		onChange: (e) => {
			En(n.safety?.confirmDeletion !== !1, e) || (n.safety = n.safety || {}, n.safety.confirmDeletion = !!e, G(n), K(n), r("safety.confirmDeletion"));
		}
	});
	let a = (t, a, o, s = "cat.security") => {
		e({
			id: `${xn}.Security.${t}`,
			category: i(O(s), O(a).replace("Majoor: ", "")),
			name: O(a),
			tooltip: O(o),
			type: "boolean",
			defaultValue: H(n.security?.[t], wn[t] ?? !1),
			onChange: (e) => {
				if (!En(n.security?.[t], e)) {
					n.security = n.security || {}, n.security[t] = !!e, G(n), r(`security.${t}`);
					try {
						Ln(n.security).then((e) => {
							e?.ok && e.data?.prefs ? Jt() : e && e.ok === !1 && console.warn("[Majoor] backend security settings update failed", e.error || e);
						}).catch(() => {});
					} catch (e) {
						console.debug?.(e);
					}
				}
			}
		});
	};
	a("safeMode", "setting.sec.safe.name", "setting.sec.safe.desc"), a("allowWrite", "setting.sec.write.name", "setting.sec.write.desc"), a("allowDelete", "setting.sec.del.name", "setting.sec.del.desc"), a("allowRename", "setting.sec.ren.name", "setting.sec.ren.desc"), a("allowOpenInFolder", "setting.sec.open.name", "setting.sec.open.desc"), a("allowResetIndex", "setting.sec.reset.name", "setting.sec.reset.desc"), e({
		id: `${xn}.Security.RemoteLanPreset`,
		category: i(O("cat.remote"), O("setting.sec.remoteLanPreset.name").replace("Majoor: ", "")),
		name: O("setting.sec.remoteLanPreset.name"),
		tooltip: O("setting.sec.remoteLanPreset.desc"),
		type: "boolean",
		defaultValue: Pn(n.security),
		onChange: (e) => {
			if (n.security = n.security || {}, En(n.security.remoteLanPreset, e)) return;
			if (n.security.remoteLanPreset = !!e, !e) {
				G(n), r("security.remoteLanPreset");
				return;
			}
			let i;
			try {
				i = Fn(n.security);
			} catch (e) {
				t(e?.message || O("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				return;
			}
			Object.assign(n.security, i), n.security.tokenConfigured = !0, n.security.tokenHint = String(i.apiToken || "").trim() ? `...${String(i.apiToken).trim().slice(-4)}` : "", i.apiToken && x(i.apiToken), G(n), r("security.remoteLanPreset"), r("security.apiToken"), r("security.allowWrite"), r("security.requireAuth"), r("security.allowRemoteWrite"), r("security.allowInsecureTokenTransport");
			try {
				Ln(n.security).then((e) => {
					e?.ok && e.data?.prefs ? (Jt(), t(O("toast.remoteLanPresetApplied", "Recommended remote LAN setup applied. This browser session is now authorized for Majoor write operations."), "success")) : e && e.ok === !1 && (t(e.error || O("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error"), console.warn("[Majoor] backend remote LAN preset update failed", e.error || e));
				}).catch((e) => {
					t(e?.message || O("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), e({
		id: `${xn}.Security.ApiToken`,
		category: i(O("cat.remote"), O("setting.sec.token.name").replace("Majoor: ", "")),
		name: O("setting.sec.token.name", "Majoor: API Token"),
		tooltip: O("setting.sec.token.desc", "Store the API token used for write operations. Majoor sends it via X-MJR-Token and Authorization headers."),
		type: "text",
		defaultValue: n.security?.apiToken || "",
		attrs: { placeholder: Rn(n) },
		onChange: (e) => {
			n.security = n.security || {};
			let t = Dn(e);
			if (Dn(n.security.apiToken) !== t && (n.security.apiToken = t, n.security.apiToken && (n.security.tokenConfigured = !0, n.security.tokenHint = `...${n.security.apiToken.slice(-4)}`, x(n.security.apiToken)), G(n), r("security.apiToken"), n.security.apiToken)) try {
				y({ api_token: n.security.apiToken }).then((e) => {
					e?.ok && e.data?.prefs ? Jt() : e && e.ok === !1 && console.warn("[Majoor] backend token update failed", e.error || e);
				}).catch(() => {});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), a("requireAuth", "setting.sec.requireAuth.name", "setting.sec.requireAuth.desc", "cat.remote"), a("allowRemoteWrite", "setting.sec.remote.name", "setting.sec.remote.desc", "cat.remote"), a("allowInsecureTokenTransport", "setting.sec.insecureTransport.name", "setting.sec.insecureTransport.desc", "cat.remote");
}
//#endregion
//#region ui/app/settings/settingsAdvanced.ts
var J = "Majoor", Bn = "Majoor Assets Manager";
function Vn(e, r, i, c) {
	let l = (e, t) => [
		Bn,
		e,
		t
	], u = String(r.paths?.outputDirectory || ""), d = null, p = 0, h = null;
	e({
		id: `${J}.Paths.OutputDirectory`,
		category: l(O("cat.advanced"), "Paths / Output"),
		name: "Majoor: Generation Output Directory",
		tooltip: "Override the ComfyUI generation output directory used by Majoor (equivalent to --output-directory). Leave empty to keep the current backend default.",
		type: "text",
		defaultValue: String(r.paths?.outputDirectory || ""),
		attrs: { placeholder: "D:\\\\____COMFY_OUTPUTS" },
		onChange: async (e) => {
			let n = String(e || "").trim();
			r.paths = r.paths || {}, r.paths.outputDirectory = n, G(r);
			try {
				d &&= (clearTimeout(d), null);
			} catch (e) {
				console.debug?.(e);
			}
			d = setTimeout(async () => {
				d = null;
				let e = ++p;
				try {
					h?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				h = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let t = await he(n, h ? { signal: h.signal } : {});
					if (e !== p) return;
					if (!t?.ok) throw Error(t?.error || O("toast.failedSetOutputDirectory", "Failed to set output directory"));
					let a = String(t?.data?.output_directory || n).trim();
					r.paths.outputDirectory = a, u = a, G(r), i("paths.outputDirectory");
				} catch (n) {
					if (e !== p || String(n?.name || "") === "AbortError" || String(n?.code || "") === "ABORTED") return;
					r.paths.outputDirectory = u, G(r), i("paths.outputDirectory"), t(n?.message || O("toast.failedSetOutputDirectory", "Failed to set output directory"), "error");
				}
			}, 700);
		}
	});
	try {
		ye().then((e) => {
			if (!e?.ok) return;
			let t = String(e?.data?.output_directory || "").trim();
			r.paths = r.paths || {}, r.paths.outputDirectory !== t && (r.paths.outputDirectory = t, u = t, G(r), i("paths.outputDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let _ = String(r.paths?.inputDirectory || ""), v = null, y = 0, x = null, S = (e) => {
		r.paths = r.paths || {}, r.paths.inputDirectory = e, G(r), ke(c, `${J}.Paths.InputDirectory`, e), i("paths.inputDirectory");
	};
	e({
		id: `${J}.Paths.InputDirectory`,
		category: l(O("cat.advanced"), "Paths / Input"),
		name: "Majoor: Input Directory",
		tooltip: "Override the folder indexed by the Inputs tab. Leave empty to use ComfyUI's input directory (--input-directory). Run a scan after changing it.",
		type: "text",
		defaultValue: String(r.paths?.inputDirectory || ""),
		attrs: { placeholder: "D:\\ComfyUI\\input" },
		onChange: (e) => {
			let n = String(e || "").trim();
			if (n === String(r.paths?.inputDirectory || "")) return;
			r.paths = r.paths || {}, r.paths.inputDirectory = n, G(r), v && clearTimeout(v);
			let i = ++y;
			x?.abort(), v = setTimeout(async () => {
				v = null, x = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let e = await a(n, x ? { signal: x.signal } : {});
					if (i !== y) return;
					if (!e?.ok) throw Error(e?.error || "Failed to set input directory");
					let t = String(e?.data?.input_directory ?? n).trim();
					_ = t, S(t);
				} catch (e) {
					if (i !== y || e?.name === "AbortError" || e?.code === "ABORTED") return;
					S(_), t(e?.message || "Failed to set input directory", "error");
				}
			}, 700);
		}
	});
	try {
		b().then((e) => {
			if (!e?.ok || y !== 0) return;
			let t = String(e?.data?.input_directory || "").trim();
			_ = t, S(t);
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let ee = String(r.paths?.indexDirectory || ""), ne = null, E = 0, D = null;
	e({
		id: `${J}.Paths.IndexDirectory`,
		category: l(O("cat.advanced"), "Paths / Index"),
		name: "Majoor: Index Database Directory",
		tooltip: "Override the Majoor index database directory. Use this to keep the SQLite index on a different local disk. Requires restart.",
		type: "text",
		defaultValue: String(r.paths?.indexDirectory || ""),
		attrs: { placeholder: "D:\\MajoorIndex" },
		onChange: async (e) => {
			let n = String(e || "").trim();
			r.paths = r.paths || {}, r.paths.indexDirectory = n, G(r);
			try {
				ne &&= (clearTimeout(ne), null);
			} catch (e) {
				console.debug?.(e);
			}
			ne = setTimeout(async () => {
				ne = null;
				let e = ++E;
				try {
					D?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				D = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let a = await o(n, D ? { signal: D.signal } : {});
					if (e !== E) return;
					if (!a?.ok) throw Error(a?.error || O("toast.failedSetIndexDirectory", "Failed to set index directory"));
					let s = String(a?.data?.index_directory || n).trim(), c = s !== ee;
					r.paths.indexDirectory = s, ee = s, G(r), i("paths.indexDirectory"), c && t(O("toast.indexDirectorySavedRestart", "Index directory saved. Restart ComfyUI to apply."), "success", void 0, { history: { trackId: "settings:index-directory-saved" } });
				} catch (n) {
					if (e !== E || String(n?.name || "") === "AbortError" || String(n?.code || "") === "ABORTED") return;
					r.paths.indexDirectory = ee, G(r), i("paths.indexDirectory"), t(n?.message || O("toast.failedSetIndexDirectory", "Failed to set index directory"), "error");
				}
			}, 700);
		}
	});
	try {
		ae().then((e) => {
			if (!e?.ok) return;
			let t = String(e?.data?.index_directory || "").trim();
			r.paths = r.paths || {}, r.paths.indexDirectory !== t && (r.paths.indexDirectory = t, ee = t, G(r), i("paths.indexDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let oe = String(r.paths?.workflowRoots || ""), se = null, ce = 0, le = null;
	e({
		id: `${J}.Paths.WorkflowRoots`,
		category: l(O("cat.advanced"), "Paths / Workflows"),
		name: "Majoor: Workflow Roots",
		tooltip: "Folders scanned by the Workflow tab. Use one folder per line, or separate folders with semicolons. Leave empty to use ComfyUI defaults and MJR_AM_WORKFLOW_DIRECTORY.",
		type: "text",
		defaultValue: String(r.paths?.workflowRoots || ""),
		attrs: { placeholder: "D:\\\\ComfyUI\\\\user\\\\default\\\\workflows" },
		onChange: async (e) => {
			let n = String(e || "").trim();
			r.paths = r.paths || {}, r.paths.workflowRoots = n, G(r);
			try {
				se &&= (clearTimeout(se), null);
			} catch (e) {
				console.debug?.(e);
			}
			se = setTimeout(async () => {
				se = null;
				let e = ++ce;
				try {
					le?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				le = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let a = await C(n, le ? { signal: le.signal } : {});
					if (e !== ce) return;
					if (!a?.ok) throw Error(a?.error || O("toast.failedSetWorkflowRoots", "Failed to set workflow roots"));
					let o = String(a?.data?.workflow_roots_text || n).trim();
					r.paths.workflowRoots = o, oe = o, G(r), i("paths.workflowRoots"), t(O("toast.workflowRootsSaved", "Workflow roots saved"), "success", 1800);
				} catch (n) {
					if (e !== ce || String(n?.name || "") === "AbortError" || String(n?.code || "") === "ABORTED") return;
					r.paths.workflowRoots = oe, G(r), i("paths.workflowRoots"), t(n?.message || O("toast.failedSetWorkflowRoots", "Failed to set workflow roots"), "error");
				}
			}, 700);
		}
	});
	try {
		ue().then((e) => {
			if (!e?.ok) return;
			let t = String(e?.data?.workflow_roots_text || "").trim();
			r.paths = r.paths || {}, r.paths.workflowRoots !== t && (r.paths.workflowRoots = t, oe = t, G(r), i("paths.workflowRoots"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let fe = Le().map((e) => e.code), pe = ["auto", ...fe];
	e({
		id: `${J}.Language`,
		category: l(O("cat.advanced"), O("setting.language.name", "Language")),
		name: O("setting.language.name", "Majoor: Language"),
		tooltip: "Use auto to detect and follow ComfyUI language. Or choose a fixed language for Majoor only.",
		type: "combo",
		defaultValue: r.i18n?.followComfyLanguage ? "auto" : Me(),
		options: pe,
		onChange: (e) => {
			if (r.i18n = r.i18n || {}, e === "auto") {
				r.i18n.followComfyLanguage = !0, Ne(!0), Ve(c), G(r), i("language");
				return;
			}
			fe.includes(e) && (r.i18n.followComfyLanguage = !1, Ne(!1), Pe(e), G(r), i("language"));
		}
	}), e({
		id: `${J}.ProbeBackend.Mode`,
		category: l(O("cat.advanced"), O("setting.probe.mode.name").replace("Majoor: ", "")),
		name: O("setting.probe.mode.name"),
		tooltip: O("setting.probe.mode.desc") + " (env: MAJOOR_MEDIA_PROBE_BACKEND)",
		type: "combo",
		defaultValue: r.probeBackend?.mode || W.probeBackend.mode,
		options: [
			"auto",
			"exiftool",
			"ffprobe",
			"both"
		],
		onChange: (e) => {
			let t = Rt(e, [
				"auto",
				"exiftool",
				"ffprobe",
				"both"
			], W.probeBackend.mode);
			r.probeBackend = r.probeBackend || {}, r.probeBackend.mode = t, G(r), K(r), i("probeBackend.mode"), m(t).catch(() => {});
		}
	}), e({
		id: `${J}.MetadataFallback.Image`,
		category: l(O("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Images)",
		tooltip: "Enable Pillow fallback when ExifTool is missing or fails.",
		type: "boolean",
		defaultValue: r.metadataFallback?.image ?? W.metadataFallback.image,
		onChange: async (e) => {
			let a = !!e, o = !!(r.metadataFallback?.image ?? W.metadataFallback.image);
			r.metadataFallback = r.metadataFallback || {}, r.metadataFallback.image = a, G(r), i("metadataFallback.image");
			try {
				let e = await n({
					image: a,
					media: r.metadataFallback?.media ?? W.metadataFallback.media
				});
				if (!e?.ok) throw Error(e?.error || O("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				r.metadataFallback.image = o, G(r), i("metadataFallback.image"), t(e?.message || O("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	}), e({
		id: `${J}.MetadataFallback.Media`,
		category: l(O("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Audio/Video)",
		tooltip: "Enable hachoir fallback when ffprobe is missing or fails.",
		type: "boolean",
		defaultValue: r.metadataFallback?.media ?? W.metadataFallback.media,
		onChange: async (e) => {
			let a = !!e, o = !!(r.metadataFallback?.media ?? W.metadataFallback.media);
			r.metadataFallback = r.metadataFallback || {}, r.metadataFallback.media = a, G(r), i("metadataFallback.media");
			try {
				let e = await n({
					image: r.metadataFallback?.image ?? W.metadataFallback.image,
					media: a
				});
				if (!e?.ok) throw Error(e?.error || O("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				r.metadataFallback.media = o, G(r), i("metadataFallback.media"), t(e?.message || O("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	});
	try {
		we().then((e) => {
			if (!e?.ok || !e?.data?.prefs) return;
			let t = e.data.prefs || {}, n = !!(t.image ?? W.metadataFallback.image), a = !!(t.media ?? W.metadataFallback.media);
			r.metadataFallback = r.metadataFallback || {};
			let o = !1;
			r.metadataFallback.image !== n && (r.metadataFallback.image = n, o = !0), r.metadataFallback.media !== a && (r.metadataFallback.media = a, o = !0), o && (G(r), i("metadataFallback"));
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
		defaultValue: Number(r.db?.timeoutMs || 5e3),
		attrs: {
			min: 1e3,
			max: 3e4,
			step: 1e3
		},
		onChange: (e) => {
			r.db = r.db || {}, r.db.timeoutMs = Math.max(1e3, Math.min(3e4, Math.round(U(e, 5e3)))), G(r), K(r), i("db.timeoutMs");
		}
	}), e({
		id: `${J}.Db.MaxConnections`,
		category: l(O("cat.advanced"), "Database"),
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
			r.db = r.db || {}, r.db.maxConnections = Math.max(1, Math.min(100, Math.round(U(e, 10)))), G(r), K(r), i("db.maxConnections");
		}
	}), e({
		id: `${J}.Db.QueryTimeout`,
		category: l(O("cat.advanced"), "Database"),
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
			r.db = r.db || {}, r.db.queryTimeoutMs = Math.max(500, Math.min(1e4, Math.round(U(e, 1e3)))), G(r), K(r), i("db.queryTimeoutMs");
		}
	}), e({
		id: `${J}.Observability.Enabled`,
		category: l(O("cat.advanced"), O("setting.obs.enabled.name").replace("Majoor: ", "")),
		name: O("setting.obs.enabled.name"),
		tooltip: O("setting.obs.enabled.desc"),
		type: "boolean",
		defaultValue: !!r.observability?.enabled,
		onChange: (e) => {
			r.observability = r.observability || {}, r.observability.enabled = !!e, G(r), K(r), i("observability.enabled");
		}
	}), e({
		id: `${J}.Observability.RuntimeDashboardMode`,
		category: l(O("cat.advanced"), "Runtime metrics badge"),
		name: "Majoor: Runtime metrics badge",
		tooltip: "Controls the small DB/enrichment/watcher metrics badge in the Assets Manager panel.",
		type: "combo",
		defaultValue: r.observability?.runtimeDashboardMode || W.observability.runtimeDashboardMode,
		options: [
			"autoHide30",
			"always",
			"hidden"
		],
		onChange: (e) => {
			let t = Rt(e, [
				"autoHide30",
				"always",
				"hidden"
			], W.observability.runtimeDashboardMode);
			r.observability = r.observability || {}, r.observability.runtimeDashboardMode = t, G(r), i("observability.runtimeDashboardMode");
		}
	}), e({
		id: `${J}.Observability.VerboseErrors`,
		category: l(O("cat.advanced"), "Verbose error logging"),
		name: "Verbose error logging",
		tooltip: "Show detailed error messages in toasts and console. Useful for debugging.",
		type: "boolean",
		defaultValue: !!r.observability?.verboseErrors,
		onChange: (e) => {
			r.observability = r.observability || {}, r.observability.verboseErrors = !!e, G(r), K(r), i("observability.verboseErrors");
		}
	}), e({
		id: `${J}.Observability.VerboseRouteRegistrationLogs`,
		category: l(O("cat.advanced"), "Logs"),
		name: "Majoor: Verbose route registration logs",
		tooltip: "When disabled, Majoor prints a compact startup summary instead of listing every registered API route. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(r.observability?.verboseRouteRegistrationLogs ?? W.observability?.verboseRouteRegistrationLogs ?? !1),
		onChange: async (e) => {
			let n = !!e, a = !!(r.observability?.verboseRouteRegistrationLogs ?? W.observability?.verboseRouteRegistrationLogs ?? !1);
			r.observability = r.observability || {}, r.observability.verboseRouteRegistrationLogs = n, G(r), i("observability.verboseRouteRegistrationLogs");
			try {
				let e = await g(n);
				if (!e?.ok) throw Error(e?.error || "Failed to update route logging settings");
			} catch (e) {
				r.observability.verboseRouteRegistrationLogs = a, G(r), i("observability.verboseRouteRegistrationLogs"), t(e?.message || "Failed to update route logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let e = !!(await Se())?.data?.prefs?.enabled;
			r.observability = r.observability || {}, r.observability.verboseRouteRegistrationLogs !== e && (r.observability.verboseRouteRegistrationLogs = e, G(r), i("observability.verboseRouteRegistrationLogs"));
		} catch (e) {
			console.debug?.(e);
		}
	})(), e({
		id: `${J}.Observability.VerboseStartupLogs`,
		category: l(O("cat.advanced"), "Logs"),
		name: "Majoor: Verbose startup logs",
		tooltip: "When disabled, Majoor suppresses most informational bootstrap logs during backend startup while keeping warnings and errors. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(r.observability?.verboseStartupLogs ?? W.observability?.verboseStartupLogs ?? !1),
		onChange: async (e) => {
			let n = !!e, a = !!(r.observability?.verboseStartupLogs ?? W.observability?.verboseStartupLogs ?? !1);
			r.observability = r.observability || {}, r.observability.verboseStartupLogs = n, G(r), i("observability.verboseStartupLogs");
			try {
				let e = await s(n);
				if (!e?.ok) throw Error(e?.error || "Failed to update startup logging settings");
			} catch (e) {
				r.observability.verboseStartupLogs = a, G(r), i("observability.verboseStartupLogs"), t(e?.message || "Failed to update startup logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let e = !!(await be())?.data?.prefs?.enabled;
			r.observability = r.observability || {}, r.observability.verboseStartupLogs !== e && (r.observability.verboseStartupLogs = e, G(r), i("observability.verboseStartupLogs"));
		} catch (e) {
			console.debug?.(e);
		}
	})();
	{
		let n = "HuggingFace Token", a = "", o = null, s = 0, c = !!r.ai?.huggingFaceTokenVisible, u = () => {
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
			category: l(O("cat.advanced"), n),
			name: "Show HuggingFace token",
			tooltip: "Show or hide the HuggingFace token while editing.",
			type: "boolean",
			defaultValue: c,
			onChange: (e) => {
				let t = !!e;
				c = t, r.ai = r.ai || {}, r.ai.huggingFaceTokenVisible = t, G(r), i("ai.huggingFaceTokenVisible"), setTimeout(u, 0);
			}
		}), e({
			id: `${J}.AI.HuggingFaceToken`,
			category: l(O("cat.advanced"), n),
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
				let n = String(e || "").trim();
				if (n !== a) {
					try {
						o &&= (clearTimeout(o), null);
					} catch (e) {
						console.debug?.(e);
					}
					o = setTimeout(async () => {
						o = null;
						let e = ++s;
						try {
							let r = await w(n);
							if (e !== s) return;
							if (!r?.ok) throw Error(r?.error || "Failed to update HuggingFace token");
							a = n, i("ai.huggingFaceToken"), n ? t("HuggingFace token saved", "success") : t("HuggingFace token cleared", "success", void 0, { noHistory: !0 });
						} catch (n) {
							if (e !== s) return;
							t(n?.message || "Failed to update HuggingFace token", "error");
						}
					}, 900);
				}
			}
		}), setTimeout(u, 0), (async () => {
			try {
				let e = (await re())?.data?.prefs || {}, t = !!e?.has_token, n = String(e?.token_hint || "").trim(), r = t ? `Configured ${n || "(saved)"}` : "Paste HuggingFace token (hf_...)";
				d(r);
			} catch (e) {
				console.debug?.(e);
			}
		})(), e({
			id: `${J}.AI.VerboseLogs`,
			category: l(O("cat.advanced"), n),
			name: "Majoor: Verbose AI logs",
			tooltip: "Enable detailed HuggingFace/SigLIP2/X-CLIP logs and progress bars during model download/loading.",
			type: "boolean",
			defaultValue: !!(r.ai?.verboseAiLogs ?? W.ai?.verboseAiLogs ?? !1),
			onChange: async (e) => {
				let n = !!e, a = !!(r.ai?.verboseAiLogs ?? W.ai?.verboseAiLogs ?? !1);
				r.ai = r.ai || {}, r.ai.verboseAiLogs = n, G(r), i("ai.verboseAiLogs");
				try {
					let e = await te(n);
					if (!e?.ok) throw Error(e?.error || "Failed to update AI logging settings");
				} catch (e) {
					r.ai.verboseAiLogs = a, G(r), i("ai.verboseAiLogs"), t(e?.message || "Failed to update AI logging settings", "error");
				}
			}
		}), (async () => {
			try {
				let e = !!(await f())?.data?.prefs?.enabled;
				r.ai = r.ai || {}, r.ai.verboseAiLogs !== e && (r.ai.verboseAiLogs = e, G(r), i("ai.verboseAiLogs"));
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
			let e = await ie();
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
			let n = { history: {
				trackId: "vector-backfill:advanced-settings",
				title: "Vector Backfill",
				source: "all",
				operation: "vector_backfill",
				forceStore: !0
			} };
			try {
				t(O("toast.vectorBackfillStarting", "Starting vector backfill... This may take a while."), "info", void 0, { history: {
					...n.history,
					status: "started",
					detail: "Starting vector backfill... This may take a while."
				} });
				let e = await T(64, { onProgress: (e) => {
					let t = String(e?.status || "running").toLowerCase() || "running", r = e?.progress || e?.result || {}, i = Number(r?.candidates ?? r?.processed ?? 0), a = Number(r?.indexed ?? 0), o = Number(r?.skipped ?? 0), s = Number(r?.errors ?? 0), c = Math.max(i, a + o + s), l = c > 0 ? Math.round((a + o + s) / c * 100) : null, u = t === "queued" ? "Vector backfill queued" : `Candidates ${i}, indexed ${a}, skipped ${o}, errors ${s}`;
					de({
						summary: "Vector Backfill",
						detail: u
					}, t === "failed" ? "error" : t === "succeeded" ? "success" : "info", 0, { history: {
						...n.history,
						status: t,
						detail: u,
						progress: {
							current: a + o + s,
							total: c,
							percent: l,
							indexed: a,
							skipped: o,
							errors: s,
							label: t
						}
					} });
				} });
				if (e?.ok) {
					let r = e.data || {}, i = String(r?.status || "").toLowerCase(), a = !!r?.pending || [
						"queued",
						"running",
						"pending"
					].includes(i), o = r?.progress || {}, s = Number(r?.processed ?? o?.candidates ?? 0), c = Number(r?.indexed ?? o?.indexed ?? 0), l = Number(r?.skipped ?? o?.skipped ?? 0);
					if (a) {
						let e = String(r?.job_id || "").trim();
						t(O("toast.vectorBackfillRunning", "Vector backfill still running in background{job}.", { job: e ? ` (job ${e.slice(0, 8)})` : "" }), "info", void 0, { history: {
							...n.history,
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
						let e = O("toast.vectorBackfillComplete", "Vector backfill complete! Processed: {processed}, Indexed: {indexed}, Skipped: {skipped}", {
							processed: s,
							indexed: c,
							skipped: l
						});
						t(e, "success", void 0, { history: {
							...n.history,
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
						let e = await ie();
						e?.ok && console.debug?.("[Majoor] Vector stats after backfill:", e.data);
					} catch (e) {
						console.debug?.("[Majoor] Failed to refresh vector stats:", e);
					}
				} else throw Error(e?.error || O("toast.vectorBackfillFailedGeneric", "Backfill failed"));
			} catch (e) {
				let r = e?.message || String(e || O("status.unknown", "unknown"));
				t(O("toast.vectorBackfillFailedDetail", "Vector backfill failed: {error}", { error: r }), "error", void 0, { history: {
					...n.history,
					status: "failed",
					detail: r
				} }), console.error("[Majoor] Vector backfill error:", e);
			}
		}
	});
}
//#endregion
//#region ui/app/settings/settingsSearch.ts
var Hn = "Majoor", Un = "Majoor Assets Manager";
function Wn(e, n, r) {
	let i = (e, t) => [
		Un,
		e,
		t
	];
	e({
		id: `${Hn}.AI.VectorSearchEnabled`,
		category: i(O("cat.search", "Search"), "AI"),
		name: O("setting.ai.vector.enabled.name", "Enable AI semantic search"),
		tooltip: O("setting.ai.vector.enabled.desc", "Enable/disable AI vector search features (SigLIP2/X-CLIP: description search, prompt alignment, AI tag suggestions, smart collections)."),
		type: "boolean",
		defaultValue: !!(n.ai?.vectorSearchEnabled ?? !0),
		onChange: async (e) => {
			n.ai = n.ai || {};
			let i = !!(n.ai.vectorSearchEnabled ?? !0), a = !!e;
			n.ai.vectorSearchEnabled = a, G(n), K(n), r("ai.vectorSearchEnabled");
			try {
				let e = await d(a);
				if (!e?.ok) {
					n.ai.vectorSearchEnabled = i, G(n), K(n), r("ai.vectorSearchEnabled"), t(e?.error || "Failed to update AI vector search setting", "error");
					return;
				}
				t(a ? "AI semantic search enabled" : "AI semantic search disabled", "info", 2200);
			} catch (e) {
				n.ai.vectorSearchEnabled = i, G(n), K(n), r("ai.vectorSearchEnabled"), t(e?.message || "Failed to update AI vector search setting", "error");
			}
		}
	}), e({
		id: `${Hn}.AI.VectorCaptionOnIndex`,
		category: i(O("cat.search", "Search"), "AI"),
		name: O("setting.ai.vector.captionOnIndex.name", "Generate AI captions during indexing"),
		tooltip: O("setting.ai.vector.captionOnIndex.desc", "Allow automatic vector indexing and backfill to run Florence-2 captions for image assets. This is slower and can use significant VRAM/CPU; leave it off for faster grid startup."),
		type: "boolean",
		defaultValue: !!(n.ai?.vectorCaptionOnIndex ?? !1),
		onChange: async (e) => {
			n.ai = n.ai || {};
			let i = !!(n.ai.vectorCaptionOnIndex ?? !1), a = !!e;
			n.ai.vectorCaptionOnIndex = a, G(n), K(n), r("ai.vectorCaptionOnIndex");
			try {
				let e = await d({ caption_on_index: a });
				if (!e?.ok) {
					n.ai.vectorCaptionOnIndex = i, G(n), K(n), r("ai.vectorCaptionOnIndex"), t(e?.error || "Failed to update AI caption indexing setting", "error");
					return;
				}
				a && t("AI captions during indexing enabled", "info", 2600);
			} catch (e) {
				n.ai.vectorCaptionOnIndex = i, G(n), K(n), r("ai.vectorCaptionOnIndex"), t(e?.message || "Failed to update AI caption indexing setting", "error");
			}
		}
	}), e({
		id: `${Hn}.AI.VectorIndexOnScan`,
		category: i(O("cat.search", "Search"), "AI"),
		name: O("setting.ai.vector.indexOnScan.name", "Index vectors during scans"),
		tooltip: O("setting.ai.vector.indexOnScan.desc", "Compute SigLIP/X-CLIP embeddings while assets are scanned. Disable to avoid surprise VRAM use; run vector backfill manually when needed."),
		type: "boolean",
		defaultValue: !!(n.ai?.vectorIndexOnScan ?? !1),
		onChange: async (e) => {
			n.ai = n.ai || {};
			let i = !!(n.ai.vectorIndexOnScan ?? !1), a = !!e;
			n.ai.vectorIndexOnScan = a, G(n), K(n), r("ai.vectorIndexOnScan");
			try {
				let e = await d({ index_on_scan: a });
				if (!e?.ok) {
					n.ai.vectorIndexOnScan = i, G(n), K(n), r("ai.vectorIndexOnScan"), t(e?.error || "Failed to update vector scan indexing", "error");
					return;
				}
				t(a ? "Vector indexing during scans enabled" : "Vector indexing during scans disabled", "info", 2400);
			} catch (e) {
				n.ai.vectorIndexOnScan = i, G(n), K(n), r("ai.vectorIndexOnScan"), t(e?.message || "Failed to update vector scan indexing", "error");
			}
		}
	}), e({
		id: `${Hn}.AI.VectorConcurrency`,
		category: i(O("cat.search", "Search"), "AI"),
		name: O("setting.ai.vector.concurrency.name", "Vector indexing concurrency"),
		tooltip: O("setting.ai.vector.concurrency.desc", "Maximum concurrent vector embedding workers. Use 1 to minimize transient VRAM spikes."),
		type: "number",
		defaultValue: Number(n.ai?.vectorConcurrency || 1),
		attrs: {
			min: 1,
			max: 16,
			step: 1
		},
		onChange: async (e) => {
			n.ai = n.ai || {};
			let i = Number(n.ai.vectorConcurrency || 1), a = Math.max(1, Math.min(16, Math.floor(Number(e) || 1)));
			n.ai.vectorConcurrency = a, G(n), K(n), r("ai.vectorConcurrency");
			try {
				let e = await d({ concurrency: a });
				e?.ok || (n.ai.vectorConcurrency = i, G(n), K(n), r("ai.vectorConcurrency"), t(e?.error || "Failed to update vector concurrency", "error"));
			} catch (e) {
				n.ai.vectorConcurrency = i, G(n), K(n), r("ai.vectorConcurrency"), t(e?.message || "Failed to update vector concurrency", "error");
			}
		}
	}), e({
		id: `${Hn}.AI.VectorUnloadAfterUse`,
		category: i(O("cat.search", "Search"), "AI"),
		name: O("setting.ai.vector.unloadAfterUse.name", "Unload AI models after use"),
		tooltip: O("setting.ai.vector.unloadAfterUse.desc", "Unload Majoor SigLIP/X-CLIP/Florence models after heavy AI actions and call torch CUDA cache cleanup. This frees VRAM but makes the next AI action slower."),
		type: "boolean",
		defaultValue: !!(n.ai?.vectorUnloadAfterUse ?? !1),
		onChange: async (e) => {
			n.ai = n.ai || {};
			let i = !!(n.ai.vectorUnloadAfterUse ?? !1), a = !!e;
			n.ai.vectorUnloadAfterUse = a, G(n), K(n), r("ai.vectorUnloadAfterUse");
			try {
				let e = await d({ unload_after_use: a });
				if (!e?.ok) {
					n.ai.vectorUnloadAfterUse = i, G(n), K(n), r("ai.vectorUnloadAfterUse"), t(e?.error || "Failed to update model unload setting", "error");
					return;
				}
				t(a ? "AI model unload after use enabled" : "AI model unload after use disabled", "info", 2400);
			} catch (e) {
				n.ai.vectorUnloadAfterUse = i, G(n), K(n), r("ai.vectorUnloadAfterUse"), t(e?.message || "Failed to update model unload setting", "error");
			}
		}
	}), e({
		id: `${Hn}.AI.VectorUnloadNow`,
		category: i(O("cat.search", "Search"), "AI"),
		name: O("setting.ai.vector.unloadNow.name", "Memory purge now"),
		tooltip: O("setting.ai.vector.unloadNow.desc", "Immediately unload Majoor AI vector/caption models, ask ComfyUI to unload loaded models, and clear torch CUDA cache when idle."),
		type: "combo",
		options: ["Idle", "Unload now"],
		defaultValue: "Idle",
		onChange: async (e) => {
			if (String(e || "") === "Unload now") try {
				let e = await E();
				t(e?.ok ? "Majoor AI model cache unloaded" : e?.error || "Failed to unload Majoor AI model cache", e?.ok ? "info" : "error", 2600);
			} catch (e) {
				t(e?.message || "Failed to unload Majoor AI model cache", "error");
			}
		}
	}), e({
		id: `${Hn}.Search.MaxResults`,
		category: i(O("cat.search", "Search")),
		name: O("setting.search.maxResults.name", "Max search results (client)"),
		tooltip: O("setting.search.maxResults.desc", "Maximum number of results requested per search. The backend still enforces MAJOOR_SEARCH_MAX_LIMIT; increase that env var if you need a higher hard cap."),
		type: "number",
		defaultValue: Number(n.search?.maxResults || A.SEARCH_DEFAULT_LIMIT),
		attrs: {
			min: 10,
			max: A.MAX_PAGE_SIZE || 2e3,
			step: 1
		},
		onChange: (e) => {
			n.search = n.search || {}, n.search.maxResults = Math.max(10, Math.min(A.MAX_PAGE_SIZE || 2e3, Number(e) || A.SEARCH_DEFAULT_LIMIT)), G(n), K(n), r("search.maxResults");
		}
	}), e({
		id: `${Hn}.EnvVars.Reference`,
		category: i(O("cat.advanced"), "Environment variables"),
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
var Gn = "Majoor Assets Manager", Kn = /^\s*Majoor:\s*/i, qn = Object.freeze({
	ASSETS_PANEL: "Assets Panel",
	GENERATED_FEED: "Generated Feed",
	VIEWER: "Viewer & Floating Viewer",
	INDEXING: "Indexing & Watcher",
	SEARCH_AI: "Search & AI",
	GENERAL: "General",
	ADVANCED: "Advanced",
	SECURITY: "Security"
}), Jn = /* @__PURE__ */ new Set([
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
]), Yn = "Majoor.General.ResetAllSettings", Xn = "mjr-settings-reset-btn", Zn = null, Qn = null;
function $n(e) {
	let t = String(e || "").trim();
	return !t || t === Yn || t === "Majoor.Language" ? qn.GENERAL : /^Majoor\.(Safety|Security)\./.test(t) ? qn.SECURITY : /^Majoor\.(Paths|Db|ProbeBackend|MetadataFallback|Observability)\./.test(t) || t === "Majoor.EnvVars.Reference" ? qn.ADVANCED : /^Majoor\.(Viewer|WorkflowMinimap)\./.test(t) ? qn.VIEWER : /^Majoor\.Feed\./.test(t) ? qn.GENERATED_FEED : /^Majoor\.(AutoScan|Scan|Watcher|ExecutionGrouping|RatingTagsSync)\./.test(t) || t === "Majoor.RtHydrate.Concurrency" ? qn.INDEXING : /^Majoor\.AI\.(HuggingFaceTokenVisible|HuggingFaceToken|VerboseLogs|VectorStats|VectorBackfillAction|VectorSearchEnabled|VectorCaptionOnIndex|VectorIndexOnScan|VectorConcurrency|VectorUnloadAfterUse|VectorUnloadNow)$/.test(t) || /^Majoor\.Search\./.test(t) ? qn.SEARCH_AI : /^Majoor\.(Grid|Cards|Badges|Sidebar|InfiniteScroll|General)\./.test(t) ? qn.ASSETS_PANEL : qn.GENERAL;
}
function er(e) {
	let t = Array.isArray(e?.category) ? e.category.filter(Boolean) : [], n = $n(e?.id), r = String(t[1] || t[0] || "").trim(), i = String(t[2] || "").trim(), a = String(e?.name || "").replace(Kn, "").trim();
	return [
		Gn,
		n,
		i || r || a || n
	];
}
var tr = !1, nr = null, rr = null, ir = !1, ar = /* @__PURE__ */ new Set();
function or(e) {
	if (!e || typeof e != "object") return null;
	let t = { ...e };
	try {
		typeof t.name == "string" && (t.name = t.name.replace(Kn, "").trim());
	} catch (e) {
		console.debug?.(e);
	}
	try {
		t.category = er(t);
	} catch {
		t.category = [Gn, qn.GENERAL];
	}
	return !t.tooltip && typeof t.name == "string" && t.name.trim() && (t.tooltip = t.name.trim()), t;
}
function sr(e, t, n) {
	let r = String(t?.id || "").trim();
	if (!r || ar.has(r)) return !1;
	ar.add(r);
	try {
		return ke(e, r, n);
	} finally {
		ar.delete(r);
	}
}
function cr(e, t) {
	if (!t || typeof t != "object") return t;
	let n = { ...t };
	sr(e, n, n.defaultValue);
	let r = n.onChange;
	return n.onChange = (t, ...i) => {
		if (sr(e, n, t), typeof r == "function") return r(t, ...i);
		n.defaultValue = t;
	}, n;
}
function lr(e) {
	try {
		return JSON.parse(JSON.stringify(e || {}));
	} catch {
		return { ...W };
	}
}
function ur(e, t, n, { wrapForComfy: r = !0 } = {}) {
	let i = [], a = (e) => {
		let n = or(e);
		n && i.push(r ? cr(t, n) : n);
	};
	return dn(a, e, n), bn(a, e, n), mn(a, e, n), _n(a, e, n), zn(a, e, n), Vn(a, e, n, t), Wn(a, e, n), i;
}
function dr(e, t) {
	if (e === t) return !0;
	try {
		return JSON.stringify(e) === JSON.stringify(t);
	} catch {
		return !1;
	}
}
function fr(e) {
	return e ? e.querySelector(".form-input") || e.querySelector(".p-inputgroup") || e.querySelector(".setting-input") || e.querySelector("[class*='input']") : null;
}
function pr(e, t) {
	let n = document.createElement("button");
	return n.type = "button", n.className = Xn, n.textContent = e, n.title = t, n.style.marginLeft = "8px", n.style.minWidth = e.length > 2 ? "auto" : "24px", n.style.height = "24px", n.style.padding = e.length > 2 ? "0 10px" : "0", n.style.borderRadius = "6px", n.style.border = "1px solid var(--border-color, #555)", n.style.background = "var(--comfy-input-bg, #2b2b2b)", n.style.color = "var(--input-text, inherit)", n.style.cursor = "pointer", n.style.fontSize = "12px", n.style.lineHeight = "22px", n.style.flexShrink = "0", n;
}
function mr(e, t, n) {
	String(e?.id || "").trim() && (sr(n, e, t), typeof e?.onChange == "function" && e.onChange(t));
}
function hr(e, t, n, r) {
	let i = !dr(Ae(r, t.id, t.defaultValue), n);
	e.disabled = !i, e.style.opacity = i ? "1" : "0.45";
}
function gr() {
	if (typeof document > "u" || !Qn) return;
	let { app: e, definitions: t, defaultValues: n } = Qn, r = document.querySelector(`[data-setting-id="${Yn}"]`), i = fr(r);
	if (r && i && !r.getAttribute("data-mjr-reset-injected")) {
		r.setAttribute("data-mjr-reset-injected", "true"), i.innerHTML = "";
		let a = pr("Reset all settings", "Reset all Majoor settings to defaults");
		a.onclick = (r) => {
			r.preventDefault(), r.stopPropagation();
			for (let r of t) r.id !== Yn && n.has(r.id) && mr(r, n.get(r.id), e);
			gr();
		}, i.appendChild(a);
	}
	for (let r of t) {
		if (!r?.id || r.id === Yn || !n.has(r.id)) continue;
		let t = document.querySelector(`[data-setting-id="${r.id}"]`);
		if (!t || t.getAttribute("data-mjr-reset-injected")) continue;
		let i = fr(t);
		if (!i) continue;
		t.setAttribute("data-mjr-reset-injected", "true");
		let a = pr("Reset", "Reset this setting to default");
		hr(a, r, n.get(r.id), e), a.onclick = (t) => {
			t.preventDefault(), t.stopPropagation();
			let i = n.get(r.id);
			mr(r, i, e), hr(a, r, i, e);
		}, i.appendChild(a);
	}
}
function _r(e, t, n) {
	typeof document < "u" && typeof MutationObserver < "u" && (Qn = {
		app: e,
		definitions: t,
		defaultValues: new Map(n.filter((e) => e?.id && e.id !== Yn).map((e) => [e.id, e.defaultValue]))
	}, gr(), !Zn && (Zn = new MutationObserver(() => gr()), Zn.observe(document.body, {
		childList: !0,
		subtree: !0
	})));
}
function vr(e, t, { initRuntime: n = !1 } = {}) {
	if (rr) typeof t == "function" && rr.onAppliedListeners.add(t), e && !rr.app && (rr.app = e);
	else {
		let n = qt();
		n.i18n = n.i18n || {}, typeof n.i18n.followComfyLanguage == "boolean" ? Ne(!!n.i18n.followComfyLanguage) : (n.i18n.followComfyLanguage = !0, Ne(!0), G(n));
		let r = /* @__PURE__ */ new Set();
		typeof t == "function" && r.add(t);
		let i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set(), o = () => {
			if (!i.size) return;
			let e = Array.from(i);
			i.clear();
			for (let t of e) qe("mjr-settings-changed", { key: t }, { warnPrefix: "[Majoor]" });
		}, s = () => {
			if (!a.size) return;
			let e = Array.from(a);
			a.clear();
			for (let t of e) qe("mjr-settings-changed", { key: t }, { warnPrefix: "[Majoor]" });
		}, c = ln(o, 120), l = ln(s, 450), u = (e) => {
			typeof e == "string" && i.add(e), c();
		}, d = (e) => {
			typeof e == "string" && a.add(e), l();
		}, f = () => {
			let e = qt();
			Object.assign(n, e), K(n), u("storage");
		}, p = (e) => {
			e && e.key === "mjrSettings" && e.newValue !== e.oldValue && f();
		};
		if (!tr) {
			if (nr && typeof window < "u") try {
				window.removeEventListener("storage", nr);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				window.addEventListener("storage", p), tr = !0, nr = p;
			} catch (e) {
				console.debug?.(e);
			}
		}
		rr = {
			app: e,
			notifyApplied: (e) => {
				for (let t of r) try {
					t(n, e);
				} catch (e) {
					console.debug?.(e);
				}
				Jn.has(String(e || "")) ? d(e) : u(e);
			},
			onAppliedListeners: r,
			refreshFromStorage: f,
			settings: n
		};
	}
	if (n && !ir) {
		let t = e || rr.app, n = rr.settings;
		Ve(t), K(n), Re(t), Jt(), Yt(), Xt(), n?.watcher && typeof n.watcher.enabled == "boolean" && r(!!n.watcher.enabled).catch(() => {}), sn(), ir = !0;
	}
	return rr;
}
var yr = (e, t) => vr(e, t, { initRuntime: !0 }).settings, br = (e, t) => {
	let n = vr(e, t, { initRuntime: !1 });
	Object.assign(n.settings, qt());
	let r = e || n.app, i = ur(n.settings, r, n.notifyApplied), a = ur(lr(W), r, () => {}, { wrapForComfy: !1 });
	return i.unshift(cr(r, {
		id: Yn,
		category: [
			Gn,
			qn.GENERAL,
			"Reset"
		],
		name: "Reset all settings to defaults",
		tooltip: "Reset every Majoor Assets Manager setting to its default value.",
		type: "text",
		defaultValue: ""
	})), _r(r, i, a), i;
};
try {
	let e = qt();
	e?.watcher && typeof e.watcher.enabled == "boolean" && Te().then((e) => {
		let t = !!e?.ok && !!e?.data?.enabled, n = qt();
		n.watcher = n.watcher || {}, typeof t == "boolean" && t !== !!n.watcher.enabled && (n.watcher.enabled = t, G(n), qe("mjr-settings-changed", { key: "watcher.enabled" }, { warnPrefix: "[Majoor]" }));
	}).catch(() => {});
} catch (e) {
	console.debug?.(e);
}
//#endregion
//#region ui/features/contextmenu/gridContextMenuState.ts
function xr() {
	return {
		open: !1,
		x: 0,
		y: 0,
		items: [],
		title: ""
	};
}
var Y = bt({
	portalOwnerId: "",
	mountedPortalIds: [],
	main: xr(),
	submenu: xr(),
	tags: {
		open: !1,
		x: 0,
		y: 0,
		asset: null,
		onChanged: null
	}
}), Sr = 1;
function Cr(e) {
	e && (e.open = !1, e.x = 0, e.y = 0, e.items = [], e.title = "");
}
function wr(e = "") {
	try {
		window.dispatchEvent(new CustomEvent("mjr-close-all-menus", { detail: { source: String(e || "") } }));
	} catch (e) {
		console.debug?.(e);
	}
}
function Tr() {
	let e = `mjr-grid-context-menu-portal-${Sr++}`;
	return Y.mountedPortalIds.push(e), Y.portalOwnerId ||= e, e;
}
function Er(e) {
	let t = Y.mountedPortalIds.filter((t) => t !== e);
	Y.mountedPortalIds.splice(0, Y.mountedPortalIds.length, ...t), Y.portalOwnerId === e && (Y.portalOwnerId = Y.mountedPortalIds[0] || "");
}
function Dr(e) {
	return String(Y.portalOwnerId || "") === String(e || "");
}
function Or({ x: e = 0, y: t = 0, items: n = [], title: r = "" } = {}) {
	wr("grid"), Nr(), jr(), Y.main.open = !0, Y.main.x = Number(e) || 0, Y.main.y = Number(t) || 0, Y.main.items = Array.isArray(n) ? n.filter(Boolean) : [], Y.main.title = String(r || "");
}
function kr() {
	Cr(Y.main), jr();
}
function Ar({ x: e = 0, y: t = 0, items: n = [], title: r = "" } = {}) {
	Y.submenu.open = !0, Y.submenu.x = Number(e) || 0, Y.submenu.y = Number(t) || 0, Y.submenu.items = Array.isArray(n) ? n.filter(Boolean) : [], Y.submenu.title = String(r || "");
}
function jr() {
	Cr(Y.submenu);
}
function Mr({ x: e = 0, y: t = 0, asset: n = null, onChanged: r = null } = {}) {
	kr(), Y.tags.open = !!n, Y.tags.x = Number(e) || 0, Y.tags.y = Number(t) || 0, Y.tags.asset = n || null, Y.tags.onChanged = typeof r == "function" ? r : null;
}
function Nr() {
	Y.tags.open = !1, Y.tags.x = 0, Y.tags.y = 0, Y.tags.asset = null, Y.tags.onChanged = null;
}
function Pr() {
	kr(), Nr();
}
//#endregion
//#region ui/features/dnd/utils/constants.ts
var Fr = "application/x-mjr-asset", Ir = "application/x-mjr-assets", Lr = "application/x-comfy-asset-info", Rr = /* @__PURE__ */ new Set([
	".png",
	".jpg",
	".jpeg",
	".webp",
	".gif",
	".bmp",
	".tif",
	".tiff",
	".avif",
	".jxl"
]), zr = /* @__PURE__ */ new Set([
	".mp4",
	".mov",
	".mkv",
	".webm",
	".avi",
	".m4v"
]), Br = /* @__PURE__ */ new Set([
	".wav",
	".mp3",
	".flac",
	".ogg",
	".m4a",
	".aac",
	".opus"
]), Vr = /* @__PURE__ */ new Set([
	".obj",
	".fbx",
	".glb",
	".gltf",
	".stl",
	".ply",
	".splat",
	".ksplat",
	".spz"
]), Hr = (e) => {
	if (!e) return !1;
	let t = e.lastIndexOf(".");
	return t !== -1 && Rr.has(e.slice(t).toLowerCase());
}, Ur = (e) => e ? String(e.kind || "").toLowerCase() === "image" || Hr(e.filename) : !1, Wr = (e) => {
	if (!e) return !1;
	let t = e.lastIndexOf(".");
	return t !== -1 && zr.has(e.slice(t).toLowerCase());
}, Gr = (e) => e ? String(e.kind || "").toLowerCase() === "video" || Wr(e.filename) : !1, Kr = (e) => {
	if (!e) return !1;
	let t = e.lastIndexOf(".");
	return t !== -1 && Br.has(e.slice(t).toLowerCase());
}, qr = (e) => e ? String(e.kind || "").toLowerCase() === "audio" || Kr(e.filename) : !1, Jr = (e) => {
	if (!e) return !1;
	let t = e.lastIndexOf(".");
	return t !== -1 && Vr.has(e.slice(t).toLowerCase());
}, Yr = (e) => e ? String(e.kind || "").toLowerCase() === "model3d" || Jr(e.filename) : !1, Xr = (e) => Ur(e) || Gr(e) || qr(e) || Yr(e) || String(e?.kind || "").toLowerCase() === "workflow", Zr = {
	mp4: "video/mp4",
	mov: "video/quicktime",
	webm: "video/webm",
	mkv: "video/x-matroska",
	glb: "model/gltf-binary",
	gltf: "model/gltf+json",
	obj: "model/obj",
	stl: "model/stl",
	ply: "application/ply"
}, Qr = (e) => Zr[String(e || "").split(".").pop()?.toLowerCase()] ?? "application/octet-stream", $r = (e, t) => {
	if (typeof e != "string") return !1;
	let n = e.trim().toLowerCase();
	if (!n) return !1;
	let r = (n.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
	return r ? t && r === String(t).toLowerCase() ? !0 : zr.has(`.${r}`) : !1;
}, ei = (e, t, n) => {
	if (!e || e.type !== "combo" || !e.options) return !1;
	let r = Array.isArray(e.options.values) && e.options.values || e.options.values && Array.isArray(e.options.values.values) && e.options.values.values || null;
	return Array.isArray(r) ? r.some((e) => n(typeof e == "string" ? e : e?.content ?? e?.value ?? e?.text, t)) : !1;
}, ti = (e, t) => ei(e, t, $r), ni = (e, t) => {
	if (typeof e != "string") return !1;
	let n = e.trim().toLowerCase();
	if (!n) return !1;
	let r = (n.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
	return r ? t && r === String(t).toLowerCase() ? !0 : Rr.has(`.${r}`) : !1;
}, ri = (e, t) => ei(e, t, ni), ii = (e, t) => {
	if (typeof e != "string") return !1;
	let n = e.trim().toLowerCase();
	if (!n) return !1;
	let r = (n.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
	return r ? t && r === String(t).toLowerCase() ? !0 : Br.has(`.${r}`) : !1;
}, ai = (e, t) => ei(e, t, ii), oi = (e, t) => {
	if (typeof e != "string") return !1;
	let n = e.trim().toLowerCase();
	if (!n) return !1;
	let r = (n.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
	return r ? t && r === String(t).toLowerCase() ? !0 : Vr.has(`.${r}`) : !1;
}, si = (e, t) => ei(e, t, oi), ci = /* @__PURE__ */ new WeakMap(), li = (e) => {
	if (!e || typeof e != "object") return {
		node: null,
		prev: null
	};
	let t = ci.get(e);
	return t || (t = {
		node: null,
		prev: null
	}, ci.set(e, t)), t;
}, ui = (e, t, n) => {
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
}, di = (e, t, n) => {
	let r = li(e);
	t && r.node !== t && (fi(e, n), r.node = t, r.prev = {
		color: t.color,
		bgcolor: t.bgcolor
	}, t.bgcolor = "#3355ff", t.color = "#a9c4ff", n(e));
}, fi = (e, t) => {
	let n = li(e);
	if (n.node) {
		try {
			n.prev && (n.node.color = n.prev.color, n.node.bgcolor = n.prev.bgcolor);
		} catch (e) {
			console.debug?.(e);
		}
		n.node = null, n.prev = null, t(e);
	}
}, pi = (e, t) => {
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
}, mi = /* @__PURE__ */ new Set([
	"number",
	"int",
	"float",
	"boolean",
	"toggle",
	"checkbox",
	"button",
	"hidden"
]), hi = [
	"output",
	"save",
	"export",
	"folder",
	"dir"
], gi = ["file", "path"], _i = [
	"path",
	"file",
	"input",
	"src",
	"source"
], vi = (e, t, n) => {
	let r = e?.widgets;
	if (!Array.isArray(r) || !r.length) return null;
	let i = String(t || "").toLowerCase().replace(/^\./, ""), a = String(e?.type || "").toLowerCase(), o = n.knownNodeIncludes.some((e) => a.includes(e)), s = [];
	for (let e of r) {
		if (!e) continue;
		let t = String(e?.type || "").toLowerCase(), r = e?.value;
		if (mi.has(t) || typeof r == "number" || typeof r == "boolean") continue;
		let a = t === "text" || t === "string" || t === "combo", c = typeof e?.callback == "function" && typeof r == "string";
		if (!a && !c) continue;
		let l = String(e?.name || e?.label || "").toLowerCase().trim(), u = 0;
		n.exactNames.has(l) && (u += 100), l === "file" && o && t === "combo" && n.comboChecker(e, i) && (u += 100);
		let d = n.mediaTerms.some((e) => l.includes(e)), f = _i.some((e) => l.includes(e));
		d && f && (u += 80), gi.some((e) => l.includes(e)) && (u += 35);
		for (let { terms: e, score: t } of n.extraTerms) e.some((e) => l.includes(e)) && (u += t);
		hi.some((e) => l.includes(e)) && (u -= 90), n.exactSingleNames.has(l) && (typeof r == "string" && r.trim() === "" || n.looksLikeFn(r, i) ? u += 25 : u -= 10), o && (u += 15);
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
}, yi = {
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
	looksLikeFn: $r,
	comboChecker: ti,
	scoreKey: "__mjrVideoPickScore"
}, bi = {
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
	looksLikeFn: ni,
	comboChecker: ri,
	scoreKey: "__mjrImagePickScore"
}, xi = {
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
	looksLikeFn: ii,
	comboChecker: ai,
	scoreKey: "__mjrAudioPickScore"
}, Si = {
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
	looksLikeFn: oi,
	comboChecker: si,
	scoreKey: "__mjrModel3DPickScore"
}, Ci = (e, t, n) => {
	let r = String(t?.kind || "").toLowerCase();
	return vi(e, n, r === "model3d" ? Si : r === "audio" ? xi : r === "image" ? bi : yi);
}, wi = (e, t, n, r) => {
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
}, Ti = (e) => {
	let t = e?.canvas?.canvas || document.querySelector("canvas");
	return t ? t.getBoundingClientRect() : null;
}, Ei = (e, t) => {
	let n = Ti(e);
	if (!n) return !1;
	let r = t.clientX, i = t.clientY;
	return r >= n.left && r <= n.right && i >= n.top && i <= n.bottom;
}, Di = (e) => {
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
}, Oi = (e) => {
	let t = String(e?.filename || ""), n = t.lastIndexOf(".");
	return n >= 0 ? t.slice(n).toLowerCase() : "";
}, ki = (e) => {
	let t = String(e?.kind || "").toLowerCase(), n = Oi(e);
	return t === "image" || Rr.has(n) ? ["LoadImage"] : t === "video" || zr.has(n) ? [
		"LoadVideo",
		"VHS_LoadVideo",
		"VideoLoader"
	] : t === "audio" || Br.has(n) ? [
		"LoadAudio",
		"VHS_LoadAudioUpload",
		"VHS_LoadAudio",
		"AudioLoader"
	] : t === "model3d" || Vr.has(n) ? [
		"Load3D",
		"LoadModel",
		"LoadMesh",
		"LoadGLB",
		"LoadOBJ",
		"LoadSTL",
		"LoadPLY"
	] : [];
}, Ai = (e, t) => {
	if (e) {
		e.type === "combo" && pi(e, t), e.value = t;
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
}, ji = (e) => {
	let t = e?.canvas?.canvas || document.querySelector("canvas"), n = t?.getBoundingClientRect?.(), r = n ? Number(n.width || n.right - n.left) : 0, i = n ? Number(n.height || n.bottom - n.top) : 0, a = Number(r || t?.width || 800), o = Number(i || t?.height || 600);
	if (!n) return [Math.max(0, a / 2), Math.max(0, o / 2)];
	let s = n && Number(n.left) || 0, c = n && Number(n.top) || 0;
	return Mi(e, s + Math.max(0, a / 2), c + Math.max(0, o / 2));
}, Mi = (e, t, n) => {
	let r = (e?.canvas?.canvas || document.querySelector("canvas"))?.getBoundingClientRect?.(), i = e?.canvas?.ds || {}, a = Number(i.scale) || 1, o = i.offset || [0, 0], s = Array.isArray(o) ? Number(o[0]) || 0 : Number(o?.x) || 0, c = Array.isArray(o) ? Number(o[1]) || 0 : Number(o?.y) || 0;
	return !r || !Number.isFinite(Number(t)) || !Number.isFinite(Number(n)) ? ji(e) : [(Number(t) - r.left) / a - s, (Number(n) - r.top) / a - c];
}, Ni = (e, t = null) => {
	if (Number.isFinite(Number(t?.clientX)) && Number.isFinite(Number(t?.clientY))) return Mi(e, t.clientX, t.clientY);
	try {
		let n = e?.canvas?.convertEventToCanvasOffset?.(t);
		if (Array.isArray(n)) return [Number(n[0]) || 0, Number(n[1]) || 0];
	} catch (e) {
		console.debug?.(e);
	}
	return Mi(e, t?.clientX, t?.clientY);
}, Pi = ({ app: e, payload: t, relativePath: n, event: r = null, droppedExt: i = "", position: a = null }) => {
	let o = e?.graph ?? e?.canvas?.graph ?? null;
	if (!o || typeof o.add != "function") return !1;
	let s = null;
	for (let n of ki(t)) try {
		if (s = He(n, e), s) break;
	} catch (e) {
		console.debug?.(e);
	}
	if (!s) return !1;
	s.pos = Array.isArray(a) ? [Number(a[0]) || 0, Number(a[1]) || 0] : Ni(e, r), o.add(s);
	let c = Ci(s, t, i);
	return c && Ai(c, n), Di(e), !0;
}, Fi = ({ app: e, items: t = [], event: n = null, gap: r = 90 }) => {
	let i = Array.isArray(t) ? t.filter(Boolean) : [];
	if (!i.length) return 0;
	let a = Ni(e, n), o = 0;
	for (let t of i) Pi({
		app: e,
		payload: t.payload,
		relativePath: t.relativePath,
		event: n,
		droppedExt: t.droppedExt,
		position: [a[0] + o * Number(r || 90), a[1]]
	}) && (o += 1);
	return o;
}, Ii = Ai, Li = ({ app: e, payload: t, relativePath: n, targetNode: r, inputSlotIndex: i, event: a = null }) => {
	let o = e?.graph ?? e?.canvas?.graph ?? null;
	if (!o || typeof o.add != "function" || !r) return !1;
	let s = null;
	for (let n of ki(t)) try {
		if (s = He(n, e), s) break;
	} catch (e) {
		console.debug?.(e);
	}
	if (!s) return !1;
	let c = Number(r.pos[0]) || 0, l = Number(r.pos[1]) || 0, u = Array.isArray(s.size) && Number(s.size[0]) || 220;
	s.pos = [c - u - 60, l + Number(i) * 20], o.add(s);
	let d = Oi(t), f = Ci(s, t, d);
	f && Ai(f, n);
	try {
		s.connect(0, r, i);
	} catch (e) {
		console.debug?.(e);
	}
	return Di(e), !0;
}, Ri = async ({ post: e, endpoint: t, payload: n, index: r = !0, purpose: i = null }) => {
	let a = {
		index: !!r,
		files: [{
			filename: n.filename,
			subfolder: n.subfolder || "",
			dest_subfolder: "",
			type: n.type || "output",
			root_id: Oe(n) || void 0
		}]
	};
	return i && (a.purpose = i), e(t, a);
}, zi = async ({ post: e, endpoint: t, payload: n, index: r = !0, purpose: i = null }) => {
	let a = await Ri({
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
}, Bi = async ({ post: e, endpoint: t, payload: n, index: r = !0, purpose: i = null }) => (await zi({
	post: e,
	endpoint: t,
	payload: n,
	index: r,
	purpose: i
}))?.relativePath || null, Vi = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, Hi = /^[0-9a-f]{20,}$/i;
function Ui(...e) {
	for (let t of e) {
		let e = String(t || "").trim();
		if (e) return e;
	}
	return "";
}
function Wi(e) {
	let t = String(e || "").trim();
	return !!t && (Vi.test(t) || Hi.test(t));
}
function Gi(e) {
	return String(e?.type || e?.class_type || e?.comfyClass || e?.classType || "").trim();
}
function Ki(e) {
	return Ui(e?.properties?.subgraph_name, e?.title, e?.properties?.title, e?.properties?.name, e?.properties?.label, e?.name, e?.subgraph?.name, e?.subgraph_instance?.name);
}
function qi(e) {
	let t = Gi(e), n = Ki(e);
	return n && (!t || Wi(t) || n !== t) ? n : t && !Wi(t) ? t : n || (t ? "Subgraph" : String(e?.id || "Node").trim() || "Node");
}
function Ji(e) {
	let t = Gi(e);
	return t && !Wi(t) ? t : t ? "Subgraph" : "Node";
}
//#endregion
//#region ui/components/sidebar/utils/minimap.ts
var Yi = 6, Xi = 1, Zi = 64, Qi = 74, $i = 42, ea = [
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
], ta = (e, t, n) => {
	let r = Number(e);
	return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
}, na = (e, t = !1) => {
	let n = String(e || "").toUpperCase();
	return n.includes("IMAGE") ? "rgba(145,198,99,0.9)" : n.includes("LATENT") ? "rgba(89,178,118,0.9)" : n.includes("MODEL") ? "rgba(112,155,255,0.9)" : n.includes("CONDITIONING") ? "rgba(191,123,226,0.9)" : n.includes("CLIP") ? "rgba(220,178,77,0.9)" : n.includes("VAE") ? "rgba(72,184,214,0.9)" : n.includes("MASK") ? "rgba(190,190,190,0.88)" : n.includes("STRING") || n.includes("TEXT") ? "rgba(230,230,230,0.86)" : n.includes("INT") || n.includes("FLOAT") || n.includes("NUMBER") ? "rgba(130,210,220,0.88)" : t ? "rgba(170,220,255,0.82)" : "rgba(255,255,255,0.72)";
}, ra = (e, t, n) => {
	let r = String(t || "").replace(/\s+/g, " ").trim(), i = Math.max(1, Number(n) || 1);
	if (!r || e.measureText(r).width <= i) return r;
	let a = r;
	for (; a.length > 3 && e.measureText(`${a}...`).width > i;) a = a.slice(0, -1);
	return a.length > 3 ? `${a}...` : r.slice(0, 3);
};
function ia(e, t, n = null) {
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
	}, a = i.expandSubgraphs === !1 ? t : aa(t), o = Array.isArray(a?.nodes) ? a.nodes : [], s = Array.isArray(a?.groups) && a.groups || Array.isArray(a?.extra?.groups) && a.extra.groups || Array.isArray(a?.extra?.groupNodes) && a.extra.groupNodes || Array.isArray(a?.extra?.group_nodes) && a.extra.group_nodes || [], c = Array.isArray(a?.links) && a.links || Array.isArray(a?.extra?.links) && a.extra.links || [], l = Math.max(1, e.clientWidth || e.width || 1), u = Math.max(1, e.clientHeight || e.height || 1);
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
		for (let [e, t] of ea) if (n.includes(e)) return t;
		let r = 0;
		for (let e = 0; e < n.length; e += 1) r = r * 31 + n.charCodeAt(e) | 0;
		return `hsl(${Math.abs(r) % 360} 42% 42%)`;
	}, p = (e) => {
		let t = [], n = e?.inputs && typeof e.inputs == "object" && !Array.isArray(e.inputs) ? e.inputs : null;
		if (n) {
			for (let [e, r] of Object.entries(n)) if (!(Array.isArray(r) || r && typeof r == "object") && (t.push([e, r]), t.length >= 3)) return t;
		}
		let r = Array.isArray(e?.widgets_values) ? e.widgets_values : [], i = Array.isArray(e?.widgets) ? e.widgets : [], a = Array.isArray(e?.inputs) ? e.inputs : [], o = a.filter((e) => e?.widget === !0 || e?.widget && typeof e.widget == "object" || typeof e?.widget == "string" && e.widget.trim()), s = a.filter((e) => e?.link == null && pa(e?.type)), c = (o.length ? o : s.length ? s : a).map((e) => String(e?.label || e?.localized_name || e?.name || e?.widget?.name || e?.widget?.label || "").trim());
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
			label: qi(e).replace(/\s+/g, " ").trim()
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
	let S = Math.max(1, b - v), C = Math.max(1, x - y), ee = v + S / 2, te = y + C / 2, ne = i.view && typeof i.view == "object" ? i.view : Object.create(null), w = ta(ne.zoom ?? 1, Xi, Zi), T = Math.max(1, S / w), E = Math.max(1, C / w), re = T / 2, D = E / 2, ie = T >= S ? ee : ta(ne.centerX ?? ee, v + re, b - re), ae = E >= C ? te : ta(ne.centerY ?? te, y + D, x - D), oe = ie - re, se = ae - D, ce = Yi, le = Math.min((l - 12) / T, (u - 12) / E), ue = ne.hoveredNodeId !== null && ne.hoveredNodeId !== void 0 ? String(ne.hoveredNodeId) : null;
	r.clearRect(0, 0, l, u), r.fillStyle = "rgba(0,0,0,0.22)", r.fillRect(0, 0, l, u);
	let de = (e, t) => ({
		x: ce + (e - oe) * le,
		y: ce + (t - se) * le
	}), fe = (e, t) => ({
		x: ta(oe + (Number(e) - ce) / le, v, b),
		y: ta(se + (Number(t) - ce) / le, y, x)
	}), pe = (e) => ({
		x: ce + (e.x - oe) * le,
		y: ce + (e.y - se) * le,
		w: Math.max(1, e.w * le),
		h: Math.max(1, e.h * le)
	}), me = (e) => Math.max(10, Math.min(24, Math.floor(Number(e) * .2))), he = (e, t, n) => {
		let r = pe(e), i = me(r.h), a = n === "output" ? e.outputs : e.inputs, o = Math.max(1, Array.isArray(a) ? a.length : Number(e[`${n}Count`]) || 0), s = ta(t, 0, Math.max(0, o - 1));
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
		if (i.showLinks && c && c.length !== 0) {
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
		let { x: t, y: n, w: a, h: o } = pe(e), s = e.kind === "node", c = e.kind === "group", l = !!e.bypassed, u = !!e.errored, f = c ? .18 : l && i.renderBypassState ? .14 : .62, p = c ? .55 : l && i.renderBypassState ? .32 : .8, m = d(e.fill, f), h = d(e.stroke, p), g = s && i.showNodeLabels && a >= Qi && o >= $i, _ = Math.max(2, Math.min(g ? 7 : 8, Math.floor(Math.min(a, o) * .08))), v = s ? me(o) : 0;
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
				r.fillStyle = na(e.inputs?.[i]?.type, !1), r.beginPath(), r.arc(t, n, g ? 3 : 2.2, 0, Math.PI * 2), r.fill(), r.stroke();
			}
			for (let n = 0; n < i; n += 1) {
				let i = he(e, n, "output");
				r.fillStyle = na(e.outputs?.[n]?.type, !0), r.beginPath(), r.arc(t + a, i, g ? 3 : 2.2, 0, Math.PI * 2), r.fill(), r.stroke();
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
				s && r.fillText(ra(r, s, i), t + 7, he(e, a, "input") + n * .35, i);
			}
			for (let o = 0; o < Math.min(8, e.outputs?.length || 0); o += 1) {
				let s = e.outputs[o], c = String(s?.label || s?.localized_name || s?.name || "").trim();
				if (!c) continue;
				let l = ra(r, c, i);
				r.fillText(l, t + a - 7 - Math.min(i, r.measureText(l).width), he(e, o, "output") + n * .35, i);
			}
			r.restore();
		}
	};
	for (let e of m.filter((e) => e.kind === "group")) ye(e);
	ve();
	for (let e of m.filter((e) => e.kind === "node")) ye(e);
	if (i.showViewport) try {
		let e = je();
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
			zoom: w,
			centerX: ie,
			centerY: ae,
			visibleW: T,
			visibleH: E,
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
function aa(e, t = null) {
	if (!e || typeof e != "object") return e;
	let n = Array.isArray(e.nodes) ? e.nodes.filter(Boolean) : [], r = oa(e, t);
	if (!n.length) return e;
	let i = [], a = Array.isArray(e.links) ? [...e.links] : [], o = [...Array.isArray(e.groups) ? e.groups : [], ...Array.isArray(e.extra?.groups) ? e.extra.groups : []];
	for (let e of n) {
		i.push(e);
		let t = sa(e, r);
		if (!t || !Array.isArray(t.nodes) || !t.nodes.length) continue;
		let n = la(e, aa(t, r));
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
function oa(e, t = null) {
	let n = [
		...Array.isArray(e?.definitions?.subgraphs) ? e.definitions.subgraphs : [],
		...Array.isArray(e?.subgraphs) ? e.subgraphs : [],
		...Array.isArray(e?.rootGraph?.subgraphs) ? e.rootGraph.subgraphs : []
	], r = new Map(t || []);
	for (let e of n) for (let t of ca(e)) t != null && r.set(String(t), e);
	return r;
}
function sa(e, t) {
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
function ca(e) {
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
function la(e, t) {
	let n = String(e?.id ?? e?.ID ?? ""), r = da(e?.pos) || [0, 0], i = fa(e?.size) || [260, 180], a = t.nodes.filter(Boolean), o = ua(a), s = Math.min(22, Math.max(8, i[0] * .08)), c = Math.min(34, Math.max(18, i[1] * .18)), l = Math.min(18, Math.max(8, i[1] * .08)), u = Math.max(40, i[0] - s * 2), d = Math.max(34, i[1] - c - l), f = Math.min(1, u / o.width, d / o.height), p = r[0] + s + (u - o.width * f) / 2, m = r[1] + c + (d - o.height * f) / 2, h = a.map((r) => {
		let i = da(r?.pos) || [o.minX, o.minY], a = fa(r?.size) || [140, 60];
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
function ua(e) {
	let t = Infinity, n = Infinity, r = -Infinity, i = -Infinity;
	for (let a of e) {
		let e = da(a?.pos);
		if (!e) continue;
		let o = fa(a?.size) || [140, 60];
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
function da(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.x ?? e.left ?? null, n = e[1] ?? e[1] ?? e.y ?? e.top ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function fa(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.w ?? e.width ?? null, n = e[1] ?? e[1] ?? e.h ?? e.height ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function pa(e) {
	if (Array.isArray(e)) return !0;
	let t = String(e || "").trim().toUpperCase();
	return t === "INT" || t === "FLOAT" || t === "STRING" || t === "BOOLEAN" || t === "BOOL" || t === "COMBO" || t === "ENUM";
}
function ma(e, t = null) {
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
var X = bt({
	open: !1,
	mode: "workflow",
	title: "",
	sourceAsset: null,
	workflow: null,
	items: [],
	resolve: null
});
function ha({ title: e = "Select workflow", sourceAsset: t = null } = {}) {
	return _a(null), X.open = !0, X.mode = "workflow", X.title = String(e || "Select workflow"), X.sourceAsset = t || null, X.workflow = null, X.items = [], new Promise((e) => {
		X.resolve = e;
	});
}
function ga({ title: e = "Select asset", workflow: t = null, items: n = [] } = {}) {
	return _a(null), X.open = !0, X.mode = "asset", X.title = String(e || "Select asset"), X.sourceAsset = null, X.workflow = t || null, X.items = Array.isArray(n) ? n.filter(Boolean) : [], new Promise((e) => {
		X.resolve = e;
	});
}
function _a(e = null) {
	let t = X.resolve;
	if (X.open = !1, X.mode = "workflow", X.title = "", X.sourceAsset = null, X.workflow = null, X.items = [], X.resolve = null, typeof t == "function") try {
		t(e || null);
	} catch (e) {
		console.debug?.(e);
	}
}
//#endregion
//#region ui/vue/majoorPrimeVue.ts
var va = {
	Button: ft,
	Checkbox: dt,
	InputText: Et,
	Textarea: _t,
	Select: wt,
	ToggleButton: xt,
	Badge: St,
	Tag: ct,
	Dialog: ht,
	Menu: Ct,
	Listbox: yt,
	Tree: Tt,
	VirtualScroller: ut
};
function ya(e) {
	return e.use(pt, {
		ripple: !1,
		unstyled: !0,
		zIndex: { overlay: 10100 }
	}), e.use(mt), e.use(vt), Object.entries(va).forEach(([t, n]) => {
		e.component(`M${t}`, n);
	}), e;
}
//#endregion
//#region ui/vue/createVueApp.ts
function ba(e, t = void 0) {
	let n = At(), r = st(e, t);
	return r.use(n), ya(r), {
		app: r,
		pinia: n
	};
}
var xa = /* @__PURE__ */ new Map();
function Sa(e, t, n) {
	try {
		window.dispatchEvent(new CustomEvent("mjr:keepalive-attached", { detail: {
			mountKey: String(e || "_mjrVueApp"),
			host: t || null,
			container: n || null
		} }));
	} catch {}
}
function Ca(e) {
	let t = document.createElement("div");
	return t.dataset.mjrKeepAliveHost = String(e || "_mjrVueApp"), t.style.height = "100%", t.style.width = "100%", t.style.minHeight = "0", t.style.display = "flex", t.style.flexDirection = "column", t.style.overflow = "hidden", t;
}
function wa(e, t) {
	e && t && (e.style.height = "100%", e.style.minHeight = "0", e.style.display = "flex", e.style.flexDirection = "column", e.style.overflow = "hidden", (e.firstChild !== t || e.childNodes.length !== 1) && (e.replaceChildren(t), Sa(t?.dataset?.mjrKeepAliveHost, t, e)));
}
function Ta(e, t, n = "_mjrVueApp", { attachIfExists: r = !0 } = {}) {
	if (!e) return !1;
	let i = xa.get(n), a = !1;
	if (!i) {
		let e = Ca(n), { app: r } = ba(t);
		r.mount(e), i = {
			app: r,
			host: e,
			container: null
		}, xa.set(n, i), a = !0;
	}
	return (a || r) && (wa(e, i.host), i.container = e), a;
}
function Ea(e = "_mjrVueApp") {
	return xa.has(e);
}
function Da(e, t = "_mjrVueApp") {
	let n = xa.get(t);
	if (n?.app) {
		try {
			n.app.unmount();
		} catch {}
		try {
			n.host?.remove?.();
		} catch {}
		xa.delete(t);
	}
}
//#endregion
//#region ui/utils/format.ts
function Oa(e) {
	if (!e) return null;
	let t = Number(e);
	if (!isNaN(t)) return /* @__PURE__ */ new Date(t * 1e3);
	let n = new Date(e);
	return isNaN(n.getTime()) ? null : n;
}
function ka(e) {
	let t = Oa(e);
	return t ? `${t.getDate().toString().padStart(2, "0")}/${(t.getMonth() + 1).toString().padStart(2, "0")}` : "";
}
function Aa(e) {
	let t = Oa(e);
	return t ? `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}` : "";
}
function ja(e) {
	return e ? e < 60 ? `${Math.round(e)}s` : `${Math.floor(e / 60)}m ${Math.round(e % 60)}s` : "";
}
var Ma = {
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
function Na() {
	let e = {};
	for (let t of Ma.sections) {
		e[t.key] = t.searchField, e[t.searchField] = t.searchField;
		for (let n of t.aliases || []) e[String(n).toLowerCase()] = t.searchField;
	}
	return e;
}
function Pa(e) {
	let t = String(e || "").trim().toLowerCase();
	return Na()[t] || "";
}
function Fa(e) {
	let t = String(e || "").trim().toLowerCase();
	return t && Ma.sections.find((e) => e.key === t) || null;
}
//#endregion
//#region ui/vue/components/panel/sidebar/SidebarFileInfoSection.vue?vue&type=script&setup=true&lang.ts
var Ia = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "rgba(255, 255, 255, 0.03)",
		border: "1px solid var(--mjr-border, rgba(255, 255, 255, 0.12))",
		"border-radius": "8px",
		padding: "10px"
	}
}, La = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "6px"
} }, Ra = ["title"], za = ["title"], Ba = /* @__PURE__ */ rt({
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
				value: ja(e.duration),
				tooltip: "Video duration"
			});
			let p = Xe(e);
			p != null && f.push({
				label: "FPS",
				value: Je(p),
				tooltip: "Native frame rate"
			});
			let m = Ye(e, p);
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
			let h = We(e.generation_time_ms ?? e.metadata?.generation_time_ms ?? 0);
			h > 0 && f.push({
				label: "Generation Time",
				value: `${(Number(h) / 1e3).toFixed(1)}s`,
				tooltip: "Time taken to generate this asset (workflow execution time)",
				valueStyle: `color: ${Ke(h)}; font-weight: 600;`
			});
			let g = e.generation_time || e.file_creation_time || e.mtime || e.created_at;
			if (g) {
				let e = ka(g), t = Aa(g);
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
		return (e, t) => c.value.length ? (I(), z("div", Ia, [t[0] ||= M("div", { style: {
			"font-size": "12px",
			"font-weight": "700",
			color: "#607d8b",
			"margin-bottom": "8px",
			"text-transform": "uppercase",
			"letter-spacing": "0.4px"
		} }, " File Info ", -1), M("div", La, [(I(!0), z(j, null, F(c.value, (e) => (I(), z("div", {
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
		}, R(e.label), 9, Ra), M("div", {
			style: L(e.valueStyle || "font-size: 12px; text-align: right; word-break: break-word"),
			title: String(e.value || "")
		}, R(e.value), 13, za)]))), 128))])])) : N("", !0);
	}
}), Va = /* @__PURE__ */ new Set([
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
function Ha(e) {
	let t = String(e?.filename || e?.name || e?.filepath || e?.path || "").trim().toLowerCase();
	return !t || !t.includes(".") ? "" : t.split(".").pop() || "";
}
function Ua(e) {
	return String(e?.kind || "").trim().toLowerCase() === "image" || String(e?.mime || e?.mimetype || "").trim().toLowerCase().startsWith("image/") ? !0 : Va.has(Ha(e));
}
function Wa(e) {
	let t = Ha(e);
	return t === "jpg" || t === "jpeg";
}
function Ga() {
	try {
		return !!(qt()?.ai?.vectorSearchEnabled ?? !0);
	} catch {
		return !0;
	}
}
function Ka(e) {
	return e >= .75 ? "#4CAF50" : e >= .5 ? "#8BC34A" : e >= .3 ? "#FF9800" : "#F44336";
}
function qa(e) {
	return e >= .85 ? "Excellent" : e >= .7 ? "Good" : e >= .5 ? "Fair" : e >= .3 ? "Low" : "Very Low";
}
function Ja(e) {
	let t = String(e || "").trim();
	if (!t) return "";
	let n = [];
	for (let e of t.replace(/\r\n/g, "\n").split("\n")) {
		let t = String(e || "").trim();
		t && (/^title\s*:/i.test(t) || (/^caption\s*:/i.test(t) && (t = t.replace(/^caption\s*:/i, "").trim()), t && n.push(t)));
	}
	return (n.length ? n.join(" ") : t).replace(/\s+/g, " ").replace(/:{2,}\s*$/, "").trim();
}
function Ya(e) {
	let t = String(e?.filename || "").trim();
	if (!t) return [];
	let n = String(e?.subfolder || "").trim(), r = String(e?.folder_type || "input").trim().toLowerCase(), i = [], a = (e) => {
		if (!e) return;
		let r = ze(t, n, e);
		r && !i.includes(r) && i.push(r);
	};
	return (r === "input" || r === "output") && a(r), a("input"), a("output"), i;
}
function Xa(e) {
	let t = String(e?.filepath || "").trim(), n = String(e?.filename || "").trim();
	return !t || t === n ? "" : t;
}
function Za(e) {
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
function Qa(e, t) {
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
function $a(e) {
	let t = [];
	return e?.metadata_raw && t.push(e.metadata_raw), e?.workflow && t.push(e.workflow), e?.metadata_raw?.workflow && t.push(e.metadata_raw.workflow), e?.metadata_raw?.raw_ffprobe?.format?.tags && t.push(e.metadata_raw.raw_ffprobe.format.tags), e?.metadata_raw?.ffprobe?.format?.tags && t.push(e.metadata_raw.ffprobe.format.tags), e?.geninfo && typeof e.geninfo == "object" && t.push({ geninfo: e.geninfo }), e?.metadata && (typeof e.metadata == "object" || typeof e.metadata == "string") && t.push(e.metadata), e?.prompt && (typeof e.prompt == "object" || typeof e.prompt == "string") && t.push(e.prompt), e?.exif && t.push(e.exif), e && typeof e == "object" && t.push(e), t;
}
function eo(e, t) {
	for (let [n, r] of Object.entries(t)) r != null && r !== "" && (e[n] === void 0 || e[n] === null || e[n] === "") && (e[n] = r);
}
function to(e) {
	let t = $a(e), n = {};
	for (let e of t) {
		let t = Nt(e);
		t && typeof t == "object" && eo(n, t);
	}
	return Object.keys(n).length ? n : null;
}
function no(e) {
	try {
		if (!e || typeof e != "object") return !1;
		if (e.is_override || typeof e.workflow_notes == "string" && e.workflow_notes.trim() || typeof e.notes == "string" && e.notes.trim() || Array.isArray(e.custom_info) && e.custom_info.length > 0 || e.engine && typeof e.engine == "object" && e.engine.type || Ft(e.prompt) || typeof (e.negative_prompt || e.negativePrompt) == "string" && Ft(e.negative_prompt || e.negativePrompt) || e.models || e.model || e.checkpoint || e.loras || e.ltx_director && typeof e.ltx_director == "object" || e.ideogram && typeof e.ideogram == "object" || e.sampler || e.sampler_name || e.steps || e.cfg || e.cfg_scale || e.cfg_high_noise || e.cfg_low_noise || e.scheduler || Array.isArray(e.chained_passes) && e.chained_passes.length > 0 || Array.isArray(e.all_samplers) && e.all_samplers.length > 0 || e.seed || e.denoise || e.denoising || e.clip_skip || e.voice || e.language || e.temperature || e.top_k || e.top_p || e.repetition_penalty || e.max_new_tokens || e.device || e.voice_preset || e.instruct || e.dtype || e.attn_implementation || e.enable_chunking !== void 0 || e.max_chars_per_chunk || e.chunk_combination_method || e.silence_between_chunks_ms || e.enable_audio_cache !== void 0 || e.batch_size !== void 0 || e.use_torch_compile !== void 0 || e.use_cuda_graphs !== void 0 || e.compile_mode || typeof e.lyrics == "string" && e.lyrics.trim()) return !0;
	} catch {
		return !1;
	}
	return !1;
}
function Q(e) {
	return e ? typeof e == "string" ? It(e) : typeof e == "object" ? It(e.name || e.value || "") : "" : "";
}
function ro(e, t, n, r) {
	let i = String(r || "").trim();
	if (!i) return;
	let a = `${n}::${i}`;
	t.has(a) || (t.add(a), e.push({
		label: n,
		value: i
	}));
}
function io(e) {
	let t = `${String(e?.source || "").toLowerCase()} ${String(e?.name || e?.lora_name || "").toLowerCase()}`;
	return t.includes("high_noise") || t.includes("high noise") ? "high_noise" : t.includes("low_noise") || t.includes("low noise") ? "low_noise" : "";
}
function ao(e) {
	let t = [], n = Array.isArray(e.model_groups) ? e.model_groups : [];
	if (n.length) return n.forEach((e) => {
		if (!e || typeof e != "object") return;
		let n = Q(e.model), r = Array.isArray(e.loras) ? e.loras.map((e) => Pt(e)).filter(Boolean) : [];
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
		label: O("sidebar.generation.highNoise", "High Noise"),
		model: Q(r.unet_high_noise)
	}, {
		key: "low_noise",
		label: O("sidebar.generation.lowNoise", "Low Noise"),
		model: Q(r.unet_low_noise)
	}].forEach((e) => {
		let n = i.filter((t) => io(t) === e.key).map((e) => Pt(e)).filter(Boolean);
		(e.model || n.length) && t.push({
			...e,
			loras: n
		});
	}), t;
}
function oo(e, t) {
	return t == null ? null : {
		label: e,
		value: t ? O("state.on", "on") : O("state.off", "off")
	};
}
function $(e) {
	return e != null && String(e).trim() !== "";
}
function so(e) {
	let t = String(e || "").toLowerCase();
	return t.includes("high") ? "#52ffe8" : t.includes("low") ? "#42A5F5" : t.includes("refine") ? "#AB47BC" : t.includes("upscale") ? "#66BB6A" : t.includes("interpolation") || t.includes("video") ? "#dace26" : "#9C27B0";
}
function co(e) {
	return String(e || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function lo(e, t) {
	let n = String(t || e || "").trim(), r = String(e || n).toLowerCase(), i = r.match(/^pass_(\d+)$/);
	return i ? O("sidebar.generation.stagePassN", "Pass {n}", { n: Number(i[1]) }) : r.includes("high") ? "High" : r.includes("low") ? "Low" : r.includes("refine") ? "Refiner" : r.includes("upscale") ? "Upscale" : r.includes("text_to_image") || r.includes("image_to_image") || r === "base" ? "Base" : n || "Branch";
}
function uo(e, t) {
	let n = new Set(t.map((e) => String(e).toLowerCase()));
	return e.find((e) => n.has(String(e.label || "").toLowerCase())) || null;
}
function fo(e, t) {
	return $(t) ? {
		label: e,
		value: t
	} : null;
}
function po(e) {
	let t = String(e || "").toLowerCase();
	return t.includes("high_noise") || t.includes("high-noise") || t.includes("high noise") ? "high" : t.includes("low_noise") || t.includes("low-noise") || t.includes("low noise") ? "low" : "";
}
function mo(e) {
	return Array.isArray(e) || e && typeof e == "object" ? !1 : $(e) && String(e).trim() !== "-";
}
function ho(e) {
	return typeof e == "number" ? Math.abs(e - Math.round(e)) < 1e-9 ? String(Math.round(e)) : e.toFixed(2).replace(/0+$/g, "").replace(/\.$/, "") : String(e ?? "").trim();
}
function go(e) {
	if (!$(e)) return null;
	let t = Number(e);
	return !Number.isFinite(t) || t <= 0 ? null : e;
}
function _o(e, t) {
	let n = go(e.seed);
	if (n !== null) return n;
	let r = [Array.isArray(e.chained_passes) ? e.chained_passes : [], Array.isArray(e.all_samplers) ? e.all_samplers : []];
	for (let e of r) for (let t of e) {
		let e = go(t?.seed_val ?? t?.seed);
		if (e !== null) return e;
	}
	for (let e of t || []) {
		let t = go(uo(e.fields || [], ["Seed"])?.value);
		if (t !== null) return t;
	}
	return null;
}
function vo(e, t) {
	if (!t || !mo(t.value)) return;
	let n = `${String(t.label || "").toLowerCase()}::${ho(t.value)}`;
	e.some((e) => `${String(e.label || "").toLowerCase()}::${ho(e.value)}` === n) || e.push({
		...t,
		value: ho(t.value)
	});
}
function yo(e, t, n, r) {
	let i = /* @__PURE__ */ new Map(), a = (e, t) => {
		let n = co(e || t || "branch") || "branch";
		n.includes("high") && (n = "high"), n.includes("low") && (n = "low");
		let r = i.get(n);
		if (r) return r;
		let a = {
			key: n,
			label: lo(n, t),
			accent: so(n),
			modelFields: [],
			samplingFields: [],
			loras: []
		};
		return i.set(n, a), a;
	}, o = (e, t, n) => {
		let r = String(n || "").trim();
		r && (e.modelFields.some((e) => String(e.label || "").toLowerCase() === String(t || "").toLowerCase() && It(e.value) === It(r)) || e.modelFields.push({
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
		let t = Q(c.unet), n = po(t), r = Q(c.checkpoint || (n ? null : c.unet) || e.model || e.checkpoint), i = Q(c.unet_high_noise) || (n === "high" ? t : ""), l = Q(c.unet_low_noise) || (n === "low" ? t : ""), u = Q(c.clip), d = Q(c.vae), f = Array.isArray(e.loras) ? e.loras.map((e) => Pt(e)).filter(Boolean) : [], p = !!(i || l), m = !p && (r || u || d || f.length) ? a("base", "Base") : null, h = p && (u || d) ? a("shared", "Shared") : null, g = i ? a("high", "High") : null, _ = l ? a("low", "Low") : null;
		if (m) {
			r && o(m, e.model || e.checkpoint || c.checkpoint ? "Model" : "UNet", r), u && o(m, "CLIP", u), d && o(m, "VAE", d);
			for (let e of f) s(m, e);
		}
		h && (u && o(h, "CLIP", u), d && o(h, "VAE", d)), g && o(g, "UNet", i), _ && o(_, "UNet", l);
	}
	let l = i.get("high") || i.get("high_noise"), u = i.get("low") || i.get("low_noise"), d = [
		uo(n, ["Sampler"]),
		uo(n, ["Scheduler"]),
		uo(n, ["Steps"]),
		uo(n, ["Seed"])
	].filter(Boolean), f = fo("CFG", e.cfg_high_noise), p = fo("CFG", e.cfg_low_noise);
	l && [...d, ...f ? [f] : []].forEach((e) => vo(l.samplingFields, e)), u && [...d, ...p ? [p] : []].forEach((e) => vo(u.samplingFields, e));
	let m = (r || []).some((e) => co(e.label).includes("upscale")), h = (r || []).length === 2 && (r || []).every((e) => ["base", "pass_2"].includes(co(e.label)));
	for (let [e, t] of (r || []).entries()) {
		let n = co(t.label);
		if (!n) continue;
		let i = (r || []).filter((e) => co(e.label) === co(t.label)).length, o = co(t.stage), s = o ? (r || []).filter((e) => co(e.stage) === o).length : 0, c = uo(t.fields || [], ["Model"]), d = po(c?.value);
		["high", "low"].includes(n) || (d ? n = d : s > 1 || i > 1 ? n = `pass_${e + 1}` : h ? n = e === 0 ? "high" : "low" : n === "base" && l && u ? n = "high" : ["text_to_image", "image_to_image"].includes(n) && (n = m ? "low" : "base")), n.includes("upscale") && m && (n = "high");
		let f = a(n, t.label);
		if (!/^pass_\d+$/i.test(n) && c && String(c.value || "") !== "-") {
			let e = It(c.value);
			f.modelFields.some((t) => It(t.value) === e) || f.modelFields.push(c);
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
		].includes(String(e.label || "")) && vo(f.samplingFields, e);
	}
	return Array.from(i.values()).filter((e) => e.modelFields.length || e.samplingFields.length || e.loras.length);
}
function bo(e, t, n, r) {
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
		let t = co(n.label), r = (n.fields || []).some((e) => {
			let t = String(e?.label || "").toLowerCase(), n = String(e?.value || "").toLowerCase();
			return t.includes("upscaler") || n.includes("upscale") || n.includes("upscaler") || /(?:^|[_\s-])to[_\s-]?\d{3,5}(?:[_\s.-]|$)/i.test(n);
		});
		t.includes("upscale") && (e.upscaler || r) && a("upscale", "Upscale", "#66BB6A", n.fields || []), (t.includes("interpolation") || t.includes("rife") || t.includes("film")) && a("interpolation", "Interpolation", "#26C6DA", n.fields || []);
	}
	a("audio", "MMAudio", "#26A69A", [
		fo("Voice", e.voice),
		fo("Language", e.language),
		fo("Temperature", e.temperature),
		fo("Lyrics Strength", e.lyrics_strength)
	].filter(Boolean)), a("interpolation", "Interpolation", "#26C6DA", [
		fo("Engine", e.interpolation_engine || e.frame_interpolation || e.interpolator),
		fo("Source FPS", e.source_fps || e.input_fps),
		fo("Final FPS", e.final_fps || e.output_fps || e.fps)
	].filter(Boolean));
	for (let e of n || []) i.push({
		key: co(e.title) || `module_${i.length}`,
		title: e.title,
		accent: e.color || "#2196F3",
		fields: [{
			label: "Info",
			value: e.content
		}]
	});
	r && !i.some((e) => String(e.title).toLowerCase() === String(r).toLowerCase()) && a("workflow_engine", r, "#2196F3", [fo("Engine", r)].filter(Boolean));
	let o = /* @__PURE__ */ new Set();
	return i.filter((e) => {
		let t = `${e.key}:${e.title}:${JSON.stringify(e.fields)}`;
		return !o.has(t) && (o.add(t), !0);
	});
}
function xo(e) {
	return new Set(Array.isArray(e.override_fields) ? e.override_fields.map((e) => String(e || "").trim()).filter(Boolean) : []);
}
function So(e, ...t) {
	return t.some((t) => e.has(t));
}
function Co(e) {
	return Array.isArray(e) ? e.filter((e) => e && typeof e == "object").map((e, t) => ({
		title: String(e.title || O("sidebar.generation.customInfoN", "Custom Info {n}", { n: t + 1 })).trim(),
		content: String(e.content ?? e.value ?? "").trim(),
		color: /^#[0-9a-fA-F]{6}$/.test(String(e.color || "").trim()) ? String(e.color).trim() : "#2196F3"
	})).filter((e) => e.content) : [];
}
function wo(e) {
	if (!e || typeof e != "object") return null;
	let t = [], n = (e, n) => {
		$(n) && t.push({
			label: e,
			value: ho(n)
		});
	};
	n("FPS", e.frame_rate), n("Frames", e.duration_frames), n("Duration", e.duration_seconds), ($(e.width) || $(e.height)) && t.push({
		label: "Size",
		value: `${e.width || "?"} x ${e.height || "?"}`
	});
	let r = Array.isArray(e.segments) ? e.segments.map((e, t) => {
		if (!e || typeof e != "object") return null;
		let n = Ft(e.prompt || e.text || ""), r = String(e.filename || e.imageFile || e.videoFile || e.audioFile || "").trim(), i = String(e.filepath || e.path || r).trim(), a = String(e.in || e.in_label || e.start || e.start_frame || "").trim(), o = String(e.out || e.out_label || e.end || e.end_frame || "").trim();
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
			previewCandidates: r ? Ya({
				filename: r,
				filepath: i,
				folder_type: String(e.folder_type || e.folderType || "input").trim(),
				subfolder: String(e.subfolder || "").trim()
			}) : []
		};
	}).filter(Boolean) : [], i = Ft(e.global_prompt || e.globalPrompt || "");
	return !i && !r.length && !t.length ? null : {
		title: String(e.title || "LTX Director").trim(),
		globalPrompt: i,
		fields: t,
		segments: r
	};
}
function To(e) {
	if (!e || typeof e != "object") return null;
	let t = e.payload && typeof e.payload == "object" ? e.payload : e, n = typeof e.json == "string" && e.json.trim() ? e.json.trim() : JSON.stringify(t, null, 2), r = Ft(e.high_level_description || e.highLevelDescription || t.high_level_description || ""), i = Ft(e.background || t.background || ""), a = [], o = (e, t) => {
		$(t) && a.push({
			label: e,
			value: ho(t)
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
function Eo(e) {
	let t = to(e), n = {
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
		isImageAsset: Ua(e),
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
	if (!t || typeof t == "object" && Object.keys(t).length === 0 || !no(t)) {
		let t = e?.metadata_raw?.geninfo_status || e?.geninfo_status;
		return t && typeof t == "object" && t.kind === "media_pipeline" ? {
			...n,
			kind: "media-only",
			mediaOnlyMessage: O("sidebar.generation.mediaOnlyPipeline", "This file looks like a media-only pipeline (e.g. LoadVideo/VideoCombine) and does not contain generation parameters.")
		} : Ua(e) || Wa(e) ? {
			...n,
			kind: "caption-only",
			showAlignment: !1
		} : n;
	}
	let r = t, i = wo(r.ltx_director), a = To(r.ideogram), o = xo(r), s = r.engine && typeof r.engine == "object" ? r.engine : null, c = !!(r.is_override || s?.mode === "override" || s?.parser_version === "geninfo-override-v1" || s?.source === "majoor_geninfo"), l = Lt(r), u = Mt(typeof r.prompt == "string" ? r.prompt : null, typeof (r.negative_prompt || r.negativePrompt) == "string" ? r.negative_prompt || r.negativePrompt : null), d = Array.isArray(r.all_positive_prompts) && r.all_positive_prompts.length > 1 ? r.all_positive_prompts.map((e, t) => {
		let n = Mt(typeof e == "string" ? e : "", typeof r.all_negative_prompts?.[t] == "string" ? r.all_negative_prompts[t] : "");
		return {
			label: O("sidebar.generation.promptN", "Prompt {n}", { n: t + 1 }),
			positive: Ft(n.positive),
			negative: Ft(n.negative)
		};
	}).filter((e) => e.positive) : [], f = [], p = /* @__PURE__ */ new Set(), m = r.models && typeof r.models == "object" ? r.models : null, h = ao(r), g = new Set(h.map((e) => String(e.model || "").trim()).filter(Boolean)), _ = Array.isArray(r.all_checkpoints) && r.all_checkpoints.length > 1 ? r.all_checkpoints : null;
	if (m) {
		let e = new Set([
			Q(m.unet_high_noise),
			Q(m.unet_low_noise),
			...g
		].filter(Boolean));
		if (_) _.forEach((e, t) => {
			let n = Q(e);
			ro(f, p, O("sidebar.generation.checkpointN", "Checkpoint {n}", { n: t + 1 }), n);
		});
		else {
			let t = Q(m.checkpoint);
			t && !e.has(t) && ro(f, p, O("sidebar.generation.checkpoint", "Checkpoint"), t);
		}
		[
			["UNet", Q(m.unet)],
			["Diffusion", Q(m.diffusion)],
			[O("sidebar.generation.upscaler", "Upscaler"), Q(m.upscaler)],
			["CLIP", Q(m.clip)],
			["VAE", Q(m.vae)]
		].forEach(([t, n]) => {
			e.has(n) || ro(f, p, t, n);
		});
	} else (r.model || r.checkpoint) && ro(f, p, O("sidebar.generation.model", "Model"), It(r.model || r.checkpoint));
	if (Array.isArray(r.loras) && r.loras.length > 0) {
		let e = r.loras.map((e) => Pt(e)).filter(Boolean).join("\n");
		e && ro(f, p, r.loras.length > 1 ? O("sidebar.generation.loras", "LoRAs") : "LoRA", e);
	}
	!m && r.clip && ro(f, p, "CLIP", It(r.clip)), !m && r.vae && ro(f, p, "VAE", It(r.vae)), !m && r.unet && ro(f, p, "UNet", It(r.unet)), !m && r.diffusion && ro(f, p, "Diffusion", It(r.diffusion)), !m && r.upscaler && ro(f, p, O("sidebar.generation.upscaler", "Upscaler"), It(r.upscaler)), m && r.clip && ro(f, p, "CLIP", It(r.clip)), m && r.vae && ro(f, p, "VAE", It(r.vae));
	for (let e of f) {
		let t = String(e.label || "").toLowerCase();
		(t.includes("checkpoint") || t === "model") && (e.override = So(o, "checkpoint", "model")), t === "clip" && (e.override = So(o, "clip")), t === "vae" && (e.override = So(o, "vae")), t.includes("lora") && (e.override = So(o, "loras"));
	}
	let v = [];
	$(r.seed) && v.push({
		label: O("sidebar.generation.seed", "Seed"),
		value: r.seed,
		override: So(o, "seed")
	}), (r.sampler || r.sampler_name) && v.push({
		label: O("sidebar.generation.sampler", "Sampler"),
		value: r.sampler || r.sampler_name,
		override: So(o, "sampler", "sampler_name")
	}), $(r.steps) && v.push({
		label: O("sidebar.generation.steps", "Steps"),
		value: r.steps,
		override: So(o, "steps")
	});
	let y = $(r.cfg) ? r.cfg : r.cfg_scale;
	$(y) && v.push({
		label: O("sidebar.generation.cfgScale", "CFG Scale"),
		value: y,
		override: So(o, "cfg", "cfg_scale")
	}), r.cfg_high_noise !== void 0 && r.cfg_high_noise !== null && v.push({
		label: O("sidebar.generation.cfgHighNoise", "CFG High Noise"),
		value: r.cfg_high_noise
	}), r.cfg_low_noise !== void 0 && r.cfg_low_noise !== null && v.push({
		label: O("sidebar.generation.cfgLowNoise", "CFG Low Noise"),
		value: r.cfg_low_noise
	}), r.scheduler && v.push({
		label: O("sidebar.generation.scheduler", "Scheduler"),
		value: r.scheduler,
		override: So(o, "scheduler")
	});
	let b = $(r.denoise) ? r.denoise : r.denoising;
	$(b) && v.push({
		label: O("sidebar.generation.denoise", "Denoise"),
		value: b,
		override: So(o, "denoise", "denoising")
	});
	let x = [];
	Array.isArray(r.chained_passes) && r.chained_passes.length > 1 ? x = r.chained_passes.filter((e) => e && typeof e == "object").map((e, t) => ({
		label: Qa(e, t),
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
		label: Qa(e, t),
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
		oo(O("sidebar.generation.torchCompile", "Torch Compile"), r.use_torch_compile),
		oo(O("sidebar.generation.cudaGraphs", "CUDA Graphs"), r.use_cuda_graphs),
		oo(O("sidebar.generation.xVectorOnly", "X-Vector Only"), r.x_vector_only_mode)
	].filter(Boolean).forEach((e) => C.push(e));
	let ee = [];
	[
		oo(O("sidebar.generation.chunking", "Chunking"), r.enable_chunking),
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
		oo(O("sidebar.generation.audioCache", "Audio Cache"), r.enable_audio_cache),
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
	let ne = [];
	$(b) && !v.some((e) => e.label === "Denoise") && ne.push({
		label: O("sidebar.generation.denoise", "Denoise"),
		value: b
	}), $(r.clip_skip) && ne.push({
		label: O("sidebar.generation.clipSkip", "Clip Skip"),
		value: r.clip_skip
	});
	let w = [], T = String(r.workflow_notes || r.notes || "").trim();
	T && w.push({
		label: O("sidebar.generation.workflowNotes", "Workflow Notes"),
		value: T,
		override: So(o, "workflow_notes", "notes")
	});
	let E = Co(r.custom_info), re = yo(r, h, v, x), D = bo(r, x, E, l.workflowType), ie = _o(r, x), ae = Array.isArray(r.inputs) ? r.inputs.filter((e) => e && typeof e == "object" && e.filename).map((e, t) => ({
		id: `${e.filename}-${t}`,
		filename: String(e.filename || "").trim(),
		subfolder: String(e.subfolder || "").trim(),
		type: String(e.folder_type || "input").trim().toLowerCase(),
		root_id: String(e.root_id || e.rootId || "").trim(),
		kind: String(e.kind || e.media_kind || e.type || "").trim().toLowerCase(),
		filepath: Xa(e),
		role: String(e.role || "").trim(),
		roleLabel: String(e.role || "").trim().replace(/_/g, " "),
		isVideo: String(e.type || "").toLowerCase() === "video" || /\.(mp4|mov|webm)$/i.test(String(e.filename || "")),
		isAudio: String(e.type || "").toLowerCase() === "audio" || /\.(wav|mp3|flac|ogg|m4a|aac|opus)$/i.test(String(e.filename || "")),
		previewCandidates: Ya(e)
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
		positivePromptOverride: So(o, "prompt", "positive", "positive_prompt"),
		negativePromptOverride: So(o, "negative_prompt", "negative", "negativePrompt"),
		promptTabs: d,
		showAlignment: !!e?.id && (!!String(u.positive || "").trim() || d.length > 0),
		isImageAsset: Ua(e),
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
		imageFields: ne,
		inputFiles: ae,
		isOverride: c,
		overrideLabel: c ? "Gen Info Override" : "",
		notesFields: w,
		customInfoBlocks: E,
		moduleBlocks: D,
		ltxDirector: i,
		ideogram: a
	};
}
//#endregion
//#region ui/vue/components/panel/sidebar/GenerationInputThumb.vue?vue&type=script&setup=true&lang.ts
var Do = ["title"], Oo = ["src"], ko = {
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
}, Ao = { style: {
	"font-size": "8px",
	"font-weight": "700",
	"max-width": "54px",
	"white-space": "nowrap",
	overflow: "hidden",
	"text-overflow": "ellipsis"
} }, jo = ["src"], Mo = {
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
}, No = {
	key: 4,
	title: "Video file",
	style: {
		position: "absolute",
		color: "white",
		opacity: "0.7",
		"font-size": "16px",
		"pointer-events": "none"
	}
}, Po = /* @__PURE__ */ rt({
	__name: "GenerationInputThumb",
	props: { inputFile: {} },
	setup(e) {
		let n = e, r = V(0), i = V(!1), a = null;
		function o() {
			return a ||= import("./floatingViewerManager-XH4AFW4G.js").then((e) => e.n), a;
		}
		function s() {
			return (Array.isArray(n.inputFile?.previewCandidates) ? n.inputFile.previewCandidates : [])[r.value] || "";
		}
		function c() {
			let e = Array.isArray(n.inputFile?.previewCandidates) ? n.inputFile.previewCandidates : [];
			r.value < e.length - 1 && (r.value += 1);
		}
		async function l(e) {
			e?.stopPropagation?.();
			let t = String(n.inputFile?.filepath || n.inputFile?.filename || "").trim();
			if (t) try {
				await navigator.clipboard.writeText(t), i.value = !0, setTimeout(() => {
					i.value = !1;
				}, 350);
			} catch (e) {
				console.debug?.(e);
			}
		}
		function u(e) {
			e?.stopPropagation?.(), g();
		}
		function d() {
			let e = n.inputFile || {}, t = String(e.filepath || "").trim();
			return {
				filename: e.filename || "",
				name: e.filename || "",
				filepath: t,
				path: t,
				subfolder: e.subfolder || "",
				type: e.type || "input",
				source: e.type || "input",
				kind: f(e),
				root_id: e.root_id || "",
				preview_url: s()
			};
		}
		function f(e = n.inputFile || {}) {
			let t = String(e.kind || "").trim().toLowerCase();
			if (t === "image" || t === "video" || t === "audio" || t === "model3d") return t;
			if (e.isVideo) return "video";
			if (e.isAudio) return "audio";
			let r = String(e.filename || "").toLowerCase();
			return /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(r) ? "video" : /\.(wav|mp3|flac|ogg|m4a|aac|opus)$/i.test(r) ? "audio" : /\.(glb|gltf|obj|stl|ply|fbx)$/i.test(r) ? "model3d" : "image";
		}
		function p(e, t, n, { disabled: r = !1 } = {}) {
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
		function m() {
			return {
				id: "mjr-generation-source-separator",
				type: "separator"
			};
		}
		function h() {
			return Za(s()) || !!n.inputFile?.filename || !!n.inputFile?.filepath;
		}
		function g() {
			let e = d();
			if (jt({
				asset: e,
				index: 0
			})) return;
			let t = s();
			if (Za(t)) try {
				window.open(t, "_blank", "noopener,noreferrer");
			} catch (e) {
				console.debug?.(e);
			}
		}
		async function _() {
			try {
				let { floatingViewerManager: e } = await o();
				await e.openAssets({
					assets: [d()],
					index: 0
				});
			} catch (e) {
				console.debug?.(e), t(O("toast.viewerOpenFailed", "Failed to open viewer."), "error");
			}
		}
		async function v() {
			let e = await pe(d());
			if (!e?.ok) {
				t(e?.error || O("toast.openFolderFailed", "Failed to open folder."), "error");
				return;
			}
			t(O("toast.openedInFolder", "Opened in folder"), "info", 1600);
		}
		async function y() {
			let e = d(), n = {
				filename: e.filename,
				subfolder: e.subfolder,
				type: e.type || "input",
				root_id: e.root_id || void 0,
				kind: e.kind
			}, r = await zi({
				post: ge,
				endpoint: Be.STAGE_TO_INPUT,
				payload: n,
				index: !1
			});
			if (!r?.relativePath) {
				t(O("toast.loadAssetFailed", "Failed to load asset."), "error");
				return;
			}
			if (!Fi({
				app: Ie(),
				items: [{
					payload: n,
					relativePath: r.relativePath,
					droppedExt: String(n.filename || "").split(".").pop() || ""
				}],
				event: null
			})) {
				t(O("toast.loadAssetFailed", "Failed to load asset."), "error");
				return;
			}
			let i = e.kind ? e.kind.charAt(0).toUpperCase() + e.kind.slice(1) : "Asset";
			t(O("toast.assetLoadedToCanvas", "{kind} loader added to canvas.", { kind: i }), "success", 1800);
		}
		function b(e) {
			e?.preventDefault?.(), e?.stopPropagation?.();
			let t = f(), r = t === "video" ? O("ctx.loadVideo", "Load video") : t === "audio" ? O("ctx.loadAudio", "Load audio") : t === "model3d" ? O("ctx.loadModel3d", "Load 3D model") : O("ctx.loadImage", "Load image");
			Or({
				x: e?.clientX || 0,
				y: e?.clientY || 0,
				items: [
					p(O("ctx.openInViewer", "Open in viewer"), "pi pi-eye", g, { disabled: !h() }),
					p(O("ctx.openInFloatingViewer", "Open in Floating Viewer"), "pi pi-window-maximize", _, { disabled: !h() }),
					p(O("ctx.openInFolder", "Open in folder"), "pi pi-folder-open", v, { disabled: !n.inputFile?.filepath }),
					m(),
					p(r, "pi pi-plus-circle", y, { disabled: !n.inputFile?.filename }),
					p(O("ctx.copyPath", "Copy path"), "pi pi-copy", l, { disabled: !(n.inputFile?.filepath || n.inputFile?.filename) })
				]
			});
		}
		function x(e) {
			e.target?.play?.().catch?.(() => {});
		}
		function S(e) {
			try {
				e.target?.pause?.();
			} catch (e) {
				console.debug?.(e);
			}
		}
		function C() {
			return !!n.inputFile?.isAudio;
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
				outline: i.value ? "2px solid rgba(76, 175, 80, 0.9)" : "",
				outlineOffset: i.value ? "1px" : ""
			}),
			onClick: l,
			onDblclick: u,
			onContextmenu: b
		}, [e.inputFile.isVideo ? (I(), z("video", {
			key: 0,
			src: s(),
			muted: "",
			loop: "",
			playsinline: "",
			preload: "metadata",
			style: {
				width: "100%",
				height: "100%",
				"object-fit": "cover"
			},
			onError: c,
			onMouseover: x,
			onMouseout: S
		}, null, 40, Oo)) : C() ? (I(), z("div", ko, [n[0] ||= M("div", { style: {
			"font-size": "18px",
			"line-height": "1"
		} }, "♪", -1), M("div", Ao, R(e.inputFile.filename), 1)])) : (I(), z("img", {
			key: 2,
			src: s(),
			style: {
				width: "100%",
				height: "100%",
				"object-fit": "cover"
			},
			onError: c
		}, null, 40, jo)), e.inputFile.role && e.inputFile.role !== "secondary" ? (I(), z("div", Mo, R(e.inputFile.roleLabel), 1)) : e.inputFile.isVideo ? (I(), z("div", No, " Play ")) : N("", !0)], 44, Do));
	}
}), Fo = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "12px"
	}
}, Io = {
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
}, Lo = { style: { opacity: "0.85" } }, Ro = { style: {
	display: "flex",
	"align-items": "center",
	gap: "8px",
	"flex-wrap": "wrap",
	"justify-content": "flex-end"
} }, zo = ["title"], Bo = ["title"], Vo = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, Ho = { style: {
	"font-size": "11px",
	"font-weight": "700",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.6px"
} }, Uo = { style: {
	"font-size": "11px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"font-weight": "600"
} }, Wo = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#FF9800",
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
	"font-size": "11px",
	"font-weight": "600",
	color: "#9E9E9E",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, qo = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, Jo = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "10px"
} }, Yo = { style: {
	"font-size": "11px",
	"font-weight": "800",
	color: "#26C6DA",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px"
} }, Xo = {
	key: 0,
	style: {
		display: "grid",
		"grid-template-columns": "repeat(auto-fit,minmax(92px,1fr))",
		gap: "8px",
		"margin-bottom": "10px"
	}
}, Zo = { style: {
	"font-size": "9px",
	"font-weight": "800",
	color: "rgba(255,255,255,0.55)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Qo = { style: {
	"font-size": "12px",
	color: "var(--fg-color,#eee)",
	"font-weight": "650",
	"word-break": "break-word"
} }, $o = {
	key: 1,
	style: {
		border: "1px solid rgba(76,175,80,0.36)",
		"border-radius": "6px",
		background: "rgba(76,175,80,0.10)",
		padding: "10px",
		"margin-bottom": "10px"
	}
}, es = ["title"], ts = {
	key: 2,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "8px"
	}
}, ns = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "7px"
} }, rs = { style: {
	"font-size": "10px",
	"font-weight": "800",
	color: "#26C6DA",
	"text-transform": "uppercase",
	"letter-spacing": "0.45px"
} }, is = { style: {
	display: "flex",
	"align-items": "center",
	gap: "5px",
	"flex-wrap": "wrap",
	"justify-content": "flex-end"
} }, as = {
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
}, os = {
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
}, ss = { style: {
	display: "flex",
	gap: "10px",
	"align-items": "flex-start",
	"min-width": "0"
} }, cs = { style: {
	"min-width": "0",
	flex: "1"
} }, ls = ["title", "onClick"], us = {
	key: 1,
	style: {
		"font-size": "10px",
		color: "rgba(255,255,255,0.58)",
		"margin-top": "7px",
		display: "flex",
		gap: "6px",
		"flex-wrap": "wrap"
	}
}, ds = { key: 0 }, fs = { key: 1 }, ps = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "10px"
} }, ms = { style: {
	"font-size": "11px",
	"font-weight": "800",
	color: "#FFB300",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px"
} }, hs = {
	key: 0,
	style: {
		display: "grid",
		"grid-template-columns": "repeat(auto-fit,minmax(100px,1fr))",
		gap: "8px",
		"margin-bottom": "10px"
	}
}, gs = { style: {
	"font-size": "9px",
	"font-weight": "800",
	color: "rgba(255,255,255,0.55)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, _s = { style: {
	"font-size": "12px",
	color: "var(--fg-color,#eee)",
	"font-weight": "650",
	"word-break": "break-word"
} }, vs = {
	key: 1,
	style: {
		border: "1px solid rgba(76,175,80,0.34)",
		"border-radius": "6px",
		background: "rgba(76,175,80,0.09)",
		padding: "10px",
		"margin-bottom": "10px"
	}
}, ys = ["title"], bs = {
	key: 2,
	style: {
		border: "1px solid rgba(33,150,243,0.32)",
		"border-radius": "6px",
		background: "rgba(33,150,243,0.08)",
		padding: "10px",
		"margin-bottom": "10px"
	}
}, xs = ["title"], Ss = {
	key: 3,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "8px",
		"margin-bottom": "10px"
	}
}, Cs = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "7px"
} }, ws = { style: {
	"font-size": "10px",
	"font-weight": "800",
	color: "#FFCA28",
	"text-transform": "uppercase",
	"letter-spacing": "0.45px"
} }, Ts = {
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
}, Es = ["title", "onClick"], Ds = {
	key: 1,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "5px",
		"margin-top": "8px"
	}
}, Os = ["title", "onClick"], ks = { style: {
	border: "1px solid rgba(255,179,0,0.30)",
	"border-radius": "6px",
	background: "rgba(0,0,0,0.16)",
	overflow: "hidden"
} }, As = ["title"], js = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Ms = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"margin-bottom": "10px"
} }, Ns = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "#4CAF50",
	"letter-spacing": "0.4px"
} }, Ps = ["onClick"], Fs = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "#F44336",
	"letter-spacing": "0.4px",
	"margin-top": "4px"
} }, Is = ["onClick"], Ls = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Rs = ["title"], zs = ["title"], Bs = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#F44336",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Vs = ["title"], Hs = ["title"], Us = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between"
} }, Ws = ["title"], Gs = { style: {
	display: "flex",
	"align-items": "center",
	gap: "10px"
} }, Ks = { style: {
	flex: "1",
	height: "8px",
	background: "rgba(255,255,255,0.1)",
	"border-radius": "4px",
	overflow: "hidden"
} }, qs = {
	key: 0,
	style: {
		"font-size": "10px",
		color: "rgba(255,255,255,0.65)",
		border: "1px dashed rgba(255,255,255,0.25)",
		"border-radius": "4px",
		padding: "6px 8px",
		background: "rgba(255,255,255,0.04)"
	}
}, Js = { style: {
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
} }, Ys = ["title"], Xs = { style: {
	display: "flex",
	"align-items": "center",
	gap: "6px"
} }, Zs = ["title"], Qs = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9C27B0",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, $s = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(190px, 1fr))",
	gap: "10px"
} }, ec = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.58)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, tc = ["onClick"], nc = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "5px"
	}
}, rc = ["onClick"], ic = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, ac = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, oc = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#FF9800",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, sc = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(130px, 1fr))",
	gap: "8px"
} }, cc = ["onClick"], lc = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9C27B0",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, uc = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(220px, 1fr))",
	gap: "10px"
} }, dc = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, fc = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "4px"
} }, pc = ["onClick"], mc = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "6px"
	}
}, hc = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.58)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, gc = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "5px"
} }, _c = ["onClick"], vc = { style: {
	display: "grid",
	"grid-template-columns": "auto 1fr",
	gap: "8px 12px",
	"align-items": "start"
} }, yc = ["title"], bc = ["title"], xc = ["title", "onClick"], Sc = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Cc = ["title", "onClick"], wc = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#26C6DA",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Tc = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(190px, 1fr))",
	gap: "10px"
} }, Ec = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.58)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Dc = ["title", "onClick"], Oc = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#26A69A",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, kc = ["title"], Ac = { style: {
	"font-size": "11px",
	"font-weight": "700",
	color: "#E91E63",
	"text-transform": "uppercase",
	"letter-spacing": "1px"
} }, jc = ["title"], Mc = ["title"], Nc = { style: {
	display: "flex",
	gap: "8px",
	"flex-wrap": "wrap"
} }, Pc = /* @__PURE__ */ rt({
	__name: "SidebarGenerationSection",
	props: { asset: {} },
	setup(e) {
		let t = e, n = V(0), r = V(0), i = V(""), a = V(O("action.copy", "Copy")), o = V(O("action.generate", "Generate")), s = V(!1), l = V(d()), u = 0;
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
		function m(e, { emphasis: t = !1, startAlpha: n = .16, endAlpha: r = .08 } = {}) {
			return {
				background: t ? `linear-gradient(135deg, ${f(e, n)} 0%, ${f(e, r)} 100%)` : "var(--comfy-menu-bg, rgba(0,0,0,0.3))",
				borderLeft: `3px solid ${e}`,
				border: t ? `1px solid ${f(e, .45)}` : "1px solid var(--border-color, rgba(255,255,255,0.12))",
				boxShadow: t ? `0 0 0 1px ${f(e, .15)} inset` : "none",
				borderRadius: "6px",
				padding: "12px"
			};
		}
		function h() {
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
		function g() {
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
		let _ = P(() => Eo(t.asset)), v = P(() => Ga()), y = P(() => _.value.kind === "full" || _.value.kind === "caption-only"), b = P(() => Ja(i.value) || _.value.emptyCaptionText), x = P(() => v.value && _.value.isImageAsset && !!t.asset?.id), S = P(() => v.value && !!Ja(b.value) && b.value !== _.value.emptyCaptionText), C = P(() => _.value.branchCards.filter((e) => e.modelFields.length || e.loras.length)), ee = P(() => _.value.branchCards.filter((e) => e.samplingFields.length));
		P(() => _.value.branchCards.filter((e) => e.loras.length));
		let te = P(() => {
			let e = [], t = (e, t) => Fa(e)?.title || t;
			return !C.value.length && _.value.modelFields.length && e.push({
				key: "model",
				title: t("model", O("sidebar.generation.modelLora", "Model & LoRA")),
				accent: "#9C27B0",
				emphasis: !0,
				fields: _.value.modelFields
			}), !ee.value.length && _.value.samplingFields.length && e.push({
				key: "sampling",
				title: t("sampler", O("sidebar.generation.sampling", "Sampling")),
				accent: "#FF9800",
				emphasis: !0,
				fields: _.value.samplingFields
			}), (_.value.ttsFields.length || _.value.workflowType.toLowerCase() === "tts") && e.push({
				key: "tts",
				title: "TTS",
				accent: "#26A69A",
				emphasis: !0,
				fields: _.value.ttsFields
			}), _.value.ttsEngineFields.length && e.push({
				key: "tts-engine",
				title: "TTS Engine",
				accent: "#00897B",
				emphasis: !1,
				fields: _.value.ttsEngineFields
			}), _.value.ttsRuntimeFields.length && e.push({
				key: "tts-runtime",
				title: "TTS Runtime",
				accent: "#00796B",
				emphasis: !1,
				fields: _.value.ttsRuntimeFields
			}), _.value.audioFields.length && e.push({
				key: "audio",
				title: O("sidebar.generation.audio", "Audio"),
				accent: "#00BCD4",
				emphasis: !1,
				fields: _.value.audioFields
			}), _.value.imageFields.length && e.push({
				key: "image",
				title: O("sidebar.generation.image", "Image"),
				accent: "#2196F3",
				emphasis: !1,
				fields: _.value.imageFields
			}), e;
		});
		function ne(e, t, n = 450) {
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
			return "#CE6DE0";
		}
		function E(e) {
			let t = String(e?.key || "").toLowerCase();
			return t.includes("high") ? "#FFC107" : t.includes("low") ? "#FFB300" : t.includes("base") ? "#FF9800" : t.includes("upscale") || t.includes("refine") ? "#FFCA28" : t.includes("pass") ? "#FDD835" : "#FF9800";
		}
		function re(e) {
			return e === "high_noise" ? "#FF7043" : e === "low_noise" ? "#29B6F6" : "#AB47BC";
		}
		async function D(e, t = null, n = "rgba(76, 175, 80, 0.35)") {
			let r = String(e ?? "").trim();
			if (r && r !== "-") try {
				await navigator.clipboard.writeText(r), ne(t, n);
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
			if (!_.value.showAlignment || !t.asset?.id) {
				ae();
				return;
			}
			if (!v.value) {
				ie();
				return;
			}
			ae();
			try {
				let n = await p(t.asset.id);
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
				let i = Math.round(r * 100), a = Ka(r);
				l.value = {
					scoreText: `${i}%`,
					scoreColor: a,
					qualityText: qa(r),
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
			if (x.value && !s.value) {
				s.value = !0, o.value = O("status.generating", "Generating...");
				try {
					let e = await c(t.asset.id);
					e?.ok && (i.value = String(e?.data || "").trim());
				} catch (e) {
					console.debug?.(e);
				} finally {
					s.value = !1, o.value = O("action.generate", "Generate");
				}
			}
		}
		async function ce() {
			if (S.value) try {
				await navigator.clipboard.writeText(b.value), a.value = O("viewer.copySuccessShort", "Copied!"), setTimeout(() => {
					a.value = O("action.copy", "Copy");
				}, 900);
			} catch (e) {
				console.debug?.(e);
			}
		}
		return nt(() => t.asset, () => {
			n.value = 0, r.value = 0, i.value = String(t.asset?.enhanced_caption || "").trim(), a.value = O("action.copy", "Copy"), o.value = O("action.generate", "Generate");
		}, { immediate: !0 }), nt(() => [
			t.asset?.id,
			_.value.kind,
			_.value.showAlignment,
			v.value
		], () => {
			oe();
		}, { immediate: !0 }), (e, t) => {
			let r = et("MButton");
			return _.value.kind === "empty" ? N("", !0) : (I(), z("div", Fo, [
				_.value.workflowType ? (I(), z("div", Io, [M("span", Lo, R(B(O)("viewer.workflow", "Workflow")), 1), M("div", Ro, [M("span", {
					title: B(O)("sidebar.generation.workflowEngine", "Workflow engine: {value}", { value: _.value.workflowType }),
					style: {
						background: "#2196F3",
						color: "white",
						padding: "2px 8px",
						"border-radius": "999px",
						"font-weight": "bold",
						"font-size": "10px",
						"letter-spacing": "0.2px"
					}
				}, R(_.value.workflowLabel || _.value.workflowType), 9, zo), _.value.workflowBadge ? (I(), z("span", {
					key: 0,
					title: B(O)("sidebar.generation.apiProvider", "API provider: {value}", { value: _.value.workflowBadge }),
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
				}, R(_.value.workflowBadge), 9, Bo)) : N("", !0)])])) : N("", !0),
				_.value.isOverride ? (I(), z("div", {
					key: 1,
					style: L(m("#00BCD4", {
						emphasis: !0,
						startAlpha: .14,
						endAlpha: .08
					}))
				}, [M("div", Vo, [M("span", Ho, R(B(O)("sidebar.generation.override", "Override")), 1), M("span", Uo, R(_.value.overrideLabel), 1)])], 4)) : N("", !0),
				_.value.isTruncated ? (I(), z("div", {
					key: 2,
					style: L(m("#FF9800", {
						emphasis: !0,
						startAlpha: .12,
						endAlpha: .08
					}))
				}, [M("div", Wo, R(B(O)("sidebar.generation.metadataTruncated", "Metadata Truncated")), 1), M("div", Go, R(B(O)("sidebar.generation.metadataTruncatedBody", "Generation data is incomplete because it exceeded the size limit.")), 1)], 4)) : N("", !0),
				_.value.kind === "media-only" ? (I(), z("div", {
					key: 3,
					style: L(m("#9E9E9E", {
						emphasis: !0,
						startAlpha: .1,
						endAlpha: .06
					}))
				}, [M("div", Ko, R(B(O)("sidebar.generation.generationData", "Generation Data")), 1), M("div", qo, R(_.value.mediaOnlyMessage), 1)], 4)) : N("", !0),
				_.value.kind === "full" ? (I(), z(j, { key: 4 }, [
					_.value.ltxDirector ? (I(), z("div", {
						key: 0,
						style: L(m("#26C6DA", {
							emphasis: !0,
							startAlpha: .15,
							endAlpha: .08
						}))
					}, [
						M("div", Jo, [M("div", Yo, R(_.value.ltxDirector.title || "LTX Director"), 1), t[8] ||= M("span", { style: {
							"font-size": "10px",
							"font-weight": "700",
							color: "#26C6DA",
							background: "rgba(38,198,218,0.14)",
							border: "1px solid rgba(38,198,218,0.32)",
							"border-radius": "999px",
							padding: "2px 8px"
						} }, " Director ", -1)]),
						_.value.ltxDirector.fields.length ? (I(), z("div", Xo, [(I(!0), z(j, null, F(_.value.ltxDirector.fields, (e) => (I(), z("div", {
							key: `ltx-field-${e.label}`,
							style: {
								border: "1px solid rgba(255,255,255,0.10)",
								"border-radius": "6px",
								background: "rgba(255,255,255,0.045)",
								padding: "7px 8px",
								"min-width": "0"
							}
						}, [M("div", Zo, R(e.label), 1), M("div", Qo, R(e.value), 1)]))), 128))])) : N("", !0),
						_.value.ltxDirector.globalPrompt ? (I(), z("div", $o, [t[9] ||= M("div", { style: {
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
							onClick: t[0] ||= (e) => D(_.value.ltxDirector.globalPrompt, e.currentTarget)
						}, R(_.value.ltxDirector.globalPrompt), 9, es)])) : N("", !0),
						_.value.ltxDirector.segments.length ? (I(), z("div", ts, [(I(!0), z(j, null, F(_.value.ltxDirector.segments, (e) => (I(), z("div", {
							key: e.key,
							style: {
								border: "1px solid rgba(38,198,218,0.30)",
								"border-radius": "6px",
								background: "rgba(38,198,218,0.075)",
								padding: "10px"
							}
						}, [M("div", ns, [M("div", rs, R(e.label), 1), M("div", is, [e.inLabel ? (I(), z("span", as, " in " + R(e.inLabel), 1)) : N("", !0), e.outLabel ? (I(), z("span", os, " out " + R(e.outLabel), 1)) : N("", !0)])]), M("div", ss, [e.filename ? (I(), $e(Po, {
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
						}, null, 8, ["input-file"])) : N("", !0), M("div", cs, [e.prompt ? (I(), z("div", {
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
							onClick: (t) => D(e.prompt, t.currentTarget)
						}, R(e.prompt), 9, ls)) : N("", !0), e.filename || e.type ? (I(), z("div", us, [e.type ? (I(), z("span", ds, R(e.type), 1)) : N("", !0), e.filename ? (I(), z("span", fs, R(e.filename), 1)) : N("", !0)])) : N("", !0)])])]))), 128))])) : N("", !0)
					], 4)) : N("", !0),
					_.value.ideogram ? (I(), z("div", {
						key: 1,
						style: L(m("#FFB300", {
							emphasis: !0,
							startAlpha: .15,
							endAlpha: .08
						}))
					}, [
						M("div", ps, [M("div", ms, R(_.value.ideogram.title || "Ideogram 4"), 1), t[10] ||= M("span", { style: {
							"font-size": "10px",
							"font-weight": "700",
							color: "#FFCA28",
							background: "rgba(255,179,0,0.14)",
							border: "1px solid rgba(255,179,0,0.32)",
							"border-radius": "999px",
							padding: "2px 8px"
						} }, " Prompt JSON ", -1)]),
						_.value.ideogram.fields.length ? (I(), z("div", hs, [(I(!0), z(j, null, F(_.value.ideogram.fields, (e) => (I(), z("div", {
							key: `ideogram-field-${e.label}`,
							style: {
								border: "1px solid rgba(255,255,255,0.10)",
								"border-radius": "6px",
								background: "rgba(255,255,255,0.045)",
								padding: "7px 8px",
								"min-width": "0"
							}
						}, [M("div", gs, R(e.label), 1), M("div", _s, R(e.value), 1)]))), 128))])) : N("", !0),
						_.value.ideogram.highLevelDescription ? (I(), z("div", vs, [t[11] ||= M("div", { style: {
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
							onClick: t[1] ||= (e) => D(_.value.ideogram.highLevelDescription, e.currentTarget)
						}, R(_.value.ideogram.highLevelDescription), 9, ys)])) : N("", !0),
						_.value.ideogram.background ? (I(), z("div", bs, [t[12] ||= M("div", { style: {
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
							onClick: t[2] ||= (e) => D(_.value.ideogram.background, e.currentTarget)
						}, R(_.value.ideogram.background), 9, xs)])) : N("", !0),
						_.value.ideogram.elements.length ? (I(), z("div", Ss, [(I(!0), z(j, null, F(_.value.ideogram.elements, (e) => (I(), z("div", {
							key: e.key,
							style: {
								border: "1px solid rgba(255,179,0,0.30)",
								"border-radius": "6px",
								background: "rgba(255,179,0,0.075)",
								padding: "10px"
							}
						}, [
							M("div", Cs, [M("div", ws, R(e.label), 1), e.bbox ? (I(), z("span", Ts, " bbox " + R(e.bbox), 1)) : N("", !0)]),
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
								onClick: (t) => D(e.description, t.currentTarget)
							}, R(e.description), 9, Es)) : N("", !0),
							e.palette.length ? (I(), z("div", Ds, [(I(!0), z(j, null, F(e.palette, (t) => (I(), z("span", {
								key: `${e.key}-${t}`,
								title: t,
								style: L({
									width: "18px",
									height: "18px",
									borderRadius: "4px",
									border: "1px solid rgba(255,255,255,0.28)",
									background: t
								}),
								onClick: (e) => D(t, e.currentTarget)
							}, null, 12, Os))), 128))])) : N("", !0)
						]))), 128))])) : N("", !0),
						M("details", ks, [t[13] ||= M("summary", { style: {
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
							onClick: t[3] ||= (e) => D(_.value.ideogram.json, e.currentTarget)
						}, R(_.value.ideogram.json), 9, As)])
					], 4)) : N("", !0),
					!_.value.ltxDirector && !_.value.ideogram && _.value.promptTabs.length ? (I(), z("div", {
						key: 2,
						style: L(m("#4CAF50", {
							emphasis: !0,
							startAlpha: .16,
							endAlpha: .1
						}))
					}, [
						M("div", js, R(B(O)("sidebar.generation.promptPipeline", "Prompt Pipeline ({count} variants)", { count: _.value.promptTabs.length })), 1),
						M("div", Ms, [(I(!0), z(j, null, F(_.value.promptTabs, (e, t) => (I(), $e(r, {
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
							default: tt(() => [Qe(R(e.label), 1)]),
							_: 2
						}, 1032, ["style", "onClick"]))), 128))]),
						(I(!0), z(j, null, F(_.value.promptTabs, (e, t) => ot((I(), z("div", {
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
							M("div", Ns, R(B(O)("sidebar.generation.positive", "POSITIVE")), 1),
							M("div", {
								style: {
									"font-size": "12px",
									color: "var(--fg-color, #ddd)",
									"white-space": "pre-wrap",
									"line-height": "1.35",
									cursor: "pointer"
								},
								onClick: (t) => D(e.positive, t.currentTarget)
							}, R(e.positive), 9, Ps),
							e.negative ? (I(), z(j, { key: 0 }, [M("div", Fs, R(B(O)("sidebar.generation.negative", "NEGATIVE")), 1), M("div", {
								style: {
									"font-size": "12px",
									color: "var(--fg-color, #ddd)",
									"white-space": "pre-wrap",
									"line-height": "1.35",
									cursor: "pointer"
								},
								onClick: (t) => D(e.negative, t.currentTarget)
							}, R(e.negative), 9, Is)], 64)) : N("", !0)
						])), [[lt, n.value === t]])), 128))
					], 4)) : !_.value.ltxDirector && !_.value.ideogram && _.value.positivePrompt ? (I(), z("div", {
						key: 3,
						style: L(m("#4CAF50", {
							emphasis: !0,
							startAlpha: .16,
							endAlpha: .1
						}))
					}, [M("div", Ls, [M("span", null, R(B(O)("sidebar.generation.positivePrompt", "Positive Prompt")), 1), _.value.positivePromptOverride ? (I(), z("span", {
						key: 0,
						style: L(g()),
						title: B(O)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
					}, R(B(O)("sidebar.generation.override", "override")), 13, Rs)) : N("", !0)]), M("div", {
						title: B(O)("action.clickToCopy", "Click to copy"),
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.9))",
							"line-height": "1.5",
							"white-space": "pre-wrap",
							"word-break": "break-word",
							cursor: "pointer"
						},
						onClick: t[4] ||= (e) => D(_.value.positivePrompt, e.currentTarget)
					}, R(_.value.positivePrompt), 9, zs)], 4)) : N("", !0),
					!_.value.ltxDirector && !_.value.ideogram && !_.value.promptTabs.length && _.value.negativePrompt ? (I(), z("div", {
						key: 4,
						style: L(m("#F44336", {
							emphasis: !0,
							startAlpha: .16,
							endAlpha: .1
						}))
					}, [M("div", Bs, [M("span", null, R(B(O)("sidebar.generation.negativePrompt", "Negative Prompt")), 1), _.value.negativePromptOverride ? (I(), z("span", {
						key: 0,
						style: L(g()),
						title: B(O)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
					}, R(B(O)("sidebar.generation.override", "override")), 13, Vs)) : N("", !0)]), M("div", {
						title: B(O)("action.clickToCopy", "Click to copy"),
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.9))",
							"line-height": "1.5",
							"white-space": "pre-wrap",
							"word-break": "break-word",
							cursor: "pointer"
						},
						onClick: t[5] ||= (e) => D(_.value.negativePrompt, e.currentTarget)
					}, R(_.value.negativePrompt), 9, Hs)], 4)) : N("", !0)
				], 64)) : N("", !0),
				y.value ? (I(), z("div", {
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
					class: Dt({ "mjr-ai-disabled-block": !v.value })
				}, [
					_.value.showAlignment ? (I(), z(j, { key: 0 }, [
						M("div", Us, [M("span", { title: B(O)("sidebar.generation.promptAlignmentTooltip", "How closely the generated image matches the prompt (SigLIP2 score)") }, R(B(O)("sidebar.generation.promptAlignment", "Prompt Alignment")), 9, Ws)]),
						M("div", Gs, [
							M("div", Ks, [M("div", { style: L({
								height: "100%",
								width: l.value.fillWidth,
								background: l.value.fillColor,
								borderRadius: "4px",
								transition: "width 0.6s ease, background 0.4s ease"
							}) }, null, 4)]),
							M("span", { style: L({
								fontSize: "13px",
								fontWeight: "700",
								color: l.value.scoreColor,
								minWidth: "60px",
								textAlign: "right",
								fontFamily: "'Consolas', 'Monaco', monospace"
							}) }, R(l.value.scoreText), 5),
							M("span", { style: L({
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
						l.value.aiStatusVisible ? (I(), z("div", qs, R(l.value.aiStatusText), 1)) : N("", !0)
					], 64)) : N("", !0),
					M("div", Js, [M("span", { title: B(O)("sidebar.generation.aiCaptionTooltip", "AI caption generated by Florence-2") }, R(_.value.captionLabel), 9, Ys), M("div", Xs, [gt(r, {
						type: "button",
						class: "mjr-ai-control",
						severity: "secondary",
						text: "",
						disabled: !x.value || s.value,
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
						onClick: at(se, ["stop"])
					}, {
						default: tt(() => [Qe(R(o.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"]), gt(r, {
						type: "button",
						class: "mjr-ai-control",
						severity: "secondary",
						text: "",
						disabled: !S.value,
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
							opacity: S.value ? "1" : "0.6",
							cursor: S.value ? "pointer" : "default"
						}]),
						onClick: at(ce, ["stop"])
					}, {
						default: tt(() => [Qe(R(a.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"])])]),
					M("div", {
						title: v.value ? B(O)("sidebar.generation.copyCaptionTooltip", "Click to copy caption") : B(O)("sidebar.generation.aiCaptionDisabled", "AI caption controls are disabled"),
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
							cursor: S.value ? "copy" : "default"
						}),
						onClick: ce
					}, R(b.value), 13, Zs)
				], 2)) : N("", !0),
				C.value.length ? (I(), z("div", {
					key: 6,
					style: L(m("#9C27B0", {
						emphasis: !0,
						startAlpha: .18,
						endAlpha: .1
					}))
				}, [M("div", Qs, R(B(O)("sidebar.generation.models", "Models")), 1), M("div", $s, [(I(!0), z(j, null, F(C.value, (e) => (I(), z("div", {
					key: `models-top-${e.key}`,
					style: L(w(T(e), !0))
				}, [
					M("div", { style: L({
						fontSize: "10px",
						fontWeight: "800",
						color: T(e),
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
					}, [M("span", ec, R(t.label), 1), M("span", {
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.96))",
							"line-height": "1.35",
							"word-break": "break-word",
							cursor: "pointer"
						},
						onClick: (e) => D(t.value, e.currentTarget)
					}, R(t.value || "-"), 9, tc)]))), 128)),
					e.loras.length ? (I(), z("div", nc, [t[14] ||= M("span", { style: {
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
						onClick: (e) => D(t, e.currentTarget)
					}, R(t), 9, rc))), 128))])) : N("", !0)
				], 4))), 128))])], 4)) : N("", !0),
				_.value.lyrics ? (I(), z("div", {
					key: 7,
					style: L(m("#00BCD4", { emphasis: !1 }))
				}, [M("div", ic, [M("span", null, R(B(O)("sidebar.generation.lyrics", "Lyrics")), 1)]), M("div", ac, R(_.value.lyrics), 1)], 4)) : N("", !0),
				_.value.branchCards.length ? (I(), z(j, { key: 8 }, [
					N("", !0),
					ee.value.length ? (I(), z("div", {
						key: 1,
						style: L(m("#FF9800", {
							emphasis: !0,
							startAlpha: .16,
							endAlpha: .1
						}))
					}, [M("div", oc, R(B(O)("sidebar.generation.sampling", "Sampling")), 1), M("div", sc, [(I(!0), z(j, null, F(ee.value, (e) => (I(), z("div", {
						key: `sampling-${e.key}`,
						style: L(w(E(e), !0))
					}, [M("div", { style: L({
						fontSize: "10px",
						fontWeight: "800",
						color: E(e),
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
						onClick: (e) => D(t.value, e.currentTarget)
					}, R(t.value), 9, cc)]))), 128))], 4))), 128))])], 4)) : N("", !0),
					N("", !0)
				], 64)) : _.value.modelGroups.length ? (I(), z("div", {
					key: 9,
					style: L(m("#9C27B0", {
						emphasis: !0,
						startAlpha: .18,
						endAlpha: .1
					}))
				}, [M("div", lc, R(B(O)("sidebar.generation.models", "Models")), 1), M("div", uc, [(I(!0), z(j, null, F(_.value.modelGroups, (e) => (I(), z("div", {
					key: `model-group-${e.key}`,
					style: L(w(re(e.key), !0))
				}, [
					M("div", dc, [M("div", { style: L({
						fontSize: "10px",
						fontWeight: "800",
						color: re(e.key),
						letterSpacing: "0.6px",
						textTransform: "uppercase"
					}) }, R(e.label), 5), M("span", { style: L({
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
					M("div", fc, [t[15] ||= M("div", { style: {
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
						onClick: (t) => D(e.model, t.currentTarget)
					}, R(e.model || "-"), 9, pc)]),
					e.loras?.length ? (I(), z("div", mc, [M("div", hc, R(B(O)("sidebar.generation.loraStack", "LoRA Stack")), 1), M("div", gc, [(I(!0), z(j, null, F(e.loras, (t, n) => (I(), z("div", {
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
					}, R(t), 9, _c))), 128))])])) : N("", !0)
				], 4))), 128))])], 4)) : N("", !0),
				(I(!0), z(j, null, F(te.value, (e) => (I(), z("div", {
					key: e.key,
					style: L(m(e.accent, { emphasis: e.emphasis }))
				}, [M("div", { style: L({
					fontSize: "11px",
					fontWeight: "600",
					color: e.accent,
					textTransform: "uppercase",
					letterSpacing: "0.5px",
					marginBottom: "10px"
				}) }, R(e.title), 5), M("div", vc, [(I(!0), z(j, null, F(e.fields, (t) => (I(), z(j, { key: `${e.key}-${t.label}` }, [M("div", {
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
					style: L(g()),
					title: B(O)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
				}, R(B(O)("sidebar.generation.override", "override")), 13, bc)) : N("", !0)], 8, yc), M("div", {
					title: `${t.label}: ${t.value}`,
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.95))",
						"word-break": "break-word",
						"white-space": "pre-wrap",
						cursor: "pointer"
					},
					onClick: (e) => D(t.value, e.currentTarget)
				}, R(t.value), 9, xc)], 64))), 128))])], 4))), 128)),
				_.value.notesFields.length ? (I(), z("div", {
					key: 10,
					style: L(m("#4CAF50", { emphasis: !1 }))
				}, [M("div", Sc, R(B(O)("sidebar.generation.notes", "Notes")), 1), (I(!0), z(j, null, F(_.value.notesFields, (e) => (I(), z("div", {
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
				}, R(e.value), 9, Cc))), 128))], 4)) : N("", !0),
				_.value.moduleBlocks.length ? (I(), z("div", {
					key: 11,
					style: L(m("#26C6DA", {
						emphasis: !0,
						startAlpha: .14,
						endAlpha: .08
					}))
				}, [M("div", wc, R(B(O)("sidebar.generation.modules", "Modules")), 1), M("div", Tc, [(I(!0), z(j, null, F(_.value.moduleBlocks, (e) => (I(), z("div", {
					key: `module-${e.key}-${e.title}`,
					style: L(w(e.accent, !1))
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
				}, [M("span", Ec, R(t.label), 1), M("span", {
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
				}, R(t.value), 9, Dc)]))), 128))], 4))), 128))])], 4)) : N("", !0),
				_.value.ttsInstruction ? (I(), z("div", {
					key: 12,
					style: L(m("#26A69A", { emphasis: !1 }))
				}, [M("div", Oc, [M("span", null, R(B(O)("sidebar.generation.ttsInstruction", "TTS Instruction")), 1)]), M("div", {
					title: B(O)("action.clickToCopy", "Click to copy"),
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: t[6] ||= (e) => D(_.value.ttsInstruction, e.currentTarget)
				}, R(_.value.ttsInstruction), 9, kc)], 4)) : N("", !0),
				_.value.seed !== null && _.value.seed !== void 0 && _.value.seed !== "" ? (I(), z("div", {
					key: 13,
					style: L(h())
				}, [M("div", Ac, R(B(O)("sidebar.generation.seed", "SEED")), 1), M("div", {
					title: B(O)("sidebar.generation.copySeedTooltip", "Click to copy seed: {seed}", { seed: _.value.seed }),
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
					onClick: t[7] ||= (e) => D(_.value.seed, e.currentTarget, "rgba(76, 175, 80, 0.4)")
				}, R(_.value.seed), 9, jc)], 4)) : N("", !0),
				_.value.inputFiles.length ? (I(), z("div", {
					key: 14,
					style: L(m("#4CAF50", {
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
				}, R(B(O)("sidebar.generation.sourceFiles", "Source Files")), 9, Mc), M("div", Nc, [(I(!0), z(j, null, F(_.value.inputFiles, (e) => (I(), $e(Po, {
					key: e.id,
					"input-file": e
				}, null, 8, ["input-file"]))), 128))])], 4)) : N("", !0)
			]));
		};
	}
}), Fc = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "var(--comfy-menu-bg, rgba(0,0,0,0.2))",
		border: "1px solid var(--border-color, rgba(255,255,255,0.14))",
		"border-radius": "8px",
		padding: "12px",
		"min-width": "300px"
	}
}, Ic = { style: { "margin-bottom": "12px" } }, Lc = { style: {
	"font-size": "16px",
	"font-weight": "800",
	color: "rgba(255,255,255,0.94)",
	"line-height": "1.25",
	overflow: "hidden",
	"text-overflow": "ellipsis"
} }, Rc = ["title"], zc = {
	key: 1,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "6px",
		"margin-top": "8px",
		"min-width": "0"
	},
	"aria-label": "Workflow metadata badges"
}, Bc = ["title"], Vc = { style: {
	overflow: "hidden",
	"text-overflow": "ellipsis",
	"white-space": "nowrap"
} }, Hc = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "8px",
	"margin-bottom": "10px"
} }, Uc = { style: {
	padding: "4px 9px",
	"border-radius": "999px",
	background: "rgba(33,150,243,0.14)",
	border: "1px solid rgba(33,150,243,0.30)",
	"font-size": "11px",
	"font-weight": "700",
	color: "#90CAF9",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Wc = {
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
}, Gc = { style: {
	display: "grid",
	"grid-template-columns": "repeat(2, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, Kc = {
	key: 0,
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
	key: 1,
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
	key: 2,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, Zc = { style: {
	"font-size": "13px",
	"font-weight": "750",
	color: "rgba(255,255,255,0.92)",
	"margin-top": "3px"
} }, Qc = {
	key: 3,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, $c = { style: {
	"font-size": "12px",
	"font-weight": "650",
	color: "rgba(255,255,255,0.84)",
	"margin-top": "3px"
} }, el = {
	key: 0,
	style: {
		"font-size": "11px",
		color: "rgba(255,255,255,0.54)",
		"margin-top": "2px"
	}
}, tl = {
	key: 0,
	style: {
		"margin-bottom": "12px",
		padding: "10px",
		"border-radius": "10px",
		background: "rgba(244,67,54,0.08)",
		border: "1px solid rgba(244,67,54,0.25)"
	}
}, nl = {
	key: 1,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "5px"
	}
}, rl = {
	key: 1,
	style: {
		"margin-bottom": "12px",
		padding: "10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.035)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, il = {
	key: 0,
	style: {
		"font-size": "12px",
		"line-height": "1.45",
		color: "rgba(255,255,255,0.82)",
		"white-space": "pre-wrap"
	}
}, al = { style: {
	display: "grid",
	"grid-template-columns": "repeat(3, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, ol = {
	key: 2,
	style: {
		"margin-bottom": "12px",
		padding: "10px",
		"border-radius": "10px",
		background: "rgba(76,175,80,0.07)",
		border: "1px solid rgba(76,175,80,0.22)"
	}
}, sl = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "7px"
} }, cl = { style: {
	"font-size": "11px",
	color: "rgba(255,255,255,0.62)"
} }, ll = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "6px"
	}
}, ul = {
	key: 0,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "5px"
	}
}, dl = {
	key: 1,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "5px"
	}
}, fl = {
	key: 1,
	style: {
		"font-size": "12px",
		color: "rgba(255,255,255,0.78)"
	}
}, pl = {
	key: 2,
	style: {
		"margin-top": "7px",
		"font-size": "11px",
		color: "rgba(255,255,255,0.58)"
	}
}, ml = {
	key: 3,
	style: {
		"margin-top": "8px",
		"font-size": "11px",
		color: "rgba(255,255,255,0.62)"
	}
}, hl = { key: 0 }, gl = { style: {
	display: "grid",
	"grid-template-columns": "repeat(3, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
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
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, Sl = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, Cl = {
	key: 3,
	style: {
		"margin-bottom": "12px",
		padding: "10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.03)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, wl = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px",
	"margin-bottom": "8px",
	"min-width": "0"
} }, Tl = { style: {
	"min-width": "0",
	flex: "1 1 auto"
} }, El = ["title"], Dl = ["title"], Ol = { style: {
	display: "flex",
	gap: "8px",
	"align-items": "center"
} }, kl = ["placeholder"], Al = {
	key: 4,
	class: "mjr-workflow-tree-wrap"
}, jl = { class: "mjr-workflow-tree-node" }, Ml = { class: "mjr-workflow-tree-node-name" }, Nl = {
	key: 0,
	class: "mjr-workflow-tree-node-type"
}, Pl = { class: "mjr-menu-item-hint" }, Fl = {
	key: 0,
	class: "mjr-section-hint"
}, Il = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px",
	"margin-top": "8px"
} }, Ll = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"align-items": "center"
} }, Rl = {
	key: 5,
	style: {
		display: "grid",
		"grid-template-columns": "repeat(auto-fit, minmax(180px, 1fr))",
		gap: "8px",
		"align-items": "stretch",
		"margin-top": "10px",
		"margin-bottom": "10px"
	}
}, zl = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "2px",
	"min-width": "0"
} }, Bl = { style: {
	"font-size": "13px",
	"font-weight": "600"
} }, Vl = { style: {
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, Hl = { style: {
	display: "flex",
	gap: "10px",
	"align-items": "stretch",
	"margin-top": "10px"
} }, Ul = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	gap: "10px",
	"margin-top": "8px",
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, Wl = ["open"], Gl = { style: {
	background: "rgba(0,0,0,0.5)",
	padding: "10px",
	"border-radius": "6px",
	"font-size": "11px",
	overflow: "auto",
	"max-height": "180px",
	margin: "10px 0 0 0",
	color: "#90CAF9",
	"font-family": "'Consolas', 'Monaco', monospace"
} }, Kl = 1, ql = 8, Jl = 250, Yl = /* @__PURE__ */ rt({
	__name: "SidebarWorkflowSection",
	props: { asset: {} },
	setup(e) {
		let n = e, r = Object.freeze({
			nodeColors: !0,
			showLinks: !0,
			showGroups: !0,
			renderBypassState: !0,
			renderErrorState: !0,
			showViewport: !0,
			showNodeLabels: !1,
			size: "comfortable"
		}), i = Object.freeze({
			zoom: 1,
			centerX: null,
			centerY: null,
			hoveredNodeId: null
		}), a = Object.freeze([
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
		]), o = V(null), s = V(""), c = V(!1), l = V(!1), d = V(null), f = V(!1), p = V(null), m = V([]), g = V(null), v = V(!1), y = V(!1), b = V(ce()), x = V({ ...i }), S = V("crosshair"), C = V(""), te = null, w = null, T = null;
		function E(e, t, n) {
			let r = Number(e);
			return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
		}
		function re(e) {
			e && typeof e == "object" && (x.value = {
				...x.value,
				zoom: E(e.zoom ?? x.value.zoom, Kl, ql),
				centerX: Number.isFinite(Number(e.centerX)) ? Number(e.centerX) : null,
				centerY: Number.isFinite(Number(e.centerY)) ? Number(e.centerY) : null
			});
		}
		function D() {
			x.value = { ...i }, C.value = "";
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
				for (let [, e] of t.slice(0, 50)) if (e && typeof e == "object" && (e.inputs && typeof e.inputs == "object" && (n += 1), n >= 2)) return !0;
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
				let e = qt?.()?.workflowMinimap;
				if (e && typeof e == "object") return {
					...r,
					...e
				};
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let e = localStorage?.getItem?.(Ce);
				if (!e) return { ...r };
				let t = JSON.parse(e);
				if (!t || typeof t != "object") return { ...r };
				let n = {
					...r,
					...t
				};
				try {
					let e = qt();
					e.workflowMinimap = {
						...e.workflowMinimap,
						...n
					}, G(e), localStorage?.removeItem?.(Ce);
				} catch (e) {
					console.debug?.(e);
				}
				return n;
			} catch {
				return { ...r };
			}
		}
		function le(e) {
			try {
				let t = qt();
				t.workflowMinimap = {
					...t.workflowMinimap,
					...e
				}, G(t);
			} catch (e) {
				console.debug?.(e);
			}
		}
		let ue = P(() => {
			let e = oe(n.asset) || oe(d.value), t = se(n.asset) || se(d.value);
			return !e && !t ? null : e || ma(t);
		}), de = P(() => String(n.asset?.filepath || n.asset?.path || n.asset?.file_info?.filepath || "").trim()), fe = P(() => {
			if (de.value.toLowerCase().endsWith(".json")) return !0;
			let e = String(n.asset?.kind || "").trim().toLowerCase(), t = String(n.asset?.source || "").trim().toLowerCase();
			return e === "workflow" || t === "workflow";
		}), pe = P(() => String(n.asset?.display_name || n.asset?.name || n.asset?.filename || n.asset?.title || "Workflow").trim()), me = P(() => String(n.asset?.task || n.asset?.workflow_task || "").trim()), he = P(() => String(n.asset?.model_family || n.asset?.workflow_model_family || "").trim()), ge = P(() => String(n.asset?.provider || n.asset?.workflow_provider || "").trim()), _e = P(() => String(n.asset?.runs_on || n.asset?.runsOn || "").trim().toLowerCase()), ve = P(() => {
			let e = _e.value, t = ge.value;
			return e === "api" && t ? `API · ${t}` : e ? t && t.toLowerCase() !== e ? `${e} · ${t}` : e : t;
		}), ye = P(() => String(n.asset?.notes || "").trim()), be = P(() => [
			n.asset?.detected_task ? `detected: ${n.asset.detected_task}` : "",
			n.asset?.detected_model_family ? n.asset.detected_model_family : "",
			n.asset?.detected_provider ? n.asset.detected_provider : ""
		].filter(Boolean).join(" · ")), Se = P(() => ze(n.asset?.missing_nodes || n.asset?.missingNodes)), we = P(() => ze(n.asset?.missing_models || n.asset?.missingModels)), Te = P(() => ze(n.asset?.tags || n.asset?.workflow_tags || n.asset?.tags_json)), De = P(() => Te.value.slice(0, 3)), Oe = P(() => Math.max(0, Te.value.length - De.value.length)), ke = P(() => ze(p.value?.missing_nodes)), Ae = P(() => ze(p.value?.missing_models)), je = P(() => ze(p.value?.warnings)), Me = P(() => {
			let e = p.value;
			return e ? `${Number(e.node_count || 0)} nodes | ${Number(e.subgraph_count || 0)} subgraphs | ${Array.isArray(e.required_nodes) ? e.required_nodes.length : 0} node types` : "";
		}), Ne = P(() => {
			let e = m.value?.[0];
			return e ? String(e.filename || "").replace(/\.json$/i, "") : "";
		}), Pe = P(() => {
			let e = g.value;
			return e ? `${Number(e.changed?.length || 0)} changed | ${Number(e.added?.length || 0)} added | ${Number(e.removed?.length || 0)} removed` : "";
		}), Fe = P(() => {
			let e = Number(n.asset?.usage_count || n.asset?.usageCount || 0);
			return !Number.isFinite(e) || e <= 0 ? "" : `${Math.floor(e)} use${e === 1 ? "" : "s"}`;
		}), Ie = P(() => A(n.asset?.last_loaded_at || n.asset?.lastLoadedAt)), Le = P(() => A(n.asset?.mtime || n.asset?.modified_at || n.asset?.updated_at)), k = P(() => {
			let e = [];
			n.asset?.favorite && e.push({
				key: "favorite",
				label: "Favorite",
				icon: "pi pi-star-fill",
				tone: "favorite"
			}), Fe.value && e.push({
				key: "usage",
				label: Fe.value,
				icon: "pi pi-play-circle",
				tone: "usage"
			}), Ie.value && e.push({
				key: "last-loaded",
				label: `Loaded ${Ie.value}`,
				icon: "pi pi-clock",
				tone: "loaded"
			});
			for (let t of De.value) e.push({
				key: `tag-${t}`,
				label: t,
				icon: "pi pi-tag",
				tone: "tag"
			});
			return Oe.value && e.push({
				key: "tags-more",
				label: `+${Oe.value} tags`,
				icon: "pi pi-tags",
				tone: "tag"
			}), e;
		});
		function Re(e) {
			let t = "display:inline-flex;align-items:center;gap:5px;max-width:100%;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:750;line-height:1.1;overflow:hidden";
			return e === "favorite" ? `${t};background:rgba(255,193,7,0.15);border:1px solid rgba(255,193,7,0.34);color:#ffe082` : e === "usage" ? `${t};background:rgba(33,150,243,0.14);border:1px solid rgba(33,150,243,0.30);color:#90caf9` : e === "loaded" ? `${t};background:rgba(76,175,80,0.13);border:1px solid rgba(76,175,80,0.28);color:#a5d6a7` : `${t};background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.14);color:rgba(255,255,255,0.82)`;
		}
		function ze(e) {
			if (Array.isArray(e)) return e.map((e) => String(e || "").trim()).filter(Boolean);
			if (typeof e == "string") {
				let t = e.trim();
				if (!t) return [];
				try {
					let e = JSON.parse(t);
					if (Array.isArray(e)) return ze(e);
				} catch {
					return t.split(/[,\n]/).map((e) => e.trim()).filter(Boolean);
				}
			}
			return [];
		}
		function A(e) {
			let t = Number(e);
			if (!Number.isFinite(t) || t <= 0) return "";
			let n = t > 1e10 ? t : t * 1e3;
			try {
				return new Date(n).toLocaleString();
			} catch {
				return "";
			}
		}
		async function Be() {
			if (ue.value) return;
			let e = de.value;
			if (e && !l.value) {
				l.value = !0;
				try {
					let t = await ee(e, { timeoutMs: 25e3 });
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
		let Ve = P(() => n.asset?.has_generation_data ? "Complete" : "Partial"), He = P(() => ue.value ? JSON.stringify(ue.value, null, 2) : ""), We = P(() => String(n.asset?.category || n.asset?.subfolder || n.asset?.folder || "").trim().replace(/^\/+|\/+$/g, "")), Ge = P(() => We.value ? We.value.split(/[\\/]+/).filter(Boolean) : []), Ke = P(() => Ge.value.at(-1) || We.value || "Root"), qe = P(() => Ge.value.slice(-1));
		function Je(e, t) {
			let n = e?.id ?? e?.key ?? t + 1;
			return String(e?.title || e?._meta?.title || e?.type || e?.class_type || e?.name || `Node ${n}`);
		}
		function Ye(e) {
			return String(e?.type || e?.class_type || e?.name || "").trim();
		}
		function Xe() {
			s.value = We.value;
		}
		async function rt() {
			if (!fe.value) return;
			let e = String(n.asset?.filepath || n.asset?.path || n.asset?.file_info?.filepath || "").trim();
			if (!e) {
				t(O("toast.workflowMissingPath", "Workflow file path is missing."), "error");
				return;
			}
			let r = String(s.value || "").trim();
			if (r !== We.value) {
				c.value = !0;
				try {
					let n = await _({
						filepath: e,
						category: r
					}, { timeoutMs: 3e4 });
					if (!n?.ok) {
						t(n?.error || O("toast.workflowMoveFailed", "Failed to move workflow."), "error");
						return;
					}
					s.value = String(n?.data?.workflow?.category || r || "").trim(), t(O("toast.workflowCategoryUpdated", "Workflow category updated"), "success", 1800);
				} catch {
					t(O("toast.workflowMoveFailed", "Failed to move workflow."), "error");
				} finally {
					c.value = !1;
				}
			}
		}
		async function at() {
			let e = de.value;
			if (!e) {
				t(O("toast.workflowMissingPath", "Workflow file path is missing."), "error");
				return;
			}
			let r = await Ee({
				filepath: e,
				limit: 12
			}, { timeoutMs: 15e3 });
			if (!r?.ok) {
				t(r?.error || O("toast.workflowLoadFailed", "Failed to load workflow."), "error");
				return;
			}
			let i = Array.isArray(r.data) ? r.data : [];
			if (!i.length) {
				t(O("toast.workflowThumbnailNoCandidates", "No linked outputs are available for this workflow yet."), "warning", 2600);
				return;
			}
			let a = await ga({
				title: O("ctx.setWorkflowThumbnail", "Set workflow thumbnail"),
				workflow: n.asset,
				items: i
			});
			if (!a?.filepath) return;
			let o = await h({
				filepath: e,
				source_filepath: a.filepath
			}, { timeoutMs: 3e4 });
			if (!o?.ok) {
				t(o?.error || O("toast.workflowSaveFailed", "Failed to save workflow."), "error");
				return;
			}
			t(O("toast.workflowUpdated", "Workflow updated"), "success", 1800), window?.dispatchEvent?.(new CustomEvent("mjr:reload-grid", { detail: { reason: "workflow-thumbnail-sidebar" } }));
		}
		async function st() {
			if (await Be(), !ue.value) {
				t(O("toast.workflowLoadFailed", "Failed to load workflow."), "error");
				return;
			}
			try {
				await Ze.openAssets({
					assets: [{
						...n.asset,
						workflow: ue.value,
						Workflow: ue.value
					}],
					index: 0,
					mode: "graph"
				});
			} catch (e) {
				console.debug?.(e), t(O("toast.workflowLoadFailed", "Failed to load workflow."), "error");
			}
		}
		async function ct() {
			let e = de.value;
			if (!e) {
				t(O("toast.workflowMissingPath", "Workflow file path is missing."), "error");
				return;
			}
			f.value = !0, p.value = null, m.value = [], g.value = null;
			try {
				let [n, r] = await Promise.all([u(e, { timeoutMs: 2e4 }), ne(e, { timeoutMs: 15e3 })]);
				if (!n?.ok) {
					t(n?.error || O("toast.workflowLoadFailed", "Failed to load workflow."), "error");
					return;
				}
				p.value = n.data || {}, m.value = Array.isArray(r?.data?.versions) ? r.data.versions : [];
				let i = m.value[0];
				if (i?.filepath) {
					let t = await xe(e, i.filepath, { timeoutMs: 15e3 });
					t?.ok && (g.value = t.data || null);
				}
			} catch (e) {
				console.debug?.(e), t(O("toast.workflowLoadFailed", "Failed to load workflow."), "error");
			} finally {
				f.value = !1;
			}
		}
		let lt = P(() => (Array.isArray(ue.value?.nodes) ? ue.value.nodes : []).slice(0, Jl).map((e, t) => {
			let n = e?.id ?? e?.key ?? t + 1, r = Ye(e);
			return {
				key: String(n),
				label: Je(e, t),
				icon: "pi pi-circle-fill",
				data: {
					id: n,
					type: r
				}
			};
		})), ut = P(() => Math.max(0, Number(dt.value.nodes || 0) - lt.value.length)), dt = P(() => {
			let e = ue.value;
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
		}), ft = P(() => {
			let e = String(b.value?.size || "comfortable");
			return a.find((t) => t.key === e) || a[1];
		}), pt = P(() => `${ft.value.height}px`), mt = P(() => [
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
			let e = o.value, t = ue.value;
			if (!e || !t) return;
			let n = Math.max(1, e.clientWidth || 320), r = Math.max(1, e.clientHeight || 120), i = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
			e.width = Math.floor(n * i), e.height = Math.floor(r * i);
			let a = e.getContext("2d");
			a && a.setTransform(i, 0, 0, i, 0, 0), w = ia(e, t, {
				...b.value,
				view: x.value
			}) || null, re(w?.resolvedView);
		}
		function _t(e) {
			Ue(e);
		}
		function vt(e) {
			let t = o.value;
			if (!t) return null;
			let n = t.getBoundingClientRect?.();
			return n ? {
				x: Number(e?.clientX) - n.left,
				y: Number(e?.clientY) - n.top
			} : null;
		}
		function yt(e) {
			let t = vt(e);
			return !t || !w?.canvasToWorld ? null : {
				local: t,
				world: w.canvasToWorld(t.x, t.y)
			};
		}
		function bt(e) {
			let t = vt(e), n = t && w?.hitTestNode ? w.hitTestNode(t.x, t.y) : null, r = n?.id !== null && n?.id !== void 0 ? String(n.id) : null, i = x.value.hoveredNodeId !== null && x.value.hoveredNodeId !== void 0 ? String(x.value.hoveredNodeId) : null;
			C.value = n?.label || "", r !== i && (x.value = {
				...x.value,
				hoveredNodeId: r
			}, ht());
		}
		function xt(e) {
			e && (_t(e), x.value = {
				...x.value,
				centerX: Number(e.x),
				centerY: Number(e.y)
			}, ht());
		}
		function St(e) {
			if (Number(e?.button ?? 0) !== 0) return;
			let t = yt(e);
			t && (T = e.pointerId ?? 1, S.value = "grabbing", o.value?.setPointerCapture?.(T), xt(t.world), bt(e), e.preventDefault?.(), e.stopPropagation?.());
		}
		function Ct(e) {
			if (T !== null && e.pointerId === T) {
				let t = yt(e);
				t && xt(t.world), e.preventDefault?.(), e.stopPropagation?.();
				return;
			}
			bt(e);
		}
		function wt(e) {
			T !== null && e?.pointerId === T && (o.value?.releasePointerCapture?.(T), T = null, S.value = "crosshair"), e?.type === "pointerleave" && (C.value = "", x.value.hoveredNodeId !== null && (x.value = {
				...x.value,
				hoveredNodeId: null
			}, ht()));
		}
		function Tt(e) {
			let t = yt(e), n = w?.resolvedView;
			if (!t || !n) return;
			let r = E(Number(e?.deltaY) || 0, -240, 240), i = Math.exp(-r * .0025), a = E((Number(x.value.zoom) || 1) * i, Kl, ql);
			if (Math.abs(a - (Number(x.value.zoom) || 1)) < .001) {
				e.preventDefault?.(), e.stopPropagation?.();
				return;
			}
			let o = Math.max(1, Number(w?.bounds?.width || 1) / a), s = Math.max(1, Number(w?.bounds?.height || 1) / a), c = E((Number(t.world.x) - Number(n.viewMinX || 0)) / Math.max(1, Number(n.visibleW || 1)), 0, 1), l = E((Number(t.world.y) - Number(n.viewMinY || 0)) / Math.max(1, Number(n.visibleH || 1)), 0, 1);
			x.value = {
				...x.value,
				zoom: a,
				centerX: Number(t.world.x) + (.5 - c) * o,
				centerY: Number(t.world.y) + (.5 - l) * s
			}, ht(), bt(e), e.preventDefault?.(), e.stopPropagation?.();
		}
		function Et(e) {
			let t = yt(e);
			D(), t && _t(t.world), ht(), e.preventDefault?.(), e.stopPropagation?.();
		}
		function At(e) {
			b.value = {
				...b.value,
				[e]: !b.value?.[e]
			}, le(b.value);
		}
		function jt(e) {
			a.some((t) => t.key === e) && (b.value = {
				...b.value,
				size: e
			}, le(b.value));
		}
		return kt(() => {
			o.value && typeof ResizeObserver == "function" && (te = new ResizeObserver(() => ht()), te.observe(o.value)), Xe(), Be(), ht();
		}), nt(ue, () => {
			D(), ht();
		}, { flush: "post" }), nt(de, () => {
			d.value = null, Be();
		}, { immediate: !0 }), nt(We, () => {
			Xe();
		}), nt(b, () => {
			ht();
		}, {
			deep: !0,
			flush: "post"
		}), nt(v, () => {
			ht();
		}, { flush: "post" }), it(() => {
			try {
				te?.disconnect?.();
			} catch (e) {
				console.debug?.(e);
			}
			te = null, T = null;
		}), (e, t) => {
			let n = et("MButton"), r = et("MTree");
			return ue.value ? (I(), z("div", Fc, [
				t[18] ||= M("div", { style: {
					"font-size": "13px",
					"font-weight": "600",
					color: "var(--fg-color, #eaeaea)",
					"margin-bottom": "12px",
					"text-transform": "uppercase",
					"letter-spacing": "0.5px"
				} }, " ComfyUI Workflow ", -1),
				M("div", Ic, [
					M("div", Lc, R(pe.value), 1),
					de.value ? (I(), z("div", {
						key: 0,
						style: {
							"font-size": "11px",
							color: "rgba(255,255,255,0.48)",
							"margin-top": "4px",
							overflow: "hidden",
							"text-overflow": "ellipsis",
							"white-space": "nowrap"
						},
						title: de.value
					}, R(de.value), 9, Rc)) : N("", !0),
					k.value.length ? (I(), z("div", zc, [(I(!0), z(j, null, F(k.value, (e) => (I(), z("span", {
						key: e.key,
						style: L(Re(e.tone)),
						title: e.label
					}, [M("i", {
						class: Dt(e.icon),
						style: {
							"font-size": "10px",
							flex: "0 0 auto"
						}
					}, null, 2), M("span", Vc, R(e.label), 1)], 12, Bc))), 128))])) : N("", !0)
				]),
				M("div", Hc, [M("div", Uc, R(Ve.value), 1), dt.value.source ? (I(), z("div", Wc, R(dt.value.source), 1)) : N("", !0)]),
				M("div", Gc, [
					me.value ? (I(), z("div", Kc, [t[3] ||= M("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Task", -1), M("div", qc, R(me.value), 1)])) : N("", !0),
					he.value ? (I(), z("div", Jc, [t[4] ||= M("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Model", -1), M("div", Yc, R(he.value), 1)])) : N("", !0),
					ve.value ? (I(), z("div", Xc, [t[5] ||= M("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Runs on", -1), M("div", Zc, R(ve.value), 1)])) : N("", !0),
					Fe.value || Le.value ? (I(), z("div", Qc, [
						t[6] ||= M("div", { style: {
							"font-size": "10px",
							"font-weight": "700",
							color: "rgba(255,255,255,0.55)",
							"text-transform": "uppercase",
							"letter-spacing": "0.4px"
						} }, "Library", -1),
						M("div", $c, R(Fe.value || Le.value), 1),
						Fe.value && Le.value ? (I(), z("div", el, R(Le.value), 1)) : N("", !0)
					])) : N("", !0)
				]),
				Se.value.length || we.value.length ? (I(), z("div", tl, [
					t[7] ||= M("div", { style: {
						"font-size": "10px",
						"font-weight": "800",
						color: "#ef9a9a",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px",
						"margin-bottom": "6px"
					} }, "Missing dependencies", -1),
					Se.value.length ? (I(), z("div", {
						key: 0,
						style: L({
							display: "flex",
							flexWrap: "wrap",
							gap: "5px",
							marginBottom: we.value.length ? "7px" : "0"
						})
					}, [(I(!0), z(j, null, F(Se.value, (e) => (I(), z("span", {
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
					we.value.length ? (I(), z("div", nl, [(I(!0), z(j, null, F(we.value, (e) => (I(), z("span", {
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
				ye.value || be.value ? (I(), z("div", rl, [ye.value ? (I(), z("div", il, R(ye.value), 1)) : N("", !0), be.value ? (I(), z("div", {
					key: 1,
					style: L({
						fontSize: "11px",
						color: "rgba(255,255,255,0.48)",
						marginTop: ye.value ? "7px" : "0"
					})
				}, R(be.value), 5)) : N("", !0)])) : N("", !0),
				M("div", al, [
					gt(n, {
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
						default: tt(() => [t[8] ||= M("i", { class: "pi pi-image" }, null, -1), M("span", null, R(B(O)("ctx.setWorkflowThumbnail", "Set workflow thumbnail")), 1)]),
						_: 1
					}),
					gt(n, {
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
						onClick: st
					}, {
						default: tt(() => [t[9] ||= M("i", { class: "pi pi-search" }, null, -1), M("span", null, R(B(O)("ctx.inspect", "Inspect")), 1)]),
						_: 1
					}),
					gt(n, {
						type: "button",
						severity: "secondary",
						text: "",
						rounded: "",
						disabled: f.value,
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
						onClick: ct
					}, {
						default: tt(() => [M("i", { class: Dt(f.value ? "pi pi-spin pi-spinner" : "pi pi-check-circle") }, null, 2), M("span", null, R(f.value ? "Checking" : "Validate"), 1)]),
						_: 1
					}, 8, ["disabled"])
				]),
				p.value ? (I(), z("div", ol, [
					M("div", sl, [t[10] ||= M("div", { style: {
						"font-size": "10px",
						"font-weight": "800",
						color: "#a5d6a7",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Workflow diagnostics", -1), M("div", cl, R(Me.value), 1)]),
					ke.value.length || Ae.value.length ? (I(), z("div", ll, [ke.value.length ? (I(), z("div", ul, [(I(!0), z(j, null, F(ke.value, (e) => (I(), z("span", {
						key: `diag-node-${e}`,
						style: {
							padding: "3px 7px",
							"border-radius": "999px",
							background: "rgba(244,67,54,0.16)",
							"font-size": "10px",
							"font-weight": "700",
							color: "#ffcdd2"
						}
					}, " Missing node: " + R(e), 1))), 128))])) : N("", !0), Ae.value.length ? (I(), z("div", dl, [(I(!0), z(j, null, F(Ae.value, (e) => (I(), z("span", {
						key: `diag-model-${e}`,
						style: {
							padding: "3px 7px",
							"border-radius": "999px",
							background: "rgba(255,152,0,0.16)",
							"font-size": "10px",
							"font-weight": "700",
							color: "#ffe0b2"
						}
					}, " Missing model: " + R(e), 1))), 128))])) : N("", !0)])) : (I(), z("div", fl, " No missing dependencies detected by the current ComfyUI runtime. ")),
					je.value.length ? (I(), z("div", pl, R(je.value.join(" | ")), 1)) : N("", !0),
					Ne.value || Pe.value ? (I(), z("div", ml, [Qe(" Latest version: " + R(Ne.value || "none"), 1), Pe.value ? (I(), z("span", hl, " | Diff: " + R(Pe.value), 1)) : N("", !0)])) : N("", !0)
				])) : N("", !0),
				M("div", gl, [
					M("div", _l, [t[11] ||= M("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Nodes", -1), M("div", vl, R(dt.value.nodes), 1)]),
					M("div", yl, [t[12] ||= M("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Links", -1), M("div", bl, R(dt.value.links), 1)]),
					M("div", xl, [t[13] ||= M("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Groups", -1), M("div", Sl, R(dt.value.groups), 1)])
				]),
				fe.value ? (I(), z("div", Cl, [M("div", wl, [M("div", Tl, [t[14] ||= M("div", { style: {
					"font-size": "10px",
					"font-weight": "700",
					color: "rgba(255,255,255,0.55)",
					"text-transform": "uppercase",
					"letter-spacing": "0.4px"
				} }, "Category", -1), M("div", {
					title: We.value || "Root",
					style: {
						"font-size": "12px",
						color: "rgba(255,255,255,0.8)",
						"margin-top": "2px",
						overflow: "hidden",
						"text-overflow": "ellipsis",
						"white-space": "nowrap",
						"max-width": "100%"
					}
				}, R(Ke.value), 9, El)]), qe.value.length ? (I(), z("div", {
					key: 0,
					title: We.value,
					style: {
						display: "flex",
						"flex-wrap": "wrap",
						gap: "4px",
						"justify-content": "flex-end",
						"min-width": "0",
						"max-width": "45%"
					}
				}, [(I(!0), z(j, null, F(qe.value, (e) => (I(), z("span", {
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
				}, R(e), 1))), 128))], 8, Dl)) : N("", !0)]), M("div", Ol, [ot(M("input", {
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
				}, null, 8, kl), [[Ot, s.value]]), gt(n, {
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
					default: tt(() => [Qe(R(c.value ? "Saving..." : "Move"), 1)]),
					_: 1
				}, 8, ["disabled", "style"])])])) : N("", !0),
				lt.value.length ? (I(), z("div", Al, [
					t[15] ||= M("div", { class: "mjr-section-title" }, " Workflow Nodes ", -1),
					gt(r, {
						value: lt.value,
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
						default: tt(({ node: e }) => [M("span", jl, [
							M("span", Ml, R(e.label), 1),
							e.data?.type ? (I(), z("span", Nl, R(e.data.type), 1)) : N("", !0),
							M("span", Pl, "#" + R(e.data?.id), 1)
						])]),
						_: 1
					}, 8, ["value"]),
					ut.value ? (I(), z("div", Fl, " +" + R(ut.value) + " more nodes ", 1)) : N("", !0)
				])) : N("", !0),
				M("div", Il, [M("div", Ll, [(I(!0), z(j, null, F(B(a), (e) => (I(), $e(n, {
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
					onClick: (t) => jt(e.key)
				}, {
					default: tt(() => [Qe(R(e.label), 1)]),
					_: 2
				}, 1032, [
					"title",
					"style",
					"onClick"
				]))), 128))]), gt(n, {
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
					onClick: t[1] ||= (e) => v.value = !v.value
				}, {
					default: tt(() => [...t[16] ||= [M("i", { class: "pi pi-sliders-h" }, null, -1)]]),
					_: 1
				}, 8, ["title"])]),
				v.value ? (I(), z("div", Rl, [(I(!0), z(j, null, F(mt.value, (e) => (I(), $e(n, {
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
					onClick: (t) => At(e.key)
				}, {
					default: tt(() => [
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
							class: Dt(e.iconClass),
							style: {
								"font-size": "18px",
								opacity: "0.9",
								width: "18px"
							}
						}, null, 2),
						M("div", zl, [M("div", Bl, R(e.label), 1), M("div", Vl, R(b.value?.[e.key] ? "On" : "Off"), 1)])
					]),
					_: 2
				}, 1032, ["style", "onClick"]))), 128))])) : N("", !0),
				M("div", Hl, [M("canvas", {
					ref_key: "canvasRef",
					ref: o,
					style: L({
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
					onPointerdown: St,
					onPointermove: Ct,
					onPointerup: wt,
					onPointercancel: wt,
					onPointerleave: wt,
					onWheel: Tt,
					onDblclick: Et
				}, null, 36)]),
				M("div", Ul, [M("span", null, R(C.value || "Click/drag to navigate | wheel to zoom"), 1), M("span", null, R(Math.round((x.value.zoom || 1) * 100)) + "% | " + R(ft.value.label), 1)]),
				M("details", {
					open: y.value,
					style: { "margin-top": "10px" },
					onToggle: t[2] ||= (e) => y.value = e.target.open
				}, [t[17] ||= M("summary", { style: {
					cursor: "pointer",
					color: "var(--mjr-muted, rgba(255,255,255,0.65))",
					"font-size": "12px",
					"user-select": "none"
				} }, " Show raw JSON ", -1), M("pre", Gl, R(He.value), 1)], 40, Wl)
			])) : N("", !0);
		};
	}
});
//#endregion
export { qt as $, di as A, Tr as B, Bi as C, Ii as D, Li as E, Qr as F, Or as G, jr as H, Xr as I, Er as J, Ar as K, Lr as L, wi as M, ui as N, Ei as O, Ci as P, K as Q, Fr as R, Ji as S, Fi as T, Y as U, Pr as V, Dr as W, yr as X, br as Y, ln as Z, X as _, Na as a, qi as b, ja as c, Ea as d, G as et, Ta as f, ha as g, ga as h, Ba as i, fi as j, Di as k, Aa as l, _a as m, Pc as n, Pa as o, Da as p, Mr as q, Eo as r, ka as s, Yl as t, ba as u, ia as v, zi as w, Gi as x, ma as y, Ir as z };
