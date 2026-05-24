/**
 * ComfyUI frontend compatibility bridge.
 * Centralizes access to API/settings/sidebar registration across legacy/new UIs.
 */

let _comfyAppRef: any = null;
let _comfyApiRef: any = null;
const READY_POLL_INTERVAL_MS = 50;

function _isObject(value: any): value is Record<string, unknown> {
    return !!value && typeof value === "object";
}

function _safeOwnValue(host: any, key: string): any {
    try {
        if (!host || (typeof host !== "object" && typeof host !== "function")) return null;
        const desc = Object.getOwnPropertyDescriptor(host, key);
        if (!desc || !("value" in desc)) return null;
        return desc.value;
    } catch {
        return null;
    }
}

function _looksLikeComfyApi(value: any): value is any {
    if (!_isObject(value)) return false;
    return (
        typeof value.fetchApi === "function" ||
        typeof value.apiURL === "function" ||
        _isObject(value.settings)
    );
}

function _looksLikeComfyApp(value: any): value is any {
    if (!_isObject(value)) return false;
    return (
        _isObject(value.ui) ||
        _isObject(value.canvas) ||
        _isObject(value.graph) ||
        typeof value.loadGraphData === "function" ||
        _looksLikeComfyApi(value.api)
    );
}

export function setComfyApp(app: any): any {
    if (_looksLikeComfyApp(app)) {
        _comfyAppRef = app;
    }
    return _comfyAppRef;
}

export function setComfyApi(api: any): any {
    if (_looksLikeComfyApi(api)) {
        _comfyApiRef = api;
    }
    return _comfyApiRef;
}

export function getComfyApi(app?: any): any {
    if (_looksLikeComfyApi(_comfyApiRef)) return _comfyApiRef;
    const runtimeApp = _isObject(app) ? app : getComfyApp();
    const fromApp = runtimeApp?.api || runtimeApp?.ui?.api || runtimeApp?.ui?.app?.api || null;
    if (_looksLikeComfyApi(fromApp)) return fromApp;
    try {
        const api = typeof window !== "undefined" ? _safeOwnValue(window, "api") : null;
        if (_looksLikeComfyApi(api)) return api;
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const api = typeof globalThis !== "undefined" ? _safeOwnValue(globalThis, "api") : null;
        if (_looksLikeComfyApi(api)) return api;
    } catch (e) {
        console.debug?.(e);
    }
    return null;
}

export function getComfyApp(): any {
    if (_looksLikeComfyApp(_comfyAppRef)) return _comfyAppRef;
    try {
        const app = typeof globalThis !== "undefined" ? _safeOwnValue(globalThis, "app") : null;
        if (_looksLikeComfyApp(app)) return app;
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const app = typeof window !== "undefined" ? _safeOwnValue(window, "app") : null;
        if (_looksLikeComfyApp(app)) return app;
    } catch (e) {
        console.debug?.(e);
    }
    return null;
}

