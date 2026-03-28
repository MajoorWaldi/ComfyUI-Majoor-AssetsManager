/** Asset card rendering helpers extracted from GridView_impl.js (P3-B-04). */

export function getFilenameKey(filename) {
    try {
        return String(filename || "")
            .trim()
            .toLowerCase();
    } catch {
        return "";
    }
}

export function getExtUpper(filename) {
    try {
        return (
            String(filename || "")
                .split(".")
                .pop() || ""
        ).toUpperCase();
    } catch {
        return "";
    }
}

export function getStemLower(filename) {
    try {
        const s = String(filename || "");
        const idx = s.lastIndexOf(".");
        const stem = idx > 0 ? s.slice(0, idx) : s;
        return String(stem || "")
            .trim()
            .toLowerCase();
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
    // 3D model formats added by ComfyUI v1.42 (load3d extension)
    const model3d = new Set(["OBJ", "FBX", "GLB", "GLTF", "STL", "PLY", "SPLAT", "KSPLAT", "SPZ"]);
    if (images.has(extUpper)) return "image";
    if (videos.has(extUpper)) return "video";
    if (audio.has(extUpper)) return "audio";
    if (model3d.has(extUpper)) return "model3d";
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
    } catch (e) {
        console.debug?.(e);
    }
    try {
        card.title = `Name collision: ${n} items in this view`;
    } catch (e) {
        console.debug?.(e);
    }
}

export function buildCollisionPaths(bucket) {
    const out = [];
    const seen = new Set();
    for (const asset of bucket || []) {
        const raw =
            asset?.filepath ||
            asset?.path ||
            (asset?.subfolder
                ? `${asset.subfolder}/${asset.filename || ""}`
                : `${asset?.filename || ""}`);
        const p = String(raw || "").trim();
        if (!p) continue;
        const key = p.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(p);
    }
    return out;
}

function getSiblingContextKey(asset) {
    const source = String(asset?.source || asset?.type || "").trim().toLowerCase();
    const rootId = String(asset?.root_id || asset?.custom_root_id || "").trim().toLowerCase();
    const subfolder = String(asset?.subfolder || "").trim().toLowerCase();
    return `${source}|${rootId}|${subfolder}`;
}

function getSiblingMatchKey(asset, extUpper = getExtUpper(asset?.filename || "")) {
    const kind = detectKind(asset, extUpper);
    const filename = String(asset?.filename || "").trim();
    if (!filename) return "";
    const ctx = getSiblingContextKey(asset);
    if (kind === "model3d") {
        return `${ctx}|model3d|${filename.toLowerCase()}`;
    }
    const stem = getStemLower(filename);
    if (!stem) return "";
    return `${ctx}|media|${stem}`;
}

function ensureSiblingState(state) {
    const nonImageSiblingKeys = state.nonImageSiblingKeys || new Set();
    state.nonImageSiblingKeys = nonImageSiblingKeys;
    const stemMap = state.stemMap || new Map();
    state.stemMap = stemMap;
    const assetIdSet = state.assetIdSet || new Set();
    state.assetIdSet = assetIdSet;
    const seenKeys = state.seenKeys || new Set();
    state.seenKeys = seenKeys;
    if (state.hiddenPngSiblings == null) state.hiddenPngSiblings = 0;
    return { nonImageSiblingKeys, stemMap, assetIdSet, seenKeys };
}

function unregisterHiddenSibling(state, removed, siblingMaps) {
    try {
        if (removed?.id != null) siblingMaps.assetIdSet.delete(String(removed.id));
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const removedKey = state?.assetKeyFn?.(removed);
        if (removedKey) siblingMaps.seenKeys.delete(removedKey);
    } catch (e) {
        console.debug?.(e);
    }
}

function removeExistingHiddenSiblings(state, matchKey, siblingMaps, predicate) {
    const list = siblingMaps.stemMap.get(matchKey);
    if (!list?.length) return [];
    const removed = [];
    for (let i = list.length - 1; i >= 0; i--) {
        if (!predicate(list[i])) continue;
        removed.push(list[i]);
        list.splice(i, 1);
    }
    if (!list.length) siblingMaps.stemMap.delete(matchKey);
    return removed;
}

