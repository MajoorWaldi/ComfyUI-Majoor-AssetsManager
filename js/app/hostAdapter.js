/**
 * Host Adapter Layer — Majoor Assets Manager
 *
 * This is the SINGLE contracted boundary between Majoor application code
 * (Vue components, Pinia stores, feature modules) and the ComfyUI host
 * environment (DOM, ComfyUI APIs, extension manager, sidebar/panel system).
 *
 * Rules (see ADR 0007):
 *   1. Vue components and Pinia stores MUST import host capabilities from this
 *      module only.  Direct use of `comfyApiBridge.js` from store/component
 *      code is a violation.
 *   2. Only `entry.js` and this file are allowed to import from
 *      `comfyApiBridge.js` directly.
 *   3. Each method exposed here has a stable name and signature.
 *      The underlying ComfyUI API may change; fixes stay inside this file.
 *   4. Every method is null-safe and never throws to callers.
 *
 * Lifecycle
 * ---------
 * Call `hostAdapter.init(app)` once from `entry.js` after receiving the
 * ComfyUI app object.  After init, all methods work correctly.
 * Before init, all methods return safe no-op fallbacks.
 */

import {
    activateSidebarTabCompat,
    getComfyApi,
    getComfyApp,
    getExtensionDialogApi,
    getExtensionManager,
    getExtensionToastApi,
    getSettingValue,
    getSettingsApi,
    registerBottomPanelTabCompat,
    registerCommandCompat,
    registerKeybindingCompat,
    registerSidebarTabCompat,
    setComfyApp,
    waitForComfyApi,
    waitForComfyApp,
} from "./comfyApiBridge.js";

// ── internal state ────────────────────────────────────────────────────────────

/** @type {object | null} */
let _app = null;

// ── lifecycle ─────────────────────────────────────────────────────────────────

/**
 * Initialise the adapter with the ComfyUI app object.
 * Must be called once from `entry.js` before any other method.
 *
 * @param {object} app - ComfyUI app object received in the extension setup callback.
 */
export function init(app) {
    _app = setComfyApp(app) || app || null;
}

/**
 * Returns true when the adapter has been initialised with a live app reference.
 */
export function isReady() {
    return !!_app;
}

/**
 * Wait until the host app is available (for code running before `init()`).
 * Resolves with the app object or null on timeout.
 *
 * @param {number} [timeoutMs=5000]
 * @returns {Promise<object | null>}
 */
export async function ready(timeoutMs = 5000) {
    if (_app) return _app;
    try {
        const app = await waitForComfyApp({ timeoutMs });
        if (app) _app = app;
        return _app;
    } catch {
        return null;
    }
}

// ── notifications ─────────────────────────────────────────────────────────────

/**
 * Show a toast notification via ComfyUI extension manager toast.
 * Falls back silently if the host API is unavailable.
 *
 * @param {{ severity?: "info"|"success"|"warn"|"error", summary?: string, detail?: string, life?: number }} opts
 */
export function showToast(opts) {
    try {
        const toastApi = getExtensionToastApi(_app || getComfyApp());
        if (toastApi) {
            toastApi.add({
                severity: opts?.severity ?? "info",
                summary: opts?.summary ?? "",
                detail: opts?.detail ?? "",
                life: opts?.life ?? 4000,
            });
        }
    } catch {
        // host not available — silent
    }
}

// ── dialogs ───────────────────────────────────────────────────────────────────

/**
 * Show a confirmation dialog.
 * Returns a Promise<boolean> (true = confirmed, false = cancelled / unavailable).
 *
 * @param {{ message: string, header?: string }} opts
 * @returns {Promise<boolean>}
 */
export async function confirm(opts) {
    try {
        const dialogApi = getExtensionDialogApi(_app || getComfyApp());
        if (dialogApi && typeof dialogApi.confirm === "function") {
            const result = await dialogApi.confirm({
                message: opts?.message ?? "",
                header: opts?.header ?? "Confirm",
            });
            return !!result;
        }
    } catch {
        // fall through
    }
    return false;
}

// ── settings ──────────────────────────────────────────────────────────────────

/**
 * Read a ComfyUI setting value.
 *
 * @param {string} key
 * @param {*} [defaultValue=null]
 * @returns {*}
 */
