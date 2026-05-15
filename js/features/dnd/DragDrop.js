/**
 * Drag & Drop support for staging assets to input.
 */

import { getComfyApp } from "../../app/comfyApiBridge.js";
import { get, post } from "../../api/client.js";
import { ENDPOINTS, buildCustomViewURL, buildViewURL } from "../../api/endpoints.js";
import { comfyToast } from "../../app/toast.js";
import { pickRootId } from "../../utils/ids.js";

import { DND_MIME, DND_MULTI_MIME } from "./utils/constants.js";
import { dndLog } from "./utils/log.js";
import { buildPayloadViewURL, getDraggedAsset, sanitizeDraggedPayload } from "./utils/payload.js";
import { isManagedPayload } from "./utils/video.js";
import {
    clearAssetDragStartCleanup,
    getAssetDragStartCleanup,
    markInternalDropOccurred,
    resetDndRuntimeState,
    setAssetDragStartCleanup,
} from "./runtimeState.js";
import { isCanvasDropTarget, markCanvasDirty } from "./targets/canvas.js";
import { applyDragOutToOS, handleDragEnd } from "./out/DragOut.js";
import {
    applyHighlight,
    clearHighlight,
    getNodeUnderClientXY,
    pickBestMediaPathWidget,
} from "./targets/node.js";
import { stageToInput, stageToInputDetailed } from "./staging/stageToInput.js";
import { createCanvasLoaderNodes, writeMediaPathWidgetValue } from "./canvasLoaderNode.js";

const _resolveApp = () => {
    const app = getComfyApp();
    return app && typeof app === "object" ? app : null;
};

const buildURL = (payload) => buildPayloadViewURL(payload, { buildCustomViewURL, buildViewURL });

let _stripMetadataDragKeyDown = false;
let _loadAssetDragKeyDown = false;

const _isTypingTarget = (target) => {
    try {
        return !!target?.closest?.("input, textarea, select, [contenteditable='true']");
    } catch {
        return false;
    }
};

const _isStripMetadataDragRequested = () => _stripMetadataDragKeyDown === true;
const _isLoadAssetDragRequested = () => _loadAssetDragKeyDown === true;

const _payloadKey = (payload) =>
    [
        String(payload?.type || "output"),
        String(payload?.filename || ""),
        String(payload?.subfolder || ""),
        String(pickRootId(payload) || ""),
    ].join("\n");

const _assetToPayload = (asset) => {
    if (!asset || typeof asset !== "object") return null;
    const filename = String(asset.filename || "").trim();
    if (!filename) return null;
    return {
        filename,
        subfolder: asset.subfolder || "",
        type: String(asset.type || "output").toLowerCase(),
        root_id: pickRootId(asset) || undefined,
        kind: String(asset.kind || "").toLowerCase(),
    };
};

const _getDraggedPayloads = (payload) => {
    const first = payload && typeof payload === "object" ? payload : null;
    if (!first) return [];
    try {
        const grid = window?.__MJR_LAST_SELECTION_GRID__;
        const selected =
            typeof grid?._mjrGetSelectedAssets === "function" ? grid._mjrGetSelectedAssets() : [];
        if (Array.isArray(selected) && selected.length > 1) {
            const payloads = selected.map(_assetToPayload).filter(isManagedPayload);
            const key = _payloadKey(first);
            if (payloads.some((entry) => _payloadKey(entry) === key)) return payloads;
        }
    } catch (e) {
        console.debug?.(e);
    }
    return [first];
};

const _getSelectedPayloadsForContainer = (containerEl, draggedPayload) => {
    try {
        const selected =
            typeof containerEl?._mjrGetSelectedAssets === "function"
                ? containerEl._mjrGetSelectedAssets()
                : [];
        if (!Array.isArray(selected) || selected.length <= 1) return [];
        const payloads = selected.map(_assetToPayload).filter(isManagedPayload);
        const key = _payloadKey(draggedPayload);
        return payloads.some((entry) => _payloadKey(entry) === key) ? payloads : [];
    } catch (e) {
        console.debug?.(e);
        return [];
    }
};

