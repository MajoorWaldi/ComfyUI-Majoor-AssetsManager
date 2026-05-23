//#region js/utils/ids.js
function e(e) {
	try {
		return String(e ?? "").trim();
	} catch {
		return "";
	}
}
var t = 0;
function n(e) {
	let t = Math.max(4, Number(e) || 0);
	try {
		let e = globalThis.crypto;
		if (!e?.getRandomValues) return "";
		let n = new Uint8Array(t);
		return e.getRandomValues(n), Array.from(n, (e) => e.toString(16).padStart(2, "0")).join("");
	} catch {
		return "";
	}
}
function r(e = "", t = 16) {
	let r = n(t);
	if (!r) throw Error("Secure token generation requires crypto.getRandomValues().");
	return `${String(e || "")}${r}`;
}
function i(e = "", r = 8) {
	let i = n(r);
	return i ? `${String(e || "")}${i}` : (t += 1, `${String(e || "")}${Date.now().toString(36)}_${t.toString(36)}`);
}
function a(t) {
	let n = e(t);
	if (!n || !/^\d+$/.test(n)) return "";
	try {
		let e = Number(n);
		return !Number.isSafeInteger(e) || e <= 0 ? "" : String(e);
	} catch {
		return "";
	}
}
function o(e) {
	return a(e);
}
function s(t) {
	try {
		return t ? e(t.root_id ?? t.rootId ?? t.custom_root_id ?? t.customRootId ?? t.customRoot ?? t?.file_info?.root_id ?? t?.file_info?.rootId ?? "") : "";
	} catch {
		return "";
	}
}
//#endregion
//#region js/utils/path.js
function c(e) {
	return String(e || "").replace(/\\/g, "/");
}
function l(e) {
	let t = c(e).trim();
	if (!t) return {
		filename: "",
		subfolder: ""
	};
	let n = t.lastIndexOf("/");
	return n < 0 ? {
		filename: t,
		subfolder: ""
	} : {
		filename: t.slice(n + 1),
		subfolder: t.slice(0, n)
	};
}
function u(e) {
	return /^[a-zA-Z]:\//.test(String(e || ""));
}
//#endregion
//#region js/api/endpoints.js
var d = 200, f = 0, p = {
	HEALTH: "/mjr/am/health",
	HEALTH_COUNTERS: "/mjr/am/health/counters",
	HEALTH_DB: "/mjr/am/health/db",
	STATUS: "/mjr/am/status",
	RUNTIME_EXECUTION: "/mjr/am/runtime/execution",
	CONFIG: "/mjr/am/config",
	VERSION: "/mjr/am/version",
	SCAN: "/mjr/am/scan",
	INDEX_FILES: "/mjr/am/index-files",
	INDEX_RESET: "/mjr/am/index/reset",
	DB_RESET: "/mjr/am/db/reset",
	SEARCH: "/mjr/am/search",
	LIST: "/mjr/am/list",
	ROOTS: "/mjr/am/roots",
	CUSTOM_ROOTS: "/mjr/am/custom-roots",
	CUSTOM_ROOTS_REMOVE: "/mjr/am/custom-roots/remove",
	BROWSER_FOLDER_OP: "/mjr/am/browser/folder-op",
	BROWSE_FOLDER: "/mjr/sys/browse-folder",
	FOLDER_INFO: "/mjr/am/folder-info",
	METADATA: "/mjr/am/metadata",
	WORKFLOW_QUICK: "/mjr/am/workflow-quick",
	RETRY_SERVICES: "/mjr/am/retry-services",
	STAGE_TO_INPUT: "/mjr/am/stage-to-input",
	OPEN_IN_FOLDER: "/mjr/am/open-in-folder",
	TOOLS_STATUS: "/mjr/am/tools/status",
	SETTINGS_OUTPUT_DIRECTORY: "/mjr/am/settings/output-directory",
	SETTINGS_INDEX_DIRECTORY: "/mjr/am/settings/index-directory",
	SETTINGS_METADATA_FALLBACK: "/mjr/am/settings/metadata-fallback",
	SETTINGS_VECTOR_SEARCH: "/mjr/am/settings/vector-search",
	SETTINGS_EXECUTION_GROUPING: "/mjr/am/settings/execution-grouping",
	SETTINGS_HUGGINGFACE: "/mjr/am/settings/huggingface",
	SETTINGS_AI_LOGGING: "/mjr/am/settings/ai-logging",
	SETTINGS_ROUTE_LOGGING: "/mjr/am/settings/route-logging",
	SETTINGS_STARTUP_LOGGING: "/mjr/am/settings/startup-logging",
	SETTINGS_LTXAV_RGB_FALLBACK: "/mjr/am/settings/ltxav-rgb-fallback",
	VIEW: "/view",
	CUSTOM_VIEW: "/mjr/am/custom-view",
	VIEWER_INFO: "/mjr/am/viewer/info",
	VIEWER_RESOURCE: "/mjr/am/viewer/resource",
	UPLOAD_INPUT: "/mjr/am/upload_input",
	DOWNLOAD: "/mjr/am/download",
	DOWNLOAD_CLEAN: "/mjr/am/download-clean",
	BATCH_ZIP_CREATE: "/mjr/am/batch-zip",
	DATE_HISTOGRAM: "/mjr/am/date-histogram",
	ASSET_DELETE: "/mjr/am/asset/delete",
	ASSET_RENAME: "/mjr/am/asset/rename",
	WATCHER_STATUS: "/mjr/am/watcher/status",
	WATCHER_TOGGLE: "/mjr/am/watcher/toggle",
	WATCHER_SCOPE: "/mjr/am/watcher/scope",
	WATCHER_SETTINGS: "/mjr/am/watcher/settings",
	COLLECTIONS: "/mjr/am/collections",
	STACKS: "/mjr/am/stacks",
	STACKS_MERGE: "/mjr/am/stacks/merge",
	STACKS_DISSOLVE: "/mjr/am/stacks/dissolve",
	STACKS_AUTO_STACK: "/mjr/am/stacks/auto-stack",
	DUPLICATES_ALERTS: "/mjr/am/duplicates/alerts",
	DUPLICATES_ANALYZE: "/mjr/am/duplicates/analyze",
	DUPLICATES_MERGE_TAGS: "/mjr/am/duplicates/merge-tags",
	DB_BACKUPS: "/mjr/am/db/backups",
	DB_BACKUP_SAVE: "/mjr/am/db/backup-save",
	DB_BACKUP_RESTORE: "/mjr/am/db/backup-restore",
	VECTOR_SEARCH: "/mjr/am/vector/search",
	VECTOR_SIMILAR: "/mjr/am/vector/similar",
	VECTOR_ALIGNMENT: "/mjr/am/vector/alignment",
	VECTOR_AUTO_TAGS: "/mjr/am/vector/auto-tags",
	VECTOR_CAPTION: "/mjr/am/vector/caption",
	VECTOR_ENHANCED_PROMPT: "/mjr/am/vector/enhanced-prompt",
	VECTOR_INDEX: "/mjr/am/vector/index",
	VECTOR_STATS: "/mjr/am/vector/stats",
	VECTOR_SUGGEST_COLLECTIONS: "/mjr/am/vector/suggest-collections",
	VECTOR_BACKFILL: "/mjr/am/db/backfill-missing-vectors",
	VECTOR_BACKFILL_STATUS: "/mjr/am/db/backfill-missing-vectors/status",
	HYBRID_SEARCH: "/mjr/am/search/hybrid",
	AUDIT: "/mjr/am/audit"
};
function m(e, t = {}) {
	let n = String(e || ""), r = () => n.includes("?") ? "&" : "?", i = (e) => {
		n += r() + e;
	}, { subfolder: a = null, kind: o = null, hasWorkflow: s = null, minRating: c = null, minSizeMB: l = null, maxSizeMB: u = null, minWidth: d = null, minHeight: f = null, maxWidth: p = null, maxHeight: m = null, workflowType: h = null, dateRange: g = null, dateExact: _ = null } = t || {};
	return a && i(`subfolder=${encodeURIComponent(String(a))}`), o && i(`kind=${encodeURIComponent(o)}`), s != null && i(`has_workflow=${encodeURIComponent(s ? "true" : "false")}`), c != null && Number(c) > 0 && i(`min_rating=${encodeURIComponent(String(c))}`), l != null && Number(l) > 0 && i(`min_size_mb=${encodeURIComponent(String(l))}`), u != null && Number(u) > 0 && i(`max_size_mb=${encodeURIComponent(String(u))}`), d != null && Number(d) > 0 && i(`min_width=${encodeURIComponent(String(d))}`), f != null && Number(f) > 0 && i(`min_height=${encodeURIComponent(String(f))}`), p != null && Number(p) > 0 && i(`max_width=${encodeURIComponent(String(p))}`), m != null && Number(m) > 0 && i(`max_height=${encodeURIComponent(String(m))}`), h && i(`workflow_type=${encodeURIComponent(String(h))}`), g && i(`date_range=${encodeURIComponent(String(g))}`), _ && i(`date_exact=${encodeURIComponent(String(_))}`), n;
}
function h(e, t = null, n = "output") {
	let r = String(e || "").trim();
	if (!r) return "";
	let i = `${p.VIEW}?filename=${encodeURIComponent(r)}`;
	return t && (i += `&subfolder=${encodeURIComponent(t)}`), i += `&type=${encodeURIComponent(n)}`, i;
}
function g(e = {}) {
	let { q: t = "*", limit: n = d, offset: r = f, scope: i = "output", subfolder: a = "", customRootId: o = null, kind: s = null, hasWorkflow: c = null, minRating: l = null, minSizeMB: u = null, maxSizeMB: h = null, resolutionCompare: g = null, minWidth: _ = null, minHeight: v = null, maxWidth: y = null, maxHeight: b = null, workflowType: x = null, dateRange: S = null, dateExact: C = null, sort: w = null, cursor: T = null, includeTotal: E = !0, groupStacks: D = !1 } = e, O = `${p.LIST}?q=${encodeURIComponent(t)}&limit=${n}&offset=${r}&scope=${encodeURIComponent(i)}`;
	return a && (O += `&subfolder=${encodeURIComponent(a)}`), o ? O += `&custom_root_id=${encodeURIComponent(o)}` : String(i || "").toLowerCase() === "custom" && (O += "&browser_mode=1"), O = m(O, {
		kind: s,
		hasWorkflow: c,
		minRating: l,
		minSizeMB: u,
		maxSizeMB: h,
		minWidth: _,
		minHeight: v,
		maxWidth: y,
		maxHeight: b,
		workflowType: x,
		dateRange: S,
		dateExact: C
	}), g && (O += `&resolution_compare=${encodeURIComponent(String(g))}`), w && (O += `&sort=${encodeURIComponent(String(w))}`), T && (O += `&cursor=${encodeURIComponent(String(T))}`), E === !1 && (O += "&include_total=0"), D && (O += "&group_stacks=1"), O;
}
function _(e, t = "", n = "") {
	let r = String(e || "").trim(), i = String(n || "").trim();
	if (!r || !i) return "";
	let a = `${p.CUSTOM_VIEW}?root_id=${encodeURIComponent(i)}&filename=${encodeURIComponent(r)}`;
	return t && (a += `&subfolder=${encodeURIComponent(t)}`), a;
}
function v(e) {
	return `${p.BATCH_ZIP_CREATE}/${encodeURIComponent(String(e || ""))}`;
}
function y(e) {
	return `${p.STACKS}/${encodeURIComponent(String(e || ""))}`;
}
function b(e) {
	return `${y(e)}/members`;
}
function x(e, t = {}) {
	let n = String(e || "").trim(), r = `${p.STACKS}/by-node/${encodeURIComponent(n)}/members`, i = [], a = String(t?.jobId || t?.job_id || "").trim();
	a && i.push(`job_id=${encodeURIComponent(a)}`), t?.latest === !1 && i.push("latest=0");
	let o = Number(t?.limit || 0);
	return Number.isFinite(o) && o > 0 && i.push(`limit=${encodeURIComponent(String(Math.trunc(o)))}`), i.length && (r += `?${i.join("&")}`), r;
}
function S(e, t = "") {
	let n = e && typeof e == "object" ? e : {}, r = String(t || "").trim();
	if (!r) return "";
	let i = o(n?.asset_id ?? n?.id ?? null), a = `${p.VIEWER_RESOURCE}?relpath=${encodeURIComponent(r)}`;
	if (i) return `${a}&asset_id=${encodeURIComponent(i)}`;
	let l = c(String(n?.filepath || n?.path || n?.fullpath || n?.full_path || n?.file_info?.filepath || n?.file_info?.path || "").trim());
	if (l) return `${a}&filepath=${encodeURIComponent(l)}`;
	let u = String(n?.filename || n?.name || n?.file_info?.filename || "").trim();
	if (!u) return "";
	a += `&filename=${encodeURIComponent(u)}`;
	let d = String(n?.subfolder || n?.file_info?.subfolder || "").trim();
	d && (a += `&subfolder=${encodeURIComponent(d)}`);
	let f = String(n?.type || n?.file_info?.type || "").trim().toLowerCase();
	f && f !== "custom" && (a += `&type=${encodeURIComponent(f)}`);
	let m = String(s(n) || n?.root_id || n?.custom_root_id || "").trim();
	return m && (a += `&root_id=${encodeURIComponent(m)}`), a;
}
function C(e = {}) {
	let { scope: t = "output", customRootId: n = null, month: r = "", kind: i = null, hasWorkflow: a = null, minRating: o = null } = e, s = `${p.DATE_HISTOGRAM}?scope=${encodeURIComponent(t)}&month=${encodeURIComponent(String(r || ""))}`;
	return n && (s += `&custom_root_id=${encodeURIComponent(n)}`), m(s, {
		subfolder: e.subfolder ?? null,
		kind: i,
		hasWorkflow: a,
		minRating: o,
		minSizeMB: e.minSizeMB ?? null,
		maxSizeMB: e.maxSizeMB ?? null,
		minWidth: e.minWidth ?? null,
		minHeight: e.minHeight ?? null,
		maxWidth: e.maxWidth ?? null,
		maxHeight: e.maxHeight ?? null,
		workflowType: e.workflowType ?? null,
		dateRange: e.dateRange ?? null,
		dateExact: e.dateExact ?? null
	});
}
function w(e) {
	let t = e?.mtime, n = (e) => !e || !t ? e : `${e}${e.includes("?") ? "&" : "?"}v=${encodeURIComponent(t)}`, r = c(String(e?.filepath || e?.path || e?.fullpath || e?.full_path || e?.file_info?.filepath || e?.file_info?.path || "").trim()), i = String(e?.filename || e?.name || e?.file_info?.filename || "").trim(), a = String(e?.subfolder || e?.file_info?.subfolder || "").trim(), o = ((e) => {
		let t = {
			type: "",
			subfolder: "",
			filename: ""
		}, n = c(e);
		if (!n) return t;
		let r = n.toLowerCase().indexOf("/output/"), i = n.toLowerCase().indexOf("/input/"), a = -1;
		if (r >= 0 ? (t.type = "output", a = r + 8) : i >= 0 && (t.type = "input", a = i + 7), a >= 0) {
			let e = n.slice(a), r = e.lastIndexOf("/");
			r >= 0 ? (t.subfolder = e.slice(0, r), t.filename = e.slice(r + 1)) : t.filename = e;
		} else t.filename = l(n).filename;
		return t;
	})(r);
	if (!a && i.includes("/")) {
		let e = i.lastIndexOf("/");
		e > 0 && (a = i.slice(0, e), i = i.slice(e + 1));
	}
	if (!i && o.filename && (i = o.filename), !a && o.subfolder && (a = o.subfolder), !i) return "";
	let d = String(e?.type || e?.file_info?.type || "").toLowerCase().trim();
	d !== "input" && d !== "output" && d !== "custom" && (d = ""), !d && o.type && (d = o.type), !d && r && (r.includes("/input/") ? d = "input" : r.includes("/output/") && (d = "output")), d ||= "output";
	let f = r.includes("/output/") || r.includes("/input/"), m = u(a) || a.startsWith("/");
	if (r && d !== "custom" && (m || !f)) return n(T(r, { inline: !0 }));
	if (d === "custom") {
		let t = String(s(e) || "").trim();
		if (t) return n(_(i, a, t));
		if (r) return n(`${p.CUSTOM_VIEW}?filepath=${encodeURIComponent(r)}&browser_mode=1`);
		let c = o.type || "output";
		return n(h(i, a, c));
	}
	return r.includes("/output/") && (d = "output"), r.includes("/input/") && (d = "input"), n(h(i, a, d));
}
function T(e, t = {}) {
	if (!e) return "";
	let n = !!t?.inline, r = `${p.DOWNLOAD}?filepath=${encodeURIComponent(e)}`;
	return n && (r += "&preview=1"), r;
}
function E(e) {
	return e ? `${p.DOWNLOAD_CLEAN}?filepath=${encodeURIComponent(e)}` : "";
}
//#endregion
//#region js/app/config.js
var D = Object.freeze({
	DEBUG_SAFE_CALL: !1,
	DEBUG_SAFE_LISTENERS: !1,
	DEBUG_VIEWER: !1,
	VIEWER_ALLOW_PAN_AT_ZOOM_1: !1,
	VIEWER_DISABLE_WEBGL_VIDEO: !1,
	VIEWER_DISABLE_WEBGL_AUDIO: !1,
	VIEWER_VIDEO_GRADE_THROTTLE_FPS: 12,
	VIEWER_AUDIO_VISUALIZER_MODE: "artistic",
	VIEWER_AUDIO_VIS_FPS: 18,
	VIEWER_SCOPES_FPS: 8,
	GRID_MIN_SIZE: 120,
	FEED_GRID_MIN_SIZE: 120,
	GRID_GAP: 10,
	GRID_SHOW_BADGES_EXTENSION: !0,
	GRID_SHOW_BADGES_RATING: !0,
	GRID_SHOW_BADGES_TAGS: !0,
	GRID_SHOW_DETAILS: !0,
	GRID_SHOW_DETAILS_FILENAME: !0,
	GRID_SHOW_DETAILS_DATE: !0,
	GRID_SHOW_DETAILS_DIMENSIONS: !0,
	GRID_SHOW_DETAILS_GENTIME: !1,
	GRID_SHOW_HOVER_INFO: !0,
	GRID_SHOW_WORKFLOW_DOT: !0,
	GRID_VIDEO_AUTOPLAY_MODE: "hover",
	FEED_SHOW_INFO: !0,
	FEED_SHOW_FILENAME: !1,
	FEED_SHOW_DIMENSIONS: !0,
	FEED_SHOW_DATE: !0,
	FEED_SHOW_GENTIME: !1,
	FEED_SHOW_WORKFLOW_DOT: !1,
	FEED_SHOW_BADGES_EXTENSION: !0,
	FEED_SHOW_BADGES_RATING: !0,
	FEED_SHOW_BADGES_TAGS: !0,
	UI_CARD_HOVER_COLOR: "#3D3D3D",
	UI_CARD_SELECTION_COLOR: "#4A90E2",
	UI_RATING_COLOR: "#FF9500",
	UI_TAG_COLOR: "#4A90E2",
	BADGE_STAR_COLOR: "#FFD45A",
	BADGE_IMAGE_COLOR: "#2196F3",
	BADGE_VIDEO_COLOR: "#9C27B0",
	BADGE_AUDIO_COLOR: "#FF9800",
	BADGE_MODEL3D_COLOR: "#4CAF50",
	BADGE_DUPLICATE_ALERT_COLOR: "#FF1744",
	DEFAULT_PAGE_SIZE: 80,
	MAX_PAGE_SIZE: 2e3,
	PREFETCH_NEXT_PAGE: !0,
	PREFETCH_NEXT_PAGE_DELAY_MS: 700,
	SEARCH_DEFAULT_LIMIT: 500,
	INFINITE_SCROLL_ENABLED: !0,
	INFINITE_SCROLL_ROOT_MARGIN: "800px",
	INFINITE_SCROLL_THRESHOLD: .01,
	BOTTOM_GAP_PX: 80,
	STATUS_POLL_INTERVAL: 5e3,
	AUTO_SCAN_ON_STARTUP: !1,
	EXECUTION_GROUPING_ENABLED: !0,
	EXECUTION_IDLE_GRACE_MS: 6e3,
	DEFER_GRID_FETCH_DURING_EXECUTION: !1,
	VIEWER_PAUSE_DURING_EXECUTION: !0,
	FLOATING_VIEWER_PAUSE_DURING_EXECUTION: !1,
	MFV_SIDEBAR_POSITION: "right",
	MFV_LIVE_DEFAULT: !0,
	MFV_PREVIEW_DEFAULT: !0,
	MFV_LIVE_AUTO_OPEN: !1,
	MFV_PREVIEW_AUTO_OPEN: !1,
	MFV_NODE_STREAM_AUTO_OPEN: !1,
	MFV_PREVIEW_METHOD: "taesd",
	RT_HYDRATE_CONCURRENCY: 2,
	RT_HYDRATE_QUEUE_MAX: 100,
	RT_HYDRATE_SEEN_MAX: 2e4,
	RT_HYDRATE_PRUNE_BUDGET: 250,
	RT_HYDRATE_SEEN_TTL_MS: 600 * 1e3,
	VIEWER_META_TTL_MS: 3e4,
	VIEWER_META_MAX_ENTRIES: 500,
	WORKFLOW_MINIMAP_ENABLED: !0,
	WATCHER_DEBOUNCE_MS: 3e3,
	WATCHER_DEDUPE_TTL_MS: 3e3,
	DELETE_CONFIRMATION: !0,
	DEBUG_VERBOSE_ERRORS: !1
}), O = { ...D };
//#endregion
export { i as _, w as a, _ as c, g as d, x as f, r as g, S as h, m as i, C as l, h as m, D as n, v as o, b as p, p as r, E as s, O as t, T as u, o as v, s as y };
