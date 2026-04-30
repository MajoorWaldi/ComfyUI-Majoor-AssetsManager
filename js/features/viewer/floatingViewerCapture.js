import { t } from "../../app/i18n.js";
import { MFV_MODES } from "./floatingViewerConstants.js";
import {
    drawFloatingViewerCanvasLabel,
    drawFloatingViewerCanvasRoundRect,
    getFloatingViewerMediaKind,
    resolveFloatingViewerMediaUrl,
} from "./floatingViewerMedia.js";

export async function drawFloatingViewerMediaFit(
    viewer,
    ctx,
    fileData,
    ox,
    oy,
    w,
    h,
    preferredVideo,
) {
    if (!fileData) return;
    const kind = getFloatingViewerMediaKind(fileData);
    let drawable = null;

    if (kind === "video") {
        drawable =
            preferredVideo instanceof HTMLVideoElement
                ? preferredVideo
                : viewer._contentEl?.querySelector("video") || null;
    }
    if (!drawable && kind === "model3d") {
        const assetId = fileData?.id != null ? String(fileData.id) : "";
        if (assetId) {
            drawable =
                viewer._contentEl?.querySelector?.(
                    `.mjr-model3d-render-canvas[data-mjr-asset-id="${assetId}"]`,
                ) || null;
        }
        if (!drawable) {
            drawable = viewer._contentEl?.querySelector?.(".mjr-model3d-render-canvas") || null;
        }
    }
    if (!drawable) {
        const url = resolveFloatingViewerMediaUrl(fileData);
        if (!url) return;
        drawable = await new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = url;
        });
    }
    if (!drawable) return;

    const sw = drawable.videoWidth || drawable.naturalWidth || w;
    const sh = drawable.videoHeight || drawable.naturalHeight || h;
    if (!sw || !sh) return;
    const scale = Math.min(w / sw, h / sh);
    ctx.drawImage(
        drawable,
        ox + (w - sw * scale) / 2,
        oy + (h - sh * scale) / 2,
        sw * scale,
        sh * scale,
    );
}

export function estimateFloatingViewerGenInfoOverlayHeight(viewer, ctx, fileData, regionWidth) {
    if (!ctx || !fileData || !viewer._genInfoSelections.size) return 0;
    const fields = viewer._getGenFields(fileData);
    const order = [
        "prompt",
        "seed",
        "model",
        "lora",
        "sampler",
        "scheduler",
        "cfg",
        "step",
        "genTime",
    ];
    const fontSize = 11;
    const lh = 16;
    const pad = 8;
    const boxW = Math.max(100, Number(regionWidth || 0) - pad * 2);
    let lineCount = 0;

    for (const k of order) {
        if (!viewer._genInfoSelections.has(k)) continue;
        const v = fields[k] != null ? String(fields[k]) : "";
        if (!v) continue;

        let labelText = k.charAt(0).toUpperCase() + k.slice(1);
        if (k === "lora") labelText = "LoRA";
        else if (k === "cfg") labelText = "CFG";
        else if (k === "genTime") labelText = "Gen Time";

        const label = `${labelText}: `;
        ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
        const labelW = ctx.measureText(label).width;
        ctx.font = `${fontSize}px system-ui, sans-serif`;
        const availW = Math.max(32, boxW - pad * 2 - labelW);

        let lines = 0;
        let line = "";
        for (const word of v.split(" ")) {
            const test = line ? line + " " + word : word;
            if (ctx.measureText(test).width > availW && line) {
                lines += 1;
                line = word;
            } else {
                line = test;
            }
        }
        if (line) lines += 1;
        lineCount += lines;
    }

    return lineCount > 0 ? lineCount * lh + pad * 2 : 0;
}

