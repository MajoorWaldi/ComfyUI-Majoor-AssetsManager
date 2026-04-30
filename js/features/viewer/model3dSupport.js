import { drawMediaError } from "./imageProcessor.js";

const MODEL3D_ANIMATION_SPEEDS = [0.25, 0.5, 1.0, 1.5, 2.0];
const MODEL3D_ANIM_BAR_HEIGHT_PX = 44;

export function stopModel3DEvent(event, { preventDefault = false, immediate = false } = {}) {
    if (!event) return;
    try {
        if (preventDefault) event.preventDefault?.();
    } catch (e) {
        console.debug?.(e);
    }
    try {
        event.stopPropagation?.();
        if (immediate) event.stopImmediatePropagation?.();
    } catch (e) {
        console.debug?.(e);
    }
}

export function formatModel3DAnimTime(totalSeconds) {
    const s = Math.max(0, Number(totalSeconds) || 0);
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return m > 0 ? `${m}:${String(ss).padStart(2, "0")}` : `${Math.floor(s)}s`;
}

export function createModel3DViewportButton(label, title) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(label || "");
    button.title = String(title || label || "");
    button.setAttribute("aria-label", String(title || label || "3D viewport action"));
    button.style.cssText = [
        "height:28px",
        "padding:0 10px",
        "border-radius:999px",
        "border:1px solid rgba(255,255,255,0.16)",
        "background:rgba(13,15,20,0.78)",
        "color:rgba(255,255,255,0.92)",
        "font:600 11px system-ui,sans-serif",
        "letter-spacing:0.02em",
        "cursor:pointer",
        "backdrop-filter:blur(8px)",
        "display:inline-flex",
        "align-items:center",
        "justify-content:center",
        "box-shadow:0 4px 18px rgba(0,0,0,0.24)",
    ].join(";");
    return button;
}

export function setModel3DViewportButtonActive(button, active) {
    if (!button) return;
    const on = Boolean(active);
    button.dataset.active = on ? "1" : "0";
    button.style.background = on ? "rgba(76,175,80,0.18)" : "rgba(13,15,20,0.78)";
    button.style.borderColor = on ? "rgba(76,175,80,0.42)" : "rgba(255,255,255,0.16)";
    button.style.color = on ? "rgba(230,255,235,0.96)" : "rgba(255,255,255,0.92)";
}

export function drawModel3DMessage(canvas, title, hint = "", accent = "#4CAF50") {
    if (!canvas) return;
    try {
        const w = Math.max(480, Number(canvas.width) || 0 || 960);
        const h = Math.max(270, Number(canvas.height) || 0 || 540);
        canvas.width = w;
        canvas.height = h;
    } catch (e) {
        console.debug?.(e);
    }
    const ctx = (() => {
        try {
            return canvas.getContext("2d");
        } catch {
            return null;
        }
    })();
    if (!ctx) return;
    const width = Number(canvas.width) || 960;
    const height = Number(canvas.height) || 540;
    const cx = width / 2;
    const cy = height / 2;
    try {
        const bg = ctx.createLinearGradient(0, 0, width, height);
        bg.addColorStop(0, "#0f1419");
        bg.addColorStop(1, "#11181f");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);
        ctx.save();
        ctx.translate(cx, cy - 32);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.moveTo(0, -44);
        ctx.lineTo(42, -22);
        ctx.lineTo(42, 22);
        ctx.lineTo(0, 44);
        ctx.lineTo(-42, 22);
        ctx.lineTo(-42, -22);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -44);
        ctx.lineTo(0, 0);
        ctx.lineTo(42, 22);
        ctx.moveTo(0, 0);
        ctx.lineTo(-42, 22);
        ctx.moveTo(-42, -22);
        ctx.lineTo(0, 0);
        ctx.moveTo(42, -22);
        ctx.lineTo(0, 0);
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = "rgba(255,255,255,0.94)";
        ctx.font = "600 18px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(title || "3D preview"), cx, cy + 44);
        if (hint) {
            ctx.fillStyle = "rgba(255,255,255,0.62)";
            ctx.font = "13px system-ui, sans-serif";
            ctx.fillText(String(hint), cx, cy + 72);
        }
    } catch (e) {
        console.debug?.(e);
        try {
            drawMediaError(canvas, title, hint || "3D viewer unavailable");
        } catch (err) {
            console.debug?.(err);
        }
    }
}

