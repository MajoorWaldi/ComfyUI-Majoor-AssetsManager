/**
 * Drag & Drop support for staging assets to input (video-focused).
 */

import { app } from "../../../../scripts/app.js";
import { get, post } from "../../api/client.js";
import { ENDPOINTS, buildCustomViewURL, buildViewURL } from "../../api/endpoints.js";
import { comfyAlert } from "../../app/dialogs.js";
import { smartUploadToInput } from "../../utils/fastUpload.js";

import { DND_GLOBAL_KEY, DND_INSTANCE_VERSION, DND_MIME } from "./utils/constants.js";
import { dndLog } from "./utils/log.js";
import { buildPayloadViewURL, getDraggedAsset } from "./utils/payload.js";
import { getDownloadMimeForFilename, isVideoPayload } from "./utils/video.js";
import { isCanvasDropTarget, markCanvasDirty } from "./targets/canvas.js";
import {
    applyHighlight,
    clearHighlight,
    ensureComboHasValue,
    getNodeUnderClientXY,
    pickBestVideoPathWidget,
    pickBestImagePathWidget
} from "./targets/node.js";
import { stageToInput, stageToInputDetailed } from "./staging/stageToInput.js";

const buildURL = (payload) =>
    buildPayloadViewURL(payload, { buildCustomViewURL, buildViewURL });

// Helper to check if payload is an image
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.tiff', '.tif']);
const isImagePayload = (payload) => {
    if (!payload) return false;
    if (payload.kind === "image") return true;
    const filename = String(payload.filename || "").toLowerCase();
    const ext = filename.substring(filename.lastIndexOf('.'));
    return IMAGE_EXTS.has(ext);
};

// Workflow cache: filename -> { workflow, at }
const _workflowCache = new Map();
const WORKFLOW_CACHE_TTL_MS = 60_000; // 1 minute
const WORKFLOW_CACHE_MAX = 100;

const cleanupWorkflowCache = () => {
    if (_workflowCache.size <= WORKFLOW_CACHE_MAX) return;
    const now = Date.now();

    // Remove expired first
    for (const [key, value] of _workflowCache.entries()) {
        if (now - (value?.at || 0) > WORKFLOW_CACHE_TTL_MS) {
            _workflowCache.delete(key);
        }
    }

    // If still too large, remove oldest
    if (_workflowCache.size > WORKFLOW_CACHE_MAX) {
        const entries = Array.from(_workflowCache.entries())
            .sort((a, b) => (a[1]?.at || 0) - (b[1]?.at || 0));
        const toRemove = entries.slice(0, _workflowCache.size - WORKFLOW_CACHE_MAX);
        toRemove.forEach(([key]) => _workflowCache.delete(key));
    }
};

