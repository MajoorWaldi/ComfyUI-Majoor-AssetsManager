/**
 * Toast Element - Majoor Assets Manager
 * 
 * Provides transient notification messages (Toasts) that mimic ComfyUI native style.
 * Supports: success, error, warning, info.
 */
import { app } from "../../../scripts/app.js";

const TOAST_CONTAINER_ID = "mjr-toast-container";

/**
 * Ensures the toast container exists in the DOM.
 */
function getToastContainer() {
    let container = document.getElementById(TOAST_CONTAINER_ID);
    if (!container) {
        container = document.createElement("div");
        container.id = TOAST_CONTAINER_ID;
        // Position: Top-Center for ComfyUI v1 style, or Bottom-Center for classic
        // We'll stick to top-center to be more visible like prompts
        Object.assign(container.style, {
            position: "fixed",
            top: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            zIndex: "1000001", // Above most dialogs
            pointerEvents: "none", // Allow clicks to pass through container
        });
        document.body.appendChild(container);
    }
    return container;
}

/**
 * Shows a toast notification.
 * @param {string} message The message to display
 * @param {'info'|'success'|'warning'|'error'} type The type of message
 * @param {number} duration Duration in ms (default 3000)
 */
export function comfyToast(message, type = "info", duration = 3000) {
    // 1. Try ComfyUI extensionManager toast (ComfyUI v1.3+ standard)
    // See: ComfyUI-Majoor-NodeFlow reference implementation
    try {
        const t = app?.extensionManager?.toast;
        if (t && typeof t.add === "function") {
            let severity = type;
            if (severity === "warning") severity = "warn"; // Map warning -> warn
            
            // Allow passing an object { summary, detail } as message
            let summary = "Majoor Assets";
            let detail = message;
            
            if (typeof message === "object" && message?.summary) {
                summary = message.summary;
                detail = message.detail || "";
            } else if (typeof message !== "string") {
                 try { detail = message.message || String(message); } catch {}
            }

            t.add({ 
                severity, 
                summary, 
                detail, 
                life: duration 
            });
            return;
        }
    } catch(e) {
        console.debug("Majoor: extensionManager.toast failed", e);
    }

    // 2. Try generic ComfyUI app.ui.toast (Older or alternative implementations)
    if (app?.ui?.toast) {
         try {
             return app.ui.toast(message, type);
         } catch(e) { console.debug("Native app.ui.toast failed, falling back", e); }
    }

    const container = getToastContainer();
    
    // Fallback if message is an object/error
    if (typeof message !== "string") {
        try {
            message = message.message || String(message);
        } catch {
            message = "Unknown message";
        }
    }

    const el = document.createElement("div");
    
    // Theme colors matching js/app/dialogs.js and ComfyUI variables
    // Mimic ComfyDialog style
    
    const bg = "var(--comfy-menu-bg, #2a2a2a)";
    const border = "var(--border-color, #3a3a3a)";
    let icon = "";
    let stripColor = "transparent";
    
    switch (type) {
        case "success":
            stripColor = "#4caf50";
            icon = ""; 
            break;
        case "error":
            stripColor = "#f44336";
            icon = "";
            duration = duration < 4000 ? 5000 : duration;
            break;
        case "warning":
            stripColor = "#ff9800";
            icon = "";
            break;
        case "info":
        default:
            stripColor = "#2196f3";
            icon = "";
            break;
    }

    Object.assign(el.style, {
        background: bg,
        border: `1px solid ${border}`,
        borderLeft: `4px solid ${stripColor}`,
        borderRadius: "4px", // ComfyUI style is often slightly more squared or 10px? Dialog is 10px.
        padding: "12px 16px",
        color: "var(--fg-color, #efefef)",
        fontFamily: "var(--font-sans, sans-serif)",
        fontSize: "14px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
        opacity: "0",
        transform: "translateY(-15px)",
        transition: "all 0.2s ease-out",
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        whiteSpace: "pre-wrap",
        minWidth: "250px",
        maxWidth: "400px",
        backdropFilter: "blur(4px)",
        cursor: "default",
        userSelect: "none",
    });

    const textSpan = document.createElement("span");
    textSpan.textContent = (icon ? icon + " " : "") + message;
    textSpan.style.flex = "1";
    
    el.appendChild(textSpan);
    
    // Click to dismiss
    el.onclick = () => removeToast(el);

    container.appendChild(el);

    // Animate In
    requestAnimationFrame(() => {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
    });

    // Auto Remove
    const timer = setTimeout(() => {
        removeToast(el);
    }, duration);

    // Helpers
    function removeToast(element) {
        if (!element.parentNode) return;
        element.style.opacity = "0";
        element.style.transform = "translateY(-10px)";
        element.onclick = null;
        clearTimeout(timer);
        setTimeout(() => {
            if (element.parentNode) element.parentNode.removeChild(element);
        }, 300);
    }
}
