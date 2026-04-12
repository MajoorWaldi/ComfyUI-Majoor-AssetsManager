import {
    comboHasAnyAudioValue,
    comboHasAnyModel3DValue,
    comboHasAnyVideoValue,
    looksLikeAudioPath,
    looksLikeModel3DPath,
    looksLikeVideoPath,
} from "../utils/video.js";

const highlightState = new WeakMap();

const getHighlightState = (app) => {
    if (!app || typeof app !== "object") {
        return { node: null, prev: null };
    }
    let state = highlightState.get(app);
    if (!state) {
        state = { node: null, prev: null };
        highlightState.set(app, state);
    }
    return state;
};

export const getNodeUnderClientXY = (app, clientX, clientY) => {
    const canvasEl = app?.canvas?.canvas || document.querySelector("canvas");
    const graph = app?.canvas?.graph;
    const ds = app?.canvas?.ds;
    if (!canvasEl || !graph || !ds) return null;

    const rect = canvasEl.getBoundingClientRect();
    if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
    ) {
        return null;
    }

    const scale = Number(ds.scale) || 1;
    const off = ds.offset || [0, 0];
    const offX = Array.isArray(off) ? Number(off[0]) || 0 : Number(off?.x) || 0;
    const offY = Array.isArray(off) ? Number(off[1]) || 0 : Number(off?.y) || 0;
    const x = (clientX - rect.left) / scale - offX;
    const y = (clientY - rect.top) / scale - offY;

    if (typeof graph.getNodeOnPos === "function") {
        return graph.getNodeOnPos(x, y);
    }

    const nodes = graph._nodes || [];
    for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        if (!n?.pos || !n?.size) continue;
        const width = n.size[0];
        let height = n.size[1];
        if (n.flags && n.flags.collapsed) {
            height = 30;
        }
        if (x >= n.pos[0] && y >= n.pos[1] && x <= n.pos[0] + width && y <= n.pos[1] + height) {
            return n;
        }
    }
    return null;
};

export const applyHighlight = (app, node, markCanvasDirty) => {
    const state = getHighlightState(app);
    if (!node || state.node === node) return;
    clearHighlight(app, markCanvasDirty);
    state.node = node;
    state.prev = { color: node.color, bgcolor: node.bgcolor };
    node.bgcolor = "#3355ff";
    node.color = "#a9c4ff";
    markCanvasDirty(app);
};

export const clearHighlight = (app, markCanvasDirty) => {
    const state = getHighlightState(app);
    if (!state.node) return;
    try {
        if (state.prev) {
            state.node.color = state.prev.color;
            state.node.bgcolor = state.prev.bgcolor;
        }
    } catch (e) {
        console.debug?.(e);
    }
    state.node = null;
    state.prev = null;
    markCanvasDirty(app);
};

export const ensureComboHasValue = (widget, value) => {
    if (!widget || widget.type !== "combo" || !widget.options) return;
    let vals = widget.options.values;
    let target = widget.options;

    if (typeof vals === "function") {
        return;
    }

    if (!Array.isArray(vals)) {
        if (vals && typeof vals === "object" && Array.isArray(vals.values)) {
            target = vals;
            vals = vals.values;
        } else {
            return;
        }
    }

    const has = vals.some((v) => {
        if (typeof v === "string") return v === value;
        return (v?.content ?? v?.value ?? v?.text) === value;
    });
    if (has) return;

    if (vals.length === 0 || typeof vals[0] === "string") {
        vals.unshift(value);
    } else {
        vals.unshift({ content: value, text: value, value });
    }
    target.values = vals;
};

// Widget types that can never hold a file path
const _REJECT_TYPES = new Set(["number", "int", "float", "boolean", "toggle", "checkbox"]);
// Terms that indicate an output/save widget (strong negative signal)
const _OUTPUTY_TERMS = ["output", "save", "export", "folder", "dir"];
// Generic path-like widget name terms
const _PATH_TERMS = ["file", "path"];
// Terms that suggest a file-path input
const _PATH_HINT_TERMS = ["path", "file", "input", "src", "source"];

/**
 * Generic scored widget picker.
 * @param {object} node - LiteGraph node
 * @param {string} droppedExt - Extension of the dropped file (without leading dot)
 * @param {object} cfg
 * @param {Set<string>}    cfg.exactNames        - Widget names that match perfectly (+100)
 * @param {string[]}       cfg.knownNodeIncludes - Node-type substrings that flag a known loader
 * @param {string[]}       cfg.mediaTerms        - Media-specific widget name terms
 * @param {Array<{terms:string[], score:number}>} cfg.extraTerms - Extra scoring groups
 * @param {Set<string>}    cfg.exactSingleNames  - Names with value-conditional scoring
 * @param {Function}       cfg.looksLikeFn       - (value, ext) → bool
 * @param {Function}       cfg.comboChecker      - (widget, ext) → bool
 * @param {string}         cfg.scoreKey          - Debug property attached to the winning widget
 */
