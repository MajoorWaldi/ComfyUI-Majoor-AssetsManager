/** Toast history ring buffer — stores recent toasts for the History tab. */

import { createUniqueId } from "../../../utils/ids.js";

const STORAGE_KEY = "mjr_toast_history_v1";
const STORAGE_LAST_READ_KEY = "mjr_toast_history_last_read_v1";
const MAX_HISTORY = 60;

export const TOAST_HISTORY_EVENT = "mjr:toast-history-changed";

let _history = null; // lazy-loaded

function _normalizeText(value) {
    return String(value || "").trim();
}

function _normalizeType(value) {
    const raw = _normalizeText(value).toLowerCase();
    if (raw === "warn") return "warning";
    if (raw === "danger") return "error";
    return raw || "info";
}

function _normalizeDuration(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function _normalizeProgress(value) {
    if (!value || typeof value !== "object") return null;
    const percentRaw = Number(value.percent);
    const percent = Number.isFinite(percentRaw)
        ? Math.max(0, Math.min(100, Math.round(percentRaw)))
        : null;
    const currentRaw = Number(value.current);
    const totalRaw = Number(value.total);
    const current = Number.isFinite(currentRaw) ? Math.max(0, Math.floor(currentRaw)) : null;
    const total = Number.isFinite(totalRaw) ? Math.max(0, Math.floor(totalRaw)) : null;
    const indexedRaw = Number(value.indexed);
    const skippedRaw = Number(value.skipped);
    const errorsRaw = Number(value.errors);
    const indexed = Number.isFinite(indexedRaw) ? Math.max(0, Math.floor(indexedRaw)) : null;
    const skipped = Number.isFinite(skippedRaw) ? Math.max(0, Math.floor(skippedRaw)) : null;
    const errors = Number.isFinite(errorsRaw) ? Math.max(0, Math.floor(errorsRaw)) : null;
    const label = _normalizeText(value.label);
    if (
        percent === null &&
        current === null &&
        total === null &&
        indexed === null &&
        skipped === null &&
        errors === null &&
        !label
    ) {
        return null;
    }
    return {
        percent,
        current,
        total,
        indexed,
        skipped,
        errors,
        label,
    };
}

function _buildMessageFromParts(title, detail, fallback) {
    if (title && detail) return `${title}: ${detail}`;
    return detail || title || fallback || "";
}

function _normalizeEntry(input, fallbackType = "info", fallbackDuration = null) {
    if (!input || typeof input !== "object") return null;
    const title = _normalizeText(input.title || input.summary);
    const detail = _normalizeText(input.detail);
    const message = _normalizeText(
        input.message || _buildMessageFromParts(title, detail, _normalizeText(input.fallbackMessage)),
    );
    if (!message) return null;

    const durationMs = _normalizeDuration(input.durationMs ?? input.duration ?? fallbackDuration);
    const createdAtRaw = Number(input.createdAt);
    const createdAt = Number.isFinite(createdAtRaw) && createdAtRaw > 0 ? createdAtRaw : Date.now();
    const persistent =
        typeof input.persistent === "boolean"
            ? input.persistent
            : !(Number.isFinite(durationMs) && durationMs > 0);

    return {
        id:
            _normalizeText(input.id) ||
            createUniqueId(`th-${createdAt}-`, 4),
        message,
        title,
        detail,
        type: _normalizeType(input.type || fallbackType),
        createdAt,
        durationMs,
        persistent,
        source: _normalizeText(input.source),
        trackId: _normalizeText(input.trackId),
        status: _normalizeText(input.status),
        operation: _normalizeText(input.operation),
        progress: _normalizeProgress(input.progress),
        forceStore: !!input.forceStore,
        actionLabel: _normalizeText(input.actionLabel),
        actionUrl: _normalizeText(input.actionUrl),
    };
}

function _load() {
    if (_history !== null) return;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        _history = Array.isArray(parsed)
            ? parsed
                  .map((entry) => {
                      if (entry && typeof entry === "object") return _normalizeEntry(entry);
                      const message = _normalizeText(entry);
                      return message ? _normalizeEntry({ message }) : null;
                  })
                  .filter(Boolean)
            : [];
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
    } catch {
        /* ignore */
    }
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
    } catch {
        /* ignore */
    }
}

/**
 * Add a toast to the history ring buffer.
 * @param {string|object} message - The (already-translated) message text or structured history data.
 * @param {string} type    - "info" | "success" | "warning" | "error"
 * @param {number} [duration] - Display duration in ms; used to filter ephemeral info toasts.
 */
export function addToastHistory(message, type, duration) {
    _load();
    const entry =
        message && typeof message === "object"
            ? _normalizeEntry(message, type, duration)
            : _normalizeEntry(
                  {
                      message: _normalizeText(message),
                      type,
                      durationMs: duration,
                  },
                  type,
                  duration,
              );
    if (!entry) return;

    // Skip ephemeral info-only toasts (short-lived operational feedback).
    // Persistent info toasts are kept because they usually carry actionable context.
    if (
        !entry.forceStore &&
        !entry.trackId &&
        entry.type === "info" &&
        Number.isFinite(entry.durationMs) &&
        entry.durationMs > 0 &&
        entry.durationMs < 2500
    ) {
        return;
    }

    const trackId = String(entry.trackId || "").trim();
    if (trackId) {
        const existingIndex = _history.findIndex(
            (item) => String(item?.trackId || "").trim() === trackId,
        );
        if (existingIndex >= 0) {
            const existing = _history[existingIndex] || {};
            _history.splice(existingIndex, 1);
            entry.id = String(existing.id || entry.id || "").trim() || entry.id;
        }
    }

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