const tryLoadWorkflowToCanvas = async (payload, fallbackAbsPath = null) => {
    const pl = payload && typeof payload === "object" ? payload : null;

    // Check cache first
    const cacheKey = pl?.filename
        ? `${pl.type || "output"}:${pl.filename}:${pl.subfolder || ""}:${pl.root_id || pl.rootId || pl.custom_root_id || ""}`
        : fallbackAbsPath ? `path:${fallbackAbsPath}` : null;

    if (cacheKey) {
        const cached = _workflowCache.get(cacheKey);
        const now = Date.now();

        if (cached && now - (cached.at || 0) < WORKFLOW_CACHE_TTL_MS) {
            if (cached.workflow) {
                try {
                    if (typeof app?.loadGraphData === "function") {
                        app.loadGraphData(cached.workflow);
                        return true;
                    }
                    if (typeof app?.canvas?.graph?.configure === "function") {
                        app.canvas.graph.configure(cached.workflow);
                        try {
                            app.canvas.setDirty?.(true, true);
                        } catch {}
                        return true;
                    }
                    if (typeof app?.graph?.configure === "function") {
                        app.graph.configure(cached.workflow);
                        return true;
                    }
                } catch {}
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
            const quickUrl = `${ENDPOINTS.WORKFLOW_QUICK}?type=${encodeURIComponent(pl.type || "output")}` +
                `&filename=${encodeURIComponent(pl.filename)}` +
                `&subfolder=${encodeURIComponent(pl.subfolder || "")}` +
                (pl.root_id || pl.rootId || pl.custom_root_id ? `&root_id=${encodeURIComponent(pl.root_id || pl.rootId || pl.custom_root_id || "")}` : "");

            const quickRes = await get(quickUrl);
            if (quickRes?.ok && quickRes.workflow) {
                workflow = quickRes.workflow;
            }

            // Fallback to slower metadata endpoint if quick lookup didn't find it
            if (!workflow) {
                url = `${ENDPOINTS.METADATA}?workflow_only=1&type=${encodeURIComponent(pl.type || "output")}` +
                    `&filename=${encodeURIComponent(pl.filename)}` +
                    `&subfolder=${encodeURIComponent(pl.subfolder || "")}` +
                    `&root_id=${encodeURIComponent(pl.root_id || pl.rootId || pl.custom_root_id || "")}`;
            }
        } else if (fallbackAbsPath) {
            // For absolute paths, use metadata endpoint (can't use quick lookup)
            url = `${ENDPOINTS.METADATA}?workflow_only=1&path=${encodeURIComponent(String(fallbackAbsPath))}`;
        }

        // If we need the fallback metadata endpoint
        if (!workflow && url) {
            const res = await get(url);
            if (!res?.ok || !res.data) {
                // Cache negative result to avoid retrying
                if (cacheKey) {
                    _workflowCache.set(cacheKey, { workflow: null, at: Date.now() });
                    cleanupWorkflowCache();
                }
                return false;
            }
            workflow = res.data?.workflow;
        }

        if (!workflow || typeof workflow !== "object") {
            // Cache negative result
            if (cacheKey) {
                _workflowCache.set(cacheKey, { workflow: null, at: Date.now() });
                cleanupWorkflowCache();
            }
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
            } catch {}
            return true;
        }
        if (typeof app?.graph?.configure === "function") {
            app.graph.configure(workflow);
            return true;
        }
    } catch {}
    return false;
};

export const enableAssetDrag = (cardEl, asset) => {
    if (!cardEl) return;
    // Deprecated for grid rendering: prefer `bindAssetDragStart(container)` so we don't
    // attach a dragstart handler per card (large perf win for big grids).
    cardEl.draggable = true;
    cardEl.addEventListener("dragstart", (event) => {
        if (!event.dataTransfer) return;
        const type = String(asset?.type || "output").toLowerCase();
        const payload = {
            filename: asset.filename,
            subfolder: asset.subfolder || "",
            type,
            root_id: asset?.root_id || asset?.rootId || asset?.custom_root_id || undefined,
            kind: asset.kind
        };
        event.dataTransfer.setData(DND_MIME, JSON.stringify(payload));
        event.dataTransfer.setData("text/plain", asset.filename);

        const viewUrl = buildURL(payload);
        event.dataTransfer.setData("text/uri-list", viewUrl);

        // Add download URL for drag-out to Windows Explorer
        const downloadUrl = `${ENDPOINTS.DOWNLOAD}?asset_id=${asset.id || ''}&filename=${encodeURIComponent(asset.filename || '')}`;
        const mime = getDownloadMimeForFilename(asset.filename);
        event.dataTransfer.setData("DownloadURL", `${mime}:${asset.filename}:${downloadUrl}`);
        event.dataTransfer.effectAllowed = "copy";

        const preview = cardEl.querySelector("img") || cardEl.querySelector("video");
        if (preview && preview instanceof HTMLElement) {
            event.dataTransfer.setDragImage(preview, 10, 10);
        }
    });
};

