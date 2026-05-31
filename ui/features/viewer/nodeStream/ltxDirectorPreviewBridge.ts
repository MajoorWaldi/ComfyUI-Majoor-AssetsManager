/**
 * LTX Director preview bridge  -  canvas-only.
 *
 * Supports two node families from ComfyUI-LTXVideo:
 *
 * - LTXVSparseTrackEditor   -  drawing state at `node._ed.canvas`
 *   (rendered by sparse_track_editor.js, a plain rAF-driven canvas)
 * - LTXDirector / LTXDirectorGuide  -  timeline editor at
 *   `node._timelineEditor.canvas` (rendered by the timeline DOM widget)
 *
 * Pattern mirrors imageOpsPreviewBridge: WeakMap caches avoid re-encoding when
 * nothing has changed; the synthetic filename carries the node-id and a hash so
 * downstream caches can detect stale entries.
 */

const LTX_DIRECTOR_SOURCE = "ltx-director-live-preview";

/** @param {unknown} value */
function _isCanvas(value: any) {
    return typeof HTMLCanvasElement !== "undefined" && value instanceof HTMLCanvasElement;
}

/** @param {HTMLCanvasElement} canvas */
function _canvasUsable(canvas: any) {
    return _isCanvas(canvas) && Number(canvas.width) > 0 && Number(canvas.height) > 0;
}

function _hashText(value: any) {
    let hash = 2166136261;
    const text = String(value || "");
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
}

/**
 * Return the canvas element for the node, or null.
 * Checks both _ed.canvas (LTXVSparseTrackEditor) and
 * _timelineEditor.canvas (LTXDirector / LTXDirectorGuide).
 *
 * @param {object} node
 * @returns {HTMLCanvasElement|null}
 */
function _resolveCanvas(node: any) {
    const c1 = node?._ed?.canvas;
    if (_canvasUsable(c1)) return c1;
    const c2 = node?._timelineEditor?.canvas;
    if (_canvasUsable(c2)) return c2;
    return null;
}

function _signatureFor(node: any, canvas: any) {
    // Use canvas dimensions + node id as a cheap change signal.
    // For _ed nodes, also mix in ed.dirty + spline hash.
    const ed = node._ed;
    const parts = [
        String(node?.id ?? ""),
        `${Number(canvas?.width) || 0}x${Number(canvas?.height) || 0}`,
        String(ed?.dirty ? 1 : 0),
        // Include spline data hash for a more accurate change signal.
        _hashText(JSON.stringify(ed?.splines ?? [])),
    ];
    return _hashText(parts.join("|"));
}

const _lastSigByNode = new WeakMap();
const _lastUrlByNode = new WeakMap();

/**
 * Try to extract a live canvas preview from an LTXVSparseTrackEditor node.
 * Returns a media-item object (compatible with NodeStreamController expectations)
 * or null if the node is not an LTX Director node or has no usable canvas.
 *
 * @param {object} node - LiteGraph node
 * @returns {object|null}
 */
export function extractLtxDirectorPreview(node: any): any {
    if (!node) return null;

    const canvas = _resolveCanvas(node);
    if (!canvas) return null;

    const signature = _signatureFor(node, canvas);
    let url = _lastSigByNode.get(node) === signature ? _lastUrlByNode.get(node) : "";

    if (!url) {
        try {
            url = canvas.toDataURL("image/png");
        } catch (err: any) {
            // Tainted canvas (cross-origin content). Fail gracefully.
            console.warn("[NodeStream] LTX Director canvas export failed:", err);
            return null;
        }
        if (!url) return null;
        _lastSigByNode.set(node, signature);
        _lastUrlByNode.set(node, url);
    }

    const classType = node.comfyClass || node.type || "LTXVSparseTrackEditor";
    return {
        filename: `ltx_director_${node.id ?? "node"}_${signature}.png`,
        subfolder: "",
        type: "temp",
        kind: "image",
        url,
        width: Number(canvas.width) || undefined,
        height: Number(canvas.height) || undefined,
        _nodeId: String(node.id ?? ""),
        _classType: classType,
        _source: LTX_DIRECTOR_SOURCE,
        _signature: signature,
    };
}

export function hasLtxDirectorPreviewState(node: any): boolean {
    return _resolveCanvas(node) !== null;
}

export const LTX_DIRECTOR_PREVIEW_SOURCE = LTX_DIRECTOR_SOURCE;
