/**
 * VideoAdapter — handles nodes that produce video output.
 *
 * Covers VHS_VideoCombine and similar nodes that output:
 *   { gifs: [{ filename, subfolder, type, format }] }
 * or
 *   { videos: [{ filename, subfolder, type }] }
 *
 * Priority 10 — checked before DefaultImageAdapter so video nodes aren't
 * misidentified as image nodes (some output both `images` and `gifs`).
 */

import { createAdapter } from "./BaseAdapter.js";

const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]);

function _hasVideoExt(filename) {
    if (!filename) return false;
    const dot = String(filename).lastIndexOf(".");
    return dot >= 0 && VIDEO_EXTS.has(String(filename).slice(dot).toLowerCase());
}

function _extractItems(outputs) {
    // VHS uses "gifs" key (even for mp4/webm), some nodes use "videos"
    const gifs = outputs?.gifs;
    if (Array.isArray(gifs) && gifs.length && gifs[0]?.filename) return gifs;
    const videos = outputs?.videos;
    if (Array.isArray(videos) && videos.length && videos[0]?.filename) return videos;
    return null;
}

export const VideoAdapter = createAdapter({
    name: "video-output",
    priority: 10,
    description: "Video output (gifs/videos: [{filename, subfolder, type}])",

    canHandle(_classType, outputs) {
        return !!_extractItems(outputs);
    },

    extractMedia(_classType, outputs, nodeId) {
        const items = _extractItems(outputs);
        if (!items) return null;

        const results = [];
        for (const item of items) {
            if (!item?.filename) continue;
            results.push({
                filename: item.filename,
                subfolder: item.subfolder || "",
                type: item.type || "output",
                kind: _hasVideoExt(item.filename) ? "video" : "image",
                _nodeId: nodeId,
                _classType,
            });
        }
        return results.length ? results : null;
    },
});