const _getDraggedMultiPayloads = (event, fallbackPayload) => {
    try {
        const raw = event?.dataTransfer?.getData?.(DND_MULTI_MIME) || "";
        if (raw) {
            const parsed = JSON.parse(raw);
            const list = Array.isArray(parsed?.items)
                ? parsed.items
                : Array.isArray(parsed)
                  ? parsed
                  : [];
            const payloads = list.map(sanitizeDraggedPayload).filter(isManagedPayload);
            if (payloads.length) return payloads;
        }
    } catch (e) {
        console.debug?.(e);
    }
    return _getDraggedPayloads(fallbackPayload);
};

const _stagePayloadsDetailed = async (payloads) => {
    const list = Array.isArray(payloads) ? payloads.filter(Boolean) : [];
    if (!list.length) return [];
    const staged = await Promise.all(
        list.map(async (payload) => {
            const result = await stageToInputDetailed({
                post,
                endpoint: ENDPOINTS.STAGE_TO_INPUT,
                payload,
                index: false,
            });
            const relativePath = result?.relativePath;
            if (!relativePath) return null;
            return {
                payload,
                relativePath,
                droppedExt:
                    String(payload?.filename || "")
                        .split(".")
                        .pop() || "",
            };
        }),
    );
    return staged.filter(Boolean);
};

// Workflow cache: filename -> { workflow, at }
const _workflowCache = new Map();
const WORKFLOW_CACHE_TTL_MS = 60_000; // 1 minute
const WORKFLOW_CACHE_MAX = 20; // Keep small to limit memory (workflows can be up to 5MB each)
const MAX_WORKFLOW_BYTES = 5 * 1024 * 1024;
const MAX_WORKFLOW_NODE_COUNT = 5000;
const MAX_WORKFLOW_LINK_COUNT = 20000;
const MAX_WORKFLOW_NODE_TYPE_LENGTH = 256;
const MAX_WORKFLOW_WIDGET_STRING_LENGTH = 8192;

const _NODE_TYPE_CTRL_RE = /[\u0000-\u001f\u007f]/;

const _NUL_RE = /\u0000/;

const _hasNodeTypeControlChars = (value) => _NODE_TYPE_CTRL_RE.test(String(value || ""));
const _hasNulByte = (value) => _NUL_RE.test(String(value || ""));

const _isSafeWorkflowNode = (node) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return false;
    const id = Number(node.id);
    if (!Number.isFinite(id)) return false;

    const nodeType = node.type == null ? "" : String(node.type);
    if (nodeType) {
        if (nodeType.length > MAX_WORKFLOW_NODE_TYPE_LENGTH) return false;
        if (_hasNodeTypeControlChars(nodeType)) return false;
    }

    const widgetsValues = node.widgets_values;
    if (Array.isArray(widgetsValues)) {
        for (const value of widgetsValues) {
            if (typeof value === "string") {
                if (value.length > MAX_WORKFLOW_WIDGET_STRING_LENGTH) return false;
                if (_hasNulByte(value)) return false;
            }
        }
    }

    return true;
};

const _isSafeWorkflowLink = (link) => {
    if (Array.isArray(link)) return link.length >= 4;
    if (link && typeof link === "object") {
        const id = Number(link.id);
        if (!Number.isFinite(id)) return false;
        return true;
    }
    return false;
};

