/**
 * Early-fetch coordinator for the assets list.
 *
 * Lightweight module imported as early as possible (top-level side effect from
 * `entry.js`) so the first /list request leaves the browser BEFORE ComfyUI's
 * extension manager finishes initialising. This shaves seconds off the first
 * paint of the Assets Manager grid on cold ComfyUI starts: previously the
 * fetch only fired from inside `setup()` step 8b, well after `waitForComfyApp`
 * polling, lazy module imports and global runtime mount.
 *
 * The module intentionally has only two dependencies (`api/client.js` and
 * `api/endpoints.js`) so importing it does not pull Vue, Pinia or any UI
 * surface into the initial parse.
 */

import { get } from "../../api/client.js";
import { buildListURL, ENDPOINTS } from "../../api/endpoints.js";
import { APP_CONFIG } from "../../app/config.js";

const PANEL_STATE_KEY = "mjr_panel_state";
const EARLY_FETCH_ENABLED = false;
const ALLOWED_SCOPES = new Set(["output", "input", "all", "custom", "collection"]);

// 15 seconds — wide enough to cover slow ComfyUI startups and delayed sidebar
// opens while still invalidating stale data before it becomes misleading.
const EARLY_FETCH_TTL_MS = 15000;

let _earlyFetchPromise = null;
let _earlyFetchKey = null;
let _earlyFetchTimestamp = 0;
let _earlyFetchAC = null;
let _pageHideBound = false;