export function drawFloatingViewerGenInfoOverlay(viewer, ctx, fileData, ox, oy, w, h) {
    if (!fileData || !viewer._genInfoSelections.size) return;
    const fields = viewer._getGenFields(fileData);
    const LABEL_COLORS = {
        prompt: "#7ec8ff",
        seed: "#ffd47a",
        model: "#7dda8a",
        lora: "#d48cff",
        sampler: "#ff9f7a",
        scheduler: "#ff7a9f",
        cfg: "#7a9fff",
        step: "#7affd4",
        genTime: "#e0ff7a",
    };
    const order = [
        "prompt",
        "seed",
        "model",
        "lora",
        "sampler",
        "scheduler",
        "cfg",
        "step",
        "genTime",
    ];

    const entries = [];
    for (const k of order) {
        if (!viewer._genInfoSelections.has(k)) continue;
        const v = fields[k] != null ? String(fields[k]) : "";
        if (!v) continue;

        let labelText = k.charAt(0).toUpperCase() + k.slice(1);
        if (k === "lora") labelText = "LoRA";
        else if (k === "cfg") labelText = "CFG";
        else if (k === "genTime") labelText = "Gen Time";

        entries.push({
            label: `${labelText}: `,
            value: v,
            color: LABEL_COLORS[k] || "#ffffff",
        });
    }
    if (!entries.length) return;

    const fontSize = 11;
    const lh = 16;
    const pad = 8;
    const boxW = Math.max(100, w - pad * 2);

    ctx.save();

    const rows = [];
    for (const { label, value, color } of entries) {
        ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
        const labelW = ctx.measureText(label).width;
        ctx.font = `${fontSize}px system-ui, sans-serif`;
        const availW = boxW - pad * 2 - labelW;
        const lines = [];
        let line = "";
        for (const word of value.split(" ")) {
            const test = line ? line + " " + word : word;
            if (ctx.measureText(test).width > availW && line) {
                lines.push(line);
                line = word;
            } else {
                line = test;
            }
        }
        if (line) lines.push(line);
        rows.push({ label, labelW, lines, color });
    }

    const lineCount = rows.reduce((sum, row) => sum + row.lines.length, 0);
    const boxH = lineCount * lh + pad * 2;
    const boxX = ox + pad;
    const boxY = oy + h - boxH - pad;

    ctx.globalAlpha = 0.72;
    ctx.fillStyle = "#000";
    drawFloatingViewerCanvasRoundRect(ctx, boxX, boxY, boxW, boxH, 6);
    ctx.fill();
    ctx.globalAlpha = 1;

    let ty = boxY + pad + fontSize;
    for (const { label, labelW, lines, color } of rows) {
        for (let i = 0; i < lines.length; i++) {
            if (i === 0) {
                ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
                ctx.fillStyle = color;
                ctx.fillText(label, boxX + pad, ty);
                ctx.font = `${fontSize}px system-ui, sans-serif`;
                ctx.fillStyle = "rgba(255,255,255,0.88)";
                ctx.fillText(lines[i], boxX + pad + labelW, ty);
            } else {
                ctx.font = `${fontSize}px system-ui, sans-serif`;
                ctx.fillStyle = "rgba(255,255,255,0.88)";
                ctx.fillText(lines[i], boxX + pad + labelW, ty);
            }
            ty += lh;
        }
    }
    ctx.restore();
}

