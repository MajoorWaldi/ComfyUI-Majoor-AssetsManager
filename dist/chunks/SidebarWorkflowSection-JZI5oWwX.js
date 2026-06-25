import { $ as e, $t as t, Bt as n, C as r, Ct as i, Dt as a, E as o, Et as s, F as c, G as l, Gt as u, H as d, Ht as f, It as p, J as m, K as h, Lt as g, Mt as _, Nt as v, Pt as y, Q as b, Qt as x, St as S, Tt as C, Ut as w, Wt as T, X as E, Y as D, Z as ee, _t as te, at as ne, bt as re, et as O, gt as ie, it as ae, j as oe, jt as k, kt as se, nt as ce, q as le, rt as ue, vt as de, wt as fe, x as pe, xt as me, yt as he } from "./viewerRuntimeHosts-CIpB5USD.js";
import { G as ge, M as _e, a as A, c as ve, d as ye, dt as be, f as xe, l as Se, m as Ce, o as j, p as M, s as we, u as Te, v as Ee, w as De } from "./events-N36HM6KP.js";
import { A as Oe, D as ke, a as Ae, g as je, h as Me, i as Ne, t as Pe } from "./mediaFps-DZvOWvUU.js";
import { t as Fe } from "./floatingViewerManager-BianigoM.js";
import { A as Ie, B as N, C as P, D as Le, E as F, G as Re, H as I, J as ze, L as Be, O as L, R as Ve, S as He, T as R, W as Ue, _ as We, a as Ge, b as Ke, c as qe, ct as z, d as Je, dt as B, f as Ye, g as Xe, h as Ze, i as Qe, j as $e, k as V, l as et, lt as tt, m as nt, n as rt, nt as H, o as it, p as at, q as ot, r as st, s as ct, t as lt, tt as ut, u as dt, ut as U, y as ft } from "./mjr-primevue-BABDj8Il.js";
import { t as pt } from "./mjr-vue-vendor-eVn0EK5H.js";
import { a as mt, i as ht, n as gt, o as _t, r as vt, t as yt } from "./geninfoParser-5vKgjqjD.js";
//#region ui/app/settings/settingsUtils.ts
var W = (e, t) => {
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
}, G = (e, t) => {
	let n = Number(e);
	return Number.isFinite(n) ? n : Number(t);
}, bt = (e, t, n) => {
	let r = typeof e == "string" ? e.trim() : String(e ?? "");
	return t.includes(r) ? r : n;
}, xt = (e) => e === "__proto__" || e === "prototype" || e === "constructor", St = (e, t) => {
	let n = { ...e };
	return !t || typeof t != "object" || Object.keys(t).forEach((r) => {
		if (xt(r)) return;
		let i = t[r];
		i && typeof i == "object" && !Array.isArray(i) ? n[r] = St(e[r] || {}, i) : i !== void 0 && (n[r] = i);
	}), n;
}, Ct = Object.freeze({
	small: 80,
	medium: 120,
	large: 180
}), wt = Object.freeze([
	"small",
	"medium",
	"large"
]), Tt = (e, t) => Math.max(60, Math.min(600, Math.round(G(e, t)))), Et = (e = {}) => {
	let t = Number(e?.minSize);
	if (Number.isFinite(t)) return Tt(t, j.GRID_MIN_SIZE);
	let n = bt(String(e?.minSizePreset || "").toLowerCase(), wt, "");
	return n ? Ct[n] : Tt(e?.minSize, j.GRID_MIN_SIZE);
}, Dt = (e = {}) => Tt(e?.minSize, j.FEED_GRID_MIN_SIZE), Ot = (e) => {
	let t = Math.round(G(e, j.GRID_MIN_SIZE));
	return t <= 100 ? "small" : t >= 150 ? "large" : "medium";
}, K = {
	debug: {
		safeCall: j.DEBUG_SAFE_CALL,
		safeListeners: j.DEBUG_SAFE_LISTENERS,
		viewer: j.DEBUG_VIEWER
	},
	grid: {
		pageSize: j.DEFAULT_PAGE_SIZE,
		minSize: j.GRID_MIN_SIZE,
		minSizePreset: Ot(j.GRID_MIN_SIZE),
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
}, q = () => {
	try {
		let e = Ce.get(t);
		if (!e) return { ...K };
		let n = JSON.parse(e), r = n && typeof n == "object" && Number.isInteger(n.version) && n.data && typeof n.data == "object";
		if (!r && !(n && typeof n == "object" && !Array.isArray(n))) return { ...K };
		if (r && Number(n.version) > 1) return console.warn("[Majoor] settings schema version is newer than this build, using defaults"), { ...K };
		let i = r ? n.data : n, a = new Set(/* @__PURE__ */ "debug.grid.infiniteScroll.siblings.autoScan.scan.watcher.status.viewer.rtHydrate.observability.feed.sidebar.probeBackend.i18n.paths.db.ratingTagsSync.cache.search.ai.executionGrouping.workflowMinimap.ui.security.safety".split(".")), o = {};
		if (i && typeof i == "object") for (let [e, t] of Object.entries(i)) a.has(e) && (o[e] = t);
		let s = St(K, o);
		if (!r) try {
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
		if (!Ce.set("mjrSettings", JSON.stringify(n))) throw Error("SettingsStore rejected the write");
	} catch (e) {
		console.warn("[Majoor] settings save failed", e);
		try {
			let e = Date.now();
			e - (Number(window?._mjrSettingsSaveFailAt || 0) || 0) > 3e4 && (window._mjrSettingsSaveFailAt = e, ke(M("dialog.settingsSaveFailed", "Majoor: Failed to save settings (browser storage full or blocked).")));
		} catch (e) {
			console.debug?.(e);
		}
		try {
			Oe("mjr-settings-save-failed", { error: String(e?.message || e || "") }, { warnPrefix: "[Majoor]" });
		} catch (e) {
			console.debug?.(e);
		}
	}
}, Y = (e) => {
	let t = Number(j.MAX_PAGE_SIZE) || 2e3;
	A.DEFAULT_PAGE_SIZE = Math.max(50, Math.min(t, Number(e.grid?.pageSize) || j.DEFAULT_PAGE_SIZE)), A.AUTO_SCAN_ON_STARTUP = !!e.autoScan?.onStartup, A.EXECUTION_GROUPING_ENABLED = !!(e.executionGrouping?.enabled ?? j.EXECUTION_GROUPING_ENABLED), A.STATUS_POLL_INTERVAL = Math.max(1e3, Number(e.status?.pollInterval) || j.STATUS_POLL_INTERVAL), A.DEBUG_SAFE_CALL = !!e.debug?.safeCall, A.DEBUG_SAFE_LISTENERS = !!e.debug?.safeListeners, A.DEBUG_VIEWER = !!e.debug?.viewer, A.GRID_MIN_SIZE = Et(e.grid), A.FEED_GRID_MIN_SIZE = Dt(e.feed), A.GRID_GAP = Math.max(0, Math.min(40, Math.round(G(e.grid?.gap, j.GRID_GAP)))), A.GRID_SHOW_BADGES_EXTENSION = !!(e.grid?.showExtBadge ?? j.GRID_SHOW_BADGES_EXTENSION), A.GRID_SHOW_BADGES_RATING = !!(e.grid?.showRatingBadge ?? j.GRID_SHOW_BADGES_RATING), A.GRID_SHOW_BADGES_TAGS = !!(e.grid?.showTagsBadge ?? j.GRID_SHOW_BADGES_TAGS), A.GRID_SHOW_DETAILS = !!(e.grid?.showDetails ?? j.GRID_SHOW_DETAILS), A.GRID_SHOW_DETAILS_FILENAME = !!(e.grid?.showFilename ?? j.GRID_SHOW_DETAILS_FILENAME), A.GRID_SHOW_DETAILS_DATE = !!(e.grid?.showDate ?? j.GRID_SHOW_DETAILS_DATE), A.GRID_SHOW_DETAILS_DIMENSIONS = !!(e.grid?.showDimensions ?? j.GRID_SHOW_DETAILS_DIMENSIONS), A.GRID_SHOW_DETAILS_GENTIME = !!(e.grid?.showGenTime ?? j.GRID_SHOW_DETAILS_GENTIME), A.GRID_SHOW_HOVER_INFO = !!(e.grid?.showHoverInfo ?? j.GRID_SHOW_HOVER_INFO), A.GRID_SHOW_WORKFLOW_DOT = !!(e.grid?.showWorkflowDot ?? j.GRID_SHOW_WORKFLOW_DOT);
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
	A.INFINITE_SCROLL_ENABLED = !!e.infiniteScroll?.enabled, A.INFINITE_SCROLL_ROOT_MARGIN = String(e.infiniteScroll?.rootMargin || j.INFINITE_SCROLL_ROOT_MARGIN), A.INFINITE_SCROLL_THRESHOLD = Math.max(0, Math.min(1, G(e.infiniteScroll?.threshold, j.INFINITE_SCROLL_THRESHOLD))), A.BOTTOM_GAP_PX = Math.max(0, Math.min(5e3, Math.round(G(e.infiniteScroll?.bottomGapPx, j.BOTTOM_GAP_PX)))), A.VIEWER_ALLOW_PAN_AT_ZOOM_1 = !!e.viewer?.allowPanAtZoom1, A.VIEWER_DISABLE_WEBGL_VIDEO = !!e.viewer?.disableWebGL, A.VIEWER_PAUSE_DURING_EXECUTION = !!(e.viewer?.pauseDuringExecution ?? j.VIEWER_PAUSE_DURING_EXECUTION), A.FLOATING_VIEWER_PAUSE_DURING_EXECUTION = !!(e.viewer?.floatingPauseDuringExecution ?? j.FLOATING_VIEWER_PAUSE_DURING_EXECUTION), A.MFV_LIVE_DEFAULT = e.viewer?.mfvLiveDefault ?? j.MFV_LIVE_DEFAULT, A.MFV_PREVIEW_DEFAULT = e.viewer?.mfvPreviewDefault ?? j.MFV_PREVIEW_DEFAULT, A.MFV_LIVE_AUTO_OPEN = !1, A.MFV_PREVIEW_AUTO_OPEN = !1, A.MFV_NODE_STREAM_AUTO_OPEN = !1;
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
	A.VIEWER_VIDEO_GRADE_THROTTLE_FPS = Math.max(1, Math.min(60, Math.round(G(e.viewer?.videoGradeThrottleFps, j.VIEWER_VIDEO_GRADE_THROTTLE_FPS)))), A.VIEWER_SCOPES_FPS = Math.max(1, Math.min(60, Math.round(G(e.viewer?.scopesFps, j.VIEWER_SCOPES_FPS)))), A.VIEWER_META_TTL_MS = Math.max(1e3, Math.min(10 * 6e4, Math.round(G(e.viewer?.metaTtlMs, j.VIEWER_META_TTL_MS)))), A.VIEWER_META_MAX_ENTRIES = Math.max(50, Math.min(5e3, Math.round(G(e.viewer?.metaMaxEntries, j.VIEWER_META_MAX_ENTRIES)))), A.WORKFLOW_MINIMAP_ENABLED = !!(e.workflowMinimap?.enabled ?? j.WORKFLOW_MINIMAP_ENABLED), A.RT_HYDRATE_CONCURRENCY = Math.max(1, Math.min(16, Math.round(G(e.rtHydrate?.concurrency, j.RT_HYDRATE_CONCURRENCY)))), A.RT_HYDRATE_QUEUE_MAX = Math.max(10, Math.min(5e3, Math.round(G(e.rtHydrate?.queueMax, j.RT_HYDRATE_QUEUE_MAX)))), A.RT_HYDRATE_SEEN_MAX = Math.max(1e3, Math.min(2e5, Math.round(G(e.rtHydrate?.seenMax, j.RT_HYDRATE_SEEN_MAX)))), A.RT_HYDRATE_PRUNE_BUDGET = Math.max(10, Math.min(1e4, Math.round(G(e.rtHydrate?.pruneBudget, j.RT_HYDRATE_PRUNE_BUDGET)))), A.RT_HYDRATE_SEEN_TTL_MS = Math.max(5e3, Math.min(360 * 6e4, Math.round(G(e.rtHydrate?.seenTtlMs, j.RT_HYDRATE_SEEN_TTL_MS)))), A.DELETE_CONFIRMATION = !!e.safety?.confirmDeletion, A.DEBUG_VERBOSE_ERRORS = !!e.observability?.verboseErrors, A.WATCHER_MAX_PENDING = Math.max(10, Math.min(5e3, Math.round(G(e.watcher?.maxPending, 500)))), A.WATCHER_MIN_SIZE = Math.max(0, Math.min(1e6, Math.round(G(e.watcher?.minSize, 100)))), A.WATCHER_MAX_SIZE = Math.max(1e5, Math.min(17179869184, Math.round(G(e.watcher?.maxSize, 4294967296)))), A.DB_TIMEOUT_MS = Math.max(1e3, Math.min(3e4, Math.round(G(e.db?.timeoutMs, 5e3)))), A.DB_MAX_CONNECTIONS = Math.max(1, Math.min(100, Math.round(G(e.db?.maxConnections, 10)))), A.DB_QUERY_TIMEOUT_MS = Math.max(500, Math.min(1e4, Math.round(G(e.db?.queryTimeoutMs, 1e3)))), A.SIDEBAR_ASSET_BADGE_ENABLED = !!(e.sidebar?.assetBadgeEnabled ?? j.SIDEBAR_ASSET_BADGE_ENABLED), A.SEARCH_REQUEST_LIMIT = Math.max(10, Math.min(j.MAX_PAGE_SIZE || 2e3, Math.round(G(e.search?.maxResults, j.SEARCH_DEFAULT_LIMIT))));
};
async function kt() {
	try {
		let t = await e();
		if (!t?.ok) return;
		let n = t.data?.prefs;
		if (!n || typeof n != "object") return;
		let r = q();
		if (r.security = r.security || {}, r.security.safeMode = W(n.safe_mode, r.security.safeMode), r.security.allowWrite = W(n.allow_write, r.security.allowWrite), r.security.requireAuth = W(n.require_auth, r.security.requireAuth), r.security.allowRemoteWrite = W(n.allow_remote_write, r.security.allowRemoteWrite), r.security.allowInsecureTokenTransport = W(n.allow_insecure_token_transport, r.security.allowInsecureTokenTransport), r.security.allowDelete = W(n.allow_delete, r.security.allowDelete), r.security.allowRename = W(n.allow_rename, r.security.allowRename), r.security.allowOpenInFolder = W(n.allow_open_in_folder, r.security.allowOpenInFolder), r.security.allowResetIndex = W(n.allow_reset_index, r.security.allowResetIndex), r.security.tokenConfigured = W(n.token_configured, r.security.tokenConfigured), r.security.tokenHint = String(n.token_hint || "").trim(), !String(r.security.apiToken || "").trim()) try {
			let e = await c(), t = String(e?.data?.token || "").trim();
			e?.ok && t && w(t);
		} catch (e) {
			console.debug?.(e);
		}
		J(r), Y(r), Oe("mjr-settings-changed", { key: "security" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend security settings", e);
	}
}
async function At() {
	try {
		let e = await ce();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = q();
		n.ai = n.ai || {}, n.ai.vectorSearchEnabled = W(t.enabled, n.ai.vectorSearchEnabled ?? !0), n.ai.vectorCaptionOnIndex = W(t.caption_on_index ?? t.captionOnIndex, n.ai.vectorCaptionOnIndex ?? !1), n.ai.vectorIndexOnScan = W(t.index_on_scan ?? t.indexOnScan, n.ai.vectorIndexOnScan ?? !1), n.ai.vectorUnloadAfterUse = W(t.unload_after_use ?? t.unloadAfterUse, n.ai.vectorUnloadAfterUse ?? !1), n.ai.vectorConcurrency = Math.max(1, Math.min(16, Math.floor(Number(t.concurrency ?? n.ai.vectorConcurrency ?? 1) || 1))), J(n), Y(n), Oe("mjr-settings-changed", { key: "ai.vectorSearch" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend vector search settings", e);
	}
}
async function jt() {
	try {
		let e = await l();
		if (!e?.ok) return;
		let t = e.data?.prefs;
		if (!t || typeof t != "object") return;
		let n = q();
		n.executionGrouping = n.executionGrouping || {}, n.executionGrouping.enabled = W(t.enabled, n.executionGrouping.enabled ?? j.EXECUTION_GROUPING_ENABLED), J(n), Y(n), Oe("mjr-settings-changed", { key: "executionGrouping.enabled" }, { warnPrefix: "[Majoor]" });
	} catch (e) {
		console.warn("[Majoor] failed to sync backend execution grouping settings", e);
	}
}
//#endregion
//#region ui/app/settings/settingsRuntime.ts
var Mt = "mjr-runtime-status-dashboard", Nt = 3e4;
function Pt() {
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
function Ft() {
	try {
		document.getElementById(Mt)?.remove?.();
	} catch (e) {
		console.debug?.(e);
	}
}
function It() {
	try {
		window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ && (clearTimeout(window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__), window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ = null);
	} catch (e) {
		console.debug?.(e);
	}
}
function Lt(e, t) {
	let n = t === "auth" ? "__mjrAuthLine" : "__mjrMetricsLine";
	if (e?.[n]) return e[n];
	let r = document.createElement("div");
	return r.style.whiteSpace = "nowrap", r.style.lineHeight = "1.35", t === "auth" && (r.style.marginTop = "4px", r.style.fontWeight = "600"), e.appendChild(r), e[n] = r, r;
}
function Rt(e) {
	let t = String(e?.token_hint || "").trim(), n = f(), r = t || (n ? "(session)" : ""), i = e?.allow_write !== !1, a = e?.require_auth === !0, o = e?.token_configured === !0;
	return i ? n ? {
		text: M("runtime.writeAuthActive", "Write auth: active {tokenHint}", { tokenHint: r || "(session)" }),
		color: "#7ee0a0"
	} : a && o ? {
		text: M("runtime.writeAuthMissing", "Write auth: missing in this browser {tokenHint}", { tokenHint: r || "(server token configured)" }),
		color: "#f1c36d"
	} : a ? {
		text: M("runtime.writeAuthRequired", "Write auth: required"),
		color: "#f1c36d"
	} : e && typeof e == "object" ? {
		text: M("runtime.writeAuthNotRequired", "Write auth: not required"),
		color: "#8fd0ff"
	} : {
		text: M("runtime.writeAuthUnknown", "Write auth: unknown"),
		color: "#c8ced8"
	} : {
		text: M("runtime.writeAuthBlocked", "Write auth: writes blocked by server"),
		color: "#ff9b9b"
	};
}
function zt() {
	try {
		if (Pt() === "hidden" || window.__MJR_RUNTIME_STATUS_HIDDEN__) return Ft(), null;
		let e = document.querySelector(".mjr-assets-manager.mjr-am-container"), t = document.getElementById(Mt);
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
		let n = document.getElementById(Mt);
		return n ? n.parentElement !== e && e.appendChild(n) : (n = document.createElement("div"), n.id = Mt, n.style.position = "absolute", n.style.bottom = "10px", n.style.right = "10px", n.style.zIndex = "9999", n.style.padding = "6px 10px", n.style.borderRadius = "10px", n.style.border = "1px solid rgba(255,255,255,0.16)", n.style.background = "rgba(0,0,0,0.45)", n.style.backdropFilter = "blur(4px)", n.style.color = "var(--content-fg, #fff)", n.style.fontSize = "11px", n.style.pointerEvents = "none", n.style.display = "flex", n.style.flexDirection = "column", e.appendChild(n)), n;
	} catch {
		return null;
	}
}
async function Bt() {
	let t = zt();
	if (!t) return !1;
	let n = Lt(t, "metrics"), r = Lt(t, "auth");
	try {
		let [i, a] = await Promise.all([b(), e()]), o = M("runtime.unavailable", "Runtime: unavailable");
		if (!i?.ok || !i?.data) n.textContent = o;
		else {
			let e = i.data.db || {}, t = i.data.index || {}, r = i.data.watcher || {}, a = Number(e.active_connections || 0), s = Number(t.enrichment_queue_length || 0), c = Number(r.pending_files || 0);
			n.textContent = M("runtime.metricsLine", "DB active: {active} | Enrich Q: {enrichQ} | Watcher pending: {pending}", {
				active: a,
				enrichQ: s,
				pending: c
			}), o = M("runtime.metricsTitle", "Runtime Metrics\nDB active connections: {active}\nEnrichment queue: {enrichQ}\nWatcher pending files: {pending}", {
				active: a,
				enrichQ: s,
				pending: c
			});
		}
		let s = Rt(a?.data?.prefs || null);
		return r.textContent = s.text, r.style.color = s.color, t.title = `${o}\n${s.text}`, !0;
	} catch {
		return n.textContent = M("runtime.unavailable", "Runtime: unavailable"), r.textContent = M("runtime.writeAuthUnknown", "Write auth: unknown"), r.style.color = "#c8ced8", t.title = `${M("runtime.unavailable", "Runtime: unavailable")}\n${r.textContent}`, !0;
	}
}
function Vt() {
	try {
		let e = Pt();
		if (e === "hidden") {
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = !0, It(), Ft();
			return;
		}
		window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__ || (window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__ = (e) => {
			if (e?.detail?.key !== "observability.runtimeDashboardMode") return;
			let t = Pt();
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = t === "hidden", It(), Ft(), t !== "hidden" && Vt();
		}, window.addEventListener?.("mjr-settings-changed", window.__MJR_RUNTIME_STATUS_SETTINGS_LISTENER__)), window.__MJR_RUNTIME_STATUS_HIDDEN__ = !1, It(), e === "autoHide30" && (window.__MJR_RUNTIME_STATUS_HIDE_TIMEOUT__ = setTimeout(() => {
			window.__MJR_RUNTIME_STATUS_HIDDEN__ = !0, Ft();
		}, Nt)), Bt().catch(() => {}), window.__MJR_RUNTIME_STATUS_INFLIGHT__ ?? (window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !1), window.__MJR_RUNTIME_STATUS_MISS_COUNT__ ?? (window.__MJR_RUNTIME_STATUS_MISS_COUNT__ = 0), window.__MJR_RUNTIME_STATUS_INTERVAL__ || (window.__MJR_RUNTIME_STATUS_INTERVAL__ = setInterval(() => {
			window.__MJR_RUNTIME_STATUS_INFLIGHT__ || (window.__MJR_RUNTIME_STATUS_INFLIGHT__ = !0, Bt().then((e) => {
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
var Ht = 300;
function Ut(e, t = Ht) {
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
var X = "Majoor", Wt = "Majoor Assets Manager";
function Gt(e, t, n) {
	let r = (e, t) => [
		Wt,
		e,
		t
	], i = (e) => [
		Wt,
		M("cat.cards", "Cards"),
		e
	], a = (e) => [
		Wt,
		M("cat.badges", "Badges"),
		e
	], o = (e) => [
		Wt,
		M("cat.badges", "Badges"),
		e
	], s = (e, t) => {
		let n = String(e || "").trim();
		return /^[0-9a-fA-F]{6}$/.test(n) && (n = `#${n}`), /^#[0-9a-fA-F]{6}$/.test(n) ? n.toUpperCase() : t;
	};
	t.grid?.minSizePreset || (t.grid = t.grid || {}, t.grid.minSizePreset = Ot(t.grid.minSize), J(t)), e({
		id: `${X}.Cards.ThumbSize`,
		category: i(M("setting.grid.cardSize.group", "Card size")),
		name: M("setting.grid.cardSize.name", "Majoor: Card Size"),
		tooltip: M("setting.grid.cardSize.desc", "Choose the card size preset used by the grid layout."),
		type: "combo",
		defaultValue: (() => {
			let e = bt(String(t.grid?.minSizePreset || "").toLowerCase(), wt, Ot(t.grid?.minSize)), n = {
				small: M("setting.grid.cardSize.small", "Small"),
				medium: M("setting.grid.cardSize.medium", "Medium"),
				large: M("setting.grid.cardSize.large", "Large")
			};
			return n[e] || n.medium;
		})(),
		options: [
			M("setting.grid.cardSize.small", "Small"),
			M("setting.grid.cardSize.medium", "Medium"),
			M("setting.grid.cardSize.large", "Large")
		],
		onChange: (e) => {
			let r = String(e || "").trim().toLowerCase(), i = M("setting.grid.cardSize.small", "Small").toLowerCase(), a = M("setting.grid.cardSize.medium", "Medium").toLowerCase(), o = M("setting.grid.cardSize.large", "Large").toLowerCase(), s = "medium";
			r === i || r === "small" || r === "petit" ? s = "small" : r === o || r === "large" || r === "grand" ? s = "large" : (r === a || r === "medium" || r === "moyen") && (s = "medium"), t.grid.minSizePreset = s, t.grid.minSize = Ct[s], J(t), Y(t), n("grid.minSizePreset");
		}
	}), e({
		id: `${X}.Cards.CustomThumbSize`,
		category: i(M("setting.grid.cardSize.group", "Card size")),
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
			t.grid.minSize = r, t.grid.minSizePreset = Ot(r), J(t), Y(t), n("grid.minSize");
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
		defaultValue: !!(t.grid?.showGenTime ?? j.GRID_SHOW_DETAILS_GENTIME),
		onChange: (e) => {
			t.grid.showGenTime = !!e, J(t), Y(t), n("grid.showGenTime");
		}
	}), e({
		id: `${X}.Grid.ShowHoverInfo`,
		category: i("Show prompt on hover"),
		name: "Show prompt on hover",
		tooltip: "Show positive prompt and generation time as a tooltip overlay when hovering over a card thumbnail. Does not block video play-on-hover.",
		type: "boolean",
		defaultValue: !!(t.grid?.showHoverInfo ?? j.GRID_SHOW_HOVER_INFO),
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
		category: o(M("setting.starColor", "Star color")),
		name: M("setting.starColor", "Majoor: Star color"),
		tooltip: M("setting.starColor.tooltip", "Color of rating stars on thumbnails (hex, e.g. #FFD45A)"),
		type: "color",
		defaultValue: s(t.grid?.starColor, j.BADGE_STAR_COLOR),
		onChange: (e) => {
			t.grid.starColor = s(e, j.BADGE_STAR_COLOR), J(t), Y(t), n("grid.starColor");
		}
	}), e({
		id: `${X}.Badges.ImageColor`,
		category: o(M("setting.badgeImageColor", "Image badge color")),
		name: M("setting.badgeImageColor", "Majoor: Image badge color"),
		tooltip: M("setting.badgeImageColor.tooltip", "Color for image badges: PNG, JPG, WEBP, GIF, BMP, TIF (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeImageColor, j.BADGE_IMAGE_COLOR),
		onChange: (e) => {
			t.grid.badgeImageColor = s(e, j.BADGE_IMAGE_COLOR), J(t), Y(t), n("grid.badgeImageColor");
		}
	}), e({
		id: `${X}.Badges.VideoColor`,
		category: o(M("setting.badgeVideoColor", "Video badge color")),
		name: M("setting.badgeVideoColor", "Majoor: Video badge color"),
		tooltip: M("setting.badgeVideoColor.tooltip", "Color for video badges: MP4, WEBM, MOV, AVI, MKV (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeVideoColor, j.BADGE_VIDEO_COLOR),
		onChange: (e) => {
			t.grid.badgeVideoColor = s(e, j.BADGE_VIDEO_COLOR), J(t), Y(t), n("grid.badgeVideoColor");
		}
	}), e({
		id: `${X}.Badges.AudioColor`,
		category: o(M("setting.badgeAudioColor", "Audio badge color")),
		name: M("setting.badgeAudioColor", "Majoor: Audio badge color"),
		tooltip: M("setting.badgeAudioColor.tooltip", "Color for audio badges: MP3, WAV, OGG, FLAC (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeAudioColor, j.BADGE_AUDIO_COLOR),
		onChange: (e) => {
			t.grid.badgeAudioColor = s(e, j.BADGE_AUDIO_COLOR), J(t), Y(t), n("grid.badgeAudioColor");
		}
	}), e({
		id: `${X}.Badges.Model3dColor`,
		category: o(M("setting.badgeModel3dColor", "3D model badge color")),
		name: M("setting.badgeModel3dColor", "Majoor: 3D model badge color"),
		tooltip: M("setting.badgeModel3dColor.tooltip", "Color for 3D model badges: OBJ, FBX, GLB, GLTF (hex)"),
		type: "color",
		defaultValue: s(t.grid?.badgeModel3dColor, j.BADGE_MODEL3D_COLOR),
		onChange: (e) => {
			t.grid.badgeModel3dColor = s(e, j.BADGE_MODEL3D_COLOR), J(t), Y(t), n("grid.badgeModel3dColor");
		}
	}), e({
		id: `${X}.Badges.DuplicateAlertColor`,
		category: o(M("setting.badgeDuplicateAlertColor", "Duplicate alert badge color")),
		name: M("setting.badgeDuplicateAlertColor", "Majoor: Duplicate alert badge color"),
		tooltip: M("setting.badgeDuplicateAlertColor.tooltip", "Color for duplicate extension badges (PNG+, JPG+, etc)."),
		type: "color",
		defaultValue: s(t.grid?.badgeDuplicateAlertColor, j.BADGE_DUPLICATE_ALERT_COLOR),
		onChange: (e) => {
			t.grid.badgeDuplicateAlertColor = s(e, j.BADGE_DUPLICATE_ALERT_COLOR), J(t), Y(t), n("grid.badgeDuplicateAlertColor");
		}
	}), e({
		id: `${X}.Grid.PageSize`,
		category: r(M("cat.grid"), M("setting.grid.pagesize.name").replace("Majoor: ", "")),
		name: M("setting.grid.pagesize.name"),
		tooltip: M("setting.grid.pagesize.desc"),
		type: "number",
		defaultValue: t.grid.pageSize,
		attrs: {
			min: 50,
			max: Number(A.MAX_PAGE_SIZE) || 2e3,
			step: 50
		},
		onChange: (e) => {
			let r = Number(A.MAX_PAGE_SIZE) || 2e3;
			t.grid.pageSize = Math.max(50, Math.min(r, Number(e) || j.DEFAULT_PAGE_SIZE)), J(t), Y(t), n("grid.pageSize");
		}
	}), e({
		id: `${X}.Grid.WorkflowGroupBy`,
		category: r(M("cat.grid"), "Workflow grouping"),
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
			t.grid = t.grid || {}, t.grid.workflowGroupBy = r, J(t), Y(t), n("grid.workflowGroupBy");
		}
	}), e({
		id: `${X}.InfiniteScroll.Enabled`,
		category: r(M("cat.grid"), M("setting.nav.infinite.name").replace("Majoor: ", "")),
		name: M("setting.nav.infinite.name"),
		tooltip: M("setting.nav.infinite.desc"),
		type: "boolean",
		defaultValue: !!t.infiniteScroll?.enabled,
		onChange: (e) => {
			t.infiniteScroll = t.infiniteScroll || {}, t.infiniteScroll.enabled = !!e, J(t), Y(t), n("infiniteScroll.enabled");
		}
	}), e({
		id: `${X}.Sidebar.Position`,
		category: r(M("cat.grid"), M("setting.sidebar.pos.name").replace("Majoor: ", "")),
		name: M("setting.sidebar.pos.name"),
		tooltip: M("setting.sidebar.pos.desc"),
		type: "combo",
		defaultValue: t.sidebar?.position || "right",
		options: ["left", "right"],
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.position = e === "left" ? "left" : "right", J(t), n("sidebar.position");
		}
	}), e({
		id: `${X}.Sidebar.ShowPreviewThumb`,
		category: r(M("cat.grid"), "Sidebar preview"),
		name: "Show sidebar preview thumb",
		tooltip: "Show/hide the large media preview at the top of the sidebar metadata panel.",
		type: "boolean",
		defaultValue: !!(t.sidebar?.showPreviewThumb ?? !0),
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.showPreviewThumb = !!e, J(t), n("sidebar.showPreviewThumb");
		}
	}), e({
		id: `${X}.Sidebar.AssetBadgeEnabled`,
		category: r(M("cat.grid"), "Sidebar asset notification badge"),
		name: "Show new asset badge on sidebar icon",
		tooltip: "Display a small counter on the Majoor sidebar icon only when a new asset is indexed by Assets Manager.",
		type: "boolean",
		defaultValue: !!(t.sidebar?.assetBadgeEnabled ?? j.SIDEBAR_ASSET_BADGE_ENABLED),
		onChange: (e) => {
			t.sidebar = t.sidebar || {}, t.sidebar.assetBadgeEnabled = !!e, J(t), Y(t), n("sidebar.assetBadgeEnabled");
		}
	}), e({
		id: `${X}.Sidebar.WidthPx`,
		category: r(M("cat.grid"), "Sidebar width"),
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
		category: r(M("cat.grid"), M("setting.siblings.hide.name").replace("Majoor: ", "")),
		name: M("setting.siblings.hide.name"),
		tooltip: M("setting.siblings.hide.desc"),
		type: "boolean",
		defaultValue: !!t.siblings?.hidePngSiblings,
		onChange: (e) => {
			t.siblings = t.siblings || {}, t.siblings.hidePngSiblings = !!e, J(t), n("siblings.hidePngSiblings");
		}
	}), e({
		id: `${X}.Grid.VideoAutoplayMode`,
		category: r(M("cat.grid"), M("setting.grid.videoAutoplayMode.name", "Video autoplay").replace("Majoor: ", "")),
		name: M("setting.grid.videoAutoplayMode.name", "Majoor: Video autoplay"),
		tooltip: M("setting.grid.videoAutoplayMode.desc", "Controls video thumbnail playback in the grid. Off: static frame. Hover: play on mouse hover. Always: loop while visible."),
		type: "combo",
		defaultValue: (() => {
			let e = t.grid?.videoAutoplayMode;
			e ??= t.grid?.videoHoverAutoplay === !1 ? "off" : "hover", e === !0 && (e = "hover"), e === !1 && (e = "off"), e !== "hover" && e !== "always" && e !== "off" && (e = "hover");
			let n = {
				off: M("setting.grid.videoAutoplayMode.off", "Off"),
				hover: M("setting.grid.videoAutoplayMode.hover", "Hover"),
				always: M("setting.grid.videoAutoplayMode.always", "Always")
			};
			return n[e] || n.off;
		})(),
		options: [
			M("setting.grid.videoAutoplayMode.off", "Off"),
			M("setting.grid.videoAutoplayMode.hover", "Hover"),
			M("setting.grid.videoAutoplayMode.always", "Always")
		],
		onChange: (e) => {
			let r = {
				[M("setting.grid.videoAutoplayMode.off", "Off")]: "off",
				[M("setting.grid.videoAutoplayMode.hover", "Hover")]: "hover",
				[M("setting.grid.videoAutoplayMode.always", "Always")]: "always"
			}[e] || "off";
			t.grid = t.grid || {}, t.grid.videoAutoplayMode = r, delete t.grid.videoHoverAutoplay, J(t), Y(t), n("grid.videoAutoplayMode");
		}
	}), e({
		id: `${X}.Cards.HoverColor`,
		category: i("Hover color"),
		name: "Majoor: Card hover color",
		tooltip: "Background tint used when hovering a card (hex, e.g. #3D3D3D).",
		type: "color",
		defaultValue: s(t.ui?.cardHoverColor, j.UI_CARD_HOVER_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.cardHoverColor = s(e, j.UI_CARD_HOVER_COLOR), J(t), Y(t), n("ui.cardHoverColor");
		}
	}), e({
		id: `${X}.Cards.SelectionColor`,
		category: i("Selection color"),
		name: "Majoor: Card selection color",
		tooltip: "Outline/accent color used for selected cards (hex, e.g. #4A90E2).",
		type: "color",
		defaultValue: s(t.ui?.cardSelectionColor, j.UI_CARD_SELECTION_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.cardSelectionColor = s(e, j.UI_CARD_SELECTION_COLOR), J(t), Y(t), n("ui.cardSelectionColor");
		}
	}), e({
		id: `${X}.Badges.RatingColor`,
		category: a("Rating color"),
		name: "Majoor: Rating badge color",
		tooltip: "Color used for rating badge text/accent (hex, e.g. #FF9500).",
		type: "color",
		defaultValue: s(t.ui?.ratingColor, j.UI_RATING_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.ratingColor = s(e, j.UI_RATING_COLOR), J(t), Y(t), n("ui.ratingColor");
		}
	}), e({
		id: `${X}.Badges.TagColor`,
		category: a("Tag color"),
		name: "Majoor: Tags badge color",
		tooltip: "Color used for tags badge text/accent (hex, e.g. #4A90E2).",
		type: "color",
		defaultValue: s(t.ui?.tagColor, j.UI_TAG_COLOR),
		onChange: (e) => {
			t.ui = t.ui || {}, t.ui.tagColor = s(e, j.UI_TAG_COLOR), J(t), Y(t), n("ui.tagColor");
		}
	});
}
//#endregion
//#region ui/app/settings/settingsViewer.ts
var Kt = "Majoor", qt = "Majoor Assets Manager";
function Jt(e, t, n) {
	let r = (e, t) => [
		qt,
		e,
		t
	], i = (e) => r(M("cat.viewer", "Viewer"), e), a = (e) => r(M("cat.floatingViewer", "Floating Viewer"), e);
	e({
		id: `${Kt}.Viewer.AllowPanAtZoom1`,
		category: i(M("setting.viewer.pan.name").replace("Majoor: ", "")),
		name: M("setting.viewer.pan.name"),
		tooltip: M("setting.viewer.pan.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.allowPanAtZoom1,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.allowPanAtZoom1 = !!e, J(t), Y(t), n("viewer.allowPanAtZoom1");
		}
	}), e({
		id: `${Kt}.Viewer.DisableWebGL`,
		category: i("Disable WebGL Video"),
		name: "Disable WebGL Video",
		tooltip: "Use CPU rendering (Canvas 2D) for video playback. Fixes 'black screen' issues on incompatible hardware/browsers.",
		type: "boolean",
		defaultValue: !!t.viewer?.disableWebGL,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.disableWebGL = !!e, J(t), Y(t), n("viewer.disableWebGL");
		}
	}), e({
		id: `${Kt}.Viewer.PauseDuringExecution`,
		category: i(M("setting.viewer.pauseExecution.name").replace("Majoor: ", "")),
		name: M("setting.viewer.pauseExecution.name"),
		tooltip: M("setting.viewer.pauseExecution.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.pauseDuringExecution,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.pauseDuringExecution = !!e, J(t), Y(t), n("viewer.pauseDuringExecution");
		}
	}), e({
		id: `${Kt}.Viewer.FloatingPauseDuringExecution`,
		category: a(M("setting.viewer.floatingPauseExecution.name").replace("Majoor: ", "")),
		name: M("setting.viewer.floatingPauseExecution.name"),
		tooltip: M("setting.viewer.floatingPauseExecution.desc"),
		type: "boolean",
		defaultValue: !!t.viewer?.floatingPauseDuringExecution,
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.floatingPauseDuringExecution = !!e, J(t), Y(t), n("viewer.floatingPauseDuringExecution");
		}
	}), e({
		id: `${Kt}.Viewer.MfvLiveDefault`,
		category: a(M("setting.viewer.mfvLiveDefault.name").replace("Majoor: ", "")),
		name: M("setting.viewer.mfvLiveDefault.name"),
		tooltip: M("setting.viewer.mfvLiveDefault.desc"),
		type: "boolean",
		defaultValue: !!(t.viewer?.mfvLiveDefault ?? j.MFV_LIVE_DEFAULT),
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.mfvLiveDefault = !!e, J(t), Y(t), n("viewer.mfvLiveDefault");
		}
	}), e({
		id: `${Kt}.Viewer.MfvPreviewDefault`,
		category: a(M("setting.viewer.mfvPreviewDefault.name").replace("Majoor: ", "")),
		name: M("setting.viewer.mfvPreviewDefault.name"),
		tooltip: M("setting.viewer.mfvPreviewDefault.desc"),
		type: "boolean",
		defaultValue: !!(t.viewer?.mfvPreviewDefault ?? j.MFV_PREVIEW_DEFAULT),
		onChange: (e) => {
			t.viewer = t.viewer || {}, t.viewer.mfvPreviewDefault = !!e, J(t), Y(t), n("viewer.mfvPreviewDefault");
		}
	}), e({
		id: `${Kt}.Viewer.MfvSidebarPosition`,
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
		id: `${Kt}.Viewer.MfvPreviewMethod`,
		category: a(M("setting.viewer.mfvPreviewMethod.name").replace("Majoor: ", "")),
		name: M("setting.viewer.mfvPreviewMethod.name"),
		tooltip: M("setting.viewer.mfvPreviewMethod.desc"),
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
			t.viewer = t.viewer || {}, t.viewer.mfvPreviewMethod = r, J(t), Y(t), n("viewer.mfvPreviewMethod");
		}
	}), e({
		id: `${Kt}.Viewer.LtxavRgbFallback`,
		category: a("LTXAV preview fallback"),
		name: "Majoor: LTXAV RGB Preview Fallback (experimental)",
		tooltip: "Reuse LTXV RGB projection for LTXAV when native latent preview is unavailable. Experimental; quality may be approximate.",
		type: "boolean",
		defaultValue: !!t.viewer?.ltxavRgbFallback,
		onChange: async (e) => {
			let r = !!e, i = !!t.viewer?.ltxavRgbFallback;
			t.viewer = t.viewer || {}, t.viewer.ltxavRgbFallback = r, J(t), Y(t), n("viewer.ltxavRgbFallback");
			try {
				let e = await re(r);
				if (!e?.ok) throw Error(e?.error || "Failed to update LTXAV RGB preview fallback setting");
			} catch (e) {
				t.viewer.ltxavRgbFallback = i, J(t), Y(t), n("viewer.ltxavRgbFallback"), T(e?.message || "Failed to update LTXAV RGB preview fallback setting", "error");
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
			id: `${Kt}.WorkflowMinimap.${r}`,
			category: i(M(o).replace("Majoor: ", "")),
			name: M(o),
			tooltip: M(s),
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
var Yt = "Majoor", Xt = "Majoor Assets Manager";
function Zt(e, t, n) {
	let r = (e, t) => [
		Xt,
		e,
		t
	];
	e({
		id: `${Yt}.ExecutionGrouping.Enabled`,
		category: r(M("cat.scanning"), "Execution grouping"),
		name: "Execution job/stack grouping",
		tooltip: "Enable or disable all live job_id / stack_id tracking, grouping, and stack finalization logic.",
		type: "boolean",
		defaultValue: !!(t.executionGrouping?.enabled ?? j.EXECUTION_GROUPING_ENABLED),
		onChange: async (e) => {
			let r = !!(t.executionGrouping?.enabled ?? j.EXECUTION_GROUPING_ENABLED), i = !!e;
			t.executionGrouping = t.executionGrouping || {}, t.executionGrouping.enabled = i, J(t), Y(t), n("executionGrouping.enabled");
			try {
				let e = await te(i);
				if (!e?.ok) throw Error(e?.error || "Failed to update execution grouping setting");
				t.executionGrouping.enabled = !!e?.data?.prefs?.enabled, J(t), Y(t), n("executionGrouping.enabled");
			} catch (e) {
				t.executionGrouping.enabled = r, J(t), Y(t), n("executionGrouping.enabled"), T(e?.message || "Failed to update execution grouping setting", "error");
			}
		}
	}), e({
		id: `${Yt}.AutoScan.OnStartup`,
		category: r(M("cat.scanning"), M("setting.scan.startup.name").replace("Majoor: ", "")),
		name: M("setting.scan.startup.name"),
		tooltip: M("setting.scan.startup.desc"),
		type: "boolean",
		defaultValue: !!t.autoScan?.onStartup,
		onChange: (e) => {
			t.autoScan = t.autoScan || {}, t.autoScan.onStartup = !!e, J(t), Y(t), n("autoScan.onStartup");
		}
	}), e({
		id: `${Yt}.Scan.FastMode`,
		category: r(M("cat.scanning"), "Scan mode"),
		name: "Fast scan mode",
		tooltip: "Use fast scan mode for manual backfill scans (skip heavier metadata work during scan).",
		type: "boolean",
		defaultValue: !!(t.scan?.fastMode ?? !0),
		onChange: (e) => {
			t.scan = t.scan || {}, t.scan.fastMode = !!e, J(t), n("scan.fastMode");
		}
	}), e({
		id: `${Yt}.RtHydrate.Concurrency`,
		category: r(M("cat.scanning"), "Hydration"),
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
			t.rtHydrate = t.rtHydrate || {}, t.rtHydrate.concurrency = Math.max(1, Math.min(20, Math.round(G(e, j.RT_HYDRATE_CONCURRENCY || 5)))), J(t), Y(t), n("rtHydrate.concurrency");
		}
	});
	let i = (e, t, n, r) => {
		let i = Math.round(G(e, t));
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
			let e = await ue();
			if (!e?.ok) return;
			a(e.data || {});
		} catch (e) {
			console.debug?.(e);
		}
	};
	e({
		id: `${Yt}.Watcher.Enabled`,
		category: r(M("cat.scanning"), M("setting.watcher.enabled.label", "Enable watcher")),
		name: M("setting.watcher.name"),
		tooltip: M("setting.watcher.desc") + " (env: MJR_ENABLE_WATCHER)",
		type: "boolean",
		defaultValue: !!t.watcher?.enabled,
		onChange: async (e) => {
			t.watcher = t.watcher || {}, t.watcher.enabled = !!e, J(t), n("watcher.enabled");
			try {
				let r = await k(!!e);
				r?.ok || (t.watcher.enabled = !e, J(t), n("watcher.enabled"), T(r?.error || M("toast.failedToggleWatcher", "Failed to toggle watcher"), "error"));
			} catch {
				t.watcher.enabled = !e, J(t), n("watcher.enabled");
			}
		}
	}), e({
		id: `${Yt}.Watcher.DebounceDelay`,
		category: r(M("cat.scanning"), M("setting.watcher.debounce.label", "Watcher debounce delay")),
		name: M("setting.watcher.debounce.name"),
		tooltip: M("setting.watcher.debounce.desc") + " (env: MJR_WATCHER_DEBOUNCE_MS)",
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
				t.watcher = t.watcher || {}, t.watcher.debounceMs = a, J(t);
				try {
					let e = await v({ debounce_ms: a });
					if (!e?.ok) throw Error(e?.error || M("setting.watcher.debounce.error"));
					let r = Math.round(Number(e?.data?.debounce_ms ?? a));
					t.watcher.debounceMs = r, J(t), n("watcher.debounceMs");
				} catch (e) {
					t.watcher.debounceMs = o, J(t), n("watcher.debounceMs"), T(e?.message || M("setting.watcher.debounce.error"), "error");
				}
			}
		}
	}), e({
		id: `${Yt}.Watcher.DedupeWindow`,
		category: r(M("cat.scanning"), M("setting.watcher.dedupe.label", "Watcher dedupe window")),
		name: M("setting.watcher.dedupe.name"),
		tooltip: M("setting.watcher.dedupe.desc") + " (env: MJR_WATCHER_DEDUPE_TTL_MS)",
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
				t.watcher = t.watcher || {}, t.watcher.dedupeTtlMs = a, J(t);
				try {
					let e = await v({ dedupe_ttl_ms: a });
					if (!e?.ok) throw Error(e?.error || M("setting.watcher.dedupe.error"));
					let r = Math.round(Number(e?.data?.dedupe_ttl_ms ?? a));
					t.watcher.dedupeTtlMs = r, J(t), n("watcher.dedupeTtlMs");
				} catch (e) {
					t.watcher.dedupeTtlMs = o, J(t), n("watcher.dedupeTtlMs"), T(e?.message || M("setting.watcher.dedupe.error"), "error");
				}
			}
		}
	}), e({
		id: `${Yt}.Watcher.MaxPending`,
		category: r(M("cat.scanning"), "Watcher queue"),
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
			t.watcher = t.watcher || {}, t.watcher.maxPending = Math.max(10, Math.min(5e3, Math.round(G(e, 500)))), J(t), Y(t), n("watcher.maxPending");
		}
	}), e({
		id: `${Yt}.Watcher.MinSize`,
		category: r(M("cat.scanning"), "Watcher file size"),
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
			t.watcher = t.watcher || {}, t.watcher.minSize = Math.max(0, Math.min(1e6, Math.round(G(e, 100)))), J(t), Y(t), n("watcher.minSize");
		}
	}), e({
		id: `${Yt}.Watcher.MaxSize`,
		category: r(M("cat.scanning"), "Watcher file size"),
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
			t.watcher = t.watcher || {}, t.watcher.maxSize = Math.max(1e5, Math.min(17179869184, Math.round(G(e, 4294967296)))), J(t), Y(t), n("watcher.maxSize");
		}
	});
	try {
		o().catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	e({
		id: `${Yt}.RatingTagsSync.Enabled`,
		category: r(M("cat.scanning"), M("setting.sync.rating.name").replace("Majoor: ", "")),
		name: M("setting.sync.rating.name"),
		tooltip: M("setting.sync.rating.desc"),
		type: "boolean",
		defaultValue: !!t.ratingTagsSync?.enabled,
		onChange: (e) => {
			t.ratingTagsSync = t.ratingTagsSync || {}, t.ratingTagsSync.enabled = !!e, J(t), n("ratingTagsSync.enabled");
		}
	});
}
//#endregion
//#region ui/app/settings/settingsFeed.ts
var Qt = "Majoor", $t = "Majoor Assets Manager";
function en(e, t, n) {
	let r = (e) => [
		$t,
		M("cat.feed", "Generated Feed"),
		e
	], i = () => {
		t.feed = t.feed || {};
	};
	e({
		id: `${Qt}.Feed.CardSize`,
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
		id: `${Qt}.Feed.ShowInfo`,
		category: r("Show info section"),
		name: "Show card info section",
		tooltip: "Show or hide the entire info section (filename, metadata, dots) below thumbnails in the Generated Feed.",
		type: "boolean",
		defaultValue: !!(t.feed?.showInfo ?? j.FEED_SHOW_INFO),
		onChange: (e) => {
			i(), t.feed.showInfo = !!e, J(t), Y(t), n("feed.showInfo");
		}
	}), e({
		id: `${Qt}.Feed.ShowFilename`,
		category: r("Show filename"),
		name: "Show filename",
		tooltip: "Display the filename on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showFilename ?? j.FEED_SHOW_FILENAME),
		onChange: (e) => {
			i(), t.feed.showFilename = !!e, J(t), Y(t), n("feed.showFilename");
		}
	}), e({
		id: `${Qt}.Feed.ShowDimensions`,
		category: r("Show dimensions"),
		name: "Show dimensions",
		tooltip: "Display resolution (WxH) and duration on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDimensions ?? j.FEED_SHOW_DIMENSIONS),
		onChange: (e) => {
			i(), t.feed.showDimensions = !!e, J(t), Y(t), n("feed.showDimensions");
		}
	}), e({
		id: `${Qt}.Feed.ShowDate`,
		category: r("Show date/time"),
		name: "Show date/time",
		tooltip: "Display date and time on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showDate ?? j.FEED_SHOW_DATE),
		onChange: (e) => {
			i(), t.feed.showDate = !!e, J(t), Y(t), n("feed.showDate");
		}
	}), e({
		id: `${Qt}.Feed.ShowGenTime`,
		category: r("Show generation time"),
		name: "Show generation time",
		tooltip: "Display the generation time badge on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showGenTime ?? j.FEED_SHOW_GENTIME),
		onChange: (e) => {
			i(), t.feed.showGenTime = !!e, J(t), Y(t), n("feed.showGenTime");
		}
	}), e({
		id: `${Qt}.Feed.ShowWorkflowDot`,
		category: r("Show workflow dot"),
		name: "Show workflow indicator",
		tooltip: "Display the workflow availability dot on feed cards.",
		type: "boolean",
		defaultValue: !!(t.feed?.showWorkflowDot ?? j.FEED_SHOW_WORKFLOW_DOT),
		onChange: (e) => {
			i(), t.feed.showWorkflowDot = !!e, J(t), Y(t), n("feed.showWorkflowDot");
		}
	}), e({
		id: `${Qt}.Feed.ShowExtBadge`,
		category: r("Show format badges"),
		name: "Show format badges",
		tooltip: "Display format badges (e.g. JPG, MP4) on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showExtBadge ?? j.FEED_SHOW_BADGES_EXTENSION),
		onChange: (e) => {
			i(), t.feed.showExtBadge = !!e, J(t), Y(t), n("feed.showExtBadge");
		}
	}), e({
		id: `${Qt}.Feed.ShowRatingBadge`,
		category: r("Show rating badges"),
		name: "Show ratings",
		tooltip: "Display star ratings on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showRatingBadge ?? j.FEED_SHOW_BADGES_RATING),
		onChange: (e) => {
			i(), t.feed.showRatingBadge = !!e, J(t), Y(t), n("feed.showRatingBadge");
		}
	}), e({
		id: `${Qt}.Feed.ShowTagsBadge`,
		category: r("Show tags badges"),
		name: "Show tags",
		tooltip: "Display tag indicators on feed card thumbnails.",
		type: "boolean",
		defaultValue: !!(t.feed?.showTagsBadge ?? j.FEED_SHOW_BADGES_TAGS),
		onChange: (e) => {
			i(), t.feed.showTagsBadge = !!e, J(t), Y(t), n("feed.showTagsBadge");
		}
	});
}
//#endregion
//#region ui/app/settings/settingsSecurity.ts
var tn = "Majoor", nn = "Majoor Assets Manager", rn = 16, an = {
	safeMode: !1,
	allowWrite: !0,
	allowDelete: !0,
	allowRename: !0,
	allowOpenInFolder: !0,
	allowResetIndex: !0
};
function on(e) {
	return !!e;
}
function sn(e, t) {
	return on(e) === on(t);
}
function cn(e) {
	return typeof e == "string" ? e.trim() : "";
}
function ln(e) {
	let t = String(e || "").trim().toLowerCase();
	return t === "localhost" || t === "127.0.0.1" || t === "::1";
}
function un() {
	return globalThis.location || globalThis.window?.location || null;
}
function dn() {
	let e = un();
	if (!e) return !1;
	let t = String(e.protocol || "").toLowerCase(), n = String(e.hostname || "").trim();
	return t === "http:" && !ln(n);
}
function fn(e) {
	let t = globalThis.crypto;
	if (!t?.getRandomValues) throw Error("Secure token generation requires crypto.getRandomValues().");
	return t.getRandomValues(e);
}
function pn(e) {
	let t = Math.max(4, Number(e) || 0), n = new Uint8Array(t);
	return fn(n), Array.from(n, (e) => e.toString(16).padStart(2, "0")).join("");
}
function mn() {
	return `mjr_${pn(18)}`;
}
function hn(e) {
	return String(e?.apiToken || "").trim().length >= rn && W(e?.allowWrite, !0) && W(e?.requireAuth, !1) && !W(e?.allowRemoteWrite, !1);
}
function gn(e) {
	let t = String((e && typeof e == "object" ? e : {}).apiToken || "").trim();
	return {
		apiToken: t.length >= rn ? t : mn(),
		allowWrite: !0,
		requireAuth: !0,
		allowRemoteWrite: !1,
		allowInsecureTokenTransport: dn()
	};
}
function _n(e) {
	let t = e || {};
	return {
		safe_mode: W(t.safeMode, !1),
		allow_write: W(t.allowWrite, !0),
		require_auth: W(t.requireAuth, !1),
		allow_remote_write: W(t.allowRemoteWrite, !1),
		allow_insecure_token_transport: W(t.allowInsecureTokenTransport, !1),
		allow_delete: W(t.allowDelete, !0),
		allow_rename: W(t.allowRename, !0),
		allow_open_in_folder: W(t.allowOpenInFolder, !0),
		allow_reset_index: W(t.allowResetIndex, !0),
		...String(t.apiToken || "").trim() ? { api_token: String(t.apiToken || "").trim() } : {}
	};
}
function vn(e) {
	return C(_n(e));
}
function yn(e) {
	let t = String(e?.security?.tokenHint || "").trim();
	return t ? M("setting.sec.token.placeholderConfigured", "Token configured on server ({tokenHint}). Leave blank to keep the current server token.", { tokenHint: t }) : e?.security?.tokenConfigured ? M("setting.sec.token.placeholderConfiguredGeneric", "Token configured on server. Leave blank to keep the current server token.") : M("setting.sec.token.placeholder", "Auto-generated for this browser session.");
}
function bn(e, t, n) {
	let r = (e, t) => [
		nn,
		e,
		t
	];
	e({
		id: `${tn}.Safety.ConfirmDeletion`,
		category: r(M("cat.security"), "Confirm before deleting"),
		name: "Confirm before deleting",
		tooltip: "Show a confirmation dialog before deleting files. Disabling this allows instant deletion.",
		type: "boolean",
		defaultValue: t.safety?.confirmDeletion !== !1,
		onChange: (e) => {
			sn(t.safety?.confirmDeletion !== !1, e) || (t.safety = t.safety || {}, t.safety.confirmDeletion = !!e, J(t), Y(t), n("safety.confirmDeletion"));
		}
	});
	let i = (i, a, o, s = "cat.security") => {
		e({
			id: `${tn}.Security.${i}`,
			category: r(M(s), M(a).replace("Majoor: ", "")),
			name: M(a),
			tooltip: M(o),
			type: "boolean",
			defaultValue: W(t.security?.[i], an[i] ?? !1),
			onChange: (e) => {
				if (!sn(t.security?.[i], e)) {
					t.security = t.security || {}, t.security[i] = !!e, J(t), n(`security.${i}`);
					try {
						vn(t.security).then((e) => {
							e?.ok && e.data?.prefs ? kt() : e && e.ok === !1 && console.warn("[Majoor] backend security settings update failed", e.error || e);
						}).catch(() => {});
					} catch (e) {
						console.debug?.(e);
					}
				}
			}
		});
	};
	i("safeMode", "setting.sec.safe.name", "setting.sec.safe.desc"), i("allowWrite", "setting.sec.write.name", "setting.sec.write.desc"), i("allowDelete", "setting.sec.del.name", "setting.sec.del.desc"), i("allowRename", "setting.sec.ren.name", "setting.sec.ren.desc"), i("allowOpenInFolder", "setting.sec.open.name", "setting.sec.open.desc"), i("allowResetIndex", "setting.sec.reset.name", "setting.sec.reset.desc"), e({
		id: `${tn}.Security.RemoteLanPreset`,
		category: r(M("cat.remote"), M("setting.sec.remoteLanPreset.name").replace("Majoor: ", "")),
		name: M("setting.sec.remoteLanPreset.name"),
		tooltip: M("setting.sec.remoteLanPreset.desc"),
		type: "boolean",
		defaultValue: hn(t.security),
		onChange: (e) => {
			if (t.security = t.security || {}, sn(t.security.remoteLanPreset, e)) return;
			if (t.security.remoteLanPreset = !!e, !e) {
				J(t), n("security.remoteLanPreset");
				return;
			}
			let r;
			try {
				r = gn(t.security);
			} catch (e) {
				T(e?.message || M("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				return;
			}
			Object.assign(t.security, r), t.security.tokenConfigured = !0, t.security.tokenHint = String(r.apiToken || "").trim() ? `...${String(r.apiToken).trim().slice(-4)}` : "", r.apiToken && w(r.apiToken), J(t), n("security.remoteLanPreset"), n("security.apiToken"), n("security.allowWrite"), n("security.requireAuth"), n("security.allowRemoteWrite"), n("security.allowInsecureTokenTransport");
			try {
				vn(t.security).then((e) => {
					e?.ok && e.data?.prefs ? (kt(), T(M("toast.remoteLanPresetApplied", "Recommended remote LAN setup applied. This browser session is now authorized for Majoor write operations."), "success")) : e && e.ok === !1 && (T(e.error || M("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error"), console.warn("[Majoor] backend remote LAN preset update failed", e.error || e));
				}).catch((e) => {
					T(e?.message || M("toast.remoteLanPresetFailed", "Failed to apply the recommended remote LAN setup."), "error");
				});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), e({
		id: `${tn}.Security.ApiToken`,
		category: r(M("cat.remote"), M("setting.sec.token.name").replace("Majoor: ", "")),
		name: M("setting.sec.token.name", "Majoor: API Token"),
		tooltip: M("setting.sec.token.desc", "Store the API token used for write operations. Majoor sends it via X-MJR-Token and Authorization headers."),
		type: "text",
		defaultValue: t.security?.apiToken || "",
		attrs: { placeholder: yn(t) },
		onChange: (e) => {
			t.security = t.security || {};
			let r = cn(e);
			if (cn(t.security.apiToken) !== r && (t.security.apiToken = r, t.security.apiToken && (t.security.tokenConfigured = !0, t.security.tokenHint = `...${t.security.apiToken.slice(-4)}`, w(t.security.apiToken)), J(t), n("security.apiToken"), t.security.apiToken)) try {
				C({ api_token: t.security.apiToken }).then((e) => {
					e?.ok && e.data?.prefs ? kt() : e && e.ok === !1 && console.warn("[Majoor] backend token update failed", e.error || e);
				}).catch(() => {});
			} catch (e) {
				console.debug?.(e);
			}
		}
	}), i("requireAuth", "setting.sec.requireAuth.name", "setting.sec.requireAuth.desc", "cat.remote"), i("allowRemoteWrite", "setting.sec.remote.name", "setting.sec.remote.desc", "cat.remote"), i("allowInsecureTokenTransport", "setting.sec.insecureTransport.name", "setting.sec.insecureTransport.desc", "cat.remote");
}
//#endregion
//#region ui/app/settings/settingsAdvanced.ts
var Z = "Majoor", xn = "Majoor Assets Manager";
function Sn(e, t, r, a) {
	let o = (e, t) => [
		xn,
		e,
		t
	], c = String(t.paths?.outputDirectory || ""), l = null, f = 0, p = null;
	e({
		id: `${Z}.Paths.OutputDirectory`,
		category: o(M("cat.advanced"), "Paths / Output"),
		name: "Majoor: Generation Output Directory",
		tooltip: "Override the ComfyUI generation output directory used by Majoor (equivalent to --output-directory). Leave empty to keep the current backend default.",
		type: "text",
		defaultValue: String(t.paths?.outputDirectory || ""),
		attrs: { placeholder: "D:\\\\____COMFY_OUTPUTS" },
		onChange: async (e) => {
			let n = String(e || "").trim();
			t.paths = t.paths || {}, t.paths.outputDirectory = n, J(t);
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
					if (!i?.ok) throw Error(i?.error || M("toast.failedSetOutputDirectory", "Failed to set output directory"));
					let a = String(i?.data?.output_directory || n).trim();
					t.paths.outputDirectory = a, c = a, J(t), r("paths.outputDirectory");
				} catch (n) {
					if (e !== f || String(n?.name || "") === "AbortError" || String(n?.code || "") === "ABORTED") return;
					t.paths.outputDirectory = c, J(t), r("paths.outputDirectory"), T(n?.message || M("toast.failedSetOutputDirectory", "Failed to set output directory"), "error");
				}
			}, 700);
		}
	});
	try {
		E().then((e) => {
			if (!e?.ok) return;
			let n = String(e?.data?.output_directory || "").trim();
			t.paths = t.paths || {}, t.paths.outputDirectory !== n && (t.paths.outputDirectory = n, c = n, J(t), r("paths.outputDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let m = String(t.paths?.indexDirectory || ""), g = null, _ = 0, v = null;
	e({
		id: `${Z}.Paths.IndexDirectory`,
		category: o(M("cat.advanced"), "Paths / Index"),
		name: "Majoor: Index Database Directory",
		tooltip: "Override the Majoor index database directory. Use this to keep the SQLite index on a different local disk. Requires restart.",
		type: "text",
		defaultValue: String(t.paths?.indexDirectory || ""),
		attrs: { placeholder: "D:\\MajoorIndex" },
		onChange: async (e) => {
			let n = String(e || "").trim();
			t.paths = t.paths || {}, t.paths.indexDirectory = n, J(t);
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
					let i = await he(n, v ? { signal: v.signal } : {});
					if (e !== _) return;
					if (!i?.ok) throw Error(i?.error || M("toast.failedSetIndexDirectory", "Failed to set index directory"));
					let a = String(i?.data?.index_directory || n).trim(), o = a !== m;
					t.paths.indexDirectory = a, m = a, J(t), r("paths.indexDirectory"), o && T(M("toast.indexDirectorySavedRestart", "Index directory saved. Restart ComfyUI to apply."), "success", void 0, { history: { trackId: "settings:index-directory-saved" } });
				} catch (n) {
					if (e !== _ || String(n?.name || "") === "AbortError" || String(n?.code || "") === "ABORTED") return;
					t.paths.indexDirectory = m, J(t), r("paths.indexDirectory"), T(n?.message || M("toast.failedSetIndexDirectory", "Failed to set index directory"), "error");
				}
			}, 700);
		}
	});
	try {
		le().then((e) => {
			if (!e?.ok) return;
			let n = String(e?.data?.index_directory || "").trim();
			t.paths = t.paths || {}, t.paths.indexDirectory !== n && (t.paths.indexDirectory = n, m = n, J(t), r("paths.indexDirectory"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let b = String(t.paths?.workflowRoots || ""), x = null, C = 0, w = null;
	e({
		id: `${Z}.Paths.WorkflowRoots`,
		category: o(M("cat.advanced"), "Paths / Workflows"),
		name: "Majoor: Workflow Roots",
		tooltip: "Folders scanned by the Workflow tab. Use one folder per line, or separate folders with semicolons. Leave empty to use ComfyUI defaults and MJR_AM_WORKFLOW_DIRECTORY.",
		type: "text",
		defaultValue: String(t.paths?.workflowRoots || ""),
		attrs: { placeholder: "D:\\\\ComfyUI\\\\user\\\\default\\\\workflows" },
		onChange: async (e) => {
			let n = String(e || "").trim();
			t.paths = t.paths || {}, t.paths.workflowRoots = n, J(t);
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
					let i = await se(n, w ? { signal: w.signal } : {});
					if (e !== C) return;
					if (!i?.ok) throw Error(i?.error || M("toast.failedSetWorkflowRoots", "Failed to set workflow roots"));
					let a = String(i?.data?.workflow_roots_text || n).trim();
					t.paths.workflowRoots = a, b = a, J(t), r("paths.workflowRoots"), T(M("toast.workflowRootsSaved", "Workflow roots saved"), "success", 1800);
				} catch (n) {
					if (e !== C || String(n?.name || "") === "AbortError" || String(n?.code || "") === "ABORTED") return;
					t.paths.workflowRoots = b, J(t), r("paths.workflowRoots"), T(n?.message || M("toast.failedSetWorkflowRoots", "Failed to set workflow roots"), "error");
				}
			}, 700);
		}
	});
	try {
		ne().then((e) => {
			if (!e?.ok) return;
			let n = String(e?.data?.workflow_roots_text || "").trim();
			t.paths = t.paths || {}, t.paths.workflowRoots !== n && (t.paths.workflowRoots = n, b = n, J(t), r("paths.workflowRoots"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	let te = ve().map((e) => e.code), re = ["auto", ...te];
	e({
		id: `${Z}.Language`,
		category: o(M("cat.advanced"), M("setting.language.name", "Language")),
		name: M("setting.language.name", "Majoor: Language"),
		tooltip: "Use auto to detect and follow ComfyUI language. Or choose a fixed language for Majoor only.",
		type: "combo",
		defaultValue: t.i18n?.followComfyLanguage ? "auto" : we(),
		options: re,
		onChange: (e) => {
			if (t.i18n = t.i18n || {}, e === "auto") {
				t.i18n.followComfyLanguage = !0, Te(!0), Se(a), J(t), r("language");
				return;
			}
			te.includes(e) && (t.i18n.followComfyLanguage = !1, Te(!1), ye(e), J(t), r("language"));
		}
	}), e({
		id: `${Z}.ProbeBackend.Mode`,
		category: o(M("cat.advanced"), M("setting.probe.mode.name").replace("Majoor: ", "")),
		name: M("setting.probe.mode.name"),
		tooltip: M("setting.probe.mode.desc") + " (env: MAJOOR_MEDIA_PROBE_BACKEND)",
		type: "combo",
		defaultValue: t.probeBackend?.mode || K.probeBackend.mode,
		options: [
			"auto",
			"exiftool",
			"ffprobe",
			"both"
		],
		onChange: (e) => {
			let n = bt(e, [
				"auto",
				"exiftool",
				"ffprobe",
				"both"
			], K.probeBackend.mode);
			t.probeBackend = t.probeBackend || {}, t.probeBackend.mode = n, J(t), Y(t), r("probeBackend.mode"), i(n).catch(() => {});
		}
	}), e({
		id: `${Z}.MetadataFallback.Image`,
		category: o(M("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Images)",
		tooltip: "Enable Pillow fallback when ExifTool is missing or fails.",
		type: "boolean",
		defaultValue: t.metadataFallback?.image ?? K.metadataFallback.image,
		onChange: async (e) => {
			let n = !!e, i = !!(t.metadataFallback?.image ?? K.metadataFallback.image);
			t.metadataFallback = t.metadataFallback || {}, t.metadataFallback.image = n, J(t), r("metadataFallback.image");
			try {
				let e = await me({
					image: n,
					media: t.metadataFallback?.media ?? K.metadataFallback.media
				});
				if (!e?.ok) throw Error(e?.error || M("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				t.metadataFallback.image = i, J(t), r("metadataFallback.image"), T(e?.message || M("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	}), e({
		id: `${Z}.MetadataFallback.Media`,
		category: o(M("cat.advanced"), "Metadata"),
		name: "Majoor: Metadata Fallback (Audio/Video)",
		tooltip: "Enable hachoir fallback when ffprobe is missing or fails.",
		type: "boolean",
		defaultValue: t.metadataFallback?.media ?? K.metadataFallback.media,
		onChange: async (e) => {
			let n = !!e, i = !!(t.metadataFallback?.media ?? K.metadataFallback.media);
			t.metadataFallback = t.metadataFallback || {}, t.metadataFallback.media = n, J(t), r("metadataFallback.media");
			try {
				let e = await me({
					image: t.metadataFallback?.image ?? K.metadataFallback.image,
					media: n
				});
				if (!e?.ok) throw Error(e?.error || M("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"));
			} catch (e) {
				t.metadataFallback.media = i, J(t), r("metadataFallback.media"), T(e?.message || M("toast.failedUpdateMetadataFallback", "Failed to update metadata fallback settings"), "error");
			}
		}
	});
	try {
		D().then((e) => {
			if (!e?.ok || !e?.data?.prefs) return;
			let n = e.data.prefs || {}, i = !!(n.image ?? K.metadataFallback.image), a = !!(n.media ?? K.metadataFallback.media);
			t.metadataFallback = t.metadataFallback || {};
			let o = !1;
			t.metadataFallback.image !== i && (t.metadataFallback.image = i, o = !0), t.metadataFallback.media !== a && (t.metadataFallback.media = a, o = !0), o && (J(t), r("metadataFallback"));
		}).catch(() => {});
	} catch (e) {
		console.debug?.(e);
	}
	e({
		id: `${Z}.Db.Timeout`,
		category: o(M("cat.advanced"), "Database"),
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
			t.db = t.db || {}, t.db.timeoutMs = Math.max(1e3, Math.min(3e4, Math.round(G(e, 5e3)))), J(t), Y(t), r("db.timeoutMs");
		}
	}), e({
		id: `${Z}.Db.MaxConnections`,
		category: o(M("cat.advanced"), "Database"),
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
			t.db = t.db || {}, t.db.maxConnections = Math.max(1, Math.min(100, Math.round(G(e, 10)))), J(t), Y(t), r("db.maxConnections");
		}
	}), e({
		id: `${Z}.Db.QueryTimeout`,
		category: o(M("cat.advanced"), "Database"),
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
			t.db = t.db || {}, t.db.queryTimeoutMs = Math.max(500, Math.min(1e4, Math.round(G(e, 1e3)))), J(t), Y(t), r("db.queryTimeoutMs");
		}
	}), e({
		id: `${Z}.Observability.Enabled`,
		category: o(M("cat.advanced"), M("setting.obs.enabled.name").replace("Majoor: ", "")),
		name: M("setting.obs.enabled.name"),
		tooltip: M("setting.obs.enabled.desc"),
		type: "boolean",
		defaultValue: !!t.observability?.enabled,
		onChange: (e) => {
			t.observability = t.observability || {}, t.observability.enabled = !!e, J(t), Y(t), r("observability.enabled");
		}
	}), e({
		id: `${Z}.Observability.RuntimeDashboardMode`,
		category: o(M("cat.advanced"), "Runtime metrics badge"),
		name: "Majoor: Runtime metrics badge",
		tooltip: "Controls the small DB/enrichment/watcher metrics badge in the Assets Manager panel.",
		type: "combo",
		defaultValue: t.observability?.runtimeDashboardMode || K.observability.runtimeDashboardMode,
		options: [
			"autoHide30",
			"always",
			"hidden"
		],
		onChange: (e) => {
			let n = bt(e, [
				"autoHide30",
				"always",
				"hidden"
			], K.observability.runtimeDashboardMode);
			t.observability = t.observability || {}, t.observability.runtimeDashboardMode = n, J(t), r("observability.runtimeDashboardMode");
		}
	}), e({
		id: `${Z}.Observability.VerboseErrors`,
		category: o(M("cat.advanced"), "Verbose error logging"),
		name: "Verbose error logging",
		tooltip: "Show detailed error messages in toasts and console. Useful for debugging.",
		type: "boolean",
		defaultValue: !!t.observability?.verboseErrors,
		onChange: (e) => {
			t.observability = t.observability || {}, t.observability.verboseErrors = !!e, J(t), Y(t), r("observability.verboseErrors");
		}
	}), e({
		id: `${Z}.Observability.VerboseRouteRegistrationLogs`,
		category: o(M("cat.advanced"), "Logs"),
		name: "Majoor: Verbose route registration logs",
		tooltip: "When disabled, Majoor prints a compact startup summary instead of listing every registered API route. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(t.observability?.verboseRouteRegistrationLogs ?? K.observability?.verboseRouteRegistrationLogs ?? !1),
		onChange: async (e) => {
			let n = !!e, i = !!(t.observability?.verboseRouteRegistrationLogs ?? K.observability?.verboseRouteRegistrationLogs ?? !1);
			t.observability = t.observability || {}, t.observability.verboseRouteRegistrationLogs = n, J(t), r("observability.verboseRouteRegistrationLogs");
			try {
				let e = await fe(n);
				if (!e?.ok) throw Error(e?.error || "Failed to update route logging settings");
			} catch (e) {
				t.observability.verboseRouteRegistrationLogs = i, J(t), r("observability.verboseRouteRegistrationLogs"), T(e?.message || "Failed to update route logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let e = !!(await ee())?.data?.prefs?.enabled;
			t.observability = t.observability || {}, t.observability.verboseRouteRegistrationLogs !== e && (t.observability.verboseRouteRegistrationLogs = e, J(t), r("observability.verboseRouteRegistrationLogs"));
		} catch (e) {
			console.debug?.(e);
		}
	})(), e({
		id: `${Z}.Observability.VerboseStartupLogs`,
		category: o(M("cat.advanced"), "Logs"),
		name: "Majoor: Verbose startup logs",
		tooltip: "When disabled, Majoor suppresses most informational bootstrap logs during backend startup while keeping warnings and errors. Takes effect on the next backend restart.",
		type: "boolean",
		defaultValue: !!(t.observability?.verboseStartupLogs ?? K.observability?.verboseStartupLogs ?? !1),
		onChange: async (e) => {
			let n = !!e, i = !!(t.observability?.verboseStartupLogs ?? K.observability?.verboseStartupLogs ?? !1);
			t.observability = t.observability || {}, t.observability.verboseStartupLogs = n, J(t), r("observability.verboseStartupLogs");
			try {
				let e = await s(n);
				if (!e?.ok) throw Error(e?.error || "Failed to update startup logging settings");
			} catch (e) {
				t.observability.verboseStartupLogs = i, J(t), r("observability.verboseStartupLogs"), T(e?.message || "Failed to update startup logging settings", "error");
			}
		}
	}), (async () => {
		try {
			let e = !!(await O())?.data?.prefs?.enabled;
			t.observability = t.observability || {}, t.observability.verboseStartupLogs !== e && (t.observability.verboseStartupLogs = e, J(t), r("observability.verboseStartupLogs"));
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
			id: `${Z}.AI.HuggingFaceTokenVisible`,
			category: o(M("cat.advanced"), n),
			name: "Show HuggingFace token",
			tooltip: "Show or hide the HuggingFace token while editing.",
			type: "boolean",
			defaultValue: c,
			onChange: (e) => {
				let n = !!e;
				c = n, t.ai = t.ai || {}, t.ai.huggingFaceTokenVisible = n, J(t), r("ai.huggingFaceTokenVisible"), setTimeout(l, 0);
			}
		}), e({
			id: `${Z}.AI.HuggingFaceToken`,
			category: o(M("cat.advanced"), n),
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
							let n = await de(t);
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
			id: `${Z}.AI.VerboseLogs`,
			category: o(M("cat.advanced"), n),
			name: "Majoor: Verbose AI logs",
			tooltip: "Enable detailed HuggingFace/SigLIP2/X-CLIP logs and progress bars during model download/loading.",
			type: "boolean",
			defaultValue: !!(t.ai?.verboseAiLogs ?? K.ai?.verboseAiLogs ?? !1),
			onChange: async (e) => {
				let n = !!e, i = !!(t.ai?.verboseAiLogs ?? K.ai?.verboseAiLogs ?? !1);
				t.ai = t.ai || {}, t.ai.verboseAiLogs = n, J(t), r("ai.verboseAiLogs");
				try {
					let e = await ie(n);
					if (!e?.ok) throw Error(e?.error || "Failed to update AI logging settings");
				} catch (e) {
					t.ai.verboseAiLogs = i, J(t), r("ai.verboseAiLogs"), T(e?.message || "Failed to update AI logging settings", "error");
				}
			}
		}), (async () => {
			try {
				let e = !!(await d())?.data?.prefs?.enabled;
				t.ai = t.ai || {}, t.ai.verboseAiLogs !== e && (t.ai.verboseAiLogs = e, J(t), r("ai.verboseAiLogs"));
			} catch (e) {
				console.debug?.(e);
			}
		})();
	}
	e({
		id: `${Z}.AI.VectorStats`,
		category: o(M("cat.advanced"), "AI / Vector Search"),
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
		id: `${Z}.AI.VectorBackfillAction`,
		category: o(M("cat.advanced"), "AI / Vector Search"),
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
				T(M("toast.vectorBackfillStarting", "Starting vector backfill... This may take a while."), "info", void 0, { history: {
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
						T(M("toast.vectorBackfillRunning", "Vector backfill still running in background{job}.", { job: e ? ` (job ${e.slice(0, 8)})` : "" }), "info", void 0, { history: {
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
					} else T(M("toast.vectorBackfillComplete", "Vector backfill complete! Processed: {processed}, Indexed: {indexed}, Skipped: {skipped}", {
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
				} else throw Error(e?.error || M("toast.vectorBackfillFailedGeneric", "Backfill failed"));
			} catch (e) {
				let n = e?.message || String(e || M("status.unknown", "unknown"));
				T(M("toast.vectorBackfillFailedDetail", "Vector backfill failed: {error}", { error: n }), "error", void 0, { history: {
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
var Cn = "Majoor", wn = "Majoor Assets Manager";
function Tn(e, t, n) {
	let r = (e, t) => [
		wn,
		e,
		t
	];
	e({
		id: `${Cn}.AI.VectorSearchEnabled`,
		category: r(M("cat.search", "Search"), "AI"),
		name: M("setting.ai.vector.enabled.name", "Enable AI semantic search"),
		tooltip: M("setting.ai.vector.enabled.desc", "Enable/disable AI vector search features (SigLIP2/X-CLIP: description search, prompt alignment, AI tag suggestions, smart collections)."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorSearchEnabled ?? !0),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let r = !!(t.ai.vectorSearchEnabled ?? !0), i = !!e;
			t.ai.vectorSearchEnabled = i, J(t), Y(t), n("ai.vectorSearchEnabled");
			try {
				let e = await a(i);
				if (!e?.ok) {
					t.ai.vectorSearchEnabled = r, J(t), Y(t), n("ai.vectorSearchEnabled"), T(e?.error || "Failed to update AI vector search setting", "error");
					return;
				}
				T(i ? "AI semantic search enabled" : "AI semantic search disabled", "info", 2200);
			} catch (e) {
				t.ai.vectorSearchEnabled = r, J(t), Y(t), n("ai.vectorSearchEnabled"), T(e?.message || "Failed to update AI vector search setting", "error");
			}
		}
	}), e({
		id: `${Cn}.AI.VectorCaptionOnIndex`,
		category: r(M("cat.search", "Search"), "AI"),
		name: M("setting.ai.vector.captionOnIndex.name", "Generate AI captions during indexing"),
		tooltip: M("setting.ai.vector.captionOnIndex.desc", "Allow automatic vector indexing and backfill to run Florence-2 captions for image assets. This is slower and can use significant VRAM/CPU; leave it off for faster grid startup."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorCaptionOnIndex ?? !1),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let r = !!(t.ai.vectorCaptionOnIndex ?? !1), i = !!e;
			t.ai.vectorCaptionOnIndex = i, J(t), Y(t), n("ai.vectorCaptionOnIndex");
			try {
				let e = await a({ caption_on_index: i });
				if (!e?.ok) {
					t.ai.vectorCaptionOnIndex = r, J(t), Y(t), n("ai.vectorCaptionOnIndex"), T(e?.error || "Failed to update AI caption indexing setting", "error");
					return;
				}
				i && T("AI captions during indexing enabled", "info", 2600);
			} catch (e) {
				t.ai.vectorCaptionOnIndex = r, J(t), Y(t), n("ai.vectorCaptionOnIndex"), T(e?.message || "Failed to update AI caption indexing setting", "error");
			}
		}
	}), e({
		id: `${Cn}.AI.VectorIndexOnScan`,
		category: r(M("cat.search", "Search"), "AI"),
		name: M("setting.ai.vector.indexOnScan.name", "Index vectors during scans"),
		tooltip: M("setting.ai.vector.indexOnScan.desc", "Compute SigLIP/X-CLIP embeddings while assets are scanned. Disable to avoid surprise VRAM use; run vector backfill manually when needed."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorIndexOnScan ?? !1),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let r = !!(t.ai.vectorIndexOnScan ?? !1), i = !!e;
			t.ai.vectorIndexOnScan = i, J(t), Y(t), n("ai.vectorIndexOnScan");
			try {
				let e = await a({ index_on_scan: i });
				if (!e?.ok) {
					t.ai.vectorIndexOnScan = r, J(t), Y(t), n("ai.vectorIndexOnScan"), T(e?.error || "Failed to update vector scan indexing", "error");
					return;
				}
				T(i ? "Vector indexing during scans enabled" : "Vector indexing during scans disabled", "info", 2400);
			} catch (e) {
				t.ai.vectorIndexOnScan = r, J(t), Y(t), n("ai.vectorIndexOnScan"), T(e?.message || "Failed to update vector scan indexing", "error");
			}
		}
	}), e({
		id: `${Cn}.AI.VectorConcurrency`,
		category: r(M("cat.search", "Search"), "AI"),
		name: M("setting.ai.vector.concurrency.name", "Vector indexing concurrency"),
		tooltip: M("setting.ai.vector.concurrency.desc", "Maximum concurrent vector embedding workers. Use 1 to minimize transient VRAM spikes."),
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
			t.ai.vectorConcurrency = i, J(t), Y(t), n("ai.vectorConcurrency");
			try {
				let e = await a({ concurrency: i });
				e?.ok || (t.ai.vectorConcurrency = r, J(t), Y(t), n("ai.vectorConcurrency"), T(e?.error || "Failed to update vector concurrency", "error"));
			} catch (e) {
				t.ai.vectorConcurrency = r, J(t), Y(t), n("ai.vectorConcurrency"), T(e?.message || "Failed to update vector concurrency", "error");
			}
		}
	}), e({
		id: `${Cn}.AI.VectorUnloadAfterUse`,
		category: r(M("cat.search", "Search"), "AI"),
		name: M("setting.ai.vector.unloadAfterUse.name", "Unload AI models after use"),
		tooltip: M("setting.ai.vector.unloadAfterUse.desc", "Unload Majoor SigLIP/X-CLIP/Florence models after heavy AI actions and call torch CUDA cache cleanup. This frees VRAM but makes the next AI action slower."),
		type: "boolean",
		defaultValue: !!(t.ai?.vectorUnloadAfterUse ?? !1),
		onChange: async (e) => {
			t.ai = t.ai || {};
			let r = !!(t.ai.vectorUnloadAfterUse ?? !1), i = !!e;
			t.ai.vectorUnloadAfterUse = i, J(t), Y(t), n("ai.vectorUnloadAfterUse");
			try {
				let e = await a({ unload_after_use: i });
				if (!e?.ok) {
					t.ai.vectorUnloadAfterUse = r, J(t), Y(t), n("ai.vectorUnloadAfterUse"), T(e?.error || "Failed to update model unload setting", "error");
					return;
				}
				T(i ? "AI model unload after use enabled" : "AI model unload after use disabled", "info", 2400);
			} catch (e) {
				t.ai.vectorUnloadAfterUse = r, J(t), Y(t), n("ai.vectorUnloadAfterUse"), T(e?.message || "Failed to update model unload setting", "error");
			}
		}
	}), e({
		id: `${Cn}.AI.VectorUnloadNow`,
		category: r(M("cat.search", "Search"), "AI"),
		name: M("setting.ai.vector.unloadNow.name", "Memory purge now"),
		tooltip: M("setting.ai.vector.unloadNow.desc", "Immediately unload Majoor AI vector/caption models, ask ComfyUI to unload loaded models, and clear torch CUDA cache when idle."),
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
		id: `${Cn}.Search.MaxResults`,
		category: r(M("cat.search", "Search")),
		name: M("setting.search.maxResults.name", "Max search results (client)"),
		tooltip: M("setting.search.maxResults.desc", "Maximum number of results requested per search. The backend still enforces MAJOOR_SEARCH_MAX_LIMIT; increase that env var if you need a higher hard cap."),
		type: "number",
		defaultValue: Number(t.search?.maxResults || j.SEARCH_DEFAULT_LIMIT),
		attrs: {
			min: 10,
			max: j.MAX_PAGE_SIZE || 2e3,
			step: 1
		},
		onChange: (e) => {
			t.search = t.search || {}, t.search.maxResults = Math.max(10, Math.min(j.MAX_PAGE_SIZE || 2e3, Number(e) || j.SEARCH_DEFAULT_LIMIT)), J(t), Y(t), n("search.maxResults");
		}
	}), e({
		id: `${Cn}.EnvVars.Reference`,
		category: r(M("cat.advanced"), "Environment variables"),
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
var En = "Majoor Assets Manager", Dn = /^\s*Majoor:\s*/i, On = Object.freeze({
	ASSETS_PANEL: "Assets Panel",
	GENERATED_FEED: "Generated Feed",
	VIEWER: "Viewer & Floating Viewer",
	INDEXING: "Indexing & Watcher",
	SEARCH_AI: "Search & AI",
	GENERAL: "General",
	ADVANCED: "Advanced",
	SECURITY: "Security"
}), kn = new Set([
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
]), An = "Majoor.General.ResetAllSettings", jn = "mjr-settings-reset-btn", Mn = null, Nn = null;
function Pn(e) {
	let t = String(e || "").trim();
	return !t || t === An || t === "Majoor.Language" ? On.GENERAL : /^Majoor\.(Safety|Security)\./.test(t) ? On.SECURITY : /^Majoor\.(Paths|Db|ProbeBackend|MetadataFallback|Observability)\./.test(t) || t === "Majoor.EnvVars.Reference" ? On.ADVANCED : /^Majoor\.(Viewer|WorkflowMinimap)\./.test(t) ? On.VIEWER : /^Majoor\.Feed\./.test(t) ? On.GENERATED_FEED : /^Majoor\.(AutoScan|Scan|Watcher|ExecutionGrouping|RatingTagsSync)\./.test(t) || t === "Majoor.RtHydrate.Concurrency" ? On.INDEXING : /^Majoor\.AI\.(HuggingFaceTokenVisible|HuggingFaceToken|VerboseLogs|VectorStats|VectorBackfillAction|VectorSearchEnabled|VectorCaptionOnIndex|VectorIndexOnScan|VectorConcurrency|VectorUnloadAfterUse|VectorUnloadNow)$/.test(t) || /^Majoor\.Search\./.test(t) ? On.SEARCH_AI : /^Majoor\.(Grid|Cards|Badges|Sidebar|InfiniteScroll|General)\./.test(t) ? On.ASSETS_PANEL : On.GENERAL;
}
function Fn(e) {
	let t = Array.isArray(e?.category) ? e.category.filter(Boolean) : [], n = Pn(e?.id), r = String(t[1] || t[0] || "").trim(), i = String(t[2] || "").trim(), a = String(e?.name || "").replace(Dn, "").trim();
	return [
		En,
		n,
		i || r || a || n
	];
}
var In = !1, Ln = null, Rn = null, zn = !1, Bn = /* @__PURE__ */ new Set();
function Vn(e) {
	if (!e || typeof e != "object") return null;
	let t = { ...e };
	try {
		typeof t.name == "string" && (t.name = t.name.replace(Dn, "").trim());
	} catch (e) {
		console.debug?.(e);
	}
	try {
		t.category = Fn(t);
	} catch {
		t.category = [En, On.GENERAL];
	}
	return !t.tooltip && typeof t.name == "string" && t.name.trim() && (t.tooltip = t.name.trim()), t;
}
function Hn(e, t, n) {
	let r = String(t?.id || "").trim();
	if (!r || Bn.has(r)) return !1;
	Bn.add(r);
	try {
		return ge(e, r, n);
	} finally {
		Bn.delete(r);
	}
}
function Un(e, t) {
	if (!t || typeof t != "object") return t;
	let n = { ...t };
	Hn(e, n, n.defaultValue);
	let r = n.onChange;
	return n.onChange = (t, ...i) => {
		if (Hn(e, n, t), typeof r == "function") return r(t, ...i);
		n.defaultValue = t;
	}, n;
}
function Wn(e) {
	try {
		return JSON.parse(JSON.stringify(e || {}));
	} catch {
		return { ...K };
	}
}
function Gn(e, t, n, { wrapForComfy: r = !0 } = {}) {
	let i = [], a = (e) => {
		let n = Vn(e);
		n && i.push(r ? Un(t, n) : n);
	};
	return Gt(a, e, n), en(a, e, n), Jt(a, e, n), Zt(a, e, n), bn(a, e, n), Sn(a, e, n, t), Tn(a, e, n), i;
}
function Kn(e, t) {
	if (e === t) return !0;
	try {
		return JSON.stringify(e) === JSON.stringify(t);
	} catch {
		return !1;
	}
}
function qn(e) {
	return e ? e.querySelector(".form-input") || e.querySelector(".p-inputgroup") || e.querySelector(".setting-input") || e.querySelector("[class*='input']") : null;
}
function Jn(e, t) {
	let n = document.createElement("button");
	return n.type = "button", n.className = jn, n.textContent = e, n.title = t, n.style.marginLeft = "8px", n.style.minWidth = e.length > 2 ? "auto" : "24px", n.style.height = "24px", n.style.padding = e.length > 2 ? "0 10px" : "0", n.style.borderRadius = "6px", n.style.border = "1px solid var(--border-color, #555)", n.style.background = "var(--comfy-input-bg, #2b2b2b)", n.style.color = "var(--input-text, inherit)", n.style.cursor = "pointer", n.style.fontSize = "12px", n.style.lineHeight = "22px", n.style.flexShrink = "0", n;
}
function Yn(e, t, n) {
	String(e?.id || "").trim() && (Hn(n, e, t), typeof e?.onChange == "function" && e.onChange(t));
}
function Xn(e, t, n, r) {
	let i = !Kn(_e(r, t.id, t.defaultValue), n);
	e.disabled = !i, e.style.opacity = i ? "1" : "0.45";
}
function Zn() {
	if (typeof document > "u" || !Nn) return;
	let { app: e, definitions: t, defaultValues: n } = Nn, r = document.querySelector(`[data-setting-id="${An}"]`), i = qn(r);
	if (r && i && !r.getAttribute("data-mjr-reset-injected")) {
		r.setAttribute("data-mjr-reset-injected", "true"), i.innerHTML = "";
		let a = Jn("Reset all settings", "Reset all Majoor settings to defaults");
		a.onclick = (r) => {
			r.preventDefault(), r.stopPropagation();
			for (let r of t) r.id !== An && n.has(r.id) && Yn(r, n.get(r.id), e);
			Zn();
		}, i.appendChild(a);
	}
	for (let r of t) {
		if (!r?.id || r.id === An || !n.has(r.id)) continue;
		let t = document.querySelector(`[data-setting-id="${r.id}"]`);
		if (!t || t.getAttribute("data-mjr-reset-injected")) continue;
		let i = qn(t);
		if (!i) continue;
		t.setAttribute("data-mjr-reset-injected", "true");
		let a = Jn("Reset", "Reset this setting to default");
		Xn(a, r, n.get(r.id), e), a.onclick = (t) => {
			t.preventDefault(), t.stopPropagation();
			let i = n.get(r.id);
			Yn(r, i, e), Xn(a, r, i, e);
		}, i.appendChild(a);
	}
}
function Qn(e, t, n) {
	typeof document > "u" || typeof MutationObserver > "u" || (Nn = {
		app: e,
		definitions: t,
		defaultValues: new Map(n.filter((e) => e?.id && e.id !== An).map((e) => [e.id, e.defaultValue]))
	}, Zn(), !Mn && (Mn = new MutationObserver(() => Zn()), Mn.observe(document.body, {
		childList: !0,
		subtree: !0
	})));
}
function $n(e, t, { initRuntime: n = !1 } = {}) {
	if (Rn) typeof t == "function" && Rn.onAppliedListeners.add(t), e && !Rn.app && (Rn.app = e);
	else {
		let n = q();
		n.i18n = n.i18n || {}, typeof n.i18n.followComfyLanguage == "boolean" ? Te(!!n.i18n.followComfyLanguage) : (n.i18n.followComfyLanguage = !0, Te(!0), J(n));
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
		}, c = Ut(o, 120), l = Ut(s, 450), u = (e) => {
			typeof e == "string" && i.add(e), c();
		}, d = (e) => {
			typeof e == "string" && a.add(e), l();
		}, f = () => {
			let e = q();
			Object.assign(n, e), Y(n), u("storage");
		}, p = (e) => {
			!e || e.key !== "mjrSettings" || e.newValue !== e.oldValue && f();
		};
		if (!In) {
			if (Ln && typeof window < "u") try {
				window.removeEventListener("storage", Ln);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				window.addEventListener("storage", p), In = !0, Ln = p;
			} catch (e) {
				console.debug?.(e);
			}
		}
		Rn = {
			app: e,
			notifyApplied: (e) => {
				for (let t of r) try {
					t(n, e);
				} catch (e) {
					console.debug?.(e);
				}
				kn.has(String(e || "")) ? d(e) : u(e);
			},
			onAppliedListeners: r,
			refreshFromStorage: f,
			settings: n
		};
	}
	if (n && !zn) {
		let t = e || Rn.app, n = Rn.settings;
		Se(t), Y(n), xe(t), kt(), At(), jt(), n?.watcher && typeof n.watcher.enabled == "boolean" && k(!!n.watcher.enabled).catch(() => {}), Vt(), zn = !0;
	}
	return Rn;
}
var er = (e, t) => $n(e, t, { initRuntime: !0 }).settings, tr = (e, t) => {
	let n = $n(e, t, { initRuntime: !1 });
	Object.assign(n.settings, q());
	let r = e || n.app, i = Gn(n.settings, r, n.notifyApplied), a = Gn(Wn(K), r, () => {}, { wrapForComfy: !1 });
	return i.unshift(Un(r, {
		id: An,
		category: [
			En,
			On.GENERAL,
			"Reset"
		],
		name: "Reset all settings to defaults",
		tooltip: "Reset every Majoor Assets Manager setting to its default value.",
		type: "text",
		defaultValue: ""
	})), Qn(r, i, a), i;
};
try {
	let e = q();
	e?.watcher && typeof e.watcher.enabled == "boolean" && ae().then((e) => {
		let t = !!e?.ok && !!e?.data?.enabled, n = q();
		n.watcher = n.watcher || {}, typeof t == "boolean" && t !== !!n.watcher.enabled && (n.watcher.enabled = t, J(n), Oe("mjr-settings-changed", { key: "watcher.enabled" }, { warnPrefix: "[Majoor]" }));
	}).catch(() => {});
} catch (e) {
	console.debug?.(e);
}
//#endregion
//#region ui/features/workflows/workflowPickerState.ts
var Q = ut({
	open: !1,
	mode: "workflow",
	title: "",
	sourceAsset: null,
	workflow: null,
	items: [],
	resolve: null
});
function nr({ title: e = "Select workflow", sourceAsset: t = null } = {}) {
	return ir(null), Q.open = !0, Q.mode = "workflow", Q.title = String(e || "Select workflow"), Q.sourceAsset = t || null, Q.workflow = null, Q.items = [], new Promise((e) => {
		Q.resolve = e;
	});
}
function rr({ title: e = "Select asset", workflow: t = null, items: n = [] } = {}) {
	return ir(null), Q.open = !0, Q.mode = "asset", Q.title = String(e || "Select asset"), Q.sourceAsset = null, Q.workflow = t || null, Q.items = Array.isArray(n) ? n.filter(Boolean) : [], new Promise((e) => {
		Q.resolve = e;
	});
}
function ir(e = null) {
	let t = Q.resolve;
	if (Q.open = !1, Q.mode = "workflow", Q.title = "", Q.sourceAsset = null, Q.workflow = null, Q.items = [], Q.resolve = null, typeof t == "function") try {
		t(e || null);
	} catch (e) {
		console.debug?.(e);
	}
}
//#endregion
//#region ui/vue/majoorPrimeVue.ts
var ar = {
	Button: Ye,
	Checkbox: Je,
	InputText: dt,
	Textarea: et,
	Select: ct,
	ToggleButton: it,
	Badge: at,
	Tag: Ge,
	Dialog: Qe,
	Menu: st,
	Listbox: rt,
	Tree: lt,
	VirtualScroller: qe
};
function or(e) {
	return e.use(Xe, {
		ripple: !1,
		unstyled: !0,
		zIndex: { overlay: 10100 }
	}), e.use(Ze), e.use(nt), Object.entries(ar).forEach(([t, n]) => {
		e.component(`M${t}`, n);
	}), e;
}
//#endregion
//#region ui/vue/createVueApp.ts
function sr(e, t = void 0) {
	let n = pt(), r = We(e, t);
	return r.use(n), or(r), {
		app: r,
		pinia: n
	};
}
var cr = /* @__PURE__ */ new Map();
function lr(e, t, n) {
	try {
		window.dispatchEvent(new CustomEvent("mjr:keepalive-attached", { detail: {
			mountKey: String(e || "_mjrVueApp"),
			host: t || null,
			container: n || null
		} }));
	} catch {}
}
function ur(e) {
	let t = document.createElement("div");
	return t.dataset.mjrKeepAliveHost = String(e || "_mjrVueApp"), t.style.height = "100%", t.style.width = "100%", t.style.minHeight = "0", t.style.display = "flex", t.style.flexDirection = "column", t.style.overflow = "hidden", t;
}
function dr(e, t) {
	!e || !t || (e.style.height = "100%", e.style.minHeight = "0", e.style.display = "flex", e.style.flexDirection = "column", e.style.overflow = "hidden", !(e.firstChild === t && e.childNodes.length === 1) && (e.replaceChildren(t), lr(t?.dataset?.mjrKeepAliveHost, t, e)));
}
function fr(e, t, n = "_mjrVueApp") {
	if (!e) return !1;
	let r = cr.get(n), i = !1;
	if (!r) {
		let e = ur(n), { app: a } = sr(t);
		a.mount(e), r = {
			app: a,
			host: e,
			container: null
		}, cr.set(n, r), i = !0;
	}
	return dr(e, r.host), r.container = e, i;
}
function pr(e, t = "_mjrVueApp") {
	let n = cr.get(t);
	if (n?.app) {
		try {
			n.app.unmount();
		} catch {}
		try {
			n.host?.remove?.();
		} catch {}
		cr.delete(t);
	}
}
//#endregion
//#region ui/utils/format.ts
function mr(e) {
	if (!e) return null;
	let t = Number(e);
	if (!isNaN(t)) return /* @__PURE__ */ new Date(t * 1e3);
	let n = new Date(e);
	return isNaN(n.getTime()) ? null : n;
}
function hr(e) {
	let t = mr(e);
	return t ? `${t.getDate().toString().padStart(2, "0")}/${(t.getMonth() + 1).toString().padStart(2, "0")}` : "";
}
function gr(e) {
	let t = mr(e);
	return t ? `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}` : "";
}
function _r(e) {
	return e ? e < 60 ? `${Math.round(e)}s` : `${Math.floor(e / 60)}m ${Math.round(e % 60)}s` : "";
}
//#endregion
//#region ui/vue/components/panel/sidebar/SidebarFileInfoSection.vue
var vr = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "rgba(255, 255, 255, 0.03)",
		border: "1px solid var(--mjr-border, rgba(255, 255, 255, 0.12))",
		"border-radius": "8px",
		padding: "10px"
	}
}, yr = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "6px"
} }, br = ["title"], xr = ["title"], Sr = {
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
		let a = R(() => {
			let e = t.asset || {}, a = [];
			if (e.width && e.height && a.push({
				label: "Dimensions",
				value: `${e.width} x ${e.height}`,
				tooltip: "Image/video resolution in pixels"
			}), e.duration && e.duration > 0 && a.push({
				label: "Duration",
				value: _r(e.duration),
				tooltip: "Video duration"
			}), r(e)) {
				let t = Ne(e);
				t != null && a.push({
					label: "FPS",
					value: Pe(t),
					tooltip: "Native frame rate"
				});
				let n = Ae(e, t);
				n != null && a.push({
					label: "Length",
					value: `${Math.max(0, Math.floor(n))} frames`,
					tooltip: "Total frame count"
				});
			}
			let o = je(e.generation_time_ms ?? e.metadata?.generation_time_ms ?? 0);
			o > 0 && a.push({
				label: "Generation Time",
				value: `${(Number(o) / 1e3).toFixed(1)}s`,
				tooltip: "Time taken to generate this asset (workflow execution time)",
				valueStyle: `color: ${Me(o)}; font-weight: 600;`
			});
			let s = e.generation_time || e.file_creation_time || e.mtime || e.created_at;
			if (s) {
				let e = hr(s), t = gr(s);
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
		return (e, t) => a.value.length ? (N(), V("div", vr, [t[0] ||= F("div", { style: {
			"font-size": "12px",
			"font-weight": "700",
			color: "#607d8b",
			"margin-bottom": "8px",
			"text-transform": "uppercase",
			"letter-spacing": "0.4px"
		} }, " File Info ", -1), F("div", yr, [(N(!0), V(P, null, I(a.value, (e) => (N(), V("div", {
			key: e.label,
			style: {
				display: "flex",
				gap: "10px",
				"align-items": "flex-start",
				"justify-content": "space-between"
			}
		}, [F("div", {
			title: e.tooltip || "",
			style: {
				"font-size": "12px",
				opacity: "0.68",
				"min-width": "92px"
			}
		}, B(e.label), 9, br), F("div", {
			style: U(e.valueStyle || "font-size: 12px; text-align: right; word-break: break-word"),
			title: String(e.value || "")
		}, B(e.value), 13, xr)]))), 128))])])) : L("", !0);
	}
}, Cr = new Set([
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
function wr(e) {
	let t = String(e?.filename || e?.name || e?.filepath || e?.path || "").trim().toLowerCase();
	return !t || !t.includes(".") ? "" : t.split(".").pop() || "";
}
function Tr(e) {
	return String(e?.kind || "").trim().toLowerCase() === "image" || String(e?.mime || e?.mimetype || "").trim().toLowerCase().startsWith("image/") ? !0 : Cr.has(wr(e));
}
function Er(e) {
	let t = wr(e);
	return t === "jpg" || t === "jpeg";
}
function Dr() {
	try {
		return !!(q()?.ai?.vectorSearchEnabled ?? !0);
	} catch {
		return !0;
	}
}
function Or(e) {
	return e >= .75 ? "#4CAF50" : e >= .5 ? "#8BC34A" : e >= .3 ? "#FF9800" : "#F44336";
}
function kr(e) {
	return e >= .85 ? "Excellent" : e >= .7 ? "Good" : e >= .5 ? "Fair" : e >= .3 ? "Low" : "Very Low";
}
function Ar(e) {
	let t = String(e || "").trim();
	if (!t) return "";
	let n = [];
	for (let e of t.replace(/\r\n/g, "\n").split("\n")) {
		let t = String(e || "").trim();
		t && (/^title\s*:/i.test(t) || (/^caption\s*:/i.test(t) && (t = t.replace(/^caption\s*:/i, "").trim()), t && n.push(t)));
	}
	return (n.length ? n.join(" ") : t).replace(/\s+/g, " ").replace(/:{2,}\s*$/, "").trim();
}
function jr(e) {
	let t = String(e?.filename || "").trim();
	if (!t) return [];
	let n = String(e?.subfolder || "").trim(), r = String(e?.folder_type || "input").trim().toLowerCase(), i = [], a = (e) => {
		if (!e) return;
		let r = be(t, n, e);
		r && !i.includes(r) && i.push(r);
	};
	return (r === "input" || r === "output") && a(r), a("input"), a("output"), i;
}
function Mr(e) {
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
function Nr(e, t) {
	let n = String(e?.pass_stage || e?.stage || e?.kind || "").trim().toLowerCase();
	if (n === "txt2img" || n === "text_to_image" || n === "text-to-image") return M("sidebar.generation.stageTextToImage", "Text-to-Image");
	if (n === "img2img" || n === "image_to_image" || n === "image-to-image") return M("sidebar.generation.stageImageToImage", "Image-to-Image");
	if (n === "inpaint" || n === "inpainting") return M("sidebar.generation.stageInpaint", "Inpaint");
	if (n === "upscale" || n === "upscaling") return M("sidebar.generation.stageUpscale", "Upscale");
	if (n === "refine" || n === "refiner") return M("sidebar.generation.stageRefine", "Refine");
	let r = String(e?.pass_name || "").trim();
	if (r && r.toLowerCase() !== "base") return r;
	let i = Number(e?.denoise);
	return t === 0 || i === 1 ? M("sidebar.generation.stageBase", "Base") : Number.isFinite(i) && i < 1 ? M("sidebar.generation.stageRefineUpscale", "Refine / Upscale") : M("sidebar.generation.stagePassN", "Pass {n}", { n: t + 1 });
}
function Pr(e) {
	return e?.geninfo && typeof e.geninfo == "object" ? { geninfo: e.geninfo } : e?.metadata && (typeof e.metadata == "object" || typeof e.metadata == "string") ? e.metadata : e?.prompt && (typeof e.prompt == "object" || typeof e.prompt == "string") ? e.prompt : e?.metadata_raw ? e.metadata_raw : e?.exif ? e.exif : null;
}
function Fr(e) {
	try {
		if (!e || typeof e != "object") return !1;
		if (e.is_override || typeof e.workflow_notes == "string" && e.workflow_notes.trim() || typeof e.notes == "string" && e.notes.trim() || Array.isArray(e.custom_info) && e.custom_info.length > 0 || e.engine && typeof e.engine == "object" && e.engine.type || _t(e.prompt) || typeof (e.negative_prompt || e.negativePrompt) == "string" && _t(e.negative_prompt || e.negativePrompt) || e.models || e.model || e.checkpoint || e.loras || e.sampler || e.sampler_name || e.steps || e.cfg || e.cfg_scale || e.cfg_high_noise || e.cfg_low_noise || e.scheduler || Array.isArray(e.chained_passes) && e.chained_passes.length > 0 || Array.isArray(e.all_samplers) && e.all_samplers.length > 0 || e.seed || e.denoise || e.denoising || e.clip_skip || e.voice || e.language || e.temperature || e.top_k || e.top_p || e.repetition_penalty || e.max_new_tokens || e.device || e.voice_preset || e.instruct || e.dtype || e.attn_implementation || e.enable_chunking !== void 0 || e.max_chars_per_chunk || e.chunk_combination_method || e.silence_between_chunks_ms || e.enable_audio_cache !== void 0 || e.batch_size !== void 0 || e.use_torch_compile !== void 0 || e.use_cuda_graphs !== void 0 || e.compile_mode || typeof e.lyrics == "string" && e.lyrics.trim()) return !0;
	} catch {
		return !1;
	}
	return !1;
}
function Ir(e) {
	return e ? typeof e == "string" ? vt(e) : typeof e == "object" ? vt(e.name || e.value || "") : "" : "";
}
function Lr(e, t, n, r) {
	let i = String(r || "").trim();
	if (!i) return;
	let a = `${n}::${i}`;
	t.has(a) || (t.add(a), e.push({
		label: n,
		value: i
	}));
}
function Rr(e) {
	let t = `${String(e?.source || "").toLowerCase()} ${String(e?.name || e?.lora_name || "").toLowerCase()}`;
	return t.includes("high_noise") || t.includes("high noise") ? "high_noise" : t.includes("low_noise") || t.includes("low noise") ? "low_noise" : "";
}
function zr(e) {
	let t = [], n = Array.isArray(e.model_groups) ? e.model_groups : [];
	if (n.length) return n.forEach((e) => {
		if (!e || typeof e != "object") return;
		let n = Ir(e.model), r = Array.isArray(e.loras) ? e.loras.map((e) => gt(e)).filter(Boolean) : [];
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
		label: M("sidebar.generation.highNoise", "High Noise"),
		model: Ir(r.unet_high_noise)
	}, {
		key: "low_noise",
		label: M("sidebar.generation.lowNoise", "Low Noise"),
		model: Ir(r.unet_low_noise)
	}].forEach((e) => {
		let n = i.filter((t) => Rr(t) === e.key).map((e) => gt(e)).filter(Boolean);
		!e.model && !n.length || t.push({
			...e,
			loras: n
		});
	}), t;
}
function Br(e, t) {
	return t == null ? null : {
		label: e,
		value: t ? M("state.on", "on") : M("state.off", "off")
	};
}
function Vr(e) {
	return e != null && String(e).trim() !== "";
}
function Hr(e) {
	return new Set(Array.isArray(e.override_fields) ? e.override_fields.map((e) => String(e || "").trim()).filter(Boolean) : []);
}
function Ur(e, ...t) {
	return t.some((t) => e.has(t));
}
function Wr(e) {
	return Array.isArray(e) ? e.filter((e) => e && typeof e == "object").map((e, t) => ({
		title: String(e.title || M("sidebar.generation.customInfoN", "Custom Info {n}", { n: t + 1 })).trim(),
		content: String(e.content ?? e.value ?? "").trim(),
		color: /^#[0-9a-fA-F]{6}$/.test(String(e.color || "").trim()) ? String(e.color).trim() : "#2196F3"
	})).filter((e) => e.content) : [];
}
function Gr(e) {
	let t = ht(Pr(e)), n = {
		kind: "empty",
		title: M("sidebar.generation.title", "Generation"),
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
		captionLabel: M("sidebar.generation.imageDescription", "Image Description"),
		emptyCaptionText: M("sidebar.generation.noImageDescription", "No image description yet."),
		isImageAsset: Tr(e),
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
	if (!t || typeof t == "object" && Object.keys(t).length === 0 || !Fr(t)) {
		let t = e?.metadata_raw?.geninfo_status || e?.geninfo_status;
		return t && typeof t == "object" && t.kind === "media_pipeline" ? {
			...n,
			kind: "media-only",
			mediaOnlyMessage: M("sidebar.generation.mediaOnlyPipeline", "This file looks like a media-only pipeline (e.g. LoadVideo/VideoCombine) and does not contain generation parameters.")
		} : Tr(e) || Er(e) ? {
			...n,
			kind: "caption-only",
			showAlignment: !1
		} : n;
	}
	let r = t, i = Hr(r), a = r.engine && typeof r.engine == "object" ? r.engine : null, o = !!(r.is_override || a?.mode === "override" || a?.parser_version === "geninfo-override-v1" || a?.source === "majoor_geninfo"), s = yt(r), c = mt(typeof r.prompt == "string" ? r.prompt : null, typeof (r.negative_prompt || r.negativePrompt) == "string" ? r.negative_prompt || r.negativePrompt : null), l = Array.isArray(r.all_positive_prompts) && r.all_positive_prompts.length > 1 ? r.all_positive_prompts.map((e, t) => {
		let n = mt(typeof e == "string" ? e : "", typeof r.all_negative_prompts?.[t] == "string" ? r.all_negative_prompts[t] : "");
		return {
			label: M("sidebar.generation.promptN", "Prompt {n}", { n: t + 1 }),
			positive: _t(n.positive),
			negative: _t(n.negative)
		};
	}).filter((e) => e.positive) : [], u = [], d = /* @__PURE__ */ new Set(), f = r.models && typeof r.models == "object" ? r.models : null, p = zr(r), m = new Set(p.map((e) => String(e.model || "").trim()).filter(Boolean)), h = Array.isArray(r.all_checkpoints) && r.all_checkpoints.length > 1 ? r.all_checkpoints : null;
	if (f) {
		let e = new Set([
			Ir(f.unet_high_noise),
			Ir(f.unet_low_noise),
			...m
		].filter(Boolean));
		if (h) h.forEach((e, t) => {
			let n = Ir(e);
			Lr(u, d, M("sidebar.generation.checkpointN", "Checkpoint {n}", { n: t + 1 }), n);
		});
		else {
			let t = Ir(f.checkpoint);
			t && !e.has(t) && Lr(u, d, M("sidebar.generation.checkpoint", "Checkpoint"), t);
		}
		[
			["UNet", Ir(f.unet)],
			["Diffusion", Ir(f.diffusion)],
			[M("sidebar.generation.upscaler", "Upscaler"), Ir(f.upscaler)],
			["CLIP", Ir(f.clip)],
			["VAE", Ir(f.vae)]
		].forEach(([t, n]) => {
			e.has(n) || Lr(u, d, t, n);
		});
	} else (r.model || r.checkpoint) && Lr(u, d, M("sidebar.generation.model", "Model"), vt(r.model || r.checkpoint));
	if (Array.isArray(r.loras) && r.loras.length > 0) {
		let e = r.loras.map((e) => gt(e)).filter(Boolean).join("\n");
		e && Lr(u, d, r.loras.length > 1 ? M("sidebar.generation.loras", "LoRAs") : "LoRA", e);
	}
	!f && r.clip && Lr(u, d, "CLIP", vt(r.clip)), !f && r.vae && Lr(u, d, "VAE", vt(r.vae)), !f && r.unet && Lr(u, d, "UNet", vt(r.unet)), !f && r.diffusion && Lr(u, d, "Diffusion", vt(r.diffusion)), f && r.clip && Lr(u, d, "CLIP", vt(r.clip)), f && r.vae && Lr(u, d, "VAE", vt(r.vae));
	for (let e of u) {
		let t = String(e.label || "").toLowerCase();
		(t.includes("checkpoint") || t === "model") && (e.override = Ur(i, "checkpoint", "model")), t === "clip" && (e.override = Ur(i, "clip")), t === "vae" && (e.override = Ur(i, "vae")), t.includes("lora") && (e.override = Ur(i, "loras"));
	}
	let g = [];
	Vr(r.seed) && g.push({
		label: M("sidebar.generation.seed", "Seed"),
		value: r.seed,
		override: Ur(i, "seed")
	}), (r.sampler || r.sampler_name) && g.push({
		label: M("sidebar.generation.sampler", "Sampler"),
		value: r.sampler || r.sampler_name,
		override: Ur(i, "sampler", "sampler_name")
	}), Vr(r.steps) && g.push({
		label: M("sidebar.generation.steps", "Steps"),
		value: r.steps,
		override: Ur(i, "steps")
	});
	let _ = Vr(r.cfg) ? r.cfg : r.cfg_scale;
	Vr(_) && g.push({
		label: M("sidebar.generation.cfgScale", "CFG Scale"),
		value: _,
		override: Ur(i, "cfg", "cfg_scale")
	}), r.cfg_high_noise !== void 0 && r.cfg_high_noise !== null && g.push({
		label: M("sidebar.generation.cfgHighNoise", "CFG High Noise"),
		value: r.cfg_high_noise
	}), r.cfg_low_noise !== void 0 && r.cfg_low_noise !== null && g.push({
		label: M("sidebar.generation.cfgLowNoise", "CFG Low Noise"),
		value: r.cfg_low_noise
	}), r.scheduler && g.push({
		label: M("sidebar.generation.scheduler", "Scheduler"),
		value: r.scheduler,
		override: Ur(i, "scheduler")
	});
	let v = Vr(r.denoise) ? r.denoise : r.denoising;
	Vr(v) && g.push({
		label: M("sidebar.generation.denoise", "Denoise"),
		value: v,
		override: Ur(i, "denoise", "denoising")
	});
	let y = [];
	Array.isArray(r.chained_passes) && r.chained_passes.length > 1 ? y = r.chained_passes.filter((e) => e && typeof e == "object").map((e, t) => ({
		label: Nr(e, t),
		fields: [
			{
				label: M("sidebar.generation.model", "Model"),
				value: $(e?.model)
			},
			{
				label: M("sidebar.generation.sampler", "Sampler"),
				value: $(e?.sampler_name || e?.sampler)
			},
			{
				label: M("sidebar.generation.scheduler", "Scheduler"),
				value: $(e?.scheduler)
			},
			{
				label: M("sidebar.generation.steps", "Steps"),
				value: $(e?.steps)
			},
			{
				label: "CFG",
				value: $(e?.cfg)
			},
			{
				label: M("sidebar.generation.denoise", "Denoise"),
				value: $(e?.denoise)
			},
			{
				label: M("sidebar.generation.seed", "Seed"),
				value: $(e?.seed_val || e?.seed)
			}
		]
	})) : Array.isArray(r.all_samplers) && r.all_samplers.length > 1 && (y = r.all_samplers.filter((e) => e && typeof e == "object").map((e, t) => ({
		label: Nr(e, t),
		fields: [
			{
				label: M("sidebar.generation.model", "Model"),
				value: $(e?.model)
			},
			{
				label: M("sidebar.generation.sampler", "Sampler"),
				value: $(e?.sampler_name || e?.sampler)
			},
			{
				label: M("sidebar.generation.scheduler", "Scheduler"),
				value: $(e?.scheduler)
			},
			{
				label: M("sidebar.generation.steps", "Steps"),
				value: $(e?.steps)
			},
			{
				label: "CFG",
				value: $(e?.cfg)
			},
			{
				label: M("sidebar.generation.denoise", "Denoise"),
				value: $(e?.denoise)
			},
			{
				label: M("sidebar.generation.seed", "Seed"),
				value: $(e?.seed_val || e?.seed)
			}
		]
	})));
	let b = [];
	r.voice && b.push({
		label: M("sidebar.generation.narratorVoice", "Narrator Voice"),
		value: r.voice
	}), r.language && b.push({
		label: M("sidebar.generation.language", "Language"),
		value: r.language
	}), r.top_k !== void 0 && r.top_k !== null && b.push({
		label: "Top-k",
		value: r.top_k
	}), r.top_p !== void 0 && r.top_p !== null && b.push({
		label: "Top-p",
		value: r.top_p
	}), r.temperature !== void 0 && r.temperature !== null && b.push({
		label: M("sidebar.generation.temperature", "Temperature"),
		value: r.temperature
	}), r.repetition_penalty !== void 0 && r.repetition_penalty !== null && b.push({
		label: M("sidebar.generation.repetitionPenalty", "Repetition Penalty"),
		value: r.repetition_penalty
	}), r.max_new_tokens !== void 0 && r.max_new_tokens !== null && b.push({
		label: M("sidebar.generation.maxNewTokens", "Max New Tokens"),
		value: r.max_new_tokens
	});
	let x = [];
	r.device && x.push({
		label: M("sidebar.generation.device", "Device"),
		value: r.device
	}), r.voice_preset && x.push({
		label: M("sidebar.generation.voicePreset", "Voice Preset"),
		value: r.voice_preset
	}), r.dtype && x.push({
		label: M("sidebar.generation.dtype", "Dtype"),
		value: r.dtype
	}), r.attn_implementation && x.push({
		label: M("sidebar.generation.attention", "Attention"),
		value: r.attn_implementation
	}), r.compile_mode && x.push({
		label: M("sidebar.generation.compileMode", "Compile Mode"),
		value: r.compile_mode
	}), [
		Br(M("sidebar.generation.torchCompile", "Torch Compile"), r.use_torch_compile),
		Br(M("sidebar.generation.cudaGraphs", "CUDA Graphs"), r.use_cuda_graphs),
		Br(M("sidebar.generation.xVectorOnly", "X-Vector Only"), r.x_vector_only_mode)
	].filter(Boolean).forEach((e) => x.push(e));
	let S = [];
	[
		Br(M("sidebar.generation.chunking", "Chunking"), r.enable_chunking),
		r.max_chars_per_chunk !== void 0 && r.max_chars_per_chunk !== null ? {
			label: M("sidebar.generation.maxCharsChunk", "Max Chars/Chunk"),
			value: r.max_chars_per_chunk
		} : null,
		r.chunk_combination_method ? {
			label: M("sidebar.generation.chunkMethod", "Chunk Method"),
			value: r.chunk_combination_method
		} : null,
		r.silence_between_chunks_ms !== void 0 && r.silence_between_chunks_ms !== null ? {
			label: M("sidebar.generation.silenceBetweenChunks", "Silence Between Chunks (ms)"),
			value: r.silence_between_chunks_ms
		} : null,
		Br(M("sidebar.generation.audioCache", "Audio Cache"), r.enable_audio_cache),
		r.batch_size !== void 0 && r.batch_size !== null ? {
			label: M("sidebar.generation.batchSize", "Batch Size"),
			value: r.batch_size
		} : null
	].filter(Boolean).forEach((e) => S.push(e));
	let C = [];
	r.lyrics_strength !== void 0 && r.lyrics_strength !== null && C.push({
		label: M("sidebar.generation.lyricsStrength", "Lyrics Strength"),
		value: r.lyrics_strength
	});
	let w = [];
	Vr(v) && !g.some((e) => e.label === "Denoise") && w.push({
		label: M("sidebar.generation.denoise", "Denoise"),
		value: v
	}), Vr(r.clip_skip) && w.push({
		label: M("sidebar.generation.clipSkip", "Clip Skip"),
		value: r.clip_skip
	});
	let T = [], E = String(r.workflow_notes || r.notes || "").trim();
	E && T.push({
		label: M("sidebar.generation.workflowNotes", "Workflow Notes"),
		value: E,
		override: Ur(i, "workflow_notes", "notes")
	});
	let D = Wr(r.custom_info), ee = Array.isArray(r.inputs) ? r.inputs.filter((e) => e && typeof e == "object" && e.filename).map((e, t) => ({
		id: `${e.filename}-${t}`,
		filename: String(e.filename || "").trim(),
		filepath: String(e.filepath || e.filename || "").trim(),
		role: String(e.role || "").trim(),
		roleLabel: String(e.role || "").trim().replace(/_/g, " "),
		isVideo: String(e.type || "").toLowerCase() === "video" || /\.(mp4|mov|webm)$/i.test(String(e.filename || "")),
		previewCandidates: jr(e)
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
		positivePromptOverride: Ur(i, "prompt", "positive", "positive_prompt"),
		negativePromptOverride: Ur(i, "negative_prompt", "negative", "negativePrompt"),
		promptTabs: l,
		showAlignment: !!e?.id && (!!String(c.positive || "").trim() || l.length > 0),
		isImageAsset: Tr(e),
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
		inputFiles: ee,
		isOverride: o,
		overrideLabel: o ? "Gen Info Override" : "",
		notesFields: T,
		customInfoBlocks: D
	};
}
//#endregion
//#region ui/vue/components/panel/sidebar/GenerationInputThumb.vue
var Kr = ["title"], qr = ["src"], Jr = ["src"], Yr = {
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
}, Xr = {
	key: 3,
	title: "Video file",
	style: {
		position: "absolute",
		color: "white",
		opacity: "0.7",
		"font-size": "16px",
		"pointer-events": "none"
	}
}, Zr = {
	__name: "GenerationInputThumb",
	props: { inputFile: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = H(0), r = H(!1);
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
			if (Mr(t)) try {
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
		return (t, n) => (N(), V("div", {
			title: `${e.inputFile.filename} (click to copy, double-click to open in new tab)`,
			style: U({
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
		}, [e.inputFile.isVideo ? (N(), V("video", {
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
		}, null, 40, qr)) : (N(), V("img", {
			key: 1,
			src: i(),
			style: {
				width: "100%",
				height: "100%",
				"object-fit": "cover"
			},
			onError: a
		}, null, 40, Jr)), e.inputFile.role && e.inputFile.role !== "secondary" ? (N(), V("div", Yr, B(e.inputFile.roleLabel), 1)) : e.inputFile.isVideo ? (N(), V("div", Xr, " Play ")) : L("", !0)], 44, Kr));
	}
}, Qr = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "12px"
	}
}, $r = {
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
}, ei = { style: { opacity: "0.85" } }, ti = { style: {
	display: "flex",
	"align-items": "center",
	gap: "8px",
	"flex-wrap": "wrap",
	"justify-content": "flex-end"
} }, ni = ["title"], ri = ["title"], ii = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, ai = { style: {
	"font-size": "11px",
	"font-weight": "700",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.6px"
} }, oi = { style: {
	"font-size": "11px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"font-weight": "600"
} }, si = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#FF9800",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, ci = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, li = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9E9E9E",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, ui = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, di = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, fi = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"margin-bottom": "10px"
} }, pi = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "#4CAF50",
	"letter-spacing": "0.4px"
} }, mi = ["onClick"], hi = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "#F44336",
	"letter-spacing": "0.4px",
	"margin-top": "4px"
} }, gi = ["onClick"], _i = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, vi = ["title"], yi = ["title"], bi = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#F44336",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, xi = ["title"], Si = ["title"], Ci = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between"
} }, wi = ["title"], Ti = { style: {
	display: "flex",
	"align-items": "center",
	gap: "10px"
} }, Ei = { style: {
	flex: "1",
	height: "8px",
	background: "rgba(255,255,255,0.1)",
	"border-radius": "4px",
	overflow: "hidden"
} }, Di = {
	key: 0,
	style: {
		"font-size": "10px",
		color: "rgba(255,255,255,0.65)",
		border: "1px dashed rgba(255,255,255,0.25)",
		"border-radius": "4px",
		padding: "6px 8px",
		background: "rgba(255,255,255,0.04)"
	}
}, Oi = { style: {
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
} }, ki = ["title"], Ai = { style: {
	display: "flex",
	"align-items": "center",
	gap: "6px"
} }, ji = ["title"], Mi = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#00BCD4",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, Ni = { style: {
	"font-size": "12px",
	color: "var(--fg-color, rgba(255,255,255,0.9))",
	"line-height": "1.5",
	"white-space": "pre-wrap",
	"word-break": "break-word"
} }, Pi = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#FF9800",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Fi = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"margin-bottom": "10px"
} }, Ii = { style: {
	"font-size": "10px",
	"font-weight": "600",
	color: "rgba(255,255,255,0.6)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Li = ["onClick"], Ri = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#9C27B0",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, zi = { style: {
	display: "grid",
	"grid-template-columns": "repeat(auto-fit, minmax(220px, 1fr))",
	gap: "10px"
} }, Bi = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px"
} }, Vi = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "4px"
} }, Hi = ["onClick"], Ui = {
	key: 0,
	style: {
		display: "flex",
		"flex-direction": "column",
		gap: "6px"
	}
}, Wi = { style: {
	"font-size": "10px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.58)",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Gi = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "5px"
} }, Ki = ["onClick"], qi = { style: {
	display: "grid",
	"grid-template-columns": "auto 1fr",
	gap: "8px 12px",
	"align-items": "start"
} }, Ji = ["title"], Yi = ["title"], Xi = ["title", "onClick"], Zi = { style: {
	"font-size": "11px",
	"font-weight": "600",
	color: "#4CAF50",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "10px"
} }, Qi = ["title", "onClick"], $i = ["title", "onClick"], ea = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	"font-size": "11px",
	"font-weight": "600",
	color: "#26A69A",
	"text-transform": "uppercase",
	"letter-spacing": "0.5px",
	"margin-bottom": "8px"
} }, ta = ["title"], na = { style: {
	"font-size": "11px",
	"font-weight": "700",
	color: "#E91E63",
	"text-transform": "uppercase",
	"letter-spacing": "1px"
} }, ra = ["title"], ia = ["title"], aa = { style: {
	display: "flex",
	gap: "8px",
	"flex-wrap": "wrap"
} }, oa = {
	__name: "SidebarGenerationSection",
	props: { asset: {
		type: Object,
		required: !0
	} },
	setup(e) {
		let t = e, n = H(0), r = H(0), i = H(""), a = H(M("action.copy", "Copy")), o = H(M("action.generate", "Generate")), s = H(!1), c = H(u()), l = 0;
		function u() {
			return {
				scoreText: "...",
				scoreColor: "#888",
				qualityText: M("status.loading", "Loading"),
				qualityColor: "#888",
				qualityBackground: "rgba(127,127,127,0.3)",
				fillWidth: "0%",
				fillColor: "#666",
				aiStatusVisible: !1,
				aiStatusText: M("sidebar.generation.aiDisabledEnv", "AI features are disabled (enable vector search env var).")
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
		let _ = R(() => Gr(t.asset)), v = R(() => Dr()), y = R(() => _.value.kind === "full" || _.value.kind === "caption-only"), b = R(() => Ar(i.value) || _.value.emptyCaptionText), x = R(() => v.value && _.value.isImageAsset && !!t.asset?.id), S = R(() => v.value && !!Ar(b.value) && b.value !== _.value.emptyCaptionText), C = R(() => {
			let e = [];
			return _.value.modelFields.length && e.push({
				key: "model",
				title: M("sidebar.generation.modelLora", "Model & LoRA"),
				accent: "#9C27B0",
				emphasis: !0,
				fields: _.value.modelFields
			}), !_.value.pipelineTabs.length && _.value.samplingFields.length && e.push({
				key: "sampling",
				title: M("sidebar.generation.sampling", "Sampling"),
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
				title: M("sidebar.generation.audio", "Audio"),
				accent: "#00BCD4",
				emphasis: !1,
				fields: _.value.audioFields
			}), _.value.imageFields.length && e.push({
				key: "image",
				title: M("sidebar.generation.image", "Image"),
				accent: "#2196F3",
				emphasis: !1,
				fields: _.value.imageFields
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
		function E(e) {
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
		function ee() {
			c.value = {
				scoreText: "AI OFF",
				scoreColor: "#9E9E9E",
				qualityText: M("status.disabled", "Disabled"),
				qualityColor: "#BDBDBD",
				qualityBackground: "rgba(158,158,158,0.25)",
				fillWidth: "0%",
				fillColor: "#777",
				aiStatusVisible: !0,
				aiStatusText: M("sidebar.generation.aiDisabledSettings", "AI features are disabled in settings.")
			};
		}
		function te() {
			c.value = u();
		}
		async function ne() {
			l += 1;
			let e = l;
			if (!_.value.showAlignment || !t.asset?.id) {
				te();
				return;
			}
			if (!v.value) {
				ee();
				return;
			}
			te();
			try {
				let n = await g(t.asset.id);
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
						qualityText: M("status.na", "N/A"),
						qualityColor: "#888",
						qualityBackground: "rgba(127,127,127,0.3)",
						fillWidth: "0%",
						fillColor: "#666",
						aiStatusVisible: !1,
						aiStatusText: ""
					};
					return;
				}
				let i = Math.round(r * 100), a = Or(r);
				c.value = {
					scoreText: `${i}%`,
					scoreColor: a,
					qualityText: kr(r),
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
					qualityText: M("status.unavailable", "Unavailable"),
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
			if (!(!x.value || s.value)) {
				s.value = !0, o.value = M("status.generating", "Generating...");
				try {
					let e = await p(t.asset.id);
					e?.ok && (i.value = String(e?.data || "").trim());
				} catch (e) {
					console.debug?.(e);
				} finally {
					s.value = !1, o.value = M("action.generate", "Generate");
				}
			}
		}
		async function O() {
			if (S.value) try {
				await navigator.clipboard.writeText(b.value), a.value = M("viewer.copySuccessShort", "Copied!"), setTimeout(() => {
					a.value = M("action.copy", "Copy");
				}, 900);
			} catch (e) {
				console.debug?.(e);
			}
		}
		return Re(() => t.asset, () => {
			n.value = 0, r.value = 0, i.value = String(t.asset?.enhanced_caption || "").trim(), a.value = M("action.copy", "Copy"), o.value = M("action.generate", "Generate");
		}, { immediate: !0 }), Re(() => [
			t.asset?.id,
			_.value.kind,
			_.value.showAlignment,
			v.value
		], () => {
			ne();
		}, { immediate: !0 }), (e, t) => {
			let i = Ue("MButton");
			return _.value.kind === "empty" ? L("", !0) : (N(), V("div", Qr, [
				_.value.workflowType ? (N(), V("div", $r, [F("span", ei, B(z(M)("viewer.workflow", "Workflow")), 1), F("div", ti, [F("span", {
					title: z(M)("sidebar.generation.workflowEngine", "Workflow engine: {value}", { value: _.value.workflowType }),
					style: {
						background: "#2196F3",
						color: "white",
						padding: "2px 8px",
						"border-radius": "999px",
						"font-weight": "bold",
						"font-size": "10px",
						"letter-spacing": "0.2px"
					}
				}, B(_.value.workflowLabel || _.value.workflowType), 9, ni), _.value.workflowBadge ? (N(), V("span", {
					key: 0,
					title: z(M)("sidebar.generation.apiProvider", "API provider: {value}", { value: _.value.workflowBadge }),
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
				}, B(_.value.workflowBadge), 9, ri)) : L("", !0)])])) : L("", !0),
				_.value.isOverride ? (N(), V("div", {
					key: 1,
					style: U(f("#00BCD4", {
						emphasis: !0,
						startAlpha: .14,
						endAlpha: .08
					}))
				}, [F("div", ii, [F("span", ai, B(z(M)("sidebar.generation.override", "Override")), 1), F("span", oi, B(_.value.overrideLabel), 1)])], 4)) : L("", !0),
				_.value.isTruncated ? (N(), V("div", {
					key: 2,
					style: U(f("#FF9800", {
						emphasis: !0,
						startAlpha: .12,
						endAlpha: .08
					}))
				}, [F("div", si, B(z(M)("sidebar.generation.metadataTruncated", "Metadata Truncated")), 1), F("div", ci, B(z(M)("sidebar.generation.metadataTruncatedBody", "Generation data is incomplete because it exceeded the size limit.")), 1)], 4)) : L("", !0),
				_.value.kind === "media-only" ? (N(), V("div", {
					key: 3,
					style: U(f("#9E9E9E", {
						emphasis: !0,
						startAlpha: .1,
						endAlpha: .06
					}))
				}, [F("div", li, B(z(M)("sidebar.generation.generationData", "Generation Data")), 1), F("div", ui, B(_.value.mediaOnlyMessage), 1)], 4)) : L("", !0),
				_.value.kind === "full" ? (N(), V(P, { key: 4 }, [_.value.promptTabs.length ? (N(), V("div", {
					key: 0,
					style: U(f("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [
					F("div", di, B(z(M)("sidebar.generation.promptPipeline", "Prompt Pipeline ({count} variants)", { count: _.value.promptTabs.length })), 1),
					F("div", fi, [(N(!0), V(P, null, I(_.value.promptTabs, (e, t) => (N(), Le(i, {
						key: e.label,
						type: "button",
						severity: "secondary",
						text: "",
						rounded: "",
						style: U({
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
						default: ot(() => [Ie(B(e.label), 1)]),
						_: 2
					}, 1032, ["style", "onClick"]))), 128))]),
					(N(!0), V(P, null, I(_.value.promptTabs, (e, t) => ze((N(), V("div", {
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
						F("div", pi, B(z(M)("sidebar.generation.positive", "POSITIVE")), 1),
						F("div", {
							style: {
								"font-size": "12px",
								color: "var(--fg-color, #ddd)",
								"white-space": "pre-wrap",
								"line-height": "1.35",
								cursor: "pointer"
							},
							onClick: (t) => D(e.positive, t.currentTarget)
						}, B(e.positive), 9, mi),
						e.negative ? (N(), V(P, { key: 0 }, [F("div", hi, B(z(M)("sidebar.generation.negative", "NEGATIVE")), 1), F("div", {
							style: {
								"font-size": "12px",
								color: "var(--fg-color, #ddd)",
								"white-space": "pre-wrap",
								"line-height": "1.35",
								cursor: "pointer"
							},
							onClick: (t) => D(e.negative, t.currentTarget)
						}, B(e.negative), 9, gi)], 64)) : L("", !0)
					])), [[Ke, n.value === t]])), 128))
				], 4)) : _.value.positivePrompt ? (N(), V("div", {
					key: 1,
					style: U(f("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [F("div", _i, [F("span", null, B(z(M)("sidebar.generation.positivePrompt", "Positive Prompt")), 1), _.value.positivePromptOverride ? (N(), V("span", {
					key: 0,
					style: U(h()),
					title: z(M)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
				}, B(z(M)("sidebar.generation.override", "override")), 13, vi)) : L("", !0)]), F("div", {
					title: z(M)("action.clickToCopy", "Click to copy"),
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: t[0] ||= (e) => D(_.value.positivePrompt, e.currentTarget)
				}, B(_.value.positivePrompt), 9, yi)], 4)) : L("", !0), !_.value.promptTabs.length && _.value.negativePrompt ? (N(), V("div", {
					key: 2,
					style: U(f("#F44336", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [F("div", bi, [F("span", null, B(z(M)("sidebar.generation.negativePrompt", "Negative Prompt")), 1), _.value.negativePromptOverride ? (N(), V("span", {
					key: 0,
					style: U(h()),
					title: z(M)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
				}, B(z(M)("sidebar.generation.override", "override")), 13, xi)) : L("", !0)]), F("div", {
					title: z(M)("action.clickToCopy", "Click to copy"),
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: t[1] ||= (e) => D(_.value.negativePrompt, e.currentTarget)
				}, B(_.value.negativePrompt), 9, Si)], 4)) : L("", !0)], 64)) : L("", !0),
				y.value ? (N(), V("div", {
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
					class: tt({ "mjr-ai-disabled-block": !v.value })
				}, [
					_.value.showAlignment ? (N(), V(P, { key: 0 }, [
						F("div", Ci, [F("span", { title: z(M)("sidebar.generation.promptAlignmentTooltip", "How closely the generated image matches the prompt (SigLIP2 score)") }, B(z(M)("sidebar.generation.promptAlignment", "Prompt Alignment")), 9, wi)]),
						F("div", Ti, [
							F("div", Ei, [F("div", { style: U({
								height: "100%",
								width: c.value.fillWidth,
								background: c.value.fillColor,
								borderRadius: "4px",
								transition: "width 0.6s ease, background 0.4s ease"
							}) }, null, 4)]),
							F("span", { style: U({
								fontSize: "13px",
								fontWeight: "700",
								color: c.value.scoreColor,
								minWidth: "60px",
								textAlign: "right",
								fontFamily: "'Consolas', 'Monaco', monospace"
							}) }, B(c.value.scoreText), 5),
							F("span", { style: U({
								fontSize: "9px",
								fontWeight: "700",
								padding: "2px 6px",
								borderRadius: "3px",
								background: c.value.qualityBackground,
								color: c.value.qualityColor,
								textTransform: "uppercase",
								letterSpacing: "0.5px"
							}) }, B(c.value.qualityText), 5)
						]),
						c.value.aiStatusVisible ? (N(), V("div", Di, B(c.value.aiStatusText), 1)) : L("", !0)
					], 64)) : L("", !0),
					F("div", Oi, [F("span", { title: z(M)("sidebar.generation.aiCaptionTooltip", "AI caption generated by Florence-2") }, B(_.value.captionLabel), 9, ki), F("div", Ai, [$e(i, {
						type: "button",
						class: "mjr-ai-control",
						severity: "secondary",
						text: "",
						disabled: !x.value || s.value,
						style: U([{
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
						onClick: He(re, ["stop"])
					}, {
						default: ot(() => [Ie(B(o.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"]), $e(i, {
						type: "button",
						class: "mjr-ai-control",
						severity: "secondary",
						text: "",
						disabled: !S.value,
						style: U([{
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
						onClick: He(O, ["stop"])
					}, {
						default: ot(() => [Ie(B(a.value), 1)]),
						_: 1
					}, 8, ["disabled", "style"])])]),
					F("div", {
						title: v.value ? z(M)("sidebar.generation.copyCaptionTooltip", "Click to copy caption") : z(M)("sidebar.generation.aiCaptionDisabled", "AI caption controls are disabled"),
						style: U({
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
						onClick: O
					}, B(b.value), 13, ji)
				], 2)) : L("", !0),
				_.value.lyrics ? (N(), V("div", {
					key: 6,
					style: U(f("#00BCD4", { emphasis: !1 }))
				}, [F("div", Mi, [F("span", null, B(z(M)("sidebar.generation.lyrics", "Lyrics")), 1)]), F("div", Ni, B(_.value.lyrics), 1)], 4)) : L("", !0),
				_.value.pipelineTabs.length ? (N(), V("div", {
					key: 7,
					style: U(f("#FF9800", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [
					F("div", Pi, B(z(M)("sidebar.generation.pipeline", "Generation Pipeline")), 1),
					F("div", Fi, [(N(!0), V(P, null, I(_.value.pipelineTabs, (e, t) => (N(), Le(i, {
						key: e.label,
						type: "button",
						severity: "secondary",
						text: "",
						rounded: "",
						style: U({
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
						default: ot(() => [Ie(B(e.label), 1)]),
						_: 2
					}, 1032, ["style", "onClick"]))), 128))]),
					(N(!0), V(P, null, I(_.value.pipelineTabs, (e, t) => ze((N(), V("div", {
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
					}, [(N(!0), V(P, null, I(e.fields, (t) => (N(), V("div", {
						key: `${e.label}-${t.label}`,
						style: {
							display: "flex",
							"flex-direction": "column",
							gap: "2px",
							"min-width": "0"
						}
					}, [F("span", Ii, B(t.label), 1), F("span", {
						style: {
							"font-size": "12px",
							color: "var(--fg-color, #ddd)",
							"word-break": "break-word",
							padding: "1px 3px",
							"border-radius": "3px",
							transition: "background 0.2s ease",
							cursor: "copy"
						},
						onClick: (e) => D(t.value, e.currentTarget)
					}, B(t.value), 9, Li)]))), 128))])), [[Ke, r.value === t]])), 128))
				], 4)) : L("", !0),
				_.value.modelGroups.length ? (N(), V("div", {
					key: 8,
					style: U(f("#9C27B0", {
						emphasis: !0,
						startAlpha: .18,
						endAlpha: .1
					}))
				}, [F("div", Ri, B(z(M)("sidebar.generation.modelBranches", "Model Branches")), 1), F("div", zi, [(N(!0), V(P, null, I(_.value.modelGroups, (e) => (N(), V("div", {
					key: `model-group-${e.key}`,
					style: U(T(E(e.key), !0))
				}, [
					F("div", Bi, [F("div", { style: U({
						fontSize: "10px",
						fontWeight: "800",
						color: E(e.key),
						letterSpacing: "0.6px",
						textTransform: "uppercase"
					}) }, B(e.label), 5), F("span", { style: U({
						fontSize: "9px",
						fontWeight: "700",
						color: "#fff",
						background: d(E(e.key), .22),
						border: `1px solid ${d(E(e.key), .48)}`,
						borderRadius: "999px",
						padding: "2px 8px",
						letterSpacing: "0.4px",
						textTransform: "uppercase"
					}) }, B(e.loras?.length || 0) + " LoRA ", 5)]),
					F("div", Vi, [t[4] ||= F("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.58)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, " UNet ", -1), F("div", {
						style: {
							"font-size": "12px",
							color: "var(--fg-color, rgba(255,255,255,0.96))",
							"line-height": "1.45",
							"word-break": "break-word",
							cursor: "pointer"
						},
						onClick: (t) => D(e.model, t.currentTarget)
					}, B(e.model || "-"), 9, Hi)]),
					e.loras?.length ? (N(), V("div", Ui, [F("div", Wi, B(z(M)("sidebar.generation.loraStack", "LoRA Stack")), 1), F("div", Gi, [(N(!0), V(P, null, I(e.loras, (t, n) => (N(), V("div", {
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
					}, B(t), 9, Ki))), 128))])])) : L("", !0)
				], 4))), 128))])], 4)) : L("", !0),
				(N(!0), V(P, null, I(C.value, (e) => (N(), V("div", {
					key: e.key,
					style: U(f(e.accent, { emphasis: e.emphasis }))
				}, [F("div", { style: U({
					fontSize: "11px",
					fontWeight: "600",
					color: e.accent,
					textTransform: "uppercase",
					letterSpacing: "0.5px",
					marginBottom: "10px"
				}) }, B(e.title), 5), F("div", qi, [(N(!0), V(P, null, I(e.fields, (t) => (N(), V(P, { key: `${e.key}-${t.label}` }, [F("div", {
					title: t.label,
					style: {
						"font-size": "11px",
						color: "var(--mjr-muted, rgba(127,127,127,0.9))",
						"font-weight": "500",
						display: "flex",
						"align-items": "center",
						gap: "6px"
					}
				}, [F("span", null, B(t.label) + ":", 1), t.override ? (N(), V("span", {
					key: 0,
					style: U(h()),
					title: z(M)("sidebar.generation.overrideTooltip", "This field was forced by Majoor Gen Info Override")
				}, B(z(M)("sidebar.generation.override", "override")), 13, Yi)) : L("", !0)], 8, Ji), F("div", {
					title: `${t.label}: ${t.value}`,
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.95))",
						"word-break": "break-word",
						"white-space": "pre-wrap",
						cursor: "pointer"
					},
					onClick: (e) => D(t.value, e.currentTarget)
				}, B(t.value), 9, Xi)], 64))), 128))])], 4))), 128)),
				_.value.notesFields.length ? (N(), V("div", {
					key: 9,
					style: U(f("#4CAF50", { emphasis: !1 }))
				}, [F("div", Zi, B(z(M)("sidebar.generation.notes", "Notes")), 1), (N(!0), V(P, null, I(_.value.notesFields, (e) => (N(), V("div", {
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
				}, B(e.value), 9, Qi))), 128))], 4)) : L("", !0),
				(N(!0), V(P, null, I(_.value.customInfoBlocks, (e) => (N(), V("div", {
					key: `${e.title}-${e.content}`,
					style: U(f(e.color, { emphasis: !1 }))
				}, [F("div", { style: U({
					fontSize: "11px",
					fontWeight: "600",
					color: e.color,
					textTransform: "uppercase",
					letterSpacing: "0.5px",
					marginBottom: "8px"
				}) }, B(e.title), 5), F("div", {
					title: `${e.title}: ${e.content}`,
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: (t) => D(e.content, t.currentTarget)
				}, B(e.content), 9, $i)], 4))), 128)),
				_.value.ttsInstruction ? (N(), V("div", {
					key: 10,
					style: U(f("#26A69A", { emphasis: !1 }))
				}, [F("div", ea, [F("span", null, B(z(M)("sidebar.generation.ttsInstruction", "TTS Instruction")), 1)]), F("div", {
					title: z(M)("action.clickToCopy", "Click to copy"),
					style: {
						"font-size": "12px",
						color: "var(--fg-color, rgba(255,255,255,0.9))",
						"line-height": "1.5",
						"white-space": "pre-wrap",
						"word-break": "break-word",
						cursor: "pointer"
					},
					onClick: t[2] ||= (e) => D(_.value.ttsInstruction, e.currentTarget)
				}, B(_.value.ttsInstruction), 9, ta)], 4)) : L("", !0),
				_.value.seed !== null && _.value.seed !== void 0 && _.value.seed !== "" ? (N(), V("div", {
					key: 11,
					style: U(m())
				}, [F("div", na, B(z(M)("sidebar.generation.seed", "SEED")), 1), F("div", {
					title: z(M)("sidebar.generation.copySeedTooltip", "Click to copy seed: {seed}", { seed: _.value.seed }),
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
					onClick: t[3] ||= (e) => D(_.value.seed, e.currentTarget, "rgba(76, 175, 80, 0.4)")
				}, B(_.value.seed), 9, ra)], 4)) : L("", !0),
				_.value.inputFiles.length ? (N(), V("div", {
					key: 12,
					style: U(f("#4CAF50", {
						emphasis: !0,
						startAlpha: .16,
						endAlpha: .1
					}))
				}, [F("div", {
					title: z(M)("tooltip.generationInputs", "Input files used in generation"),
					style: {
						"font-size": "11px",
						"font-weight": "600",
						color: "#4CAF50",
						"text-transform": "uppercase",
						"letter-spacing": "0.5px",
						"margin-bottom": "8px"
					}
				}, B(z(M)("sidebar.generation.sourceFiles", "Source Files")), 9, ia), F("div", aa, [(N(!0), V(P, null, I(_.value.inputFiles, (e) => (N(), Le(Zr, {
					key: e.id,
					"input-file": e
				}, null, 8, ["input-file"]))), 128))])], 4)) : L("", !0)
			]));
		};
	}
}, sa = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, ca = /^[0-9a-f]{20,}$/i;
function la(...e) {
	for (let t of e) {
		let e = String(t || "").trim();
		if (e) return e;
	}
	return "";
}
function ua(e) {
	let t = String(e || "").trim();
	return !!t && (sa.test(t) || ca.test(t));
}
function da(e) {
	return String(e?.type || e?.class_type || e?.comfyClass || e?.classType || "").trim();
}
function fa(e) {
	return la(e?.properties?.subgraph_name, e?.title, e?.properties?.title, e?.properties?.name, e?.properties?.label, e?.name, e?.subgraph?.name, e?.subgraph_instance?.name);
}
function pa(e) {
	let t = da(e), n = fa(e);
	return n && (!t || ua(t) || n !== t) ? n : t && !ua(t) ? t : n || (t ? "Subgraph" : String(e?.id || "Node").trim() || "Node");
}
function ma(e) {
	let t = da(e);
	return t && !ua(t) ? t : t ? "Subgraph" : "Node";
}
//#endregion
//#region ui/components/sidebar/utils/minimap.ts
var ha = 6, ga = 1, _a = 8, va = 74, ya = 42, ba = [
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
], xa = (e, t, n) => {
	let r = Number(e);
	return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
}, Sa = (e, t = !1) => {
	let n = String(e || "").toUpperCase();
	return n.includes("IMAGE") ? "rgba(145,198,99,0.9)" : n.includes("LATENT") ? "rgba(89,178,118,0.9)" : n.includes("MODEL") ? "rgba(112,155,255,0.9)" : n.includes("CONDITIONING") ? "rgba(191,123,226,0.9)" : n.includes("CLIP") ? "rgba(220,178,77,0.9)" : n.includes("VAE") ? "rgba(72,184,214,0.9)" : n.includes("MASK") ? "rgba(190,190,190,0.88)" : n.includes("STRING") || n.includes("TEXT") ? "rgba(230,230,230,0.86)" : n.includes("INT") || n.includes("FLOAT") || n.includes("NUMBER") ? "rgba(130,210,220,0.88)" : t ? "rgba(170,220,255,0.82)" : "rgba(255,255,255,0.72)";
}, Ca = (e, t, n) => {
	let r = String(t || "").replace(/\s+/g, " ").trim(), i = Math.max(1, Number(n) || 1);
	if (!r || e.measureText(r).width <= i) return r;
	let a = r;
	for (; a.length > 3 && e.measureText(`${a}...`).width > i;) a = a.slice(0, -1);
	return a.length > 3 ? `${a}...` : r.slice(0, 3);
};
function wa(e, t, n = null) {
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
	}, a = i.expandSubgraphs === !1 ? t : Ta(t), o = Array.isArray(a?.nodes) ? a.nodes : [], s = Array.isArray(a?.groups) && a.groups || Array.isArray(a?.extra?.groups) && a.extra.groups || Array.isArray(a?.extra?.groupNodes) && a.extra.groupNodes || Array.isArray(a?.extra?.group_nodes) && a.extra.group_nodes || [], c = Array.isArray(a?.links) && a.links || Array.isArray(a?.extra?.links) && a.extra.links || [], l = Math.max(1, e.clientWidth || e.width || 1), u = Math.max(1, e.clientHeight || e.height || 1);
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
		for (let [e, t] of ba) if (n.includes(e)) return t;
		let r = 0;
		for (let e = 0; e < n.length; e += 1) r = r * 31 + n.charCodeAt(e) | 0;
		return `hsl(${Math.abs(r) % 360} 42% 42%)`;
	}, p = (e) => {
		let t = [], n = e?.inputs && typeof e.inputs == "object" && !Array.isArray(e.inputs) ? e.inputs : null;
		if (n) {
			for (let [e, r] of Object.entries(n)) if (!(Array.isArray(r) || r && typeof r == "object") && (t.push([e, r]), t.length >= 3)) return t;
		}
		let r = Array.isArray(e?.widgets_values) ? e.widgets_values : [], i = Array.isArray(e?.widgets) ? e.widgets : [], a = Array.isArray(e?.inputs) ? e.inputs : [], o = a.filter((e) => e?.widget === !0 || e?.widget && typeof e.widget == "object" || typeof e?.widget == "string" && e.widget.trim()), s = a.filter((e) => e?.link == null && Na(e?.type)), c = (o.length ? o : s.length ? s : a).map((e) => String(e?.label || e?.localized_name || e?.name || e?.widget?.name || e?.widget?.label || "").trim());
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
			label: pa(e).replace(/\s+/g, " ").trim()
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
	let S = Math.max(1, b - v), C = Math.max(1, x - y), w = v + S / 2, T = y + C / 2, E = i.view && typeof i.view == "object" ? i.view : Object.create(null), D = xa(E.zoom ?? 1, ga, _a), ee = Math.max(1, S / D), te = Math.max(1, C / D), ne = ee / 2, re = te / 2, O = ee >= S ? w : xa(E.centerX ?? w, v + ne, b - ne), ie = te >= C ? T : xa(E.centerY ?? T, y + re, x - re), ae = O - ne, oe = ie - re, k = ha, se = Math.min((l - k * 2) / ee, (u - k * 2) / te), ce = E.hoveredNodeId !== null && E.hoveredNodeId !== void 0 ? String(E.hoveredNodeId) : null;
	r.clearRect(0, 0, l, u), r.fillStyle = "rgba(0,0,0,0.22)", r.fillRect(0, 0, l, u);
	let le = (e, t) => ({
		x: k + (e - ae) * se,
		y: k + (t - oe) * se
	}), ue = (e, t) => ({
		x: xa(ae + (Number(e) - k) / se, v, b),
		y: xa(oe + (Number(t) - k) / se, y, x)
	}), de = (e) => ({
		x: k + (e.x - ae) * se,
		y: k + (e.y - oe) * se,
		w: Math.max(1, e.w * se),
		h: Math.max(1, e.h * se)
	}), fe = (e) => Math.max(10, Math.min(24, Math.floor(Number(e) * .2))), pe = (e, t, n) => {
		let r = de(e), i = fe(r.h), a = n === "output" ? e.outputs : e.inputs, o = Math.max(1, Array.isArray(a) ? a.length : Number(e[`${n}Count`]) || 0), s = xa(t, 0, Math.max(0, o - 1));
		return r.y + i + (r.h - i) * (s + 1) / (o + 1);
	}, me = (e) => Array.isArray(e) && e.length >= 5 ? {
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
	} : null, he = (e) => {
		let t = String(e || "").toUpperCase();
		return t.includes("IMAGE") ? "rgba(145,198,99,0.38)" : t.includes("LATENT") ? "rgba(89,178,118,0.38)" : t.includes("MODEL") ? "rgba(112,155,255,0.38)" : t.includes("CONDITIONING") ? "rgba(191,123,226,0.38)" : t.includes("CLIP") ? "rgba(220,178,77,0.38)" : t.includes("VAE") ? "rgba(72,184,214,0.38)" : t.includes("MASK") ? "rgba(190,190,190,0.36)" : "rgba(255,255,255,0.2)";
	}, ge = () => {
		if (i.showLinks && !(!c || c.length === 0)) {
			r.save(), r.globalAlpha = 1, r.lineWidth = 1;
			for (let e of c) {
				let t = me(e), n = t?.originId, i = t?.targetId;
				if (n === null || i === null) continue;
				let a = h.get(String(n)), o = h.get(String(i));
				if (!a || !o) continue;
				let s = de(a), c = de(o), l = {
					x: s.x + s.w,
					y: pe(a, t?.originSlot ?? 0, "output")
				}, u = {
					x: c.x,
					y: pe(o, t?.targetSlot ?? 0, "input")
				}, d = Math.max(12, Math.min(80, Math.abs(u.x - l.x) * .35));
				r.strokeStyle = he(t?.type), r.beginPath(), r.moveTo(l.x, l.y), r.bezierCurveTo(l.x + d, l.y, u.x - d, u.y, u.x, u.y), r.stroke();
			}
			r.restore();
		}
	}, _e = (e) => {
		let { x: t, y: n, w: a, h: o } = de(e), s = e.kind === "node", c = e.kind === "group", l = !!e.bypassed, u = !!e.errored, f = c ? .18 : l && i.renderBypassState ? .14 : .62, p = c ? .55 : l && i.renderBypassState ? .32 : .8, m = d(e.fill, f), h = d(e.stroke, p), g = s && i.showNodeLabels && a >= va && o >= ya, _ = Math.max(2, Math.min(g ? 7 : 8, Math.floor(Math.min(a, o) * .08))), v = s ? fe(o) : 0;
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
				let n = pe(e, i, "input");
				r.fillStyle = Sa(e.inputs?.[i]?.type, !1), r.beginPath(), r.arc(t, n, g ? 3 : 2.2, 0, Math.PI * 2), r.fill(), r.stroke();
			}
			for (let n = 0; n < i; n += 1) {
				let i = pe(e, n, "output");
				r.fillStyle = Sa(e.outputs?.[n]?.type, !0), r.beginPath(), r.arc(t + a, i, g ? 3 : 2.2, 0, Math.PI * 2), r.fill(), r.stroke();
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
		if (s && ce && String(e.id || "") === ce) {
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
				s && r.fillText(Ca(r, s, i), t + 7, pe(e, a, "input") + n * .35, i);
			}
			for (let o = 0; o < Math.min(8, e.outputs?.length || 0); o += 1) {
				let s = e.outputs[o], c = String(s?.label || s?.localized_name || s?.name || "").trim();
				if (!c) continue;
				let l = Ca(r, c, i);
				r.fillText(l, t + a - 7 - Math.min(i, r.measureText(l).width), pe(e, o, "output") + n * .35, i);
			}
			r.restore();
		}
	};
	for (let e of m.filter((e) => e.kind === "group")) _e(e);
	ge();
	for (let e of m.filter((e) => e.kind === "node")) _e(e);
	if (i.showViewport) try {
		let e = De();
		if (e) {
			let t = le(e.x0, e.y0), n = le(e.x1, e.y1), i = Math.min(t.x, n.x), a = Math.min(t.y, n.y), o = Math.abs(n.x - t.x), s = Math.abs(n.y - t.y);
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
			zoom: D,
			centerX: O,
			centerY: ie,
			visibleW: ee,
			visibleH: te,
			viewMinX: ae,
			viewMinY: oe,
			pad: k,
			renderScale: se
		},
		canvasToWorld: ue,
		worldToCanvas: le,
		hitTestNode: (e, t) => {
			let n = ue(e, t);
			for (let e = m.length - 1; e >= 0; --e) {
				let t = m[e];
				if (t.kind === "node" && n.x >= t.x && n.x <= t.x + t.w && n.y >= t.y && n.y <= t.y + t.h) return t;
			}
			return null;
		}
	};
}
function Ta(e) {
	if (!e || typeof e != "object") return e;
	let t = Array.isArray(e.nodes) ? e.nodes.filter(Boolean) : [], n = Ea(e);
	if (!t.length) return e;
	let r = [], i = Array.isArray(e.links) ? [...e.links] : [], a = [...Array.isArray(e.groups) ? e.groups : [], ...Array.isArray(e.extra?.groups) ? e.extra.groups : []];
	for (let e of t) {
		r.push(e);
		let t = Da(e, n);
		if (!t || !Array.isArray(t.nodes) || !t.nodes.length) continue;
		let o = ka(e, Ta(t));
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
function Ea(e) {
	let t = [
		...Array.isArray(e?.definitions?.subgraphs) ? e.definitions.subgraphs : [],
		...Array.isArray(e?.subgraphs) ? e.subgraphs : [],
		...Array.isArray(e?.rootGraph?.subgraphs) ? e.rootGraph.subgraphs : []
	], n = /* @__PURE__ */ new Map();
	for (let e of t) for (let t of Oa(e)) t != null && n.set(String(t), e);
	return n;
}
function Da(e, t) {
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
function Oa(e) {
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
function ka(e, t) {
	let n = String(e?.id ?? e?.ID ?? ""), r = ja(e?.pos) || [0, 0], i = Ma(e?.size) || [260, 180], a = t.nodes.filter(Boolean), o = Aa(a), s = Math.min(22, Math.max(8, i[0] * .08)), c = Math.min(34, Math.max(18, i[1] * .18)), l = Math.min(18, Math.max(8, i[1] * .08)), u = Math.max(40, i[0] - s * 2), d = Math.max(34, i[1] - c - l), f = Math.min(1, u / o.width, d / o.height), p = r[0] + s + (u - o.width * f) / 2, m = r[1] + c + (d - o.height * f) / 2, h = a.map((r) => {
		let i = ja(r?.pos) || [o.minX, o.minY], a = Ma(r?.size) || [140, 60];
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
function Aa(e) {
	let t = Infinity, n = Infinity, r = -Infinity, i = -Infinity;
	for (let a of e) {
		let e = ja(a?.pos);
		if (!e) continue;
		let o = Ma(a?.size) || [140, 60];
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
function ja(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.x ?? e.left ?? null, n = e[1] ?? e[1] ?? e.y ?? e.top ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function Ma(e) {
	if (Array.isArray(e) && e.length >= 2) return [Number(e[0]), Number(e[1])];
	if (e && typeof e == "object") {
		let t = e[0] ?? e[0] ?? e.w ?? e.width ?? null, n = e[1] ?? e[1] ?? e.h ?? e.height ?? null;
		if (t !== null && n !== null) return [Number(t), Number(n)];
	}
	return null;
}
function Na(e) {
	if (Array.isArray(e)) return !0;
	let t = String(e || "").trim().toUpperCase();
	return t === "INT" || t === "FLOAT" || t === "STRING" || t === "BOOLEAN" || t === "BOOL" || t === "COMBO" || t === "ENUM";
}
function Pa(e, t = null) {
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
var Fa = {
	key: 0,
	class: "mjr-sidebar-section",
	style: {
		background: "var(--comfy-menu-bg, rgba(0,0,0,0.2))",
		border: "1px solid var(--border-color, rgba(255,255,255,0.14))",
		"border-radius": "8px",
		padding: "12px",
		"min-width": "300px"
	}
}, Ia = { style: { "margin-bottom": "12px" } }, La = { style: {
	"font-size": "16px",
	"font-weight": "800",
	color: "rgba(255,255,255,0.94)",
	"line-height": "1.25",
	overflow: "hidden",
	"text-overflow": "ellipsis"
} }, Ra = ["title"], za = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "8px",
	"margin-bottom": "10px"
} }, Ba = { style: {
	padding: "4px 9px",
	"border-radius": "999px",
	background: "rgba(33,150,243,0.14)",
	border: "1px solid rgba(33,150,243,0.30)",
	"font-size": "11px",
	"font-weight": "700",
	color: "#90CAF9",
	"text-transform": "uppercase",
	"letter-spacing": "0.4px"
} }, Va = {
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
}, Ha = { style: {
	display: "grid",
	"grid-template-columns": "repeat(2, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, Ua = {
	key: 0,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, Wa = { style: {
	"font-size": "13px",
	"font-weight": "750",
	color: "rgba(255,255,255,0.92)",
	"margin-top": "3px"
} }, Ga = {
	key: 1,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, Ka = { style: {
	"font-size": "13px",
	"font-weight": "750",
	color: "rgba(255,255,255,0.92)",
	"margin-top": "3px"
} }, qa = {
	key: 2,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, Ja = { style: {
	"font-size": "13px",
	"font-weight": "750",
	color: "rgba(255,255,255,0.92)",
	"margin-top": "3px"
} }, Ya = {
	key: 3,
	style: {
		padding: "8px 10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.04)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, Xa = { style: {
	"font-size": "12px",
	"font-weight": "650",
	color: "rgba(255,255,255,0.84)",
	"margin-top": "3px"
} }, Za = {
	key: 0,
	style: {
		"font-size": "11px",
		color: "rgba(255,255,255,0.54)",
		"margin-top": "2px"
	}
}, Qa = {
	key: 0,
	style: {
		"margin-bottom": "12px",
		padding: "10px",
		"border-radius": "10px",
		background: "rgba(244,67,54,0.08)",
		border: "1px solid rgba(244,67,54,0.25)"
	}
}, $a = {
	key: 1,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "5px"
	}
}, eo = {
	key: 1,
	style: {
		"margin-bottom": "12px",
		padding: "10px",
		"border-radius": "10px",
		background: "rgba(255,255,255,0.035)",
		border: "1px solid rgba(255,255,255,0.10)"
	}
}, to = {
	key: 0,
	style: {
		"font-size": "12px",
		"line-height": "1.45",
		color: "rgba(255,255,255,0.82)",
		"white-space": "pre-wrap"
	}
}, no = { style: {
	display: "grid",
	"grid-template-columns": "repeat(2, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, ro = { style: {
	display: "grid",
	"grid-template-columns": "repeat(3, minmax(0, 1fr))",
	gap: "8px",
	"margin-bottom": "12px"
} }, io = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, ao = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
} }, oo = { style: {
	padding: "8px 10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, so = { style: {
	"font-size": "18px",
	"font-weight": "700",
	color: "rgba(255,255,255,0.94)",
	"margin-top": "2px"
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
	"margin-bottom": "12px",
	padding: "10px",
	"border-radius": "10px",
	background: "rgba(255,255,255,0.03)",
	border: "1px solid rgba(255,255,255,0.10)"
} }, fo = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px",
	"margin-bottom": "8px"
} }, po = { style: {
	"font-size": "12px",
	color: "rgba(255,255,255,0.8)",
	"margin-top": "2px"
} }, mo = {
	key: 0,
	style: {
		display: "flex",
		"flex-wrap": "wrap",
		gap: "4px",
		"justify-content": "flex-end"
	}
}, ho = { style: {
	display: "flex",
	gap: "8px",
	"align-items": "center"
} }, go = ["placeholder"], _o = {
	key: 2,
	class: "mjr-workflow-tree-wrap"
}, vo = { class: "mjr-workflow-tree-node" }, yo = { class: "mjr-workflow-tree-node-name" }, bo = {
	key: 0,
	class: "mjr-workflow-tree-node-type"
}, xo = { class: "mjr-menu-item-hint" }, So = {
	key: 0,
	class: "mjr-section-hint"
}, Co = { style: {
	display: "flex",
	"align-items": "center",
	"justify-content": "space-between",
	gap: "10px",
	"margin-top": "8px"
} }, wo = { style: {
	display: "flex",
	"flex-wrap": "wrap",
	gap: "6px",
	"align-items": "center"
} }, To = {
	key: 3,
	style: {
		display: "grid",
		"grid-template-columns": "repeat(auto-fit, minmax(180px, 1fr))",
		gap: "8px",
		"align-items": "stretch",
		"margin-top": "10px",
		"margin-bottom": "10px"
	}
}, Eo = { style: {
	display: "flex",
	"flex-direction": "column",
	gap: "2px",
	"min-width": "0"
} }, Do = { style: {
	"font-size": "13px",
	"font-weight": "600"
} }, Oo = { style: {
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, ko = { style: {
	display: "flex",
	gap: "10px",
	"align-items": "stretch",
	"margin-top": "10px"
} }, Ao = { style: {
	display: "flex",
	"justify-content": "space-between",
	"align-items": "center",
	gap: "10px",
	"margin-top": "8px",
	"font-size": "11px",
	color: "rgba(255,255,255,0.58)"
} }, jo = ["open"], Mo = { style: {
	background: "rgba(0,0,0,0.5)",
	padding: "10px",
	"border-radius": "6px",
	"font-size": "11px",
	overflow: "auto",
	"max-height": "180px",
	margin: "10px 0 0 0",
	color: "#90CAF9",
	"font-family": "'Consolas', 'Monaco', monospace"
} }, No = 1, Po = 8, Fo = 250, Io = {
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
		]), s = H(null), c = H(""), l = H(!1), u = H(!1), d = H(null), f = H(!1), p = H(!1), m = H(ne()), h = H({ ...i }), g = H("crosshair"), _ = H(""), v = null, y = null, b = null;
		function S(e, t, n) {
			let r = Number(e);
			return Number.isFinite(r) ? Math.max(t, Math.min(n, r)) : t;
		}
		function C(e) {
			!e || typeof e != "object" || (h.value = {
				...h.value,
				zoom: S(e.zoom ?? h.value.zoom, No, Po),
				centerX: Number.isFinite(Number(e.centerX)) ? Number(e.centerX) : null,
				centerY: Number.isFinite(Number(e.centerY)) ? Number(e.centerY) : null
			});
		}
		function w() {
			h.value = { ...i }, _.value = "";
		}
		function E(e) {
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
		function D(e) {
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
		function ee(e) {
			let t = E(e), n = e?.workflow || e?.Workflow || e?.comfy_workflow || t?.workflow || t?.Workflow || t?.comfy_workflow || null;
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
		function te(e) {
			let t = E(e), n = e?.prompt || e?.Prompt || t?.prompt || t?.Prompt || null;
			if (!n) return null;
			if (typeof n == "object") return D(n) ? n : null;
			if (typeof n == "string") {
				let e = n.trim();
				if (!e) return null;
				try {
					let t = JSON.parse(e);
					return D(t) ? t : null;
				} catch {
					return null;
				}
			}
			return null;
		}
		function ne() {
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
				let e = localStorage?.getItem?.(x);
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
					}, J(e), localStorage?.removeItem?.(x);
				} catch (e) {
					console.debug?.(e);
				}
				return r;
			} catch {
				return { ...n };
			}
		}
		function re(e) {
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
		let O = R(() => {
			let e = ee(t.asset) || ee(d.value), n = te(t.asset) || te(d.value);
			return !e && !n ? null : e || Pa(n);
		}), ie = R(() => String(t.asset?.filepath || t.asset?.path || t.asset?.file_info?.filepath || "").trim()), ae = R(() => String(t.asset?.display_name || t.asset?.name || t.asset?.filename || t.asset?.title || "Workflow").trim()), k = R(() => String(t.asset?.task || t.asset?.workflow_task || "").trim()), se = R(() => String(t.asset?.model_family || t.asset?.workflow_model_family || "").trim()), ce = R(() => String(t.asset?.provider || t.asset?.workflow_provider || "").trim()), le = R(() => String(t.asset?.runs_on || t.asset?.runsOn || "").trim().toLowerCase()), ue = R(() => {
			let e = le.value, t = ce.value;
			return e === "api" && t ? `API · ${t}` : e ? t && t.toLowerCase() !== e ? `${e} · ${t}` : e : t;
		}), de = R(() => String(t.asset?.notes || "").trim()), fe = R(() => [
			t.asset?.detected_task ? `detected: ${t.asset.detected_task}` : "",
			t.asset?.detected_model_family ? t.asset.detected_model_family : "",
			t.asset?.detected_provider ? t.asset.detected_provider : ""
		].filter(Boolean).join(" · ")), me = R(() => A(t.asset?.missing_nodes || t.asset?.missingNodes)), he = R(() => A(t.asset?.missing_models || t.asset?.missingModels)), ge = R(() => {
			let e = Number(t.asset?.usage_count || t.asset?.usageCount || 0);
			return !Number.isFinite(e) || e <= 0 ? "" : `${Math.floor(e)} use${e === 1 ? "" : "s"}`;
		}), _e = R(() => ve(t.asset?.mtime || t.asset?.modified_at || t.asset?.updated_at));
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
		function ve(e) {
			let t = Number(e);
			if (!Number.isFinite(t) || t <= 0) return "";
			let n = t > 1e10 ? t : t * 1e3;
			try {
				return new Date(n).toLocaleString();
			} catch {
				return "";
			}
		}
		async function ye() {
			if (O.value) return;
			let e = ie.value;
			if (e && !u.value) {
				u.value = !0;
				try {
					let t = await pe(e, { timeoutMs: 25e3 });
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
		let be = R(() => t.asset?.has_generation_data ? "Complete" : "Partial"), xe = R(() => O.value ? JSON.stringify(O.value, null, 2) : ""), Se = R(() => String(t.asset?.category || t.asset?.subfolder || t.asset?.folder || "").trim().replace(/^\/+|\/+$/g, "")), Ce = R(() => Se.value ? Se.value.split(/[\\/]+/).filter(Boolean) : []);
		function j(e, t) {
			let n = e?.id ?? e?.key ?? t + 1;
			return String(e?.title || e?._meta?.title || e?.type || e?.class_type || e?.name || `Node ${n}`);
		}
		function we(e) {
			return String(e?.type || e?.class_type || e?.name || "").trim();
		}
		function Te() {
			c.value = Se.value;
		}
		async function De() {
			let e = String(t.asset?.filepath || t.asset?.path || t.asset?.file_info?.filepath || "").trim();
			if (!e) {
				T(M("toast.workflowMissingPath", "Workflow file path is missing."), "error");
				return;
			}
			let n = String(c.value || "").trim();
			if (n !== Se.value) {
				l.value = !0;
				try {
					let t = await o({
						filepath: e,
						category: n
					}, { timeoutMs: 3e4 });
					if (!t?.ok) {
						T(t?.error || M("toast.workflowMoveFailed", "Failed to move workflow."), "error");
						return;
					}
					c.value = String(t?.data?.workflow?.category || n || "").trim(), T(M("toast.workflowCategoryUpdated", "Workflow category updated"), "success", 1800);
				} catch {
					T(M("toast.workflowMoveFailed", "Failed to move workflow."), "error");
				} finally {
					l.value = !1;
				}
			}
		}
		async function Oe() {
			let e = ie.value;
			if (!e) {
				T(M("toast.workflowMissingPath", "Workflow file path is missing."), "error");
				return;
			}
			let n = await r({
				filepath: e,
				limit: 12
			}, { timeoutMs: 15e3 });
			if (!n?.ok) {
				T(n?.error || M("toast.workflowLoadFailed", "Failed to load workflow."), "error");
				return;
			}
			let i = Array.isArray(n.data) ? n.data : [];
			if (!i.length) {
				T(M("toast.workflowThumbnailNoCandidates", "No linked outputs are available for this workflow yet."), "warning", 2600);
				return;
			}
			let a = await rr({
				title: M("ctx.setWorkflowThumbnail", "Set workflow thumbnail"),
				workflow: t.asset,
				items: i
			});
			if (!a?.filepath) return;
			let o = await oe({
				filepath: e,
				source_filepath: a.filepath
			}, { timeoutMs: 3e4 });
			if (!o?.ok) {
				T(o?.error || M("toast.workflowSaveFailed", "Failed to save workflow."), "error");
				return;
			}
			T(M("toast.workflowUpdated", "Workflow updated"), "success", 1800), window?.dispatchEvent?.(new CustomEvent("mjr:reload-grid", { detail: { reason: "workflow-thumbnail-sidebar" } }));
		}
		async function ke() {
			if (await ye(), !O.value) {
				T(M("toast.workflowLoadFailed", "Failed to load workflow."), "error");
				return;
			}
			try {
				await Fe.openAssets({
					assets: [{
						...t.asset,
						workflow: O.value,
						Workflow: O.value
					}],
					index: 0,
					mode: "graph"
				});
			} catch (e) {
				console.debug?.(e), T(M("toast.workflowLoadFailed", "Failed to load workflow."), "error");
			}
		}
		let Ae = R(() => (Array.isArray(O.value?.nodes) ? O.value.nodes : []).slice(0, Fo).map((e, t) => {
			let n = e?.id ?? e?.key ?? t + 1, r = we(e);
			return {
				key: String(n),
				label: j(e, t),
				icon: "pi pi-circle-fill",
				data: {
					id: n,
					type: r
				}
			};
		})), je = R(() => Math.max(0, Number(Me.value.nodes || 0) - Ae.value.length)), Me = R(() => {
			let e = O.value;
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
		}), Ne = R(() => {
			let e = String(m.value?.size || "comfortable");
			return a.find((t) => t.key === e) || a[1];
		}), Pe = R(() => `${Ne.value.height}px`), He = R(() => [
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
		function We() {
			let e = s.value, t = O.value;
			if (!e || !t) return;
			let n = Math.max(1, e.clientWidth || 320), r = Math.max(1, e.clientHeight || 120), i = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
			e.width = Math.floor(n * i), e.height = Math.floor(r * i);
			let a = e.getContext("2d");
			a && a.setTransform(i, 0, 0, i, 0, 0), y = wa(e, t, {
				...m.value,
				view: h.value
			}) || null, C(y?.resolvedView);
		}
		function Ge(e) {
			Ee(e);
		}
		function Ke(e) {
			let t = s.value;
			if (!t) return null;
			let n = t.getBoundingClientRect?.();
			return n ? {
				x: Number(e?.clientX) - n.left,
				y: Number(e?.clientY) - n.top
			} : null;
		}
		function qe(e) {
			let t = Ke(e);
			return !t || !y?.canvasToWorld ? null : {
				local: t,
				world: y.canvasToWorld(t.x, t.y)
			};
		}
		function Je(e) {
			let t = Ke(e), n = t && y?.hitTestNode ? y.hitTestNode(t.x, t.y) : null, r = n?.id !== null && n?.id !== void 0 ? String(n.id) : null, i = h.value.hoveredNodeId !== null && h.value.hoveredNodeId !== void 0 ? String(h.value.hoveredNodeId) : null;
			_.value = n?.label || "", r !== i && (h.value = {
				...h.value,
				hoveredNodeId: r
			}, We());
		}
		function Ye(e) {
			e && (Ge(e), h.value = {
				...h.value,
				centerX: Number(e.x),
				centerY: Number(e.y)
			}, We());
		}
		function Xe(e) {
			if (Number(e?.button ?? 0) !== 0) return;
			let t = qe(e);
			t && (b = e.pointerId ?? 1, g.value = "grabbing", s.value?.setPointerCapture?.(b), Ye(t.world), Je(e), e.preventDefault?.(), e.stopPropagation?.());
		}
		function Ze(e) {
			if (b !== null && e.pointerId === b) {
				let t = qe(e);
				t && Ye(t.world), e.preventDefault?.(), e.stopPropagation?.();
				return;
			}
			Je(e);
		}
		function Qe(e) {
			b !== null && e?.pointerId === b && (s.value?.releasePointerCapture?.(b), b = null, g.value = "crosshair"), e?.type === "pointerleave" && (_.value = "", h.value.hoveredNodeId !== null && (h.value = {
				...h.value,
				hoveredNodeId: null
			}, We()));
		}
		function et(e) {
			let t = qe(e), n = y?.resolvedView;
			if (!t || !n) return;
			let r = S(Number(e?.deltaY) || 0, -240, 240), i = Math.exp(-r * .0025), a = S((Number(h.value.zoom) || 1) * i, No, Po);
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
			}, We(), Je(e), e.preventDefault?.(), e.stopPropagation?.();
		}
		function nt(e) {
			let t = qe(e);
			w(), t && Ge(t.world), We(), e.preventDefault?.(), e.stopPropagation?.();
		}
		function rt(e) {
			m.value = {
				...m.value,
				[e]: !m.value?.[e]
			}, re(m.value);
		}
		function it(e) {
			a.some((t) => t.key === e) && (m.value = {
				...m.value,
				size: e
			}, re(m.value));
		}
		return Ve(() => {
			s.value && typeof ResizeObserver == "function" && (v = new ResizeObserver(() => We()), v.observe(s.value)), Te(), ye(), We();
		}), Re(O, () => {
			w(), We();
		}, { flush: "post" }), Re(ie, () => {
			d.value = null, ye();
		}, { immediate: !0 }), Re(Se, () => {
			Te();
		}), Re(m, () => {
			We();
		}, {
			deep: !0,
			flush: "post"
		}), Re(f, () => {
			We();
		}, { flush: "post" }), Be(() => {
			try {
				v?.disconnect?.();
			} catch (e) {
				console.debug?.(e);
			}
			v = null, b = null;
		}), (e, t) => {
			let n = Ue("MButton"), r = Ue("MTree");
			return O.value ? (N(), V("div", Fa, [
				t[17] ||= F("div", { style: {
					"font-size": "13px",
					"font-weight": "600",
					color: "var(--fg-color, #eaeaea)",
					"margin-bottom": "12px",
					"text-transform": "uppercase",
					"letter-spacing": "0.5px"
				} }, " ComfyUI Workflow ", -1),
				F("div", Ia, [F("div", La, B(ae.value), 1), ie.value ? (N(), V("div", {
					key: 0,
					style: {
						"font-size": "11px",
						color: "rgba(255,255,255,0.48)",
						"margin-top": "4px",
						overflow: "hidden",
						"text-overflow": "ellipsis",
						"white-space": "nowrap"
					},
					title: ie.value
				}, B(ie.value), 9, Ra)) : L("", !0)]),
				F("div", za, [F("div", Ba, B(be.value), 1), Me.value.source ? (N(), V("div", Va, B(Me.value.source), 1)) : L("", !0)]),
				F("div", Ha, [
					k.value ? (N(), V("div", Ua, [t[3] ||= F("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Task", -1), F("div", Wa, B(k.value), 1)])) : L("", !0),
					se.value ? (N(), V("div", Ga, [t[4] ||= F("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Model", -1), F("div", Ka, B(se.value), 1)])) : L("", !0),
					ue.value ? (N(), V("div", qa, [t[5] ||= F("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Runs on", -1), F("div", Ja, B(ue.value), 1)])) : L("", !0),
					ge.value || _e.value ? (N(), V("div", Ya, [
						t[6] ||= F("div", { style: {
							"font-size": "10px",
							"font-weight": "700",
							color: "rgba(255,255,255,0.55)",
							"text-transform": "uppercase",
							"letter-spacing": "0.4px"
						} }, "Library", -1),
						F("div", Xa, B(ge.value || _e.value), 1),
						ge.value && _e.value ? (N(), V("div", Za, B(_e.value), 1)) : L("", !0)
					])) : L("", !0)
				]),
				me.value.length || he.value.length ? (N(), V("div", Qa, [
					t[7] ||= F("div", { style: {
						"font-size": "10px",
						"font-weight": "800",
						color: "#ef9a9a",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px",
						"margin-bottom": "6px"
					} }, "Missing dependencies", -1),
					me.value.length ? (N(), V("div", {
						key: 0,
						style: U({
							display: "flex",
							flexWrap: "wrap",
							gap: "5px",
							marginBottom: he.value.length ? "7px" : "0"
						})
					}, [(N(!0), V(P, null, I(me.value, (e) => (N(), V("span", {
						key: `node-${e}`,
						style: {
							padding: "3px 7px",
							"border-radius": "999px",
							background: "rgba(244,67,54,0.16)",
							"font-size": "10px",
							"font-weight": "700",
							color: "#ffcdd2"
						}
					}, B(e), 1))), 128))], 4)) : L("", !0),
					he.value.length ? (N(), V("div", $a, [(N(!0), V(P, null, I(he.value, (e) => (N(), V("span", {
						key: `model-${e}`,
						style: {
							padding: "3px 7px",
							"border-radius": "999px",
							background: "rgba(255,152,0,0.16)",
							"font-size": "10px",
							"font-weight": "700",
							color: "#ffe0b2"
						}
					}, B(e), 1))), 128))])) : L("", !0)
				])) : L("", !0),
				de.value || fe.value ? (N(), V("div", eo, [de.value ? (N(), V("div", to, B(de.value), 1)) : L("", !0), fe.value ? (N(), V("div", {
					key: 1,
					style: U({
						fontSize: "11px",
						color: "rgba(255,255,255,0.48)",
						marginTop: de.value ? "7px" : "0"
					})
				}, B(fe.value), 5)) : L("", !0)])) : L("", !0),
				F("div", no, [$e(n, {
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
					onClick: Oe
				}, {
					default: ot(() => [t[8] ||= F("i", { class: "pi pi-image" }, null, -1), F("span", null, B(z(M)("ctx.setWorkflowThumbnail", "Set workflow thumbnail")), 1)]),
					_: 1
				}), $e(n, {
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
					onClick: ke
				}, {
					default: ot(() => [t[9] ||= F("i", { class: "pi pi-search" }, null, -1), F("span", null, B(z(M)("ctx.inspect", "Inspect")), 1)]),
					_: 1
				})]),
				F("div", ro, [
					F("div", io, [t[10] ||= F("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Nodes", -1), F("div", ao, B(Me.value.nodes), 1)]),
					F("div", oo, [t[11] ||= F("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Links", -1), F("div", so, B(Me.value.links), 1)]),
					F("div", co, [t[12] ||= F("div", { style: {
						"font-size": "10px",
						"font-weight": "700",
						color: "rgba(255,255,255,0.55)",
						"text-transform": "uppercase",
						"letter-spacing": "0.4px"
					} }, "Groups", -1), F("div", lo, B(Me.value.groups), 1)])
				]),
				F("div", uo, [F("div", fo, [F("div", null, [t[13] ||= F("div", { style: {
					"font-size": "10px",
					"font-weight": "700",
					color: "rgba(255,255,255,0.55)",
					"text-transform": "uppercase",
					"letter-spacing": "0.4px"
				} }, "Category", -1), F("div", po, B(Se.value || "Root"), 1)]), Ce.value.length ? (N(), V("div", mo, [(N(!0), V(P, null, I(Ce.value, (e) => (N(), V("span", {
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
				}, B(e), 1))), 128))])) : L("", !0)]), F("div", ho, [ze(F("input", {
					"onUpdate:modelValue": t[0] ||= (e) => c.value = e,
					type: "text",
					placeholder: z(M)("dialog.workflowCategory", "Workflow category"),
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
				}, null, 8, go), [[ft, c.value]]), $e(n, {
					type: "button",
					severity: "secondary",
					text: "",
					rounded: "",
					disabled: l.value,
					style: U({
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
					onClick: De
				}, {
					default: ot(() => [Ie(B(l.value ? "Saving..." : "Move"), 1)]),
					_: 1
				}, 8, ["disabled", "style"])])]),
				Ae.value.length ? (N(), V("div", _o, [
					t[14] ||= F("div", { class: "mjr-section-title" }, " Workflow Nodes ", -1),
					$e(r, {
						value: Ae.value,
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
						default: ot(({ node: e }) => [F("span", vo, [
							F("span", yo, B(e.label), 1),
							e.data?.type ? (N(), V("span", bo, B(e.data.type), 1)) : L("", !0),
							F("span", xo, "#" + B(e.data?.id), 1)
						])]),
						_: 1
					}, 8, ["value"]),
					je.value ? (N(), V("div", So, " +" + B(je.value) + " more nodes ", 1)) : L("", !0)
				])) : L("", !0),
				F("div", Co, [F("div", wo, [(N(!0), V(P, null, I(z(a), (e) => (N(), Le(n, {
					key: e.key,
					type: "button",
					severity: "secondary",
					text: "",
					rounded: "",
					title: `${e.label} minimap`,
					style: U({
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
					onClick: (t) => it(e.key)
				}, {
					default: ot(() => [Ie(B(e.label), 1)]),
					_: 2
				}, 1032, [
					"title",
					"style",
					"onClick"
				]))), 128))]), $e(n, {
					type: "button",
					class: "mjr-btn mjr-icon-btn",
					severity: "secondary",
					text: "",
					rounded: "",
					title: z(M)("tooltip.minimapSettings", "Minimap settings"),
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
					default: ot(() => [...t[15] ||= [F("i", { class: "pi pi-sliders-h" }, null, -1)]]),
					_: 1
				}, 8, ["title"])]),
				f.value ? (N(), V("div", To, [(N(!0), V(P, null, I(He.value, (e) => (N(), Le(n, {
					key: e.key,
					type: "button",
					severity: "secondary",
					text: "",
					style: U({
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
					onClick: (t) => rt(e.key)
				}, {
					default: ot(() => [
						F("span", { style: U({
							width: "22px",
							height: "22px",
							borderRadius: "6px",
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							background: m.value?.[e.key] ? "rgba(76,175,80,0.95)" : "rgba(255,255,255,0.08)",
							border: m.value?.[e.key] ? "1px solid rgba(76,175,80,0.35)" : "1px solid rgba(255,255,255,0.12)",
							flex: "0 0 auto"
						}) }, [F("i", {
							class: "pi pi-check",
							style: U({
								fontSize: "12px",
								opacity: m.value?.[e.key] ? "1" : "0"
							})
						}, null, 4)], 4),
						F("i", {
							class: tt(e.iconClass),
							style: {
								"font-size": "18px",
								opacity: "0.9",
								width: "18px"
							}
						}, null, 2),
						F("div", Eo, [F("div", Do, B(e.label), 1), F("div", Oo, B(m.value?.[e.key] ? "On" : "Off"), 1)])
					]),
					_: 2
				}, 1032, ["style", "onClick"]))), 128))])) : L("", !0),
				F("div", ko, [F("canvas", {
					ref_key: "canvasRef",
					ref: s,
					style: U({
						width: "100%",
						height: Pe.value,
						cursor: g.value,
						touchAction: "none",
						borderRadius: "10px",
						marginTop: "0",
						background: "linear-gradient(180deg, rgba(7, 12, 18, 0.95) 0%, rgba(10, 16, 24, 0.92) 100%)",
						border: "1px solid var(--mjr-border, rgba(255,255,255,0.12))",
						boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03)"
					}),
					onPointerdown: Xe,
					onPointermove: Ze,
					onPointerup: Qe,
					onPointercancel: Qe,
					onPointerleave: Qe,
					onWheel: et,
					onDblclick: nt
				}, null, 36)]),
				F("div", Ao, [F("span", null, B(_.value || "Click/drag to navigate | wheel to zoom"), 1), F("span", null, B(Math.round((h.value.zoom || 1) * 100)) + "% | " + B(Ne.value.label), 1)]),
				F("details", {
					open: p.value,
					style: { "margin-top": "10px" },
					onToggle: t[2] ||= (e) => p.value = e.target.open
				}, [t[16] ||= F("summary", { style: {
					cursor: "pointer",
					color: "var(--mjr-muted, rgba(255,255,255,0.65))",
					"font-size": "12px",
					"user-select": "none"
				} }, " Show raw JSON ", -1), F("pre", Mo, B(xe.value), 1)], 40, jo)
			])) : L("", !0);
		};
	}
};
//#endregion
export { Y as C, Ut as S, J as T, rr as _, da as a, tr as b, Gr as c, _r as d, gr as f, ir as g, pr as h, pa as i, Sr as l, fr as m, wa as n, ma as o, sr as p, Pa as r, oa as s, Io as t, hr as u, nr as v, q as w, er as x, Q as y };
