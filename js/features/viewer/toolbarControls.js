import { safeCall } from "./lifecycle.js";
import { createIconButton } from "../../components/buttons.js";
import { t } from "../../app/i18n.js";
import { appendTooltipHint } from "../../utils/tooltipShortcuts.js";

export function createViewerToolbarControls({
    VIEWER_MODES,
    state,
    onToolsChanged,
    onCompareModeChanged,
    onExportFrame,
    onCopyFrame,
    onAudioVizModeChanged,
    getCanAB,
} = {}) {
    const DEFAULT_TOOL_STATE = {
        channel: "rgb",
        exposureEV: 0,
        gamma: 1.0,
        analysisMode: "none",
        scopesMode: "off",
        gridMode: 0,
        overlayMaskEnabled: false,
        overlayMaskOpacity: 0.65,
        overlayFormat: "image",
        probeEnabled: false,
        loupeEnabled: false,
        hudEnabled: true,
        distractionFree: false,
        genInfoOpen: true,
        abCompareMode: "wipe",
        audioVisualizerMode: "artistic",
    };

    const toolsRow = document.createElement("div");
    toolsRow.className = "mjr-viewer-tools";
    toolsRow.style.cssText = `
        display: block;
        padding: 8px 8px 6px;
        border-top: 0.8px solid rgba(196, 202, 210, 0.16);
        background: rgba(12, 14, 19, 0.22);
    `;

    const toolsDeck = document.createElement("div");
    toolsDeck.className = "mjr-viewer-tools-deck";
    toolsDeck.style.cssText =
        "display:flex; flex-wrap:nowrap; gap:8px; align-items:center; min-width:0; overflow-x:auto; overflow-y:hidden;";

    const createToolsPanel = ({ key, eyebrow, title } = {}) => {
        const panel = document.createElement("section");
        panel.className = "mjr-viewer-tools-panel";
        if (key) panel.dataset.panel = String(key);
        panel.style.cssText =
            "display:flex; flex-direction:column; gap:4px; min-width:0; padding:5px 6px; border-radius:10px; border:1px solid rgba(255,255,255,0.08); background:linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02)); box-shadow:inset 0 1px 0 rgba(255,255,255,0.04); flex:0 0 auto;";

        const head = document.createElement("div");
        head.className = "mjr-viewer-tools-panel-head";
        head.style.cssText =
            "display:none; align-items:flex-start; justify-content:space-between; gap:6px; min-width:0;";

        const heading = document.createElement("div");
        heading.className = "mjr-viewer-tools-panel-heading";
        heading.style.cssText = "display:flex; flex-direction:column; gap:1px; min-width:0;";

        const eyebrowEl = document.createElement("span");
        eyebrowEl.className = "mjr-viewer-tools-panel-eyebrow";
        eyebrowEl.textContent = eyebrow || "";

        const titleEl = document.createElement("span");
        titleEl.className = "mjr-viewer-tools-panel-title";
        titleEl.textContent = title || "";

        const body = document.createElement("div");
        body.className = "mjr-viewer-tools-panel-body";
        body.style.cssText =
            "display:flex; align-items:center; flex-wrap:nowrap; gap:6px; min-width:0;";

        heading.appendChild(eyebrowEl);
        heading.appendChild(titleEl);
        head.appendChild(heading);
        panel.appendChild(head);
        panel.appendChild(body);

        return { panel, body, head, heading, eyebrowEl, titleEl };
    };

    const gradePanel = createToolsPanel({ key: "grade", eyebrow: "Image", title: "Adjustments" });
    const overlayPanel = createToolsPanel({
        key: "overlay",
        eyebrow: "Viewer",
        title: "Guides & Compare",
    });
    const inspectPanel = createToolsPanel({ key: "inspect", eyebrow: "Inspect", title: "Probe" });
    const actionPanel = createToolsPanel({
        key: "actions",
        eyebrow: "Actions",
        title: "Reset & Export",
    });
    const infoPanel = createToolsPanel({ key: "info", eyebrow: "Infos", title: "Help" });

    const toolsActions = document.createElement("div");
    toolsActions.className = "mjr-viewer-tools-actions";
    toolsActions.style.cssText =
        "display:flex; align-items:center; justify-content:flex-start; gap:6px; flex-wrap:wrap; min-width:0;";

    const toolsMeta = document.createElement("div");
    toolsMeta.className = "mjr-viewer-tools-meta";
    toolsMeta.style.cssText =
        "display:flex; align-items:center; justify-content:flex-start; gap:6px; flex-wrap:nowrap; min-width:0;";

    const toolsGroup = ({ key, label, accentRgb } = {}) => {
        const g = document.createElement("div");
        g.className = "mjr-viewer-tools-group";
        if (key) g.dataset.group = String(key);
        if (accentRgb) g.style.setProperty("--mjr-group-accent", String(accentRgb));
        g.style.cssText =
            "display:flex; align-items:center; gap:6px; padding:2px 6px; border-radius:8px; border:1px solid rgba(196,202,210,0.14); background:rgba(10,12,16,0.22);";
        if (label) {
            const l = document.createElement("span");
            l.className = "mjr-viewer-tools-group-label";
            l.textContent = label;
            l.style.cssText = "font-size: 10px; color: rgba(255,255,255,0.7);";
            g.appendChild(l);
        }
        return g;
    };

    const createSelect = (title, options) => {
        const s = document.createElement("select");
        s.title = title || "";
        s.className = "mjr-viewer-tools-select";
        s.style.cssText = `
            height: 24px;
            padding: 0 6px;
            border-radius: 6px;
            border: 0.8px solid rgba(196, 202, 210, 0.24);
            background: linear-gradient(180deg, rgba(210, 214, 220, 0.06), rgba(210, 214, 220, 0.02));
            color: rgba(230,233,238,0.92);
            font-size: 11px;
            outline: none;
        `;
        for (const o of options || []) {
            const opt = document.createElement("option");
            opt.value = String(o.value);
            opt.textContent = String(o.label);
            s.appendChild(opt);
        }
        return s;
    };

    const createRange = (title, { min, max, step, value }) => {
        const wrap = document.createElement("div");
        wrap.className = "mjr-viewer-tools-range";
        wrap.style.cssText = "display:flex; align-items:center; gap:6px;";

        const input = document.createElement("input");
        input.type = "range";
        input.className = "mjr-viewer-tools-range-input";
        input.min = String(min);
        input.max = String(max);
        input.step = String(step);
        input.value = String(value);
        input.title = title || "";
        input.style.cssText = `
            width: 92px;
            accent-color: rgba(255,255,255,0.85);
        `;

        const out = document.createElement("span");
        out.style.cssText =
            "font-size: 11px; color: rgba(255,255,255,0.9); min-width: 38px; text-align: right;";
        out.textContent = String(value);

        wrap.appendChild(input);
        wrap.appendChild(out);

        return { wrap, input, out };
    };

    const createToggle = (label, title, { iconClass = null, accentRgb = null } = {}) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "mjr-viewer-tool-btn";
        b.setAttribute("aria-label", title || label || "Toggle");
        b.setAttribute("aria-pressed", "false");
        if (accentRgb) {
            try {
                b.dataset.accentRgb = String(accentRgb);
            } catch (e) {
                console.debug?.(e);
            }
        }
        if (iconClass) {
            const icon = document.createElement("span");
            icon.className = `pi ${iconClass}`.trim();
            icon.setAttribute("aria-hidden", "true");
            icon.style.fontSize = "14px";
            b.appendChild(icon);

            const sr = document.createElement("span");
            sr.textContent = label || "";
            sr.style.cssText =
                "position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0;";
            b.appendChild(sr);
        } else {
            b.textContent = label;
        }
        b.title = title || "";
        b.style.cssText = `
            height: 24px;
            padding: 0 8px;
            border-radius: 6px;
            border: 0.8px solid rgba(196, 202, 210, 0.24);
            background: linear-gradient(180deg, rgba(210,214,220,0.06), rgba(210,214,220,0.02));
            color: rgba(230,233,238,0.92);
            cursor: pointer;
            font-size: 11px;
            user-select: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            position: relative;
        `;
        b.dataset.active = "0";
        const setActive = (active) => {
            const on = Boolean(active);
            b.dataset.active = on ? "1" : "0";
            try {
                b.setAttribute("aria-pressed", on ? "true" : "false");
            } catch (e) {
                console.debug?.(e);
            }
            const rgb = String(b.dataset?.accentRgb || "").trim();
            if (on && rgb) {
                b.style.background = `rgba(${rgb}, 0.12)`;
                b.style.borderColor = `rgba(${rgb}, 0.38)`;
                b.style.boxShadow = `0 0 0 0.8px rgba(${rgb}, 0.12) inset`;
            } else {
                b.style.background = on ? "rgba(214,218,224,0.12)" : "rgba(210,214,220,0.06)";
                b.style.borderColor = on ? "rgba(214,218,224,0.38)" : "rgba(196,202,210,0.24)";
                b.style.boxShadow = "";
            }
        };
        setActive(false);
        return { b, setActive };
    };

    const channelsSelect = createSelect("Channel View", [
        { value: "rgb", label: "RGB" },
        { value: "r", label: "R" },
        { value: "g", label: "G" },
        { value: "b", label: "B" },
        { value: "a", label: "Alpha" },
        { value: "l", label: "Luma" },
    ]);
    channelsSelect.title = t("tooltip.colorChannels", "View color channels or luminance");

    const exposureCtl = createRange("Exposure (EV)", { min: -10, max: 10, step: 0.1, value: 0 });
    const gammaCtl = createRange("Gamma", { min: 0.1, max: 3.0, step: 0.01, value: 1.0 });

    // Accents (RGB): comfy-friendly, subtle but distinct.
    const ACCENT = Object.freeze({
        channel: "120, 180, 255",
        exposure: "255, 200, 70",
        gamma: "190, 150, 255",
        analysis: "255, 140, 80",
        zebra: "255, 90, 90",
        overlay: "110, 240, 190",
        probe: "120, 255, 170",
        loupe: "180, 140, 255",
        compare: "90, 220, 220",
        geninfo: "200, 170, 255",
        audioviz: "255, 150, 80",
    });

    const SELECT_STYLE_DEFAULT = Object.freeze({
        borderColor: "rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.08)",
        boxShadow: "",
    });

    const setSelectHighlighted = (selectEl, { accentRgb, active, title } = {}) => {
        try {
            if (!selectEl) return;
            if (title) selectEl.title = String(title);
            const on = Boolean(active);
            if (!on) {
                selectEl.style.borderColor = SELECT_STYLE_DEFAULT.borderColor;
                selectEl.style.background = SELECT_STYLE_DEFAULT.background;
                selectEl.style.boxShadow = SELECT_STYLE_DEFAULT.boxShadow;
                return;
            }
            const rgb = String(accentRgb || "").trim();
            if (!rgb) return;
            selectEl.style.borderColor = `rgba(${rgb},0.55)`;
            selectEl.style.background = `rgba(${rgb},0.14)`;
            selectEl.style.boxShadow = `0 0 0 1px rgba(${rgb},0.14) inset`;
        } catch (e) {
            console.debug?.(e);
        }
    };

    const setChannelSelectStyle = (channel) => {
        try {
            const ch = String(channel || "rgb");
            const baseBorder = "rgba(255,255,255,0.14)";
            const baseBg = "rgba(255,255,255,0.08)";
            channelsSelect.style.boxShadow = "";
            if (ch === "r") {
                channelsSelect.style.borderColor = "rgba(255,90,90,0.60)";
                channelsSelect.style.background = "rgba(255,90,90,0.14)";
                channelsSelect.style.boxShadow = "0 0 0 1px rgba(255,90,90,0.14) inset";
                return;
            }
            if (ch === "g") {
                channelsSelect.style.borderColor = "rgba(90,255,140,0.55)";
                channelsSelect.style.background = "rgba(90,255,140,0.12)";
                channelsSelect.style.boxShadow = "0 0 0 1px rgba(90,255,140,0.12) inset";
                return;
            }
            if (ch === "b") {
                channelsSelect.style.borderColor = "rgba(90,160,255,0.60)";
                channelsSelect.style.background = "rgba(90,160,255,0.12)";
                channelsSelect.style.boxShadow = "0 0 0 1px rgba(90,160,255,0.12) inset";
                return;
            }
            if (ch === "l") {
                channelsSelect.style.borderColor = "rgba(255,210,90,0.60)";
                channelsSelect.style.background = "rgba(255,210,90,0.12)";
                channelsSelect.style.boxShadow = "0 0 0 1px rgba(255,210,90,0.12) inset";
                return;
            }
            if (ch === "a") {
                channelsSelect.style.borderColor = "rgba(220,220,220,0.35)";
                channelsSelect.style.background = "rgba(255,255,255,0.10)";
                channelsSelect.style.boxShadow = "0 0 0 1px rgba(255,255,255,0.08) inset";
                return;
            }
            // RGB (default): subtle tricolor.
            if (ch === "rgb") {
                channelsSelect.style.borderColor = "rgba(255,255,255,0.22)";
                channelsSelect.style.background =
                    "linear-gradient(90deg, rgba(255,90,90,0.16), rgba(90,255,140,0.14), rgba(90,160,255,0.16))";
                channelsSelect.style.boxShadow = "0 0 0 1px rgba(255,255,255,0.10) inset";
                return;
            }
            channelsSelect.style.borderColor = baseBorder;
            channelsSelect.style.background = baseBg;
        } catch (e) {
            console.debug?.(e);
        }
    };

    const setValueHighlighted = (el, { accentRgb, active } = {}) => {
        try {
            if (!el) return;
            const on = Boolean(active);
            if (!on) {
                el.style.color = "rgba(255,255,255,0.9)";
                return;
            }
            const rgb = String(accentRgb || "").trim();
            if (!rgb) return;
            el.style.color = `rgb(${rgb})`;
        } catch (e) {
            console.debug?.(e);
        }
    };

    const setGroupHighlighted = (groupEl, { accentRgb, active } = {}) => {
        try {
            if (!groupEl) return;
            const on = Boolean(active);
            if (!on) {
                groupEl.style.background = "";
                groupEl.style.borderColor = "transparent";
                groupEl.style.boxShadow = "";
                return;
            }
            const rgb = String(accentRgb || "").trim();
            if (!rgb) return;
            groupEl.style.background = `rgba(${rgb},0.10)`;
            groupEl.style.borderColor = `rgba(${rgb},0.38)`;
            groupEl.style.boxShadow = `0 0 0 1px rgba(${rgb},0.12) inset`;
        } catch (e) {
            console.debug?.(e);
        }
    };

    const zebraToggle = createToggle("Zebra", "Zebra Highlights (Z)", {
        iconClass: "pi-bars",
        accentRgb: ACCENT.zebra,
    });
    const scopesToggle = createToggle("Scopes", "Scopes overlay", {
        iconClass: "pi-chart-bar",
        accentRgb: ACCENT.analysis,
    });
    const scopesSelect = createSelect("Scopes", [
        { value: "off", label: "Off" },
        { value: "hist", label: "Histogram" },
        { value: "wave", label: "Waveform" },
        { value: "both", label: "Both" },
    ]);
    scopesSelect.title = t("tooltip.scopesHistogram", "Show histogram/waveform scopes");
    const gridToggle = createToggle("Grid", "Grid (G)", {
        iconClass: "pi-th-large",
        accentRgb: ACCENT.overlay,
    });
    const gridModeSelect = createSelect("Grid Overlay", [
        { value: 0, label: "Off" },
        { value: 1, label: "Thirds" },
        { value: 2, label: "Center" },
        { value: 3, label: "Safe" },
        { value: 4, label: "Golden" },
    ]);
    gridModeSelect.title = appendTooltipHint(
        t("tooltip.gridOverlay", "Grid overlay (rule of thirds, center)"),
        "G",
    );
    const maskToggle = createToggle("Mask", "Format mask (dim outside)", {
        iconClass: "pi-stop",
        accentRgb: ACCENT.overlay,
    });
    const formatSelect = createSelect("Format", [
        { value: "image", label: "Image" },
        { value: "16:9", label: "16:9" },
        { value: "1:1", label: "1:1" },
        { value: "4:3", label: "4:3" },
        { value: "2.39", label: "2.39" },
        { value: "9:16", label: "9:16" },
    ]);
    formatSelect.title = t("tooltip.aspectRatioMask", "Aspect ratio overlay mask");
    const maskOpacityCtl = createRange("Mask Opacity", {
        min: 0,
        max: 0.9,
        step: 0.05,
        value: 0.65,
    });
    const probeToggle = createToggle("Probe", "Pixel Probe (I)", {
        iconClass: "pi-eye",
        accentRgb: ACCENT.probe,
    });
    const loupeToggle = createToggle("Loupe", "Loupe (L)", {
        iconClass: "pi-search-plus",
        accentRgb: ACCENT.loupe,
    });
    const hudToggle = createToggle("HUD", "Viewer HUD", {
        iconClass: "pi-info-circle",
        accentRgb: ACCENT.overlay,
    });
    const focusToggle = createToggle("Focus", "Distraction-free mode (X)", {
        iconClass: "pi-window-maximize",
        accentRgb: ACCENT.overlay,
    });
    const genInfoToggle = createToggle(
        "Gen",
        appendTooltipHint("Generation info (prompt/model)", "D"),
        {
            iconClass: "pi-book",
            accentRgb: ACCENT.geninfo,
        },
    );

    const compareModeSelect = createSelect("A/B Compare Mode", [
        { value: "wipe", label: "Wipe (H)" },
        { value: "wipeV", label: "Wipe (V)" },
        { value: "difference", label: "Difference" },
        { value: "absdiff", label: "AbsDiff" },
        { value: "add", label: "Add" },
        { value: "subtract", label: "Subtract" },
        { value: "multiply", label: "Multiply" },
        { value: "screen", label: "Screen" },
    ]);
    compareModeSelect.title = t("tooltip.compareBlendMode", "Compare blend mode");
    const audioVizModeSelect = createSelect("Audio Visualizer", [
        { value: "simple", label: "Simple" },
        { value: "artistic", label: "Artistic" },
    ]);
    audioVizModeSelect.title = t("tooltip.audioVisualizer", "Audio visualizer mode");

    const resetGradeBtn = createIconButton(
        "Reset",
        t("tooltip.resetPlayerControls", "Reset all viewer controls"),
    );
    resetGradeBtn.style.height = "26px";
    resetGradeBtn.style.fontSize = "11px";
    resetGradeBtn.style.padding = "0 8px";
    resetGradeBtn.classList?.add?.("mjr-viewer-tool-btn", "mjr-viewer-tool-btn--reset");
    resetGradeBtn.classList?.add?.("mjr-viewer-tools-action", "mjr-viewer-tools-action--primary");
    resetGradeBtn.style.marginLeft = "auto";

    const exportBtn = document.createElement("button");
    exportBtn.type = "button";
    exportBtn.title = t("tooltip.exportFrame", "Save current frame as PNG");
    exportBtn.setAttribute("aria-label", t("tooltip.exportFrame", "Save frame as PNG"));
    exportBtn.className = "mjr-viewer-tool-btn mjr-viewer-tool-btn--reset";
    exportBtn.style.cssText =
        "height:24px; padding:0 8px; display:inline-flex; align-items:center; justify-content:center;";
    const exportIcon = document.createElement("span");
    exportIcon.className = "pi pi-download";
    exportIcon.setAttribute("aria-hidden", "true");
    exportIcon.style.fontSize = "14px";
    exportBtn.appendChild(exportIcon);
    exportBtn.classList?.add?.("mjr-viewer-tools-action");
    try {
        exportBtn.style.display = "none";
    } catch (e) {
        console.debug?.(e);
    }

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.title = t("tooltip.copyFrame", "Copy current frame to clipboard");
    copyBtn.setAttribute("aria-label", t("tooltip.copyFrame", "Copy frame to clipboard"));
    copyBtn.className = "mjr-viewer-tool-btn mjr-viewer-tool-btn--reset";
    copyBtn.style.cssText =
        "height:24px; padding:0 8px; display:inline-flex; align-items:center; justify-content:center;";
    const copyIcon = document.createElement("span");
    copyIcon.className = "pi pi-copy";
    copyIcon.setAttribute("aria-hidden", "true");
    copyIcon.style.fontSize = "14px";
    copyBtn.appendChild(copyIcon);
    copyBtn.classList?.add?.("mjr-viewer-tools-action");
    try {
        copyBtn.style.display = "none";
    } catch (e) {
        console.debug?.(e);
    }

    const chGroup = toolsGroup({ key: "channel", label: "Channel", accentRgb: ACCENT.channel });
    chGroup.appendChild(channelsSelect);
    gradePanel.body.appendChild(chGroup);

    const expGroup = toolsGroup({ key: "exposure", label: "EV", accentRgb: ACCENT.exposure });
    expGroup.appendChild(exposureCtl.wrap);
    gradePanel.body.appendChild(expGroup);

    const gamGroup = toolsGroup({ key: "gamma", label: "Gamma", accentRgb: ACCENT.gamma });
    gamGroup.appendChild(gammaCtl.wrap);
    gradePanel.body.appendChild(gamGroup);

    const resetExposure = () => {
        try {
            state.exposureEV = 0;
        } catch (e) {
            console.debug?.(e);
        }
        try {
            exposureCtl.input.value = "0";
            exposureCtl.out.textContent = "0.0EV";
        } catch (e) {
            console.debug?.(e);
        }
        safeCall(onToolsChanged);
    };

    const resetGamma = () => {
        try {
            state.gamma = 1.0;
        } catch (e) {
            console.debug?.(e);
        }
        try {
            gammaCtl.input.value = "1";
            gammaCtl.out.textContent = "1.00";
        } catch (e) {
            console.debug?.(e);
        }
        safeCall(onToolsChanged);
    };

    const resetViewerTools = () => {
        try {
            Object.assign(state, DEFAULT_TOOL_STATE);
        } catch (e) {
            console.debug?.(e);
        }
        safeCall(onCompareModeChanged);
        safeCall(onAudioVizModeChanged);
        safeCall(onToolsChanged);
    };

    // Clickable labels/value to reset (Nuke-like UX).
    try {
        const evLabel = expGroup.querySelector?.(".mjr-viewer-tools-group-label");
        if (evLabel) {
            evLabel.title = t("tooltip.resetExposure", "Reset EV to 0");
            evLabel.style.cursor = "pointer";
            evLabel.style.userSelect = "none";
        }
    } catch (e) {
        console.debug?.(e);
    }
    try {
        exposureCtl.out.title = t("tooltip.resetExposure", "Reset EV to 0");
        exposureCtl.out.style.cursor = "pointer";
        exposureCtl.out.style.userSelect = "none";
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const gLabel = gamGroup.querySelector?.(".mjr-viewer-tools-group-label");
        if (gLabel) {
            gLabel.title = t("tooltip.resetGamma", "Reset Gamma to 1.00");
            gLabel.style.cursor = "pointer";
            gLabel.style.userSelect = "none";
        }
    } catch (e) {
        console.debug?.(e);
    }
    try {
        gammaCtl.out.title = t("tooltip.resetGamma", "Reset Gamma to 1.00");
        gammaCtl.out.style.cursor = "pointer";
        gammaCtl.out.style.userSelect = "none";
    } catch (e) {
        console.debug?.(e);
    }

    const anaGroup = toolsGroup({ key: "analysis", label: "Analysis", accentRgb: ACCENT.analysis });
    anaGroup.appendChild(zebraToggle.b);
    anaGroup.appendChild(scopesToggle.b);
    anaGroup.appendChild(scopesSelect);
    gradePanel.body.appendChild(anaGroup);

    const ovGuidesGroup = toolsGroup({
        key: "overlay-guides",
        label: "Guides",
        accentRgb: ACCENT.overlay,
    });
    ovGuidesGroup.appendChild(gridToggle.b);
    ovGuidesGroup.appendChild(gridModeSelect);
    ovGuidesGroup.appendChild(maskToggle.b);
    ovGuidesGroup.appendChild(formatSelect);
    ovGuidesGroup.appendChild(maskOpacityCtl.wrap);
    overlayPanel.body.appendChild(ovGuidesGroup);

    const ovInspectGroup = toolsGroup({
        key: "overlay-inspect",
        label: "Inspect",
        accentRgb: ACCENT.overlay,
    });
    const inspectButtons = [
        probeToggle.b,
        loupeToggle.b,
        hudToggle.b,
        focusToggle.b,
        genInfoToggle.b,
    ];
    inspectButtons.forEach((btn, index) => {
        if (index > 0) btn.style.marginLeft = "4px";
        ovInspectGroup.appendChild(btn);
    });
    inspectPanel.body.appendChild(ovInspectGroup);

    const cmpGroup = toolsGroup({ key: "compare", label: "Compare", accentRgb: ACCENT.compare });
    cmpGroup.style.borderRadius = "8px";
    cmpGroup.style.padding = "4px 6px";
    cmpGroup.style.border = "1px solid transparent";
    cmpGroup.style.transition =
        "background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease";
    cmpGroup.appendChild(compareModeSelect);
    overlayPanel.body.appendChild(cmpGroup);

    const audGroup = toolsGroup({
        key: "audio-viz",
        label: "Audio Viz",
        accentRgb: ACCENT.audioviz,
    });
    audGroup.appendChild(audioVizModeSelect);
    overlayPanel.body.appendChild(audGroup);

    toolsActions.appendChild(resetGradeBtn);
    toolsActions.appendChild(exportBtn);
    toolsActions.appendChild(copyBtn);

    const model3dHint = document.createElement("div");
    model3dHint.className = "mjr-viewer-tools-group mjr-viewer-tools-group--3d";
    model3dHint.textContent = "LMB rotate \u00b7 RMB pan \u00b7 Scroll zoom";
    model3dHint.style.cssText = [
        "display:none",
        "align-items:center",
        "padding:2px 8px",
        "border-radius:999px",
        "border:1px solid rgba(255,255,255,0.12)",
        "background:rgba(255,255,255,0.06)",
        "color:rgba(255,255,255,0.55)",
        "font-size:10px",
        "font-weight:400",
        "letter-spacing:0.01em",
    ].join(";");
    toolsMeta.appendChild(model3dHint);

    // Shortcut help (discoverability)
    const helpWrap = document.createElement("div");
    helpWrap.style.cssText = "position: relative; display:inline-flex; align-items:center;";
    helpWrap.className = "mjr-viewer-tools-action";
    helpWrap.style.marginLeft = "4px";

    const helpBtn = document.createElement("button");
    helpBtn.type = "button";
    helpBtn.title = t("tooltip.viewerShortcuts", "Viewer shortcuts");
    helpBtn.setAttribute("aria-label", t("tooltip.viewerShortcuts", "Viewer shortcuts"));
    helpBtn.style.cssText = `
        height: 24px;
        padding: 0 8px;
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.14);
        background: rgba(255,255,255,0.08);
        color: rgba(255,255,255,0.92);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    `;
    const helpIcon = document.createElement("span");
    helpIcon.className = "pi pi-question-circle";
    helpIcon.setAttribute("aria-hidden", "true");
    helpIcon.style.fontSize = "14px";
    helpBtn.appendChild(helpIcon);

    const helpPop = document.createElement("div");
    helpPop.className = "mjr-viewer-help";
    helpPop.style.cssText = `
        position: absolute;
        right: 0;
        top: 32px;
        min-width: 260px;
        max-width: 360px;
        padding: 10px 12px;
        border-radius: 8px;
        background: rgba(0,0,0,0.88);
        border: 1px solid rgba(255,255,255,0.16);
        color: rgba(255,255,255,0.92);
        font-size: 12px;
        line-height: 1.4;
        box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        display: none;
        z-index: 10002;
    `;
    try {
        const title = document.createElement("div");
        title.textContent = "Shortcuts";
        title.style.cssText = "font-weight:600; margin-bottom:6px;";

        const grid = document.createElement("div");
        grid.style.cssText = "display:grid; grid-template-columns: 1fr 1fr; gap: 4px 10px;";

        const addRow = (key, label) => {
            const row = document.createElement("div");
            const k = document.createElement("span");
            k.style.cssText = "opacity:.75;";
            k.textContent = String(key || "");
            row.appendChild(k);
            row.appendChild(document.createTextNode(` ${String(label || "")}`));
            grid.appendChild(row);
        };

        addRow("Esc", "Close");
        addRow("Space", "Play/Pause");
        addRow("+", "Zoom In");
        addRow("-", "Zoom Out");
        addRow("Alt+1", "1:1 Zoom");
        addRow("G", "Grid");
        addRow("D", "Gen Info");
        addRow("Z", "Zebra");
        addRow("I", "Probe");
        addRow("L", "Loupe");
        addRow("X", "Focus Mode");
        addRow("C", "Copy Color");
        addRow("[ / ]", "Speed -/+");
        addRow("\\", "Speed 1x");
        addRow("←/→", "Prev/Next");
        addRow("0-5", "Rating");

        helpPop.appendChild(title);
        helpPop.appendChild(grid);
    } catch (e) {
        console.debug?.(e);
    }

    helpWrap.appendChild(helpBtn);
    helpWrap.appendChild(helpPop);
    toolsMeta.appendChild(helpWrap);

    actionPanel.body.appendChild(toolsActions);
    infoPanel.body.appendChild(toolsMeta);

    toolsDeck.appendChild(gradePanel.panel);
    toolsDeck.appendChild(overlayPanel.panel);
    toolsDeck.appendChild(inspectPanel.panel);
    toolsDeck.appendChild(actionPanel.panel);
    toolsDeck.appendChild(infoPanel.panel);
    toolsRow.appendChild(toolsDeck);

    return {
        toolsRow,
        gradePanel,
        overlayPanel,
        inspectPanel,
        actionPanel,
        infoPanel,
        toolsActions,
        toolsMeta,
        chGroup,
        expGroup,
        gamGroup,
        anaGroup,
        ovGuidesGroup,
        ovInspectGroup,
        cmpGroup,
        audGroup,
        model3dHint,
        helpWrap,
        helpBtn,
        helpPop,
        channelsSelect,
        exposureCtl,
        gammaCtl,
        zebraToggle,
        scopesToggle,
        scopesSelect,
        gridToggle,
        gridModeSelect,
        maskToggle,
        formatSelect,
        maskOpacityCtl,
        probeToggle,
        loupeToggle,
        hudToggle,
        focusToggle,
        genInfoToggle,
        compareModeSelect,
        audioVizModeSelect,
        resetGradeBtn,
        exportBtn,
        copyBtn,
        resetExposure,
        resetGamma,
        resetViewerTools,
        ACCENT,
        setSelectHighlighted,
        setChannelSelectStyle,
        setValueHighlighted,
        setGroupHighlighted,
        DEFAULT_TOOL_STATE,
    };
}
