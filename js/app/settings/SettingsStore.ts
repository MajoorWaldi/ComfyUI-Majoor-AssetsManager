/**
 * Centralized key/value storage wrapper for browser settings.
 * Uses localStorage when available and notifies subscribers on changes.
 */

const _subscribers = new Map<string, Set<(...args: any[]) => void>>();
let _storageListenerBound = false;
let _storageListener: ((event: any) => void) | null = null;

function _getStorage() {
    try {
        if (typeof window === "undefined") return null;
        const ls = window.localStorage;
        if (!ls) return null;
        return ls;
    } catch {
        return null;
    }
}

function _emit(key: any, nextValue: any, previousValue: any) {
    const set = _subscribers.get(String(key || ""));
    if (!set || !set.size) return;
    for (const cb of Array.from(set)) {
        try {
            cb(nextValue, previousValue, key);
        } catch (e) {
            console.debug?.(e);
        }
    }
}

function _bindStorageListener() {
    if (_storageListenerBound) return;
    try {
        _storageListener = (event: any) => {
            const key = String(event?.key || "");
            if (!key) return;
            _emit(key, event?.newValue ?? null, event?.oldValue ?? null);
        };
        window.addEventListener("storage", _storageListener);
        _storageListenerBound = true;
    } catch (e) {
        console.debug?.(e);
    }
}

export const SettingsStore = {
    get(key: any) {
        const storage = _getStorage();
        if (!storage) return null;
        try {
            return storage.getItem(String(key || ""));
        } catch {
            return null;
        }
    },

    set(key: any, value: any) {
        const k = String(key || "");
        if (!k) return false;
        const storage = _getStorage();
        if (!storage) return false;
        const previousValue = SettingsStore.get(k);
        try {
            if (value == null) {
                storage.removeItem(k);
                _emit(k, null, previousValue);
                return true;
            }
            const nextValue = String(value);
            storage.setItem(k, nextValue);
            _emit(k, nextValue, previousValue);
            return true;
        } catch {
            return false;
        }
    },

    subscribe(key: any, cb: any) {
        const k = String(key || "");
        if (!k || typeof cb !== "function") return () => {};
        _bindStorageListener();
        let set = _subscribers.get(k);
        if (!set) {
            set = new Set();
            _subscribers.set(k, set);
        }
        set.add(cb);
        return () => {
            try {
                const cur = _subscribers.get(k);
                cur?.delete(cb);
                if (cur && !cur.size) _subscribers.delete(k);
            } catch (e) {
                console.debug?.(e);
            }
        };
    },

    getAll() {
        const out: Record<string, any> = {};
        const storage = _getStorage();
        if (!storage) return out;
        try {
            const len = Number(storage.length || 0) || 0;
            for (let i = 0; i < len; i += 1) {
                const key = storage.key(i);
                if (!key) continue;
                out[key] = storage.getItem(key);
            }
        } catch (e) {
            console.debug?.(e);
        }
        return out;
    },

    dispose() {
        try {
            if (_storageListenerBound && _storageListener && typeof window !== "undefined") {
                window.removeEventListener("storage", _storageListener);
            }
        } catch (e) {
            console.debug?.(e);
        }
        _storageListenerBound = false;
        _storageListener = null;
        _subscribers.clear();
    },
};
