/**
 * NodeStreamController
 *
 * Selection-only node preview for the Majoor Floating Viewer.
 *
 * When Node Stream mode is active, selecting a node in the ComfyUI canvas
 * immediately pushes that node's existing preview to the MFV if one is
 * available. No workflow execution event is required.
 *
 * The feature is still guarded by NODE_STREAM_FEATURE_ENABLED so it can be
 * disabled quickly if a ComfyUI runtime incompatibility is found.
 */

import { registerAdapter, listAdapters } from "./NodeStreamRegistry.js";
import { DefaultImageAdapter } from "./adapters/DefaultImageAdapter.js";
import { VideoAdapter } from "./adapters/VideoAdapter.js";
import { KnownNodesAdapter } from "./adapters/KnownNodesAdapter.js";
import { NODE_STREAM_FEATURE_ENABLED } from "./nodeStreamFeatureFlag.js";
import { extractImageOpsPreview } from "./imageOpsPreviewBridge.js";

// Bootstrap built-in adapters for compatibility with the public API exposed in
// entry.js. Selection-only mode does not consume execution output updates, but
// external code may still inspect the registered adapter list.
if (NODE_STREAM_FEATURE_ENABLED) {
    registerAdapter(DefaultImageAdapter);
    registerAdapter(KnownNodesAdapter);
    registerAdapter(VideoAdapter);
}

/** @type {"selected" | "pinned"} */
let _watchMode = "selected";

/** @type {string | null} */
let _pinnedNodeId = null;

/** @type {string | null} */
let _selectedNodeId = null;

/** @type {boolean} */
let _active = false;

/** @type {((fileData: object) => void) | null} */
let _outputCallback = null;

/** @type {((nodeId: string, classType: string) => void) | null} */
let _statusCallback = null;

/** @type {object | null} */
let _appRef = null;

/** @type {ReturnType<typeof setInterval> | null} */
let _selectionPollTimer = null;

/** @type {string | null} */
let _lastPreviewKey = null;

/** @type {string | null} */
let _lastPreviewNodeId = null;

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".bmp", ".tiff"]);

const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]);

const MAX_DOWNSTREAM_DEPTH = 12;
const MAX_DOWNSTREAM_NODES = 96;

function _classTypeOf(node) {
    return node?.comfyClass || node?.type || null;
}

function _parseViewUrl(src) {
    try {
        const url = new URL(src, window.location.href);
        const filename = url.searchParams.get("filename") || "";
        if (!filename) return null;
        return {
            filename,
            subfolder: url.searchParams.get("subfolder") || "",
            type: url.searchParams.get("type") || "output",
        };
    } catch {
        return null;
    }
}

function _parseWidgetFilename(raw) {
    if (raw == null || typeof raw !== "string") return null;
    const normalized = raw.trim().replace(/\\/g, "/");
    if (!normalized) return null;
    const slashIndex = normalized.lastIndexOf("/");
    return {
        filename: slashIndex >= 0 ? normalized.slice(slashIndex + 1) : normalized,
        subfolder: slashIndex >= 0 ? normalized.slice(0, slashIndex) : "",
    };
}

function _fileExtension(filename) {
    if (!filename) return "";
    const dotIndex = String(filename).lastIndexOf(".");
    return dotIndex >= 0 ? String(filename).slice(dotIndex).toLowerCase() : "";
}

function _guessMediaKind(node, filename = "") {
    const ext = _fileExtension(filename);
    if (VIDEO_EXTS.has(ext)) return "video";
    if (IMAGE_EXTS.has(ext)) return "image";

    const classType = String(_classTypeOf(node) || "").toLowerCase();
    if (classType.includes("video")) return "video";
    return "image";
}

function _withNodeMetadata(node, fileData, source) {
    return {
        ...fileData,
        kind: fileData?.kind || _guessMediaKind(node, fileData?.filename),
        _nodeId: String(node?.id ?? ""),
        _classType: _classTypeOf(node) || "",
        _source: source,
    };
}

function _getSelectedCanvasNodes() {
    const selected = _appRef?.canvas?.selected_nodes ?? _appRef?.canvas?.selectedNodes ?? null;
    if (!selected) return [];
    if (Array.isArray(selected)) {
        return selected.filter(Boolean);
    }
    if (selected instanceof Map) {
        return Array.from(selected.values()).filter(Boolean);
    }
    if (typeof selected === "object") {
        return Object.values(selected).filter(Boolean);
    }
    return [];
}

function _getGraph() {
    return _appRef?.graph ?? _appRef?.canvas?.graph ?? null;
}

function _getNodeById(nodeId) {
    const graph = _getGraph();
    if (nodeId == null || !graph) return null;
    try {
        return graph.getNodeById?.(Number(nodeId)) || null;
    } catch {
        return null;
    }
}

