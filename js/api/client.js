/**
 * API Client - Safe fetch wrapper (never throws)
 */

import { SETTINGS_KEY } from "../app/settingsStore.js";
import { ENDPOINTS } from "./endpoints.js";
import { createApiFetchClient } from "./fetchUtils.js";
import { normalizeAssetId, pickRootId } from "../utils/ids.js";
import { createTTLCache } from "../utils/ttlCache.js";
import {
    readAuthToken as _readAuthToken,
    ensureWriteAuthToken,
    normalizeWriteAuthFailure as _normalizeWriteAuthFailure,
    invalidateAuthTokenCache,
    setRuntimeSecurityToken,
} from "./clientAuth.js";

/**
 * @template T
 * @typedef {{
 *  ok: boolean,
 *  data: (T|null),
 *  error?: (string|null),
 *  code?: string,
 *  meta?: any,
 *  status?: number
 * }} ApiResult
 */

/**
 * Compact viewer-oriented media info returned by `/mjr/am/viewer/info`.
 *
 * @typedef {{
 *  kind?: ('image'|'video'|'audio'|'model3d'|'unknown'),
 *  mime?: (string|null),
 *  width?: (number|null),
 *  height?: (number|null),
 *  fps?: (number|string|null),
 *  fps_raw?: (string|null),
 *  frame_count?: (number|null),
 *  duration_s?: (number|null),
 *  loader?: (string|null),
 *  previewable?: (boolean|null),
 *  interactive?: (boolean|null),
 *  resource_endpoint?: (string|null)
 * }} ViewerInfo
 */

export { setRuntimeSecurityToken, ensureWriteAuthToken };

const TAGS_CACHE_TTL_MS = 30_000;
const DEFAULT_TAGS_CACHE_TTL_MS = TAGS_CACHE_TTL_MS;
const CLIENT_GLOBAL_KEY = "__MJR_API_CLIENT__";
const SETTINGS_FAST_CACHE_TTL_MS = 2000;
const MAX_BATCH_ASSET_IDS = 200;
export const VECTOR_BACKFILL_DEFAULT_POLL_INTERVAL_MS = 1000;
export const VECTOR_BACKFILL_DEFAULT_POLL_TIMEOUT_MS = 30 * 60_000;
export const VECTOR_BACKFILL_MAX_POLL_TIMEOUT_MS = 12 * 60 * 60_000;
const SETTINGS_CACHE_KEY = "settings";
const TAGS_CACHE_KEY = "available-tags";
const _obsCache = createTTLCache({ ttlMs: SETTINGS_FAST_CACHE_TTL_MS, maxSize: 1 });
const _rtSyncCache = createTTLCache({ ttlMs: SETTINGS_FAST_CACHE_TTL_MS, maxSize: 1 });
const _tagsCache = createTTLCache({ ttlMs: () => _getTagsCacheTTL(), maxSize: 1 });

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSE_VALUES = new Set(["0", "false", "no", "off"]);

function _coerceBool(value, fallback = false) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
        const s = value.trim().toLowerCase();
        if (TRUE_VALUES.has(s)) return true;
        if (FALSE_VALUES.has(s)) return false;
    }
    return Boolean(fallback);
}

function _getTagsCacheTTL() {
    try {
        const raw = localStorage?.getItem?.(SETTINGS_KEY) || "{}";
        const parsed = JSON.parse(raw);
        const ttl =
            parsed?.cache?.tagsTTLms ??
            parsed?.cache?.tagsTTL ??
            parsed?.cache?.tags_ttl_ms ??
            null;
        const n = Number(ttl);
        if (!Number.isFinite(n)) return DEFAULT_TAGS_CACHE_TTL_MS;
        return Math.max(1_000, Math.min(10 * 60_000, Math.floor(n)));
    } catch {
        return DEFAULT_TAGS_CACHE_TTL_MS;
    }
}

function invalidateObsCache() {
    _obsCache.clear();
}

function invalidateRatingTagsSyncCache() {
    _rtSyncCache.clear();
}

function invalidateTagsCache() {
    _tagsCache.clear();
}

function _normalizeTagCacheKey(raw) {
    const value = String(raw ?? "")
        .trim()
        .toLowerCase();
    return value || "";
}

function _dedupeTagList(tags) {
    const next = [];
    const seen = new Set();
    for (const raw of Array.isArray(tags) ? tags : []) {
        const value = String(raw ?? "").trim();
        if (!value) continue;
        const key = _normalizeTagCacheKey(value);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        next.push(value);
    }
    return next;
}

// Best-effort cache invalidation when settings change (ComfyUI settings, dev tools, etc.).
try {
    const w = typeof window !== "undefined" ? window : null;
    if (w && !w[CLIENT_GLOBAL_KEY]) {
        w[CLIENT_GLOBAL_KEY] = { initialized: true };

        w.addEventListener?.("storage", (event) => {
            try {
                if (event?.key === SETTINGS_KEY) {
                    invalidateObsCache();
                    invalidateRatingTagsSyncCache();
                    invalidateTagsCache();
                    invalidateAuthTokenCache();
                }
            } catch (e) {
                console.debug?.(e);
            }
        });

        w.addEventListener?.("mjr-settings-changed", () => {
            invalidateObsCache();
            invalidateRatingTagsSyncCache();
            invalidateTagsCache();
            invalidateAuthTokenCache();
        });
    }
} catch (e) {
    console.debug?.(e);
}

