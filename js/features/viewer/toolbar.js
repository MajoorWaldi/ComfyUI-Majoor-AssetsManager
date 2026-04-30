import { safeAddListener, safeCall } from "./lifecycle.js";
import { createIconButton, createModeButton } from "../../components/buttons.js";
import { t } from "../../app/i18n.js";
import { appendTooltipHint } from "../../utils/tooltipShortcuts.js";
import { createViewerToolbarControls } from "./toolbarControls.js";
import {
    bindToolbarEvents,
    syncToolsUIFromState as _syncToolsUI,
    syncModeButtons as _syncModeButtons,
} from "./toolbarActions.js";
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
    leftMeta.style.cssText =
        "display:flex; align-items:center; gap:10px; min-width:0; overflow:hidden;";

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
    badgesBar.style.cssText =
        "display:flex; gap:6px; align-items:center; flex-wrap:nowrap; min-width:0;";

    const rightMeta = document.createElement("div");
    rightMeta.className = "mjr-viewer-header-meta mjr-viewer-header-meta--right";
    rightMeta.style.cssText =
        "display:none; align-items:center; gap:10px; min-width:0; justify-content:flex-end; overflow:hidden;";

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
    leftArea.style.cssText =
        "display:none; align-items:center; gap:12px; min-width:0; flex:1 1 0; overflow:hidden;";
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
        "display:none; align-items:center; justify-content:flex-end; gap:12px; min-width:0; flex:1 1 0; overflow:hidden;";
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

    const {
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
    } = createViewerToolbarControls({
        VIEWER_MODES,
        state,
        onToolsChanged,
        onCompareModeChanged,
        onExportFrame,
        onCopyFrame,
        onAudioVizModeChanged,
        getCanAB,
    });
    header.appendChild(toolsRow);
    // Bind events via extracted module
    bindToolbarEvents({
        unsubs,
        state,
        VIEWER_MODES,
        onMode,
        onClose,
        onToolsChanged,
        onCompareModeChanged,
        onAudioVizModeChanged,
        onExportFrame,
        onCopyFrame,
        singleBtn,
        abBtn,
        sideBtn,
        closeBtn,
        channelsSelect,
        compareModeSelect,
        audioVizModeSelect,
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
        resetGradeBtn,
        exportBtn,
        copyBtn,
        resetExposure,
        resetGamma,
        resetViewerTools,
        expGroup,
        gamGroup,
    });

    const syncToolsUIFromState = () =>
        _syncToolsUI({
            state,
            VIEWER_MODES,
            getCanAB,
            header,
            toolsRow,
            chGroup,
            expGroup,
            gamGroup,
            anaGroup,
            gradePanel,
            overlayPanel,
            inspectPanel,
            infoPanel,
            actionPanel,
            ovGuidesGroup,
            ovInspectGroup,
            model3dHint,
            helpWrap,
            channelsSelect,
            compareModeSelect,
            audioVizModeSelect,
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
            exportBtn,
            copyBtn,
            resetGradeBtn,
            cmpGroup,
            audGroup,
            ACCENT,
            setSelectHighlighted,
            setChannelSelectStyle,
            setValueHighlighted,
            setGroupHighlighted,
        });

    const syncModeButtons = ({ canAB, canSide } = {}) =>
        _syncModeButtons({
            state,
            VIEWER_MODES,
            singleBtn,
            abBtn,
            sideBtn,
            canAB,
            canSide,
        });

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
        headerTopEl: headerTop,
        filenameEl: filename,
        badgesBarEl: badgesBar,
        filenameRightEl: filenameRight,
        badgesBarRightEl: badgesBarRight,
        leftAreaEl: leftArea,
        leftMetaEl: leftMeta,
        centerAreaEl: centerArea,
        rightMetaEl: rightMeta,
        rightAreaEl: rightArea,
        titleLineEl: titleLine,
        titleWrapEl: titleWrap,
        modeButtonsEl: modeButtons,
        syncToolsUIFromState,
        syncModeButtons,
    };
}
