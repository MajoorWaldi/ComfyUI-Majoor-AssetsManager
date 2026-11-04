/** Error placeholder drawn into a media canvas when loading fails. */
export function drawMediaError(canvas: HTMLCanvasElement, message: string, hint?: string): void {
    if (!canvas) return;
    try {
        if (!(canvas.width > 1 && canvas.height > 1)) {
            canvas.width = 960;
            canvas.height = 540;
        }
    } catch (e: any) {
        console.debug?.(e);
    }
    const ctx = (() => {
        try {
            return canvas.getContext?.("2d");
        } catch {
            return null;
        }
    })();
    if (!ctx) return;
    try {
        ctx.save();
    } catch (e: any) {
        console.debug?.(e);
    }
    try {
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } catch (e: any) {
        console.debug?.(e);
    }
    try {
        ctx.fillStyle = "rgba(255, 120, 120, 0.95)";
        ctx.font = "14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
        ctx.textBaseline = "top";
        const text = message ? String(message) : "Failed to load media";
        ctx.fillText(text, 14, 14);
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        const hintText =
            hint != null ? String(hint) : "Check file permissions / path, or try re-indexing.";
        ctx.fillText(hintText, 14, 34);
    } catch (e: any) {
        console.debug?.(e);
    }
    try {
        ctx.restore();
    } catch (e: any) {
        console.debug?.(e);
    }
}
