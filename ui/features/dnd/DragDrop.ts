/**
 * Drag & Drop support for staging assets to input.
 */

import { get, post } from "../../api/client.js";
import { ENDPOINTS, buildCustomViewURL, buildViewURL } from "../../api/endpoints.js";
import { getRawHostApp } from "../../app/hostAdapter.js";
import { comfyToast } from "../../app/toast.js";
import { pickRootId } from "../../utils/ids.js";
import { toPosixPath } from "../../utils/path.js";

import { COMFY_ASSET_INFO_MIME, DND_MIME, DND_MULTI_MIME } from "./utils/constants.js";
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
    getInputSlotUnderClientXY,
} from "./targets/node.js";
import { stageToInput, stageToInputDetailed } from "./staging/stageToInput.js";
import {
    createCanvasLoaderNodes,
    writeMediaPathWidgetValue,
    createLoaderAndConnect,
} from "./canvasLoaderNode.js";

const _resolveApp = () => {
    const app = getRawHostApp();
    return app && typeof app === "object" ? app : null;
};

const buildURL = (payload: any) => buildPayloadViewURL(payload, { buildCustomViewURL, buildViewURL });

let _stripMetadataDragKeyDown = false;
let _loadAssetDragKeyDown = false;

const _isTypingTarget = (target: any) => {
    try {
        return !!target?.closest?.("input, textarea, select, [contenteditable='true']");
    } catch {
        return false;
    }
};

const _isStripMetadataDragRequested = () => _stripMetadataDragKeyDown === true;
const _isLoadAssetDragRequested = () => _loadAssetDragKeyDown === true;

const _payloadKey = (payload: any) =>
    [
        String(payload?.type || "output"),
        String(payload?.filename || ""),
        String(payload?.subfolder || ""),
        String(pickRootId(payload) || ""),
    ].join("\n");

const _deriveNativeLocationFromPath = (asset: any, filename: string) => {
    const explicitType = String(asset?.type || asset?.file_info?.type || "").toLowerCase();
    if (explicitType === "custom") return null;
    const rawPath = toPosixPath(
        String(
            asset?.filepath ||
                asset?.path ||
                asset?.fullpath ||
                asset?.full_path ||
                asset?.file_info?.filepath ||
                asset?.file_info?.path ||
                "",
        ),
    ).trim();
    if (!rawPath || !filename) return null;

    const lowerPath = rawPath.toLowerCase();
    const lowerFilename = filename.toLowerCase();
    const buckets = [
        { marker: "/output/", type: "output" },
        { marker: "/input/", type: "input" },
        { marker: "/temp/", type: "temp" },
    ];
    for (const bucket of buckets) {
        const markerIndex = lowerPath.lastIndexOf(bucket.marker);
        if (markerIndex < 0) continue;
        const relative = rawPath.slice(markerIndex + bucket.marker.length);
        const relativeLower = relative.toLowerCase();
        if (relativeLower !== lowerFilename && !relativeLower.endsWith(`/${lowerFilename}`)) {
            continue;
        }
        const slashIndex = relative.lastIndexOf("/");
        return {
            type: bucket.type,
            subfolder: slashIndex > 0 ? relative.slice(0, slashIndex) : "",
        };
    }
    return null;
};

const _assetToPayload = (asset: any) => {
    if (!asset || typeof asset !== "object") return null;
    const filename = String(asset.filename || "").trim();
    if (!filename) return null;
    const nativeLocation = _deriveNativeLocationFromPath(asset, filename);
    return {
        filename,
        subfolder: nativeLocation?.subfolder ?? asset.subfolder ?? "",
        type: nativeLocation?.type ?? String(asset.type || "output").toLowerCase(),
        root_id: pickRootId(asset) || undefined,
        kind: String(asset.kind || "").toLowerCase(),
    };
};

const _setDataTransferData = (dt: any, mimeType: any, value: any) => {
    if (!dt || !mimeType || value == null) return false;
    const text = String(value);
    try {
        if (typeof dt.setData === "function") {
            dt.setData(mimeType, text);
            return true;
        }
    } catch (e: any) {
        console.debug?.(e);
    }
    try {
        if (typeof dt.items?.add === "function") {
            dt.items.add(text, mimeType);
            return true;
        }
    } catch (e: any) {
        console.debug?.(e);
    }
    return false;
};

