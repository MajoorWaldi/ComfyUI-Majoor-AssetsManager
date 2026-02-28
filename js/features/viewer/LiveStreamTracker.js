/**
 * LiveStreamTracker — bridges ComfyUI generation & graph events to the Floating Viewer.
 *
 * Two sources feed the MFV when Live Stream mode is active:
 *  1. NEW_GENERATION_OUTPUT — fires after a workflow execution, shows the latest output file.
 *  2. Graph node selection — when a LoadImage / LoadVideo / SaveImage / VHS node is selected
 *     in the ComfyUI canvas, the file shown by that node is previewed in the MFV.
 *
 * Call initLiveStreamTracker(app) once at startup (entry.js setup()).
 * It is idempotent — safe to call multiple times.
 */

import { EVENTS } from "../../app/events.js";
import { floatingViewerManager } from "./floatingViewerManager.js";

let _initialized = false;

// ── Node-type detection ───────────────────────────────────────────────────────

/**
 * Load nodes — filename read from widgets[0].value (type: "input").
 */
const LOAD_IMAGE_TYPES = new Set([
    "loadimage",
    "loadimagemask",
    "loadimageoutput",
]);

const LOAD_VIDEO_TYPES = new Set([
    "vhs_loadvideo",
    "vhs_loadvideoffmpeg",
    "vhs_loadvideobatch",
    "vhs_loadimages",           // VHS batch image loader
    "loadvideoupload",
    "loadvideo",
    "videoloader",
    "imagefromurl",
]);

/**
 * Save / Preview nodes — file info read from node.imgs[last].src (type: "output").
 */
const SAVE_IMAGE_TYPES = new Set([
    "saveimage",
    "previewimage",
    "saveanimatedwebp",
    "saveanimatedpng",
    "imagepreview",             // some community nodes
]);

const SAVE_VIDEO_TYPES = new Set([
    "vhs_videocombine",         // VHS combine + preview
    "vhs_savevideo",
    "previewvideo",
    "savevideo",
    "videopreview",
]);

/**
 * @param {object} node  LiteGraph node
 * @returns {"load-image" | "load-video" | "save-image" | "save-video" | null}
 */
function _mediaNodeKind(node) {
    const t = String(node?.type || "").toLowerCase().replace(/\s+/g, "");
    if (LOAD_IMAGE_TYPES.has(t)) return "load-image";
    if (LOAD_VIDEO_TYPES.has(t)) return "load-video";
    if (SAVE_IMAGE_TYPES.has(t)) return "save-image";
    if (SAVE_VIDEO_TYPES.has(t)) return "save-video";
    // Substring fallbacks for unknown derivatives
    if (t.includes("loadimage") || t.includes("image_loader"))  return "load-image";
    if (t.includes("loadvideo") || t.includes("videoload"))     return "load-video";
    if (t.includes("saveimage") || t.includes("previewimage"))  return "save-image";
    if (t.includes("savevideo") || t.includes("videocombine") || t.includes("previewvideo")) return "save-video";
    return null;
}

// ── File data extractors ──────────────────────────────────────────────────────

/**
 * Extract { filename, subfolder } from a widget value string.
 * Handles plain filenames ("foo.png") and paths ("subdir/foo.png").
 */
function _parseWidgetFilename(raw) {
    const str = String(raw || "").trim().replace(/\\/g, "/");
    if (!str) return null;
    const slash = str.lastIndexOf("/");
    return {
        filename: slash >= 0 ? str.slice(slash + 1) : str,
        subfolder: slash >= 0 ? str.slice(0, slash)  : "",
    };
}

/**
 * Build a fileData object from a load node's first widget value.
 * @param {object}          node
 * @param {"image"|"video"} kind
 * @returns {{ filename, subfolder, type, kind } | null}
 */
function _fileDataFromLoadWidget(node, kind) {
    const widgets = node?.widgets;
    if (!Array.isArray(widgets) || !widgets.length) return null;
    const value = widgets[0]?.value;
    if (!value || typeof value !== "string") return null;
    const parsed = _parseWidgetFilename(value);
    if (!parsed?.filename) return null;
    return {
        filename: parsed.filename,
        subfolder: parsed.subfolder,
        type: "input",
        kind,
    };
}

/**
 * Parse a ComfyUI /view URL and return { filename, subfolder, type }.
 * URL format: /view?filename=foo.png&subfolder=bar&type=output
 */
function _parseViewUrl(src) {
    try {
        const url = new URL(src, window.location.href);
        const filename = url.searchParams.get("filename") || "";
        if (!filename) return null;
        return {
            filename,
            subfolder: url.searchParams.get("subfolder") || "",
            type:      url.searchParams.get("type")      || "output",
        };
    } catch {
        return null;
    }
}

/**
 * Build fileData from node.imgs (save / preview nodes).
 * ComfyUI populates node.imgs = [HTMLImageElement, …] after the node executes.
 * We take the last image (most recently generated).
 *
 * @param {object}          node
 * @param {"image"|"video"} kind
 * @returns {{ filename, subfolder, type, kind } | null}
 */
function _fileDataFromImgs(node, kind) {
    const imgs = node?.imgs;
    if (!Array.isArray(imgs) || !imgs.length) return null;
    // Last element is the most recent output when batching
    const src = imgs[imgs.length - 1]?.src || imgs[0]?.src;
    if (!src) return null;
    const parsed = _parseViewUrl(src);
    if (!parsed?.filename) return null;
    return { ...parsed, kind };
}

