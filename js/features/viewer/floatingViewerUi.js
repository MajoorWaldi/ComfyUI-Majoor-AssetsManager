import { EVENTS } from "../../app/events.js";
import { APP_CONFIG } from "../../app/config.js";
import { t } from "../../app/i18n.js";
import { appendTooltipHint, setTooltipHint } from "../../utils/tooltipShortcuts.js";
import {
    CLOSE_HINT,
    MFV_LIVE_HINT,
    MFV_MODE_HINT,
    MFV_MODES,
    MFV_NODESTREAM_HINT,
    MFV_PREVIEW_HINT,
} from "./floatingViewerConstants.js";
import { NODE_STREAM_FEATURE_ENABLED } from "./nodeStream/nodeStreamFeatureFlag.js";
import { WorkflowSidebar } from "./workflowSidebar/WorkflowSidebar.js";
import { createRunButton } from "./workflowSidebar/sidebarRunButton.js";
import {
    buildFloatingViewerMediaProgressOverlay,
    buildFloatingViewerProgressBar,
} from "./floatingViewerProgress.js";
import {
    buildWorkflowPresentation,
    formatModelLabel,
    normalizeGenerationMetadata,
    sanitizePromptForDisplay,
} from "../../components/sidebar/parsers/geninfoParser.js";

function summarizeNormalizedModels(norm) {
    const models = norm?.models;
    if (!models || typeof models !== "object") return "";
    const ordered = [
        ["HN", models.unet_high_noise],
        ["LN", models.unet_low_noise],
        ["UNet", models.unet],
        ["Diff", models.diffusion],
        ["Upsc", models.upscaler],
        ["CLIP", models.clip],
        ["VAE", models.vae],
    ];
    const seenNames = new Set();
    const entries = [];
    for (const [label, value] of ordered) {
        const name = formatModelLabel(value?.name || value?.value || value || "");
        if (!name || seenNames.has(name)) continue;
        seenNames.add(name);
        entries.push(`${label}: ${name}`);
        if (entries.length >= 3) break;
    }
    return entries.join(" | ");
}

function summarizeFloatingViewerApiWorkflow(norm) {
    const workflow = buildWorkflowPresentation(norm);
    if (!workflow.workflowLabel) return "";
    return workflow.workflowBadge
        ? `${workflow.workflowLabel} • ${workflow.workflowBadge}`
        : workflow.workflowLabel;
}

// ---------------------------------------------------------------------------
// Toolbar icon-dropdown helper
// ---------------------------------------------------------------------------
function _mkIconDrop(triggerHtml, title, items, viewer) {
    const wrap = document.createElement("div");
    wrap.className = "mjr-mfv-idrop";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "mjr-icon-btn mjr-mfv-idrop-trigger";
    trigger.title = title || "";
    trigger.innerHTML = triggerHtml;
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    wrap.appendChild(trigger);

    const menu = document.createElement("div");
    menu.className = "mjr-mfv-idrop-menu";
    menu.setAttribute("role", "listbox");
    const menuHost = viewer?.element || wrap;
    menuHost.appendChild(menu);

    // Hidden select: existing event handlers read .value from it and bind "change"
    const hiddenSel = document.createElement("select");
    hiddenSel.style.cssText =
        "position:absolute;opacity:0;pointer-events:none;width:0;height:0;overflow:hidden;";
    wrap.appendChild(hiddenSel);

    const itemEls = [];
    for (const item of items) {
        const opt = document.createElement("option");
        opt.value = String(item.value);
        hiddenSel.appendChild(opt);

        const row = document.createElement("button");
        row.type = "button";
        row.className = "mjr-mfv-idrop-item";
        row.setAttribute("role", "option");
        row.dataset.value = String(item.value);
        row.innerHTML = item.html ?? String(item.label ?? item.value);
        menu.appendChild(row);
        itemEls.push(row);
    }

    const _closeMenu = () => {
        menu.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
    };

    trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = menu.classList.contains("is-open");
        // Close all other open icon-dropdowns in this viewer
        viewer?.element
            ?.querySelectorAll?.(".mjr-mfv-idrop-menu.is-open")
            .forEach((m) => m.classList.remove("is-open"));
        if (!isOpen) {
            const btnRect = trigger.getBoundingClientRect();
            const parentRect = menuHost.getBoundingClientRect?.() || { left: 0, top: 0 };
            menu.style.left = `${btnRect.left - parentRect.left}px`;
            menu.style.top = `${btnRect.bottom - parentRect.top + 4}px`;
            menu.classList.add("is-open");
            trigger.setAttribute("aria-expanded", "true");
        }
    });

    menu.addEventListener("click", (e) => {
        const row = e.target.closest(".mjr-mfv-idrop-item");
        if (!row) return;
        hiddenSel.value = row.dataset.value;
        hiddenSel.dispatchEvent(new Event("change", { bubbles: true }));
        itemEls.forEach((i) => {
            i.classList.toggle("is-selected", i === row);
            i.setAttribute("aria-selected", String(i === row));
        });
        _closeMenu();
    });

    const selectItem = (val) => {
        hiddenSel.value = String(val);
        itemEls.forEach((i) => {
            i.classList.toggle("is-selected", i.dataset.value === String(val));
            i.setAttribute("aria-selected", String(i.dataset.value === String(val)));
        });
    };

    return { wrap, trigger, menu, select: hiddenSel, selectItem };
}

// Channel letter coloring
const _CH_COLOR = {
    rgb: "#e0e0e0",
    r: "#ff5555",
    g: "#44dd66",
    b: "#5599ff",
    a: "#ffffff",
    l: "#bbbbbb",
};
const _CH_LABEL = { rgb: "RGB", r: "R", g: "G", b: "B", a: "A", l: "L" };
const _CH_WEIGHT = { rgb: "500", r: "700", g: "700", b: "700", a: "700", l: "400" };

function _channelHtml(ch) {
    const k = String(ch || "rgb").toLowerCase();
    const color = _CH_COLOR[k] || "#e0e0e0";
    const label = _CH_LABEL[k] || k.toUpperCase();
    const fw = _CH_WEIGHT[k] || "500";
    return `<span class="mjr-mfv-ch-label" style="color:${color};font-weight:${fw}">${label}</span>`;
}