const _setComfyNativeDragFallbacks = ({  dt, asset, payload, viewUrl  }: any) => {
    if (!dt || !asset || !payload) return;
    const comfyKind = String(payload.kind || "").toLowerCase() === "model3d" ? "3D" : payload.kind;
    const comfyAssetInfo = {
        id: asset.id == null ? _payloadKey(payload) : String(asset.id),
        name: asset.filename || payload.filename,
        display_name: asset.filename || payload.filename,
        filename: payload.filename,
        subfolder: payload.subfolder || "",
        type: payload.type || "output",
        kind: comfyKind || undefined,
        preview_url: viewUrl || undefined,
        thumbnail_url: asset.thumbnail_url || asset.thumbnailUrl || asset.preview_url || undefined,
        user_metadata: {
            filename: payload.filename,
            subfolder: payload.subfolder || "",
            type: payload.type || "output",
        },
        tags: Array.isArray(asset.tags) ? asset.tags : [],
    };
    _setDataTransferData(dt, COMFY_ASSET_INFO_MIME, JSON.stringify(comfyAssetInfo));
    if (viewUrl) _setDataTransferData(dt, "text/uri-list", viewUrl);
};

const _getDraggedPayloads = (payload: any) => {
    const first = payload && typeof payload === "object" ? payload : null;
    if (!first) return [];
    try {
        const grid = (window as any)?.__MJR_LAST_SELECTION_GRID__;
        const selected =
            typeof grid?._mjrGetSelectedAssets === "function" ? grid._mjrGetSelectedAssets() : [];
        if (Array.isArray(selected) && selected.length > 1) {
            const payloads = selected.map(_assetToPayload).filter(isManagedPayload);
            const key = _payloadKey(first);
            if (payloads.some((entry: any) => _payloadKey(entry) === key)) return payloads;
        }
    } catch (e: any) {
        console.debug?.(e);
    }
    return [first];
};

const _getSelectedPayloadsForContainer = (containerEl: any, draggedPayload: any) => {
    try {
        const selected =
            typeof containerEl?._mjrGetSelectedAssets === "function"
                ? containerEl._mjrGetSelectedAssets()
                : [];
        if (!Array.isArray(selected) || selected.length <= 1) return [];
        const payloads = selected.map(_assetToPayload).filter(isManagedPayload);
        const key = _payloadKey(draggedPayload);
        return payloads.some((entry: any) => _payloadKey(entry) === key) ? payloads : [];
    } catch (e: any) {
        console.debug?.(e);
        return [];
    }
};

const _getDraggedMultiPayloads = (event: any, fallbackPayload: any) => {
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
    } catch (e: any) {
        console.debug?.(e);
    }
    return _getDraggedPayloads(fallbackPayload);
};

const _stagePayloadsDetailed = async (payloads: any) => {
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

const _hasNodeTypeControlChars = (value: any) => _NODE_TYPE_CTRL_RE.test(String(value || ""));
const _hasNulByte = (value: any) => _NUL_RE.test(String(value || ""));

const _isSafeWorkflowNode = (node: any) => {
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

const _isSafeWorkflowLink = (link: any) => {
    if (Array.isArray(link)) return link.length >= 4;
    if (link && typeof link === "object") {
        const id = Number(link.id);
        if (!Number.isFinite(id)) return false;
        return true;
    }
    return false;
};

const isValidWorkflowShape = (workflow: any) => {
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

const tryLoadWorkflowToCanvas = async (payload: any, fallbackAbsPath: any = null) => {
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
                        } catch (e: any) {
                            console.debug?.(e);
                        }
                        return true;
                    }
                    if (typeof app?.graph?.configure === "function") {
                        app.graph.configure(cached.workflow);
                        return true;
                    }
                } catch (e: any) {
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
        let url: any = null;
        let workflow: any = null;

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
            } catch (e: any) {
                console.debug?.(e);
            }
            return true;
        }
        if (typeof app?.graph?.configure === "function") {
            app.graph.configure(workflow);
            return true;
        }
    } catch (e: any) {
        console.debug?.(e);
    }
    return false;
};

