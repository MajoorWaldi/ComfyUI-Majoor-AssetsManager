/**
 * Image preloader module — prefetches adjacent images while browsing assets.
 */

export function createImagePreloader({ buildAssetViewURL, IMAGE_PRELOAD_EXTENSIONS, state }) {
    function getPreloadKey(asset) {
        if (!asset) return null;
        if (asset.id != null) return `id:${asset.id}`;
        const fallback = asset.filepath || asset.path || asset.filename;
        if (fallback) return `path:${fallback}`;
        return null;
    }

    function isImageAsset(asset) {
        if (!asset) return false;
        const kind = String(asset.kind || "").toLowerCase();
        if (kind === "image" || kind.startsWith("image/")) return true;
        const filename = String(asset.filepath || asset.path || asset.filename || "");
        const ext = filename.split(".").pop()?.toLowerCase() || "";
        return IMAGE_PRELOAD_EXTENSIONS.has(ext);
    }

    function trackPreloadRef(img) {
        if (!img) return;
        try {
            state._preloadRefs = state._preloadRefs || new Set();
            state._preloadRefs.add(img);
            const cleanup = () => {
                try {
                    state._preloadRefs?.delete?.(img);
                } catch {}
            };
            img.addEventListener("load", cleanup, { once: true, passive: true });
            img.addEventListener("error", cleanup, { once: true, passive: true });
        } catch {}
    }

    function preloadImageForAsset(asset, url) {
        if (!asset || !url) return;
        if (!isImageAsset(asset)) return;
        const key = getPreloadKey(asset) || url;
        if (key) {
            state._preloadedAssetKeys = state._preloadedAssetKeys || new Set();
            if (state._preloadedAssetKeys.has(key)) return;
            state._preloadedAssetKeys.add(key);
            if (state._preloadedAssetKeys.size > 250) {
                try {
                    state._preloadedAssetKeys.clear();
                } catch {}
            }
        }
        try {
            const img = new Image();
            img.decoding = "async";
            try {
                img.loading = "lazy";
            } catch {}
            img.alt = "";
            img.src = url;
            trackPreloadRef(img);
        } catch {}
    }

    function preloadAdjacentAssets(assets, centerIndex) {
        const assetList = Array.isArray(assets) ? assets : [];
        if (!assetList.length) return;
        const candidates = [centerIndex - 1, centerIndex + 1];
        for (const idx of candidates) {
            if (idx < 0 || idx >= assetList.length) continue;
            const asset = assetList[idx];
            if (!asset) continue;
            const url = buildAssetViewURL(asset);
            preloadImageForAsset(asset, url);
        }
    }

    return { preloadAdjacentAssets, preloadImageForAsset, trackPreloadRef };
}
