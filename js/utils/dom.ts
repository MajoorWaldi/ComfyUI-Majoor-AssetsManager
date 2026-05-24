/**
 * DOM helpers
 */

/**
 * Safely call Element.closest on a potentially non-Element target.
 * Returns null if target is not suitable or any error occurs.
 */
export function safeClosest(target: unknown, selector: string): Element | null {
    if (!selector) return null;
    try {
        if (!target) return null;
        if (target instanceof Element && typeof target.closest === "function") {
            return target.closest(selector);
        }
        // Text nodes or other non-Element targets
        const parent = (target as { parentElement?: Element | null })?.parentElement;
        if (parent && typeof parent.closest === "function") {
            return parent.closest(selector);
        }
    } catch (e) {
        console.debug?.(e);
    }
    return null;
}

/**
 * Safely escape a string for use inside CSS selectors.
 * Falls back to conservative character escaping when CSS.escape is unavailable.
 */
export function safeEscapeSelector(value: unknown): string {
    const str = String(value ?? "");
    try {
        if (typeof CSS?.escape === "function") return CSS.escape(str);
    } catch (e) {
        console.debug?.(e);
    }
    return str.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
}

/**
 * Clipboard helper with safe fallback behavior.
 * Returns true on success, false otherwise.
 */
export async function copyTextToClipboard(text: unknown): Promise<boolean> {
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
 */
export function createMediaErrorPlaceholder(iconClass = "pi pi-image"): HTMLDivElement {
    const err = document.createElement("div");
    err.className = "mjr-thumb-error";
    const icon = document.createElement("i");
    icon.className = String(iconClass || "pi pi-image");
    icon.style.fontSize = "24px";
    icon.style.opacity = "0.5";
    err.appendChild(icon);
    err.style.cssText =
        "display:flex; align-items:center; justify-content:center; width:100%; height:100%; background:rgba(255,50,50,0.1);";
    return err;
}
