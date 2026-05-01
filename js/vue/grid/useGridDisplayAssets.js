import { getFilenameKey } from "../../features/grid/AssetCardRenderer.js";

export function getDisplayGroupKey(asset) {
    const filenameKey = getFilenameKey(asset?.filename);
    if (!filenameKey) return "";
    const source = String(asset?.source || asset?.type || "").trim().toLowerCase();
    const rootId = String(asset?.root_id || asset?.custom_root_id || "").trim().toLowerCase();
    const subfolder = String(asset?.subfolder || "").trim().toLowerCase();
    return `${source}|${rootId}|${subfolder}|${filenameKey}`;
}

export function isRenderableAsset(asset) {
    return !!asset && asset._mjrDupHidden !== true;
}

export function buildDisplayAssets(assets) {
    const list = Array.isArray(assets) ? assets : [];
    const buckets = new Map();
    const output = [];

    for (const asset of list) {
        if (!asset) continue;
        const filenameKey = getDisplayGroupKey(asset);
        if (!filenameKey) {
            asset._mjrNameCollision = false;
            delete asset._mjrNameCollisionCount;
            delete asset._mjrNameCollisionPaths;
            asset._mjrDupStack = false;
            asset._mjrDupMembers = null;
            asset._mjrDupCount = 0;
            output.push(asset);
            continue;
        }

        let bucket = buckets.get(filenameKey);
        if (!bucket) {
            bucket = [];
            buckets.set(filenameKey, bucket);
            output.push(asset);
        }
        bucket.push(asset);
    }

    for (const bucket of buckets.values()) {
        for (const member of bucket) {
            member._mjrNameCollision = false;
            delete member._mjrNameCollisionCount;
            delete member._mjrNameCollisionPaths;
            member._mjrDupStack = false;
            member._mjrDupMembers = null;
            member._mjrDupCount = 0;
        }
        if (bucket.length >= 2) {
            const rep = bucket[0];
            const prevMembers = Array.isArray(rep._mjrDupMembers) ? rep._mjrDupMembers : [];
            const memberIds = new Set(prevMembers.map((entry) => String(entry?.id || "")));
            const mergedMembers = [
                ...prevMembers,
                ...bucket.filter((entry) => !memberIds.has(String(entry?.id || ""))),
            ];
            rep._mjrDupStack = true;
            rep._mjrDupMembers = mergedMembers;
            rep._mjrDupCount = mergedMembers.length;
        }
    }

    return output;
}

export function getRenderableAssets(assets) {
    return buildDisplayAssets(assets).filter(isRenderableAsset);
}
