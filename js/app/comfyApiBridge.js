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

function _safeOwnValue(host, key) {
    try {
        if (!host || (typeof host !== "object" && typeof host !== "function")) return null;
        const desc = Object.getOwnPropertyDescriptor(host, key);
        if (!desc || !("value" in desc)) return null;
        return desc.value;
    } catch {
        return null;
    }
}

function _looksLikeComfyApi(value) {
    if (!_isObject(value)) return false;
    return (
        typeof value.fetchApi === "function"
        || typeof value.apiURL === "function"
        || _isObject(value.settings)
    );
}

function _looksLikeComfyApp(value) {
    if (!_isObject(value)) return false;
    return (
        _isObject(value.ui)
        || _isObject(value.canvas)
        || _isObject(value.graph)
        || typeof value.loadGraphData === "function"
        || _looksLikeComfyApi(value.api)
    );
}

export function setComfyApp(app) {
    if (_looksLikeComfyApp(app)) {
        _comfyAppRef = app;
    }
    return _comfyAppRef;
}

export function setComfyApi(api) {
    if (_looksLikeComfyApi(api)) {
        _comfyApiRef = api;
    }
    return _comfyApiRef;
}

export function getComfyApi(app) {
    if (_looksLikeComfyApi(_comfyApiRef)) return _comfyApiRef;
    const runtimeApp = _isObject(app) ? app : getComfyApp();
    const fromApp = runtimeApp?.api || runtimeApp?.ui?.api || runtimeApp?.ui?.app?.api || null;
    if (_looksLikeComfyApi(fromApp)) return fromApp;
    try {
        const api = typeof window !== "undefined" ? _safeOwnValue(window, "api") : null;
        if (_looksLikeComfyApi(api)) return api;
    } catch (e) { console.debug?.(e); }
    try {
        const api = typeof globalThis !== "undefined" ? _safeOwnValue(globalThis, "api") : null;
        if (_looksLikeComfyApi(api)) return api;
    } catch (e) { console.debug?.(e); }
    return null;
}

export function getComfyApp() {
    if (_looksLikeComfyApp(_comfyAppRef)) return _comfyAppRef;
    try {
        const app = typeof globalThis !== "undefined" ? _safeOwnValue(globalThis, "app") : null;
        if (_looksLikeComfyApp(app)) return app;
    } catch (e) { console.debug?.(e); }
    try {
        const app = typeof window !== "undefined" ? _safeOwnValue(window, "app") : null;
        if (_looksLikeComfyApp(app)) return app;
    } catch (e) { console.debug?.(e); }
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
    } catch (e) { console.debug?.(e); }
    return false;
}

function _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

function _warnTimeout(label, timeoutMs) {
    try {
        console.warn(`[Majoor] ${label} timed out after ${Math.max(0, Number(timeoutMs) || 0)}ms`);
    } catch (e) { console.debug?.(e); }
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