const isValidWorkflowShape = (workflow) => {
    if (!workflow || typeof workflow !== "object") return false;
    if (!Array.isArray(workflow.nodes) || !Array.isArray(workflow.links)) return false;
    if (workflow.nodes.length > MAX_WORKFLOW_NODE_COUNT) return false;
    if (workflow.links.length > MAX_WORKFLOW_LINK_COUNT) return false;
    if (!workflow.nodes.every(_isSafeWorkflowNode)) return false;
    if (!workflow.links.every(_isSafeWorkflowLink)) return false;
    try {
        const size = JSON.stringify(workflow).length;
        if (!Number.isFinite(size) || size <= 0 || size > MAX_WORKFLOW_BYTES) return false;
    } catch {
        return false;
    }
    return true;
};

const cleanupWorkflowCache = () => {
    const now = Date.now();

    // Always remove expired entries
    for (const [key, value] of _workflowCache.entries()) {
        if (now - (value?.at || 0) > WORKFLOW_CACHE_TTL_MS) {
            _workflowCache.delete(key);
        }
    }

    // If still too large, remove oldest
    if (_workflowCache.size > WORKFLOW_CACHE_MAX) {
        const entries = Array.from(_workflowCache.entries()).sort(
            (a, b) => (a[1]?.at || 0) - (b[1]?.at || 0),
        );
        const toRemove = entries.slice(0, _workflowCache.size - WORKFLOW_CACHE_MAX);
        toRemove.forEach(([key]) => _workflowCache.delete(key));
    }
};

const tryLoadWorkflowToCanvas = async (payload, fallbackAbsPath = null) => {
    const pl = payload && typeof payload === "object" ? payload : null;
    const rootId = pickRootId(pl);
    const app = _resolveApp();

    // Check cache first
    const cacheKey = pl?.filename
        ? `${pl.type || "output"}:${pl.filename}:${pl.subfolder || ""}:${rootId}`
        : fallbackAbsPath
          ? `path:${fallbackAbsPath}`
          : null;

    if (cacheKey) {
        const cached = _workflowCache.get(cacheKey);
        const now = Date.now();

        if (cached && now - (cached.at || 0) < WORKFLOW_CACHE_TTL_MS) {
            if (cached.workflow && isValidWorkflowShape(cached.workflow)) {
                try {
                    if (typeof app?.loadGraphData === "function") {
                        app.loadGraphData(cached.workflow);
                        return true;
                    }
                    if (typeof app?.canvas?.graph?.configure === "function") {
                        app.canvas.graph.configure(cached.workflow);
                        try {
                            app.canvas.setDirty?.(true, true);
                        } catch (e) {
                            console.debug?.(e);
                        }
                        return true;
                    }
                    if (typeof app?.graph?.configure === "function") {
                        app.graph.configure(cached.workflow);
                        return true;
                    }
                } catch (e) {
                    console.debug?.(e);
                }
            }
            // Cached but no workflow (already tried and failed)
            return false;
        }
    }

    try {
        // Try ultra-fast workflow-quick endpoint first (direct SQL, no self-heal)
        // Falls back to slower metadata endpoint with workflow_only=1 if needed
        let url = null;
        let workflow = null;

        if (pl?.filename) {
            // First: try the fast endpoint (no self-heal, direct SQL)
            const quickUrl =
                `${ENDPOINTS.WORKFLOW_QUICK}?type=${encodeURIComponent(pl.type || "output")}` +
                `&filename=${encodeURIComponent(pl.filename)}` +
                `&subfolder=${encodeURIComponent(pl.subfolder || "")}` +
                (rootId ? `&root_id=${encodeURIComponent(rootId)}` : "");

            const quickRes = await get(quickUrl);
            if (quickRes?.ok && quickRes.workflow) {
                workflow = quickRes.workflow;
            }

            // Fallback to slower metadata endpoint if quick lookup didn't find it
            if (!workflow) {
                url =
                    `${ENDPOINTS.METADATA}?workflow_only=1&type=${encodeURIComponent(pl.type || "output")}` +
                    `&filename=${encodeURIComponent(pl.filename)}` +
                    `&subfolder=${encodeURIComponent(pl.subfolder || "")}` +
                    `&root_id=${encodeURIComponent(rootId)}`;
            }
        } else if (fallbackAbsPath) {
            // For absolute paths, use metadata endpoint (can't use quick lookup)
            url = `${ENDPOINTS.METADATA}?workflow_only=1&path=${encodeURIComponent(String(fallbackAbsPath))}`;
        }

        // If we need the fallback metadata endpoint
        if (!workflow && url) {
            const res = await get(url);
            if (!res?.ok || !res.data) {
                return false;
            }
            workflow = res.data?.workflow;
        }

        if (!isValidWorkflowShape(workflow)) {
            return false;
        }

        // Cache the workflow
        if (cacheKey) {
            _workflowCache.set(cacheKey, { workflow, at: Date.now() });
            cleanupWorkflowCache();
        }

        // Prefer ComfyUI helper if available; otherwise use LiteGraph configure.
        if (typeof app?.loadGraphData === "function") {
            app.loadGraphData(workflow);
            return true;
        }
        if (typeof app?.canvas?.graph?.configure === "function") {
            app.canvas.graph.configure(workflow);
            try {
                app.canvas.setDirty?.(true, true);
            } catch (e) {
                console.debug?.(e);
            }
            return true;
        }
        if (typeof app?.graph?.configure === "function") {
            app.graph.configure(workflow);
            return true;
        }
    } catch (e) {
        console.debug?.(e);
    }
    return false;
};