export function createAssetDragStartHandler(containerEl: HTMLElement): (event: DragEvent) => void {
    return (event) => {
        const dt = event?.dataTransfer;
        if (!dt) return;
        const card = (event?.target as Element)?.closest?.(".mjr-asset-card");
        if (!card) return;

        const asset = (card as any)._mjrAsset;
        if (!asset || typeof asset !== "object") return;
        const kind = String(asset?.kind || "").toLowerCase();
        const nativeLocation = _deriveNativeLocationFromPath(asset, String(asset.filename || ""));
        const type = nativeLocation?.type ?? String(asset?.type || "output").toLowerCase();
        const payload = {
            filename: asset.filename,
            subfolder: nativeLocation?.subfolder ?? asset.subfolder ?? "",
            type,
            root_id: pickRootId(asset) || undefined,
            kind,
        };

        try {
            const stripMetadata = _isStripMetadataDragRequested();
            _setDataTransferData(dt, DND_MIME, JSON.stringify(payload));
            const selectedPayloads = _getSelectedPayloadsForContainer(containerEl, payload);
            if (selectedPayloads.length > 1) {
                _setDataTransferData(dt, DND_MULTI_MIME, JSON.stringify({ items: selectedPayloads }));
            }
            _setDataTransferData(dt, "text/plain", String(asset.filename || ""));
            // Apply OS drag-out (DownloadURL + batch ZIP) for all asset kinds.
            // applyDragOutToOS handles single-file and multi-selection ZIP internally.
            const viewUrl = buildURL(payload);
            _setComfyNativeDragFallbacks({ dt, asset, payload, viewUrl });
            applyDragOutToOS({ dt, asset, containerEl, card, viewUrl, stripMetadata });
        } catch (e: any) {
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
        } catch (e: any) {
            console.debug?.(e);
        }

        const preview =
            card.querySelector("img") ||
            card.querySelector("video") ||
            card.querySelector("canvas");
        if (preview && preview instanceof HTMLElement) {
            try {
                dt.setDragImage(preview, 10, 10);
            } catch (e: any) {
                console.debug?.(e);
            }
        }
    };
}

export const bindAssetDragStart = (containerEl: any) => {
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
        } catch (e: any) {
            console.debug?.(e);
        }
        clearAssetDragStartCleanup(containerEl);
    };

    return setAssetDragStartCleanup(containerEl, cleanup);
};

let _dragDropRuntime: any = null;
let _dragDropRuntimeRefCount = 0;

