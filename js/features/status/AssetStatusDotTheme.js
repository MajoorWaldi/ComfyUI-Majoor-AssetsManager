function _norm(value) {
    return String(value || "").trim().toLowerCase();
}

function isCustomBrowserScope({ dot = null, asset = null, scope = "" } = {}) {
    const explicit = _norm(scope);
    if (explicit) return explicit === "custom";

    const fromAsset = _norm(asset?.type || asset?.scope);
    if (fromAsset) return fromAsset === "custom";

    try {
        const fromGrid = _norm(dot?.closest?.(".mjr-grid")?.dataset?.mjrScope);
        if (fromGrid) return fromGrid === "custom";
    } catch (e) { console.debug?.(e); }

    return false;
}

export function resolveAssetStatusDotColor(state, context = {}) {
    const s = _norm(state);
    const isCustom = isCustomBrowserScope(context);

    if (isCustom) {
        // Custom/Browser palette: explicitly no blue tones.
        if (s === "pending" || s === "info") return "var(--mjr-browser-status-info, #4DB6AC)";
        if (s === "success") return "var(--mjr-browser-status-success, #2E7D32)";
        if (s === "warning") return "var(--mjr-browser-status-warning, #FFB74D)";
        if (s === "error") return "var(--mjr-browser-status-error, #EF5350)";
        return "var(--mjr-browser-status-neutral, #90A4AE)";
    }

    if (s === "pending" || s === "info") return "var(--mjr-status-info, #64B5F6)";
    if (s === "success") return "var(--mjr-status-success, #4CAF50)";
    if (s === "warning") return "var(--mjr-status-warning, #FFA726)";
    if (s === "error") return "var(--mjr-status-error, #f44336)";
    return "var(--mjr-status-neutral, #666)";
}

