/**
 * MediaBlobCache  -  Error-tracking and blob URL cache for media assets.
 *
 * Primary value:
 *  - hasError()   prevents retry storms when a thumbnail fails to load.
 *  - markError()  called from onerror handlers to register a broken URL.
 *  - acquireUrl() ref-counted blob URL cache (useful with auth-gated endpoints).
 *  - releaseUrl() decrement refcount; cleanup deferred until TTL expires.
 *
 * Singleton: stored on `window[CACHE_KEY]` so multiple module imports share state.
 */

const CACHE_KEY = "__MJR_MEDIA_BLOB_CACHE__";
// Session cache: keep thumbs in memory for faster re-access during the session.
// On modern systems with 16GB+ RAM, 2000 thumbs at ~50KB avg = ~100MB max.
const MAX_ENTRIES = 2000;
// Long TTL: keep cached for entire session (cleaned on page unload anyway).
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours (session-bound)
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes (less aggressive)
const MAX_CONCURRENT_FETCHES = 6;

/**
 * @typedef {{ blobUrl: string|null, refcount: number, expiresAt: number, hasError: boolean }} CacheEntry
 */

function _createCache() {
    /** @type {Map<string, CacheEntry>} */
    const _entries = new Map();
    let _cleanupTimer: any = null;
    let _activeFetches = 0;
    const _fetchQueue: any[] = [];

    async function _withFetchSlot(task: any) {
        if (_activeFetches >= MAX_CONCURRENT_FETCHES) {
            await new Promise((resolve) => _fetchQueue.push(resolve));
        }
        _activeFetches += 1;
        try {
            return await task();
        } finally {
            _activeFetches = Math.max(0, _activeFetches - 1);
            const next = _fetchQueue.shift();
            if (next) next();
        }
    }

    function _scheduleCleanup() {
        if (_cleanupTimer) return;
        _cleanupTimer = setInterval(_runCleanup, CLEANUP_INTERVAL_MS);
    }

    function _runCleanup() {
        try {
            const now = Date.now();
            for (const [url, entry] of _entries) {
                if (entry.refcount <= 0 && now > entry.expiresAt) {
                    _revokeEntry(entry);
                    _entries.delete(url);
                }
            }
        } catch (e: any) {
            console.debug?.(e);
        }
    }

    function _revokeEntry(entry: any) {
        try {
            if (entry?.blobUrl?.startsWith("blob:")) URL.revokeObjectURL(entry.blobUrl);
        } catch (e: any) {
            console.debug?.(e);
        }
    }

    function _evictLRU() {
        let oldestUrl = null;
        let oldestExpiry = Infinity;
        for (const [url, entry] of _entries) {
            if (entry.refcount > 0) continue;
            if (entry.expiresAt < oldestExpiry) {
                oldestExpiry = entry.expiresAt;
                oldestUrl = url;
            }
        }
        if (oldestUrl) {
            _revokeEntry(_entries.get(oldestUrl));
            _entries.delete(oldestUrl);
        }
    }

    function _touch(entry: any) {
        entry.expiresAt = Date.now() + TTL_MS;
    }

    function _normalizeKey(src: any) {
        try {
            return String(src || "").trim();
        } catch {
            return "";
        }
    }

    /**
     * Mark a URL as errored. Future `hasError()` calls return true.
     * @param {string} src
     */
    function markError(src: any) {
        try {
            const key = _normalizeKey(src);
            if (!key) return;
            const existing = _entries.get(key);
            if (existing) {
                existing.hasError = true;
                _touch(existing);
            } else {
                if (_entries.size >= MAX_ENTRIES) _evictLRU();
                _entries.set(key, {
                    blobUrl: null,
                    refcount: 0,
                    expiresAt: Date.now() + TTL_MS,
                    hasError: true,
                });
                _scheduleCleanup();
            }
        } catch (e: any) {
            console.debug?.(e);
        }
    }

    /**
     * Returns true if a previous load of src failed.
     * @param {string} src
     * @returns {boolean}
     */
    function hasError(src: any) {
        try {
            const key = _normalizeKey(src);
            return key ? !!_entries.get(key)?.hasError : false;
        } catch (e: any) {
            console.debug?.(e);
            return false;
        }
    }

    /**
     * Acquire a blob URL for src (fetches if not cached, increments refcount).
     * Returns null if the URL has a known error or the fetch fails.
     * @param {string} src
     * @param {{ signal?: AbortSignal|null }} [options]
     * @returns {Promise<string|null>}
     */
    async function acquireUrl(src: any, options: Record<string, any> = {}) {
        try {
            const key = _normalizeKey(src);
            if (!key) return null;
            const signal = options?.signal || null;
            if (signal?.aborted) return null;
            const existing = _entries.get(key);
            if (existing?.hasError) return null;
            if (existing?.blobUrl) {
                existing.refcount += 1;
                _touch(existing);
                return existing.blobUrl;
            }
            const resp = await _withFetchSlot(() => {
                if (signal?.aborted) return Promise.resolve(null);
                return fetch(src, { credentials: "same-origin", ...(signal ? { signal } : {}) });
            });
            if (!resp) return null;
            if (!resp.ok) {
                markError(src);
                return null;
            }
            const blob = await resp.blob();
            const blobUrl = URL.createObjectURL(blob);
            if (_entries.size >= MAX_ENTRIES) _evictLRU();
            _entries.set(key, {
                blobUrl,
                refcount: 1,
                expiresAt: Date.now() + TTL_MS,
                hasError: false,
            });
            _scheduleCleanup();
            return blobUrl;
        } catch (e: any) {
            if (String(e?.name || "") === "AbortError") return null;
            console.debug?.(e);
            markError(src);
            return null;
        }
    }

    /**
     * Decrement refcount for src. The blob URL is revoked only when refcount
     * reaches 0 AND the TTL expires (via the periodic cleanup).
     * @param {string} src
     */
    function releaseUrl(src: any) {
        try {
            const key = _normalizeKey(src);
            if (!key) return;
            const entry = _entries.get(key);
            if (entry) entry.refcount = Math.max(0, entry.refcount - 1);
        } catch (e: any) {
            console.debug?.(e);
        }
    }

    function dispose() {
        try {
            if (_cleanupTimer) {
                clearInterval(_cleanupTimer);
                _cleanupTimer = null;
            }
            for (const entry of _entries.values()) _revokeEntry(entry);
            _entries.clear();
        } catch (e: any) {
            console.debug?.(e);
        }
    }

    try {
        window.addEventListener("beforeunload", dispose, { once: true });
    } catch (e: any) {
        console.debug?.(e);
    }

    return { markError, hasError, acquireUrl, releaseUrl, dispose };
}

function _getOrCreate() {
    try {
        if ((window as any)[CACHE_KEY]) return (window as any)[CACHE_KEY];
    } catch (e: any) {
        console.debug?.(e);
    }
    try {
        (window as any)[CACHE_KEY]?.dispose?.();
    } catch (e: any) {
        console.debug?.(e);
    }
    const cache = _createCache();
    try {
        (window as any)[CACHE_KEY] = cache;
    } catch (e: any) {
        console.debug?.(e);
    }
    return cache;
}

export const MediaBlobCache = _getOrCreate();
