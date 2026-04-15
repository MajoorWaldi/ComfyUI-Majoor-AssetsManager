import { EVENTS } from "../../app/events.js";

export const ENTRY_RUNTIME_KEY = "__MJR_ENTRY_RUNTIME__";

export function removeApiHandlers(api, reportError) {
    if (!api) return;
    try {
        if (api._mjrAssetUpdateReloadTimer) {
            clearTimeout(api._mjrAssetUpdateReloadTimer);
            api._mjrAssetUpdateReloadTimer = null;
        }
        if (api._mjrExecutedHandler) {
            api.removeEventListener("executed", api._mjrExecutedHandler);
        }
        if (api._mjrAssetAddedHandler) {
            api.removeEventListener("mjr-asset-added", api._mjrAssetAddedHandler);
        }
        if (api._mjrAssetUpdatedHandler) {
            api.removeEventListener("mjr-asset-updated", api._mjrAssetUpdatedHandler);
        }
        if (api._mjrScanCompleteHandler) {
            api.removeEventListener(EVENTS.SCAN_COMPLETE, api._mjrScanCompleteHandler);
        }
        if (api._mjrScanProgressHandler) {
            api.removeEventListener(EVENTS.SCAN_PROGRESS, api._mjrScanProgressHandler);
        }
        if (api._mjrAssetIndexingHandler) {
            api.removeEventListener(EVENTS.ASSET_INDEXING, api._mjrAssetIndexingHandler);
        }
        if (api._mjrAssetIndexedHandler) {
            api.removeEventListener(EVENTS.ASSET_INDEXED, api._mjrAssetIndexedHandler);
        }
        if (api._mjrExecutionStartHandler) {
            api.removeEventListener("execution_start", api._mjrExecutionStartHandler);
        }
        if (api._mjrExecutionEndHandler) {
            api.removeEventListener("execution_success", api._mjrExecutionEndHandler);
            api.removeEventListener("execution_error", api._mjrExecutionEndHandler);
            api.removeEventListener("execution_interrupted", api._mjrExecutionEndHandler);
        }
        if (api._mjrStacksUpdatedHandler) {
            api.removeEventListener("mjr.stacks.updated", api._mjrStacksUpdatedHandler);
        }
        if (api._mjrEnrichmentStatusHandler) {
            api.removeEventListener(EVENTS.ENRICHMENT_STATUS, api._mjrEnrichmentStatusHandler);
        }
        if (api._mjrDbRestoreStatusHandler) {
            api.removeEventListener(EVENTS.DB_RESTORE_STATUS, api._mjrDbRestoreStatusHandler);
        }
        if (api._mjrRuntimeStatusHandler) {
            api.removeEventListener("progress", api._mjrRuntimeStatusHandler);
            api.removeEventListener("status", api._mjrRuntimeStatusHandler);
            api.removeEventListener(EVENTS.RUNTIME_STATUS, api._mjrRuntimeStatusHandler);
            api.removeEventListener("execution_cached", api._mjrExecutionCachedHandler);
        }
    } catch (error) {
        reportError?.(error, "entry.removeApiHandlers");
    }
}

export function removeRuntimeWindowHandlers(runtime, reportError) {
    try {
        const handler = runtime?.assetsDeletedHandler;
        if (handler && typeof window !== "undefined") {
            window.removeEventListener(EVENTS.ASSETS_DELETED, handler);
        }
    } catch (error) {
        reportError?.(error, "entry.removeRuntimeWindowHandlers");
    }
}

