let _pendingGeneratedAssetCount = 0;

export function markPendingGeneratedAsset(count = 1) {
    const n = Math.max(1, Number(count) || 1);
    _pendingGeneratedAssetCount += n;
    try {
        window.__mjrPendingGeneratedAssetCount = _pendingGeneratedAssetCount;
    } catch {
        /* ignore */
    }
    return _pendingGeneratedAssetCount;
}

export function consumePendingGeneratedAssets() {
    const count = _pendingGeneratedAssetCount;
    _pendingGeneratedAssetCount = 0;
    try {
        window.__mjrPendingGeneratedAssetCount = 0;
    } catch {
        /* ignore */
    }
    return count;
}

export function getPendingGeneratedAssetCount() {
    return _pendingGeneratedAssetCount;
}
