/**
 * API Endpoints - Centralized URL constants
 */

import { pickRootId } from "../utils/ids.js";
import { hasWindowsDrivePrefix, splitFilenameAndSubfolder, toPosixPath } from "../utils/path.js";

const DEFAULT_QUERY_LIMIT = 100;
const DEFAULT_QUERY_OFFSET = 0;

export const ENDPOINTS = {
    // Health & Config
    HEALTH: "/mjr/am/health",
    HEALTH_COUNTERS: "/mjr/am/health/counters",
    HEALTH_DB: "/mjr/am/health/db",
    STATUS: "/mjr/am/status",
    CONFIG: "/mjr/am/config",
    VERSION: "/mjr/am/version",

    // Index & Search
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

    // Metadata
    METADATA: "/mjr/am/metadata",
    WORKFLOW_QUICK: "/mjr/am/workflow-quick",
    RETRY_SERVICES: "/mjr/am/retry-services",
    STAGE_TO_INPUT: "/mjr/am/stage-to-input",
    OPEN_IN_FOLDER: "/mjr/am/open-in-folder",
    TOOLS_STATUS: "/mjr/am/tools/status",
    SETTINGS_OUTPUT_DIRECTORY: "/mjr/am/settings/output-directory",
    SETTINGS_METADATA_FALLBACK: "/mjr/am/settings/metadata-fallback",
    SETTINGS_VECTOR_SEARCH: "/mjr/am/settings/vector-search",
    SETTINGS_HUGGINGFACE: "/mjr/am/settings/huggingface",
    SETTINGS_AI_LOGGING: "/mjr/am/settings/ai-logging",

    // View (ComfyUI native)
    VIEW: "/view",

    // Custom roots view (Majoor)
    CUSTOM_VIEW: "/mjr/am/custom-view",

    // Viewer helpers (Majoor)
    VIEWER_INFO: "/mjr/am/viewer/info",

    // File upload
    UPLOAD_INPUT: "/mjr/am/upload_input",

    // File download
    DOWNLOAD: "/mjr/am/download",

    // Drag-out (OS) helpers
    BATCH_ZIP_CREATE: "/mjr/am/batch-zip",

    // Calendar helpers
    DATE_HISTOGRAM: "/mjr/am/date-histogram",

    // Asset operations
    ASSET_DELETE: "/mjr/am/asset/delete",
    ASSET_RENAME: "/mjr/am/asset/rename",

    // Watcher
    WATCHER_STATUS: "/mjr/am/watcher/status",
    WATCHER_TOGGLE: "/mjr/am/watcher/toggle",
    WATCHER_SCOPE: "/mjr/am/watcher/scope",
    WATCHER_SETTINGS: "/mjr/am/watcher/settings",

    // Collections
    COLLECTIONS: "/mjr/am/collections",

    // Duplicate detection
    DUPLICATES_ALERTS: "/mjr/am/duplicates/alerts",
    DUPLICATES_ANALYZE: "/mjr/am/duplicates/analyze",
    DUPLICATES_MERGE_TAGS: "/mjr/am/duplicates/merge-tags",

    // DB backup/restore
    DB_BACKUPS: "/mjr/am/db/backups",
    DB_BACKUP_SAVE: "/mjr/am/db/backup-save",
    DB_BACKUP_RESTORE: "/mjr/am/db/backup-restore",

    // Vector / Semantic search
    VECTOR_SEARCH: "/mjr/am/vector/search",
    VECTOR_SIMILAR: "/mjr/am/vector/similar",
    VECTOR_ALIGNMENT: "/mjr/am/vector/alignment",
    VECTOR_AUTO_TAGS: "/mjr/am/vector/auto-tags",
    VECTOR_CAPTION: "/mjr/am/vector/caption",
    // Legacy alias kept for backward compatibility.
    VECTOR_ENHANCED_PROMPT: "/mjr/am/vector/enhanced-prompt",
    VECTOR_INDEX: "/mjr/am/vector/index",
    VECTOR_STATS: "/mjr/am/vector/stats",
    VECTOR_SUGGEST_COLLECTIONS: "/mjr/am/vector/suggest-collections",
    VECTOR_BACKFILL: "/mjr/am/db/backfill-missing-vectors",
    VECTOR_BACKFILL_STATUS: "/mjr/am/db/backfill-missing-vectors/status",

    // Hybrid search (FTS + semantic)
    HYBRID_SEARCH: "/mjr/am/search/hybrid",

    // Library audit
    AUDIT: "/mjr/am/audit"
};