function _getAllGraphNodes() {
    const graph = _getGraph();
    if (!graph) return [];

    if (Array.isArray(graph._nodes)) {
        return graph._nodes.filter(Boolean);
    }

    if (graph._nodes_by_id instanceof Map) {
        return Array.from(graph._nodes_by_id.values()).filter(Boolean);
    }

    if (graph._nodes_by_id && typeof graph._nodes_by_id === "object") {
        return Object.values(graph._nodes_by_id).filter(Boolean);
    }

    return [];
}

function _findTargetNodeIdByInputLink(linkId) {
    if (linkId == null) return null;
    const normalizedLinkId = String(linkId);

    for (const node of _getAllGraphNodes()) {
        if (!Array.isArray(node?.inputs)) continue;
        for (const input of node.inputs) {
            if (input?.link == null) continue;
            if (String(input.link) === normalizedLinkId) {
                return String(node.id ?? "");
            }
        }
    }

    return null;
}

function _getGraphLinkRecord(linkId) {
    if (linkId == null) return null;

    const graph = _getGraph();
    const graphLinks = graph?.links ?? graph?._links ?? null;
    if (!graphLinks) return null;

    const numericId = Number(linkId);
    const stringId = String(linkId);

    if (graphLinks instanceof Map) {
        return (
            graphLinks.get(linkId) || graphLinks.get(numericId) || graphLinks.get(stringId) || null
        );
    }

    if (Array.isArray(graphLinks)) {
        const direct = graphLinks[numericId];
        if (direct) return direct;

        for (const item of graphLinks) {
            if (!item) continue;
            if (Array.isArray(item) && String(item[0]) === stringId) return item;
            const itemId = item.id ?? item.link_id ?? item.linkId ?? null;
            if (itemId != null && String(itemId) === stringId) return item;
        }
        return null;
    }

    if (typeof graphLinks === "object") {
        return graphLinks[linkId] || graphLinks[numericId] || graphLinks[stringId] || null;
    }

    return null;
}

function _getTargetNodeIdForLink(linkId) {
    const linkRecord = _getGraphLinkRecord(linkId);
    if (Array.isArray(linkRecord) && linkRecord.length >= 4) {
        return String(linkRecord[3] ?? "");
    }

    if (linkRecord && typeof linkRecord === "object") {
        const targetId = linkRecord.target_id ?? linkRecord.targetId ?? linkRecord.to ?? null;
        if (targetId != null) {
            return String(targetId);
        }
    }

    return _findTargetNodeIdByInputLink(linkId);
}

function _getOutputLinkIds(node) {
    if (!Array.isArray(node?.outputs)) return [];

    const linkIds = [];
    for (const output of node.outputs) {
        const links = output?.links;
        if (Array.isArray(links)) {
            for (const linkId of links) {
                if (linkId != null) linkIds.push(linkId);
            }
        } else if (links != null) {
            linkIds.push(links);
        }

        if (output?.link != null) {
            linkIds.push(output.link);
        }
    }

    return Array.from(new Set(linkIds.map((linkId) => String(linkId))));
}

function _getDownstreamNodes(node) {
    const downstreamNodes = [];
    const seenNodeIds = new Set();

    for (const linkId of _getOutputLinkIds(node)) {
        const targetNodeId = _getTargetNodeIdForLink(linkId);
        if (!targetNodeId || seenNodeIds.has(targetNodeId)) continue;

        const targetNode = _getNodeById(targetNodeId);
        if (!targetNode) continue;

        seenNodeIds.add(targetNodeId);
        downstreamNodes.push(targetNode);
    }

    return downstreamNodes;
}

function _emitNodeStatus(node) {
    const nodeId = node ? String(node.id ?? "") : "";
    const classType = node ? _classTypeOf(node) || "" : "";
    _statusCallback?.(nodeId, classType);
}

function _syncSelectedNodeState() {
    const nodes = _getSelectedCanvasNodes();
    const nextNode = nodes[0] || null;
    const nextNodeId = nextNode ? String(nextNode.id ?? "") : null;
    if (nextNodeId !== _selectedNodeId) {
        _selectedNodeId = nextNodeId;
        _emitNodeStatus(nextNode);
    } else if (!nextNodeId) {
        _selectedNodeId = null;
    }
    return nodes;
}

function _extractFromNodeImgs(node) {
    if (!node) return null;

    const imgs = node.imgs;
    if (!Array.isArray(imgs) || imgs.length === 0) return null;

    const lastSrc = imgs[imgs.length - 1]?.src || imgs[0]?.src;
    if (!lastSrc) return null;

    const parsed = _parseViewUrl(lastSrc);
    if (!parsed?.filename) return null;

    return _withNodeMetadata(node, { ...parsed, kind: "image" }, "canvas");
}