export function renderFloatingViewer(viewer) {
    const el = document.createElement("div");
    el.className = "mjr-mfv";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "false");
    el.setAttribute("aria-hidden", "true");

    viewer.element = el;
    el.appendChild(viewer._buildHeader());
    el.setAttribute("aria-labelledby", viewer._titleId);
    el.appendChild(viewer._buildToolbar());
    el.appendChild(buildFloatingViewerProgressBar(viewer));

    viewer._contentWrapper = document.createElement("div");
    viewer._contentWrapper.className = "mjr-mfv-content-wrapper";
    viewer._applySidebarPosition();

    viewer._contentEl = document.createElement("div");
    viewer._contentEl.className = "mjr-mfv-content";
    viewer._contentWrapper.appendChild(viewer._contentEl);
    viewer._overlayCanvas = document.createElement("canvas");
    viewer._overlayCanvas.className = "mjr-mfv-overlay-canvas";
    viewer._contentEl.appendChild(viewer._overlayCanvas);
    viewer._contentEl.appendChild(buildFloatingViewerMediaProgressOverlay(viewer));

    viewer._sidebar = new WorkflowSidebar({
        hostEl: el,
        onClose: () => viewer._updateSettingsBtnState(false),
        onOpenGraphMap: () => viewer.setMode?.(MFV_MODES.GRAPH),
        onCloseGraphMap: () => {
            if (viewer._mode === MFV_MODES.GRAPH) viewer.setMode?.(MFV_MODES.SIMPLE);
        },
    });

    viewer._contentWrapper.appendChild(viewer._sidebar.el);

    el.appendChild(viewer._contentWrapper);

    viewer._rebindControlHandlers();
    viewer._bindPanelInteractions();
    viewer._bindDocumentUiHandlers();
    viewer._bindLayoutObserver?.();

    viewer._onSidebarPosChanged = (e) => {
        if (e?.detail?.key === "viewer.mfvSidebarPosition") {
            viewer._applySidebarPosition();
        }
    };
    window.addEventListener("mjr-settings-changed", viewer._onSidebarPosChanged);

    viewer._refresh();
    return el;
}

export function buildFloatingViewerHeader(viewer) {
    const header = document.createElement("div");
    header.className = "mjr-mfv-header";

    const title = document.createElement("span");
    title.className = "mjr-mfv-header-title";
    title.id = viewer._titleId;
    const titleIcon = document.createElement("span");
    titleIcon.className = "mjr-mfv-header-title-icon";
    titleIcon.textContent = "〽️";
    titleIcon.setAttribute("aria-hidden", "true");

    const titleText = document.createElement("span");
    titleText.textContent = "Majoor Floating Viewer";

    title.append(titleIcon, titleText);

    const closeBtn = document.createElement("button");
    viewer._closeBtn = closeBtn;
    closeBtn.type = "button";
    closeBtn.className = "mjr-icon-btn mjr-mfv-close-btn";
    setTooltipHint(closeBtn, t("tooltip.closeViewer", "Close viewer"), CLOSE_HINT);
    const closeBtnIcon = document.createElement("i");
    closeBtnIcon.className = "pi pi-times";
    closeBtnIcon.setAttribute("aria-hidden", "true");
    closeBtn.appendChild(closeBtnIcon);

    header.appendChild(title);
    header.appendChild(closeBtn);
    return header;
}

