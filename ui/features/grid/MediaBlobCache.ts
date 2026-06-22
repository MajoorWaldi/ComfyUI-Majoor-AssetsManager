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
// Keep the cache small and short-lived. Browser-decoded thumbnails and video
// frames can occupy GPU memory even when the JS blob is small, so off-screen
// assets must age out quickly during scroll/filter churn.
const MAX_ENTRIES = 384;
const ACTIVE_TTL_MS = 5 * 60 * 1000;
const RELEASED_TTL_MS = 30 * 1000;
const CLEANUP_INTERVAL_MS = 15 * 1000;
const MAX_CONCURRENT_FETCHES = 6;
const CONSTRAINED_MAX_ENTRIES = 192;
const CONSTRAINED_MAX_CONCURRENT_FETCHES = 3;

/**
 * @typedef {{ blobUrl: string|null, refcount: number, expiresAt: number, hasError: boolean }} CacheEntry
 */

function _createCache() {
    /** @type {Map<string, CacheEntry>} */
    const _entries = new Map();
    let _cleanupTimer: any = null;
    let _activeFetches = 0;
    const _fetchQueue: any[] = [];

    function _isConstrainedRuntime() {
        try {
            const nav: any = typeof navigator !== "undefined" ? navigator : null;
            const deviceMemory = Number(nav?.deviceMemory || 0) || 0;
            if (deviceMemory > 0 && deviceMemory <= 4) return true;
            if (nav?.connection?.saveData === true) return true;
        } catch (e: any) {
            console.debug?.(e);
        }
        return false;
    }

    function _maxEntries() {
        return _isConstrainedRuntime() ? CONSTRAINED_MAX_ENTRIES : MAX_ENTRIES;
    }

    function _maxConcurrentFetches() {
        return _isConstrainedRuntime() ? CONSTRAINED_MAX_CONCURRENT_FETCHES : MAX_CONCURRENT_FETCHES;
    }

    async function _withFetchSlot(task: any) {
        if (_activeFetches >= _maxConcurrentFetches()) {
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
                if (entry.refcount <= 0 && now >= entry.expiresAt) {
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

    function _touch(entry: any, ttlMs = ACTIVE_TTL_MS) {
        entry.expiresAt = Date.now() + ttlMs;
    }

    function _trimToLimit() {
        while (_entries.size > _maxEntries()) {
            const before = _entries.size;
            _evictLRU();
            if (_entries.size === before) break;
        }
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
                if (_entries.size >= _maxEntries()) _evictLRU();
                _entries.set(key, {
                    blobUrl: null,
                    refcount: 0,
                    expiresAt: Date.now() + RELEASED_TTL_MS,
                    hasError: true,
                });
                _trimToLimit();
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
            if (_entries.size >= _maxEntries()) _evictLRU();
            _entries.set(key, {
                blobUrl,
                refcount: 1,
                expiresAt: Date.now() + ACTIVE_TTL_MS,
                hasError: false,
            });
            _trimToLimit();
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
     * Decrement refcount for src. Once unused, keep it briefly for scroll-back
     * reuse, then let cleanup revoke the blob URL.
     * @param {string} src
     */
    function releaseUrl(src: any) {
        try {
            const key = _normalizeKey(src);
            if (!key) return;
            const entry = _entries.get(key);
            if (entry) {
                entry.refcount = Math.max(0, entry.refcount - 1);
                if (entry.refcount <= 0) _touch(entry, RELEASED_TTL_MS);
            }
            _runCleanup();
            _trimToLimit();
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