const _pickBestPathWidget = (node, droppedExt, cfg) => {
    const widgets = node?.widgets;
    if (!Array.isArray(widgets) || !widgets.length) return null;

    const ext = String(droppedExt || "").toLowerCase().replace(/^\./, "");
    const nodeType = String(node?.type || "").toLowerCase();
    const isKnownNode = cfg.knownNodeIncludes.some((p) => nodeType.includes(p));

    const candidates = [];
    for (const w of widgets) {
        if (!w) continue;
        const type = String(w?.type || "").toLowerCase();
        const value = w?.value;

        if (_REJECT_TYPES.has(type)) continue;
        if (typeof value === "number" || typeof value === "boolean") continue;

        const stringLikeByType = type === "text" || type === "string" || type === "combo";
        const stringLikeByCallback = typeof w?.callback === "function" && typeof value === "string";
        if (!stringLikeByType && !stringLikeByCallback) continue;

        const name = String(w?.name || w?.label || "").toLowerCase().trim();

        let score = 0;
        if (cfg.exactNames.has(name)) score += 100;

        if (name === "file" && isKnownNode && type === "combo" && cfg.comboChecker(w, ext)) {
            score += 100;
        }

        const hasMediaHint = cfg.mediaTerms.some((t) => name.includes(t));
        const hasPathHint = _PATH_HINT_TERMS.some((t) => name.includes(t));
        if (hasMediaHint && hasPathHint) score += 80;
        if (_PATH_TERMS.some((t) => name.includes(t))) score += 35;

        for (const { terms, score: pts } of cfg.extraTerms) {
            if (terms.some((t) => name.includes(t))) score += pts;
        }

        if (_OUTPUTY_TERMS.some((t) => name.includes(t))) score -= 90;

        if (cfg.exactSingleNames.has(name)) {
            const empty = typeof value === "string" && value.trim() === "";
            if (empty) score += 25;
            else if (cfg.looksLikeFn(value, ext)) score += 25;
            else score -= 10;
        }

        if (isKnownNode) score += 15;
        const emptyValue = typeof value === "string" && value.trim() === "";
        if (emptyValue) score += 3;
        if (type === "combo" && cfg.comboChecker(w, ext)) score += 12;

        candidates.push({ w, score, emptyValue, combo: type === "combo" });
    }

    if (!candidates.length) return null;
    candidates.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.emptyValue !== a.emptyValue) return b.emptyValue ? 1 : -1;
        if (b.combo !== a.combo) return b.combo ? 1 : -1;
        return 0;
    });

    const best = candidates[0];
    if (!best || best.score < 20) return null;
    try { best.w[cfg.scoreKey] = best.score; } catch (e) { console.debug?.(e); }
    return best.w;
};

const _VIDEO_CFG = {
    exactNames: new Set(["video_path", "input_video", "source_video", "video"]),
    knownNodeIncludes: ["loadvideo", "vhs_loadvideo", "videoloader"],
    mediaTerms: ["video"],
    extraTerms: [{ terms: ["media", "clip", "footage"], score: 45 }],
    exactSingleNames: new Set(["video"]),
    looksLikeFn: looksLikeVideoPath,
    comboChecker: comboHasAnyVideoValue,
    scoreKey: "__mjrVideoPickScore",
};

const _AUDIO_CFG = {
    exactNames: new Set(["audio_path", "input_audio", "source_audio", "audio"]),
    knownNodeIncludes: ["loadaudio", "vhs_loadaudioupload", "vhs_loadaudio", "audioloader", "inputaudio"],
    mediaTerms: ["audio", "sound", "music"],
    extraTerms: [{ terms: ["media", "track"], score: 45 }],
    exactSingleNames: new Set(["audio"]),
    looksLikeFn: looksLikeAudioPath,
    comboChecker: comboHasAnyAudioValue,
    scoreKey: "__mjrAudioPickScore",
};

const _MODEL3D_CFG = {
    exactNames: new Set([
        "model_path", "input_model", "source_model", "mesh_path", "input_mesh",
        "geometry_path", "scene_path", "point_cloud_path", "splat_path",
        "model", "mesh", "geometry",
    ]),
    knownNodeIncludes: [
        "load3d", "loadmodel", "loadmesh", "loadobj", "loadgltf", "loadglb",
        "loadstl", "loadply", "pointcloud", "meshloader", "modelloader",
    ],
    mediaTerms: ["model", "mesh", "geometry", "scene", "object", "point", "cloud", "splat"],
    extraTerms: [{ terms: ["asset", "resource"], score: 30 }],
    exactSingleNames: new Set(["model", "mesh", "geometry"]),
    looksLikeFn: looksLikeModel3DPath,
    comboChecker: comboHasAnyModel3DValue,
    scoreKey: "__mjrModel3DPickScore",
};

export const pickBestMediaPathWidget = (node, payload, droppedExt) => {
    const kind = String(payload?.kind || "").toLowerCase();
    const cfg =
        kind === "model3d" ? _MODEL3D_CFG :
        kind === "audio"   ? _AUDIO_CFG   :
                             _VIDEO_CFG;
    return _pickBestPathWidget(node, droppedExt, cfg);
};
