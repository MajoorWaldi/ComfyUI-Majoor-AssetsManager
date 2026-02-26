/**
 * DOM helpers
 */

/**
 * Safely call Element.closest on a potentially non-Element target.
 * Returns null if target is not suitable or any error occurs.
 * @param {any} target
 * @param {string} selector
 * @returns {Element|null}
 */
export function safeClosest(target, selector) {
    if (!selector) return null;
    try {
        if (!target) return null;
        if (target instanceof Element && typeof target.closest === "function") {
            return target.closest(selector);
        }
        // Text nodes or other non-Element targets
        const parent = target?.parentElement;
        if (parent && typeof parent.closest === "function") {
            return parent.closest(selector);
        }
    } catch {}
    return null;
}

/**
 * Clipboard helper with safe fallback behavior.
 * Returns true on success, false otherwise.
 */
export async function copyTextToClipboard(text) {
    try {
        if (!navigator?.clipboard?.writeText) return false;
        await navigator.clipboard.writeText(String(text ?? ""));
        return true;
    } catch {
        return false;
    }
}

/**
 * Build a reusable media error placeholder node.
 * @param {string} iconClass
 * @returns {HTMLDivElement}
 */
export function createMediaErrorPlaceholder(iconClass = "pi pi-image") {
    const err = document.createElement("div");
    err.className = "mjr-thumb-error";
    const icon = document.createElement("i");
    icon.className = String(iconClass || "pi pi-image");
    icon.style.fontSize = "24px";
    icon.style.opacity = "0.5";
    err.appendChild(icon);
    err.style.cssText = "display:flex; align-items:center; justify-content:center; width:100%; height:100%; background:rgba(255,50,50,0.1);";
    return err;
}