export function buildFloatingViewerToolbar(viewer) {
    const createMiniSelect = (title, options) => {
        const s = document.createElement("select");
        s.className = "mjr-mfv-toolbar-select";
        s.title = title || "";
        for (const option of options || []) {
            const opt = document.createElement("option");
            opt.value = String(option.value);
            opt.textContent = String(option.label);
            s.appendChild(opt);
        }
        return s;
    };

    const createMiniRange = (title, { min, max, step, value } = {}) => {
        const wrap = document.createElement("div");
        wrap.className = "mjr-mfv-toolbar-range";
        const input = document.createElement("input");
        input.type = "range";
        input.min = String(min);
        input.max = String(max);
        input.step = String(step);
        input.value = String(value);
        input.title = title || "";
        const out = document.createElement("span");
        out.className = "mjr-mfv-toolbar-range-out";
        out.textContent = Number(value).toFixed(2);
        wrap.appendChild(input);
        wrap.appendChild(out);
        return { wrap, input, out };
    };

    const bar = document.createElement("div");
    bar.className = "mjr-mfv-toolbar";

    const modeDrop = _mkIconDrop(
        '<i class="pi pi-image" aria-hidden="true"></i>',
        "Viewer mode",
        [
            {
                value: MFV_MODES.SIMPLE,
                html: '<i class="pi pi-image" aria-hidden="true"></i><span>Simple</span>',
            },
            {
                value: MFV_MODES.AB,
                html: '<i class="pi pi-clone" aria-hidden="true"></i><span>A/B Compare</span>',
            },
            {
                value: MFV_MODES.SIDE,
                html: '<i class="pi pi-table" aria-hidden="true"></i><span>Side-by-side</span>',
            },
            {
                value: MFV_MODES.GRID,
                html: '<i class="pi pi-th-large" aria-hidden="true"></i><span>Grid</span>',
            },
            {
                value: MFV_MODES.GRAPH,
                html: '<i class="pi pi-sitemap" aria-hidden="true"></i><span>Graph Map</span>',
            },
        ],
        viewer,
    );
    viewer._modeDrop = modeDrop;
    viewer._modeBtn = modeDrop.trigger;
    viewer._modeSelect = modeDrop.select;
    viewer._updateModeBtnUI();
    bar.appendChild(modeDrop.wrap);

    // Pin: icon button + sort-style context menu popover (stays open for multi-toggle)
    const pinBtn = document.createElement("button");
    pinBtn.type = "button";
    pinBtn.className = "mjr-icon-btn mjr-mfv-pin-trigger";
    pinBtn.title = "Pin slots A/B/C/D";
    pinBtn.setAttribute("aria-haspopup", "dialog");
    pinBtn.setAttribute("aria-expanded", "false");
    pinBtn.innerHTML = '<i class="pi pi-map-marker" aria-hidden="true"></i>';
    bar.appendChild(pinBtn);

    const pinPopover = document.createElement("div");
    pinPopover.className = "mjr-mfv-pin-popover";
    viewer.element.appendChild(pinPopover);

    const pinMenuDiv = document.createElement("div");
    pinMenuDiv.className = "mjr-menu";
    pinMenuDiv.style.cssText = "display:grid;gap:4px;";
    pinMenuDiv.setAttribute("role", "group");
    pinMenuDiv.setAttribute("aria-label", "Pin References");
    pinPopover.appendChild(pinMenuDiv);

    viewer._pinGroup = pinMenuDiv;
    viewer._pinBtns = {};
    for (const slot of ["A", "B", "C", "D"]) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mjr-menu-item mjr-mfv-pin-btn";
        btn.dataset.slot = slot;
        btn.title = `Pin Asset ${slot}`;
        btn.setAttribute("aria-pressed", "false");

        const lbl = document.createElement("span");
        lbl.className = "mjr-menu-item-label";
        lbl.textContent = `Asset ${slot}`;

        const chk = document.createElement("i");
        chk.className = "pi pi-map-marker mjr-menu-item-check";
        chk.style.opacity = "0";

        btn.appendChild(lbl);
        btn.appendChild(chk);
        pinMenuDiv.appendChild(btn);
        viewer._pinBtns[slot] = btn;
    }
    viewer._updatePinUI();
    viewer._pinBtn = pinBtn;
    viewer._pinPopover = pinPopover;

    const _openPinPopover = () => {
        const btnRect = pinBtn.getBoundingClientRect();
        const parentRect = viewer.element.getBoundingClientRect();
        pinPopover.style.left = `${btnRect.left - parentRect.left}px`;
        pinPopover.style.top = `${btnRect.bottom - parentRect.top + 4}px`;
        pinPopover.classList.add("is-open");
        pinBtn.setAttribute("aria-expanded", "true");
    };
    viewer._closePinPopover = () => {
        pinPopover.classList.remove("is-open");
        pinBtn.setAttribute("aria-expanded", "false");
    };
    pinBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (pinPopover.classList.contains("is-open")) {
            viewer._closePinPopover();
        } else {
            viewer._closeAllToolbarPopovers?.();
            _openPinPopover();
        }
    });
    // Note: pinMenuDiv click is handled by rebindFloatingViewerControlHandlers via event delegation.
    // Dropdown stays open to allow toggling multiple slots.

    // Guides: icon button + sort-style context menu popover
    const guideBtn = document.createElement("button");
    guideBtn.type = "button";
    guideBtn.className = "mjr-icon-btn mjr-mfv-guides-trigger";
    guideBtn.title = "Guides";
    guideBtn.setAttribute("aria-haspopup", "listbox");
    guideBtn.setAttribute("aria-expanded", "false");
    const guideImg = document.createElement("img");
    guideImg.src = new URL("../../assets/guides-icon.png", import.meta.url).href;
    guideImg.className = "mjr-mfv-guides-icon";
    guideImg.alt = "";
    guideImg.setAttribute("aria-hidden", "true");
    guideBtn.appendChild(guideImg);
    bar.appendChild(guideBtn);

    const guidePopover = document.createElement("div");
    guidePopover.className = "mjr-mfv-guides-popover";
    viewer.element.appendChild(guidePopover);

    const guideMenu = document.createElement("div");
    guideMenu.className = "mjr-menu";
    guideMenu.style.cssText = "display:grid;gap:4px;";
    guidePopover.appendChild(guideMenu);

    const guideHiddenSel = document.createElement("select");
    guideHiddenSel.style.cssText =
        "position:absolute;opacity:0;pointer-events:none;width:0;height:0;overflow:hidden;";
    guidePopover.appendChild(guideHiddenSel);

    const _GUIDE_OPTS = [
        { value: "0", label: "Off" },
        { value: "1", label: "Thirds" },
        { value: "2", label: "Center" },
        { value: "3", label: "Safe" },
    ];
    const _initGuide = String(viewer._gridMode || 0);
    const guideItemEls = [];
    for (const opt of _GUIDE_OPTS) {
        const optEl = document.createElement("option");
        optEl.value = opt.value;
        guideHiddenSel.appendChild(optEl);

        const item = document.createElement("button");
        item.type = "button";
        item.className = "mjr-menu-item";
        item.dataset.value = opt.value;

        const lbl = document.createElement("span");
        lbl.className = "mjr-menu-item-label";
        lbl.textContent = opt.label;

        const chk = document.createElement("i");
        chk.className = "pi pi-check mjr-menu-item-check";
        chk.style.opacity = opt.value === _initGuide ? "1" : "0";

        item.appendChild(lbl);
        item.appendChild(chk);
        guideMenu.appendChild(item);
        guideItemEls.push(item);
        if (opt.value === _initGuide) item.classList.add("is-active");
    }
    guideHiddenSel.value = _initGuide;
    guideBtn.classList.toggle("is-on", _initGuide !== "0");
    viewer._guidesSelect = guideHiddenSel;
    viewer._guideBtn = guideBtn;
    viewer._guidePopover = guidePopover;

    const _openGuidePopover = () => {
        const btnRect = guideBtn.getBoundingClientRect();
        const parentRect = viewer.element.getBoundingClientRect();
        guidePopover.style.left = `${btnRect.left - parentRect.left}px`;
        guidePopover.style.top = `${btnRect.bottom - parentRect.top + 4}px`;
        guidePopover.classList.add("is-open");
        guideBtn.setAttribute("aria-expanded", "true");
    };
    viewer._closeGuidePopover = () => {
        guidePopover.classList.remove("is-open");
        guideBtn.setAttribute("aria-expanded", "false");
    };
    guideBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (guidePopover.classList.contains("is-open")) {
            viewer._closeGuidePopover();
        } else {
            viewer._closeAllToolbarPopovers?.();
            _openGuidePopover();
        }
    });
    guideMenu.addEventListener("click", (e) => {
        const item = e.target.closest(".mjr-menu-item");
        if (!item) return;
        const val = item.dataset.value;
        guideHiddenSel.value = val;
        guideHiddenSel.dispatchEvent(new Event("change", { bubbles: true }));
        guideItemEls.forEach((it) => {
            const active = it.dataset.value === val;
            it.classList.toggle("is-active", active);
            it.querySelector(".mjr-menu-item-check").style.opacity = active ? "1" : "0";
        });
        guideBtn.classList.toggle("is-on", val !== "0");
        viewer._closeGuidePopover();
    });

    // Channel: icon button + sort-style context menu popover
    const _initCh = String(viewer._channel || "rgb");
    const chBtn = document.createElement("button");
    chBtn.type = "button";
    chBtn.className = "mjr-icon-btn mjr-mfv-ch-trigger";
    chBtn.title = "Channel";
    chBtn.setAttribute("aria-haspopup", "listbox");
    chBtn.setAttribute("aria-expanded", "false");
    const chImg = document.createElement("img");
    chImg.src = new URL("../../assets/channel-icon.png", import.meta.url).href;
    chImg.className = "mjr-mfv-ch-icon";
    chImg.alt = "";
    chImg.setAttribute("aria-hidden", "true");
    chBtn.appendChild(chImg);
    bar.appendChild(chBtn);

    const _updateChBtnDisplay = (val) => {
        if (!val || val === "rgb") {
            chBtn.replaceChildren(chImg);
        } else {
            const color = _CH_COLOR[val] || "#e0e0e0";
            const weight = _CH_WEIGHT[val] || "500";
            const label = _CH_LABEL[val] || val.toUpperCase();
            const span = document.createElement("span");
            span.className = "mjr-mfv-ch-label";
            span.style.color = color;
            span.style.fontWeight = weight;
            span.textContent = label;
            chBtn.replaceChildren(span);
        }
    };

    const chPopover = document.createElement("div");
    chPopover.className = "mjr-mfv-ch-popover";
    viewer.element.appendChild(chPopover);

    const chMenu = document.createElement("div");
    chMenu.className = "mjr-menu";
    chMenu.style.cssText = "display:grid;gap:4px;";
    chPopover.appendChild(chMenu);

    const chHiddenSel = document.createElement("select");
    chHiddenSel.style.cssText =
        "position:absolute;opacity:0;pointer-events:none;width:0;height:0;overflow:hidden;";
    chPopover.appendChild(chHiddenSel);

    const _CH_OPTS = [
        { value: "rgb", color: "#e0e0e0", weight: "500", label: "RGB" },
        { value: "r", color: "#ff5555", weight: "700", label: "R" },
        { value: "g", color: "#44dd66", weight: "700", label: "G" },
        { value: "b", color: "#5599ff", weight: "700", label: "B" },
        { value: "a", color: "#ffffff", weight: "700", label: "A" },
        { value: "l", color: "#bbbbbb", weight: "400", label: "L" },
    ];
    const chItemEls = [];
    for (const opt of _CH_OPTS) {
        const optEl = document.createElement("option");
        optEl.value = opt.value;
        chHiddenSel.appendChild(optEl);

        const item = document.createElement("button");
        item.type = "button";
        item.className = "mjr-menu-item";
        item.dataset.value = opt.value;

        const lbl = document.createElement("span");
        lbl.className = "mjr-menu-item-label";
        const colored = document.createElement("span");
        colored.textContent = opt.label;
        colored.style.color = opt.color;
        colored.style.fontWeight = opt.weight;
        lbl.appendChild(colored);

        const chk = document.createElement("i");
        chk.className = "pi pi-check mjr-menu-item-check";
        chk.style.opacity = opt.value === _initCh ? "1" : "0";

        item.appendChild(lbl);
        item.appendChild(chk);
        chMenu.appendChild(item);
        chItemEls.push(item);
        if (opt.value === _initCh) item.classList.add("is-active");
    }
    chHiddenSel.value = _initCh;
    _updateChBtnDisplay(_initCh);
    chBtn.classList.toggle("is-on", _initCh !== "rgb");
    viewer._channelSelect = chHiddenSel;
    viewer._chBtn = chBtn;
    viewer._chPopover = chPopover;

    const _openChPopover = () => {
        const btnRect = chBtn.getBoundingClientRect();
        const parentRect = viewer.element.getBoundingClientRect();
        chPopover.style.left = `${btnRect.left - parentRect.left}px`;
        chPopover.style.top = `${btnRect.bottom - parentRect.top + 4}px`;
        chPopover.classList.add("is-open");
        chBtn.setAttribute("aria-expanded", "true");
    };
    viewer._closeChPopover = () => {
        chPopover.classList.remove("is-open");
        chBtn.setAttribute("aria-expanded", "false");
    };
    chBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (chPopover.classList.contains("is-open")) {
            viewer._closeChPopover();
        } else {
            viewer._closeAllToolbarPopovers?.();
            _openChPopover();
        }
    });
    chMenu.addEventListener("click", (e) => {
        const item = e.target.closest(".mjr-menu-item");
        if (!item) return;
        const val = item.dataset.value;
        chHiddenSel.value = val;
        chHiddenSel.dispatchEvent(new Event("change", { bubbles: true }));
        chItemEls.forEach((it) => {
            const active = it.dataset.value === val;
            it.classList.toggle("is-active", active);
            it.querySelector(".mjr-menu-item-check").style.opacity = active ? "1" : "0";
        });
        _updateChBtnDisplay(val);
        chBtn.classList.toggle("is-on", val !== "rgb");
        viewer._closeChPopover();
    });

    // Mutual exclusion: close all toolbar popovers (called before any one opens)
    viewer._closeAllToolbarPopovers = () => {
        viewer._closeChPopover?.();
        viewer._closeGuidePopover?.();
        viewer._closePinPopover?.();
        viewer._closeFormatPopover?.();
        viewer._closeGenDropdown?.();
    };

    viewer._exposureCtl = createMiniRange("Exposure (EV)", {
        min: -10,
        max: 10,
        step: 0.1,
        value: Number(viewer._exposureEV || 0),
    });
    viewer._exposureCtl.out.textContent = `${Number(viewer._exposureEV || 0).toFixed(1)}EV`;
    viewer._exposureCtl.out.title = "Click to reset to 0 EV";
    viewer._exposureCtl.out.style.cursor = "pointer";
    viewer._exposureCtl.wrap.classList.toggle("is-active", (viewer._exposureEV || 0) !== 0);
    bar.appendChild(viewer._exposureCtl.wrap);

    // Format mask: single trigger button + popover (format options + opacity slider)
    viewer._formatToggle = document.createElement("button");
    viewer._formatToggle.type = "button";
    viewer._formatToggle.className = "mjr-icon-btn mjr-mfv-format-trigger";
    viewer._formatToggle.setAttribute("aria-haspopup", "dialog");
    viewer._formatToggle.setAttribute("aria-expanded", "false");
    viewer._formatToggle.setAttribute("aria-pressed", "false");
    viewer._formatToggle.title = "Format mask";
    viewer._formatToggle.innerHTML = '<i class="pi pi-stop" aria-hidden="true"></i>';
    bar.appendChild(viewer._formatToggle);

    const fmtPopover = document.createElement("div");
    fmtPopover.className = "mjr-mfv-format-popover";
    viewer.element.appendChild(fmtPopover);

    const fmtMenu = document.createElement("div");
    fmtMenu.className = "mjr-menu";
    fmtMenu.style.cssText = "display:grid;gap:4px;";
    fmtPopover.appendChild(fmtMenu);

    const fmtHiddenSel = document.createElement("select");
    fmtHiddenSel.style.cssText =
        "position:absolute;opacity:0;pointer-events:none;width:0;height:0;overflow:hidden;";
    fmtPopover.appendChild(fmtHiddenSel);

    const _FMT_OPTS = [
        { value: "off", label: "Off" },
        { value: "image", label: "Image" },
        { value: "16:9", label: "16:9" },
        { value: "1:1", label: "1:1" },
        { value: "4:3", label: "4:3" },
        { value: "9:16", label: "9:16" },
        { value: "2.39", label: "2.39" },
    ];
    const fmtItemEls = [];
    const _initFmt = viewer._overlayMaskEnabled ? String(viewer._overlayFormat || "image") : "off";
    for (const opt of _FMT_OPTS) {
        const optEl = document.createElement("option");
        optEl.value = opt.value;
        fmtHiddenSel.appendChild(optEl);

        const item = document.createElement("button");
        item.type = "button";
        item.className = "mjr-menu-item";
        item.dataset.value = opt.value;

        const lbl = document.createElement("span");
        lbl.className = "mjr-menu-item-label";
        lbl.textContent = opt.label;

        const chk = document.createElement("i");
        chk.className = "pi pi-check mjr-menu-item-check";
        chk.style.opacity = opt.value === _initFmt ? "1" : "0";

        item.appendChild(lbl);
        item.appendChild(chk);
        fmtMenu.appendChild(item);
        fmtItemEls.push(item);
        if (opt.value === _initFmt) item.classList.add("is-active");
    }
    fmtHiddenSel.value = _initFmt;

    // Separator + opacity slider row
    const fmtSep = document.createElement("div");
    fmtSep.className = "mjr-mfv-format-sep";
    fmtPopover.appendChild(fmtSep);

    const fmtSliderRow = document.createElement("div");
    fmtSliderRow.className = "mjr-mfv-format-slider-row";
    fmtPopover.appendChild(fmtSliderRow);

    const fmtSliderLabel = document.createElement("span");
    fmtSliderLabel.className = "mjr-mfv-format-slider-label";
    fmtSliderLabel.textContent = "Opacity";
    fmtSliderRow.appendChild(fmtSliderLabel);

    viewer._maskOpacityCtl = createMiniRange("Mask opacity", {
        min: 0,
        max: 0.9,
        step: 0.01,
        value: Number(viewer._overlayMaskOpacity ?? 0.65),
    });
    fmtSliderRow.appendChild(viewer._maskOpacityCtl.input);
    fmtSliderRow.appendChild(viewer._maskOpacityCtl.out);

    viewer._formatSelect = fmtHiddenSel;
    viewer._formatPopover = fmtPopover;

    const _openFmtPopover = () => {
        const btnRect = viewer._formatToggle.getBoundingClientRect();
        const parentRect = viewer.element.getBoundingClientRect();
        fmtPopover.style.left = `${btnRect.left - parentRect.left}px`;
        fmtPopover.style.top = `${btnRect.bottom - parentRect.top + 4}px`;
        fmtPopover.classList.add("is-open");
        viewer._formatToggle.setAttribute("aria-expanded", "true");
    };
    viewer._closeFormatPopover = () => {
        fmtPopover.classList.remove("is-open");
        viewer._formatToggle.setAttribute("aria-expanded", "false");
    };
    viewer._formatToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        if (fmtPopover.classList.contains("is-open")) {
            viewer._closeFormatPopover();
        } else {
            viewer._closeAllToolbarPopovers?.();
            _openFmtPopover();
        }
    });
    fmtMenu.addEventListener("click", (e) => {
        const item = e.target.closest(".mjr-menu-item");
        if (!item) return;
        const val = item.dataset.value;
        fmtHiddenSel.value = val;
        fmtHiddenSel.dispatchEvent(new Event("change", { bubbles: true }));
        fmtItemEls.forEach((it) => {
            const active = it.dataset.value === val;
            it.classList.toggle("is-active", active);
            it.querySelector(".mjr-menu-item-check").style.opacity = active ? "1" : "0";
        });
        viewer._closeFormatPopover();
    });

    const sep = document.createElement("div");
    sep.className = "mjr-mfv-toolbar-sep";
    sep.setAttribute("aria-hidden", "true");
    bar.appendChild(sep);

    viewer._liveBtn = document.createElement("button");
    viewer._liveBtn.type = "button";
    viewer._liveBtn.className = "mjr-icon-btn";
    viewer._liveBtn.innerHTML = '<i class="pi pi-circle" aria-hidden="true"></i>';
    viewer._liveBtn.setAttribute("aria-pressed", "false");
    setTooltipHint(
        viewer._liveBtn,
        t("tooltip.liveStreamOff", "Live Stream: OFF - click to follow final generation outputs"),
        MFV_LIVE_HINT,
    );
    bar.appendChild(viewer._liveBtn);

    viewer._previewBtn = document.createElement("button");
    viewer._previewBtn.type = "button";
    viewer._previewBtn.className = "mjr-icon-btn";
    viewer._previewBtn.innerHTML = '<i class="pi pi-eye" aria-hidden="true"></i>';
    viewer._previewBtn.setAttribute("aria-pressed", "false");
    setTooltipHint(
        viewer._previewBtn,
        t(
            "tooltip.previewStreamOff",
            "KSampler Preview: OFF - click to stream sampler denoising frames",
        ),
        MFV_PREVIEW_HINT,
    );
    bar.appendChild(viewer._previewBtn);

    viewer._nodeStreamBtn = document.createElement("button");
    viewer._nodeStreamBtn.type = "button";
    viewer._nodeStreamBtn.className = "mjr-icon-btn";
    viewer._nodeStreamBtn.innerHTML = '<i class="pi pi-sitemap" aria-hidden="true"></i>';
    viewer._nodeStreamBtn.setAttribute("aria-pressed", "false");
    setTooltipHint(
        viewer._nodeStreamBtn,
        t(
            "tooltip.nodeStreamOff",
            "Node Stream: OFF - click to follow selected node previews, including ImageOps live canvases",
        ),
        MFV_NODESTREAM_HINT,
    );
    bar.appendChild(viewer._nodeStreamBtn);
    if (!NODE_STREAM_FEATURE_ENABLED) {
        viewer._nodeStreamBtn.remove?.();
        viewer._nodeStreamBtn = null;
    }

    viewer._genBtn = document.createElement("button");
    viewer._genBtn.type = "button";
    viewer._genBtn.className = "mjr-icon-btn";
    viewer._genBtn.setAttribute("aria-haspopup", "dialog");
    viewer._genBtn.setAttribute("aria-expanded", "false");
    const genBtnIcon = document.createElement("i");
    genBtnIcon.className = "pi pi-info-circle";
    genBtnIcon.setAttribute("aria-hidden", "true");
    viewer._genBtn.appendChild(genBtnIcon);
    bar.appendChild(viewer._genBtn);
    viewer._updateGenBtnUI();

    viewer._popoutBtn = document.createElement("button");
    viewer._popoutBtn.type = "button";
    viewer._popoutBtn.className = "mjr-icon-btn";
    const popoutLabel = t("tooltip.popOutViewer", "Pop out viewer to separate window");
    viewer._popoutBtn.title = popoutLabel;
    viewer._popoutBtn.setAttribute("aria-label", popoutLabel);
    viewer._popoutBtn.setAttribute("aria-pressed", "false");
    const popoutIcon = document.createElement("i");
    popoutIcon.className = "pi pi-external-link";
    popoutIcon.setAttribute("aria-hidden", "true");
    viewer._popoutBtn.appendChild(popoutIcon);
    bar.appendChild(viewer._popoutBtn);

    viewer._captureBtn = document.createElement("button");
    viewer._captureBtn.type = "button";
    viewer._captureBtn.className = "mjr-icon-btn";
    const captureLabel = t("tooltip.captureView", "Save view as image");
    viewer._captureBtn.title = captureLabel;
    viewer._captureBtn.setAttribute("aria-label", captureLabel);
    const captureBtnIcon = document.createElement("i");
    captureBtnIcon.className = "pi pi-download";
    captureBtnIcon.setAttribute("aria-hidden", "true");
    viewer._captureBtn.appendChild(captureBtnIcon);
    bar.appendChild(viewer._captureBtn);

    const sep2 = document.createElement("div");
    sep2.className = "mjr-mfv-toolbar-sep";
    sep2.style.marginLeft = "auto";
    sep2.setAttribute("aria-hidden", "true");
    bar.appendChild(sep2);

    viewer._settingsBtn = document.createElement("button");
    viewer._settingsBtn.type = "button";
    viewer._settingsBtn.className = "mjr-icon-btn mjr-mfv-settings-btn";
    const settingsLabel = t("tooltip.nodeParams", "Node Parameters");
    viewer._settingsBtn.title = settingsLabel;
    viewer._settingsBtn.setAttribute("aria-label", settingsLabel);
    viewer._settingsBtn.setAttribute("aria-pressed", "false");
    const settingsIcon = document.createElement("i");
    settingsIcon.className = "pi pi-sliders-h";
    settingsIcon.setAttribute("aria-hidden", "true");
    viewer._settingsBtn.appendChild(settingsIcon);
    bar.appendChild(viewer._settingsBtn);

    viewer._runHandle = createRunButton();
    bar.appendChild(viewer._runHandle.el);

    viewer._handleDocClick = (ev) => {
        const target = ev?.target;
        // Gen dropdown
        if (viewer._genDropdown) {
            if (!viewer._genBtn?.contains?.(target) && !viewer._genDropdown.contains(target)) {
                viewer._closeGenDropdown();
            }
        }
        // Channel popover
        if (viewer._chPopover?.classList?.contains("is-open")) {
            if (!viewer._chBtn?.contains?.(target) && !viewer._chPopover.contains(target)) {
                viewer._closeChPopover?.();
            }
        }
        // Guides popover
        if (viewer._guidePopover?.classList?.contains("is-open")) {
            if (!viewer._guideBtn?.contains?.(target) && !viewer._guidePopover.contains(target)) {
                viewer._closeGuidePopover?.();
            }
        }
        // Pin popover
        if (viewer._pinPopover?.classList?.contains("is-open")) {
            if (!viewer._pinBtn?.contains?.(target) && !viewer._pinPopover.contains(target)) {
                viewer._closePinPopover?.();
            }
        }
        // Format popover
        if (viewer._formatPopover?.classList?.contains("is-open")) {
            if (
                !viewer._formatToggle?.contains?.(target) &&
                !viewer._formatPopover.contains(target)
            ) {
                viewer._closeFormatPopover?.();
            }
        }
        // Icon dropdowns: close if click is outside any .mjr-mfv-idrop
        if (!target?.closest?.(".mjr-mfv-idrop")) {
            viewer.element
                ?.querySelectorAll?.(".mjr-mfv-idrop-menu.is-open")
                .forEach((m) => m.classList.remove("is-open"));
        }
    };
    viewer._bindDocumentUiHandlers();

    return bar;
}

