export function createTTLCache({ ttlMs = 0, maxSize = 100, now = () => Date.now() } = {}) {
    const map = new Map();

    function _resolveNow() {
        try {
            const value = Number(now());
            return Number.isFinite(value) ? value : Date.now();
        } catch {
            return Date.now();
        }
    }

    function _resolveTTL() {
        try {
            const value = typeof ttlMs === "function" ? Number(ttlMs()) : Number(ttlMs);
            return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
        } catch {
            return 0;
        }
    }

    function _resolveMaxSize() {
        try {
            const value = Number(maxSize);
            return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
        } catch {
            return 1;
        }
    }

    function _isExpired(entry, nowValue, ttlValue) {
        if (!entry) return true;
        if (!(ttlValue > 0)) return false;
        return nowValue - Number(entry.at || 0) > ttlValue;
    }

    function _pruneExpired(nowValue = _resolveNow(), ttlValue = _resolveTTL()) {
        if (!(ttlValue > 0)) return;
        for (const [key, entry] of map.entries()) {
            if (_isExpired(entry, nowValue, ttlValue)) {
                map.delete(key);
            }
        }
    }

    function _evictOverflow() {
        const limit = _resolveMaxSize();
        while (map.size > limit) {
            const oldestKey = map.keys().next().value;
            if (oldestKey === undefined) break;
            map.delete(oldestKey);
        }
    }

    function _touch(key, entry) {
        map.delete(key);
        map.set(key, entry);
    }

    return {
        get(key) {
            const nowValue = _resolveNow();
            const ttlValue = _resolveTTL();
            _pruneExpired(nowValue, ttlValue);
            const entry = map.get(key);
            if (!entry) return undefined;
            if (_isExpired(entry, nowValue, ttlValue)) {
                map.delete(key);
                return undefined;
            }
            return entry.value;
        },

        has(key) {
            return this.get(key) !== undefined;
        },

        set(key, value, options = {}) {
            const entryAtRaw = Number(options?.at);
            const entryAt = Number.isFinite(entryAtRaw) ? entryAtRaw : _resolveNow();
            const entry = { value, at: entryAt };
            if (map.has(key)) {
                _touch(key, entry);
            } else {
                map.set(key, entry);
            }
            _pruneExpired(_resolveNow(), _resolveTTL());
            _evictOverflow();
            return value;
        },

        delete(key) {
            return map.delete(key);
        },

        clear() {
            map.clear();
        },

        prune() {
            _pruneExpired(_resolveNow(), _resolveTTL());
            _evictOverflow();
            return map.size;
        },

        keys() {
            this.prune();
            return Array.from(map.keys());
        },

        entries() {
            this.prune();
            return Array.from(map.entries()).map(([key, entry]) => [key, entry.value]);
        },

        get size() {
            this.prune();
            return map.size;
        },
    };
}
