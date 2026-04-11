import { APP_CONFIG } from "../app/config.js";
import { comfyToast } from "../app/toast.js";

/**
 * Structured debug logger — respects the DEBUG_VERBOSE_ERRORS flag.
 * Replaces scattered bare console.debug(label, ...) calls so log output
 * can be controlled centrally and is silenced in production by default.
 *
 * Usage: mjrDbg("[Module]", "message", optionalExtra)
 */
export function mjrDbg(tag, ...args) {
    try {
        if (APP_CONFIG.DEBUG_VERBOSE_ERRORS) {
            console.debug(tag, ...args);
        }
    } catch {
        // never throw from a logging helper
    }
}

export function reportError(
    err,
    context = "Majoor",
    { showToast = false, toastType = "error" } = {},
) {
    const message = err?.message || String(err || "Unknown error");
    try {
        if (APP_CONFIG.DEBUG_VERBOSE_ERRORS) {
            console.error(`[Majoor][${context}]`, message, err);
        } else {
            console.debug(`[Majoor][${context}]`, message);
        }
    } catch (e) {
        console.debug?.(e);
    }
    if (showToast && APP_CONFIG.DEBUG_VERBOSE_ERRORS) {
        try {
            comfyToast(`${context}: ${message}`, toastType, 4000);
        } catch (e) {
            console.debug?.(e);
        }
    }
}
