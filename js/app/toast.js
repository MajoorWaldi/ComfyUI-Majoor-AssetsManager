/**
 * Toast Element - Majoor Assets Manager
 * 
 * Provides transient notification messages (Toasts) that mimic ComfyUI native style.
 * Supports: success, error, warning, info.
 */
import { getComfyApp } from "./comfyApiBridge.js";
import { t } from "./i18n.js";

const TOAST_CONTAINER_ID = "mjr-toast-container";
// Group name used for error toasts in PrimeVue-based ComfyUI toast (enables removeGroup on success).
const MJR_ERROR_TOAST_GROUP = "mjr-errors";
// Tracks dismiss functions for active fallback DOM error toasts.
const _fallbackErrorToastDismissers = new Set();

function _dismissAllFallbackErrorToasts() {
    const toRemove = Array.from(_fallbackErrorToastDismissers);
    _fallbackErrorToastDismissers.clear();
    for (const fn of toRemove) {
        try { fn(); } catch (e) { console.debug?.(e); }
    }
}

function translateToastMessage(message) {
    if (typeof message !== "string") return message;
    const msg = message.trim();
    const directMap = {
        "Failed to update rating": t("toast.ratingUpdateFailed", "Failed to update rating"),
        "Error updating rating": t("toast.ratingUpdateError", "Error updating rating"),
        "Rating cleared": t("toast.ratingCleared", "Rating cleared"),
        "Failed to update tags": t("toast.tagsUpdateFailed", "Failed to update tags"),
        "Tags updated": t("toast.tagsUpdated", "Tags updated"),
        "Failed to toggle watcher": t("toast.watcherToggleFailed", "Failed to toggle watcher"),
        "No valid assets selected.": t("toast.noValidAssetsSelected", "No valid assets selected."),
        "Failed to create collection.": t("toast.failedCreateCollectionDot", "Failed to create collection."),
        "Failed to add assets to collection.": t("toast.failedAddAssetsToCollection", "Failed to add assets to collection."),
        "File renamed successfully!": t("toast.fileRenamedSuccess", "File renamed successfully!"),
        "Failed to rename file": t("toast.fileRenameFailed", "Failed to rename file"),
        "Failed to rename file.": t("toast.fileRenameFailed", "Failed to rename file."),
        "File deleted successfully!": t("toast.fileDeletedSuccess", "File deleted successfully!"),
        "Failed to delete file.": t("toast.fileDeleteFailed", "Failed to delete file."),
        "Failed to delete file. ": t("toast.fileDeleteFailed", "Failed to delete file."),
        "Failed to remove from collection.": t("toast.removeFromCollectionFailed", "Failed to remove from collection."),
        "Opened in folder": t("toast.openedInFolder", "Opened in folder"),
        "Failed to open folder": t("toast.openFolderFailed", "Failed to open folder"),
        "Failed to open folder.": t("toast.openFolderFailed", "Failed to open folder."),
        "File path copied to clipboard": t("toast.pathCopied", "File path copied to clipboard"),
        "Failed to copy path": t("toast.pathCopyFailed", "Failed to copy path"),
        "Failed to copy to clipboard": t("toast.copyClipboardFailed", "Failed to copy to clipboard"),
        "No file path available for this asset.": t("toast.noFilePath", "No file path available for this asset."),
        "Failed to refresh metadata.": t("toast.metadataRefreshFailed", "Failed to refresh metadata."),
        "Duplicate analysis started": t("toast.dupAnalysisStarted", "Duplicate analysis started"),
        "Tags merged": t("toast.tagsMerged", "Tags merged"),
        "Duplicates deleted": t("toast.duplicatesDeleted", "Duplicates deleted"),
        "Playback speed is available for video media only": t("toast.playbackVideoOnly", "Playback speed is available for video media only"),
        "Rescanning file…": t("toast.rescanningFile", "Rescanning file…"),
    };
    if (directMap[msg]) return directMap[msg];

    let m = msg.match(/^Rating set to (\d+) stars?$/i);
    if (m) return t("toast.ratingSetN", { n: Number(m[1]) });

    m = msg.match(/^Downloading (.+)\.\.\.$/i);
    if (m) return t("toast.downloadingFile", { filename: m[1] });

    m = msg.match(/^Playback ([0-9]+(?:\.[0-9]+)?)x$/i);
    if (m) return t("toast.playbackRate", { rate: Number(m[1]).toFixed(2) });

    m = msg.match(/^Metadata refreshed(.*)$/i);
    if (m) return t("toast.metadataRefreshed", { suffix: m[1] || "" });

    m = msg.match(/^Error renaming(?: file)?:\s*(.+)$/i);
    if (m) return t("toast.errorRenaming", { error: m[1] });

    m = msg.match(/^Error deleting(?: files?| file)?:\s*(.+)$/i);
    if (m) return t("toast.errorDeleting", { error: m[1] });

    m = msg.match(/^Tag merge failed:\s*(.+)$/i);
    if (m) return t("toast.tagMergeFailed", { error: m[1] });

    m = msg.match(/^Delete failed:\s*(.+)$/i);
    if (m) return t("toast.deleteFailed", { error: m[1] });

    m = msg.match(/^Analysis not started:\s*(.+)$/i);
    if (m) return t("toast.analysisNotStarted", { error: m[1] });

    m = msg.match(/^(\d+)\s+files deleted successfully!$/i);
    if (m) return t("toast.filesDeletedSuccessN", { n: Number(m[1]) });

    m = msg.match(/^(\d+)\s+files deleted,\s+(\d+)\s+failed\.$/i);
    if (m) return t("toast.filesDeletedPartial", { success: Number(m[1]), failed: Number(m[2]) });

    m = msg.match(/^(\d+)\s+files?\s+deleted$/i);
    if (m) return t("toast.filesDeletedShort", { n: Number(m[1]) });

    m = msg.match(/^(\d+)\s+deleted,\s+(\d+)\s+failed$/i);
    if (m) return t("toast.filesDeletedShortPartial", { success: Number(m[1]), failed: Number(m[2]) });

    m = msg.match(/^(.+)\s+copied to clipboard!$/i);
    if (m) return t("toast.copiedToClipboardNamed", { name: m[1] });

    return msg;
}

