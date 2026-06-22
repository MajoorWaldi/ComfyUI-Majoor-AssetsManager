/**
 * Host Adapter Layer  -  Majoor Assets Manager
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

import type { MajoorComfyApp, MajoorComfyApi, MajoorExtensionManager } from "../types/comfyui-frontend.js";
import {
    activateBottomPanelTabCompat,
    activateSidebarTabCompat,
    fetchComfyApi,
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
    setSettingValue,
    waitForComfyApi,
    waitForComfyApp,
} from "./comfyApiBridge.js";
import { findGraphNodeById, getHostRootGraph, walkGraphNodes } from "./graphTraversal.js";

// -- internal state ------------------------------------------------------------

let _app: any = null;
const HOST_QUEUE_PROMPT_BINDING_KEY = Symbol.for("mjr.host.queuePromptBinding");
const HOST_CANVAS_SELECTION_EVENT_TYPES = [
    "selectionchange",
    "selection-change",
    "node-selected",
    "node-deselected",
    "node-selection-change",
];

// -- lifecycle -----------------------------------------------------------------

/**
 * Initialise the adapter with the ComfyUI app object.
 * Must be called once from `entry.js` before any other method.
 *
 * @param {object} app - ComfyUI app object received in the extension setup callback.
 */
export function init(app: any): void {
    _app = setComfyApp(app) || (app as MajoorComfyApp) || null;
}

/**
 * Returns true when the adapter has been initialised with a live app reference.
 */
export function isReady(): boolean {
    return !!(_app || getComfyApp());
}

/**
 * Wait until the host app is available (for code running before `init()`).
 * Resolves with the app object or null on timeout.
 *
 * @param {number} [timeoutMs=5000]
 * @returns {Promise<object | null>}
 */
export async function ready(timeoutMs = 5000): Promise<any> {
    if (_app) return _app;
    try {
        const app = await waitForComfyApp({ timeoutMs });
        if (app) _app = app;
        return _app;
    } catch {
        return null;
    }
}

// -- notifications -------------------------------------------------------------

/**
 * Show a toast notification via ComfyUI extension manager toast.
 * Falls back silently if the host API is unavailable.
 *
 * @param {{ severity?: "info"|"success"|"warn"|"error", summary?: string, detail?: string, life?: number }} opts
 */
export function showToast(opts: { severity?: string; summary?: string; detail?: string; life?: number } | null | undefined): void {
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
        // host not available  -  silent
    }
}

/**
 * Returns the raw ComfyUI toast API when available.
 */
export function getHostToastApi(app: any = null): any {
    try {
        return getExtensionToastApi(app || _app || getComfyApp()) || null;
    } catch {
        return null;
    }
}

// -- dialogs -------------------------------------------------------------------

/**
 * Show a confirmation dialog.
 * Returns a Promise<boolean> (true = confirmed, false = cancelled / unavailable).
 *
 * @param {{ message: string, header?: string }} opts
 * @returns {Promise<boolean>}
 */