export function shouldHideSiblingAsset(asset, state, loadMajoorSettings) {
    const hidePngSiblings = isHidePngSiblingsEnabled(loadMajoorSettings);
    if (!hidePngSiblings) return { hidden: false, hideEnabled: false, removed: [] };
    const siblingMaps = ensureSiblingState(state);
    const filename = String(asset?.filename || "");
    const extUpper = getExtUpper(filename);
    const kind = detectKind(asset, extUpper);
    const matchKey = getSiblingMatchKey(asset, extUpper);
    if (!matchKey) return { hidden: false, hideEnabled: true, removed: [] };

    if (kind === "video" || kind === "audio" || kind === "model3d") {
        siblingMaps.nonImageSiblingKeys.add(matchKey);
        const removed = removeExistingHiddenSiblings(
            state,
            matchKey,
            siblingMaps,
            (item) => getExtUpper(item?.filename || "") === "PNG",
        );
        return { hidden: false, hideEnabled: true, removed };
    }

    if (extUpper === "PNG") {
        const model3dPngKey = `${getSiblingContextKey(asset)}|model3d|${getStemLower(filename)}`;
        if (
            siblingMaps.nonImageSiblingKeys.has(matchKey) ||
            siblingMaps.nonImageSiblingKeys.has(model3dPngKey)
        ) {
            return { hidden: true, hideEnabled: true, removed: [] };
        }
    }

    return { hidden: false, hideEnabled: true, removed: [] };
}

export function appendAssets(gridContainer, assets, state, deps) {
    const hidePngSiblings = isHidePngSiblingsEnabled(deps.loadMajoorSettings);
    const filenameCounts = state.filenameCounts || new Map();
    state.filenameCounts = filenameCounts;
    deps.clearGridMessage(gridContainer);
    const vg = deps.ensureVirtualGrid(gridContainer, state);
    if (!vg) return 0;
    if (!hidePngSiblings) state.hiddenPngSiblings = 0;
    state.assetKeyFn = deps.assetKey;
    const siblingMaps = ensureSiblingState(state);
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
        } catch (e) {
            console.debug?.(e);
        }
    };
    for (const asset of assets || []) {
        try {
            if (asset?.id == null || String(asset.id).trim() === "") {
                const kindLower = String(asset?.kind || "").toLowerCase();
                const fp = String(asset?.filepath || "").trim();
                const sub = String(asset?.subfolder || "").trim();
                const name = String(asset?.filename || "").trim();
                const type = String(asset?.type || "")
                    .trim()
                    .toLowerCase();
                const base = `${type}|${kindLower}|${fp}|${sub}|${name}`;
                asset.id = `asset:${base || "unknown"}`;
            }
        } catch (e) {
            console.debug?.(e);
        }
        const filename = String(asset?.filename || "");
        const extUpper = getExtUpper(filename);
        const match = shouldHideSiblingAsset(asset, state, deps.loadMajoorSettings);
        for (const removed of match.removed || []) assetsToRemoveFromState.add(removed);
        if (match.hidden) {
            state.hiddenPngSiblings += 1;
            continue;
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
        if (siblingMaps.seenKeys.has(key)) continue;
        if (asset.id != null && siblingMaps.assetIdSet.has(String(asset.id))) continue;
        siblingMaps.seenKeys.add(key);
        if (asset.id != null) siblingMaps.assetIdSet.add(String(asset.id));
        validNewAssets.push(asset);
        const matchKey = getSiblingMatchKey(asset, extUpper);
        if (matchKey) {
            let list = siblingMaps.stemMap.get(matchKey);
            if (!list) {
                list = [];
                siblingMaps.stemMap.set(matchKey, list);
            }
            list.push(asset);
        }
        addedCount++;
    }
    if (assetsToRemoveFromState.size > 0) {
        state.hiddenPngSiblings += assetsToRemoveFromState.size;
        state.assets = state.assets.filter((a) => !assetsToRemoveFromState.has(a));
        for (const removed of assetsToRemoveFromState) {
            unregisterHiddenSibling(state, removed, siblingMaps);
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
        } catch (e) {
            console.debug?.(e);
        }
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
        gridContainer.dataset.mjrHiddenPngSiblings = String(
            Number(state.hiddenPngSiblings || 0) || 0,
        );
    } catch (e) {
        console.debug?.(e);
    }
    return addedCount;
}

export function updateGridSettingsClasses(container, deps) {
    return deps.updateGridSettingsClasses(container);
}