export const bindAssetDragStart = (containerEl) => {
    if (!containerEl) return;
    if (containerEl._mjrAssetDragStartBound) return;
    containerEl._mjrAssetDragStartBound = true;

    containerEl.addEventListener(
        "dragstart",
        (event) => {
            const dt = event?.dataTransfer;
            if (!dt) return;
            const card = event?.target?.closest?.(".mjr-asset-card");
            if (!card) return;

            const asset = card._mjrAsset;
            if (!asset || typeof asset !== "object") return;

            const type = String(asset?.type || "output").toLowerCase();
            const payload = {
                filename: asset.filename,
                subfolder: asset.subfolder || "",
                type,
                root_id: asset?.root_id || asset?.rootId || asset?.custom_root_id || undefined,
                kind: asset.kind
            };

            try {
                dt.setData(DND_MIME, JSON.stringify(payload));
                dt.setData("text/plain", String(asset.filename || ""));
                const viewUrl = buildURL(payload);
                dt.setData("text/uri-list", viewUrl);

                // Add download URL for drag-out to Windows Explorer
                const downloadUrl = `${ENDPOINTS.DOWNLOAD}?asset_id=${asset.id || ''}&filename=${encodeURIComponent(asset.filename || '')}`;
                const mime = getDownloadMimeForFilename(asset.filename);
                dt.setData("DownloadURL", `${mime}:${asset.filename}:${downloadUrl}`);
                dt.effectAllowed = "copy";
            } catch {}

            const preview = card.querySelector("img") || card.querySelector("video");
            if (preview && preview instanceof HTMLElement) {
                try {
                    dt.setDragImage(preview, 10, 10);
                } catch {}
            }
        },
        true
    );
};