const _readObsEnabled = () => {
    const cached = _obsCache.get(SETTINGS_CACHE_KEY);
    if (cached !== undefined) {
        return cached;
    }
    const now = Date.now();
    try {
        const raw = localStorage?.getItem?.(SETTINGS_KEY);
        if (!raw) {
            _obsCache.set(SETTINGS_CACHE_KEY, false, { at: now });
            return false;
        }
        const parsed = JSON.parse(raw);
        const value = !!parsed?.observability?.enabled;
        _obsCache.set(SETTINGS_CACHE_KEY, value, { at: now });
        return value;
    } catch {
        _obsCache.set(SETTINGS_CACHE_KEY, false, { at: now });
        return false;
    }
};

const _readRatingTagsSyncEnabled = () => {
    const cached = _rtSyncCache.get(SETTINGS_CACHE_KEY);
    if (cached !== undefined) {
        return cached;
    }
    const now = Date.now();
    try {
        const raw = localStorage?.getItem?.(SETTINGS_KEY);
        if (!raw) {
            _rtSyncCache.set(SETTINGS_CACHE_KEY, true, { at: now });
            return true;
        }
        const parsed = JSON.parse(raw);
        const configured = parsed?.ratingTagsSync?.enabled;
        const value =
            configured === undefined || configured === null ? true : _coerceBool(configured, true);
        _rtSyncCache.set(SETTINGS_CACHE_KEY, value, { at: now });
        return value;
    } catch {
        _rtSyncCache.set(SETTINGS_CACHE_KEY, true, { at: now });
        return true;
    }
};

const _apiFetchClient = createApiFetchClient({
    readObsEnabled: _readObsEnabled,
    readAuthToken: _readAuthToken,
    ensureWriteAuthToken,
    normalizeWriteAuthFailure: _normalizeWriteAuthFailure,
});
const fetchAPI = _apiFetchClient.fetchAPI;

export async function get(url, options = {}) {
    return _apiFetchClient.get(url, options);
}

export async function post(url, body, options = {}) {
    return _apiFetchClient.post(url, body, options);
}

/**
 * Update asset rating (0-5 stars)
 */
export async function updateAssetRating(assetId, rating, options = {}) {
    const enabled = _readRatingTagsSyncEnabled();
    const asset = assetId && typeof assetId === "object" ? assetId : null;
    const resolvedId = asset ? asset.id : assetId;
    const normalizedId = normalizeAssetId(resolvedId);
    const payload = {
        rating: Math.max(0, Math.min(5, Number(rating) || 0)),
    };
    if (normalizedId) {
        payload.asset_id = normalizedId;
    } else if (asset) {
        payload.filepath = asset.filepath || asset.path || asset?.file_info?.filepath || "";
        payload.type = asset.type || "output";
        payload.root_id = pickRootId(asset);
    }
    return fetchAPI("/mjr/am/asset/rating", {
        ...options,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(enabled ? { "X-MJR-RTSYNC": "on" } : {}),
        },
        body: JSON.stringify(payload),
    });
}

/**
 * Update asset tags
 */
export async function updateAssetTags(assetId, tags, options = {}) {
    const enabled = _readRatingTagsSyncEnabled();
    const asset = assetId && typeof assetId === "object" ? assetId : null;
    const resolvedId = asset ? asset.id : assetId;
    const normalizedId = normalizeAssetId(resolvedId);
    const payload = {
        tags: Array.isArray(tags) ? tags : [],
    };
    if (normalizedId) {
        payload.asset_id = normalizedId;
    } else if (asset) {
        payload.filepath = asset.filepath || asset.path || asset?.file_info?.filepath || "";
        payload.type = asset.type || "output";
        payload.root_id = pickRootId(asset);
    }
    const result = await fetchAPI("/mjr/am/asset/tags", {
        ...options,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(enabled ? { "X-MJR-RTSYNC": "on" } : {}),
        },
        body: JSON.stringify(payload),
    });
    if (result?.ok) {
        invalidateTagsCache();
    }
    return result;
}

/**
 * Get all available tags from the database
 */
export async function getAvailableTags() {
    const cachedTags = _tagsCache.get(TAGS_CACHE_KEY);
    if (Array.isArray(cachedTags)) {
        return { ok: true, data: cachedTags, error: null, code: "OK", meta: { cached: true } };
    }

    const result = await get("/mjr/am/tags");
    if (result?.ok && Array.isArray(result.data)) {
        const deduped = _dedupeTagList(result.data);
        _tagsCache.set(TAGS_CACHE_KEY, deduped);
        return { ...result, data: deduped };
    }
    return result;
}