export function rebindFloatingViewerControlHandlers(viewer) {
    try {
        viewer._btnAC?.abort();
    } catch (e) {
        console.debug?.(e);
    }
    viewer._btnAC = new AbortController();
    const signal = viewer._btnAC.signal;

    viewer._closeBtn?.addEventListener(
        "click",
        () => {
            viewer._dispatchControllerAction("close", EVENTS.MFV_CLOSE);
        },
        { signal },
    );

    viewer._modeSelect?.addEventListener(
        "change",
        () => {
            const nextMode = viewer._modeSelect?.value;
            if (nextMode) viewer.setMode(nextMode);
        },
        { signal },
    );

    viewer._pinGroup?.addEventListener(
        "click",
        (e) => {
            const btn = e.target?.closest?.(".mjr-mfv-pin-btn");
            if (!btn) return;
            const slot = btn.dataset.slot;
            if (!slot) return;
            if (viewer._pinnedSlots.has(slot)) {
                viewer._pinnedSlots.delete(slot);
            } else {
                viewer._pinnedSlots.add(slot);
            }
            if (viewer._pinnedSlots.has("C") || viewer._pinnedSlots.has("D")) {
                if (viewer._mode !== MFV_MODES.GRID) viewer.setMode(MFV_MODES.GRID);
            } else if (viewer._pinnedSlots.size > 0 && viewer._mode === MFV_MODES.SIMPLE) {
                viewer.setMode(MFV_MODES.AB);
            }
            viewer._updatePinUI();
        },
        { signal },
    );

    viewer._liveBtn?.addEventListener(
        "click",
        () => {
            viewer._dispatchControllerAction("toggleLive", EVENTS.MFV_LIVE_TOGGLE);
        },
        { signal },
    );

    viewer._previewBtn?.addEventListener(
        "click",
        () => {
            viewer._dispatchControllerAction("togglePreview", EVENTS.MFV_PREVIEW_TOGGLE);
        },
        { signal },
    );

    viewer._nodeStreamBtn?.addEventListener(
        "click",
        () => {
            viewer._dispatchControllerAction("toggleNodeStream", EVENTS.MFV_NODESTREAM_TOGGLE);
        },
        { signal },
    );

    viewer._genBtn?.addEventListener(
        "click",
        (e) => {
            e.stopPropagation();
            if (viewer._genDropdown?.classList?.contains("is-visible")) {
                viewer._closeGenDropdown();
            } else {
                viewer._closeAllToolbarPopovers?.();
                viewer._openGenDropdown();
            }
        },
        { signal },
    );

    viewer._popoutBtn?.addEventListener(
        "click",
        () => {
            viewer._dispatchControllerAction("popOut", EVENTS.MFV_POPOUT);
        },
        { signal },
    );

    viewer._captureBtn?.addEventListener("click", () => viewer._captureView(), { signal });

    viewer._settingsBtn?.addEventListener(
        "click",
        () => {
            viewer._sidebar?.toggle();
            viewer._updateSettingsBtnState(viewer._sidebar?.isVisible ?? false);
        },
        { signal },
    );

    viewer._guidesSelect?.addEventListener(
        "change",
        () => {
            viewer._gridMode = Number(viewer._guidesSelect.value) || 0;
            viewer._guideBtn?.classList.toggle("is-on", viewer._gridMode !== 0);
            viewer._redrawOverlayGuides?.();
        },
        { signal },
    );

    viewer._channelSelect?.addEventListener(
        "change",
        () => {
            viewer._channel = String(viewer._channelSelect.value || "rgb");
            viewer._chBtn?.classList.toggle("is-on", viewer._channel !== "rgb");
            viewer._applyMediaToneControls?.();
        },
        { signal },
    );

    viewer._exposureCtl?.input?.addEventListener(
        "input",
        () => {
            const v = Math.max(-10, Math.min(10, Number(viewer._exposureCtl.input.value) || 0));
            viewer._exposureEV = Math.round(v * 10) / 10;
            viewer._exposureCtl.out.textContent = `${viewer._exposureEV.toFixed(1)}EV`;
            viewer._exposureCtl.wrap.classList.toggle("is-active", viewer._exposureEV !== 0);
            viewer._applyMediaToneControls?.();
        },
        { signal },
    );

    viewer._exposureCtl?.out?.addEventListener(
        "click",
        () => {
            viewer._exposureEV = 0;
            viewer._exposureCtl.input.value = "0";
            viewer._exposureCtl.out.textContent = "0.0EV";
            viewer._exposureCtl.wrap.classList.remove("is-active");
            viewer._applyMediaToneControls?.();
        },
        { signal },
    );

    viewer._formatSelect?.addEventListener(
        "change",
        () => {
            const val = String(viewer._formatSelect.value || "image");
            if (val === "off") {
                viewer._overlayMaskEnabled = false;
            } else {
                viewer._overlayMaskEnabled = true;
                viewer._overlayFormat = val;
            }
            viewer._formatToggle?.classList.toggle("is-on", Boolean(viewer._overlayMaskEnabled));
            viewer._formatToggle?.setAttribute(
                "aria-pressed",
                String(Boolean(viewer._overlayMaskEnabled)),
            );
            viewer._redrawOverlayGuides?.();
        },
        { signal },
    );

    viewer._maskOpacityCtl?.input?.addEventListener(
        "input",
        () => {
            const v = Number(viewer._maskOpacityCtl.input.value);
            const clamped = Math.max(0, Math.min(0.9, Number.isFinite(v) ? v : 0.65));
            viewer._overlayMaskOpacity = Math.round(clamped * 100) / 100;
            viewer._maskOpacityCtl.out.textContent = viewer._overlayMaskOpacity.toFixed(2);
            viewer._redrawOverlayGuides?.();
        },
        { signal },
    );
}