export const initDragDrop = () => {
    const existing = (() => {
        try {
            return window?.[DND_GLOBAL_KEY] || null;
        } catch {
            return null;
        }
    })();

    // If a previous version is already installed, remove it and replace with the current one.
    if (existing?.initialized) {
        if (existing.version === DND_INSTANCE_VERSION) {
            return existing.dispose || (() => {});
        }
        try {
            existing.dispose?.({ force: true });
        } catch {}
    }

    const onDragOver = (event) => {
        const types = Array.from(event?.dataTransfer?.types || []);
        if (!types.includes(DND_MIME)) return;
        const payload = getDraggedAsset(event, DND_MIME);
        if (!payload) return;

        // Route to appropriate widget picker based on payload type
        const node = getNodeUnderClientXY(app, event.clientX, event.clientY);
        const droppedExt = String(payload?.filename || "").split(".").pop() || "";
        let widget = null;

        if (isVideoPayload(payload)) {
            widget = node ? pickBestVideoPathWidget(node, droppedExt) : null;
        } else if (isImagePayload(payload)) {
            widget = node ? pickBestImagePathWidget(node, droppedExt) : null;
        }

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
        const types = Array.from(event?.dataTransfer?.types || []);

        // Check if this is a file drop from OS (not from our asset manager)
        if (types.includes("Files")) {
            // Handle direct file drop from OS
            event.preventDefault();
            event.stopImmediatePropagation?.();
            event.stopPropagation();

            const files = Array.from(event.dataTransfer.files || []);
            if (files.length === 0) return;

            // Process the first file (we typically handle one at a time)
            const file = files[0];

            try {
                // Show immediate feedback
                const node = getNodeUnderClientXY(app, event.clientX, event.clientY);
                if (node) {
                    // Set widget to "Uploading…" placeholder
                    const droppedExt = String(file.name || "").split(".").pop() || "";
                    // Route to appropriate widget picker based on file type
                    const filename = String(file.name || "").toLowerCase();
                    const ext = filename.substring(filename.lastIndexOf('.'));
                    let widget = null;
                    if (IMAGE_EXTS.has(ext)) {
                        widget = pickBestImagePathWidget(node, droppedExt);
                    } else {
                        widget = pickBestVideoPathWidget(node, droppedExt);
                    }

                    if (widget) {
                        const oldValue = widget.value;
                        widget.value = "Uploading…";
                        try {
                            widget.callback?.(widget.value);
                        } catch {}

                        // Upload the file using the fast path
                        const result = await smartUploadToInput(file, "node_drop");
                        const fileName = result.name || file.name;

                        // Update widget with the actual filename
                        if (widget.type === "combo") ensureComboHasValue(widget, fileName);
                        widget.value = fileName;
                        try {
                            widget.callback?.(widget.value);
                        } catch {}

                        markCanvasDirty(app);
                        dndLog("file drop inject", { node: node?.title, widget: widget?.name, value: fileName });
                    }
                }
            } catch (error) {
                console.error("Majoor: File upload failed", error);
                dndLog("file drop failed", { error: error.message });
            }
            return;
        }

        // Original logic for assets dragged from our manager
        if (!types.includes(DND_MIME)) return;
        const payload = getDraggedAsset(event, DND_MIME);
        if (!payload) return;
        if (!isCanvasDropTarget(app, event)) return;

        const node = getNodeUnderClientXY(app, event.clientX, event.clientY);
        const droppedExt = String(payload?.filename || "").split(".").pop() || "";

        // Route to appropriate widget picker based on payload type
        let widget = null;
        if (isVideoPayload(payload)) {
            widget = node ? pickBestVideoPathWidget(node, droppedExt) : null;
        } else if (isImagePayload(payload)) {
            widget = node ? pickBestImagePathWidget(node, droppedExt) : null;
        }

        if (!node || !widget) {
            clearHighlight(app, markCanvasDirty);
            event.preventDefault();
            event.stopImmediatePropagation?.();
            event.stopPropagation();

            // Run staging + workflow extraction in TRUE parallel for best UX.
            const stagePromise = stageToInputDetailed({
                post,
                endpoint: ENDPOINTS.STAGE_TO_INPUT,
                payload,
                index: false,
                purpose: "node_drop"  // Fast path - skip indexing for node drops
            });
            const workflowPromise = tryLoadWorkflowToCanvas(payload);

            // Execute both in parallel (max performance)
            const [loaded, staged] = await Promise.all([workflowPromise, stagePromise]);

            if (loaded) {
                dndLog("drop canvas loaded workflow", { file: payload?.filename });
                // Staging has already completed in parallel; no further UI needed here.
                return;
            }

            const relativePath = staged?.relativePath;
            if (!relativePath) {
                dndLog("drop canvas stage failed");
                return;
            }
            dndLog("drop canvas staged", { value: relativePath });
            await comfyAlert(
                `Staged to input: ${relativePath}\n\nTip: drop onto a video node to inject the path automatically.`,
                "Majoor"
            );
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
            purpose: "node_drop"  // Fast path - skip indexing for node drops
        });
        if (!relativePath) return;

        if (widget.type === "combo") ensureComboHasValue(widget, relativePath);
        widget.value = relativePath;
        try {
            widget.callback?.(widget.value);
        } catch {}

        markCanvasDirty(app);
        dndLog("drop inject", { node: node?.title, widget: widget?.name, value: relativePath });
    };

    const onDragLeave = () => {
        clearHighlight(app, markCanvasDirty);
        dndLog("dragleave");
    };

    window.addEventListener("dragover", onDragOver, true);
    window.addEventListener("drop", onDrop, true);
    window.addEventListener("dragleave", onDragLeave, true);

    const dispose = ({ force = false } = {}) => {
        const state = (() => {
            try {
                return window?.[DND_GLOBAL_KEY] || null;
            } catch {
                return null;
            }
        })();

        // Only uninstall if this instance is still the active one.
        if (!force && state?.dispose !== dispose) return;

        try {
            window.removeEventListener("dragover", onDragOver, true);
            window.removeEventListener("drop", onDrop, true);
            window.removeEventListener("dragleave", onDragLeave, true);
        } catch {}

        try {
            clearHighlight(app, markCanvasDirty);
        } catch {}

        try {
            if (window?.[DND_GLOBAL_KEY]?.dispose === dispose) {
                delete window[DND_GLOBAL_KEY];
            }
        } catch {}
    };

    try {
        window[DND_GLOBAL_KEY] = {
            initialized: true,
            version: DND_INSTANCE_VERSION,
            dispose
        };
    } catch {}

    return dispose;
};

export const DND_CONSTANTS = {
    DND_MIME
};
