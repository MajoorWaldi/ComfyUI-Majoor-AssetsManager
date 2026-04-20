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
    normalizeGenerationMetadata,
    sanitizePromptForDisplay,
} from "../../components/sidebar/parsers/geninfoParser.js";

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
    viewer._contentEl.appendChild(buildFloatingViewerMediaProgressOverlay(viewer));

    viewer._sidebar = new WorkflowSidebar({
        hostEl: el,
        onClose: () => viewer._updateSettingsBtnState(false),
    });

    viewer._contentWrapper.appendChild(viewer._sidebar.el);

    el.appendChild(viewer._contentWrapper);

    viewer._rebindControlHandlers();
    viewer._bindPanelInteractions();
    viewer._bindDocumentUiHandlers();

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
    title.textContent = "〽️ Majoor Viewer Lite";

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
    const bar = document.createElement("div");
    bar.className = "mjr-mfv-toolbar";

    viewer._modeBtn = document.createElement("button");
    viewer._modeBtn.type = "button";
    viewer._modeBtn.className = "mjr-icon-btn";
    viewer._updateModeBtnUI();
    bar.appendChild(viewer._modeBtn);

    viewer._pinGroup = document.createElement("div");
    viewer._pinGroup.className = "mjr-mfv-pin-group";
    viewer._pinGroup.setAttribute("role", "group");
    viewer._pinGroup.setAttribute("aria-label", "Pin References");
    viewer._pinBtns = {};
    for (const slot of ["A", "B", "C", "D"]) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mjr-mfv-pin-btn";
        btn.textContent = slot;
        btn.dataset.slot = slot;
        btn.title = `Pin ${slot}`;
        btn.setAttribute("aria-pressed", "false");
        viewer._pinBtns[slot] = btn;
        viewer._pinGroup.appendChild(btn);
    }
    viewer._updatePinUI();
    bar.appendChild(viewer._pinGroup);

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
        t("tooltip.liveStreamOff", "Live Stream: OFF — click to follow"),
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
            "KSampler Preview: OFF — click to stream denoising steps",
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
        t("tooltip.nodeStreamOff", "Node Stream: OFF — click to stream selected node output"),
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
        if (!viewer._genDropdown) return;
        const target = ev?.target;
        if (viewer._genBtn?.contains?.(target)) return;
        if (viewer._genDropdown.contains(target)) return;
        viewer._closeGenDropdown();
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

    viewer._modeBtn?.addEventListener("click", () => viewer._cycleMode(), { signal });

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
    const text = String(value || "").trim().toLowerCase();
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
            if (Array.isArray(norm.loras)) {
                out.lora = norm.loras
                    .map((l) =>
                        typeof l === "string"
                            ? l
                            : l?.name || l?.lora_name || l?.model_name || "",
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
