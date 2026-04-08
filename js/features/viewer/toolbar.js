import { safeAddListener, safeCall } from "./lifecycle.js";
import { createIconButton, createModeButton } from "../../components/buttons.js";
import { t } from "../../app/i18n.js";
import { appendTooltipHint } from "../../utils/tooltipShortcuts.js";

export function createViewerToolbar({
    VIEWER_MODES,
    state,
    lifecycle,
    onClose,
    _onZoomIn,
    _onZoomOut,
    _onZoomReset,
    _onZoomOneToOne,
    onMode,
    onToolsChanged,
    onCompareModeChanged,
    onExportFrame,
    onCopyFrame,
    onAudioVizModeChanged,
    onToggleFullscreen,
    getCanAB,
} = {}) {
    const unsubs = lifecycle?.unsubs || [];
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

    const header = document.createElement("div");
    header.className = "mjr-viewer-header";
    header.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 8px 16px;
        background: linear-gradient(170deg, rgba(24, 27, 33, 0.96), rgba(17, 19, 25, 0.97));
        border-bottom: 0.8px solid rgba(196, 202, 210, 0.2);
        color: white;
        box-sizing: border-box;
    `;

    const headerTop = document.createElement("div");
    headerTop.className = "mjr-viewer-header-top";
    headerTop.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        position: relative;
        padding-right: 84px;
        padding-left: 12px;
        min-width: 0;
        box-sizing: border-box;
    `;
    // Close is fixed to the viewer corner; avoid reserving header space for it.

    const leftMeta = document.createElement("div");
    leftMeta.className = "mjr-viewer-header-meta mjr-viewer-header-meta--left";
    leftMeta.style.cssText = "display:flex; align-items:center; gap:10px; min-width:0;";

    const titleLine = document.createElement("div");
    titleLine.className = "mjr-viewer-title-line";
    titleLine.style.cssText =
        "display:flex; align-items:center; justify-content:center; gap:8px; min-width:0; flex-wrap:nowrap; overflow:hidden;";

    const titleWrap = document.createElement("div");
    titleWrap.className = "mjr-viewer-title-wrap";
    titleWrap.style.cssText =
        "display:flex; align-items:center; justify-content:center; gap:12px; min-width:0; max-width:min(100%, calc(100vw - 220px)); text-align:center;";

    const filename = document.createElement("span");
    filename.className = "mjr-viewer-filename";
    filename.style.cssText =
        "font-size: 13px; font-weight: 600; min-width:0; max-width:min(60vw, 820px); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:center;";

    const badgesBar = document.createElement("div");
    badgesBar.className = "mjr-viewer-badges";
    badgesBar.style.cssText = "display:flex; gap:6px; align-items:center; flex-wrap:nowrap; min-width:0;";

    const rightMeta = document.createElement("div");
    rightMeta.className = "mjr-viewer-header-meta mjr-viewer-header-meta--right";
    rightMeta.style.cssText =
        "display:none; align-items:center; gap:10px; min-width:0; justify-content:flex-end;";

    const filenameRight = document.createElement("span");
    filenameRight.className = "mjr-viewer-filename mjr-viewer-filename--right";
    filenameRight.style.cssText =
        "font-size: 14px; font-weight: 500; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:right;";

    const badgesBarRight = document.createElement("div");
    badgesBarRight.className = "mjr-viewer-badges mjr-viewer-badges--right";
    badgesBarRight.style.cssText =
        "display:flex; gap:8px; align-items:center; flex-wrap:wrap; justify-content:flex-end;";

    titleLine.appendChild(filename);
    titleLine.appendChild(badgesBar);
    titleWrap.appendChild(titleLine);

    rightMeta.appendChild(badgesBarRight);
    rightMeta.appendChild(filenameRight);

    const modeButtons = document.createElement("div");
    modeButtons.className = "mjr-viewer-mode-buttons";
    modeButtons.style.cssText = "display: flex; gap: 4px;";

    const singleBtn = createModeButton("Single", VIEWER_MODES.SINGLE);
    singleBtn.title = t("tooltip.singleViewMode", "Single view mode (one image)");
    const abBtn = createModeButton("A/B", VIEWER_MODES.AB_COMPARE);
    abBtn.title = t("tooltip.compareOverlayMode", "A/B compare mode (overlay)");
    const sideBtn = createModeButton("Side", VIEWER_MODES.SIDE_BY_SIDE);
    sideBtn.title = t("tooltip.compareSideBySide", "Side-by-side comparison mode");

    modeButtons.appendChild(singleBtn);
    modeButtons.appendChild(abBtn);
    modeButtons.appendChild(sideBtn);

    const closeBtn = createIconButton("✕", "Close (Esc)");
    closeBtn.style.fontSize = "18px";
    try {
        closeBtn.classList.add("mjr-viewer-close");
        closeBtn.textContent = "";
        const icon = document.createElement("span");
        icon.className = "pi pi-times";
        icon.setAttribute("aria-hidden", "true");
        closeBtn.appendChild(icon);
    } catch (e) {
        console.debug?.(e);
    }

    const fullscreenBtn = createIconButton("⛶", "Toggle Fullscreen (F)");
    try {
        fullscreenBtn.classList.add("mjr-viewer-fs");
    } catch (e) {
        console.debug?.(e);
    }
    fullscreenBtn.style.fontSize = "16px";
    try {
        fullscreenBtn.style.position = "absolute";
        fullscreenBtn.style.top = "8px";
        fullscreenBtn.style.left = "";
        fullscreenBtn.style.right = "48px";
        fullscreenBtn.style.zIndex = "10002";
        fullscreenBtn.style.width = "34px";
        fullscreenBtn.style.height = "34px";
        fullscreenBtn.style.padding = "0";
        fullscreenBtn.style.display = "inline-flex";
        fullscreenBtn.style.alignItems = "center";
        fullscreenBtn.style.justifyContent = "center";
        fullscreenBtn.style.borderRadius = "8px";

        const icon = document.createElement("span");
        icon.className = "pi pi-window-maximize";
        icon.setAttribute("aria-hidden", "true");
        fullscreenBtn.textContent = "";
        fullscreenBtn.appendChild(icon);

        const updateFsIcon = () => {
            try {
                const isFs = document.fullscreenElement != null;
                icon.className = isFs ? "pi pi-window-minimize" : "pi pi-window-maximize";
                fullscreenBtn.title = isFs ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)";
            } catch (e) {
                console.debug?.(e);
            }
        };

        fullscreenBtn.onclick = (e) => {
            e.stopPropagation();
            onToggleFullscreen?.();
        };

        if (lifecycle?.safeAddListener) {
            lifecycle.safeAddListener(document, "fullscreenchange", updateFsIcon);
        } else {
            // Fallback cleanup if lifecycle missing (though unlikely in prod)
            try {
                document.addEventListener("fullscreenchange", updateFsIcon);
                // Attach a one-time cleanup to the element itself to avoid global leaks
                const cleanup = () => {
                    try {
                        document.removeEventListener("fullscreenchange", updateFsIcon);
                    } catch (e) {
                        console.debug?.(e);
                    }
                };
                if (header._mjrCleanup) header._mjrCleanup.push(cleanup);
                else header._mjrCleanup = [cleanup];
            } catch (e) {
                console.debug?.(e);
            }
        }
        updateFsIcon();
    } catch (e) {
        console.debug?.(e);
    }

    const leftArea = document.createElement("div");
    leftArea.className = "mjr-viewer-header-area mjr-viewer-header-area--left";
    leftArea.style.cssText = "display:none; align-items:center; gap:12px; min-width:0;";
    leftArea.appendChild(leftMeta);

    const centerArea = document.createElement("div");
    centerArea.className = "mjr-viewer-header-area mjr-viewer-header-area--center";
    centerArea.style.cssText =
        "display:flex; align-items:center; justify-content:center; gap:12px; flex:1 1 auto; min-width:0;";
    titleWrap.appendChild(modeButtons);
    centerArea.appendChild(titleWrap);

    const rightArea = document.createElement("div");
    rightArea.className = "mjr-viewer-header-area mjr-viewer-header-area--right";
    rightArea.style.cssText =
        "display:none; position:absolute; right:92px; top:50%; transform:translateY(-50%); align-items:center; justify-content:flex-end; gap:12px; min-width:0; max-width:min(26vw, 360px);";
    rightArea.appendChild(rightMeta);

    headerTop.appendChild(leftArea);
    headerTop.appendChild(centerArea);
    headerTop.appendChild(rightArea);
    // Keep the close button in the viewer's top-right corner.
    // Use absolute positioning relative to the overlay (or nearest positioned parent)
    // rather than fixed to ensure it stays with the viewer if the viewer is ever not full-screen.
    try {
        closeBtn.style.position = "absolute";
        closeBtn.style.top = "8px";
        closeBtn.style.left = "";
        closeBtn.style.right = "8px";
        closeBtn.style.transform = "";
        closeBtn.style.zIndex = "10002";
        closeBtn.style.width = "34px";
        closeBtn.style.height = "34px";
        closeBtn.style.padding = "0";
        closeBtn.style.display = "inline-flex";
        closeBtn.style.alignItems = "center";
        closeBtn.style.justifyContent = "center";
        closeBtn.style.borderRadius = "8px";
    } catch (e) {
        console.debug?.(e);
    }
    header.appendChild(headerTop);
    header.appendChild(fullscreenBtn);
    header.appendChild(closeBtn);

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
        body.style.cssText = "display:flex; align-items:center; flex-wrap:nowrap; gap:6px; min-width:0;";

        heading.appendChild(eyebrowEl);
        heading.appendChild(titleEl);
        head.appendChild(heading);
        panel.appendChild(head);
        panel.appendChild(body);

        return { panel, body, head, heading, eyebrowEl, titleEl };
    };

    const gradePanel = createToolsPanel({ key: "grade", eyebrow: "Image", title: "Adjustments" });
    const overlayPanel = createToolsPanel({ key: "overlay", eyebrow: "Viewer", title: "Guides & Compare" });
    const inspectPanel = createToolsPanel({ key: "inspect", eyebrow: "Inspect", title: "Probe" });
    const actionPanel = createToolsPanel({ key: "actions", eyebrow: "Actions", title: "Reset & Export" });
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
    const inspectButtons = [probeToggle.b, loupeToggle.b, hudToggle.b, focusToggle.b, genInfoToggle.b];
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

    header.appendChild(toolsRow);

    // Bind events
    unsubs.push(safeAddListener(singleBtn, "click", () => onMode?.(VIEWER_MODES.SINGLE)));
    unsubs.push(safeAddListener(abBtn, "click", () => onMode?.(VIEWER_MODES.AB_COMPARE)));
    unsubs.push(safeAddListener(sideBtn, "click", () => onMode?.(VIEWER_MODES.SIDE_BY_SIDE)));
    unsubs.push(safeAddListener(closeBtn, "click", () => onClose?.()));

    unsubs.push(
        safeAddListener(channelsSelect, "change", () => {
            try {
                state.channel = String(channelsSelect.value || "rgb");
            } catch (e) {
                console.debug?.(e);
            }
            safeCall(onToolsChanged);
        }),
    );

    unsubs.push(
        safeAddListener(compareModeSelect, "change", () => {
            try {
                state.abCompareMode = String(compareModeSelect.value || "wipe");
            } catch (e) {
                console.debug?.(e);
            }
            safeCall(onCompareModeChanged);
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(audioVizModeSelect, "change", () => {
            try {
                state.audioVisualizerMode = String(audioVizModeSelect.value || "artistic");
            } catch (e) {
                console.debug?.(e);
            }
            safeCall(onAudioVizModeChanged);
            safeCall(onToolsChanged);
        }),
    );

    unsubs.push(
        safeAddListener(exposureCtl.input, "input", () => {
            const ev = Math.max(-10, Math.min(10, Number(exposureCtl.input.value) || 0));
            state.exposureEV = Math.round(ev * 10) / 10;
            try {
                exposureCtl.out.textContent = `${state.exposureEV.toFixed(1)}EV`;
            } catch (e) {
                console.debug?.(e);
            }
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(safeAddListener(exposureCtl.input, "dblclick", resetExposure));
    unsubs.push(safeAddListener(exposureCtl.out, "click", resetExposure));
    unsubs.push(
        safeAddListener(
            expGroup.querySelector?.(".mjr-viewer-tools-group-label"),
            "click",
            resetExposure,
        ),
    );

    unsubs.push(
        safeAddListener(gammaCtl.input, "input", () => {
            const g = Math.max(0.1, Math.min(3, Number(gammaCtl.input.value) || 1));
            state.gamma = Math.round(g * 100) / 100;
            try {
                gammaCtl.out.textContent = state.gamma.toFixed(2);
            } catch (e) {
                console.debug?.(e);
            }
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(safeAddListener(gammaCtl.input, "dblclick", resetGamma));
    unsubs.push(safeAddListener(gammaCtl.out, "click", resetGamma));
    unsubs.push(
        safeAddListener(
            gamGroup.querySelector?.(".mjr-viewer-tools-group-label"),
            "click",
            resetGamma,
        ),
    );

    unsubs.push(
        safeAddListener(zebraToggle.b, "click", () => {
            state.analysisMode = state.analysisMode === "zebra" ? "none" : "zebra";
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(scopesToggle.b, "click", () => {
            try {
                const current = String(state.scopesMode || "off");
                const next = current === "off" ? "both" : "off";
                state.scopesMode = next;
                try {
                    scopesSelect.value = String(next);
                } catch (e) {
                    console.debug?.(e);
                }
            } catch (e) {
                console.debug?.(e);
            }
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(scopesSelect, "change", () => {
            try {
                const v = String(scopesSelect.value || "off");
                state.scopesMode = v;
            } catch {
                try {
                    state.scopesMode = "off";
                } catch (e) {
                    console.debug?.(e);
                }
            }
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(gridToggle.b, "click", () => {
            state.gridMode = Number(state.gridMode) || 0 ? 0 : 1;
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(gridModeSelect, "change", () => {
            try {
                const next = Number(gridModeSelect.value);
                state.gridMode = Number.isFinite(next) ? next : 0;
            } catch {
                try {
                    state.gridMode = 0;
                } catch (e) {
                    console.debug?.(e);
                }
            }
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(maskToggle.b, "click", () => {
            try {
                state.overlayMaskEnabled = !state.overlayMaskEnabled;
            } catch (e) {
                console.debug?.(e);
            }
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(formatSelect, "change", () => {
            try {
                state.overlayFormat = String(formatSelect.value || "image");
            } catch {
                try {
                    state.overlayFormat = "image";
                } catch (e) {
                    console.debug?.(e);
                }
            }
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(maskOpacityCtl.input, "input", () => {
            try {
                const v = Number(maskOpacityCtl.input.value);
                const clamped = Math.max(0, Math.min(0.9, Number.isFinite(v) ? v : 0.65));
                state.overlayMaskOpacity = Math.round(clamped * 100) / 100;
                maskOpacityCtl.out.textContent = state.overlayMaskOpacity.toFixed(2);
            } catch (e) {
                console.debug?.(e);
            }
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(probeToggle.b, "click", () => {
            state.probeEnabled = !state.probeEnabled;
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(loupeToggle.b, "click", () => {
            state.loupeEnabled = !state.loupeEnabled;
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(hudToggle.b, "click", () => {
            state.hudEnabled = !state.hudEnabled;
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(focusToggle.b, "click", () => {
            state.distractionFree = !state.distractionFree;
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(genInfoToggle.b, "click", () => {
            try {
                state.genInfoOpen = !state.genInfoOpen;
            } catch (e) {
                console.debug?.(e);
            }
            safeCall(onToolsChanged);
        }),
    );
    unsubs.push(
        safeAddListener(resetGradeBtn, "click", () => {
            resetViewerTools();
        }),
    );
    unsubs.push(
        safeAddListener(exportBtn, "click", () => {
            try {
                void onExportFrame?.();
            } catch (e) {
                console.debug?.(e);
            }
        }),
    );
    unsubs.push(
        safeAddListener(copyBtn, "click", () => {
            try {
                void onCopyFrame?.();
            } catch (e) {
                console.debug?.(e);
            }
        }),
    );

    const syncToolsUIFromState = () => {
        const current = state?.assets?.[state?.currentIndex] || null;
        const isModel3D = String(current?.kind || "").toLowerCase() === "model3d";
        try {
            const hidden = isModel3D ? "none" : "";
            chGroup.style.display = hidden;
            expGroup.style.display = hidden;
            gamGroup.style.display = hidden;
            anaGroup.style.display = hidden;
            resetGradeBtn.style.display = hidden;
            model3dHint.style.display = isModel3D ? "inline-flex" : "none";
            gradePanel.panel.style.display = isModel3D ? "none" : "";
            overlayPanel.panel.style.display = isModel3D ? "none" : "";
            infoPanel.panel.style.display = "";
            actionPanel.panel.style.display = "";
            // For 3D: hide image-specific guide tools but keep focus/gen toggles.
            const ovInspectLabel = ovInspectGroup.querySelector?.(".mjr-viewer-tools-group-label");
            if (isModel3D) {
                ovGuidesGroup.style.display = "none";
                ovInspectGroup.style.display = "";
                if (ovInspectLabel) ovInspectLabel.style.display = "none";
                helpWrap.style.display = "none";
                header.style.padding = "10px 16px";
                header.style.gap = "6px";
                toolsRow.style.padding = "6px 8px 6px";
                for (const el of [
                    gridToggle.b,
                    gridModeSelect,
                    maskToggle.b,
                    formatSelect,
                    maskOpacityCtl.wrap,
                    probeToggle.b,
                    loupeToggle.b,
                    hudToggle.b,
                ]) {
                    try {
                        el.style.display = "none";
                    } catch (_) {}
                }
            } else {
                ovGuidesGroup.style.display = "";
                ovInspectGroup.style.display = "";
                if (ovInspectLabel) ovInspectLabel.style.display = "";
                helpWrap.style.display = "";
                gradePanel.panel.style.display = "";
                overlayPanel.panel.style.display = "";
                infoPanel.panel.style.display = "";
                actionPanel.panel.style.display = "";
                header.style.padding = "8px 16px";
                header.style.gap = "6px";
                toolsRow.style.padding = "8px 8px 6px";
                for (const el of [
                    gridToggle.b,
                    gridModeSelect,
                    maskToggle.b,
                    formatSelect,
                    maskOpacityCtl.wrap,
                    probeToggle.b,
                    loupeToggle.b,
                    hudToggle.b,
                ]) {
                    try {
                        el.style.display = "";
                    } catch (_) {}
                }
            }
        } catch (e) {
            console.debug?.(e);
        }
        try {
            channelsSelect.value = String(state.channel || "rgb");
        } catch (e) {
            console.debug?.(e);
        }
        try {
            compareModeSelect.value = String(state.abCompareMode || "wipe");
            const abOk = typeof getCanAB === "function" ? !!getCanAB() : false;
            const isABCompare = state.mode === VIEWER_MODES.AB_COMPARE && abOk;
            const isSideCompare = state.mode === VIEWER_MODES.SIDE_BY_SIDE;
            const showCompare = isABCompare || isSideCompare;
            compareModeSelect.disabled = !isABCompare;
            try {
                cmpGroup.dataset.active = showCompare ? "1" : "0";
                cmpGroup.style.display = showCompare ? "" : "none";
                setGroupHighlighted(cmpGroup, { accentRgb: ACCENT.compare, active: showCompare });
                cmpGroup.title = showCompare ? "Compare tools (active)" : "Compare tools";
            } catch (e) {
                console.debug?.(e);
            }
        } catch (e) {
            console.debug?.(e);
        }
        try {
            const isAudio = String(current?.kind || "") === "audio";
            audGroup.style.display = isAudio ? "" : "none";
            audioVizModeSelect.disabled = !isAudio;
            audioVizModeSelect.value = String(state.audioVisualizerMode || "artistic");
        } catch (e) {
            console.debug?.(e);
        }
        try {
            const ev = Math.round((Number(state.exposureEV) || 0) * 10) / 10;
            exposureCtl.input.value = String(ev);
            exposureCtl.out.textContent = `${ev.toFixed(1)}EV`;
        } catch (e) {
            console.debug?.(e);
        }
        try {
            const g = Math.max(0.1, Math.min(3, Number(state.gamma) || 1));
            gammaCtl.input.value = String(g);
            gammaCtl.out.textContent = g.toFixed(2);
        } catch (e) {
            console.debug?.(e);
        }
        try {
            zebraToggle.setActive(state.analysisMode === "zebra");
        } catch (e) {
            console.debug?.(e);
        }
        try {
            const m = String(state.scopesMode || "off");
            scopesToggle.setActive(m !== "off");
            scopesSelect.value = m;
        } catch (e) {
            console.debug?.(e);
        }
        try {
            // Export is meaningful for video frames (videoProcessor canvas) and 3D snapshots (WebGL canvas).
            const currentKind = String(current?.kind || "");
            const show = currentKind === "video" || currentKind === "model3d";
            exportBtn.style.display = show ? "" : "none";
            copyBtn.style.display = show ? "" : "none";

            // Clipboard copy is best-effort; hide if unsupported even for videos.
            const canClip = !!(globalThis?.ClipboardItem && navigator?.clipboard?.write);
            copyBtn.style.display = show && canClip ? "" : "none";
        } catch (e) {
            console.debug?.(e);
        }
        try {
            gridToggle.setActive((Number(state.gridMode) || 0) !== 0);
        } catch (e) {
            console.debug?.(e);
        }
        try {
            gridModeSelect.value = String(Number(state.gridMode) || 0);
        } catch (e) {
            console.debug?.(e);
        }
        try {
            maskToggle.setActive(Boolean(state.overlayMaskEnabled));
            formatSelect.value = String(state.overlayFormat || "image");
            maskOpacityCtl.input.value = String(Number(state.overlayMaskOpacity ?? 0.65));
            maskOpacityCtl.out.textContent = Number(state.overlayMaskOpacity ?? 0.65).toFixed(2);
        } catch (e) {
            console.debug?.(e);
        }
        try {
            probeToggle.setActive(Boolean(state.probeEnabled));
            loupeToggle.setActive(Boolean(state.loupeEnabled));
        } catch (e) {
            console.debug?.(e);
        }
        try {
            hudToggle.setActive(Boolean(state.hudEnabled));
        } catch (e) {
            console.debug?.(e);
        }
        try {
            focusToggle.setActive(Boolean(state.distractionFree));
        } catch (e) {
            console.debug?.(e);
        }
        try {
            genInfoToggle.setActive(Boolean(state.genInfoOpen));
        } catch (e) {
            console.debug?.(e);
        }

        // Highlight menus + values when non-default.
        try {
            const channel = String(state.channel || "rgb");
            setChannelSelectStyle(channel);
        } catch (e) {
            console.debug?.(e);
        }
        try {
            const ev = Math.round((Number(state.exposureEV) || 0) * 10) / 10;
            setValueHighlighted(exposureCtl.out, {
                accentRgb: ACCENT.exposure,
                active: Math.abs(ev) > 0.0001,
            });
        } catch (e) {
            console.debug?.(e);
        }
        try {
            const g = Math.round((Number(state.gamma) || 1) * 100) / 100;
            setValueHighlighted(gammaCtl.out, {
                accentRgb: ACCENT.gamma,
                active: Math.abs(g - 1) > 0.0001,
            });
        } catch (e) {
            console.debug?.(e);
        }
        try {
            const m = String(state.scopesMode || "off");
            setSelectHighlighted(scopesSelect, {
                accentRgb: ACCENT.analysis,
                active: m !== "off",
                title: m !== "off" ? "Scopes (active)" : "Scopes",
            });
        } catch (e) {
            console.debug?.(e);
        }
        try {
            const gm = Number(state.gridMode) || 0;
            setSelectHighlighted(gridModeSelect, {
                accentRgb: ACCENT.overlay,
                active: gm !== 0,
                title: gm !== 0 ? "Grid Overlay (active)" : "Grid Overlay",
            });
        } catch (e) {
            console.debug?.(e);
        }
        try {
            const fmt = String(state.overlayFormat || "image");
            setSelectHighlighted(formatSelect, {
                accentRgb: ACCENT.overlay,
                active: fmt !== "image",
                title: fmt !== "image" ? "Format (active)" : "Format",
            });
        } catch (e) {
            console.debug?.(e);
        }
        try {
            const abOk = typeof getCanAB === "function" ? !!getCanAB() : false;
            const showCompare = state.mode === VIEWER_MODES.AB_COMPARE && abOk;
            const cm = String(state.abCompareMode || "wipe");
            setSelectHighlighted(compareModeSelect, {
                accentRgb: ACCENT.compare,
                active: showCompare && cm !== "wipe",
                title:
                    showCompare && cm !== "wipe" ? "Compare Mode (modified)" : "A/B Compare Mode",
            });
        } catch (e) {
            console.debug?.(e);
        }
        try {
            const isAudio = String(current?.kind || "") === "audio";
            const mode = String(state.audioVisualizerMode || "artistic");
            setSelectHighlighted(audioVizModeSelect, {
                accentRgb: ACCENT.audioviz,
                active: isAudio && mode !== "simple",
                title: "Audio visualizer mode",
            });
        } catch (e) {
            console.debug?.(e);
        }

        // Highlight GenInfo when open.
        try {
            const on = Boolean(state.genInfoOpen);
            const btn = genInfoToggle?.b;
            if (btn && on) {
                btn.style.borderColor = `rgba(${ACCENT.geninfo},0.55)`;
                btn.style.background = `rgba(${ACCENT.geninfo},0.14)`;
            }
        } catch (e) {
            console.debug?.(e);
        }
    };

    const syncModeButtons = ({ canAB, canSide } = {}) => {
        try {
            const abOk = !!canAB?.();
            const sideOk = !!canSide?.();
            abBtn.disabled = !abOk;
            sideBtn.disabled = !sideOk;
            abBtn.style.opacity = abBtn.disabled
                ? "0.35"
                : state.mode === VIEWER_MODES.AB_COMPARE
                  ? "1"
                  : "0.6";
            sideBtn.style.opacity = sideBtn.disabled
                ? "0.35"
                : state.mode === VIEWER_MODES.SIDE_BY_SIDE
                  ? "1"
                  : "0.6";
            singleBtn.style.opacity = state.mode === VIEWER_MODES.SINGLE ? "1" : "0.6";
            singleBtn.style.fontWeight = state.mode === VIEWER_MODES.SINGLE ? "600" : "400";
            try {
                singleBtn.setAttribute(
                    "aria-pressed",
                    state.mode === VIEWER_MODES.SINGLE ? "true" : "false",
                );
                abBtn.setAttribute(
                    "aria-pressed",
                    state.mode === VIEWER_MODES.AB_COMPARE ? "true" : "false",
                );
                sideBtn.setAttribute(
                    "aria-pressed",
                    state.mode === VIEWER_MODES.SIDE_BY_SIDE ? "true" : "false",
                );
            } catch (e) {
                console.debug?.(e);
            }
        } catch (e) {
            console.debug?.(e);
        }
    };

    // Help toggle wiring
    try {
        let helpAC = null;
        const hideHelp = () => {
            try {
                helpAC?.abort?.();
            } catch (e) {
                console.debug?.(e);
            }
            helpAC = null;
            try {
                helpPop.style.display = "none";
            } catch (e) {
                console.debug?.(e);
            }
        };
        const showHelp = () => {
            hideHelp();
            helpAC = new AbortController();
            try {
                helpPop.style.display = "";
            } catch (e) {
                console.debug?.(e);
            }
            try {
                document.addEventListener(
                    "mousedown",
                    (e) => {
                        if (!helpWrap.contains(e.target)) hideHelp();
                    },
                    { capture: true, signal: helpAC.signal },
                );
                document.addEventListener(
                    "keydown",
                    (e) => {
                        if (e.key === "Escape") hideHelp();
                    },
                    { capture: true, signal: helpAC.signal },
                );
                document.addEventListener("scroll", hideHelp, {
                    capture: true,
                    passive: true,
                    signal: helpAC.signal,
                });
            } catch (e) {
                console.debug?.(e);
            }
        };
        unsubs.push(() => hideHelp());
        unsubs.push(
            safeAddListener(helpBtn, "click", () => {
                const open = helpPop.style.display !== "none";
                if (open) hideHelp();
                else showHelp();
            }),
        );
    } catch (e) {
        console.debug?.(e);
    }

    return {
        headerEl: header,
        filenameEl: filename,
        badgesBarEl: badgesBar,
        filenameRightEl: filenameRight,
        badgesBarRightEl: badgesBarRight,
        rightMetaEl: rightMeta,
        rightAreaEl: rightArea,
        syncToolsUIFromState,
        syncModeButtons,
    };
}