export function updateFloatingViewerSettingsBtnState(viewer, active) {
    if (!viewer._settingsBtn) return;
    viewer._settingsBtn.classList.toggle("active", Boolean(active));
    viewer._settingsBtn.setAttribute("aria-pressed", String(Boolean(active)));
}

export function applyFloatingViewerSidebarPosition(viewer) {
    if (!viewer._contentWrapper) return;
    const pos = APP_CONFIG.MFV_SIDEBAR_POSITION || "right";
    viewer._contentWrapper.setAttribute("data-sidebar-pos", pos);

    if (viewer._sidebar?.el && viewer._contentEl) {
        if (pos === "left") {
            viewer._contentWrapper.insertBefore(viewer._sidebar.el, viewer._contentEl);
        } else {
            viewer._contentWrapper.appendChild(viewer._sidebar.el);
        }
    }
}

export function resetFloatingViewerGenDropdownForCurrentDocument(viewer) {
    viewer._closeGenDropdown();
    try {
        viewer._genDropdown?.remove?.();
    } catch (e) {
        console.debug?.(e);
    }
    viewer._genDropdown = null;
    viewer._updateGenBtnUI();
}

export function bindFloatingViewerDocumentUiHandlers(viewer) {
    if (!viewer._handleDocClick) return;
    const doc = viewer.element?.ownerDocument || document;
    if (viewer._docClickHost === doc) return;
    viewer._unbindDocumentUiHandlers();
    try {
        viewer._docAC?.abort();
    } catch (e) {
        console.debug?.(e);
    }
    viewer._docAC = new AbortController();
    doc.addEventListener("click", viewer._handleDocClick, { signal: viewer._docAC.signal });
    viewer._docClickHost = doc;
}

