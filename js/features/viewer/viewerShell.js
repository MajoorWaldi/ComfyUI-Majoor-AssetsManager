import { createIconButton } from "../../components/buttons.js";
import { createFilmstrip } from "./filmstrip.js";
import { VIEWER_INFO_PANEL_WIDTH } from "./viewerThemeStyles.js";

export function createViewerOverlayRoot() {
    const overlay = document.createElement("div");
    overlay.className = "mjr-viewer-overlay mjr-assets-manager";
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(180deg, rgba(6, 8, 12, 0.94), rgba(5, 7, 10, 0.985));
        z-index: 10000;
        pointer-events: auto;
        display: none;
        flex-direction: column;
        box-sizing: border-box;
        overflow: hidden;
    `;
    overlay.tabIndex = -1;
    overlay.setAttribute("role", "dialog");
    return overlay;
}

export function createViewerStageShell({ state, buildAssetViewURL, onNavigate, onCompare }) {
    const contentRow = document.createElement("div");
    contentRow.className = "mjr-viewer-content-row";
    contentRow.style.cssText = `
        flex: 1;
        display: flex;
        min-height: 0;
        overflow: hidden;
        min-width: 0;
    `;

    const content = document.createElement("div");
    content.className = "mjr-viewer-content";
    content.style.cssText = `
        flex: 1;
        min-width: 0;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        isolation: isolate;
    `;

    const singleView = document.createElement("div");
    singleView.className = "mjr-viewer-single";
    singleView.style.cssText = `
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    const abView = document.createElement("div");
    abView.className = "mjr-viewer-ab";
    abView.style.cssText = `
        width: 100%;
        height: 100%;
        display: none;
        position: relative;
    `;

    const sideView = document.createElement("div");
    sideView.className = "mjr-viewer-sidebyside";
    sideView.style.cssText = `
        width: 100%;
        height: 100%;
        display: none;
        flex-direction: row;
        gap: 2px;
    `;

    content.appendChild(singleView);
    content.appendChild(abView);
    content.appendChild(sideView);

    const overlayLayer = document.createElement("div");
    overlayLayer.className = "mjr-viewer-overlay-layer";
    overlayLayer.style.cssText = `
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 50;
    `;

    const gridCanvas = document.createElement("canvas");
    gridCanvas.className = "mjr-viewer-grid-canvas";
    gridCanvas.style.cssText = `
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: none;
    `;

    const probeTooltip = document.createElement("div");
    probeTooltip.className = "mjr-viewer-probe";
    probeTooltip.style.cssText = `
        position: absolute;
        display: none;
        padding: 7px 10px;
        border-radius: 10px;
        background: rgba(11, 14, 19, 0.78);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.92);
        font-size: 11px;
        line-height: 1.2;
        white-space: pre;
        max-width: 280px;
        transform: translate3d(0,0,0);
        box-shadow: 0 18px 34px rgba(0,0,0,0.28);
    `;

    const loupeWrap = document.createElement("div");
    loupeWrap.className = "mjr-viewer-loupe";
    loupeWrap.style.cssText = `
        position: absolute;
        display: none;
        width: 120px;
        height: 120px;
        border-radius: 14px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.14);
        box-shadow: 0 18px 34px rgba(0,0,0,0.34);
        background: rgba(9,12,16,0.72);
        transform: translate3d(0,0,0);
    `;

    const loupeCanvas = document.createElement("canvas");
    loupeCanvas.width = 120;
    loupeCanvas.height = 120;
    loupeCanvas.style.cssText =
        "width:100%; height:100%; display:block; image-rendering: pixelated;";
    loupeWrap.appendChild(loupeCanvas);

    overlayLayer.appendChild(gridCanvas);
    overlayLayer.appendChild(probeTooltip);
    overlayLayer.appendChild(loupeWrap);
    content.appendChild(overlayLayer);

    const genInfoOverlay = document.createElement("div");
    genInfoOverlay.className = "mjr-viewer-geninfo mjr-viewer-geninfo--right";
    genInfoOverlay.style.cssText = `
        position: absolute;
        top: 16px;
        right: 16px;
        bottom: 16px;
        width: ${VIEWER_INFO_PANEL_WIDTH};
        display: none;
        flex-direction: column;
        overflow: hidden;
        background: rgba(12, 15, 20, 0.9);
        border-left: 1px solid rgba(255,255,255,0.12);
        pointer-events: auto;
        backdrop-filter: blur(10px);
        z-index: 10001;
    `;
    const genInfoHeader = document.createElement("div");
    genInfoHeader.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 12px;
        border-bottom: 1px solid rgba(255,255,255,0.10);
        color: rgba(255,255,255,0.92);
    `;
    const genInfoTitle = document.createElement("div");
    genInfoTitle.textContent = "Generation Info";
    genInfoTitle.style.cssText = "font-size: 13px; font-weight: 600;";
    genInfoHeader.appendChild(genInfoTitle);
    const genInfoBody = document.createElement("div");
    genInfoBody.style.cssText = `
        flex: 1;
        overflow: auto;
        padding: 14px;
        color: rgba(255,255,255,0.92);
    `;
    genInfoOverlay.appendChild(genInfoHeader);
    genInfoOverlay.appendChild(genInfoBody);

    const genInfoOverlayLeft = document.createElement("div");
    genInfoOverlayLeft.className = "mjr-viewer-geninfo mjr-viewer-geninfo--left";
    genInfoOverlayLeft.style.cssText = `
        position: absolute;
        top: 16px;
        left: 16px;
        bottom: 16px;
        width: ${VIEWER_INFO_PANEL_WIDTH};
        display: none;
        flex-direction: column;
        overflow: hidden;
        background: rgba(12, 15, 20, 0.9);
        border-right: 1px solid rgba(255,255,255,0.12);
        pointer-events: auto;
        backdrop-filter: blur(10px);
        z-index: 10001;
    `;
    const genInfoHeaderLeft = genInfoHeader.cloneNode(true);
    genInfoHeaderLeft.replaceChildren();
    const genInfoTitleLeft = document.createElement("div");
    genInfoTitleLeft.textContent = "Generation Info (A)";
    genInfoTitleLeft.style.cssText = "font-size: 13px; font-weight: 600;";
    genInfoHeaderLeft.appendChild(genInfoTitleLeft);
    const genInfoBodyLeft = document.createElement("div");
    genInfoBodyLeft.style.cssText = `
        flex: 1;
        overflow: auto;
        padding: 14px;
        color: rgba(255,255,255,0.92);
    `;
    genInfoOverlayLeft.appendChild(genInfoHeaderLeft);
    genInfoOverlayLeft.appendChild(genInfoBodyLeft);

    contentRow.appendChild(content);

    const footer = document.createElement("div");
    footer.className = "mjr-viewer-footer";
    footer.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 20px;
        background: rgba(13, 16, 22, 0.78);
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        gap: 14px 20px;
        flex-wrap: wrap;
    `;

    const prevBtn = createIconButton("<", "Previous (Left Arrow)");
    prevBtn.classList.add("mjr-viewer-nav-btn", "mjr-viewer-nav-btn--prev");
    prevBtn.style.fontSize = "24px";
    const indexInfo = document.createElement("span");
    indexInfo.className = "mjr-viewer-index";
    indexInfo.style.cssText = "font-size: 14px; font-weight: 500;";
    const nextBtn = createIconButton(">", "Next (Right Arrow)");
    nextBtn.classList.add("mjr-viewer-nav-btn", "mjr-viewer-nav-btn--next");
    nextBtn.style.fontSize = "24px";

    const navBar = document.createElement("div");
    navBar.className = "mjr-viewer-nav";
    navBar.style.cssText = "display:flex; align-items:center; gap:20px;";
    navBar.appendChild(prevBtn);
    navBar.appendChild(indexInfo);
    navBar.appendChild(nextBtn);

    const playerBarHost = document.createElement("div");
    playerBarHost.className = "mjr-viewer-playerbar";
    playerBarHost.style.cssText = "display:none; width: 100%;";

    footer.appendChild(navBar);
    footer.appendChild(playerBarHost);

    const filmstrip = createFilmstrip({
        state,
        buildAssetViewURL,
        onNavigate,
        onCompare,
    });

    return {
        contentRow,
        content,
        singleView,
        abView,
        sideView,
        overlayLayer,
        gridCanvas,
        probeTooltip,
        loupeWrap,
        loupeCanvas,
        genInfoOverlay,
        genInfoTitle,
        genInfoBody,
        genInfoOverlayLeft,
        genInfoTitleLeft,
        genInfoBodyLeft,
        footer,
        prevBtn,
        indexInfo,
        nextBtn,
        navBar,
        playerBarHost,
        filmstrip,
    };
}