export function appendAssetFilterQueryParams(url, filters = {}) {
    let nextUrl = String(url || "");
    const {
        subfolder = null,
        kind = null,
        hasWorkflow = null,
        minRating = null,
        minSizeMB = null,
        maxSizeMB = null,
        minWidth = null,
        minHeight = null,
        maxWidth = null,
        maxHeight = null,
        workflowType = null,
        dateRange = null,
        dateExact = null,
    } = filters || {};

    if (subfolder) {
        nextUrl += `&subfolder=${encodeURIComponent(String(subfolder))}`;
    }
    if (kind) {
        nextUrl += `&kind=${encodeURIComponent(kind)}`;
    }
    if (hasWorkflow !== null && hasWorkflow !== undefined) {
        nextUrl += `&has_workflow=${encodeURIComponent(hasWorkflow ? "true" : "false")}`;
    }
    if (minRating !== null && minRating !== undefined && Number(minRating) > 0) {
        nextUrl += `&min_rating=${encodeURIComponent(String(minRating))}`;
    }
    if (minSizeMB !== null && minSizeMB !== undefined && Number(minSizeMB) > 0) {
        nextUrl += `&min_size_mb=${encodeURIComponent(String(minSizeMB))}`;
    }
    if (maxSizeMB !== null && maxSizeMB !== undefined && Number(maxSizeMB) > 0) {
        nextUrl += `&max_size_mb=${encodeURIComponent(String(maxSizeMB))}`;
    }
    if (minWidth !== null && minWidth !== undefined && Number(minWidth) > 0) {
        nextUrl += `&min_width=${encodeURIComponent(String(minWidth))}`;
    }
    if (minHeight !== null && minHeight !== undefined && Number(minHeight) > 0) {
        nextUrl += `&min_height=${encodeURIComponent(String(minHeight))}`;
    }
    if (maxWidth !== null && maxWidth !== undefined && Number(maxWidth) > 0) {
        nextUrl += `&max_width=${encodeURIComponent(String(maxWidth))}`;
    }
    if (maxHeight !== null && maxHeight !== undefined && Number(maxHeight) > 0) {
        nextUrl += `&max_height=${encodeURIComponent(String(maxHeight))}`;
    }
    if (workflowType) {
        nextUrl += `&workflow_type=${encodeURIComponent(String(workflowType))}`;
    }
    if (dateRange) {
        nextUrl += `&date_range=${encodeURIComponent(String(dateRange))}`;
    }
    if (dateExact) {
        nextUrl += `&date_exact=${encodeURIComponent(String(dateExact))}`;
    }
    return nextUrl;
}

/**
 * Build view URL for asset
 */
export function buildViewURL(filename, subfolder = null, type = "output") {
    const fn = String(filename || "").trim();
    if (!fn) return "";
    let url = `${ENDPOINTS.VIEW}?filename=${encodeURIComponent(fn)}`;
    if (subfolder) {
        url += `&subfolder=${encodeURIComponent(subfolder)}`;
    }
    url += `&type=${encodeURIComponent(type)}`;
    return url;
}

/**
 * Build list URL with scope support.
 */
export function buildListURL(params = {}) {
    const {
        q = "*",
        limit = DEFAULT_QUERY_LIMIT,
        offset = DEFAULT_QUERY_OFFSET,
        scope = "output",
        subfolder = "",
        customRootId = null,
        kind = null,
        hasWorkflow = null,
        minRating = null,
        minSizeMB = null,
        maxSizeMB = null,
        resolutionCompare = null,
        minWidth = null,
        minHeight = null,
        maxWidth = null,
        maxHeight = null,
        workflowType = null,
        dateRange = null,
        dateExact = null,
        sort = null,
        includeTotal = true
    } = params;

    let url = `${ENDPOINTS.LIST}?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}&scope=${encodeURIComponent(scope)}`;
    if (subfolder) {
        url += `&subfolder=${encodeURIComponent(subfolder)}`;
    }
    if (customRootId) {
        url += `&custom_root_id=${encodeURIComponent(customRootId)}`;
    } else if (String(scope || "").toLowerCase() === "custom") {
        // Browser scope without selected root uses absolute filesystem paths.
        url += "&browser_mode=1";
    }
    url = appendAssetFilterQueryParams(url, {
        kind,
        hasWorkflow,
        minRating,
        minSizeMB,
        maxSizeMB,
        minWidth,
        minHeight,
        maxWidth,
        maxHeight,
        workflowType,
        dateRange,
        dateExact,
    });
    if (resolutionCompare) {
        url += `&resolution_compare=${encodeURIComponent(String(resolutionCompare))}`;
    }
    if (sort) {
        url += `&sort=${encodeURIComponent(String(sort))}`;
    }
    if (includeTotal === false) {
        url += `&include_total=0`;
    }
    return url;
}

export function buildCustomViewURL(filename, subfolder = "", rootId = "") {
    const fn = String(filename || "").trim();
    const rid = String(rootId || "").trim();
    if (!fn || !rid) return "";
    let url = `${ENDPOINTS.CUSTOM_VIEW}?root_id=${encodeURIComponent(rid)}&filename=${encodeURIComponent(fn)}`;
    if (subfolder) {
        url += `&subfolder=${encodeURIComponent(subfolder)}`;
    }
    return url;
}

export function buildBatchZipDownloadURL(token) {
    return `${ENDPOINTS.BATCH_ZIP_CREATE}/${encodeURIComponent(String(token || ""))}`;
}