export function unbindFloatingViewerDocumentUiHandlers(viewer) {
    try {
        viewer._docAC?.abort();
    } catch (e) {
        console.debug?.(e);
    }
    viewer._docAC = new AbortController();
    viewer._docClickHost = null;
}

export function isFloatingViewerGenDropdownOpen(viewer) {
    return !!viewer._genDropdown?.classList?.contains("is-visible");
}

export function openFloatingViewerGenDropdown(viewer) {
    if (!viewer.element) return;
    if (!viewer._genDropdown) {
        viewer._genDropdown = viewer._buildGenDropdown();
        viewer.element.appendChild(viewer._genDropdown);
    }
    viewer._bindDocumentUiHandlers();
    const rect = viewer._genBtn.getBoundingClientRect();
    const parentRect = viewer.element.getBoundingClientRect();
    const left = rect.left - parentRect.left;
    const top = rect.bottom - parentRect.top + 6;
    viewer._genDropdown.style.left = `${left}px`;
    viewer._genDropdown.style.top = `${top}px`;
    viewer._genDropdown.classList.add("is-visible");
    viewer._updateGenBtnUI();
}

export function closeFloatingViewerGenDropdown(viewer) {
    if (!viewer._genDropdown) return;
    viewer._genDropdown.classList.remove("is-visible");
    viewer._updateGenBtnUI();
}

