import { AUDIO_EXTS, IMAGE_EXTS, MODEL3D_EXTS, VIDEO_EXTS } from "./constants.js";

const isImageFilename = (filename) => {
    if (!filename) return false;
    const dot = filename.lastIndexOf(".");
    if (dot === -1) return false;
    return IMAGE_EXTS.has(filename.slice(dot).toLowerCase());
};

const isImagePayload = (payload) => {
    if (!payload) return false;
    if (String(payload.kind || "").toLowerCase() === "image") return true;
    return isImageFilename(payload.filename);
};

const isVideoFilename = (filename) => {
    if (!filename) return false;
    const dot = filename.lastIndexOf(".");
    if (dot === -1) return false;
    return VIDEO_EXTS.has(filename.slice(dot).toLowerCase());
};

const isVideoPayload = (payload) => {
    if (!payload) return false;
    if (payload.kind === "video") return true;
    return isVideoFilename(payload.filename);
};

const isAudioFilename = (filename) => {
    if (!filename) return false;
    const dot = filename.lastIndexOf(".");
    if (dot === -1) return false;
    return AUDIO_EXTS.has(filename.slice(dot).toLowerCase());
};

const isAudioPayload = (payload) => {
    if (!payload) return false;
    if (String(payload.kind || "").toLowerCase() === "audio") return true;
    return isAudioFilename(payload.filename);
};

const isModel3DFilename = (filename) => {
    if (!filename) return false;
    const dot = filename.lastIndexOf(".");
    if (dot === -1) return false;
    return MODEL3D_EXTS.has(filename.slice(dot).toLowerCase());
};

const isModel3DPayload = (payload) => {
    if (!payload) return false;
    if (String(payload.kind || "").toLowerCase() === "model3d") return true;
    return isModel3DFilename(payload.filename);
};

export const isManagedPayload = (payload) =>
    isImagePayload(payload) || isVideoPayload(payload) || isAudioPayload(payload) || isModel3DPayload(payload);

const _EXT_TO_MIME = {
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    mkv: "video/x-matroska",
    glb: "model/gltf-binary",
    gltf: "model/gltf+json",
    obj: "model/obj",
    stl: "model/stl",
    ply: "application/ply",
};

export const getDownloadMimeForFilename = (filename) => {
    const ext = String(filename || "").split(".").pop()?.toLowerCase();
    return _EXT_TO_MIME[ext] ?? "application/octet-stream";
};

export const looksLikeVideoPath = (value, droppedExt) => {
    if (typeof value !== "string") return false;
    const v = value.trim().toLowerCase();
    if (!v) return false;
    const ext = (v.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
    if (!ext) return false;
    if (droppedExt && ext === String(droppedExt).toLowerCase()) return true;
    return VIDEO_EXTS.has(`.${ext}`);
};

const _comboHasAnyValue = (widget, droppedExt, looksLikeFn) => {
    if (!widget || widget.type !== "combo" || !widget.options) return false;
    const vals =
        (Array.isArray(widget.options.values) && widget.options.values) ||
        (widget.options.values &&
            Array.isArray(widget.options.values.values) &&
            widget.options.values.values) ||
        null;
    if (!Array.isArray(vals)) return false;
    return vals.some((v) => {
        const s = typeof v === "string" ? v : (v?.content ?? v?.value ?? v?.text);
        return looksLikeFn(s, droppedExt);
    });
};

export const comboHasAnyVideoValue = (widget, droppedExt) =>
    _comboHasAnyValue(widget, droppedExt, looksLikeVideoPath);

export const looksLikeImagePath = (value, droppedExt) => {
    if (typeof value !== "string") return false;
    const v = value.trim().toLowerCase();
    if (!v) return false;
    const ext = (v.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
    if (!ext) return false;
    if (droppedExt && ext === String(droppedExt).toLowerCase()) return true;
    return IMAGE_EXTS.has(`.${ext}`);
};

export const comboHasAnyImageValue = (widget, droppedExt) =>
    _comboHasAnyValue(widget, droppedExt, looksLikeImagePath);

export const looksLikeAudioPath = (value, droppedExt) => {
    if (typeof value !== "string") return false;
    const v = value.trim().toLowerCase();
    if (!v) return false;
    const ext = (v.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
    if (!ext) return false;
    if (droppedExt && ext === String(droppedExt).toLowerCase()) return true;
    return AUDIO_EXTS.has(`.${ext}`);
};

export const comboHasAnyAudioValue = (widget, droppedExt) =>
    _comboHasAnyValue(widget, droppedExt, looksLikeAudioPath);

export const looksLikeModel3DPath = (value, droppedExt) => {
    if (typeof value !== "string") return false;
    const v = value.trim().toLowerCase();
    if (!v) return false;
    const ext = (v.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
    if (!ext) return false;
    if (droppedExt && ext === String(droppedExt).toLowerCase()) return true;
    return MODEL3D_EXTS.has(`.${ext}`);
};

export const comboHasAnyModel3DValue = (widget, droppedExt) =>
    _comboHasAnyValue(widget, droppedExt, looksLikeModel3DPath);
