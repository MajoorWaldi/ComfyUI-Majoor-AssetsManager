/**
 * Event helpers.
 *
 * Keep event dispatch best-effort (never throw) but avoid fully silent failures.
 */

export function safeDispatchCustomEvent(eventName, detail, { target = null, warnPrefix = "[Majoor]" } = {}) {
    const t = target || (typeof window !== "undefined" ? window : null);
    if (!t || typeof t.dispatchEvent !== "function") return false;
    try {
        return t.dispatchEvent(new CustomEvent(eventName, { detail }));
    } catch (e) {
        try {
            console.warn(`${warnPrefix} Failed to dispatch event: ${eventName}`, e);
        } catch (e) { console.debug?.(e); }
        return false;
    }
}