export function cleanupEntryRuntime(runtime, { reportError } = {}) {
    if (!runtime || typeof runtime !== "object") return;
    try {
        const cleanups = Array.isArray(runtime._listenerCleanupFns)
            ? runtime._listenerCleanupFns
            : [];
        for (const cleanup of cleanups) {
            try {
                cleanup?.();
            } catch (e) {
                console.debug?.(e);
            }
        }
        runtime._listenerCleanupFns = [];
    } catch (e) {
        console.warn("[MJR teardown]", e);
    }
    try {
        const controllers = Array.isArray(runtime._cleanupControllers)
            ? runtime._cleanupControllers
            : [];
        for (const controller of controllers) {
            try {
                controller?.abort?.();
            } catch (e) {
                console.debug?.(e);
            }
        }
        runtime._cleanupControllers = [];
    } catch (e) {
        console.warn("[MJR teardown]", e);
    }
    try {
        removeApiHandlers(runtime.api || null, reportError);
        removeRuntimeWindowHandlers(runtime, reportError);
    } catch (e) {
        console.warn("[MJR teardown]", e);
    }
}

export function registerCleanableListener(runtime, target, event, handler, options = undefined) {
    if (!runtime || !target?.addEventListener || typeof handler !== "function") return null;
    const listenerOptions = options && typeof options === "object" ? { ...options } : options;
    if (typeof AbortController !== "undefined") {
        try {
            const controller = new AbortController();
            const nextOptions =
                listenerOptions && typeof listenerOptions === "object"
                    ? { ...listenerOptions, signal: controller.signal }
                    : { signal: controller.signal };
            target.addEventListener(event, handler, nextOptions);
            runtime._cleanupControllers = Array.isArray(runtime._cleanupControllers)
                ? runtime._cleanupControllers
                : [];
            runtime._cleanupControllers.push(controller);
            return controller;
        } catch (e) {
            console.debug?.(e);
        }
    }
    target.addEventListener(event, handler, listenerOptions);
    runtime._listenerCleanupFns = Array.isArray(runtime._listenerCleanupFns)
        ? runtime._listenerCleanupFns
        : [];
    runtime._listenerCleanupFns.push(() => {
        try {
            target.removeEventListener(event, handler, listenerOptions);
        } catch (e) {
            console.debug?.(e);
        }
    });
    return null;
}

export function installEntryRuntimeController({
    cleanupEntryRuntimeFn = cleanupEntryRuntime,
    teardownLiveStreamTracker,
    teardownNodeStream,
    teardownFloatingViewerManager,
    teardownGeneratedFeed,
    teardownAssetsSidebar,
    teardownGlobalRuntime,
    teardownTopBarMfvButton,
    reportError,
}) {
    try {
        if (typeof window !== "undefined") {
            try {
                const prev = window[ENTRY_RUNTIME_KEY];
                cleanupEntryRuntimeFn(prev, { reportError });
            } catch (e) {
                console.warn("[MJR teardown]", e);
            }
            try {
                teardownLiveStreamTracker?.(window.__MJR_RUNTIME_APP__);
            } catch (e) {
                console.warn("[MJR teardown]", e);
            }
            try {
                teardownNodeStream?.(window.__MJR_RUNTIME_APP__);
            } catch (e) {
                console.warn("[MJR teardown]", e);
            }
            try {
                teardownFloatingViewerManager?.();
            } catch (e) {
                console.warn("[MJR teardown]", e);
            }
            try {
                teardownAssetsSidebar?.();
            } catch (e) {
                console.warn("[MJR teardown]", e);
            }
            try {
                teardownGeneratedFeed?.();
            } catch (e) {
                console.warn("[MJR teardown]", e);
            }
            try {
                teardownTopBarMfvButton?.();
            } catch (e) {
                console.warn("[MJR teardown]", e);
            }
            try {
                teardownGlobalRuntime?.();
            } catch (e) {
                console.warn("[MJR teardown]", e);
            }
            window[ENTRY_RUNTIME_KEY] = {
                api: null,
                assetsDeletedHandler: null,
                _cleanupControllers: [],
                _listenerCleanupFns: [],
            };
            window.__MJR_RUNTIME_APP__ = null;
        }
    } catch (e) {
        console.warn("[MJR teardown]", e);
    }
}
