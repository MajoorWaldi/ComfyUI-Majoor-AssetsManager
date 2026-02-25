/** Asset card rendering helpers extracted from GridView_impl.js (P3-B-04). */

export function getFilenameKey(filename) {
    try {
        return String(filename || "").trim().toLowerCase();
    } catch {
        return "";
    }
}

export function getExtUpper(filename) {
    try {
        return (String(filename || "").split(".").pop() || "").toUpperCase();
    } catch {
        return "";
    }
}

export function getStemLower(filename) {
    try {
        const s = String(filename || "");
        const idx = s.lastIndexOf(".");
        const stem = idx > 0 ? s.slice(0, idx) : s;
        return String(stem || "").trim().toLowerCase();
    } catch {
        return "";
    }
}

export function detectKind(asset, extUpper) {
    const k = String(asset?.kind || "").toLowerCase();
    if (k) return k;
    const images = new Set(["PNG", "JPG", "JPEG", "WEBP", "GIF", "BMP", "TIF", "TIFF"]);
    const videos = new Set(["MP4", "WEBM", "MOV", "AVI", "MKV"]);
    const audio = new Set(["MP3", "WAV", "OGG", "FLAC"]);
    if (images.has(extUpper)) return "image";
    if (videos.has(extUpper)) return "video";
    if (audio.has(extUpper)) return "audio";
    return "unknown";
}

export function isHidePngSiblingsEnabled(loadMajoorSettings) {
    try {
        const s = loadMajoorSettings();
        return !!s?.siblings?.hidePngSiblings;
    } catch {
        return false;
    }
}

export function setCollisionTooltip(card, filename, count) {
    if (!card || count == null) return;
    const n = Number(count) || 0;
    if (n < 2) return;
    try {
        const row = card.querySelector?.(".mjr-card-filename");
        if (row) {
            row.title = `${String(filename || "")}\nName collision: ${n} items in this view`;
            return;
        }
    } catch {}
    try {
        card.title = `Name collision: ${n} items in this view`;
    } catch {}
}

export function buildCollisionPaths(bucket) {
    const out = [];
    const seen = new Set();
    for (const asset of bucket || []) {
        const raw =
            asset?.filepath
            || asset?.path
            || (asset?.subfolder ? `${asset.subfolder}/${asset.filename || ""}` : `${asset?.filename || ""}`);
        const p = String(raw || "").trim();
        if (!p) continue;
        const key = p.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(p);
    }
    return out;
}

