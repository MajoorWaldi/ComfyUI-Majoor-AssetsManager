export const DND_MIME = "application/x-mjr-asset";
export const DND_MULTI_MIME = "application/x-mjr-assets";
export const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".avif"]);
export const VIDEO_EXTS = new Set([".mp4", ".mov", ".mkv", ".webm", ".avi"]);
export const AUDIO_EXTS = new Set([".wav", ".mp3", ".flac", ".ogg", ".m4a", ".aac", ".opus"]);
// NOTE: Must stay in sync with MODEL3D_EXT_TO_LOADER in js/features/viewer/model3dRenderer.js
// and EXTENSIONS["model3d"] in mjr_am_shared/types.py
export const MODEL3D_EXTS = new Set([
    ".obj",
    ".fbx",
    ".glb",
    ".gltf",
    ".stl",
    ".ply",
    ".splat",
    ".ksplat",
    ".spz",
]);
export const DND_GLOBAL_KEY = "__MJR_DND__";
export const DND_INSTANCE_VERSION = 2;
