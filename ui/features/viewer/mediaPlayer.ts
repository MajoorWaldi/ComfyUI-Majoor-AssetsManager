import { mountVideoControls } from "../../components/VideoControls.js";

export function mountUnifiedMediaControls(mediaEl: any, opts: Record<string, any> = {}): any {
    try {
        if (!mediaEl) return null;
        const mediaKind = String(opts?.mediaKind || "").toLowerCase();
        return mountVideoControls(mediaEl, { ...opts, mediaKind });
    } catch {
        return null;
    }
}