export function buildDateHistogramURL(params = {}) {
    const {
        scope = "output",
        customRootId = null,
        month = "",
        kind = null,
        hasWorkflow = null,
        minRating = null
    } = params;

    let url = `${ENDPOINTS.DATE_HISTOGRAM}?scope=${encodeURIComponent(scope)}&month=${encodeURIComponent(String(month || ""))}`;
    if (customRootId) {
        url += `&custom_root_id=${encodeURIComponent(customRootId)}`;
    }
    return appendAssetFilterQueryParams(url, {
        subfolder: params.subfolder ?? null,
        kind,
        hasWorkflow,
        minRating,
        minSizeMB: params.minSizeMB ?? null,
        maxSizeMB: params.maxSizeMB ?? null,
        minWidth: params.minWidth ?? null,
        minHeight: params.minHeight ?? null,
        maxWidth: params.maxWidth ?? null,
        maxHeight: params.maxHeight ?? null,
        workflowType: params.workflowType ?? null,
        dateRange: params.dateRange ?? null,
        dateExact: params.dateExact ?? null,
    });
}

export function buildAssetViewURL(asset) {
    const rawPath = toPosixPath(String(
        asset?.filepath ||
        asset?.path ||
        asset?.fullpath ||
        asset?.full_path ||
        asset?.file_info?.filepath ||
        asset?.file_info?.path ||
        ""
    ).trim());
    let filename = String(
        asset?.filename ||
        asset?.name ||
        asset?.file_info?.filename ||
        ""
    ).trim();
    let subfolder = String(
        asset?.subfolder ||
        asset?.file_info?.subfolder ||
        ""
    ).trim();
    const pickFromPath = (p) => {
        const out = { type: "", subfolder: "", filename: "" };
        const normalized = toPosixPath(p);
        if (!normalized) return out;
        const idxOut = normalized.toLowerCase().indexOf("/output/");
        const idxIn = normalized.toLowerCase().indexOf("/input/");
        let baseIdx = -1;
        if (idxOut >= 0) {
            out.type = "output";
            baseIdx = idxOut + "/output/".length;
        } else if (idxIn >= 0) {
            out.type = "input";
            baseIdx = idxIn + "/input/".length;
        }
        if (baseIdx >= 0) {
            const rel = normalized.slice(baseIdx);
            const slash = rel.lastIndexOf("/");
            if (slash >= 0) {
                out.subfolder = rel.slice(0, slash);
                out.filename = rel.slice(slash + 1);
            } else {
                out.filename = rel;
            }
        } else {
            const split = splitFilenameAndSubfolder(normalized);
            out.filename = split.filename;
        }
        return out;
    };
    const fromPath = pickFromPath(rawPath);
    // If filename accidentally contains a relative path, split it for /view API.
    if (!subfolder && filename.includes("/")) {
        const idx = filename.lastIndexOf("/");
        if (idx > 0) {
            subfolder = filename.slice(0, idx);
            filename = filename.slice(idx + 1);
        }
    }
    if (!filename && fromPath.filename) filename = fromPath.filename;
    if (!subfolder && fromPath.subfolder) subfolder = fromPath.subfolder;
    if (!filename) return "";

    let type = String(asset?.type || asset?.file_info?.type || "").toLowerCase().trim();
    if (type !== "input" && type !== "output" && type !== "custom") type = "";
    if (!type && fromPath.type) type = fromPath.type;
    if (!type && rawPath) {
        if (rawPath.includes("/input/")) type = "input";
        else if (rawPath.includes("/output/")) type = "output";
    }
    if (!type) type = "output";

    const hasNativeBucket = rawPath.includes("/output/") || rawPath.includes("/input/");
    const subfolderLooksAbsolute = hasWindowsDrivePrefix(subfolder) || subfolder.startsWith("/");
    // Fallback: non-native output/input roots (or broken absolute subfolder values)
    // cannot be served by ComfyUI `/view`, so use backend filepath streaming URL.
    if (rawPath && type !== "custom" && (subfolderLooksAbsolute || !hasNativeBucket)) {
        return buildDownloadURL(rawPath, { inline: true });
    }

    if (type === "custom") {
        const rid = String(pickRootId(asset) || "").trim();
        if (rid) return buildCustomViewURL(filename, subfolder, rid);
        if (rawPath) {
            return `${ENDPOINTS.CUSTOM_VIEW}?filepath=${encodeURIComponent(rawPath)}&browser_mode=1`;
        }
        // Fallback for malformed custom assets without root id.
        const fallbackType = fromPath.type || "output";
        return buildViewURL(filename, subfolder, fallbackType);
    }
    // Prefer path-based type when explicit type conflicts with obvious filepath bucket.
    if (rawPath.includes("/output/")) type = "output";
    if (rawPath.includes("/input/")) type = "input";
    return buildViewURL(filename, subfolder, type);
}

/**
 * Build download URL for asset
 */
export function buildDownloadURL(filepath, options = {}) {
    if (!filepath) return "";
    const inline = !!options?.inline;
    let url = `${ENDPOINTS.DOWNLOAD}?filepath=${encodeURIComponent(filepath)}`;
    if (inline) url += "&preview=1";
    return url;
}
