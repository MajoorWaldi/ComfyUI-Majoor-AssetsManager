import { AUDIO_EXTS, IMAGE_EXTS, MODEL3D_EXTS, VIDEO_EXTS } from "./utils/constants.js";
import { pickBestMediaPathWidget } from "./targets/node.js";
import { ensureComboHasValue } from "./targets/node.js";
import { markCanvasDirty } from "./targets/canvas.js";

const _getPayloadExt = (payload) => {
    const filename = String(payload?.filename || "");
    const dot = filename.lastIndexOf(".");
    return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
};

const _getLoaderNodeCandidates = (payload) => {
    const kind = String(payload?.kind || "").toLowerCase();
    const ext = _getPayloadExt(payload);
    if (kind === "image" || IMAGE_EXTS.has(ext)) return ["LoadImage"];
    if (kind === "video" || VIDEO_EXTS.has(ext)) {
        return ["LoadVideo", "VHS_LoadVideo", "VideoLoader"];
    }
    if (kind === "audio" || AUDIO_EXTS.has(ext)) {
        return ["LoadAudio", "VHS_LoadAudioUpload", "VHS_LoadAudio", "AudioLoader"];
    }
    if (kind === "model3d" || MODEL3D_EXTS.has(ext)) {
        return ["Load3D", "LoadModel", "LoadMesh", "LoadGLB", "LoadOBJ", "LoadSTL", "LoadPLY"];
    }
    return [];
};

const _setWidgetValue = (widget, value) => {
    if (!widget) return;
    if (widget.type === "combo") ensureComboHasValue(widget, value);
    widget.value = value;
    try {
        widget.callback?.(widget.value);
    } catch (e) {
        console.debug?.(e);
    }
};

const _getCanvasCenterPos = (app) => {
    const canvasEl = app?.canvas?.canvas || document.querySelector("canvas");
    const rect = canvasEl?.getBoundingClientRect?.();
    const rectWidth = rect ? Number(rect.width || rect.right - rect.left) : 0;
    const rectHeight = rect ? Number(rect.height || rect.bottom - rect.top) : 0;
    const width = Number(rectWidth || canvasEl?.width || 800);
    const height = Number(rectHeight || canvasEl?.height || 600);
    return [Math.max(0, width / 2), Math.max(0, height / 2)];
};

const _getCanvasPosFromClient = (app, clientX, clientY) => {
    const canvasEl = app?.canvas?.canvas || document.querySelector("canvas");
    const rect = canvasEl?.getBoundingClientRect?.();
    const ds = app?.canvas?.ds || {};
    const scale = Number(ds.scale) || 1;
    const off = ds.offset || [0, 0];
    const offX = Array.isArray(off) ? Number(off[0]) || 0 : Number(off?.x) || 0;
    const offY = Array.isArray(off) ? Number(off[1]) || 0 : Number(off?.y) || 0;
    if (!rect || !Number.isFinite(Number(clientX)) || !Number.isFinite(Number(clientY))) {
        return _getCanvasCenterPos(app);
    }
    return [
        (Number(clientX) - rect.left) / scale - offX,
        (Number(clientY) - rect.top) / scale - offY,
    ];
};

export const getDropCanvasPos = (app, event = null) => {
    try {
        const pos = app?.canvas?.convertEventToCanvasOffset?.(event);
        if (Array.isArray(pos)) return [Number(pos[0]) || 0, Number(pos[1]) || 0];
    } catch (e) {
        console.debug?.(e);
    }
    return _getCanvasPosFromClient(app, event?.clientX, event?.clientY);
};

export const createCanvasLoaderNode = ({
    app,
    payload,
    relativePath,
    event = null,
    droppedExt = "",
    position = null,
}) => {
    const graph = app?.graph ?? app?.canvas?.graph ?? null;
    const LiteGraph = globalThis?.LiteGraph || globalThis?.window?.LiteGraph || null;
    if (!graph || typeof graph.add !== "function" || !LiteGraph?.createNode) return false;

    let created = null;
    for (const nodeType of _getLoaderNodeCandidates(payload)) {
        try {
            created = LiteGraph.createNode(nodeType);
            if (created) break;
        } catch (e) {
            console.debug?.(e);
        }
    }
    if (!created) return false;

    created.pos = Array.isArray(position)
        ? [Number(position[0]) || 0, Number(position[1]) || 0]
        : getDropCanvasPos(app, event);
    graph.add(created);

    const widget = pickBestMediaPathWidget(created, payload, droppedExt);
    if (widget) _setWidgetValue(widget, relativePath);
    markCanvasDirty(app);
    return true;
};

export const createCanvasLoaderNodes = ({ app, items = [], event = null, gap = 90 }) => {
    const list = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!list.length) return 0;
    const origin = getDropCanvasPos(app, event);
    let count = 0;
    for (const item of list) {
        const ok = createCanvasLoaderNode({
            app,
            payload: item.payload,
            relativePath: item.relativePath,
            event,
            droppedExt: item.droppedExt,
            position: [origin[0] + count * Number(gap || 90), origin[1]],
        });
        if (ok) count += 1;
    }
    return count;
};

export const writeMediaPathWidgetValue = _setWidgetValue;
