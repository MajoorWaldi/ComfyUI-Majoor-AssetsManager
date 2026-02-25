/**
 * ComfyUI frontend compatibility bridge.
 * Centralizes access to API/settings/sidebar registration across legacy/new UIs.
 */

let _comfyAppRef = null;
let _comfyApiRef = null;
const READY_POLL_INTERVAL_MS = 50;

function _isObject(value) {
    return !!value && typeof value === "object";
}

export function setComfyApp(app) {
    if (app && typeof app === "object") {
        _comfyAppRef = app;
    }
    return _comfyAppRef;
}

export function setComfyApi(api) {
    if (api && typeof api === "object") {
        _comfyApiRef = api;
    }
    return _comfyApiRef;
}

export function getComfyApi(app) {
    if (_isObject(_comfyApiRef)) return _comfyApiRef;
    const runtimeApp = _isObject(app) ? app : getComfyApp();
    const fromApp = runtimeApp?.api || runtimeApp?.ui?.api || runtimeApp?.ui?.app?.api || null;
    if (_isObject(fromApp)) return fromApp;
    try {
        if (typeof window !== "undefined" && _isObject(window?.api)) return window.api;
    } catch {}
    try {
        if (typeof globalThis !== "undefined" && _isObject(globalThis?.api)) return globalThis.api;
    } catch {}
    return null;
}

export function getComfyApp() {
    if (_comfyAppRef && typeof _comfyAppRef === "object") return _comfyAppRef;
    try {
        if (typeof globalThis !== "undefined" && globalThis?.app) return globalThis.app;
    } catch {}
    try {
        if (typeof window !== "undefined" && window?.app) return window.app;
    } catch {}
    return null;
}

export function getSettingsApi(app) {
    const runtimeApp = _isObject(app) ? app : getComfyApp();
    if (!runtimeApp || typeof runtimeApp !== "object") return null;
    return (
        runtimeApp?.ui?.settings ||
        runtimeApp?.settings ||
        runtimeApp?.ui?.api?.settings ||
        runtimeApp?.api?.settings ||
        null
    );
}

export function getSettingValue(app, key) {
    const settingsApi = getSettingsApi(app);
    if (!settingsApi || typeof settingsApi?.getSettingValue !== "function") return null;
    try {
        return settingsApi.getSettingValue(key);
    } catch {
        return null;
    }
}

export function registerSidebarTabCompat(app, tabDef) {
    try {
        const runtimeApp = _isObject(app) ? app : getComfyApp();
        const manager = runtimeApp?.extensionManager || runtimeApp?.ui?.extensionManager || null;
        if (manager && typeof manager.registerSidebarTab === "function") {
            manager.registerSidebarTab(tabDef);
            return true;
        }
    } catch {}
    return false;
}

function _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

function _warnTimeout(label, timeoutMs) {
    try {
        console.warn(`[Majoor] ${label} timed out after ${Math.max(0, Number(timeoutMs) || 0)}ms`);
    } catch {}
}

export async function waitForComfyApp({
    timeoutMs = 4000,
    intervalMs = READY_POLL_INTERVAL_MS,
    warnOnTimeout = true,
    rejectOnTimeout = false,
} = {}) {
    const start = Date.now();
    const timeout = Math.max(0, Number(timeoutMs) || 0);
    while (Date.now() - start < timeout) {
        const app = getComfyApp();
        if (app && typeof app === "object") return app;
        await _sleep(intervalMs);
    }
    const fallback = getComfyApp();
    if (fallback && typeof fallback === "object") return fallback;
    if (warnOnTimeout) _warnTimeout("waitForComfyApp", timeout);
    if (rejectOnTimeout) {
        throw new Error(`waitForComfyApp timeout after ${timeout}ms`);
    }
    return null;
}

export async function waitForComfyApi(
    {
        app = null,
        timeoutMs = 4000,
        intervalMs = READY_POLL_INTERVAL_MS,
        warnOnTimeout = true,
        rejectOnTimeout = false,
    } = {}
) {
    const start = Date.now();
    const timeout = Math.max(0, Number(timeoutMs) || 0);
    while (Date.now() - start < timeout) {
        const runtimeApp = app || getComfyApp();
        const api = getComfyApi(runtimeApp);
        if (api) return api;
        await _sleep(intervalMs);
    }
    const fallback = getComfyApi(app || getComfyApp());
    if (fallback) return fallback;
    if (warnOnTimeout) _warnTimeout("waitForComfyApi", timeout);
    if (rejectOnTimeout) {
        throw new Error(`waitForComfyApi timeout after ${timeout}ms`);
    }
    return null;
}