export async function confirm(opts: { message: string; header?: string } | null | undefined): Promise<boolean> {
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

/**
 * Returns the raw ComfyUI dialog API when available.
 */
export function getHostDialogApi(app: any = null): any {
    try {
        return getExtensionDialogApi(app || _app || getComfyApp()) || null;
    } catch {
        return null;
    }
}

// -- settings ------------------------------------------------------------------

/**
 * Read a ComfyUI setting value.
 *
 * @param {string} key
 * @param {*} [defaultValue=null]
 * @returns {*}
 */
export function getSetting(key: string, defaultValue: any = null): any {
    try {
        const value = getSettingValue(_app || getComfyApp(), key);
        return value !== null && value !== undefined ? value : defaultValue;
    } catch {
        return defaultValue;
    }
}

export function getSettingForApp(app: any, key: string, defaultValue: any = null): any {
    try {
        const value = getSettingValue(app || _app || getComfyApp(), key);
        return value !== null && value !== undefined ? value : defaultValue;
    } catch {
        return defaultValue;
    }
}

/**
 * Write a ComfyUI setting value.
 *
 * @param {string} key
 * @param {*} value
 * @returns {boolean}
 */
export function setSetting(key: string, value: any): boolean {
    try {
        return setSettingValue(_app || getComfyApp(), key, value);
    } catch {
        return false;
    }
}

export function setSettingForApp(app: any, key: string, value: any): boolean {
    try {
        return setSettingValue(app || _app || getComfyApp(), key, value);
    } catch {
        return false;
    }
}

/**
 * Get the raw ComfyUI settings API (for registration, not for reading ad-hoc values).
 * Prefer `getSetting()` for reading individual settings.
 *
 * @returns {object | null}
 */
export function getHostSettingsApi(): any {
    try {
        return getSettingsApi(_app || getComfyApp());
    } catch {
        return null;
    }
}

// -- sidebar & panel -----------------------------------------------------------

/**
 * Register a sidebar tab with the ComfyUI extension manager.
 *
 * @param {object} tabDef
 * @returns {boolean} true if registration succeeded
 */
export function registerSidebarTab(tabDef: any): boolean {
    try {
        return registerSidebarTabCompat(_app || getComfyApp(), tabDef);
    } catch {
        return false;
    }
}

export function registerSidebarTabForApp(app: any, tabDef: any): boolean {
    try {
        return registerSidebarTabCompat(app || _app || getComfyApp(), tabDef);
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
export function registerBottomPanelTab(tabDef: any): boolean {
    try {
        return registerBottomPanelTabCompat(_app || getComfyApp(), tabDef);
    } catch {
        return false;
    }
}

export function registerBottomPanelTabForApp(app: any, tabDef: any): boolean {
    try {
        return registerBottomPanelTabCompat(app || _app || getComfyApp(), tabDef);
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
export function activateSidebarTab(tabId: string): boolean {
    try {
        return activateSidebarTabCompat(_app || getComfyApp(), tabId);
    } catch {
        return false;
    }
}

export function activateSidebarTabForApp(app: any, tabId: string): boolean {
    try {
        return activateSidebarTabCompat(app || _app || getComfyApp(), tabId);
    } catch {
        return false;
    }
}

export function activateBottomPanelTabForApp(app: any, tabId: string): boolean {
    try {
        return activateBottomPanelTabCompat(app || _app || getComfyApp(), tabId);
    } catch {
        return false;
    }
}

// -- commands & keybindings ----------------------------------------------------

/**
 * Register a command with the ComfyUI command palette.
 *
 * @param {object} commandDef
 * @returns {boolean}
 */
export function registerCommand(commandDef: any): boolean {
    try {
        return registerCommandCompat(_app || getComfyApp(), commandDef);
    } catch {
        return false;
    }
}

export function registerCommandForApp(app: any, commandDef: any): boolean {
    try {
        return registerCommandCompat(app || _app || getComfyApp(), commandDef);
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
export function registerKeybinding(keybindingDef: any): boolean {
    try {
        return registerKeybindingCompat(_app || getComfyApp(), keybindingDef);
    } catch {
        return false;
    }
}

export function registerKeybindingForApp(app: any, keybindingDef: any): boolean {
    try {
        return registerKeybindingCompat(app || _app || getComfyApp(), keybindingDef);
    } catch {
        return false;
    }
}

// -- extension manager (escape hatch) -----------------------------------------

/**
 * Returns the ComfyUI extension manager object.
 *
 * This is an **escape hatch** for capabilities not yet wrapped above.
 * Prefer adding a typed method to this adapter instead of using this.
 *
 * @returns {object | null}
 */
export function getHostExtensionManager(): any {
    try {
        return getExtensionManager(_app || getComfyApp());
    } catch {
        return null;
    }
}

// -- raw app reference (escape hatch) -----------------------------------------

/**
 * Returns the raw ComfyUI app reference.
 *
 * This is an **escape hatch**.  Only use it when you need something that is
 * not yet abstracted by this adapter (and then add it here).
 *
 * @returns {object | null}
 */
export function getRawHostApp(): any {
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
export function getRawHostApi(app: any = null): any {
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
export async function waitForRawHostApi(options: { timeoutMs?: number; warnOnTimeout?: boolean; rejectOnTimeout?: boolean } = {}): Promise<any> {
    try {
        return await waitForComfyApi(options);
    } catch {
        return null;
    }
}

/**
 * Send an HTTP request through ComfyUI's API layer when available.
 * Falls back to the bridge compatibility logic when the host is still warming up.
 *
 * @param {string} url
 * @param {RequestInit | null} [options=null]
 * @param {object | null} [app=null]
 * @returns {Promise<Response>}
 */
export async function fetchHostApi(url: string, options: RequestInit | null = null, app: any = null): Promise<Response> {
    try {
        return await fetchComfyApi(url, options, app || _app || getComfyApp());
    } catch {
        return fetch(url, { credentials: "include", ...(options || {}) });
    }
}

function _safeAddEventListener(target: any, type: string, handler: EventListener): (() => void) | null {
    if (!target || typeof target.addEventListener !== "function") return null;
    try {
        target.addEventListener(type, handler);
    } catch {
        return null;
    }
    return () => {
        try {
            target.removeEventListener?.(type, handler);
        } catch (e) {
            console.debug?.(e);
        }
    };
}

export function observeHostCanvasSelection(
    onSelectionChange: (() => void) | null | undefined,
    options: { app?: any; includePointerFallback?: boolean } = {},
): (() => void) | null {
    if (typeof onSelectionChange !== "function") return null;
    const app = options.app || _app || getComfyApp();
    const canvas = app?.canvas;
    if (!canvas) return null;

    const cleanups: Array<() => void> = [];
    let callbackBound = false;
    const eventTargets = [canvas, app, app?.graph].filter(
        (target, index, all) => target && all.indexOf(target) === index,
    );

    const scheduleSelectionChange = () => {
        try {
            onSelectionChange();
        } catch (e) {
            console.debug?.(e);
        }
    };

    for (const target of eventTargets) {
        for (const type of HOST_CANVAS_SELECTION_EVENT_TYPES) {
            const cleanup = _safeAddEventListener(target, type, scheduleSelectionChange);
            if (cleanup) {
                cleanups.push(cleanup);
                callbackBound = true;
            }
        }
    }

    if (!callbackBound) {
        const hadOwnOnNodeSelected = Object.prototype.hasOwnProperty.call(canvas, "onNodeSelected");
        const hadOwnOnSelectionChange = Object.prototype.hasOwnProperty.call(
            canvas,
            "onSelectionChange",
        );
        const hadOwnOnNodeDeselected = Object.prototype.hasOwnProperty.call(
            canvas,
            "onNodeDeselected",
        );
        const originalOnNodeSelected = canvas.onNodeSelected;
        const originalOnSelectionChange = canvas.onSelectionChange;
        const originalOnNodeDeselected = canvas.onNodeDeselected;

        canvas.onNodeSelected = function (node: any) {
            originalOnNodeSelected?.call(this, node);
            scheduleSelectionChange();
        };
        canvas.onSelectionChange = function (selectedNodes: any) {
            originalOnSelectionChange?.call(this, selectedNodes);
            scheduleSelectionChange();
        };
        canvas.onNodeDeselected = function (node: any) {
            originalOnNodeDeselected?.call(this, node);
            scheduleSelectionChange();
        };

        cleanups.push(() => {
            try {
                if (hadOwnOnNodeSelected) canvas.onNodeSelected = originalOnNodeSelected;
                else delete canvas.onNodeSelected;
                if (hadOwnOnSelectionChange) canvas.onSelectionChange = originalOnSelectionChange;
                else delete canvas.onSelectionChange;
                if (hadOwnOnNodeDeselected) canvas.onNodeDeselected = originalOnNodeDeselected;
                else delete canvas.onNodeDeselected;
            } catch (e) {
                console.debug?.(e);
            }
        });
    }

    if (options.includePointerFallback !== false && canvas.canvas?.addEventListener) {
        const cleanup = _safeAddEventListener(canvas.canvas, "pointerup", scheduleSelectionChange);
        if (cleanup) cleanups.push(cleanup);
    }

    let disposed = false;
    return () => {
        if (disposed) return;
        disposed = true;
        for (const cleanup of cleanups.splice(0).reverse()) {
            cleanup();
        }
    };
}

export function wrapHostQueuePrompt(
    options: {
        api?: any;
        app?: any;
        owner?: any;
        createWrapper?: ((originalQueuePrompt: any, api: any) => any) | null;
    } = {},
): {
    api: any;
    owner: any;
    originalQueuePrompt: any;
    wrappedQueuePrompt: any;
    restore: () => boolean;
} | null {
    const api = options.api || getRawHostApi(options.app || _app || getComfyApp());
    const owner = options.owner || null;
    const createWrapper =
        typeof options.createWrapper === "function" ? options.createWrapper : null;
    if (!api || typeof api.queuePrompt !== "function" || !createWrapper) return null;

    const existingBinding = api.queuePrompt?.[HOST_QUEUE_PROMPT_BINDING_KEY] || null;
    if (existingBinding?.owner === owner) {
        return existingBinding;
    }
    if (existingBinding?.owner && existingBinding.owner !== owner) {
        return null;
    }

    const originalQueuePrompt = api.queuePrompt;
    const wrappedQueuePrompt = createWrapper(originalQueuePrompt, api);
    if (typeof wrappedQueuePrompt !== "function") return null;

    const binding = {
        api,
        owner,
        originalQueuePrompt,
        wrappedQueuePrompt,
        restore: () => {
            try {
                const activeBinding = api.queuePrompt?.[HOST_QUEUE_PROMPT_BINDING_KEY] || null;
                if (activeBinding?.owner !== owner) return false;
                api.queuePrompt = originalQueuePrompt;
                return true;
            } catch (e) {
                console.debug?.(e);
                return false;
            }
        },
    };

    Object.defineProperty(wrappedQueuePrompt, HOST_QUEUE_PROMPT_BINDING_KEY, {
        configurable: true,
        value: binding,
    });

    api.queuePrompt = wrappedQueuePrompt;
    return binding;
}

export async function interruptHostExecution(app: any = null): Promise<boolean> {
    const runtimeApp = app || _app || getComfyApp();
    const liveApi = runtimeApp?.api && typeof runtimeApp.api.interrupt === "function" ? runtimeApp.api : null;
    const api = liveApi || getRawHostApi(runtimeApp);
    if (api && typeof api.interrupt === "function") {
        await api.interrupt();
        return true;
    }
    if (api && typeof api.fetchApi === "function") {
        const resp = await api.fetchApi("/interrupt", { method: "POST" });
        if (!resp?.ok) throw new Error(`POST /interrupt failed (${resp?.status})`);
        return true;
    }
    const resp = await fetch("/interrupt", { method: "POST", credentials: "include" });
    if (!resp.ok) throw new Error(`POST /interrupt failed (${resp.status})`);
    return false;
}

function _getHostCanvas(app: any = null): any {
    const runtimeApp = app || _app || getComfyApp();
    return runtimeApp?.canvas || null;
}

export function getHostCanvas(app: any = null): any {
    return _getHostCanvas(app);
}

function _getHostGraph(app: any = null): any {
    const runtimeApp = app || _app || getComfyApp();
    return runtimeApp?.graph || runtimeApp?.canvas?.graph || null;
}

export function getHostGraph(app: any = null): any {
    return _getHostGraph(app);
}

function _cloneHostQueuedWidgetValue<T>(value: T): T {
    if (value == null || typeof value !== "object") return value;
    try {
        return typeof structuredClone === "function"
            ? structuredClone(value)
            : JSON.parse(JSON.stringify(value));
    } catch {
        return value;
    }
}

function _walkHostGraphNodes(graph: any, callback: (node: any) => void) {
    walkGraphNodes(graph, ({ node }) => callback(node));
}

function _captureHostQueuedWidgetSnapshots(graph: any): Array<{ widget: any; value: any }> {
    const snapshots: Array<{ widget: any; value: any }> = [];
    _walkHostGraphNodes(graph, (node: any) => {
        for (const widget of node?.widgets ?? []) {
            snapshots.push({ widget, value: _cloneHostQueuedWidgetValue(widget?.value) });
        }
    });
    return snapshots;
}

function _restoreHostQueuedWidgetSnapshots(
    app: any,
    snapshots: Array<{ widget: any; value: any }> | null,
) {
    for (const entry of Array.isArray(snapshots) ? snapshots : []) {
        const widget = entry?.widget;
        if (!widget || typeof widget !== "object") continue;
        const restoredValue = _cloneHostQueuedWidgetValue(entry?.value);
        try {
            widget.value = restoredValue;
        } catch (e) {
            console.debug?.(e);
            continue;
        }
        try {
            widget.callback?.(restoredValue);
        } catch (e) {
            console.debug?.(e);
        }
    }
    refreshHostCanvasGraph(app, { change: false });
}

function _resolveHostClientId(api: any, app: any): string {
    const candidates = [
        api?.clientId,
        api?.clientID,
        api?.client_id,
        app?.clientId,
        app?.clientID,
        app?.client_id,
    ];
    for (const value of candidates) {
        const safe = String(value || "").trim();
        if (safe) return safe;
    }
    return "";
}

function _readSelectedCanvasCollection(app: any = null): any {
    const canvas = _getHostCanvas(app);
    return canvas?.selected_nodes ?? canvas?.selectedNodes ?? null;
}

export function getSelectedHostCanvasNodes(app: any = null): any[] {
    const selected = _readSelectedCanvasCollection(app);
    if (!selected) return [];
    if (Array.isArray(selected)) return selected.filter(Boolean);
    if (selected instanceof Map) return Array.from(selected.values()).filter(Boolean);
    if (typeof selected === "object") return Object.values(selected).filter(Boolean);
    return [];
}

export function getSelectedHostCanvasNodeIds(app: any = null): string[] {
    return getSelectedHostCanvasNodes(app)
        .map((node: any) => String(node?.id ?? "").trim())
        .filter(Boolean);
}

export function getFirstSelectedHostCanvasNode(app: any = null): any {
    return getSelectedHostCanvasNodes(app)[0] || null;
}

export function refreshHostCanvasGraph(app: any = null, options: { draw?: boolean; change?: boolean } = {}): boolean {
    try {
        const runtimeApp = app || _app || getComfyApp();
        const canvas = _getHostCanvas(runtimeApp);
        const graph = _getHostGraph(runtimeApp);
        canvas?.setDirty?.(true, true);
        if (options.draw !== false) {
            canvas?.draw?.(true, true);
        }
        graph?.setDirtyCanvas?.(true, true);
        if (options.change !== false) {
            graph?.change?.();
        }
        return Boolean(canvas || graph);
    } catch (e) {
        console.debug?.(e);
        return false;
    }
}

export function notifyHostNodeGraphChanged(
    node: any,
    app: any = null,
    options: { draw?: boolean; change?: boolean } = {},
): boolean {
    try {
        const runtimeApp = app || _app || getComfyApp();
        const rootGraph = _getHostGraph(runtimeApp);
        const nodeGraph = node?.graph ?? null;
        if (nodeGraph && nodeGraph !== rootGraph) {
            nodeGraph.setDirtyCanvas?.(true, true);
            if (options.change !== false) {
                nodeGraph.change?.();
            }
        }
        return refreshHostCanvasGraph(runtimeApp, options);
    } catch (e) {
        console.debug?.(e);
        return false;
    }
}

export function addNodeToHostGraph(node: any, app: any = null): boolean {
    if (!node) return false;
    try {
        const runtimeApp = app || _app || getComfyApp();
        const graph = _getHostGraph(runtimeApp);
        if (!graph || typeof graph.add !== "function") return false;
        graph.add(node);
        notifyHostNodeGraphChanged(node, runtimeApp);
        return true;
    } catch (e) {
        console.debug?.(e);
        return false;
    }
}

function _getHostLiteGraph(app: any = null): any {
    try {
        const runtimeApp = app || _app || getComfyApp();
        const root = globalThis as typeof globalThis & {
            LiteGraph?: any;
            window?: { LiteGraph?: any };
        };
        return (
            runtimeApp?.LiteGraph ||
            runtimeApp?.ui?.LiteGraph ||
            runtimeApp?.canvas?.LiteGraph ||
            root?.LiteGraph ||
            root?.window?.LiteGraph ||
            null
        );
    } catch (e) {
        console.debug?.(e);
        return null;
    }
}

export function createHostNode(nodeType: any, app: any = null): any {
    const type = String(nodeType || "").trim();
    if (!type) return null;
    try {
        const LiteGraph = _getHostLiteGraph(app);
        if (!LiteGraph || typeof LiteGraph.createNode !== "function") return null;
        return LiteGraph.createNode(type) || null;
    } catch (e) {
        console.debug?.(e);
        return null;
    }
}

export function importWorkflowIntoHostCanvas(workflow: any, app: any = null): boolean {
    const runtimeApp = app || _app || getComfyApp();
    if (!workflow || typeof workflow !== "object") return false;
    try {
        if (typeof runtimeApp?.loadGraphData === "function") {
            runtimeApp.loadGraphData(workflow);
            return true;
        }
        const graph = _getHostGraph(runtimeApp);
        if (typeof graph?.configure === "function") {
            graph.configure(workflow);
            refreshHostCanvasGraph(runtimeApp, { draw: false, change: false });
            return true;
        }
    } catch (e) {
        console.debug?.(e);
    }
    return false;
}

/**
 * Import a workflow through the stable graph loading path.
 * New-tab APIs vary across ComfyUI frontend builds, so this avoids guessing
 * private tab methods that may not switch the active graph synchronously.
 */
export function importWorkflowPreferHostTab(
    workflow: any,
    app: any = null,
): { ok: boolean; mode: "new-tab" | "replace" | "none" } {
    const runtimeApp = app || _app || getComfyApp();
    if (!workflow || typeof workflow !== "object") return { ok: false, mode: "none" };
    try {
        if (importWorkflowIntoHostCanvas(workflow, runtimeApp)) {
            return { ok: true, mode: "replace" };
        }
    } catch (e) {
        console.debug?.(e);
    }
    return { ok: false, mode: "none" };
}

export function serializeCurrentHostWorkflow(app: any = null): any {
    try {
        const runtimeApp = app || _app || getComfyApp();
        if (typeof runtimeApp?.graphToPrompt === "function") {
            const data = runtimeApp.graphToPrompt();
            if (data?.workflow && typeof data.workflow === "object") return data.workflow;
        }
        const graph = _getHostGraph(runtimeApp);
        if (typeof graph?.serialize === "function") {
            const workflow = graph.serialize();
            if (workflow && typeof workflow === "object") return workflow;
        }
        const rootGraph = runtimeApp?.rootGraph || runtimeApp?.graph?.rootGraph || null;
        if (typeof rootGraph?.serialize === "function") {
            const workflow = rootGraph.serialize();
            if (workflow && typeof workflow === "object") return workflow;
        }
    } catch (e) {
        console.debug?.(e);
    }
    return null;
}

/**
 * Best-effort host dirty-state probe.
 * Returns:
 *   - true / false when a reliable host signal is available
 *   - null when no compatible signal can be detected
 */
export function isHostWorkflowDirty(app: any = null): boolean | null {
    try {
        const runtimeApp = app || _app || getComfyApp();
        if (!runtimeApp) return null;

        const candidates = [
            runtimeApp?.isDirty,
            runtimeApp?.dirty,
            runtimeApp?.graph?.isDirty,
            runtimeApp?.graph?.dirty,
            runtimeApp?.graph?.is_modified,
            runtimeApp?.graph?.modified,
            runtimeApp?.graph?.has_changed,
            runtimeApp?.graph?.changed,
        ];
        for (const candidate of candidates) {
            if (typeof candidate === "boolean") return candidate;
            if (typeof candidate === "number") return candidate !== 0;
            if (typeof candidate === "function") {
                try {
                    const value = candidate.call(runtimeApp?.graph || runtimeApp);
                    if (typeof value === "boolean") return value;
                    if (typeof value === "number") return value !== 0;
                } catch (e) {
                    console.debug?.(e);
                }
            }
        }
    } catch (e) {
        console.debug?.(e);
    }
    return null;
}

export async function queueHostPrompt(
    options: {
        app?: any;
        forceNativeQueue?: boolean;
        resolvePromptData?: ((app: any) => any | Promise<any>) | null;
        enrichPromptData?: ((promptData: any) => any) | null;
        buildPromptRequestBody?: ((promptData: any, context: { clientId: string }) => any) | null;
    } = {},
): Promise<boolean> {
    const app = options.app || _app || getComfyApp();
    if (!app) throw new Error("ComfyUI app not available");

    const api = getRawHostApi(app);
    const hasApiPath = Boolean(
        (api && typeof api.queuePrompt === "function") ||
            (api && typeof api.fetchApi === "function"),
    );

    if ((options.forceNativeQueue || !hasApiPath) && typeof app.queuePrompt === "function") {
        await app.queuePrompt(0);
        return true;
    }

    const rootGraph = getHostRootGraph(app);
    let widgetSnapshots: Array<{ widget: any; value: any }> | null = null;
    try {
        widgetSnapshots = _captureHostQueuedWidgetSnapshots(rootGraph);
        _walkHostGraphNodes(rootGraph, (node: any) => {
            for (const widget of node?.widgets ?? []) {
                widget.beforeQueued?.({ isPartialExecution: false });
            }
        });

        const resolver =
            typeof options.resolvePromptData === "function"
                ? options.resolvePromptData
                : (runtimeApp: any) => runtimeApp?.graphToPrompt?.();
        const promptData = await resolver(app);
        if (!promptData?.output) throw new Error("graphToPrompt returned empty output");

        const enriched =
            typeof options.enrichPromptData === "function"
                ? options.enrichPromptData(promptData)
                : promptData;

        if (api && typeof api.queuePrompt === "function") {
            await api.queuePrompt(0, enriched);
            _walkHostGraphNodes(rootGraph, (node: any) => {
                for (const widget of node?.widgets ?? []) {
                    widget.afterQueued?.({ isPartialExecution: false });
                }
            });
            refreshHostCanvasGraph(app, { change: false });
            return true;
        }

        const bodyBuilder =
            typeof options.buildPromptRequestBody === "function"
                ? options.buildPromptRequestBody
                : (pd: any, context: { clientId: string }) => {
                      const body: Record<string, any> = {
                          prompt: pd?.output,
                          extra_data: pd?.extra_data || {},
                      };
                      if (context.clientId) body.client_id = context.clientId;
                      return body;
                  };
        const body = bodyBuilder(promptData, { clientId: _resolveHostClientId(api, app) });

        if (api && typeof api.fetchApi === "function") {
            const resp = await api.fetchApi("/prompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!resp?.ok) throw new Error(`POST /prompt failed (${resp?.status})`);
            _walkHostGraphNodes(rootGraph, (node: any) => {
                for (const widget of node?.widgets ?? []) {
                    widget.afterQueued?.({ isPartialExecution: false });
                }
            });
            refreshHostCanvasGraph(app, { change: false });
            return true;
        }

        const resp = await fetch("/prompt", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!resp.ok) throw new Error(`POST /prompt failed (${resp.status})`);
        _walkHostGraphNodes(rootGraph, (node: any) => {
            for (const widget of node?.widgets ?? []) {
                widget.afterQueued?.({ isPartialExecution: false });
            }
        });
        refreshHostCanvasGraph(app, { change: false });
        return false;
    } catch (error) {
        _restoreHostQueuedWidgetSnapshots(app, widgetSnapshots);
        throw error;
    }
}

export function focusHostCanvasNode(
    node: any,
    options: { app?: any; select?: boolean; focusCanvas?: boolean } = {},
): boolean {
    if (!node) return false;
    try {
        const runtimeApp = options.app || _app || getComfyApp();
        const canvas = _getHostCanvas(runtimeApp);
        if (!canvas) return false;
        if (options.select !== false) {
            canvas.selectNode?.(node, false);
        }
        if (typeof canvas.centerOnNode === "function") {
            canvas.centerOnNode(node);
        } else if (node.pos && canvas.ds) {
            const canvasEl = canvas.canvas || canvas.element || null;
            const width = Number(canvasEl?.width || canvasEl?.clientWidth || 800) || 800;
            const height = Number(canvasEl?.height || canvasEl?.clientHeight || 600) || 600;
            const scale = Number(canvas.ds?.scale || 1) || 1;
            const nodeWidth = Number(node?.size?.[0] || 100) || 100;
            const nodeHeight = Number(node?.size?.[1] || 80) || 80;
            const offsetX = -Number(node.pos[0] || 0) + width / (2 * scale) - nodeWidth / 2;
            const offsetY = -Number(node.pos[1] || 0) + height / (2 * scale) - nodeHeight / 2;
            if (Array.isArray(canvas.ds.offset)) {
                canvas.ds.offset[0] = offsetX;
                canvas.ds.offset[1] = offsetY;
            } else if (canvas.ds.offset && typeof canvas.ds.offset === "object") {
                canvas.ds.offset.x = offsetX;
                canvas.ds.offset.y = offsetY;
            }
            canvas.setDirty?.(true, true);
        }
        if (options.focusCanvas !== false) {
            canvas.canvas?.focus?.();
        }
        return true;
    } catch (e) {
        console.debug?.(e);
        return false;
    }
}

export function centerHostCanvasNodeById(nodeId: any, app: any = null): boolean {
    const safeNodeId = String(nodeId || "").trim();
    if (!safeNodeId) return false;
    try {
        const runtimeApp = app || _app || getComfyApp();
        const node = findGraphNodeById(getHostRootGraph(runtimeApp), safeNodeId);
        if (!node) return false;
        return focusHostCanvasNode(node, { app: runtimeApp, select: false, focusCanvas: false });
    } catch (e) {
        console.debug?.(e);
        return false;
    }
}

// -- graph/canvas helpers -----------------------------------------------------

function _getMainCanvasState() {
    const app = _app || getComfyApp() || null;
    const graphCanvas = app?.canvas || null;
    const ds = graphCanvas?.ds || null;
    const canvas = graphCanvas?.canvas || graphCanvas?.el || null;
    if (!graphCanvas || !ds || !canvas) return null;
    const scale = Number(ds?.scale);
    const width = Number(canvas?.width || canvas?.clientWidth || 0);
    const height = Number(canvas?.height || canvas?.clientHeight || 0);
    if (!Number.isFinite(scale) || scale <= 0 || !(width > 0) || !(height > 0)) return null;
    return { app, graphCanvas, ds, scale, width, height };
}

function _setCanvasOffset(ds: any, x: any, y: any) {
    if (Array.isArray(ds?.offset)) {
        ds.offset[0] = x;
        ds.offset[1] = y;
        return true;
    }
    if (ds?.offset && typeof ds.offset === "object") {
        ds.offset.x = x;
        ds.offset.y = y;
        return true;
    }
    return false;
}

function _markCanvasDirty(app: any, graphCanvas: any) {
    try {
        graphCanvas?.setDirty?.(true, true);
    } catch (e) {
        console.debug?.(e);
    }
    try {
        app?.graph?.setDirtyCanvas?.(true, true);
    } catch (e) {
        console.debug?.(e);
    }
}

/**
 * Center the ComfyUI graph canvas on a world-space point.
 *
 * @param {{ x: number, y: number }} worldPoint
 * @returns {boolean}
 */
export function centerGraphCanvasOnWorldPoint(worldPoint: any) {
    try {
        const state = _getMainCanvasState();
        if (!state || !worldPoint) return false;
        const pointX = Number(worldPoint.x);
        const pointY = Number(worldPoint.y);
        if (!Number.isFinite(pointX) || !Number.isFinite(pointY)) return false;
        const dpr = Math.max(
            1,
            Number(globalThis?.devicePixelRatio ?? globalThis?.window?.devicePixelRatio) || 1,
        );
        const offsetX = -pointX + state.width * 0.5 / (state.scale * dpr);
        const offsetY = -pointY + state.height * 0.5 / (state.scale * dpr);
        if (!Number.isFinite(offsetX) || !Number.isFinite(offsetY)) return false;
        if (!_setCanvasOffset(state.ds, offsetX, offsetY)) return false;
        _markCanvasDirty(state.app, state.graphCanvas);
        return true;
    } catch (e) {
        console.debug?.(e);
        return false;
    }
}

/**
 * Return the current graph viewport in workflow/world coordinates.
 *
 * @returns {{ x0: number, y0: number, x1: number, y1: number } | null}
 */
export function getGraphCanvasViewportBounds() {
    try {
        const state = _getMainCanvasState();
        if (!state) return null;
        const off = state.ds?.offset;
        const offX = Array.isArray(off) ? Number(off[0]) : Number(off?.x);
        const offY = Array.isArray(off) ? Number(off[1]) : Number(off?.y);
        if (!Number.isFinite(offX) || !Number.isFinite(offY)) return null;
        return {
            x0: -offX / state.scale,
            y0: -offY / state.scale,
            x1: (state.width - offX) / state.scale,
            y1: (state.height - offY) / state.scale,
        };
    } catch (e) {
        console.debug?.(e);
        return null;
    }
}

// -- public API ----------------------------------------------------------------

export const hostAdapter = {
    init,
    isReady,
    ready,
    showToast,
    getHostToastApi,
    confirm,
    getHostDialogApi,
    getSetting,
    getSettingForApp,
    setSetting,
    setSettingForApp,
    getHostSettingsApi,
    registerSidebarTab,
    registerSidebarTabForApp,
    registerBottomPanelTab,
    registerBottomPanelTabForApp,
    activateSidebarTab,
    activateSidebarTabForApp,
    registerCommand,
    registerCommandForApp,
    registerKeybinding,
    registerKeybindingForApp,
    getHostExtensionManager,
    getRawHostApp,
    getRawHostApi,
    waitForRawHostApi,
    fetchHostApi,
    queueHostPrompt,
    observeHostCanvasSelection,
    wrapHostQueuePrompt,
    interruptHostExecution,
    getSelectedHostCanvasNodes,
    getSelectedHostCanvasNodeIds,
    getFirstSelectedHostCanvasNode,
    getHostCanvas,
    getHostGraph,
    refreshHostCanvasGraph,
    notifyHostNodeGraphChanged,
    importWorkflowIntoHostCanvas,
    importWorkflowPreferHostTab,
    isHostWorkflowDirty,
    serializeCurrentHostWorkflow,
    addNodeToHostGraph,
    createHostNode,
    focusHostCanvasNode,
    centerHostCanvasNodeById,
    centerGraphCanvasOnWorldPoint,
    getGraphCanvasViewportBounds,
};

export default hostAdapter;
