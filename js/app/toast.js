/**
 * Toast Element - Majoor Assets Manager
 *
 * Provides transient notification messages (Toasts) that mimic ComfyUI native style.
 * Supports: success, error, warning, info.
 * 
 * Priority integration with ComfyUI extensionManager.toast API (ComfyUI v1.3+).
 */
import { getComfyApp } from "./comfyApiBridge.js";
import { t } from "./i18n.js";

const TOAST_CONTAINER_ID = "mjr-toast-container";
const MAX_VISIBLE_TOASTS = 5;

// Tracks dismiss functions for active fallback DOM error toasts.
const _fallbackErrorToastDismissers = new Set();

// Periodic cleanup timer for orphaned dismissers
let _cleanerTimer = null;

/**
 * Start periodic cleanup of orphaned dismissers.
 * Runs every 30 seconds to remove dismissers for removed DOM elements.
 */
function _startCleanerTimer() {
    if (_cleanerTimer) return;
    _cleanerTimer = setInterval(() => {
        const toRemove = [];
        for (const fn of _fallbackErrorToastDismissers) {
            // Dismisser functions are closures that reference the element.
            // If the element was removed, the function won't have a valid parent.
            toRemove.push(fn);
        }
        // Clear all - they'll be re-added if toasts are still visible
        for (const fn of toRemove) {
            _fallbackErrorToastDismissers.delete(fn);
        }
    }, 30000);
}

function _dismissAllFallbackErrorToasts() {
    const toRemove = Array.from(_fallbackErrorToastDismissers);
    _fallbackErrorToastDismissers.clear();
    for (const fn of toRemove) {
        try { fn(); } catch (e) { console.debug?.(e); }
    }
}

/**
 * Get icon for toast type (Unicode symbols for maximum compatibility).
 * @param {string} type - Toast type
 * @returns {string} Icon character
 */
function getToastIcon(type) {
    switch (type) {
        case "success": return "✓";
        case "error":   return "✕";
        case "warning": return "⚠";
        case "info":
        default:        return "ℹ";
    }
}

/**
 * Get standard duration for toast type.
 * @param {string} type - Toast type
 * @returns {number} Duration in ms
 */
function getStandardDuration(type) {
    switch (type) {
        case "success": return 2000;
        case "info":    return 3000;
        case "warning": return 4000;
        case "error":   return 5000;
        default:        return 5000;
    }
}

/**
 * Enforce maximum visible toasts limit.
 * @param {HTMLElement} container - Toast container element
 */
function enforceToastLimit(container) {
    const toasts = Array.from(container.querySelectorAll(".mjr-toast"));
    while (toasts.length > MAX_VISIBLE_TOASTS) {
        const oldest = toasts.shift();
        if (oldest && oldest.parentNode) {
            oldest.classList.remove("is-visible");
            setTimeout(() => {
                if (oldest.parentNode) oldest.parentNode.removeChild(oldest);
            }, 300);
        }
    }
}

