import { t } from "../../app/i18n.js";
import { appendTooltipHint } from "../../utils/tooltipShortcuts.js";
import {
    MFV_LIVE_HINT,
    MFV_MODE_HINT,
    MFV_MODES,
    MFV_NODESTREAM_HINT,
    MFV_PREVIEW_HINT,
} from "./floatingViewerConstants.js";
import { NODE_STREAM_FEATURE_ENABLED } from "./nodeStream/nodeStreamFeatureFlag.js";

export function notifyFloatingViewerModeChanged(viewer) {
    try {
        viewer._controller?.onModeChanged?.(viewer._mode);
    } catch (e) {
        console.debug?.(e);
    }
}

export function cycleFloatingViewerMode(viewer) {
    const order = [MFV_MODES.SIMPLE, MFV_MODES.AB, MFV_MODES.SIDE, MFV_MODES.GRID];
    viewer._mode = order[(order.indexOf(viewer._mode) + 1) % order.length];
    viewer._updateModeBtnUI();
    viewer._refresh();
    viewer._notifyModeChanged();
}

export function setFloatingViewerMode(viewer, mode) {
    if (!Object.values(MFV_MODES).includes(mode)) return;
    viewer._mode = mode;
    viewer._updateModeBtnUI();
    viewer._refresh();
    viewer._notifyModeChanged();
}

export function getFloatingViewerPinnedSlots(viewer) {
    return viewer._pinnedSlots;
}

export function updateFloatingViewerPinUI(viewer) {
    if (!viewer._pinBtns) return;
    for (const slot of ["A", "B", "C", "D"]) {
        const btn = viewer._pinBtns[slot];
        if (!btn) continue;
        const active = viewer._pinnedSlots.has(slot);
        btn.classList.toggle("is-pinned", active);
        btn.setAttribute("aria-pressed", String(active));
        btn.title = active ? `Unpin Asset ${slot}` : `Pin Asset ${slot}`;
    }
    // Highlight pin trigger when any slot is pinned
    viewer._pinBtn?.classList.toggle("is-on", (viewer._pinnedSlots?.size ?? 0) > 0);
}

export function updateFloatingViewerModeButtonUI(viewer) {
    if (!viewer._modeBtn) return;
    const cfg = {
        [MFV_MODES.SIMPLE]: { icon: "pi-image", label: "Mode: Simple - click to switch" },
        [MFV_MODES.AB]: { icon: "pi-clone", label: "Mode: A/B Compare - click to switch" },
        [MFV_MODES.SIDE]: { icon: "pi-table", label: "Mode: Side-by-Side - click to switch" },
        [MFV_MODES.GRID]: {
            icon: "pi-th-large",
            label: "Mode: Grid Compare (up to 4) - click to switch",
        },
    };
    const { icon = "pi-image", label = "" } = cfg[viewer._mode] || {};
    const tooltip = appendTooltipHint(label, MFV_MODE_HINT);
    const modeBtnIcon = document.createElement("i");
    modeBtnIcon.className = `pi ${icon}`;
    modeBtnIcon.setAttribute("aria-hidden", "true");
    viewer._modeBtn.replaceChildren(modeBtnIcon);
    viewer._modeBtn.title = tooltip;
    viewer._modeBtn.setAttribute("aria-label", tooltip);
    viewer._modeBtn.removeAttribute("aria-pressed");
    // Highlight when any comparison mode is active
    viewer._modeBtn.classList.toggle("is-on", viewer._mode !== MFV_MODES.SIMPLE);
}

export function setFloatingViewerLiveActive(viewer, active) {
    if (!viewer._liveBtn) return;
    const isActive = Boolean(active);
    viewer._liveBtn.classList.toggle("mjr-live-active", isActive);
    const label = isActive
        ? t(
              "tooltip.liveStreamOn",
              "Live Stream: ON - follows final generation outputs after execution",
          )
        : t("tooltip.liveStreamOff", "Live Stream: OFF - click to follow final generation outputs");
    const tooltip = appendTooltipHint(label, MFV_LIVE_HINT);
    viewer._liveBtn.setAttribute("aria-pressed", String(isActive));
    viewer._liveBtn.setAttribute("aria-label", tooltip);
    const liveIcon = document.createElement("i");
    liveIcon.className = isActive ? "pi pi-circle-fill" : "pi pi-circle";
    liveIcon.setAttribute("aria-hidden", "true");
    viewer._liveBtn.replaceChildren(liveIcon);
    viewer._liveBtn.title = tooltip;
}