function _readPersistedPanelState() {
    try {
        const raw = globalThis?.localStorage?.getItem?.(PANEL_STATE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
        return null;
    }
}

function _normalizeScope(value) {
    const s = String(value || "output")
        .trim()
        .toLowerCase();
    if (s === "outputs") return "output";
    if (s === "inputs") return "input";
    return ALLOWED_SCOPES.has(s) ? s : "output";
}

/**
 * Reads the persisted Pinia panel state and exposes the fields needed to
 * rebuild a /list URL that matches whatever the user last left the panel in.
 * Returning the full filter set (instead of just scope+sort) is what allows
 * the early fetch to be reused even when the user has saved filters such as
 * `workflowOnly` or `minRating>0`.
 */
function _readPersistedListContext() {
    const state = _readPersistedPanelState();
    const scope = _normalizeScope(state?.scope);
    const sort =
        String(state?.sort || "mtime_desc")
            .trim()
            .toLowerCase() || "mtime_desc";
    const customRootId = String(state?.customRootId || "").trim();
    const subfolder = String(state?.currentFolderRelativePath || "").trim();
    const collectionId = String(state?.collectionId || "").trim();
    const kind = String(state?.kindFilter || "").trim();
    const workflowOnly = !!state?.workflowOnly;
    const minRating = Number(state?.minRating || 0) || 0;
    const minSizeMB = Number(state?.minSizeMB || 0) || 0;
    const maxSizeMB = Number(state?.maxSizeMB || 0) || 0;
    const resolutionCompare = state?.resolutionCompare === "lte" ? "lte" : "gte";
    const minWidth = Number(state?.minWidth || 0) || 0;
    const minHeight = Number(state?.minHeight || 0) || 0;
    const maxWidth = Number(state?.maxWidth || 0) || 0;
    const maxHeight = Number(state?.maxHeight || 0) || 0;
    const workflowType = String(state?.workflowType || "").trim();
    const dateRange = String(state?.dateRangeFilter || "")
        .trim()
        .toLowerCase();
    const dateExact = String(state?.dateExactFilter || "").trim();
    const searchQuery = String(state?.searchQuery || "").trim();
    return {
        scope,
        sort,
        customRootId,
        subfolder,
        collectionId,
        kind,
        workflowOnly,
        minRating,
        minSizeMB,
        maxSizeMB,
        resolutionCompare,
        minWidth,
        minHeight,
        maxWidth,
        maxHeight,
        workflowType,
        dateRange,
        dateExact,
        // Treat any free-text search as "do not prefetch *" — the panel will
        // run its own search query at mount time and we should not pollute
        // the cache with mismatching results.
        query: searchQuery ? "" : "*",
    };
}

/**
 * Build a stable cache key matching the one used by `consumeEarlyFetch`
 * callers. The key fingerprints every filter that affects /list output so a
 * change in any filter invalidates the prefetch.
 */
function _buildEarlyFetchKey(ctx) {
    return [
        ctx.scope,
        ctx.query || "*",
        ctx.sort,
        ctx.customRootId,
        ctx.subfolder,
        ctx.collectionId,
        ctx.kind,
        ctx.workflowOnly ? "1" : "",
        ctx.minRating || "",
        ctx.minSizeMB || "",
        ctx.maxSizeMB || "",
        ctx.resolutionCompare,
        ctx.minWidth || "",
        ctx.minHeight || "",
        ctx.maxWidth || "",
        ctx.maxHeight || "",
        ctx.workflowType,
        ctx.dateRange,
        ctx.dateExact,
    ].join("|");
}

function _bindUnloadOnce() {
    if (_pageHideBound) return;
    _pageHideBound = true;
    try {
        // pagehide is fired both on unload and BFcache eviction; aborting the
        // in-flight request avoids polluting the next session's network log
        // with epoch-1 cancelled entries.
        window.addEventListener("pagehide", () => {
            try {
                _earlyFetchAC?.abort?.();
            } catch {
                /* ignore */
            }
            _earlyFetchAC = null;
            _earlyFetchPromise = null;
            _earlyFetchKey = null;
        });
    } catch {
        /* ignore */
    }
}

/**
 * Start (or reuse) the early /list fetch. Safe to call multiple times.
 * Returns the in-flight promise (or `null` when no window/localStorage).
 */
export function startEarlyFetch() {
    if (!EARLY_FETCH_ENABLED) return null;
    if (typeof window === "undefined") return null;
    _bindUnloadOnce();

    const ctx = _readPersistedListContext();
    const key = _buildEarlyFetchKey(ctx);
    const now = Date.now();

    if (
        _earlyFetchPromise &&
        _earlyFetchKey === key &&
        now - _earlyFetchTimestamp < EARLY_FETCH_TTL_MS
    ) {
        return _earlyFetchPromise;
    }

    _earlyFetchKey = key;
    _earlyFetchTimestamp = now;

    try {
        try {
            _earlyFetchAC?.abort?.();
        } catch {
            /* ignore */
        }
        _earlyFetchAC = typeof AbortController !== "undefined" ? new AbortController() : null;

        // Skip prefetch only for contexts we cannot reliably reproduce here:
        //   - free-text searches (the panel will run its own search query)
        //   - collection scope (collectionId resolution is async-store-bound)
        //   - custom scope WITHOUT a persisted customRootId (we don't know
        //     which root to load; panel will pick one at mount time)
        // Custom scope WITH a persisted customRootId is safe to prefetch:
        // the listing endpoint accepts custom_root_id as a query param and
        // the panel's match key includes it, so the cache will hit.
        if (ctx.query !== "*" || ctx.scope === "collection") {
            _earlyFetchPromise = null;
            return null;
        }
        if (ctx.scope === "custom" && !ctx.customRootId) {
            _earlyFetchPromise = null;
            return null;
        }

        const url = buildListURL({
            q: ctx.query || "*",
            limit: APP_CONFIG?.DEFAULT_PAGE_SIZE || 200,
            offset: 0,
            scope: ctx.scope,
            subfolder: ctx.subfolder || "",
            customRootId: ctx.customRootId || null,
            kind: ctx.kind || null,
            hasWorkflow: ctx.workflowOnly ? true : null,
            minRating: ctx.minRating > 0 ? ctx.minRating : null,
            minSizeMB: ctx.minSizeMB > 0 ? ctx.minSizeMB : null,
            maxSizeMB: ctx.maxSizeMB > 0 ? ctx.maxSizeMB : null,
            resolutionCompare: ctx.resolutionCompare,
            minWidth: ctx.minWidth > 0 ? ctx.minWidth : null,
            minHeight: ctx.minHeight > 0 ? ctx.minHeight : null,
            maxWidth: ctx.maxWidth > 0 ? ctx.maxWidth : null,
            maxHeight: ctx.maxHeight > 0 ? ctx.maxHeight : null,
            workflowType: ctx.workflowType || null,
            dateRange: ctx.dateRange || null,
            dateExact: ctx.dateExact || null,
            sort: ctx.sort,
            // Skip backend COUNT(*) on the prefetch — the panel will request
            // it lazily on subsequent pages.
            includeTotal: false,
        });
        _earlyFetchPromise = get(url, _earlyFetchAC ? { signal: _earlyFetchAC.signal } : {}).catch(
            () => null,
        );
    } catch {
        _earlyFetchPromise = null;
        _earlyFetchAC = null;
    }
    return _earlyFetchPromise;
}

/**
 * Consume the prefetched /list result if available and matching the key.
 * `null` keys are accepted as "give me whatever was prefetched" (legacy).
 */
export function consumeEarlyFetch(key = null) {
    if (!EARLY_FETCH_ENABLED) return null;
    if (!_earlyFetchPromise) return null;
    if (key && _earlyFetchKey !== key) return null;
    const now = Date.now();
    if (now - _earlyFetchTimestamp >= EARLY_FETCH_TTL_MS) {
        _earlyFetchPromise = null;
        _earlyFetchKey = null;
        return null;
    }
    const promise = _earlyFetchPromise;
    _earlyFetchPromise = null;
    _earlyFetchKey = null;
    _earlyFetchAC = null;
    return promise;
}

/**
 * Returns the active prefetch key, or `null` if no fetch is in flight or it
 * has expired. Callers can use this to compose grid-side cache lookups
 * without consuming the promise.
 */
export function peekEarlyFetchKey() {
    if (!EARLY_FETCH_ENABLED) return null;
    if (!_earlyFetchPromise) return null;
    if (Date.now() - _earlyFetchTimestamp >= EARLY_FETCH_TTL_MS) return null;
    return _earlyFetchKey;
}

// Side-effect: kick off the very first /list request as soon as this module
// is parsed. Guarded by feature flag for tests/SSR. ENDPOINTS is touched only
// to ensure the import is not tree-shaken away.
try {
    if (typeof window !== "undefined" && ENDPOINTS && ENDPOINTS.LIST) {
        startEarlyFetch();
    }
} catch {
    /* ignore */
}