export function updateFloatingViewerGenButtonUI(viewer) {
    if (!viewer._genBtn) return;
    const count = viewer._genInfoSelections.size;
    const isOn = count > 0;
    const isOpen = viewer._isGenDropdownOpen();
    viewer._genBtn.classList.toggle("is-on", isOn);
    viewer._genBtn.classList.toggle("is-open", isOpen);
    const label = isOn
        ? `Gen Info (${count} field${count > 1 ? "s" : ""} shown)${isOpen ? " — open" : " — click to configure"}`
        : `Gen Info${isOpen ? " — open" : " — click to show overlay"}`;
    viewer._genBtn.title = label;
    viewer._genBtn.setAttribute("aria-label", label);
    viewer._genBtn.setAttribute("aria-expanded", String(isOpen));
    if (viewer._genDropdown) {
        viewer._genBtn.setAttribute("aria-controls", viewer._genDropdownId);
    } else {
        viewer._genBtn.removeAttribute("aria-controls");
    }
}

export function buildFloatingViewerGenDropdown(viewer) {
    const d = document.createElement("div");
    d.className = "mjr-mfv-gen-dropdown";
    d.id = viewer._genDropdownId;
    d.setAttribute("role", "group");
    d.setAttribute("aria-label", "Generation info fields");
    const opts = [
        ["prompt", "Prompt"],
        ["seed", "Seed"],
        ["model", "Model"],
        ["lora", "LoRA"],
        ["sampler", "Sampler"],
        ["scheduler", "Scheduler"],
        ["cfg", "CFG"],
        ["step", "Step"],
        ["genTime", "Gen Time"],
    ];
    for (const [key, label] of opts) {
        const row = document.createElement("label");
        row.className = "mjr-mfv-gen-dropdown-row";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = viewer._genInfoSelections.has(key);
        cb.addEventListener("change", () => {
            if (cb.checked) viewer._genInfoSelections.add(key);
            else viewer._genInfoSelections.delete(key);
            viewer._updateGenBtnUI();
            viewer._refresh();
        });
        const span = document.createElement("span");
        span.textContent = label;
        row.appendChild(cb);
        row.appendChild(span);
        d.appendChild(row);
    }
    return d;
}

