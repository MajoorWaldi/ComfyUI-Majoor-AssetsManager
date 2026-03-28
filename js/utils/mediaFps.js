export function parseFpsValue(value) {
    try {
        const n = Number(value);
        if (Number.isFinite(n) && n > 0) return n;
        const s = String(value || "").trim();
        if (!s) return null;
        if (s.includes("/")) {
            const [a, b] = s.split("/");
            const na = Number(a);
            const nb = Number(b);
            if (Number.isFinite(na) && Number.isFinite(nb) && nb !== 0) {
                const fps = na / nb;
                return Number.isFinite(fps) && fps > 0 ? fps : null;
            }
        }
        const f = Number.parseFloat(s);
        return Number.isFinite(f) && f > 0 ? f : null;
    } catch {
        return null;
    }
}

export function readAssetFps(asset) {
    try {
        const raw = asset?.metadata_raw || {};
        const ff = raw?.raw_ffprobe || {};
        const vs = ff?.video_stream || {};
        return (
            parseFpsValue(asset?.fps) ??
            parseFpsValue(raw?.fps) ??
            parseFpsValue(raw?.frame_rate) ??
            parseFpsValue(vs?.avg_frame_rate) ??
            parseFpsValue(vs?.r_frame_rate)
        );
    } catch {
        return null;
    }
}

export function readAssetFrameCount(asset, fps) {
    try {
        const raw = asset?.metadata_raw || {};
        const ff = raw?.raw_ffprobe || {};
        const vs = ff?.video_stream || {};

        const direct =
            Number(asset?.frame_count) ||
            Number(raw?.frame_count) ||
            Number(raw?.frames) ||
            Number(vs?.nb_frames) ||
            Number(vs?.nb_read_frames) ||
            0;
        if (Number.isFinite(direct) && direct > 0) return Math.floor(direct);

        const dur = Number(asset?.duration ?? raw?.duration ?? vs?.duration);
        if (Number.isFinite(dur) && dur > 0 && Number.isFinite(fps) && fps > 0) {
            return Math.max(1, Math.round(dur * fps));
        }
    } catch (e) {
        console.debug?.(e);
    }
    return null;
}

export function formatFps(fps) {
    const n = Number(fps);
    if (!Number.isFinite(n) || n <= 0) return "";
    if (Math.abs(n - Math.round(n)) < 0.001) return `${Math.round(n)} fps`;
    return `${n.toFixed(3).replace(/\.?0+$/, "")} fps`;
}

export function normalizeVideoFps(value, fallback = 30) {
    const parsed = parseFpsValue(value);
    if (parsed != null) return Math.max(1, Math.round(parsed * 1000) / 1000);
    const fallbackParsed = parseFpsValue(fallback);
    if (fallbackParsed != null) return Math.max(1, Math.round(fallbackParsed * 1000) / 1000);
    return 30;
}