export function getSetting(key, defaultValue = null) {
    try {
        const value = getSettingValue(_app || getComfyApp(), key);
        return value !== null && value !== undefined ? value : defaultValue;
    } catch {
        return defaultValue;
    }
}

/**
 * Get the raw ComfyUI settings API (for registration, not for reading ad-hoc values).
 * Prefer `getSetting()` for reading individual settings.
 *
 * @returns {object | null}
 */
export function getHostSettingsApi() {
    try {
        return getSettingsApi(_app || getComfyApp());
    } catch {
        return null;
    }
}

// ── sidebar & panel ───────────────────────────────────────────────────────────

/**
 * Register a sidebar tab with the ComfyUI extension manager.
 *
 * @param {object} tabDef
 * @returns {boolean} true if registration succeeded
 */
export function registerSidebarTab(tabDef) {
    try {
        return registerSidebarTabCompat(_app || getComfyApp(), tabDef);
    } catch {
        return false;
    }
}

/**
 * Register a bottom panel tab.
 *
 * @param {object} tabDef
 * @returns {boolean}
 */
export function registerBottomPanelTab(tabDef) {
    try {
        return registerBottomPanelTabCompat(_app || getComfyApp(), tabDef);
    } catch {
        return false;
    }
}

/**
 * Programmatically activate a sidebar tab.
 *
 * @param {string} tabId
 * @returns {boolean}
 */
export function activateSidebarTab(tabId) {
    try {
        return activateSidebarTabCompat(_app || getComfyApp(), tabId);
    } catch {
        return false;
    }
}

// ── commands & keybindings ────────────────────────────────────────────────────

/**
 * Register a command with the ComfyUI command palette.
 *
 * @param {object} commandDef
 * @returns {boolean}
 */
export function registerCommand(commandDef) {
    try {
        return registerCommandCompat(_app || getComfyApp(), commandDef);
    } catch {
        return false;
    }
}

/**
 * Register a keybinding.
 *
 * @param {object} keybindingDef
 * @returns {boolean}
 */
export function registerKeybinding(keybindingDef) {
    try {
        return registerKeybindingCompat(_app || getComfyApp(), keybindingDef);
    } catch {
        return false;
    }
}

// ── extension manager (escape hatch) ─────────────────────────────────────────

/**
 * Returns the ComfyUI extension manager object.
 *
 * This is an **escape hatch** for capabilities not yet wrapped above.
 * Prefer adding a typed method to this adapter instead of using this.
 *
 * @returns {object | null}
 */
export function getHostExtensionManager() {
    try {
        return getExtensionManager(_app || getComfyApp());
    } catch {
        return null;
    }
}

// ── raw app reference (escape hatch) ─────────────────────────────────────────

/**
 * Returns the raw ComfyUI app reference.
 *
 * This is an **escape hatch**.  Only use it when you need something that is
 * not yet abstracted by this adapter (and then add it here).
 *
 * @returns {object | null}
 */
export function getRawHostApp() {
    return _app || getComfyApp() || null;
}

/**
 * Returns the raw ComfyUI API reference.
 *
 * This is an escape hatch for event subscription and queue APIs that are not
 * wrapped by the adapter yet.
 *
 * @param {object | null} [app=null]
 * @returns {object | null}
 */
export function getRawHostApi(app = null) {
    try {
        return getComfyApi(app || _app || getComfyApp()) || null;
    } catch {
        return null;
    }
}

/**
 * Waits for the raw ComfyUI API reference.
 *
 * @param {object} [options]
 * @returns {Promise<object | null>}
 */
export async function waitForRawHostApi(options = {}) {
    try {
        return await waitForComfyApi(options);
    } catch {
        return null;
    }
}

// ── public API ────────────────────────────────────────────────────────────────

export const hostAdapter = {
    init,
    isReady,
    ready,
    showToast,
    confirm,
    getSetting,
    getHostSettingsApi,
    registerSidebarTab,
    registerBottomPanelTab,
    activateSidebarTab,
    registerCommand,
    registerKeybinding,
    getHostExtensionManager,
    getRawHostApp,
    getRawHostApi,
    waitForRawHostApi,
};

export default hostAdapter;