export function createModel3DSettingsPanel({
    defaultBgColor,
    defaultFov,
    defaultLightIntensity,
    hasSkeleton,
} = {}) {
    const panel = document.createElement("div");
    panel.className = "mjr-model3d-settings";
    panel.style.cssText = [
        "position:absolute",
        "right:0",
        "top:44px",
        "width:210px",
        "max-height:calc(100% - 100px)",
        "overflow-y:auto",
        "background:rgba(14,18,26,0.96)",
        "border:1px solid rgba(255,255,255,0.10)",
        "border-right:none",
        "border-radius:10px 0 0 10px",
        "padding:10px 10px 12px 10px",
        "z-index:4",
        "display:none",
        "box-shadow:-6px 4px 24px rgba(0,0,0,0.5)",
        "backdrop-filter:blur(12px)",
        "font:13px system-ui,sans-serif",
        "color:rgba(255,255,255,0.88)",
        "scrollbar-width:thin",
    ].join(";");

    [
        "pointerdown",
        "pointermove",
        "pointerup",
        "mousedown",
        "mousemove",
        "mouseup",
        "wheel",
        "click",
        "contextmenu",
        "dragstart",
        "dragover",
        "drop",
    ].forEach((evt) => {
        panel.addEventListener(evt, (e) => stopModel3DEvent(e, { preventDefault: false }));
    });

    const addSectionHeader = (title) => {
        const h = document.createElement("div");
        h.style.cssText = [
            "font:700 10px system-ui,sans-serif",
            "letter-spacing:0.08em",
            "color:rgba(255,255,255,0.40)",
            "text-transform:uppercase",
            "margin:10px 0 6px 0",
        ].join(";");
        h.textContent = title;
        panel.appendChild(h);
        const sep = document.createElement("div");
        sep.style.cssText = "height:1px;background:rgba(255,255,255,0.07);margin-bottom:8px;";
        panel.appendChild(sep);
    };

    const addRow = (label, control) => {
        const row = document.createElement("div");
        row.style.cssText =
            "display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:6px;";
        const lbl = document.createElement("span");
        lbl.style.cssText =
            "font:500 11px system-ui,sans-serif;color:rgba(255,255,255,0.65);white-space:nowrap;flex-shrink:0;";
        lbl.textContent = label;
        row.appendChild(lbl);
        row.appendChild(control);
        panel.appendChild(row);
        return row;
    };

    const makeSelect = (opts, defaultVal) => {
        const sel = document.createElement("select");
        sel.style.cssText = [
            "background:rgba(25,30,42,0.95)",
            "color:rgba(255,255,255,0.88)",
            "border:1px solid rgba(255,255,255,0.14)",
            "border-radius:6px",
            "padding:3px 5px",
            "font:11px system-ui,sans-serif",
            "cursor:pointer",
            "flex:1",
            "min-width:0",
        ].join(";");
        for (const [val, lbl] of opts) {
            const opt = document.createElement("option");
            opt.value = val;
            opt.textContent = lbl;
            if (val === defaultVal) opt.selected = true;
            sel.appendChild(opt);
        }
        return sel;
    };

    const makeSlider = (min, max, step, defaultVal) => {
        const wrap = document.createElement("div");
        wrap.style.cssText = "display:flex;align-items:center;gap:5px;flex:1;";
        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = String(min);
        slider.max = String(max);
        slider.step = String(step);
        slider.value = String(defaultVal);
        slider.style.cssText = "flex:1;cursor:pointer;accent-color:#4CAF50;height:3px;";
        const valLbl = document.createElement("span");
        valLbl.style.cssText =
            "font:11px system-ui,sans-serif;color:rgba(255,255,255,0.45);min-width:26px;text-align:right;";
        valLbl.textContent = String(defaultVal);
        slider.addEventListener("input", () => {
            valLbl.textContent = slider.value;
        });
        wrap.appendChild(slider);
        wrap.appendChild(valLbl);
        return { wrap, slider, valLbl };
    };

    addSectionHeader("Scene");
    const bgInput = document.createElement("input");
    bgInput.type = "color";
    bgInput.value = defaultBgColor || "#282828";
    bgInput.style.cssText =
        "width:34px;height:24px;cursor:pointer;border:1px solid rgba(255,255,255,0.18);border-radius:4px;padding:1px;background:none;flex-shrink:0;";
    addRow("Background", bgInput);

    addSectionHeader("Model");
    const materialSel = makeSelect(
        [
            ["original", "Original"],
            ["normal", "Normal map"],
            ["depth", "Depth"],
            ["wireframe", "Wireframe"],
            ["pointcloud", "Point cloud"],
        ],
        "original",
    );
    addRow("Material", materialSel);

    const upSel = makeSelect(
        [
            ["original", "Original"],
            ["+y", "+Y (default)"],
            ["-y", "-Y"],
            ["+z", "+Z (CAD)"],
            ["-z", "-Z"],
            ["+x", "+X"],
            ["-x", "-X"],
        ],
        "original",
    );
    addRow("Up", upSel);

    let skeletonRow = null;
    let skeletonToggle = null;
    if (hasSkeleton) {
        skeletonToggle = document.createElement("input");
        skeletonToggle.type = "checkbox";
        skeletonToggle.checked = false;
        skeletonToggle.style.cssText = "cursor:pointer;accent-color:#4CAF50;flex-shrink:0;";
        skeletonRow = addRow("Skeleton", skeletonToggle);
    }

    addSectionHeader("Camera");
    const fovData = makeSlider(15, 120, 1, defaultFov ?? 75);
    addRow("FOV", fovData.wrap);

    addSectionHeader("Lights");
    const lightData = makeSlider(0, 5, 0.1, defaultLightIntensity ?? 1.0);
    addRow("Intensity", lightData.wrap);

    return {
        panel,
        bgInput,
        materialSel,
        upSel,
        skeletonToggle,
        skeletonRow,
        fovSlider: fovData.slider,
        fovValLbl: fovData.valLbl,
        lightSlider: lightData.slider,
        lightValLbl: lightData.valLbl,
    };
}

