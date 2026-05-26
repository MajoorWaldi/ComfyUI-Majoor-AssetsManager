const assetDragStartCleanupByContainer = new WeakMap();

let internalDropOccurred = false;

export function getAssetDragStartCleanup(containerEl: any): (() => void) | null {
    if (!containerEl) return null;
    return assetDragStartCleanupByContainer.get(containerEl) || null;
}

export function setAssetDragStartCleanup(containerEl: any, cleanup: (() => void) | null): (() => void) | null {
    if (!containerEl) return null;
    if (typeof cleanup === "function") {
        assetDragStartCleanupByContainer.set(containerEl, cleanup);
        return cleanup;
    }
    assetDragStartCleanupByContainer.delete(containerEl);
    return null;
}

export function clearAssetDragStartCleanup(containerEl: any): void {
    if (!containerEl) return;
    assetDragStartCleanupByContainer.delete(containerEl);
}

export function markInternalDropOccurred(): void {
    internalDropOccurred = true;
}

export function consumeInternalDropOccurred(): boolean {
    if (!internalDropOccurred) return false;
    internalDropOccurred = false;
    return true;
}

export function resetDndRuntimeState(): void {
    internalDropOccurred = false;
}
