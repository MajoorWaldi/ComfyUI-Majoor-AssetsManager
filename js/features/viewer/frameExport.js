/**
 * Frame export module — PNG download and clipboard copy.
 * No external dependencies beyond the canvas/blob browser API.
 */

export function createFrameExporter({ state, VIEWER_MODES, singleView, abView, sideView }) {
    function _getExportSourceCanvas() {
        try {
            if (state?.mode === VIEWER_MODES.SINGLE) {
                const c = singleView?.querySelector?.("canvas.mjr-viewer-media");
                return c instanceof HTMLCanvasElement ? c : null;
            }
            if (state?.mode === VIEWER_MODES.AB_COMPARE) {
                const m = String(state?.abCompareMode || "wipe");
                if (m === "wipe" || m === "wipeV") {
                    const a = abView?.querySelector?.('canvas.mjr-viewer-media[data-mjr-compare-role="A"]');
                    const b = abView?.querySelector?.('canvas.mjr-viewer-media[data-mjr-compare-role="B"]');
                    if (a instanceof HTMLCanvasElement && b instanceof HTMLCanvasElement) return { a, b, mode: m };
                }
                const d = abView?.querySelector?.('canvas.mjr-viewer-media[data-mjr-compare-role="D"]');
                if (d instanceof HTMLCanvasElement) return d;
                const any = abView?.querySelector?.("canvas.mjr-viewer-media");
                return any instanceof HTMLCanvasElement ? any : null;
            }
            if (state?.mode === VIEWER_MODES.SIDE_BY_SIDE) {
                const any = sideView?.querySelector?.("canvas.mjr-viewer-media");
                return any instanceof HTMLCanvasElement ? any : null;
            }
            return null;
        } catch {
            return null;
        }
    }

    const _canvasToBlob = (canvas, mime = "image/png", quality = 0.92) =>
        new Promise((resolve) => {
            try {
                if (canvas?.toBlob) {
                    canvas.toBlob((b) => resolve(b), mime, quality);
                    return;
                }
            } catch (e) { console.debug?.(e); }
            try {
                const dataUrl = canvas?.toDataURL?.(mime, quality);
                if (!dataUrl || typeof dataUrl !== "string") return resolve(null);
                const parts = dataUrl.split(",");
                const b64 = parts[1] || "";
                const bin = atob(b64);
                const arr = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
                resolve(new Blob([arr], { type: mime }));
            } catch {
                resolve(null);
            }
        });

    async function exportCurrentFrame({ toClipboard = false } = {}) {
        try {
            const src = _getExportSourceCanvas();
            if (!src) return false;

            let canvas = null;
            if (src instanceof HTMLCanvasElement) {
                canvas = src;
            } else if (src?.a && src?.b) {
                const a = src.a;
                const b = src.b;
                const w = Math.max(1, Math.min(Number(a.width) || 0, Number(b.width) || 0));
                const h = Math.max(1, Math.min(Number(a.height) || 0, Number(b.height) || 0));
                if (!(w > 1 && h > 1)) return false;
                const out = document.createElement("canvas");
                out.width = w;
                out.height = h;
                const ctx = out.getContext("2d");
                if (!ctx) return false;
                try {
                    ctx.drawImage(b, 0, 0, w, h);
                } catch (e) { console.debug?.(e); }
                const p = Math.max(0, Math.min(100, Number(state?._abWipePercent) || 50)) / 100;
                try {
                    ctx.save();
                    ctx.beginPath();
                    if (src.mode === "wipeV") {
                        ctx.rect(0, 0, w, h * p);
                    } else {
                        ctx.rect(0, 0, w * p, h);
                    }
                    ctx.clip();
                    ctx.drawImage(a, 0, 0, w, h);
                    ctx.restore();
                } catch (e) { console.debug?.(e); }
                canvas = out;
            }

            if (!canvas) return false;
            const blob = await _canvasToBlob(canvas, "image/png");
            if (!blob) return false;

            if (toClipboard) {
                try {
                    const ClipboardItemCtor = globalThis?.ClipboardItem;
                    const clip = navigator?.clipboard;
                    if (!ClipboardItemCtor || !clip?.write) return false;
                    await clip.write([new ClipboardItemCtor({ "image/png": blob })]);
                    return true;
                } catch {
                    return false;
                }
            }

            // Download (best-effort)
            try {
                const current = state?.assets?.[state?.currentIndex] || null;
                const base = String(current?.filename || "frame").replace(/[\\/:*?"<>|]+/g, "_");
                const name = `${base.replace(/\.[^.]+$/, "") || "frame"}_export.png`;
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = name;
                a.rel = "noopener";
                a.click();
                try {
                    setTimeout(() => URL.revokeObjectURL(url), 2000);
                } catch (e) { console.debug?.(e); }
                return true;
            } catch {
                return false;
            }
        } catch {
            return false;
        }
    }

    return { exportCurrentFrame };
}