export function createAssetDragStartHandler(containerEl) {
    return (event) => {
        const dt = event?.dataTransfer;
        if (!dt) return;
        const card = event?.target?.closest?.(".mjr-asset-card");
        if (!card) return;

        const asset = card._mjrAsset;
        if (!asset || typeof asset !== "object") return;
        const kind = String(asset?.kind || "").toLowerCase();
        const type = String(asset?.type || "output").toLowerCase();
        const payload = {
            filename: asset.filename,
            subfolder: asset.subfolder || "",
            type,
            root_id: pickRootId(asset) || undefined,
            kind,
        };

        try {
            const stripMetadata = _isStripMetadataDragRequested();
            dt.setData(DND_MIME, JSON.stringify(payload));
            const selectedPayloads = _getSelectedPayloadsForContainer(containerEl, payload);
            if (selectedPayloads.length > 1) {
                dt.setData(DND_MULTI_MIME, JSON.stringify({ items: selectedPayloads }));
            }
            dt.setData("text/plain", String(asset.filename || ""));
            // Apply OS drag-out (DownloadURL + batch ZIP) for all asset kinds.
            // applyDragOutToOS handles single-file and multi-selection ZIP internally.
            const viewUrl = buildURL(payload);
            applyDragOutToOS({ dt, asset, containerEl, card, viewUrl, stripMetadata });
        } catch (e) {
            console.debug?.(e);
        }

        // Listen for dragend to distinguish internal drops from OS drops.
        try {
            card.addEventListener(
                "dragend",
                (endEvent) => {
                    handleDragEnd(endEvent, { asset, containerEl, card });
                },
                { once: true },
            );
        } catch (e) {
            console.debug?.(e);
        }

        const preview =
            card.querySelector("img") ||
            card.querySelector("video") ||
            card.querySelector("canvas");
        if (preview && preview instanceof HTMLElement) {
            try {
                dt.setDragImage(preview, 10, 10);
            } catch (e) {
                console.debug?.(e);
            }
        }
    };
}

export const bindAssetDragStart = (containerEl) => {
    if (!containerEl) return () => {};
    const existingCleanup = getAssetDragStartCleanup(containerEl);
    if (typeof existingCleanup === "function") {
        return existingCleanup;
    }

    const onDragStart = createAssetDragStartHandler(containerEl);

    containerEl.addEventListener("dragstart", onDragStart, true);

    const cleanup = () => {
        try {
            containerEl.removeEventListener("dragstart", onDragStart, true);
        } catch (e) {
            console.debug?.(e);
        }
        clearAssetDragStartCleanup(containerEl);
    };

    return setAssetDragStartCleanup(containerEl, cleanup);
};