function formatFloatingViewerGenTime(totalSeconds) {
    const seconds = Number(totalSeconds);
    if (!Number.isFinite(seconds) || seconds <= 0) return "";
    if (seconds >= 60) return `${(seconds / 60).toFixed(1)}m`;
    return `${seconds.toFixed(1)}s`;
}

function parseFloatingViewerGenTimeSeconds(value) {
    const text = String(value || "")
        .trim()
        .toLowerCase();
    if (!text) return 0;
    if (text.endsWith("m")) {
        const mins = Number.parseFloat(text.slice(0, -1));
        return Number.isFinite(mins) ? mins * 60 : 0;
    }
    if (text.endsWith("s")) {
        const secs = Number.parseFloat(text.slice(0, -1));
        return Number.isFinite(secs) ? secs : 0;
    }
    const fallback = Number.parseFloat(text);
    return Number.isFinite(fallback) ? fallback : 0;
}

export function getFloatingViewerGenFields(_viewer, fileData) {
    if (!fileData) return {};
    try {
        const candidate = fileData.geninfo
            ? { geninfo: fileData.geninfo }
            : fileData.metadata || fileData.metadata_raw || fileData;
        const norm = normalizeGenerationMetadata(candidate) || null;
        const out = {
            prompt: "",
            seed: "",
            model: "",
            lora: "",
            sampler: "",
            scheduler: "",
            cfg: "",
            step: "",
            genTime: "",
        };
        if (norm && typeof norm === "object") {
            if (norm.prompt) out.prompt = sanitizePromptForDisplay(String(norm.prompt));
            if (norm.seed != null) out.seed = String(norm.seed);
            if (norm.model)
                out.model = Array.isArray(norm.model) ? norm.model.join(", ") : String(norm.model);
            const apiWorkflowSummary = summarizeFloatingViewerApiWorkflow(norm);
            const multiModelSummary = summarizeNormalizedModels(norm);
            if (multiModelSummary) out.model = multiModelSummary;
            if (apiWorkflowSummary) {
                out.model = [apiWorkflowSummary, out.model].filter(Boolean).join(" | ");
            }
            if (Array.isArray(norm.loras)) {
                out.lora = norm.loras
                    .map((l) =>
                        typeof l === "string" ? l : l?.name || l?.lora_name || l?.model_name || "",
                    )
                    .filter(Boolean)
                    .join(", ");
            }
            if (norm.sampler) out.sampler = String(norm.sampler);
            if (norm.scheduler) out.scheduler = String(norm.scheduler);
            if (norm.cfg != null) out.cfg = String(norm.cfg);
            if (norm.steps != null) out.step = String(norm.steps);
            if (!out.prompt && candidate?.prompt) {
                out.prompt = sanitizePromptForDisplay(String(candidate.prompt || ""));
            }

            const genTimeMs =
                fileData.generation_time_ms ??
                fileData.metadata_raw?.generation_time_ms ??
                candidate?.generation_time_ms ??
                candidate?.geninfo?.generation_time_ms ??
                0;
            if (
                genTimeMs &&
                Number.isFinite(Number(genTimeMs)) &&
                genTimeMs > 0 &&
                genTimeMs < 86400000
            ) {
                out.genTime = formatFloatingViewerGenTime(Number(genTimeMs) / 1000);
            }
            return out;
        }
    } catch (e) {
        console.debug?.("[MFV] geninfo normalize failed", e);
    }

    const meta = fileData?.metadata || fileData?.metadata_raw || fileData || {};
    const out = {
        prompt: sanitizePromptForDisplay(String(meta?.prompt || meta?.positive || "")),
        seed: meta?.seed != null ? String(meta.seed) : "",
        model: meta?.checkpoint || meta?.ckpt_name || meta?.model || "",
        lora: Array.isArray(meta?.loras) ? meta.loras.join(", ") : meta?.lora || "",
        sampler: meta?.sampler_name || meta?.sampler || "",
        scheduler: meta?.scheduler || "",
        cfg:
            meta?.cfg != null
                ? String(meta.cfg)
                : meta?.cfg_scale != null
                  ? String(meta.cfg_scale)
                  : "",
        step: meta?.steps != null ? String(meta.steps) : "",
        genTime: "",
    };

    const genTimeMsFallback =
        fileData.generation_time_ms ??
        fileData.metadata_raw?.generation_time_ms ??
        meta?.generation_time_ms ??
        0;
    if (
        genTimeMsFallback &&
        Number.isFinite(Number(genTimeMsFallback)) &&
        genTimeMsFallback > 0 &&
        genTimeMsFallback < 86400000
    ) {
        out.genTime = formatFloatingViewerGenTime(Number(genTimeMsFallback) / 1000);
    }
    return out;
}

export function buildFloatingViewerGenInfoDOM(viewer, fileData) {
    const fields = viewer._getGenFields(fileData);
    if (!fields) return null;
    const frag = document.createDocumentFragment();
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
    for (const k of order) {
        if (!viewer._genInfoSelections.has(k)) continue;
        const v = fields[k] != null ? String(fields[k]) : "";
        if (!v) continue;
        let label = k.charAt(0).toUpperCase() + k.slice(1);
        if (k === "lora") label = "LoRA";
        else if (k === "cfg") label = "CFG";
        else if (k === "genTime") label = "Gen Time";
        const div = document.createElement("div");
        div.dataset.field = k;
        const strong = document.createElement("strong");
        strong.textContent = `${label}: `;
        div.appendChild(strong);
        if (k === "prompt") {
            div.appendChild(document.createTextNode(v));
        } else if (k === "genTime") {
            const secs = parseFloatingViewerGenTimeSeconds(v);
            let gtColor = "#4CAF50";
            if (secs >= 60) gtColor = "#FF9800";
            else if (secs >= 30) gtColor = "#FFC107";
            else if (secs >= 10) gtColor = "#8BC34A";
            const span = document.createElement("span");
            span.style.color = gtColor;
            span.style.fontWeight = "600";
            span.textContent = v;
            div.appendChild(span);
        } else {
            div.appendChild(document.createTextNode(v));
        }
        frag.appendChild(div);
    }
    return frag.childNodes.length > 0 ? frag : null;
}