export function createDragDropRuntimeHandlers(): Record<string, any> {
    const onKeyDown = (event: any) => {
        if (_isTypingTarget(event?.target)) return;
        const key = String(event?.key || "").toLowerCase();
        if (key === "s") {
            _stripMetadataDragKeyDown = true;
        } else if (key === "l") {
            _loadAssetDragKeyDown = true;
        }
    };

    const onKeyUp = (event: any) => {
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

    // -- LTX Director timeline injection ----------------------------------------
    const _LTX_AUDIO_EXTS = new Set(["mp3", "wav", "ogg", "flac", "m4a", "aac", "opus"]);

    const _injectIntoLtxDirector = async (te: any, payload: any, droppedExt: any) => {
        // Read ghost position set by LTXDirector's own dragover handler
        let targetFrameStart: any = null;
        if (te._ghostSegmentId && te._previewSegments) {
            const ghost = te._previewSegments.find((s: any) => s.id === te._ghostSegmentId);
            if (ghost) {
                targetFrameStart =
                    ghost.resolvedStart !== undefined ? ghost.resolvedStart : ghost.start;
            }
        }
        // Clear ghost state  -  we are taking over the drop
        te._ghostSegmentId = null;
        te._ghostTrack = null;
        te._ghostInitialTimeline = null;
        te._previewSegments = null;
        te.render?.();

        const ext = String(droppedExt || "").toLowerCase();
        const isAudio = _LTX_AUDIO_EXTS.has(ext);

        // Stage the file
        const staged = await stageToInputDetailed({
            post,
            endpoint: ENDPOINTS.STAGE_TO_INPUT,
            payload,
            index: false,
        });
        if (!staged?.name) {
            comfyToast(`Failed to stage: "${payload?.filename}"`, "error");
            return;
        }

        const { name, subfolder = "" } = staged;
        const mediaFile = subfolder ? `${subfolder}/${name}` : name;
        const mediaUrl = `/view?filename=${encodeURIComponent(name)}&type=input&subfolder=${encodeURIComponent(subfolder)}`;

        // -- Audio --------------------------------------------------------------
        if (isAudio) {
            try {
                const resp = await fetch(mediaUrl);
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const arrayBuffer = await resp.arrayBuffer();
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                const audioCtx = new AudioCtx();
                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

                const frameRate = typeof te.getFrameRate === "function" ? te.getFrameRate() : 25;
                const clipFrames = Math.max(1, Math.ceil(audioBuffer.duration * frameRate));

                // Build waveform peaks (200 samples, same as LTXDirector's own handler)
                const channelData = audioBuffer.getChannelData(0);
                const numPeaks = 200;
                const step = Math.max(1, Math.floor(channelData.length / numPeaks));
                const peaks = [];
                for (let i = 0; i < numPeaks; i++) {
                    let max = 0;
                    for (let j = 0; j < step; j++) {
                        const v = Math.abs(channelData[i * step + j] || 0);
                        if (v > max) max = v;
                    }
                    peaks.push(max);
                }

                // Position
                let start = targetFrameStart ?? 0;
                if (targetFrameStart === null) {
                    const audioSegs = Array.isArray(te.timeline?.audioSegments)
                        ? [...te.timeline.audioSegments]
                        : [];
                    audioSegs.sort((a: any, b: any) => a.start - b.start);
                    for (const s of audioSegs) {
                        if (start + clipFrames <= s.start) break;
                        start = Math.max(start, s.start + s.length);
                    }
                }

                const segId = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
                const seg = {
                    id: segId,
                    type: "audio",
                    start,
                    length: clipFrames,
                    trimStart: 0,
                    audioDurationFrames: clipFrames,
                    audioFile: mediaFile,
                    fileName: name,
                    waveformPeaks: peaks,
                };

                if (!te.timeline?.audioSegments) {
                    dndLog("ltxdirector inject: no audioSegments", {});
                    return;
                }

                te.timeline.audioSegments.push(seg);
                te.timeline.audioSegments.sort((a: any, b: any) => a.start - b.start);
                te.selectionType = "audio";
                te.selectedIndex = te.timeline.audioSegments.findIndex((s: any) => s.id === segId);
                te.updateUIFromSelection?.();
                te.commitChanges?.(true);
                te.render?.();
                comfyToast(`Added audio to LTX Director: ${name}`, "success", 3000);
                dndLog("drop ltxdirector inject audio", { file: name, start });
            } catch (err: any) {
                console.error("[Majoor] LTX Director audio inject failed", err);
                comfyToast(`Audio decode failed for: ${name}`, "error");
            }
            return;
        }

        // -- Image or Video -> visual segment -----------------------------------
        const frameRate = typeof te.getFrameRate === "function" ? te.getFrameRate() : 25;
        const segLength = frameRate; // 1 second default

        let start = targetFrameStart ?? 0;
        if (targetFrameStart === null) {
            const segs = Array.isArray(te.timeline?.segments) ? [...te.timeline.segments] : [];
            segs.sort((a: any, b: any) => a.start - b.start);
            for (const s of segs) {
                if (start + segLength <= s.start) break;
                start = Math.max(start, s.start + s.length);
            }
        }

        const segId = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        const seg: Record<string, any> = {
            id: segId,
            start,
            length: segLength,
            prompt: "",
            type: "image",
            imageFile: mediaFile,
            imageB64: mediaUrl,
        };

        if (!te.timeline?.segments) {
            dndLog("ltxdirector inject: no timeline", {});
            return;
        }

        te.timeline.segments.push(seg);
        te.timeline.segments.sort((a: any, b: any) => a.start - b.start);

        // Async thumbnail load  -  works for images; silently skipped for video
        const img = new Image();
        img.onload = () => {
            seg.imgObj = img;
            te.render?.();
        };
        img.src = mediaUrl;

        const idx = te.timeline.segments.findIndex((s: any) => s.id === segId);
        if (idx >= 0) {
            te.selectionType = "image";
            te.selectedIndex = idx;
            te.updateUIFromSelection?.();
        }
        te.commitChanges?.(true);
        te.render?.();
        comfyToast(`Added to LTX Director: ${name}`, "success", 3000);
        dndLog("drop ltxdirector inject", { file: name, start, ext });
    };
    // -------------------------------------------------------------------------

    const onDragOver = (event: any) => {
        const app = _resolveApp();
        const types = Array.from(event?.dataTransfer?.types || []);
        if (!types.includes(DND_MIME)) return;
        const payload = getDraggedAsset(event, DND_MIME);
        if (!isManagedPayload(payload)) return;

        const node = getNodeUnderClientXY(app, event.clientX, event.clientY);
        const slotInfo = node ? getInputSlotUnderClientXY(app, node, event.clientX, event.clientY) : null;
        const droppedExt =
            String(payload?.filename || "")
                .split(".")
                .pop() || "";
        const widget = node && !slotInfo ? pickBestMediaPathWidget(node, payload, droppedExt) : null;
        // LTXDirector/LTXDirectorGuide expose _timelineEditor but have no path widget
        const isLtxDirector = node && !slotInfo && !widget && !!node._timelineEditor;
        const forceLoaderNode = _isLoadAssetDragRequested();
        const DnDMetadata = (window as any).__dragAndDropMetaData;

        if (node && (slotInfo || widget || isLtxDirector || DnDMetadata?.isFeatureActive())) {
            event.preventDefault();
            // For LTXDirector: do NOT stopPropagation  -  allow the wrapper's own dragover
            // handler to fire so it sets up the ghost segment position.
            if (!isLtxDirector) {
                event.stopImmediatePropagation?.();
                event.stopPropagation();
            }
            if (DnDMetadata?.isFeatureActive() && !slotInfo && !forceLoaderNode && !widget) {
                applyHighlight(app, node, markCanvasDirty, 'orange');
            } else {
                applyHighlight(app, node, markCanvasDirty);
            }
            event.dataTransfer.dropEffect = "copy";
            if (slotInfo) {
                dndLog("dragover slot", { node: node?.title, slot: slotInfo.input?.name });
            } else if (isLtxDirector) {
                dndLog("dragover ltxdirector", { node: node?.title });
            } else if (DnDMetadata?.isFeatureActive() && !widget) {
                dndLog("dragover DnDMetadata", { node: node?.title });
            } else {
                dndLog("dragover widget", { node: node?.title, widget: widget?.name });
            }
            return;
        }

        clearHighlight(app, markCanvasDirty);
        if (!isCanvasDropTarget(app, event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
    };

    const onDrop = async (event: any) => {
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
        const slotInfo = node ? getInputSlotUnderClientXY(app, node, event.clientX, event.clientY) : null;
        const droppedExt =
            String(payload?.filename || "")
                .split(".")
                .pop() || "";
        const widget = node && !slotInfo ? pickBestMediaPathWidget(node, payload, droppedExt) : null;

        const DnDMetadata = (window as any).__dragAndDropMetaData;
        if (DnDMetadata?.isFeatureActive() && node && !slotInfo && !forceLoaderNode /*&& !widget*/) {
            event.preventDefault();
            event.stopImmediatePropagation?.();
            event.stopPropagation();
            clearHighlight(app, markCanvasDirty);
            const success = await DnDMetadata.importMetaDataFromPayload(node, payload, event);
            if (success) {
                dndLog("drop: imported workflow via importMetaDataFromPayload");
                return;
            }
        }

        if (node && slotInfo) {
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

            if (
                createLoaderAndConnect({
                    app,
                    payload,
                    relativePath,
                    targetNode: node,
                    inputSlotIndex: slotInfo.index,
                    event,
                })
            ) {
                dndLog("drop slot created and connected loader", {
                    node: node?.title,
                    slot: slotInfo.input?.name,
                    value: relativePath,
                });
                return;
            }
            comfyToast(`Staged to input: ${relativePath}`, "success", 4000);
            return;
        }

        // -- LTX Director timeline drop ------------------------------------------
        if (node && !slotInfo && !widget && node._timelineEditor && !forceLoaderNode) {
            event.preventDefault();
            event.stopImmediatePropagation?.();
            event.stopPropagation();
            clearHighlight(app, markCanvasDirty);
            await _injectIntoLtxDirector(node._timelineEditor, payload, droppedExt);
            return;
        }
        // ---------------------------------------------------------------------

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

            // Run staging + workflow extraction in parallel for normal drops (only if dropped on empty canvas, not on a node).
            const shouldTryWorkflow = !node && !forceLoaderNode;

            const stagePromise = stageToInputDetailed({
                post,
                endpoint: ENDPOINTS.STAGE_TO_INPUT,
                payload,
                index: false,
            });
            const workflowPromise = shouldTryWorkflow ? tryLoadWorkflowToCanvas(payload) : Promise.resolve(false);

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
        } catch (e: any) {
            console.debug?.(e);
        }

        _stripMetadataDragKeyDown = false;
        _loadAssetDragKeyDown = false;

        try {
            clearHighlight(_resolveApp(), markCanvasDirty);
        } catch (e: any) {
            console.debug?.(e);
        }
    };

    return { dispose };
}

export function installDragDropRuntime(): (() => void) {
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

export function teardownDragDropRuntime({ force = false }: { force?: boolean } = {}): void {
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
    } catch (e: any) {
        console.debug?.(e);
    }
    _dragDropRuntime = null;
    resetDndRuntimeState();
}

export function getDragDropRuntimeState(): { installed: boolean; refCount: number } {
    return {
        installed: !!_dragDropRuntime,
        refCount: _dragDropRuntimeRefCount,
    };
}

export const initDragDrop = installDragDropRuntime;