/**
 * Ensures the toast container exists in the DOM.
 */
function getToastContainer() {
    let container = document.getElementById(TOAST_CONTAINER_ID);
    if (!container) {
        container = document.createElement("div");
        container.id = TOAST_CONTAINER_ID;
        container.className = "mjr-toast-container";
        document.body.appendChild(container);
    }
    return container;
}

/**
 * Shows a toast notification.
 * @param {string} message The message to display
 * @param {'info'|'success'|'warning'|'error'} type The type of message
 * @param {number} duration Duration in ms (default 5000)
 */
export function comfyToast(message, type = "info", duration = 5000) {
    message = translateToastMessage(message);
    // Errors always require manual dismissal regardless of the duration argument.
    const persistent = type === "error" || !(Number.isFinite(Number(duration)) && Number(duration) > 0);
    const app = getComfyApp();

    // On success: dismiss any open error toasts (fallback DOM path).
    if (type === "success") {
        _dismissAllFallbackErrorToasts();
    }

    // 1. Try ComfyUI extensionManager toast (ComfyUI v1.3+ standard)
    // See: ComfyUI-Majoor-NodeFlow reference implementation
    try {
        const toastApi = app?.extensionManager?.toast;
        if (toastApi && typeof toastApi.add === "function") {
            let severity = type;
            if (severity === "warning") severity = "warn"; // Map warning -> warn

            // On success: remove grouped error toasts (PrimeVue removeGroup).
            if (type === "success") {
                try { toastApi.removeGroup?.(MJR_ERROR_TOAST_GROUP); } catch (e) { console.debug?.(e); }
            }

            // Allow passing an object { summary, detail } as message
            let summary = t("manager.title");
            let detail = message;

            if (typeof message === "object" && message?.summary) {
                summary = message.summary;
                detail = message.detail || "";
            } else if (typeof message !== "string") {
                 try { detail = message.message || String(message); } catch (e) { console.debug?.(e); }
            }

            const payload = { severity, summary, detail };
            if (!persistent) payload.life = duration;
            // Group error toasts so they can be mass-removed when a success arrives.
            if (type === "error") payload.group = MJR_ERROR_TOAST_GROUP;
            toastApi.add(payload);
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
    let icon = "";

    switch (type) {
        case "success":
            icon = ""; 
            break;
        case "error":
            icon = "";
            // duration boost removed: error toasts are persistent (no auto-dismiss)
            break;
        case "warning":
            icon = "";
            break;
        case "info":
        default:
            icon = "";
            break;
    }

    el.className = `mjr-toast mjr-toast-${type}`;
    el.setAttribute("role", type === "error" || type === "warning" ? "alert" : "status");
    el.setAttribute("aria-live", type === "error" || type === "warning" ? "assertive" : "polite");
    el.setAttribute("aria-atomic", "true");

    const textSpan = document.createElement("span");
    textSpan.className = "mjr-toast-text";
    textSpan.textContent = (icon ? icon + " " : "") + message;

    el.appendChild(textSpan);

    // Auto Remove
    const timer = persistent ? null : setTimeout(() => {
        removeToast(el);
    }, duration);

    // Helpers
    function removeToast(element) {
        if (!element.parentNode) return;
        element.classList.remove("is-visible");
        element.onclick = null;
        _fallbackErrorToastDismissers.delete(dismissThis);
        if (timer) clearTimeout(timer);
        setTimeout(() => {
            if (element.parentNode) element.parentNode.removeChild(element);
        }, 300);
    }

    const dismissThis = () => removeToast(el);

    // Click to dismiss
    el.onclick = dismissThis;

    // Track error toasts for success-triggered auto-dismissal.
    if (type === "error") {
        _fallbackErrorToastDismissers.add(dismissThis);
    }

    container.appendChild(el);

    // Animate In
    requestAnimationFrame(() => {
        el.classList.add("is-visible");
    });
}