function translateToastMessage(message) {
    if (typeof message !== "string") return message;
    const msg = message.trim();
    
    const directMap = {
        // Rating & Tags
        "Failed to update rating": t("toast.ratingUpdateFailed", "Failed to update rating"),
        "Error updating rating": t("toast.ratingUpdateError", "Error updating rating"),
        "Rating cleared": t("toast.ratingCleared", "Rating cleared"),
        "Failed to update tags": t("toast.tagsUpdateFailed", "Failed to update tags"),
        "Tags updated": t("toast.tagsUpdated", "Tags updated"),
        "Failed to toggle watcher": t("toast.watcherToggleFailed", "Failed to toggle watcher"),
        
        // Selection & Validation
        "No valid assets selected.": t("toast.noValidAssetsSelected", "No valid assets selected."),
        "Name collision in current view": t("toast.nameCollisionInView", "Name collision in current view"),
        
        // Collections
        "Failed to create collection.": t("toast.failedCreateCollectionDot", "Failed to create collection."),
        "Failed to add assets to collection.": t("toast.failedAddAssetsToCollection", "Failed to add assets to collection."),
        "Failed to remove from collection.": t("toast.removeFromCollectionFailed", "Failed to remove from collection."),
        "Collection created": t("toast.collectionCreated", "Collection created"),
        "Added to collection": t("toast.addedToCollection", "Added to collection"),
        "Removed from collection": t("toast.removedFromCollection", "Removed from collection"),
        
        // File Operations
        "File renamed successfully!": t("toast.fileRenamedSuccess", "File renamed successfully!"),
        "Failed to rename file": t("toast.fileRenameFailed", "Failed to rename file"),
        "Failed to rename file.": t("toast.fileRenameFailed", "Failed to rename file."),
        "File deleted successfully!": t("toast.fileDeletedSuccess", "File deleted successfully!"),
        "Failed to delete file.": t("toast.fileDeleteFailed", "Failed to delete file."),
        "Failed to delete file. ": t("toast.fileDeleteFailed", "Failed to delete file."),
        "File deleted": t("toast.deleted", "File deleted"),
        "File renamed": t("toast.renamed", "File renamed"),
        
        // Folder Operations
        "Folder created": t("toast.folderCreated", "Folder created"),
        "Folder renamed": t("toast.folderRenamed", "Folder renamed"),
        "Folder moved": t("toast.folderMoved", "Folder moved"),
        "Folder deleted": t("toast.folderDeleted", "Folder deleted"),
        "Failed to create folder": t("toast.createFolderFailed", "Failed to create folder"),
        "Failed to rename folder": t("toast.renameFolderFailed", "Failed to rename folder"),
        "Failed to move folder": t("toast.moveFolderFailed", "Failed to move folder"),
        "Failed to delete folder": t("toast.deleteFolderFailed", "Failed to delete folder"),
        "Failed to pin folder": t("toast.pinFolderFailed", "Failed to pin folder"),
        "Failed to unpin folder": t("toast.unpinFolderFailed", "Failed to unpin folder"),
        "Folder pinned as browser root": t("toast.folderPinnedAsBrowserRoot", "Folder pinned as browser root"),
        "Folder added": t("toast.folderAdded", "Folder added"),
        "Folder removed": t("toast.folderRemoved", "Folder removed"),
        "Folder linked successfully": t("toast.folderLinked", "Folder linked successfully"),
        "An error occurred while adding the custom folder": t("toast.errorAddingFolder", "An error occurred while adding the custom folder"),
        "An error occurred while removing the custom folder": t("toast.errorRemovingFolder", "An error occurred while removing the custom folder"),
        "Failed to add custom folder": t("toast.failedAddFolder", "Failed to add custom folder"),
        "Failed to remove custom folder": t("toast.failedRemoveFolder", "Failed to remove custom folder"),
        "Native folder browser unavailable. Please enter path manually.": t("toast.nativeBrowserUnavailable", "Native folder browser unavailable. Please enter path manually."),
        
        // Clipboard
        "Opened in folder": t("toast.openedInFolder", "Opened in folder"),
        "Failed to open folder": t("toast.openFolderFailed", "Failed to open folder"),
        "Failed to open folder.": t("toast.openFolderFailed", "Failed to open folder."),
        "File path copied to clipboard": t("toast.pathCopied", "File path copied to clipboard"),
        "Failed to copy path": t("toast.pathCopyFailed", "Failed to copy path"),
        "Failed to copy to clipboard": t("toast.copyClipboardFailed", "Failed to copy to clipboard"),
        "No file path available for this asset.": t("toast.noFilePath", "No file path available for this asset."),
        
        // Metadata
        "Failed to refresh metadata.": t("toast.metadataRefreshFailed", "Failed to refresh metadata."),
        "Metadata refreshed": t("toast.metadataRefreshed", "Metadata refreshed"),
        "Duplicate analysis started": t("toast.dupAnalysisStarted", "Duplicate analysis started"),
        "Tags merged": t("toast.tagsMerged", "Tags merged"),
        "Duplicates deleted": t("toast.duplicatesDeleted", "Duplicates deleted"),
        "Rescanning file…": t("toast.rescanningFile", "Rescanning file…"),
        "Metadata enrichment complete": t("toast.enrichmentComplete", "Metadata enrichment complete"),
        
        // Playback
        "Playback speed is available for video media only": t("toast.playbackVideoOnly", "Playback speed is available for video media only"),
        
        // Database Operations
        "DB backup saved": t("toast.dbSaveSuccess", "DB backup saved"),
        "Failed to save DB backup": t("toast.dbSaveFailed", "Failed to save DB backup"),
        "DB restore started": t("toast.dbRestoreStarted", "DB restore started"),
        "Failed to restore DB backup": t("toast.dbRestoreFailed", "Failed to restore DB backup"),
        "Select a DB backup first": t("toast.dbRestoreSelect", "Select a DB backup first"),
        "Stopping running workers": t("toast.dbRestoreStopping", "Stopping running workers"),
        "Unlocking and resetting database": t("toast.dbRestoreResetting", "Unlocking and resetting database"),
        "Recreating database": t("toast.dbRestoreReplacing", "Recreating database"),
        "Replacing database files": t("toast.dbRestoreReplacing", "Replacing database files"),
        "Restarting scan": t("toast.dbRestoreRescan", "Restarting scan"),
        "Deleting database and rebuilding...": t("toast.dbDeleteTriggered", "Deleting database and rebuilding..."),
        "Database deleted and rebuilt. Files are being reindexed.": t("toast.dbDeleteSuccess", "Database deleted and rebuilt. Files are being reindexed."),
        "Failed to delete database": t("toast.dbDeleteFailed", "Failed to delete database"),
        "Database backup restored": t("toast.dbRestoreSuccess", "Database backup restored"),
        "Index reset started. Files will be reindexed in the background.": t("toast.resetStarted", "Index reset started. Files will be reindexed in the background."),
        "Failed to reset index": t("toast.resetFailed", "Failed to reset index"),
        "Reset triggered: Reindexing all files...": t("toast.resetTriggered", "Reset triggered: Reindexing all files..."),
        "Reset failed – database is corrupted. Use the \"Delete DB\" button to force-delete and rebuild.": t("toast.resetFailedCorrupt", "Reset failed – database is corrupted. Use the \"Delete DB\" button to force-delete and rebuild."),
        
        // Scanning
        "Scan started": t("toast.scanStarted", "Scan started"),
        "Scan complete": t("toast.scanComplete", "Scan complete"),
        "Scan failed": t("toast.scanFailed", "Scan failed"),
        
        // Permissions
        "Permission denied": t("toast.permissionDenied", "Permission denied"),
        
        // Language
        "Language changed. Reload the page for full effect.": t("toast.languageChanged", "Language changed. Reload the page for full effect."),
        
        // Tags
        "Tag added": t("toast.tagAdded", "Tag added"),
        "Tag removed": t("toast.tagRemoved", "Tag removed"),
        "Rating saved": t("toast.ratingSaved", "Rating saved"),
        
        // Collections - Create/Delete
        "Failed to create collection": t("toast.failedCreateCollection", "Failed to create collection"),
        "Failed to delete collection": t("toast.failedDeleteCollection", "Failed to delete collection"),
    };
    
    if (directMap[msg]) return directMap[msg];

    // Regex patterns for dynamic messages - improved with more flexible matching
    let m;
    
    // Rating: "Rating set to N stars" or "Rating set to N star"
    m = msg.match(/Rating set to (\d+) star(?:s)?/i);
    if (m) return t("toast.ratingSetN", "Rating set to {n} stars", { n: Number(m[1]) });

    // Downloading: "Downloading filename..."
    m = msg.match(/Downloading (.+?)\.\.\./i);
    if (m) return t("toast.downloadingFile", "Downloading {filename}...", { filename: m[1] });

    // Playback: "Playback 1.5x" or "Playback 2x"
    m = msg.match(/Playback ([0-9]+(?:\.[0-9]+)?)x/i);
    if (m) return t("toast.playbackRate", "Playback {rate}x", { rate: Number(m[1]).toFixed(2) });

    // Metadata refreshed: "Metadata refreshed" or "Metadata refreshed (suffix)"
    m = msg.match(/Metadata refreshed(?:\s*(.*))?/i);
    if (m) return t("toast.metadataRefreshed", "Metadata refreshed{suffix}", { suffix: m[1] ? " (" + m[1] + ")" : "" });

    // Error renaming: "Error renaming file: reason" or "Error renaming: reason"
    m = msg.match(/Error renaming(?: file)?:\s*(.+)/i);
    if (m) return t("toast.errorRenaming", "Error renaming file: {error}", { error: m[1] });

    // Error deleting: "Error deleting file: reason" or "Error deleting files: reason"
    m = msg.match(/Error deleting(?: files?| file)?:\s*(.+)/i);
    if (m) return t("toast.errorDeleting", "Error deleting file: {error}", { error: m[1] });

    // Tag merge failed: "Tag merge failed: reason"
    m = msg.match(/Tag merge failed:\s*(.+)/i);
    if (m) return t("toast.tagMergeFailed", "Tag merge failed: {error}", { error: m[1] });

    // Delete failed: "Delete failed: reason"
    m = msg.match(/Delete failed:\s*(.+)/i);
    if (m) return t("toast.deleteFailed", "Delete failed: {error}", { error: m[1] });

    // Analysis not started: "Analysis not started: reason"
    m = msg.match(/Analysis not started:\s*(.+)/i);
    if (m) return t("toast.analysisNotStarted", "Analysis not started: {error}", { error: m[1] });

    // Files deleted: "N files deleted successfully!"
    m = msg.match(/(\d+)\s+files deleted successfully!/i);
    if (m) return t("toast.filesDeletedSuccessN", "{n} files deleted successfully!", { n: Number(m[1]) });

    // Files deleted partial: "N files deleted, M failed."
    m = msg.match(/(\d+)\s+files deleted,\s+(\d+)\s+failed\./i);
    if (m) return t("toast.filesDeletedPartial", "{success} files deleted, {failed} failed.", { success: Number(m[1]), failed: Number(m[2]) });

    // Files deleted short: "N files deleted"
    m = msg.match(/(\d+)\s+files?\s+deleted/i);
    if (m) return t("toast.filesDeletedShort", "{n} files deleted", { n: Number(m[1]) });

    // Files deleted short partial: "N deleted, M failed"
    m = msg.match(/(\d+)\s+deleted,\s+(\d+)\s+failed/i);
    if (m) return t("toast.filesDeletedShortPartial", "{success} deleted, {failed} failed", { success: Number(m[1]), failed: Number(m[2]) });

    // Copied to clipboard: "Something copied to clipboard!"
    m = msg.match(/^(.+?)\s+copied to clipboard!$/i);
    if (m) return t("toast.copiedToClipboardNamed", "{name} copied to clipboard!", { name: m[1] });

    // Create folder: "Folder created: name"
    m = msg.match(/Folder created:\s*(.+)/i);
    if (m) return t("toast.folderCreated", "Folder created: {name}", { name: m[1] });

    // Create folder failed detail: "Failed to create folder: reason"
    m = msg.match(/Failed to create folder:\s*(.+)/i);
    if (m) return t("toast.createFolderFailedDetail", "Failed to create folder: {error}", { error: m[1] });

    // Rename folder failed detail: "Failed to rename folder: reason"
    m = msg.match(/Failed to rename folder:\s*(.+)/i);
    if (m) return t("toast.renameFolderFailedDetail", "Failed to rename folder: {error}", { error: m[1] });

    // Move folder failed detail: "Failed to move folder: reason"
    m = msg.match(/Failed to move folder:\s*(.+)/i);
    if (m) return t("toast.moveFolderFailedDetail", "Failed to move folder: {error}", { error: m[1] });

    // Delete folder failed detail: "Failed to delete folder: reason"
    m = msg.match(/Failed to delete folder:\s*(.+)/i);
    if (m) return t("toast.deleteFolderFailedDetail", "Failed to delete folder: {error}", { error: m[1] });

    // Remove from collection error: "Error removing from collection: reason"
    m = msg.match(/Error removing from collection:\s*(.+)/i);
    if (m) return t("toast.removeFromCollectionError", "Error removing from collection: {error}", { error: m[1] });

    // Generic error pattern: "Failed to X" -> try to translate
    m = msg.match(/^Failed to (.+)$/i);
    if (m) {
        // Return as-is but ensure it goes through i18n if there's a matching key
        const action = m[1].toLowerCase();
        const knownFailures = {
            "add folder": t("toast.failedAddFolder", "Failed to add custom folder"),
            "remove folder": t("toast.failedRemoveFolder", "Failed to remove custom folder"),
            "create collection": t("toast.failedCreateCollection", "Failed to create collection"),
            "delete collection": t("toast.failedDeleteCollection", "Failed to delete collection"),
        };
        for (const [key, translation] of Object.entries(knownFailures)) {
            if (action.includes(key)) return translation;
        }
    }

    return msg;
}

