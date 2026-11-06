import { t as e } from "./rolldown-runtime-CGnMp29N.js";
import { a as t, n, s as r } from "./graphTraversal-DTdQWkn5.js";
// ui/app/settingsStore.ts
var i = "mjrSettings", a = "mjrMinimapSettings";
// ui/utils/ids.ts
function o(e) {
	try {
		return String(e ?? "").trim();
	} catch {
		return "";
	}
}
var s = 0;
function c(e) {
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
function l(e = "", t = 16) {
	let n = c(t);
	if (!n) throw Error("Secure token generation requires crypto.getRandomValues().");
	return `${String(e || "")}${n}`;
}
function u(e = "", t = 8) {
	let n = c(t);
	return n ? `${String(e || "")}${n}` : (s += 1, `${String(e || "")}${Date.now().toString(36)}_${s.toString(36)}`);
}
function d(e) {
	let t = o(e);
	if (!t || !/^\d+$/.test(t)) return "";
	try {
		let e = Number(t);
		return !Number.isSafeInteger(e) || e <= 0 ? "" : String(e);
	} catch {
		return "";
	}
}
function f(e) {
	return d(e);
}
function p(e) {
	try {
		if (!e) return "";
		let t = e, n = t.file_info;
		return o(t.root_id ?? t.rootId ?? t.custom_root_id ?? t.customRootId ?? t.customRoot ?? n?.root_id ?? n?.rootId ?? "");
	} catch {
		return "";
	}
}
// ui/utils/path.ts
function m(e) {
	return String(e || "").replace(/\\/g, "/");
}
function h(e) {
	let t = m(e).trim();
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
function g(e) {
	return /^[a-zA-Z]:\//.test(String(e || ""));
}
// ui/api/endpoints.ts
var _ = 200, v = 0, y = {
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
	METADATA_CATALOG: "/mjr/am/metadata/catalog",
	METADATA_KEYS: "/mjr/am/metadata/keys",
	METADATA_PARSER_VERSION: "/mjr/am/metadata/parser-version",
	WORKFLOW_QUICK: "/mjr/am/workflow-quick",
	RETRY_SERVICES: "/mjr/am/retry-services",
	STAGE_TO_INPUT: "/mjr/am/stage-to-input",
	OPEN_IN_FOLDER: "/mjr/am/open-in-folder",
	COLLECT_FILES: "/mjr/am/collect-files",
	TOOLS_STATUS: "/mjr/am/tools/status",
	SETTINGS_OUTPUT_DIRECTORY: "/mjr/am/settings/output-directory",
	SETTINGS_INPUT_DIRECTORY: "/mjr/am/settings/input-directory",
	SETTINGS_INDEX_DIRECTORY: "/mjr/am/settings/index-directory",
	SETTINGS_WORKFLOW_ROOTS: "/mjr/am/settings/workflow-roots",
	SETTINGS_METADATA_FALLBACK: "/mjr/am/settings/metadata-fallback",
	SETTINGS_VECTOR_SEARCH: "/mjr/am/settings/vector-search",
	SETTINGS_VECTOR_SEARCH_UNLOAD: "/mjr/am/settings/vector-search/unload",
	SETTINGS_EXECUTION_GROUPING: "/mjr/am/settings/execution-grouping",
	SETTINGS_HUGGINGFACE: "/mjr/am/settings/huggingface",
	SETTINGS_AI_LOGGING: "/mjr/am/settings/ai-logging",
	SETTINGS_ROUTE_LOGGING: "/mjr/am/settings/route-logging",
	SETTINGS_STARTUP_LOGGING: "/mjr/am/settings/startup-logging",
	SETTINGS_LTXAV_RGB_FALLBACK: "/mjr/am/settings/ltxav-rgb-fallback",
	SETTINGS_JXL: "/mjr/am/settings/jxl",
	SETTINGS_BROWSER_SHOW_FOLDERS: "/mjr/am/settings/browser-show-folders",
	VIEW: "/view",
	CUSTOM_VIEW: "/mjr/am/custom-view",
	VIEWER_INFO: "/mjr/am/viewer/info",
	VIEWER_RESOURCE: "/mjr/am/viewer/resource",
	THUMBNAIL: "/mjr/am/thumbnail",
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
	TRASH: "/mjr/am/trash",
	TRASH_EMPTY: "/mjr/am/trash/empty",
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
	AUDIT: "/mjr/am/audit",
	WORKFLOWS_CONTENT: "/mjr/am/workflows/content",
	WORKFLOWS_VALIDATE: "/mjr/am/workflows/validate",
	WORKFLOWS_VERSIONS: "/mjr/am/workflows/versions",
	WORKFLOWS_DIFF: "/mjr/am/workflows/diff",
	WORKFLOWS_SAVE: "/mjr/am/workflows/save",
	WORKFLOWS_DUPLICATE: "/mjr/am/workflows/duplicate",
	WORKFLOWS_MOVE: "/mjr/am/workflows/move",
	WORKFLOWS_DELETE: "/mjr/am/workflows/delete",
	WORKFLOWS_MARK_LOADED: "/mjr/am/workflows/mark-loaded",
	WORKFLOWS_FAVORITE: "/mjr/am/workflows/favorite",
	WORKFLOWS_INFO: "/mjr/am/workflows/info",
	WORKFLOWS_THUMBNAIL_CANDIDATES: "/mjr/am/workflows/thumbnail-candidates",
	WORKFLOWS_MODEL_FAMILIES: "/mjr/am/workflows/model-families",
	WORKFLOWS_TAGS: "/mjr/am/workflows/tags",
	WORKFLOWS_THUMBNAIL_SET: "/mjr/am/workflows/thumbnail/set",
	WORKFLOWS_OPEN_ROOT: "/mjr/am/workflows/open-root"
};
function b(e, t = {}) {
	let n = String(e || ""), r = () => n.includes("?") ? "&" : "?", i = (e) => {
		n += r() + e;
	}, { subfolder: a = null, kind: o = null, hasWorkflow: s = null, minRating: c = null, minSizeMB: l = null, maxSizeMB: u = null, minWidth: d = null, minHeight: f = null, maxWidth: p = null, maxHeight: m = null, workflowType: h = null, workflowId: g = null, workflowModel: _ = null, runsOn: v = null, dateRange: y = null, dateExact: b = null } = t || {};
	return a && i(`subfolder=${encodeURIComponent(String(a))}`), o && i(`kind=${encodeURIComponent(o)}`), s != null && i(`has_workflow=${encodeURIComponent(s ? "true" : "false")}`), c != null && Number(c) > 0 && i(`min_rating=${encodeURIComponent(String(c))}`), l != null && Number(l) > 0 && i(`min_size_mb=${encodeURIComponent(String(l))}`), u != null && Number(u) > 0 && i(`max_size_mb=${encodeURIComponent(String(u))}`), d != null && Number(d) > 0 && i(`min_width=${encodeURIComponent(String(d))}`), f != null && Number(f) > 0 && i(`min_height=${encodeURIComponent(String(f))}`), p != null && Number(p) > 0 && i(`max_width=${encodeURIComponent(String(p))}`), m != null && Number(m) > 0 && i(`max_height=${encodeURIComponent(String(m))}`), h && i(`workflow_type=${encodeURIComponent(String(h))}`), g && i(`workflow_id=${encodeURIComponent(String(g))}`), _ && i(`workflow_model=${encodeURIComponent(String(_))}`), v && i(`runs_on=${encodeURIComponent(String(v))}`), y && i(`date_range=${encodeURIComponent(String(y))}`), b && i(`date_exact=${encodeURIComponent(String(b))}`), n;
}
function x(e, t = null, n = "output") {
	let r = String(e || "").trim();
	if (!r) return "";
	let i = `${y.VIEW}?filename=${encodeURIComponent(r)}`;
	return t && (i += `&subfolder=${encodeURIComponent(t)}`), i += `&type=${encodeURIComponent(n)}`, i;
}
function ee(e, t = 384) {
	let n = String(e?.filepath || e?.path || e?.file_path || "").trim();
	if (!n) return "";
	let r = Math.max(64, Math.min(1024, Math.floor(Number(t) || 384)));
	return `${y.THUMBNAIL}?filepath=${encodeURIComponent(n)}&size=${encodeURIComponent(String(r))}`;
}
function te(e = {}) {
	let { q: t = "*", limit: n = _, offset: r = v, scope: i = "output", subfolder: a = "", customRootId: o = null, kind: s = null, hasWorkflow: c = null, minRating: l = null, minSizeMB: u = null, maxSizeMB: d = null, resolutionCompare: f = null, minWidth: p = null, minHeight: m = null, maxWidth: h = null, maxHeight: g = null, workflowType: x = null, workflowId: ee = null, workflowModel: te = null, runsOn: ne = null, dateRange: re = null, dateExact: ie = null, sort: ae = null, cursor: oe = null, includeTotal: se = !0, groupStacks: ce = !1, metadataMode: le = null } = e, S = `${y.LIST}?q=${encodeURIComponent(t)}&limit=${n}&offset=${r}&scope=${encodeURIComponent(i)}`;
	return a && (S += `&subfolder=${encodeURIComponent(a)}`), o ? S += `&custom_root_id=${encodeURIComponent(o)}` : String(i || "").toLowerCase() === "custom" && (S += "&browser_mode=1"), S = b(S, {
		kind: s,
		hasWorkflow: c,
		minRating: l,
		minSizeMB: u,
		maxSizeMB: d,
		minWidth: p,
		minHeight: m,
		maxWidth: h,
		maxHeight: g,
		workflowType: x,
		workflowId: ee,
		workflowModel: te,
		runsOn: ne,
		dateRange: re,
		dateExact: ie
	}), f && (S += `&resolution_compare=${encodeURIComponent(String(f))}`), ae && (S += `&sort=${encodeURIComponent(String(ae))}`), oe && (S += `&cursor=${encodeURIComponent(String(oe))}`), se === !1 && (S += "&include_total=0"), ce && (S += "&group_stacks=1"), le && (S += `&metadata_mode=${encodeURIComponent(String(le).toUpperCase())}`), S;
}
function ne(e, t = "", n = "") {
	let r = String(e || "").trim(), i = String(n || "").trim();
	if (!r || !i) return "";
	let a = `${y.CUSTOM_VIEW}?root_id=${encodeURIComponent(i)}&filename=${encodeURIComponent(r)}`;
	return t && (a += `&subfolder=${encodeURIComponent(t)}`), a;
}
function re(e) {
	return `${y.BATCH_ZIP_CREATE}/${encodeURIComponent(String(e || ""))}`;
}
function ie(e) {
	return `${y.STACKS}/${encodeURIComponent(String(e || ""))}`;
}
function ae(e, t = {}) {
	let n = `${ie(e)}/members`, r = Number(t?.limit || 0);
	return Number.isFinite(r) && r > 0 && (n += `?limit=${encodeURIComponent(String(Math.floor(r)))}`), n;
}
function oe(e, t = {}) {
	let n = String(e || "").trim(), r = `${y.STACKS}/by-node/${encodeURIComponent(n)}/members`, i = [], a = String(t?.jobId || t?.job_id || "").trim();
	a && i.push(`job_id=${encodeURIComponent(a)}`), t?.latest === !1 && i.push("latest=0");
	let o = Number(t?.limit || 0);
	return Number.isFinite(o) && o > 0 && i.push(`limit=${encodeURIComponent(String(Math.trunc(o)))}`), i.length && (r += `?${i.join("&")}`), r;
}
function se(e, t = "") {
	let n = e && typeof e == "object" ? e : {}, r = String(t || "").trim();
	if (!r) return "";
	let i = f(n?.asset_id ?? n?.id ?? null), a = `${y.VIEWER_RESOURCE}?relpath=${encodeURIComponent(r)}`;
	if (i) return `${a}&asset_id=${encodeURIComponent(i)}`;
	let o = m(String(n?.filepath || n?.path || n?.fullpath || n?.full_path || n?.file_info?.filepath || n?.file_info?.path || "").trim());
	if (o) return `${a}&filepath=${encodeURIComponent(o)}`;
	let s = String(n?.filename || n?.name || n?.file_info?.filename || "").trim();
	if (!s) return "";
	a += `&filename=${encodeURIComponent(s)}`;
	let c = String(n?.subfolder || n?.file_info?.subfolder || "").trim();
	c && (a += `&subfolder=${encodeURIComponent(c)}`);
	let l = String(n?.type || n?.file_info?.type || "").trim().toLowerCase();
	l && l !== "custom" && (a += `&type=${encodeURIComponent(l)}`);
	let u = String(p(n) || n?.root_id || n?.custom_root_id || "").trim();
	return u && (a += `&root_id=${encodeURIComponent(u)}`), a;
}
function ce(e = {}) {
	let { scope: t = "output", customRootId: n = null, month: r = "", kind: i = null, hasWorkflow: a = null, minRating: o = null } = e, s = `${y.DATE_HISTOGRAM}?scope=${encodeURIComponent(t)}&month=${encodeURIComponent(String(r || ""))}`;
	return n && (s += `&custom_root_id=${encodeURIComponent(n)}`), b(s, {
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
		workflowId: e.workflowId ?? null,
		workflowModel: e.workflowModel ?? null,
		runsOn: e.runsOn ?? null,
		dateRange: e.dateRange ?? null,
		dateExact: e.dateExact ?? null
	});
}
function le(e) {
	let t = e?.mtime, n = (e) => !e || !t ? e : `${e}${e.includes("?") ? "&" : "?"}v=${encodeURIComponent(t)}`, r = m(String(e?.filepath || e?.path || e?.fullpath || e?.full_path || e?.file_info?.filepath || e?.file_info?.path || "").trim()), i = String(e?.type || e?.file_info?.type || "").toLowerCase().trim(), a = Number(e?.id ?? e?.asset_id);
	if (!(i === "temp" || r.toLowerCase().includes("/temp/")) && Number.isSafeInteger(a) && a > 0) return n(`/mjr/am/viewer/asset/${encodeURIComponent(String(a))}`);
	let o = String(e?.filename || e?.name || e?.file_info?.filename || "").trim(), s = String(e?.subfolder || e?.file_info?.subfolder || "").trim(), c = ((e) => {
		let t = {
			type: "",
			subfolder: "",
			filename: ""
		}, n = m(e);
		if (!n) return t;
		let r = n.toLowerCase(), i = r.indexOf("/output/"), a = r.indexOf("/input/"), o = r.indexOf("/temp/"), s = -1;
		if (i >= 0 ? (t.type = "output", s = i + 8) : r.startsWith("output/") ? (t.type = "output", s = 7) : a >= 0 ? (t.type = "input", s = a + 7) : r.startsWith("input/") ? (t.type = "input", s = 6) : o >= 0 ? (t.type = "temp", s = o + 6) : r.startsWith("temp/") && (t.type = "temp", s = 5), s >= 0) {
			let e = n.slice(s), r = e.lastIndexOf("/");
			r >= 0 ? (t.subfolder = e.slice(0, r), t.filename = e.slice(r + 1)) : t.filename = e;
		} else t.filename = h(n).filename;
		return t;
	})(r);
	if (c.filename && c.type && (o = c.filename, s = c.subfolder), !s && o.includes("/")) {
		let e = o.lastIndexOf("/");
		e > 0 && (s = o.slice(0, e), o = o.slice(e + 1));
	}
	if (!o && c.filename && (o = c.filename), !s && c.subfolder && (s = c.subfolder), !o) return "";
	let l = String(e?.type || e?.file_info?.type || "").toLowerCase().trim();
	l !== "input" && l !== "output" && l !== "temp" && l !== "custom" && (l = ""), !l && c.type && (l = c.type), !l && r && (r.includes("/input/") || r.startsWith("input/") ? l = "input" : r.includes("/output/") || r.startsWith("output/") ? l = "output" : (r.includes("/temp/") || r.startsWith("temp/")) && (l = "temp")), l ||= "output";
	let u = r.includes("/output/") || r.includes("/input/") || r.includes("/temp/") || r.startsWith("output/") || r.startsWith("input/") || r.startsWith("temp/"), d = g(s) || s.startsWith("/");
	if (r && l !== "custom" && (d || !u)) return n(S(r, { inline: !0 }));
	if (l === "custom") {
		let t = String(p(e) || "").trim();
		if (t) return n(ne(o, s, t));
		if (r) return n(`${y.CUSTOM_VIEW}?filepath=${encodeURIComponent(r)}&browser_mode=1`);
		let i = c.type || "output";
		return n(x(o, s, i));
	}
	return (r.includes("/output/") || r.startsWith("output/")) && (l = "output"), (r.includes("/input/") || r.startsWith("input/")) && (l = "input"), (r.includes("/temp/") || r.startsWith("temp/")) && (l = "temp"), n(x(o, s, l));
}
function S(e, t = {}) {
	if (!e) return "";
	let n = !!t?.inline, r = `${y.DOWNLOAD}?filepath=${encodeURIComponent(e)}`;
	return n && (r += "&preview=1"), r;
}
function ue(e) {
	let t = String(e || "").trim();
	return t ? `${y.WORKFLOWS_CONTENT}?filepath=${encodeURIComponent(t)}` : "";
}
function de(e) {
	let t = String(e || "").trim();
	return t ? `${y.WORKFLOWS_VALIDATE}?filepath=${encodeURIComponent(t)}` : "";
}
function fe(e) {
	let t = String(e || "").trim();
	return t ? `${y.WORKFLOWS_VERSIONS}?filepath=${encodeURIComponent(t)}` : "";
}
function pe(e, t = "") {
	let n = String(e || "").trim();
	if (!n) return "";
	let r = `${y.WORKFLOWS_DIFF}?filepath=${encodeURIComponent(n)}`, i = String(t || "").trim();
	return i && (r += `&version_filepath=${encodeURIComponent(i)}`), r;
}
function me(e) {
	return e ? `${y.DOWNLOAD_CLEAN}?filepath=${encodeURIComponent(e)}` : "";
}
// ui/api/fetchUtils.ts
var he = /* @__PURE__ */ new Set([
	"POST",
	"PUT",
	"DELETE",
	"PATCH"
]), ge = 2e4, _e = 3e5, ve = 3, ye = 400, be = 1e4, xe = "/mjr/am/settings/security/bootstrap-token", Se = "/mjr/am/", Ce = /* @__PURE__ */ new Map();
function we(e) {
	return new Promise((t) => setTimeout(t, e));
}
function C(e) {
	return he.has(String(e || "").trim().toUpperCase());
}
function Te(e) {
	try {
		let t = String(e || "").trim();
		if (!t) return "";
		if (t.startsWith("http://") || t.startsWith("https://")) {
			let e = typeof globalThis < "u" && globalThis?.location?.origin ? String(globalThis.location.origin) : "http://localhost";
			return new URL(t, e).pathname || "";
		}
		return t.split("?")[0] || "";
	} catch {
		return "";
	}
}
function Ee(e) {
	return Te(e).startsWith(Se);
}
function De(e) {
	return Te(e) === xe;
}
function Oe(e) {
	try {
		if (!e) return !1;
		let t = String(e.name || "");
		if (t === "AbortError") return !1;
		let n = String(e.message || "").toLowerCase();
		return t === "TypeError" ? n.includes("failed to fetch") || n.includes("networkerror") || n.includes("load failed") || n.includes("fetch") || n.includes("network") : n.includes("fetch") || n.includes("network") || n.includes("failed");
	} catch {
		return !1;
	}
}
function ke(e) {
	try {
		let t = String(e?.headers?.get?.("x-request-id") || "").trim(), n = String(e?.headers?.get?.("retry-after") || "").trim(), r = null;
		if (n) {
			let e = Number(n);
			if (Number.isFinite(e) && e >= 0) r = e;
			else {
				let e = Date.parse(n);
				Number.isFinite(e) && (r = Math.max(0, (e - Date.now()) / 1e3));
			}
		}
		return {
			requestId: t,
			retryAfterSeconds: r
		};
	} catch {
		return {
			requestId: "",
			retryAfterSeconds: null
		};
	}
}
function Ae(e, t) {
	if (!e || typeof e != "object") return e;
	let { requestId: n, retryAfterSeconds: r } = ke(t);
	return n && !("request_id" in e) && (e.request_id = n), r !== null && !("retry_after" in e) && (e.retry_after = r), e;
}
function je(e = {}) {
	try {
		let t = Number(e?.timeoutMs);
		return Number.isFinite(t) ? Math.max(1e3, Math.min(_e, Math.floor(t))) : ge;
	} catch {
		return ge;
	}
}
function Me(e = {}) {
	let t = e?.signal || null;
	if (typeof AbortController > "u") return {
		signal: t || void 0,
		timeoutMs: je(e),
		cleanup: () => {}
	};
	let n = je(e), r = new AbortController(), i = null, a = () => {
		try {
			i &&= (clearTimeout(i), null);
		} catch (e) {
			console.debug?.(e);
		}
		try {
			r.abort();
		} catch (e) {
			console.debug?.(e);
		}
	};
	try {
		i = setTimeout(() => {
			try {
				r.abort();
			} catch (e) {
				console.debug?.(e);
			}
		}, n);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		t && (t.aborted ? a() : t.addEventListener("abort", a, { once: !0 }));
	} catch (e) {
		console.debug?.(e);
	}
	return {
		signal: r.signal,
		timeoutMs: n,
		cleanup: () => {
			try {
				i && clearTimeout(i);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				t && t.removeEventListener("abort", a);
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
}
function Ne(e, t, n = {}) {
	let r = String(e || "GET").trim().toUpperCase(), i = String(t || "").trim();
	return !r || !i ? "" : `${r}:${i}:timeout=${je(n)}`;
}
function Pe(e, t) {
	let n = String(e || "").trim();
	if (!n) return t();
	if (Ce.has(n)) return Ce.get(n);
	let r = Promise.resolve().then(() => t()).finally(() => {
		try {
			Ce.delete(n);
		} catch (e) {
			console.debug?.(e);
		}
	});
	return Ce.set(n, r), r;
}
function Fe(e, t, n) {
	if (C(t)) try {
		e instanceof Headers ? e.has("X-Requested-With") || e.set("X-Requested-With", "XMLHttpRequest") : e["X-Requested-With"] ||= "XMLHttpRequest";
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e instanceof Headers ? e.has("X-MJR-OBS") || e.set("X-MJR-OBS", n ? "on" : "off") : "X-MJR-OBS" in e || (e["X-MJR-OBS"] = n ? "on" : "off");
	} catch (e) {
		console.debug?.(e);
	}
}
function Ie(e, t) {
	if (t) try {
		e instanceof Headers ? (e.has("X-MJR-Token") || e.set("X-MJR-Token", t), e.has("Authorization") || e.set("Authorization", `Bearer ${t}`)) : ("X-MJR-Token" in e || (e["X-MJR-Token"] = t), "Authorization" in e || (e.Authorization = `Bearer ${t}`));
	} catch (e) {
		console.debug?.(e);
	}
}
async function Le(e, t, n, r, { ensureWriteAuthToken: i, normalizeWriteAuthFailure: a, fetchAPI: o, options: s, retryCount: c }) {
	let l = e.headers.get("content-type") || "";
	if (!l.includes("application/json")) return !r && C(n) && Ee(t) && !De(t) && Number(e.status || 0) === 401 && await i({
		force: !0,
		allowCookieRefresh: !0
	}) ? await o(t, {
		...s,
		_authRetryDone: !0
	}, c) : Ae({
		ok: !1,
		error: `Server returned non-JSON response (${e.status})`,
		code: "INVALID_RESPONSE",
		status: e.status,
		content_type: l,
		data: null
	}, e);
	let u = await e.json().catch((e) => (console.debug?.("[MJR API] JSON parse error:", e), null));
	if (typeof u != "object" || !u || Array.isArray(u) || typeof u.ok != "boolean") return Ae({
		ok: !1,
		error: "Invalid response structure",
		code: "INVALID_RESPONSE",
		status: e.status,
		data: null
	}, e);
	if (u.ok === !0 && Number(e.status || 0) >= 400 && (u = {
		...u,
		ok: !1,
		error: u.error || `Server reported success with an HTTP error status (${e.status})`,
		code: "INVALID_RESPONSE"
	}), !("status" in u)) try {
		u.status = e.status;
	} catch (e) {
		console.debug?.(e);
	}
	Ae(u, e);
	let d = Number(u?.status || e.status || 0), f = d === 429 || d === 503 || d === 504;
	if (!u?.ok && f && n === "GET" && c < ve && !s?.signal?.aborted) {
		let e = Number(u?.retry_after);
		return await we(Number.isFinite(e) ? Math.min(be, Math.max(0, e * 1e3)) : ye * (c + 1)), await o(t, s, c + 1);
	}
	return !r && C(n) && !De(t) && !u?.ok && (String(u?.code || "").toUpperCase() === "AUTH_REQUIRED" || Number(u?.status || 0) === 401) && await i({
		force: !0,
		allowCookieRefresh: !0
	}) ? await o(t, {
		...s,
		_authRetryDone: !0
	}, c) : (C(n) && Ee(t) && !De(t) && (u = a(u)), u);
}
function Re({ readObsEnabled: e = () => !1, readAuthToken: t = () => "", ensureWriteAuthToken: n = async () => "", normalizeWriteAuthFailure: r = (e) => e, trackApiCall: i = null } = {}) {
	async function a(o, s = {}, c = 0) {
		let l = typeof performance < "u" ? performance.now() : Date.now(), u = Me(s), d = null;
		try {
			let i = (s.method || "GET").toUpperCase(), l = !!s?._authRetryDone, f = typeof Headers < "u" ? new Headers(s.headers || {}) : { ...s.headers };
			Fe(f, i, !!e());
			let p = t();
			if (!p && C(i) && Ee(o) && !De(o)) {
				try {
					await n();
				} catch (e) {
					console.debug?.(e);
				}
				p = t();
			}
			Ie(f, p);
			let m = {
				...s,
				headers: f,
				signal: u.signal
			};
			try {
				delete m._authRetryDone, delete m.timeoutMs;
			} catch (e) {
				console.debug?.(e);
			}
			return d = await Le(await fetch(o, m), o, i, l, {
				ensureWriteAuthToken: n,
				normalizeWriteAuthFailure: r,
				fetchAPI: a,
				options: s,
				retryCount: c
			}), d;
		} catch (e) {
			try {
				if (String(e?.name || "") === "AbortError") return s?.signal && s.signal.aborted ? {
					ok: !1,
					error: "Aborted",
					code: "ABORTED",
					data: null
				} : {
					ok: !1,
					error: `Request timed out after ${u.timeoutMs}ms`,
					code: "TIMEOUT",
					data: null,
					timeout_ms: u.timeoutMs
				};
			} catch (e) {
				console.debug?.(e);
			}
			let t = String(s?.method || "GET").toUpperCase();
			if ((t === "GET" || t === "HEAD") && c < ve && Oe(e)) {
				try {
					await we(ye * (c + 1));
				} catch (e) {
					console.debug?.(e);
				}
				return await a(o, s, c + 1);
			}
			return {
				ok: !1,
				error: e?.message || String(e || "Network error"),
				code: "NETWORK_ERROR",
				data: null,
				retries: c
			};
		} finally {
			try {
				let e = (typeof performance < "u" ? performance.now() : Date.now()) - l;
				typeof i == "function" ? i(e, !d?.ok) : typeof window < "u" && window.MajoorMetrics && window.MajoorMetrics.trackApiCall(e, !d?.ok);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				u.cleanup?.();
			} catch (e) {
				console.debug?.(e);
			}
		}
	}
	async function o(e, t = {}) {
		return Pe(t?.dedupe === !1 || t?.signal ? "" : String(t?.dedupeKey || "").trim() || Ne("GET", e, t), () => a(e, {
			...t,
			method: "GET"
		}));
	}
	async function s(e, t, n = {}) {
		return a(e, {
			...n,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...n.headers
			},
			body: JSON.stringify(t)
		});
	}
	return {
		fetchAPI: a,
		get: o,
		post: s
	};
}
// ui/utils/ttlCache.ts
function w({ ttlMs: e = 0, maxSize: t = 100, now: n = () => Date.now() } = {}) {
	let r = /* @__PURE__ */ new Map();
	function i() {
		try {
			let e = Number(n());
			return Number.isFinite(e) ? e : Date.now();
		} catch {
			return Date.now();
		}
	}
	function a() {
		try {
			let t = Number(typeof e == "function" ? e() : e);
			return Number.isFinite(t) ? Math.max(0, Math.floor(t)) : 0;
		} catch {
			return 0;
		}
	}
	function o() {
		try {
			let e = Number(t);
			return Number.isFinite(e) ? Math.max(1, Math.floor(e)) : 1;
		} catch {
			return 1;
		}
	}
	function s(e, t, n) {
		return !e || n > 0 && t - Number(e.at || 0) > n;
	}
	function c(e = i(), t = a()) {
		if (t > 0) for (let [n, i] of r.entries()) s(i, e, t) && r.delete(n);
	}
	function l() {
		let e = o();
		for (; r.size > e;) {
			let e = r.keys().next().value;
			if (e === void 0) break;
			r.delete(e);
		}
	}
	function u(e, t) {
		r.delete(e), r.set(e, t);
	}
	return {
		get(e) {
			let t = i(), n = a();
			c(t, n);
			let o = r.get(e);
			if (o) {
				if (s(o, t, n)) r.delete(e);
				else return o.value;
			}
		},
		has(e) {
			return this.get(e) !== void 0;
		},
		set(e, t, n = {}) {
			let o = Number(n?.at), s = {
				value: t,
				at: Number.isFinite(o) ? o : i()
			};
			return r.has(e) ? u(e, s) : r.set(e, s), c(i(), a()), l(), t;
		},
		delete(e) {
			return r.delete(e);
		},
		clear() {
			r.clear();
		},
		prune() {
			return c(i(), a()), l(), r.size;
		},
		keys() {
			return this.prune(), Array.from(r.keys());
		},
		entries() {
			return this.prune(), Array.from(r.entries()).map(([e, t]) => [e, t.value]);
		},
		get size() {
			return this.prune(), r.size;
		}
	};
}
// ui/app/comfyApiBridge.ts
var ze = null, Be = null, Ve = 50;
function T(e) {
	return !!e && typeof e == "object";
}
function He(e, t) {
	try {
		if (!e || typeof e != "object" && typeof e != "function") return null;
		let n = Object.getOwnPropertyDescriptor(e, t);
		return !n || !("value" in n) ? null : n.value;
	} catch {
		return null;
	}
}
function E(e) {
	return T(e) ? typeof e.fetchApi == "function" || typeof e.apiURL == "function" || T(e.settings) : !1;
}
function Ue(e) {
	return T(e) ? T(e.ui) || T(e.canvas) || T(e.graph) || typeof e.loadGraphData == "function" || E(e.api) : !1;
}
function We(e) {
	return Ue(e) && (ze = e), ze;
}
function Ge(e) {
	return E(e) && (Be = e), Be;
}
function D(e) {
	if (E(Be)) return Be;
	let t = T(e) ? e : O(), n = t?.api || t?.ui?.api || t?.ui?.app?.api || null;
	if (E(n)) return n;
	try {
		let e = typeof window < "u" ? He(window, "api") : null;
		if (E(e)) return e;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let e = typeof globalThis < "u" ? He(globalThis, "api") : null;
		if (E(e)) return e;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}
async function Ke(e, t = null, n) {
	let r = D(n);
	return r && typeof r.fetchApi == "function" ? r.fetchApi(e, t || void 0) : fetch(e, {
		credentials: "include",
		...t || {}
	});
}
function O() {
	if (Ue(ze)) return ze;
	try {
		let e = typeof globalThis < "u" ? He(globalThis, "app") : null;
		if (Ue(e)) return e;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		let e = typeof window < "u" ? He(window, "app") : null;
		if (Ue(e)) return e;
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}
function qe(e) {
	let t = T(e) ? e : O();
	return !t || typeof t != "object" ? null : t?.extensionManager?.setting || t?.ui?.settings || t?.settings || t?.ui?.api?.settings || t?.api?.settings || null;
}
function Je(e, t) {
	let n = qe(e);
	if (!n) return null;
	for (let e of [
		"getSettingValue",
		"getSetting",
		"get"
	]) try {
		if (typeof n?.[e] == "function") {
			let r = n[e](t);
			if (r !== void 0) return r;
		}
	} catch {}
	try {
		let e = n?.settings || n?.values || null;
		if (e instanceof Map && e.has(t)) return e.get(t);
		if (e && typeof e == "object" && Object.hasOwn(e, t)) return e[t];
	} catch {
		return null;
	}
	return null;
}
function Ye(e, t, n) {
	let r = qe(e);
	if (!r) return !1;
	for (let e of [
		"setSettingValue",
		"setSetting",
		"set",
		"updateSetting"
	]) try {
		if (typeof r?.[e] == "function") {
			let i = r[e](t, n);
			return i && typeof i.catch == "function" && i.catch((e) => {
				console.warn?.(`[Majoor] Unable to write ComfyUI setting ${t}`, e);
			}), !0;
		}
	} catch {}
	try {
		let e = r?.settings || r?.values || null;
		if (e instanceof Map) return e.set(t, n), !0;
		if (e && typeof e == "object") return e[t] = n, !0;
	} catch {
		return !1;
	}
	return !1;
}
function k(e) {
	let t = T(e) ? e : O();
	return t?.extensionManager || t?.ui?.extensionManager || null;
}
function Xe(e) {
	let t = T(e) ? e : O(), n = k(e);
	return n?.sidebarTabStore || n?.sidebarTab || n?.workspaceStore?.sidebarTab || t?.workspaceStore?.sidebarTab || t?.ui?.workspaceStore?.sidebarTab || t?.ui?.app?.workspaceStore?.sidebarTab || t?.workspace?.sidebarTab || t?.ui?.workspace?.sidebarTab || null;
}
function Ze(e) {
	return T(e) && (e?.bottomPanel || e?.bottomPanelStore) || null;
}
function Qe(e) {
	let t = k(e)?.toast || null;
	return t && (typeof t.add == "function" || typeof t.success == "function" || typeof t.info == "function") ? t : null;
}
function $e(e) {
	let t = k(e)?.dialog || null;
	return t && (typeof t.alert == "function" || typeof t.confirm == "function" || typeof t.prompt == "function") ? t : null;
}
function et(e, t) {
	let n = T(e) ? e : O(), r = k(n), i = Xe(n), a = String(t || "").trim();
	if (!a) return !1;
	let o = [
		"activateSidebarTab",
		"openSidebarTab",
		"selectSidebarTab",
		"setActiveSidebarTab",
		"showSidebarTab"
	];
	for (let e of [r, i]) if (e) for (let t of o) try {
		if (typeof e?.[t] == "function") return e[t](a), !0;
	} catch (e) {
		console.debug?.(e);
	}
	try {
		if (String(i?.activeSidebarTabId || i?.activeSidebarTab?.id || r?.activeSidebarTabId || r?.activeSidebarTab?.id || "").trim() === a) return !0;
		if (typeof i?.toggleSidebarTab == "function") return i.toggleSidebarTab(a), !0;
	} catch (e) {
		console.debug?.(e);
	}
	return !1;
}
function tt(e, t) {
	let n = k(e), r = t && typeof t == "object" ? { ...t } : null;
	if (!n || !r) return !1;
	for (let e of ["registerCommand", "addCommand"]) try {
		if (typeof n?.[e] == "function") return n[e](r), !0;
	} catch (e) {
		console.debug?.(e);
	}
	return !1;
}
function nt(e, t) {
	let n = k(e), r = t && typeof t == "object" ? { ...t } : null;
	if (!n || !r) return !1;
	for (let e of ["registerKeybinding", "addKeybinding"]) try {
		if (typeof n?.[e] == "function") return n[e](r), !0;
	} catch (e) {
		console.debug?.(e);
	}
	return !1;
}
function rt(e, t) {
	try {
		let n = T(e) ? e : O(), r = n?.extensionManager || n?.ui?.extensionManager || null, i = Xe(n), a = n?.workspaceStore || n?.ui?.workspaceStore || n?.ui?.app?.workspaceStore || null;
		for (let e of [r, i]) if (e && typeof e.registerSidebarTab == "function") return e.registerSidebarTab(t), !0;
		if (a && typeof a.registerSidebarTab == "function") return a.registerSidebarTab(t), !0;
	} catch (e) {
		console.debug?.(e);
	}
	return !1;
}
function it(e, t) {
	try {
		let n = k(T(e) ? e : O()), r = Ze(n), i = String(t || "").trim();
		if (!i) return !1;
		let a = [
			"activateBottomPanelTab",
			"openBottomPanelTab",
			"selectBottomPanelTab",
			"setActiveBottomPanelTab",
			"showBottomPanelTab",
			"toggleBottomPanelTab"
		];
		for (let e of [n, r]) if (e) {
			if (String(e?.activeBottomPanelTabId || e?.activeTabId || e?.activeTab?.id || "").trim() === i) return !0;
			for (let t of a) if (typeof e?.[t] == "function") return e[t](i), !0;
		}
	} catch (e) {
		console.debug?.(e);
	}
	return !1;
}
function at(e) {
	return new Promise((t) => setTimeout(t, Math.max(0, Number(e) || 0)));
}
function ot(e, t) {
	try {
		console.warn(`[Majoor] ${e} timed out after ${Math.max(0, Number(t) || 0)}ms`);
	} catch (e) {
		console.debug?.(e);
	}
}
async function st({ timeoutMs: e = 4e3, intervalMs: t = Ve, warnOnTimeout: n = !0, rejectOnTimeout: r = !1 } = {}) {
	let i = Date.now(), a = Math.max(0, Number(e) || 0);
	for (; Date.now() - i < a;) {
		let e = O();
		if (e && typeof e == "object") return e;
		await at(t);
	}
	let o = O();
	if (o && typeof o == "object") return o;
	if (n && ot("waitForComfyApp", a), r) throw Error(`waitForComfyApp timeout after ${a}ms`);
	return null;
}
async function ct({ app: e = null, timeoutMs: t = 4e3, intervalMs: n = Ve, warnOnTimeout: r = !0, rejectOnTimeout: i = !1 } = {}) {
	let a = Date.now(), o = Math.max(0, Number(t) || 0);
	for (; Date.now() - a < o;) {
		let t = D(e || O());
		if (t) return t;
		await at(n);
	}
	let s = D(e || O());
	if (s) return s;
	if (r && ot("waitForComfyApi", o), i) throw Error(`waitForComfyApi timeout after ${o}ms`);
	return null;
}
// ui/app/hostAdapter.ts
var A = null, lt = [
	"selectionchange",
	"selection-change",
	"node-selected",
	"node-deselected",
	"node-selection-change"
];
function ut(e) {
	try {
		let t = Qe(A || O());
		t && t.add({
			severity: e?.severity ?? "info",
			summary: e?.summary ?? "",
			detail: e?.detail ?? "",
			life: e?.life ?? 4e3
		});
	} catch {}
}
function dt(e = null) {
	try {
		return Qe(e || A || O()) || null;
	} catch {
		return null;
	}
}
function ft(e = null) {
	try {
		return $e(e || A || O()) || null;
	} catch {
		return null;
	}
}
function pt(e, t, n = null) {
	try {
		return Je(e || A || O(), t) ?? n;
	} catch {
		return n;
	}
}
function mt(e, t, n) {
	try {
		return Ye(e || A || O(), t, n);
	} catch {
		return !1;
	}
}
function ht(e) {
	try {
		return rt(A || O(), e);
	} catch {
		return !1;
	}
}
function gt(e = null) {
	try {
		let t = k(e || A || O()), n = typeof t?.getSidebarTabs == "function" ? t.getSidebarTabs() : [];
		return Array.isArray(n) ? n.filter(Boolean) : [];
	} catch {
		return [];
	}
}
function _t(e, t = null) {
	try {
		let n = k(t || A || O());
		return !e || typeof n?.unregisterSidebarTab != "function" ? !1 : (n.unregisterSidebarTab(e), !0);
	} catch {
		return !1;
	}
}
function vt(e, t) {
	try {
		return rt(e || A || O(), t);
	} catch {
		return !1;
	}
}
function yt(e, t) {
	try {
		return et(e || A || O(), t);
	} catch {
		return !1;
	}
}
function bt(e, t) {
	try {
		return it(e || A || O(), t);
	} catch {
		return !1;
	}
}
function xt(e, t) {
	try {
		return tt(e || A || O(), t);
	} catch {
		return !1;
	}
}
function St(e, t) {
	try {
		return nt(e || A || O(), t);
	} catch {
		return !1;
	}
}
function Ct() {
	return A || O() || null;
}
function wt(e = null) {
	try {
		return D(e || A || O()) || null;
	} catch {
		return null;
	}
}
async function Tt(e = {}) {
	try {
		return await ct(e);
	} catch {
		return null;
	}
}
async function Et(e, t = null, n = null) {
	try {
		return await Ke(e, t, n || A || O());
	} catch {
		return fetch(e, {
			credentials: "include",
			...t || {}
		});
	}
}
function Dt(e, t, n) {
	if (!e || typeof e.addEventListener != "function") return null;
	try {
		e.addEventListener(t, n);
	} catch {
		return null;
	}
	return () => {
		try {
			e.removeEventListener?.(t, n);
		} catch (e) {
			console.debug?.(e);
		}
	};
}
function Ot(e, t = {}) {
	if (typeof e != "function") return null;
	let n = t.app || A || O(), r = n?.canvas;
	if (!r) return null;
	let i = [], a = !1, o = [
		r,
		n,
		n?.graph
	].filter((e, t, n) => e && n.indexOf(e) === t), s = () => {
		try {
			e();
		} catch (e) {
			console.debug?.(e);
		}
	};
	for (let e of o) for (let t of lt) {
		let n = Dt(e, t, s);
		n && (i.push(n), a = !0);
	}
	if (!a) {
		let e = Object.prototype.hasOwnProperty.call(r, "onNodeSelected"), t = Object.prototype.hasOwnProperty.call(r, "onSelectionChange"), n = Object.prototype.hasOwnProperty.call(r, "onNodeDeselected"), a = r.onNodeSelected, o = r.onSelectionChange, c = r.onNodeDeselected;
		r.onNodeSelected = function(e) {
			a?.call(this, e), s();
		}, r.onSelectionChange = function(e) {
			o?.call(this, e), s();
		}, r.onNodeDeselected = function(e) {
			c?.call(this, e), s();
		}, i.push(() => {
			try {
				e ? r.onNodeSelected = a : delete r.onNodeSelected, t ? r.onSelectionChange = o : delete r.onSelectionChange, n ? r.onNodeDeselected = c : delete r.onNodeDeselected;
			} catch (e) {
				console.debug?.(e);
			}
		});
	}
	if (t.includePointerFallback !== !1 && r.canvas?.addEventListener) {
		let e = Dt(r.canvas, "pointerup", s);
		e && i.push(e);
	}
	let c = !1;
	return () => {
		if (!c) {
			c = !0;
			for (let e of i.splice(0).reverse()) e();
		}
	};
}
async function kt(e = null) {
	let t = e || A || O(), n = (t?.api && typeof t.api.interrupt == "function" ? t.api : null) || wt(t);
	if (n && typeof n.interrupt == "function") return await n.interrupt(), !0;
	if (n && typeof n.fetchApi == "function") {
		let e = await n.fetchApi("/interrupt", { method: "POST" });
		if (!e?.ok) throw Error(`POST /interrupt failed (${e?.status})`);
		return !0;
	}
	let r = await fetch("/interrupt", {
		method: "POST",
		credentials: "include"
	});
	if (!r.ok) throw Error(`POST /interrupt failed (${r.status})`);
	return !1;
}
function At(e = null) {
	return (e || A || O())?.canvas || null;
}
function jt(e = null) {
	return At(e);
}
function j(e = null) {
	let t = e || A || O();
	return t?.graph || t?.canvas?.graph || null;
}
function Mt(e = null) {
	return j(e);
}
function Nt(e) {
	if (typeof e != "object" || !e) return e;
	try {
		return typeof structuredClone == "function" ? structuredClone(e) : JSON.parse(JSON.stringify(e));
	} catch {
		return e;
	}
}
function M(e, t) {
	r(e, ({ node: e }) => t(e));
}
function Pt(e) {
	let t = [];
	return M(e, (e) => {
		for (let n of e?.widgets ?? []) t.push({
			widget: n,
			value: Nt(n?.value)
		});
	}), t;
}
function Ft(e, t) {
	for (let e of Array.isArray(t) ? t : []) {
		let t = e?.widget;
		if (!t || typeof t != "object") continue;
		let n = Nt(e?.value);
		try {
			t.value = n;
		} catch (e) {
			console.debug?.(e);
			continue;
		}
		try {
			t.callback?.(n);
		} catch (e) {
			console.debug?.(e);
		}
	}
	N(e, { change: !1 });
}
function It(e, t) {
	let n = [
		e?.clientId,
		e?.clientID,
		e?.client_id,
		t?.clientId,
		t?.clientID,
		t?.client_id
	];
	for (let e of n) {
		let t = String(e || "").trim();
		if (t) return t;
	}
	return "";
}
function Lt(e = null) {
	let t = At(e);
	return t?.selected_nodes ?? t?.selectedNodes ?? null;
}
function Rt(e = null) {
	let t = Lt(e);
	return t ? Array.isArray(t) ? t.filter(Boolean) : t instanceof Map ? Array.from(t.values()).filter(Boolean) : typeof t == "object" ? Object.values(t).filter(Boolean) : [] : [];
}
function zt(e = null) {
	return Rt(e).map((e) => String(e?.id ?? "").trim()).filter(Boolean);
}
function Bt(e = null) {
	return Rt(e)[0] || null;
}
function N(e = null, t = {}) {
	try {
		let n = e || A || O(), r = At(n), i = j(n);
		return r?.setDirty?.(!0, !0), t.draw !== !1 && r?.draw?.(!0, !0), i?.setDirtyCanvas?.(!0, !0), t.change !== !1 && i?.change?.(), !!(r || i);
	} catch (e) {
		return console.debug?.(e), !1;
	}
}
function Vt(e, t = null, n = {}) {
	try {
		let r = t || A || O(), i = j(r), a = e?.graph ?? null;
		return a && a !== i && (a.setDirtyCanvas?.(!0, !0), n.change !== !1 && a.change?.()), N(r, n);
	} catch (e) {
		return console.debug?.(e), !1;
	}
}
function Ht(e, t = null) {
	if (!e) return !1;
	try {
		let n = t || A || O(), r = j(n);
		return !r || typeof r.add != "function" ? !1 : (r.add(e), Vt(e, n), !0);
	} catch (e) {
		return console.debug?.(e), !1;
	}
}
function Ut(e = null) {
	try {
		let t = e || A || O(), n = globalThis;
		return t?.LiteGraph || t?.ui?.LiteGraph || t?.canvas?.LiteGraph || n?.LiteGraph || n?.window?.LiteGraph || null;
	} catch (e) {
		return console.debug?.(e), null;
	}
}
function Wt(e, t = null) {
	let n = String(e || "").trim();
	if (!n) return null;
	try {
		let e = Ut(t);
		return !e || typeof e.createNode != "function" ? null : e.createNode(n) || null;
	} catch (e) {
		return console.debug?.(e), null;
	}
}
function Gt(e) {
	if (!e || typeof e != "object" || Array.isArray(e) || Array.isArray(e.nodes)) return !1;
	let t = Object.values(e).slice(0, 8);
	return t.length ? t.every((e) => e && typeof e == "object" && typeof e.class_type == "string" && e.inputs && typeof e.inputs == "object") : !1;
}
function Kt(e) {
	if (!e || typeof e != "object") return {
		format: "",
		data: null
	};
	if (Array.isArray(e.nodes)) return {
		format: "ui",
		data: e
	};
	if (e.workflow && typeof e.workflow == "object" && Array.isArray(e.workflow.nodes)) return {
		format: "ui",
		data: e.workflow
	};
	let t = e.prompt;
	if (typeof t == "string") try {
		t = JSON.parse(t);
	} catch {
		t = null;
	}
	return Gt(t) ? {
		format: "api",
		data: t
	} : Gt(e) ? {
		format: "api",
		data: e
	} : {
		format: "",
		data: null
	};
}
function qt(e, t = null, n = {}) {
	let r = t || A || O(), i = Kt(e);
	if (i.format === "api") {
		if (typeof r?.loadApiJson != "function") return !1;
		try {
			let e = r.loadApiJson(i.data, String(n.filename || "workflow.json"));
			return e && typeof e.then == "function" && e.then(void 0, (e) => console.debug?.(e)), !0;
		} catch (e) {
			return console.debug?.(e), !1;
		}
	}
	if (i.format === "ui" && (e = i.data), !e || typeof e != "object") return !1;
	try {
		let t = [
			r?.importWorkflow,
			r?.loadWorkflow,
			r?.workflowManager?.importWorkflow,
			r?.workflowManager?.loadWorkflow,
			r?.extensionManager?.workflow?.importWorkflow
		];
		for (let n of t) if (typeof n == "function") try {
			return n.call(r?.workflowManager || r?.extensionManager?.workflow || r, e), N(r, {
				draw: !1,
				change: !1
			}), !0;
		} catch (e) {
			console.debug?.(e);
		}
		if (typeof r?.loadGraphData == "function") {
			let t = r.loadGraphData(e);
			return t && typeof t.then == "function" && t.then(void 0, (e) => console.debug?.(e)), !0;
		}
		let n = j(r);
		if (typeof n?.configure == "function") return n.configure(e), N(r, {
			draw: !1,
			change: !1
		}), !0;
	} catch (e) {
		console.debug?.(e);
	}
	return !1;
}
function Jt(e, t = null) {
	let n = t || A || O();
	if (!e || typeof e != "object") return {
		ok: !1,
		mode: "none"
	};
	try {
		if (qt(e, n)) return {
			ok: !0,
			mode: "replace"
		};
	} catch (e) {
		console.debug?.(e);
	}
	return {
		ok: !1,
		mode: "none"
	};
}
function Yt(e = null) {
	try {
		let n = e || A || O(), r = t(n);
		if (typeof r?.serialize == "function") {
			let e = r.serialize();
			if (e && typeof e == "object") return e;
		}
		let i = j(n);
		if (i !== r && typeof i?.serialize == "function") {
			let e = i.serialize();
			if (e && typeof e == "object") return e;
		}
		if (typeof n?.graphToPrompt == "function") {
			let e = n.graphToPrompt();
			if (e && typeof e.then == "function") return e.then(void 0, (e) => console.debug?.(e)), null;
			if (e?.workflow && typeof e.workflow == "object") return e.workflow;
		}
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}
function Xt(e = null) {
	try {
		let t = e || A || O();
		if (!t) return null;
		let n = t?.extensionManager?.workflow?.activeWorkflow;
		if (typeof n?.isModified == "boolean") return n.isModified;
		let r = [
			t?.isDirty,
			t?.dirty,
			t?.graph?.isDirty,
			t?.graph?.dirty,
			t?.graph?.is_modified,
			t?.graph?.modified,
			t?.graph?.has_changed,
			t?.graph?.changed
		];
		for (let e of r) {
			if (typeof e == "boolean") return e;
			if (typeof e == "number") return e !== 0;
			if (typeof e == "function") try {
				let n = e.call(t?.graph || t);
				if (typeof n == "boolean") return n;
				if (typeof n == "number") return n !== 0;
			} catch (e) {
				console.debug?.(e);
			}
		}
	} catch (e) {
		console.debug?.(e);
	}
	return null;
}
async function Zt(e = {}) {
	let n = e.app || A || O();
	if (!n) throw Error("ComfyUI app not available");
	let r = wt(n), i = !!(r && typeof r.queuePrompt == "function" || r && typeof r.fetchApi == "function");
	if ((e.forceNativeQueue || !i) && typeof n.queuePrompt == "function") return await n.queuePrompt(0), !0;
	let a = t(n), o = null;
	try {
		o = Pt(a), M(a, (e) => {
			for (let t of e?.widgets ?? []) t.beforeQueued?.({ isPartialExecution: !1 });
		});
		let t = await (typeof e.resolvePromptData == "function" ? e.resolvePromptData : (e) => e?.graphToPrompt?.())(n);
		if (!t?.output) throw Error("graphToPrompt returned empty output");
		let i = typeof e.enrichPromptData == "function" ? e.enrichPromptData(t) : t;
		if (r && typeof r.queuePrompt == "function") return await r.queuePrompt(0, i), M(a, (e) => {
			for (let t of e?.widgets ?? []) t.afterQueued?.({ isPartialExecution: !1 });
		}), N(n, { change: !1 }), !0;
		let s = (typeof e.buildPromptRequestBody == "function" ? e.buildPromptRequestBody : (e, t) => {
			let n = {
				prompt: e?.output,
				extra_data: e?.extra_data || {}
			};
			return t.clientId && (n.client_id = t.clientId), n;
		})(t, { clientId: It(r, n) });
		if (r && typeof r.fetchApi == "function") {
			let e = await r.fetchApi("/prompt", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(s)
			});
			if (!e?.ok) throw Error(`POST /prompt failed (${e?.status})`);
			return M(a, (e) => {
				for (let t of e?.widgets ?? []) t.afterQueued?.({ isPartialExecution: !1 });
			}), N(n, { change: !1 }), !0;
		}
		let c = await fetch("/prompt", {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(s)
		});
		if (!c.ok) throw Error(`POST /prompt failed (${c.status})`);
		return M(a, (e) => {
			for (let t of e?.widgets ?? []) t.afterQueued?.({ isPartialExecution: !1 });
		}), N(n, { change: !1 }), !1;
	} catch (e) {
		throw Ft(n, o), e;
	}
}
function Qt(e, t = {}) {
	if (!e) return !1;
	try {
		let n = At(t.app || A || O());
		if (!n) return !1;
		if (t.select !== !1 && n.selectNode?.(e, !1), typeof n.centerOnNode == "function") n.centerOnNode(e);
		else if (e.pos && n.ds) {
			let t = n.canvas || n.element || null, r = Number(t?.width || t?.clientWidth || 800) || 800, i = Number(t?.height || t?.clientHeight || 600) || 600, a = Number(n.ds?.scale || 1) || 1, o = Number(e?.size?.[0] || 100) || 100, s = Number(e?.size?.[1] || 80) || 80, c = -Number(e.pos[0] || 0) + r / (2 * a) - o / 2, l = -Number(e.pos[1] || 0) + i / (2 * a) - s / 2;
			Array.isArray(n.ds.offset) ? (n.ds.offset[0] = c, n.ds.offset[1] = l) : n.ds.offset && typeof n.ds.offset == "object" && (n.ds.offset.x = c, n.ds.offset.y = l), n.setDirty?.(!0, !0);
		}
		return t.focusCanvas !== !1 && n.canvas?.focus?.(), !0;
	} catch (e) {
		return console.debug?.(e), !1;
	}
}
function $t(e, r = null) {
	let i = String(e || "").trim();
	if (!i) return !1;
	try {
		let e = r || A || O(), a = n(t(e), i);
		return a ? Qt(a, {
			app: e,
			select: !1,
			focusCanvas: !1
		}) : !1;
	} catch (e) {
		return console.debug?.(e), !1;
	}
}
function en() {
	let e = A || O() || null, t = e?.canvas || null, n = t?.ds || null, r = t?.canvas || t?.el || null;
	if (!t || !n || !r) return null;
	let i = Number(n?.scale), a = Number(r?.width || r?.clientWidth || 0), o = Number(r?.height || r?.clientHeight || 0);
	return !Number.isFinite(i) || i <= 0 || !(a > 0) || !(o > 0) ? null : {
		app: e,
		graphCanvas: t,
		ds: n,
		scale: i,
		width: a,
		height: o
	};
}
function tn(e, t, n) {
	return Array.isArray(e?.offset) ? (e.offset[0] = t, e.offset[1] = n, !0) : e?.offset && typeof e.offset == "object" ? (e.offset.x = t, e.offset.y = n, !0) : !1;
}
function nn(e, t) {
	try {
		t?.setDirty?.(!0, !0);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		e?.graph?.setDirtyCanvas?.(!0, !0);
	} catch (e) {
		console.debug?.(e);
	}
}
function rn(e) {
	try {
		let t = en();
		if (!t || !e) return !1;
		let n = Number(e.x), r = Number(e.y);
		if (!Number.isFinite(n) || !Number.isFinite(r)) return !1;
		let i = Math.max(1, Number(globalThis?.devicePixelRatio ?? globalThis?.window?.devicePixelRatio) || 1), a = -n + t.width * .5 / (t.scale * i), o = -r + t.height * .5 / (t.scale * i);
		return !Number.isFinite(a) || !Number.isFinite(o) || !tn(t.ds, a, o) ? !1 : (nn(t.app, t.graphCanvas), !0);
	} catch (e) {
		return console.debug?.(e), !1;
	}
}
function an() {
	try {
		let e = en();
		if (!e) return null;
		let t = e.ds?.offset, n = Number(Array.isArray(t) ? t[0] : t?.x), r = Number(Array.isArray(t) ? t[1] : t?.y);
		return !Number.isFinite(n) || !Number.isFinite(r) ? null : {
			x0: -n / e.scale,
			y0: -r / e.scale,
			x1: (e.width - n) / e.scale,
			y1: (e.height - r) / e.scale
		};
	} catch (e) {
		return console.debug?.(e), null;
	}
}
// ui/app/settings/SettingsStore.ts
var P = /* @__PURE__ */ new Map(), on = !1, F = null;
function sn() {
	try {
		return typeof window > "u" ? null : window.localStorage || null;
	} catch {
		return null;
	}
}
function cn(e, t, n) {
	let r = P.get(String(e || ""));
	if (r && r.size) for (let i of Array.from(r)) try {
		i(t, n, e);
	} catch (e) {
		console.debug?.(e);
	}
}
function ln() {
	if (!on) try {
		F = (e) => {
			let t = String(e?.key || "");
			t && cn(t, e?.newValue ?? null, e?.oldValue ?? null);
		}, window.addEventListener("storage", F), on = !0;
	} catch (e) {
		console.debug?.(e);
	}
}
var I = {
	get(e) {
		let t = sn();
		if (!t) return null;
		try {
			return t.getItem(String(e || ""));
		} catch {
			return null;
		}
	},
	set(e, t) {
		let n = String(e || "");
		if (!n) return !1;
		let r = sn();
		if (!r) return !1;
		let i = I.get(n);
		try {
			if (t == null) return r.removeItem(n), cn(n, null, i), !0;
			let e = String(t);
			return r.setItem(n, e), cn(n, e, i), !0;
		} catch {
			return !1;
		}
	},
	subscribe(e, t) {
		let n = String(e || "");
		if (!n || typeof t != "function") return () => {};
		ln();
		let r = P.get(n);
		return r || (r = /* @__PURE__ */ new Set(), P.set(n, r)), r.add(t), () => {
			try {
				let e = P.get(n);
				e?.delete(t), e && !e.size && P.delete(n);
			} catch (e) {
				console.debug?.(e);
			}
		};
	},
	getAll() {
		let e = {}, t = sn();
		if (!t) return e;
		try {
			let n = Number(t.length || 0) || 0;
			for (let r = 0; r < n; r += 1) {
				let n = t.key(r);
				n && (e[n] = t.getItem(n));
			}
		} catch (e) {
			console.debug?.(e);
		}
		return e;
	},
	dispose() {
		try {
			on && F && typeof window < "u" && window.removeEventListener("storage", F);
		} catch (e) {
			console.debug?.(e);
		}
		on = !1, F = null, P.clear();
	}
}, L = "en-US", R = L, un = /* @__PURE__ */ new Set(), dn = ["mjr_lang", "majoor.lang"], fn = "mjr_lang_follow_comfy", pn = 500, z = /* @__PURE__ */ new Set(), mn = null, hn = /* @__PURE__ */ new Set([
	"ar-SA",
	"fa-IR",
	"he-IL"
]), gn = {
	fr: "fr-FR",
	"fr-fr": "fr-FR",
	fr_FR: "fr-FR",
	frfr: "fr-FR",
	en: "en-US",
	"en-us": "en-US",
	en_US: "en-US",
	enus: "en-US",
	"en-gb": "en-US",
	en_gb: "en-US",
	engb: "en-US",
	zh: "zh-CN",
	"zh-cn": "zh-CN",
	zh_CN: "zh-CN",
	zhcn: "zh-CN",
	"zh-tw": "zh-CN",
	zh_tw: "zh-CN",
	zhtw: "zh-CN",
	ja: "ja-JP",
	"ja-jp": "ja-JP",
	ja_jp: "ja-JP",
	jajp: "ja-JP",
	ko: "ko-KR",
	"ko-kr": "ko-KR",
	ko_kr: "ko-KR",
	kokr: "ko-KR",
	hi: "hi-IN",
	"hi-in": "hi-IN",
	hi_in: "hi-IN",
	hiin: "hi-IN",
	pt: "pt-PT",
	"pt-pt": "pt-PT",
	pt_pt: "pt-PT",
	ptpt: "pt-PT",
	"pt-br": "pt-PT",
	pt_br: "pt-PT",
	ptbr: "pt-PT",
	es: "es-ES",
	"es-es": "es-ES",
	es_es: "es-ES",
	eses: "es-ES",
	ru: "ru-RU",
	"ru-ru": "ru-RU",
	ru_ru: "ru-RU",
	ruru: "ru-RU",
	de: "de-DE",
	"de-de": "de-DE",
	de_de: "de-DE",
	dede: "de-DE",
	it: "it-IT",
	"it-it": "it-IT",
	it_it: "it-IT",
	itit: "it-IT",
	nl: "nl-NL",
	"nl-nl": "nl-NL",
	nl_nl: "nl-NL",
	nlnl: "nl-NL",
	pl: "pl-PL",
	"pl-pl": "pl-PL",
	pl_pl: "pl-PL",
	plpl: "pl-PL",
	tr: "tr-TR",
	"tr-tr": "tr-TR",
	tr_tr: "tr-TR",
	trtr: "tr-TR",
	vi: "vi-VN",
	"vi-vn": "vi-VN",
	vi_vn: "vi-VN",
	vivn: "vi-VN",
	cs: "cs-CZ",
	"cs-cz": "cs-CZ",
	cs_cz: "cs-CZ",
	cscz: "cs-CZ",
	fa: "fa-IR",
	"fa-ir": "fa-IR",
	fa_ir: "fa-IR",
	fair: "fa-IR",
	id: "id-ID",
	"id-id": "id-ID",
	id_id: "id-ID",
	idid: "id-ID",
	uk: "uk-UA",
	"uk-ua": "uk-UA",
	uk_ua: "uk-UA",
	ukua: "uk-UA",
	hu: "hu-HU",
	"hu-hu": "hu-HU",
	hu_hu: "hu-HU",
	huhu: "hu-HU",
	ar: "ar-SA",
	"ar-sa": "ar-SA",
	ar_sa: "ar-SA",
	arsa: "ar-SA",
	sv: "sv-SE",
	"sv-se": "sv-SE",
	sv_se: "sv-SE",
	svse: "sv-SE",
	ro: "ro-RO",
	"ro-ro": "ro-RO",
	ro_ro: "ro-RO",
	roro: "ro-RO",
	el: "el-GR",
	"el-gr": "el-GR",
	el_gr: "el-GR",
	elgr: "el-GR"
}, B = {
	"en-US": {
		"cat.grid": "Grid",
		"cat.cards": "Cards",
		"cat.badges": "Badges",
		"cat.viewer": "Viewer",
		"cat.floatingViewer": "Floating Viewer",
		"cat.scanning": "Scanning",
		"cat.advanced": "Advanced",
		"cat.security": "Security",
		"cat.remote": "Remote Access",
		"cat.search": "Search",
		"cat.feed": "Generated Feed",
		"setting.grid.minsize.name": "Majoor: Thumbnail Size (px)",
		"setting.grid.minsize.desc": "Minimum size of thumbnails in the grid. May require reopening the panel.",
		"setting.grid.cardSize.group": "Card size",
		"setting.grid.cardSize.name": "Majoor: Card Size",
		"setting.grid.cardSize.desc": "Choose a card size preset: small, medium, or large.",
		"setting.grid.cardSize.small": "Small",
		"setting.grid.cardSize.medium": "Medium",
		"setting.grid.cardSize.large": "Large",
		"setting.grid.gap.name": "Majoor: Gap (px)",
		"setting.grid.gap.desc": "Space between thumbnails.",
		"setting.sidebar.pos.name": "Majoor: Sidebar Position",
		"setting.sidebar.pos.desc": "Show details sidebar on the left or the right. Reload required.",
		"setting.siblings.hide.name": "Majoor: Hide PNG Siblings",
		"setting.siblings.hide.desc": "If a video has a corresponding .png preview, hide the .png from the grid.",
		"setting.nav.infinite.name": "Majoor: Infinite Scroll",
		"setting.nav.infinite.desc": "Automatically load more files when scrolling.",
		"setting.grid.pagesize.name": "Majoor: Grid Page Size",
		"setting.grid.pagesize.desc": "Number of assets loaded per page/request in the grid.",
		"setting.grid.videoAutoplayMode.name": "Majoor: Video Autoplay",
		"setting.grid.videoAutoplayMode.desc": "Controls video thumbnail playback in the grid. Off: static frame. Hover: play on mouse hover. Always: loop while visible.",
		"setting.grid.videoAutoplayMode.off": "Off",
		"setting.grid.videoAutoplayMode.hover": "Hover",
		"setting.grid.videoAutoplayMode.always": "Always",
		"setting.viewer.pauseExecution.name": "Majoor: Pause Main Viewer During Execution",
		"setting.viewer.pauseExecution.desc": "Pause the main viewer render processors while ComfyUI is generating to reduce competition for CPU/GPU.",
		"setting.viewer.floatingPauseExecution.name": "Majoor: Pause Floating Viewer During Execution",
		"setting.viewer.floatingPauseExecution.desc": "Pause the Floating Viewer during generation. Disable this if you want to keep live generation steps visible.",
		"setting.viewer.mfvLiveDefault.name": "Majoor: MFV Live Stream Enabled by Default",
		"setting.viewer.mfvLiveDefault.desc": "Controls whether Live Stream starts enabled when the Floating Viewer initializes or resets.",
		"setting.viewer.mfvPreviewDefault.name": "Majoor: MFV KSampler Preview Enabled by Default",
		"setting.viewer.mfvPreviewDefault.desc": "Controls whether KSampler preview starts enabled when the Floating Viewer initializes or resets.",
		"setting.viewer.mfvPreviewMethod.name": "Majoor: MFV Preview Method",
		"setting.viewer.mfvPreviewMethod.desc": "Preview mode forced by the Floating Viewer Run button. 'taesd' gives the best chance of getting previews, with latent2rgb fallback when available.",
		"setting.viewer.mfvKjPreviewOverride.name": "Majoor: Show KJNodes Model Preview Override in MFV",
		"setting.viewer.mfvKjPreviewOverride.desc": "Display JPEG, animated WebP, and MP4 generation previews emitted by KJNodes Model Preview Override in the Floating Viewer. The MFV KSampler Preview toggle must also be enabled.",
		"setting.minimap.enabled.name": "Majoor: Enable Minimap",
		"setting.minimap.enabled.desc": "Global activation of the workflow minimap.",
		"setting.scan.startup.name": "Majoor: Auto-scan on Startup",
		"setting.scan.startup.desc": "Start a background scan as soon as ComfyUI loads.",
		"setting.watcher.name": "Majoor: File Watcher",
		"setting.watcher.desc": "Watch output and custom folders for manually added files and auto-index them in real time.",
		"setting.watcher.enabled.label": "Watcher enabled",
		"setting.watcher.debounce.name": "Majoor: Watcher debounce delay",
		"setting.watcher.debounce.desc": "Delay (ms) for batching watcher events before indexing.",
		"setting.watcher.debounce.label": "Watcher debounce (ms)",
		"setting.watcher.debounce.error": "Failed to update watcher debounce delay.",
		"setting.watcher.dedupe.name": "Majoor: Watcher dedupe window",
		"setting.watcher.dedupe.desc": "Duration (ms) a file is treated as already processed after an event.",
		"setting.watcher.dedupe.label": "Watcher dedupe window (ms)",
		"setting.watcher.dedupe.error": "Failed to update watcher dedupe window.",
		"setting.sync.rating.name": "Majoor: Sync Rating/Tags to Files",
		"setting.sync.rating.desc": "Write ratings and tags into file metadata (ExifTool).",
		"cat.badgeColors": "Badge colors",
		"setting.starColor": "Star color",
		"setting.starColor.tooltip": "Color of rating stars on thumbnails (hex, e.g. #FFD45A)",
		"setting.badgeImageColor": "Image badge color",
		"setting.badgeImageColor.tooltip": "Color for image badges: PNG, JPG, WEBP, GIF, BMP, TIF (hex)",
		"setting.badgeVideoColor": "Video badge color",
		"setting.badgeVideoColor.tooltip": "Color for video badges: MP4, WEBM, MOV, AVI, MKV (hex)",
		"setting.badgeAudioColor": "Audio badge color",
		"setting.badgeAudioColor.tooltip": "Color for audio badges: MP3, WAV, OGG, FLAC (hex)",
		"setting.badgeModel3dColor": "3D model badge color",
		"setting.badgeModel3dColor.tooltip": "Color for 3D model badges: OBJ, FBX, GLB, GLTF (hex)",
		"setting.badgeDuplicateAlertColor": "Duplicate alert badge color",
		"setting.badgeDuplicateAlertColor.tooltip": "Alert color used when duplicate extension badges are shown (e.g. PNG+).",
		"setting.obs.enabled.name": "Majoor: Enable Detailed Logs",
		"setting.obs.enabled.desc": "Enable detailed backend logs for debugging.",
		"setting.probe.mode.name": "Majoor: Metadata Backend",
		"setting.probe.mode.desc": "Choose the tool used directly to extract metadata.",
		"setting.language.name": "Majoor: Language",
		"setting.language.desc": "Choose the language for the Assets Manager interface. Reload required to fully apply.",
		"setting.search.maxResults.name": "Majoor: Search max results",
		"setting.search.maxResults.desc": "Maximum number of results returned by search endpoints.",
		"setting.ai.vector.enabled.name": "Enable AI semantic search",
		"setting.ai.vector.enabled.desc": "Enable CLIP-based semantic search. Disable to use keyword-only search.",
		"setting.ai.vector.captionOnIndex.name": "Generate AI captions during indexing",
		"setting.ai.vector.captionOnIndex.desc": "Allow automatic vector indexing and backfill to run Florence-2 captions for image assets. This is slower and can use significant VRAM/CPU; leave it off for faster grid startup.",
		"setting.sec.safe.name": "Majoor: Safe Mode",
		"setting.sec.safe.desc": "When enabled, rating/tags writes are blocked unless explicitly authorized.",
		"setting.sec.requireAuth.name": "Majoor: Require Token For All Writes",
		"setting.sec.requireAuth.desc": "Require the Majoor API token even for local loopback writes. Recommended when you want one consistent auth path everywhere.",
		"setting.sec.remoteLanPreset.name": "Majoor: Recommended Remote LAN Setup",
		"setting.sec.remoteLanPreset.desc": "One click helper for trusted home/LAN access. Majoor generates a strong token if needed, requires it for writes, and enables HTTP token transport automatically on plain-HTTP LAN sessions.",
		"setting.sec.remote.name": "Majoor: Allow Remote Full Access",
		"setting.sec.remote.desc": "Allow non-local clients to perform write operations. Disabling blocks writes unless a token is configured.",
		"setting.sec.insecureTransport.name": "Majoor: Allow HTTP Token Transport",
		"setting.sec.insecureTransport.desc": "Allow the Majoor API token over plain HTTP for trusted LAN setups. Unsafe on untrusted networks; HTTPS is preferred.",
		"setting.sec.write.name": "Majoor: Allow Write",
		"setting.sec.write.desc": "Allow writing ratings and tags.",
		"setting.sec.del.name": "Majoor: Allow Delete",
		"setting.sec.del.desc": "Allow deleting files.",
		"setting.sec.ren.name": "Majoor: Allow Rename",
		"setting.sec.ren.desc": "Allow renaming files.",
		"setting.sec.open.name": "Majoor: Allow Open in Folder",
		"setting.sec.open.desc": "Allow opening file location in OS file manager.",
		"setting.sec.reset.name": "Majoor: Allow Index Reset",
		"setting.sec.reset.desc": "Allow resetting the index cache and triggering a full rescan.",
		"setting.sec.token.name": "Majoor: API Token",
		"setting.sec.token.desc": "Store the write authorization token. Majoor inserts it in the Authorization and X-MJR-Token headers.",
		"setting.sec.token.placeholder": "Auto-generated for this browser session.",
		"setting.sec.token.placeholderConfigured": "Token configured on server ({tokenHint}). Leave blank to keep the current server token.",
		"setting.sec.token.placeholderConfiguredGeneric": "Token configured on server. Leave blank to keep the current server token.",
		"tab.output": "Output",
		"tab.input": "Input",
		"tab.all": "All",
		"tab.custom": "Custom",
		"tab.workflow": "Workflow",
		"tab.similar": "Similar",
		"manager.title": "Assets Manager",
		"manager.sidebarLabel": "Assets\nManager",
		"command.scanAssets": "Scan assets",
		"command.toggleFloatingViewer": "Toggle floating viewer",
		"command.refreshAssetsGrid": "Refresh assets grid",
		"bottomFeed.title": "Generated Feed",
		"label.floatingViewer": "Viewer",
		"bottomFeed.subtitle": "Lite output grid with recent and past generated assets",
		"bottomFeed.openManager": "Open Manager",
		"bottomFeed.refresh": "Refresh",
		"bottomFeed.loading": "Loading recent assets...",
		"bottomFeed.empty": "No generated assets yet.",
		"bottomFeed.loadFailed": "Failed to load generated assets.",
		"bottomFeed.groupTitle": "Generation group",
		"bottomFeed.groupOpen": "Show other assets from this generation",
		"btn.add": "Add",
		"btn.remove": "Remove",
		"btn.adding": "Adding...",
		"btn.removing": "Removing...",
		"btn.retry": "Retry",
		"btn.clear": "Clear",
		"btn.refresh": "Refresh",
		"btn.scan": "Scan",
		"btn.scanning": "Scanning...",
		"btn.resetIndex": "Reset index",
		"btn.resetting": "Resetting...",
		"btn.deleteDb": "Delete DB",
		"btn.deletingDb": "Deleting DB...",
		"btn.memoryPurge": "Memory purge",
		"btn.memoryPurging": "Purging...",
		"btn.retryServices": "Retry services",
		"btn.retrying": "Retrying...",
		"btn.loadWorkflow": "Load Workflow",
		"btn.play": "Play",
		"btn.copyPrompt": "Copy Prompt",
		"btn.close": "Close",
		"btn.dbSave": "Save DB",
		"btn.dbRestore": "Restore DB",
		"btn.emptyTrash": "Empty trash",
		"btn.emptyTrashRunning": "Emptying...",
		"btn.back": "Back",
		"btn.up": "Up",
		"btn.saving": "Saving...",
		"btn.restoring": "Restoring...",
		"btn.markAllRead": "Mark all read",
		"label.folder": "Folder",
		"label.type": "Type",
		"label.workflow": "Workflow",
		"label.rating": "Rating",
		"label.dateRange": "Date range",
		"label.agenda": "Agenda",
		"label.sort": "Sort",
		"label.scope": "Scope",
		"label.query": "Query",
		"label.only": "Only",
		"label.toastHistory": "History",
		"label.workflowType": "WF Type",
		"label.sameWorkflow": "Generated with Same Workflow",
		"label.resolution": "Resolution",
		"label.fileSizeMB": "File size (MB)",
		"label.min": "Min",
		"label.max": "Max",
		"label.resolutionPx": "Resolution (px)",
		"label.compare": "Compare",
		"label.resolutionWxHpx": "Resolution WxH (px)",
		"label.resolutionMinWxH": "Min WxH (px)",
		"label.resolutionMaxWxH": "Max WxH (px)",
		"label.widthPx": "Width (px)",
		"label.heightPx": "Height (px)",
		"label.day": "Day",
		"label.collections": "Collections",
		"label.collection": "collection",
		"rating.title": "Rating: {n}",
		"rating.label": "Rating",
		"rating.setN": "Set rating to {n}",
		"tags.title": "Tags: {tags}",
		"tags.label": "Tags",
		"tags.addLabel": "Add tag",
		"tags.remove": "Remove tag",
		"tags.suggestions": "Tag suggestions",
		"label.messages": "Messages",
		"label.readMe": "Read Me",
		"label.userGuide": "User Guide",
		"label.info": "Info",
		"btn.giveStar": "Give a star",
		"label.filters": "Filters",
		"label.selectFolder": "Select folder?",
		"label.thisFolder": "this folder",
		"label.thisFile": "this file",
		"label.computer": "Computer",
		"search.placeholder": "Search assets...",
		"search.title": "Search by filename, tags, or attributes (e.g. rating:5, ext:png)",
		"search.semanticToggle": "Toggle AI semantic search (CLIP-based)",
		"search.aiSearch": "AI Search",
		"search.findSimilar": "Find Similar",
		"search.findingSimilar": "Finding similar assets...",
		"search.selectAssetForSimilar": "Select an asset first to find similar images/videos.",
		"search.findSimilarFailed": "Failed to find similar assets",
		"search.similarResults": "Similar to asset #{id} ({n} results)",
		"search.similarReference": "Reference #{id}",
		"search.similarDisabled": "AI features are disabled in settings",
		"action.copyToClipboard": "Copy to clipboard",
		"action.clickToCopy": "Click to copy",
		"tooltip.copyFieldValue": "Copy value",
		"tooltip.filterByFileType": "Filter by file type",
		"tooltip.filterWorkflowOnly": "Show only assets with embedded workflow data",
		"tooltip.filterWorkflowId": "Filter assets generated from the same embedded workflow id",
		"tooltip.filterMinRating": "Filter by minimum rating",
		"tooltip.filterByDateRange": "Filter by date range",
		"tooltip.widthPx": "Width in pixels",
		"tooltip.heightPx": "Height in pixels",
		"log.clipboardCopyFailed": "Failed to copy to clipboard",
		"tooltip.tab.all": "Browse all assets (inputs + outputs)",
		"tooltip.tab.input": "Browse input folder assets",
		"tooltip.tab.output": "Browse generated outputs",
		"tooltip.tab.custom": "Browse browser folders",
		"tooltip.tab.workflow": "Browse saved workflows",
		"tooltip.saveCurrentWorkflow": "Save current workflow",
		"tooltip.tab.similar": "Browse current similar findings",
		"tooltip.browserFolders": "Browser folders",
		"tooltip.pinnedFolders": "Pinned folders",
		"tooltip.clearFilter": "Clear {label}",
		"tooltip.duplicateSuggestions": "Duplicate/similarity suggestions",
		"tooltip.closeSidebar": "Close sidebar",
		"tooltip.closeSidebarEsc": "Close sidebar (Esc)",
		"tooltip.supportKofi": "Buy Me a White Monster Drink",
		"tooltip.starGithub": "Open GitHub and give a star",
		"tooltip.sidebarTab": "Assets Manager - Browse and search your outputs",
		"tooltip.openMFV": "Open Majoor Floating Viewer",
		"tooltip.closeMFV": "Close Majoor Floating Viewer",
		"tooltip.openMessages": "Messages and updates",
		"tooltip.openMessagesUnread": "Messages ({count} unread)",
		"tooltip.markMessagesRead": "Mark all messages as read",
		"tooltip.noUnreadMessages": "No unread messages",
		"tooltip.deleteDb": "Force-delete database and rebuild from scratch",
		"tooltip.memoryPurge": "Unload Majoor AI models, ask ComfyUI to unload loaded models, and clear torch cache when idle.",
		"tooltip.workflowMultiOutput": "Multiple outputs with different prompts",
		"tooltip.generationInputs": "Input files used in generation",
		"tooltip.videoFile": "Video file",
		"tooltip.minimapSettings": "Minimap settings",
		"tooltip.closeViewer": "Close viewer",
		"tooltip.popInViewer": "Return to floating panel",
		"tooltip.popOutViewer": "Pop out viewer to separate window",
		"tooltip.liveStreamOff": "Live Stream: OFF - click to follow final generation outputs",
		"tooltip.liveStreamOn": "Live Stream: ON - follows final generation outputs after execution",
		"tooltip.previewStreamOff": "KSampler Preview: OFF - click to stream sampler denoising frames",
		"tooltip.previewStreamOn": "KSampler Preview: ON - streams sampler denoising frames during execution",
		"tooltip.nodeStreamOff": "Node Stream: OFF - click to follow selected node previews, including ImageOps live canvases",
		"tooltip.nodeStreamOn": "Node Stream: ON - follows the selected node preview when frontend media exists",
		"tooltip.nodeParams": "Node Parameters",
		"tooltip.queuePrompt": "Queue Prompt (Run)",
		"tooltip.queueStop": "Stop Generation",
		"tooltip.captureView": "Save view as image",
		"tooltip.pendingRefresh": "Pending: metadata refresh in progress",
		"tooltip.noAssetsDay": "No assets on this day",
		"tooltip.assetsDaySingular": "{count} asset",
		"tooltip.assetsDayPlural": "{count} assets",
		"tooltip.deleteCollection": "Delete collection",
		"tooltip.resetInPoint": "Reset In point to start",
		"tooltip.resetOutPoint": "Reset Out point to end",
		"tooltip.maintenanceTools": "Database maintenance tools",
		"filter.all": "All",
		"filter.any": "Any",
		"filter.images": "Images",
		"filter.videos": "Videos",
		"filter.audio": "Audio",
		"filter.onlyWithWorkflow": "Only with workflow",
		"filter.anyRating": "Any rating",
		"filter.minStars": "{n}+ stars",
		"filter.resolutionAtLeast": "At least (>=)",
		"filter.resolutionAtMost": "At most (<=)",
		"filter.anytime": "Anytime",
		"filter.today": "Today",
		"filter.yesterday": "Yesterday",
		"filter.thisWeek": "This week",
		"filter.thisMonth": "This month",
		"filter.last7days": "Last 7 days",
		"filter.last30days": "Last 30 days",
		"placeholder.workflowId": "Workflow ID",
		"action.generate": "Generate",
		"action.clear": "Clear",
		"action.refresh": "Refresh",
		"weekday.monShort": "Mon",
		"weekday.tueShort": "Tue",
		"weekday.wedShort": "Wed",
		"weekday.thuShort": "Thu",
		"weekday.friShort": "Fri",
		"weekday.satShort": "Sat",
		"weekday.sunShort": "Sun",
		"group.core": "Core",
		"group.media": "Media",
		"group.time": "Time",
		"sort.newest": "Newest first",
		"sort.oldest": "Oldest first",
		"sort.nameAZ": "Name A-Z",
		"sort.nameZA": "Name Z-A",
		"sort.ratingHigh": "Rating (high)",
		"sort.ratingLow": "Rating (low)",
		"sort.sizeDesc": "Size (large)",
		"sort.sizeAsc": "Size (small)",
		"status.checking": "Checking...",
		"status.ready": "Ready",
		"status.loading": "Loading",
		"status.disabled": "Disabled",
		"status.na": "N/A",
		"status.generating": "Generating...",
		"status.scanning": "Scanning...",
		"status.error": "Error",
		"status.capabilities": "Capabilities",
		"status.toolStatus": "Tool status",
		"status.selectCustomFolder": "Select a custom folder first",
		"status.errorGetConfig": "Error: Failed to get config",
		"status.discoveringTools": "Capabilities: discovering tools...",
		"status.indexStatus": "Index Status",
		"status.memoryPurgeStarted": "Memory purge started...",
		"status.toolStatusChecking": "Tool status: checking...",
		"status.resetIndexHint": "Reset index cache (requires allowResetIndex in settings).",
		"status.emptyTrashHint": "Permanently remove files Majoor sent to the freedesktop trash (requires allowDelete in settings).",
		"status.emptyTrashDisabled": "Empty trash is disabled. Enable 'allow_delete' in settings or set MAJOOR_ALLOW_DELETE=1.",
		"status.scanningHint": "This may take a while",
		"status.toolAvailable": "{tool} available",
		"status.toolUnavailable": "{tool} unavailable",
		"status.unknown": "unknown",
		"status.available": "available",
		"status.missing": "missing",
		"status.path": "Path",
		"state.on": "on",
		"state.off": "off",
		"status.pathAuto": "auto / not configured",
		"status.noAssets": "No assets indexed yet ({scope})",
		"status.clickToScan": "Click the dot to start a scan",
		"status.assetsIndexed": "{count} assets indexed ({scope})",
		"status.imagesVideos": "Images: {images}  -  Videos: {videos}",
		"status.withWorkflows": "With workflows: {workflows}  -  Generation data: {gendata}",
		"status.dbSize": "Database size: {size}",
		"status.lastScan": "Last scan: {date}",
		"status.scanStats": "Added: {added}  -  Updated: {updated}  -  Skipped: {skipped}",
		"status.watcher.enabled": "Watcher: enabled",
		"status.watcher.enabledScoped": "Watcher: enabled ({scope})",
		"status.watcher.disabled": "Watcher: disabled",
		"status.watcher.disabledScoped": "Watcher: disabled ({scope})",
		"status.apiNotFound": "Majoor API endpoints not found (404)",
		"status.apiNotFoundHint": "Backend routes are not loaded. Restart ComfyUI and check the terminal for Majoor import errors.",
		"status.errorChecking": "Error checking status",
		"status.dbCorrupted": "Database is corrupted",
		"status.dbCorruptedHint": "Use the \"Delete DB\" button below to force-delete and rebuild the index.",
		"status.retryFailed": "Retry failed",
		"status.customBrowserScanDisabled": "Scan is disabled in Browser scope",
		"status.customBrowserScanDisabledHint": "Use Outputs, Inputs, or All to run indexing scans",
		"status.dbBackupNone": "No DB backup available",
		"status.dbBackupSelectHint": "Select a DB backup to restore",
		"status.dbBackupLoading": "Loading DB backups...",
		"status.dbSaveHint": "Create a DB backup snapshot now.",
		"status.dbRestoreHint": "Restore selected DB backup and restart indexing.",
		"status.dbHealthLocked": "DB health: locked",
		"status.dbHealthOk": "DB health: ok",
		"status.dbHealthError": "DB health: error",
		"status.dbRestoreInProgress": "DB restore in progress",
		"status.enrichmentIdle": "idle",
		"status.enrichmentQueue": "Enrich queue: {count}",
		"status.maintenanceBusy": "Maintenance in progress",
		"status.scanInProgress": "Scan in progress",
		"status.scanInProgressHint": "Please wait for scan completion",
		"status.scanningScope": "Scanning scope: {scope}",
		"status.indexHealthOk": "Index health: ok",
		"status.indexHealthPartial": "Index health: partial",
		"status.indexHealthEmpty": "Index health: empty",
		"status.pending": "Pending",
		"status.toast.info": "Index status: checking",
		"status.toast.success": "Index status: ready",
		"status.toast.warning": "Index status: attention needed",
		"status.toast.error": "Index status: error",
		"status.toast.browser": "Index status: browser scope",
		"status.browserMetricsHidden": "Browser mode: global DB/index metrics hidden",
		"runtime.unavailable": "Runtime: unavailable",
		"runtime.metricsTitle": "Runtime Metrics\nDB active connections: {active}\nEnrichment queue: {enrichQ}\nWatcher pending files: {pending}",
		"runtime.metricsLine": "DB active: {active} | Enrich Q: {enrichQ} | Watcher pending: {pending}",
		"runtime.writeAuthActive": "Write auth: active {tokenHint}",
		"runtime.writeAuthMissing": "Write auth: missing in this browser {tokenHint}",
		"runtime.writeAuthRequired": "Write auth: required",
		"runtime.writeAuthNotRequired": "Write auth: not required",
		"runtime.writeAuthBlocked": "Write auth: writes blocked by server",
		"runtime.writeAuthUnknown": "Write auth: unknown",
		"scope.all": "Inputs + Outputs",
		"scope.allFull": "All (Inputs + Outputs)",
		"scope.input": "Inputs",
		"scope.output": "Outputs",
		"scope.custom": "Custom",
		"scope.workflow": "Workflow",
		"scope.customBrowser": "Browser",
		"scope.similar": "Similar",
		"tool.exiftool": "ExifTool metadata",
		"tool.exiftool.hint": "PNG/WEBP workflow data (uses ExifTool)",
		"tool.ffprobe": "FFprobe video stats",
		"tool.ffprobe.hint": "Video duration, FPS, and resolution (uses FFprobe)",
		"msg.noCollections": "No collections yet.",
		"msg.addCustomFolder": "Add a custom folder to browse.",
		"msg.noResults": "No results found.",
		"msg.loading": "Loading...",
		"msg.errorLoading": "Error loading",
		"msg.errorLoadingFolders": "Error loading folders",
		"msg.noGenerationData": "No generation data found for this file.",
		"msg.noMessages": "No messages for now.",
		"msg.noPinnedFolders": "No pinned folders",
		"msg.noTagsYet": "No tags yet...",
		"msg.category.information": "Information",
		"msg.shortcuts.title": "Shortcut Guide",
		"msg.shortcuts.body": "All active shortcuts are grouped here by section so they stay visible inside Message Center.",
		"msg.shortcuts.intro": "Current keyboard shortcuts grouped by section for quick reference.",
		"msg.shortcuts.openGuide": "Open full guide",
		"msg.shortcuts.section.panel": "Global / Panel",
		"msg.shortcuts.section.grid": "Grid View",
		"msg.shortcuts.section.viewer": "Standard Viewer",
		"msg.shortcuts.section.mfv": "Floating Viewer",
		"msg.shortcuts.section.video": "Video Playback",
		"msg.category.release": "Release",
		"msg.whatsNew.title.version250": "New Version 2.5.0",
		"msg.whatsNew.body.version250": "Version 2.5.0 released. New Features: experimental JPEG XL support, native nested subgraphs in Graph Map, extended technical metadata, new viewer playback speeds, source-file actions, and an expanded Find Similar menu. Improved: runtime metadata ingestion, Rodin 3D grouping, output color management, prompt extraction, workflow matching, sidebar presentation, viewer rendering, and ComfyUI toolbar integration. Fixed: tags shortcuts, viewer playback and Floating Viewer controls, source-file loading, popover dismissal, generation information stability, Open in Folder, and subgraph workflow parsing.",
		"msg.whatsNew.title.dndGraphMapSettings": "New Version 2.4.9 - DnD, Graph Map & Settings",
		"msg.whatsNew.body.dndGraphMapSettings": "Version 2.4.9 released: Drag and Drop has been fixed and clarified, including canvas/node drops, staging behavior, visual feedback, and ComfyUI workflow-drop interactions. Graph Map in the Floating Viewer now lets you inspect embedded workflows without opening them on the canvas, copy nodes or attributes, and transfer node attributes to a similar selected node in the canvas. Settings access and explanations were also improved, with easier access from the panel gear icon and the Floating Viewer.",
		"msg.whatsNew.title.version246": "New Version 2.4.6",
		"msg.whatsNew.body.version246": "Version 2.4.6 released: Various bug fixes and performance & fluidity improvements. Improved concatenate support for default and custom nodes (by Forsion07). Added support helpers for Api Node and Ernie Image. Live Stream in Floating Viewer is now disabled by default. See CHANGELOG for details.",
		"msg.whatsNew.title.gridMfvToolboxUpgrade": "What's New - Grid & MFV Upgrade",
		"msg.whatsNew.body.gridMfvToolboxUpgrade": "Grid performance and fluidity have been improved. The Majoor Floating Viewer is no longer a light viewer only: it now includes advanced features such as Node Stream, Node Parameters, and direct node editing from inside the viewer. New tools were also added to the toolbox, alongside broader code corrections and cleanup.",
		"msg.tip.title.majoorImageOpsNodePack": "Do you know this node pack ?",
		"msg.tip.body.majoorImageOpsNodePack": "Discover Majoor ImageOps, a ComfyUI node pack with practical image operation nodes for your workflows.",
		"label.openNodePack": "Open Node Pack",
		"msg.tip.title.graphMapGuide": "Tip - Graph Map Guide",
		"msg.tip.body.graphMapGuide": "Graph Map now has its own documentation page with screenshots and a quick walkthrough. Open the guide to see how to read the workflow map, inspect selected nodes, and use the node detail actions.",
		"label.graphMapGuide": "Graph Map Guide",
		"msg.tip.title.mfvGuide": "Tip - MFV Guide",
		"msg.tip.body.mfvGuide": "MFV now has its own illustrated guide covering compare modes, A/B/C/D pins, streams, node parameters, run/stop, pop-out, and how Graph Map complements the viewer workflow.",
		"label.mfvGuide": "MFV Guide",
		"label.changelog": "Changelog",
		"label.settingsGuide": "Settings Guide",
		"msg.tip.title.mfvLivePreviewDefaults": "Tip - Floating Viewer Auto-Open",
		"msg.tip.body.mfvLivePreviewDefaults": "Live Stream (green button in the viewer) and KSampler Preview can be activated by default via Settings → Majoor Assets Manager › Viewer. Live Stream follows final generation outputs after execution. KSampler Preview streams denoising frames during execution. Selected-node previews are handled by Node Stream.",
		"msg.whatsNew.title.version243": "New Version 2.4.3",
		"msg.whatsNew.body.version243": "Version 2.4.3 released: Improved assets metadata parsing, Grid Compare capability in floating viewer up to 4 Assets, ping pong loop in main Viewer player, job id and stack id in DB for better assets management, stack assets generated from same workflow job with same job ID, generated feed feature, lite version of grid in bottom tab. Code refactor for maintainability and various bug fixes. See CHANGELOG for details.",
		"msg.whatsNew.title.version241": "New Version 2.4.1",
		"msg.whatsNew.body.version241": "Version 2.4.1 released: CLIP-based semantic search with AI toggle, rgthree/easy node support, shortcut guide tab, upscaler model extraction. Fixed MFV memory leaks, workflow filters, SQL placeholders. Enhanced geninfo extraction, tag handling, calendar. See CHANGELOG for details.",
		"msg.whatsNew.title.floatingViewerShortcuts": "What's New",
		"msg.whatsNew.body.floatingViewerShortcuts": "Floating Viewer keyboard shortcuts added: Open/close MFV with V, compare with C, Live Stream with L, and KSampler Preview with K. See the Shortcut Guide tab for the full list.",
		"msg.whatsNew.title.pinReference": "What's New",
		"msg.whatsNew.body.pinReference": "Floating Viewer: new Pin Reference feature. You can now pin A or B, then compare quickly with selected assets in the grid while keeping the fixed reference.",
		"msg.whatsNew.title.vectorResetKeepVectors": "Important",
		"msg.whatsNew.body.vectorResetKeepVectors": "Reset index and Delete DB now first ask whether to keep AI vectors. If you already have older indexed assets, keeping the vectors is recommended: a full reset without them can trigger a long Vector Backfill for old assets and temporarily increase RAM usage.",
		"msg.whatsNew.title.localUserGuide": "Need help?",
		"msg.whatsNew.body.localUserGuide": "Open the local User Guide directly from your Assets Manager custom_nodes folder.",
		"msg.category.development": "Development",
		"msg.development.title.vueRefactoring": "Vue 3 Refactoring",
		"msg.development.body.vueRefactoring": "Frontend modernization ongoing: Core UI components are being migrated to Vue 3 for better maintainability and compatibility with new ComfyUI frontend. This ensures long-term support and cleaner architecture.",
		"label.viewProgress": "View Progress",
		"msg.collectionAdd.added": "Added {added} item(s) to \"{name}\".",
		"msg.collectionAdd.skippedExisting": "Skipped {count} item(s): already present in the collection.",
		"msg.collectionAdd.skippedDuplicate": "Ignored {count} duplicate(s) in selection.",
		"msg.collectionAdd.noneAddedExisting": "No new items added to \"{name}\" (all exist).",
		"msg.nightlyUpdateTitle": "Nightly update available",
		"msg.nightlyUpdateDetail": "A newer nightly build is available. Download it here: https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/releases/tag/nightly",
		"msg.newVersionTitle": "Majoor Assets Manager update available",
		"msg.newVersionDetail": "Version {latest} is available. You are currently using {current}.",
		"msg.dbResetNotice": "Database reset required",
		"viewer.genInfo": "Generation Info",
		"viewer.workflow": "Workflow",
		"viewer.noWorkflow": "No workflow data",
		"viewer.noMetadata": "No metadata available",
		"viewer.copySuccess": "Copied to clipboard!",
		"viewer.copySuccessShort": "Copied!",
		"viewer.copyFailed": "Failed to copy",
		"viewer.mode": "Viewer mode",
		"viewer.mode.simple": "Simple",
		"viewer.mode.abCompare": "A/B Compare",
		"viewer.mode.sideBySide": "Side-by-side",
		"viewer.mode.grid": "Grid",
		"viewer.pinSlots": "Pin slots A/B/C/D",
		"video.controls": "Video controls",
		"video.previewControls": "Video preview controls",
		"video.playPause": "Play/Pause",
		"video.playPauseSpace": "Play/Pause (Space)",
		"video.play": "Play",
		"video.pause": "Pause",
		"video.seek": "Seek",
		"video.seekThrough": "Seek through video",
		"video.dragSetIn": "Drag to set In",
		"video.dragSetOut": "Drag to set Out",
		"video.currentTimeTotal": "Current time / Total duration",
		"video.currentFrame": "Current frame number",
		"video.stepBack": "Step back",
		"video.stepForward": "Step forward",
		"video.goToIn": "Go to In",
		"video.goToOut": "Go to Out",
		"video.setInFromCurrent": "Set In from current frame",
		"video.setOutFromCurrent": "Set Out from current frame",
		"video.loopPlaybackInRange": "Loop playback in range",
		"video.pingpongPlayback": "Ping-pong playback (forward then reverse)",
		"video.loop": "Loop",
		"video.inFrame": "In frame",
		"video.outFrame": "Out frame",
		"video.frameIncrement": "Frame increment",
		"video.fpsStepping": "FPS (used for frame stepping)",
		"video.fps": "FPS",
		"video.playbackSpeed": "Playback speed",
		"video.mute": "Mute",
		"video.unmute": "Unmute",
		"video.volume": "Volume",
		"video.resetInToStart": "Reset In to start",
		"video.resetOutToEnd": "Reset Out to end",
		"video.step": "Step",
		"video.speed": "Speed",
		"video.resetPlayerControls": "Reset player controls",
		"sidebar.placeholderSelectAsset": "Select an asset to see details",
		"sidebar.details": "Details",
		"sidebar.preview": "Preview",
		"sidebar.rating": "Rating",
		"sidebar.tags": "Tags",
		"sidebar.addTag": "Add tag...",
		"sidebar.noTags": "No tags",
		"sidebar.filename": "Filename",
		"sidebar.dimensions": "Dimensions",
		"sidebar.date": "Date",
		"sidebar.size": "Size",
		"sidebar.genTime": "Generation time",
		"sidebar.fileInfo.title": "File Info",
		"sidebar.fileInfo.dimensionsTooltip": "Image/video resolution in pixels",
		"sidebar.fileInfo.duration": "Duration",
		"sidebar.fileInfo.durationTooltip": "Video duration",
		"sidebar.fileInfo.fpsTooltip": "Native frame rate",
		"sidebar.fileInfo.length": "Length",
		"sidebar.fileInfo.frames": "{count} frames",
		"sidebar.fileInfo.lengthTooltip": "Total frame count",
		"sidebar.fileInfo.generationTime": "Generation Time",
		"sidebar.fileInfo.generationTimeTooltip": "Time taken to generate this asset (workflow execution time)",
		"sidebar.fileInfo.time": "Time",
		"sidebar.fileInfo.dateTooltip": "File creation/generation date",
		"sidebar.fileInfo.timeTooltip": "File creation/generation time",
		"sidebar.fileInfo.fileSize": "File Size",
		"sidebar.fileInfo.fileSizeTooltip": "File size on disk",
		"sidebar.fileInfo.assetId": "Asset ID",
		"sidebar.fileInfo.assetIdTooltip": "Internal database asset identifier",
		"sidebar.fileInfo.jobId": "Job ID",
		"sidebar.fileInfo.jobIdTooltip": "Workflow execution job identifier (prompt_id)",
		"sidebar.fileInfo.sourceNode": "Source Node",
		"sidebar.fileInfo.sourceNodeTooltip": "ComfyUI node id that produced this file",
		"sidebar.fileInfo.nodeType": "Node Type",
		"sidebar.fileInfo.nodeTypeTooltip": "ComfyUI node class that produced this file",
		"sidebar.fileInfo.workflowId": "Workflow ID",
		"sidebar.fileInfo.workflowIdTooltip": "ComfyUI workflow identifier (from workflow.id in extra_data)",
		"sidebar.folder.details": "Folder Details",
		"sidebar.folder.name": "Name",
		"sidebar.folder.path": "Path",
		"sidebar.folder.folders": "Folders",
		"sidebar.folder.files": "Files",
		"sidebar.folder.created": "Created",
		"sidebar.folder.modified": "Modified",
		"sidebar.folder.note": "Note",
		"sidebar.folder.scanTruncated": "Scan was truncated for performance",
		"sidebar.generation.title": "Generation",
		"sidebar.generation.workflowEngine": "Workflow engine: {value}",
		"sidebar.generation.apiProvider": "API provider: {value}",
		"sidebar.generation.override": "Override",
		"sidebar.generation.overrideTooltip": "This field was forced by Majoor Gen Info Override",
		"sidebar.generation.metadataTruncated": "Metadata Truncated",
		"sidebar.generation.metadataTruncatedBody": "Generation data is incomplete because it exceeded the size limit.",
		"sidebar.generation.generationData": "Generation Data",
		"sidebar.generation.mediaOnlyPipeline": "This file looks like a media-only pipeline (e.g. LoadVideo/VideoCombine) and does not contain generation parameters.",
		"sidebar.generation.promptPipeline": "Prompt Pipeline ({count} variants)",
		"sidebar.generation.promptN": "Prompt {n}",
		"sidebar.generation.positive": "POSITIVE",
		"sidebar.generation.negative": "NEGATIVE",
		"sidebar.generation.positivePrompt": "Positive Prompt",
		"sidebar.generation.negativePrompt": "Negative Prompt",
		"sidebar.generation.promptAlignment": "Prompt Alignment",
		"sidebar.generation.promptAlignmentTooltip": "How closely the generated image matches the prompt (SigLIP2 score)",
		"sidebar.generation.aiCaptionTooltip": "AI caption generated by Florence-2",
		"sidebar.generation.copyCaptionTooltip": "Click to copy caption",
		"sidebar.generation.aiCaptionDisabled": "AI caption controls are disabled",
		"sidebar.generation.aiDisabledEnv": "AI features are disabled (enable vector search env var).",
		"sidebar.generation.aiDisabledSettings": "AI features are disabled in settings.",
		"sidebar.generation.imageDescription": "Image Description",
		"sidebar.generation.noImageDescription": "No image description yet.",
		"sidebar.generation.lyrics": "Lyrics",
		"sidebar.generation.pipeline": "Generation Pipeline",
		"sidebar.generation.stageBase": "Base",
		"sidebar.generation.stageTextToImage": "Text-to-Image",
		"sidebar.generation.stageImageToImage": "Image-to-Image",
		"sidebar.generation.stageInpaint": "Inpaint",
		"sidebar.generation.stageUpscale": "Upscale",
		"sidebar.generation.stageRefine": "Refine",
		"sidebar.generation.stageRefineUpscale": "Refine / Upscale",
		"sidebar.generation.stagePassN": "Pass {n}",
		"sidebar.generation.modelBranches": "Model Branches",
		"sidebar.generation.highNoise": "High Noise",
		"sidebar.generation.lowNoise": "Low Noise",
		"sidebar.generation.loraStack": "LoRA Stack",
		"sidebar.generation.modelLora": "Model & LoRA",
		"sidebar.generation.model": "Model",
		"sidebar.generation.models": "Models",
		"sidebar.generation.sampling": "Sampling",
		"sidebar.generation.audio": "Audio",
		"sidebar.generation.image": "Image",
		"sidebar.generation.notes": "Notes",
		"sidebar.generation.ttsInstruction": "TTS Instruction",
		"sidebar.generation.seed": "Seed",
		"sidebar.generation.copySeedTooltip": "Click to copy seed: {seed}",
		"sidebar.generation.sourceFiles": "Source Files",
		"sidebar.generation.customInfoN": "Custom Info {n}",
		"sidebar.generation.checkpoint": "Checkpoint",
		"sidebar.generation.checkpointN": "Checkpoint {n}",
		"sidebar.generation.upscaler": "Upscaler",
		"sidebar.generation.loras": "LoRAs",
		"sidebar.generation.sampler": "Sampler",
		"sidebar.generation.steps": "Steps",
		"sidebar.generation.cfgScale": "CFG Scale",
		"sidebar.generation.cfgHighNoise": "CFG High Noise",
		"sidebar.generation.cfgLowNoise": "CFG Low Noise",
		"sidebar.generation.scheduler": "Scheduler",
		"sidebar.generation.denoise": "Denoise",
		"sidebar.generation.narratorVoice": "Narrator Voice",
		"sidebar.generation.language": "Language",
		"sidebar.generation.repetitionPenalty": "Repetition Penalty",
		"sidebar.generation.maxNewTokens": "Max New Tokens",
		"sidebar.generation.device": "Device",
		"sidebar.generation.voicePreset": "Voice Preset",
		"sidebar.generation.compileMode": "Compile Mode",
		"sidebar.generation.torchCompile": "Torch Compile",
		"sidebar.generation.cudaGraphs": "CUDA Graphs",
		"sidebar.generation.xVectorOnly": "X-Vector Only",
		"sidebar.generation.chunking": "Chunking",
		"sidebar.generation.maxCharsChunk": "Max Chars/Chunk",
		"sidebar.generation.chunkMethod": "Chunk Method",
		"sidebar.generation.silenceBetweenChunks": "Silence Between Chunks (ms)",
		"sidebar.generation.audioCache": "Audio Cache",
		"sidebar.generation.batchSize": "Batch Size",
		"sidebar.generation.lyricsStrength": "Lyrics Strength",
		"sidebar.generation.clipSkip": "Clip Skip",
		"sidebar.generation.workflowNotes": "Workflow Notes",
		"sidebar.generation.temperature": "Temperature",
		"sidebar.generation.dtype": "Dtype",
		"sidebar.generation.attention": "Attention",
		"workflowSidebar.nodes": "Nodes",
		"workflowSidebar.links": "Links",
		"workflowSidebar.groups": "Groups",
		"workflowSidebar.close": "Close sidebar",
		"workflowSidebar.graphMap": "Graph Map",
		"workflowSidebar.comfyWorkflow": "ComfyUI Workflow",
		"workflowSidebar.workflowNodes": "Workflow Nodes",
		"workflowSidebar.moreNodes": "+{count} more nodes",
		"workflowSidebar.sourceSynthetic": "Synthetic",
		"workflowSidebar.sourceEmbedded": "Embedded",
		"workflowSidebar.sizeCompact": "Compact",
		"workflowSidebar.sizeComfort": "Comfort",
		"workflowSidebar.sizeExpanded": "Expanded",
		"workflowSidebar.minimapSizeTitle": "{label} minimap",
		"workflowSidebar.nodeLabels": "Node Labels",
		"workflowSidebar.nodeColors": "Node Colors",
		"workflowSidebar.showLinks": "Show Links",
		"workflowSidebar.showFramesGroups": "Show Frames/Groups",
		"workflowSidebar.renderBypassState": "Render Bypass State",
		"workflowSidebar.renderErrorState": "Render Error State",
		"workflowSidebar.showViewport": "Show Viewport",
		"workflowSidebar.minimapHint": "Click/drag to navigate - wheel to zoom",
		"workflowSidebar.showRawJson": "Show raw JSON",
		"genInfoOverride.autoFillFromWorkflow": "Auto fill from workflow",
		"genInfoOverride.pick": "Pick",
		"genInfoOverride.pickField": "Pick {field}",
		"genInfoOverride.pickFromWorkflow": "Pick Gen Info from workflow",
		"model3d.controlHint": "Rotate: left drag  Pan: right drag  Zoom: wheel",
		"model3d.viewportAction": "3D viewport action",
		"model3d.preview": "3D preview",
		"model3d.unavailable": "3D viewer unavailable",
		"model3d.background": "Background",
		"model3d.material": "Material",
		"model3d.skeleton": "Skeleton",
		"model3d.lights": "Lights",
		"model3d.intensity": "Intensity",
		"model3d.play": "Play",
		"model3d.pause": "Pause",
		"model3d.playPause": "Play / Pause",
		"model3d.playbackSpeed": "Playback speed",
		"model3d.reset": "Reset",
		"model3d.resetView": "Reset 3D view",
		"model3d.grid": "Grid",
		"model3d.toggleGrid": "Toggle grid",
		"model3d.persp": "Persp",
		"model3d.ortho": "Ortho",
		"model3d.switchCamera": "Switch perspective / orthographic",
		"model3d.settings": "Settings",
		"model3d.downloadFile": "Download {file}",
		"badge.collisionName": "Name: {name}",
		"badge.collisionPaths": "Paths:",
		"badge.collisionSelect": "Click to select collisions in current view",
		"badge.workflow.pendingParsing": "Pending: parsing metadata...",
		"badge.workflow.complete": "Complete: workflow + generation data detected",
		"badge.workflow.partialWorkflowOnly": "Partial: workflow only (generation data missing)",
		"badge.workflow.partialGenerationOnly": "Partial: generation data only (workflow missing)",
		"badge.workflow.none": "None: no workflow or generation data found",
		"badge.workflow.pendingNotParsed": "Pending: metadata not parsed yet",
		"badge.workflow.enrichmentQueued": "Pending: database metadata enrichment in progress ({count} queued)",
		"badge.workflow.enrichment": "Pending: database metadata enrichment in progress",
		"badge.workflow.aiTooltip": "{title}\nAI: {ai}\nClick to rescan this file",
		"badge.workflow.tooltip": "{title}\nClick to rescan this file",
		"badge.ai.vectorIndexed": "vector indexed",
		"badge.ai.tagSuggestions": "AI tag suggestions",
		"badge.ai.enhancedPrompt": "enhanced prompt",
		"badge.ai.indexed": "indexed",
		"badge.rating": "Rating: {rating} star{plural}",
		"badge.generationTimeMinutes": "Generation time: {minutes} minutes ({seconds}s)",
		"badge.generationTimeSeconds": "Generation time: {seconds} seconds",
		"badge.tags": "Tags: {tags}",
		"ctx.openViewer": "Open in viewer",
		"ctx.loadWorkflow": "Load workflow",
		"ctx.duplicateWorkflow": "Duplicate workflow",
		"ctx.renameWorkflow": "Rename workflow",
		"ctx.categorizeWorkflow": "Set workflow category",
		"ctx.deleteWorkflow": "Delete workflow",
		"dialog.workflowSaveName": "Workflow name",
		"dialog.workflowCategory": "Workflow category",
		"dialog.deleteWorkflowConfirm": "Delete this workflow JSON and its adjacent thumbnail files?",
		"toast.workflowSaved": "Workflow saved",
		"toast.workflowSaveFailed": "Failed to save workflow.",
		"toast.workflowSerializeFailed": "Could not read the current ComfyUI workflow.",
		"toast.workflowMissingPath": "Workflow file path is missing.",
		"toast.workflowLoadFailed": "Failed to load workflow.",
		"toast.workflowImportUnavailable": "ComfyUI workflow import is unavailable in this frontend.",
		"toast.workflowLoaded": "Workflow loaded",
		"toast.workflowUpdated": "Workflow updated",
		"toast.workflowDeleted": "Workflow deleted",
		"ctx.copyPath": "Copy path",
		"ctx.openInFolder": "Open in folder",
		"ctx.rename": "Rename",
		"ctx.delete": "Delete",
		"ctx.addToCollection": "Add to collection",
		"ctx.removeFromCollection": "Remove from collection",
		"ctx.newCollection": "New collection...",
		"ctx.rescanMetadata": "Rescan metadata",
		"ctx.createCollection": "Create collection...",
		"ctx.exitCollection": "Exit collection view",
		"ctx.createFolderHere": "Create folder here...",
		"ctx.renameFolder": "Rename folder...",
		"ctx.moveFolder": "Move folder...",
		"ctx.deleteFolder": "Delete folder...",
		"ctx.resetIndexFile": "Reset index (this file)",
		"ctx.download": "Download",
		"ctx.editTags": "Edit tags",
		"ctx.setRating": "Set rating",
		"ctx.resetRating": "Reset rating",
		"ctx.showMetadataPanel": "Show metadata panel",
		"ctx.unpinFolder": "Unpin folder",
		"ctx.openFolder": "Open folder",
		"ctx.pinAsBrowserRoot": "Pin as Browser Root",
		"dialog.confirm": "Confirm",
		"dialog.cancel": "Cancel",
		"dialog.yes": "Yes",
		"dialog.no": "No",
		"dialog.ok": "OK",
		"dialog.close": "Close",
		"dialog.prompt": "Prompt",
		"dialog.choiceTypeNumber": "Type a number:",
		"dialog.delete.title": "Delete file?",
		"dialog.delete.msg": "Are you sure you want to delete this file? This cannot be undone.",
		"dialog.rename.title": "Rename file",
		"dialog.rename.placeholder": "New filename",
		"dialog.newCollection.title": "New collection",
		"dialog.newCollection.placeholder": "Collection name",
		"dialog.resetIndex.title": "Reset index?",
		"dialog.resetIndex.msg": "This will delete the database and rescan all files. Continue?",
		"dialog.emptyTrash.title": "Empty trash?",
		"dialog.emptyTrash.confirm": "Permanently delete {count} trashed files ({size}) that came from Majoor's folders? This cannot be undone.",
		"dialog.securityWarning": "This looks like a system or very broad directory.\n\nAdding it can expose sensitive files via the viewer/custom roots feature.\n\nContinue?",
		"dialog.securityWarningTitle": "Majoor: Security Warning",
		"dialog.enterFolderPath": "Enter a folder path to add as a Custom root:",
		"dialog.customFoldersTitle": "Majoor: Custom Folders",
		"dialog.removeFolder": "Remove the custom folder \"{name}\"?",
		"dialog.deleteCollection": "Delete collection \"{name}\"?",
		"dialog.createCollection": "Create collection",
		"dialog.collectionPlaceholder": "My collection",
		"dialog.browserRootLabelOptional": "Label for new browser root (optional)",
		"dialog.newFolderName": "New folder name",
		"dialog.renameFolder": "Rename folder",
		"dialog.destinationDirectoryPath": "Destination directory path",
		"dialog.deleteFolderRecursive": "Delete folder \"{name}\" and all contents?",
		"dialog.folderLabelOptional": "Folder label (optional)",
		"dialog.unpinFolder": "Unpin folder \"{name}\"?",
		"dialog.dbRestore.confirm": "Restore selected DB backup? This will replace current DB.",
		"dialog.mergeDuplicateTags": "Merge duplicate tags?",
		"dialog.deleteExactDuplicates": "Delete exact duplicates?",
		"dialog.startDuplicateAnalysis": "Start duplicate analysis?",
		"dialog.dbDelete.confirm": "This will permanently delete the index database and rebuild it from scratch. All ratings, tags, and cached metadata will be lost.\n\nContinue?",
		"dialog.settingsSaveFailed": "Majoor: Failed to save settings (browser storage full or blocked).",
		"dialog.confirmDeleteTitle": "Majoor: Confirm delete",
		"dialog.deleteSelectedFiles": "Delete {count} selected files?",
		"dialog.deleteSingleFile": "Delete \"{label}\"?",
		"dialog.vectorsReset.title": "AI vectors",
		"dialog.vectorsReset.choice": "Also reset AI vectors?\n\nConfirm = yes, reset everything (vectors will be recalculated)\nCancel = no, keep existing vectors",
		"dialog.vectorsReset.keepQuestion": "Keep existing AI vectors?\n\nConfirm = keep vectors\nCancel = continue without vectors",
		"dialog.vectorsReset.wipeConfirm": "Reset AI vectors too?\n\nConfirm = yes, reset everything\nCancel = abort",
		"dialog.vectorsReset.singleQuestion": "Choose reset mode for {action}:\n\nYes = keep existing AI vectors\nNo = full reset (vectors will be recalculated)\nCancel = abort",
		"dialog.vectorsReset.optionKeep": "Yes - keep vectors",
		"dialog.vectorsReset.optionFull": "No - full reset",
		"dialog.vectorsReset.optionCancel": "Cancel",
		"dialog.resetIndex.confirmKeepVectors": "This will reset index data and rescan files while keeping existing AI vectors.\n\nContinue?",
		"dialog.dbDelete.keepVectorsConfirm": "This will reset index data and keep existing AI vectors. Database files will not be force-deleted.\n\nContinue?",
		"toast.scanStarted": "Scan started",
		"toast.scanComplete": "Scan complete",
		"toast.scanCompleteSummary": "{added} new, {removed} removed",
		"toast.scanFailed": "Scan failed",
		"toast.resetTriggered": "Reset triggered: Reindexing all files...",
		"toast.resetStarted": "Index reset started. Files will be reindexed in the background.",
		"toast.resetFailed": "Failed to reset index",
		"toast.resetFailedCorrupt": "Reset failed - database is corrupted. Use the \"Delete DB\" button to force-delete and rebuild.",
		"toast.dbDeleteTriggered": "Deleting database and rebuilding...",
		"toast.dbDeleteSuccess": "Database deleted and rebuilt. Files are being reindexed.",
		"toast.dbDeleteFailed": "Failed to delete database",
		"toast.memoryPurgeComplete": "Memory purge complete. Majoor AI and ComfyUI model caches were released.",
		"toast.memoryPurgeCompleteMajoorOnly": "Memory purge complete. Majoor AI caches were released.",
		"toast.deleted": "File deleted",
		"toast.renamed": "File renamed",
		"toast.addedToCollection": "Added to collection",
		"toast.removedFromCollection": "Removed from collection",
		"toast.collectionCreated": "Collection created",
		"toast.permissionDenied": "Permission denied",
		"toast.tagAdded": "Tag added",
		"toast.tagRemoved": "Tag removed",
		"toast.ratingSaved": "Rating saved",
		"toast.failedAddFolder": "Failed to add custom folder",
		"toast.failedRemoveFolder": "Failed to remove custom folder",
		"toast.folderLinked": "Folder linked successfully",
		"toast.folderRemoved": "Folder removed",
		"toast.errorAddingFolder": "An error occurred while adding the custom folder",
		"toast.errorRemovingFolder": "An error occurred while removing the custom folder",
		"toast.failedCreateCollection": "Failed to create collection",
		"toast.failedDeleteCollection": "Failed to delete collection",
		"toast.languageChanged": "Language changed. Reload the page for full effect.",
		"toast.ratingUpdateFailed": "Failed to update rating",
		"toast.ratingUpdateError": "Error updating rating",
		"toast.tagsUpdateFailed": "Failed to update tags",
		"toast.watcherToggleFailed": "Failed to toggle watcher",
		"toast.noValidAssetsSelected": "No valid assets selected.",
		"toast.failedCreateCollectionDot": "Failed to create collection.",
		"toast.failedAddAssetsToCollection": "Failed to add assets to collection.",
		"toast.failedCreateSmartCollection": "Failed to create smart collection",
		"toast.failedAddAssetsToSmartCollection": "Failed to add assets to smart collection",
		"toast.noGroupsFoundIndexFirst": "No groups found. Index more assets first.",
		"toast.failedLoadClusterAssets": "Failed to load cluster assets",
		"toast.collectionCreatedWithAssets": "Collection \"{name}\" created with {count} assets!",
		"toast.collectionCreatedNamed": "Collection \"{name}\" created.",
		"toast.clusterAnalysisFailed": "Cluster analysis failed",
		"toast.removeFromCollectionFailed": "Failed to remove from collection.",
		"toast.removeFromCollectionError": "Error removing from collection: {error}",
		"toast.copyClipboardFailed": "Failed to copy to clipboard",
		"toast.metadataRefreshFailed": "Failed to refresh metadata.",
		"toast.ratingCleared": "Rating cleared",
		"toast.ratingSetN": "Rating set to {n} stars",
		"toast.tagsUpdated": "Tags updated",
		"toast.remoteLanPresetApplied": "Recommended remote LAN setup applied. This browser session is now authorized for Majoor write operations.",
		"toast.remoteLanPresetFailed": "Failed to apply the recommended remote LAN setup.",
		"toast.createFolderFailed": "Failed to create folder",
		"toast.createFolderFailedDetail": "Failed to create folder: {error}",
		"toast.renameFolderFailed": "Failed to rename folder",
		"toast.renameFolderFailedDetail": "Failed to rename folder: {error}",
		"toast.moveFolderFailed": "Failed to move folder",
		"toast.moveFolderFailedDetail": "Failed to move folder: {error}",
		"toast.deleteFolderFailed": "Failed to delete folder",
		"toast.deleteFolderFailedDetail": "Failed to delete folder: {error}",
		"toast.folderCreated": "Folder created: {name}",
		"toast.folderRenamed": "Folder renamed",
		"toast.folderMoved": "Folder moved",
		"toast.folderDeleted": "Folder deleted",
		"toast.pinFolderFailed": "Failed to pin folder",
		"toast.unpinFolderFailed": "Failed to unpin folder",
		"toast.folderPinnedAsBrowserRoot": "Folder pinned as browser root",
		"toast.folderAdded": "Folder added",
		"toast.dbSaveSuccess": "DB backup saved",
		"toast.dbSaveFailed": "Failed to save DB backup",
		"toast.dbRestoreStarted": "DB restore started",
		"toast.dbRestoreFailed": "Failed to restore DB backup",
		"toast.dbRestoreSelect": "Select a DB backup first",
		"toast.dbRestoreStopping": "Stopping running workers",
		"toast.dbRestoreResetting": "Unlocking and resetting database",
		"toast.dbRestoreReplacing": "Replacing database files",
		"toast.dbRestoreRescan": "Restarting scan",
		"toast.dbRestoreSuccess": "Database backup restored",
		"toast.trashIsEmpty": "Trash is empty",
		"toast.trashRemoved": "{count} files removed ({size})",
		"toast.trashFailures": "{count} entries could not be removed",
		"toast.trashSkippedDirs": "{count} directories in the trash were not removed",
		"toast.trashStatusFailed": "Failed to check trash",
		"toast.trashEmptyFailed": "Failed to empty trash",
		"toast.trashUnsupported": "Trash is not supported on this platform",
		"toast.nameCollisionInView": "Name collision in current view",
		"toast.fileRenamedSuccess": "File renamed successfully!",
		"toast.fileRenameFailed": "Failed to rename file.",
		"toast.fileDeletedSuccess": "File deleted successfully!",
		"toast.fileDeleteFailed": "Failed to delete file.",
		"toast.openedInFolder": "Opened in folder",
		"toast.openFolderFailed": "Failed to open folder.",
		"toast.pathCopied": "File path copied to clipboard",
		"toast.unableResolveFolderPath": "Unable to resolve folder path",
		"toast.pathCopyFailed": "Failed to copy path",
		"toast.noFilePath": "No file path available for this asset.",
		"toast.writeAuthBootstrapHelp": "Write access is blocked. Sign in to ComfyUI and retry so Majoor can bootstrap the remote session automatically, or set a Majoor API token in Settings -> Security.",
		"toast.writeAuthSignInRequired": "Write access is blocked. Sign in to ComfyUI first, then retry so Majoor can bootstrap the remote session token automatically.",
		"toast.writeAuthConfiguredTokenRequired": "Write access requires the Majoor API token already configured on the server. Open Settings -> Security -> API Token and enter the matching token.",
		"toast.writeAuthInsecureTransport": "Write access is blocked because the Majoor API token is being sent over plain HTTP from a remote machine. Use HTTPS, or enable Settings -> Security -> Allow HTTP Token Transport for a trusted LAN.",
		"toast.writeAuthTitle": "Majoor remote write access",
		"toast.vectorBackfillStarting": "Starting vector backfill... This may take a while.",
		"toast.vectorBackfillRunning": "Vector backfill still running in background{job}.",
		"toast.vectorBackfillComplete": "Vector backfill complete! Processed: {processed}, Indexed: {indexed}, Skipped: {skipped}",
		"toast.vectorBackfillFailedGeneric": "Backfill failed",
		"toast.vectorBackfillFailedDetail": "Vector backfill failed: {error}",
		"toast.aiSearchPartiallyIndexed": "AI search index is only partially built ({indexed}/{eligible}, {percent}%). Run Vector Backfill for existing assets.",
		"toast.rescanUpdatingAiIndex": "Rescanning file + updating AI index...",
		"toast.metadataVectorUpdated": "Metadata + AI vector index updated for this asset.",
		"toast.metadataUpdatedVectorFailed": "Metadata updated. AI vector index could not be updated.",
		"toast.downloadingFile": "Downloading {filename}...",
		"toast.playbackRate": "Playback {rate}x",
		"toast.metadataRefreshed": "Metadata refreshed{suffix}",
		"toast.enrichmentComplete": "Metadata enrichment complete",
		"toast.errorRenaming": "Error renaming file: {error}",
		"toast.errorDeleting": "Error deleting file: {error}",
		"toast.tagMergeFailed": "Tag merge failed: {error}",
		"toast.deleteFailed": "Delete failed: {error}",
		"toast.analysisNotStarted": "Analysis not started: {error}",
		"toast.dupAnalysisStarted": "Duplicate analysis started",
		"toast.tagsMerged": "Tags merged",
		"toast.duplicatesDeleted": "Duplicates deleted",
		"toast.playbackVideoOnly": "Playback speed is available for video media only",
		"toast.filesDeletedSuccessN": "{n} files deleted successfully!",
		"toast.filesDeletedPartial": "{success} files deleted, {failed} failed.",
		"toast.filesDeletedShort": "{n} files deleted",
		"toast.filesDeletedShortPartial": "{success} deleted, {failed} failed",
		"toast.filesDeletingProgress": "Deleting files... ({done}/{total})",
		"toast.copiedToClipboardNamed": "{name} copied to clipboard!",
		"toast.rescanningFile": "Rescanning file",
		"toast.failedToggleWatcher": "Failed to toggle watcher",
		"toast.failedUpdateMetadataFallback": "Failed to update metadata fallback settings",
		"toast.failedSetIndexDirectory": "Failed to set index directory",
		"toast.indexDirectorySavedRestart": "Index directory saved. Restart ComfyUI to apply.",
		"toast.failedSetOutputDirectory": "Failed to set output directory",
		"toast.nativeBrowserUnavailable": "Native folder browser unavailable. Please enter path manually.",
		"summary.assets": "assets",
		"summary.folders": "folders",
		"summary.selected": "selected",
		"summary.hidden": "hidden",
		"summary.duplicates": "duplicates",
		"summary.similar": "similar",
		"command.openFloatingViewer": "Open floating viewer",
		"command.openGeneratedFeed": "Open generated feed",
		"command.openSettings": "Open Majoor settings",
		"command.openNodeContext": "Show assets from selected node",
		"command.openNodeInFloatingViewer": "Open node media in floating viewer",
		"tooltip.openAssetsManager": "Open Majoor Assets Manager",
		"tooltip.openFloatingViewer": "Open Majoor floating viewer",
		"tooltip.openGeneratedFeed": "Open the Majoor generated feed panel",
		"tooltip.openNodeContext": "Show the latest indexed assets produced by this node",
		"tooltip.openNodeInFloatingViewer": "Open this node's media in the Majoor floating viewer",
		"tooltip.openMajoorSettings": "Open Majoor Assets Manager settings",
		"nodeContext.fileNotIndexed": "The node file is not indexed yet. Run a scan first.",
		"nodeContext.fileResultsTitle": "Node {node} file ({n} assets)",
		"label.refineResults": "Refine your results",
		"label.workflowModelFamily": "Model family",
		"placeholder.workflowModelFamily": "Flux, Wan, SDXL...",
		"label.workflowRunsOn": "Runs on",
		"action.clearAll": "Clear all",
		"status.cached": "Last known status",
		"status.toast.workflow": "Index status: workflow scope",
		"hotkey.scan": "Scan (S)",
		"hotkey.search": "Search (Ctrl+F)",
		"hotkey.details": "Toggle details (D)",
		"hotkey.delete": "Delete (Del)",
		"hotkey.viewer": "Open viewer (Enter)",
		"hotkey.escape": "Close (Esc)",
		"viewer.studio.abLoop": "A-B loop (I / O, U to clear)",
		"viewer.studio.actualSize": "Actual size",
		"viewer.studio.aspect": "Aspect ratio mask",
		"viewer.studio.channels": "Channels",
		"viewer.studio.checker": "Transparency checkerboard",
		"viewer.studio.clearLoop": "Clear A-B loop",
		"viewer.studio.close": "Close (Esc)",
		"viewer.studio.compare": "Compare A/B (C)",
		"viewer.studio.compareTool": "Compare A/B (C)",
		"viewer.studio.copied": "Copied to clipboard",
		"viewer.studio.copy": "Copy image / frame to clipboard",
		"viewer.studio.copyFailed": "Could not copy this image",
		"viewer.studio.download": "Download",
		"viewer.studio.ev": "Exposure",
		"viewer.studio.exportFrame": "Save this frame as PNG",
		"viewer.studio.exposure": "Exposure / gamma",
		"viewer.studio.filmstrip": "Filmstrip",
		"viewer.studio.fit": "Fit",
		"viewer.studio.frame": "Frame",
		"viewer.studio.fullscreen": "Fullscreen (F)",
		"viewer.studio.gamma": "Gamma",
		"viewer.studio.grid": "Guides (G)",
		"viewer.studio.histogram": "Histogram",
		"viewer.studio.inspector": "Generation info (Tab)",
		"viewer.studio.loop": "Loop",
		"viewer.studio.loupe": "Loupe (L) - right-click for settings",
		"viewer.studio.loupeTitle": "Loupe",
		"viewer.studio.magnification": "Magnification",
		"viewer.studio.mediaError": "This file cannot be played by the browser.",
		"viewer.studio.mute": "Mute (M)",
		"viewer.studio.next": "Next (→)",
		"viewer.studio.nextB": "Next B",
		"viewer.studio.nextFrame": "Next frame (.)",
		"viewer.studio.opacity": "Opacity",
		"viewer.studio.pinB": "Use the current asset as B (B)",
		"viewer.studio.pinBShort": "Set B",
		"viewer.studio.play": "Play",
		"viewer.studio.playPause": "Play / pause (Space)",
		"viewer.studio.prev": "Previous (←)",
		"viewer.studio.prevB": "Previous B",
		"viewer.studio.prevFrame": "Previous frame (,)",
		"viewer.studio.probe": "Pixel probe (P)",
		"viewer.studio.reset": "Reset",
		"viewer.studio.resetTools": "Reset all tools (R)",
		"viewer.studio.scopes": "Scopes (S)",
		"viewer.studio.seek": "Seek",
		"viewer.studio.size": "Size",
		"viewer.studio.speed": "Speed ([ / ])",
		"viewer.studio.swap": "Swap A and B (X)",
		"viewer.studio.swapShort": "Swap",
		"viewer.studio.tabFile": "File",
		"viewer.studio.tabGeneration": "Generation",
		"viewer.studio.tabWorkflow": "Workflow",
		"viewer.studio.threshold": "Threshold",
		"viewer.studio.title": "Viewer",
		"viewer.studio.tools": "Review tools",
		"viewer.studio.unsupported": "No preview for this file type.",
		"viewer.studio.volume": "Volume",
		"viewer.studio.waveform": "Waveform",
		"viewer.studio.wipe": "Wipe",
		"viewer.studio.zebra": "Zebra highlights (Z)",
		"viewer.studio.zoomHint": "Wheel to zoom, double-click for fit / 100 %"
	},
	"fr-FR": {
		"tab.output": "Sortie",
		"tab.input": "Entree",
		"tab.all": "Tout",
		"tab.custom": "Navigateur",
		"tab.workflow": "Workflow",
		"tab.similar": "Similaire",
		"manager.title": "Gestionnaire d'assets",
		"manager.sidebarLabel": "Assets\nManager",
		"cat.feed": "Flux genere",
		"command.scanAssets": "Scanner les assets",
		"command.toggleFloatingViewer": "Basculer le floating viewer",
		"command.refreshAssetsGrid": "Rafraichir la grille d'assets",
		"bottomFeed.title": "Flux Genere",
		"label.floatingViewer": "Viewer",
		"bottomFeed.subtitle": "Version legere de la grille output avec assets recents et anciens",
		"bottomFeed.openManager": "Ouvrir le manager",
		"bottomFeed.refresh": "Rafraichir",
		"bottomFeed.loading": "Chargement des assets recents...",
		"bottomFeed.empty": "Aucun asset genere pour le moment.",
		"bottomFeed.loadFailed": "Impossible de charger les assets generes.",
		"bottomFeed.groupTitle": "Groupe de generation",
		"bottomFeed.groupOpen": "Afficher les autres assets de cette generation",
		"scope.all": "Entrees + Sorties",
		"scope.allFull": "Tout (Entrees + Sorties)",
		"scope.input": "Entrees",
		"scope.output": "Sorties",
		"scope.custom": "Navigateur",
		"scope.workflow": "Workflow",
		"scope.customBrowser": "Navigateur",
		"scope.similar": "Similaire",
		"search.placeholder": "Rechercher des assets...",
		"search.title": "Rechercher par nom de fichier, tags ou attributs (ex. rating:5, ext:png)",
		"search.semanticToggle": "Activer/desactiver la recherche semantique IA (CLIP)",
		"search.aiSearch": "Recherche IA",
		"search.findSimilar": "Trouver similaires",
		"search.findingSimilar": "Recherche d'assets similaires...",
		"search.selectAssetForSimilar": "Selectionnez d'abord un asset pour trouver des images/videos similaires.",
		"search.findSimilarFailed": "Echec de la recherche similaire",
		"search.similarResults": "Similaires a l'asset #{id} ({n} resultats)",
		"search.similarReference": "Reference #{id}",
		"search.similarDisabled": "Les fonctionnalites IA sont desactivees dans les parametres",
		"tooltip.openMessages": "Messages et nouveautes",
		"tooltip.openMessagesUnread": "Messages ({count} non lus)",
		"tooltip.markMessagesRead": "Marquer tous les messages comme lus",
		"tooltip.noAssetsDay": "Aucun asset ce jour",
		"tooltip.assetsDaySingular": "{count} asset",
		"tooltip.assetsDayPlural": "{count} assets",
		"tooltip.openAssetsManager": "Ouvrir Majoor Assets Manager",
		"tooltip.openFloatingViewer": "Ouvrir le floating viewer Majoor",
		"tooltip.openGeneratedFeed": "Ouvrir le panneau du flux genere Majoor",
		"tooltip.openNodeContext": "Afficher les derniers assets indexes produits par ce noeud",
		"tooltip.openNodeInFloatingViewer": "Ouvrir le media de ce noeud dans le floating viewer Majoor",
		"tooltip.openMajoorSettings": "Ouvrir les parametres de Majoor Assets Manager",
		"tooltip.previewStreamOff": "Preview KSampler : OFF - cliquer pour afficher les images de denoising pendant l'execution",
		"tooltip.previewStreamOn": "Preview KSampler : ON - affiche les images de denoising pendant l'execution",
		"tooltip.nodeStreamOff": "Node Stream : OFF - cliquer pour suivre les previews du noeud selectionne, dont les canvas live ImageOps",
		"tooltip.nodeStreamOn": "Node Stream : ON - suit la preview du noeud selectionne quand un media frontend existe",
		"tooltip.nodeParams": "Parametres du noeud",
		"tooltip.queuePrompt": "Lancer le prompt",
		"tooltip.queueStop": "Arreter la generation",
		"tooltip.noUnreadMessages": "Aucun message non lu",
		"label.toastHistory": "Historique",
		"label.sameWorkflow": "Generes avec le meme workflow",
		"tooltip.tab.similar": "Parcourir les trouvailles similaires courantes",
		"tooltip.tab.workflow": "Parcourir les workflows enregistres",
		"tooltip.saveCurrentWorkflow": "Enregistrer le workflow courant",
		"tooltip.filterWorkflowId": "Filtrer les assets generes depuis le meme workflow embarque",
		"placeholder.workflowId": "Workflow ID",
		"ctx.loadWorkflow": "Charger le workflow",
		"ctx.duplicateWorkflow": "Dupliquer le workflow",
		"ctx.renameWorkflow": "Renommer le workflow",
		"ctx.categorizeWorkflow": "Definir la categorie du workflow",
		"ctx.deleteWorkflow": "Supprimer le workflow",
		"dialog.workflowSaveName": "Nom du workflow",
		"dialog.workflowCategory": "Categorie du workflow",
		"dialog.deleteWorkflowConfirm": "Supprimer ce JSON workflow et ses thumbnails adjacents ?",
		"toast.scanComplete": "Scan terminé",
		"toast.scanCompleteSummary": "{added} nouveau(x), {removed} retiré(s)",
		"toast.workflowSaved": "Workflow enregistre",
		"toast.workflowSaveFailed": "Echec de l'enregistrement du workflow.",
		"toast.workflowSerializeFailed": "Impossible de lire le workflow ComfyUI courant.",
		"toast.workflowMissingPath": "Chemin du fichier workflow manquant.",
		"toast.workflowLoadFailed": "Echec du chargement du workflow.",
		"toast.workflowImportUnavailable": "Import workflow ComfyUI indisponible dans ce frontend.",
		"toast.workflowLoaded": "Workflow charge",
		"toast.workflowUpdated": "Workflow mis a jour",
		"toast.workflowDeleted": "Workflow supprime",
		"action.copy": "Copier",
		"action.generate": "Generer",
		"action.clickToCopy": "Cliquer pour copier",
		"action.clear": "Effacer",
		"action.clearAll": "Tout effacer",
		"action.refresh": "Rafraichir",
		"command.openFloatingViewer": "Ouvrir le floating viewer",
		"command.openGeneratedFeed": "Ouvrir le flux genere",
		"command.openSettings": "Ouvrir les parametres Majoor",
		"command.openNodeContext": "Afficher les assets du noeud selectionne",
		"command.openNodeInFloatingViewer": "Ouvrir le media du noeud dans le floating viewer",
		"nodeContext.fileNotIndexed": "Le fichier du noeud n'est pas encore indexe. Lancez un scan d'abord.",
		"nodeContext.fileResultsTitle": "Fichier du noeud {node} ({n} assets)",
		"label.refineResults": "Affiner les resultats",
		"label.workflowModelFamily": "Famille de modele",
		"label.workflowRunsOn": "Execute sur",
		"placeholder.workflowModelFamily": "Flux, Wan, SDXL...",
		"status.loading": "Chargement",
		"status.disabled": "Desactive",
		"status.na": "N/A",
		"status.generating": "Generation...",
		"status.unavailable": "Indisponible",
		"status.cached": "Dernier statut connu",
		"status.toast.workflow": "Statut index : scope workflow",
		"status.memoryPurgeStarted": "Purge memoire demarree...",
		"state.on": "on",
		"state.off": "off",
		"btn.memoryPurge": "Purge memoire",
		"btn.memoryPurging": "Purge...",
		"tooltip.memoryPurge": "Decharge les modeles IA Majoor, demande a ComfyUI de decharger les modeles charges, puis vide le cache torch si ComfyUI est idle.",
		"toast.memoryPurgeComplete": "Purge memoire terminee. Les caches des modeles IA Majoor et ComfyUI ont ete liberes.",
		"toast.memoryPurgeCompleteMajoorOnly": "Purge memoire terminee. Les caches IA Majoor ont ete liberes.",
		"viewer.copySuccessShort": "Copie !",
		"sidebar.fileInfo.title": "Infos fichier",
		"sidebar.fileInfo.dimensionsTooltip": "Resolution image/video en pixels",
		"sidebar.fileInfo.duration": "Duree",
		"sidebar.fileInfo.durationTooltip": "Duree de la video",
		"sidebar.fileInfo.fpsTooltip": "Frequence d'image native",
		"sidebar.fileInfo.length": "Longueur",
		"sidebar.fileInfo.frames": "{count} frames",
		"sidebar.fileInfo.lengthTooltip": "Nombre total de frames",
		"sidebar.fileInfo.generationTime": "Temps de generation",
		"sidebar.fileInfo.generationTimeTooltip": "Temps necessaire pour generer cet asset (temps d'execution workflow)",
		"sidebar.fileInfo.time": "Heure",
		"sidebar.fileInfo.dateTooltip": "Date de creation/generation du fichier",
		"sidebar.fileInfo.timeTooltip": "Heure de creation/generation du fichier",
		"sidebar.fileInfo.fileSize": "Taille fichier",
		"sidebar.fileInfo.fileSizeTooltip": "Taille du fichier sur disque",
		"sidebar.fileInfo.assetId": "Asset ID",
		"sidebar.fileInfo.assetIdTooltip": "Identifiant interne de l'asset en base",
		"sidebar.fileInfo.jobId": "Job ID",
		"sidebar.fileInfo.jobIdTooltip": "Identifiant du job workflow (prompt_id)",
		"sidebar.fileInfo.sourceNode": "Node source",
		"sidebar.fileInfo.sourceNodeTooltip": "ID du node ComfyUI qui a produit ce fichier",
		"sidebar.fileInfo.nodeType": "Type de node",
		"sidebar.fileInfo.nodeTypeTooltip": "Classe du node ComfyUI qui a produit ce fichier",
		"sidebar.fileInfo.workflowId": "Workflow ID",
		"sidebar.fileInfo.workflowIdTooltip": "Identifiant du workflow ComfyUI (depuis workflow.id dans extra_data)",
		"sidebar.folder.details": "Details dossier",
		"sidebar.folder.name": "Nom",
		"sidebar.folder.path": "Chemin",
		"sidebar.folder.folders": "Dossiers",
		"sidebar.folder.files": "Fichiers",
		"sidebar.folder.created": "Cree",
		"sidebar.folder.modified": "Modifie",
		"sidebar.folder.note": "Note",
		"sidebar.folder.scanTruncated": "Scan tronque pour les performances",
		"sidebar.generation.title": "Generation",
		"sidebar.generation.workflowEngine": "Moteur workflow : {value}",
		"sidebar.generation.apiProvider": "Provider API : {value}",
		"sidebar.generation.override": "Override",
		"sidebar.generation.overrideTooltip": "Ce champ a ete force par Majoor Gen Info Override",
		"sidebar.generation.metadataTruncated": "Metadonnees tronquees",
		"sidebar.generation.metadataTruncatedBody": "Les donnees de generation sont incompletes car elles depassent la limite de taille.",
		"sidebar.generation.generationData": "Donnees de generation",
		"sidebar.generation.mediaOnlyPipeline": "Ce fichier ressemble a une pipeline media-only (ex. LoadVideo/VideoCombine) et ne contient pas de parametres de generation.",
		"sidebar.generation.promptPipeline": "Pipeline prompt ({count} variantes)",
		"sidebar.generation.promptN": "Prompt {n}",
		"sidebar.generation.positive": "POSITIF",
		"sidebar.generation.negative": "NEGATIF",
		"sidebar.generation.positivePrompt": "Prompt positif",
		"sidebar.generation.negativePrompt": "Prompt negatif",
		"sidebar.generation.promptAlignment": "Alignement prompt",
		"sidebar.generation.promptAlignmentTooltip": "Mesure a quel point l'image generee correspond au prompt (score SigLIP2)",
		"sidebar.generation.aiCaptionTooltip": "Caption IA generee par Florence-2",
		"sidebar.generation.copyCaptionTooltip": "Cliquer pour copier la caption",
		"sidebar.generation.aiCaptionDisabled": "Les controles de caption IA sont desactives",
		"sidebar.generation.aiDisabledEnv": "Les fonctions IA sont desactivees (activez la variable d'environnement vector search).",
		"sidebar.generation.aiDisabledSettings": "Les fonctions IA sont desactivees dans les parametres.",
		"sidebar.generation.imageDescription": "Description image",
		"sidebar.generation.noImageDescription": "Aucune description image pour le moment.",
		"sidebar.generation.lyrics": "Lyrics",
		"sidebar.generation.pipeline": "Pipeline de generation",
		"sidebar.generation.stageBase": "Base",
		"sidebar.generation.stageTextToImage": "Texte vers image",
		"sidebar.generation.stageImageToImage": "Image vers image",
		"sidebar.generation.stageInpaint": "Inpaint",
		"sidebar.generation.stageUpscale": "Upscale",
		"sidebar.generation.stageRefine": "Refine",
		"sidebar.generation.stageRefineUpscale": "Refine / Upscale",
		"sidebar.generation.stagePassN": "Pass {n}",
		"sidebar.generation.modelBranches": "Branches modele",
		"sidebar.generation.highNoise": "High Noise",
		"sidebar.generation.lowNoise": "Low Noise",
		"sidebar.generation.loraStack": "Stack LoRA",
		"sidebar.generation.modelLora": "Modele & LoRA",
		"sidebar.generation.model": "Modele",
		"sidebar.generation.sampling": "Sampling",
		"sidebar.generation.audio": "Audio",
		"sidebar.generation.image": "Image",
		"sidebar.generation.notes": "Notes",
		"sidebar.generation.ttsInstruction": "Instruction TTS",
		"sidebar.generation.seed": "Seed",
		"sidebar.generation.copySeedTooltip": "Cliquer pour copier le seed : {seed}",
		"sidebar.generation.sourceFiles": "Fichiers source",
		"sidebar.generation.customInfoN": "Info custom {n}",
		"sidebar.generation.checkpoint": "Checkpoint",
		"sidebar.generation.checkpointN": "Checkpoint {n}",
		"sidebar.generation.upscaler": "Upscaler",
		"sidebar.generation.loras": "LoRAs",
		"sidebar.generation.sampler": "Sampler",
		"sidebar.generation.steps": "Steps",
		"sidebar.generation.cfgScale": "CFG Scale",
		"sidebar.generation.cfgHighNoise": "CFG High Noise",
		"sidebar.generation.cfgLowNoise": "CFG Low Noise",
		"sidebar.generation.scheduler": "Scheduler",
		"sidebar.generation.denoise": "Denoise",
		"sidebar.generation.narratorVoice": "Voix narrateur",
		"sidebar.generation.language": "Langue",
		"sidebar.generation.repetitionPenalty": "Repetition Penalty",
		"sidebar.generation.maxNewTokens": "Max New Tokens",
		"sidebar.generation.device": "Device",
		"sidebar.generation.voicePreset": "Voice Preset",
		"sidebar.generation.compileMode": "Compile Mode",
		"sidebar.generation.torchCompile": "Torch Compile",
		"sidebar.generation.cudaGraphs": "CUDA Graphs",
		"sidebar.generation.xVectorOnly": "X-Vector Only",
		"sidebar.generation.chunking": "Chunking",
		"sidebar.generation.maxCharsChunk": "Max Chars/Chunk",
		"sidebar.generation.chunkMethod": "Methode chunk",
		"sidebar.generation.silenceBetweenChunks": "Silence entre chunks (ms)",
		"sidebar.generation.audioCache": "Cache audio",
		"sidebar.generation.batchSize": "Batch Size",
		"sidebar.generation.lyricsStrength": "Lyrics Strength",
		"sidebar.generation.clipSkip": "Clip Skip",
		"sidebar.generation.workflowNotes": "Notes workflow",
		"sidebar.generation.temperature": "Temperature",
		"sidebar.generation.dtype": "Dtype",
		"sidebar.generation.attention": "Attention",
		"viewer.mode": "Mode viewer",
		"viewer.mode.simple": "Simple",
		"viewer.mode.abCompare": "Comparaison A/B",
		"viewer.mode.sideBySide": "Cote a cote",
		"viewer.mode.grid": "Grille",
		"viewer.pinSlots": "Epingler les slots A/B/C/D",
		"workflowSidebar.nodes": "Noeuds",
		"workflowSidebar.links": "Liens",
		"workflowSidebar.groups": "Groupes",
		"workflowSidebar.close": "Fermer la sidebar",
		"workflowSidebar.graphMap": "Graph Map",
		"workflowSidebar.comfyWorkflow": "Workflow ComfyUI",
		"workflowSidebar.workflowNodes": "Noeuds du workflow",
		"workflowSidebar.moreNodes": "+{count} noeuds en plus",
		"workflowSidebar.sourceSynthetic": "Synthetique",
		"workflowSidebar.sourceEmbedded": "Integre",
		"workflowSidebar.sizeCompact": "Compact",
		"workflowSidebar.sizeComfort": "Confort",
		"workflowSidebar.sizeExpanded": "Etendu",
		"workflowSidebar.minimapSizeTitle": "Mini-map {label}",
		"workflowSidebar.nodeLabels": "Labels des noeuds",
		"workflowSidebar.nodeColors": "Couleurs des noeuds",
		"workflowSidebar.showLinks": "Afficher les liens",
		"workflowSidebar.showFramesGroups": "Afficher frames/groupes",
		"workflowSidebar.renderBypassState": "Afficher l'etat bypass",
		"workflowSidebar.renderErrorState": "Afficher l'etat erreur",
		"workflowSidebar.showViewport": "Afficher le viewport",
		"workflowSidebar.minimapHint": "Cliquer/glisser pour naviguer - molette pour zoomer",
		"workflowSidebar.showRawJson": "Afficher le JSON brut",
		"genInfoOverride.autoFillFromWorkflow": "Auto-fill depuis le workflow",
		"genInfoOverride.pick": "Choisir",
		"genInfoOverride.pickField": "Choisir {field}",
		"genInfoOverride.pickFromWorkflow": "Choisir Gen Info depuis le workflow",
		"dialog.close": "Fermer",
		"model3d.controlHint": "Rotation : drag gauche  Pan : drag droit  Zoom : molette",
		"model3d.viewportAction": "Action viewport 3D",
		"model3d.preview": "Preview 3D",
		"model3d.unavailable": "Viewer 3D indisponible",
		"model3d.background": "Fond",
		"model3d.material": "Materiau",
		"model3d.skeleton": "Squelette",
		"model3d.lights": "Lumieres",
		"model3d.intensity": "Intensite",
		"model3d.play": "Lecture",
		"model3d.pause": "Pause",
		"model3d.playPause": "Lecture / Pause",
		"model3d.playbackSpeed": "Vitesse de lecture",
		"model3d.reset": "Reset",
		"model3d.resetView": "Reset vue 3D",
		"model3d.grid": "Grille",
		"model3d.toggleGrid": "Afficher/masquer la grille",
		"model3d.persp": "Persp",
		"model3d.ortho": "Ortho",
		"model3d.switchCamera": "Basculer perspective / orthographique",
		"model3d.settings": "Parametres",
		"model3d.downloadFile": "Telecharger {file}",
		"badge.collisionName": "Nom : {name}",
		"badge.collisionPaths": "Chemins :",
		"badge.collisionSelect": "Cliquer pour selectionner les collisions dans la vue courante",
		"badge.workflow.pendingParsing": "En attente : parsing des metadonnees...",
		"badge.workflow.complete": "Complet : workflow + donnees de generation detectes",
		"badge.workflow.partialWorkflowOnly": "Partiel : workflow seulement (donnees de generation manquantes)",
		"badge.workflow.partialGenerationOnly": "Partiel : donnees de generation seulement (workflow manquant)",
		"badge.workflow.none": "Aucun : aucun workflow ou donnees de generation trouves",
		"badge.workflow.pendingNotParsed": "En attente : metadonnees pas encore parsees",
		"badge.workflow.enrichmentQueued": "En attente : enrichissement des metadonnees en base ({count} en file)",
		"badge.workflow.enrichment": "En attente : enrichissement des metadonnees en base",
		"badge.workflow.aiTooltip": "{title}\nIA : {ai}\nCliquer pour rescanner ce fichier",
		"badge.workflow.tooltip": "{title}\nCliquer pour rescanner ce fichier",
		"badge.ai.vectorIndexed": "vecteur indexe",
		"badge.ai.tagSuggestions": "suggestions de tags IA",
		"badge.ai.enhancedPrompt": "prompt enrichi",
		"badge.ai.indexed": "indexe",
		"badge.rating": "Rating : {rating} etoile{plural}",
		"badge.generationTimeMinutes": "Temps de generation : {minutes} minutes ({seconds}s)",
		"badge.generationTimeSeconds": "Temps de generation : {seconds} secondes",
		"badge.tags": "Tags : {tags}",
		"weekday.monShort": "Lun",
		"weekday.tueShort": "Mar",
		"weekday.wedShort": "Mer",
		"weekday.thuShort": "Jeu",
		"weekday.friShort": "Ven",
		"weekday.satShort": "Sam",
		"weekday.sunShort": "Dim",
		"setting.ai.vector.enabled.name": "Activer la recherche semantique IA",
		"setting.ai.vector.enabled.desc": "Active la recherche semantique basee sur CLIP. Desactivez pour une recherche par mots-cles uniquement.",
		"setting.ai.vector.captionOnIndex.name": "Generer les captions IA pendant l'indexation",
		"setting.ai.vector.captionOnIndex.desc": "Autorise l'indexation vectorielle automatique et le backfill a executer les captions Florence-2 pour les images. C'est plus lent et peut utiliser beaucoup de VRAM/CPU ; laissez desactive pour demarrer la grille plus vite.",
		"setting.viewer.pauseExecution.name": "Majoor : Pause du viewer principal pendant l'execution",
		"setting.viewer.pauseExecution.desc": "Met en pause les processeurs de rendu du viewer principal pendant une generation ComfyUI pour reduire la concurrence CPU/GPU.",
		"setting.viewer.floatingPauseExecution.name": "Majoor : Pause du Floating Viewer pendant l'execution",
		"setting.viewer.floatingPauseExecution.desc": "Met en pause le Floating Viewer pendant la generation. Desactivez cette option pour garder les steps visibles en direct.",
		"setting.viewer.mfvPreviewMethod.name": "Majoor : Methode de preview MFV",
		"setting.viewer.mfvPreviewMethod.desc": "Mode de preview force par le bouton Run du Floating Viewer. 'taesd' donne la meilleure chance d'avoir un preview, avec repli sur latent2rgb quand c'est possible.",
		"setting.viewer.mfvKjPreviewOverride.name": "Majoor : afficher Model Preview Override de KJNodes dans le MFV",
		"setting.viewer.mfvKjPreviewOverride.desc": "Affiche dans le Floating Viewer les previews JPEG, WebP anime et MP4 emises par Model Preview Override de KJNodes. Le bouton KSampler Preview du MFV doit aussi etre active.",
		"runtime.unavailable": "Runtime indisponible",
		"runtime.metricsTitle": "Metriques runtime\nConnexions DB actives : {active}\nFile enrichissement : {enrichQ}\nFichiers watcher en attente : {pending}",
		"runtime.metricsLine": "DB active : {active} | File enrich. : {enrichQ} | Watcher en attente : {pending}",
		"runtime.writeAuthActive": "Auth ecriture : active {tokenHint}",
		"runtime.writeAuthMissing": "Auth ecriture : absente dans ce navigateur {tokenHint}",
		"runtime.writeAuthRequired": "Auth ecriture : requise",
		"runtime.writeAuthNotRequired": "Auth ecriture : non requise",
		"runtime.writeAuthBlocked": "Auth ecriture : ecritures bloquees par le serveur",
		"runtime.writeAuthUnknown": "Auth ecriture : inconnue",
		"status.runtimeProgress": "Progression runtime : {value}/{max}",
		"status.queueRemaining": "File restante : {count}",
		"status.executionCached": "Noeuds en cache reutilises : {count}",
		"status.activePrompt": "Prompt actif : {id}",
		"btn.dbSave": "Sauvegarder BDD",
		"btn.dbRestore": "Restaurer BDD",
		"btn.back": "Retour",
		"btn.up": "Monter",
		"btn.saving": "Sauvegarde...",
		"btn.restoring": "Restauration...",
		"btn.markAllRead": "Tout marquer lu",
		"ctx.pinAsBrowserRoot": "Epingler comme racine Browser",
		"ctx.createFolderHere": "Creer dossier ici...",
		"ctx.renameFolder": "Renommer dossier...",
		"ctx.moveFolder": "Deplacer dossier...",
		"ctx.deleteFolder": "Supprimer dossier...",
		"ctx.openFolder": "Ouvrir dossier",
		"dialog.browserRootLabelOptional": "Label pour nouvelle racine browser (optionnel)",
		"dialog.newFolderName": "Nom du nouveau dossier",
		"dialog.renameFolder": "Renommer dossier",
		"dialog.destinationDirectoryPath": "Chemin dossier destination",
		"dialog.deleteFolderRecursive": "Supprimer le dossier \"{name}\" et tout son contenu ?",
		"dialog.settingsSaveFailed": "Majoor : echec sauvegarde des parametres (stockage navigateur plein ou bloque).",
		"dialog.yes": "Oui",
		"dialog.no": "Non",
		"dialog.ok": "OK",
		"dialog.prompt": "Saisie",
		"dialog.choiceTypeNumber": "Entrez un numero :",
		"dialog.confirmDeleteTitle": "Majoor : confirmer suppression",
		"dialog.deleteSelectedFiles": "Supprimer {count} fichiers selectionnes ?",
		"dialog.deleteSingleFile": "Supprimer \"{label}\" ?",
		"dialog.vectorsReset.title": "Vecteurs IA",
		"dialog.vectorsReset.choice": "Reinitialiser aussi les vecteurs IA ?\n\nConfirmer = oui, tout reinitialiser (les vecteurs seront recalcules)\nAnnuler = non, conserver les vecteurs existants",
		"dialog.vectorsReset.keepQuestion": "Conserver les vecteurs IA existants ?\n\nConfirmer = conserver les vecteurs\nAnnuler = continuer sans vecteurs",
		"dialog.vectorsReset.wipeConfirm": "Reinitialiser aussi les vecteurs IA ?\n\nConfirmer = oui, tout reinitialiser\nAnnuler = abandonner",
		"dialog.vectorsReset.singleQuestion": "Choisissez le mode de reinitialisation pour {action} :\n\nOui = conserver les vecteurs IA existants\nNon = reinitialisation complete (les vecteurs seront recalcules)\nAnnuler = abandonner",
		"dialog.vectorsReset.optionKeep": "Oui - conserver vecteurs",
		"dialog.vectorsReset.optionFull": "Non - reinit complete",
		"dialog.vectorsReset.optionCancel": "Annuler",
		"dialog.resetIndex.confirmKeepVectors": "Cette action reinitialise l'index et relance le scan en conservant les vecteurs IA existants.\n\nContinuer ?",
		"dialog.dbDelete.keepVectorsConfirm": "Cette action reinitialise l'index et conserve les vecteurs IA existants. Les fichiers DB ne seront pas supprimes de force.\n\nContinuer ?",
		"toast.createFolderFailed": "Echec creation dossier",
		"toast.renameFolderFailed": "Echec renommage dossier",
		"toast.moveFolderFailed": "Echec deplacement dossier",
		"toast.deleteFolderFailed": "Echec suppression dossier",
		"toast.folderCreated": "Dossier cree : {name}",
		"toast.folderRenamed": "Dossier renomme",
		"toast.folderMoved": "Dossier deplace",
		"toast.folderDeleted": "Dossier supprime",
		"toast.pinFolderFailed": "Echec epinglage dossier",
		"toast.folderPinnedAsBrowserRoot": "Dossier epingle comme racine browser",
		"toast.failedCreateSmartCollection": "Echec creation collection intelligente",
		"toast.failedAddAssetsToSmartCollection": "Echec ajout des assets a la collection intelligente",
		"toast.noGroupsFoundIndexFirst": "Aucun groupe trouve. Indexez plus d'assets d'abord.",
		"toast.failedLoadClusterAssets": "Echec chargement assets du cluster",
		"toast.collectionCreatedWithAssets": "Collection \"{name}\" creee avec {count} assets !",
		"toast.collectionCreatedNamed": "Collection \"{name}\" creee.",
		"toast.clusterAnalysisFailed": "Echec analyse des clusters",
		"toast.vectorBackfillStarting": "Demarrage du vector backfill... Cela peut prendre du temps.",
		"toast.vectorBackfillRunning": "Le vector backfill continue en arriere-plan{job}.",
		"toast.vectorBackfillComplete": "Vector backfill termine ! Traites : {processed}, Indexes : {indexed}, Ignores : {skipped}",
		"toast.vectorBackfillFailedGeneric": "Echec du backfill",
		"toast.vectorBackfillFailedDetail": "Echec du vector backfill : {error}",
		"toast.aiSearchPartiallyIndexed": "L'index de recherche IA n'est que partiellement construit ({indexed}/{eligible}, {percent} %). Lancez Vector Backfill pour les assets existants.",
		"toast.rescanUpdatingAiIndex": "Rescan du fichier + mise a jour index IA...",
		"toast.metadataVectorUpdated": "Metadonnees + index vectoriel IA mis a jour pour cet asset.",
		"toast.metadataUpdatedVectorFailed": "Metadonnees mises a jour. L'index vectoriel IA n'a pas pu etre mis a jour.",
		"label.computer": "Ordinateur",
		"label.collection": "collection",
		"rating.title": "Note : {n}",
		"rating.label": "Note",
		"rating.setN": "Definir la note a {n}",
		"tags.title": "Tags : {tags}",
		"tags.label": "Tags",
		"tags.addLabel": "Ajouter un tag",
		"tags.remove": "Supprimer le tag",
		"tags.suggestions": "Suggestions de tags",
		"label.thisFile": "ce fichier",
		"label.messages": "Messages",
		"label.readMe": "Read Me",
		"label.userGuide": "Guide utilisateur",
		"label.info": "Info",
		"btn.giveStar": "Mettre une etoile",
		"label.resolutionMinWxH": "Min LxH (px)",
		"label.resolutionMaxWxH": "Max LxH (px)",
		"msg.noMessages": "Aucun message pour le moment.",
		"msg.noPinnedFolders": "Aucun dossier epingle",
		"sidebar.placeholderSelectAsset": "Selectionnez un asset pour voir les details",
		"msg.noTagsYet": "Aucun tag pour le moment...",
		"msg.category.information": "Information",
		"msg.shortcuts.title": "Guide des raccourcis",
		"msg.shortcuts.body": "Tous les raccourcis actifs sont regroupes ici par section pour rester visibles dans le Message Center.",
		"msg.shortcuts.intro": "Raccourcis clavier actuels groupes par section pour consultation rapide.",
		"msg.shortcuts.openGuide": "Ouvrir le guide complet",
		"msg.shortcuts.section.panel": "Global / Panneau",
		"msg.shortcuts.section.grid": "Vue grille",
		"msg.shortcuts.section.viewer": "Viewer standard",
		"msg.shortcuts.section.mfv": "Floating Viewer",
		"msg.shortcuts.section.video": "Lecture video",
		"msg.category.release": "Version",
		"msg.whatsNew.title.version250": "Nouvelle version 2.5.0",
		"msg.whatsNew.body.version250": "Version 2.5.0 publiee. Nouvelles fonctionnalites : support experimental de JPEG XL, sous-graphes natifs imbriques dans Graph Map, metadonnees techniques etendues, nouvelles vitesses de lecture, actions sur les fichiers sources et menu Find Similar enrichi. Ameliorations : ingestion des metadonnees d'execution, regroupement Rodin 3D, gestion des couleurs, extraction des prompts, correspondance des workflows, presentation de la sidebar, rendu du viewer et integration a la barre d'outils ComfyUI. Correctifs : raccourcis des tags, lecture et controles du Floating Viewer, chargement des fichiers sources, fermeture des popovers, stabilite des informations de generation, Open in Folder et analyse des workflows avec sous-graphes.",
		"msg.whatsNew.title.dndGraphMapSettings": "Nouvelle Version 2.4.9 - DnD, Graph Map et Parametres",
		"msg.whatsNew.body.dndGraphMapSettings": "Version 2.4.9 publiee : le Drag and Drop a ete corrige et clarifie, y compris pour le depot sur canvas/noeud, le comportement de staging, le feedback visuel et les interactions avec le workflow-drop de ComfyUI. Graph Map dans le Floating Viewer permet maintenant d'inspecter les workflows embarques sans les ouvrir sur le canvas, de copier des noeuds ou leurs attributs, et de transferer les attributs d'un noeud vers un noeud similaire selectionne sur le canvas. L'acces aux parametres et leurs explications ont aussi ete ameliores, avec un acces plus simple depuis l'icone engrenage du panneau et depuis le Floating Viewer.",
		"msg.whatsNew.title.version246": "Nouvelle Version 2.4.6",
		"msg.whatsNew.body.version246": "Version 2.4.6 publiee : divers correctifs de bugs et ameliorations de performances et fluidite. Support concatenate ameliore pour les nodes par defaut et custom (par Forsion07). Ajout des helpers pour Api Node et Ernie Image. Le Live Stream du Floating Viewer est desormais desactive par defaut. Voir CHANGELOG pour details.",
		"msg.whatsNew.title.gridMfvToolboxUpgrade": "Quoi de neuf - upgrade Grid et MFV",
		"msg.whatsNew.body.gridMfvToolboxUpgrade": "Les performances et la fluidite de la grid ont ete ameliorees. Le Majoor Floating Viewer n'est plus seulement un viewer light : il integre maintenant des fonctions avancees comme Node Stream, Node Parameters et l'edition directe des nodes depuis le viewer. De nouveaux outils ont aussi ete ajoutes dans la toolbox, avec en plus plusieurs corrections et nettoyages de code.",
		"msg.tip.title.majoorImageOpsNodePack": "Do you know this node pack ?",
		"msg.tip.body.majoorImageOpsNodePack": "Decouvrez Majoor ImageOps, un node pack ComfyUI avec des nodes pratiques pour les operations d'image dans vos workflows.",
		"label.openNodePack": "Ouvrir le node pack",
		"msg.tip.title.graphMapGuide": "Conseil - Guide Graph Map",
		"msg.tip.body.graphMapGuide": "Graph Map dispose maintenant de sa propre page de documentation avec captures d'ecran et explication rapide. Ouvrez le guide pour voir comment lire la carte du workflow, inspecter les noeuds selectionnes et utiliser les actions du panneau de detail.",
		"label.graphMapGuide": "Guide Graph Map",
		"msg.tip.title.mfvGuide": "Conseil - Guide MFV",
		"msg.tip.body.mfvGuide": "MFV dispose maintenant de son propre guide illustre avec les modes de comparaison, les pins A/B/C/D, les streams, les Node Parameters, Run/Stop, le pop-out et la facon dont Graph Map complete naturellement le workflow du viewer.",
		"label.mfvGuide": "Guide MFV",
		"label.changelog": "Changelog",
		"label.settingsGuide": "Guide des paramètres",
		"msg.tip.title.mfvLivePreviewDefaults": "Conseil - Ouverture automatique du Viewer",
		"msg.tip.body.mfvLivePreviewDefaults": "Le Live Stream (bouton vert dans le viewer) et la prévisualisation KSampler peuvent être activés par défaut via Paramètres → Majoor Assets Manager › Viewer. Lorsque le Live Stream est actif, cliquer sur un node Load Image ou la fin d'une génération ouvrira automatiquement le Floating Viewer et affichera le résultat. La prévisualisation KSampler diffuse les étapes de débruitage en direct. Les deux options peuvent être définies comme état par défaut pour que le viewer soit toujours prêt.",
		"msg.whatsNew.title.version243": "Nouvelle Version 2.4.3",
		"msg.whatsNew.body.version243": "Version 2.4.3 publiee : analyse des metadonnees des assets amelioree, capacite Grid Compare dans le floating viewer jusqu'a 4 Assets, boucle ping pong dans le Viewer principal, job id et stack id dans la BDD pour une meilleure gestion des assets, empilement des assets generes depuis le meme workflow avec le meme job ID, fonctionnalite de feed genere, version legere de la grille dans l'onglet bottom. Refactorisation du code pour la maintenabilite et divers correctifs de bugs. Voir CHANGELOG pour details.",
		"msg.whatsNew.title.version241": "Nouvelle Version 2.4.1",
		"msg.whatsNew.body.version241": "Version 2.4.1 publiee : recherche semantique CLIP avec AI toggle, support rgthree/easy node, onglet shortcut guide, extraction de modele upscaler. Correction de fuites memoire MFV, filtres workflow, SQL placeholders. Amelioration extraction geninfo, gestion tags, calendrier. Voir CHANGELOG pour details.",
		"msg.whatsNew.title.floatingViewerShortcuts": "Quoi de neuf",
		"msg.whatsNew.body.floatingViewerShortcuts": "Nouveaux raccourcis clavier pour le Floating Viewer : ouvrir/fermer le MFV avec V, comparaison avec C, Live Stream avec L, et KSampler Preview avec K. Voir l'onglet Shortcut Guide pour la liste complete.",
		"msg.whatsNew.title.pinReference": "Quoi de neuf",
		"msg.whatsNew.body.pinReference": "Floating Viewer : nouvelle fonction Pin Reference. Vous pouvez maintenant epingler A ou B, puis comparer rapidement avec les assets selectionnes dans la grille tout en gardant la reference fixe.",
		"msg.whatsNew.title.vectorResetKeepVectors": "Quoi de neuf",
		"msg.whatsNew.body.vectorResetKeepVectors": "Reset index et Delete DB demandent d'abord s'il faut conserver les vecteurs IA. Si vous avez deja des anciens assets indexes, garder les vecteurs est recommande : un reset complet sans eux peut declencher un long Vector Backfill sur les anciens assets et augmenter temporairement la consommation RAM.",
		"msg.whatsNew.title.localUserGuide": "Quoi de neuf",
		"msg.whatsNew.body.localUserGuide": "Ouvrez le Guide utilisateur local directement depuis le dossier custom_nodes d'Assets Manager.",
		"msg.category.development": "Developpement",
		"msg.development.title.vueRefactoring": "Refactorisation Vue 3",
		"msg.development.body.vueRefactoring": "Modernisation du frontend en cours : Les composants UI nucleaires sont en cours de migration vers Vue 3 pour une meilleure maintenabilite et compatibilite avec le nouveau frontend ComfyUI. Cela garantit un support a long terme et une architecture plus propre.",
		"label.viewProgress": "Voir la progression",
		"msg.collectionAdd.added": "{added} element(s) ajoute(s) a \"{name}\".",
		"msg.collectionAdd.skippedExisting": "{count} element(s) ignores : deja presents dans la collection.",
		"msg.collectionAdd.skippedDuplicate": "{count} doublon(s) ignores dans la selection.",
		"msg.collectionAdd.noneAddedExisting": "Aucun nouvel element ajoute a \"{name}\" (tous deja presents).",
		"msg.dbResetNoticeDetail": "Note de mise a jour Majoor :\n\nPour eviter les erreurs de base de donnees avec cette version, supprimez votre index existant. Cliquez sur le bouton \"Delete DB\" dans le panneau Index Status pour le reinitialiser.",
		"msg.nightlyUpdateTitle": "Nouvelle nightly disponible",
		"msg.nightlyUpdateDetail": "Une build nightly plus recente est disponible. Télécharger : https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/releases/tag/nightly",
		"msg.newVersionTitle": "Mise à jour disponible",
		"msg.newVersionDetail": "La version {latest} est disponible. Version installée : {current}.",
		"tooltip.starGithub": "Ouvrir GitHub et mettre une etoile",
		"viewer.studio.abLoop": "Boucle A-B (I / O, U pour effacer)",
		"viewer.studio.actualSize": "Taille réelle",
		"viewer.studio.aspect": "Masque de format",
		"viewer.studio.channels": "Canaux",
		"viewer.studio.checker": "Damier de transparence",
		"viewer.studio.clearLoop": "Effacer la boucle A-B",
		"viewer.studio.close": "Fermer (Échap)",
		"viewer.studio.compare": "Comparer A/B (C)",
		"viewer.studio.compareTool": "Comparer A/B (C)",
		"viewer.studio.copied": "Copié dans le presse-papiers",
		"viewer.studio.copy": "Copier l'image / la frame",
		"viewer.studio.copyFailed": "Impossible de copier cette image",
		"viewer.studio.download": "Télécharger",
		"viewer.studio.ev": "Exposition",
		"viewer.studio.exportFrame": "Enregistrer cette frame en PNG",
		"viewer.studio.exposure": "Exposition / gamma",
		"viewer.studio.filmstrip": "Pellicule",
		"viewer.studio.fit": "Ajuster",
		"viewer.studio.frame": "Frame",
		"viewer.studio.fullscreen": "Plein écran (F)",
		"viewer.studio.gamma": "Gamma",
		"viewer.studio.grid": "Guides (G)",
		"viewer.studio.histogram": "Histogramme",
		"viewer.studio.inspector": "Infos de génération (Tab)",
		"viewer.studio.loop": "Boucle",
		"viewer.studio.loupe": "Loupe (L) - clic droit pour les réglages",
		"viewer.studio.loupeTitle": "Loupe",
		"viewer.studio.magnification": "Grossissement",
		"viewer.studio.mediaError": "Ce fichier ne peut pas être lu par le navigateur.",
		"viewer.studio.mute": "Muet (M)",
		"viewer.studio.next": "Suivant (→)",
		"viewer.studio.nextB": "B suivant",
		"viewer.studio.nextFrame": "Frame suivante (.)",
		"viewer.studio.opacity": "Opacité",
		"viewer.studio.pinB": "Utiliser l'asset courant comme B (B)",
		"viewer.studio.pinBShort": "Définir B",
		"viewer.studio.play": "Lecture",
		"viewer.studio.playPause": "Lecture / pause (Espace)",
		"viewer.studio.prev": "Précédent (←)",
		"viewer.studio.prevB": "B précédent",
		"viewer.studio.prevFrame": "Frame précédente (,)",
		"viewer.studio.probe": "Pipette (P)",
		"viewer.studio.reset": "Réinitialiser",
		"viewer.studio.resetTools": "Réinitialiser les outils (R)",
		"viewer.studio.scopes": "Scopes (S)",
		"viewer.studio.seek": "Position",
		"viewer.studio.size": "Taille",
		"viewer.studio.speed": "Vitesse ([ / ])",
		"viewer.studio.swap": "Inverser A et B (X)",
		"viewer.studio.swapShort": "Inverser",
		"viewer.studio.tabFile": "Fichier",
		"viewer.studio.tabGeneration": "Génération",
		"viewer.studio.tabWorkflow": "Workflow",
		"viewer.studio.threshold": "Seuil",
		"viewer.studio.title": "Viewer",
		"viewer.studio.tools": "Outils de revue",
		"viewer.studio.unsupported": "Pas d'aperçu pour ce type de fichier.",
		"viewer.studio.volume": "Volume",
		"viewer.studio.waveform": "Waveform",
		"viewer.studio.wipe": "Volet",
		"viewer.studio.zebra": "Zébras (Z)",
		"viewer.studio.zoomHint": "Molette pour zoomer, double-clic pour ajuster / 100 %"
	}
}, _n = Object.freeze({
	"en-US": "English",
	"fr-FR": "Français",
	"zh-CN": "Chinese (Simplified)",
	"ja-JP": "Japanese",
	"ko-KR": "Korean",
	"hi-IN": "Hindi",
	"pt-PT": "Portuguese",
	"es-ES": "Spanish",
	"ru-RU": "Russian",
	"de-DE": "German",
	"it-IT": "Italian",
	"nl-NL": "Dutch",
	"pl-PL": "Polish",
	"tr-TR": "Turkish",
	"vi-VN": "Vietnamese",
	"cs-CZ": "Czech",
	"fa-IR": "Persian",
	"id-ID": "Indonesian",
	"uk-UA": "Ukrainian",
	"hu-HU": "Hungarian",
	"ar-SA": "Arabic",
	"sv-SE": "Swedish",
	"ro-RO": "Romanian",
	"el-GR": "Greek"
});
[
	"zh-CN",
	"ja-JP",
	"ko-KR",
	"hi-IN",
	"pt-PT",
	"es-ES",
	"ru-RU",
	"de-DE",
	"it-IT",
	"nl-NL",
	"pl-PL",
	"tr-TR",
	"vi-VN",
	"cs-CZ",
	"fa-IR",
	"id-ID",
	"uk-UA",
	"hu-HU",
	"ar-SA",
	"sv-SE",
	"ro-RO",
	"el-GR"
].forEach((e) => {
	B[e] || (B[e] = {});
});
var vn = !1, yn = null;
function bn(e) {
	vn || (vn = !0, Object.entries(e || {}).forEach(([e, t]) => {
		B[e] = {
			...B[e] || {},
			...t || {}
		};
	}), xn());
}
function xn() {
	let e = B["en-US"] || {};
	Object.keys(B).forEach((t) => {
		t !== "en-US" && (B[t] = {
			...e,
			...B[t] || {}
		});
	});
}
function Sn() {
	return vn ? Promise.resolve() : (yn ||= import("./i18n.generated-CezSPtOB.js").then(({ GENERATED_TRANSLATIONS: e }) => {
		bn(e);
	}).catch((e) => {
		console.warn("[Majoor i18n] Failed to load generated translations:", e), xn();
	}), yn);
}
xn();
function Cn(e) {
	if (!e) return L;
	let t = String(e || "").trim(), n = t.toLowerCase();
	return gn[n] ? gn[n] : B[t] ? t : L;
}
function wn() {
	try {
		for (let e of dn) {
			let t = String(I.get(e) || "").trim();
			if (t) return t;
		}
	} catch (e) {
		console.debug?.(e);
	}
	return "";
}
function Tn(e) {
	try {
		I.set(dn[0], e), I.set(dn[1], e);
	} catch (e) {
		console.debug?.(e);
	}
}
function En() {
	try {
		let e = String(I.get(fn) || "").trim().toLowerCase();
		return !e || ![
			"0",
			"false",
			"no",
			"off"
		].includes(e);
	} catch (e) {
		console.debug?.(e);
	}
	return !0;
}
function Dn(e) {
	try {
		I.set(fn, e ? "1" : "0");
	} catch (e) {
		console.debug?.(e);
	}
}
function On(e) {
	let t = [], n = (e) => {
		if (typeof e != "string") return;
		let n = e.trim();
		n && t.push(n);
	};
	for (let t of [
		"AGL.Locale",
		"Comfy.Locale",
		"Comfy.LocaleCode",
		"ComfyUI.Locale",
		"ComfyUI.Frontend.Locale"
	]) n(pt(e, t));
	return n(e?.ui?.locale), n(e?.locale), n(e?.ui?.i18n?.locale), t;
}
function kn() {
	let e = [], t = (t) => {
		if (typeof t != "string") return;
		let n = t.trim();
		n && e.push(n);
	};
	try {
		typeof document < "u" && t(document?.documentElement?.lang);
	} catch (e) {
		console.debug?.(e);
	}
	try {
		if (typeof navigator < "u") {
			t(navigator?.language);
			let e = Array.isArray(navigator?.languages) ? navigator.languages : [];
			for (let n of e) t(n);
		}
	} catch (e) {
		console.debug?.(e);
	}
	return e;
}
function An() {
	try {
		if (typeof document < "u" && document.documentElement) {
			let e = hn.has(R);
			document.documentElement.dir = e ? "rtl" : "ltr";
		}
	} catch (e) {
		console.debug?.(e);
	}
}
var jn = (e) => {
	try {
		let t = En(), n = wn(), r = Cn(n), i = () => {
			let t = On(e);
			for (let e of t) {
				let t = Cn(e);
				if (B[t]) return V(t), !0;
			}
			return !1;
		};
		if (t) {
			if (i()) return;
			if (n && B[r]) {
				V(r);
				return;
			}
			if (B[R]) return;
			V(L);
			return;
		}
		if (n && B[r]) {
			V(r);
			return;
		}
		if (i()) return;
		let a = kn();
		for (let e of a) {
			let t = Cn(e);
			if (B[t]) {
				V(t);
				return;
			}
		}
		V(L);
	} catch (e) {
		console.warn("[Majoor i18n] Failed to detect language:", e), V(L);
	}
}, V = (e) => {
	B[e] || (console.warn(`[Majoor i18n] Unknown language: ${e}, falling back to ${L}`), e = L), R !== e && (R = e, Tn(e), An(), e !== L && !vn && Sn().then(() => {
		Array.from(un).forEach((t) => {
			try {
				t(e);
			} catch (e) {
				console.debug?.(e);
			}
		});
	}), Array.from(un).forEach((t) => {
		try {
			t(e);
		} catch (e) {
			console.debug?.(e);
		}
	}));
}, Mn = (e) => {
	Dn(!!e);
}, Nn = (e) => {
	try {
		mn &&= (clearInterval(mn), null), typeof window < "u" && window.__MJR_COMFY_LANG_SYNC_TIMER__ && (clearInterval(window.__MJR_COMFY_LANG_SYNC_TIMER__), window.__MJR_COMFY_LANG_SYNC_TIMER__ = null);
	} catch (e) {
		console.debug?.(e);
	}
	mn = setInterval(() => {
		try {
			if (!En()) return;
			let t = On(e);
			for (let e of t) {
				let t = Cn(e);
				if (B[t] && t !== R) {
					V(t);
					return;
				}
			}
		} catch (e) {
			console.debug?.(e);
		}
	}, 2e3);
	try {
		typeof window < "u" && (window.__MJR_COMFY_LANG_SYNC_TIMER__ = mn);
	} catch (e) {
		console.debug?.(e);
	}
}, Pn = () => R, Fn = () => Object.keys(B).map((e) => ({
	code: e,
	name: _n[e] || e
})), H = (e, t, n) => {
	let r = B[R] || B[L], i = B[L], a = r[e] || i[e];
	if (!a) {
		let n = `${R}:${String(e || "")}`;
		if (!z.has(n)) {
			if (z.size >= pn) {
				let e = Math.floor(pn * .2), t = z.values();
				for (let n = 0; n < e; n++) {
					let e = t.next().value;
					e && z.delete(e);
				}
			}
			z.add(n);
			try {
				console.warn(`[Majoor i18n] Missing translation key "${e}" for locale "${R}"`);
			} catch (e) {
				console.debug?.(e);
			}
			try {
				typeof window < "u" && typeof window.dispatchEvent == "function" && window.dispatchEvent(new CustomEvent("mjr-i18n-missing-key", { detail: {
					key: String(e || ""),
					locale: R
				} }));
			} catch (e) {
				console.debug?.(e);
			}
		}
		return typeof t == "string" ? t : e;
	}
	let o = typeof t == "object" ? t : n;
	return o && typeof o == "object" && Object.entries(o).forEach(([e, t]) => {
		a = a.replaceAll(`{${e}}`, String(t));
	}), a;
}, In = "mjr_toast_history_v1", Ln = "mjr_toast_history_last_read_v1", Rn = 60, zn = "mjr:toast-history-changed", U = null;
function W(e) {
	return String(e || "").trim();
}
function Bn(e) {
	let t = W(e).toLowerCase();
	return t === "warn" ? "warning" : t === "danger" ? "error" : t || "info";
}
function Vn(e) {
	let t = Number(e);
	return Number.isFinite(t) ? t : null;
}
function Hn(e) {
	if (!e || typeof e != "object") return null;
	let t = Number(e.percent), n = Number.isFinite(t) ? Math.max(0, Math.min(100, Math.round(t))) : null, r = Number(e.current), i = Number(e.total), a = Number.isFinite(r) ? Math.max(0, Math.floor(r)) : null, o = Number.isFinite(i) ? Math.max(0, Math.floor(i)) : null, s = Number(e.indexed), c = Number(e.skipped), l = Number(e.errors), u = Number.isFinite(s) ? Math.max(0, Math.floor(s)) : null, d = Number.isFinite(c) ? Math.max(0, Math.floor(c)) : null, f = Number.isFinite(l) ? Math.max(0, Math.floor(l)) : null, p = W(e.label);
	return n === null && a === null && o === null && u === null && d === null && f === null && !p ? null : {
		percent: n,
		current: a,
		total: o,
		indexed: u,
		skipped: d,
		errors: f,
		label: p
	};
}
function Un(e, t, n) {
	return e && t ? `${e}: ${t}` : t || e || n || "";
}
function Wn(e, t = "info", n = null) {
	if (!e || typeof e != "object") return null;
	let r = W(e.title || e.summary), i = W(e.detail), a = W(e.message || Un(r, i, W(e.fallbackMessage)));
	if (!a) return null;
	let o = Vn(e.durationMs ?? e.duration ?? n), s = Number(e.createdAt), c = Number.isFinite(s) && s > 0 ? s : Date.now(), l = typeof e.persistent == "boolean" ? e.persistent : !(Number.isFinite(o) && (o ?? 0) > 0);
	return {
		id: W(e.id) || u(`th-${c}-`, 4),
		message: a,
		title: r,
		detail: i,
		type: Bn(e.type || t),
		createdAt: c,
		durationMs: o,
		persistent: l,
		source: W(e.source),
		trackId: W(e.trackId),
		status: W(e.status),
		operation: W(e.operation),
		progress: Hn(e.progress),
		forceStore: !!e.forceStore,
		actionLabel: W(e.actionLabel),
		actionUrl: W(e.actionUrl)
	};
}
function Gn() {
	if (U === null) try {
		let e = localStorage.getItem(In), t = e ? JSON.parse(e) : [];
		U = Array.isArray(t) ? t.map((e) => {
			if (e && typeof e == "object") return Wn(e);
			let t = W(e);
			return t ? Wn({ message: t }) : null;
		}).filter(Boolean) : [];
	} catch {
		U = [];
	}
}
function Kn() {
	try {
		localStorage.setItem(In, JSON.stringify(U));
	} catch {}
}
function qn() {
	try {
		window.dispatchEvent(new CustomEvent(zn));
	} catch {}
}
function Jn() {
	try {
		return Number(localStorage.getItem(Ln)) || 0;
	} catch {
		return 0;
	}
}
function Yn(e) {
	try {
		localStorage.setItem(Ln, String(Number(e) || 0));
	} catch {}
}
function Xn(e, t, n) {
	Gn();
	let r = Wn(e && typeof e == "object" ? e : {
		message: W(e),
		type: t,
		durationMs: n
	}, t, n);
	if (!r || !r.forceStore && !r.trackId && r.type === "info" && Number.isFinite(r.durationMs) && r.durationMs != null && r.durationMs > 0 && r.durationMs < 2500) return;
	let i = String(r.trackId || "").trim();
	if (i) {
		let e = U.findIndex((e) => String(e?.trackId || "").trim() === i);
		if (e >= 0) {
			let t = U[e] || {};
			U.splice(e, 1), r.id = String(t.id || r.id || "").trim() || r.id;
		}
	}
	U.unshift(r), U.length > Rn && (U = U.slice(0, Rn)), Kn(), qn();
}
function Zn() {
	return Gn(), U.map((e) => ({ ...e }));
}
function Qn() {
	Gn();
	let e = Jn();
	return U.filter((t) => t.createdAt > e).length;
}
function $n() {
	Yn(Date.now()), qn();
}
function er() {
	Gn(), U = [], Kn(), Yn(Date.now()), qn();
}
// ui/app/toast.ts
function tr(e) {
	let t = String(e || "info").trim().toLowerCase();
	return t === "warn" ? "warning" : t === "danger" ? "error" : t === "success" || t === "warning" || t === "error" ? t : "info";
}
function G(e) {
	if (typeof e == "string") return e;
	if (e && typeof e == "object") {
		let t = String(e.summary || "").trim(), n = String(e.detail || e.message || "").trim();
		if (t && n) return `${t}: ${n}`;
		if (n) return n;
		if (t) return t;
	}
	try {
		return String(e?.message || e || "").trim() || "Unknown message";
	} catch {
		return "Unknown message";
	}
}
function nr(e, t, n, r) {
	let i = r?.history && typeof r.history == "object" ? r.history : null, a = {
		persistent: !(Number.isFinite(Number(n)) && Number(n) > 0),
		source: String(i?.source || r?.source || "").trim(),
		trackId: String(i?.trackId || "").trim(),
		status: String(i?.status || "").trim(),
		operation: String(i?.operation || "").trim(),
		progress: i?.progress && typeof i.progress == "object" ? { ...i.progress } : null,
		forceStore: !!i?.forceStore,
		actionLabel: String(i?.actionLabel || "").trim(),
		actionUrl: String(i?.actionUrl || "").trim()
	};
	return e && typeof e == "object" ? (a.title = String(i?.title || e.summary || "").trim(), a.detail = String(i?.detail || e.detail || e.message || "").trim(), a.message = G(e), a) : (a.title = String(i?.title || "").trim(), a.detail = String(i?.detail || "").trim(), a.message = G(e), a);
}
function rr(e, t = "info", n, r) {
	try {
		let i = nr(e, t, n, r);
		i.forceStore = !0, Xn(i, t, n ?? void 0);
	} catch {}
}
function ir(e) {
	switch (e) {
		case "success": return 2e3;
		case "info": return 3e3;
		case "warning": return 4e3;
		case "error": return 5e3;
		default: return 5e3;
	}
}
function ar(e) {
	if (typeof e != "string") return e;
	let t = e.trim(), n = {
		"Failed to update rating": H("toast.ratingUpdateFailed", "Failed to update rating"),
		"Error updating rating": H("toast.ratingUpdateError", "Error updating rating"),
		"Rating cleared": H("toast.ratingCleared", "Rating cleared"),
		"Failed to update tags": H("toast.tagsUpdateFailed", "Failed to update tags"),
		"Tags updated": H("toast.tagsUpdated", "Tags updated"),
		"Failed to toggle watcher": H("toast.watcherToggleFailed", "Failed to toggle watcher"),
		"No valid assets selected.": H("toast.noValidAssetsSelected", "No valid assets selected."),
		"Name collision in current view": H("toast.nameCollisionInView", "Name collision in current view"),
		"Failed to create collection.": H("toast.failedCreateCollectionDot", "Failed to create collection."),
		"Failed to add assets to collection.": H("toast.failedAddAssetsToCollection", "Failed to add assets to collection."),
		"Failed to remove from collection.": H("toast.removeFromCollectionFailed", "Failed to remove from collection."),
		"Collection created": H("toast.collectionCreated", "Collection created"),
		"Added to collection": H("toast.addedToCollection", "Added to collection"),
		"Removed from collection": H("toast.removedFromCollection", "Removed from collection"),
		"File renamed successfully!": H("toast.fileRenamedSuccess", "File renamed successfully!"),
		"Failed to rename file": H("toast.fileRenameFailed", "Failed to rename file"),
		"Failed to rename file.": H("toast.fileRenameFailed", "Failed to rename file."),
		"File deleted successfully!": H("toast.fileDeletedSuccess", "File deleted successfully!"),
		"Failed to delete file.": H("toast.fileDeleteFailed", "Failed to delete file."),
		"Failed to delete file. ": H("toast.fileDeleteFailed", "Failed to delete file."),
		"File deleted": H("toast.deleted", "File deleted"),
		"File renamed": H("toast.renamed", "File renamed"),
		"Folder created": H("toast.folderCreated", "Folder created"),
		"Folder renamed": H("toast.folderRenamed", "Folder renamed"),
		"Folder moved": H("toast.folderMoved", "Folder moved"),
		"Folder deleted": H("toast.folderDeleted", "Folder deleted"),
		"Failed to create folder": H("toast.createFolderFailed", "Failed to create folder"),
		"Failed to rename folder": H("toast.renameFolderFailed", "Failed to rename folder"),
		"Failed to move folder": H("toast.moveFolderFailed", "Failed to move folder"),
		"Failed to delete folder": H("toast.deleteFolderFailed", "Failed to delete folder"),
		"Failed to pin folder": H("toast.pinFolderFailed", "Failed to pin folder"),
		"Failed to unpin folder": H("toast.unpinFolderFailed", "Failed to unpin folder"),
		"Folder pinned as browser root": H("toast.folderPinnedAsBrowserRoot", "Folder pinned as browser root"),
		"Folder added": H("toast.folderAdded", "Folder added"),
		"Folder removed": H("toast.folderRemoved", "Folder removed"),
		"Folder linked successfully": H("toast.folderLinked", "Folder linked successfully"),
		"An error occurred while adding the custom folder": H("toast.errorAddingFolder", "An error occurred while adding the custom folder"),
		"An error occurred while removing the custom folder": H("toast.errorRemovingFolder", "An error occurred while removing the custom folder"),
		"Failed to add custom folder": H("toast.failedAddFolder", "Failed to add custom folder"),
		"Failed to remove custom folder": H("toast.failedRemoveFolder", "Failed to remove custom folder"),
		"Native folder browser unavailable. Please enter path manually.": H("toast.nativeBrowserUnavailable", "Native folder browser unavailable. Please enter path manually."),
		"Opened in folder": H("toast.openedInFolder", "Opened in folder"),
		"Failed to open folder": H("toast.openFolderFailed", "Failed to open folder"),
		"Failed to open folder.": H("toast.openFolderFailed", "Failed to open folder."),
		"File path copied to clipboard": H("toast.pathCopied", "File path copied to clipboard"),
		"Failed to copy path": H("toast.pathCopyFailed", "Failed to copy path"),
		"Failed to copy to clipboard": H("toast.copyClipboardFailed", "Failed to copy to clipboard"),
		"No file path available for this asset.": H("toast.noFilePath", "No file path available for this asset."),
		"Failed to refresh metadata.": H("toast.metadataRefreshFailed", "Failed to refresh metadata."),
		"Metadata refreshed": H("toast.metadataRefreshed", "Metadata refreshed"),
		"Duplicate analysis started": H("toast.dupAnalysisStarted", "Duplicate analysis started"),
		"Tags merged": H("toast.tagsMerged", "Tags merged"),
		"Duplicates deleted": H("toast.duplicatesDeleted", "Duplicates deleted"),
		"Rescanning file...": H("toast.rescanningFile", "Rescanning file..."),
		"Metadata enrichment complete": H("toast.enrichmentComplete", "Metadata enrichment complete"),
		"Playback speed is available for video media only": H("toast.playbackVideoOnly", "Playback speed is available for video media only"),
		"DB backup saved": H("toast.dbSaveSuccess", "DB backup saved"),
		"Failed to save DB backup": H("toast.dbSaveFailed", "Failed to save DB backup"),
		"DB restore started": H("toast.dbRestoreStarted", "DB restore started"),
		"Failed to restore DB backup": H("toast.dbRestoreFailed", "Failed to restore DB backup"),
		"Select a DB backup first": H("toast.dbRestoreSelect", "Select a DB backup first"),
		"Stopping running workers": H("toast.dbRestoreStopping", "Stopping running workers"),
		"Unlocking and resetting database": H("toast.dbRestoreResetting", "Unlocking and resetting database"),
		"Recreating database": H("toast.dbRestoreReplacing", "Recreating database"),
		"Replacing database files": H("toast.dbRestoreReplacing", "Replacing database files"),
		"Restarting scan": H("toast.dbRestoreRescan", "Restarting scan"),
		"Deleting database and rebuilding...": H("toast.dbDeleteTriggered", "Deleting database and rebuilding..."),
		"Database deleted and rebuilt. Files are being reindexed.": H("toast.dbDeleteSuccess", "Database deleted and rebuilt. Files are being reindexed."),
		"Failed to delete database": H("toast.dbDeleteFailed", "Failed to delete database"),
		"Database backup restored": H("toast.dbRestoreSuccess", "Database backup restored"),
		"Index reset started. Files will be reindexed in the background.": H("toast.resetStarted", "Index reset started. Files will be reindexed in the background."),
		"Failed to reset index": H("toast.resetFailed", "Failed to reset index"),
		"Reset triggered: Reindexing all files...": H("toast.resetTriggered", "Reset triggered: Reindexing all files..."),
		"Reset failed - database is corrupted. Use the \"Delete DB\" button to force-delete and rebuild.": H("toast.resetFailedCorrupt", "Reset failed - database is corrupted. Use the \"Delete DB\" button to force-delete and rebuild."),
		"Scan started": H("toast.scanStarted", "Scan started"),
		"Scan complete": H("toast.scanComplete", "Scan complete"),
		"Scan failed": H("toast.scanFailed", "Scan failed"),
		"Permission denied": H("toast.permissionDenied", "Permission denied"),
		"Language changed. Reload the page for full effect.": H("toast.languageChanged", "Language changed. Reload the page for full effect."),
		"Tag added": H("toast.tagAdded", "Tag added"),
		"Tag removed": H("toast.tagRemoved", "Tag removed"),
		"Rating saved": H("toast.ratingSaved", "Rating saved"),
		"Failed to create collection": H("toast.failedCreateCollection", "Failed to create collection"),
		"Failed to delete collection": H("toast.failedDeleteCollection", "Failed to delete collection")
	};
	if (n[t]) return n[t];
	let r;
	if (r = t.match(/Rating set to (\d+) star(?:s)?/i), r) return H("toast.ratingSetN", "Rating set to {n} stars", { n: Number(r[1]) });
	if (r = t.match(/Downloading (.+?)\.\.\./i), r) return H("toast.downloadingFile", "Downloading {filename}...", { filename: r[1] });
	if (r = t.match(/Playback ([0-9]+(?:\.[0-9]+)?)x/i), r) return H("toast.playbackRate", "Playback {rate}x", { rate: Number(r[1]).toFixed(2) });
	if (r = t.match(/Metadata refreshed(?:\s*(.*))?/i), r) return H("toast.metadataRefreshed", "Metadata refreshed{suffix}", { suffix: r[1] ? " (" + r[1] + ")" : "" });
	if (r = t.match(/Error renaming(?: file)?:\s*(.+)/i), r) return H("toast.errorRenaming", "Error renaming file: {error}", { error: r[1] });
	if (r = t.match(/Error deleting(?: files?| file)?:\s*(.+)/i), r) return H("toast.errorDeleting", "Error deleting file: {error}", { error: r[1] });
	if (r = t.match(/Tag merge failed:\s*(.+)/i), r) return H("toast.tagMergeFailed", "Tag merge failed: {error}", { error: r[1] });
	if (r = t.match(/Delete failed:\s*(.+)/i), r) return H("toast.deleteFailed", "Delete failed: {error}", { error: r[1] });
	if (r = t.match(/Analysis not started:\s*(.+)/i), r) return H("toast.analysisNotStarted", "Analysis not started: {error}", { error: r[1] });
	if (r = t.match(/(\d+)\s+files deleted successfully!/i), r) return H("toast.filesDeletedSuccessN", "{n} files deleted successfully!", { n: Number(r[1]) });
	if (r = t.match(/(\d+)\s+files deleted,\s+(\d+)\s+failed\./i), r) return H("toast.filesDeletedPartial", "{success} files deleted, {failed} failed.", {
		success: Number(r[1]),
		failed: Number(r[2])
	});
	if (r = t.match(/(\d+)\s+files?\s+deleted/i), r) return H("toast.filesDeletedShort", "{n} files deleted", { n: Number(r[1]) });
	if (r = t.match(/(\d+)\s+deleted,\s+(\d+)\s+failed/i), r) return H("toast.filesDeletedShortPartial", "{success} deleted, {failed} failed", {
		success: Number(r[1]),
		failed: Number(r[2])
	});
	if (r = t.match(/^(.+?)\s+copied to clipboard!$/i), r) return H("toast.copiedToClipboardNamed", "{name} copied to clipboard!", { name: r[1] });
	if (r = t.match(/Folder created:\s*(.+)/i), r) return H("toast.folderCreated", "Folder created: {name}", { name: r[1] });
	if (r = t.match(/Failed to create folder:\s*(.+)/i), r) return H("toast.createFolderFailedDetail", "Failed to create folder: {error}", { error: r[1] });
	if (r = t.match(/Failed to rename folder:\s*(.+)/i), r) return H("toast.renameFolderFailedDetail", "Failed to rename folder: {error}", { error: r[1] });
	if (r = t.match(/Failed to move folder:\s*(.+)/i), r) return H("toast.moveFolderFailedDetail", "Failed to move folder: {error}", { error: r[1] });
	if (r = t.match(/Failed to delete folder:\s*(.+)/i), r) return H("toast.deleteFolderFailedDetail", "Failed to delete folder: {error}", { error: r[1] });
	if (r = t.match(/Error removing from collection:\s*(.+)/i), r) return H("toast.removeFromCollectionError", "Error removing from collection: {error}", { error: r[1] });
	if (r = t.match(/^Failed to (.+)$/i), r) {
		let e = r[1].toLowerCase(), t = {
			"add folder": H("toast.failedAddFolder", "Failed to add custom folder"),
			"remove folder": H("toast.failedRemoveFolder", "Failed to remove custom folder"),
			"create collection": H("toast.failedCreateCollection", "Failed to create collection"),
			"delete collection": H("toast.failedDeleteCollection", "Failed to delete collection")
		};
		for (let [n, r] of Object.entries(t)) if (e.includes(n)) return r;
	}
	return t;
}
function or(e, t = "info", n, r) {
	if (t = tr(t), e = ar(e), n ??= ir(t), !r?.noHistory) try {
		Xn(nr(e, t, n, r), t, n ?? void 0);
	} catch {}
	let i = !(Number.isFinite(Number(n)) && Number(n) > 0);
	try {
		let a = dt();
		if (a && fr(a, e, t, i ? 0 : Number(n), r)) return;
	} catch (e) {
		console.debug("Majoor: extensionManager.toast failed", e);
	}
	console.warn("[Majoor Toast] Native toast API unavailable", {
		type: t,
		message: G(e),
		duration: i ? 0 : n
	});
}
var sr = /* @__PURE__ */ new Set([
	"started",
	"start",
	"queued",
	"pending",
	"running",
	"in_progress",
	"progress",
	"stopping_workers",
	"resetting_db",
	"restarting_scan",
	"restoring",
	"deleting"
]), cr = 2147483647, K = /* @__PURE__ */ new Map();
function lr(e) {
	if (e && typeof e == "object") {
		let t = String(e.summary || "").trim(), n = String(e.detail || e.message || "").trim();
		return t ? {
			title: t,
			description: n
		} : {
			title: H("manager.title"),
			description: n || G(e)
		};
	}
	return {
		title: H("manager.title"),
		description: G(e)
	};
}
function ur(e) {
	return e?.history && typeof e.history == "object" ? e.history : {};
}
function dr(e) {
	let t = ur(e), n = String(t.actionLabel || "").trim(), r = String(t.actionUrl || "").trim();
	if (n && r && /^(https?:\/\/|\/(?!\/))/i.test(r)) return {
		label: n,
		onClick: () => {
			try {
				window.open(r, "_blank", "noopener,noreferrer");
			} catch (e) {
				console.debug?.(e);
			}
		}
	};
}
function fr(e, t, n, r, i) {
	let { title: a, description: o } = lr(t), s = ur(i), c = String(s.trackId || "").trim(), l = String(s.status || "").trim().toLowerCase(), u = !!c && sr.has(l), d = u ? "loading" : n, f = typeof e[d] == "function" ? e[d] : typeof e[n] == "function" ? e[n] : null;
	if (f) {
		let t = { closable: !0 };
		o && o !== a && (t.description = o), t.duration = r > 0 && !u ? r : cr;
		let n = dr(i);
		n && (t.action = n);
		let s = c ? K.get(c) : void 0;
		s != null && (t.id = s);
		let l = f.call(e, a, t);
		return c && (u && l != null ? K.set(c, l) : K.delete(c)), !0;
	}
	if (typeof e.add == "function") {
		let t = {
			severity: n === "warning" ? "warn" : n,
			summary: a,
			detail: o
		};
		return r > 0 && (t.life = r), e.add(t), !0;
	}
	return !1;
}
function pr() {
	let e = dt();
	for (let t of K.values()) try {
		e?.dismiss?.(t);
	} catch (e) {
		console.debug?.(e);
	}
	K.clear();
}
// ui/api/clientAuth.ts
var mr = 2e3, hr = 15e3, gr = 8e3, q = "token", _r = null, J = null, vr = null, yr = "", Y = w({
	ttlMs: mr,
	maxSize: 1
});
function br() {
	return String(yr || "").trim();
}
function xr(e) {
	return yr = String(e || "").trim(), !0;
}
function Sr() {
	try {
		let e = localStorage?.getItem?.(i), t = e ? JSON.parse(e) : {}, n = t && typeof t == "object" ? t : {}, r = n?.data && typeof n.data == "object" ? n.data : n;
		r?.security && typeof r.security == "object" && String(r.security.apiToken || "").trim() && (r.security.apiToken = "", localStorage?.setItem?.(i, JSON.stringify(n)));
	} catch (e) {
		console.debug?.(e);
	}
}
function Cr() {
	try {
		Y.delete(q);
	} catch (e) {
		console.debug?.(e);
	}
	xr(""), Sr();
}
function wr() {
	let e = Y.get(q);
	if (e !== void 0) return e;
	let t = Date.now(), n = br();
	if (n) return Y.set(q, n, { at: t }), n;
	try {
		let e = localStorage?.getItem?.(i), n = e ? JSON.parse(e) : null, r = n?.data && typeof n.data == "object" ? n.data : n, a = String(r?.security?.apiToken || "").trim();
		if (a) {
			xr(a);
			try {
				let e = n && typeof n == "object" ? n : {}, t = e?.data && typeof e.data == "object" ? e.data : e;
				t?.security && typeof t.security == "object" && (t.security.apiToken = "", localStorage?.setItem?.(i, JSON.stringify(e)), window?.dispatchEvent?.(new CustomEvent("mjr-settings-changed", { detail: { key: "security.apiToken" } })));
			} catch (e) {
				console.debug?.(e);
			}
		}
		return Y.set(q, a, { at: t }), a;
	} catch {
		return Y.set(q, "", { at: t }), "";
	}
}
function Tr(e) {
	let t = String(e || "").trim();
	if (!t) return !1;
	try {
		Y.set(q, t), J = null, xr(t), Sr();
		try {
			window?.dispatchEvent?.(new CustomEvent("mjr-settings-changed", { detail: { key: "security.apiToken" } }));
		} catch (e) {
			console.debug?.(e);
		}
		return !0;
	} catch {
		return !1;
	}
}
var Er = /^[A-Za-z0-9._\-~+/]+=*$/;
function Dr(e) {
	let t = String(e || "").trim();
	return t ? Er.test(t) ? Tr(t) : (console.debug?.("[MJR auth] Rejected malformed security token (invalid characters)"), !1) : !1;
}
function Or() {
	return !!wr();
}
function kr(e = {}) {
	J = {
		code: String(e?.code || "").trim().toUpperCase(),
		error: String(e?.error || "").trim(),
		status: Number(e?.status || 0) || 0,
		at: Date.now()
	};
}
function Ar() {
	let e = J;
	if (!e) return null;
	let t = Date.now() - (Number(e.at || 0) || 0);
	return t < 0 || t > hr ? (J = null, null) : e;
}
function jr(e) {
	let t = Ar(), n = String(e?.code || "").trim().toUpperCase(), r = String(e?.error || "").trim(), i = String(t?.code || "").trim().toUpperCase(), a = String(t?.error || "").trim().toLowerCase(), o = r.toLowerCase();
	return n === "FORBIDDEN" && (o.includes("api token over insecure transport") || o.includes("allow http token transport")) ? H("toast.writeAuthInsecureTransport", "Write access is blocked because the Majoor API token is being sent over plain HTTP from a remote machine. Use HTTPS, or enable Settings -> Security -> Allow HTTP Token Transport for a trusted LAN.") : i === "FORBIDDEN" && (a.includes("already configured") || a.includes("rotate-token")) ? H("toast.writeAuthConfiguredTokenRequired", "Write access requires the Majoor API token already configured on the server. Open Settings -> Security -> API Token and enter the matching token.") : i === "AUTH_REQUIRED" && (a.includes("sign in to comfyui") || a.includes("authenticated comfyui user")) ? H("toast.writeAuthSignInRequired", "Write access is blocked. Sign in to ComfyUI first, then retry so Majoor can bootstrap the remote session token automatically.") : i === "BOOTSTRAP_DISABLED" || i === "AUTH_REQUIRED" && a.includes("bootstrap") || n === "AUTH_REQUIRED" && o.includes("api token") ? H("toast.writeAuthBootstrapHelp", "Write access is blocked. Sign in to ComfyUI and retry so Majoor can bootstrap the remote session automatically, or set a Majoor API token in Settings -> Security.") : "";
}
function Mr(e) {
	let t = String(e || "").trim();
	if (!t) return;
	let n = Date.now(), r = vr;
	if (!(r && r.message === t && n - (Number(r.at || 0) || 0) < gr)) {
		vr = {
			message: t,
			at: n
		};
		try {
			or({
				summary: H("toast.writeAuthTitle", "Majoor remote write access"),
				detail: t
			}, "warning", 6500, { noHistory: !0 });
		} catch (e) {
			console.debug?.(e);
		}
	}
}
function Nr(e) {
	let t = String(e?.code || "").trim().toUpperCase(), n = String(e?.error || "").trim().toLowerCase(), r = t === "FORBIDDEN" && n.includes("write operation blocked");
	if (t !== "AUTH_REQUIRED" && !r) return e;
	let i = jr(e);
	return i ? (Mr(i), {
		...e,
		error: i
	}) : e;
}
async function Pr() {
	try {
		let e = await fetch("/mjr/am/settings/security/bootstrap-token", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Requested-With": "XMLHttpRequest"
			},
			body: "{}"
		});
		if (!(e.headers.get("content-type") || "").includes("application/json")) return kr({
			code: "INVALID_RESPONSE",
			error: `Bootstrap token request returned non-JSON response (${e.status})`,
			status: e.status
		}), {
			ok: !1,
			token: !1
		};
		let t = await e.json().catch((e) => (console.debug?.("[MJR auth] JSON parse error:", e), null));
		if (!t || typeof t != "object") return kr({
			code: "INVALID_RESPONSE",
			error: "Bootstrap token response was invalid.",
			status: e.status
		}), {
			ok: !1,
			token: !1
		};
		if (!t.ok) return kr({
			code: t?.code,
			error: t?.error,
			status: e.status
		}), {
			ok: !1,
			token: !1
		};
		let n = String(t?.data?.token || "").trim();
		return n ? {
			ok: Tr(n),
			token: !0
		} : (J = null, {
			ok: !0,
			token: !1
		});
	} catch (e) {
		return kr({
			code: "NETWORK_ERROR",
			error: e?.message || "Bootstrap token request failed.",
			status: 0
		}), {
			ok: !1,
			token: !1
		};
	}
}
async function Fr({ force: e = !1, allowCookieRefresh: t = !1 } = {}) {
	let n = wr();
	if (n && !e) return n;
	let r = {
		ok: !1,
		token: !1
	};
	_r ||= (async () => {
		try {
			return await Pr();
		} finally {
			_r = null;
		}
	})();
	try {
		r = await _r || r;
	} catch (e) {
		console.debug?.(e);
	}
	if (e && r?.ok && !r?.token && n) Cr();
	else if (e && !r?.ok) {
		let e = Ar(), t = String(e?.code || "").trim().toUpperCase();
		t && ["NETWORK_ERROR", "INVALID_RESPONSE"].includes(t) || Cr();
	}
	let i = wr();
	return !i && t && r?.ok ? !0 : i;
}
function Ir() {
	Y.clear();
}
// ui/api/clientOps.ts
async function Lr(e) {
	return !e || typeof e != "string" ? {
		ok: !1,
		error: "Missing mode",
		code: "INVALID_INPUT"
	} : $("/mjr/am/settings/probe-backend", { mode: e });
}
async function Rr() {
	return Q(y.SETTINGS_METADATA_FALLBACK);
}
async function zr({ image: e, media: t } = {}) {
	return $(y.SETTINGS_METADATA_FALLBACK, {
		image: e,
		media: t
	});
}
async function Br() {
	return Q(y.SETTINGS_VECTOR_SEARCH);
}
async function Vr(e = !0) {
	if (e && typeof e == "object") {
		let t = {};
		return "enabled" in e && (t.enabled = !!e.enabled), "caption_on_index" in e && (t.caption_on_index = !!e.caption_on_index), "captionOnIndex" in e && (t.caption_on_index = !!e.captionOnIndex), "index_on_scan" in e && (t.index_on_scan = !!e.index_on_scan), "indexOnScan" in e && (t.index_on_scan = !!e.indexOnScan), "unload_after_use" in e && (t.unload_after_use = !!e.unload_after_use), "unloadAfterUse" in e && (t.unload_after_use = !!e.unloadAfterUse), "concurrency" in e && (t.concurrency = Number(e.concurrency) || 1), "vectorConcurrency" in e && (t.concurrency = Number(e.vectorConcurrency) || 1), $(y.SETTINGS_VECTOR_SEARCH, t);
	}
	return $(y.SETTINGS_VECTOR_SEARCH, { enabled: !!e });
}
async function Hr() {
	return $(y.SETTINGS_VECTOR_SEARCH_UNLOAD, {});
}
async function Ur() {
	return Q(y.SETTINGS_EXECUTION_GROUPING);
}
async function Wr(e = !0) {
	return $(y.SETTINGS_EXECUTION_GROUPING, { enabled: !!e });
}
async function Gr() {
	return Q(y.SETTINGS_BROWSER_SHOW_FOLDERS);
}
async function Kr(e = !0) {
	return $(y.SETTINGS_BROWSER_SHOW_FOLDERS, { enabled: !!e });
}
async function qr() {
	return Q(y.SETTINGS_HUGGINGFACE);
}
async function Jr(e = "") {
	return $(y.SETTINGS_HUGGINGFACE, { token: String(e ?? "").trim() });
}
async function Yr() {
	return Q(y.SETTINGS_AI_LOGGING);
}
async function Xr(e = !1) {
	return $(y.SETTINGS_AI_LOGGING, { enabled: !!e });
}
async function Zr() {
	return Q(y.SETTINGS_ROUTE_LOGGING);
}
async function Qr(e = !1) {
	return $(y.SETTINGS_ROUTE_LOGGING, { enabled: !!e });
}
async function $r() {
	return Q(y.SETTINGS_STARTUP_LOGGING);
}
async function ei(e = !1) {
	return $(y.SETTINGS_STARTUP_LOGGING, { enabled: !!e });
}
async function ti() {
	return Q(y.SETTINGS_LTXAV_RGB_FALLBACK);
}
async function ni(e = !1) {
	return $(y.SETTINGS_LTXAV_RGB_FALLBACK, { enabled: !!e });
}
async function ri() {
	return Q(y.SETTINGS_JXL);
}
async function ii(e = !1) {
	return $(y.SETTINGS_JXL, { enabled: !!e });
}
async function ai() {
	return Q(y.SETTINGS_OUTPUT_DIRECTORY);
}
async function oi() {
	return Q(y.SETTINGS_INPUT_DIRECTORY);
}
async function si(e, t = {}) {
	let n = String(e ?? "").trim();
	return $(y.SETTINGS_INPUT_DIRECTORY, { input_directory: n }, t);
}
async function ci(e, t = {}) {
	let n = String(e ?? "").trim();
	return $(y.SETTINGS_OUTPUT_DIRECTORY, { output_directory: n }, t);
}
async function li() {
	return Q(y.SETTINGS_INDEX_DIRECTORY);
}
async function ui(e, t = {}) {
	let n = String(e ?? "").trim();
	return $(y.SETTINGS_INDEX_DIRECTORY, { index_directory: n }, t);
}
async function di(e = {}) {
	return Q(y.SETTINGS_WORKFLOW_ROOTS, e);
}
async function fi(e, t = {}) {
	let n = Array.isArray(e) ? e.map((e) => String(e ?? "").trim()).filter(Boolean) : String(e ?? "").trim();
	return $(y.SETTINGS_WORKFLOW_ROOTS, { workflow_roots: n }, t);
}
async function pi(e = {}) {
	return $(y.WORKFLOWS_OPEN_ROOT, {}, e);
}
async function mi() {
	return Q("/mjr/am/settings/security");
}
async function hi(e) {
	return $("/mjr/am/settings/security", e && typeof e == "object" ? e : {});
}
async function gi() {
	let e = await $("/mjr/am/settings/security/bootstrap-token", {});
	if (e?.ok) try {
		let t = String(e?.data?.token || "").trim();
		t && Tr(t);
	} catch (e) {
		console.debug?.(e);
	}
	return e;
}
async function _i(e) {
	if (e && typeof e == "object") {
		let t = String(e.filepath || e.path || e?.file_info?.filepath || "").trim();
		return t ? $("/mjr/am/open-in-folder", { filepath: t }) : $("/mjr/am/open-in-folder", { asset_id: f(e.id) });
	}
	return $("/mjr/am/open-in-folder", { asset_id: f(e) });
}
async function vi(e) {
	let t = "";
	return t = e && typeof e == "object" ? String(e.filepath || e.path || e?.file_info?.filepath || "").trim() : String(e || "").trim(), t ? $(y.COLLECT_FILES, { filepath: t }) : {
		ok: !1,
		data: null,
		error: "Missing file path",
		code: "INVALID_INPUT"
	};
}
async function yi({ op: e = "", path: t = "", name: n = "", destination: r = "", recursive: i = !0 } = {}, a = {}) {
	let o = {
		op: String(e || "").trim().toLowerCase(),
		path: String(t || "").trim()
	};
	return n != null && String(n).trim() && (o.name = String(n).trim()), r != null && String(r).trim() && (o.destination = String(r).trim()), o.op === "delete" && (o.recursive = !!i), $(y.BROWSER_FOLDER_OP, o, a);
}
async function bi(e = {}) {
	let t = (e, t) => e == null ? t : !!e, n = String(e.scope || "output").trim().toLowerCase() || "output", r = e.customRootId ?? e.custom_root_id ?? e.rootId ?? e.root_id ?? e.customRoot ?? null, i = {
		scope: n,
		reindex: t(e.reindex, !0),
		hard_reset_db: t(e.hardResetDb ?? e.hard_reset_db ?? e.deleteDbFiles ?? e.delete_db_files ?? e.deleteDb ?? e.delete_db ?? void 0, n === "all"),
		clear_scan_journal: t(e.clearScanJournal ?? e.clear_scan_journal, !0),
		clear_metadata_cache: t(e.clearMetadataCache ?? e.clear_metadata_cache, !0),
		clear_asset_metadata: t(e.clearAssetMetadata ?? e.clear_asset_metadata, !0),
		clear_assets: t(e.clearAssets ?? e.clear_assets, !0),
		preserve_vectors: t(e.preserveVectors ?? e.preserve_vectors ?? e.keepVectors ?? e.keep_vectors, !1),
		rebuild_fts: t(e.rebuildFts ?? e.rebuild_fts, !0),
		incremental: t(e.incremental, !1),
		fast: t(e.fast, !0),
		background_metadata: t(e.backgroundMetadata ?? e.background_metadata, !0),
		maintenance_force: t(e.maintenanceForce ?? e.maintenance_force, !1)
	};
	return r && (i.custom_root_id = String(r)), $(y.INDEX_RESET, i);
}
async function xi({ scope: e = "output", customRootId: t = "" } = {}) {
	let n = String(e || "output").trim().toLowerCase() || "output", r = String(t || "").trim(), i = { scope: n };
	return r && (i.custom_root_id = r), $(y.WATCHER_SCOPE, i);
}
async function Si(e = {}) {
	return Q(y.WATCHER_STATUS, e);
}
async function Ci(e = !0) {
	return $(y.WATCHER_TOGGLE, { enabled: !!e });
}
async function wi() {
	return Q(y.WATCHER_SETTINGS);
}
async function Ti(e = {}) {
	return $(y.WATCHER_SETTINGS, e);
}
async function Ei(e = {}) {
	return Q(y.TOOLS_STATUS, e);
}
async function Di(e = {}) {
	return Q(y.STATUS, e);
}
async function Oi() {
	return $("/mjr/am/db/force-delete", {});
}
async function ki(e = {}) {
	return Q(y.DB_BACKUPS, e);
}
async function Ai() {
	return $(y.DB_BACKUP_SAVE, {});
}
async function ji({ name: e = "", useLatest: t = !1 } = {}) {
	let n = {};
	return e && (n.name = String(e)), t && (n.use_latest = !0), $(y.DB_BACKUP_RESTORE, n);
}
async function Mi() {
	return Q(y.TRASH);
}
async function Ni() {
	return $(y.TRASH_EMPTY, {});
}
async function Pi(e = 250) {
	return $("/mjr/am/duplicates/analyze", { limit: Math.max(10, Math.min(5e3, Number(e) || 250)) });
}
async function Fi({ scope: e = "output", customRootId: t = "", maxGroups: n = 6, maxPairs: r = 10 } = {}, i = {}) {
	let a = `/mjr/am/duplicates/alerts?scope=${encodeURIComponent(String(e || "output"))}`;
	return t && (a += `&custom_root_id=${encodeURIComponent(String(t))}`), a += `&max_groups=${encodeURIComponent(String(Math.max(1, Number(n) || 6)))}`, a += `&max_pairs=${encodeURIComponent(String(Math.max(1, Number(r) || 10)))}`, Q(a, i);
}
async function Ii(e, t = []) {
	return $("/mjr/am/duplicates/merge-tags", {
		keep_asset_id: Number(e) || 0,
		merge_asset_ids: Array.isArray(t) ? t.map((e) => Number(e) || 0).filter((e) => e > 0) : []
	});
}
async function Li(e) {
	let t, n;
	if (e && typeof e == "object") {
		t = f(e.id);
		let r = String(e.filepath || e.path || e?.file_info?.filepath || "").trim();
		n = t ? { asset_id: t } : { filepath: r };
	} else t = f(e), n = { asset_id: t };
	let r = await $("/mjr/am/asset/delete", n);
	return r?.ok && t && zi([t]), r;
}
async function Ri(e) {
	let t = Array.isArray(e) ? e.map((e) => f(e)).filter(Boolean) : [], n = await $("/mjr/am/assets/delete", { ids: t });
	if (n?.ok) {
		let e = n?.data || {}, r = Array.isArray(e?.failed_ids) ? e.failed_ids : [];
		Array.isArray(e?.deleted_ids) ? zi(e.deleted_ids) : r.length || zi(t);
	}
	return n;
}
function zi(e) {
	try {
		let t = (Array.isArray(e) ? e : [e]).map((e) => String(e || "").trim()).filter(Boolean);
		if (!t.length) return;
		window.dispatchEvent(new CustomEvent("mjr:assets-deleted", { detail: { ids: t } }));
	} catch (e) {
		console.debug?.(e);
	}
}
async function Bi(e, t) {
	let n;
	if (e && typeof e == "object") {
		n = f(e.id);
		let r = String(e.filepath || e.path || e?.file_info?.filepath || "").trim(), i = n ? await $("/mjr/am/asset/rename", {
			asset_id: n,
			new_name: t
		}) : await $("/mjr/am/asset/rename", {
			filepath: r,
			new_name: t
		});
		if (i?.ok && n) try {
			let e = await Ma(n);
			e?.ok && e?.data && (i.data = {
				...i.data || {},
				asset: e.data
			});
		} catch (e) {
			console.debug?.(e);
		}
		return i;
	}
	n = f(e);
	let r = await $("/mjr/am/asset/rename", {
		asset_id: n,
		new_name: t
	});
	if (r?.ok && n) try {
		let e = await Ma(n);
		e?.ok && e?.data && (r.data = {
			...r.data || {},
			asset: e.data
		});
	} catch (e) {
		console.debug?.(e);
	}
	return r;
}
async function Vi() {
	let e = typeof AbortController < "u" ? new AbortController() : null, t = null;
	try {
		return e && (t = setTimeout(() => e.abort(), 1e4)), await Q("/mjr/am/collections", e ? { signal: e.signal } : {});
	} finally {
		t && clearTimeout(t);
	}
}
async function Hi(e) {
	return $("/mjr/am/collections", { name: String(e || "").trim() });
}
async function Ui(e) {
	let t = String(e || "").trim();
	return $(`/mjr/am/collections/${encodeURIComponent(t)}/delete`, {});
}
async function Wi(e, t) {
	let n = String(e || "").trim(), r = Array.isArray(t) ? t : [];
	return $(`/mjr/am/collections/${encodeURIComponent(n)}/add`, { assets: r });
}
async function Gi(e, t) {
	let n = String(e || "").trim(), r = Array.isArray(t) ? t : [];
	return $(`/mjr/am/collections/${encodeURIComponent(n)}/remove`, { filepaths: r });
}
async function Ki(e) {
	let t = String(e || "").trim();
	return Q(`/mjr/am/collections/${encodeURIComponent(t)}/assets`);
}
async function qi(e, t = 20) {
	let n = String(e || "").trim();
	if (!n) return {
		ok: !1,
		error: "Empty query"
	};
	let r = t && typeof t == "object" ? t : { topK: Number(t) }, i = Math.max(1, Math.min(200, Number(r?.topK ?? 20) || 20)), a = String(r?.scope || "").trim(), o = String(r?.customRootId || "").trim(), s = `${y.VECTOR_SEARCH}?q=${encodeURIComponent(n)}&top_k=${i}`;
	return a && (s += `&scope=${encodeURIComponent(a)}`), o && (s += `&custom_root_id=${encodeURIComponent(o)}`), s = b(s, {
		subfolder: r?.subfolder ?? null,
		kind: r?.kind ?? null,
		hasWorkflow: r?.hasWorkflow ?? null,
		minRating: r?.minRating ?? null,
		minSizeMB: r?.minSizeMB ?? null,
		maxSizeMB: r?.maxSizeMB ?? null,
		minWidth: r?.minWidth ?? null,
		minHeight: r?.minHeight ?? null,
		maxWidth: r?.maxWidth ?? null,
		maxHeight: r?.maxHeight ?? null,
		workflowType: r?.workflowType ?? null,
		workflowId: r?.workflowId ?? null,
		dateRange: r?.dateRange ?? null,
		dateExact: r?.dateExact ?? null
	}), Q(s, { timeoutMs: 12e4 });
}
async function Ji(e, t = 20) {
	let n = String(e || "").trim();
	if (!n) return {
		ok: !1,
		error: "Missing asset ID"
	};
	let r = t && typeof t == "object" ? t : { topK: Number(t) }, i = Math.max(1, Math.min(200, Number(r?.topK ?? 20) || 20)), a = String(r?.scope || "").trim(), o = String(r?.customRootId || "").trim(), s = `${y.VECTOR_SIMILAR}/${encodeURIComponent(n)}?top_k=${i}`;
	return a && (s += `&scope=${encodeURIComponent(a)}`), o && (s += `&custom_root_id=${encodeURIComponent(o)}`), Q(s, { dedupeKey: `vec:${n}:${i}:${a}:${o}` });
}
async function Yi(e) {
	let t = String(e || "").trim();
	return t ? Q(`${y.VECTOR_ALIGNMENT}/${encodeURIComponent(t)}`) : {
		ok: !1,
		error: "Missing asset ID"
	};
}
async function Xi(e) {
	let t = String(e || "").trim();
	return t ? $(`${y.VECTOR_INDEX}/${encodeURIComponent(t)}`, {}) : {
		ok: !1,
		error: "Missing asset ID"
	};
}
async function Zi() {
	return Q(y.VECTOR_STATS);
}
async function Qi(e = 64, t = {}) {
	let n = Math.max(1, Math.min(200, e)), r = typeof t?.onProgress == "function" ? t.onProgress : null, i = String(t?.scope || "").trim().toLowerCase(), a = String(t?.customRootId ?? t?.custom_root_id ?? "").trim(), o = `${y.VECTOR_BACKFILL}?batch_size=${n}&async=1`;
	i && (o += `&scope=${encodeURIComponent(i)}`), a && (o += `&custom_root_id=${encodeURIComponent(a)}`);
	let s = await $(o, {}, { timeoutMs: 3e4 });
	if (!s?.ok) return s;
	let c = s?.data || {}, l = String(c?.status || "").toLowerCase(), u = String(c?.backfill_id || "").trim();
	try {
		r?.(c);
	} catch (e) {
		console.debug?.(e);
	}
	if (!u || ![
		"queued",
		"running",
		"pending"
	].includes(l)) return s;
	let d = Number(t?.pollIntervalMs), f = Number(t?.pollTimeoutMs), p = Number.isFinite(d) ? Math.max(500, Math.min(1e4, Math.floor(d))) : ua, m = Number.isFinite(f) ? Math.max(1e4, Math.min(fa, Math.floor(f))) : da, h = Date.now(), g = null;
	for (; Date.now() - h < m;) {
		await we(p);
		let e = await Q(`${y.VECTOR_BACKFILL_STATUS}?backfill_id=${encodeURIComponent(u)}`, { timeoutMs: 3e4 });
		if (!e?.ok) {
			g = e;
			continue;
		}
		let t = e?.data || {}, n = String(t?.status || "").toLowerCase();
		g = e;
		try {
			r?.(t);
		} catch (e) {
			console.debug?.(e);
		}
		if (n === "succeeded") return {
			ok: !0,
			data: t?.result || {},
			code: null,
			status: 200
		};
		if (n === "failed") return {
			ok: !1,
			error: String(t?.error || "Vector backfill failed"),
			code: String(t?.code || "DB_ERROR"),
			data: t,
			status: 500
		};
	}
	let _ = await Q(`${y.VECTOR_BACKFILL_STATUS}?backfill_id=${encodeURIComponent(u)}`, { timeoutMs: 3e4 }), v = _?.data || g?.data || {}, b = String(v?.status || "").toLowerCase();
	if (_?.ok && [
		"queued",
		"running",
		"pending"
	].includes(b)) {
		try {
			r?.(v);
		} catch (e) {
			console.debug?.(e);
		}
		return {
			ok: !0,
			code: "PENDING",
			status: 202,
			data: {
				...v,
				pending: !0,
				timed_out: !0,
				poll_timeout_ms: m,
				backfill_id: String(v?.backfill_id || u),
				status: b || "running"
			},
			meta: { pending: !0 }
		};
	}
	return _?.ok && b === "failed" ? {
		ok: !1,
		error: String(v?.error || "Vector backfill failed"),
		code: String(v?.code || "DB_ERROR"),
		data: v,
		status: 500
	} : {
		ok: !1,
		error: `Vector backfill polling timed out after ${m}ms`,
		code: "TIMEOUT",
		data: v || null,
		status: 408
	};
}
async function $i(e) {
	let t = String(e || "").trim();
	return t ? Q(`${y.VECTOR_AUTO_TAGS}/${encodeURIComponent(t)}`) : {
		ok: !1,
		error: "Missing asset ID"
	};
}
async function ea(e) {
	let t = String(e || "").trim();
	return t ? $(`${y.VECTOR_CAPTION}/${encodeURIComponent(t)}`, {}) : {
		ok: !1,
		error: "Missing asset ID"
	};
}
async function ta(e) {
	return ea(e);
}
async function na(e, { topK: t = 50, scope: n = "output", customRootId: r = "", subfolder: i = null, kind: a = null, hasWorkflow: o = null, minRating: s = null, minSizeMB: c = null, maxSizeMB: l = null, minWidth: u = null, minHeight: d = null, maxWidth: f = null, maxHeight: p = null, workflowType: m = null, workflowId: h = null, dateRange: g = null, dateExact: _ = null } = {}) {
	let v = String(e || "").trim();
	if (!v) return {
		ok: !1,
		error: "Empty query"
	};
	let x = `${y.HYBRID_SEARCH}?q=${encodeURIComponent(v)}&top_k=${Math.max(1, Math.min(200, t))}&scope=${encodeURIComponent(n)}`;
	return r && (x += `&custom_root_id=${encodeURIComponent(r)}`), x = b(x, {
		subfolder: i,
		kind: a,
		hasWorkflow: o,
		minRating: s,
		minSizeMB: c,
		maxSizeMB: l,
		minWidth: u,
		minHeight: d,
		maxWidth: f,
		maxHeight: p,
		workflowType: m,
		workflowId: h,
		dateRange: g,
		dateExact: _
	}), Q(x, { timeoutMs: 12e4 });
}
async function ra({ filter: e = "incomplete", sort: t = "alignment_asc", scope: n = "output", customRootId: r = "", limit: i = 200 } = {}) {
	let a = `${y.AUDIT}?filter=${encodeURIComponent(e)}&sort=${encodeURIComponent(t)}&scope=${encodeURIComponent(n)}&limit=${Math.max(1, Math.min(500, i))}`;
	return r && (a += `&custom_root_id=${encodeURIComponent(r)}`), Q(a);
}
async function ia(e = 8) {
	return $(y.VECTOR_SUGGEST_COLLECTIONS, { k: Math.max(2, Math.min(20, e)) });
}
// ui/api/client.ts
var aa = /* @__PURE__ */ e({
	VECTOR_BACKFILL_DEFAULT_POLL_INTERVAL_MS: () => ua,
	VECTOR_BACKFILL_DEFAULT_POLL_TIMEOUT_MS: () => da,
	VECTOR_BACKFILL_MAX_POLL_TIMEOUT_MS: () => fa,
	addAssetsToCollection: () => Wi,
	bootstrapSecurityToken: () => gi,
	browserFolderOp: () => yi,
	collectFiles: () => vi,
	createCollection: () => Hi,
	deleteAsset: () => Li,
	deleteAssets: () => Ri,
	deleteCollection: () => Ui,
	deleteWorkflow: () => Ha,
	diffWorkflow: () => Ra,
	duplicateWorkflow: () => Ba,
	emptyTrash: () => Ni,
	ensureWriteAuthToken: () => Fr,
	forceDeleteDb: () => Oi,
	get: () => Q,
	getAiLoggingSettings: () => Yr,
	getAssetMetadata: () => Ma,
	getAssetsBatch: () => Pa,
	getAuditAssets: () => ra,
	getAvailableTags: () => ja,
	getBrowserShowFolders: () => Gr,
	getCollectionAssets: () => Ki,
	getDuplicateAlerts: () => Fi,
	getExecutionGroupingSettings: () => Ur,
	getFileMetadataScoped: () => Za,
	getFolderInfo: () => Qa,
	getHuggingFaceSettings: () => qr,
	getIndexDirectorySetting: () => li,
	getInputDirectorySetting: () => oi,
	getJxlSettings: () => ri,
	getLtxavRgbFallbackSettings: () => ti,
	getMetadataFallbackSettings: () => Rr,
	getOutputDirectorySetting: () => ai,
	getRouteLoggingSettings: () => Zr,
	getRuntimeStatus: () => Di,
	getSecuritySettings: () => mi,
	getStartupLoggingSettings: () => $r,
	getToolsStatus: () => Ei,
	getTrashStatus: () => Mi,
	getVectorSearchSettings: () => Br,
	getViewerInfo: () => Na,
	getWatcherSettings: () => wi,
	getWatcherStatus: () => Si,
	getWorkflowContent: () => Fa,
	getWorkflowRootsSetting: () => di,
	hasRuntimeSecurityToken: () => Or,
	hybridSearch: () => na,
	hydrateAssetRatingTags: () => Xa,
	listCollections: () => Vi,
	listDbBackups: () => ki,
	listWorkflowModelFamilies: () => qa,
	listWorkflowThumbnailCandidates: () => Ka,
	listWorkflowVersions: () => La,
	listWorkflows: () => Ja,
	markWorkflowLoaded: () => Ua,
	mergeDuplicateTags: () => Ii,
	moveWorkflow: () => Va,
	openInFolder: () => _i,
	openWorkflowRoot: () => pi,
	post: () => $,
	removeFilepathsFromCollection: () => Gi,
	renameAsset: () => Bi,
	resetIndex: () => bi,
	restoreDbBackup: () => ji,
	saveDbBackup: () => Ai,
	saveWorkflow: () => za,
	setAiLoggingSettings: () => Xr,
	setBrowserShowFolders: () => Kr,
	setExecutionGroupingSettings: () => Wr,
	setHuggingFaceSettings: () => Jr,
	setIndexDirectorySetting: () => ui,
	setInputDirectorySetting: () => si,
	setJxlSettings: () => ii,
	setLtxavRgbFallbackSettings: () => ni,
	setMetadataFallbackSettings: () => zr,
	setOutputDirectorySetting: () => ci,
	setProbeBackendMode: () => Lr,
	setRouteLoggingSettings: () => Qr,
	setRuntimeSecurityToken: () => Dr,
	setSecuritySettings: () => hi,
	setStartupLoggingSettings: () => ei,
	setVectorSearchSettings: () => Vr,
	setWatcherScope: () => xi,
	setWorkflowFavorite: () => Wa,
	setWorkflowInfo: () => Ga,
	setWorkflowRootsSetting: () => fi,
	setWorkflowThumbnail: () => Ya,
	startDuplicatesAnalysis: () => Pi,
	toggleWatcher: () => Ci,
	unloadVectorModels: () => Hr,
	updateAssetRating: () => ka,
	updateAssetTags: () => Aa,
	updateWatcherSettings: () => Ti,
	validateWorkflow: () => Ia,
	vectorBackfill: () => Qi,
	vectorFindSimilar: () => Ji,
	vectorGenerateCaption: () => ea,
	vectorGenerateEnhancedPrompt: () => ta,
	vectorGetAlignment: () => Yi,
	vectorGetAutoTags: () => $i,
	vectorIndexAsset: () => Xi,
	vectorSearch: () => qi,
	vectorStats: () => Zi,
	vectorSuggestCollections: () => ia
}), oa = 3e4, sa = "__MJR_API_CLIENT__", ca = 2e3, la = 200, ua = 1e3, da = 18e5, fa = 432e5, X = "settings", pa = "available-tags", Z = w({
	ttlMs: ca,
	maxSize: 1
}), ma = w({
	ttlMs: ca,
	maxSize: 1
}), ha = w({
	ttlMs: () => ya(),
	maxSize: 1
}), ga = /* @__PURE__ */ new Set([
	"1",
	"true",
	"yes",
	"on"
]), _a = /* @__PURE__ */ new Set([
	"0",
	"false",
	"no",
	"off"
]);
function va(e, t = !1) {
	if (typeof e == "boolean") return e;
	if (typeof e == "number") return e !== 0;
	if (typeof e == "string") {
		let t = e.trim().toLowerCase();
		if (ga.has(t)) return !0;
		if (_a.has(t)) return !1;
	}
	return !!t;
}
function ya() {
	try {
		let e = localStorage?.getItem?.("mjrSettings") || "{}", t = JSON.parse(e), n = t?.cache?.tagsTTLms ?? t?.cache?.tagsTTL ?? t?.cache?.tags_ttl_ms ?? null, r = Number(n);
		return Number.isFinite(r) ? Math.max(1e3, Math.min(6e5, Math.floor(r))) : oa;
	} catch {
		return oa;
	}
}
function ba() {
	Z.clear();
}
function xa() {
	ma.clear();
}
function Sa() {
	ha.clear();
}
function Ca(e) {
	return String(e ?? "").trim().toLowerCase() || "";
}
function wa(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	for (let r of Array.isArray(e) ? e : []) {
		let e = String(r ?? "").trim();
		if (!e) continue;
		let i = Ca(e);
		i && !n.has(i) && (n.add(i), t.push(e));
	}
	return t;
}
try {
	let e = typeof window < "u" ? window : null;
	e && !e[sa] && (e[sa] = { initialized: !0 }, e.addEventListener?.("storage", (e) => {
		try {
			e?.key === "mjrSettings" && (ba(), xa(), Sa(), Ir());
		} catch (e) {
			console.debug?.(e);
		}
	}), e.addEventListener?.("mjr-settings-changed", () => {
		ba(), xa(), Sa(), Ir();
	}));
} catch (e) {
	console.debug?.(e);
}
var Ta = () => {
	let e = Z.get(X);
	if (e !== void 0) return e;
	let t = Date.now();
	try {
		let e = localStorage?.getItem?.(i);
		if (!e) return Z.set(X, !1, { at: t }), !1;
		let n = !!JSON.parse(e)?.observability?.enabled;
		return Z.set(X, n, { at: t }), n;
	} catch {
		return Z.set(X, !1, { at: t }), !1;
	}
}, Ea = () => {
	let e = ma.get(X);
	if (e !== void 0) return e;
	let t = Date.now();
	try {
		let e = localStorage?.getItem?.(i);
		if (!e) return ma.set(X, !0, { at: t }), !0;
		let n = JSON.parse(e)?.ratingTagsSync?.enabled, r = n == null || va(n, !0);
		return ma.set(X, r, { at: t }), r;
	} catch {
		return ma.set(X, !0, { at: t }), !0;
	}
}, Da = Re({
	readObsEnabled: Ta,
	readAuthToken: wr,
	ensureWriteAuthToken: Fr,
	normalizeWriteAuthFailure: Nr
}), Oa = Da.fetchAPI;
async function Q(e, t = {}) {
	return Da.get(e, t);
}
async function $(e, t, n = {}) {
	return Da.post(e, t, n);
}
async function ka(e, t, n = {}) {
	let r = Ea(), i = e && typeof e == "object" ? e : null, a = f(i ? i.id : e), o = { rating: Math.max(0, Math.min(5, Number(t) || 0)) };
	return a ? o.asset_id = a : i && (o.filepath = i.filepath || i.path || i?.file_info?.filepath || "", o.type = i.type || "output", o.root_id = p(i)), Oa("/mjr/am/asset/rating", {
		...n,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...r ? { "X-MJR-RTSYNC": "on" } : {}
		},
		body: JSON.stringify(o)
	});
}
async function Aa(e, t, n = {}) {
	let r = Ea(), i = e && typeof e == "object" ? e : null, a = f(i ? i.id : e), o = String(i?.kind || i?.type || "").trim().toLowerCase() === "workflow", s = String(i?.filepath || i?.path || i?.file_info?.filepath || "").trim(), c = { tags: Array.isArray(t) ? t : [] };
	o && s ? c.filepath = s : a ? c.asset_id = a : i && (c.filepath = i.filepath || i.path || i?.file_info?.filepath || "", c.type = i.type || "output", c.root_id = p(i));
	let l = await Oa(o && s ? y.WORKFLOWS_TAGS : "/mjr/am/asset/tags", {
		...n,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...r ? { "X-MJR-RTSYNC": "on" } : {}
		},
		body: JSON.stringify(c)
	});
	return l?.ok && Sa(), l;
}
async function ja() {
	let e = ha.get(pa);
	if (Array.isArray(e)) return {
		ok: !0,
		data: e,
		error: null,
		code: "OK",
		meta: { cached: !0 }
	};
	let t = await Q("/mjr/am/tags");
	if (t?.ok && Array.isArray(t.data)) {
		let e = wa(t.data);
		return ha.set(pa, e), {
			...t,
			data: e
		};
	}
	return t;
}
async function Ma(e, t = {}) {
	let n = encodeURIComponent(f(e));
	return Q(`/mjr/am/asset/${n}`, {
		...t,
		dedupeKey: t?.dedupeKey || `meta:${n}`
	});
}
async function Na(e, t = {}) {
	let n = f(e);
	if (!n) return {
		ok: !1,
		data: null,
		error: "Missing assetId",
		code: "INVALID_INPUT"
	};
	let r = `/mjr/am/viewer/info?asset_id=${encodeURIComponent(n)}`;
	t.refresh && (r += "&refresh=1");
	let { refresh: i, ...a } = t;
	return Q(r, a);
}
async function Pa(e, t = {}) {
	let n = Array.isArray(e) ? e : [], r = [];
	for (let e of n) {
		let t = Number(e);
		if (Number.isFinite(t) && (r.push(Math.trunc(t)), r.length >= la)) break;
	}
	return r.length ? $("/mjr/am/assets/batch", { asset_ids: r }, t) : {
		ok: !0,
		data: [],
		error: null,
		code: "OK"
	};
}
async function Fa(e, t = {}) {
	let n = ue(e);
	return n ? Q(n, t) : {
		ok: !1,
		data: null,
		error: "Missing workflow filepath",
		code: "INVALID_INPUT"
	};
}
async function Ia(e, t = {}) {
	let n = de(e);
	return n ? Q(n, t) : {
		ok: !1,
		data: null,
		error: "Missing workflow filepath",
		code: "INVALID_INPUT"
	};
}
async function La(e, t = {}) {
	let n = fe(e);
	return n ? Q(n, t) : {
		ok: !1,
		data: null,
		error: "Missing workflow filepath",
		code: "INVALID_INPUT"
	};
}
async function Ra(e, t = "", n = {}) {
	let r = pe(e, t);
	return r ? Q(r, n) : {
		ok: !1,
		data: null,
		error: "Missing workflow filepath",
		code: "INVALID_INPUT"
	};
}
async function za({ workflow: e = null, name: t = "", category: n = "", overwrite: r = !1, filepath: i = "", task: a = "", model_family: o = "", provider: s = "", runs_on: c = "", notes: l = "" } = {}, u = {}) {
	return $(y.WORKFLOWS_SAVE, {
		workflow: e,
		name: t,
		category: n,
		overwrite: r,
		filepath: i,
		task: a,
		model_family: o,
		provider: s,
		runs_on: c,
		notes: l
	}, u);
}
async function Ba({ filepath: e = "", name: t = "" } = {}, n = {}) {
	return $(y.WORKFLOWS_DUPLICATE, {
		filepath: e,
		name: t
	}, n);
}
async function Va({ filepath: e = "", name: t = "", category: n = "" } = {}, r = {}) {
	return $(y.WORKFLOWS_MOVE, {
		filepath: e,
		name: t,
		category: n
	}, r);
}
async function Ha({ filepath: e = "" } = {}, t = {}) {
	return $(y.WORKFLOWS_DELETE, { filepath: e }, t);
}
async function Ua({ filepath: e = "" } = {}, t = {}) {
	return $(y.WORKFLOWS_MARK_LOADED, { filepath: e }, t);
}
async function Wa({ filepath: e = "", favorite: t = !1 } = {}, n = {}) {
	return $(y.WORKFLOWS_FAVORITE, {
		filepath: e,
		favorite: !!t
	}, n);
}
async function Ga({ filepath: e = "", task: t = "", model_family: n = "", provider: r = "", runs_on: i = "", notes: a = "" } = {}, o = {}) {
	return $(y.WORKFLOWS_INFO, {
		filepath: e,
		task: t,
		model_family: n,
		provider: r,
		runs_on: i,
		notes: a
	}, o);
}
async function Ka({ filepath: e = "", limit: t = 12 } = {}, n = {}) {
	let r = Math.max(1, Math.min(50, Number(t) || 12));
	return Q(`${y.WORKFLOWS_THUMBNAIL_CANDIDATES}?filepath=${encodeURIComponent(String(e || "").trim())}&limit=${encodeURIComponent(String(r))}`, n);
}
async function qa(e = {}) {
	return Q(y.WORKFLOWS_MODEL_FAMILIES, e);
}
async function Ja({ q: e = "*", limit: t = 100, offset: n = 0, sort: r = "mtime" } = {}, i = {}) {
	let a = Math.max(1, Math.min(500, Number(t) || 100)), o = Math.max(0, Number(n) || 0);
	return Q(`${y.LIST}?scope=workflow&q=${encodeURIComponent(String(e || "*"))}&limit=${encodeURIComponent(String(a))}&offset=${encodeURIComponent(String(o))}&sort=${encodeURIComponent(String(r || "mtime"))}`, i);
}
async function Ya({ filepath: e = "", source_filepath: t = "" } = {}, n = {}) {
	return $(y.WORKFLOWS_THUMBNAIL_SET, {
		filepath: e,
		source_filepath: t
	}, n);
}
async function Xa(e) {
	let t = f(e);
	return t ? Q(`/mjr/am/asset/${encodeURIComponent(t)}?hydrate=rating_tags`) : {
		ok: !1,
		error: "Missing assetId"
	};
}
async function Za({ type: e = "output", filename: t = "", subfolder: n = "", root_id: r = "", rootId: i = "", filepath: a = "" } = {}, o = {}) {
	let s = String(e || "output").trim().toLowerCase() || "output", c = String(t || "").trim(), l = String(n || "").trim(), u = String(r || i || "").trim(), d = String(a || "").trim();
	if (!c) return {
		ok: !1,
		data: null,
		error: "Missing filename",
		code: "INVALID_INPUT"
	};
	let f = `/mjr/am/metadata?type=${encodeURIComponent(s)}&filename=${encodeURIComponent(c)}`;
	return d && (f += `&filepath=${encodeURIComponent(d)}`), l && (f += `&subfolder=${encodeURIComponent(l)}`), u && (f += `&root_id=${encodeURIComponent(u)}`), Q(f, o);
}
async function Qa({ filepath: e = "", root_id: t = "", subfolder: n = "" } = {}, r = {}) {
	try {
		if (globalThis.__mjrFolderInfoSupported === !1) return {
			ok: !1,
			data: null,
			error: "Folder info endpoint unavailable",
			code: "UNAVAILABLE"
		};
		if (globalThis.__mjrFolderInfoSupported == null) {
			let e = await Q("/mjr/am/routes");
			if (e?.ok && Array.isArray(e.data)) {
				let t = e.data.some((e) => String(e?.path || "").trim() === "/mjr/am/folder-info");
				if (globalThis.__mjrFolderInfoSupported = !!t, !t) return {
					ok: !1,
					data: null,
					error: "Folder info endpoint unavailable",
					code: "UNAVAILABLE"
				};
			} else globalThis.__mjrFolderInfoSupported = null;
		}
	} catch (e) {
		console.debug?.(e);
	}
	let i = String(e || "").trim(), a = String(t || "").trim(), o = String(n || "").trim(), s = y.FOLDER_INFO, c = [];
	i ? (c.push(`filepath=${encodeURIComponent(i)}`), c.push("browser_mode=1")) : (a && c.push(`root_id=${encodeURIComponent(a)}`), o && c.push(`subfolder=${encodeURIComponent(o)}`)), c.length && (s += `?${c.join("&")}`);
	let l = await Q(s, r);
	try {
		!l?.ok && Number(l?.status || 0) === 404 && (globalThis.__mjrFolderInfoSupported = !1);
	} catch (e) {
		console.debug?.(e);
	}
	return l;
}
export { wi as $, S as $n, jn as $t, vi as A, Zt as An, Ci as At, qr as B, Tt as Bn, ia as Bt, Ya as C, qt as Cn, Qr as Ct, Wi as D, gt as Dn, xi as Dt, Ia as E, Xt as En, Vr as Et, Oi as F, vt as Fn, ea as Ft, Rr as G, st as Gn, rr as Gt, oi as H, Ge as Hn, Dr as Ht, Yr as I, Yt as In, Yi as It, Di as J, le as Jn, Qn as Jt, ai as K, w as Kn, zn as Kt, Ki as L, mt as Ln, Xi as Lt, Li as M, xt as Mn, Ti as Mt, Ri as N, St as Nn, Qi as Nt, gi as O, Vt as On, fi as Ot, Ui as P, ht as Pn, Ji as Pt, Br as Q, ce as Qn, Fn as Qt, Fi as R, ut as Rn, qi as Rt, Ga as S, pt as Sn, Lr as St, Aa as T, kt as Tn, ei as Tt, ri as U, We as Un, or as Ut, li as V, D as Vn, Or as Vt, ti as W, ct as Wn, pr as Wt, $r as X, me as Xn, $n as Xt, mi as Y, re as Yn, Zn as Yt, Ei as Z, ne as Zn, Pn as Zt, Ua as _, Mt as _n, si as _t, Q as a, bt as an, se as ar, Ii as at, za as b, Ct as bn, zr as bt, ja as c, rn as cn, u as cr, Bi as ct, Na as d, Et as dn, a as dr, Ai as dt, Mn as en, te as er, Si as et, Fa as f, Qt as fn, i as fr, Xr as ft, Ja as g, ft as gn, ui as gt, La as h, jt as hn, Jr as ht, Ba as i, I as in, x as ir, ki as it, Hi as j, N as jn, Hr as jt, yi as k, Ot as kn, Pi as kt, Za as l, $t as ln, f as lr, bi as lt, Ka as m, an as mn, Wr as mt, Ha as n, Nn as nn, ae as nr, na as nt, Ma as o, yt as on, m as or, _i as ot, qa as p, Bt as pn, Kr as pt, Zr as q, y as qn, er as qt, Ra as r, H as rn, ee as rr, Vi as rt, Pa as s, Ht as sn, l as sr, Gi as st, aa as t, V as tn, oe as tr, di as tt, Qa as u, Wt as un, p as ur, ji as ut, Va as v, dt as vn, ii as vt, ka as w, Jt as wn, hi as wt, Wa as x, zt as xn, ci as xt, $ as y, wt as yn, ni as yt, Ur as z, _t as zn, Zi as zt };
