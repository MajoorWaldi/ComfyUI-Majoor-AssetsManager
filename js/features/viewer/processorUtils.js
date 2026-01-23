export function computeProcessorScale(maxPixels, w, h) {
    try {
        const mp = Number(maxPixels) || 0;
        const pixels = (Number(w) || 0) * (Number(h) || 0);
        if (!(pixels > 0)) return 1;
        if (!(mp > 0)) return 1;
        if (pixels <= mp) return 1;
        return Math.max(0.05, Math.min(1, Math.sqrt(mp / pixels)));
    } catch {
        return 1;
    }
}

