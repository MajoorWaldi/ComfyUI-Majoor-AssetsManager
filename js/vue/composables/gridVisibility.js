function hasVisibleClientRect(element) {
    try {
        if (typeof element?.getClientRects !== "function") return true;
        return element.getClientRects().length > 0;
    } catch (e) {
        console.debug?.(e);
        return false;
    }
}

function isElementConnectedAndVisibleInternal(element, { requireClientRect = true } = {}) {
    if (!element || typeof element !== "object") return false;
    try {
        if (typeof document !== "undefined" && document.hidden) return false;
    } catch (e) {
        console.debug?.(e);
    }
    try {
        if (!element.isConnected) return false;
    } catch (e) {
        console.debug?.(e);
        return false;
    }
    try {
        if (typeof element.closest === "function" && element.closest("[hidden], [aria-hidden='true']")) {
            return false;
        }
    } catch (e) {
        console.debug?.(e);
    }
    try {
        if (typeof getComputedStyle === "function") {
            const style = getComputedStyle(element);
            if (!style || style.display === "none" || style.visibility === "hidden") {
                return false;
            }
        }
    } catch (e) {
        console.debug?.(e);
    }
    if (!requireClientRect) return true;
    return hasVisibleClientRect(element);
}

export function isElementConnectedAndVisible(element) {
    return isElementConnectedAndVisibleInternal(element, { requireClientRect: true });
}

export function isGridHostVisible(gridContainer, scrollElement = null) {
    const measuredElement = scrollElement || gridContainer;
    const measuredVisible = isElementConnectedAndVisible(measuredElement);
    if (!measuredVisible) return false;

    if (
        gridContainer &&
        gridContainer !== measuredElement &&
        !isElementConnectedAndVisibleInternal(gridContainer, { requireClientRect: false })
    ) {
        return false;
    }

    try {
        const clientWidth = Number(measuredElement?.clientWidth || 0) || 0;
        const clientHeight = Number(measuredElement?.clientHeight || 0) || 0;
        return clientWidth > 0 && clientHeight > 0;
    } catch (e) {
        console.debug?.(e);
        return false;
    }
}