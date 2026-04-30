/**
 * ComfyUI-native-ish dialogs for extensions.
 *
 * Uses ComfyDialog if available from the injected Comfy app UI to avoid browser
 * alert/confirm/prompt popups. Falls back to window.* when unavailable.
 */

import { getComfyApp, getExtensionDialogApi } from "./comfyApiBridge.js";

export const getComfyUi = () => {
    try {
        const app = getComfyApp();
        return app?.ui || null;
    } catch {
        return null;
    }
};

export const getExtensionManagerDialog = () => {
    try {
        const app = getComfyApp();
        const dlg = getExtensionDialogApi(app);
        if (dlg && typeof dlg.confirm === "function" && typeof dlg.prompt === "function") {
            return dlg;
        }
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const app = typeof window !== "undefined" ? window?.app : null;
        const dlg = app?.extensionManager?.dialog || null;
        if (dlg && typeof dlg.confirm === "function" && typeof dlg.prompt === "function") {
            return dlg;
        }
    } catch (e) {
        console.debug?.(e);
    }
    return null;
};

export const getNativeDialog = () => {
    try {
        const ui = getComfyUi();
        if (ui?.dialog && typeof ui.dialog.show === "function") {
            return ui.dialog;
        }
    } catch (e) {
        console.debug?.(e);
    }
    return null;
};

export const toNativeDialogMessage = (message, title = "Majoor") => {
    const msg = String(message ?? "");
    const ttl = String(title ?? "").trim();
    if (!ttl || ttl.toLowerCase() === "majoor") {
        return msg;
    }
    return `${ttl}<br><br>${msg}`;
};

// Allowlist of DOM event names accepted by fallbackEl's "on*" prop handler.
// Restricting to known events prevents attaching listeners to arbitrary strings
// (e.g. "onXXXX") that would silently produce no-op event registrations and
// could cause confusion when debugging or scanning for handler leaks.
const ALLOWED_EVENT_NAMES = new Set([
    "abort",
    "blur",
    "change",
    "click",
    "close",
    "contextmenu",
    "dblclick",
    "dragend",
    "dragenter",
    "dragleave",
    "dragover",
    "dragstart",
    "drop",
    "error",
    "focus",
    "input",
    "keydown",
    "keypress",
    "keyup",
    "load",
    "mousedown",
    "mouseenter",
    "mouseleave",
    "mousemove",
    "mouseout",
    "mouseover",
    "mouseup",
    "reset",
    "resize",
    "scroll",
    "select",
    "submit",
    "touchcancel",
    "touchend",
    "touchmove",
    "touchstart",
    "transitionend",
    "unload",
    "wheel",
]);

const BLOCKED_PROP_KEYS = new Set([
    "__proto__",
    "constructor",
    "prototype",
    "innerHTML",
    "outerHTML",
    "srcdoc",
    "__defineGetter__",
    "__defineSetter__",
    "__lookupGetter__",
    "__lookupSetter__",
]);
const ALLOWED_DIRECT_PROPS = new Set([
    "id",
    "name",
    "value",
    "type",
    "checked",
    "disabled",
    "placeholder",
    "title",
    "textContent",
    "htmlFor",
    "role",
    "tabIndex",
]);

const fallbackEl = (tag, props = {}, children = []) => {
    const el = document.createElement(tag);
    Object.entries(props || {}).forEach(([key, value]) => {
        const propKey = String(key || "");
        if (!propKey || BLOCKED_PROP_KEYS.has(propKey)) return;
        if (key === "style" && value && typeof value === "object") {
            Object.assign(el.style, value);
            return;
        }
        if (key === "className") {
            el.className = String(value);
            return;
        }
        if (propKey.startsWith("on")) {
            if (typeof value === "function") {
                const eventName = propKey.slice(2).toLowerCase();
                if (ALLOWED_EVENT_NAMES.has(eventName)) {
                    el.addEventListener(eventName, value);
                }
            }
            return;
        }
        if (ALLOWED_DIRECT_PROPS.has(propKey)) {
            try {
                el[propKey] = value;
                return;
            } catch (e) {
                console.debug?.(e);
            }
        }
        try {
            el.setAttribute(propKey, String(value));
        } catch (e) {
            console.debug?.(e);
        }
    });
    const childList = Array.isArray(children) ? children : [children];
    childList.filter(Boolean).forEach((c) => {
        try {
            el.appendChild(c);
        } catch {
            el.appendChild(document.createTextNode(String(c)));
        }
    });
    return el;
};

export const $el = (tag, props, children) => {
    const ui = getComfyUi();
    if (ui?.$el) {
        try {
            return ui.$el(tag, props, children);
        } catch {
            // fall through
        }
    }
    return fallbackEl(tag, props, children);
};

export const getComfyDialogCtor = () => {
    const ui = getComfyUi();
    return ui?.ComfyDialog || null;
};

const DIALOG_Z_INDEX = 999_999;
const DIALOG_WIDTH_PX = 560;
const DIALOG_RADIUS_PX = 12;

export const styleDialog = (dialog) => {
    try {
        // Ensure dialogs are above extension panels/popovers.
        dialog.element.style.zIndex = String(DIALOG_Z_INDEX);
        dialog.element.style.width = `${DIALOG_WIDTH_PX}px`;
        dialog.element.style.padding = "0";
        dialog.element.style.backgroundColor = "var(--comfy-menu-bg, #131722)";
        dialog.element.style.border = "1px solid rgba(255,255,255,0.14)";
        dialog.element.style.borderRadius = `${DIALOG_RADIUS_PX}px`;
        dialog.element.style.boxSizing = "border-box";
        dialog.element.style.overflow = "hidden";
        dialog.element.style.boxShadow = "0 18px 48px rgba(0,0,0,0.48)";
    } catch (e) {
        console.debug?.(e);
    }
};

export const hideDialogNativeClose = (dialog) => {
    try {
        const root = dialog?.element;
        if (!root) return;
        const maybeClose = root.querySelectorAll("button,[role='button']");
        for (const el of maybeClose) {
            const text = String(el?.textContent || "")
                .trim()
                .toLowerCase();
            const aria = String(el?.getAttribute?.("aria-label") || "")
                .trim()
                .toLowerCase();
            if (text === "close" || aria === "close") {
                try {
                    el.style.display = "none";
                } catch (e) {
                    console.debug?.(e);
                }
            }
        }
    } catch (e) {
        console.debug?.(e);
    }
};

// Template factories live in DialogTemplates.js.
// Re-exported here for backward compatibility â€” all consumers can keep
// importing from "./dialogs.js" without changes.
export {
    comfyAlert,
    comfyConfirm,
    comfyYesNoCancel,
    comfyChoice,
    comfyPrompt,
} from "./DialogTemplates.js";

/* Template implementations moved to DialogTemplates.js. */