export function createModel3DAnimationBar() {
    const bar = document.createElement("div");
    bar.className = "mjr-model3d-anim-bar";
    bar.style.cssText = [
        "position:absolute",
        "bottom:0",
        "left:0",
        "right:0",
        `height:${MODEL3D_ANIM_BAR_HEIGHT_PX}px`,
        "display:none",
        "align-items:center",
        "gap:7px",
        "padding:0 10px",
        "background:rgba(10,13,20,0.90)",
        "backdrop-filter:blur(10px)",
        "border-top:1px solid rgba(255,255,255,0.07)",
        "z-index:3",
    ].join(";");

    [
        "pointerdown",
        "pointermove",
        "pointerup",
        "mousedown",
        "mousemove",
        "mouseup",
        "wheel",
        "click",
    ].forEach((evt) => {
        bar.addEventListener(evt, (e) => stopModel3DEvent(e, { preventDefault: false }));
    });

    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.textContent = "▶";
    playBtn.title = "Play / Pause";
    playBtn.style.cssText = [
        "width:28px",
        "height:28px",
        "border-radius:50%",
        "border:1px solid rgba(255,255,255,0.18)",
        "background:rgba(76,175,80,0.14)",
        "color:rgba(255,255,255,0.92)",
        "font:600 12px system-ui,sans-serif",
        "cursor:pointer",
        "flex-shrink:0",
        "padding:0",
        "line-height:1",
        "display:flex",
        "align-items:center",
        "justify-content:center",
    ].join(";");

    const speedSel = document.createElement("select");
    speedSel.title = "Playback speed";
    speedSel.style.cssText = [
        "background:rgba(20,24,34,0.9)",
        "color:rgba(255,255,255,0.8)",
        "border:1px solid rgba(255,255,255,0.14)",
        "border-radius:6px",
        "padding:3px 4px",
        "font:11px system-ui,sans-serif",
        "cursor:pointer",
        "width:52px",
        "flex-shrink:0",
    ].join(";");
    for (const spd of MODEL3D_ANIMATION_SPEEDS) {
        const opt = document.createElement("option");
        opt.value = String(spd);
        opt.textContent = `${spd}×`;
        if (spd === 1.0) opt.selected = true;
        speedSel.appendChild(opt);
    }

    const animSel = document.createElement("select");
    animSel.title = "Animation clip";
    animSel.style.cssText = [
        "background:rgba(20,24,34,0.9)",
        "color:rgba(255,255,255,0.8)",
        "border:1px solid rgba(255,255,255,0.14)",
        "border-radius:6px",
        "padding:3px 5px",
        "font:11px system-ui,sans-serif",
        "cursor:pointer",
        "max-width:130px",
        "flex-shrink:1",
        "min-width:0",
    ].join(";");

    const progressSlider = document.createElement("input");
    progressSlider.type = "range";
    progressSlider.min = "0";
    progressSlider.max = "1000";
    progressSlider.value = "0";
    progressSlider.style.cssText =
        "flex:1;min-width:50px;cursor:pointer;accent-color:#4CAF50;height:3px;";

    const timeLbl = document.createElement("span");
    timeLbl.style.cssText = [
        "font:500 11px system-ui,sans-serif",
        "color:rgba(255,255,255,0.45)",
        "white-space:nowrap",
        "flex-shrink:0",
    ].join(";");
    timeLbl.textContent = "0s / 0s";

    bar.appendChild(playBtn);
    bar.appendChild(speedSel);
    bar.appendChild(animSel);
    bar.appendChild(progressSlider);
    bar.appendChild(timeLbl);

    return { bar, playBtn, speedSel, animSel, progressSlider, timeLbl };
}