export function setFloatingViewerPreviewActive(viewer, active) {
    viewer._previewActive = Boolean(active);
    if (!viewer._previewBtn) return;
    viewer._previewBtn.classList.toggle("mjr-preview-active", viewer._previewActive);
    const label = viewer._previewActive
        ? t(
              "tooltip.previewStreamOn",
              "KSampler Preview: ON - streams sampler denoising frames during execution",
          )
        : t(
              "tooltip.previewStreamOff",
              "KSampler Preview: OFF - click to stream sampler denoising frames",
          );
    const tooltip = appendTooltipHint(label, MFV_PREVIEW_HINT);
    viewer._previewBtn.setAttribute("aria-pressed", String(viewer._previewActive));
    viewer._previewBtn.setAttribute("aria-label", tooltip);
    const icon = document.createElement("i");
    icon.className = viewer._previewActive ? "pi pi-eye" : "pi pi-eye-slash";
    icon.setAttribute("aria-hidden", "true");
    viewer._previewBtn.replaceChildren(icon);
    viewer._previewBtn.title = tooltip;
    if (!viewer._previewActive) {
        viewer._revokePreviewBlob();
    }
}

export function loadFloatingViewerPreviewBlob(viewer, blob, opts = {}) {
    if (!blob || !(blob instanceof Blob)) return;
    viewer._revokePreviewBlob();
    const url = URL.createObjectURL(blob);
    viewer._previewBlobUrl = url;
    const fileData = {
        url,
        filename: "preview.jpg",
        kind: "image",
        _isPreview: true,
        _sourceLabel: opts?.sourceLabel || null,
    };

    const inCompare =
        viewer._mode === MFV_MODES.AB ||
        viewer._mode === MFV_MODES.SIDE ||
        viewer._mode === MFV_MODES.GRID;
    if (inCompare) {
        const pins = viewer.getPinnedSlots();
        if (viewer._mode === MFV_MODES.GRID) {
            const target = ["A", "B", "C", "D"].find((s) => !pins.has(s)) || "A";
            viewer[`_media${target}`] = fileData;
        } else if (pins.has("B")) {
            viewer._mediaA = fileData;
        } else {
            viewer._mediaB = fileData;
        }
    } else {
        viewer._mediaA = fileData;
        viewer._resetMfvZoom();
        if (viewer._mode !== MFV_MODES.SIMPLE) {
            viewer._mode = MFV_MODES.SIMPLE;
            viewer._updateModeBtnUI();
        }
    }
    ++viewer._refreshGen;
    viewer._refresh();
}

export function revokeFloatingViewerPreviewBlob(viewer) {
    if (viewer._previewBlobUrl) {
        try {
            URL.revokeObjectURL(viewer._previewBlobUrl);
        } catch {
            /* noop */
        }
        viewer._previewBlobUrl = null;
    }
}

export function setFloatingViewerNodeStreamActive(viewer, active) {
    if (!NODE_STREAM_FEATURE_ENABLED) {
        void active;
        viewer._nodeStreamActive = false;
        return;
    }

    viewer._nodeStreamActive = Boolean(active);
    if (!viewer._nodeStreamActive) {
        // Hide the selected-node overlay when the feature is turned off.
        viewer.setNodeStreamSelection?.(null);
    }
    if (!viewer._nodeStreamBtn) return;
    viewer._nodeStreamBtn.classList.toggle("mjr-nodestream-active", viewer._nodeStreamActive);
    const label = viewer._nodeStreamActive
        ? t(
              "tooltip.nodeStreamOn",
              "Node Stream: ON - follows the selected node preview when frontend media exists",
          )
        : t(
              "tooltip.nodeStreamOff",
              "Node Stream: OFF - click to follow selected node previews, including ImageOps live canvases",
          );
    const tooltip = appendTooltipHint(label, MFV_NODESTREAM_HINT);
    viewer._nodeStreamBtn.setAttribute("aria-pressed", String(viewer._nodeStreamActive));
    viewer._nodeStreamBtn.setAttribute("aria-label", tooltip);
    const icon = document.createElement("i");
    icon.className = "pi pi-sitemap";
    icon.setAttribute("aria-hidden", "true");
    viewer._nodeStreamBtn.replaceChildren(icon);
    viewer._nodeStreamBtn.title = tooltip;
}
