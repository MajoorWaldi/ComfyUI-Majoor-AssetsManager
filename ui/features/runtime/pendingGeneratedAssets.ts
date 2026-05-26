let _pendingGeneratedAssetCount = 0;

export function markPendingGeneratedAsset(count: number = 1): number {
    const n = Math.max(1, Number(count) || 1);
    _pendingGeneratedAssetCount += n;
    try {
        (window as any).__mjrPendingGeneratedAssetCount = _pendingGeneratedAssetCount;
    } catch {
        /* ignore */
    }
    return _pendingGeneratedAssetCount;
}

export function consumePendingGeneratedAssets(): number {
    const count = _pendingGeneratedAssetCount;
    _pendingGeneratedAssetCount = 0;
    try {
        (window as any).__mjrPendingGeneratedAssetCount = 0;
    } catch {
        /* ignore */
    }
    return count;
}

export function getPendingGeneratedAssetCount(): number {
    return _pendingGeneratedAssetCount;
}