/**
 * Ensures the toast container exists in the DOM.
 * @returns {HTMLElement} Toast container element
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
 * Integrates with ComfyUI extensionManager.toast when available.
 * Falls back to custom DOM toasts for older ComfyUI versions.
 * 
 * @param {string|object} message - The message to display (or object with summary/detail)
 * @param {'info'|'success'|'warning'|'error'} type - The type of message
 * @param {number} [duration] - Duration in ms (default: type-based standard duration)
 */
export function comfyToast(message, type = "info", duration) {
    // Translate message
    message = translateToastMessage(message);
    
    // Use standard duration if not specified
    if (duration === undefined || duration === null) {
        duration = getStandardDuration(type);
    }
    
    // Treat as persistent only when caller explicitly passes 0 or a non-finite value.
    const persistent = !(Number.isFinite(Number(duration)) && Number(duration) > 0);
    const app = getComfyApp();

    // On success: dismiss any open error toasts (fallback DOM path).
    if (type === "success") {
        _dismissAllFallbackErrorToasts();
    }

    // Start cleaner timer on first call
    _startCleanerTimer();

    // 1. Try ComfyUI extensionManager toast (ComfyUI v1.3+ standard)
    try {
        const toastApi = app?.extensionManager?.toast;
        if (toastApi && typeof toastApi.add === "function") {
            let severity = type;
            if (severity === "warning") severity = "warn"; // PrimeVue uses "warn" not "warning"

            // Allow passing an object { summary, detail } as message
            let summary = t("manager.title");
            let detail = message;

            if (typeof message === "object" && message?.summary) {
                summary = message.summary;
                detail = message.detail || "";
            } else if (typeof message !== "string") {
                try { detail = message.message || String(message); } catch (e) { console.debug?.(e); }
            }

            // NOTE: Do NOT set `group` — PrimeVue only shows a toast in the <Toast> component
            // that matches its group. ComfyUI has no custom group component, so any group value
            // other than the default silently drops the message.
            const payload = { severity, summary, detail };
            if (!persistent) payload.life = duration;
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

    // 3. Fallback: Custom DOM toast
    const container = getToastContainer();
    
    // Enforce maximum visible toasts
    enforceToastLimit(container);

    // Fallback if message is an object/error
    if (typeof message !== "string") {
        try {
            message = message.message || String(message);
        } catch {
            message = "Unknown message";
        }
    }

    const el = document.createElement("div");
    const icon = getToastIcon(type);

    el.className = `mjr-toast mjr-toast-${type}`;
    el.setAttribute("role", type === "error" || type === "warning" ? "alert" : "status");
    el.setAttribute("aria-live", type === "error" || type === "warning" ? "assertive" : "polite");
    el.setAttribute("aria-atomic", "true");

    const textSpan = document.createElement("span");
    textSpan.className = "mjr-toast-text";
    textSpan.setAttribute("data-icon", icon);
    textSpan.textContent = message;

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

/**
 * Standard toast duration constants for consistent usage.
 */
export const TOAST_DURATION = {
    SUCCESS: 2000,
    INFO: 3000,
    WARNING: 4000,
    ERROR: 5000,
    PERSISTENT: 0,
};

/**
 * Convenience wrappers for common toast types.
 */
export const toast = {
    /**
     * Show a success toast.
     * @param {string} message - Message to display
     * @param {number} [duration] - Optional custom duration
     */
    success: (message, duration) => comfyToast(message, "success", duration ?? TOAST_DURATION.SUCCESS),
    
    /**
     * Show an error toast.
     * @param {string} message - Message to display
     * @param {number} [duration] - Optional custom duration
     */
    error: (message, duration) => comfyToast(message, "error", duration ?? TOAST_DURATION.ERROR),
    
    /**
     * Show a warning toast.
     * @param {string} message - Message to display
     * @param {number} [duration] - Optional custom duration
     */
    warning: (message, duration) => comfyToast(message, "warning", duration ?? TOAST_DURATION.WARNING),
    
    /**
     * Show an info toast.
     * @param {string} message - Message to display
     * @param {number} [duration] - Optional custom duration
     */
    info: (message, duration) => comfyToast(message, "info", duration ?? TOAST_DURATION.INFO),
};
