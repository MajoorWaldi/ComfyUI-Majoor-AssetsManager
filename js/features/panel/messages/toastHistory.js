/** Toast history ring buffer — stores recent toasts for the History tab. */

const STORAGE_KEY = "mjr_toast_history_v1";
const STORAGE_LAST_READ_KEY = "mjr_toast_history_last_read_v1";
const MAX_HISTORY = 60;

export const TOAST_HISTORY_EVENT = "mjr:toast-history-changed";

let _history = null; // lazy-loaded

function _load() {
    if (_history !== null) return;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        _history = Array.isArray(parsed) ? parsed : [];
    } catch {
        _history = [];
    }
}

function _save() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(_history));
    } catch {
        // ignore quota / privacy errors
    }
}

function _emit() {
    try {
        window.dispatchEvent(new CustomEvent(TOAST_HISTORY_EVENT));
    } catch { /* ignore */ }
}

function _readLastRead() {
    try {
        return Number(localStorage.getItem(STORAGE_LAST_READ_KEY)) || 0;
    } catch {
        return 0;
    }
}

function _writeLastRead(ts) {
    try {
        localStorage.setItem(STORAGE_LAST_READ_KEY, String(Number(ts) || 0));
    } catch { /* ignore */ }
}

/**
 * Add a toast to the history ring buffer.
 * @param {string} message - The (already-translated) message text.
 * @param {string} type    - "info" | "success" | "warning" | "error"
 * @param {number} [duration] - Display duration in ms; used to filter ephemeral info toasts.
 */
export function addToastHistory(message, type, duration) {
    _load();
    const msg = String(message || "").trim();
    if (!msg) return;
    const t = String(type || "info").trim().toLowerCase();
    // Skip ephemeral info-only toasts (short-lived operational feedback).
    // Errors, warnings and successes are always stored.
    const dur = Number.isFinite(Number(duration)) ? Number(duration) : 99999;
    if (t === "info" && dur < 2500) return;

    const entry = {
        id: `th-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        message: msg,
        type: t,
        createdAt: Date.now(),
    };
    _history.unshift(entry); // newest first
    if (_history.length > MAX_HISTORY) _history = _history.slice(0, MAX_HISTORY);
    _save();
    _emit();
}

/** Return a shallow copy of the history array (newest first). */
export function listToastHistory() {
    _load();
    return _history.map((e) => ({ ...e }));
}

/** Number of entries created after the last read timestamp. */
export function getToastHistoryUnreadCount() {
    _load();
    const lastRead = _readLastRead();
    return _history.filter((e) => e.createdAt > lastRead).length;
}

/** Update the last-read timestamp to now, suppressing the unread indicator. */
export function markToastHistoryRead() {
    _writeLastRead(Date.now());
    _emit();
}

/** Clear all history and reset the last-read marker. */
export function clearToastHistory() {
    _load();
    _history = [];
    _save();
    _writeLastRead(Date.now());
    _emit();
}
