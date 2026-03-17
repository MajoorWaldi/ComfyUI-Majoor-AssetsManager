/**
 * DefaultImageAdapter — handles the standard ComfyUI image output format.
 *
 * Most image-producing nodes (SaveImage, PreviewImage, color correction,
 * blur, LayerStyle nodes, etc.) output in the canonical format:
 *   { images: [{ filename, subfolder, type }] }
 *
 * This adapter catches all of them with a single implementation.
 * Priority 0 (lowest) so custom adapters can override for specific node types.
 */

import { createAdapter } from "./BaseAdapter.js";

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".bmp", ".tiff"]);

function _hasImageExt(filename) {
    if (!filename) return false;
    const dot = String(filename).lastIndexOf(".");
    return dot >= 0 && IMAGE_EXTS.has(String(filename).slice(dot).toLowerCase());
}

export const DefaultImageAdapter = createAdapter({
    name: "default-image",
    priority: 0,
    description: "Standard image output (images: [{filename, subfolder, type}])",

    canHandle(_classType, outputs) {
        // Accept any node that has an "images" array with at least one entry
        const images = outputs?.images;
        return Array.isArray(images) && images.length > 0 && !!images[0]?.filename;
    },

    extractMedia(_classType, outputs, nodeId) {
        const images = outputs?.images;
        if (!Array.isArray(images) || !images.length) return null;

        const results = [];
        for (const item of images) {
            if (!item?.filename) continue;
            // Optionally filter to known image extensions; if unknown, still include
            results.push({
                filename: item.filename,
                subfolder: item.subfolder || "",
                type: item.type || "output",
                kind: _hasImageExt(item.filename) ? "image" : undefined,
                _nodeId: nodeId,
                _classType,
            });
        }
        return results.length ? results : null;
    },
});
