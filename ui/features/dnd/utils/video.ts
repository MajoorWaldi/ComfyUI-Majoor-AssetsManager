import { AUDIO_EXTS, IMAGE_EXTS, MODEL3D_EXTS, VIDEO_EXTS } from "./constants.js";

const isImageFilename = (filename: any) => {
    if (!filename) return false;
    const dot = filename.lastIndexOf(".");
    if (dot === -1) return false;
    return IMAGE_EXTS.has(filename.slice(dot).toLowerCase());
};

const isImagePayload = (payload: any) => {
    if (!payload) return false;
    if (String(payload.kind || "").toLowerCase() === "image") return true;
    return isImageFilename(payload.filename);
};

const isVideoFilename = (filename: any) => {
    if (!filename) return false;
    const dot = filename.lastIndexOf(".");
    if (dot === -1) return false;
    return VIDEO_EXTS.has(filename.slice(dot).toLowerCase());
};

const isVideoPayload = (payload: any) => {
    if (!payload) return false;
    if (String(payload.kind || "").toLowerCase() === "video") return true;
    return isVideoFilename(payload.filename);
};

const isAudioFilename = (filename: any) => {
    if (!filename) return false;
    const dot = filename.lastIndexOf(".");
    if (dot === -1) return false;
    return AUDIO_EXTS.has(filename.slice(dot).toLowerCase());
};

const isAudioPayload = (payload: any) => {
    if (!payload) return false;
    if (String(payload.kind || "").toLowerCase() === "audio") return true;
    return isAudioFilename(payload.filename);
};

const isModel3DFilename = (filename: any) => {
    if (!filename) return false;
    const dot = filename.lastIndexOf(".");
    if (dot === -1) return false;
    return MODEL3D_EXTS.has(filename.slice(dot).toLowerCase());
};

const isModel3DPayload = (payload: any) => {
    if (!payload) return false;
    if (String(payload.kind || "").toLowerCase() === "model3d") return true;
    return isModel3DFilename(payload.filename);
};

export const isManagedPayload = (payload: any) =>
    isImagePayload(payload) ||
    isVideoPayload(payload) ||
    isAudioPayload(payload) ||
    isModel3DPayload(payload);

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

export const getDownloadMimeForFilename = (filename: any) => {
    const ext = String(filename || "")
        .split(".")
        .pop()
        ?.toLowerCase();
    return (_EXT_TO_MIME as Record<string, string>)[ext as string] ?? "application/octet-stream";
};

export const looksLikeVideoPath = (value: any, droppedExt: any) => {
    if (typeof value !== "string") return false;
    const v = value.trim().toLowerCase();
    if (!v) return false;
    const ext = (v.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
    if (!ext) return false;
    if (droppedExt && ext === String(droppedExt).toLowerCase()) return true;
    return VIDEO_EXTS.has(`.${ext}`);
};

const _comboHasAnyValue = (widget: any, droppedExt: any, looksLikeFn: any) => {
    if (!widget || widget.type !== "combo" || !widget.options) return false;
    const vals =
        (Array.isArray(widget.options.values) && widget.options.values) ||
        (widget.options.values &&
            Array.isArray(widget.options.values.values) &&
            widget.options.values.values) ||
        null;
    if (!Array.isArray(vals)) return false;
    return vals.some((v: any) => {
        const s = typeof v === "string" ? v : (v?.content ?? v?.value ?? v?.text);
        return looksLikeFn(s, droppedExt);
    });
};

export const comboHasAnyVideoValue = (widget: any, droppedExt: any) =>
    _comboHasAnyValue(widget, droppedExt, looksLikeVideoPath);

export const looksLikeImagePath = (value: any, droppedExt: any) => {
    if (typeof value !== "string") return false;
    const v = value.trim().toLowerCase();
    if (!v) return false;
    const ext = (v.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
    if (!ext) return false;
    if (droppedExt && ext === String(droppedExt).toLowerCase()) return true;
    return IMAGE_EXTS.has(`.${ext}`);
};

export const comboHasAnyImageValue = (widget: any, droppedExt: any) =>
    _comboHasAnyValue(widget, droppedExt, looksLikeImagePath);

export const looksLikeAudioPath = (value: any, droppedExt: any) => {
    if (typeof value !== "string") return false;
    const v = value.trim().toLowerCase();
    if (!v) return false;
    const ext = (v.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
    if (!ext) return false;
    if (droppedExt && ext === String(droppedExt).toLowerCase()) return true;
    return AUDIO_EXTS.has(`.${ext}`);
};

export const comboHasAnyAudioValue = (widget: any, droppedExt: any) =>
    _comboHasAnyValue(widget, droppedExt, looksLikeAudioPath);

export const looksLikeModel3DPath = (value: any, droppedExt: any) => {
    if (typeof value !== "string") return false;
    const v = value.trim().toLowerCase();
    if (!v) return false;
    const ext = (v.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
    if (!ext) return false;
    if (droppedExt && ext === String(droppedExt).toLowerCase()) return true;
    return MODEL3D_EXTS.has(`.${ext}`);
};

export const comboHasAnyModel3DValue = (widget: any, droppedExt: any) =>
    _comboHasAnyValue(widget, droppedExt, looksLikeModel3DPath);
