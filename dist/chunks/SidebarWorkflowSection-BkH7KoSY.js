import { $ as e, $t as t, Bt as n, C as r, Ct as i, Dt as a, E as o, Et as s, F as c, G as l, Gt as u, H as d, Ht as f, It as p, J as m, K as h, Lt as g, Mt as _, Nt as v, Pt as y, Q as b, Qt as x, St as S, Tt as C, Ut as w, Wt as T, X as ee, Y as te, Z as ne, _t as E, at as re, bt as ie, et as D, gt as ae, it as oe, j as se, jt as ce, kt as le, nt as ue, q as de, rt as fe, vt as pe, wt as me, x as he, xt as ge, yt as _e } from "./viewerRuntimeHosts-B9wQ_Nxj.js";
import { K as ve, N as ye, T as be, c as xe, d as Se, f as Ce, h as we, l as Te, m as O, o as k, p as Ee, pt as De, s as A, u as Oe, y as ke } from "./events-BpkKbGZs.js";
import { A as Ae, D as je, a as Me, g as Ne, h as Pe, i as Fe, t as Ie } from "./mediaFps-CbdE2lHO.js";
import { t as Le } from "./floatingViewerManager-pz1ceTHv.js";
import { A as Re, B as j, C as M, D as ze, E as N, G as Be, H as P, J as Ve, L as He, O as F, R as Ue, S as We, T as I, W as Ge, _ as Ke, a as qe, b as Je, c as Ye, ct as L, d as Xe, dt as R, f as Ze, g as Qe, h as $e, i as et, j as tt, k as z, l as nt, lt as rt, m as it, n as at, nt as B, o as ot, p as st, q as ct, r as lt, s as ut, t as dt, tt as ft, u as pt, ut as V, y as mt } from "./mjr-primevue-n1rsQYJg.js";
import { t as ht } from "./mjr-vue-vendor-D2GeV7Qd.js";
import { a as gt, i as _t, n as vt, o as yt, r as H, t as bt } from "./geninfoParser-DMd9PWlT.js";
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
}, xt = (e, t, n) => {
	let r = typeof e == "string" ? e.trim() : String(e ?? "");
	return t.includes(r) ? r : n;
}, St = (e) => e === "__proto__" || e === "prototype" || e === "constructor", Ct = (e, t) => {
	let n = { ...e };
	return !t || typeof t != "object" || Object.keys(t).forEach((r) => {
		if (St(r)) return;
		let i = t[r];
		i && typeof i == "object" && !Array.isArray(i) ? n[r] = Ct(e[r] || {}, i) : i !== void 0 && (n[r] = i);
	}), n;
}, wt = Object.freeze({
	small: 80,
	medium: 120,
	large: 180
}), Tt = Object.freeze([
	"small",
	"medium",
	"large"
]), Et = (e, t) => Math.max(60, Math.min(600, Math.round(W(e, t)))), Dt = (e = {}) => {
	let t = Number(e?.minSize);
	if (Number.isFinite(t)) return Et(t, A.GRID_MIN_SIZE);
	let n = xt(String(e?.minSizePreset || "").toLowerCase(), Tt, "");
	return n ? wt[n] : Et(e?.minSize, A.GRID_MIN_SIZE);
}, Ot = (e = {}) => Et(e?.minSize, A.FEED_GRID_MIN_SIZE), kt = (e) => {
	let t = Math.round(W(e, A.GRID_MIN_SIZE));
	return t <= 100 ? "small" : t >= 150 ? "large" : "medium";
}, G = {
	debug: {
		safeCall: A.DEBUG_SAFE_CALL,
		safeListeners: A.DEBUG_SAFE_LISTENERS,
		viewer: A.DEBUG_VIEWER
	},
	grid: {
		pageSize: A.DEFAULT_PAGE_SIZE,
		minSize: A.GRID_MIN_SIZE,
		minSizePreset: kt(A.GRID_MIN_SIZE),
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
		let e = we.get(t);
		if (!e) return { ...G };
		let n = JSON.parse(e), r = n && typeof n == "object" && Number.isInteger(n.version) && n.data && typeof n.data == "object";
		if (!r && !(n && typeof n == "object" && !Array.isArray(n))) return { ...G };
		if (r && Number(n.version) > 1) return console.warn("[Majoor] settings schema version is newer than this build, using defaults"), { ...G };
		let i = r ? n.data : n, a = new Set(/* @__PURE__ */ "debug.grid.infiniteScroll.siblings.autoScan.scan.watcher.status.viewer.rtHydrate.observability.feed.sidebar.probeBackend.i18n.paths.db.ratingTagsSync.cache.search.ai.executionGrouping.workflowMinimap.ui.security.safety".split(".")), o = {};
		if (i && typeof i == "object") for (let [e, t] of Object.entries(i)) a.has(e) && (o[e] = t);
		let s = Ct(G, o);
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
		let t = JSON.parse(JSON.stringify(e || {}));
		t?.security && typeof t.security == "object" && (t.security.apiToken = "");
		let n = {
			version: 1,
			data: t
		};
		if (!we.set("mjrSettings", JSON.stringify(n))) throw Error("SettingsStore rejected the write");
	} catch (e) {
		console.warn("[Majoor] settings save failed", e);
		try {
			let e = Date.now();
			e - (Number(window?._mjrSettingsSaveFailAt || 0) || 0) > 3e4 && (window._mjrSettingsSaveFailAt = e, je(O("dialog.settingsSaveFailed", "Majoor: Failed to save settings (browser storage full or blocked).")));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			Ae("mjr-settings-save-failed", { error: String(e?.message || e || "") }, { warnPrefix: "[Majoor]" });
		} catch (e) {
			console.debug?.(e);
		}
	}
}, J = (e) => {
	let t = Number(A.MAX_PAGE_SIZE) || 2e3;
	k.DEFAULT_PAGE_SIZE = Math.max(50, Math.min(t, Number(e.grid?.pageSize) || A.DEFAULT_PAGE_SIZE)), k.AUTO_SCAN_ON_STARTUP = !!e.autoScan?.onStartup, k.EXECUTION_GROUPING_ENABLED = !!(e.executionGrouping?.enabled ?? A.EXECUTION_GROUPING_ENABLED), k.STATUS_POLL_INTERVAL = Math.max(1e3, Number(e.status?.pollInterval) || A.STATUS_POLL_INTERVAL), k.DEBUG_SAFE_CALL = !!e.debug?.safeCall, k.DEBUG_SAFE_LISTENERS = !!e.debug?.safeListeners, k.DEBUG_VIEWER = !!e.debug?.viewer, k.GRID_MIN_SIZE = Dt(e.grid), k.FEED_GRID_MIN_SIZE = Ot(e.feed), k.GRID_GAP = Math.max(0, Math.min(40, Math.round(W(e.grid?.gap, A.GRID_GAP)))), k.GRID_SHOW_BADGES_EXTENSION = !!(e.grid?.showExtBadge ?? A.GRID_SHOW_BADGES_EXTENSION), k.GRID_SHOW_BADGES_RATING = !!(e.grid?.showRatingBadge ?? A.GRID_SHOW_BADGES_RATING), k.GRID_SHOW_BADGES_TAGS = !!(e.grid?.showTagsBadge ?? A.GRID_SHOW_BADGES_TAGS), k.GRID_SHOW_DETAILS = !!(e.grid?.showDetails ?? A.GRID_SHOW_DETAILS), k.GRID_SHOW_DETAILS_FILENAME = !!(e.grid?.showFilename ?? A.GRID_SHOW_DETAILS_FILENAME), k.GRID_SHOW_DETAILS_DATE = !!(e.grid?.showDate ?? A.GRID_SHOW_DETAILS_DATE), k.GRID_SHOW_DETAILS_DIMENSIONS = !!(e.grid?.showDimensions ?? A.GRID_SHOW_DETAILS_DIMENSIONS), k.GRID_SHOW_DETAILS_GENTIME = !!(e.grid?.showGenTime ?? A.GRID_SHOW_DETAILS_GENTIME), k.GRID_SHOW_HOVER_INFO = !!(e.grid?.showHoverInfo ?? A.GRID_SHOW_HOVER_INFO), k.GRID_SHOW_WORKFLOW_DOT = !!(e.grid?.showWorkflowDot ?? A.GRID_SHOW_WORKFLOW_DOT);
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
	k.INFINITE_SCROLL_ENABLED = !!e.infiniteScroll?.enabled, k.INFINITE_SCROLL_ROOT_MARGIN = String(e.infiniteScroll?.rootMargin || A.INFINITE_SCROLL_ROOT_MARGIN), k.INFINITE_SCROLL_THRESHOLD = Math.max(0, Math.min(1, W(e.infiniteScroll?.threshold, A.INFINITE_SCROLL_THRESHOLD))), k.BOTTOM_GAP_PX = Math.max(0, Math.min(5e3, Math.round(W(e.infiniteScroll?.bottomGapPx, A.BOTTOM_GAP_PX)))), k.VIEWER_ALLOW_PAN_AT_ZOOM_1 = !!e.viewer?.allowPanAtZoom1, k.VIEWER_DISABLE_WEBGL_VIDEO = !!e.viewer?.disableWebGL, k.VIEWER_PAUSE_DURING_EXECUTION = !!(e.viewer?.pauseDuringExecution ?? A.VIEWER_PAUSE_DURING_EXECUTION), k.FLOATING_VIEWER_PAUSE_DURING_EXECUTION = !!(e.viewer?.floatingPauseDuringExecution ?? A.FLOATING_VIEWER_PAUSE_DURING_EXECUTION), k.MFV_LIVE_DEFAULT = e.viewer?.mfvLiveDefault ?? A.MFV_LIVE_DEFAULT, k.MFV_PREVIEW_DEFAULT = e.viewer?.mfvPreviewDefault ?? A.MFV_PREVIEW_DEFAULT, k.MFV_LIVE_AUTO_OPEN = !1, k.MFV_PREVIEW_AUTO_OPEN = !1, k.MFV_NODE_STREAM_AUTO_OPEN = !1;
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
	k.VIEWER_VIDEO_GRADE_THROTTLE_FPS = Math.max(1, Math.min(60, Math.round(W(e.viewer?.videoGradeThrottleFps, A.VIEWER_VIDEO_GRADE_THROTTLE_FPS)))), k.VIEWER_SCOPES_FPS = Math.max(1, Math.min(60, Math.round(W(e.viewer?.scopesFps, A.VIEWER_SCOPES_FPS)))), k.VIEWER_META_TTL_MS = Math.max(1e3, Math.min(10 * 6e4, Math.round(W(e.viewer?.metaTtlMs, A.VIEWER_META_TTL_MS)))), k.VIEWER_META_MAX_ENTRIES = Math.max(50, Math.min(5e3, Math.round(W(e.viewer?.metaMaxEntries, A.VIEWER_META_MAX_ENTRIES)))), k.WORKFLOW_MINIMAP_ENABLED = !!(e.workflowMinimap?.enabled ?? A.WORKFLOW_MINIMAP_ENABLED), k.RT_HYDRATE_CONCURRENCY = Math.max(1, Math.min(16, Math.round(W(e.rtHydrate?.concurrency, A.RT_HYDRATE_CONCURRENCY)))), k.RT_HYDRATE_QUEUE_MAX = Math.max(10, Math.min(5e3, Math.round(W(e.rtHydrate?.queueMax, A.RT_HYDRATE_QUEUE_MAX)))), k.RT_HYDRATE_SEEN_MAX = Math.max(1e3, Math.min(2e5, Math.round(W(e.rtHydrate?.seenMax, A.RT_HYDRATE_SEEN_MAX)))), k.RT_HYDRATE_PRUNE_BUDGET = Math.max(10, Math.min(1e4, Math.round(W(e.rtHydrate?.pruneBudget, A.RT_HYDRATE_PRUNE_BUDGET)))), k.RT_HYDRATE_SEEN_TTL_MS = Math.max(5e3, Math.min(360 * 6e4, Math.round(W(e.rtHydrate?.seenTtlMs, A.RT_HYDRATE_SEEN_TTL_MS)))), k.DELETE_CONFIRMATION = !!e.safety?.confirmDeletion, k.DEBUG_VERBOSE_ERRORS = !!e.observability?.verboseErrors, k.WATCHER_MAX_PENDING = Math.max(10, Math.min(5e3, Math.round(W(e.watcher?.maxPending, 500)))), k.WATCHER_MIN_SIZE = Math.max(0, Math.min(1e6, Math.round(W(e.watcher?.minSize, 100)))), k.WATCHER_MAX_SIZE = Math.max(1e5, Math.min(17179869184, Math.round(W(e.watcher?.maxSize, 4294967296)))), k.DB_TIMEOUT_MS = Math.max(1e3, Math.min(3e4, Math.round(W(e.db?.timeoutMs, 5e3)))), k.DB_MAX_CONNECTIONS = Math.max(1, Math.min(100, Math.round(W(e.db?.maxConnections, 10)))), k.DB_QUERY_TIMEOUT_MS = Math.max(500, Math.min(1e4, Math.round(W(e.db?.queryTimeoutMs, 1e3)))), k.SIDEBAR_ASSET_BADGE_ENABLED = !!(e.sidebar?.assetBadgeEnabled ?? A.SIDEBAR_ASSET_BADGE_ENABLED), k.SEARCH_REQUEST_LIMIT = Math.max(10, Math.min(A.MAX_PAGE_SIZE || 2e3, Math.round(W(e.search?.maxResults, A.SEARCH_DEFAULT_LIMIT))));
};
async function At() {
	try {
		let t = await e();
		if (!t?.ok) return;
		let n = t.data?.prefs;
		if (!n || typeof n != "object") return;
		let r = K();
		if (r.security = r.security || {}, r.security.safeMode = U(n.safe_mode, r.security.safeMode), r.security.allowWrite = U(n.allow_write, r.security.allowWrite), r.security.requireAuth = U(n.require_auth, r.security.requireAuth), r.security.allowRemoteWrite = U(n.allow_remote_write, r.security.allowRemoteWrite), r.security.allowInsecureTokenTransport = U(n.allow_insecure_token_transport, r.security.allowInsecureTokenTransport), r.security.allowDelete = U(n.allow_delete, r.security.allowDelete), r.security.allowRename = U(n.allow_rename, r.security.allowRename), r.security.allowOpenInFolder = U(n.allow_open_in_folder, r.security.allowOpenInFolder), r.security.allowResetIndex = U(n.allow_reset_index, r.security.allowResetIndex), r.security.tokenConfigured = U(n.token_configured, r.security.tokenConfigured), r.security.tokenHint = String(n.token_hint || "").trim(), !String(r.security.apiToken || "").trim()) try {
			let e = await c(), t = String(e?.data?.token || "").trim();
			e?.ok && t && w(t);
		} catch (e) {
			console.debug?.(e);
		}
		q(r), J(r), Ae("mjr-settings-changed", { key: "security" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend security settings", e);
	}
}
async function jt() {
	try {
		let e = await ue();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = K();
		n.ai = n.ai || {}, n.ai.vectorSearchEnabled = U(t.enabled, n.ai.vectorSearchEnabled ?? !0), n.ai.vectorCaptionOnIndex = U(t.caption_on_index ?? t.captionOnIndex, n.ai.vectorCaptionOnIndex ?? !1), n.ai.vectorIndexOnScan = U(t.index_on_scan ?? t.indexOnScan, n.ai.vectorIndexOnScan ?? !1), n.ai.vectorUnloadAfterUse = U(t.unload_after_use ?? t.unloadAfterUse, n.ai.vectorUnloadAfterUse ?? !1), n.ai.vectorConcurrency = Math.max(1, Math.min(16, Math.floor(Number(t.concurrency ?? n.ai.vectorConcurrency ?? 1) || 1))), q(n), J(n), Ae("mjr-settings-changed", { key: "ai.vectorSearch" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend vector search settings", e);
	}
}
async function Mt() {
	try {
		let e = await l();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = K();
		n.executionGrouping = n.executionGrouping || {}, n.executionGrouping.enabled = U(t.enabled, n.executionGrouping.enabled ?? A.EXECUTION_GROUPING_ENABLED), q(n), J(n), Ae("mjr-settings-changed", { key: "executionGrouping.enabled" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend execution grouping settings", e);
	}
}
//#endregion
//#region ui/app/settings/settingsRuntime.ts
var Nt = "mjr-runtime-status-dashboard", Pt = 3e4;
function Ft() {
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
function It() {
	try {
		document.getElementById(Nt)?.remove?.();
	} catch (e) {
		console.debug?.(e);
	}
}
function Lt() {
	try {
		window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ && (clearTimeout(window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__), window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ = null);
	} catch (e) {
		console.debug?.(e);
	}
}
function Rt(e, t) {
	let n = t === "auth" ? "__mjrAuthLine" : "__mjrMetricsLine";
	if (e?.[n]) return e[n];
	let r = document.createElement("div");
	return r.style.whiteSpace = "nowrap", r.style.lineHeight = "1.35", t === "auth" && (r.style.marginTop = "4px", r.style.fontWeight = "600"), e.appendChild(r), e[n] = r, r;
}
function zt(e) {
	let t = String(e?.token_hint || "").trim(), n = f(), r = t || (n ? "(session)" : ""), i = e?.allow_write !== !1, a = e?.require_auth === !0, o = e?.token_configured === !0;
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
function Bt() {
	try {
		if (Ft() === "hidden" || window.__MJR_RUNTIME_STATUS_HIDDEN__) return It(), null;
		let e = document.querySelector(".mjr-assets-manager.mjr-am-container"), t = document.getElementById(Nt);
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
		let n = document.getElementById(Nt);
		return n ? n.parentElement !== e && e.appendChild(n) : (n = document.createElement("div"), n.id = Nt, n.style.position = "absolute", n.style.bottom = "10px", n.style.right = "10px", n.style.zIndex = "9999", n.style.padding = "6px 10px", n.style.borderRadius = "10px", n.style.border = "1px solid rgba(255,255,255,0.16)", n.style.background = "rgba(0,0,0,0.45)", n.style.backdropFilter = "blur(4px)", n.style.color = "var(--content-fg, #fff)", n.style.fontSize = "11px", n.style.pointerEvents = "none", n.style.display = "flex", n.style.flexDirection = "column", e.appendChild(n)), n;
	} catch {
		return null;
	}
}
async function Vt() {
	let t = Bt();
	if (!t) return !1;
	let n = Rt(t, "metrics"), r = Rt(t, "auth");
	try {
		let [i, a] = await Promise.all([b(), e()]), o = O("runtime.unavailable", "Runtime: unavailable");
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
		let s = zt(a?.data?.prefs || null);
		return r.textContent = s.text, r.style.color = s.color, t.title = `${o}\n${s.text}`, !0;
	} catch {
		return n.textContent = O("runtime.unavailable", "Runtime: unavailable"), r.textContent = O("runtime.writeAuthUnknown", "Write auth: unknown"), r.style.color = "#c8ced8", t.title = `${O("runtime.unavailable", "Runtime: unavailable")}\n${r.textContent}`, !0;
	}
}
function Ht() {
	try {
		let e = Ft();
		if (e === "hidden") {
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = !0, Lt(), It();
			return;
		}
		window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__ || (window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__ = (e) => {
			if (e?.detail?.key !== "observability.runtimeDashboardMode") return;
			let t = Ft();
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = t === "hidden", Lt(), It(), t !== "hidden" && Ht();
		}, window.addEventListener?.("mjr-settings-changed", window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__)), window.__MJR_RUNTIME_STATUS_HIDDEN__ = !1, Lt(), e === "autoHide30" && (window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ = setTimeout(() => {
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = !0, It();
		}, Pt)), Vt().catch(() => {}), window.__MJR_RUNTIME_STATUS_INFLIGHT__ ?? (window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !1), window.__MJR_RUNTIME_STATUS_MISS_COUNT__ ?? (window.__MJR_RUNTIME_STATUS_MISS_COUNT__ = 0), window.__MJR_RUNTIME_STATUS_INTERVAL__ || (window.__MJR_RUNTIME_STATUS_INTERVAL__ = setInterval(() => {
			window.__MJR_RUNTIME_STATUS_INFLIGHT__ || (window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !0, Vt().then((e) => {
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
var Ut = 300;
function Wt(e, t = Ut) {
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
var Y = "Majoor", Gt = "Majoor Assets Manager";
function Kt(e, t, n) {
	let r = (e, t) => [
		Gt,
		e,
		t
	], i = (e) => [
		Gt,
		O("cat.cards", "Cards"),
		e
	], a = (e) => [
		Gt,
		O("cat.badges", "Badges"),
		e
	], o = (e) => [
		Gt,
		O("cat.badges", "Badges"),
		e
	], s = (e, t) => {
		let n = String(e || "").trim();
		return /^[0-9a-fA-F]{6}$/.test(n) && (n = `#${n}`), /^#[0-9a-fA-F]{6}$/.test(n) ? n.toUpperCase() : t;
	};
	t.grid?.minSizePreset || (t.grid = t.grid || {}, t.grid.minSizePreset = kt(t.grid.minSize), q(t)), e({
		id: `${Y}.Cards.ThumbSize`,
		category: i(O("setting.grid.cardSize.group", "Card size")),
		name: O("setting.grid.cardSize.name", "Majoor: Card Size"),
		tooltip: O("setting.grid.cardSize.desc", "Choose the card size preset used by the grid layout."),
		type: "combo",
		defaultValue: (() => {
			let e = xt(String(t.grid?.minSizePreset || "").toLowerCase(), Tt, kt(t.grid?.minSize)), n = {
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
			r === i || r === "small" || r === "petit" ? s = "small" : r === o || r === "large" || r === "grand" ? s = "large" : (r === a || r === "medium" || r === "moyen") && (s = "medium"), t.grid.minSizePreset = s, t.grid.minSize = wt[s], q(t), J(t), n("grid.minSizePreset");
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
			t.grid.minSize = r, t.grid.minSizePreset = kt(r), q(t), J(t), n("grid.minSize");
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
		defaultValue: !!(t.grid?.showGenTime ?? A.GRID_SHOW_DETAILS_GENTIME),
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
		category: o(O("setting.starColor", "Star color")),
		name: O("setting.starColor", "Majoor: Star color"),
		tooltip: O("setting.starColor.tooltip", "Color of rating stars on thumbnails (hex, e.g. #FFD45A)"),
		type: "color",
		defaultValue: s(t.grid?.starColor, A.BADGE_STAR_COLOR),
		onChange: (e) => {
			t.grid.starColor = s(e, A.BADGE_STAR_COLOR), q(t), J(t), n("grid.starColor");
		}
	}), e({
		id: `${Y}.Badges.ImageColor`,
		category: o(O("setting.badgeImageColor", "Image badge color")),
		name: O("setting.badgeImageColor", "Majoor: Image badge color"),
		tooltip: O("setting.badgeImageColor.tooltip", "Color for image badges: PNG, JPG, WEBP, GIF, BMP, TIF (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeImageColor, A.BADGE_IMAGE_COLOR),
		onChange: (e) => {
			t.grid.badgeImageColor = s(e, A.BADGE_IMAGE_COLOR), q(t), J(t), n("grid.badgeImageColor");
		}
	}), e({
		id: `${Y}.Badges.VideoColor`,
		category: o(O("setting.badgeVideoColor", "Video badge color")),
		name: O("setting.badgeVideoColor", "Majoor: Video badge color"),
		tooltip: O("setting.badgeVideoColor.tooltip", "Color for video badges: MP4, WEBM, MOV, AVI, MKV (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeVideoColor, A.BADGE_VIDEO_COLOR),
		onChange: (e) => {
			t.grid.badgeVideoColor = s(e, A.BADGE_VIDEO_COLOR), q(t), J(t), n("grid.badgeVideoColor");
		}
	}), e({
		id: `${Y}.Badges.AudioColor`,
		category: o(O("setting.badgeAudioColor", "Audio badge color")),
		name: O("setting.badgeAudioColor", "Majoor: Audio badge color"),
		tooltip: O("setting.badgeAudioColor.tooltip", "Color for audio badges: MP3, WAV, OGG, FLAC (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeAudioColor, A.BADGE_AUDIO_COLOR),
		onChange: (e) => {
			t.grid.badgeAudioColor = s(e, A.BADGE_AUDIO_COLOR), q(t), J(t), n("grid.badgeAudioColor");
		}
	}), e({
		id: `${Y}.Badges.Model3dColor`,
		category: o(O("setting.badgeModel3dColor", "3D model badge color")),
		name: O("setting.badgeModel3dColor", "Majoor: 3D model badge color"),
		tooltip: O("setting.badgeModel3dColor.tooltip", "Color for 3D model badges: OBJ, FBX, GLB, GLTF (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeModel3dColor, A.BADGE_MODEL3D_COLOR),
		onChange: (e) => {
			t.grid.badgeModel3dColor = s(e, A.BADGE_MODEL3D_COLOR), q(t), J(t), n("grid.badgeModel3dColor");
		}
	}), e({
		id: `${Y}.Badges.DuplicateAlertColor`,
		category: o(O("setting.badgeDuplicateAlertColor", "Duplicate alert badge color")),
		name: O("setting.badgeDuplicateAlertColor", "Majoor: Duplicate alert badge color"),
		tooltip: O("setting.badgeDuplicateAlertColor.tooltip", "Color for duplicate extension badges (PNG+, JPG+, etc)."),
		type: "color",
		defaultValue: s(t.grid?.badgeDuplicateAlertColor, A.BADGE_DUPLICATE_ALERT_COLOR),
		onChange: (e) => {
			t.grid.badgeDuplicateAlertColor = s(e, A.BADGE_DUPLICATE_ALERT_COLOR), q(t), J(t), n("grid.badgeDuplicateAlertColor");
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
			max: Number(k.MAX_PAGE_SIZE) || 2e3,
			step: 50
		},
		onChange: (e) => {
			let r = Number(k.MAX_PAGE_SIZE) || 2e3;
			t.grid.pageSize = Math.max(50, Math.min(r, Number(e) || A.DEFAULT_PAGE_SIZE)), q(t), J(t), n("grid.pageSize");
		}
	}), e({
		id: `${Y}.Grid.WorkflowGroupBy`,
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
			t.grid = t.grid || {}, t.grid.workflowGroupBy = r, q(t), J(t), n("grid.workflowGroupBy");
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
		id: `${Y}.Sidebar.AssetBadgeEnabled`,
		category: r(O("cat.grid"), "Sidebar asset notification badge"),
		name: "Show new asset badge on sidebar icon",
		tooltip: "Display a small counter on the Majoor sidebar icon only when a new asset is indexed by Assets Manager.",
		type: "boolean",
		defaultValue: !!(t.sidebar?.assetBadgeEnabled ?? A.SIDEBAR_ASSET_BADGE_ENABLED),
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.assetBadgeEnabled = !!e, q(t), J(t), n("sidebar.assetBadgeEnabled");
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
var qt = "Majoor", Jt = "Majoor Assets Manager";
function Yt(e, t, n) {
	let r = (e, t) => [
		Jt,
		e,
		t
	], i = (e) => r(O("cat.viewer", "Viewer"), e), a = (e) => r(O("cat.floatingViewer", "Floating Viewer"), e);
	e({
		id: `${qt}.Viewer.AllowPanAtZoom1`,
		category: i(O("setting.viewer.pan.name").replace("Majoor: ", "")),
		name: O("setting.viewer.pan.name"),
		tooltip: O("setting.viewer.pan.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.allowPanAtZoom1,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.allowPanAtZoom1 = !!e, q(t), J(t), n("viewer.allowPanAtZoom1");
		}
	}), e({
		id: `${qt}.Viewer.DisableWebGL`,
		category: i("Disable WebGL Video"),
		name: "Disable WebGL Video",
		tooltip: "Use CPU rendering (Canvas 2D) for video playback. Fixes 'black screen' issues on incompatible hardware/browsers.",
		type: "boolean",
		defaultValue: !!t.viewer?.disableWebGL,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.disableWebGL = !!e, q(t), J(t), n("viewer.disableWebGL");
		}
	}), e({
		id: `${qt}.Viewer.PauseDuringExecution`,
		category: i(O("setting.viewer.pauseExecution.name").replace("Majoor: ", "")),
		name: O("setting.viewer.pauseExecution.name"),
		tooltip: O("setting.viewer.pauseExecution.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.pauseDuringExecution,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.pauseDuringExecution = !!e, q(t), J(t), n("viewer.pauseDuringExecution");
		}
	}), e({
		id: `${qt}.Viewer.FloatingPauseDuringExecution`,
		category: a(O("setting.viewer.floatingPauseExecution.name").replace("Majoor: ", "")),
		name: O("setting.viewer.floatingPauseExecution.name"),
		tooltip: O("setting.viewer.floatingPauseExecution.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.floatingPauseDuringExecution,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.floatingPauseDuringExecution = !!e, q(t), J(t), n("viewer.floatingPauseDuringExecution");
		}
	}), e({
		id: `${qt}.Viewer.MfvLiveDefault`,
		category: a(O("setting.viewer.mfvLiveDefault.name").replace("Majoor: ", "")),
		name: O("setting.viewer.mfvLiveDefault.name"),
		tooltip: O("setting.viewer.mfvLiveDefault.desc"),
		type: "boolean",
		defaultValue: !!(t.viewer?.mfvLiveDefault ?? A.MFV_LIVE_DEFAULT),
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.mfvLiveDefault = !!e, q(t), J(t), n("viewer.mfvLiveDefault");
		}
	}), e({
		id: `${qt}.Viewer.MfvPreviewDefault`,
		category: a(O("setting.viewer.mfvPreviewDefault.name").replace("Majoor: ", "")),
		name: O("setting.viewer.mfvPreviewDefault.name"),
		tooltip: O("setting.viewer.mfvPreviewDefault.desc"),
		type: "boolean",
		defaultValue: !!(t.viewer?.mfvPreviewDefault ?? A.MFV_PREVIEW_DEFAULT),
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.mfvPreviewDefault = !!e, q(t), J(t), n("viewer.mfvPreviewDefault");
		}
	}), e({
		id: `${qt}.Viewer.MfvSidebarPosition`,
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
		id: `${qt}.Viewer.MfvPreviewMethod`,
		category: a(O("setting.viewer.mfvPreviewMethod.name").replace("Majoor: ", "")),
		name: O("setting.viewer.mfvPreviewMethod.name"),
		tooltip: O("setting.viewer.mfvPreviewMethod.desc"),
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
			t.viewer = t.viewer || {}, t.viewer.mfvPreviewMethod = r, q(t), J(t), n("viewer.mfvPreviewMethod");
		}
	}), e({
		id: `${qt}.Viewer.LtxavRgbFallback`,
		category: a("LTXAV preview fallback"),
		name: "Majoor: LTXAV RGB Preview Fallback (experimental)",
		tooltip: "Reuse LTXV RGB projection for LTXAV when native latent preview is unavailable. Experimental; quality may be approximate.",
		type: "boolean",
		defaultValue: !!t.viewer?.ltxavRgbFallback,
		onChange: async (e) => {
			let r = !!e, i = !!t.viewer?.ltxavRgbFallback;
			t.viewer = t.viewer || {}, t.viewer.ltxavRgbFallback = r, q(t), J(t), n("viewer.ltxavRgbFallback");
			try {
				let e = await ie(r);
				if (!e?.ok) throw Error(e?.error || "Failed to update LTXAV RGB preview fallback setting");
			} catch (e) {
				t.viewer.ltxavRgbFallback = i, q(t), J(t), n("viewer.ltxavRgbFallback"), T(e?.message || "Failed to update LTXAV RGB preview fallback setting", "error");
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
			id: `${qt}.WorkflowMinimap.${r}`,
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
var Xt = "Majoor", Zt = "Majoor Assets Manager";
function Qt(e, t, n) {
	let r = (e, t) => [
		Zt,
		e,
		t
	];
	e({
		id: `${Xt}.ExecutionGrouping.Enabled`,
		category: r(O("cat.scanning"), "Execution grouping"),
		name: "Execution job/stack grouping",
		tooltip: "Enable or disable all live job_id / stack_id tracking, grouping, and stack finalization logic.",
		type: "boolean",
		defaultValue: !!(t.executionGrouping?.enabled ?? A.EXECUTION_GROUPING_ENABLED),
		onChange: async (e) => {
			let r = !!(t.executionGrouping?.enabled ?? A.EXECUTION_GROUPING_ENABLED), i = !!e;
			t.executionGrouping = t.executionGrouping || {}, t.executionGrouping.enabled = i, q(t), J(t), n("executionGrouping.enabled");
			try {
				let e = await E(i);
				if (!e?.ok) throw Error(e?.error || "Failed to update execution grouping setting");
				t.executionGrouping.enabled = !!e?.data?.prefs?.enabled, q(t), J(t), n("executionGrouping.enabled");
			} catch (e) {
				t.executionGrouping.enabled = r, q(t), J(t), n("executionGrouping.enabled"), T(e?.message || "Failed to update execution grouping setting", "error");
			}
		}
	}), e({
		id: `${Xt}.AutoScan.OnStartup`,
		category: r(O("cat.scanning"), O("setting.scan.startup.name").replace("Majoor: ", "")),
		name: O("setting.scan.startup.name"),
		tooltip: O("setting.scan.startup.desc"),
		type: "boolean",
		defaultValue: !!t.autoScan?.onStartup,
		onChange: (e) => {
			t.autoScan = t.autoScan || {}, t.autoScan.onStartup = !!e, q(t), J(t), n("autoScan.onStartup");
		}
	}), e({
		id: `${Xt}.Scan.FastMode`,
		category: r(O("cat.scanning"), "Scan mode"),
		name: "Fast scan mode",
		tooltip: "Use fast scan mode for manual backfill scans (skip heavier metadata work during scan).",
		type: "boolean",
		defaultValue: !!(t.scan?.fastMode ?? !0),
		onChange: (e) => {
			t.scan = t.scan || {}, t.scan.fastMode = !!e, q(t), n("scan.fastMode");
		}
	}), e({
		id: `${Xt}.RtHydrate.Concurrency`,
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
			t.rtHydrate = t.rtHydrate || {}, t.rtHydrate.concurrency = Math.max(1, Math.min(20, Math.round(W(e, A.RT_HYDRATE_CONCURRENCY || 5)))), q(t), J(t), n("rtHydrate.concurrency");
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
		r.length && (q(t), r.forEach((e) => n(e)));
	}, o = async () => {
		try {
			let e = await fe();
			if (!e?.ok) return;
			a(e.data || {});
		} catch (e) {
			console.debug?.(e);
		}
	};
	e({
		id: `${Xt}.Watcher.Enabled`,
		category: r(O("cat.scanning"), O("setting.watcher.enabled.label", "Enable watcher")),
		name: O("setting.watcher.name"),
		tooltip: O("setting.watcher.desc") + " (env: MJR_ENABLE_WATCHER)",
		type: "boolean",
		defaultValue: !!t.watcher?.enabled,
		onChange: async (e) => {
			t.watcher = t.watcher || {}, t.watcher.enabled = !!e, q(t), n("watcher.enabled");
			try {
				let r = await ce(!!e);
				r?.ok || (t.watcher.enabled = !e, q(t), n("watcher.enabled"), T(r?.error || O("toast.failedToggleWatcher", "Failed to toggle watcher"), "error"));
			} catch {
				t.watcher.enabled = !e, q(t), n("watcher.enabled");
			}
		}
	}), e({
		id: `${Xt}.Watcher.DebounceDelay`,
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
				t.watcher = t.watcher || {}, t.watcher.debounceMs = a, q(t);
				try {
					let e = await v({ debounce_ms: a });
					if (!e?.ok) throw Error(e?.error || O("setting.watcher.debounce.error"));
					let r = Math.round(Number(e?.data?.debounce_ms ?? a));
					t.watcher.debounceMs = r, q(t), n("watcher.debounceMs");
				} catch (e) {
					t.watcher.debounceMs = o, q(t), n("watcher.debounceMs"), T(e?.message || O("setting.watcher.debounce.error"), "error");
				}
			}
		}
	}), e({
		id: `${Xt}.Watcher.DedupeWindow`,
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
				t.watcher = t.watcher || {}, t.watcher.dedupeTtlMs = a, q(t);
				try {
					let e = await v({ dedupe_ttl_ms: a });
					if (!e?.ok) throw Error(e?.error || O("setting.watcher.dedupe.error"));
					let r = Math.round(Number(e?.data?.dedupe_ttl_ms ?? a));
					t.watcher.dedupeTtlMs = r, q(t), n("watcher.dedupeTtlMs");
				} catch (e) {
					t.watcher.dedupeTtlMs = o, q(t), n("watcher.dedupeTtlMs"), T(e?.message || O("setting.watcher.dedupe.error"), "error");
				}
			}
		}
	}), e({
		id: `${Xt}.Watcher.MaxPending`,
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
			t.watcher = t.watcher || {}, t.watcher.maxPending = Math.max(10, Math.min(5e3, Math.round(W(e, 500)))), q(t), J(t), n("watcher.maxPending");
		}
	}), e({
		id: `${Xt}.Watcher.MinSize`,
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
			t.watcher = t.watcher || {}, t.watcher.minSize = Math.max(0, Math.min(1e6, Math.round(W(e, 100)))), q(t), J(t), n("watcher.minSize");
		}
	}), e({
		id: `${Xt}.Watcher.MaxSize`,
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
			t.watcher = t.watcher || {}, t.watcher.maxSize = Math.max(1e5, Math.min(17179869184, Math.round(W(e, 4294967296)))), q(t), J(t), n("watcher.maxSize");
		}
	});
	try {
		o().catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	e({
		id: `${Xt}.RatingTagsSync.Enabled`,
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
var $t = "Majoor", en = "Majoor Assets Manager";
function tn(e, t, n) {
	let r = (e) => [
		en,
		O("cat.feed", "Generated Feed"),
		e
	], i = () => {
		t.feed = t.feed || {};
	};
	e({
		id: `${$t}.Feed.CardSize`,
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
		id: `${$t}.Feed.ShowInfo`,
		category: r("Show info section"),
		name: "Show card info section",
		tooltip: "Show or hide the entire info section (filename, metadata, dots) below thumbnails in the Generated Feed.",
		type: "boolean",
		defaultValue: !!(t.feed?.showInfo ?? A.FEED_SHOW_INFO),
		onChange: (e) => {
			i(), t.feed.showInfo = !!e, q(t), J(t), n("feed.showInfo");
		}
	}), e({
		id: `${$t}.Feed.ShowFilename`,
		category: r("Show filename"),
		name: "Show filename",
		tooltip: "Display the filename on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showFilename ?? A.FEED_SHOW_FILENAME),
		onChange: (e) => {
			i(), t.feed.showFilename = !!e, q(t), J(t), n("feed.showFilename");
		}
	}), e({
		id: `${$t}.Feed.ShowDimensions`,
		category: r("Show dimensions"),
		name: "Show dimensions",
		tooltip: "Display resolution (WxH) and duration on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDimensions ?? A.FEED_SHOW_DIMENSIONS),
		onChange: (e) => {
			i(), t.feed.showDimensions = !!e, q(t), J(t), n("feed.showDimensions");
		}
	}), e({
		id: `${$t}.Feed.ShowDate`,
		category: r("Show date/time"),
		name: "Show date/time",
		tooltip: "Display date and time on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDate ?? A.FEED_SHOW_DATE),
		onChange: (e) => {
			i(), t.feed.showDate = !!e, q(t), J(t), n("feed.showDate");
		}
	}), e({
		id: `${$t}.Feed.ShowGenTime`,
		category: r("Show generation time"),
		name: "Show generation time",
		tooltip: "Display the generation time badge on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showGenTime ?? A.FEED_SHOW_GENTIME),
		onChange: (e) => {
			i(), t.feed.showGenTime = !!e, q(t), J(t), n("feed.showGenTime");
		}
	}), e({
		id: `${$t}.Feed.ShowWorkflowDot`,
		category: r("Show workflow dot"),
		name: "Show workflow indicator",
		tooltip: "Display the workflow availability dot on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showWorkflowDot ?? A.FEED_SHOW_WORKFLOW_DOT),
		onChange: (e) => {
			i(), t.feed.showWorkflowDot = !!e, q(t), J(t), n("feed.showWorkflowDot");
		}
	}), e({
		id: `${$t}.Feed.ShowExtBadge`,
		category: r("Show format badges"),
		name: "Show format badges",
		tooltip: "Display format badges (e.g. JPG, MP4) on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showExtBadge ?? A.FEED_SHOW_BADGES_EXTENSION),
		onChange: (e) => {
			i(), t.feed.showExtBadge = !!e, q(t), J(t), n("feed.showExtBadge");
		}
	}), e({
		id: `${$t}.Feed.ShowRatingBadge`,
		category: r("Show rating badges"),
		name: "Show ratings",
		tooltip: "Display star ratings on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showRatingBadge ?? A.FEED_SHOW_BADGES_RATING),
		onChange: (e) => {
			i(), t.feed.showRatingBadge = !!e, q(t), J(t), n("feed.showRatingBadge");
		}
	}), e({
		id: `${$t}.Feed.ShowTagsBadge`,
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
var nn = "Majoor", rn = "Majoor Assets Manager", an = 16, on = {
	safeMode: !1,
	allowWrite: !0,
	allowDelete: !0,
	allowRename: !0,
	allowOpenInFolder: !0,
	allowResetIndex: !0
};
function sn(e) {
	return !!e;
}
function cn(e, t) {
	return sn(e) === sn(t);
}
function ln(e) {
	return typeof e == "string" ? e.trim() : "";
}
function un(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "localhost" || t === "127.0.0.1" || t === "::1";
}
function dn() {
	return globalThis.location || globalThis.window?.location || null;
}
function fn() {
	let e = dn();
	if (!e) return !1;
	let t = String(e.protocol || "").toLowerCase(), n = String(e.hostname || "").trim();
	return t === "http:" && !un(n);
}
function pn(e) {
	let t = globalThis.crypto;
	if (!t?.getRandomValues) throw Error("Secure token generation requires crypto.getRandomValues().");
	return t.getRandomValues(e);
}
function mn(e) {
	let t = Math.max(4, Number(e) || 0), n = new Uint8Array(t);
	return pn(n), Array.from(n, (e) => e.toString(16).padStart(2, "0")).join("");
}
function hn() {
	return `mjr_${mn(18)}`;
}
function gn(e) {
	return String(e?.apiToken || "").trim().length >= an && U(e?.allowWrite, !0) && U(e?.requireAuth, !1) && !U(e?.allowRemoteWrite, !1);
}
function _n(e) {
	let t = String((e && typeof e == "object" ? e : {}).apiToken || "").trim();
	return {
		apiToken: t.length >= an ? t : hn(),
		allowWrite: !0,
		requireAuth: !0,
		allowRemoteWrite: !1,
		allowInsecureTokenTransport: fn()
	};
}
function vn(e) {
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
function yn(e) {
	return C(vn(e));
}
function bn(e) {
	let t = String(e?.security?.tokenHint || "").trim();
	return t ? O("setting.sec.token.placeholderConfigured", "Token configured on server ({tokenHint}). Leave blank to keep the current server token.", { tokenHint: t }) : e?.security?.tokenConfigured ? O("setting.sec.token.placeholderConfiguredGeneric", "Token configured on server. Leave blank to keep the current server token.") : O("setting.sec.token.placeholder", "Auto-generated for this browser session.");
}
function xn(e, t, n) {
	let r = (e, t) => [
		rn,
		e,
		t
	];
	e({
		id: `${nn}.Safety.ConfirmDeletion`,
		category: r(O("cat.security"), "Confirm before deleting"),
		name: "Confirm before deleting",
		tooltip: "Show a confirmation dialog before deleting files. Disabling this allows instant deletion.",
		type: "boolean",
		defaultValue: t.safety?.confirmDeletion !== !1,
		onChange: (e) => {
			cn(t.safety?.confirmDeletion !== !1, e) || (t.safety = t.safety || {}, t.safety.confirmDeletion = !!e, q(t), J(t), n("safety.confirmDeletion"));
		}
	});
	let i = (i, a, o, s = "cat.security") => {
		e({
			id: `${nn}.Security.${i}`,
			category: r(O(s), O(a).replace("Majoor: ", "")),
			name: O(a),
			tooltip: O(o),
			type: "boolean",
			defaultValue: U(t.security?.[i], on[i] ?? !1),
			onChange: (e) => {
				if (!cn(t.security?.[i], e)) {
					t.security = t.security || {}, t.security[i] = !!e, q(t), n(`security.${i}`);
					try {
						yn(t.security).then((e) => {
							e?.ok && e.data?.prefs ? At() : e && e.ok === !1 && console.warn("[Majoor] backend security settings update failed", e.error || e);
						}).catch(() => {});
					} catch (e) {
						console.debug?.(e);
					}
				}
			}
		});
	};
	i("safeMode", "setting.sec.safe.name", "setting.sec.safe.desc"), i("allowWrite", "setting.sec.write.name", "setting.sec.write.desc"), i("allowDelete", "setting.sec.del.name", "setting.sec.del.desc"), i("allowRename", "setting.sec.ren.name", "setting.sec.ren.desc"), i("allowOpenInFolder", "setting.sec.open.name", "setting.sec.open.desc"), i("allowResetIndex", "setting.sec.reset.name", "setting.sec.reset.desc"), e({
		id: `${nn}.Security.RemoteLanPreset`,
		category: r(O("cat.remote"), O("setting.sec.remoteLanPreset.name").replace("Majoor: ", "")),
		name: O("setting.sec.remoteLanPreset.name"),
		tooltip: O("setting.sec.remoteLanPreset.desc"),
		type: "boolean",
		defaultValue: gn(t.security),
		onChange: (e) => {
			if (t.security = t.security || {}, cn(t.security.remoteLanPreset, e)) return;
			if (t.security.remoteLanPreset = !!e, !e) {
				q(t), n("security.remoteLanPreset");
				return;
			}
			let r;
			try {
				r = _n(t.security);
			} catch (e) {
				T(e?.message || O("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				return;
			}
			Object.assign(t.security, r), t.security.tokenConfigured = !0, t.security.tokenHint = String(r.apiToken || "").trim() ? `...${String(r.apiToken).trim().slice(-4)}` : "", r.apiToken && w(r.apiToken), q(t), n("security.remoteLanPreset"), n("security.apiToken"), n("security.allowWrite"), n("security.requireAuth"), n("security.allowRemoteWrite"), n("security.allowInsecureTokenTransport");
			try {
				yn(t.security).then((e) => {
					e?.ok && e.data?.prefs ? (At(), T(O("toast.remoteLanPresetApplied", "Recommended remote LAN setup applied. This browser session is now authorized for Majoor write operations."), "success")) : e && e.ok === !1 && (T(e.error || O("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error"), console.warn("[Majoor] backend remote LAN preset update failed", e.error || e));
				}).catch((e) => {
					T(e?.message || O("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), e({
		id: `${nn}.Security.ApiToken`,
		category: r(O("cat.remote"), O("setting.sec.token.name").replace("Majoor: ", "")),
		name: O("setting.sec.token.name", "Majoor: API Token"),
		tooltip: O("setting.sec.token.desc", "Store the API token used for write operations. Majoor sends it via X-MJR-Token and Authorization headers."),
		type: "text",
		defaultValue: t.security?.apiToken || "",
		attrs: { placeholder: bn(t) },
		onChange: (e) => {
			t.security = t.security || {};
			let r = ln(e);
			if (ln(t.security.apiToken) !== r && (t.security.apiToken = r, t.security.apiToken && (t.security.tokenConfigured = !0, t.security.tokenHint = `...${t.security.apiToken.slice(-4)}`, w(t.security.apiToken)), q(t), n("security.apiToken"), t.security.apiToken)) try {
				C({ api_token: t.security.apiToken }).then((e) => {
					e?.ok && e.data?.prefs ? At() : e && e.ok === !1 && console.warn("[Majoor] backend token update failed", e.error || e);
				}).catch(() => {});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), i("requireAuth", "setting.sec.requireAuth.name", "setting.sec.requireAuth.desc", "cat.remote"), i("allowRemoteWrite", "setting.sec.remote.name", "setting.sec.remote.desc", "cat.remote"), i("allowInsecureTokenTransport", "setting.sec.insecureTransport.name", "setting.sec.insecureTransport.desc", "cat.remote");
}
//#endregion
//#region ui/app/settings/settingsAdvanced.ts
var X = "Majoor", Sn = "Majoor Assets Manager";
function Cn(e, t, r, a) {
	let o = (e, t) => [
		Sn,
		e,
		t
	], c = String(t.paths?.outputDirectory || ""), l = null, f = 0, p = null;
	e({
		id: `${X}.Paths.OutputDirectory`,
		category: o(O("cat.advanced"), "Paths / Output"),
		name: "Majoor: Generation Output Directory",
		tooltip: "Override the ComfyUI generation output directory used by Majoor (equivalent to --output-directory). Leave empty to keep the current backend default.",
		type: "text",
		defaultValue: String(t.paths?.outputDirectory || ""),
		attrs: { placeholder: "D:\\\\____COMFY_OUTPUTS" },
		onChange: async (e) => {
			let n = String(e || "").trim();
			t.paths = t.paths || {}, t.paths.outputDirectory = n, q(t);
			try {
				l &&= (clearTimeout(l), null);
			} catch (e) {
				console.debug?.(e);
			}
			l = setTimeout(async () => {
				l = null;
				let e = ++f;
				try {
					p?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				p = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let i = await S(n, p ? { signal: p.signal } : {});
					if (e !== f) return;
					if (!i?.ok) throw Error(i?.error || O("toast.failedSetOutputDirectory", "Failed to set output directory"));
					let a = String(i?.data?.output_directory || n).trim();
					t.paths.outputDirectory = a, c = a, q(t), r("paths.outputDirectory");
				} catch (n) {
					if (e !== f || String(n?.name || "") === "AbortError" || String(n?.code || "") === "ABORTED") return;
					t.paths.outputDirectory = c, q(t), r("paths.outputDirectory"), T(n?.message || O("toast.failedSetOutputDirectory", "Failed to set output directory"), "error");
				}
			}, 700);
		}
	});
	try {
		ee().then((e) => {
			if (!e?.ok) return;
			let n = String(e?.data?.output_directory || "").trim();
			t.paths = t.paths || {}, t.paths.outputDirectory !== n && (t.paths.outputDirectory = n, c = n, q(t), r("paths.outputDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let m = String(t.paths?.indexDirectory || ""), g = null, _ = 0, v = null;
	e({
		id: `${X}.Paths.IndexDirectory`,
		category: o(O("cat.advanced"), "Paths / Index"),
		name: "Majoor: Index Database Directory",
		tooltip: "Override the Majoor index database directory. Use this to keep the SQLite index on a different local disk. Requires restart.",
		type: "text",
		defaultValue: String(t.paths?.indexDirectory || ""),
		attrs: { placeholder: "D:\\MajoorIndex" },
		onChange: async (e) => {
			let n = String(e || "").trim();
			t.paths = t.paths || {}, t.paths.indexDirectory = n, q(t);
			try {
				g &&= (clearTimeout(g), null);
			} catch (e) {
				console.debug?.(e);
			}
			g = setTimeout(async () => {
				g = null;
				let e = ++_;
				try {
					v?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				v = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let i = await _e(n, v ? { signal: v.signal } : {});
					if (e !== _) return;
					if (!i?.ok) throw Error(i?.error || O("toast.failedSetIndexDirectory", "Failed to set index directory"));
					let a = String(i?.data?.index_directory || n).trim(), o = a !== m;
					t.paths.indexDirectory = a, m = a, q(t), r("paths.indexDirectory"), o && T(O("toast.indexDirectorySavedRestart", "Index directory saved. Restart ComfyUI to apply."), "success", void 0, { history: { trackId: "settings:index-directory-saved" } });
				} catch (n) {
					if (e !== _ || String(n?.name || "") === "AbortError" || String(n?.code || "") === "ABORTED") return;
					t.paths.indexDirectory = m, q(t), r("paths.indexDirectory"), T(n?.message || O("toast.failedSetIndexDirectory", "Failed to set index directory"), "error");
				}
			}, 700);
		}
	});
	try {
		de().then((e) => {
			if (!e?.ok) return;
			let n = String(e?.data?.index_directory || "").trim();
			t.paths = t.paths || {}, t.paths.indexDirectory !== n && (t.paths.indexDirectory = n, m = n, q(t), r("paths.indexDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let b = String(t.paths?.workflowRoots || ""), x = null, C = 0, w = null;
	e({
		id: `${X}.Paths.WorkflowRoots`,
		category: o(O("cat.advanced"), "Paths / Workflows"),
		name: "Majoor: Workflow Roots",
		tooltip: "Folders scanned by the Workflow tab. Use one folder per line, or separate folders with semicolons. Leave empty to use ComfyUI defaults and MJR_AM_WORKFLOW_DIRECTORY.",
		type: "text",
		defaultValue: String(t.paths?.workflowRoots || ""),
		attrs: { placeholder: "D:\\\\ComfyUI\\\\user\\\\default\\\\workflows" },
		onChange: async (e) => {
			let n = String(e || "").trim();
			t.paths = t.paths || {}, t.paths.workflowRoots = n, q(t);
			try {
				x &&= (clearTimeout(x), null);
			} catch (e) {
				console.debug?.(e);
			}
			x = setTimeout(async () => {
				x = null;
				let e = ++C;
				try {
					w?.abort?.();
				} catch (e) {
					console.debug?.(e);
				}
				w = typeof AbortController < "u" ? new AbortController() : null;
				try {
					let i = await le(n, w ? { signal: w.signal } : {});
					if (e !== C) return;
					if (!i?.ok) throw Error(i?.error || O("toast.failedSetWorkflowRoots", "Failed to set workflow roots"));
					let a = String(i?.data?.workflow_roots_text || n).trim();
					t.paths.workflowRoots = a, b = a, q(t), r("paths.workflowRoots"), T(O("toast.workflowRootsSaved", "Workflow roots saved"), "success", 1800);
				} catch (n) {
					if (e !== C || String(n?.name || "") === "AbortError" || String(n?.code || "") === "ABORTED") return;
					t.paths.workflowRoots = b, q(t), r("paths.workflowRoots"), T(n?.message || O("toast.failedSetWorkflowRoots", "Failed to set workflow roots"), "error");
				}
			}, 700);
		}
	});
	try {
		re().then((e) => {
			if (!e?.ok) return;
			let n = String(e?.data?.workflow_roots_text || "").trim();
			t.paths = t.paths || {}, t.paths.workflowRoots !== n && (t.paths.workflowRoots = n, b = n, q(t), r("paths.workflowRoots"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let E = Te().map((e) => e.code), ie = ["auto", ...E];
	e({
		id: `${X}.Language`,
		category: o(O("cat.advanced"), O("setting.language.name", "Language")),
		name: O("setting.language.name", "Majoor: Language"),
		tooltip: "Use auto to detect and follow ComfyUI language. Or choose a fixed language for Majoor only.",
		type: "combo",
		defaultValue: t.i18n?.followComfyLanguage ? "auto" : xe(),
		options: ie,
		onChange: (e) => {
			if (t.i18n = t.i18n || {}, e === "auto") {
				t.i18n.followComfyLanguage = !0, Se(!0), Oe(a), q(t), r("language");
				return;
			}
			E.includes(e) && (t.i18n.followComfyLanguage = !1, Se(!1), Ce(e), q(t), r("language"));
		}
	}), e({
		id: `${X}.ProbeBackend.Mode`,
		category: o(O("cat.advanced"), O("setting.probe.mode.name").replace("Majoor: ", "")),
		name: O("setting.probe.mode.name"),
		tooltip: O("setting.probe.mode.desc") + " (env: MAJOOR_MEDIA_PROBE_BACKEND)",
		type: "combo",
		defaultValue: t.probeBackend?.mode || G.probeBackend.mode,
		options: [
			"auto",
			"exiftool",
			"ffprobe",
			"both"
		],
		onChange: (e) => {
			let n = xt(e, [
				"auto",
				"exiftool",
				"ffprobe",
				"both"
			], G.probeBackend.mode);
			t.probeBackend = t.probeBackend || {}, t.probeBackend.mode = n, q(t), J(t), r("probeBackend.mode"), i(n).catch(() => {});
		}
	}), e({
		id: `${X}.MetadataFallback.Image`,
		category: o(O("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Images)",
		tooltip: "Enable Pillow fallback when ExifTool is missing or fails.",
		type: "boolean",
		defaultValue: t.metadataFallback?.image ?? G.metadataFallback.image,
		onChange: async (e) => {
			let n = !!e, i = !!(t.metadataFallback?.image ?? G.metadataFallback.image);
			t.metadataFallback = t.metadataFallback || {}, t.metadataFallback.image = n, q(t), r("metadataFallback.image");
			try {
				let e = await ge({
					image: n,
					media: t.metadataFallback?.media ?? G.metadataFallback.media
				});
				if (!e?.ok) throw Error(e?.error || O("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				t.metadataFallback.image = i, q(t), r("metadataFallback.image"), T(e?.message || O("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	}), e({
		id: `${X}.MetadataFallback.Media`,
		category: o(O("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Audio/Video)",
		tooltip: "Enable hachoir fallback when ffprobe is missing or fails.",
		type: "boolean",
		defaultValue: t.metadataFallback?.media ?? G.metadataFallback.media,
		onChange: async (e) => {
			let n = !!e, i = !!(t.metadataFallback?.media ?? G.metadataFallback.media);
			t.metadataFallback = t.metadataFallback || {}, t.metadataFallback.media = n, q(t), r("metadataFallback.media");
			try {
				let e = await ge({
					image: t.metadataFallback?.image ?? G.metadataFallback.image,
					media: n
				});
				if (!e?.ok) throw Error(e?.error || O("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				t.metadataFallback.media = i, q(t), r("metadataFallback.media"), T(e?.message || O("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	});
	try {
		te().then((e) => {
			if (!e?.ok || !e?.data?.prefs) return;
			let n = e.data.prefs || {}, i = !!(n.image ?? G.metadataFallback.image), a = !!(n.media ?? G.metadataFallback.media);
			t.metadataFallback = t.metadataFallback || {};
			let o = !1;
			t.metadataFallback.image !== i && (t.metadataFallback.image = i, o = !0), t.metadataFallback.media !== a && (t.metadataFallback.media = a, o = !0), o && (q(t), r("metadataFallback"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	e({
		id: `${X}.Db.Timeout`,
		category: o(O("cat.advanced"), "Database"),
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
			t.db = t.db || {}, t.db.timeoutMs = Math.max(1e3, Math.min(3e4, Math.round(W(e, 5e3)))), q(t), J(t), r("db.timeoutMs");
		}
	}), e({
		id: `${X}.Db.MaxConnections`,
		category: o(O("cat.advanced"), "Database"),
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
			t.db = t.db || {}, t.db.maxConnections = Math.max(1, Math.min(100, Math.round(W(e, 10)))), q(t), J(t), r("db.maxConnections");
		}
	}), e({
		id: `${X}.Db.QueryTimeout`,
		category: o(O("cat.advanced"), "Database"),
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
			t.db = t.db || {}, t.db.queryTimeoutMs = Math.max(500, Math.min(1e4, Math.round(W(e, 1e3)))), q(t), J(t), r("db.queryTimeoutMs");
		}
	}), e({
		id: `${X}.Observability.Enabled`,
		category: o(O("cat.advanced"), O("setting.obs.enabled.name").replace("Majoor: ", "")),
		name: O("setting.obs.enabled.name"),
		tooltip: O("setting.obs.enabled.desc"),
		type: "boolean",
		defaultValue: !!t.observability?.enabled,
		onChange: (e) => {
			t.observability = t.observability || {}, t.observability.enabled = !!e, q(t), J(t), r("observability.enabled");
		}
	}), e({
		id: `${X}.Observability.RuntimeDashboardMode`,
		category: o(O("cat.advanced"), "Runtime metrics badge"),
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
			let n = xt(e, [
				"autoHide30",
				"always",
				"hidden"
			], G.observability.runtimeDashboardMode);
			t.observability = t.observability || {}, t.observability.runtimeDashboardMode = n, q(t), r("observability.runtimeDashboardMode");
		}
	}), e({
		id: `${X}.Observability.VerboseErrors`,
		category: o(O("cat.advanced"), "Verbose error logging"),
		name: "Verbose error logging",
		tooltip: "Show detailed error messages in toasts and console. Useful for debugging.",
		type: "boolean",
		defaultValue: !!t.observability?.verboseErrors,
		onChange: (e) => {
			t.observability = t.observability || {}, t.observability.verboseErrors = !!e, q(t), J(t), r("observability.verboseErrors");
		}
	}), e({
		id: `${X}.Observability.VerboseRouteRegistrationLogs`,
		category: o(O("cat.advanced"), "Logs"),
		name: "Majoor: Verbose route registration logs",
		tooltip: "When disabled, Majoor prints a compact startup summary instead of listing every registered API route. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(t.observability?.verboseRouteRegistrationLogs ?? G.observability?.verboseRouteRegistrationLogs ?? !1),
		onChange: async (e) => {
			let n = !!e, i = !!(t.observability?.verboseRouteRegistrationLogs ?? G.observability?.verboseRouteRegistrationLogs ?? !1);
			t.observability = t.observability || {}, t.observability.verboseRouteRegistrationLogs = n, q(t), r("observability.verboseRouteRegistrationLogs");
			try {
				let e = await me(n);
				if (!e?.ok) throw Error(e?.error || "Failed to update route logging settings");
			} catch (e) {
				t.observability.verboseRouteRegistrationLogs = i, q(t), r("observability.verboseRouteRegistrationLogs"), T(e?.message || "Failed to update route logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let e = !!(await ne())?.data?.prefs?.enabled;
			t.observability = t.observability || {}, t.observability.verboseRouteRegistrationLogs !== e && (t.observability.verboseRouteRegistrationLogs = e, q(t), r("observability.verboseRouteRegistrationLogs"));
		} catch (e) {
			console.debug?.(e);
		}
	})(), e({
		id: `${X}.Observability.VerboseStartupLogs`,
		category: o(O("cat.advanced"), "Logs"),
		name: "Majoor: Verbose startup logs",
		tooltip: "When disabled, Majoor suppresses most informational bootstrap logs during backend startup while keeping warnings and errors. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(t.observability?.verboseStartupLogs ?? G.observability?.verboseStartupLogs ?? !1),
		onChange: async (e) => {
			let n = !!e, i = !!(t.observability?.verboseStartupLogs ?? G.observability?.verboseStartupLogs ?? !1);
			t.observability = t.observability || {}, t.observability.verboseStartupLogs = n, q(t), r("observability.verboseStartupLogs");
			try {
				let e = await s(n);
				if (!e?.ok) throw Error(e?.error || "Failed to update startup logging settings");
			} catch (e) {
				t.observability.verboseStartupLogs = i, q(t), r("observability.verboseStartupLogs"), T(e?.message || "Failed to update startup logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let e = !!(await D())?.data?.prefs?.enabled;
			t.observability = t.observability || {}, t.observability.verboseStartupLogs !== e && (t.observability.verboseStartupLogs = e, q(t), r("observability.verboseStartupLogs"));
		} catch (e) {
			console.debug?.(e);
		}
	})();
	{
		let n = "HuggingFace Token", i = "", a = null, s = 0, c = !!t.ai?.huggingFaceTokenVisible, l = () => {
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
			id: `${X}.AI.HuggingFaceTokenVisible`,
			category: o(O("cat.advanced"), n),
			name: "Show HuggingFace token",
			tooltip: "Show or hide the HuggingFace token while editing.",
			type: "boolean",
			defaultValue: c,
			onChange: (e) => {
				let n = !!e;
				c = n, t.ai = t.ai || {}, t.ai.huggingFaceTokenVisible = n, q(t), r("ai.huggingFaceTokenVisible"), setTimeout(l, 0);
			}
		}), e({
			id: `${X}.AI.HuggingFaceToken`,
			category: o(O("cat.advanced"), n),
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
				if (t !== i) {
					try {
						a &&= (clearTimeout(a), null);
					} catch (e) {
						console.debug?.(e);
					}
					a = setTimeout(async () => {
						a = null;
						let e = ++s;
						try {
							let n = await pe(t);
							if (e !== s) return;
							if (!n?.ok) throw Error(n?.error || "Failed to update HuggingFace token");
							i = t, r("ai.huggingFaceToken"), t ? T("HuggingFace token saved", "success") : T("HuggingFace token cleared", "success", void 0, { noHistory: !0 });
						} catch (t) {
							if (e !== s) return;
							T(t?.message || "Failed to update HuggingFace token", "error");
						}
					}, 900);
				}
			}
		}), setTimeout(l, 0), (async () => {
			try {
				let e = (await h())?.data?.prefs || {}, t = !!e?.has_token, n = String(e?.token_hint || "").trim();
				u(t ? `Configured ${n || "(saved)"}` : "Paste HuggingFace token (hf_...)");
			} catch (e) {
				console.debug?.(e);
			}
		})(), e({
			id: `${X}.AI.VerboseLogs`,
			category: o(O("cat.advanced"), n),
			name: "Majoor: Verbose AI logs",
			tooltip: "Enable detailed HuggingFace/SigLIP2/X-CLIP logs and progress bars during model download/loading.",
			type: "boolean",
			defaultValue: !!(t.ai?.verboseAiLogs ?? G.ai?.verboseAiLogs ?? !1),
			onChange: async (e) => {
				let n = !!e, i = !!(t.ai?.verboseAiLogs ?? G.ai?.verboseAiLogs ?? !1);
				t.ai = t.ai || {}, t.ai.verboseAiLogs = n, q(t), r("ai.verboseAiLogs");
				try {
					let e = await ae(n);
					if (!e?.ok) throw Error(e?.error || "Failed to update AI logging settings");
				} catch (e) {
					t.ai.verboseAiLogs = i, q(t), r("ai.verboseAiLogs"), T(e?.message || "Failed to update AI logging settings", "error");
				}
			}
		}), (async () => {
			try {
				let e = !!(await d())?.data?.prefs?.enabled;
				t.ai = t.ai || {}, t.ai.verboseAiLogs !== e && (t.ai.verboseAiLogs = e, q(t), r("ai.verboseAiLogs"));
			} catch (e) {
				console.debug?.(e);
			}
		})();
	}
	e({
		id: `${X}.AI.VectorStats`,
		category: o(O("cat.advanced"), "AI / Vector Search"),
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
	})(), e({
		id: `${X}.AI.VectorBackfillAction`,
		category: o(O("cat.advanced"), "AI / Vector Search"),
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
				let e = await y(64, { onProgress: (e) => {
					let n = String(e?.status || "running").toLowerCase() || "running", r = e?.progress || e?.result || {}, i = Number(r?.candidates ?? r?.processed ?? 0), a = Number(r?.indexed ?? 0), o = Number(r?.skipped ?? 0), s = Number(r?.errors ?? 0), c = Math.max(i, a + o + s), l = c > 0 ? Math.round((a + o + s) / c * 100) : null, d = n === "queued" ? "Vector backfill queued" : `Candidates ${i}, indexed ${a}, skipped ${o}, errors ${s}`;
					u({
						summary: "Vector Backfill",
						detail: d
					}, n === "failed" ? "error" : n === "succeeded" ? "success" : "info", 0, { history: {
						...t.history,
						status: n,
						detail: d,
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
					let r = e.data || {}, i = String(r?.status || "").toLowerCase(), a = !!r?.pending || [
						"queued",
						"running",
						"pending"
					].includes(i), o = r?.progress || {}, s = Number(r?.processed ?? o?.candidates ?? 0), c = Number(r?.indexed ?? o?.indexed ?? 0), l = Number(r?.skipped ?? o?.skipped ?? 0);
					if (a) {
						let e = String(r?.job_id || "").trim();
						T(O("toast.vectorBackfillRunning", "Vector backfill still running in background{job}.", { job: e ? ` (job ${e.slice(0, 8)})` : "" }), "info", void 0, { history: {
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
					} else T(O("toast.vectorBackfillComplete", "Vector backfill complete! Processed: {processed}, Indexed: {indexed}, Skipped: {skipped}", {
						processed: s,
						indexed: c,
						skipped: l
					}), "success", void 0, { history: {
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
					try {
						let e = await n();
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
var wn = "Majoor", Tn = "Majoor Assets Manager";
function En(e, t, n) {
	let r = (e, t) => [
		Tn,
		e,
		t
	];
	e({
		id: `${wn}.AI.VectorSearchEnabled`,
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
				let e = await a(i);
				if (!e?.ok) {
					t.ai.vectorSearchEnabled = r, q(t), J(t), n("ai.vectorSearchEnabled"), T(e?.error || "Failed to update AI vector search setting", "error");
					return;
				}
				T(i ? "AI semantic search enabled" : "AI semantic search disabled", "info", 2200);
			} catch (e) {
				t.ai.vectorSearchEnabled = r, q(t), J(t), n("ai.vectorSearchEnabled"), T(e?.message || "Failed to update AI vector search setting", "error");
			}
		}
	}), e({
		id: `${wn}.AI.VectorCaptionOnIndex`,
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
				let e = await a({ caption_on_index: i });
				if (!e?.ok) {
					t.ai.vectorCaptionOnIndex = r, q(t), J(t), n("ai.vectorCaptionOnIndex"), T(e?.error || "Failed to update AI caption indexing setting", "error");
					return;
				}
				i && T("AI captions during indexing enabled", "info", 2600);
			} catch (e) {
				t.ai.vectorCaptionOnIndex = r, q(t), J(t), n("ai.vectorCaptionOnIndex"), T(e?.message || "Failed to update AI caption indexing setting", "error");
			}
		}
	}), e({
		id: `${wn}.AI.VectorIndexOnScan`,
		category: r(O("cat.search", "Search"), "AI"),
		name: O("setting.ai.vector.indexOnScan.name", "Index vectors during scans"),
		tooltip: O("setting.ai.vector.indexOnScan.desc", "Compute SigLIP/X-CLIP embeddings while assets are scanned. Disable to avoid surprise VRAM use; run vector backfill manually when needed."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorIndexOnScan ?? !1),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let r = !!(t.ai.vectorIndexOnScan ?? !1), i = !!e;
			t.ai.vectorIndexOnScan = i, q(t), J(t), n("ai.vectorIndexOnScan");
			try {
				let e = await a({ index_on_scan: i });
				if (!e?.ok) {
					t.ai.vectorIndexOnScan = r, q(t), J(t), n("ai.vectorIndexOnScan"), T(e?.error || "Failed to update vector scan indexing", "error");
					return;
				}
				T(i ? "Vector indexing during scans enabled" : "Vector indexing during scans disabled", "info", 2400);
			} catch (e) {
				t.ai.vectorIndexOnScan = r, q(t), J(t), n("ai.vectorIndexOnScan"), T(e?.message || "Failed to update vector scan indexing", "error");
			}
		}
	}), e({
		id: `${wn}.AI.VectorConcurrency`,
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
			t.ai.vectorConcurrency = i, q(t), J(t), n("ai.vectorConcurrency");
			try {
				let e = await a({ concurrency: i });
				e?.ok || (t.ai.vectorConcurrency = r, q(t), J(t), n("ai.vectorConcurrency"), T(e?.error || "Failed to update vector concurrency", "error"));
			} catch (e) {
				t.ai.vectorConcurrency = r, q(t), J(t), n("ai.vectorConcurrency"), T(e?.message || "Failed to update vector concurrency", "error");
			}
		}
	}), e({
		id: `${wn}.AI.VectorUnloadAfterUse`,
		category: r(O("cat.search", "Search"), "AI"),
		name: O("setting.ai.vector.unloadAfterUse.name", "Unload AI models after use"),
		tooltip: O("setting.ai.vector.unloadAfterUse.desc", "Unload Majoor SigLIP/X-CLIP/Florence models after heavy AI actions and call torch CUDA cache cleanup. This frees VRAM but makes the next AI action slower."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorUnloadAfterUse ?? !1),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let r = !!(t.ai.vectorUnloadAfterUse ?? !1), i = !!e;
			t.ai.vectorUnloadAfterUse = i, q(t), J(t), n("ai.vectorUnloadAfterUse");
			try {
				let e = await a({ unload_after_use: i });
				if (!e?.ok) {
					t.ai.vectorUnloadAfterUse = r, q(t), J(t), n("ai.vectorUnloadAfterUse"), T(e?.error || "Failed to update model unload setting", "error");
					return;
				}
				T(i ? "AI model unload after use enabled" : "AI model unload after use disabled", "info", 2400);
			} catch (e) {
				t.ai.vectorUnloadAfterUse = r, q(t), J(t), n("ai.vectorUnloadAfterUse"), T(e?.message || "Failed to update model unload setting", "error");
			}
		}
	}), e({
		id: `${wn}.AI.VectorUnloadNow`,
		category: r(O("cat.search", "Search"), "AI"),
		name: O("setting.ai.vector.unloadNow.name", "Memory purge now"),
		tooltip: O("setting.ai.vector.unloadNow.desc", "Immediately unload Majoor AI vector/caption models, ask ComfyUI to unload loaded models, and clear torch CUDA cache when idle."),
		type: "combo",
		options: ["Idle", "Unload now"],
		defaultValue: "Idle",
		onChange: async (e) => {
			if (String(e || "") === "Unload now") try {
				let e = await _();
				T(e?.ok ? "Majoor AI model cache unloaded" : e?.error || "Failed to unload Majoor AI model cache", e?.ok ? "info" : "error", 2600);
			} catch (e) {
				T(e?.message || "Failed to unload Majoor AI model cache", "error");
			}
		}
	}), e({
		id: `${wn}.Search.MaxResults`,
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
			t.search = t.search || {}, t.search.maxResults = Math.max(10, Math.min(A.MAX_PAGE_SIZE || 2e3, Number(e) || A.SEARCH_DEFAULT_LIMIT)), q(t), J(t), n("search.maxResults");
		}
	}), e({
		id: `${wn}.EnvVars.Reference`,
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
var Dn = "Majoor Assets Manager", On = /^\s*Majoor:\s*/i, kn = Object.freeze({
	ASSETS_PANEL: "Assets Panel",
	GENERATED_FEED: "Generated Feed",
	VIEWER: "Viewer & Floating Viewer",
	INDEXING: "Indexing & Watcher",
	SEARCH_AI: "Search & AI",
	GENERAL: "General",
	ADVANCED: "Advanced",
	SECURITY: "Security"
}), An = new Set([
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
]), jn = "Majoor.General.ResetAllSettings", Mn = "mjr-settings-reset-btn", Nn = null, Pn = null;
function Fn(e) {
	let t = String(e || "").trim();
	return !t || t === jn || t === "Majoor.Language" ? kn.GENERAL : /^Majoor\.(Safety|Security)\./.test(t) ? kn.SECURITY : /^Majoor\.(Paths|Db|ProbeBackend|MetadataFallback|Observability)\./.test(t) || t === "Majoor.EnvVars.Reference" ? kn.ADVANCED : /^Majoor\.(Viewer|WorkflowMinimap)\./.test(t) ? kn.VIEWER : /^Majoor\.Feed\./.test(t) ? kn.GENERATED_FEED : /^Majoor\.(AutoScan|Scan|Watcher|ExecutionGrouping|RatingTagsSync)\./.test(t) || t === "Majoor.RtHydrate.Concurrency" ? kn.INDEXING : /^Majoor\.AI\.(HuggingFaceTokenVisible|HuggingFaceToken|VerboseLogs|VectorStats|VectorBackfillAction|VectorSearchEnabled|VectorCaptionOnIndex|VectorIndexOnScan|VectorConcurrency|VectorUnloadAfterUse|VectorUnloadNow)$/.test(t) || /^Majoor\.Search\./.test(t) ? kn.SEARCH_AI : /^Majoor\.(Grid|Cards|Badges|Sidebar|InfiniteScroll|General)\./.test(t) ? kn.ASSETS_PANEL : kn.GENERAL;
}
function In(e) {
	let t = Array.isArray(e?.category) ? e.category.filter(Boolean) : [], n = Fn(e?.id), r = String(t[1] || t[0] || "").trim(), i = String(t[2] || "").trim(), a = String(e?.name || "").replace(On, "").trim();
	return [
		Dn,
		n,
		i || r || a || n
	];
}
var Ln = !1, Rn = null, zn = null, Bn = !1, Vn = /* @__PURE__ */ new Set();
function Hn(e) {
	if (!e || typeof e != "object") return null;
	let t = { ...e };
	try {
		typeof t.name == "string" && (t.name = t.name.replace(On, "").trim());
	} catch (e) {
		console.debug?.(e);
	}
	try {
		t.category = In(t);
	} catch {
		t.category = [Dn, kn.GENERAL];
	}
	return !t.tooltip && typeof t.name == "string" && t.name.trim() && (t.tooltip = t.name.trim()), t;
}
function Un(e, t, n) {
	let r = String(t?.id || "").trim();
	if (!r || Vn.has(r)) return !1;
	Vn.add(r);
	try {
		return ve(e, r, n);
	} finally {
		Vn.delete(r);
	}
}
function Wn(e, t) {
	if (!t || typeof t != "object") return t;
	let n = { ...t };
	Un(e, n, n.defaultValue);
	let r = n.onChange;
	return n.onChange = (t, ...i) => {
		if (Un(e, n, t), typeof r == "function") return r(t, ...i);
		n.defaultValue = t;
	}, n;
}
function Gn(e) {
	try {
		return JSON.parse(JSON.stringify(e || {}));
	} catch {
		return { ...G };
	}
}
function Kn(e, t, n, { wrapForComfy: r = !0 } = {}) {
	let i = [], a = (e) => {
		let n = Hn(e);
		n && i.push(r ? Wn(t, n) : n);
	};
	return Kt(a, e, n), tn(a, e, n), Yt(a, e, n), Qt(a, e, n), xn(a, e, n), Cn(a, e, n, t), En(a, e, n), i;
}
function qn(e, t) {
	if (e === t) return !0;
	try {
		return JSON.stringify(e) === JSON.stringify(t);
	} catch {
		return !1;
	}
}
function Jn(e) {
	return e ? e.querySelector(".form-input") || e.querySelector(".p-inputgroup") || e.querySelector(".setting-input") || e.querySelector("[class*='input']") : null;
}
function Yn(e, t) {
	let n = document.createElement("button");
	return n.type = "button", n.className = Mn, n.textContent = e, n.title = t, n.style.marginLeft = "8px", n.style.minWidth = e.length > 2 ? "auto" : "24px", n.style.height = "24px", n.style.padding = e.length > 2 ? "0 10px" : "0", n.style.borderRadius = "6px", n.style.border = "1px solid var(--border-color, #555)", n.style.background = "var(--comfy-input-bg, #2b2b2b)", n.style.color = "var(--input-text, inherit)", n.style.cursor = "pointer", n.style.fontSize = "12px", n.style.lineHeight = "22px", n.style.flexShrink = "0", n;
}
function Xn(e, t, n) {
	String(e?.id || "").trim() && (Un(n, e, t), typeof e?.onChange == "function" && e.onChange(t));
}
function Zn(e, t, n, r) {
	let i = !qn(ye(r, t.id, t.defaultValue), n);
	e.disabled = !i, e.style.opacity = i ? "1" : "0.45";
}
function Qn() {
	if (typeof document > "u" || !Pn) return;
	let { app: e, definitions: t, defaultValues: n } = Pn, r = document.querySelector(`[data-setting-id="${jn}"]`), i = Jn(r);
	if (r && i && !r.getAttribute("data-mjr-reset-injected")) {
		r.setAttribute("data-mjr-reset-injected", "true"), i.innerHTML = "";
		let a = Yn("Reset all settings", "Reset all Majoor settings to defaults");
		a.onclick = (r) => {
			r.preventDefault(), r.stopPropagation();
			for (let r of t) r.id !== jn && n.has(r.id) && Xn(r, n.get(r.id), e);
			Qn();
		}, i.appendChild(a);
	}
	for (let r of t) {
		if (!r?.id || r.id === jn || !n.has(r.id)) continue;
		let t = document.querySelector(`[data-setting-id="${r.id}"]`);
		if (!t || t.getAttribute("data-mjr-reset-injected")) continue;
		let i = Jn(t);
		if (!i) continue;
		t.setAttribute("data-mjr-reset-injected", "true");
		let a = Yn("Reset", "Reset this setting to default");
		Zn(a, r, n.get(r.id), e), a.onclick = (t) => {
			t.preventDefault(), t.stopPropagation();
			let i = n.get(r.id);
			Xn(r, i, e), Zn(a, r, i, e);
		}, i.appendChild(a);
	}
}
function $n(e, t, n) {
	typeof document > "u" || typeof MutationObserver > "u" || (Pn = {
		app: e,
		definitions: t,
		defaultValues: new Map(n.filter((e) => e?.id && e.id !== jn).map((e) => [e.id, e.defaultValue]))
	}, Qn(), !Nn && (Nn = new MutationObserver(() => Qn()), Nn.observe(document.body, {
		childList: !0,
		subtree: !0
	})));
}
function er(e, t, { initRuntime: n = !1 } = {}) {
	if (zn) typeof t == "function" && zn.onAppliedListeners.add(t), e && !zn.app && (zn.app = e);
	else {
		let n = K();
		n.i18n = n.i18n || {}, typeof n.i18n.followComfyLanguage == "boolean" ? Se(!!n.i18n.followComfyLanguage) : (n.i18n.followComfyLanguage = !0, Se(!0), q(n));
		let r = /* @__PURE__ */ new Set();
		typeof t == "function" && r.add(t);
		let i = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Set(), o = () => {
			if (!i.size) return;
			let e = Array.from(i);
			i.clear();
			for (let t of e) Ae("mjr-settings-changed", { key: t }, { warnPrefix: "[Majoor]" });
		}, s = () => {
			if (!a.size) return;
			let e = Array.from(a);
			a.clear();
			for (let t of e) Ae("mjr-settings-changed", { key: t }, { warnPrefix: "[Majoor]" });
		}, c = Wt(o, 120), l = Wt(s, 450), u = (e) => {
			typeof e == "string" && i.add(e), c();
		}, d = (e) => {
			typeof e == "string" && a.add(e), l();
		}, f = () => {
			let e = K();
			Object.assign(n, e), J(n), u("storage");
		}, p = (e) => {
			!e || e.key !== "mjrSettings" || e.newValue !== e.oldValue && f();
		};
		if (!Ln) {
			if (Rn && typeof window < "u") try {
				window.removeEventListener("storage", Rn);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				window.addEventListener("storage", p), Ln = !0, Rn = p;
			} catch (e) {
				console.debug?.(e);
			}
		}
		zn = {
			app: e,
			notifyApplied: (e) => {
				for (let t of r) try {
					t(n, e);
				} catch (e) {
					console.debug?.(e);
				}
				An.has(String(e || "")) ? d(e) : u(e);
			},
			onAppliedListeners: r,
			refreshFromStorage: f,
			settings: n
		};
	}
	if (n && !Bn) {
		let t = e || zn.app, n = zn.settings;
		Oe(t), J(n), Ee(t), At(), jt(), Mt(), n?.watcher && typeof n.watcher.enabled == "boolean" && ce(!!n.watcher.enabled).catch(() => {}), Ht(), Bn = !0;
	}
	return zn;
}
var tr = (e, t) => er(e, t, { initRuntime: !0 }).settings, nr = (e, t) => {
	let n = er(e, t, { initRuntime: !1 });
	Object.assign(n.settings, K());
	let r = e || n.app, i = Kn(n.settings, r, n.notifyApplied), a = Kn(Gn(G), r, () => {}, { wrapForComfy: !1 });
	return i.unshift(Wn(r, {
		id: jn,
		category: [
			Dn,
			kn.GENERAL,
			"Reset"
		],
		name: "Reset all settings to defaults",
		tooltip: "Reset every Majoor Assets Manager setting to its default value.",
		type: "text",
		defaultValue: ""
	})), $n(r, i, a), i;
};
try {
	let e = K();
	e?.watcher && typeof e.watcher.enabled == "boolean" && oe().then((e) => {
		let t = !!e?.ok && !!e?.data?.enabled, n = K();
		n.watcher = n.watcher || {}, typeof t == "boolean" && t !== !!n.watcher.enabled && (n.watcher.enabled = t, q(n), Ae("mjr-settings-changed", { key: "watcher.enabled" }, { warnPrefix: "[Majoor]" }));
	}).catch(() => {});
} catch (e) {
	console.debug?.(e);
}
//#endregion
//#region ui/features/workflows/workflowPickerState.ts
var Z = ft({
	open: !1,
	mode: "workflow",
	title: "",
	sourceAsset: null,
	workflow: null,
	items: [],
	resolve: null
});
function rr({ title: e = "Select workflow", sourceAsset: t = null } = {}) {
	return ar(null), Z.open = !0, Z.mode = "workflow", Z.title = String(e || "Select workflow"), Z.sourceAsset = t || null, Z.workflow = null, Z.items = [], new Promise((e) => {
		Z.resolve = e;
	});
}
function ir({ title: e = "Select asset", workflow: t = null, items: n = [] } = {}) {
	return ar(null), Z.open = !0, Z.mode = "asset", Z.title = String(e || "Select asset"), Z.sourceAsset = null, Z.workflow = t || null, Z.items = Array.isArray(n) ? n.filter(Boolean) : [], new Promise((e) => {
		Z.resolve = e;
	});
}
function ar(e = null) {
	let t = Z.resolve;
	if (Z.open = !1, Z.mode = "workflow", Z.title = "", Z.sourceAsset = null, Z.workflow = null, Z.items = [], Z.resolve = null, typeof t == "function") try {
		t(e || null);
	} catch (e) {
		console.debug?.(e);
	}
}
//#endregion
//#region ui/vue/majoorPrimeVue.ts
var or = {
	Button: Ze,
	Checkbox: Xe,
	InputText: pt,
	Textarea: nt,
	Select: ut,
	ToggleButton: ot,
	Badge: st,
	Tag: qe,
	Dialog: et,
	Menu: lt,
	Listbox: at,
	Tree: dt,
	VirtualScroller: Ye
};
function sr(e) {
	return e.use(Qe, {
		ripple: !1,
		unstyled: !0,
		zIndex: { overlay: 10100 }
	}), e.use($e), e.use(it), Object.entries(or).forEach(([t, n]) => {
		e.component(`M${t}`, n);
	}), e;
}
//#endregion
//#region ui/vue/createVueApp.ts
function cr(e, t = void 0) {
	let n = ht(), r = Ke(e, t);
	return r.use(n), sr(r), {
		app: r,
		pinia: n
	};
}
var lr = /* @__PURE__ */ new Map();
function ur(e, t, n) {
	try {
		window.dispatchEvent(new CustomEvent("mjr:keepalive-attached", { detail: {
			mountKey: String(e || "_mjrVueApp"),
			host: t || null,
			container: n || null
		} }));
	} catch {}
}
function dr(e) {
	let t = document.createElement("div");
	return t.dataset.mjrKeepAliveHost = String(e || "_mjrVueApp"), t.style.height = "100%", t.style.width = "100%", t.style.minHeight = "0", t.style.display = "flex", t.style.flexDirection = "column", t.style.overflow = "hidden", t;
}
function fr(e, t) {
	!e || !t || (e.style.height = "100%", e.style.minHeight = "0", e.style.display = "flex", e.style.flexDirection = "column", e.style.overflow = "hidden", !(e.firstChild === t && e.childNodes.length === 1) && (e.replaceChildren(t), ur(t?.dataset?.mjrKeepAliveHost, t, e)));
}
function pr(e, t, n = "_mjrVueApp") {
	if (!e) return !1;
	let r = lr.get(n), i = !1;
	if (!r) {
		let e = dr(n), { app: a } = cr(t);
		a.mount(e), r = {
			app: a,
			host: e,
			container: null
		}, lr.set(n, r), i = !0;
	}
	return fr(e, r.host), r.container = e, i;
}
function mr(e, t = "_mjrVueApp") {
	let n = lr.get(t);
	if (n?.app) {
		try {
			n.app.unmount();
		} catch {}
		try {
			n.host?.remove?.();
		} catch {}
		lr.delete(t);
	}
}
//#endregion
//#region ui/utils/format.ts
function hr(e) {
	if (!e) return null;
	let t = Number(e);
	if (!isNaN(t)) return /* @__PURE__ */ new Date(t * 1e3);
	let n = new Date(e);
	return isNaN(n.getTime()) ? null : n;
}
function gr(e) {
	let t = hr(e);
	return t ? `${t.getDate().toString().padStart(2, "0")}/${(t.getMonth() + 1).toString().padStart(2, "0")}` : "";
}
function _r(e) {
	let t = hr(e);
	return t ? `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}` : "";
}
function vr(e) {
	return e ? e < 60 ? `${Math.round(e)}s` : `${Math.floor(e / 60)}m ${Math.round(e % 60)}s` : "";
}
var yr = {
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
function br() {
	let e = {};
	for (let t of yr.sections) {
		e[t.key] = t.searchField, e[t.searchField] = t.searchField;
		for (let n of t.aliases || []) e[String(n).toLowerCase()] = t.searchField;
	}
	return e;
}
function xr(e) {
	let t = String(e || "").trim().toLowerCase();
	return br()[t] || "";
}
function Sr(e) {
	let t = String(e || "").trim().toLowerCase();
	return t && yr.sections.find((e) => e.key === t) || null;
}
//#endregion
//#region ui/vue/components/panel/sidebar/SidebarFileInfoSection.vue
var Cr = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "rgba(255, 255, 255, 0.03)",
		border: "1px solid var(--mjr-border, rgba(255, 255, 255, 0.12))",
		"border-radius": "8px",
		padding: "10px"
	}
}, wr = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "6px"
} }, Tr = ["title"], Er = ["title"], Dr = {
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
		let a = I(() => {
			let e = t.asset || {}, a = [];
			if (e.width && e.height && a.push({
				label: "Dimensions",
				value: `${e.width} x ${e.height}`,
				tooltip: "Image/video resolution in pixels"
			}), e.duration && e.duration > 0 && a.push({
				label: "Duration",
				value: vr(e.duration),
				tooltip: "Video duration"
			}), r(e)) {
				let t = Fe(e);
				t != null && a.push({
					label: "FPS",
					value: Ie(t),
					tooltip: "Native frame rate"
				});
				let n = Me(e, t);
				n != null && a.push({
					label: "Length",
					value: `${Math.max(0, Math.floor(n))} frames`,
					tooltip: "Total frame count"
				});
			}
			let o = Ne(e.generation_time_ms ?? e.metadata?.generation_time_ms ?? 0);
			o > 0 && a.push({
				label: "Generation Time",
				value: `${(Number(o) / 1e3).toFixed(1)}s`,
				tooltip: "Time taken to generate this asset (workflow execution time)",
				valueStyle: `color: ${Pe(o)}; font-weight: 600;`
			});
			let s = e.generation_time || e.file_creation_time || e.mtime || e.created_at;
			if (s) {
				let e = gr(s), t = _r(s);
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
		return (e, t) => a.value.length ? (j(), z("div", Cr, [t[0] ||= N("div", { style: {
			"font-size": "12px",
			"font-weight": "700",
			color: "#607d8b",
			"margin-bottom": "8px",
			"text-transform": "uppercase",
			"letter-spacing": "0.4px"
		} }, " File Info ", -1), N("div", wr, [(j(!0), z(M, null, P(a.value, (e) => (j(), z("div", {
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
		}, R(e.label), 9, Tr), N("div", {
			style: V(e.valueStyle || "font-size: 12px; text-align: right; word-break: break-word"),
			title: String(e.value || "")
		}, R(e.value), 13, Er)]))), 128))])])) : F("", !0);
	}
}, Or = new Set([
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
function kr(e) {
	let t = String(e?.filename || e?.name || e?.filepath || e?.path || "").trim().toLowerCase();
	return !t || !t.includes(".") ? "" : t.split(".").pop() || "";
}
function Ar(e) {
	return String(e?.kind || "").trim().toLowerCase() === "image" || String(e?.mime || e?.mimetype || "").trim().toLowerCase().startsWith("image/") ? !0 : Or.has(kr(e));
}
function jr(e) {
	let t = kr(e);
	return t === "jpg" || t === "jpeg";
}
function Mr() {
	try {
		return !!(K()?.ai?.vectorSearchEnabled ?? !0);
	} catch {
		return !0;
	}
}
function Nr(e) {
	return e >= .75 ? "#4CAF50" : e >= .5 ? "#8BC34A" : e >= .3 ? "#FF9800" : "#F44336";
}
function Pr(e) {
	return e >= .85 ? "Excellent" : e >= .7 ? "Good" : e >= .5 ? "Fair" : e >= .3 ? "Low" : "Very Low";
}
function Fr(e) {
	let t = String(e || "").trim();
	if (!t) return "";
	let n = [];
	for (let e of t.replace(/\r\n/g, "\n").split("\n")) {
		let t = String(e || "").trim();
		t && (/^title\s*:/i.test(t) || (/^caption\s*:/i.test(t) && (t = t.replace(/^caption\s*:/i, "").trim()), t && n.push(t)));
	}
	return (n.length ? n.join(" ") : t).replace(/\s+/g, " ").replace(/:{2,}\s*$/, "").trim();
}
function Ir(e) {
	let t = String(e?.filename || "").trim();
	if (!t) return [];
	let n = String(e?.subfolder || "").trim(), r = String(e?.folder_type || "input").trim().toLowerCase(), i = [], a = (e) => {
		if (!e) return;
		let r = De(t, n, e);
		r && !i.includes(r) && i.push(r);
	};
	return (r === "input" || r === "output") && a(r), a("input"), a("output"), i;
}
function Lr(e) {
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
function Rr(e, t) {
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
function zr(e) {
	let t = [];
	return e?.metadata_raw && t.push(e.metadata_raw), e?.geninfo && typeof e.geninfo == "object" && t.push({ geninfo: e.geninfo }), e?.metadata && (typeof e.metadata == "object" || typeof e.metadata == "string") && t.push(e.metadata), e?.prompt && (typeof e.prompt == "object" || typeof e.prompt == "string") && t.push(e.prompt), e?.exif && t.push(e.exif), e && typeof e == "object" && t.push(e), t;
}
function Br(e, t) {
	for (let [n, r] of Object.entries(t)) r == null || r === "" || (e[n] === void 0 || e[n] === null || e[n] === "") && (e[n] = r);
}
function Vr(e) {
	let t = zr(e), n = {};
	for (let e of t) {
		let t = _t(e);
		!t || typeof t != "object" || Br(n, t);
	}
	return Object.keys(n).length ? n : null;
}
function Hr(e) {
	try {
		if (!e || typeof e != "object") return !1;
		if (e.is_override || typeof e.workflow_notes == "string" && e.workflow_notes.trim() || typeof e.notes == "string" && e.notes.trim() || Array.isArray(e.custom_info) && e.custom_info.length > 0 || e.engine && typeof e.engine == "object" && e.engine.type || yt(e.prompt) || typeof (e.negative_prompt || e.negativePrompt) == "string" && yt(e.negative_prompt || e.negativePrompt) || e.models || e.model || e.checkpoint || e.loras || e.sampler || e.sampler_name || e.steps || e.cfg || e.cfg_scale || e.cfg_high_noise || e.cfg_low_noise || e.scheduler || Array.isArray(e.chained_passes) && e.chained_passes.length > 0 || Array.isArray(e.all_samplers) && e.all_samplers.length > 0 || e.seed || e.denoise || e.denoising || e.clip_skip || e.voice || e.language || e.temperature || e.top_k || e.top_p || e.repetition_penalty || e.max_new_tokens || e.device || e.voice_preset || e.instruct || e.dtype || e.attn_implementation || e.enable_chunking !== void 0 || e.max_chars_per_chunk || e.chunk_combination_method || e.silence_between_chunks_ms || e.enable_audio_cache !== void 0 || e.batch_size !== void 0 || e.use_torch_compile !== void 0 || e.use_cuda_graphs !== void 0 || e.compile_mode || typeof e.lyrics == "string" && e.lyrics.trim()) return !0;
	} catch {
		return !1;
	}
	return !1;
}
function $(e) {
	return e ? typeof e == "string" ? H(e) : typeof e == "object" ? H(e.name || e.value || "") : "" : "";
}
function Ur(e, t, n, r) {
	let i = String(r || "").trim();
	if (!i) return;
	let a = `${n}::${i}`;
	t.has(a) || (t.add(a), e.push({
		label: n,
		value: i
	}));
}
function Wr(e) {
	let t = `${String(e?.source || "").toLowerCase()} ${String(e?.name || e?.lora_name || "").toLowerCase()}`;
	return t.includes("high_noise") || t.includes("high noise") ? "high_noise" : t.includes("low_noise") || t.includes("low noise") ? "low_noise" : "";
}
function Gr(e) {
	let t = [], n = Array.isArray(e.model_groups) ? e.model_groups : [];
	if (n.length) return n.forEach((e) => {
		if (!e || typeof e != "object") return;
		let n = $(e.model), r = Array.isArray(e.loras) ? e.loras.map((e) => vt(e)).filter(Boolean) : [];
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
		model: $(r.unet_high_noise)
	}, {
		key: "low_noise",
		label: O("sidebar.generation.lowNoise", "Low Noise"),
		model: $(r.unet_low_noise)
	}].forEach((e) => {
		let n = i.filter((t) => Wr(t) === e.key).map((e) => vt(e)).filter(Boolean);
		!e.model && !n.length || t.push({
			...e,
			loras: n
		});
	}), t;
}
function Kr(e, t) {
	return t == null ? null : {
		label: e,
		value: t ? O("state.on", "on") : O("state.off", "off")
	};
}
function qr(e) {
	return e != null && String(e).trim() !== "";
}
function Jr(e) {
	let t = String(e || "").toLowerCase();
	return t.includes("high") ? "#52ffe8" : t.includes("low") ? "#42A5F5" : t.includes("refine") ? "#AB47BC" : t.includes("upscale") ? "#66BB6A" : t.includes("interpolation") || t.includes("video") ? "#dace26" : "#9C27B0";
}
function Yr(e) {
	return String(e || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function Xr(e, t) {
	let n = String(t || e || "").trim(), r = String(e || n).toLowerCase(), i = r.match(/^pass_(\d+)$/);
	return i ? O("sidebar.generation.stagePassN", "Pass {n}", { n: Number(i[1]) }) : r.includes("high") ? "High" : r.includes("low") ? "Low" : r.includes("refine") ? "Refiner" : r.includes("upscale") ? "Upscale" : r.includes("text_to_image") || r.includes("image_to_image") || r === "base" ? "Base" : n || "Branch";
}
function Zr(e, t) {
	let n = new Set(t.map((e) => String(e).toLowerCase()));
	return e.find((e) => n.has(String(e.label || "").toLowerCase())) || null;
}
function Qr(e, t) {
	return qr(t) ? {
		label: e,
		value: t
	} : null;
}
function $r(e) {
	let t = String(e || "").toLowerCase();
	return t.includes("high_noise") || t.includes("high-noise") || t.includes("high noise") ? "high" : t.includes("low_noise") || t.includes("low-noise") || t.includes("low noise") ? "low" : "";
}
function ei(e) {
	return Array.isArray(e) || e && typeof e == "object" ? !1 : qr(e) && String(e).trim() !== "-";
}
function ti(e) {
	return typeof e == "number" ? Math.abs(e - Math.round(e)) < 1e-9 ? String(Math.round(e)) : e.toFixed(2).replace(/0+$/g, "").replace(/\.$/, "") : String(e ?? "").trim();
}
function ni(e) {
	if (!qr(e)) return null;
	let t = Number(e);
	return !Number.isFinite(t) || t <= 0 ? null : e;
}
function ri(e, t) {
	let n = ni(e.seed);
	if (n !== null) return n;
	let r = [Array.isArray(e.chained_passes) ? e.chained_passes : [], Array.isArray(e.all_samplers) ? e.all_samplers : []];
	for (let e of r) for (let t of e) {
		let e = ni(t?.seed_val ?? t?.seed);
		if (e !== null) return e;
	}
	for (let e of t || []) {
		let t = ni(Zr(e.fields || [], ["Seed"])?.value);
		if (t !== null) return t;
	}
	return null;
}
function ii(e, t) {
	if (!t || !ei(t.value)) return;
	let n = `${String(t.label || "").toLowerCase()}::${ti(t.value)}`;
	e.some((e) => `${String(e.label || "").toLowerCase()}::${ti(e.value)}` === n) || e.push({
		...t,
		value: ti(t.value)
	});
}
function ai(e, t, n, r) {
	let i = /* @__PURE__ */ new Map(), a = (e, t) => {
		let n = Yr(e || t || "branch") || "branch";
		n.includes("high") && (n = "high"), n.includes("low") && (n = "low");
		let r = i.get(n);
		if (r) return r;
		let a = {
			key: n,
			label: Xr(n, t),
			accent: Jr(n),
			modelFields: [],
			samplingFields: [],
			loras: []
		};
		return i.set(n, a), a;
	}, o = (e, t, n) => {
		let r = String(n || "").trim();
		r && (e.modelFields.some((e) => String(e.label || "").toLowerCase() === String(t || "").toLowerCase() && H(e.value) === H(r)) || e.modelFields.push({
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
		let t = $(c.unet), n = $r(t), r = $(c.checkpoint || (n ? null : c.unet) || e.model || e.checkpoint), i = $(c.unet_high_noise) || (n === "high" ? t : ""), l = $(c.unet_low_noise) || (n === "low" ? t : ""), u = $(c.clip), d = $(c.vae), f = Array.isArray(e.loras) ? e.loras.map((e) => vt(e)).filter(Boolean) : [], p = !!(i || l), m = !p && (r || u || d || f.length) ? a("base", "Base") : null, h = p && (u || d) ? a("shared", "Shared") : null, g = i ? a("high", "High") : null, _ = l ? a("low", "Low") : null;
		if (m) {
			r && o(m, e.model || e.checkpoint || c.checkpoint ? "Model" : "UNet", r), u && o(m, "CLIP", u), d && o(m, "VAE", d);
			for (let e of f) s(m, e);
		}
		h && (u && o(h, "CLIP", u), d && o(h, "VAE", d)), g && o(g, "UNet", i), _ && o(_, "UNet", l);
	}
	let l = i.get("high") || i.get("high_noise"), u = i.get("low") || i.get("low_noise"), d = [
		Zr(n, ["Sampler"]),
		Zr(n, ["Scheduler"]),
		Zr(n, ["Steps"]),
		Zr(n, ["Seed"])
	].filter(Boolean), f = Qr("CFG", e.cfg_high_noise), p = Qr("CFG", e.cfg_low_noise);
	l && [...d, ...f ? [f] : []].forEach((e) => ii(l.samplingFields, e)), u && [...d, ...p ? [p] : []].forEach((e) => ii(u.samplingFields, e));
	let m = (r || []).some((e) => Yr(e.label).includes("upscale")), h = (r || []).length === 2 && (r || []).every((e) => ["base", "pass_2"].includes(Yr(e.label)));
	for (let [e, t] of (r || []).entries()) {
		let n = Yr(t.label);
		if (!n) continue;
		let i = (r || []).filter((e) => Yr(e.label) === Yr(t.label)).length, o = Yr(t.stage), s = o ? (r || []).filter((e) => Yr(e.stage) === o).length : 0, c = Zr(t.fields || [], ["Model"]), d = $r(c?.value);
		["high", "low"].includes(n) || (d ? n = d : s > 1 || i > 1 ? n = `pass_${e + 1}` : h ? n = e === 0 ? "high" : "low" : n === "base" && l && u ? n = "high" : ["text_to_image", "image_to_image"].includes(n) && (n = m ? "low" : "base")), n.includes("upscale") && m && (n = "high");
		let f = a(n, t.label);
		if (!/^pass_\d+$/i.test(n) && c && String(c.value || "") !== "-") {
			let e = H(c.value);
			f.modelFields.some((t) => H(t.value) === e) || f.modelFields.push(c);
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
		].includes(String(e.label || "")) && ii(f.samplingFields, e);
	}
	return Array.from(i.values()).filter((e) => e.modelFields.length || e.samplingFields.length || e.loras.length);
}
function oi(e, t, n, r) {
	let i = [], a = (e, t, n, r) => {
		let a = r.filter((e) => e && qr(e.value) && String(e.value) !== "-");
		a.length && i.push({
			key: e,
			title: t,
			accent: n,
			fields: a
		});
	};
	for (let n of t || []) {
		let t = Yr(n.label), r = (n.fields || []).some((e) => {
			let t = String(e?.label || "").toLowerCase(), n = String(e?.value || "").toLowerCase();
			return t.includes("upscaler") || n.includes("upscale") || n.includes("upscaler") || /(?:^|[_\s-])to[_\s-]?\d{3,5}(?:[_\s.-]|$)/i.test(n);
		});
		t.includes("upscale") && (e.upscaler || r) && a("upscale", "Upscale", "#66BB6A", n.fields || []), (t.includes("interpolation") || t.includes("rife") || t.includes("film")) && a("interpolation", "Interpolation", "#26C6DA", n.fields || []);
	}
	a("audio", "MMAudio", "#26A69A", [
		Qr("Voice", e.voice),
		Qr("Language", e.language),
		Qr("Temperature", e.temperature),
		Qr("Lyrics Strength", e.lyrics_strength)
	].filter(Boolean)), a("interpolation", "Interpolation", "#26C6DA", [
		Qr("Engine", e.interpolation_engine || e.frame_interpolation || e.interpolator),
		Qr("Source FPS", e.source_fps || e.input_fps),
		Qr("Final FPS", e.final_fps || e.output_fps || e.fps)
	].filter(Boolean));
	for (let e of n || []) i.push({
		key: Yr(e.title) || `module_${i.length}`,
		title: e.title,
		accent: e.color || "#2196F3",
		fields: [{
			label: "Info",
			value: e.content
		}]
	});
	r && !i.some((e) => String(e.title).toLowerCase() === String(r).toLowerCase()) && a("workflow_engine", r, "#2196F3", [Qr("Engine", r)].filter(Boolean));
	let o = /* @__PURE__ */ new Set();
	return i.filter((e) => {
		let t = `${e.key}:${e.title}:${JSON.stringify(e.fields)}`;
		return o.has(t) ? !1 : (o.add(t), !0);
	});
}
function si(e) {
	return new Set(Array.isArray(e.override_fields) ? e.override_fields.map((e) => String(e || "").trim()).filter(Boolean) : []);
}
function ci(e, ...t) {
	return t.some((t) => e.has(t));
}
function li(e) {
	return Array.isArray(e) ? e.filter((e) => e && typeof e == "object").map((e, t) => ({
		title: String(e.title || O("sidebar.generation.customInfoN", "Custom Info {n}", { n: t + 1 })).trim(),
		content: String(e.content ?? e.value ?? "").trim(),
		color: /^#[0-9a-fA-F]{6}$/.test(String(e.color || "").trim()) ? String(e.color).trim() : "#2196F3"
	})).filter((e) => e.content) : [];
}
function ui(e) {
	let t = Vr(e), n = {
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
		isImageAsset: Ar(e),
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
		moduleBlocks: []
	};
	if (!t || typeof t == "object" && Object.keys(t).length === 0 || !Hr(t)) {
		let t = e?.metadata_raw?.geninfo_status || e?.geninfo_status;
		return t && typeof t == "object" && t.kind === "media_pipeline" ? {
			...n,
			kind: "media-only",
			mediaOnlyMessage: O("sidebar.generation.mediaOnlyPipeline", "This file looks like a media-only pipeline (e.g. LoadVideo/VideoCombine) and does not contain generation parameters.")
		} : Ar(e) || jr(e) ? {
			...n,
			kind: "caption-only",
			showAlignment: !1
		} : n;
	}
	let r = t, i = si(r), a = r.engine && typeof r.engine == "object" ? r.engine : null, o = !!(r.is_override || a?.mode === "override" || a?.parser_version === "geninfo-override-v1" || a?.source === "majoor_geninfo"), s = bt(r), c = gt(typeof r.prompt == "string" ? r.prompt : null, typeof (r.negative_prompt || r.negativePrompt) == "string" ? r.negative_prompt || r.negativePrompt : null), l = Array.isArray(r.all_positive_prompts) && r.all_positive_prompts.length > 1 ? r.all_positive_prompts.map((e, t) => {
		let n = gt(typeof e == "string" ? e : "", typeof r.all_negative_prompts?.[t] == "string" ? r.all_negative_prompts[t] : "");
		return {
			label: O("sidebar.generation.promptN", "Prompt {n}", { n: t + 1 }),
			positive: yt(n.positive),
			negative: yt(n.negative)
		};
	}).filter((e) => e.positive) : [], u = [], d = /* @__PURE__ */ new Set(), f = r.models && typeof r.models == "object" ? r.models : null, p = Gr(r), m = new Set(p.map((e) => String(e.model || "").trim()).filter(Boolean)), h = Array.isArray(r.all_checkpoints) && r.all_checkpoints.length > 1 ? r.all_checkpoints : null;
	if (f) {
		let e = new Set([
			$(f.unet_high_noise),
			$(f.unet_low_noise),
			...m
		].filter(Boolean));
		if (h) h.forEach((e, t) => {
			let n = $(e);
			Ur(u, d, O("sidebar.generation.checkpointN", "Checkpoint {n}", { n: t + 1 }), n);
		});
		else {
			let t = $(f.checkpoint);
			t && !e.has(t) && Ur(u, d, O("sidebar.generation.checkpoint", "Checkpoint"), t);
		}
		[
			["UNet", $(f.unet)],
			["Diffusion", $(f.diffusion)],
			[O("sidebar.generation.upscaler", "Upscaler"), $(f.upscaler)],
			["CLIP", $(f.clip)],
			["VAE", $(f.vae)]
		].forEach(([t, n]) => {
			e.has(n) || Ur(u, d, t, n);
		});
	} else (r.model || r.checkpoint) && Ur(u, d, O("sidebar.generation.model", "Model"), H(r.model || r.checkpoint));
	if (Array.isArray(r.loras) && r.loras.length > 0) {
		let e = r.loras.map((e) => vt(e)).filter(Boolean).join("\n");
		e && Ur(u, d, r.loras.length > 1 ? O("sidebar.generation.loras", "LoRAs") : "LoRA", e);
	}
	!f && r.clip && Ur(u, d, "CLIP", H(r.clip)), !f && r.vae && Ur(u, d, "VAE", H(r.vae)), !f && r.unet && Ur(u, d, "UNet", H(r.unet)), !f && r.diffusion && Ur(u, d, "Diffusion", H(r.diffusion)), !f && r.upscaler && Ur(u, d, O("sidebar.generation.upscaler", "Upscaler"), H(r.upscaler)), f && r.clip && Ur(u, d, "CLIP", H(r.clip)), f && r.vae && Ur(u, d, "VAE", H(r.vae));
	for (let e of u) {
		let t = String(e.label || "").toLowerCase();
		(t.includes("checkpoint") || t === "model") && (e.override = ci(i, "checkpoint", "model")), t === "clip" && (e.override = ci(i, "clip")), t === "vae" && (e.override = ci(i, "vae")), t.includes("lora") && (e.override = ci(i, "loras"));
	}
	let g = [];
	qr(r.seed) && g.push({
		label: O("sidebar.generation.seed", "Seed"),
		value: r.seed,
		override: ci(i, "seed")
	}), (r.sampler || r.sampler_name) && g.push({
		label: O("sidebar.generation.sampler", "Sampler"),
		value: r.sampler || r.sampler_name,
		override: ci(i, "sampler", "sampler_name")
	}), qr(r.steps) && g.push({
		label: O("sidebar.generation.steps", "Steps"),
		value: r.steps,
		override: ci(i, "steps")
	});
	let _ = qr(r.cfg) ? r.cfg : r.cfg_scale;
	qr(_) && g.push({
		label: O("sidebar.generation.cfgScale", "CFG Scale"),
		value: _,
		override: ci(i, "cfg", "cfg_scale")
	}), r.cfg_high_noise !== void 0 && r.cfg_high_noise !== null && g.push({
		label: O("sidebar.generation.cfgHighNoise", "CFG High Noise"),
		value: r.cfg_high_noise
	}), r.cfg_low_noise !== void 0 && r.cfg_low_noise !== null && g.push({
		label: O("sidebar.generation.cfgLowNoise", "CFG Low Noise"),
		value: r.cfg_low_noise
	}), r.scheduler && g.push({
		label: O("sidebar.generation.scheduler", "Scheduler"),
		value: r.scheduler,
		override: ci(i, "scheduler")
	});
	let v = qr(r.denoise) ? r.denoise : r.denoising;
	qr(v) && g.push({
		label: O("sidebar.generation.denoise", "Denoise"),
		value: v,
		override: ci(i, "denoise", "denoising")
	});
	let y = [];
	Array.isArray(r.chained_passes) && r.chained_passes.length > 1 ? y = r.chained_passes.filter((e) => e && typeof e == "object").map((e, t) => ({
		label: Rr(e, t),
		stage: String(e?.pass_stage || "").trim(),
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
				label: "Start",
				value: Q(e?.start_at_step)
			},
			{
				label: "End",
				value: Q(e?.end_at_step)
			},
			{
				label: O("sidebar.generation.seed", "Seed"),
				value: Q(e?.seed_val || e?.seed)
			}
		]
	})) : Array.isArray(r.all_samplers) && r.all_samplers.length > 1 && (y = r.all_samplers.filter((e) => e && typeof e == "object").map((e, t) => ({
		label: Rr(e, t),
		stage: String(e?.pass_stage || "").trim(),
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
				label: "Start",
				value: Q(e?.start_at_step)
			},
			{
				label: "End",
				value: Q(e?.end_at_step)
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
		Kr(O("sidebar.generation.torchCompile", "Torch Compile"), r.use_torch_compile),
		Kr(O("sidebar.generation.cudaGraphs", "CUDA Graphs"), r.use_cuda_graphs),
		Kr(O("sidebar.generation.xVectorOnly", "X-Vector Only"), r.x_vector_only_mode)
	].filter(Boolean).forEach((e) => x.push(e));
	let S = [];
	[
		Kr(O("sidebar.generation.chunking", "Chunking"), r.enable_chunking),
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
		Kr(O("sidebar.generation.audioCache", "Audio Cache"), r.enable_audio_cache),
		r.batch_size !== void 0 && r.batch_size !== null ? {
			label: O("sidebar.generation.batchSize", "Batch Size"),
			value: r.batch_size
		} : null
	].filter(Boolean).forEach((e) => S.push(e));
	let C = [];
	r.lyrics_strength !== void 0 && r.lyrics_strength !== null && C.push({
		label: O("sidebar.generation.lyricsStrength", "Lyrics Strength"),
		value: r.lyrics_strength
	});
	let w = [];
	qr(v) && !g.some((e) => e.label === "Denoise") && w.push({
		label: O("sidebar.generation.denoise", "Denoise"),
		value: v
	}), qr(r.clip_skip) && w.push({
		label: O("sidebar.generation.clipSkip", "Clip Skip"),
		value: r.clip_skip
	});
	let T = [], ee = String(r.workflow_notes || r.notes || "").trim();
	ee && T.push({
		label: O("sidebar.generation.workflowNotes", "Workflow Notes"),
		value: ee,
		override: ci(i, "workflow_notes", "notes")
	});
	let te = li(r.custom_info), ne = ai(r, p, g, y), E = oi(r, y, te, s.workflowType), re = ri(r, y), ie = Array.isArray(r.inputs) ? r.inputs.filter((e) => e && typeof e == "object" && e.filename).map((e, t) => ({
		id: `${e.filename}-${t}`,
		filename: String(e.filename || "").trim(),
		filepath: String(e.filepath || e.filename || "").trim(),
		role: String(e.role || "").trim(),
		roleLabel: String(e.role || "").trim().replace(/_/g, " "),
		isVideo: String(e.type || "").toLowerCase() === "video" || /\.(mp4|mov|webm)$/i.test(String(e.filename || "")),
		previewCandidates: Ir(e)
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
		positivePromptOverride: ci(i, "prompt", "positive", "positive_prompt"),
		negativePromptOverride: ci(i, "negative_prompt", "negative", "negativePrompt"),
		promptTabs: l,
		showAlignment: !!e?.id && (!!String(c.positive || "").trim() || l.length > 0),
		isImageAsset: Ar(e),
		lyrics: String(r.lyrics || "").trim(),
		modelFields: u,
		modelGroups: p,
		branchCards: ne,
		pipelineTabs: y,
		samplingFields: g,
		ttsFields: b,
		ttsEngineFields: x,
		ttsInstruction: String(r.instruct || "").trim(),
		ttsRuntimeFields: S,
		audioFields: C,
		seed: re,
		imageFields: w,
		inputFiles: ie,
		isOverride: o,
		overrideLabel: o ? "Gen Info Override" : "",
		notesFields: T,
		customInfoBlocks: te,
		moduleBlocks: E
	};
}
//#endregion
//#region ui/vue/components/panel/sidebar/GenerationInputThumb.vue
var di = ["title"], fi = ["src"], pi = ["src"], mi = {
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
}, hi = {
	key: 3,
	title: "Video file",
	style: {
		position: "absolute",
		color: "white",
		opacity: "0.7",
		"font-size": "16px",
		"pointer-events": "none"
	}
}, gi = {
	__name: "GenerationInputThumb",
	props: { inputFile: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = B(0), r = B(!1);
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
			if (Lr(t)) try {
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
			onClick: o,
			onDblclick: s
		}, [e.inputFile.isVideo ? (j(), z("video", {
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
		}, null, 40, fi)) : (j(), z("img", {
			key: 1,
			src: i(),
			style: {
				width: "100%",
				height: "100%",
				"object-fit": "cover"
			},
			onError: a
		}, null, 40, pi)), e.inputFile.role && e.inputFile.role !== "secondary" ? (j(), z("div", mi, R(e.inputFile.roleLabel), 1)) : e.inputFile.isVideo ? (j(), z("div", hi, " Play ")) : F("", !0)], 44, di));
	}
}, _i = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "12px"
	}
}, vi = {
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
}, yi = { style: { opacity: "0.85" } }, bi = { style: {
	display: "flex",
	"align-items": "center",
	gap: "8px",
	"flex-wrap": "wrap",
	"justify-content": "flex-end"
} }, xi = ["title"], Si = ["title"], Ci = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, wi = { style: {
	"font-size": "11px",
	"font-weight": "700",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.6px"
} }, Ti = { style: {
	"font-size": "11px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"font-weight": "600"
} }, Ei = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#FF9800",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Di = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, Oi = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9E9E9E",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, ki = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, Ai = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, ji = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"margin-bottom": "10px"
} }, Mi = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "#4CAF50",
	"letter-spacing": "0.4px"
} }, Ni = ["onClick"], Pi = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "#F44336",
	"letter-spacing": "0.4px",
	"margin-top": "4px"
} }, Fi = ["onClick"], Ii = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Li = ["title"], Ri = ["title"], zi = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#F44336",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Bi = ["title"], Vi = ["title"], Hi = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9C27B0",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Ui = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(190px, 1fr))",
	gap: "10px"
} }, Wi = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.58)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Gi = ["onClick"], Ki = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "5px"
	}
}, qi = ["onClick"], Ji = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between"
} }, Yi = ["title"], Xi = { style: {
	display: "flex",
	"align-items": "center",
	gap: "10px"
} }, Zi = { style: {
	flex: "1",
	height: "8px",
	background: "rgba(255,255,255,0.1)",
	"border-radius": "4px",
	overflow: "hidden"
} }, Qi = {
	key: 0,
	style: {
		"font-size": "10px",
		color: "rgba(255,255,255,0.65)",
		border: "1px dashed rgba(255,255,255,0.25)",
		"border-radius": "4px",
		padding: "6px 8px",
		background: "rgba(255,255,255,0.04)"
	}
}, $i = { style: {
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
} }, ea = ["title"], ta = { style: {
	display: "flex",
	"align-items": "center",
	gap: "6px"
} }, na = ["title"], ra = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, ia = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, aa = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#FF9800",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, oa = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(130px, 1fr))",
	gap: "8px"
} }, sa = ["onClick"], ca = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9C27B0",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, la = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(220px, 1fr))",
	gap: "10px"
} }, ua = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, da = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "4px"
} }, fa = ["onClick"], pa = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "6px"
	}
}, ma = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.58)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, ha = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "5px"
} }, ga = ["onClick"], _a = { style: {
	display: "grid",
	"grid-template-columns": "auto 1fr",
	gap: "8px 12px",
	"align-items": "start"
} }, va = ["title"], ya = ["title"], ba = ["title", "onClick"], xa = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Sa = ["title", "onClick"], Ca = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#26C6DA",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, wa = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(190px, 1fr))",
	gap: "10px"
} }, Ta = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.58)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Ea = ["title", "onClick"], Da = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#26A69A",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Oa = ["title"], ka = { style: {
	"font-size": "11px",
	"font-weight": "700",
	color: "#E91E63",
	"text-transform": "uppercase",
	"letter-spacing": "1px"
} }, Aa = ["title"], ja = ["title"], Ma = { style: {
	display: "flex",
	gap: "8px",
	"flex-wrap": "wrap"
} }, Na = {
	__name: "SidebarGenerationSection",
	props: { asset: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = B(0), r = B(0), i = B(""), a = B(O("action.copy", "Copy")), o = B(O("action.generate", "Generate")), s = B(!1), c = B(u()), l = 0;
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
		let _ = I(() => ui(t.asset)), v = I(() => Mr()), y = I(() => _.value.kind === "full" || _.value.kind === "caption-only"), b = I(() => Fr(i.value) || _.value.emptyCaptionText), x = I(() => v.value && _.value.isImageAsset && !!t.asset?.id), S = I(() => v.value && !!Fr(b.value) && b.value !== _.value.emptyCaptionText), C = I(() => _.value.branchCards.filter((e) => e.modelFields.length || e.loras.length)), w = I(() => _.value.branchCards.filter((e) => e.samplingFields.length));
		I(() => _.value.branchCards.filter((e) => e.loras.length));
		let T = I(() => {
			let e = [], t = (e, t) => Sr(e)?.title || t;
			return !C.value.length && _.value.modelFields.length && e.push({
				key: "model",
				title: t("model", O("sidebar.generation.modelLora", "Model & LoRA")),
				accent: "#9C27B0",
				emphasis: !0,
				fields: _.value.modelFields
			}), !w.value.length && _.value.samplingFields.length && e.push({
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
		function ee(e, t, n = 450) {
			if (!e) return;
			let r = e.style.background;
			e.style.background = t, setTimeout(() => {
				e.style.background = r || "";
			}, n);
		}
		function te(e, t = !0) {
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
			return e === "high_noise" ? "#FF7043" : e === "low_noise" ? "#29B6F6" : "#AB47BC";
		}
		async function E(e, t = null, n = "rgba(76, 175, 80, 0.35)") {
			let r = String(e ?? "").trim();
			if (!(!r || r === "-")) try {
				await navigator.clipboard.writeText(r), ee(t, n);
			} catch (e) {
				console.debug?.(e);
			}
		}
		function re() {
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
		function ie() {
			c.value = u();
		}
		async function D() {
			l += 1;
			let e = l;
			if (!_.value.showAlignment || !t.asset?.id) {
				ie();
				return;
			}
			if (!v.value) {
				re();
				return;
			}
			ie();
			try {
				let n = await g(t.asset.id);
				if (e !== l) return;
				if (!n?.ok && (String(n?.code || "").toUpperCase() === "SERVICE_UNAVAILABLE" || /vector search is not enabled/i.test(String(n?.error || "")))) {
					re();
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
				let i = Math.round(r * 100), a = Nr(r);
				c.value = {
					scoreText: `${i}%`,
					scoreColor: a,
					qualityText: Pr(r),
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
		async function ae() {
			if (!(!x.value || s.value)) {
				s.value = !0, o.value = O("status.generating", "Generating...");
				try {
					let e = await p(t.asset.id);
					e?.ok && (i.value = String(e?.data || "").trim());
				} catch (e) {
					console.debug?.(e);
				} finally {
					s.value = !1, o.value = O("action.generate", "Generate");
				}
			}
		}
		async function oe() {
			if (S.value) try {
				await navigator.clipboard.writeText(b.value), a.value = O("viewer.copySuccessShort", "Copied!"), setTimeout(() => {
					a.value = O("action.copy", "Copy");
				}, 900);
			} catch (e) {
				console.debug?.(e);
			}
		}
		return Be(() => t.asset, () => {
			n.value = 0, r.value = 0, i.value = String(t.asset?.enhanced_caption || "").trim(), a.value = O("action.copy", "Copy"), o.value = O("action.generate", "Generate");
		}, { immediate: !0 }), Be(() => [
			t.asset?.id,
			_.value.kind,
			_.value.showAlignment,
			v.value
		], () => {
			D();
		}, { immediate: !0 }), (e, t) => {
			let r = Ge("MButton");
			return _.value.kind === "empty" ? F("", !0) : (j(), z("div", _i, [
				_.value.workflowType ? (j(), z("div", vi, [N("span", yi, R(L(O)("viewer.workflow", "Workflow")), 1), N("div", bi, [N("span", {
					title: L(O)("sidebar.generation.workflowEngine", "Workflow engine: {value}", { value: _.value.workflowType }),
					style: {
						background: "#2196F3",
						color: "white",
						padding: "2px 8px",
						"border-radius": "999px",
						"font-weight": "bold",
						"font-size": "10px",
						"letter-spacing": "0.2px"
					}
				}, R(_.value.workflowLabel || _.value.workflowType), 9, xi), _.value.workflowBadge ? (j(), z("span", {
					key: 0,
					title: L(O)("sidebar.generation.apiProvider", "API provider: {value}", { value: _.value.workflowBadge }),
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
				}, R(_.value.workflowBadge), 9, Si)) : F("", !0)])])) : F("", !0),
				_.value.isOverride ? (j(), z("div", {
					key: 1,
					style: V(f("#00BCD4", {
						emphasis: !0,
						startAlpha: .14,
						endAlpha: .08
					}))
				}, [N("div", Ci, [N("span", wi, R(L(O)("sidebar.generation.override", "Override")), 1), N("span", Ti, R(_.value.overrideLabel), 1)])], 4)) : F("", !0),
				_.value.isTruncated ? (j(), z("div", {
					key: 2,
					style: V(f("#FF9800", {
						emphasis: !0,
						startAlpha: .12,
						endAlpha: .08
					}))
				}, [N("div", Ei, R(L(O)("sidebar.generation.metadataTruncated", "Metadata Truncated")), 1), N("div", Di, R(L(O)("sidebar.generation.metadataTruncatedBody", "Generation data is incomplete because it exceeded the size limit.")), 1)], 4)) : F("", !0),
				_.value.kind === "media-only" ? (j(), z("div", {
					key: 3,
					style: V(f("#9E9E9E", {
						emphasis: !0,
						startAlpha: .1,
						endAlpha: .06
					}))
				}, [N("div", Oi, R(L(O)("sidebar.generation.generationData", "Generation Data")), 1), N("div", ki, R(_.value.mediaOnlyMessage), 1)], 4)) : F("", !0),
				_.value.kind === "full" ? (j(), z(M, { key: 4 }, [_.value.promptTabs.length ? (j(), z("div", {
					key: 0,
					style: V(f("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [
					N("div", Ai, R(L(O)("sidebar.generation.promptPipeline", "Prompt Pipeline ({count} variants)", { count: _.value.promptTabs.length })), 1),
					N("div", ji, [(j(!0), z(M, null, P(_.value.promptTabs, (e, t) => (j(), ze(r, {
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
						default: ct(() => [Re(R(e.label), 1)]),
						_: 2
					}, 1032, ["style", "onClick"]))), 128))]),
					(j(!0), z(M, null, P(_.value.promptTabs, (e, t) => Ve((j(), z("div", {
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
						N("div", Mi, R(L(O)("sidebar.generation.positive", "POSITIVE")), 1),
						N("div", {
							style: {
								"font-size": "12px",
								color: "var(--fg-color, #ddd)",
								"white-space": "pre-wrap",
								"line-height": "1.35",
								cursor: "pointer"
							},
							onClick: (t) => E(e.positive, t.currentTarget)
						}, R(e.positive), 9, Ni),
						e.negative ? (j(), z(M, { key: 0 }, [N("div", Pi, R(L(O)("sidebar.generation.negative", "NEGATIVE")), 1), N("div", {
							style: {
								"font-size": "12px",
								color: "var(--fg-color, #ddd)",
								"white-space": "pre-wrap",
								"line-height": "1.35",
								cursor: "pointer"
							},
							onClick: (t) => E(e.negative, t.currentTarget)
						}, R(e.negative), 9, Fi)], 64)) : F("", !0)
					])), [[Je, n.value === t]])), 128))
				], 4)) : _.value.positivePrompt ? (j(), z("div", {
					key: 1,
					style: V(f("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [N("div", Ii, [N("span", null, R(L(O)("sidebar.generation.positivePrompt", "Positive Prompt")), 1), _.value.positivePromptOverride ? (j(), z("span", {
					key: 0,
					style: V(h()),
					title: L(O)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
				}, R(L(O)("sidebar.generation.override", "override")), 13, Li)) : F("", !0)]), N("div", {
					title: L(O)("action.clickToCopy", "Click to copy"),
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: t[0] ||= (e) => E(_.value.positivePrompt, e.currentTarget)
				}, R(_.value.positivePrompt), 9, Ri)], 4)) : F("", !0), !_.value.promptTabs.length && _.value.negativePrompt ? (j(), z("div", {
					key: 2,
					style: V(f("#F44336", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [N("div", zi, [N("span", null, R(L(O)("sidebar.generation.negativePrompt", "Negative Prompt")), 1), _.value.negativePromptOverride ? (j(), z("span", {
					key: 0,
					style: V(h()),
					title: L(O)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
				}, R(L(O)("sidebar.generation.override", "override")), 13, Bi)) : F("", !0)]), N("div", {
					title: L(O)("action.clickToCopy", "Click to copy"),
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: t[1] ||= (e) => E(_.value.negativePrompt, e.currentTarget)
				}, R(_.value.negativePrompt), 9, Vi)], 4)) : F("", !0)], 64)) : F("", !0),
				C.value.length ? (j(), z("div", {
					key: 5,
					style: V(f("#9C27B0", {
						emphasis: !0,
						startAlpha: .18,
						endAlpha: .1
					}))
				}, [N("div", Hi, R(L(O)("sidebar.generation.models", "Models")), 1), N("div", Ui, [(j(!0), z(M, null, P(C.value, (e) => (j(), z("div", {
					key: `models-top-${e.key}`,
					style: V(te(e.accent, !0))
				}, [
					N("div", { style: V({
						fontSize: "10px",
						fontWeight: "800",
						color: e.accent,
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
					}, [N("span", Wi, R(t.label), 1), N("span", {
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.96))",
							"line-height": "1.35",
							"word-break": "break-word",
							cursor: "pointer"
						},
						onClick: (e) => E(t.value, e.currentTarget)
					}, R(t.value || "-"), 9, Gi)]))), 128)),
					e.loras.length ? (j(), z("div", Ki, [t[4] ||= N("span", { style: {
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
						onClick: (e) => E(t, e.currentTarget)
					}, R(t), 9, qi))), 128))])) : F("", !0)
				], 4))), 128))])], 4)) : F("", !0),
				y.value ? (j(), z("div", {
					key: 6,
					style: {
						background: "linear-gradient(135deg, rgba(0, 188, 212, 0.14) 0%, rgba(33, 150, 243, 0.10) 100%)",
						border: "1px solid rgba(0, 188, 212, 0.40)",
						"border-radius": "6px",
						padding: "12px",
						display: "flex",
						"flex-direction": "column",
						gap: "10px"
					},
					class: rt({ "mjr-ai-disabled-block": !v.value })
				}, [
					_.value.showAlignment ? (j(), z(M, { key: 0 }, [
						N("div", Ji, [N("span", { title: L(O)("sidebar.generation.promptAlignmentTooltip", "How closely the generated image matches the prompt (SigLIP2 score)") }, R(L(O)("sidebar.generation.promptAlignment", "Prompt Alignment")), 9, Yi)]),
						N("div", Xi, [
							N("div", Zi, [N("div", { style: V({
								height: "100%",
								width: c.value.fillWidth,
								background: c.value.fillColor,
								borderRadius: "4px",
								transition: "width 0.6s ease, background 0.4s ease"
							}) }, null, 4)]),
							N("span", { style: V({
								fontSize: "13px",
								fontWeight: "700",
								color: c.value.scoreColor,
								minWidth: "60px",
								textAlign: "right",
								fontFamily: "'Consolas', 'Monaco', monospace"
							}) }, R(c.value.scoreText), 5),
							N("span", { style: V({
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
						c.value.aiStatusVisible ? (j(), z("div", Qi, R(c.value.aiStatusText), 1)) : F("", !0)
					], 64)) : F("", !0),
					N("div", $i, [N("span", { title: L(O)("sidebar.generation.aiCaptionTooltip", "AI caption generated by Florence-2") }, R(_.value.captionLabel), 9, ea), N("div", ta, [tt(r, {
						type: "button",
						class: "mjr-ai-control",
						severity: "secondary",
						text: "",
						disabled: !x.value || s.value,
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
						onClick: We(ae, ["stop"])
					}, {
						default: ct(() => [Re(R(o.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"]), tt(r, {
						type: "button",
						class: "mjr-ai-control",
						severity: "secondary",
						text: "",
						disabled: !S.value,
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
							opacity: S.value ? "1" : "0.6",
							cursor: S.value ? "pointer" : "default"
						}]),
						onClick: We(oe, ["stop"])
					}, {
						default: ct(() => [Re(R(a.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"])])]),
					N("div", {
						title: v.value ? L(O)("sidebar.generation.copyCaptionTooltip", "Click to copy caption") : L(O)("sidebar.generation.aiCaptionDisabled", "AI caption controls are disabled"),
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
							cursor: S.value ? "copy" : "default"
						}),
						onClick: oe
					}, R(b.value), 13, na)
				], 2)) : F("", !0),
				_.value.lyrics ? (j(), z("div", {
					key: 7,
					style: V(f("#00BCD4", { emphasis: !1 }))
				}, [N("div", ra, [N("span", null, R(L(O)("sidebar.generation.lyrics", "Lyrics")), 1)]), N("div", ia, R(_.value.lyrics), 1)], 4)) : F("", !0),
				_.value.branchCards.length ? (j(), z(M, { key: 8 }, [
					F("", !0),
					w.value.length ? (j(), z("div", {
						key: 1,
						style: V(f("#FF9800", {
							emphasis: !0,
							startAlpha: .16,
							endAlpha: .1
						}))
					}, [N("div", aa, R(L(O)("sidebar.generation.sampling", "Sampling")), 1), N("div", oa, [(j(!0), z(M, null, P(w.value, (e) => (j(), z("div", {
						key: `sampling-${e.key}`,
						style: V(te(e.accent, !0))
					}, [N("div", { style: V({
						fontSize: "10px",
						fontWeight: "800",
						color: e.accent,
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
						onClick: (e) => E(t.value, e.currentTarget)
					}, R(t.value), 9, sa)]))), 128))], 4))), 128))])], 4)) : F("", !0),
					F("", !0)
				], 64)) : _.value.modelGroups.length ? (j(), z("div", {
					key: 9,
					style: V(f("#9C27B0", {
						emphasis: !0,
						startAlpha: .18,
						endAlpha: .1
					}))
				}, [N("div", ca, R(L(O)("sidebar.generation.models", "Models")), 1), N("div", la, [(j(!0), z(M, null, P(_.value.modelGroups, (e) => (j(), z("div", {
					key: `model-group-${e.key}`,
					style: V(te(ne(e.key), !0))
				}, [
					N("div", ua, [N("div", { style: V({
						fontSize: "10px",
						fontWeight: "800",
						color: ne(e.key),
						letterSpacing: "0.6px",
						textTransform: "uppercase"
					}) }, R(e.label), 5), N("span", { style: V({
						fontSize: "9px",
						fontWeight: "700",
						color: "#fff",
						background: d(ne(e.key), .22),
						border: `1px solid ${d(ne(e.key), .48)}`,
						borderRadius: "999px",
						padding: "2px 8px",
						letterSpacing: "0.4px",
						textTransform: "uppercase"
					}) }, R(e.loras?.length || 0) + " LoRA ", 5)]),
					N("div", da, [t[5] ||= N("div", { style: {
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
						onClick: (t) => E(e.model, t.currentTarget)
					}, R(e.model || "-"), 9, fa)]),
					e.loras?.length ? (j(), z("div", pa, [N("div", ma, R(L(O)("sidebar.generation.loraStack", "LoRA Stack")), 1), N("div", ha, [(j(!0), z(M, null, P(e.loras, (t, n) => (j(), z("div", {
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
					}, R(t), 9, ga))), 128))])])) : F("", !0)
				], 4))), 128))])], 4)) : F("", !0),
				(j(!0), z(M, null, P(T.value, (e) => (j(), z("div", {
					key: e.key,
					style: V(f(e.accent, { emphasis: e.emphasis }))
				}, [N("div", { style: V({
					fontSize: "11px",
					fontWeight: "600",
					color: e.accent,
					textTransform: "uppercase",
					letterSpacing: "0.5px",
					marginBottom: "10px"
				}) }, R(e.title), 5), N("div", _a, [(j(!0), z(M, null, P(e.fields, (t) => (j(), z(M, { key: `${e.key}-${t.label}` }, [N("div", {
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
				}, R(L(O)("sidebar.generation.override", "override")), 13, ya)) : F("", !0)], 8, va), N("div", {
					title: `${t.label}: ${t.value}`,
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.95))",
						"word-break": "break-word",
						"white-space": "pre-wrap",
						cursor: "pointer"
					},
					onClick: (e) => E(t.value, e.currentTarget)
				}, R(t.value), 9, ba)], 64))), 128))])], 4))), 128)),
				_.value.notesFields.length ? (j(), z("div", {
					key: 10,
					style: V(f("#4CAF50", { emphasis: !1 }))
				}, [N("div", xa, R(L(O)("sidebar.generation.notes", "Notes")), 1), (j(!0), z(M, null, P(_.value.notesFields, (e) => (j(), z("div", {
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
				}, R(e.value), 9, Sa))), 128))], 4)) : F("", !0),
				_.value.moduleBlocks.length ? (j(), z("div", {
					key: 11,
					style: V(f("#26C6DA", {
						emphasis: !0,
						startAlpha: .14,
						endAlpha: .08
					}))
				}, [N("div", Ca, R(L(O)("sidebar.generation.modules", "Modules")), 1), N("div", wa, [(j(!0), z(M, null, P(_.value.moduleBlocks, (e) => (j(), z("div", {
					key: `module-${e.key}-${e.title}`,
					style: V(te(e.accent, !1))
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
				}, [N("span", Ta, R(t.label), 1), N("span", {
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
				}, R(t.value), 9, Ea)]))), 128))], 4))), 128))])], 4)) : F("", !0),
				_.value.ttsInstruction ? (j(), z("div", {
					key: 12,
					style: V(f("#26A69A", { emphasis: !1 }))
				}, [N("div", Da, [N("span", null, R(L(O)("sidebar.generation.ttsInstruction", "TTS Instruction")), 1)]), N("div", {
					title: L(O)("action.clickToCopy", "Click to copy"),
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: t[2] ||= (e) => E(_.value.ttsInstruction, e.currentTarget)
				}, R(_.value.ttsInstruction), 9, Oa)], 4)) : F("", !0),
				_.value.seed !== null && _.value.seed !== void 0 && _.value.seed !== "" ? (j(), z("div", {
					key: 13,
					style: V(m())
				}, [N("div", ka, R(L(O)("sidebar.generation.seed", "SEED")), 1), N("div", {
					title: L(O)("sidebar.generation.copySeedTooltip", "Click to copy seed: {seed}", { seed: _.value.seed }),
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
					onClick: t[3] ||= (e) => E(_.value.seed, e.currentTarget, "rgba(76, 175, 80, 0.4)")
				}, R(_.value.seed), 9, Aa)], 4)) : F("", !0),
				_.value.inputFiles.length ? (j(), z("div", {
					key: 14,
					style: V(f("#4CAF50", {
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
				}, R(L(O)("sidebar.generation.sourceFiles", "Source Files")), 9, ja), N("div", Ma, [(j(!0), z(M, null, P(_.value.inputFiles, (e) => (j(), ze(gi, {
					key: e.id,
					"input-file": e
				}, null, 8, ["input-file"]))), 128))])], 4)) : F("", !0)
			]));
		};
	}
}, Pa = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, Fa = /^[0-9a-f]{20,}$/i;
function Ia(...e) {
	for (let t of e) {
		let e = String(t || "").trim();
		if (e) return e;
	}
	return "";
}
function La(e) {
	let t = String(e || "").trim();
	return !!t && (Pa.test(t) || Fa.test(t));
}
function Ra(e) {
	return String(e?.type || e?.class_type || e?.comfyClass || e?.classType || "").trim();
}
function za(e) {
	return Ia(e?.properties?.subgraph_name, e?.title, e?.properties?.title, e?.properties?.name, e?.properties?.label, e?.name, e?.subgraph?.name, e?.subgraph_instance?.name);
}
function Ba(e) {
	let t = Ra(e), n = za(e);
	return n && (!t || La(t) || n !== t) ? n : t && !La(t) ? t : n || (t ? "Subgraph" : String(e?.id || "Node").trim() || "Node");
}
function Va(e) {
	let t = Ra(e);
	return t && !La(t) ? t : t ? "Subgraph" : "Node";
}
//#endregion
//#region ui/components/sidebar/utils/minimap.ts
var Ha = 6, Ua = 1, Wa = 8, Ga = 74, Ka = 42, qa = [
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
], Ja = (e, t, n) => {
	let r = Number(e);
	return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
}, Ya = (e, t = !1) => {
	let n = String(e || "").toUpperCase();
	return n.includes("IMAGE") ? "rgba(145,198,99,0.9)" : n.includes("LATENT") ? "rgba(89,178,118,0.9)" : n.includes("MODEL") ? "rgba(112,155,255,0.9)" : n.includes("CONDITIONING") ? "rgba(191,123,226,0.9)" : n.includes("CLIP") ? "rgba(220,178,77,0.9)" : n.includes("VAE") ? "rgba(72,184,214,0.9)" : n.includes("MASK") ? "rgba(190,190,190,0.88)" : n.includes("STRING") || n.includes("TEXT") ? "rgba(230,230,230,0.86)" : n.includes("INT") || n.includes("FLOAT") || n.includes("NUMBER") ? "rgba(130,210,220,0.88)" : t ? "rgba(170,220,255,0.82)" : "rgba(255,255,255,0.72)";
}, Xa = (e, t, n) => {
	let r = String(t || "").replace(/\s+/g, " ").trim(), i = Math.max(1, Number(n) || 1);
	if (!r || e.measureText(r).width <= i) return r;
	let a = r;
	for (; a.length > 3 && e.measureText(`${a}...`).width > i;) a = a.slice(0, -1);
	return a.length > 3 ? `${a}...` : r.slice(0, 3);
};
function Za(e, t, n = null) {
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
	}, a = i.expandSubgraphs === !1 ? t : Qa(t), o = Array.isArray(a?.nodes) ? a.nodes : [], s = Array.isArray(a?.groups) && a.groups || Array.isArray(a?.extra?.groups) && a.extra.groups || Array.isArray(a?.extra?.groupNodes) && a.extra.groupNodes || Array.isArray(a?.extra?.group_nodes) && a.extra.group_nodes || [], c = Array.isArray(a?.links) && a.links || Array.isArray(a?.extra?.links) && a.extra.links || [], l = Math.max(1, e.clientWidth || e.width || 1), u = Math.max(1, e.clientHeight || e.height || 1);
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
		for (let [e, t] of qa) if (n.includes(e)) return t;
		let r = 0;
		for (let e = 0; e < n.length; e += 1) r = r * 31 + n.charCodeAt(e) | 0;
		return `hsl(${Math.abs(r) % 360} 42% 42%)`;
	}, p = (e) => {
		let t = [], n = e?.inputs && typeof e.inputs == "object" && !Array.isArray(e.inputs) ? e.inputs : null;
		if (n) {
			for (let [e, r] of Object.entries(n)) if (!(Array.isArray(r) || r && typeof r == "object") && (t.push([e, r]), t.length >= 3)) return t;
		}
		let r = Array.isArray(e?.widgets_values) ? e.widgets_values : [], i = Array.isArray(e?.widgets) ? e.widgets : [], a = Array.isArray(e?.inputs) ? e.inputs : [], o = a.filter((e) => e?.widget === !0 || e?.widget && typeof e.widget == "object" || typeof e?.widget == "string" && e.widget.trim()), s = a.filter((e) => e?.link == null && oo(e?.type)), c = (o.length ? o : s.length ? s : a).map((e) => String(e?.label || e?.localized_name || e?.name || e?.widget?.name || e?.widget?.label || "").trim());
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
			label: Ba(e).replace(/\s+/g, " ").trim()
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
	let S = Math.max(1, b - v), C = Math.max(1, x - y), w = v + S / 2, T = y + C / 2, ee = i.view && typeof i.view == "object" ? i.view : Object.create(null), te = Ja(ee.zoom ?? 1, Ua, Wa), ne = Math.max(1, S / te), E = Math.max(1, C / te), re = ne / 2, ie = E / 2, D = ne >= S ? w : Ja(ee.centerX ?? w, v + re, b - re), ae = E >= C ? T : Ja(ee.centerY ?? T, y + ie, x - ie), oe = D - re, se = ae - ie, ce = Ha, le = Math.min((l - ce * 2) / ne, (u - ce * 2) / E), ue = ee.hoveredNodeId !== null && ee.hoveredNodeId !== void 0 ? String(ee.hoveredNodeId) : null;
	r.clearRect(0, 0, l, u), r.fillStyle = "rgba(0,0,0,0.22)", r.fillRect(0, 0, l, u);
	let de = (e, t) => ({
		x: ce + (e - oe) * le,
		y: ce + (t - se) * le
	}), fe = (e, t) => ({
		x: Ja(oe + (Number(e) - ce) / le, v, b),
		y: Ja(se + (Number(t) - ce) / le, y, x)
	}), pe = (e) => ({
		x: ce + (e.x - oe) * le,
		y: ce + (e.y - se) * le,
		w: Math.max(1, e.w * le),
		h: Math.max(1, e.h * le)
	}), me = (e) => Math.max(10, Math.min(24, Math.floor(Number(e) * .2))), he = (e, t, n) => {
		let r = pe(e), i = me(r.h), a = n === "output" ? e.outputs : e.inputs, o = Math.max(1, Array.isArray(a) ? a.length : Number(e[`${n}Count`]) || 0), s = Ja(t, 0, Math.max(0, o - 1));
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
		let { x: t, y: n, w: a, h: o } = pe(e), s = e.kind === "node", c = e.kind === "group", l = !!e.bypassed, u = !!e.errored, f = c ? .18 : l && i.renderBypassState ? .14 : .62, p = c ? .55 : l && i.renderBypassState ? .32 : .8, m = d(e.fill, f), h = d(e.stroke, p), g = s && i.showNodeLabels && a >= Ga && o >= Ka, _ = Math.max(2, Math.min(g ? 7 : 8, Math.floor(Math.min(a, o) * .08))), v = s ? me(o) : 0;
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
				r.fillStyle = Ya(e.inputs?.[i]?.type, !1), r.beginPath(), r.arc(t, n, g ? 3 : 2.2, 0, Math.PI * 2), r.fill(), r.stroke();
			}
			for (let n = 0; n < i; n += 1) {
				let i = he(e, n, "output");
				r.fillStyle = Ya(e.outputs?.[n]?.type, !0), r.beginPath(), r.arc(t + a, i, g ? 3 : 2.2, 0, Math.PI * 2), r.fill(), r.stroke();
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
				s && r.fillText(Xa(r, s, i), t + 7, he(e, a, "input") + n * .35, i);
			}
			for (let o = 0; o < Math.min(8, e.outputs?.length || 0); o += 1) {
				let s = e.outputs[o], c = String(s?.label || s?.localized_name || s?.name || "").trim();
				if (!c) continue;
				let l = Xa(r, c, i);
				r.fillText(l, t + a - 7 - Math.min(i, r.measureText(l).width), he(e, o, "output") + n * .35, i);
			}
			r.restore();
		}
	};
	for (let e of m.filter((e) => e.kind === "group")) ye(e);
	ve();
	for (let e of m.filter((e) => e.kind === "node")) ye(e);
	if (i.showViewport) try {
		let e = be();
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
			zoom: te,
			centerX: D,
			centerY: ae,
			visibleW: ne,
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
function Qa(e) {
	if (!e || typeof e != "object") return e;
	let t = Array.isArray(e.nodes) ? e.nodes.filter(Boolean) : [], n = $a(e);
	if (!t.length) return e;
	let r = [], i = Array.isArray(e.links) ? [...e.links] : [], a = [...Array.isArray(e.groups) ? e.groups : [], ...Array.isArray(e.extra?.groups) ? e.extra.groups : []];
	for (let e of t) {
		r.push(e);
		let t = eo(e, n);
		if (!t || !Array.isArray(t.nodes) || !t.nodes.length) continue;
		let o = no(e, Qa(t));
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
function $a(e) {
	let t = [
		...Array.isArray(e?.definitions?.subgraphs) ? e.definitions.subgraphs : [],
		...Array.isArray(e?.subgraphs) ? e.subgraphs : [],
		...Array.isArray(e?.rootGraph?.subgraphs) ? e.rootGraph.subgraphs : []
	], n = /* @__PURE__ */ new Map();
	for (let e of t) for (let t of to(e)) t != null && n.set(String(t), e);
	return n;
}
function eo(e, t) {
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
function to(e) {
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
function no(e, t) {
	let n = String(e?.id ?? e?.ID ?? ""), r = io(e?.pos) || [0, 0], i = ao(e?.size) || [260, 180], a = t.nodes.filter(Boolean), o = ro(a), s = Math.min(22, Math.max(8, i[0] * .08)), c = Math.min(34, Math.max(18, i[1] * .18)), l = Math.min(18, Math.max(8, i[1] * .08)), u = Math.max(40, i[0] - s * 2), d = Math.max(34, i[1] - c - l), f = Math.min(1, u / o.width, d / o.height), p = r[0] + s + (u - o.width * f) / 2, m = r[1] + c + (d - o.height * f) / 2, h = a.map((r) => {
		let i = io(r?.pos) || [o.minX, o.minY], a = ao(r?.size) || [140, 60];
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
function ro(e) {
	let t = Infinity, n = Infinity, r = -Infinity, i = -Infinity;
	for (let a of e) {
		let e = io(a?.pos);
		if (!e) continue;
		let o = ao(a?.size) || [140, 60];
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
function io(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.x ?? e.left ?? null, n = e[1] ?? e[1] ?? e.y ?? e.top ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function ao(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.w ?? e.width ?? null, n = e[1] ?? e[1] ?? e.h ?? e.height ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function oo(e) {
	if (Array.isArray(e)) return !0;
	let t = String(e || "").trim().toUpperCase();
	return t === "INT" || t === "FLOAT" || t === "STRING" || t === "BOOLEAN" || t === "BOOL" || t === "COMBO" || t === "ENUM";
}
function so(e, t = null) {
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
var co = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "var(--comfy-menu-bg, rgba(0,0,0,0.2))",
		border: "1px solid var(--border-color, rgba(255,255,255,0.14))",
		"border-radius": "8px",
		padding: "12px",
		"min-width": "300px"
	}
}, lo = { style: { "margin-bottom": "12px" } }, uo = { style: {
	"font-size": "16px",
	"font-weight": "800",
	color: "rgba(255,255,255,0.94)",
	"line-height": "1.25",
	overflow: "hidden",
	"text-overflow": "ellipsis"
} }, fo = ["title"], po = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "8px",
	"margin-bottom": "10px"
} }, mo = { style: {
	padding: "4px 9px",
	"border-radius": "999px",
	background: "rgba(33,150,243,0.14)",
	border: "1px solid rgba(33,150,243,0.30)",
	"font-size": "11px",
	"font-weight": "700",
	color: "#90CAF9",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, ho = {
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
}, go = { style: {
	display: "grid",
	"grid-template-columns": "repeat(2, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, _o = {
	key: 0,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, vo = { style: {
	"font-size": "13px",
	"font-weight": "750",
	color: "rgba(255,255,255,0.92)",
	"margin-top": "3px"
} }, yo = {
	key: 1,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, bo = { style: {
	"font-size": "13px",
	"font-weight": "750",
	color: "rgba(255,255,255,0.92)",
	"margin-top": "3px"
} }, xo = {
	key: 2,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, So = { style: {
	"font-size": "13px",
	"font-weight": "750",
	color: "rgba(255,255,255,0.92)",
	"margin-top": "3px"
} }, Co = {
	key: 3,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, wo = { style: {
	"font-size": "12px",
	"font-weight": "650",
	color: "rgba(255,255,255,0.84)",
	"margin-top": "3px"
} }, To = {
	key: 0,
	style: {
		"font-size": "11px",
		color: "rgba(255,255,255,0.54)",
		"margin-top": "2px"
	}
}, Eo = {
	key: 0,
	style: {
		"margin-bottom": "12px",
		padding: "10px",
		"border-radius": "10px",
		background: "rgba(244,67,54,0.08)",
		border: "1px solid rgba(244,67,54,0.25)"
	}
}, Do = {
	key: 1,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "5px"
	}
}, Oo = {
	key: 1,
	style: {
		"margin-bottom": "12px",
		padding: "10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.035)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, ko = {
	key: 0,
	style: {
		"font-size": "12px",
		"line-height": "1.45",
		color: "rgba(255,255,255,0.82)",
		"white-space": "pre-wrap"
	}
}, Ao = { style: {
	display: "grid",
	"grid-template-columns": "repeat(2, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, jo = { style: {
	display: "grid",
	"grid-template-columns": "repeat(3, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, Mo = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, No = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, Po = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, Fo = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, Io = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, Lo = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, Ro = { style: {
	"margin-bottom": "12px",
	padding: "10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.03)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, zo = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px",
	"margin-bottom": "8px"
} }, Bo = { style: {
	"font-size": "12px",
	color: "rgba(255,255,255,0.8)",
	"margin-top": "2px"
} }, Vo = {
	key: 0,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "4px",
		"justify-content": "flex-end"
	}
}, Ho = { style: {
	display: "flex",
	gap: "8px",
	"align-items": "center"
} }, Uo = ["placeholder"], Wo = {
	key: 2,
	class: "mjr-workflow-tree-wrap"
}, Go = { class: "mjr-workflow-tree-node" }, Ko = { class: "mjr-workflow-tree-node-name" }, qo = {
	key: 0,
	class: "mjr-workflow-tree-node-type"
}, Jo = { class: "mjr-menu-item-hint" }, Yo = {
	key: 0,
	class: "mjr-section-hint"
}, Xo = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px",
	"margin-top": "8px"
} }, Zo = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"align-items": "center"
} }, Qo = {
	key: 3,
	style: {
		display: "grid",
		"grid-template-columns": "repeat(auto-fit, minmax(180px, 1fr))",
		gap: "8px",
		"align-items": "stretch",
		"margin-top": "10px",
		"margin-bottom": "10px"
	}
}, $o = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "2px",
	"min-width": "0"
} }, es = { style: {
	"font-size": "13px",
	"font-weight": "600"
} }, ts = { style: {
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, ns = { style: {
	display: "flex",
	gap: "10px",
	"align-items": "stretch",
	"margin-top": "10px"
} }, rs = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	gap: "10px",
	"margin-top": "8px",
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, is = ["open"], as = { style: {
	background: "rgba(0,0,0,0.5)",
	padding: "10px",
	"border-radius": "6px",
	"font-size": "11px",
	overflow: "auto",
	"max-height": "180px",
	margin: "10px 0 0 0",
	color: "#90CAF9",
	"font-family": "'Consolas', 'Monaco', monospace"
} }, os = 1, ss = 8, cs = 250, ls = {
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
		]), s = B(null), c = B(""), l = B(!1), u = B(!1), d = B(null), f = B(!1), p = B(!1), m = B(re()), h = B({ ...i }), g = B("crosshair"), _ = B(""), v = null, y = null, b = null;
		function S(e, t, n) {
			let r = Number(e);
			return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
		}
		function C(e) {
			!e || typeof e != "object" || (h.value = {
				...h.value,
				zoom: S(e.zoom ?? h.value.zoom, os, ss),
				centerX: Number.isFinite(Number(e.centerX)) ? Number(e.centerX) : null,
				centerY: Number.isFinite(Number(e.centerY)) ? Number(e.centerY) : null
			});
		}
		function w() {
			h.value = { ...i }, _.value = "";
		}
		function ee(e) {
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
		function ne(e) {
			let t = ee(e), n = e?.workflow || e?.Workflow || e?.comfy_workflow || t?.workflow || t?.Workflow || t?.comfy_workflow || null;
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
		function E(e) {
			let t = ee(e), n = e?.prompt || e?.Prompt || t?.prompt || t?.Prompt || null;
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
		function re() {
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
				let e = localStorage?.getItem?.(x);
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
					}, q(e), localStorage?.removeItem?.(x);
				} catch (e) {
					console.debug?.(e);
				}
				return r;
			} catch {
				return { ...n };
			}
		}
		function ie(e) {
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
		let D = I(() => {
			let e = ne(t.asset) || ne(d.value), n = E(t.asset) || E(d.value);
			return !e && !n ? null : e || so(n);
		}), ae = I(() => String(t.asset?.filepath || t.asset?.path || t.asset?.file_info?.filepath || "").trim()), oe = I(() => String(t.asset?.display_name || t.asset?.name || t.asset?.filename || t.asset?.title || "Workflow").trim()), ce = I(() => String(t.asset?.task || t.asset?.workflow_task || "").trim()), le = I(() => String(t.asset?.model_family || t.asset?.workflow_model_family || "").trim()), ue = I(() => String(t.asset?.provider || t.asset?.workflow_provider || "").trim()), de = I(() => String(t.asset?.runs_on || t.asset?.runsOn || "").trim().toLowerCase()), fe = I(() => {
			let e = de.value, t = ue.value;
			return e === "api" && t ? `API · ${t}` : e ? t && t.toLowerCase() !== e ? `${e} · ${t}` : e : t;
		}), pe = I(() => String(t.asset?.notes || "").trim()), me = I(() => [
			t.asset?.detected_task ? `detected: ${t.asset.detected_task}` : "",
			t.asset?.detected_model_family ? t.asset.detected_model_family : "",
			t.asset?.detected_provider ? t.asset.detected_provider : ""
		].filter(Boolean).join(" · ")), ge = I(() => be(t.asset?.missing_nodes || t.asset?.missingNodes)), _e = I(() => be(t.asset?.missing_models || t.asset?.missingModels)), ve = I(() => {
			let e = Number(t.asset?.usage_count || t.asset?.usageCount || 0);
			return !Number.isFinite(e) || e <= 0 ? "" : `${Math.floor(e)} use${e === 1 ? "" : "s"}`;
		}), ye = I(() => xe(t.asset?.mtime || t.asset?.modified_at || t.asset?.updated_at));
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
			if (D.value) return;
			let e = ae.value;
			if (e && !u.value) {
				u.value = !0;
				try {
					let t = await he(e, { timeoutMs: 25e3 });
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
					u.value = !1;
				}
			}
		}
		let Ce = I(() => t.asset?.has_generation_data ? "Complete" : "Partial"), we = I(() => D.value ? JSON.stringify(D.value, null, 2) : ""), Te = I(() => String(t.asset?.category || t.asset?.subfolder || t.asset?.folder || "").trim().replace(/^\/+|\/+$/g, "")), k = I(() => Te.value ? Te.value.split(/[\\/]+/).filter(Boolean) : []);
		function Ee(e, t) {
			let n = e?.id ?? e?.key ?? t + 1;
			return String(e?.title || e?._meta?.title || e?.type || e?.class_type || e?.name || `Node ${n}`);
		}
		function De(e) {
			return String(e?.type || e?.class_type || e?.name || "").trim();
		}
		function A() {
			c.value = Te.value;
		}
		async function Oe() {
			let e = String(t.asset?.filepath || t.asset?.path || t.asset?.file_info?.filepath || "").trim();
			if (!e) {
				T(O("toast.workflowMissingPath", "Workflow file path is missing."), "error");
				return;
			}
			let n = String(c.value || "").trim();
			if (n !== Te.value) {
				l.value = !0;
				try {
					let t = await o({
						filepath: e,
						category: n
					}, { timeoutMs: 3e4 });
					if (!t?.ok) {
						T(t?.error || O("toast.workflowMoveFailed", "Failed to move workflow."), "error");
						return;
					}
					c.value = String(t?.data?.workflow?.category || n || "").trim(), T(O("toast.workflowCategoryUpdated", "Workflow category updated"), "success", 1800);
				} catch {
					T(O("toast.workflowMoveFailed", "Failed to move workflow."), "error");
				} finally {
					l.value = !1;
				}
			}
		}
		async function Ae() {
			let e = ae.value;
			if (!e) {
				T(O("toast.workflowMissingPath", "Workflow file path is missing."), "error");
				return;
			}
			let n = await r({
				filepath: e,
				limit: 12
			}, { timeoutMs: 15e3 });
			if (!n?.ok) {
				T(n?.error || O("toast.workflowLoadFailed", "Failed to load workflow."), "error");
				return;
			}
			let i = Array.isArray(n.data) ? n.data : [];
			if (!i.length) {
				T(O("toast.workflowThumbnailNoCandidates", "No linked outputs are available for this workflow yet."), "warning", 2600);
				return;
			}
			let a = await ir({
				title: O("ctx.setWorkflowThumbnail", "Set workflow thumbnail"),
				workflow: t.asset,
				items: i
			});
			if (!a?.filepath) return;
			let o = await se({
				filepath: e,
				source_filepath: a.filepath
			}, { timeoutMs: 3e4 });
			if (!o?.ok) {
				T(o?.error || O("toast.workflowSaveFailed", "Failed to save workflow."), "error");
				return;
			}
			T(O("toast.workflowUpdated", "Workflow updated"), "success", 1800), window?.dispatchEvent?.(new CustomEvent("mjr:reload-grid", { detail: { reason: "workflow-thumbnail-sidebar" } }));
		}
		async function je() {
			if (await Se(), !D.value) {
				T(O("toast.workflowLoadFailed", "Failed to load workflow."), "error");
				return;
			}
			try {
				await Le.openAssets({
					assets: [{
						...t.asset,
						workflow: D.value,
						Workflow: D.value
					}],
					index: 0,
					mode: "graph"
				});
			} catch (e) {
				console.debug?.(e), T(O("toast.workflowLoadFailed", "Failed to load workflow."), "error");
			}
		}
		let Me = I(() => (Array.isArray(D.value?.nodes) ? D.value.nodes : []).slice(0, cs).map((e, t) => {
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
		})), Ne = I(() => Math.max(0, Number(Pe.value.nodes || 0) - Me.value.length)), Pe = I(() => {
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
		}), Fe = I(() => {
			let e = String(m.value?.size || "comfortable");
			return a.find((t) => t.key === e) || a[1];
		}), Ie = I(() => `${Fe.value.height}px`), We = I(() => [
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
		function Ke() {
			let e = s.value, t = D.value;
			if (!e || !t) return;
			let n = Math.max(1, e.clientWidth || 320), r = Math.max(1, e.clientHeight || 120), i = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
			e.width = Math.floor(n * i), e.height = Math.floor(r * i);
			let a = e.getContext("2d");
			a && a.setTransform(i, 0, 0, i, 0, 0), y = Za(e, t, {
				...m.value,
				view: h.value
			}) || null, C(y?.resolvedView);
		}
		function qe(e) {
			ke(e);
		}
		function Je(e) {
			let t = s.value;
			if (!t) return null;
			let n = t.getBoundingClientRect?.();
			return n ? {
				x: Number(e?.clientX) - n.left,
				y: Number(e?.clientY) - n.top
			} : null;
		}
		function Ye(e) {
			let t = Je(e);
			return !t || !y?.canvasToWorld ? null : {
				local: t,
				world: y.canvasToWorld(t.x, t.y)
			};
		}
		function Xe(e) {
			let t = Je(e), n = t && y?.hitTestNode ? y.hitTestNode(t.x, t.y) : null, r = n?.id !== null && n?.id !== void 0 ? String(n.id) : null, i = h.value.hoveredNodeId !== null && h.value.hoveredNodeId !== void 0 ? String(h.value.hoveredNodeId) : null;
			_.value = n?.label || "", r !== i && (h.value = {
				...h.value,
				hoveredNodeId: r
			}, Ke());
		}
		function Ze(e) {
			e && (qe(e), h.value = {
				...h.value,
				centerX: Number(e.x),
				centerY: Number(e.y)
			}, Ke());
		}
		function Qe(e) {
			if (Number(e?.button ?? 0) !== 0) return;
			let t = Ye(e);
			t && (b = e.pointerId ?? 1, g.value = "grabbing", s.value?.setPointerCapture?.(b), Ze(t.world), Xe(e), e.preventDefault?.(), e.stopPropagation?.());
		}
		function $e(e) {
			if (b !== null && e.pointerId === b) {
				let t = Ye(e);
				t && Ze(t.world), e.preventDefault?.(), e.stopPropagation?.();
				return;
			}
			Xe(e);
		}
		function et(e) {
			b !== null && e?.pointerId === b && (s.value?.releasePointerCapture?.(b), b = null, g.value = "crosshair"), e?.type === "pointerleave" && (_.value = "", h.value.hoveredNodeId !== null && (h.value = {
				...h.value,
				hoveredNodeId: null
			}, Ke()));
		}
		function nt(e) {
			let t = Ye(e), n = y?.resolvedView;
			if (!t || !n) return;
			let r = S(Number(e?.deltaY) || 0, -240, 240), i = Math.exp(-r * .0025), a = S((Number(h.value.zoom) || 1) * i, os, ss);
			if (Math.abs(a - (Number(h.value.zoom) || 1)) < .001) {
				e.preventDefault?.(), e.stopPropagation?.();
				return;
			}
			let o = Math.max(1, Number(y?.bounds?.width || 1) / a), s = Math.max(1, Number(y?.bounds?.height || 1) / a), c = S((Number(t.world.x) - Number(n.viewMinX || 0)) / Math.max(1, Number(n.visibleW || 1)), 0, 1), l = S((Number(t.world.y) - Number(n.viewMinY || 0)) / Math.max(1, Number(n.visibleH || 1)), 0, 1);
			h.value = {
				...h.value,
				zoom: a,
				centerX: Number(t.world.x) + (.5 - c) * o,
				centerY: Number(t.world.y) + (.5 - l) * s
			}, Ke(), Xe(e), e.preventDefault?.(), e.stopPropagation?.();
		}
		function it(e) {
			let t = Ye(e);
			w(), t && qe(t.world), Ke(), e.preventDefault?.(), e.stopPropagation?.();
		}
		function at(e) {
			m.value = {
				...m.value,
				[e]: !m.value?.[e]
			}, ie(m.value);
		}
		function ot(e) {
			a.some((t) => t.key === e) && (m.value = {
				...m.value,
				size: e
			}, ie(m.value));
		}
		return Ue(() => {
			s.value && typeof ResizeObserver == "function" && (v = new ResizeObserver(() => Ke()), v.observe(s.value)), A(), Se(), Ke();
		}), Be(D, () => {
			w(), Ke();
		}, { flush: "post" }), Be(ae, () => {
			d.value = null, Se();
		}, { immediate: !0 }), Be(Te, () => {
			A();
		}), Be(m, () => {
			Ke();
		}, {
			deep: !0,
			flush: "post"
		}), Be(f, () => {
			Ke();
		}, { flush: "post" }), He(() => {
			try {
				v?.disconnect?.();
			} catch (e) {
				console.debug?.(e);
			}
			v = null, b = null;
		}), (e, t) => {
			let n = Ge("MButton"), r = Ge("MTree");
			return D.value ? (j(), z("div", co, [
				t[17] ||= N("div", { style: {
					"font-size": "13px",
					"font-weight": "600",
					color: "var(--fg-color, #eaeaea)",
					"margin-bottom": "12px",
					"text-transform": "uppercase",
					"letter-spacing": "0.5px"
				} }, " ComfyUI Workflow ", -1),
				N("div", lo, [N("div", uo, R(oe.value), 1), ae.value ? (j(), z("div", {
					key: 0,
					style: {
						"font-size": "11px",
						color: "rgba(255,255,255,0.48)",
						"margin-top": "4px",
						overflow: "hidden",
						"text-overflow": "ellipsis",
						"white-space": "nowrap"
					},
					title: ae.value
				}, R(ae.value), 9, fo)) : F("", !0)]),
				N("div", po, [N("div", mo, R(Ce.value), 1), Pe.value.source ? (j(), z("div", ho, R(Pe.value.source), 1)) : F("", !0)]),
				N("div", go, [
					ce.value ? (j(), z("div", _o, [t[3] ||= N("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Task", -1), N("div", vo, R(ce.value), 1)])) : F("", !0),
					le.value ? (j(), z("div", yo, [t[4] ||= N("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Model", -1), N("div", bo, R(le.value), 1)])) : F("", !0),
					fe.value ? (j(), z("div", xo, [t[5] ||= N("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Runs on", -1), N("div", So, R(fe.value), 1)])) : F("", !0),
					ve.value || ye.value ? (j(), z("div", Co, [
						t[6] ||= N("div", { style: {
							"font-size": "10px",
							"font-weight": "700",
							color: "rgba(255,255,255,0.55)",
							"text-transform": "uppercase",
							"letter-spacing": "0.4px"
						} }, "Library", -1),
						N("div", wo, R(ve.value || ye.value), 1),
						ve.value && ye.value ? (j(), z("div", To, R(ye.value), 1)) : F("", !0)
					])) : F("", !0)
				]),
				ge.value.length || _e.value.length ? (j(), z("div", Eo, [
					t[7] ||= N("div", { style: {
						"font-size": "10px",
						"font-weight": "800",
						color: "#ef9a9a",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px",
						"margin-bottom": "6px"
					} }, "Missing dependencies", -1),
					ge.value.length ? (j(), z("div", {
						key: 0,
						style: V({
							display: "flex",
							flexWrap: "wrap",
							gap: "5px",
							marginBottom: _e.value.length ? "7px" : "0"
						})
					}, [(j(!0), z(M, null, P(ge.value, (e) => (j(), z("span", {
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
					_e.value.length ? (j(), z("div", Do, [(j(!0), z(M, null, P(_e.value, (e) => (j(), z("span", {
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
				pe.value || me.value ? (j(), z("div", Oo, [pe.value ? (j(), z("div", ko, R(pe.value), 1)) : F("", !0), me.value ? (j(), z("div", {
					key: 1,
					style: V({
						fontSize: "11px",
						color: "rgba(255,255,255,0.48)",
						marginTop: pe.value ? "7px" : "0"
					})
				}, R(me.value), 5)) : F("", !0)])) : F("", !0),
				N("div", Ao, [tt(n, {
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
					onClick: Ae
				}, {
					default: ct(() => [t[8] ||= N("i", { class: "pi pi-image" }, null, -1), N("span", null, R(L(O)("ctx.setWorkflowThumbnail", "Set workflow thumbnail")), 1)]),
					_: 1
				}), tt(n, {
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
					onClick: je
				}, {
					default: ct(() => [t[9] ||= N("i", { class: "pi pi-search" }, null, -1), N("span", null, R(L(O)("ctx.inspect", "Inspect")), 1)]),
					_: 1
				})]),
				N("div", jo, [
					N("div", Mo, [t[10] ||= N("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Nodes", -1), N("div", No, R(Pe.value.nodes), 1)]),
					N("div", Po, [t[11] ||= N("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Links", -1), N("div", Fo, R(Pe.value.links), 1)]),
					N("div", Io, [t[12] ||= N("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Groups", -1), N("div", Lo, R(Pe.value.groups), 1)])
				]),
				N("div", Ro, [N("div", zo, [N("div", null, [t[13] ||= N("div", { style: {
					"font-size": "10px",
					"font-weight": "700",
					color: "rgba(255,255,255,0.55)",
					"text-transform": "uppercase",
					"letter-spacing": "0.4px"
				} }, "Category", -1), N("div", Bo, R(Te.value || "Root"), 1)]), k.value.length ? (j(), z("div", Vo, [(j(!0), z(M, null, P(k.value, (e) => (j(), z("span", {
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
				}, R(e), 1))), 128))])) : F("", !0)]), N("div", Ho, [Ve(N("input", {
					"onUpdate:modelValue": t[0] ||= (e) => c.value = e,
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
				}, null, 8, Uo), [[mt, c.value]]), tt(n, {
					type: "button",
					severity: "secondary",
					text: "",
					rounded: "",
					disabled: l.value,
					style: V({
						padding: "8px 12px",
						borderRadius: "8px",
						border: "1px solid rgba(255,255,255,0.12)",
						background: l.value ? "rgba(255,255,255,0.06)" : "rgba(33,150,243,0.16)",
						color: "rgba(255,255,255,0.92)",
						cursor: l.value ? "wait" : "pointer",
						fontSize: "12px",
						fontWeight: "700",
						whiteSpace: "nowrap"
					}),
					onClick: Oe
				}, {
					default: ct(() => [Re(R(l.value ? "Saving..." : "Move"), 1)]),
					_: 1
				}, 8, ["disabled", "style"])])]),
				Me.value.length ? (j(), z("div", Wo, [
					t[14] ||= N("div", { class: "mjr-section-title" }, " Workflow Nodes ", -1),
					tt(r, {
						value: Me.value,
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
						default: ct(({ node: e }) => [N("span", Go, [
							N("span", Ko, R(e.label), 1),
							e.data?.type ? (j(), z("span", qo, R(e.data.type), 1)) : F("", !0),
							N("span", Jo, "#" + R(e.data?.id), 1)
						])]),
						_: 1
					}, 8, ["value"]),
					Ne.value ? (j(), z("div", Yo, " +" + R(Ne.value) + " more nodes ", 1)) : F("", !0)
				])) : F("", !0),
				N("div", Xo, [N("div", Zo, [(j(!0), z(M, null, P(L(a), (e) => (j(), ze(n, {
					key: e.key,
					type: "button",
					severity: "secondary",
					text: "",
					rounded: "",
					title: `${e.label} minimap`,
					style: V({
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
					onClick: (t) => ot(e.key)
				}, {
					default: ct(() => [Re(R(e.label), 1)]),
					_: 2
				}, 1032, [
					"title",
					"style",
					"onClick"
				]))), 128))]), tt(n, {
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
					onClick: t[1] ||= (e) => f.value = !f.value
				}, {
					default: ct(() => [...t[15] ||= [N("i", { class: "pi pi-sliders-h" }, null, -1)]]),
					_: 1
				}, 8, ["title"])]),
				f.value ? (j(), z("div", Qo, [(j(!0), z(M, null, P(We.value, (e) => (j(), ze(n, {
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
						border: m.value?.[e.key] ? "1px solid rgba(76,175,80,0.40)" : "1px solid rgba(255,255,255,0.12)",
						background: m.value?.[e.key] ? "rgba(76,175,80,0.10)" : "rgba(255,255,255,0.04)",
						cursor: "pointer",
						color: "rgba(255,255,255,0.92)",
						textAlign: "left"
					}),
					onClick: (t) => at(e.key)
				}, {
					default: ct(() => [
						N("span", { style: V({
							width: "22px",
							height: "22px",
							borderRadius: "6px",
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							background: m.value?.[e.key] ? "rgba(76,175,80,0.95)" : "rgba(255,255,255,0.08)",
							border: m.value?.[e.key] ? "1px solid rgba(76,175,80,0.35)" : "1px solid rgba(255,255,255,0.12)",
							flex: "0 0 auto"
						}) }, [N("i", {
							class: "pi pi-check",
							style: V({
								fontSize: "12px",
								opacity: m.value?.[e.key] ? "1" : "0"
							})
						}, null, 4)], 4),
						N("i", {
							class: rt(e.iconClass),
							style: {
								"font-size": "18px",
								opacity: "0.9",
								width: "18px"
							}
						}, null, 2),
						N("div", $o, [N("div", es, R(e.label), 1), N("div", ts, R(m.value?.[e.key] ? "On" : "Off"), 1)])
					]),
					_: 2
				}, 1032, ["style", "onClick"]))), 128))])) : F("", !0),
				N("div", ns, [N("canvas", {
					ref_key: "canvasRef",
					ref: s,
					style: V({
						width: "100%",
						height: Ie.value,
						cursor: g.value,
						touchAction: "none",
						borderRadius: "10px",
						marginTop: "0",
						background: "linear-gradient(180deg, rgba(7, 12, 18, 0.95) 0%, rgba(10, 16, 24, 0.92) 100%)",
						border: "1px solid var(--mjr-border, rgba(255,255,255,0.12))",
						boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03)"
					}),
					onPointerdown: Qe,
					onPointermove: $e,
					onPointerup: et,
					onPointercancel: et,
					onPointerleave: et,
					onWheel: nt,
					onDblclick: it
				}, null, 36)]),
				N("div", rs, [N("span", null, R(_.value || "Click/drag to navigate | wheel to zoom"), 1), N("span", null, R(Math.round((h.value.zoom || 1) * 100)) + "% | " + R(Fe.value.label), 1)]),
				N("details", {
					open: p.value,
					style: { "margin-top": "10px" },
					onToggle: t[2] ||= (e) => p.value = e.target.open
				}, [t[16] ||= N("summary", { style: {
					cursor: "pointer",
					color: "var(--mjr-muted, rgba(255,255,255,0.65))",
					"font-size": "12px",
					"user-select": "none"
				} }, " Show raw JSON ", -1), N("pre", as, R(we.value), 1)], 40, is)
			])) : F("", !0);
		};
	}
};
//#endregion
export { tr as C, q as D, K as E, nr as S, J as T, mr as _, Ra as a, rr as b, ui as c, xr as d, gr as f, pr as g, cr as h, Ba as i, Dr as l, _r as m, Za as n, Va as o, vr as p, so as r, Na as s, ls as t, br as u, ar as v, Wt as w, Z as x, ir as y };
