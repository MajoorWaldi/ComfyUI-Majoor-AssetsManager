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

/**
 * Check if asset is a video with audio track (detected by filename pattern).
 * Videos with "-audio" or "_audio" suffix contain audio.
 */
function isVideoWithAudio(asset) {
    try {
        const kind = String(asset?.kind || "").toLowerCase();
        if (kind !== "video") return false;
        const filename = String(asset?.filename || "").toLowerCase();
        return filename.includes("-audio") || filename.includes("_audio");
    } catch {
        return false;
    }
}

/**
 * Calculate priority for stack representative selection.
 * Higher priority = better candidate for stack cover.
 * Priority: video_with_audio > video > image > other
 */
function getStackRepPriority(asset) {
    try {
        const kind = String(asset?.kind || "").toLowerCase();
        let kindPriority = 0;
        if (isVideoWithAudio(asset)) {
            kindPriority = 2;
        } else if (kind === "video") {
            kindPriority = 1;
        }
        const hasGeneration = Number(asset?.has_generation_data || 0) > 0 ? 1 : 0;
        const size = Number(asset?.size || 0);
        const mtime = Number(asset?.mtime || 0);
        // Return array for comparison: [kindPriority, mtime, hasGeneration, size]
        return [kindPriority, mtime, hasGeneration, size];
    } catch {
        return [0, 0, 0, 0];
    }
}

/**
 * Compare two priority tuples. Returns > 0 if a > b.
 */
function comparePriority(a, b) {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const diff = (a[i] || 0) - (b[i] || 0);
        if (diff !== 0) return diff;
    }
    return 0;
}

/**
 * Select the best representative from a list of assets.
 * Prefers video with audio > video > image, then by mtime/generation/size.
 */
export function selectStackRepresentative(assets) {
    if (!Array.isArray(assets) || assets.length === 0) return null;
    if (assets.length === 1) return assets[0];
    let best = assets[0];
    let bestPriority = getStackRepPriority(best);
    for (let i = 1; i < assets.length; i++) {
        const asset = assets[i];
        const priority = getStackRepPriority(asset);
        if (comparePriority(priority, bestPriority) > 0) {
            best = asset;
            bestPriority = priority;
        }
    }
    return best;
}

export function preserveRepresentativeGenerationTime(primary, members) {
    if (!primary || !Array.isArray(members) || members.length === 0) return primary;
    const current = Number(primary?.generation_time_ms ?? primary?.metadata?.generation_time_ms ?? 0) || 0;
    if (current > 0) return primary;
    const donor = members.find(
        (asset) => (Number(asset?.generation_time_ms ?? asset?.metadata?.generation_time_ms ?? 0) || 0) > 0,
    );
    if (!donor) return primary;
    const donorMs = Number(donor?.generation_time_ms ?? donor?.metadata?.generation_time_ms ?? 0) || 0;
    if (donorMs <= 0) return primary;
    primary.generation_time_ms = donorMs;
    if (!primary.has_generation_data && donor?.has_generation_data) {
        primary.has_generation_data = donor.has_generation_data;
    }
    return primary;
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

function getFilenameCollisionKey(asset) {
    const filename = getFilenameKey(asset?.filename);
    if (!filename) return "";
    return `${getSiblingContextKey(asset)}|${filename}`;
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

export function unregisterHiddenSibling(state, removed, siblingMaps) {
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
        const key = getFilenameCollisionKey(existing);
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
            const visibleIds = new Set(
                (Array.isArray(state.assets) ? state.assets : [])
                    .map((a) => String(a?.id || ""))
                    .filter(Boolean),
            );
            for (const [key, bucket] of filenameToAssets.entries()) {
                const visibleBucket = (Array.isArray(bucket) ? bucket : []).filter((asset) => {
                    const id = String(asset?.id || "");
                    return id ? visibleIds.has(id) : false;
                });
                const count = visibleBucket.length;
                filenameCounts.set(key, count);

                if (count < 2) {
                    // Clear any stale dup-stack markers (count dropped back to 1)
                    for (const asset of visibleBucket) {
                        asset._mjrNameCollision = false;
                        delete asset._mjrNameCollisionCount;
                        delete asset._mjrNameCollisionPaths;
                        if (asset._mjrDupStack) {
                            asset._mjrDupStack = false;
                            asset._mjrDupMembers = null;
                            asset._mjrDupCount = 0;
                        }
                    }
                    const renderedList = state.renderedFilenameMap?.get(key);
                    if (renderedList) {
                        for (const card of renderedList) {
                            const badge = card.querySelector?.(".mjr-file-badge");
                            deps.setFileBadgeCollision(badge, false);
                            try { deps.ensureDupStackCard?.(gridContainer, card, card._mjrAsset); } catch (e) { console.debug?.(e); }
                        }
                    }
                    continue;
                }

                // ── count >= 2: group into a duplicate stack ──────────────────────────────
                // Select the best representative: prefer video_with_audio > video > image.
                const primary = preserveRepresentativeGenerationTime(
                    selectStackRepresentative(visibleBucket),
                    visibleBucket,
                );
                const secondaries = visibleBucket.filter((a) => a !== primary);

                // Ensure stale collision markers are cleared on all visible members.
                for (const asset of visibleBucket) {
                    asset._mjrNameCollision = false;
                    delete asset._mjrNameCollisionCount;
                    delete asset._mjrNameCollisionPaths;
                    if (asset !== primary) {
                        asset._mjrDupStack = false;
                        asset._mjrDupMembers = null;
                        asset._mjrDupCount = 0;
                    }
                }

                // Merge new duplicates with existing _mjrDupMembers to survive across pages.
                const prevMembers = Array.isArray(primary._mjrDupMembers) ? primary._mjrDupMembers : [];
                const prevIds = new Set(prevMembers.map((a) => String(a?.id || "")));
                const merged = [
                    ...prevMembers,
                    ...visibleBucket.filter((a) => !prevIds.has(String(a?.id || ""))),
                ];
                primary._mjrDupStack = true;
                primary._mjrDupMembers = merged;
                primary._mjrDupCount = merged.length;
                primary._mjrNameCollision = false; // primary card shows stack button, not red badge

                // Remove secondary copies from state.assets so only the primary card shows.
                const secondaryIds = new Set(secondaries.map((a) => String(a?.id || "")));
                if (secondaryIds.size > 0) {
                    state.assets = state.assets.filter((a) => !secondaryIds.has(String(a?.id || "")));
                }

                // Update rendered primary card: attach dup-stack button, clear red collision badge.
                const renderedList = state.renderedFilenameMap?.get(key);
                if (renderedList) {
                    for (const card of renderedList) {
                        const cardAsset = card._mjrAsset;
                        const badge = card.querySelector?.(".mjr-file-badge");
                        if (cardAsset === primary || String(cardAsset?.id || "") === String(primary?.id || "")) {
                            deps.setFileBadgeCollision(badge, false);
                            try { deps.ensureDupStackCard?.(gridContainer, card, primary); } catch (e) { console.debug?.(e); }
                        }
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
        const fnKey = getFilenameCollisionKey(asset);
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
                const key = getFilenameCollisionKey(removed);
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