export function getSettingsApi(app?: any): any {
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

export function getSettingValue(app: any, key: string): any {
    const settingsApi = getSettingsApi(app);
    if (!settingsApi) return null;
    const candidates = ["getSettingValue", "getSetting", "get"];
    for (const name of candidates) {
        try {
            if (typeof settingsApi?.[name] === "function") {
                const value = settingsApi[name](key);
                if (value !== undefined) return value;
            }
        } catch {
            // Try the next compatibility surface.
        }
    }
    try {
        const values = settingsApi?.settings || settingsApi?.values || null;
        if (values instanceof Map && values.has(key)) return values.get(key);
        if (values && typeof values === "object" && Object.hasOwn(values, key)) return values[key];
    } catch {
        return null;
    }
    return null;
}

export function setSettingValue(app: any, key: string, value: any): boolean {
    const settingsApi = getSettingsApi(app);
    if (!settingsApi) return false;
    const candidates = ["setSettingValue", "setSetting", "set", "updateSetting"];
    for (const name of candidates) {
        try {
            if (typeof settingsApi?.[name] === "function") {
                settingsApi[name](key, value);
                return true;
            }
        } catch {
            // Try the next compatibility surface.
        }
    }
    try {
        const values = settingsApi?.settings || settingsApi?.values || null;
        if (values instanceof Map) {
            values.set(key, value);
            return true;
        }
        if (values && typeof values === "object") {
            values[key] = value;
            return true;
        }
    } catch {
        return false;
    }
    return false;
}

export function getExtensionManager(app?: any): any {
    const runtimeApp = _isObject(app) ? app : getComfyApp();
    return runtimeApp?.extensionManager || runtimeApp?.ui?.extensionManager || null;
}

export function getSidebarController(app?: any): any {
    const manager = getExtensionManager(app);
    if (!_isObject(manager)) return null;
    return manager?.sidebarTabStore || manager?.sidebarTab || (manager as any)?.workspaceStore?.sidebarTab || null;
}

function _getBottomPanelController(manager: any | undefined): any {
    if (!_isObject(manager)) return null;
    return manager?.bottomPanel || manager?.bottomPanelStore || null;
}

export function getExtensionToastApi(app?: any): any {
    const manager = getExtensionManager(app);
    const toastApi = manager?.toast || null;
    if (toastApi && typeof toastApi.add === "function") return toastApi;
    return null;
}

export function getExtensionDialogApi(app?: any): any {
    const manager = getExtensionManager(app);
    const dialogApi = manager?.dialog || null;
    if (!dialogApi) return null;
    if (
        typeof dialogApi.alert === "function" ||
        typeof dialogApi.confirm === "function" ||
        typeof dialogApi.prompt === "function"
    ) {
        return dialogApi;
    }
    return null;
}

export function activateSidebarTabCompat(app: any, tabId: any): boolean {
    const runtimeApp = _isObject(app) ? app : getComfyApp();
    const manager = getExtensionManager(runtimeApp);
    const sidebarController = getSidebarController(runtimeApp);
    const safeTabId = String(tabId || "").trim();
    if (!manager || !safeTabId) return false;
    const candidates = [
        "activateSidebarTab",
        "openSidebarTab",
        "selectSidebarTab",
        "setActiveSidebarTab",
        "showSidebarTab",
    ];
    for (const host of [manager, sidebarController]) {
        if (!host) continue;
        for (const name of candidates) {
            try {
                if (typeof host?.[name] === "function") {
                    host[name](safeTabId);
                    return true;
                }
            } catch (e) {
                console.debug?.(e);
            }
        }
    }
    try {
        const activeId = String(
            sidebarController?.activeSidebarTabId ||
                sidebarController?.activeSidebarTab?.id ||
                manager?.activeSidebarTabId ||
                manager?.activeSidebarTab?.id ||
                "",
        ).trim();
        if (activeId === safeTabId) return true;
        if (typeof sidebarController?.toggleSidebarTab === "function") {
            sidebarController.toggleSidebarTab(safeTabId);
            return true;
        }
    } catch (e) {
        console.debug?.(e);
    }
    return false;
}

export function registerCommandCompat(app: any, commandDef: any): boolean {
    const manager = getExtensionManager(app);
    const safeDef = commandDef && typeof commandDef === "object" ? { ...commandDef } : null;
    if (!manager || !safeDef) return false;
    const candidates = ["registerCommand", "addCommand"];
    for (const name of candidates) {
        try {
            if (typeof manager?.[name] === "function") {
                manager[name](safeDef);
                return true;
            }
        } catch (e) {
            console.debug?.(e);
        }
    }
    return false;
}

export function registerKeybindingCompat(app: any, keybindingDef: any): boolean {
    const manager = getExtensionManager(app);
    const safeDef =
        keybindingDef && typeof keybindingDef === "object" ? { ...keybindingDef } : null;
    if (!manager || !safeDef) return false;
    const candidates = ["registerKeybinding", "addKeybinding"];
    for (const name of candidates) {
        try {
            if (typeof manager?.[name] === "function") {
                manager[name](safeDef);
                return true;
            }
        } catch (e) {
            console.debug?.(e);
        }
    }
    return false;
}

export function registerSidebarTabCompat(app: any, tabDef: any): boolean {
    try {
        const runtimeApp = _isObject(app) ? app : getComfyApp();
        const manager = runtimeApp?.extensionManager || runtimeApp?.ui?.extensionManager || null;
        const sidebarController = getSidebarController(runtimeApp);
        for (const host of [manager, sidebarController]) {
            if (host && typeof host.registerSidebarTab === "function") {
                host.registerSidebarTab(tabDef);
                return true;
            }
        }
    } catch (e) {
        console.debug?.(e);
    }
    return false;
}

export function registerBottomPanelTabCompat(app: any, tabDef: any): boolean {
    try {
        const runtimeApp = _isObject(app) ? app : getComfyApp();
        const manager = getExtensionManager(runtimeApp);
        const bottomPanelController = _getBottomPanelController(manager);
        for (const host of [manager, bottomPanelController]) {
            if (host && typeof host.registerBottomPanelTab === "function") {
                host.registerBottomPanelTab(tabDef);
                return true;
            }
        }
    } catch (e) {
        console.debug?.(e);
    }
    return false;
}

function _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

function _warnTimeout(label: string, timeoutMs: number): void {
    try {
        console.warn(`[Majoor] ${label} timed out after ${Math.max(0, Number(timeoutMs) || 0)}ms`);
    } catch (e) {
        console.debug?.(e);
    }
}

export async function waitForComfyApp({
    timeoutMs = 4000,
    intervalMs = READY_POLL_INTERVAL_MS,
    warnOnTimeout = true,
    rejectOnTimeout = false,
}: { timeoutMs?: number; intervalMs?: number; warnOnTimeout?: boolean; rejectOnTimeout?: boolean } = {}): Promise<any> {
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

export async function waitForComfyApi({
    app = null,
    timeoutMs = 4000,
    intervalMs = READY_POLL_INTERVAL_MS,
    warnOnTimeout = true,
    rejectOnTimeout = false,
}: { app?: any; timeoutMs?: number; intervalMs?: number; warnOnTimeout?: boolean; rejectOnTimeout?: boolean } = {}): Promise<any> {
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