function _extractFromWidgetMedia(node) {
    if (!node || !Array.isArray(node.widgets)) return null;

    for (const widget of node.widgets) {
        const el = widget?.element;
        if (!el) continue;

        const videoEl =
            typeof HTMLVideoElement !== "undefined" && el instanceof HTMLVideoElement
                ? el
                : el.querySelector?.("video");
        if (videoEl?.src) {
            const parsed = _parseViewUrl(videoEl.src);
            if (parsed?.filename) {
                return _withNodeMetadata(node, { ...parsed, kind: "video" }, "widget");
            }
        }

        const imageEl =
            typeof HTMLImageElement !== "undefined" && el instanceof HTMLImageElement
                ? el
                : el.querySelector?.("img");
        if (!imageEl?.src) continue;

        const parsed = _parseViewUrl(imageEl.src);
        if (parsed?.filename) {
            return _withNodeMetadata(node, { ...parsed, kind: "image" }, "widget");
        }
    }

    return null;
}

function _extractFromLoadWidget(node) {
    if (!node || !Array.isArray(node.widgets) || !node.widgets.length) return null;

    const classType = String(_classTypeOf(node) || "").toLowerCase();
    const firstValue = node.widgets[0]?.value;
    if (typeof firstValue !== "string") return null;

    const parsed = _parseWidgetFilename(firstValue);
    if (!parsed?.filename) return null;

    const ext = _fileExtension(parsed.filename);
    const looksLikeMediaFile = IMAGE_EXTS.has(ext) || VIDEO_EXTS.has(ext);
    const looksLikeLoadNode = /(load|upload|loader|fromurl|folder|input)/.test(classType);
    if (!looksLikeMediaFile && !looksLikeLoadNode) return null;

    return _withNodeMetadata(
        node,
        {
            ...parsed,
            type: "input",
            kind: _guessMediaKind(node, parsed.filename),
        },
        "widget-value",
    );
}

function _extractFromCanvasNode(node) {
    return (
        extractImageOpsPreview(node) ||
        _extractFromNodeImgs(node) ||
        _extractFromWidgetMedia(node) ||
        _extractFromLoadWidget(node)
    );
}

function _resolvePreviewForNode(node) {
    if (!node) return null;

    const rootNodeId = String(node.id ?? "");
    const rootClassType = _classTypeOf(node) || "";
    const queue = [{ node, depth: 0 }];
    const visitedNodeIds = new Set(rootNodeId ? [rootNodeId] : []);
    let scannedNodes = 0;

    while (queue.length > 0 && scannedNodes < MAX_DOWNSTREAM_NODES) {
        const current = queue.shift();
        if (!current?.node) continue;
        scannedNodes += 1;

        const preview = _extractFromCanvasNode(current.node);
        if (preview) {
            const previewNodeId = preview._nodeId || String(current.node.id ?? "");
            const previewClassType = preview._classType || _classTypeOf(current.node) || "";
            return {
                ...preview,
                _nodeId: rootNodeId || previewNodeId,
                _classType: rootClassType || previewClassType,
                _previewNodeId: previewNodeId,
                _previewClassType: previewClassType,
                _source:
                    previewNodeId === rootNodeId ? preview._source || "canvas" : "graph-downstream",
            };
        }

        if (current.depth >= MAX_DOWNSTREAM_DEPTH) continue;

        for (const downstreamNode of _getDownstreamNodes(current.node)) {
            const downstreamNodeId = String(downstreamNode?.id ?? "");
            if (!downstreamNodeId || visitedNodeIds.has(downstreamNodeId)) continue;
            visitedNodeIds.add(downstreamNodeId);
            queue.push({ node: downstreamNode, depth: current.depth + 1 });
        }
    }

    return null;
}

function _fileDataSignature(fileData) {
    if (!fileData) return "";
    return [
        fileData._nodeId || "",
        fileData._signature || "",
        fileData.kind || "",
        fileData.type || "",
        fileData.subfolder || "",
        fileData.filename || "",
        fileData.url || "",
    ].join("|");
}

function _resetPreviewState() {
    _lastPreviewKey = null;
    _lastPreviewNodeId = null;
}

function _getWatchedNode() {
    if (_watchMode === "pinned") {
        return _getNodeById(_pinnedNodeId);
    }
    return _getSelectedCanvasNodes()[0] || null;
}