/**
 * Build fileData from a video widget element (e.g. VHS_VideoCombine previews).
 * VHS stores a <video> element inside a widget's .element property.
 *
 * @param {object} node
 * @returns {{ filename, subfolder, type, kind } | null}
 */
function _fileDataFromVideoWidget(node) {
    const widgets = node?.widgets;
    if (!Array.isArray(widgets)) return null;
    for (const w of widgets) {
        const el = w?.element;
        if (!el) continue;
        const videoEl = el instanceof HTMLVideoElement ? el : el.querySelector?.("video");
        if (!videoEl?.src) continue;
        const parsed = _parseViewUrl(videoEl.src);
        if (parsed?.filename) return { ...parsed, kind: "video" };
    }
    return null;
}

// ── Canvas hook ───────────────────────────────────────────────────────────────

/**
 * Called whenever LiteGraph notifies us that a node was selected.
 * Dispatches to the right extractor based on the node kind.
 * @param {object} node
 */
function _onLiteGraphNodeSelected(node) {
    try {
        if (!floatingViewerManager.getLiveActive()) return;

        const kind = _mediaNodeKind(node);
        if (!kind) return;

        let fileData = null;

        if (kind === "save-image") {
            fileData = _fileDataFromImgs(node, "image");
        } else if (kind === "save-video") {
            // Try node.imgs first (some VHS versions expose it), then video widget
            fileData = _fileDataFromImgs(node, "video")
                    ?? _fileDataFromVideoWidget(node);
        } else if (kind === "load-image") {
            fileData = _fileDataFromLoadWidget(node, "image");
        } else /* load-video */ {
            fileData = _fileDataFromLoadWidget(node, "video");
        }

        if (!fileData) return;
        floatingViewerManager.upsertWithContent(fileData);
    } catch (e) {
        console.debug?.("[MFV] graph node selected error", e);
    }
}

/**
 * Patch canvas.onNodeSelected (LiteGraph callback) to intercept node clicks.
 * Chains correctly with any existing handler — including other extensions.
 * @param {object} canvas  LGraphCanvas instance
 */
function _hookCanvas(canvas) {
    if (!canvas || canvas.__mjrMfvHooked) return;
    canvas.__mjrMfvHooked = true;

    // ── onNodeSelected: single-click selection ──────────────────────────────
    const origSelected = canvas.onNodeSelected;
    canvas.onNodeSelected = function (node) {
        try { origSelected?.call(this, node); } catch (e) { console.debug?.(e); }
        _onLiteGraphNodeSelected(node);
    };

    // ── onSelectionChange: multi-select or keyboard selection (LiteGraph v0.7+) ─
    const origSelChange = canvas.onSelectionChange;
    canvas.onSelectionChange = function (selectedNodes) {
        try { origSelChange?.call(this, selectedNodes); } catch (e) { console.debug?.(e); }
        try {
            // selectedNodes is { [id]: node } — act only when exactly one node is selected.
            const nodes = Object.values(selectedNodes || {});
            if (nodes.length === 1) {
                _onLiteGraphNodeSelected(nodes[0]);
            }
        } catch (e) { console.debug?.(e); }
    };

    console.debug("[Majoor] MFV canvas hooks installed");
}

/**
 * Wait for app.canvas to become available, then hook it.
 * ComfyUI initialises the canvas slightly after the extension setup() call.
 */
function _hookCanvasWhenReady(app) {
    if (!app) return;
    const MAX_ATTEMPTS = 30;
    let attempts = 0;

    const tryHook = () => {
        const canvas = app.canvas;
        if (canvas) {
            _hookCanvas(canvas);
            return;
        }
        if (++attempts < MAX_ATTEMPTS) {
            setTimeout(tryHook, 300);
        } else {
            console.debug("[Majoor] MFV: canvas not ready after retries — graph node tracking disabled");
        }
    };
    tryHook();
}

// ── Generation output tracking ────────────────────────────────────────────────

/**
 * Pick the most relevant file from a batch of generated outputs.
 * Prefers still images over videos; takes the last one.
 * @param {Array<{filename:string, subfolder:string, type:string}>} files
 * @returns {object | null}
 */
function _pickLatest(files) {
    if (!Array.isArray(files) || !files.length) return null;
    const images = files.filter((f) => {
        const name = String(f?.filename || "").toLowerCase();
        return name.endsWith(".png") || name.endsWith(".jpg") ||
               name.endsWith(".jpeg") || name.endsWith(".webp") ||
               name.endsWith(".avif");
    });
    return images[images.length - 1] ?? files[files.length - 1];
}

// ── Public init ───────────────────────────────────────────────────────────────

/**
 * Initialise the live stream tracker.
 * @param {object} [app]  The ComfyUI app object (used for graph node tracking).
 */
export function initLiveStreamTracker(app) {
    if (_initialized) return;
    _initialized = true;

    // 1. Listen for completed generations
    window.addEventListener(EVENTS.NEW_GENERATION_OUTPUT, (e) => {
        try {
            if (!floatingViewerManager.getLiveActive()) return;
            const latest = _pickLatest(e.detail?.files);
            if (!latest) return;
            floatingViewerManager.upsertWithContent(latest);
        } catch (err) {
            console.debug?.("[MFV] generation output error", err);
        }
    });

    // 2. Hook LiteGraph canvas for media node selection
    _hookCanvasWhenReady(app);

    console.debug("[Majoor] LiveStreamTracker initialized");
}