/**
 * Get full asset metadata by ID
 */
export async function getAssetMetadata(assetId, options = {}) {
    const id = encodeURIComponent(normalizeAssetId(assetId));
    return get(`/mjr/am/asset/${id}`, {
        ...options,
        dedupeKey: options?.dedupeKey || `meta:${id}`,
    });
}

/**
 * Get compact viewer media info by asset ID (fps/frame count/dimensions/etc).
 */
/** @returns {Promise<ApiResult<ViewerInfo>>} */
export async function getViewerInfo(assetId, options = {}) {
    const id = normalizeAssetId(assetId);
    if (!id) return { ok: false, data: null, error: "Missing assetId", code: "INVALID_INPUT" };
    let url = `/mjr/am/viewer/info?asset_id=${encodeURIComponent(id)}`;
    if (options.refresh) url += "&refresh=1";
    const { refresh: _ignored, ...fetchOpts } = options;
    return get(url, fetchOpts);
}

/**
 * Batch fetch assets by ID (no per-asset tool invocations / self-heal).
 */
export async function getAssetsBatch(assetIds, options = {}) {
    const ids = Array.isArray(assetIds) ? assetIds : [];
    const cleaned = [];
    for (const id of ids) {
        const n = Number(id);
        if (!Number.isFinite(n)) continue;
        cleaned.push(Math.trunc(n));
        if (cleaned.length >= MAX_BATCH_ASSET_IDS) break;
    }
    if (!cleaned.length) return { ok: true, data: [], error: null, code: "OK" };
    return post("/mjr/am/assets/batch", { asset_ids: cleaned }, options);
}

export async function hydrateAssetRatingTags(assetId) {
    const id = normalizeAssetId(assetId);
    if (!id) return { ok: false, error: "Missing assetId" };
    return get(`/mjr/am/asset/${encodeURIComponent(id)}?hydrate=rating_tags`);
}

/**
 * Get metadata for a file reference (preferred over absolute paths).
 * Works on /view URLs where ComfyUI provides type/filename/subfolder.
 */
export async function getFileMetadataScoped(
    {
        type = "output",
        filename = "",
        subfolder = "",
        root_id = "",
        rootId = "",
        filepath = "",
    } = {},
    options = {},
) {
    const t =
        String(type || "output")
            .trim()
            .toLowerCase() || "output";
    const fn = String(filename || "").trim();
    const sub = String(subfolder || "").trim();
    const rid = String(root_id || rootId || "").trim();
    const fp = String(filepath || "").trim();
    if (!fn) return { ok: false, data: null, error: "Missing filename", code: "INVALID_INPUT" };
    let url = `/mjr/am/metadata?type=${encodeURIComponent(t)}&filename=${encodeURIComponent(fn)}`;
    if (fp) url += `&filepath=${encodeURIComponent(fp)}`;
    if (sub) url += `&subfolder=${encodeURIComponent(sub)}`;
    if (rid) url += `&root_id=${encodeURIComponent(rid)}`;
    return get(url, options);
}

export async function getFolderInfo(
    { filepath = "", root_id = "", subfolder = "" } = {},
    options = {},
) {
    try {
        if (globalThis.__mjrFolderInfoSupported === false) {
            return {
                ok: false,
                data: null,
                error: "Folder info endpoint unavailable",
                code: "UNAVAILABLE",
            };
        }
        if (globalThis.__mjrFolderInfoSupported == null) {
            const rr = await get("/mjr/am/routes");
            if (rr?.ok && Array.isArray(rr.data)) {
                const hasRoute = rr.data.some(
                    (r) => String(r?.path || "").trim() === "/mjr/am/folder-info",
                );
                globalThis.__mjrFolderInfoSupported = !!hasRoute;
                if (!hasRoute) {
                    return {
                        ok: false,
                        data: null,
                        error: "Folder info endpoint unavailable",
                        code: "UNAVAILABLE",
                    };
                }
            } else {
                // Soft-fail: keep null so future calls can retry route discovery.
                globalThis.__mjrFolderInfoSupported = null;
            }
        }
    } catch (e) {
        console.debug?.(e);
    }

    const fp = String(filepath || "").trim();
    const rid = String(root_id || "").trim();
    const sub = String(subfolder || "").trim();
    let url = ENDPOINTS.FOLDER_INFO;
    const params = [];
    if (fp) {
        params.push(`filepath=${encodeURIComponent(fp)}`);
        params.push("browser_mode=1");
    } else {
        if (rid) params.push(`root_id=${encodeURIComponent(rid)}`);
        if (sub) params.push(`subfolder=${encodeURIComponent(sub)}`);
    }
    if (params.length) url += `?${params.join("&")}`;
    const res = await get(url, options);
    try {
        if (!res?.ok && Number(res?.status || 0) === 404) {
            globalThis.__mjrFolderInfoSupported = false;
        }
    } catch (e) {
        console.debug?.(e);
    }
    return res;
}

export * from "./clientOps.js";