function _emitPreviewFromWatchedNode({ force = false } = {}) {
    if (!_active || !_outputCallback || !_getGraph()) return;

    const node = _getWatchedNode();
    const nodeId = node ? String(node.id ?? "") : null;
    if (!nodeId) {
        _emitNodeStatus(null);
        _resetPreviewState();
        return;
    }

    if (_watchMode === "pinned") {
        _emitNodeStatus(node);
    }

    const fileData = _resolvePreviewForNode(node);
    if (!fileData) {
        _resetPreviewState();
        return;
    }

    const previewKey = _fileDataSignature(fileData);
    const nodeChanged = nodeId !== _lastPreviewNodeId;
    if (!force && !nodeChanged && previewKey === _lastPreviewKey) return;

    _lastPreviewNodeId = nodeId;
    _lastPreviewKey = previewKey;
    _outputCallback(fileData);
}

function _pollNodePreview() {
    const previousSelectedNodeId = _selectedNodeId;
    _syncSelectedNodeState();
    const selectionChanged = _selectedNodeId !== previousSelectedNodeId;

    if (!_active) {
        _resetPreviewState();
        return;
    }

    const force = _watchMode !== "pinned" && selectionChanged;
    _emitPreviewFromWatchedNode({ force });
}

function _startSelectionPolling() {
    if (_selectionPollTimer) return;
    _selectionPollTimer = setInterval(_pollNodePreview, 150);
    _pollNodePreview();
}

function _stopSelectionPolling() {
    if (_selectionPollTimer) {
        clearInterval(_selectionPollTimer);
        _selectionPollTimer = null;
    }
    _resetPreviewState();
}

/**
 * Kept as a compatibility shim for entry.js.
 * Node Stream is selection-only and intentionally ignores execution output
 * updates.
 */
export function onNodeOutputs(nodeOutputs, graphInfo) {
    void nodeOutputs;
    void graphInfo;
    if (!NODE_STREAM_FEATURE_ENABLED) return;
}

export function initNodeStream({ app, onOutput, onStatus } = {}) {
    if (!NODE_STREAM_FEATURE_ENABLED) {
        _active = false;
        _outputCallback = null;
        _statusCallback = null;
        _appRef = app || null;
        _stopSelectionPolling();
        console.debug("[NodeStream] Disabled by feature flag");
        return;
    }

    _outputCallback = onOutput || null;
    _statusCallback = onStatus || null;
    _appRef = app || null;
    if (app) {
        _syncSelectedNodeState();
    }
    console.debug("[NodeStream] Controller initialized (selection-only preview mode)");
}

export function setNodeStreamActive(active) {
    if (!NODE_STREAM_FEATURE_ENABLED) {
        void active;
        _active = false;
        _selectedNodeId = null;
        _stopSelectionPolling();
        return;
    }

    _active = Boolean(active);
    if (!_active) {
        _selectedNodeId = null;
        _stopSelectionPolling();
        return;
    }

    _resetPreviewState();
    _syncSelectedNodeState();

    if (_selectionPollTimer) {
        _pollNodePreview();
        return;
    }

    _startSelectionPolling();
}

export function getNodeStreamActive() {
    if (!NODE_STREAM_FEATURE_ENABLED) return false;
    return _active;
}

export function setWatchMode(mode) {
    if (!NODE_STREAM_FEATURE_ENABLED) {
        void mode;
        return;
    }

    const nextMode = mode === "pinned" ? "pinned" : "selected";
    if (_watchMode === nextMode) return;

    _watchMode = nextMode;
    _resetPreviewState();
    if (_active) {
        _emitPreviewFromWatchedNode({ force: true });
    }
}

export function getWatchMode() {
    return _watchMode;
}

export function pinNode(nodeId) {
    if (!NODE_STREAM_FEATURE_ENABLED) {
        void nodeId;
        return;
    }

    if (nodeId == null) {
        _pinnedNodeId = null;
        if (_watchMode === "pinned") _watchMode = "selected";
        _resetPreviewState();
        if (_active) {
            _emitPreviewFromWatchedNode({ force: true });
        }
        return;
    }

    _pinnedNodeId = String(nodeId);
    _watchMode = "pinned";
    _resetPreviewState();
    if (_active) {
        _emitPreviewFromWatchedNode({ force: true });
    }
}

export function getPinnedNodeId() {
    if (!NODE_STREAM_FEATURE_ENABLED) return null;
    return _pinnedNodeId;
}

export function getSelectedNodeId() {
    if (!NODE_STREAM_FEATURE_ENABLED) return null;
    _syncSelectedNodeState();
    return _selectedNodeId;
}

export function teardownNodeStream(app) {
    void app;
    _active = false;
    _selectedNodeId = null;
    _pinnedNodeId = null;
    _emitNodeStatus(null);
    _outputCallback = null;
    _statusCallback = null;
    _appRef = null;
    _stopSelectionPolling();
    console.debug("[NodeStream] Controller torn down");
}

export { listAdapters };