export function appendAssets(gridContainer, assets, state, deps) {
    const hidePngSiblings = isHidePngSiblingsEnabled(deps.loadMajoorSettings);
    const filenameCounts = state.filenameCounts || new Map();
    state.filenameCounts = filenameCounts;
    const nonImageStems = state.nonImageStems || new Set();
    state.nonImageStems = nonImageStems;
    deps.clearGridMessage(gridContainer);
    const vg = deps.ensureVirtualGrid(gridContainer, state);
    if (!vg) return 0;
    if (state.hiddenPngSiblings == null) state.hiddenPngSiblings = 0;
    if (!hidePngSiblings) state.hiddenPngSiblings = 0;
    const stemMap = state.stemMap || new Map();
    state.stemMap = stemMap;
    const assetIdSet = state.assetIdSet || new Set();
    state.assetIdSet = assetIdSet;
    const filenameToAssets = new Map();
    for (const existing of state.assets || []) {
        const key = getFilenameKey(existing?.filename);
        if (!key) continue;
        let list = filenameToAssets.get(key);
        if (!list) {
            list = [];
            filenameToAssets.set(key, list);
        }
        list.push(existing);
    }
    let addedCount = 0;
    let needsUpdate = false;
    const validNewAssets = [];
    const assetsToRemoveFromState = new Set();
    const applyFilenameCollisions = () => {
        try {
            for (const [key, bucket] of filenameToAssets.entries()) {
                const count = bucket.length;
                filenameCounts.set(key, count);
                if (count < 2) {
                    for (const asset of bucket) {
                        asset._mjrNameCollision = false;
                        delete asset._mjrNameCollisionCount;
                        delete asset._mjrNameCollisionPaths;
                    }
                    const renderedList = state.renderedFilenameMap.get(key);
                    if (renderedList) {
                        for (const card of renderedList) {
                            const badge = card.querySelector?.(".mjr-file-badge");
                            deps.setFileBadgeCollision(badge, false);
                        }
                    }
                    continue;
                }
                const paths = buildCollisionPaths(bucket);
                for (const asset of bucket) {
                    asset._mjrNameCollision = true;
                    asset._mjrNameCollisionCount = count;
                    asset._mjrNameCollisionPaths = paths;
                }
                const renderedList = state.renderedFilenameMap.get(key);
                if (renderedList) {
                    for (const card of renderedList) {
                        const badge = card.querySelector?.(".mjr-file-badge");
                        const asset = card._mjrAsset;
                        deps.setFileBadgeCollision(badge, true, {
                            filename: asset?.filename || "",
                            count,
                            paths: asset?._mjrNameCollisionPaths || paths,
                        });
                        setCollisionTooltip(card, asset?.filename, count);
                    }
                }
            }
        } catch {}
    };
    if (hidePngSiblings) {
        for (const asset of assets || []) {
            const filename = String(asset?.filename || "");
            const extUpper = getExtUpper(filename);
            const kind = detectKind(asset, extUpper);
            if (kind === "video") {
                const stem = getStemLower(filename);
                if (stem) nonImageStems.add(stem);
            }
        }
    }
    for (const asset of assets || []) {
        try {
            if (asset?.id == null || String(asset.id).trim() === "") {
                const kindLower = String(asset?.kind || "").toLowerCase();
                const fp = String(asset?.filepath || "").trim();
                const sub = String(asset?.subfolder || "").trim();
                const name = String(asset?.filename || "").trim();
                const type = String(asset?.type || "").trim().toLowerCase();
                const base = `${type}|${kindLower}|${fp}|${sub}|${name}`;
                asset.id = `asset:${base || "unknown"}`;
            }
        } catch {}
        const filename = String(asset?.filename || "");
        const extUpper = getExtUpper(filename);
        const stemLower = getStemLower(filename);
        const kind = detectKind(asset, extUpper);
        if (hidePngSiblings && stemLower) {
            if (kind === "video") {
                const list = stemMap.get(stemLower);
                if (list) {
                    for (let i = list.length - 1; i >= 0; i--) {
                        if (getExtUpper(list[i].filename) === "PNG") {
                            assetsToRemoveFromState.add(list[i]);
                            list.splice(i, 1);
                        }
                    }
                }
            } else if (extUpper === "PNG" && nonImageStems.has(stemLower)) {
                state.hiddenPngSiblings += 1;
                continue;
            }
        }
        const fnKey = getFilenameKey(filename);
        if (fnKey) {
            let bucket = filenameToAssets.get(fnKey);
            if (!bucket) {
                bucket = [];
                filenameToAssets.set(fnKey, bucket);
            }
            bucket.push(asset);
        }
        const key = deps.assetKey(asset);
        if (!key) continue;
        if (state.seenKeys.has(key)) continue;
        if (asset.id != null && assetIdSet.has(String(asset.id))) continue;
        state.seenKeys.add(key);
        if (asset.id != null) assetIdSet.add(String(asset.id));
        validNewAssets.push(asset);
        if (stemLower) {
            let list = stemMap.get(stemLower);
            if (!list) {
                list = [];
                stemMap.set(stemLower, list);
            }
            list.push(asset);
        }
        addedCount++;
    }
    if (assetsToRemoveFromState.size > 0) {
        state.hiddenPngSiblings += assetsToRemoveFromState.size;
        state.assets = state.assets.filter((a) => !assetsToRemoveFromState.has(a));
        for (const removed of assetsToRemoveFromState) {
            try {
                if (removed?.id != null) assetIdSet.delete(String(removed.id));
            } catch {}
        }
        try {
            for (const removed of assetsToRemoveFromState) {
                const key = getFilenameKey(removed?.filename);
                if (!key) continue;
                const bucket = filenameToAssets.get(key);
                if (!bucket) continue;
                const idx = bucket.indexOf(removed);
                if (idx > -1) bucket.splice(idx, 1);
                if (!bucket.length) filenameToAssets.delete(key);
            }
        } catch {}
        needsUpdate = true;
    }
    if (validNewAssets.length > 0) {
        state.assets.push(...validNewAssets);
        needsUpdate = true;
    }
    if (needsUpdate) {
        applyFilenameCollisions();
        vg.setItems(state.assets);
        if (state.sentinel) {
            gridContainer.appendChild(state.sentinel);
        }
    }
    try {
        gridContainer.dataset.mjrHidePngSiblingsEnabled = hidePngSiblings ? "1" : "0";
        gridContainer.dataset.mjrHiddenPngSiblings = String(Number(state.hiddenPngSiblings || 0) || 0);
    } catch {}
    return addedCount;
}

export function updateGridSettingsClasses(container, deps) {
    return deps.updateGridSettingsClasses(container);
}
