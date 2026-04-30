/**
 * ImageOps preview bridge — minimal, canvas-only.
 *
 * majoor-imageops keeps a rendered preview canvas at
 * `node.__imageops_state.canvas`. We stream that canvas to the MFV after
 * cropping out the letterbox/guide area so the displayed content fills the
 * viewer (no square scope, no dashed guides outside the image).
 *
 * Crop math: ImageOps draws the source `previewSourceWidth × previewSourceHeight`
 * into a square `canvasSize × canvasSize` via a centered contain-fit. We
 * recompute the same fit and copy that sub-rect into a temp canvas before
 * encoding. When the user has panned/zoomed inside ImageOps, the content
 * overflows that rect — we fall back to streaming the full canvas in that
 * case to avoid clipping the scene.
 *
 * The encoded data-URL is cached per signature so we re-encode only when
 * the canvas (or crop rect) actually changes.
 */

const IMAGEOPS_STATE_KEY = "__imageops_state";
const IMAGEOPS_SOURCE = "imageops-live-preview";

function _isCanvas(value) {
    return typeof HTMLCanvasElement !== "undefined" && value instanceof HTMLCanvasElement;
}

function _canvasUsable(canvas) {
    return _isCanvas(canvas) && Number(canvas.width) > 0 && Number(canvas.height) > 0;
}

function _hashText(value) {
    let hash = 2166136261;
    const text = String(value || "");
    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
}

/**
 * Compute the contain-fit sub-rect of the source image inside the square
 * preview canvas. Returns null when crop should be skipped (no source dims,
 * user pan/zoom active, or the fit equals the full canvas).
 */
function _computeContentRect(st, canvas) {
    const sw = Number(st?.previewSourceWidth) || 0;
    const sh = Number(st?.previewSourceHeight) || 0;
    const cw = Number(canvas?.width) || 0;
    const ch = Number(canvas?.height) || 0;
    if (sw <= 0 || sh <= 0 || cw <= 0 || ch <= 0) return null;

    // ImageOps applies the user's pan/zoom inside its own canvas. Cropping
    // the static fit rect would clip the panned content — keep the full
    // canvas in that case.
    const zoom = Number(st?.previewZoom);
    const panX = Number(st?.previewPanX) || 0;
    const panY = Number(st?.previewPanY) || 0;
    if ((Number.isFinite(zoom) && Math.abs(zoom - 1) > 1e-3) || panX !== 0 || panY !== 0) {
        return null;
    }

    const scale = Math.min(cw / sw, ch / sh);
    const drawW = Math.max(1, Math.round(sw * scale));
    const drawH = Math.max(1, Math.round(sh * scale));
    const dx = Math.max(0, Math.round((cw - drawW) / 2));
    const dy = Math.max(0, Math.round((ch - drawH) / 2));

    // No letterbox → nothing to crop, skip the temp-canvas detour.
    if (dx === 0 && dy === 0 && drawW === cw && drawH === ch) return null;
    return { dx, dy, w: drawW, h: drawH };
}

function _signatureFor(node, st, canvas, crop) {
    const cropPart = crop ? `${crop.dx},${crop.dy},${crop.w}x${crop.h}` : "full";
    const parts = [
        String(node?.id ?? ""),
        String(st?.lastKey ?? ""),
        String(st?.lastRenderTick ?? ""),
        String(st?.nativeDirty ? 1 : 0),
        `${Number(canvas?.width) || 0}x${Number(canvas?.height) || 0}`,
        cropPart,
    ];
    return _hashText(parts.join("|"));
}

function _encodeCropped(canvas, crop) {
    const tmp = document.createElement("canvas");
    tmp.width = crop.w;
    tmp.height = crop.h;
    const ctx = tmp.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(canvas, crop.dx, crop.dy, crop.w, crop.h, 0, 0, crop.w, crop.h);
    return tmp.toDataURL("image/png");
}

// WeakMap caches keep ImageOps nodes garbage-collectable. We reuse the last
// encoded URL whenever the signature is unchanged — avoids re-encoding the
// full canvas on every poll tick.
const _lastSigByNode = new WeakMap();
const _lastUrlByNode = new WeakMap();

export function extractImageOpsPreview(node) {
    if (!node) return null;
    const st = node[IMAGEOPS_STATE_KEY];
    const canvas = st?.canvas;
    if (!_canvasUsable(canvas)) return null;

    const crop = _computeContentRect(st, canvas);
    const signature = _signatureFor(node, st, canvas, crop);
    let url = _lastSigByNode.get(node) === signature ? _lastUrlByNode.get(node) : "";

    if (!url) {
        try {
            url = crop ? _encodeCropped(canvas, crop) : canvas.toDataURL("image/png");
        } catch (error) {
            // Tainted canvas (cross-origin). Warn so the cause is visible.
            console.warn("[NodeStream] ImageOps canvas export failed:", error);
            return null;
        }
        if (!url) return null;
        _lastSigByNode.set(node, signature);
        _lastUrlByNode.set(node, url);
    }

    const outW = crop ? crop.w : Number(canvas.width) || undefined;
    const outH = crop ? crop.h : Number(canvas.height) || undefined;
    const classType = node.comfyClass || node.type || "ImageOps";
    return {
        filename: `imageops_${node.id ?? "node"}_${signature}.png`,
        subfolder: "",
        type: "temp",
        kind: "image",
        url,
        width: outW,
        height: outH,
        _nodeId: String(node.id ?? ""),
        _classType: classType,
        _source: IMAGEOPS_SOURCE,
        _signature: signature,
    };
}

export function hasImageOpsPreviewState(node) {
    return _canvasUsable(node?.[IMAGEOPS_STATE_KEY]?.canvas);
}

export const IMAGEOPS_PREVIEW_SOURCE = IMAGEOPS_SOURCE;