export async function captureFloatingViewerView(viewer) {
    if (!viewer._contentEl) return;

    if (viewer._captureBtn) {
        viewer._captureBtn.disabled = true;
        viewer._captureBtn.setAttribute("aria-label", t("tooltip.capturingView", "Capturing…"));
    }

    const w = viewer._contentEl.clientWidth || 480;
    const baseH = viewer._contentEl.clientHeight || 360;
    let h = baseH;

    if (viewer._mode === MFV_MODES.SIMPLE && viewer._mediaA && viewer._genInfoSelections.size) {
        const measureCanvas = document.createElement("canvas");
        measureCanvas.width = w;
        measureCanvas.height = baseH;
        const measureCtx = measureCanvas.getContext("2d");
        const neededBoxH = viewer._estimateGenInfoOverlayHeight(measureCtx, viewer._mediaA, w);
        if (neededBoxH > 0) {
            const desiredH = Math.max(baseH, neededBoxH + 24);
            h = Math.min(desiredH, baseH * 4);
        }
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, w, h);

    try {
        if (viewer._mode === MFV_MODES.SIMPLE) {
            if (viewer._mediaA) {
                await viewer._drawMediaFit(ctx, viewer._mediaA, 0, 0, w, baseH);
                viewer._drawGenInfoOverlay(ctx, viewer._mediaA, 0, 0, w, h);
            }
        } else if (viewer._mode === MFV_MODES.AB) {
            const divX = Math.round(viewer._abDividerX * w);
            const vidA = viewer._contentEl.querySelector(
                ".mjr-mfv-ab-layer:not(.mjr-mfv-ab-layer--b) video",
            );
            const vidB = viewer._contentEl.querySelector(".mjr-mfv-ab-layer--b video");

            if (viewer._mediaA) {
                await viewer._drawMediaFit(ctx, viewer._mediaA, 0, 0, w, h, vidA);
            }

            if (viewer._mediaB) {
                ctx.save();
                ctx.beginPath();
                ctx.rect(divX, 0, w - divX, h);
                ctx.clip();
                await viewer._drawMediaFit(ctx, viewer._mediaB, 0, 0, w, h, vidB);
                ctx.restore();
            }

            ctx.save();
            ctx.strokeStyle = "rgba(255,255,255,0.88)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(divX, 0);
            ctx.lineTo(divX, h);
            ctx.stroke();
            ctx.restore();

            drawFloatingViewerCanvasLabel(ctx, "A", 8, 8);
            drawFloatingViewerCanvasLabel(ctx, "B", divX + 8, 8);
            if (viewer._mediaA) viewer._drawGenInfoOverlay(ctx, viewer._mediaA, 0, 0, divX, h);
            if (viewer._mediaB) {
                viewer._drawGenInfoOverlay(ctx, viewer._mediaB, divX, 0, w - divX, h);
            }
        } else if (viewer._mode === MFV_MODES.SIDE) {
            const half = Math.floor(w / 2);
            const vidA = viewer._contentEl.querySelector(".mjr-mfv-side-panel:first-child video");
            const vidB = viewer._contentEl.querySelector(".mjr-mfv-side-panel:last-child video");

            if (viewer._mediaA) {
                await viewer._drawMediaFit(ctx, viewer._mediaA, 0, 0, half, h, vidA);
                viewer._drawGenInfoOverlay(ctx, viewer._mediaA, 0, 0, half, h);
            }
            ctx.fillStyle = "#111";
            ctx.fillRect(half, 0, 2, h);
            if (viewer._mediaB) {
                await viewer._drawMediaFit(ctx, viewer._mediaB, half, 0, half, h, vidB);
                viewer._drawGenInfoOverlay(ctx, viewer._mediaB, half, 0, half, h);
            }
            drawFloatingViewerCanvasLabel(ctx, "A", 8, 8);
            drawFloatingViewerCanvasLabel(ctx, "B", half + 8, 8);
        } else if (viewer._mode === MFV_MODES.GRID) {
            const halfW = Math.floor(w / 2);
            const halfH = Math.floor(h / 2);
            const gap = 1;
            const cells = [
                { media: viewer._mediaA, label: "A", x: 0, y: 0, w: halfW - gap, h: halfH - gap },
                {
                    media: viewer._mediaB,
                    label: "B",
                    x: halfW + gap,
                    y: 0,
                    w: halfW - gap,
                    h: halfH - gap,
                },
                {
                    media: viewer._mediaC,
                    label: "C",
                    x: 0,
                    y: halfH + gap,
                    w: halfW - gap,
                    h: halfH - gap,
                },
                {
                    media: viewer._mediaD,
                    label: "D",
                    x: halfW + gap,
                    y: halfH + gap,
                    w: halfW - gap,
                    h: halfH - gap,
                },
            ];
            const gridCells = viewer._contentEl.querySelectorAll(".mjr-mfv-grid-cell");
            for (let i = 0; i < cells.length; i++) {
                const c = cells[i];
                const vid = gridCells[i]?.querySelector("video") || null;
                if (c.media) {
                    await viewer._drawMediaFit(ctx, c.media, c.x, c.y, c.w, c.h, vid);
                    viewer._drawGenInfoOverlay(ctx, c.media, c.x, c.y, c.w, c.h);
                }
                drawFloatingViewerCanvasLabel(ctx, c.label, c.x + 8, c.y + 8);
            }
            ctx.save();
            ctx.fillStyle = "#111";
            ctx.fillRect(halfW - gap, 0, gap * 2, h);
            ctx.fillRect(0, halfH - gap, w, gap * 2);
            ctx.restore();
        }
    } catch (e) {
        console.debug("[MFV] capture error:", e);
    }

    const prefix =
        {
            [MFV_MODES.AB]: "mfv-ab",
            [MFV_MODES.SIDE]: "mfv-side",
            [MFV_MODES.GRID]: "mfv-grid",
        }[viewer._mode] ?? "mfv";
    const filename = `${prefix}-${Date.now()}.png`;
    try {
        const dataUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 100);
    } catch (e) {
        console.warn("[MFV] download failed:", e);
    } finally {
        if (viewer._captureBtn) {
            viewer._captureBtn.disabled = false;
            viewer._captureBtn.setAttribute(
                "aria-label",
                t("tooltip.captureView", "Save view as image"),
            );
        }
    }
}