let _dragDropRuntime = null;
let _dragDropRuntimeRefCount = 0;

export function createDragDropRuntimeHandlers() {
    const onKeyDown = (event) => {
        if (_isTypingTarget(event?.target)) return;
        const key = String(event?.key || "").toLowerCase();
        if (key === "s") {
            _stripMetadataDragKeyDown = true;
        } else if (key === "l") {
            _loadAssetDragKeyDown = true;
        }
    };

    const onKeyUp = (event) => {
        const key = String(event?.key || "").toLowerCase();
        if (key === "s") {
            _stripMetadataDragKeyDown = false;
        } else if (key === "l") {
            _loadAssetDragKeyDown = false;
        }
    };

    const onWindowBlur = () => {
        _stripMetadataDragKeyDown = false;
        _loadAssetDragKeyDown = false;
    };

    const onDragOver = (event) => {
        const app = _resolveApp();
        const types = Array.from(event?.dataTransfer?.types || []);
        if (!types.includes(DND_MIME)) return;
        const payload = getDraggedAsset(event, DND_MIME);
        if (!isManagedPayload(payload)) return;

        const node = getNodeUnderClientXY(app, event.clientX, event.clientY);
        const droppedExt =
            String(payload?.filename || "")
                .split(".")
                .pop() || "";
        const widget = node ? pickBestMediaPathWidget(node, payload, droppedExt) : null;

        if (node && widget) {
            event.preventDefault();
            event.stopImmediatePropagation?.();
            event.stopPropagation();
            applyHighlight(app, node, markCanvasDirty);
            event.dataTransfer.dropEffect = "copy";
            dndLog("dragover", { node: node?.title, widget: widget?.name });
            return;
        }

        clearHighlight(app, markCanvasDirty);
        if (!isCanvasDropTarget(app, event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
    };

    const onDrop = async (event) => {
        const app = _resolveApp();
        const types = Array.from(event?.dataTransfer?.types || []);
        if (!types.includes(DND_MIME)) return;
        const payload = getDraggedAsset(event, DND_MIME);
        if (!isManagedPayload(payload)) return;
        if (!isCanvasDropTarget(app, event)) return;

        // Mark only validated Majoor canvas drops as internal. Marking arbitrary
        // browser drops would leak this flag into the next dragend decision.
        markInternalDropOccurred();

        const forceLoaderNode = _isLoadAssetDragRequested();
        const payloads = forceLoaderNode ? _getDraggedMultiPayloads(event, payload) : [payload];

        const node = getNodeUnderClientXY(app, event.clientX, event.clientY);
        const droppedExt =
            String(payload?.filename || "")
                .split(".")
                .pop() || "";
        const widget = node ? pickBestMediaPathWidget(node, payload, droppedExt) : null;

        if (!node || !widget) {
            clearHighlight(app, markCanvasDirty);
            event.preventDefault();
            event.stopImmediatePropagation?.();
            event.stopPropagation();

            if (forceLoaderNode) {
                const stagedItems = await _stagePayloadsDetailed(payloads);
                const created = createCanvasLoaderNodes({ app, items: stagedItems, event });
                if (created > 0) {
                    dndLog("drop canvas created loaders", { count: created });
                    return;
                }
                comfyToast(`Failed to load file: "${payload?.filename}". Staging failed.`, "error");
                return;
            }

            // Run staging + workflow extraction in parallel for normal drops.
            const stagePromise = stageToInputDetailed({
                post,
                endpoint: ENDPOINTS.STAGE_TO_INPUT,
                payload,
                index: false,
            });
            const workflowPromise = tryLoadWorkflowToCanvas(payload);

            const [loaded, staged] = await Promise.all([workflowPromise, stagePromise]);

            if (loaded) {
                dndLog("drop canvas loaded workflow", { file: payload?.filename });
                // Staging has already completed in parallel; no further UI needed here.
                return;
            }

            const relativePath = staged?.relativePath;
            if (!relativePath) {
                dndLog("drop canvas stage failed");
                comfyToast(`Failed to load file: "${payload?.filename}". Staging failed.`, "error");
                return;
            }
            dndLog("drop canvas staged", { value: relativePath });
            if (createCanvasLoaderNodes({ app, items: [{ payload, relativePath, droppedExt }], event })) {
                dndLog("drop canvas created loader", { value: relativePath });
                return;
            }
            comfyToast(`Staged to input: ${relativePath}`, "success", 4000);
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation?.();
        event.stopPropagation();
        clearHighlight(app, markCanvasDirty);

        const relativePath = await stageToInput({
            post,
            endpoint: ENDPOINTS.STAGE_TO_INPUT,
            payload,
            index: false,
        });
        if (!relativePath) return;

        writeMediaPathWidgetValue(widget, relativePath);

        markCanvasDirty(app);
        dndLog("drop inject", { node: node?.title, widget: widget?.name, value: relativePath });
    };

    const onDragLeave = () => {
        const app = _resolveApp();
        clearHighlight(app, markCanvasDirty);
        dndLog("dragleave");
    };

    return {
        onKeyDown,
        onKeyUp,
        onWindowBlur,
        onDragOver,
        onDrop,
        onDragLeave,
    };
}

function createDragDropRuntime() {
    if (typeof window === "undefined" || !window?.addEventListener) {
        return { dispose() {} };
    }

    const { onKeyDown, onKeyUp, onWindowBlur, onDragOver, onDrop, onDragLeave } =
        createDragDropRuntimeHandlers();

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", onWindowBlur, true);
    window.addEventListener("dragover", onDragOver, true);
    window.addEventListener("drop", onDrop, true);
    window.addEventListener("dragleave", onDragLeave, true);

    const dispose = () => {
        try {
            window.removeEventListener("keydown", onKeyDown, true);
            window.removeEventListener("keyup", onKeyUp, true);
            window.removeEventListener("blur", onWindowBlur, true);
            window.removeEventListener("dragover", onDragOver, true);
            window.removeEventListener("drop", onDrop, true);
            window.removeEventListener("dragleave", onDragLeave, true);
        } catch (e) {
            console.debug?.(e);
        }

        _stripMetadataDragKeyDown = false;
        _loadAssetDragKeyDown = false;

        try {
            clearHighlight(_resolveApp(), markCanvasDirty);
        } catch (e) {
            console.debug?.(e);
        }
    };

    return { dispose };
}

export function installDragDropRuntime() {
    if (!_dragDropRuntime) {
        _dragDropRuntime = createDragDropRuntime();
        _dragDropRuntimeRefCount = 0;
    }
    _dragDropRuntimeRefCount += 1;

    let disposed = false;
    return ({ force = false } = {}) => {
        if (disposed) return;
        disposed = true;
        teardownDragDropRuntime({ force });
    };
}

export function teardownDragDropRuntime({ force = false } = {}) {
    if (!_dragDropRuntime) {
        _dragDropRuntimeRefCount = 0;
        resetDndRuntimeState();
        return;
    }

    if (!force && _dragDropRuntimeRefCount > 1) {
        _dragDropRuntimeRefCount -= 1;
        return;
    }

    _dragDropRuntimeRefCount = 0;
    try {
        _dragDropRuntime.dispose?.();
    } catch (e) {
        console.debug?.(e);
    }
    _dragDropRuntime = null;
    resetDndRuntimeState();
}

export function getDragDropRuntimeState() {
    return {
        installed: !!_dragDropRuntime,
        refCount: _dragDropRuntimeRefCount,
    };
}

export const initDragDrop = installDragDropRuntime;
