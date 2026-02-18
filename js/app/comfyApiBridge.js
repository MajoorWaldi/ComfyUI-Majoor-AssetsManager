/**
 * ComfyUI frontend compatibility bridge.
 * Centralizes access to API/settings/sidebar registration across legacy/new UIs.
 */

export function getComfyApi(app) {
    if (!app || typeof app !== "object") return null;
    return app.api || app?.ui?.api || app?.ui?.app?.api || null;
}

export function getComfyApp() {
    try {
        if (typeof globalThis !== "undefined" && globalThis?.app) return globalThis.app;
    } catch {}
    try {
        if (typeof window !== "undefined" && window?.app) return window.app;
    } catch {}
    try {
        if (typeof window !== "undefined" && window?.comfyAPI?.app) return window.comfyAPI.app;
    } catch {}
    return null;
}

export function getSettingsApi(app) {
    if (!app || typeof app !== "object") return null;
    return (
        app?.ui?.settings ||
        app?.settings ||
        app?.ui?.api?.settings ||
        app?.api?.settings ||
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

export function setSettingValue(app, key, value) {
    const settingsApi = getSettingsApi(app);
    if (!settingsApi || typeof settingsApi?.setSettingValue !== "function") return false;
    try {
        settingsApi.setSettingValue(key, value);
        return true;
    } catch {
        return false;
    }
}

export function registerSidebarTabCompat(app, tabDef) {
    try {
        const manager = app?.extensionManager || app?.ui?.extensionManager || null;
        if (manager && typeof manager.registerSidebarTab === "function") {
            manager.registerSidebarTab(tabDef);
            return true;
        }
    } catch {}
    return false;
}
