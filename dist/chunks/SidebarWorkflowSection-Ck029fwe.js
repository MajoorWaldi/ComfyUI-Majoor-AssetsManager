import { $ as e, At as t, Bt as n, Ct as r, Dt as i, Et as a, Ft as o, G as s, Gt as c, I as l, It as u, J as d, Jt as f, Kt as p, Lt as m, Mt as h, N as g, O as _, Ot as v, Pt as y, Q as b, R as x, S, St as C, T as ee, Tt as te, Ut as w, X as T, Y as ne, Z as re, at as E, bt as ie, ct as ae, et as oe, kt as se, nn as ce, nt as le, ot as D, p as ue, qt as O, rt as de, st as fe, tn as pe, tt as me, w as he, wt as ge, xt as _e, yt as ve, zt as ye } from "./viewerRuntimeHosts-BbCWOXEG.js";
import { K as be, N as xe, T as Se, c as Ce, d as we, f as Te, h as Ee, l as De, m as k, o as A, p as Oe, pt as ke, s as j, u as Ae, y as je } from "./events-CrhYyn_G.js";
import { A as Me, D as Ne, a as Pe, g as Fe, h as Ie, i as Le, t as Re } from "./mediaFps-Td0vBA3X.js";
import { t as ze } from "./floatingViewerManager-DzL_6l33.js";
import { A as Be, B as M, C as N, D as Ve, E as P, G as He, H as F, J as Ue, L as We, O as I, R as Ge, S as Ke, T as L, W as qe, _ as Je, a as Ye, b as Xe, c as Ze, ct as R, d as Qe, dt as z, f as $e, g as et, h as tt, i as nt, j as rt, k as B, l as it, lt as at, m as ot, n as st, nt as V, o as ct, p as lt, q as ut, r as dt, s as ft, t as pt, tt as mt, u as ht, ut as H, y as gt } from "./mjr-primevue-n1rsQYJg.js";
import { t as _t } from "./mjr-vue-vendor-D2GeV7Qd.js";
import { a as vt, i as yt, n as bt, o as xt, r as St, t as Ct } from "./geninfoParser-DT2lH88v.js";
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
}, wt = (e, t, n) => {
	let r = typeof e == "string" ? e.trim() : String(e ?? "");
	return t.includes(r) ? r : n;
}, Tt = (e) => e === "__proto__" || e === "prototype" || e === "constructor", Et = (e, t) => {
	let n = { ...e };
	return !t || typeof t != "object" || Object.keys(t).forEach((r) => {
		if (Tt(r)) return;
		let i = t[r];
		i && typeof i == "object" && !Array.isArray(i) ? n[r] = Et(e[r] || {}, i) : i !== void 0 && (n[r] = i);
	}), n;
}, Dt = Object.freeze({
	small: 80,
	medium: 120,
	large: 180
}), Ot = Object.freeze([
	"small",
	"medium",
	"large"
]), kt = (e, t) => Math.max(60, Math.min(600, Math.round(W(e, t)))), At = (e = {}) => {
	let t = Number(e?.minSize);
	if (Number.isFinite(t)) return kt(t, j.GRID_MIN_SIZE);
	let n = wt(String(e?.minSizePreset || "").toLowerCase(), Ot, "");
	return n ? Dt[n] : kt(e?.minSize, j.GRID_MIN_SIZE);
}, jt = (e = {}) => kt(e?.minSize, j.FEED_GRID_MIN_SIZE), Mt = (e) => {
	let t = Math.round(W(e, j.GRID_MIN_SIZE));
	return t <= 100 ? "small" : t >= 150 ? "large" : "medium";
}, G = {
	debug: {
		safeCall: j.DEBUG_SAFE_CALL,
		safeListeners: j.DEBUG_SAFE_LISTENERS,
		viewer: j.DEBUG_VIEWER
	},
	grid: {
		pageSize: j.DEFAULT_PAGE_SIZE,
		minSize: j.GRID_MIN_SIZE,
		minSizePreset: Mt(j.GRID_MIN_SIZE),
		gap: j.GRID_GAP,
		showExtBadge: j.GRID_SHOW_BADGES_EXTENSION,
		showRatingBadge: j.GRID_SHOW_BADGES_RATING,
		showTagsBadge: j.GRID_SHOW_BADGES_TAGS,
		showDetails: j.GRID_SHOW_DETAILS,
		showFilename: j.GRID_SHOW_DETAILS_FILENAME,
		showDate: j.GRID_SHOW_DETAILS_DATE,
		showDimensions: j.GRID_SHOW_DETAILS_DIMENSIONS,
		showGenTime: j.GRID_SHOW_DETAILS_GENTIME,
		showHoverInfo: j.GRID_SHOW_HOVER_INFO,
		showWorkflowDot: j.GRID_SHOW_WORKFLOW_DOT,
		workflowGroupBy: j.WORKFLOW_GRID_GROUP_BY,
		videoAutoplayMode: j.GRID_VIDEO_AUTOPLAY_MODE,
		starColor: j.BADGE_STAR_COLOR,
		badgeImageColor: j.BADGE_IMAGE_COLOR,
		badgeVideoColor: j.BADGE_VIDEO_COLOR,
		badgeAudioColor: j.BADGE_AUDIO_COLOR,
		badgeModel3dColor: j.BADGE_MODEL3D_COLOR,
		badgeDuplicateAlertColor: j.BADGE_DUPLICATE_ALERT_COLOR
	},
	infiniteScroll: {
		enabled: j.INFINITE_SCROLL_ENABLED,
		rootMargin: j.INFINITE_SCROLL_ROOT_MARGIN,
		threshold: j.INFINITE_SCROLL_THRESHOLD,
		bottomGapPx: j.BOTTOM_GAP_PX
	},
	siblings: { hidePngSiblings: !0 },
	autoScan: { onStartup: j.AUTO_SCAN_ON_STARTUP },
	scan: { fastMode: !0 },
	watcher: {
		enabled: !0,
		debounceMs: j.WATCHER_DEBOUNCE_MS,
		dedupeTtlMs: j.WATCHER_DEDUPE_TTL_MS,
		maxPending: 500,
		minSize: 100,
		maxSize: 4294967296
	},
	safety: { confirmDeletion: !0 },
	status: { pollInterval: j.STATUS_POLL_INTERVAL },
	viewer: {
		allowPanAtZoom1: j.VIEWER_ALLOW_PAN_AT_ZOOM_1,
		disableWebGL: j.VIEWER_DISABLE_WEBGL_VIDEO,
		pauseDuringExecution: j.VIEWER_PAUSE_DURING_EXECUTION,
		floatingPauseDuringExecution: j.FLOATING_VIEWER_PAUSE_DURING_EXECUTION,
		mfvLiveDefault: j.MFV_LIVE_DEFAULT,
		mfvPreviewDefault: j.MFV_PREVIEW_DEFAULT,
		videoGradeThrottleFps: j.VIEWER_VIDEO_GRADE_THROTTLE_FPS,
		scopesFps: j.VIEWER_SCOPES_FPS,
		metaTtlMs: j.VIEWER_META_TTL_MS,
		metaMaxEntries: j.VIEWER_META_MAX_ENTRIES,
		mfvSidebarPosition: "right",
		mfvPreviewMethod: j.MFV_PREVIEW_METHOD,
		ltxavRgbFallback: !1
	},
	rtHydrate: {
		concurrency: j.RT_HYDRATE_CONCURRENCY,
		queueMax: j.RT_HYDRATE_QUEUE_MAX,
		seenMax: j.RT_HYDRATE_SEEN_MAX,
		pruneBudget: j.RT_HYDRATE_PRUNE_BUDGET,
		seenTtlMs: j.RT_HYDRATE_SEEN_TTL_MS
	},
	observability: {
		enabled: !1,
		runtimeDashboardMode: "autoHide30",
		verboseErrors: !1,
		verboseRouteRegistrationLogs: !1,
		verboseStartupLogs: !1
	},
	feed: {
		minSize: j.FEED_GRID_MIN_SIZE,
		showInfo: j.FEED_SHOW_INFO,
		showFilename: j.FEED_SHOW_FILENAME,
		showDimensions: j.FEED_SHOW_DIMENSIONS,
		showDate: j.FEED_SHOW_DATE,
		showGenTime: j.FEED_SHOW_GENTIME,
		showWorkflowDot: j.FEED_SHOW_WORKFLOW_DOT,
		showExtBadge: j.FEED_SHOW_BADGES_EXTENSION,
		showRatingBadge: j.FEED_SHOW_BADGES_RATING,
		showTagsBadge: j.FEED_SHOW_BADGES_TAGS
	},
	sidebar: {
		position: "right",
		showPreviewThumb: !0,
		widthPx: 360,
		assetBadgeEnabled: j.SIDEBAR_ASSET_BADGE_ENABLED
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
	search: { maxResults: j.SEARCH_DEFAULT_LIMIT },
	ai: {
		vectorSearchEnabled: !0,
		vectorCaptionOnIndex: !1,
		verboseAiLogs: !1
	},
	executionGrouping: { enabled: j.EXECUTION_GROUPING_ENABLED },
	workflowMinimap: {
		enabled: j.WORKFLOW_MINIMAP_ENABLED,
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
		cardHoverColor: j.UI_CARD_HOVER_COLOR,
		cardSelectionColor: j.UI_CARD_SELECTION_COLOR,
		ratingColor: j.UI_RATING_COLOR,
		tagColor: j.UI_TAG_COLOR
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
}, Nt = () => {
	try {
		let e = Ee.get(ce);
		if (!e) return { ...G };
		let t = JSON.parse(e), n = t && typeof t == "object" && Number.isInteger(t.version) && t.data && typeof t.data == "object";
		if (!n && !(t && typeof t == "object" && !Array.isArray(t))) return { ...G };
		if (n && Number(t.version) > 1) return console.warn("[Majoor] settings schema version is newer than this build, using defaults"), { ...G };
		let r = n ? t.data : t, i = new Set(/* @__PURE__ */ "debug.grid.infiniteScroll.siblings.autoScan.scan.watcher.status.viewer.rtHydrate.observability.feed.sidebar.probeBackend.i18n.paths.db.ratingTagsSync.cache.search.ai.executionGrouping.workflowMinimap.ui.security.safety".split(".")), a = {};
		if (r && typeof r == "object") for (let [e, t] of Object.entries(r)) i.has(e) && (a[e] = t);
		let o = Et(G, a);
		if (!n) try {
			K(o);
		} catch (e) {
			console.debug?.(e);
		}
		return o;
	} catch (e) {
		return console.warn("[Majoor] settings load failed, using defaults", e), { ...G };
	}
}, K = (e) => {
	try {
		let t = JSON.parse(JSON.stringify(e || {}));
		t?.security && typeof t.security == "object" && (t.security.apiToken = "");
		let n = {
			version: 1,
			data: t
		};
		if (!Ee.set("mjrSettings", JSON.stringify(n))) throw Error("SettingsStore rejected the write");
	} catch (e) {
		console.warn("[Majoor] settings save failed", e);
		try {
			let e = Date.now();
			e - (Number(window?._mjrSettingsSaveFailAt || 0) || 0) > 3e4 && (window._mjrSettingsSaveFailAt = e, Ne(k("dialog.settingsSaveFailed", "Majoor: Failed to save settings (browser storage full or blocked).")));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			Me("mjr-settings-save-failed", { error: String(e?.message || e || "") }, { warnPrefix: "[Majoor]" });
		} catch (e) {
			console.debug?.(e);
		}
	}
}, q = (e) => {
	let t = Number(j.MAX_PAGE_SIZE) || 2e3;
	A.DEFAULT_PAGE_SIZE = Math.max(50, Math.min(t, Number(e.grid?.pageSize) || j.DEFAULT_PAGE_SIZE)), A.AUTO_SCAN_ON_STARTUP = !!e.autoScan?.onStartup, A.EXECUTION_GROUPING_ENABLED = !!(e.executionGrouping?.enabled ?? j.EXECUTION_GROUPING_ENABLED), A.STATUS_POLL_INTERVAL = Math.max(1e3, Number(e.status?.pollInterval) || j.STATUS_POLL_INTERVAL), A.DEBUG_SAFE_CALL = !!e.debug?.safeCall, A.DEBUG_SAFE_LISTENERS = !!e.debug?.safeListeners, A.DEBUG_VIEWER = !!e.debug?.viewer, A.GRID_MIN_SIZE = At(e.grid), A.FEED_GRID_MIN_SIZE = jt(e.feed), A.GRID_GAP = Math.max(0, Math.min(40, Math.round(W(e.grid?.gap, j.GRID_GAP)))), A.GRID_SHOW_BADGES_EXTENSION = !!(e.grid?.showExtBadge ?? j.GRID_SHOW_BADGES_EXTENSION), A.GRID_SHOW_BADGES_RATING = !!(e.grid?.showRatingBadge ?? j.GRID_SHOW_BADGES_RATING), A.GRID_SHOW_BADGES_TAGS = !!(e.grid?.showTagsBadge ?? j.GRID_SHOW_BADGES_TAGS), A.GRID_SHOW_DETAILS = !!(e.grid?.showDetails ?? j.GRID_SHOW_DETAILS), A.GRID_SHOW_DETAILS_FILENAME = !!(e.grid?.showFilename ?? j.GRID_SHOW_DETAILS_FILENAME), A.GRID_SHOW_DETAILS_DATE = !!(e.grid?.showDate ?? j.GRID_SHOW_DETAILS_DATE), A.GRID_SHOW_DETAILS_DIMENSIONS = !!(e.grid?.showDimensions ?? j.GRID_SHOW_DETAILS_DIMENSIONS), A.GRID_SHOW_DETAILS_GENTIME = !!(e.grid?.showGenTime ?? j.GRID_SHOW_DETAILS_GENTIME), A.GRID_SHOW_HOVER_INFO = !!(e.grid?.showHoverInfo ?? j.GRID_SHOW_HOVER_INFO), A.GRID_SHOW_WORKFLOW_DOT = !!(e.grid?.showWorkflowDot ?? j.GRID_SHOW_WORKFLOW_DOT);
	{
		let t = String(e.grid?.workflowGroupBy ?? j.WORKFLOW_GRID_GROUP_BY).toLowerCase();
		A.WORKFLOW_GRID_GROUP_BY = [
			"none",
			"task",
			"model",
			"category"
		].includes(t) ? t : j.WORKFLOW_GRID_GROUP_BY;
	}
	A.FEED_SHOW_INFO = !!(e.feed?.showInfo ?? j.FEED_SHOW_INFO), A.FEED_SHOW_FILENAME = !!(e.feed?.showFilename ?? j.FEED_SHOW_FILENAME), A.FEED_SHOW_DIMENSIONS = !!(e.feed?.showDimensions ?? j.FEED_SHOW_DIMENSIONS), A.FEED_SHOW_DATE = !!(e.feed?.showDate ?? j.FEED_SHOW_DATE), A.FEED_SHOW_GENTIME = !!(e.feed?.showGenTime ?? j.FEED_SHOW_GENTIME), A.FEED_SHOW_WORKFLOW_DOT = !!(e.feed?.showWorkflowDot ?? j.FEED_SHOW_WORKFLOW_DOT), A.FEED_SHOW_BADGES_EXTENSION = !!(e.feed?.showExtBadge ?? j.FEED_SHOW_BADGES_EXTENSION), A.FEED_SHOW_BADGES_RATING = !!(e.feed?.showRatingBadge ?? j.FEED_SHOW_BADGES_RATING), A.FEED_SHOW_BADGES_TAGS = !!(e.feed?.showTagsBadge ?? j.FEED_SHOW_BADGES_TAGS);
	{
		let t = e.grid?.videoAutoplayMode ?? j.GRID_VIDEO_AUTOPLAY_MODE;
		t ??= e.grid?.videoHoverAutoplay === !1 ? "off" : "hover", t === !0 && (t = "hover"), t === !1 && (t = "off"), t !== "hover" && t !== "always" && t !== "off" && (t = "hover"), A.GRID_VIDEO_AUTOPLAY_MODE = t;
	}
	let n = (e, t) => {
		let n = String(e || "").trim();
		return /^[0-9a-fA-F]{6}$/.test(n) && (n = `#${n}`), /^#[0-9a-fA-F]{3,8}$/.test(n) ? n : t;
	};
	A.BADGE_STAR_COLOR = n(e.grid?.starColor, j.BADGE_STAR_COLOR), A.BADGE_IMAGE_COLOR = n(e.grid?.badgeImageColor, j.BADGE_IMAGE_COLOR), A.BADGE_VIDEO_COLOR = n(e.grid?.badgeVideoColor, j.BADGE_VIDEO_COLOR), A.BADGE_AUDIO_COLOR = n(e.grid?.badgeAudioColor, j.BADGE_AUDIO_COLOR), A.BADGE_MODEL3D_COLOR = n(e.grid?.badgeModel3dColor, j.BADGE_MODEL3D_COLOR), A.BADGE_DUPLICATE_ALERT_COLOR = n(e.grid?.badgeDuplicateAlertColor, j.BADGE_DUPLICATE_ALERT_COLOR), A.UI_CARD_HOVER_COLOR = n(e.ui?.cardHoverColor, j.UI_CARD_HOVER_COLOR), A.UI_CARD_SELECTION_COLOR = n(e.ui?.cardSelectionColor, j.UI_CARD_SELECTION_COLOR), A.UI_RATING_COLOR = n(e.ui?.ratingColor, j.UI_RATING_COLOR), A.UI_TAG_COLOR = n(e.ui?.tagColor, j.UI_TAG_COLOR);
	try {
		let e = Array.from(document.querySelectorAll(".mjr-assets-manager"));
		for (let t of e) t.style.setProperty("--mjr-star-active", A.BADGE_STAR_COLOR), t.style.setProperty("--mjr-badge-image", A.BADGE_IMAGE_COLOR), t.style.setProperty("--mjr-badge-video", A.BADGE_VIDEO_COLOR), t.style.setProperty("--mjr-badge-audio", A.BADGE_AUDIO_COLOR), t.style.setProperty("--mjr-badge-model3d", A.BADGE_MODEL3D_COLOR), t.style.setProperty("--mjr-badge-duplicate-alert", A.BADGE_DUPLICATE_ALERT_COLOR), t.style.setProperty("--mjr-card-hover-color", A.UI_CARD_HOVER_COLOR), t.style.setProperty("--mjr-card-selection-color", A.UI_CARD_SELECTION_COLOR), t.style.setProperty("--mjr-rating-color", A.UI_RATING_COLOR), t.style.setProperty("--mjr-tag-color", A.UI_TAG_COLOR);
	} catch (e) {
		console.debug?.(e);
	}
	A.INFINITE_SCROLL_ENABLED = !!e.infiniteScroll?.enabled, A.INFINITE_SCROLL_ROOT_MARGIN = String(e.infiniteScroll?.rootMargin || j.INFINITE_SCROLL_ROOT_MARGIN), A.INFINITE_SCROLL_THRESHOLD = Math.max(0, Math.min(1, W(e.infiniteScroll?.threshold, j.INFINITE_SCROLL_THRESHOLD))), A.BOTTOM_GAP_PX = Math.max(0, Math.min(5e3, Math.round(W(e.infiniteScroll?.bottomGapPx, j.BOTTOM_GAP_PX)))), A.VIEWER_ALLOW_PAN_AT_ZOOM_1 = !!e.viewer?.allowPanAtZoom1, A.VIEWER_DISABLE_WEBGL_VIDEO = !!e.viewer?.disableWebGL, A.VIEWER_PAUSE_DURING_EXECUTION = !!(e.viewer?.pauseDuringExecution ?? j.VIEWER_PAUSE_DURING_EXECUTION), A.FLOATING_VIEWER_PAUSE_DURING_EXECUTION = !!(e.viewer?.floatingPauseDuringExecution ?? j.FLOATING_VIEWER_PAUSE_DURING_EXECUTION), A.MFV_LIVE_DEFAULT = e.viewer?.mfvLiveDefault ?? j.MFV_LIVE_DEFAULT, A.MFV_PREVIEW_DEFAULT = e.viewer?.mfvPreviewDefault ?? j.MFV_PREVIEW_DEFAULT, A.MFV_LIVE_AUTO_OPEN = !1, A.MFV_PREVIEW_AUTO_OPEN = !1, A.MFV_NODE_STREAM_AUTO_OPEN = !1;
	{
		let t = String(e.viewer?.mfvPreviewMethod || j.MFV_PREVIEW_METHOD).toLowerCase();
		A.MFV_PREVIEW_METHOD = [
			"default",
			"auto",
			"latent2rgb",
			"taesd",
			"none"
		].includes(t) ? t : j.MFV_PREVIEW_METHOD;
	}
	{
		let t = String(e.viewer?.mfvSidebarPosition || "right").toLowerCase();
		A.MFV_SIDEBAR_POSITION = [
			"left",
			"right",
			"bottom"
		].includes(t) ? t : "right";
	}
	A.VIEWER_VIDEO_GRADE_THROTTLE_FPS = Math.max(1, Math.min(60, Math.round(W(e.viewer?.videoGradeThrottleFps, j.VIEWER_VIDEO_GRADE_THROTTLE_FPS)))), A.VIEWER_SCOPES_FPS = Math.max(1, Math.min(60, Math.round(W(e.viewer?.scopesFps, j.VIEWER_SCOPES_FPS)))), A.VIEWER_META_TTL_MS = Math.max(1e3, Math.min(10 * 6e4, Math.round(W(e.viewer?.metaTtlMs, j.VIEWER_META_TTL_MS)))), A.VIEWER_META_MAX_ENTRIES = Math.max(50, Math.min(5e3, Math.round(W(e.viewer?.metaMaxEntries, j.VIEWER_META_MAX_ENTRIES)))), A.WORKFLOW_MINIMAP_ENABLED = !!(e.workflowMinimap?.enabled ?? j.WORKFLOW_MINIMAP_ENABLED), A.RT_HYDRATE_CONCURRENCY = Math.max(1, Math.min(16, Math.round(W(e.rtHydrate?.concurrency, j.RT_HYDRATE_CONCURRENCY)))), A.RT_HYDRATE_QUEUE_MAX = Math.max(10, Math.min(5e3, Math.round(W(e.rtHydrate?.queueMax, j.RT_HYDRATE_QUEUE_MAX)))), A.RT_HYDRATE_SEEN_MAX = Math.max(1e3, Math.min(2e5, Math.round(W(e.rtHydrate?.seenMax, j.RT_HYDRATE_SEEN_MAX)))), A.RT_HYDRATE_PRUNE_BUDGET = Math.max(10, Math.min(1e4, Math.round(W(e.rtHydrate?.pruneBudget, j.RT_HYDRATE_PRUNE_BUDGET)))), A.RT_HYDRATE_SEEN_TTL_MS = Math.max(5e3, Math.min(360 * 6e4, Math.round(W(e.rtHydrate?.seenTtlMs, j.RT_HYDRATE_SEEN_TTL_MS)))), A.DELETE_CONFIRMATION = !!e.safety?.confirmDeletion, A.DEBUG_VERBOSE_ERRORS = !!e.observability?.verboseErrors, A.WATCHER_MAX_PENDING = Math.max(10, Math.min(5e3, Math.round(W(e.watcher?.maxPending, 500)))), A.WATCHER_MIN_SIZE = Math.max(0, Math.min(1e6, Math.round(W(e.watcher?.minSize, 100)))), A.WATCHER_MAX_SIZE = Math.max(1e5, Math.min(17179869184, Math.round(W(e.watcher?.maxSize, 4294967296)))), A.DB_TIMEOUT_MS = Math.max(1e3, Math.min(3e4, Math.round(W(e.db?.timeoutMs, 5e3)))), A.DB_MAX_CONNECTIONS = Math.max(1, Math.min(100, Math.round(W(e.db?.maxConnections, 10)))), A.DB_QUERY_TIMEOUT_MS = Math.max(500, Math.min(1e4, Math.round(W(e.db?.queryTimeoutMs, 1e3)))), A.SIDEBAR_ASSET_BADGE_ENABLED = !!(e.sidebar?.assetBadgeEnabled ?? j.SIDEBAR_ASSET_BADGE_ENABLED), A.SEARCH_REQUEST_LIMIT = Math.max(10, Math.min(j.MAX_PAGE_SIZE || 2e3, Math.round(W(e.search?.maxResults, j.SEARCH_DEFAULT_LIMIT))));
};
async function Pt() {
	try {
		let e = await le();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = Nt();
		if (n.security = n.security || {}, n.security.safeMode = U(t.safe_mode, n.security.safeMode), n.security.allowWrite = U(t.allow_write, n.security.allowWrite), n.security.requireAuth = U(t.require_auth, n.security.requireAuth), n.security.allowRemoteWrite = U(t.allow_remote_write, n.security.allowRemoteWrite), n.security.allowInsecureTokenTransport = U(t.allow_insecure_token_transport, n.security.allowInsecureTokenTransport), n.security.allowDelete = U(t.allow_delete, n.security.allowDelete), n.security.allowRename = U(t.allow_rename, n.security.allowRename), n.security.allowOpenInFolder = U(t.allow_open_in_folder, n.security.allowOpenInFolder), n.security.allowResetIndex = U(t.allow_reset_index, n.security.allowResetIndex), n.security.tokenConfigured = U(t.token_configured, n.security.tokenConfigured), n.security.tokenHint = String(t.token_hint || "").trim(), !String(n.security.apiToken || "").trim()) try {
			let e = await x(), t = String(e?.data?.token || "").trim();
			e?.ok && t && p(t);
		} catch (e) {
			console.debug?.(e);
		}
		K(n), q(n), Me("mjr-settings-changed", { key: "security" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend security settings", e);
	}
}
async function Ft() {
	try {
		let e = await E();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = Nt();
		n.ai = n.ai || {}, n.ai.vectorSearchEnabled = U(t.enabled, n.ai.vectorSearchEnabled ?? !0), n.ai.vectorCaptionOnIndex = U(t.caption_on_index ?? t.captionOnIndex, n.ai.vectorCaptionOnIndex ?? !1), n.ai.vectorIndexOnScan = U(t.index_on_scan ?? t.indexOnScan, n.ai.vectorIndexOnScan ?? !1), n.ai.vectorUnloadAfterUse = U(t.unload_after_use ?? t.unloadAfterUse, n.ai.vectorUnloadAfterUse ?? !1), n.ai.vectorConcurrency = Math.max(1, Math.min(16, Math.floor(Number(t.concurrency ?? n.ai.vectorConcurrency ?? 1) || 1))), K(n), q(n), Me("mjr-settings-changed", { key: "ai.vectorSearch" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend vector search settings", e);
	}
}
async function It() {
	try {
		let e = await d();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = Nt();
		n.executionGrouping = n.executionGrouping || {}, n.executionGrouping.enabled = U(t.enabled, n.executionGrouping.enabled ?? j.EXECUTION_GROUPING_ENABLED), K(n), q(n), Me("mjr-settings-changed", { key: "executionGrouping.enabled" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend execution grouping settings", e);
	}
}
//#endregion
//#region ui/app/settings/settingsRuntime.ts
var Lt = "mjr-runtime-status-dashboard", Rt = 3e4;
function zt() {
	try {
		let e = Nt(), t = String(e?.observability?.runtimeDashboardMode || G.observability.runtimeDashboardMode);
		return [
			"autoHide30",
			"always",
			"hidden"
		].includes(t) ? t : "autoHide30";
	} catch {
		return "autoHide30";
	}
}
function Bt() {
	try {
		document.getElementById(Lt)?.remove?.();
	} catch (e) {
		console.debug?.(e);
	}
}
function Vt() {
	try {
		window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ && (clearTimeout(window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__), window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ = null);
	} catch (e) {
		console.debug?.(e);
	}
}
function Ht(e, t) {
	let n = t === "auth" ? "__mjrAuthLine" : "__mjrMetricsLine";
	if (e?.[n]) return e[n];
	let r = document.createElement("div");
	return r.style.whiteSpace = "nowrap", r.style.lineHeight = "1.35", t === "auth" && (r.style.marginTop = "4px", r.style.fontWeight = "600"), e.appendChild(r), e[n] = r, r;
}
function Ut(e) {
	let t = String(e?.token_hint || "").trim(), n = c(), r = t || (n ? "(session)" : ""), i = e?.allow_write !== !1, a = e?.require_auth === !0, o = e?.token_configured === !0;
	return i ? n ? {
		text: k("runtime.writeAuthActive", "Write auth: active {tokenHint}", { tokenHint: r || "(session)" }),
		color: "#7ee0a0"
	} : a && o ? {
		text: k("runtime.writeAuthMissing", "Write auth: missing in this browser {tokenHint}", { tokenHint: r || "(server token configured)" }),
		color: "#f1c36d"
	} : a ? {
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
function Wt() {
	try {
		if (zt() === "hidden" || window.__MJR_RUNTIME_STATUS_HIDDEN__) return Bt(), null;
		let e = document.querySelector(".mjr-assets-manager.mjr-am-container"), t = document.getElementById(Lt);
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
		let n = document.getElementById(Lt);
		return n ? n.parentElement !== e && e.appendChild(n) : (n = document.createElement("div"), n.id = Lt, n.style.position = "absolute", n.style.bottom = "10px", n.style.right = "10px", n.style.zIndex = "9999", n.style.padding = "6px 10px", n.style.borderRadius = "10px", n.style.border = "1px solid rgba(255,255,255,0.16)", n.style.background = "rgba(0,0,0,0.45)", n.style.backdropFilter = "blur(4px)", n.style.color = "var(--content-fg, #fff)", n.style.fontSize = "11px", n.style.pointerEvents = "none", n.style.display = "flex", n.style.flexDirection = "column", e.appendChild(n)), n;
	} catch {
		return null;
	}
}
async function Gt() {
	let e = Wt();
	if (!e) return !1;
	let t = Ht(e, "metrics"), n = Ht(e, "auth");
	try {
		let [r, i] = await Promise.all([me(), le()]), a = k("runtime.unavailable", "Runtime: unavailable");
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
		let o = Ut(i?.data?.prefs || null);
		return n.textContent = o.text, n.style.color = o.color, e.title = `${a}\n${o.text}`, !0;
	} catch {
		return t.textContent = k("runtime.unavailable", "Runtime: unavailable"), n.textContent = k("runtime.writeAuthUnknown", "Write auth: unknown"), n.style.color = "#c8ced8", e.title = `${k("runtime.unavailable", "Runtime: unavailable")}\n${n.textContent}`, !0;
	}
}
function Kt() {
	try {
		let e = zt();
		if (e === "hidden") {
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = !0, Vt(), Bt();
			return;
		}
		window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__ || (window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__ = (e) => {
			if (e?.detail?.key !== "observability.runtimeDashboardMode") return;
			let t = zt();
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = t === "hidden", Vt(), Bt(), t !== "hidden" && Kt();
		}, window.addEventListener?.("mjr-settings-changed", window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__)), window.__MJR_RUNTIME_STATUS_HIDDEN__ = !1, Vt(), e === "autoHide30" && (window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ = setTimeout(() => {
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = !0, Bt();
		}, Rt)), Gt().catch(() => {}), window.__MJR_RUNTIME_STATUS_INFLIGHT__ ?? (window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !1), window.__MJR_RUNTIME_STATUS_MISS_COUNT__ ?? (window.__MJR_RUNTIME_STATUS_MISS_COUNT__ = 0), window.__MJR_RUNTIME_STATUS_INTERVAL__ || (window.__MJR_RUNTIME_STATUS_INTERVAL__ = setInterval(() => {
			window.__MJR_RUNTIME_STATUS_INFLIGHT__ || (window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !0, Gt().then((e) => {
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
var qt = 300;
function Jt(e, t = qt) {
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
var J = "Majoor", Yt = "Majoor Assets Manager";
function Xt(e, t, n) {
	let r = (e, t) => [
		Yt,
		e,
		t
	], i = (e) => [
		Yt,
		k("cat.cards", "Cards"),
		e
	], a = (e) => [
		Yt,
		k("cat.badges", "Badges"),
		e
	], o = (e) => [
		Yt,
		k("cat.badges", "Badges"),
		e
	], s = (e, t) => {
		let n = String(e || "").trim();
		return /^[0-9a-fA-F]{6}$/.test(n) && (n = `#${n}`), /^#[0-9a-fA-F]{6}$/.test(n) ? n.toUpperCase() : t;
	};
	t.grid?.minSizePreset || (t.grid = t.grid || {}, t.grid.minSizePreset = Mt(t.grid.minSize), K(t)), e({
		id: `${J}.Cards.ThumbSize`,
		category: i(k("setting.grid.cardSize.group", "Card size")),
		name: k("setting.grid.cardSize.name", "Majoor: Card Size"),
		tooltip: k("setting.grid.cardSize.desc", "Choose the card size preset used by the grid layout."),
		type: "combo",
		defaultValue: (() => {
			let e = wt(String(t.grid?.minSizePreset || "").toLowerCase(), Ot, Mt(t.grid?.minSize)), n = {
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
			r === i || r === "small" || r === "petit" ? s = "small" : r === o || r === "large" || r === "grand" ? s = "large" : (r === a || r === "medium" || r === "moyen") && (s = "medium"), t.grid.minSizePreset = s, t.grid.minSize = Dt[s], K(t), q(t), n("grid.minSizePreset");
		}
	}), e({
		id: `${J}.Cards.CustomThumbSize`,
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
			t.grid.minSize = r, t.grid.minSizePreset = Mt(r), K(t), q(t), n("grid.minSize");
		}
	}), e({
		id: `${J}.Grid.ShowDetails`,
		category: i("Show card details"),
		name: "Show metadata panel",
		tooltip: "Show the bottom details panel on asset cards (filename, date, etc.)",
		type: "boolean",
		defaultValue: !!t.grid?.showDetails,
		onChange: (e) => {
			t.grid.showDetails = !!e, K(t), q(t), n("grid.showDetails");
		}
	}), e({
		id: `${J}.Grid.ShowFilename`,
		category: i("Show filename"),
		name: "Show filename",
		tooltip: "Display filename in details panel",
		type: "boolean",
		defaultValue: !!t.grid?.showFilename,
		onChange: (e) => {
			t.grid.showFilename = !!e, K(t), q(t), n("grid.showFilename");
		}
	}), e({
		id: `${J}.Grid.ShowDate`,
		category: i("Show date/time"),
		name: "Show date/time",
		tooltip: "Display date and time in details panel",
		type: "boolean",
		defaultValue: !!t.grid?.showDate,
		onChange: (e) => {
			t.grid.showDate = !!e, K(t), q(t), n("grid.showDate");
		}
	}), e({
		id: `${J}.Grid.ShowDimensions`,
		category: i("Show dimensions"),
		name: "Show dimensions",
		tooltip: "Display resolution (WxH) in details panel",
		type: "boolean",
		defaultValue: !!t.grid?.showDimensions,
		onChange: (e) => {
			t.grid.showDimensions = !!e, K(t), q(t), n("grid.showDimensions");
		}
	}), e({
		id: `${J}.Grid.ShowGenTime`,
		category: i("Show generation time"),
		name: "Show generation time",
		tooltip: "Display seconds taken to generate the asset (if available)",
		type: "boolean",
		defaultValue: !!(t.grid?.showGenTime ?? j.GRID_SHOW_DETAILS_GENTIME),
		onChange: (e) => {
			t.grid.showGenTime = !!e, K(t), q(t), n("grid.showGenTime");
		}
	}), e({
		id: `${J}.Grid.ShowHoverInfo`,
		category: i("Show prompt on hover"),
		name: "Show prompt on hover",
		tooltip: "Show positive prompt and generation time as a tooltip overlay when hovering over a card thumbnail. Does not block video play-on-hover.",
		type: "boolean",
		defaultValue: !!(t.grid?.showHoverInfo ?? j.GRID_SHOW_HOVER_INFO),
		onChange: (e) => {
			t.grid.showHoverInfo = !!e, K(t), q(t), n("grid.showHoverInfo");
		}
	}), e({
		id: `${J}.Grid.ShowWorkflowDot`,
		category: i("Show workflow dot"),
		name: "Show workflow indicator",
		tooltip: "Display the green dot indicating workflow metadata availability (bottom right of card)",
		type: "boolean",
		defaultValue: !!t.grid?.showWorkflowDot,
		onChange: (e) => {
			t.grid.showWorkflowDot = !!e, K(t), q(t), n("grid.showWorkflowDot");
		}
	}), e({
		id: `${J}.Grid.ShowExtBadge`,
		category: a("Show format badges"),
		name: "Show format badges",
		tooltip: "Display format badges (e.g. JPG, MP4) on thumbnails",
		type: "boolean",
		defaultValue: !!t.grid?.showExtBadge,
		onChange: (e) => {
			t.grid.showExtBadge = !!e, K(t), q(t), n("grid.showExtBadge");
		}
	}), e({
		id: `${J}.Grid.ShowRatingBadge`,
		category: a("Show rating badges"),
		name: "Show ratings",
		tooltip: "Display star ratings on thumbnails",
		type: "boolean",
		defaultValue: !!t.grid?.showRatingBadge,
		onChange: (e) => {
			t.grid.showRatingBadge = !!e, K(t), q(t), n("grid.showRatingBadge");
		}
	}), e({
		id: `${J}.Grid.ShowTagsBadge`,
		category: a("Show tags badges"),
		name: "Show tags",
		tooltip: "Display a small indicator if an asset has tags",
		type: "boolean",
		defaultValue: !!t.grid?.showTagsBadge,
		onChange: (e) => {
			t.grid.showTagsBadge = !!e, K(t), q(t), n("grid.showTagsBadge");
		}
	}), e({
		id: `${J}.Badges.StarColor`,
		category: o(k("setting.starColor", "Star color")),
		name: k("setting.starColor", "Majoor: Star color"),
		tooltip: k("setting.starColor.tooltip", "Color of rating stars on thumbnails (hex, e.g. #FFD45A)"),
		type: "color",
		defaultValue: s(t.grid?.starColor, j.BADGE_STAR_COLOR),
		onChange: (e) => {
			t.grid.starColor = s(e, j.BADGE_STAR_COLOR), K(t), q(t), n("grid.starColor");
		}
	}), e({
		id: `${J}.Badges.ImageColor`,
		category: o(k("setting.badgeImageColor", "Image badge color")),
		name: k("setting.badgeImageColor", "Majoor: Image badge color"),
		tooltip: k("setting.badgeImageColor.tooltip", "Color for image badges: PNG, JPG, WEBP, GIF, BMP, TIF (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeImageColor, j.BADGE_IMAGE_COLOR),
		onChange: (e) => {
			t.grid.badgeImageColor = s(e, j.BADGE_IMAGE_COLOR), K(t), q(t), n("grid.badgeImageColor");
		}
	}), e({
		id: `${J}.Badges.VideoColor`,
		category: o(k("setting.badgeVideoColor", "Video badge color")),
		name: k("setting.badgeVideoColor", "Majoor: Video badge color"),
		tooltip: k("setting.badgeVideoColor.tooltip", "Color for video badges: MP4, WEBM, MOV, AVI, MKV (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeVideoColor, j.BADGE_VIDEO_COLOR),
		onChange: (e) => {
			t.grid.badgeVideoColor = s(e, j.BADGE_VIDEO_COLOR), K(t), q(t), n("grid.badgeVideoColor");
		}
	}), e({
		id: `${J}.Badges.AudioColor`,
		category: o(k("setting.badgeAudioColor", "Audio badge color")),
		name: k("setting.badgeAudioColor", "Majoor: Audio badge color"),
		tooltip: k("setting.badgeAudioColor.tooltip", "Color for audio badges: MP3, WAV, OGG, FLAC (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeAudioColor, j.BADGE_AUDIO_COLOR),
		onChange: (e) => {
			t.grid.badgeAudioColor = s(e, j.BADGE_AUDIO_COLOR), K(t), q(t), n("grid.badgeAudioColor");
		}
	}), e({
		id: `${J}.Badges.Model3dColor`,
		category: o(k("setting.badgeModel3dColor", "3D model badge color")),
		name: k("setting.badgeModel3dColor", "Majoor: 3D model badge color"),
		tooltip: k("setting.badgeModel3dColor.tooltip", "Color for 3D model badges: OBJ, FBX, GLB, GLTF (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeModel3dColor, j.BADGE_MODEL3D_COLOR),
		onChange: (e) => {
			t.grid.badgeModel3dColor = s(e, j.BADGE_MODEL3D_COLOR), K(t), q(t), n("grid.badgeModel3dColor");
		}
	}), e({
		id: `${J}.Badges.DuplicateAlertColor`,
		category: o(k("setting.badgeDuplicateAlertColor", "Duplicate alert badge color")),
		name: k("setting.badgeDuplicateAlertColor", "Majoor: Duplicate alert badge color"),
		tooltip: k("setting.badgeDuplicateAlertColor.tooltip", "Color for duplicate extension badges (PNG+, JPG+, etc)."),
		type: "color",
		defaultValue: s(t.grid?.badgeDuplicateAlertColor, j.BADGE_DUPLICATE_ALERT_COLOR),
		onChange: (e) => {
			t.grid.badgeDuplicateAlertColor = s(e, j.BADGE_DUPLICATE_ALERT_COLOR), K(t), q(t), n("grid.badgeDuplicateAlertColor");
		}
	}), e({
		id: `${J}.Grid.PageSize`,
		category: r(k("cat.grid"), k("setting.grid.pagesize.name").replace("Majoor: ", "")),
		name: k("setting.grid.pagesize.name"),
		tooltip: k("setting.grid.pagesize.desc"),
		type: "number",
		defaultValue: t.grid.pageSize,
		attrs: {
			min: 50,
			max: Number(A.MAX_PAGE_SIZE) || 2e3,
			step: 50
		},
		onChange: (e) => {
			let r = Number(A.MAX_PAGE_SIZE) || 2e3;
			t.grid.pageSize = Math.max(50, Math.min(r, Number(e) || j.DEFAULT_PAGE_SIZE)), K(t), q(t), n("grid.pageSize");
		}
	}), e({
		id: `${J}.Grid.WorkflowGroupBy`,
		category: r(k("cat.grid"), "Workflow grouping"),
		name: "Workflow grid grouping",
		tooltip: "In Workflow scope, insert titled separators and group cards by Task, Model, or Category.",
		type: "combo",
		defaultValue: (() => {
			let e = String(t.grid?.workflowGroupBy || j.WORKFLOW_GRID_GROUP_BY).trim().toLowerCase(), n = {
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
			t.grid = t.grid || {}, t.grid.workflowGroupBy = r, K(t), q(t), n("grid.workflowGroupBy");
		}
	}), e({
		id: `${J}.InfiniteScroll.Enabled`,
		category: r(k("cat.grid"), k("setting.nav.infinite.name").replace("Majoor: ", "")),
		name: k("setting.nav.infinite.name"),
		tooltip: k("setting.nav.infinite.desc"),
		type: "boolean",
		defaultValue: !!t.infiniteScroll?.enabled,
		onChange: (e) => {
			t.infiniteScroll = t.infiniteScroll || {}, t.infiniteScroll.enabled = !!e, K(t), q(t), n("infiniteScroll.enabled");
		}
	}), e({
		id: `${J}.Sidebar.Position`,
		category: r(k("cat.grid"), k("setting.sidebar.pos.name").replace("Majoor: ", "")),
		name: k("setting.sidebar.pos.name"),
		tooltip: k("setting.sidebar.pos.desc"),
		type: "combo",
		defaultValue: t.sidebar?.position || "right",
		options: ["left", "right"],
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.position = e === "left" ? "left" : "right", K(t), n("sidebar.position");
		}
	}), e({
		id: `${J}.Sidebar.ShowPreviewThumb`,
		category: r(k("cat.grid"), "Sidebar preview"),
		name: "Show sidebar preview thumb",
		tooltip: "Show/hide the large media preview at the top of the sidebar metadata panel.",
		type: "boolean",
		defaultValue: !!(t.sidebar?.showPreviewThumb ?? !0),
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.showPreviewThumb = !!e, K(t), n("sidebar.showPreviewThumb");
		}
	}), e({
		id: `${J}.Sidebar.AssetBadgeEnabled`,
		category: r(k("cat.grid"), "Sidebar asset notification badge"),
		name: "Show new asset badge on sidebar icon",
		tooltip: "Display a small counter on the Majoor sidebar icon only when a new asset is indexed by Assets Manager.",
		type: "boolean",
		defaultValue: !!(t.sidebar?.assetBadgeEnabled ?? j.SIDEBAR_ASSET_BADGE_ENABLED),
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.assetBadgeEnabled = !!e, K(t), q(t), n("sidebar.assetBadgeEnabled");
		}
	}), e({
		id: `${J}.Sidebar.WidthPx`,
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
			t.sidebar = t.sidebar || {}, t.sidebar.widthPx = Math.max(240, Math.min(640, Math.round(Number(e) || 360))), K(t), n("sidebar.widthPx");
		}
	}), e({
		id: `${J}.General.HideSiblings`,
		category: r(k("cat.grid"), k("setting.siblings.hide.name").replace("Majoor: ", "")),
		name: k("setting.siblings.hide.name"),
		tooltip: k("setting.siblings.hide.desc"),
		type: "boolean",
		defaultValue: !!t.siblings?.hidePngSiblings,
		onChange: (e) => {
			t.siblings = t.siblings || {}, t.siblings.hidePngSiblings = !!e, K(t), n("siblings.hidePngSiblings");
		}
	}), e({
		id: `${J}.Grid.VideoAutoplayMode`,
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
			t.grid = t.grid || {}, t.grid.videoAutoplayMode = r, delete t.grid.videoHoverAutoplay, K(t), q(t), n("grid.videoAutoplayMode");
		}
	}), e({
		id: `${J}.Cards.HoverColor`,
		category: i("Hover color"),
		name: "Majoor: Card hover color",
		tooltip: "Background tint used when hovering a card (hex, e.g. #3D3D3D).",
		type: "color",
		defaultValue: s(t.ui?.cardHoverColor, j.UI_CARD_HOVER_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.cardHoverColor = s(e, j.UI_CARD_HOVER_COLOR), K(t), q(t), n("ui.cardHoverColor");
		}
	}), e({
		id: `${J}.Cards.SelectionColor`,
		category: i("Selection color"),
		name: "Majoor: Card selection color",
		tooltip: "Outline/accent color used for selected cards (hex, e.g. #4A90E2).",
		type: "color",
		defaultValue: s(t.ui?.cardSelectionColor, j.UI_CARD_SELECTION_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.cardSelectionColor = s(e, j.UI_CARD_SELECTION_COLOR), K(t), q(t), n("ui.cardSelectionColor");
		}
	}), e({
		id: `${J}.Badges.RatingColor`,
		category: a("Rating color"),
		name: "Majoor: Rating badge color",
		tooltip: "Color used for rating badge text/accent (hex, e.g. #FF9500).",
		type: "color",
		defaultValue: s(t.ui?.ratingColor, j.UI_RATING_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.ratingColor = s(e, j.UI_RATING_COLOR), K(t), q(t), n("ui.ratingColor");
		}
	}), e({
		id: `${J}.Badges.TagColor`,
		category: a("Tag color"),
		name: "Majoor: Tags badge color",
		tooltip: "Color used for tags badge text/accent (hex, e.g. #4A90E2).",
		type: "color",
		defaultValue: s(t.ui?.tagColor, j.UI_TAG_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.tagColor = s(e, j.UI_TAG_COLOR), K(t), q(t), n("ui.tagColor");
		}
	});
}
//#endregion
//#region ui/app/settings/settingsViewer.ts
var Zt = "Majoor", Qt = "Majoor Assets Manager";
function $t(e, t, n) {
	let i = (e, t) => [
		Qt,
		e,
		t
	], a = (e) => i(k("cat.viewer", "Viewer"), e), o = (e) => i(k("cat.floatingViewer", "Floating Viewer"), e);
	e({
		id: `${Zt}.Viewer.AllowPanAtZoom1`,
		category: a(k("setting.viewer.pan.name").replace("Majoor: ", "")),
		name: k("setting.viewer.pan.name"),
		tooltip: k("setting.viewer.pan.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.allowPanAtZoom1,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.allowPanAtZoom1 = !!e, K(t), q(t), n("viewer.allowPanAtZoom1");
		}
	}), e({
		id: `${Zt}.Viewer.DisableWebGL`,
		category: a("Disable WebGL Video"),
		name: "Disable WebGL Video",
		tooltip: "Use CPU rendering (Canvas 2D) for video playback. Fixes 'black screen' issues on incompatible hardware/browsers.",
		type: "boolean",
		defaultValue: !!t.viewer?.disableWebGL,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.disableWebGL = !!e, K(t), q(t), n("viewer.disableWebGL");
		}
	}), e({
		id: `${Zt}.Viewer.PauseDuringExecution`,
		category: a(k("setting.viewer.pauseExecution.name").replace("Majoor: ", "")),
		name: k("setting.viewer.pauseExecution.name"),
		tooltip: k("setting.viewer.pauseExecution.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.pauseDuringExecution,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.pauseDuringExecution = !!e, K(t), q(t), n("viewer.pauseDuringExecution");
		}
	}), e({
		id: `${Zt}.Viewer.FloatingPauseDuringExecution`,
		category: o(k("setting.viewer.floatingPauseExecution.name").replace("Majoor: ", "")),
		name: k("setting.viewer.floatingPauseExecution.name"),
		tooltip: k("setting.viewer.floatingPauseExecution.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.floatingPauseDuringExecution,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.floatingPauseDuringExecution = !!e, K(t), q(t), n("viewer.floatingPauseDuringExecution");
		}
	}), e({
		id: `${Zt}.Viewer.MfvLiveDefault`,
		category: o(k("setting.viewer.mfvLiveDefault.name").replace("Majoor: ", "")),
		name: k("setting.viewer.mfvLiveDefault.name"),
		tooltip: k("setting.viewer.mfvLiveDefault.desc"),
		type: "boolean",
		defaultValue: !!(t.viewer?.mfvLiveDefault ?? j.MFV_LIVE_DEFAULT),
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.mfvLiveDefault = !!e, K(t), q(t), n("viewer.mfvLiveDefault");
		}
	}), e({
		id: `${Zt}.Viewer.MfvPreviewDefault`,
		category: o(k("setting.viewer.mfvPreviewDefault.name").replace("Majoor: ", "")),
		name: k("setting.viewer.mfvPreviewDefault.name"),
		tooltip: k("setting.viewer.mfvPreviewDefault.desc"),
		type: "boolean",
		defaultValue: !!(t.viewer?.mfvPreviewDefault ?? j.MFV_PREVIEW_DEFAULT),
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.mfvPreviewDefault = !!e, K(t), q(t), n("viewer.mfvPreviewDefault");
		}
	}), e({
		id: `${Zt}.Viewer.MfvSidebarPosition`,
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
			t.viewer = t.viewer || {}, t.viewer.mfvSidebarPosition = r, K(t), q(t), n("viewer.mfvSidebarPosition");
		}
	}), e({
		id: `${Zt}.Viewer.MfvPreviewMethod`,
		category: o(k("setting.viewer.mfvPreviewMethod.name").replace("Majoor: ", "")),
		name: k("setting.viewer.mfvPreviewMethod.name"),
		tooltip: k("setting.viewer.mfvPreviewMethod.desc"),
		type: "combo",
		defaultValue: t.viewer?.mfvPreviewMethod || j.MFV_PREVIEW_METHOD,
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
			].includes(e) ? e : j.MFV_PREVIEW_METHOD;
			t.viewer = t.viewer || {}, t.viewer.mfvPreviewMethod = r, K(t), q(t), n("viewer.mfvPreviewMethod");
		}
	}), e({
		id: `${Zt}.Viewer.LtxavRgbFallback`,
		category: o("LTXAV preview fallback"),
		name: "Majoor: LTXAV RGB Preview Fallback (experimental)",
		tooltip: "Reuse LTXV RGB projection for LTXAV when native latent preview is unavailable. Experimental; quality may be approximate.",
		type: "boolean",
		defaultValue: !!t.viewer?.ltxavRgbFallback,
		onChange: async (e) => {
			let i = !!e, a = !!t.viewer?.ltxavRgbFallback;
			t.viewer = t.viewer || {}, t.viewer.ltxavRgbFallback = i, K(t), q(t), n("viewer.ltxavRgbFallback");
			try {
				let e = await r(i);
				if (!e?.ok) throw Error(e?.error || "Failed to update LTXAV RGB preview fallback setting");
			} catch (e) {
				t.viewer.ltxavRgbFallback = a, K(t), q(t), n("viewer.ltxavRgbFallback"), O(e?.message || "Failed to update LTXAV RGB preview fallback setting", "error");
			}
		}
	});
	try {
		re().then((e) => {
			if (!e?.ok) return;
			let r = !!e?.data?.prefs?.enabled, i = Nt();
			i.viewer = i.viewer || {}, !!i.viewer.ltxavRgbFallback !== r && (i.viewer.ltxavRgbFallback = r, Object.assign(t, i), K(i), q(i), n("viewer.ltxavRgbFallback"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	((r, i, o, s) => {
		e({
			id: `${Zt}.WorkflowMinimap.${r}`,
			category: a(k(o).replace("Majoor: ", "")),
			name: k(o),
			tooltip: k(s),
			type: "boolean",
			defaultValue: !!t.workflowMinimap?.[i],
			onChange: (e) => {
				t.workflowMinimap = t.workflowMinimap || {}, t.workflowMinimap[i] = !!e, K(t), n(`workflowMinimap.${i}`);
			}
		});
	})("Enabled", "enabled", "setting.minimap.enabled.name", "setting.minimap.enabled.desc");
}
//#endregion
//#region ui/app/settings/settingsScanning.ts
var en = "Majoor", tn = "Majoor Assets Manager";
function nn(e, t, n) {
	let r = (e, t) => [
		tn,
		e,
		t
	];
	e({
		id: `${en}.ExecutionGrouping.Enabled`,
		category: r(k("cat.scanning"), "Execution grouping"),
		name: "Execution job/stack grouping",
		tooltip: "Enable or disable all live job_id / stack_id tracking, grouping, and stack finalization logic.",
		type: "boolean",
		defaultValue: !!(t.executionGrouping?.enabled ?? j.EXECUTION_GROUPING_ENABLED),
		onChange: async (e) => {
			let r = !!(t.executionGrouping?.enabled ?? j.EXECUTION_GROUPING_ENABLED), i = !!e;
			t.executionGrouping = t.executionGrouping || {}, t.executionGrouping.enabled = i, K(t), q(t), n("executionGrouping.enabled");
			try {
				let e = await ie(i);
				if (!e?.ok) throw Error(e?.error || "Failed to update execution grouping setting");
				t.executionGrouping.enabled = !!e?.data?.prefs?.enabled, K(t), q(t), n("executionGrouping.enabled");
			} catch (e) {
				t.executionGrouping.enabled = r, K(t), q(t), n("executionGrouping.enabled"), O(e?.message || "Failed to update execution grouping setting", "error");
			}
		}
	}), e({
		id: `${en}.AutoScan.OnStartup`,
		category: r(k("cat.scanning"), k("setting.scan.startup.name").replace("Majoor: ", "")),
		name: k("setting.scan.startup.name"),
		tooltip: k("setting.scan.startup.desc"),
		type: "boolean",
		defaultValue: !!t.autoScan?.onStartup,
		onChange: (e) => {
			t.autoScan = t.autoScan || {}, t.autoScan.onStartup = !!e, K(t), q(t), n("autoScan.onStartup");
		}
	}), e({
		id: `${en}.Scan.FastMode`,
		category: r(k("cat.scanning"), "Scan mode"),
		name: "Fast scan mode",
		tooltip: "Use fast scan mode for manual backfill scans (skip heavier metadata work during scan).",
		type: "boolean",
		defaultValue: !!(t.scan?.fastMode ?? !0),
		onChange: (e) => {
			t.scan = t.scan || {}, t.scan.fastMode = !!e, K(t), n("scan.fastMode");
		}
	}), e({
		id: `${en}.RtHydrate.Concurrency`,
		category: r(k("cat.scanning"), "Hydration"),
		name: "Hydrate Concurrency",
		tooltip: "Maximum concurrent hydration requests for rating/tags.",
		type: "number",
		defaultValue: Number(t.rtHydrate?.concurrency || j.RT_HYDRATE_CONCURRENCY || 5),
		attrs: {
			min: 1,
			max: 20,
			step: 1
		},
		onChange: (e) => {
			t.rtHydrate = t.rtHydrate || {}, t.rtHydrate.concurrency = Math.max(1, Math.min(20, Math.round(W(e, j.RT_HYDRATE_CONCURRENCY || 5)))), K(t), q(t), n("rtHydrate.concurrency");
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
		r.length && (K(t), r.forEach((e) => n(e)));
	}, o = async () => {
		try {
			let e = await D();
			if (!e?.ok) return;
			a(e.data || {});
		} catch (e) {
			console.debug?.(e);
		}
	};
	e({
		id: `${en}.Watcher.Enabled`,
		category: r(k("cat.scanning"), k("setting.watcher.enabled.label", "Enable watcher")),
		name: k("setting.watcher.name"),
		tooltip: k("setting.watcher.desc") + " (env: MJR_ENABLE_WATCHER)",
		type: "boolean",
		defaultValue: !!t.watcher?.enabled,
		onChange: async (e) => {
			t.watcher = t.watcher || {}, t.watcher.enabled = !!e, K(t), n("watcher.enabled");
			try {
				let r = await y(!!e);
				r?.ok || (t.watcher.enabled = !e, K(t), n("watcher.enabled"), O(r?.error || k("toast.failedToggleWatcher", "Failed to toggle watcher"), "error"));
			} catch {
				t.watcher.enabled = !e, K(t), n("watcher.enabled");
			}
		}
	}), e({
		id: `${en}.Watcher.DebounceDelay`,
		category: r(k("cat.scanning"), k("setting.watcher.debounce.label", "Watcher debounce delay")),
		name: k("setting.watcher.debounce.name"),
		tooltip: k("setting.watcher.debounce.desc") + " (env: MJR_WATCHER_DEBOUNCE_MS)",
		type: "number",
		defaultValue: t.watcher?.debounceMs ?? j.WATCHER_DEBOUNCE_MS,
		attrs: {
			min: 50,
			max: 6e4,
			step: 50
		},
		onChange: async (e) => {
			let r = j.WATCHER_DEBOUNCE_MS, a = i(e, r, 50, 6e4), o = t.watcher?.debounceMs ?? r;
			if (a !== o) {
				t.watcher = t.watcher || {}, t.watcher.debounceMs = a, K(t);
				try {
					let e = await u({ debounce_ms: a });
					if (!e?.ok) throw Error(e?.error || k("setting.watcher.debounce.error"));
					let r = Math.round(Number(e?.data?.debounce_ms ?? a));
					t.watcher.debounceMs = r, K(t), n("watcher.debounceMs");
				} catch (e) {
					t.watcher.debounceMs = o, K(t), n("watcher.debounceMs"), O(e?.message || k("setting.watcher.debounce.error"), "error");
				}
			}
		}
	}), e({
		id: `${en}.Watcher.DedupeWindow`,
		category: r(k("cat.scanning"), k("setting.watcher.dedupe.label", "Watcher dedupe window")),
		name: k("setting.watcher.dedupe.name"),
		tooltip: k("setting.watcher.dedupe.desc") + " (env: MJR_WATCHER_DEDUPE_TTL_MS)",
		type: "number",
		defaultValue: t.watcher?.dedupeTtlMs ?? j.WATCHER_DEDUPE_TTL_MS,
		attrs: {
			min: 100,
			max: 12e4,
			step: 100
		},
		onChange: async (e) => {
			let r = j.WATCHER_DEDUPE_TTL_MS, a = i(e, r, 100, 12e4), o = t.watcher?.dedupeTtlMs ?? r;
			if (a !== o) {
				t.watcher = t.watcher || {}, t.watcher.dedupeTtlMs = a, K(t);
				try {
					let e = await u({ dedupe_ttl_ms: a });
					if (!e?.ok) throw Error(e?.error || k("setting.watcher.dedupe.error"));
					let r = Math.round(Number(e?.data?.dedupe_ttl_ms ?? a));
					t.watcher.dedupeTtlMs = r, K(t), n("watcher.dedupeTtlMs");
				} catch (e) {
					t.watcher.dedupeTtlMs = o, K(t), n("watcher.dedupeTtlMs"), O(e?.message || k("setting.watcher.dedupe.error"), "error");
				}
			}
		}
	}), e({
		id: `${en}.Watcher.MaxPending`,
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
			t.watcher = t.watcher || {}, t.watcher.maxPending = Math.max(10, Math.min(5e3, Math.round(W(e, 500)))), K(t), q(t), n("watcher.maxPending");
		}
	}), e({
		id: `${en}.Watcher.MinSize`,
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
			t.watcher = t.watcher || {}, t.watcher.minSize = Math.max(0, Math.min(1e6, Math.round(W(e, 100)))), K(t), q(t), n("watcher.minSize");
		}
	}), e({
		id: `${en}.Watcher.MaxSize`,
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
			t.watcher = t.watcher || {}, t.watcher.maxSize = Math.max(1e5, Math.min(17179869184, Math.round(W(e, 4294967296)))), K(t), q(t), n("watcher.maxSize");
		}
	});
	try {
		o().catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	e({
		id: `${en}.RatingTagsSync.Enabled`,
		category: r(k("cat.scanning"), k("setting.sync.rating.name").replace("Majoor: ", "")),
		name: k("setting.sync.rating.name"),
		tooltip: k("setting.sync.rating.desc"),
		type: "boolean",
		defaultValue: !!t.ratingTagsSync?.enabled,
		onChange: (e) => {
			t.ratingTagsSync = t.ratingTagsSync || {}, t.ratingTagsSync.enabled = !!e, K(t), n("ratingTagsSync.enabled");
		}
	});
}
//#endregion
//#region ui/app/settings/settingsFeed.ts
var rn = "Majoor", an = "Majoor Assets Manager";
function on(e, t, n) {
	let r = (e) => [
		an,
		k("cat.feed", "Generated Feed"),
		e
	], i = () => {
		t.feed = t.feed || {};
	};
	e({
		id: `${rn}.Feed.CardSize`,
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
			i(), t.feed.minSize = Math.max(60, Math.min(600, Math.round(Number(e) || 120))), K(t), q(t), n("feed.minSize");
		}
	}), e({
		id: `${rn}.Feed.ShowInfo`,
		category: r("Show info section"),
		name: "Show card info section",
		tooltip: "Show or hide the entire info section (filename, metadata, dots) below thumbnails in the Generated Feed.",
		type: "boolean",
		defaultValue: !!(t.feed?.showInfo ?? j.FEED_SHOW_INFO),
		onChange: (e) => {
			i(), t.feed.showInfo = !!e, K(t), q(t), n("feed.showInfo");
		}
	}), e({
		id: `${rn}.Feed.ShowFilename`,
		category: r("Show filename"),
		name: "Show filename",
		tooltip: "Display the filename on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showFilename ?? j.FEED_SHOW_FILENAME),
		onChange: (e) => {
			i(), t.feed.showFilename = !!e, K(t), q(t), n("feed.showFilename");
		}
	}), e({
		id: `${rn}.Feed.ShowDimensions`,
		category: r("Show dimensions"),
		name: "Show dimensions",
		tooltip: "Display resolution (WxH) and duration on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDimensions ?? j.FEED_SHOW_DIMENSIONS),
		onChange: (e) => {
			i(), t.feed.showDimensions = !!e, K(t), q(t), n("feed.showDimensions");
		}
	}), e({
		id: `${rn}.Feed.ShowDate`,
		category: r("Show date/time"),
		name: "Show date/time",
		tooltip: "Display date and time on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDate ?? j.FEED_SHOW_DATE),
		onChange: (e) => {
			i(), t.feed.showDate = !!e, K(t), q(t), n("feed.showDate");
		}
	}), e({
		id: `${rn}.Feed.ShowGenTime`,
		category: r("Show generation time"),
		name: "Show generation time",
		tooltip: "Display the generation time badge on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showGenTime ?? j.FEED_SHOW_GENTIME),
		onChange: (e) => {
			i(), t.feed.showGenTime = !!e, K(t), q(t), n("feed.showGenTime");
		}
	}), e({
		id: `${rn}.Feed.ShowWorkflowDot`,
		category: r("Show workflow dot"),
		name: "Show workflow indicator",
		tooltip: "Display the workflow availability dot on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showWorkflowDot ?? j.FEED_SHOW_WORKFLOW_DOT),
		onChange: (e) => {
			i(), t.feed.showWorkflowDot = !!e, K(t), q(t), n("feed.showWorkflowDot");
		}
	}), e({
		id: `${rn}.Feed.ShowExtBadge`,
		category: r("Show format badges"),
		name: "Show format badges",
		tooltip: "Display format badges (e.g. JPG, MP4) on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showExtBadge ?? j.FEED_SHOW_BADGES_EXTENSION),
		onChange: (e) => {
			i(), t.feed.showExtBadge = !!e, K(t), q(t), n("feed.showExtBadge");
		}
	}), e({
		id: `${rn}.Feed.ShowRatingBadge`,
		category: r("Show rating badges"),
		name: "Show ratings",
		tooltip: "Display star ratings on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showRatingBadge ?? j.FEED_SHOW_BADGES_RATING),
		onChange: (e) => {
			i(), t.feed.showRatingBadge = !!e, K(t), q(t), n("feed.showRatingBadge");
		}
	}), e({
		id: `${rn}.Feed.ShowTagsBadge`,
		category: r("Show tags badges"),
		name: "Show tags",
		tooltip: "Display tag indicators on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showTagsBadge ?? j.FEED_SHOW_BADGES_TAGS),
		onChange: (e) => {
			i(), t.feed.showTagsBadge = !!e, K(t), q(t), n("feed.showTagsBadge");
		}
	});
}
//#endregion
//#region ui/app/settings/settingsSecurity.ts
var sn = "Majoor", cn = "Majoor Assets Manager", ln = 16, un = {
	safeMode: !1,
	allowWrite: !0,
	allowDelete: !0,
	allowRename: !0,
	allowOpenInFolder: !0,
	allowResetIndex: !0
};
function dn(e) {
	return !!e;
}
function fn(e, t) {
	return dn(e) === dn(t);
}
function pn(e) {
	return typeof e == "string" ? e.trim() : "";
}
function mn(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "localhost" || t === "127.0.0.1" || t === "::1";
}
function hn() {
	return globalThis.location || globalThis.window?.location || null;
}
function gn() {
	let e = hn();
	if (!e) return !1;
	let t = String(e.protocol || "").toLowerCase(), n = String(e.hostname || "").trim();
	return t === "http:" && !mn(n);
}
function _n(e) {
	let t = globalThis.crypto;
	if (!t?.getRandomValues) throw Error("Secure token generation requires crypto.getRandomValues().");
	return t.getRandomValues(e);
}
function vn(e) {
	let t = Math.max(4, Number(e) || 0), n = new Uint8Array(t);
	return _n(n), Array.from(n, (e) => e.toString(16).padStart(2, "0")).join("");
}
function yn() {
	return `mjr_${vn(18)}`;
}
function bn(e) {
	return String(e?.apiToken || "").trim().length >= ln && U(e?.allowWrite, !0) && U(e?.requireAuth, !1) && !U(e?.allowRemoteWrite, !1);
}
function xn(e) {
	let t = String((e && typeof e == "object" ? e : {}).apiToken || "").trim();
	return {
		apiToken: t.length >= ln ? t : yn(),
		allowWrite: !0,
		requireAuth: !0,
		allowRemoteWrite: !1,
		allowInsecureTokenTransport: gn()
	};
}
function Sn(e) {
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
function Cn(e) {
	return v(Sn(e));
}
function wn(e) {
	let t = String(e?.security?.tokenHint || "").trim();
	return t ? k("setting.sec.token.placeholderConfigured", "Token configured on server ({tokenHint}). Leave blank to keep the current server token.", { tokenHint: t }) : e?.security?.tokenConfigured ? k("setting.sec.token.placeholderConfiguredGeneric", "Token configured on server. Leave blank to keep the current server token.") : k("setting.sec.token.placeholder", "Auto-generated for this browser session.");
}
function Tn(e, t, n) {
	let r = (e, t) => [
		cn,
		e,
		t
	];
	e({
		id: `${sn}.Safety.ConfirmDeletion`,
		category: r(k("cat.security"), "Confirm before deleting"),
		name: "Confirm before deleting",
		tooltip: "Show a confirmation dialog before deleting files. Disabling this allows instant deletion.",
		type: "boolean",
		defaultValue: t.safety?.confirmDeletion !== !1,
		onChange: (e) => {
			fn(t.safety?.confirmDeletion !== !1, e) || (t.safety = t.safety || {}, t.safety.confirmDeletion = !!e, K(t), q(t), n("safety.confirmDeletion"));
		}
	});
	let i = (i, a, o, s = "cat.security") => {
		e({
			id: `${sn}.Security.${i}`,
			category: r(k(s), k(a).replace("Majoor: ", "")),
			name: k(a),
			tooltip: k(o),
			type: "boolean",
			defaultValue: U(t.security?.[i], un[i] ?? !1),
			onChange: (e) => {
				if (!fn(t.security?.[i], e)) {
					t.security = t.security || {}, t.security[i] = !!e, K(t), n(`security.${i}`);
					try {
						Cn(t.security).then((e) => {
							e?.ok && e.data?.prefs ? Pt() : e && e.ok === !1 && console.warn("[Majoor] backend security settings update failed", e.error || e);
						}).catch(() => {});
					} catch (e) {
						console.debug?.(e);
					}
				}
			}
		});
	};
	i("safeMode", "setting.sec.safe.name", "setting.sec.safe.desc"), i("allowWrite", "setting.sec.write.name", "setting.sec.write.desc"), i("allowDelete", "setting.sec.del.name", "setting.sec.del.desc"), i("allowRename", "setting.sec.ren.name", "setting.sec.ren.desc"), i("allowOpenInFolder", "setting.sec.open.name", "setting.sec.open.desc"), i("allowResetIndex", "setting.sec.reset.name", "setting.sec.reset.desc"), e({
		id: `${sn}.Security.RemoteLanPreset`,
		category: r(k("cat.remote"), k("setting.sec.remoteLanPreset.name").replace("Majoor: ", "")),
		name: k("setting.sec.remoteLanPreset.name"),
		tooltip: k("setting.sec.remoteLanPreset.desc"),
		type: "boolean",
		defaultValue: bn(t.security),
		onChange: (e) => {
			if (t.security = t.security || {}, fn(t.security.remoteLanPreset, e)) return;
			if (t.security.remoteLanPreset = !!e, !e) {
				K(t), n("security.remoteLanPreset");
				return;
			}
			let r;
			try {
				r = xn(t.security);
			} catch (e) {
				O(e?.message || k("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				return;
			}
			Object.assign(t.security, r), t.security.tokenConfigured = !0, t.security.tokenHint = String(r.apiToken || "").trim() ? `...${String(r.apiToken).trim().slice(-4)}` : "", r.apiToken && p(r.apiToken), K(t), n("security.remoteLanPreset"), n("security.apiToken"), n("security.allowWrite"), n("security.requireAuth"), n("security.allowRemoteWrite"), n("security.allowInsecureTokenTransport");
			try {
				Cn(t.security).then((e) => {
					e?.ok && e.data?.prefs ? (Pt(), O(k("toast.remoteLanPresetApplied", "Recommended remote LAN setup applied. This browser session is now authorized for Majoor write operations."), "success")) : e && e.ok === !1 && (O(e.error || k("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error"), console.warn("[Majoor] backend remote LAN preset update failed", e.error || e));
				}).catch((e) => {
					O(e?.message || k("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), e({
		id: `${sn}.Security.ApiToken`,
		category: r(k("cat.remote"), k("setting.sec.token.name").replace("Majoor: ", "")),
		name: k("setting.sec.token.name", "Majoor: API Token"),
		tooltip: k("setting.sec.token.desc", "Store the API token used for write operations. Majoor sends it via X-MJR-Token and Authorization headers."),
		type: "text",
		defaultValue: t.security?.apiToken || "",
		attrs: { placeholder: wn(t) },
		onChange: (e) => {
			t.security = t.security || {};
			let r = pn(e);
			if (pn(t.security.apiToken) !== r && (t.security.apiToken = r, t.security.apiToken && (t.security.tokenConfigured = !0, t.security.tokenHint = `...${t.security.apiToken.slice(-4)}`, p(t.security.apiToken)), K(t), n("security.apiToken"), t.security.apiToken)) try {
				v({ api_token: t.security.apiToken }).then((e) => {
					e?.ok && e.data?.prefs ? Pt() : e && e.ok === !1 && console.warn("[Majoor] backend token update failed", e.error || e);
				}).catch(() => {});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), i("requireAuth", "setting.sec.requireAuth.name", "setting.sec.requireAuth.desc", "cat.remote"), i("allowRemoteWrite", "setting.sec.remote.name", "setting.sec.remote.desc", "cat.remote"), i("allowInsecureTokenTransport", "setting.sec.insecureTransport.name", "setting.sec.insecureTransport.desc", "cat.remote");
}
//#endregion
//#region ui/app/settings/settingsAdvanced.ts
var Y = "Majoor", En = "Majoor Assets Manager";
function Dn(t, n, r, o) {
	let c = (e, t) => [
		En,
		e,
		t
	], l = String(n.paths?.outputDirectory || ""), u = null, d = 0, p = null;
	t({
		id: `${Y}.Paths.OutputDirectory`,
		category: c(k("cat.advanced"), "Paths / Output"),
		name: "Majoor: Generation Output Directory",
		tooltip: "Override the ComfyUI generation output directory used by Majoor (equivalent to --output-directory). Leave empty to keep the current backend default.",
		type: "text",
		defaultValue: String(n.paths?.outputDirectory || ""),
		attrs: { placeholder: "D:\\\\____COMFY_OUTPUTS" },
		onChange: async (e) => {
			let t = String(e || "").trim();
			n.paths = n.paths || {}, n.paths.outputDirectory = t, K(n);
			try {
				u &&= (clearTimeout(u), null);
			} catch (e) {
				console.debug?.(e);
			}
			u = setTimeout(async () => {
				u = null;
				let e = ++d;
				try {
					p?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				p = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let i = await te(t, p ? { signal: p.signal } : {});
					if (e !== d) return;
					if (!i?.ok) throw Error(i?.error || k("toast.failedSetOutputDirectory", "Failed to set output directory"));
					let a = String(i?.data?.output_directory || t).trim();
					n.paths.outputDirectory = a, l = a, K(n), r("paths.outputDirectory");
				} catch (t) {
					if (e !== d || String(t?.name || "") === "AbortError" || String(t?.code || "") === "ABORTED") return;
					n.paths.outputDirectory = l, K(n), r("paths.outputDirectory"), O(t?.message || k("toast.failedSetOutputDirectory", "Failed to set output directory"), "error");
				}
			}, 700);
		}
	});
	try {
		e().then((e) => {
			if (!e?.ok) return;
			let t = String(e?.data?.output_directory || "").trim();
			n.paths = n.paths || {}, n.paths.outputDirectory !== t && (n.paths.outputDirectory = t, l = t, K(n), r("paths.outputDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let g = String(n.paths?.indexDirectory || ""), _ = null, v = 0, y = null;
	t({
		id: `${Y}.Paths.IndexDirectory`,
		category: c(k("cat.advanced"), "Paths / Index"),
		name: "Majoor: Index Database Directory",
		tooltip: "Override the Majoor index database directory. Use this to keep the SQLite index on a different local disk. Requires restart.",
		type: "text",
		defaultValue: String(n.paths?.indexDirectory || ""),
		attrs: { placeholder: "D:\\MajoorIndex" },
		onChange: async (e) => {
			let t = String(e || "").trim();
			n.paths = n.paths || {}, n.paths.indexDirectory = t, K(n);
			try {
				_ &&= (clearTimeout(_), null);
			} catch (e) {
				console.debug?.(e);
			}
			_ = setTimeout(async () => {
				_ = null;
				let e = ++v;
				try {
					y?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				y = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let i = await C(t, y ? { signal: y.signal } : {});
					if (e !== v) return;
					if (!i?.ok) throw Error(i?.error || k("toast.failedSetIndexDirectory", "Failed to set index directory"));
					let a = String(i?.data?.index_directory || t).trim(), o = a !== g;
					n.paths.indexDirectory = a, g = a, K(n), r("paths.indexDirectory"), o && O(k("toast.indexDirectorySavedRestart", "Index directory saved. Restart ComfyUI to apply."), "success", void 0, { history: { trackId: "settings:index-directory-saved" } });
				} catch (t) {
					if (e !== v || String(t?.name || "") === "AbortError" || String(t?.code || "") === "ABORTED") return;
					n.paths.indexDirectory = g, K(n), r("paths.indexDirectory"), O(t?.message || k("toast.failedSetIndexDirectory", "Failed to set index directory"), "error");
				}
			}, 700);
		}
	});
	try {
		T().then((e) => {
			if (!e?.ok) return;
			let t = String(e?.data?.index_directory || "").trim();
			n.paths = n.paths || {}, n.paths.indexDirectory !== t && (n.paths.indexDirectory = t, g = t, K(n), r("paths.indexDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let x = String(n.paths?.workflowRoots || ""), S = null, ee = 0, re = null;
	t({
		id: `${Y}.Paths.WorkflowRoots`,
		category: c(k("cat.advanced"), "Paths / Workflows"),
		name: "Majoor: Workflow Roots",
		tooltip: "Folders scanned by the Workflow tab. Use one folder per line, or separate folders with semicolons. Leave empty to use ComfyUI defaults and MJR_AM_WORKFLOW_DIRECTORY.",
		type: "text",
		defaultValue: String(n.paths?.workflowRoots || ""),
		attrs: { placeholder: "D:\\\\ComfyUI\\\\user\\\\default\\\\workflows" },
		onChange: async (e) => {
			let t = String(e || "").trim();
			n.paths = n.paths || {}, n.paths.workflowRoots = t, K(n);
			try {
				S &&= (clearTimeout(S), null);
			} catch (e) {
				console.debug?.(e);
			}
			S = setTimeout(async () => {
				S = null;
				let e = ++ee;
				try {
					re?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				re = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let i = await h(t, re ? { signal: re.signal } : {});
					if (e !== ee) return;
					if (!i?.ok) throw Error(i?.error || k("toast.failedSetWorkflowRoots", "Failed to set workflow roots"));
					let a = String(i?.data?.workflow_roots_text || t).trim();
					n.paths.workflowRoots = a, x = a, K(n), r("paths.workflowRoots"), O(k("toast.workflowRootsSaved", "Workflow roots saved"), "success", 1800);
				} catch (t) {
					if (e !== ee || String(t?.name || "") === "AbortError" || String(t?.code || "") === "ABORTED") return;
					n.paths.workflowRoots = x, K(n), r("paths.workflowRoots"), O(t?.message || k("toast.failedSetWorkflowRoots", "Failed to set workflow roots"), "error");
				}
			}, 700);
		}
	});
	try {
		ae().then((e) => {
			if (!e?.ok) return;
			let t = String(e?.data?.workflow_roots_text || "").trim();
			n.paths = n.paths || {}, n.paths.workflowRoots !== t && (n.paths.workflowRoots = t, x = t, K(n), r("paths.workflowRoots"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let E = De().map((e) => e.code), ie = ["auto", ...E];
	t({
		id: `${Y}.Language`,
		category: c(k("cat.advanced"), k("setting.language.name", "Language")),
		name: k("setting.language.name", "Majoor: Language"),
		tooltip: "Use auto to detect and follow ComfyUI language. Or choose a fixed language for Majoor only.",
		type: "combo",
		defaultValue: n.i18n?.followComfyLanguage ? "auto" : Ce(),
		options: ie,
		onChange: (e) => {
			if (n.i18n = n.i18n || {}, e === "auto") {
				n.i18n.followComfyLanguage = !0, we(!0), Ae(o), K(n), r("language");
				return;
			}
			E.includes(e) && (n.i18n.followComfyLanguage = !1, we(!1), Te(e), K(n), r("language"));
		}
	}), t({
		id: `${Y}.ProbeBackend.Mode`,
		category: c(k("cat.advanced"), k("setting.probe.mode.name").replace("Majoor: ", "")),
		name: k("setting.probe.mode.name"),
		tooltip: k("setting.probe.mode.desc") + " (env: MAJOOR_MEDIA_PROBE_BACKEND)",
		type: "combo",
		defaultValue: n.probeBackend?.mode || G.probeBackend.mode,
		options: [
			"auto",
			"exiftool",
			"ffprobe",
			"both"
		],
		onChange: (e) => {
			let t = wt(e, [
				"auto",
				"exiftool",
				"ffprobe",
				"both"
			], G.probeBackend.mode);
			n.probeBackend = n.probeBackend || {}, n.probeBackend.mode = t, K(n), q(n), r("probeBackend.mode"), a(t).catch(() => {});
		}
	}), t({
		id: `${Y}.MetadataFallback.Image`,
		category: c(k("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Images)",
		tooltip: "Enable Pillow fallback when ExifTool is missing or fails.",
		type: "boolean",
		defaultValue: n.metadataFallback?.image ?? G.metadataFallback.image,
		onChange: async (e) => {
			let t = !!e, i = !!(n.metadataFallback?.image ?? G.metadataFallback.image);
			n.metadataFallback = n.metadataFallback || {}, n.metadataFallback.image = t, K(n), r("metadataFallback.image");
			try {
				let e = await ge({
					image: t,
					media: n.metadataFallback?.media ?? G.metadataFallback.media
				});
				if (!e?.ok) throw Error(e?.error || k("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				n.metadataFallback.image = i, K(n), r("metadataFallback.image"), O(e?.message || k("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	}), t({
		id: `${Y}.MetadataFallback.Media`,
		category: c(k("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Audio/Video)",
		tooltip: "Enable hachoir fallback when ffprobe is missing or fails.",
		type: "boolean",
		defaultValue: n.metadataFallback?.media ?? G.metadataFallback.media,
		onChange: async (e) => {
			let t = !!e, i = !!(n.metadataFallback?.media ?? G.metadataFallback.media);
			n.metadataFallback = n.metadataFallback || {}, n.metadataFallback.media = t, K(n), r("metadataFallback.media");
			try {
				let e = await ge({
					image: n.metadataFallback?.image ?? G.metadataFallback.image,
					media: t
				});
				if (!e?.ok) throw Error(e?.error || k("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				n.metadataFallback.media = i, K(n), r("metadataFallback.media"), O(e?.message || k("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	});
	try {
		b().then((e) => {
			if (!e?.ok || !e?.data?.prefs) return;
			let t = e.data.prefs || {}, i = !!(t.image ?? G.metadataFallback.image), a = !!(t.media ?? G.metadataFallback.media);
			n.metadataFallback = n.metadataFallback || {};
			let o = !1;
			n.metadataFallback.image !== i && (n.metadataFallback.image = i, o = !0), n.metadataFallback.media !== a && (n.metadataFallback.media = a, o = !0), o && (K(n), r("metadataFallback"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	t({
		id: `${Y}.Db.Timeout`,
		category: c(k("cat.advanced"), "Database"),
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
			n.db = n.db || {}, n.db.timeoutMs = Math.max(1e3, Math.min(3e4, Math.round(W(e, 5e3)))), K(n), q(n), r("db.timeoutMs");
		}
	}), t({
		id: `${Y}.Db.MaxConnections`,
		category: c(k("cat.advanced"), "Database"),
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
			n.db = n.db || {}, n.db.maxConnections = Math.max(1, Math.min(100, Math.round(W(e, 10)))), K(n), q(n), r("db.maxConnections");
		}
	}), t({
		id: `${Y}.Db.QueryTimeout`,
		category: c(k("cat.advanced"), "Database"),
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
			n.db = n.db || {}, n.db.queryTimeoutMs = Math.max(500, Math.min(1e4, Math.round(W(e, 1e3)))), K(n), q(n), r("db.queryTimeoutMs");
		}
	}), t({
		id: `${Y}.Observability.Enabled`,
		category: c(k("cat.advanced"), k("setting.obs.enabled.name").replace("Majoor: ", "")),
		name: k("setting.obs.enabled.name"),
		tooltip: k("setting.obs.enabled.desc"),
		type: "boolean",
		defaultValue: !!n.observability?.enabled,
		onChange: (e) => {
			n.observability = n.observability || {}, n.observability.enabled = !!e, K(n), q(n), r("observability.enabled");
		}
	}), t({
		id: `${Y}.Observability.RuntimeDashboardMode`,
		category: c(k("cat.advanced"), "Runtime metrics badge"),
		name: "Majoor: Runtime metrics badge",
		tooltip: "Controls the small DB/enrichment/watcher metrics badge in the Assets Manager panel.",
		type: "combo",
		defaultValue: n.observability?.runtimeDashboardMode || G.observability.runtimeDashboardMode,
		options: [
			"autoHide30",
			"always",
			"hidden"
		],
		onChange: (e) => {
			let t = wt(e, [
				"autoHide30",
				"always",
				"hidden"
			], G.observability.runtimeDashboardMode);
			n.observability = n.observability || {}, n.observability.runtimeDashboardMode = t, K(n), r("observability.runtimeDashboardMode");
		}
	}), t({
		id: `${Y}.Observability.VerboseErrors`,
		category: c(k("cat.advanced"), "Verbose error logging"),
		name: "Verbose error logging",
		tooltip: "Show detailed error messages in toasts and console. Useful for debugging.",
		type: "boolean",
		defaultValue: !!n.observability?.verboseErrors,
		onChange: (e) => {
			n.observability = n.observability || {}, n.observability.verboseErrors = !!e, K(n), q(n), r("observability.verboseErrors");
		}
	}), t({
		id: `${Y}.Observability.VerboseRouteRegistrationLogs`,
		category: c(k("cat.advanced"), "Logs"),
		name: "Majoor: Verbose route registration logs",
		tooltip: "When disabled, Majoor prints a compact startup summary instead of listing every registered API route. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(n.observability?.verboseRouteRegistrationLogs ?? G.observability?.verboseRouteRegistrationLogs ?? !1),
		onChange: async (e) => {
			let t = !!e, a = !!(n.observability?.verboseRouteRegistrationLogs ?? G.observability?.verboseRouteRegistrationLogs ?? !1);
			n.observability = n.observability || {}, n.observability.verboseRouteRegistrationLogs = t, K(n), r("observability.verboseRouteRegistrationLogs");
			try {
				let e = await i(t);
				if (!e?.ok) throw Error(e?.error || "Failed to update route logging settings");
			} catch (e) {
				n.observability.verboseRouteRegistrationLogs = a, K(n), r("observability.verboseRouteRegistrationLogs"), O(e?.message || "Failed to update route logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let e = !!(await oe())?.data?.prefs?.enabled;
			n.observability = n.observability || {}, n.observability.verboseRouteRegistrationLogs !== e && (n.observability.verboseRouteRegistrationLogs = e, K(n), r("observability.verboseRouteRegistrationLogs"));
		} catch (e) {
			console.debug?.(e);
		}
	})(), t({
		id: `${Y}.Observability.VerboseStartupLogs`,
		category: c(k("cat.advanced"), "Logs"),
		name: "Majoor: Verbose startup logs",
		tooltip: "When disabled, Majoor suppresses most informational bootstrap logs during backend startup while keeping warnings and errors. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(n.observability?.verboseStartupLogs ?? G.observability?.verboseStartupLogs ?? !1),
		onChange: async (e) => {
			let t = !!e, i = !!(n.observability?.verboseStartupLogs ?? G.observability?.verboseStartupLogs ?? !1);
			n.observability = n.observability || {}, n.observability.verboseStartupLogs = t, K(n), r("observability.verboseStartupLogs");
			try {
				let e = await se(t);
				if (!e?.ok) throw Error(e?.error || "Failed to update startup logging settings");
			} catch (e) {
				n.observability.verboseStartupLogs = i, K(n), r("observability.verboseStartupLogs"), O(e?.message || "Failed to update startup logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let e = !!(await de())?.data?.prefs?.enabled;
			n.observability = n.observability || {}, n.observability.verboseStartupLogs !== e && (n.observability.verboseStartupLogs = e, K(n), r("observability.verboseStartupLogs"));
		} catch (e) {
			console.debug?.(e);
		}
	})();
	{
		let e = "HuggingFace Token", i = "", a = null, o = 0, l = !!n.ai?.huggingFaceTokenVisible, u = () => {
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
		t({
			id: `${Y}.AI.HuggingFaceTokenVisible`,
			category: c(k("cat.advanced"), e),
			name: "Show HuggingFace token",
			tooltip: "Show or hide the HuggingFace token while editing.",
			type: "boolean",
			defaultValue: l,
			onChange: (e) => {
				let t = !!e;
				l = t, n.ai = n.ai || {}, n.ai.huggingFaceTokenVisible = t, K(n), r("ai.huggingFaceTokenVisible"), setTimeout(u, 0);
			}
		}), t({
			id: `${Y}.AI.HuggingFaceToken`,
			category: c(k("cat.advanced"), e),
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
						a &&= (clearTimeout(a), null);
					} catch (e) {
						console.debug?.(e);
					}
					a = setTimeout(async () => {
						a = null;
						let e = ++o;
						try {
							let n = await _e(t);
							if (e !== o) return;
							if (!n?.ok) throw Error(n?.error || "Failed to update HuggingFace token");
							i = t, r("ai.huggingFaceToken"), t ? O("HuggingFace token saved", "success") : O("HuggingFace token cleared", "success", void 0, { noHistory: !0 });
						} catch (t) {
							if (e !== o) return;
							O(t?.message || "Failed to update HuggingFace token", "error");
						}
					}, 900);
				}
			}
		}), setTimeout(u, 0), (async () => {
			try {
				let e = (await ne())?.data?.prefs || {}, t = !!e?.has_token, n = String(e?.token_hint || "").trim();
				d(t ? `Configured ${n || "(saved)"}` : "Paste HuggingFace token (hf_...)");
			} catch (e) {
				console.debug?.(e);
			}
		})(), t({
			id: `${Y}.AI.VerboseLogs`,
			category: c(k("cat.advanced"), e),
			name: "Majoor: Verbose AI logs",
			tooltip: "Enable detailed HuggingFace/SigLIP2/X-CLIP logs and progress bars during model download/loading.",
			type: "boolean",
			defaultValue: !!(n.ai?.verboseAiLogs ?? G.ai?.verboseAiLogs ?? !1),
			onChange: async (e) => {
				let t = !!e, i = !!(n.ai?.verboseAiLogs ?? G.ai?.verboseAiLogs ?? !1);
				n.ai = n.ai || {}, n.ai.verboseAiLogs = t, K(n), r("ai.verboseAiLogs");
				try {
					let e = await ve(t);
					if (!e?.ok) throw Error(e?.error || "Failed to update AI logging settings");
				} catch (e) {
					n.ai.verboseAiLogs = i, K(n), r("ai.verboseAiLogs"), O(e?.message || "Failed to update AI logging settings", "error");
				}
			}
		}), (async () => {
			try {
				let e = !!(await s())?.data?.prefs?.enabled;
				n.ai = n.ai || {}, n.ai.verboseAiLogs !== e && (n.ai.verboseAiLogs = e, K(n), r("ai.verboseAiLogs"));
			} catch (e) {
				console.debug?.(e);
			}
		})();
	}
	t({
		id: `${Y}.AI.VectorStats`,
		category: c(k("cat.advanced"), "AI / Vector Search"),
		name: "Vector Index Status",
		tooltip: "Current status of the SigLIP2/X-CLIP vector index used for semantic search",
		type: "text",
		defaultValue: "Loading vector status..."
	}), (async () => {
		try {
			let e = await w();
			e?.ok ? console.debug?.("[Majoor] Vector status:", `${e.data?.total || 0} assets indexed | Model: ${e.data?.model || "N/A"}`) : console.debug?.("[Majoor] Vector status unavailable");
		} catch (e) {
			console.debug?.("[Majoor] Vector status fetch failed", e);
		}
	})(), t({
		id: `${Y}.AI.VectorBackfillAction`,
		category: c(k("cat.advanced"), "AI / Vector Search"),
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
				O(k("toast.vectorBackfillStarting", "Starting vector backfill... This may take a while."), "info", void 0, { history: {
					...t.history,
					status: "started",
					detail: "Starting vector backfill... This may take a while."
				} });
				let e = await m(64, { onProgress: (e) => {
					let n = String(e?.status || "running").toLowerCase() || "running", r = e?.progress || e?.result || {}, i = Number(r?.candidates ?? r?.processed ?? 0), a = Number(r?.indexed ?? 0), o = Number(r?.skipped ?? 0), s = Number(r?.errors ?? 0), c = Math.max(i, a + o + s), l = c > 0 ? Math.round((a + o + s) / c * 100) : null, u = n === "queued" ? "Vector backfill queued" : `Candidates ${i}, indexed ${a}, skipped ${o}, errors ${s}`;
					f({
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
						O(k("toast.vectorBackfillRunning", "Vector backfill still running in background{job}.", { job: e ? ` (job ${e.slice(0, 8)})` : "" }), "info", void 0, { history: {
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
					} else O(k("toast.vectorBackfillComplete", "Vector backfill complete! Processed: {processed}, Indexed: {indexed}, Skipped: {skipped}", {
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
						let e = await w();
						e?.ok && console.debug?.("[Majoor] Vector stats after backfill:", e.data);
					} catch (e) {
						console.debug?.("[Majoor] Failed to refresh vector stats:", e);
					}
				} else throw Error(e?.error || k("toast.vectorBackfillFailedGeneric", "Backfill failed"));
			} catch (e) {
				let n = e?.message || String(e || k("status.unknown", "unknown"));
				O(k("toast.vectorBackfillFailedDetail", "Vector backfill failed: {error}", { error: n }), "error", void 0, { history: {
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
var On = "Majoor", kn = "Majoor Assets Manager";
function An(e, n, r) {
	let i = (e, t) => [
		kn,
		e,
		t
	];
	e({
		id: `${On}.AI.VectorSearchEnabled`,
		category: i(k("cat.search", "Search"), "AI"),
		name: k("setting.ai.vector.enabled.name", "Enable AI semantic search"),
		tooltip: k("setting.ai.vector.enabled.desc", "Enable/disable AI vector search features (SigLIP2/X-CLIP: description search, prompt alignment, AI tag suggestions, smart collections)."),
		type: "boolean",
		defaultValue: !!(n.ai?.vectorSearchEnabled ?? !0),
		onChange: async (e) => {
			n.ai = n.ai || {};
			let i = !!(n.ai.vectorSearchEnabled ?? !0), a = !!e;
			n.ai.vectorSearchEnabled = a, K(n), q(n), r("ai.vectorSearchEnabled");
			try {
				let e = await t(a);
				if (!e?.ok) {
					n.ai.vectorSearchEnabled = i, K(n), q(n), r("ai.vectorSearchEnabled"), O(e?.error || "Failed to update AI vector search setting", "error");
					return;
				}
				O(a ? "AI semantic search enabled" : "AI semantic search disabled", "info", 2200);
			} catch (e) {
				n.ai.vectorSearchEnabled = i, K(n), q(n), r("ai.vectorSearchEnabled"), O(e?.message || "Failed to update AI vector search setting", "error");
			}
		}
	}), e({
		id: `${On}.AI.VectorCaptionOnIndex`,
		category: i(k("cat.search", "Search"), "AI"),
		name: k("setting.ai.vector.captionOnIndex.name", "Generate AI captions during indexing"),
		tooltip: k("setting.ai.vector.captionOnIndex.desc", "Allow automatic vector indexing and backfill to run Florence-2 captions for image assets. This is slower and can use significant VRAM/CPU; leave it off for faster grid startup."),
		type: "boolean",
		defaultValue: !!(n.ai?.vectorCaptionOnIndex ?? !1),
		onChange: async (e) => {
			n.ai = n.ai || {};
			let i = !!(n.ai.vectorCaptionOnIndex ?? !1), a = !!e;
			n.ai.vectorCaptionOnIndex = a, K(n), q(n), r("ai.vectorCaptionOnIndex");
			try {
				let e = await t({ caption_on_index: a });
				if (!e?.ok) {
					n.ai.vectorCaptionOnIndex = i, K(n), q(n), r("ai.vectorCaptionOnIndex"), O(e?.error || "Failed to update AI caption indexing setting", "error");
					return;
				}
				a && O("AI captions during indexing enabled", "info", 2600);
			} catch (e) {
				n.ai.vectorCaptionOnIndex = i, K(n), q(n), r("ai.vectorCaptionOnIndex"), O(e?.message || "Failed to update AI caption indexing setting", "error");
			}
		}
	}), e({
		id: `${On}.AI.VectorIndexOnScan`,
		category: i(k("cat.search", "Search"), "AI"),
		name: k("setting.ai.vector.indexOnScan.name", "Index vectors during scans"),
		tooltip: k("setting.ai.vector.indexOnScan.desc", "Compute SigLIP/X-CLIP embeddings while assets are scanned. Disable to avoid surprise VRAM use; run vector backfill manually when needed."),
		type: "boolean",
		defaultValue: !!(n.ai?.vectorIndexOnScan ?? !1),
		onChange: async (e) => {
			n.ai = n.ai || {};
			let i = !!(n.ai.vectorIndexOnScan ?? !1), a = !!e;
			n.ai.vectorIndexOnScan = a, K(n), q(n), r("ai.vectorIndexOnScan");
			try {
				let e = await t({ index_on_scan: a });
				if (!e?.ok) {
					n.ai.vectorIndexOnScan = i, K(n), q(n), r("ai.vectorIndexOnScan"), O(e?.error || "Failed to update vector scan indexing", "error");
					return;
				}
				O(a ? "Vector indexing during scans enabled" : "Vector indexing during scans disabled", "info", 2400);
			} catch (e) {
				n.ai.vectorIndexOnScan = i, K(n), q(n), r("ai.vectorIndexOnScan"), O(e?.message || "Failed to update vector scan indexing", "error");
			}
		}
	}), e({
		id: `${On}.AI.VectorConcurrency`,
		category: i(k("cat.search", "Search"), "AI"),
		name: k("setting.ai.vector.concurrency.name", "Vector indexing concurrency"),
		tooltip: k("setting.ai.vector.concurrency.desc", "Maximum concurrent vector embedding workers. Use 1 to minimize transient VRAM spikes."),
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
			n.ai.vectorConcurrency = a, K(n), q(n), r("ai.vectorConcurrency");
			try {
				let e = await t({ concurrency: a });
				e?.ok || (n.ai.vectorConcurrency = i, K(n), q(n), r("ai.vectorConcurrency"), O(e?.error || "Failed to update vector concurrency", "error"));
			} catch (e) {
				n.ai.vectorConcurrency = i, K(n), q(n), r("ai.vectorConcurrency"), O(e?.message || "Failed to update vector concurrency", "error");
			}
		}
	}), e({
		id: `${On}.AI.VectorUnloadAfterUse`,
		category: i(k("cat.search", "Search"), "AI"),
		name: k("setting.ai.vector.unloadAfterUse.name", "Unload AI models after use"),
		tooltip: k("setting.ai.vector.unloadAfterUse.desc", "Unload Majoor SigLIP/X-CLIP/Florence models after heavy AI actions and call torch CUDA cache cleanup. This frees VRAM but makes the next AI action slower."),
		type: "boolean",
		defaultValue: !!(n.ai?.vectorUnloadAfterUse ?? !1),
		onChange: async (e) => {
			n.ai = n.ai || {};
			let i = !!(n.ai.vectorUnloadAfterUse ?? !1), a = !!e;
			n.ai.vectorUnloadAfterUse = a, K(n), q(n), r("ai.vectorUnloadAfterUse");
			try {
				let e = await t({ unload_after_use: a });
				if (!e?.ok) {
					n.ai.vectorUnloadAfterUse = i, K(n), q(n), r("ai.vectorUnloadAfterUse"), O(e?.error || "Failed to update model unload setting", "error");
					return;
				}
				O(a ? "AI model unload after use enabled" : "AI model unload after use disabled", "info", 2400);
			} catch (e) {
				n.ai.vectorUnloadAfterUse = i, K(n), q(n), r("ai.vectorUnloadAfterUse"), O(e?.message || "Failed to update model unload setting", "error");
			}
		}
	}), e({
		id: `${On}.AI.VectorUnloadNow`,
		category: i(k("cat.search", "Search"), "AI"),
		name: k("setting.ai.vector.unloadNow.name", "Memory purge now"),
		tooltip: k("setting.ai.vector.unloadNow.desc", "Immediately unload Majoor AI vector/caption models, ask ComfyUI to unload loaded models, and clear torch CUDA cache when idle."),
		type: "combo",
		options: ["Idle", "Unload now"],
		defaultValue: "Idle",
		onChange: async (e) => {
			if (String(e || "") === "Unload now") try {
				let e = await o();
				O(e?.ok ? "Majoor AI model cache unloaded" : e?.error || "Failed to unload Majoor AI model cache", e?.ok ? "info" : "error", 2600);
			} catch (e) {
				O(e?.message || "Failed to unload Majoor AI model cache", "error");
			}
		}
	}), e({
		id: `${On}.Search.MaxResults`,
		category: i(k("cat.search", "Search")),
		name: k("setting.search.maxResults.name", "Max search results (client)"),
		tooltip: k("setting.search.maxResults.desc", "Maximum number of results requested per search. The backend still enforces MAJOOR_SEARCH_MAX_LIMIT; increase that env var if you need a higher hard cap."),
		type: "number",
		defaultValue: Number(n.search?.maxResults || j.SEARCH_DEFAULT_LIMIT),
		attrs: {
			min: 10,
			max: j.MAX_PAGE_SIZE || 2e3,
			step: 1
		},
		onChange: (e) => {
			n.search = n.search || {}, n.search.maxResults = Math.max(10, Math.min(j.MAX_PAGE_SIZE || 2e3, Number(e) || j.SEARCH_DEFAULT_LIMIT)), K(n), q(n), r("search.maxResults");
		}
	}), e({
		id: `${On}.EnvVars.Reference`,
		category: i(k("cat.advanced"), "Environment variables"),
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
var jn = "Majoor Assets Manager", Mn = /^\s*Majoor:\s*/i, Nn = Object.freeze({
	ASSETS_PANEL: "Assets Panel",
	GENERATED_FEED: "Generated Feed",
	VIEWER: "Viewer & Floating Viewer",
	INDEXING: "Indexing & Watcher",
	SEARCH_AI: "Search & AI",
	GENERAL: "General",
	ADVANCED: "Advanced",
	SECURITY: "Security"
}), Pn = new Set([
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
]), Fn = "Majoor.General.ResetAllSettings", In = "mjr-settings-reset-btn", Ln = null, Rn = null;
function zn(e) {
	let t = String(e || "").trim();
	return !t || t === Fn || t === "Majoor.Language" ? Nn.GENERAL : /^Majoor\.(Safety|Security)\./.test(t) ? Nn.SECURITY : /^Majoor\.(Paths|Db|ProbeBackend|MetadataFallback|Observability)\./.test(t) || t === "Majoor.EnvVars.Reference" ? Nn.ADVANCED : /^Majoor\.(Viewer|WorkflowMinimap)\./.test(t) ? Nn.VIEWER : /^Majoor\.Feed\./.test(t) ? Nn.GENERATED_FEED : /^Majoor\.(AutoScan|Scan|Watcher|ExecutionGrouping|RatingTagsSync)\./.test(t) || t === "Majoor.RtHydrate.Concurrency" ? Nn.INDEXING : /^Majoor\.AI\.(HuggingFaceTokenVisible|HuggingFaceToken|VerboseLogs|VectorStats|VectorBackfillAction|VectorSearchEnabled|VectorCaptionOnIndex|VectorIndexOnScan|VectorConcurrency|VectorUnloadAfterUse|VectorUnloadNow)$/.test(t) || /^Majoor\.Search\./.test(t) ? Nn.SEARCH_AI : /^Majoor\.(Grid|Cards|Badges|Sidebar|InfiniteScroll|General)\./.test(t) ? Nn.ASSETS_PANEL : Nn.GENERAL;
}
function Bn(e) {
	let t = Array.isArray(e?.category) ? e.category.filter(Boolean) : [], n = zn(e?.id), r = String(t[1] || t[0] || "").trim(), i = String(t[2] || "").trim(), a = String(e?.name || "").replace(Mn, "").trim();
	return [
		jn,
		n,
		i || r || a || n
	];
}
var Vn = !1, Hn = null, Un = null, Wn = !1, Gn = /* @__PURE__ */ new Set();
function Kn(e) {
	if (!e || typeof e != "object") return null;
	let t = { ...e };
	try {
		typeof t.name == "string" && (t.name = t.name.replace(Mn, "").trim());
	} catch (e) {
		console.debug?.(e);
	}
	try {
		t.category = Bn(t);
	} catch {
		t.category = [jn, Nn.GENERAL];
	}
	return !t.tooltip && typeof t.name == "string" && t.name.trim() && (t.tooltip = t.name.trim()), t;
}
function qn(e, t, n) {
	let r = String(t?.id || "").trim();
	if (!r || Gn.has(r)) return !1;
	Gn.add(r);
	try {
		return be(e, r, n);
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
function Yn(e) {
	try {
		return JSON.parse(JSON.stringify(e || {}));
	} catch {
		return { ...G };
	}
}
function Xn(e, t, n, { wrapForComfy: r = !0 } = {}) {
	let i = [], a = (e) => {
		let n = Kn(e);
		n && i.push(r ? Jn(t, n) : n);
	};
	return Xt(a, e, n), on(a, e, n), $t(a, e, n), nn(a, e, n), Tn(a, e, n), Dn(a, e, n, t), An(a, e, n), i;
}
function Zn(e, t) {
	if (e === t) return !0;
	try {
		return JSON.stringify(e) === JSON.stringify(t);
	} catch {
		return !1;
	}
}
function Qn(e) {
	return e ? e.querySelector(".form-input") || e.querySelector(".p-inputgroup") || e.querySelector(".setting-input") || e.querySelector("[class*='input']") : null;
}
function $n(e, t) {
	let n = document.createElement("button");
	return n.type = "button", n.className = In, n.textContent = e, n.title = t, n.style.marginLeft = "8px", n.style.minWidth = e.length > 2 ? "auto" : "24px", n.style.height = "24px", n.style.padding = e.length > 2 ? "0 10px" : "0", n.style.borderRadius = "6px", n.style.border = "1px solid var(--border-color, #555)", n.style.background = "var(--comfy-input-bg, #2b2b2b)", n.style.color = "var(--input-text, inherit)", n.style.cursor = "pointer", n.style.fontSize = "12px", n.style.lineHeight = "22px", n.style.flexShrink = "0", n;
}
function er(e, t, n) {
	String(e?.id || "").trim() && (qn(n, e, t), typeof e?.onChange == "function" && e.onChange(t));
}
function tr(e, t, n, r) {
	let i = !Zn(xe(r, t.id, t.defaultValue), n);
	e.disabled = !i, e.style.opacity = i ? "1" : "0.45";
}
function nr() {
	if (typeof document > "u" || !Rn) return;
	let { app: e, definitions: t, defaultValues: n } = Rn, r = document.querySelector(`[data-setting-id="${Fn}"]`), i = Qn(r);
	if (r && i && !r.getAttribute("data-mjr-reset-injected")) {
		r.setAttribute("data-mjr-reset-injected", "true"), i.innerHTML = "";
		let a = $n("Reset all settings", "Reset all Majoor settings to defaults");
		a.onclick = (r) => {
			r.preventDefault(), r.stopPropagation();
			for (let r of t) r.id !== Fn && n.has(r.id) && er(r, n.get(r.id), e);
			nr();
		}, i.appendChild(a);
	}
	for (let r of t) {
		if (!r?.id || r.id === Fn || !n.has(r.id)) continue;
		let t = document.querySelector(`[data-setting-id="${r.id}"]`);
		if (!t || t.getAttribute("data-mjr-reset-injected")) continue;
		let i = Qn(t);
		if (!i) continue;
		t.setAttribute("data-mjr-reset-injected", "true");
		let a = $n("Reset", "Reset this setting to default");
		tr(a, r, n.get(r.id), e), a.onclick = (t) => {
			t.preventDefault(), t.stopPropagation();
			let i = n.get(r.id);
			er(r, i, e), tr(a, r, i, e);
		}, i.appendChild(a);
	}
}
function rr(e, t, n) {
	typeof document > "u" || typeof MutationObserver > "u" || (Rn = {
		app: e,
		definitions: t,
		defaultValues: new Map(n.filter((e) => e?.id && e.id !== Fn).map((e) => [e.id, e.defaultValue]))
	}, nr(), !Ln && (Ln = new MutationObserver(() => nr()), Ln.observe(document.body, {
		childList: !0,
		subtree: !0
	})));
}
function ir(e, t, { initRuntime: n = !1 } = {}) {
	if (Un) typeof t == "function" && Un.onAppliedListeners.add(t), e && !Un.app && (Un.app = e);
	else {
		let n = Nt();
		n.i18n = n.i18n || {}, typeof n.i18n.followComfyLanguage == "boolean" ? we(!!n.i18n.followComfyLanguage) : (n.i18n.followComfyLanguage = !0, we(!0), K(n));
		let r = /* @__PURE__ */ new Set();
		typeof t == "function" && r.add(t);
		let i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set(), o = () => {
			if (!i.size) return;
			let e = Array.from(i);
			i.clear();
			for (let t of e) Me("mjr-settings-changed", { key: t }, { warnPrefix: "[Majoor]" });
		}, s = () => {
			if (!a.size) return;
			let e = Array.from(a);
			a.clear();
			for (let t of e) Me("mjr-settings-changed", { key: t }, { warnPrefix: "[Majoor]" });
		}, c = Jt(o, 120), l = Jt(s, 450), u = (e) => {
			typeof e == "string" && i.add(e), c();
		}, d = (e) => {
			typeof e == "string" && a.add(e), l();
		}, f = () => {
			let e = Nt();
			Object.assign(n, e), q(n), u("storage");
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
				Pn.has(String(e || "")) ? d(e) : u(e);
			},
			onAppliedListeners: r,
			refreshFromStorage: f,
			settings: n
		};
	}
	if (n && !Wn) {
		let t = e || Un.app, n = Un.settings;
		Ae(t), q(n), Oe(t), Pt(), Ft(), It(), n?.watcher && typeof n.watcher.enabled == "boolean" && y(!!n.watcher.enabled).catch(() => {}), Kt(), Wn = !0;
	}
	return Un;
}
var ar = (e, t) => ir(e, t, { initRuntime: !0 }).settings, or = (e, t) => {
	let n = ir(e, t, { initRuntime: !1 });
	Object.assign(n.settings, Nt());
	let r = e || n.app, i = Xn(n.settings, r, n.notifyApplied), a = Xn(Yn(G), r, () => {}, { wrapForComfy: !1 });
	return i.unshift(Jn(r, {
		id: Fn,
		category: [
			jn,
			Nn.GENERAL,
			"Reset"
		],
		name: "Reset all settings to defaults",
		tooltip: "Reset every Majoor Assets Manager setting to its default value.",
		type: "text",
		defaultValue: ""
	})), rr(r, i, a), i;
};
try {
	let e = Nt();
	e?.watcher && typeof e.watcher.enabled == "boolean" && fe().then((e) => {
		let t = !!e?.ok && !!e?.data?.enabled, n = Nt();
		n.watcher = n.watcher || {}, typeof t == "boolean" && t !== !!n.watcher.enabled && (n.watcher.enabled = t, K(n), Me("mjr-settings-changed", { key: "watcher.enabled" }, { warnPrefix: "[Majoor]" }));
	}).catch(() => {});
} catch (e) {
	console.debug?.(e);
}
//#endregion
//#region ui/features/viewer/workflowGraphMap/workflowNodeLabeling.ts
var sr = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, cr = /^[0-9a-f]{20,}$/i;
function lr(...e) {
	for (let t of e) {
		let e = String(t || "").trim();
		if (e) return e;
	}
	return "";
}
function ur(e) {
	let t = String(e || "").trim();
	return !!t && (sr.test(t) || cr.test(t));
}
function dr(e) {
	return String(e?.type || e?.class_type || e?.comfyClass || e?.classType || "").trim();
}
function fr(e) {
	return lr(e?.properties?.subgraph_name, e?.title, e?.properties?.title, e?.properties?.name, e?.properties?.label, e?.name, e?.subgraph?.name, e?.subgraph_instance?.name);
}
function pr(e) {
	let t = dr(e), n = fr(e);
	return n && (!t || ur(t) || n !== t) ? n : t && !ur(t) ? t : n || (t ? "Subgraph" : String(e?.id || "Node").trim() || "Node");
}
function mr(e) {
	let t = dr(e);
	return t && !ur(t) ? t : t ? "Subgraph" : "Node";
}
//#endregion
//#region ui/components/sidebar/utils/minimap.ts
var hr = 6, gr = 1, _r = 8, vr = 74, yr = 42, br = [
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
], xr = (e, t, n) => {
	let r = Number(e);
	return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
}, Sr = (e, t = !1) => {
	let n = String(e || "").toUpperCase();
	return n.includes("IMAGE") ? "rgba(145,198,99,0.9)" : n.includes("LATENT") ? "rgba(89,178,118,0.9)" : n.includes("MODEL") ? "rgba(112,155,255,0.9)" : n.includes("CONDITIONING") ? "rgba(191,123,226,0.9)" : n.includes("CLIP") ? "rgba(220,178,77,0.9)" : n.includes("VAE") ? "rgba(72,184,214,0.9)" : n.includes("MASK") ? "rgba(190,190,190,0.88)" : n.includes("STRING") || n.includes("TEXT") ? "rgba(230,230,230,0.86)" : n.includes("INT") || n.includes("FLOAT") || n.includes("NUMBER") ? "rgba(130,210,220,0.88)" : t ? "rgba(170,220,255,0.82)" : "rgba(255,255,255,0.72)";
}, Cr = (e, t, n) => {
	let r = String(t || "").replace(/\s+/g, " ").trim(), i = Math.max(1, Number(n) || 1);
	if (!r || e.measureText(r).width <= i) return r;
	let a = r;
	for (; a.length > 3 && e.measureText(`${a}...`).width > i;) a = a.slice(0, -1);
	return a.length > 3 ? `${a}...` : r.slice(0, 3);
};
function wr(e, t, n = null) {
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
	}, a = i.expandSubgraphs === !1 ? t : Tr(t), o = Array.isArray(a?.nodes) ? a.nodes : [], s = Array.isArray(a?.groups) && a.groups || Array.isArray(a?.extra?.groups) && a.extra.groups || Array.isArray(a?.extra?.groupNodes) && a.extra.groupNodes || Array.isArray(a?.extra?.group_nodes) && a.extra.group_nodes || [], c = Array.isArray(a?.links) && a.links || Array.isArray(a?.extra?.links) && a.extra.links || [], l = Math.max(1, e.clientWidth || e.width || 1), u = Math.max(1, e.clientHeight || e.height || 1);
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
		for (let [e, t] of br) if (n.includes(e)) return t;
		let r = 0;
		for (let e = 0; e < n.length; e += 1) r = r * 31 + n.charCodeAt(e) | 0;
		return `hsl(${Math.abs(r) % 360} 42% 42%)`;
	}, p = (e) => {
		let t = [], n = e?.inputs && typeof e.inputs == "object" && !Array.isArray(e.inputs) ? e.inputs : null;
		if (n) {
			for (let [e, r] of Object.entries(n)) if (!(Array.isArray(r) || r && typeof r == "object") && (t.push([e, r]), t.length >= 3)) return t;
		}
		let r = Array.isArray(e?.widgets_values) ? e.widgets_values : [], i = Array.isArray(e?.widgets) ? e.widgets : [], a = Array.isArray(e?.inputs) ? e.inputs : [], o = a.filter((e) => e?.widget === !0 || e?.widget && typeof e.widget == "object" || typeof e?.widget == "string" && e.widget.trim()), s = a.filter((e) => e?.link == null && Nr(e?.type)), c = (o.length ? o : s.length ? s : a).map((e) => String(e?.label || e?.localized_name || e?.name || e?.widget?.name || e?.widget?.label || "").trim());
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
			label: pr(e).replace(/\s+/g, " ").trim()
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
	let S = Math.max(1, b - v), C = Math.max(1, x - y), ee = v + S / 2, te = y + C / 2, w = i.view && typeof i.view == "object" ? i.view : Object.create(null), T = xr(w.zoom ?? 1, gr, _r), ne = Math.max(1, S / T), re = Math.max(1, C / T), E = ne / 2, ie = re / 2, ae = ne >= S ? ee : xr(w.centerX ?? ee, v + E, b - E), oe = re >= C ? te : xr(w.centerY ?? te, y + ie, x - ie), se = ae - E, ce = oe - ie, le = hr, D = Math.min((l - le * 2) / ne, (u - le * 2) / re), ue = w.hoveredNodeId !== null && w.hoveredNodeId !== void 0 ? String(w.hoveredNodeId) : null;
	r.clearRect(0, 0, l, u), r.fillStyle = "rgba(0,0,0,0.22)", r.fillRect(0, 0, l, u);
	let O = (e, t) => ({
		x: le + (e - se) * D,
		y: le + (t - ce) * D
	}), de = (e, t) => ({
		x: xr(se + (Number(e) - le) / D, v, b),
		y: xr(ce + (Number(t) - le) / D, y, x)
	}), fe = (e) => ({
		x: le + (e.x - se) * D,
		y: le + (e.y - ce) * D,
		w: Math.max(1, e.w * D),
		h: Math.max(1, e.h * D)
	}), pe = (e) => Math.max(10, Math.min(24, Math.floor(Number(e) * .2))), me = (e, t, n) => {
		let r = fe(e), i = pe(r.h), a = n === "output" ? e.outputs : e.inputs, o = Math.max(1, Array.isArray(a) ? a.length : Number(e[`${n}Count`]) || 0), s = xr(t, 0, Math.max(0, o - 1));
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
		let { x: t, y: n, w: a, h: o } = fe(e), s = e.kind === "node", c = e.kind === "group", l = !!e.bypassed, u = !!e.errored, f = c ? .18 : l && i.renderBypassState ? .14 : .62, p = c ? .55 : l && i.renderBypassState ? .32 : .8, m = d(e.fill, f), h = d(e.stroke, p), g = s && i.showNodeLabels && a >= vr && o >= yr, _ = Math.max(2, Math.min(g ? 7 : 8, Math.floor(Math.min(a, o) * .08))), v = s ? pe(o) : 0;
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
				r.fillStyle = Sr(e.inputs?.[i]?.type, !1), r.beginPath(), r.arc(t, n, g ? 3 : 2.2, 0, Math.PI * 2), r.fill(), r.stroke();
			}
			for (let n = 0; n < i; n += 1) {
				let i = me(e, n, "output");
				r.fillStyle = Sr(e.outputs?.[n]?.type, !0), r.beginPath(), r.arc(t + a, i, g ? 3 : 2.2, 0, Math.PI * 2), r.fill(), r.stroke();
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
				s && r.fillText(Cr(r, s, i), t + 7, me(e, a, "input") + n * .35, i);
			}
			for (let o = 0; o < Math.min(8, e.outputs?.length || 0); o += 1) {
				let s = e.outputs[o], c = String(s?.label || s?.localized_name || s?.name || "").trim();
				if (!c) continue;
				let l = Cr(r, c, i);
				r.fillText(l, t + a - 7 - Math.min(i, r.measureText(l).width), me(e, o, "output") + n * .35, i);
			}
			r.restore();
		}
	};
	for (let e of m.filter((e) => e.kind === "group")) ve(e);
	_e();
	for (let e of m.filter((e) => e.kind === "node")) ve(e);
	if (i.showViewport) try {
		let e = Se();
		if (e) {
			let t = O(e.x0, e.y0), n = O(e.x1, e.y1), i = Math.min(t.x, n.x), a = Math.min(t.y, n.y), o = Math.abs(n.x - t.x), s = Math.abs(n.y - t.y);
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
			renderScale: D
		},
		canvasToWorld: de,
		worldToCanvas: O,
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
function Tr(e) {
	if (!e || typeof e != "object") return e;
	let t = Array.isArray(e.nodes) ? e.nodes.filter(Boolean) : [], n = Er(e);
	if (!t.length) return e;
	let r = [], i = Array.isArray(e.links) ? [...e.links] : [], a = [...Array.isArray(e.groups) ? e.groups : [], ...Array.isArray(e.extra?.groups) ? e.extra.groups : []];
	for (let e of t) {
		r.push(e);
		let t = Dr(e, n);
		if (!t || !Array.isArray(t.nodes) || !t.nodes.length) continue;
		let o = kr(e, Tr(t));
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
function Er(e) {
	let t = [
		...Array.isArray(e?.definitions?.subgraphs) ? e.definitions.subgraphs : [],
		...Array.isArray(e?.subgraphs) ? e.subgraphs : [],
		...Array.isArray(e?.rootGraph?.subgraphs) ? e.rootGraph.subgraphs : []
	], n = /* @__PURE__ */ new Map();
	for (let e of t) for (let t of Or(e)) t != null && n.set(String(t), e);
	return n;
}
function Dr(e, t) {
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
function Or(e) {
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
function kr(e, t) {
	let n = String(e?.id ?? e?.ID ?? ""), r = jr(e?.pos) || [0, 0], i = Mr(e?.size) || [260, 180], a = t.nodes.filter(Boolean), o = Ar(a), s = Math.min(22, Math.max(8, i[0] * .08)), c = Math.min(34, Math.max(18, i[1] * .18)), l = Math.min(18, Math.max(8, i[1] * .08)), u = Math.max(40, i[0] - s * 2), d = Math.max(34, i[1] - c - l), f = Math.min(1, u / o.width, d / o.height), p = r[0] + s + (u - o.width * f) / 2, m = r[1] + c + (d - o.height * f) / 2, h = a.map((r) => {
		let i = jr(r?.pos) || [o.minX, o.minY], a = Mr(r?.size) || [140, 60];
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
function Ar(e) {
	let t = Infinity, n = Infinity, r = -Infinity, i = -Infinity;
	for (let a of e) {
		let e = jr(a?.pos);
		if (!e) continue;
		let o = Mr(a?.size) || [140, 60];
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
function jr(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.x ?? e.left ?? null, n = e[1] ?? e[1] ?? e.y ?? e.top ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function Mr(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.w ?? e.width ?? null, n = e[1] ?? e[1] ?? e.h ?? e.height ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function Nr(e) {
	if (Array.isArray(e)) return !0;
	let t = String(e || "").trim().toUpperCase();
	return t === "INT" || t === "FLOAT" || t === "STRING" || t === "BOOLEAN" || t === "BOOL" || t === "COMBO" || t === "ENUM";
}
function Pr(e, t = null) {
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
var X = mt({
	open: !1,
	mode: "workflow",
	title: "",
	sourceAsset: null,
	workflow: null,
	items: [],
	resolve: null
});
function Fr({ title: e = "Select workflow", sourceAsset: t = null } = {}) {
	return Lr(null), X.open = !0, X.mode = "workflow", X.title = String(e || "Select workflow"), X.sourceAsset = t || null, X.workflow = null, X.items = [], new Promise((e) => {
		X.resolve = e;
	});
}
function Ir({ title: e = "Select asset", workflow: t = null, items: n = [] } = {}) {
	return Lr(null), X.open = !0, X.mode = "asset", X.title = String(e || "Select asset"), X.sourceAsset = null, X.workflow = t || null, X.items = Array.isArray(n) ? n.filter(Boolean) : [], new Promise((e) => {
		X.resolve = e;
	});
}
function Lr(e = null) {
	let t = X.resolve;
	if (X.open = !1, X.mode = "workflow", X.title = "", X.sourceAsset = null, X.workflow = null, X.items = [], X.resolve = null, typeof t == "function") try {
		t(e || null);
	} catch (e) {
		console.debug?.(e);
	}
}
//#endregion
//#region ui/vue/majoorPrimeVue.ts
var Rr = {
	Button: $e,
	Checkbox: Qe,
	InputText: ht,
	Textarea: it,
	Select: ft,
	ToggleButton: ct,
	Badge: lt,
	Tag: Ye,
	Dialog: nt,
	Menu: dt,
	Listbox: st,
	Tree: pt,
	VirtualScroller: Ze
};
function zr(e) {
	return e.use(et, {
		ripple: !1,
		unstyled: !0,
		zIndex: { overlay: 10100 }
	}), e.use(tt), e.use(ot), Object.entries(Rr).forEach(([t, n]) => {
		e.component(`M${t}`, n);
	}), e;
}
//#endregion
//#region ui/vue/createVueApp.ts
function Br(e, t = void 0) {
	let n = _t(), r = Je(e, t);
	return r.use(n), zr(r), {
		app: r,
		pinia: n
	};
}
var Vr = /* @__PURE__ */ new Map();
function Hr(e, t, n) {
	try {
		window.dispatchEvent(new CustomEvent("mjr:keepalive-attached", { detail: {
			mountKey: String(e || "_mjrVueApp"),
			host: t || null,
			container: n || null
		} }));
	} catch {}
}
function Ur(e) {
	let t = document.createElement("div");
	return t.dataset.mjrKeepAliveHost = String(e || "_mjrVueApp"), t.style.height = "100%", t.style.width = "100%", t.style.minHeight = "0", t.style.display = "flex", t.style.flexDirection = "column", t.style.overflow = "hidden", t;
}
function Wr(e, t) {
	!e || !t || (e.style.height = "100%", e.style.minHeight = "0", e.style.display = "flex", e.style.flexDirection = "column", e.style.overflow = "hidden", !(e.firstChild === t && e.childNodes.length === 1) && (e.replaceChildren(t), Hr(t?.dataset?.mjrKeepAliveHost, t, e)));
}
function Gr(e, t, n = "_mjrVueApp") {
	if (!e) return !1;
	let r = Vr.get(n), i = !1;
	if (!r) {
		let e = Ur(n), { app: a } = Br(t);
		a.mount(e), r = {
			app: a,
			host: e,
			container: null
		}, Vr.set(n, r), i = !0;
	}
	return Wr(e, r.host), r.container = e, i;
}
function Kr(e, t = "_mjrVueApp") {
	let n = Vr.get(t);
	if (n?.app) {
		try {
			n.app.unmount();
		} catch {}
		try {
			n.host?.remove?.();
		} catch {}
		Vr.delete(t);
	}
}
//#endregion
//#region ui/utils/format.ts
function qr(e) {
	if (!e) return null;
	let t = Number(e);
	if (!isNaN(t)) return /* @__PURE__ */ new Date(t * 1e3);
	let n = new Date(e);
	return isNaN(n.getTime()) ? null : n;
}
function Jr(e) {
	let t = qr(e);
	return t ? `${t.getDate().toString().padStart(2, "0")}/${(t.getMonth() + 1).toString().padStart(2, "0")}` : "";
}
function Yr(e) {
	let t = qr(e);
	return t ? `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}` : "";
}
function Xr(e) {
	return e ? e < 60 ? `${Math.round(e)}s` : `${Math.floor(e / 60)}m ${Math.round(e % 60)}s` : "";
}
var Zr = {
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
function Qr() {
	let e = {};
	for (let t of Zr.sections) {
		e[t.key] = t.searchField, e[t.searchField] = t.searchField;
		for (let n of t.aliases || []) e[String(n).toLowerCase()] = t.searchField;
	}
	return e;
}
function $r(e) {
	let t = String(e || "").trim().toLowerCase();
	return Qr()[t] || "";
}
function ei(e) {
	let t = String(e || "").trim().toLowerCase();
	return t && Zr.sections.find((e) => e.key === t) || null;
}
//#endregion
//#region ui/vue/components/panel/sidebar/SidebarFileInfoSection.vue
var ti = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "rgba(255, 255, 255, 0.03)",
		border: "1px solid var(--mjr-border, rgba(255, 255, 255, 0.12))",
		"border-radius": "8px",
		padding: "10px"
	}
}, ni = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "6px"
} }, ri = ["title"], ii = ["title"], ai = {
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
		let a = L(() => {
			let e = t.asset || {}, a = [];
			if (e.width && e.height && a.push({
				label: "Dimensions",
				value: `${e.width} x ${e.height}`,
				tooltip: "Image/video resolution in pixels"
			}), e.duration && e.duration > 0 && a.push({
				label: "Duration",
				value: Xr(e.duration),
				tooltip: "Video duration"
			}), r(e)) {
				let t = Le(e);
				t != null && a.push({
					label: "FPS",
					value: Re(t),
					tooltip: "Native frame rate"
				});
				let n = Pe(e, t);
				n != null && a.push({
					label: "Length",
					value: `${Math.max(0, Math.floor(n))} frames`,
					tooltip: "Total frame count"
				});
			}
			let o = Fe(e.generation_time_ms ?? e.metadata?.generation_time_ms ?? 0);
			o > 0 && a.push({
				label: "Generation Time",
				value: `${(Number(o) / 1e3).toFixed(1)}s`,
				tooltip: "Time taken to generate this asset (workflow execution time)",
				valueStyle: `color: ${Ie(o)}; font-weight: 600;`
			});
			let s = e.generation_time || e.file_creation_time || e.mtime || e.created_at;
			if (s) {
				let e = Jr(s), t = Yr(s);
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
		return (e, t) => a.value.length ? (M(), B("div", ti, [t[0] ||= P("div", { style: {
			"font-size": "12px",
			"font-weight": "700",
			color: "#607d8b",
			"margin-bottom": "8px",
			"text-transform": "uppercase",
			"letter-spacing": "0.4px"
		} }, " File Info ", -1), P("div", ni, [(M(!0), B(N, null, F(a.value, (e) => (M(), B("div", {
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
		}, z(e.label), 9, ri), P("div", {
			style: H(e.valueStyle || "font-size: 12px; text-align: right; word-break: break-word"),
			title: String(e.value || "")
		}, z(e.value), 13, ii)]))), 128))])])) : I("", !0);
	}
}, oi = new Set([
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
function si(e) {
	let t = String(e?.filename || e?.name || e?.filepath || e?.path || "").trim().toLowerCase();
	return !t || !t.includes(".") ? "" : t.split(".").pop() || "";
}
function ci(e) {
	return String(e?.kind || "").trim().toLowerCase() === "image" || String(e?.mime || e?.mimetype || "").trim().toLowerCase().startsWith("image/") ? !0 : oi.has(si(e));
}
function li(e) {
	let t = si(e);
	return t === "jpg" || t === "jpeg";
}
function ui() {
	try {
		return !!(Nt()?.ai?.vectorSearchEnabled ?? !0);
	} catch {
		return !0;
	}
}
function di(e) {
	return e >= .75 ? "#4CAF50" : e >= .5 ? "#8BC34A" : e >= .3 ? "#FF9800" : "#F44336";
}
function fi(e) {
	return e >= .85 ? "Excellent" : e >= .7 ? "Good" : e >= .5 ? "Fair" : e >= .3 ? "Low" : "Very Low";
}
function pi(e) {
	let t = String(e || "").trim();
	if (!t) return "";
	let n = [];
	for (let e of t.replace(/\r\n/g, "\n").split("\n")) {
		let t = String(e || "").trim();
		t && (/^title\s*:/i.test(t) || (/^caption\s*:/i.test(t) && (t = t.replace(/^caption\s*:/i, "").trim()), t && n.push(t)));
	}
	return (n.length ? n.join(" ") : t).replace(/\s+/g, " ").replace(/:{2,}\s*$/, "").trim();
}
function mi(e) {
	let t = String(e?.filename || "").trim();
	if (!t) return [];
	let n = String(e?.subfolder || "").trim(), r = String(e?.folder_type || "input").trim().toLowerCase(), i = [], a = (e) => {
		if (!e) return;
		let r = ke(t, n, e);
		r && !i.includes(r) && i.push(r);
	};
	return (r === "input" || r === "output") && a(r), a("input"), a("output"), i;
}
function hi(e) {
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
function gi(e, t) {
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
function _i(e) {
	let t = [];
	return e?.metadata_raw && t.push(e.metadata_raw), e?.workflow && t.push(e.workflow), e?.metadata_raw?.workflow && t.push(e.metadata_raw.workflow), e?.metadata_raw?.raw_ffprobe?.format?.tags && t.push(e.metadata_raw.raw_ffprobe.format.tags), e?.metadata_raw?.ffprobe?.format?.tags && t.push(e.metadata_raw.ffprobe.format.tags), e?.geninfo && typeof e.geninfo == "object" && t.push({ geninfo: e.geninfo }), e?.metadata && (typeof e.metadata == "object" || typeof e.metadata == "string") && t.push(e.metadata), e?.prompt && (typeof e.prompt == "object" || typeof e.prompt == "string") && t.push(e.prompt), e?.exif && t.push(e.exif), e && typeof e == "object" && t.push(e), t;
}
function vi(e, t) {
	for (let [n, r] of Object.entries(t)) r == null || r === "" || (e[n] === void 0 || e[n] === null || e[n] === "") && (e[n] = r);
}
function yi(e) {
	let t = _i(e), n = {};
	for (let e of t) {
		let t = yt(e);
		!t || typeof t != "object" || vi(n, t);
	}
	return Object.keys(n).length ? n : null;
}
function bi(e) {
	try {
		if (!e || typeof e != "object") return !1;
		if (e.is_override || typeof e.workflow_notes == "string" && e.workflow_notes.trim() || typeof e.notes == "string" && e.notes.trim() || Array.isArray(e.custom_info) && e.custom_info.length > 0 || e.engine && typeof e.engine == "object" && e.engine.type || xt(e.prompt) || typeof (e.negative_prompt || e.negativePrompt) == "string" && xt(e.negative_prompt || e.negativePrompt) || e.models || e.model || e.checkpoint || e.loras || e.ltx_director && typeof e.ltx_director == "object" || e.ideogram && typeof e.ideogram == "object" || e.sampler || e.sampler_name || e.steps || e.cfg || e.cfg_scale || e.cfg_high_noise || e.cfg_low_noise || e.scheduler || Array.isArray(e.chained_passes) && e.chained_passes.length > 0 || Array.isArray(e.all_samplers) && e.all_samplers.length > 0 || e.seed || e.denoise || e.denoising || e.clip_skip || e.voice || e.language || e.temperature || e.top_k || e.top_p || e.repetition_penalty || e.max_new_tokens || e.device || e.voice_preset || e.instruct || e.dtype || e.attn_implementation || e.enable_chunking !== void 0 || e.max_chars_per_chunk || e.chunk_combination_method || e.silence_between_chunks_ms || e.enable_audio_cache !== void 0 || e.batch_size !== void 0 || e.use_torch_compile !== void 0 || e.use_cuda_graphs !== void 0 || e.compile_mode || typeof e.lyrics == "string" && e.lyrics.trim()) return !0;
	} catch {
		return !1;
	}
	return !1;
}
function Q(e) {
	return e ? typeof e == "string" ? St(e) : typeof e == "object" ? St(e.name || e.value || "") : "" : "";
}
function xi(e, t, n, r) {
	let i = String(r || "").trim();
	if (!i) return;
	let a = `${n}::${i}`;
	t.has(a) || (t.add(a), e.push({
		label: n,
		value: i
	}));
}
function Si(e) {
	let t = `${String(e?.source || "").toLowerCase()} ${String(e?.name || e?.lora_name || "").toLowerCase()}`;
	return t.includes("high_noise") || t.includes("high noise") ? "high_noise" : t.includes("low_noise") || t.includes("low noise") ? "low_noise" : "";
}
function Ci(e) {
	let t = [], n = Array.isArray(e.model_groups) ? e.model_groups : [];
	if (n.length) return n.forEach((e) => {
		if (!e || typeof e != "object") return;
		let n = Q(e.model), r = Array.isArray(e.loras) ? e.loras.map((e) => bt(e)).filter(Boolean) : [];
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
		model: Q(r.unet_high_noise)
	}, {
		key: "low_noise",
		label: k("sidebar.generation.lowNoise", "Low Noise"),
		model: Q(r.unet_low_noise)
	}].forEach((e) => {
		let n = i.filter((t) => Si(t) === e.key).map((e) => bt(e)).filter(Boolean);
		!e.model && !n.length || t.push({
			...e,
			loras: n
		});
	}), t;
}
function wi(e, t) {
	return t == null ? null : {
		label: e,
		value: t ? k("state.on", "on") : k("state.off", "off")
	};
}
function $(e) {
	return e != null && String(e).trim() !== "";
}
function Ti(e) {
	let t = String(e || "").toLowerCase();
	return t.includes("high") ? "#52ffe8" : t.includes("low") ? "#42A5F5" : t.includes("refine") ? "#AB47BC" : t.includes("upscale") ? "#66BB6A" : t.includes("interpolation") || t.includes("video") ? "#dace26" : "#9C27B0";
}
function Ei(e) {
	return String(e || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function Di(e, t) {
	let n = String(t || e || "").trim(), r = String(e || n).toLowerCase(), i = r.match(/^pass_(\d+)$/);
	return i ? k("sidebar.generation.stagePassN", "Pass {n}", { n: Number(i[1]) }) : r.includes("high") ? "High" : r.includes("low") ? "Low" : r.includes("refine") ? "Refiner" : r.includes("upscale") ? "Upscale" : r.includes("text_to_image") || r.includes("image_to_image") || r === "base" ? "Base" : n || "Branch";
}
function Oi(e, t) {
	let n = new Set(t.map((e) => String(e).toLowerCase()));
	return e.find((e) => n.has(String(e.label || "").toLowerCase())) || null;
}
function ki(e, t) {
	return $(t) ? {
		label: e,
		value: t
	} : null;
}
function Ai(e) {
	let t = String(e || "").toLowerCase();
	return t.includes("high_noise") || t.includes("high-noise") || t.includes("high noise") ? "high" : t.includes("low_noise") || t.includes("low-noise") || t.includes("low noise") ? "low" : "";
}
function ji(e) {
	return Array.isArray(e) || e && typeof e == "object" ? !1 : $(e) && String(e).trim() !== "-";
}
function Mi(e) {
	return typeof e == "number" ? Math.abs(e - Math.round(e)) < 1e-9 ? String(Math.round(e)) : e.toFixed(2).replace(/0+$/g, "").replace(/\.$/, "") : String(e ?? "").trim();
}
function Ni(e) {
	if (!$(e)) return null;
	let t = Number(e);
	return !Number.isFinite(t) || t <= 0 ? null : e;
}
function Pi(e, t) {
	let n = Ni(e.seed);
	if (n !== null) return n;
	let r = [Array.isArray(e.chained_passes) ? e.chained_passes : [], Array.isArray(e.all_samplers) ? e.all_samplers : []];
	for (let e of r) for (let t of e) {
		let e = Ni(t?.seed_val ?? t?.seed);
		if (e !== null) return e;
	}
	for (let e of t || []) {
		let t = Ni(Oi(e.fields || [], ["Seed"])?.value);
		if (t !== null) return t;
	}
	return null;
}
function Fi(e, t) {
	if (!t || !ji(t.value)) return;
	let n = `${String(t.label || "").toLowerCase()}::${Mi(t.value)}`;
	e.some((e) => `${String(e.label || "").toLowerCase()}::${Mi(e.value)}` === n) || e.push({
		...t,
		value: Mi(t.value)
	});
}
function Ii(e, t, n, r) {
	let i = /* @__PURE__ */ new Map(), a = (e, t) => {
		let n = Ei(e || t || "branch") || "branch";
		n.includes("high") && (n = "high"), n.includes("low") && (n = "low");
		let r = i.get(n);
		if (r) return r;
		let a = {
			key: n,
			label: Di(n, t),
			accent: Ti(n),
			modelFields: [],
			samplingFields: [],
			loras: []
		};
		return i.set(n, a), a;
	}, o = (e, t, n) => {
		let r = String(n || "").trim();
		r && (e.modelFields.some((e) => String(e.label || "").toLowerCase() === String(t || "").toLowerCase() && St(e.value) === St(r)) || e.modelFields.push({
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
		let t = Q(c.unet), n = Ai(t), r = Q(c.checkpoint || (n ? null : c.unet) || e.model || e.checkpoint), i = Q(c.unet_high_noise) || (n === "high" ? t : ""), l = Q(c.unet_low_noise) || (n === "low" ? t : ""), u = Q(c.clip), d = Q(c.vae), f = Array.isArray(e.loras) ? e.loras.map((e) => bt(e)).filter(Boolean) : [], p = !!(i || l), m = !p && (r || u || d || f.length) ? a("base", "Base") : null, h = p && (u || d) ? a("shared", "Shared") : null, g = i ? a("high", "High") : null, _ = l ? a("low", "Low") : null;
		if (m) {
			r && o(m, e.model || e.checkpoint || c.checkpoint ? "Model" : "UNet", r), u && o(m, "CLIP", u), d && o(m, "VAE", d);
			for (let e of f) s(m, e);
		}
		h && (u && o(h, "CLIP", u), d && o(h, "VAE", d)), g && o(g, "UNet", i), _ && o(_, "UNet", l);
	}
	let l = i.get("high") || i.get("high_noise"), u = i.get("low") || i.get("low_noise"), d = [
		Oi(n, ["Sampler"]),
		Oi(n, ["Scheduler"]),
		Oi(n, ["Steps"]),
		Oi(n, ["Seed"])
	].filter(Boolean), f = ki("CFG", e.cfg_high_noise), p = ki("CFG", e.cfg_low_noise);
	l && [...d, ...f ? [f] : []].forEach((e) => Fi(l.samplingFields, e)), u && [...d, ...p ? [p] : []].forEach((e) => Fi(u.samplingFields, e));
	let m = (r || []).some((e) => Ei(e.label).includes("upscale")), h = (r || []).length === 2 && (r || []).every((e) => ["base", "pass_2"].includes(Ei(e.label)));
	for (let [e, t] of (r || []).entries()) {
		let n = Ei(t.label);
		if (!n) continue;
		let i = (r || []).filter((e) => Ei(e.label) === Ei(t.label)).length, o = Ei(t.stage), s = o ? (r || []).filter((e) => Ei(e.stage) === o).length : 0, c = Oi(t.fields || [], ["Model"]), d = Ai(c?.value);
		["high", "low"].includes(n) || (d ? n = d : s > 1 || i > 1 ? n = `pass_${e + 1}` : h ? n = e === 0 ? "high" : "low" : n === "base" && l && u ? n = "high" : ["text_to_image", "image_to_image"].includes(n) && (n = m ? "low" : "base")), n.includes("upscale") && m && (n = "high");
		let f = a(n, t.label);
		if (!/^pass_\d+$/i.test(n) && c && String(c.value || "") !== "-") {
			let e = St(c.value);
			f.modelFields.some((t) => St(t.value) === e) || f.modelFields.push(c);
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
		].includes(String(e.label || "")) && Fi(f.samplingFields, e);
	}
	return Array.from(i.values()).filter((e) => e.modelFields.length || e.samplingFields.length || e.loras.length);
}
function Li(e, t, n, r) {
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
		let t = Ei(n.label), r = (n.fields || []).some((e) => {
			let t = String(e?.label || "").toLowerCase(), n = String(e?.value || "").toLowerCase();
			return t.includes("upscaler") || n.includes("upscale") || n.includes("upscaler") || /(?:^|[_\s-])to[_\s-]?\d{3,5}(?:[_\s.-]|$)/i.test(n);
		});
		t.includes("upscale") && (e.upscaler || r) && a("upscale", "Upscale", "#66BB6A", n.fields || []), (t.includes("interpolation") || t.includes("rife") || t.includes("film")) && a("interpolation", "Interpolation", "#26C6DA", n.fields || []);
	}
	a("audio", "MMAudio", "#26A69A", [
		ki("Voice", e.voice),
		ki("Language", e.language),
		ki("Temperature", e.temperature),
		ki("Lyrics Strength", e.lyrics_strength)
	].filter(Boolean)), a("interpolation", "Interpolation", "#26C6DA", [
		ki("Engine", e.interpolation_engine || e.frame_interpolation || e.interpolator),
		ki("Source FPS", e.source_fps || e.input_fps),
		ki("Final FPS", e.final_fps || e.output_fps || e.fps)
	].filter(Boolean));
	for (let e of n || []) i.push({
		key: Ei(e.title) || `module_${i.length}`,
		title: e.title,
		accent: e.color || "#2196F3",
		fields: [{
			label: "Info",
			value: e.content
		}]
	});
	r && !i.some((e) => String(e.title).toLowerCase() === String(r).toLowerCase()) && a("workflow_engine", r, "#2196F3", [ki("Engine", r)].filter(Boolean));
	let o = /* @__PURE__ */ new Set();
	return i.filter((e) => {
		let t = `${e.key}:${e.title}:${JSON.stringify(e.fields)}`;
		return o.has(t) ? !1 : (o.add(t), !0);
	});
}
function Ri(e) {
	return new Set(Array.isArray(e.override_fields) ? e.override_fields.map((e) => String(e || "").trim()).filter(Boolean) : []);
}
function zi(e, ...t) {
	return t.some((t) => e.has(t));
}
function Bi(e) {
	return Array.isArray(e) ? e.filter((e) => e && typeof e == "object").map((e, t) => ({
		title: String(e.title || k("sidebar.generation.customInfoN", "Custom Info {n}", { n: t + 1 })).trim(),
		content: String(e.content ?? e.value ?? "").trim(),
		color: /^#[0-9a-fA-F]{6}$/.test(String(e.color || "").trim()) ? String(e.color).trim() : "#2196F3"
	})).filter((e) => e.content) : [];
}
function Vi(e) {
	if (!e || typeof e != "object") return null;
	let t = [], n = (e, n) => {
		$(n) && t.push({
			label: e,
			value: Mi(n)
		});
	};
	n("FPS", e.frame_rate), n("Frames", e.duration_frames), n("Duration", e.duration_seconds), ($(e.width) || $(e.height)) && t.push({
		label: "Size",
		value: `${e.width || "?"} x ${e.height || "?"}`
	});
	let r = Array.isArray(e.segments) ? e.segments.map((e, t) => {
		if (!e || typeof e != "object") return null;
		let n = xt(e.prompt || e.text || ""), r = String(e.filename || e.imageFile || e.videoFile || e.audioFile || "").trim(), i = String(e.filepath || e.path || r).trim(), a = String(e.in || e.in_label || e.start || e.start_frame || "").trim(), o = String(e.out || e.out_label || e.end || e.end_frame || "").trim();
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
			previewCandidates: r ? mi({
				filename: r,
				filepath: i,
				folder_type: String(e.folder_type || e.folderType || "input").trim(),
				subfolder: String(e.subfolder || "").trim()
			}) : []
		};
	}).filter(Boolean) : [], i = xt(e.global_prompt || e.globalPrompt || "");
	return !i && !r.length && !t.length ? null : {
		title: String(e.title || "LTX Director").trim(),
		globalPrompt: i,
		fields: t,
		segments: r
	};
}
function Hi(e) {
	if (!e || typeof e != "object") return null;
	let t = e.payload && typeof e.payload == "object" ? e.payload : e, n = typeof e.json == "string" && e.json.trim() ? e.json.trim() : JSON.stringify(t, null, 2), r = xt(e.high_level_description || e.highLevelDescription || t.high_level_description || ""), i = xt(e.background || t.background || ""), a = [], o = (e, t) => {
		$(t) && a.push({
			label: e,
			value: Mi(t)
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
function Ui(e) {
	let t = yi(e), n = {
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
		isImageAsset: ci(e),
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
	if (!t || typeof t == "object" && Object.keys(t).length === 0 || !bi(t)) {
		let t = e?.metadata_raw?.geninfo_status || e?.geninfo_status;
		return t && typeof t == "object" && t.kind === "media_pipeline" ? {
			...n,
			kind: "media-only",
			mediaOnlyMessage: k("sidebar.generation.mediaOnlyPipeline", "This file looks like a media-only pipeline (e.g. LoadVideo/VideoCombine) and does not contain generation parameters.")
		} : ci(e) || li(e) ? {
			...n,
			kind: "caption-only",
			showAlignment: !1
		} : n;
	}
	let r = t, i = Vi(r.ltx_director), a = Hi(r.ideogram), o = Ri(r), s = r.engine && typeof r.engine == "object" ? r.engine : null, c = !!(r.is_override || s?.mode === "override" || s?.parser_version === "geninfo-override-v1" || s?.source === "majoor_geninfo"), l = Ct(r), u = vt(typeof r.prompt == "string" ? r.prompt : null, typeof (r.negative_prompt || r.negativePrompt) == "string" ? r.negative_prompt || r.negativePrompt : null), d = Array.isArray(r.all_positive_prompts) && r.all_positive_prompts.length > 1 ? r.all_positive_prompts.map((e, t) => {
		let n = vt(typeof e == "string" ? e : "", typeof r.all_negative_prompts?.[t] == "string" ? r.all_negative_prompts[t] : "");
		return {
			label: k("sidebar.generation.promptN", "Prompt {n}", { n: t + 1 }),
			positive: xt(n.positive),
			negative: xt(n.negative)
		};
	}).filter((e) => e.positive) : [], f = [], p = /* @__PURE__ */ new Set(), m = r.models && typeof r.models == "object" ? r.models : null, h = Ci(r), g = new Set(h.map((e) => String(e.model || "").trim()).filter(Boolean)), _ = Array.isArray(r.all_checkpoints) && r.all_checkpoints.length > 1 ? r.all_checkpoints : null;
	if (m) {
		let e = new Set([
			Q(m.unet_high_noise),
			Q(m.unet_low_noise),
			...g
		].filter(Boolean));
		if (_) _.forEach((e, t) => {
			let n = Q(e);
			xi(f, p, k("sidebar.generation.checkpointN", "Checkpoint {n}", { n: t + 1 }), n);
		});
		else {
			let t = Q(m.checkpoint);
			t && !e.has(t) && xi(f, p, k("sidebar.generation.checkpoint", "Checkpoint"), t);
		}
		[
			["UNet", Q(m.unet)],
			["Diffusion", Q(m.diffusion)],
			[k("sidebar.generation.upscaler", "Upscaler"), Q(m.upscaler)],
			["CLIP", Q(m.clip)],
			["VAE", Q(m.vae)]
		].forEach(([t, n]) => {
			e.has(n) || xi(f, p, t, n);
		});
	} else (r.model || r.checkpoint) && xi(f, p, k("sidebar.generation.model", "Model"), St(r.model || r.checkpoint));
	if (Array.isArray(r.loras) && r.loras.length > 0) {
		let e = r.loras.map((e) => bt(e)).filter(Boolean).join("\n");
		e && xi(f, p, r.loras.length > 1 ? k("sidebar.generation.loras", "LoRAs") : "LoRA", e);
	}
	!m && r.clip && xi(f, p, "CLIP", St(r.clip)), !m && r.vae && xi(f, p, "VAE", St(r.vae)), !m && r.unet && xi(f, p, "UNet", St(r.unet)), !m && r.diffusion && xi(f, p, "Diffusion", St(r.diffusion)), !m && r.upscaler && xi(f, p, k("sidebar.generation.upscaler", "Upscaler"), St(r.upscaler)), m && r.clip && xi(f, p, "CLIP", St(r.clip)), m && r.vae && xi(f, p, "VAE", St(r.vae));
	for (let e of f) {
		let t = String(e.label || "").toLowerCase();
		(t.includes("checkpoint") || t === "model") && (e.override = zi(o, "checkpoint", "model")), t === "clip" && (e.override = zi(o, "clip")), t === "vae" && (e.override = zi(o, "vae")), t.includes("lora") && (e.override = zi(o, "loras"));
	}
	let v = [];
	$(r.seed) && v.push({
		label: k("sidebar.generation.seed", "Seed"),
		value: r.seed,
		override: zi(o, "seed")
	}), (r.sampler || r.sampler_name) && v.push({
		label: k("sidebar.generation.sampler", "Sampler"),
		value: r.sampler || r.sampler_name,
		override: zi(o, "sampler", "sampler_name")
	}), $(r.steps) && v.push({
		label: k("sidebar.generation.steps", "Steps"),
		value: r.steps,
		override: zi(o, "steps")
	});
	let y = $(r.cfg) ? r.cfg : r.cfg_scale;
	$(y) && v.push({
		label: k("sidebar.generation.cfgScale", "CFG Scale"),
		value: y,
		override: zi(o, "cfg", "cfg_scale")
	}), r.cfg_high_noise !== void 0 && r.cfg_high_noise !== null && v.push({
		label: k("sidebar.generation.cfgHighNoise", "CFG High Noise"),
		value: r.cfg_high_noise
	}), r.cfg_low_noise !== void 0 && r.cfg_low_noise !== null && v.push({
		label: k("sidebar.generation.cfgLowNoise", "CFG Low Noise"),
		value: r.cfg_low_noise
	}), r.scheduler && v.push({
		label: k("sidebar.generation.scheduler", "Scheduler"),
		value: r.scheduler,
		override: zi(o, "scheduler")
	});
	let b = $(r.denoise) ? r.denoise : r.denoising;
	$(b) && v.push({
		label: k("sidebar.generation.denoise", "Denoise"),
		value: b,
		override: zi(o, "denoise", "denoising")
	});
	let x = [];
	Array.isArray(r.chained_passes) && r.chained_passes.length > 1 ? x = r.chained_passes.filter((e) => e && typeof e == "object").map((e, t) => ({
		label: gi(e, t),
		stage: String(e?.pass_stage || "").trim(),
		fields: [
			{
				label: k("sidebar.generation.model", "Model"),
				value: Z(e?.model)
			},
			{
				label: k("sidebar.generation.sampler", "Sampler"),
				value: Z(e?.sampler_name || e?.sampler)
			},
			{
				label: k("sidebar.generation.scheduler", "Scheduler"),
				value: Z(e?.scheduler)
			},
			{
				label: k("sidebar.generation.steps", "Steps"),
				value: Z(e?.steps)
			},
			{
				label: "CFG",
				value: Z(e?.cfg)
			},
			{
				label: k("sidebar.generation.denoise", "Denoise"),
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
				label: k("sidebar.generation.seed", "Seed"),
				value: Z(e?.seed_val ?? e?.seed)
			}
		]
	})) : Array.isArray(r.all_samplers) && r.all_samplers.length > 1 && (x = r.all_samplers.filter((e) => e && typeof e == "object").map((e, t) => ({
		label: gi(e, t),
		stage: String(e?.pass_stage || "").trim(),
		fields: [
			{
				label: k("sidebar.generation.model", "Model"),
				value: Z(e?.model)
			},
			{
				label: k("sidebar.generation.sampler", "Sampler"),
				value: Z(e?.sampler_name || e?.sampler)
			},
			{
				label: k("sidebar.generation.scheduler", "Scheduler"),
				value: Z(e?.scheduler)
			},
			{
				label: k("sidebar.generation.steps", "Steps"),
				value: Z(e?.steps)
			},
			{
				label: "CFG",
				value: Z(e?.cfg)
			},
			{
				label: k("sidebar.generation.denoise", "Denoise"),
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
				label: k("sidebar.generation.seed", "Seed"),
				value: Z(e?.seed_val ?? e?.seed)
			}
		]
	})));
	let S = [];
	r.voice && S.push({
		label: k("sidebar.generation.narratorVoice", "Narrator Voice"),
		value: r.voice
	}), r.language && S.push({
		label: k("sidebar.generation.language", "Language"),
		value: r.language
	}), r.top_k !== void 0 && r.top_k !== null && S.push({
		label: "Top-k",
		value: r.top_k
	}), r.top_p !== void 0 && r.top_p !== null && S.push({
		label: "Top-p",
		value: r.top_p
	}), r.temperature !== void 0 && r.temperature !== null && S.push({
		label: k("sidebar.generation.temperature", "Temperature"),
		value: r.temperature
	}), r.repetition_penalty !== void 0 && r.repetition_penalty !== null && S.push({
		label: k("sidebar.generation.repetitionPenalty", "Repetition Penalty"),
		value: r.repetition_penalty
	}), r.max_new_tokens !== void 0 && r.max_new_tokens !== null && S.push({
		label: k("sidebar.generation.maxNewTokens", "Max New Tokens"),
		value: r.max_new_tokens
	});
	let C = [];
	r.device && C.push({
		label: k("sidebar.generation.device", "Device"),
		value: r.device
	}), r.voice_preset && C.push({
		label: k("sidebar.generation.voicePreset", "Voice Preset"),
		value: r.voice_preset
	}), r.dtype && C.push({
		label: k("sidebar.generation.dtype", "Dtype"),
		value: r.dtype
	}), r.attn_implementation && C.push({
		label: k("sidebar.generation.attention", "Attention"),
		value: r.attn_implementation
	}), r.compile_mode && C.push({
		label: k("sidebar.generation.compileMode", "Compile Mode"),
		value: r.compile_mode
	}), [
		wi(k("sidebar.generation.torchCompile", "Torch Compile"), r.use_torch_compile),
		wi(k("sidebar.generation.cudaGraphs", "CUDA Graphs"), r.use_cuda_graphs),
		wi(k("sidebar.generation.xVectorOnly", "X-Vector Only"), r.x_vector_only_mode)
	].filter(Boolean).forEach((e) => C.push(e));
	let ee = [];
	[
		wi(k("sidebar.generation.chunking", "Chunking"), r.enable_chunking),
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
		wi(k("sidebar.generation.audioCache", "Audio Cache"), r.enable_audio_cache),
		r.batch_size !== void 0 && r.batch_size !== null ? {
			label: k("sidebar.generation.batchSize", "Batch Size"),
			value: r.batch_size
		} : null
	].filter(Boolean).forEach((e) => ee.push(e));
	let te = [];
	r.lyrics_strength !== void 0 && r.lyrics_strength !== null && te.push({
		label: k("sidebar.generation.lyricsStrength", "Lyrics Strength"),
		value: r.lyrics_strength
	});
	let w = [];
	$(b) && !v.some((e) => e.label === "Denoise") && w.push({
		label: k("sidebar.generation.denoise", "Denoise"),
		value: b
	}), $(r.clip_skip) && w.push({
		label: k("sidebar.generation.clipSkip", "Clip Skip"),
		value: r.clip_skip
	});
	let T = [], ne = String(r.workflow_notes || r.notes || "").trim();
	ne && T.push({
		label: k("sidebar.generation.workflowNotes", "Workflow Notes"),
		value: ne,
		override: zi(o, "workflow_notes", "notes")
	});
	let re = Bi(r.custom_info), E = Ii(r, h, v, x), ie = Li(r, x, re, l.workflowType), ae = Pi(r, x), oe = Array.isArray(r.inputs) ? r.inputs.filter((e) => e && typeof e == "object" && e.filename).map((e, t) => ({
		id: `${e.filename}-${t}`,
		filename: String(e.filename || "").trim(),
		filepath: String(e.filepath || e.filename || "").trim(),
		role: String(e.role || "").trim(),
		roleLabel: String(e.role || "").trim().replace(/_/g, " "),
		isVideo: String(e.type || "").toLowerCase() === "video" || /\.(mp4|mov|webm)$/i.test(String(e.filename || "")),
		previewCandidates: mi(e)
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
		positivePromptOverride: zi(o, "prompt", "positive", "positive_prompt"),
		negativePromptOverride: zi(o, "negative_prompt", "negative", "negativePrompt"),
		promptTabs: d,
		showAlignment: !!e?.id && (!!String(u.positive || "").trim() || d.length > 0),
		isImageAsset: ci(e),
		lyrics: String(r.lyrics || "").trim(),
		modelFields: f,
		modelGroups: h,
		branchCards: E,
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
		moduleBlocks: ie,
		ltxDirector: i,
		ideogram: a
	};
}
//#endregion
//#region ui/vue/components/panel/sidebar/GenerationInputThumb.vue
var Wi = ["title"], Gi = ["src"], Ki = {
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
}, qi = { style: {
	"font-size": "8px",
	"font-weight": "700",
	"max-width": "54px",
	"white-space": "nowrap",
	overflow: "hidden",
	"text-overflow": "ellipsis"
} }, Ji = ["src"], Yi = {
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
}, Xi = {
	key: 4,
	title: "Video file",
	style: {
		position: "absolute",
		color: "white",
		opacity: "0.7",
		"font-size": "16px",
		"pointer-events": "none"
	}
}, Zi = {
	__name: "GenerationInputThumb",
	props: { inputFile: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = V(0), r = V(!1);
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
			if (hi(t)) try {
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
		function u() {
			return !!t.inputFile?.isAudio;
		}
		return (t, n) => (M(), B("div", {
			title: `${e.inputFile.filename} (click to copy, double-click to open in new tab)`,
			style: H({
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
		}, [e.inputFile.isVideo ? (M(), B("video", {
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
		}, null, 40, Gi)) : u() ? (M(), B("div", Ki, [n[0] ||= P("div", { style: {
			"font-size": "18px",
			"line-height": "1"
		} }, "♪", -1), P("div", qi, z(e.inputFile.filename), 1)])) : (M(), B("img", {
			key: 2,
			src: i(),
			style: {
				width: "100%",
				height: "100%",
				"object-fit": "cover"
			},
			onError: a
		}, null, 40, Ji)), e.inputFile.role && e.inputFile.role !== "secondary" ? (M(), B("div", Yi, z(e.inputFile.roleLabel), 1)) : e.inputFile.isVideo ? (M(), B("div", Xi, " Play ")) : I("", !0)], 44, Wi));
	}
}, Qi = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "12px"
	}
}, $i = {
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
}, ea = { style: { opacity: "0.85" } }, ta = { style: {
	display: "flex",
	"align-items": "center",
	gap: "8px",
	"flex-wrap": "wrap",
	"justify-content": "flex-end"
} }, na = ["title"], ra = ["title"], ia = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, aa = { style: {
	"font-size": "11px",
	"font-weight": "700",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.6px"
} }, oa = { style: {
	"font-size": "11px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"font-weight": "600"
} }, sa = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#FF9800",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, ca = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, la = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9E9E9E",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, ua = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, da = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "10px"
} }, fa = { style: {
	"font-size": "11px",
	"font-weight": "800",
	color: "#26C6DA",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px"
} }, pa = {
	key: 0,
	style: {
		display: "grid",
		"grid-template-columns": "repeat(auto-fit,minmax(92px,1fr))",
		gap: "8px",
		"margin-bottom": "10px"
	}
}, ma = { style: {
	"font-size": "9px",
	"font-weight": "800",
	color: "rgba(255,255,255,0.55)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, ha = { style: {
	"font-size": "12px",
	color: "var(--fg-color,#eee)",
	"font-weight": "650",
	"word-break": "break-word"
} }, ga = {
	key: 1,
	style: {
		border: "1px solid rgba(76,175,80,0.36)",
		"border-radius": "6px",
		background: "rgba(76,175,80,0.10)",
		padding: "10px",
		"margin-bottom": "10px"
	}
}, _a = ["title"], va = {
	key: 2,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "8px"
	}
}, ya = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "7px"
} }, ba = { style: {
	"font-size": "10px",
	"font-weight": "800",
	color: "#26C6DA",
	"text-transform": "uppercase",
	"letter-spacing": "0.45px"
} }, xa = { style: {
	display: "flex",
	"align-items": "center",
	gap: "5px",
	"flex-wrap": "wrap",
	"justify-content": "flex-end"
} }, Sa = {
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
}, Ca = {
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
}, wa = { style: {
	display: "flex",
	gap: "10px",
	"align-items": "flex-start",
	"min-width": "0"
} }, Ta = { style: {
	"min-width": "0",
	flex: "1"
} }, Ea = ["title", "onClick"], Da = {
	key: 1,
	style: {
		"font-size": "10px",
		color: "rgba(255,255,255,0.58)",
		"margin-top": "7px",
		display: "flex",
		gap: "6px",
		"flex-wrap": "wrap"
	}
}, Oa = { key: 0 }, ka = { key: 1 }, Aa = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "10px"
} }, ja = { style: {
	"font-size": "11px",
	"font-weight": "800",
	color: "#FFB300",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px"
} }, Ma = {
	key: 0,
	style: {
		display: "grid",
		"grid-template-columns": "repeat(auto-fit,minmax(100px,1fr))",
		gap: "8px",
		"margin-bottom": "10px"
	}
}, Na = { style: {
	"font-size": "9px",
	"font-weight": "800",
	color: "rgba(255,255,255,0.55)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Pa = { style: {
	"font-size": "12px",
	color: "var(--fg-color,#eee)",
	"font-weight": "650",
	"word-break": "break-word"
} }, Fa = {
	key: 1,
	style: {
		border: "1px solid rgba(76,175,80,0.34)",
		"border-radius": "6px",
		background: "rgba(76,175,80,0.09)",
		padding: "10px",
		"margin-bottom": "10px"
	}
}, Ia = ["title"], La = {
	key: 2,
	style: {
		border: "1px solid rgba(33,150,243,0.32)",
		"border-radius": "6px",
		background: "rgba(33,150,243,0.08)",
		padding: "10px",
		"margin-bottom": "10px"
	}
}, Ra = ["title"], za = {
	key: 3,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "8px",
		"margin-bottom": "10px"
	}
}, Ba = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "7px"
} }, Va = { style: {
	"font-size": "10px",
	"font-weight": "800",
	color: "#FFCA28",
	"text-transform": "uppercase",
	"letter-spacing": "0.45px"
} }, Ha = {
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
}, Ua = ["title", "onClick"], Wa = {
	key: 1,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "5px",
		"margin-top": "8px"
	}
}, Ga = ["title", "onClick"], Ka = { style: {
	border: "1px solid rgba(255,179,0,0.30)",
	"border-radius": "6px",
	background: "rgba(0,0,0,0.16)",
	overflow: "hidden"
} }, qa = ["title"], Ja = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Ya = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"margin-bottom": "10px"
} }, Xa = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "#4CAF50",
	"letter-spacing": "0.4px"
} }, Za = ["onClick"], Qa = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "#F44336",
	"letter-spacing": "0.4px",
	"margin-top": "4px"
} }, $a = ["onClick"], eo = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, to = ["title"], no = ["title"], ro = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#F44336",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, io = ["title"], ao = ["title"], oo = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between"
} }, so = ["title"], co = { style: {
	display: "flex",
	"align-items": "center",
	gap: "10px"
} }, lo = { style: {
	flex: "1",
	height: "8px",
	background: "rgba(255,255,255,0.1)",
	"border-radius": "4px",
	overflow: "hidden"
} }, uo = {
	key: 0,
	style: {
		"font-size": "10px",
		color: "rgba(255,255,255,0.65)",
		border: "1px dashed rgba(255,255,255,0.25)",
		"border-radius": "4px",
		padding: "6px 8px",
		background: "rgba(255,255,255,0.04)"
	}
}, fo = { style: {
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
} }, po = ["title"], mo = { style: {
	display: "flex",
	"align-items": "center",
	gap: "6px"
} }, ho = ["title"], go = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9C27B0",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, _o = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(190px, 1fr))",
	gap: "10px"
} }, vo = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.58)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, yo = ["onClick"], bo = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "5px"
	}
}, xo = ["onClick"], So = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Co = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, wo = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#FF9800",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, To = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(130px, 1fr))",
	gap: "8px"
} }, Eo = ["onClick"], Do = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9C27B0",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Oo = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(220px, 1fr))",
	gap: "10px"
} }, ko = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, Ao = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "4px"
} }, jo = ["onClick"], Mo = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "6px"
	}
}, No = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.58)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Po = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "5px"
} }, Fo = ["onClick"], Io = { style: {
	display: "grid",
	"grid-template-columns": "auto 1fr",
	gap: "8px 12px",
	"align-items": "start"
} }, Lo = ["title"], Ro = ["title"], zo = ["title", "onClick"], Bo = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Vo = ["title", "onClick"], Ho = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#26C6DA",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Uo = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(190px, 1fr))",
	gap: "10px"
} }, Wo = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.58)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Go = ["title", "onClick"], Ko = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#26A69A",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, qo = ["title"], Jo = { style: {
	"font-size": "11px",
	"font-weight": "700",
	color: "#E91E63",
	"text-transform": "uppercase",
	"letter-spacing": "1px"
} }, Yo = ["title"], Xo = ["title"], Zo = { style: {
	display: "flex",
	gap: "8px",
	"flex-wrap": "wrap"
} }, Qo = {
	__name: "SidebarGenerationSection",
	props: { asset: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, r = V(0), i = V(0), a = V(""), o = V(k("action.copy", "Copy")), s = V(k("action.generate", "Generate")), c = V(!1), l = V(d()), u = 0;
		function d() {
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
		let g = L(() => Ui(t.asset)), _ = L(() => ui()), v = L(() => g.value.kind === "full" || g.value.kind === "caption-only"), y = L(() => pi(a.value) || g.value.emptyCaptionText), b = L(() => _.value && g.value.isImageAsset && !!t.asset?.id), x = L(() => _.value && !!pi(y.value) && y.value !== g.value.emptyCaptionText), S = L(() => g.value.branchCards.filter((e) => e.modelFields.length || e.loras.length)), C = L(() => g.value.branchCards.filter((e) => e.samplingFields.length));
		L(() => g.value.branchCards.filter((e) => e.loras.length));
		let ee = L(() => {
			let e = [], t = (e, t) => ei(e)?.title || t;
			return !S.value.length && g.value.modelFields.length && e.push({
				key: "model",
				title: t("model", k("sidebar.generation.modelLora", "Model & LoRA")),
				accent: "#9C27B0",
				emphasis: !0,
				fields: g.value.modelFields
			}), !C.value.length && g.value.samplingFields.length && e.push({
				key: "sampling",
				title: t("sampler", k("sidebar.generation.sampling", "Sampling")),
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
				title: k("sidebar.generation.audio", "Audio"),
				accent: "#00BCD4",
				emphasis: !1,
				fields: g.value.audioFields
			}), g.value.imageFields.length && e.push({
				key: "image",
				title: k("sidebar.generation.image", "Image"),
				accent: "#2196F3",
				emphasis: !1,
				fields: g.value.imageFields
			}), e;
		});
		function te(e, t, n = 450) {
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
		function ne(e) {
			let t = String(e?.key || "").toLowerCase();
			return t.includes("high") ? "#FFC107" : t.includes("low") ? "#FFB300" : t.includes("base") ? "#FF9800" : t.includes("upscale") || t.includes("refine") ? "#FFCA28" : t.includes("pass") ? "#FDD835" : "#FF9800";
		}
		function re(e) {
			return e === "high_noise" ? "#FF7043" : e === "low_noise" ? "#29B6F6" : "#AB47BC";
		}
		async function E(e, t = null, n = "rgba(76, 175, 80, 0.35)") {
			let r = String(e ?? "").trim();
			if (!(!r || r === "-")) try {
				await navigator.clipboard.writeText(r), te(t, n);
			} catch (e) {
				console.debug?.(e);
			}
		}
		function ie() {
			l.value = {
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
				let r = await n(t.asset.id);
				if (e !== u) return;
				if (!r?.ok && (String(r?.code || "").toUpperCase() === "SERVICE_UNAVAILABLE" || /vector search is not enabled/i.test(String(r?.error || "")))) {
					ie();
					return;
				}
				let i = r?.ok && r.data != null ? Number(r.data) : null;
				if (!Number.isFinite(i)) {
					l.value = {
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
				let a = Math.round(i * 100), o = di(i);
				l.value = {
					scoreText: `${a}%`,
					scoreColor: o,
					qualityText: fi(i),
					qualityColor: o,
					qualityBackground: `${o}33`,
					fillWidth: `${a}%`,
					fillColor: o,
					aiStatusVisible: !1,
					aiStatusText: ""
				};
			} catch (t) {
				if (console.debug?.(t), e !== u) return;
				l.value = {
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
		async function se() {
			if (!(!b.value || c.value)) {
				c.value = !0, s.value = k("status.generating", "Generating...");
				try {
					let e = await ye(t.asset.id);
					e?.ok && (a.value = String(e?.data || "").trim());
				} catch (e) {
					console.debug?.(e);
				} finally {
					c.value = !1, s.value = k("action.generate", "Generate");
				}
			}
		}
		async function ce() {
			if (x.value) try {
				await navigator.clipboard.writeText(y.value), o.value = k("viewer.copySuccessShort", "Copied!"), setTimeout(() => {
					o.value = k("action.copy", "Copy");
				}, 900);
			} catch (e) {
				console.debug?.(e);
			}
		}
		return He(() => t.asset, () => {
			r.value = 0, i.value = 0, a.value = String(t.asset?.enhanced_caption || "").trim(), o.value = k("action.copy", "Copy"), s.value = k("action.generate", "Generate");
		}, { immediate: !0 }), He(() => [
			t.asset?.id,
			g.value.kind,
			g.value.showAlignment,
			_.value
		], () => {
			oe();
		}, { immediate: !0 }), (e, t) => {
			let n = qe("MButton");
			return g.value.kind === "empty" ? I("", !0) : (M(), B("div", Qi, [
				g.value.workflowType ? (M(), B("div", $i, [P("span", ea, z(R(k)("viewer.workflow", "Workflow")), 1), P("div", ta, [P("span", {
					title: R(k)("sidebar.generation.workflowEngine", "Workflow engine: {value}", { value: g.value.workflowType }),
					style: {
						background: "#2196F3",
						color: "white",
						padding: "2px 8px",
						"border-radius": "999px",
						"font-weight": "bold",
						"font-size": "10px",
						"letter-spacing": "0.2px"
					}
				}, z(g.value.workflowLabel || g.value.workflowType), 9, na), g.value.workflowBadge ? (M(), B("span", {
					key: 0,
					title: R(k)("sidebar.generation.apiProvider", "API provider: {value}", { value: g.value.workflowBadge }),
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
				}, z(g.value.workflowBadge), 9, ra)) : I("", !0)])])) : I("", !0),
				g.value.isOverride ? (M(), B("div", {
					key: 1,
					style: H(p("#00BCD4", {
						emphasis: !0,
						startAlpha: .14,
						endAlpha: .08
					}))
				}, [P("div", ia, [P("span", aa, z(R(k)("sidebar.generation.override", "Override")), 1), P("span", oa, z(g.value.overrideLabel), 1)])], 4)) : I("", !0),
				g.value.isTruncated ? (M(), B("div", {
					key: 2,
					style: H(p("#FF9800", {
						emphasis: !0,
						startAlpha: .12,
						endAlpha: .08
					}))
				}, [P("div", sa, z(R(k)("sidebar.generation.metadataTruncated", "Metadata Truncated")), 1), P("div", ca, z(R(k)("sidebar.generation.metadataTruncatedBody", "Generation data is incomplete because it exceeded the size limit.")), 1)], 4)) : I("", !0),
				g.value.kind === "media-only" ? (M(), B("div", {
					key: 3,
					style: H(p("#9E9E9E", {
						emphasis: !0,
						startAlpha: .1,
						endAlpha: .06
					}))
				}, [P("div", la, z(R(k)("sidebar.generation.generationData", "Generation Data")), 1), P("div", ua, z(g.value.mediaOnlyMessage), 1)], 4)) : I("", !0),
				g.value.kind === "full" ? (M(), B(N, { key: 4 }, [
					g.value.ltxDirector ? (M(), B("div", {
						key: 0,
						style: H(p("#26C6DA", {
							emphasis: !0,
							startAlpha: .15,
							endAlpha: .08
						}))
					}, [
						P("div", da, [P("div", fa, z(g.value.ltxDirector.title || "LTX Director"), 1), t[8] ||= P("span", { style: {
							"font-size": "10px",
							"font-weight": "700",
							color: "#26C6DA",
							background: "rgba(38,198,218,0.14)",
							border: "1px solid rgba(38,198,218,0.32)",
							"border-radius": "999px",
							padding: "2px 8px"
						} }, " Director ", -1)]),
						g.value.ltxDirector.fields.length ? (M(), B("div", pa, [(M(!0), B(N, null, F(g.value.ltxDirector.fields, (e) => (M(), B("div", {
							key: `ltx-field-${e.label}`,
							style: {
								border: "1px solid rgba(255,255,255,0.10)",
								"border-radius": "6px",
								background: "rgba(255,255,255,0.045)",
								padding: "7px 8px",
								"min-width": "0"
							}
						}, [P("div", ma, z(e.label), 1), P("div", ha, z(e.value), 1)]))), 128))])) : I("", !0),
						g.value.ltxDirector.globalPrompt ? (M(), B("div", ga, [t[9] ||= P("div", { style: {
							"font-size": "10px",
							"font-weight": "800",
							color: "#66BB6A",
							"text-transform": "uppercase",
							"letter-spacing": "0.45px",
							"margin-bottom": "6px"
						} }, " Global Prompt ", -1), P("div", {
							title: R(k)("action.clickToCopy", "Click to copy"),
							style: {
								"font-size": "12px",
								color: "var(--fg-color,#eee)",
								"line-height": "1.45",
								"white-space": "pre-wrap",
								"word-break": "break-word",
								cursor: "pointer"
							},
							onClick: t[0] ||= (e) => E(g.value.ltxDirector.globalPrompt, e.currentTarget)
						}, z(g.value.ltxDirector.globalPrompt), 9, _a)])) : I("", !0),
						g.value.ltxDirector.segments.length ? (M(), B("div", va, [(M(!0), B(N, null, F(g.value.ltxDirector.segments, (e) => (M(), B("div", {
							key: e.key,
							style: {
								border: "1px solid rgba(38,198,218,0.30)",
								"border-radius": "6px",
								background: "rgba(38,198,218,0.075)",
								padding: "10px"
							}
						}, [P("div", ya, [P("div", ba, z(e.label), 1), P("div", xa, [e.inLabel ? (M(), B("span", Sa, " in " + z(e.inLabel), 1)) : I("", !0), e.outLabel ? (M(), B("span", Ca, " out " + z(e.outLabel), 1)) : I("", !0)])]), P("div", wa, [e.filename ? (M(), Ve(Zi, {
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
						}, null, 8, ["input-file"])) : I("", !0), P("div", Ta, [e.prompt ? (M(), B("div", {
							key: 0,
							title: R(k)("action.clickToCopy", "Click to copy"),
							style: {
								"font-size": "12px",
								color: "var(--fg-color,#eee)",
								"line-height": "1.45",
								"white-space": "pre-wrap",
								"word-break": "break-word",
								cursor: "pointer"
							},
							onClick: (t) => E(e.prompt, t.currentTarget)
						}, z(e.prompt), 9, Ea)) : I("", !0), e.filename || e.type ? (M(), B("div", Da, [e.type ? (M(), B("span", Oa, z(e.type), 1)) : I("", !0), e.filename ? (M(), B("span", ka, z(e.filename), 1)) : I("", !0)])) : I("", !0)])])]))), 128))])) : I("", !0)
					], 4)) : I("", !0),
					g.value.ideogram ? (M(), B("div", {
						key: 1,
						style: H(p("#FFB300", {
							emphasis: !0,
							startAlpha: .15,
							endAlpha: .08
						}))
					}, [
						P("div", Aa, [P("div", ja, z(g.value.ideogram.title || "Ideogram 4"), 1), t[10] ||= P("span", { style: {
							"font-size": "10px",
							"font-weight": "700",
							color: "#FFCA28",
							background: "rgba(255,179,0,0.14)",
							border: "1px solid rgba(255,179,0,0.32)",
							"border-radius": "999px",
							padding: "2px 8px"
						} }, " Prompt JSON ", -1)]),
						g.value.ideogram.fields.length ? (M(), B("div", Ma, [(M(!0), B(N, null, F(g.value.ideogram.fields, (e) => (M(), B("div", {
							key: `ideogram-field-${e.label}`,
							style: {
								border: "1px solid rgba(255,255,255,0.10)",
								"border-radius": "6px",
								background: "rgba(255,255,255,0.045)",
								padding: "7px 8px",
								"min-width": "0"
							}
						}, [P("div", Na, z(e.label), 1), P("div", Pa, z(e.value), 1)]))), 128))])) : I("", !0),
						g.value.ideogram.highLevelDescription ? (M(), B("div", Fa, [t[11] ||= P("div", { style: {
							"font-size": "10px",
							"font-weight": "800",
							color: "#81C784",
							"text-transform": "uppercase",
							"letter-spacing": "0.45px",
							"margin-bottom": "6px"
						} }, " High Level Description ", -1), P("div", {
							title: R(k)("action.clickToCopy", "Click to copy"),
							style: {
								"font-size": "12px",
								color: "var(--fg-color,#eee)",
								"line-height": "1.45",
								"white-space": "pre-wrap",
								"word-break": "break-word",
								cursor: "pointer"
							},
							onClick: t[1] ||= (e) => E(g.value.ideogram.highLevelDescription, e.currentTarget)
						}, z(g.value.ideogram.highLevelDescription), 9, Ia)])) : I("", !0),
						g.value.ideogram.background ? (M(), B("div", La, [t[12] ||= P("div", { style: {
							"font-size": "10px",
							"font-weight": "800",
							color: "#64B5F6",
							"text-transform": "uppercase",
							"letter-spacing": "0.45px",
							"margin-bottom": "6px"
						} }, " Background ", -1), P("div", {
							title: R(k)("action.clickToCopy", "Click to copy"),
							style: {
								"font-size": "12px",
								color: "var(--fg-color,#eee)",
								"line-height": "1.45",
								"white-space": "pre-wrap",
								"word-break": "break-word",
								cursor: "pointer"
							},
							onClick: t[2] ||= (e) => E(g.value.ideogram.background, e.currentTarget)
						}, z(g.value.ideogram.background), 9, Ra)])) : I("", !0),
						g.value.ideogram.elements.length ? (M(), B("div", za, [(M(!0), B(N, null, F(g.value.ideogram.elements, (e) => (M(), B("div", {
							key: e.key,
							style: {
								border: "1px solid rgba(255,179,0,0.30)",
								"border-radius": "6px",
								background: "rgba(255,179,0,0.075)",
								padding: "10px"
							}
						}, [
							P("div", Ba, [P("div", Va, z(e.label), 1), e.bbox ? (M(), B("span", Ha, " bbox " + z(e.bbox), 1)) : I("", !0)]),
							e.description ? (M(), B("div", {
								key: 0,
								title: R(k)("action.clickToCopy", "Click to copy"),
								style: {
									"font-size": "12px",
									color: "var(--fg-color,#eee)",
									"line-height": "1.45",
									"white-space": "pre-wrap",
									"word-break": "break-word",
									cursor: "pointer"
								},
								onClick: (t) => E(e.description, t.currentTarget)
							}, z(e.description), 9, Ua)) : I("", !0),
							e.palette.length ? (M(), B("div", Wa, [(M(!0), B(N, null, F(e.palette, (t) => (M(), B("span", {
								key: `${e.key}-${t}`,
								title: t,
								style: H({
									width: "18px",
									height: "18px",
									borderRadius: "4px",
									border: "1px solid rgba(255,255,255,0.28)",
									background: t
								}),
								onClick: (e) => E(t, e.currentTarget)
							}, null, 12, Ga))), 128))])) : I("", !0)
						]))), 128))])) : I("", !0),
						P("details", Ka, [t[13] ||= P("summary", { style: {
							cursor: "pointer",
							padding: "8px 10px",
							"font-size": "10px",
							"font-weight": "800",
							color: "#FFCA28",
							"text-transform": "uppercase",
							"letter-spacing": "0.45px"
						} }, " JSON sent to text encoder ", -1), P("pre", {
							title: R(k)("action.clickToCopy", "Click to copy"),
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
							onClick: t[3] ||= (e) => E(g.value.ideogram.json, e.currentTarget)
						}, z(g.value.ideogram.json), 9, qa)])
					], 4)) : I("", !0),
					!g.value.ltxDirector && !g.value.ideogram && g.value.promptTabs.length ? (M(), B("div", {
						key: 2,
						style: H(p("#4CAF50", {
							emphasis: !0,
							startAlpha: .16,
							endAlpha: .1
						}))
					}, [
						P("div", Ja, z(R(k)("sidebar.generation.promptPipeline", "Prompt Pipeline ({count} variants)", { count: g.value.promptTabs.length })), 1),
						P("div", Ya, [(M(!0), B(N, null, F(g.value.promptTabs, (e, t) => (M(), Ve(n, {
							key: e.label,
							type: "button",
							severity: "secondary",
							text: "",
							rounded: "",
							style: H({
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
							default: ut(() => [Be(z(e.label), 1)]),
							_: 2
						}, 1032, ["style", "onClick"]))), 128))]),
						(M(!0), B(N, null, F(g.value.promptTabs, (e, t) => Ue((M(), B("div", {
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
							P("div", Xa, z(R(k)("sidebar.generation.positive", "POSITIVE")), 1),
							P("div", {
								style: {
									"font-size": "12px",
									color: "var(--fg-color, #ddd)",
									"white-space": "pre-wrap",
									"line-height": "1.35",
									cursor: "pointer"
								},
								onClick: (t) => E(e.positive, t.currentTarget)
							}, z(e.positive), 9, Za),
							e.negative ? (M(), B(N, { key: 0 }, [P("div", Qa, z(R(k)("sidebar.generation.negative", "NEGATIVE")), 1), P("div", {
								style: {
									"font-size": "12px",
									color: "var(--fg-color, #ddd)",
									"white-space": "pre-wrap",
									"line-height": "1.35",
									cursor: "pointer"
								},
								onClick: (t) => E(e.negative, t.currentTarget)
							}, z(e.negative), 9, $a)], 64)) : I("", !0)
						])), [[Xe, r.value === t]])), 128))
					], 4)) : !g.value.ltxDirector && !g.value.ideogram && g.value.positivePrompt ? (M(), B("div", {
						key: 3,
						style: H(p("#4CAF50", {
							emphasis: !0,
							startAlpha: .16,
							endAlpha: .1
						}))
					}, [P("div", eo, [P("span", null, z(R(k)("sidebar.generation.positivePrompt", "Positive Prompt")), 1), g.value.positivePromptOverride ? (M(), B("span", {
						key: 0,
						style: H(h()),
						title: R(k)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
					}, z(R(k)("sidebar.generation.override", "override")), 13, to)) : I("", !0)]), P("div", {
						title: R(k)("action.clickToCopy", "Click to copy"),
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.9))",
							"line-height": "1.5",
							"white-space": "pre-wrap",
							"word-break": "break-word",
							cursor: "pointer"
						},
						onClick: t[4] ||= (e) => E(g.value.positivePrompt, e.currentTarget)
					}, z(g.value.positivePrompt), 9, no)], 4)) : I("", !0),
					!g.value.ltxDirector && !g.value.ideogram && !g.value.promptTabs.length && g.value.negativePrompt ? (M(), B("div", {
						key: 4,
						style: H(p("#F44336", {
							emphasis: !0,
							startAlpha: .16,
							endAlpha: .1
						}))
					}, [P("div", ro, [P("span", null, z(R(k)("sidebar.generation.negativePrompt", "Negative Prompt")), 1), g.value.negativePromptOverride ? (M(), B("span", {
						key: 0,
						style: H(h()),
						title: R(k)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
					}, z(R(k)("sidebar.generation.override", "override")), 13, io)) : I("", !0)]), P("div", {
						title: R(k)("action.clickToCopy", "Click to copy"),
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.9))",
							"line-height": "1.5",
							"white-space": "pre-wrap",
							"word-break": "break-word",
							cursor: "pointer"
						},
						onClick: t[5] ||= (e) => E(g.value.negativePrompt, e.currentTarget)
					}, z(g.value.negativePrompt), 9, ao)], 4)) : I("", !0)
				], 64)) : I("", !0),
				v.value ? (M(), B("div", {
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
					class: at({ "mjr-ai-disabled-block": !_.value })
				}, [
					g.value.showAlignment ? (M(), B(N, { key: 0 }, [
						P("div", oo, [P("span", { title: R(k)("sidebar.generation.promptAlignmentTooltip", "How closely the generated image matches the prompt (SigLIP2 score)") }, z(R(k)("sidebar.generation.promptAlignment", "Prompt Alignment")), 9, so)]),
						P("div", co, [
							P("div", lo, [P("div", { style: H({
								height: "100%",
								width: l.value.fillWidth,
								background: l.value.fillColor,
								borderRadius: "4px",
								transition: "width 0.6s ease, background 0.4s ease"
							}) }, null, 4)]),
							P("span", { style: H({
								fontSize: "13px",
								fontWeight: "700",
								color: l.value.scoreColor,
								minWidth: "60px",
								textAlign: "right",
								fontFamily: "'Consolas', 'Monaco', monospace"
							}) }, z(l.value.scoreText), 5),
							P("span", { style: H({
								fontSize: "9px",
								fontWeight: "700",
								padding: "2px 6px",
								borderRadius: "3px",
								background: l.value.qualityBackground,
								color: l.value.qualityColor,
								textTransform: "uppercase",
								letterSpacing: "0.5px"
							}) }, z(l.value.qualityText), 5)
						]),
						l.value.aiStatusVisible ? (M(), B("div", uo, z(l.value.aiStatusText), 1)) : I("", !0)
					], 64)) : I("", !0),
					P("div", fo, [P("span", { title: R(k)("sidebar.generation.aiCaptionTooltip", "AI caption generated by Florence-2") }, z(g.value.captionLabel), 9, po), P("div", mo, [rt(n, {
						type: "button",
						class: "mjr-ai-control",
						severity: "secondary",
						text: "",
						disabled: !b.value || c.value,
						style: H([{
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
						onClick: Ke(se, ["stop"])
					}, {
						default: ut(() => [Be(z(s.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"]), rt(n, {
						type: "button",
						class: "mjr-ai-control",
						severity: "secondary",
						text: "",
						disabled: !x.value,
						style: H([{
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
						onClick: Ke(ce, ["stop"])
					}, {
						default: ut(() => [Be(z(o.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"])])]),
					P("div", {
						title: _.value ? R(k)("sidebar.generation.copyCaptionTooltip", "Click to copy caption") : R(k)("sidebar.generation.aiCaptionDisabled", "AI caption controls are disabled"),
						style: H({
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
					}, z(y.value), 13, ho)
				], 2)) : I("", !0),
				S.value.length ? (M(), B("div", {
					key: 6,
					style: H(p("#9C27B0", {
						emphasis: !0,
						startAlpha: .18,
						endAlpha: .1
					}))
				}, [P("div", go, z(R(k)("sidebar.generation.models", "Models")), 1), P("div", _o, [(M(!0), B(N, null, F(S.value, (e) => (M(), B("div", {
					key: `models-top-${e.key}`,
					style: H(w(T(e), !0))
				}, [
					P("div", { style: H({
						fontSize: "10px",
						fontWeight: "800",
						color: T(e),
						letterSpacing: "0.6px",
						textTransform: "uppercase"
					}) }, z(e.label), 5),
					(M(!0), B(N, null, F(e.modelFields, (t) => (M(), B("div", {
						key: `model-top-${e.key}-${t.label}`,
						style: {
							display: "flex",
							"flex-direction": "column",
							gap: "3px",
							"min-width": "0"
						}
					}, [P("span", vo, z(t.label), 1), P("span", {
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.96))",
							"line-height": "1.35",
							"word-break": "break-word",
							cursor: "pointer"
						},
						onClick: (e) => E(t.value, e.currentTarget)
					}, z(t.value || "-"), 9, yo)]))), 128)),
					e.loras.length ? (M(), B("div", bo, [t[14] ||= P("span", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.58)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "LoRA", -1), (M(!0), B(N, null, F(e.loras, (t, n) => (M(), B("span", {
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
					}, z(t), 9, xo))), 128))])) : I("", !0)
				], 4))), 128))])], 4)) : I("", !0),
				g.value.lyrics ? (M(), B("div", {
					key: 7,
					style: H(p("#00BCD4", { emphasis: !1 }))
				}, [P("div", So, [P("span", null, z(R(k)("sidebar.generation.lyrics", "Lyrics")), 1)]), P("div", Co, z(g.value.lyrics), 1)], 4)) : I("", !0),
				g.value.branchCards.length ? (M(), B(N, { key: 8 }, [
					I("", !0),
					C.value.length ? (M(), B("div", {
						key: 1,
						style: H(p("#FF9800", {
							emphasis: !0,
							startAlpha: .16,
							endAlpha: .1
						}))
					}, [P("div", wo, z(R(k)("sidebar.generation.sampling", "Sampling")), 1), P("div", To, [(M(!0), B(N, null, F(C.value, (e) => (M(), B("div", {
						key: `sampling-${e.key}`,
						style: H(w(ne(e), !0))
					}, [P("div", { style: H({
						fontSize: "10px",
						fontWeight: "800",
						color: ne(e),
						letterSpacing: "0.6px",
						textTransform: "uppercase"
					}) }, z(e.label), 5), (M(!0), B(N, null, F(e.samplingFields, (t) => (M(), B("div", {
						key: `sampling-row-${e.key}-${t.label}`,
						style: {
							display: "grid",
							"grid-template-columns": "minmax(48px,0.8fr) minmax(0,1fr)",
							gap: "8px",
							"font-size": "11px",
							color: "rgba(255,255,255,0.72)",
							"align-items": "start"
						}
					}, [P("span", null, z(t.label), 1), P("span", {
						style: {
							color: "var(--fg-color, #ddd)",
							"word-break": "break-word",
							"text-align": "right",
							cursor: "pointer"
						},
						onClick: (e) => E(t.value, e.currentTarget)
					}, z(t.value), 9, Eo)]))), 128))], 4))), 128))])], 4)) : I("", !0),
					I("", !0)
				], 64)) : g.value.modelGroups.length ? (M(), B("div", {
					key: 9,
					style: H(p("#9C27B0", {
						emphasis: !0,
						startAlpha: .18,
						endAlpha: .1
					}))
				}, [P("div", Do, z(R(k)("sidebar.generation.models", "Models")), 1), P("div", Oo, [(M(!0), B(N, null, F(g.value.modelGroups, (e) => (M(), B("div", {
					key: `model-group-${e.key}`,
					style: H(w(re(e.key), !0))
				}, [
					P("div", ko, [P("div", { style: H({
						fontSize: "10px",
						fontWeight: "800",
						color: re(e.key),
						letterSpacing: "0.6px",
						textTransform: "uppercase"
					}) }, z(e.label), 5), P("span", { style: H({
						fontSize: "9px",
						fontWeight: "700",
						color: "#fff",
						background: f(re(e.key), .22),
						border: `1px solid ${f(re(e.key), .48)}`,
						borderRadius: "999px",
						padding: "2px 8px",
						letterSpacing: "0.4px",
						textTransform: "uppercase"
					}) }, z(e.loras?.length || 0) + " LoRA ", 5)]),
					P("div", Ao, [t[15] ||= P("div", { style: {
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
					}, z(e.model || "-"), 9, jo)]),
					e.loras?.length ? (M(), B("div", Mo, [P("div", No, z(R(k)("sidebar.generation.loraStack", "LoRA Stack")), 1), P("div", Po, [(M(!0), B(N, null, F(e.loras, (t, n) => (M(), B("div", {
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
					}, z(t), 9, Fo))), 128))])])) : I("", !0)
				], 4))), 128))])], 4)) : I("", !0),
				(M(!0), B(N, null, F(ee.value, (e) => (M(), B("div", {
					key: e.key,
					style: H(p(e.accent, { emphasis: e.emphasis }))
				}, [P("div", { style: H({
					fontSize: "11px",
					fontWeight: "600",
					color: e.accent,
					textTransform: "uppercase",
					letterSpacing: "0.5px",
					marginBottom: "10px"
				}) }, z(e.title), 5), P("div", Io, [(M(!0), B(N, null, F(e.fields, (t) => (M(), B(N, { key: `${e.key}-${t.label}` }, [P("div", {
					title: t.label,
					style: {
						"font-size": "11px",
						color: "var(--mjr-muted, rgba(127,127,127,0.9))",
						"font-weight": "500",
						display: "flex",
						"align-items": "center",
						gap: "6px"
					}
				}, [P("span", null, z(t.label) + ":", 1), t.override ? (M(), B("span", {
					key: 0,
					style: H(h()),
					title: R(k)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
				}, z(R(k)("sidebar.generation.override", "override")), 13, Ro)) : I("", !0)], 8, Lo), P("div", {
					title: `${t.label}: ${t.value}`,
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.95))",
						"word-break": "break-word",
						"white-space": "pre-wrap",
						cursor: "pointer"
					},
					onClick: (e) => E(t.value, e.currentTarget)
				}, z(t.value), 9, zo)], 64))), 128))])], 4))), 128)),
				g.value.notesFields.length ? (M(), B("div", {
					key: 10,
					style: H(p("#4CAF50", { emphasis: !1 }))
				}, [P("div", Bo, z(R(k)("sidebar.generation.notes", "Notes")), 1), (M(!0), B(N, null, F(g.value.notesFields, (e) => (M(), B("div", {
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
				}, z(e.value), 9, Vo))), 128))], 4)) : I("", !0),
				g.value.moduleBlocks.length ? (M(), B("div", {
					key: 11,
					style: H(p("#26C6DA", {
						emphasis: !0,
						startAlpha: .14,
						endAlpha: .08
					}))
				}, [P("div", Ho, z(R(k)("sidebar.generation.modules", "Modules")), 1), P("div", Uo, [(M(!0), B(N, null, F(g.value.moduleBlocks, (e) => (M(), B("div", {
					key: `module-${e.key}-${e.title}`,
					style: H(w(e.accent, !1))
				}, [P("div", { style: H({
					fontSize: "10px",
					fontWeight: "800",
					color: e.accent,
					letterSpacing: "0.6px",
					textTransform: "uppercase"
				}) }, z(e.title), 5), (M(!0), B(N, null, F(e.fields, (t) => (M(), B("div", {
					key: `module-${e.key}-${t.label}`,
					style: {
						display: "flex",
						"flex-direction": "column",
						gap: "3px",
						"min-width": "0"
					}
				}, [P("span", Wo, z(t.label), 1), P("span", {
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
				}, z(t.value), 9, Go)]))), 128))], 4))), 128))])], 4)) : I("", !0),
				g.value.ttsInstruction ? (M(), B("div", {
					key: 12,
					style: H(p("#26A69A", { emphasis: !1 }))
				}, [P("div", Ko, [P("span", null, z(R(k)("sidebar.generation.ttsInstruction", "TTS Instruction")), 1)]), P("div", {
					title: R(k)("action.clickToCopy", "Click to copy"),
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: t[6] ||= (e) => E(g.value.ttsInstruction, e.currentTarget)
				}, z(g.value.ttsInstruction), 9, qo)], 4)) : I("", !0),
				g.value.seed !== null && g.value.seed !== void 0 && g.value.seed !== "" ? (M(), B("div", {
					key: 13,
					style: H(m())
				}, [P("div", Jo, z(R(k)("sidebar.generation.seed", "SEED")), 1), P("div", {
					title: R(k)("sidebar.generation.copySeedTooltip", "Click to copy seed: {seed}", { seed: g.value.seed }),
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
					onClick: t[7] ||= (e) => E(g.value.seed, e.currentTarget, "rgba(76, 175, 80, 0.4)")
				}, z(g.value.seed), 9, Yo)], 4)) : I("", !0),
				g.value.inputFiles.length ? (M(), B("div", {
					key: 14,
					style: H(p("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [P("div", {
					title: R(k)("tooltip.generationInputs", "Input files used in generation"),
					style: {
						"font-size": "11px",
						"font-weight": "600",
						color: "#4CAF50",
						"text-transform": "uppercase",
						"letter-spacing": "0.5px",
						"margin-bottom": "8px"
					}
				}, z(R(k)("sidebar.generation.sourceFiles", "Source Files")), 9, Xo), P("div", Zo, [(M(!0), B(N, null, F(g.value.inputFiles, (e) => (M(), Ve(Zi, {
					key: e.id,
					"input-file": e
				}, null, 8, ["input-file"]))), 128))])], 4)) : I("", !0)
			]));
		};
	}
}, $o = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "var(--comfy-menu-bg, rgba(0,0,0,0.2))",
		border: "1px solid var(--border-color, rgba(255,255,255,0.14))",
		"border-radius": "8px",
		padding: "12px",
		"min-width": "300px"
	}
}, es = { style: { "margin-bottom": "12px" } }, ts = { style: {
	"font-size": "16px",
	"font-weight": "800",
	color: "rgba(255,255,255,0.94)",
	"line-height": "1.25",
	overflow: "hidden",
	"text-overflow": "ellipsis"
} }, ns = ["title"], rs = {
	key: 1,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "6px",
		"margin-top": "8px",
		"min-width": "0"
	},
	"aria-label": "Workflow metadata badges"
}, is = ["title"], as = { style: {
	overflow: "hidden",
	"text-overflow": "ellipsis",
	"white-space": "nowrap"
} }, os = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "8px",
	"margin-bottom": "10px"
} }, ss = { style: {
	padding: "4px 9px",
	"border-radius": "999px",
	background: "rgba(33,150,243,0.14)",
	border: "1px solid rgba(33,150,243,0.30)",
	"font-size": "11px",
	"font-weight": "700",
	color: "#90CAF9",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, cs = {
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
}, ls = { style: {
	display: "grid",
	"grid-template-columns": "repeat(2, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, us = {
	key: 0,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, ds = { style: {
	"font-size": "13px",
	"font-weight": "750",
	color: "rgba(255,255,255,0.92)",
	"margin-top": "3px"
} }, fs = {
	key: 1,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, ps = { style: {
	"font-size": "13px",
	"font-weight": "750",
	color: "rgba(255,255,255,0.92)",
	"margin-top": "3px"
} }, ms = {
	key: 2,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, hs = { style: {
	"font-size": "13px",
	"font-weight": "750",
	color: "rgba(255,255,255,0.92)",
	"margin-top": "3px"
} }, gs = {
	key: 3,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, _s = { style: {
	"font-size": "12px",
	"font-weight": "650",
	color: "rgba(255,255,255,0.84)",
	"margin-top": "3px"
} }, vs = {
	key: 0,
	style: {
		"font-size": "11px",
		color: "rgba(255,255,255,0.54)",
		"margin-top": "2px"
	}
}, ys = {
	key: 0,
	style: {
		"margin-bottom": "12px",
		padding: "10px",
		"border-radius": "10px",
		background: "rgba(244,67,54,0.08)",
		border: "1px solid rgba(244,67,54,0.25)"
	}
}, bs = {
	key: 1,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "5px"
	}
}, xs = {
	key: 1,
	style: {
		"margin-bottom": "12px",
		padding: "10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.035)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, Ss = {
	key: 0,
	style: {
		"font-size": "12px",
		"line-height": "1.45",
		color: "rgba(255,255,255,0.82)",
		"white-space": "pre-wrap"
	}
}, Cs = { style: {
	display: "grid",
	"grid-template-columns": "repeat(3, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, ws = {
	key: 2,
	style: {
		"margin-bottom": "12px",
		padding: "10px",
		"border-radius": "10px",
		background: "rgba(76,175,80,0.07)",
		border: "1px solid rgba(76,175,80,0.22)"
	}
}, Ts = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "8px",
	"margin-bottom": "7px"
} }, Es = { style: {
	"font-size": "11px",
	color: "rgba(255,255,255,0.62)"
} }, Ds = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "6px"
	}
}, Os = {
	key: 0,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "5px"
	}
}, ks = {
	key: 1,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "5px"
	}
}, As = {
	key: 1,
	style: {
		"font-size": "12px",
		color: "rgba(255,255,255,0.78)"
	}
}, js = {
	key: 2,
	style: {
		"margin-top": "7px",
		"font-size": "11px",
		color: "rgba(255,255,255,0.58)"
	}
}, Ms = {
	key: 3,
	style: {
		"margin-top": "8px",
		"font-size": "11px",
		color: "rgba(255,255,255,0.62)"
	}
}, Ns = { key: 0 }, Ps = { style: {
	display: "grid",
	"grid-template-columns": "repeat(3, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, Fs = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, Is = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, Ls = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, Rs = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, zs = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, Bs = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, Vs = { style: {
	"margin-bottom": "12px",
	padding: "10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.03)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, Hs = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px",
	"margin-bottom": "8px",
	"min-width": "0"
} }, Us = { style: {
	"min-width": "0",
	flex: "1 1 auto"
} }, Ws = ["title"], Gs = ["title"], Ks = { style: {
	display: "flex",
	gap: "8px",
	"align-items": "center"
} }, qs = ["placeholder"], Js = {
	key: 3,
	class: "mjr-workflow-tree-wrap"
}, Ys = { class: "mjr-workflow-tree-node" }, Xs = { class: "mjr-workflow-tree-node-name" }, Zs = {
	key: 0,
	class: "mjr-workflow-tree-node-type"
}, Qs = { class: "mjr-menu-item-hint" }, $s = {
	key: 0,
	class: "mjr-section-hint"
}, ec = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px",
	"margin-top": "8px"
} }, tc = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"align-items": "center"
} }, nc = {
	key: 4,
	style: {
		display: "grid",
		"grid-template-columns": "repeat(auto-fit, minmax(180px, 1fr))",
		gap: "8px",
		"align-items": "stretch",
		"margin-top": "10px",
		"margin-bottom": "10px"
	}
}, rc = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "2px",
	"min-width": "0"
} }, ic = { style: {
	"font-size": "13px",
	"font-weight": "600"
} }, ac = { style: {
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, oc = { style: {
	display: "flex",
	gap: "10px",
	"align-items": "stretch",
	"margin-top": "10px"
} }, sc = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	gap: "10px",
	"margin-top": "8px",
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, cc = ["open"], lc = { style: {
	background: "rgba(0,0,0,0.5)",
	padding: "10px",
	"border-radius": "6px",
	"font-size": "11px",
	overflow: "auto",
	"max-height": "180px",
	margin: "10px 0 0 0",
	color: "#90CAF9",
	"font-family": "'Consolas', 'Monaco', monospace"
} }, uc = 1, dc = 8, fc = 250, pc = {
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
		]), a = V(null), o = V(""), s = V(!1), c = V(!1), u = V(null), d = V(!1), f = V(null), p = V([]), m = V(null), h = V(!1), v = V(!1), y = V(ce()), b = V({ ...r }), x = V("crosshair"), C = V(""), te = null, w = null, T = null;
		function ne(e, t, n) {
			let r = Number(e);
			return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
		}
		function re(e) {
			!e || typeof e != "object" || (b.value = {
				...b.value,
				zoom: ne(e.zoom ?? b.value.zoom, uc, dc),
				centerX: Number.isFinite(Number(e.centerX)) ? Number(e.centerX) : null,
				centerY: Number.isFinite(Number(e.centerY)) ? Number(e.centerY) : null
			});
		}
		function E() {
			b.value = { ...r }, C.value = "";
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
				let e = Nt?.()?.workflowMinimap;
				if (e && typeof e == "object") return {
					...n,
					...e
				};
			} catch (e) {
				console.debug?.(e);
			}
			try {
				let e = localStorage?.getItem?.(pe);
				if (!e) return { ...n };
				let t = JSON.parse(e);
				if (!t || typeof t != "object") return { ...n };
				let r = {
					...n,
					...t
				};
				try {
					let e = Nt();
					e.workflowMinimap = {
						...e.workflowMinimap,
						...r
					}, K(e), localStorage?.removeItem?.(pe);
				} catch (e) {
					console.debug?.(e);
				}
				return r;
			} catch {
				return { ...n };
			}
		}
		function le(e) {
			try {
				let t = Nt();
				t.workflowMinimap = {
					...t.workflowMinimap,
					...e
				}, K(t);
			} catch (e) {
				console.debug?.(e);
			}
		}
		let D = L(() => {
			let e = oe(t.asset) || oe(u.value), n = se(t.asset) || se(u.value);
			return !e && !n ? null : e || Pr(n);
		}), de = L(() => String(t.asset?.filepath || t.asset?.path || t.asset?.file_info?.filepath || "").trim()), fe = L(() => String(t.asset?.display_name || t.asset?.name || t.asset?.filename || t.asset?.title || "Workflow").trim()), me = L(() => String(t.asset?.task || t.asset?.workflow_task || "").trim()), ge = L(() => String(t.asset?.model_family || t.asset?.workflow_model_family || "").trim()), _e = L(() => String(t.asset?.provider || t.asset?.workflow_provider || "").trim()), ve = L(() => String(t.asset?.runs_on || t.asset?.runsOn || "").trim().toLowerCase()), ye = L(() => {
			let e = ve.value, t = _e.value;
			return e === "api" && t ? `API · ${t}` : e ? t && t.toLowerCase() !== e ? `${e} · ${t}` : e : t;
		}), be = L(() => String(t.asset?.notes || "").trim()), xe = L(() => [
			t.asset?.detected_task ? `detected: ${t.asset.detected_task}` : "",
			t.asset?.detected_model_family ? t.asset.detected_model_family : "",
			t.asset?.detected_provider ? t.asset.detected_provider : ""
		].filter(Boolean).join(" · ")), Se = L(() => Le(t.asset?.missing_nodes || t.asset?.missingNodes)), Ce = L(() => Le(t.asset?.missing_models || t.asset?.missingModels)), we = L(() => Le(t.asset?.tags || t.asset?.workflow_tags || t.asset?.tags_json)), Te = L(() => we.value.slice(0, 3)), Ee = L(() => Math.max(0, we.value.length - Te.value.length)), De = L(() => Le(f.value?.missing_nodes)), A = L(() => Le(f.value?.missing_models)), Oe = L(() => Le(f.value?.warnings)), ke = L(() => {
			let e = f.value;
			return e ? `${Number(e.node_count || 0)} nodes | ${Number(e.subgraph_count || 0)} subgraphs | ${Array.isArray(e.required_nodes) ? e.required_nodes.length : 0} node types` : "";
		}), j = L(() => {
			let e = p.value?.[0];
			return e ? String(e.filename || "").replace(/\.json$/i, "") : "";
		}), Ae = L(() => {
			let e = m.value;
			return e ? `${Number(e.changed?.length || 0)} changed | ${Number(e.added?.length || 0)} added | ${Number(e.removed?.length || 0)} removed` : "";
		}), Me = L(() => {
			let e = Number(t.asset?.usage_count || t.asset?.usageCount || 0);
			return !Number.isFinite(e) || e <= 0 ? "" : `${Math.floor(e)} use${e === 1 ? "" : "s"}`;
		}), Ne = L(() => Re(t.asset?.last_loaded_at || t.asset?.lastLoadedAt)), Pe = L(() => Re(t.asset?.mtime || t.asset?.modified_at || t.asset?.updated_at)), Fe = L(() => {
			let e = [];
			t.asset?.favorite && e.push({
				key: "favorite",
				label: "Favorite",
				icon: "pi pi-star-fill",
				tone: "favorite"
			}), Me.value && e.push({
				key: "usage",
				label: Me.value,
				icon: "pi pi-play-circle",
				tone: "usage"
			}), Ne.value && e.push({
				key: "last-loaded",
				label: `Loaded ${Ne.value}`,
				icon: "pi pi-clock",
				tone: "loaded"
			});
			for (let t of Te.value) e.push({
				key: `tag-${t}`,
				label: t,
				icon: "pi pi-tag",
				tone: "tag"
			});
			return Ee.value && e.push({
				key: "tags-more",
				label: `+${Ee.value} tags`,
				icon: "pi pi-tags",
				tone: "tag"
			}), e;
		});
		function Ie(e) {
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
		async function Ke() {
			if (D.value) return;
			let e = de.value;
			if (e && !c.value) {
				c.value = !0;
				try {
					let t = await S(e, { timeoutMs: 25e3 });
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
					c.value = !1;
				}
			}
		}
		let Je = L(() => t.asset?.has_generation_data ? "Complete" : "Partial"), Ye = L(() => D.value ? JSON.stringify(D.value, null, 2) : ""), Xe = L(() => String(t.asset?.category || t.asset?.subfolder || t.asset?.folder || "").trim().replace(/^\/+|\/+$/g, "")), Ze = L(() => Xe.value ? Xe.value.split(/[\\/]+/).filter(Boolean) : []), Qe = L(() => Ze.value.at(-1) || Xe.value || "Root"), $e = L(() => Ze.value.slice(-1));
		function et(e, t) {
			let n = e?.id ?? e?.key ?? t + 1;
			return String(e?.title || e?._meta?.title || e?.type || e?.class_type || e?.name || `Node ${n}`);
		}
		function tt(e) {
			return String(e?.type || e?.class_type || e?.name || "").trim();
		}
		function nt() {
			o.value = Xe.value;
		}
		async function it() {
			let e = String(t.asset?.filepath || t.asset?.path || t.asset?.file_info?.filepath || "").trim();
			if (!e) {
				O(k("toast.workflowMissingPath", "Workflow file path is missing."), "error");
				return;
			}
			let n = String(o.value || "").trim();
			if (n !== Xe.value) {
				s.value = !0;
				try {
					let t = await _({
						filepath: e,
						category: n
					}, { timeoutMs: 3e4 });
					if (!t?.ok) {
						O(t?.error || k("toast.workflowMoveFailed", "Failed to move workflow."), "error");
						return;
					}
					o.value = String(t?.data?.workflow?.category || n || "").trim(), O(k("toast.workflowCategoryUpdated", "Workflow category updated"), "success", 1800);
				} catch {
					O(k("toast.workflowMoveFailed", "Failed to move workflow."), "error");
				} finally {
					s.value = !1;
				}
			}
		}
		async function ot() {
			let e = de.value;
			if (!e) {
				O(k("toast.workflowMissingPath", "Workflow file path is missing."), "error");
				return;
			}
			let n = await he({
				filepath: e,
				limit: 12
			}, { timeoutMs: 15e3 });
			if (!n?.ok) {
				O(n?.error || k("toast.workflowLoadFailed", "Failed to load workflow."), "error");
				return;
			}
			let r = Array.isArray(n.data) ? n.data : [];
			if (!r.length) {
				O(k("toast.workflowThumbnailNoCandidates", "No linked outputs are available for this workflow yet."), "warning", 2600);
				return;
			}
			let i = await Ir({
				title: k("ctx.setWorkflowThumbnail", "Set workflow thumbnail"),
				workflow: t.asset,
				items: r
			});
			if (!i?.filepath) return;
			let a = await g({
				filepath: e,
				source_filepath: i.filepath
			}, { timeoutMs: 3e4 });
			if (!a?.ok) {
				O(a?.error || k("toast.workflowSaveFailed", "Failed to save workflow."), "error");
				return;
			}
			O(k("toast.workflowUpdated", "Workflow updated"), "success", 1800), window?.dispatchEvent?.(new CustomEvent("mjr:reload-grid", { detail: { reason: "workflow-thumbnail-sidebar" } }));
		}
		async function st() {
			if (await Ke(), !D.value) {
				O(k("toast.workflowLoadFailed", "Failed to load workflow."), "error");
				return;
			}
			try {
				await ze.openAssets({
					assets: [{
						...t.asset,
						workflow: D.value,
						Workflow: D.value
					}],
					index: 0,
					mode: "graph"
				});
			} catch (e) {
				console.debug?.(e), O(k("toast.workflowLoadFailed", "Failed to load workflow."), "error");
			}
		}
		async function ct() {
			let e = de.value;
			if (!e) {
				O(k("toast.workflowMissingPath", "Workflow file path is missing."), "error");
				return;
			}
			d.value = !0, f.value = null, p.value = [], m.value = null;
			try {
				let [t, n] = await Promise.all([l(e, { timeoutMs: 2e4 }), ee(e, { timeoutMs: 15e3 })]);
				if (!t?.ok) {
					O(t?.error || k("toast.workflowLoadFailed", "Failed to load workflow."), "error");
					return;
				}
				f.value = t.data || {}, p.value = Array.isArray(n?.data?.versions) ? n.data.versions : [];
				let r = p.value[0];
				if (r?.filepath) {
					let t = await ue(e, r.filepath, { timeoutMs: 15e3 });
					t?.ok && (m.value = t.data || null);
				}
			} catch (e) {
				console.debug?.(e), O(k("toast.workflowLoadFailed", "Failed to load workflow."), "error");
			} finally {
				d.value = !1;
			}
		}
		let lt = L(() => (Array.isArray(D.value?.nodes) ? D.value.nodes : []).slice(0, fc).map((e, t) => {
			let n = e?.id ?? e?.key ?? t + 1, r = tt(e);
			return {
				key: String(n),
				label: et(e, t),
				icon: "pi pi-circle-fill",
				data: {
					id: n,
					type: r
				}
			};
		})), dt = L(() => Math.max(0, Number(ft.value.nodes || 0) - lt.value.length)), ft = L(() => {
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
		}), pt = L(() => {
			let e = String(y.value?.size || "comfortable");
			return i.find((t) => t.key === e) || i[1];
		}), mt = L(() => `${pt.value.height}px`), ht = L(() => [
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
		function _t() {
			let e = a.value, t = D.value;
			if (!e || !t) return;
			let n = Math.max(1, e.clientWidth || 320), r = Math.max(1, e.clientHeight || 120), i = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
			e.width = Math.floor(n * i), e.height = Math.floor(r * i);
			let o = e.getContext("2d");
			o && o.setTransform(i, 0, 0, i, 0, 0), w = wr(e, t, {
				...y.value,
				view: b.value
			}) || null, re(w?.resolvedView);
		}
		function vt(e) {
			je(e);
		}
		function yt(e) {
			let t = a.value;
			if (!t) return null;
			let n = t.getBoundingClientRect?.();
			return n ? {
				x: Number(e?.clientX) - n.left,
				y: Number(e?.clientY) - n.top
			} : null;
		}
		function bt(e) {
			let t = yt(e);
			return !t || !w?.canvasToWorld ? null : {
				local: t,
				world: w.canvasToWorld(t.x, t.y)
			};
		}
		function xt(e) {
			let t = yt(e), n = t && w?.hitTestNode ? w.hitTestNode(t.x, t.y) : null, r = n?.id !== null && n?.id !== void 0 ? String(n.id) : null, i = b.value.hoveredNodeId !== null && b.value.hoveredNodeId !== void 0 ? String(b.value.hoveredNodeId) : null;
			C.value = n?.label || "", r !== i && (b.value = {
				...b.value,
				hoveredNodeId: r
			}, _t());
		}
		function St(e) {
			e && (vt(e), b.value = {
				...b.value,
				centerX: Number(e.x),
				centerY: Number(e.y)
			}, _t());
		}
		function Ct(e) {
			if (Number(e?.button ?? 0) !== 0) return;
			let t = bt(e);
			t && (T = e.pointerId ?? 1, x.value = "grabbing", a.value?.setPointerCapture?.(T), St(t.world), xt(e), e.preventDefault?.(), e.stopPropagation?.());
		}
		function U(e) {
			if (T !== null && e.pointerId === T) {
				let t = bt(e);
				t && St(t.world), e.preventDefault?.(), e.stopPropagation?.();
				return;
			}
			xt(e);
		}
		function W(e) {
			T !== null && e?.pointerId === T && (a.value?.releasePointerCapture?.(T), T = null, x.value = "crosshair"), e?.type === "pointerleave" && (C.value = "", b.value.hoveredNodeId !== null && (b.value = {
				...b.value,
				hoveredNodeId: null
			}, _t()));
		}
		function wt(e) {
			let t = bt(e), n = w?.resolvedView;
			if (!t || !n) return;
			let r = ne(Number(e?.deltaY) || 0, -240, 240), i = Math.exp(-r * .0025), a = ne((Number(b.value.zoom) || 1) * i, uc, dc);
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
			}, _t(), xt(e), e.preventDefault?.(), e.stopPropagation?.();
		}
		function Tt(e) {
			let t = bt(e);
			E(), t && vt(t.world), _t(), e.preventDefault?.(), e.stopPropagation?.();
		}
		function Et(e) {
			y.value = {
				...y.value,
				[e]: !y.value?.[e]
			}, le(y.value);
		}
		function Dt(e) {
			i.some((t) => t.key === e) && (y.value = {
				...y.value,
				size: e
			}, le(y.value));
		}
		return Ge(() => {
			a.value && typeof ResizeObserver == "function" && (te = new ResizeObserver(() => _t()), te.observe(a.value)), nt(), Ke(), _t();
		}), He(D, () => {
			E(), _t();
		}, { flush: "post" }), He(de, () => {
			u.value = null, Ke();
		}, { immediate: !0 }), He(Xe, () => {
			nt();
		}), He(y, () => {
			_t();
		}, {
			deep: !0,
			flush: "post"
		}), He(h, () => {
			_t();
		}, { flush: "post" }), We(() => {
			try {
				te?.disconnect?.();
			} catch (e) {
				console.debug?.(e);
			}
			te = null, T = null;
		}), (e, t) => {
			let n = qe("MButton"), r = qe("MTree");
			return D.value ? (M(), B("div", $o, [
				t[18] ||= P("div", { style: {
					"font-size": "13px",
					"font-weight": "600",
					color: "var(--fg-color, #eaeaea)",
					"margin-bottom": "12px",
					"text-transform": "uppercase",
					"letter-spacing": "0.5px"
				} }, " ComfyUI Workflow ", -1),
				P("div", es, [
					P("div", ts, z(fe.value), 1),
					de.value ? (M(), B("div", {
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
					}, z(de.value), 9, ns)) : I("", !0),
					Fe.value.length ? (M(), B("div", rs, [(M(!0), B(N, null, F(Fe.value, (e) => (M(), B("span", {
						key: e.key,
						style: H(Ie(e.tone)),
						title: e.label
					}, [P("i", {
						class: at(e.icon),
						style: {
							"font-size": "10px",
							flex: "0 0 auto"
						}
					}, null, 2), P("span", as, z(e.label), 1)], 12, is))), 128))])) : I("", !0)
				]),
				P("div", os, [P("div", ss, z(Je.value), 1), ft.value.source ? (M(), B("div", cs, z(ft.value.source), 1)) : I("", !0)]),
				P("div", ls, [
					me.value ? (M(), B("div", us, [t[3] ||= P("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Task", -1), P("div", ds, z(me.value), 1)])) : I("", !0),
					ge.value ? (M(), B("div", fs, [t[4] ||= P("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Model", -1), P("div", ps, z(ge.value), 1)])) : I("", !0),
					ye.value ? (M(), B("div", ms, [t[5] ||= P("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Runs on", -1), P("div", hs, z(ye.value), 1)])) : I("", !0),
					Me.value || Pe.value ? (M(), B("div", gs, [
						t[6] ||= P("div", { style: {
							"font-size": "10px",
							"font-weight": "700",
							color: "rgba(255,255,255,0.55)",
							"text-transform": "uppercase",
							"letter-spacing": "0.4px"
						} }, "Library", -1),
						P("div", _s, z(Me.value || Pe.value), 1),
						Me.value && Pe.value ? (M(), B("div", vs, z(Pe.value), 1)) : I("", !0)
					])) : I("", !0)
				]),
				Se.value.length || Ce.value.length ? (M(), B("div", ys, [
					t[7] ||= P("div", { style: {
						"font-size": "10px",
						"font-weight": "800",
						color: "#ef9a9a",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px",
						"margin-bottom": "6px"
					} }, "Missing dependencies", -1),
					Se.value.length ? (M(), B("div", {
						key: 0,
						style: H({
							display: "flex",
							flexWrap: "wrap",
							gap: "5px",
							marginBottom: Ce.value.length ? "7px" : "0"
						})
					}, [(M(!0), B(N, null, F(Se.value, (e) => (M(), B("span", {
						key: `node-${e}`,
						style: {
							padding: "3px 7px",
							"border-radius": "999px",
							background: "rgba(244,67,54,0.16)",
							"font-size": "10px",
							"font-weight": "700",
							color: "#ffcdd2"
						}
					}, z(e), 1))), 128))], 4)) : I("", !0),
					Ce.value.length ? (M(), B("div", bs, [(M(!0), B(N, null, F(Ce.value, (e) => (M(), B("span", {
						key: `model-${e}`,
						style: {
							padding: "3px 7px",
							"border-radius": "999px",
							background: "rgba(255,152,0,0.16)",
							"font-size": "10px",
							"font-weight": "700",
							color: "#ffe0b2"
						}
					}, z(e), 1))), 128))])) : I("", !0)
				])) : I("", !0),
				be.value || xe.value ? (M(), B("div", xs, [be.value ? (M(), B("div", Ss, z(be.value), 1)) : I("", !0), xe.value ? (M(), B("div", {
					key: 1,
					style: H({
						fontSize: "11px",
						color: "rgba(255,255,255,0.48)",
						marginTop: be.value ? "7px" : "0"
					})
				}, z(xe.value), 5)) : I("", !0)])) : I("", !0),
				P("div", Cs, [
					rt(n, {
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
						onClick: ot
					}, {
						default: ut(() => [t[8] ||= P("i", { class: "pi pi-image" }, null, -1), P("span", null, z(R(k)("ctx.setWorkflowThumbnail", "Set workflow thumbnail")), 1)]),
						_: 1
					}),
					rt(n, {
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
						default: ut(() => [t[9] ||= P("i", { class: "pi pi-search" }, null, -1), P("span", null, z(R(k)("ctx.inspect", "Inspect")), 1)]),
						_: 1
					}),
					rt(n, {
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
						onClick: ct
					}, {
						default: ut(() => [P("i", { class: at(d.value ? "pi pi-spin pi-spinner" : "pi pi-check-circle") }, null, 2), P("span", null, z(d.value ? "Checking" : "Validate"), 1)]),
						_: 1
					}, 8, ["disabled"])
				]),
				f.value ? (M(), B("div", ws, [
					P("div", Ts, [t[10] ||= P("div", { style: {
						"font-size": "10px",
						"font-weight": "800",
						color: "#a5d6a7",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Workflow diagnostics", -1), P("div", Es, z(ke.value), 1)]),
					De.value.length || A.value.length ? (M(), B("div", Ds, [De.value.length ? (M(), B("div", Os, [(M(!0), B(N, null, F(De.value, (e) => (M(), B("span", {
						key: `diag-node-${e}`,
						style: {
							padding: "3px 7px",
							"border-radius": "999px",
							background: "rgba(244,67,54,0.16)",
							"font-size": "10px",
							"font-weight": "700",
							color: "#ffcdd2"
						}
					}, " Missing node: " + z(e), 1))), 128))])) : I("", !0), A.value.length ? (M(), B("div", ks, [(M(!0), B(N, null, F(A.value, (e) => (M(), B("span", {
						key: `diag-model-${e}`,
						style: {
							padding: "3px 7px",
							"border-radius": "999px",
							background: "rgba(255,152,0,0.16)",
							"font-size": "10px",
							"font-weight": "700",
							color: "#ffe0b2"
						}
					}, " Missing model: " + z(e), 1))), 128))])) : I("", !0)])) : (M(), B("div", As, " No missing dependencies detected by the current ComfyUI runtime. ")),
					Oe.value.length ? (M(), B("div", js, z(Oe.value.join(" | ")), 1)) : I("", !0),
					j.value || Ae.value ? (M(), B("div", Ms, [Be(" Latest version: " + z(j.value || "none"), 1), Ae.value ? (M(), B("span", Ns, " | Diff: " + z(Ae.value), 1)) : I("", !0)])) : I("", !0)
				])) : I("", !0),
				P("div", Ps, [
					P("div", Fs, [t[11] ||= P("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Nodes", -1), P("div", Is, z(ft.value.nodes), 1)]),
					P("div", Ls, [t[12] ||= P("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Links", -1), P("div", Rs, z(ft.value.links), 1)]),
					P("div", zs, [t[13] ||= P("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Groups", -1), P("div", Bs, z(ft.value.groups), 1)])
				]),
				P("div", Vs, [P("div", Hs, [P("div", Us, [t[14] ||= P("div", { style: {
					"font-size": "10px",
					"font-weight": "700",
					color: "rgba(255,255,255,0.55)",
					"text-transform": "uppercase",
					"letter-spacing": "0.4px"
				} }, "Category", -1), P("div", {
					title: Xe.value || "Root",
					style: {
						"font-size": "12px",
						color: "rgba(255,255,255,0.8)",
						"margin-top": "2px",
						overflow: "hidden",
						"text-overflow": "ellipsis",
						"white-space": "nowrap",
						"max-width": "100%"
					}
				}, z(Qe.value), 9, Ws)]), $e.value.length ? (M(), B("div", {
					key: 0,
					title: Xe.value,
					style: {
						display: "flex",
						"flex-wrap": "wrap",
						gap: "4px",
						"justify-content": "flex-end",
						"min-width": "0",
						"max-width": "45%"
					}
				}, [(M(!0), B(N, null, F($e.value, (e) => (M(), B("span", {
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
				}, z(e), 1))), 128))], 8, Gs)) : I("", !0)]), P("div", Ks, [Ue(P("input", {
					"onUpdate:modelValue": t[0] ||= (e) => o.value = e,
					type: "text",
					placeholder: R(k)("dialog.workflowCategory", "Workflow category"),
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
				}, null, 8, qs), [[gt, o.value]]), rt(n, {
					type: "button",
					severity: "secondary",
					text: "",
					rounded: "",
					disabled: s.value,
					style: H({
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
					default: ut(() => [Be(z(s.value ? "Saving..." : "Move"), 1)]),
					_: 1
				}, 8, ["disabled", "style"])])]),
				lt.value.length ? (M(), B("div", Js, [
					t[15] ||= P("div", { class: "mjr-section-title" }, " Workflow Nodes ", -1),
					rt(r, {
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
						default: ut(({ node: e }) => [P("span", Ys, [
							P("span", Xs, z(e.label), 1),
							e.data?.type ? (M(), B("span", Zs, z(e.data.type), 1)) : I("", !0),
							P("span", Qs, "#" + z(e.data?.id), 1)
						])]),
						_: 1
					}, 8, ["value"]),
					dt.value ? (M(), B("div", $s, " +" + z(dt.value) + " more nodes ", 1)) : I("", !0)
				])) : I("", !0),
				P("div", ec, [P("div", tc, [(M(!0), B(N, null, F(R(i), (e) => (M(), Ve(n, {
					key: e.key,
					type: "button",
					severity: "secondary",
					text: "",
					rounded: "",
					title: `${e.label} minimap`,
					style: H({
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
					onClick: (t) => Dt(e.key)
				}, {
					default: ut(() => [Be(z(e.label), 1)]),
					_: 2
				}, 1032, [
					"title",
					"style",
					"onClick"
				]))), 128))]), rt(n, {
					type: "button",
					class: "mjr-btn mjr-icon-btn",
					severity: "secondary",
					text: "",
					rounded: "",
					title: R(k)("tooltip.minimapSettings", "Minimap settings"),
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
					onClick: t[1] ||= (e) => h.value = !h.value
				}, {
					default: ut(() => [...t[16] ||= [P("i", { class: "pi pi-sliders-h" }, null, -1)]]),
					_: 1
				}, 8, ["title"])]),
				h.value ? (M(), B("div", nc, [(M(!0), B(N, null, F(ht.value, (e) => (M(), Ve(n, {
					key: e.key,
					type: "button",
					severity: "secondary",
					text: "",
					style: H({
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
					onClick: (t) => Et(e.key)
				}, {
					default: ut(() => [
						P("span", { style: H({
							width: "22px",
							height: "22px",
							borderRadius: "6px",
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							background: y.value?.[e.key] ? "rgba(76,175,80,0.95)" : "rgba(255,255,255,0.08)",
							border: y.value?.[e.key] ? "1px solid rgba(76,175,80,0.35)" : "1px solid rgba(255,255,255,0.12)",
							flex: "0 0 auto"
						}) }, [P("i", {
							class: "pi pi-check",
							style: H({
								fontSize: "12px",
								opacity: y.value?.[e.key] ? "1" : "0"
							})
						}, null, 4)], 4),
						P("i", {
							class: at(e.iconClass),
							style: {
								"font-size": "18px",
								opacity: "0.9",
								width: "18px"
							}
						}, null, 2),
						P("div", rc, [P("div", ic, z(e.label), 1), P("div", ac, z(y.value?.[e.key] ? "On" : "Off"), 1)])
					]),
					_: 2
				}, 1032, ["style", "onClick"]))), 128))])) : I("", !0),
				P("div", oc, [P("canvas", {
					ref_key: "canvasRef",
					ref: a,
					style: H({
						width: "100%",
						height: mt.value,
						cursor: x.value,
						touchAction: "none",
						borderRadius: "10px",
						marginTop: "0",
						background: "linear-gradient(180deg, rgba(7, 12, 18, 0.95) 0%, rgba(10, 16, 24, 0.92) 100%)",
						border: "1px solid var(--mjr-border, rgba(255,255,255,0.12))",
						boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03)"
					}),
					onPointerdown: Ct,
					onPointermove: U,
					onPointerup: W,
					onPointercancel: W,
					onPointerleave: W,
					onWheel: wt,
					onDblclick: Tt
				}, null, 36)]),
				P("div", sc, [P("span", null, z(C.value || "Click/drag to navigate | wheel to zoom"), 1), P("span", null, z(Math.round((b.value.zoom || 1) * 100)) + "% | " + z(pt.value.label), 1)]),
				P("details", {
					open: v.value,
					style: { "margin-top": "10px" },
					onToggle: t[2] ||= (e) => v.value = e.target.open
				}, [t[17] ||= P("summary", { style: {
					cursor: "pointer",
					color: "var(--mjr-muted, rgba(255,255,255,0.65))",
					"font-size": "12px",
					"user-select": "none"
				} }, " Show raw JSON ", -1), P("pre", lc, z(Ye.value), 1)], 40, cc)
			])) : I("", !0);
		};
	}
};
//#endregion
export { ar as C, K as D, Nt as E, or as S, q as T, wr as _, Qr as a, dr as b, Xr as c, Gr as d, Kr as f, X as g, Fr as h, ai as i, Yr as l, Ir as m, Qo as n, $r as o, Lr as p, Ui as r, Jr as s, pc as t, Br as u, Pr as v, Jt as w, mr as x, pr as y };
