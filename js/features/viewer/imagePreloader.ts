/**
 * Image preloader module — prefetches adjacent images while browsing assets.
 */

export function createImagePreloader({ buildAssetViewURL, IMAGE_PRELOAD_EXTENSIONS, state }: Record<string, any>): Record<string, any> {
    function getPreloadKey(asset: any) {
        if (!asset) return null;
        if (asset.id != null) return `id:${asset.id}`;
        const fallback = asset.filepath || asset.path || asset.filename;
        if (fallback) return `path:${fallback}`;
        return null;
    }

    function isImageAsset(asset: any) {
        if (!asset) return false;
        const kind = String(asset.kind || "").toLowerCase();
        if (kind === "image" || kind.startsWith("image/")) return true;
        const filename = String(asset.filepath || asset.path || asset.filename || "");
        const ext = filename.split(".").pop()?.toLowerCase() || "";
        return IMAGE_PRELOAD_EXTENSIONS.has(ext);
    }

    function trackPreloadRef(img: any) {
        if (!img) return;
        try {
            state._preloadRefs = state._preloadRefs || new Set();
            state._preloadRefs.add(img);
            const cleanup = () => {
                try {
                    state._preloadRefs?.delete?.(img);
                } catch (e: any) {
                    console.debug?.(e);
                }
            };
            img.addEventListener("load", cleanup, { once: true, passive: true });
            img.addEventListener("error", cleanup, { once: true, passive: true });
        } catch (e: any) {
            console.debug?.(e);
        }
    }

    function preloadImageForAsset(asset: any, url: any) {
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
                } catch (e: any) {
                    console.debug?.(e);
                }
            }
        }
        try {
            const img = new Image();
            img.decoding = "async";
            try {
                img.loading = "lazy";
            } catch (e: any) {
                console.debug?.(e);
            }
            img.alt = "";
            img.src = url;
            trackPreloadRef(img);
        } catch (e: any) {
            console.debug?.(e);
        }
    }

    function preloadAdjacentAssets(assets: any, centerIndex: any) {
        const assetList = Array.isArray(assets) ? assets : [];
        if (!assetList.length) return;
        // Preload ±3 images for smoother navigation (prioritize closest first)
        const candidates = [
            centerIndex - 1,
            centerIndex + 1,
            centerIndex - 2,
            centerIndex + 2,
            centerIndex - 3,
            centerIndex + 3,
        ];
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
