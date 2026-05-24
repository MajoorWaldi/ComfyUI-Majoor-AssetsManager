export const VIEWER_INFO_PANEL_WIDTH = "min(400px, 42vw)";
export const VIEWER_INFO_PANEL_RESERVE = `calc(${VIEWER_INFO_PANEL_WIDTH} + 24px)`;
const VIEWER_THEME_STYLE_ID = "mjr-viewer-modern-theme";

export function ensureViewerThemeStyles(): void {
    try {
        if (document.getElementById(VIEWER_THEME_STYLE_ID)) return;
        const style = document.createElement("style");
        style.id = VIEWER_THEME_STYLE_ID;
        style.textContent = `
            .mjr-viewer-overlay {
                --mjr-viewer-surface: rgba(14, 18, 24, 0.78);
                --mjr-viewer-surface-strong: rgba(10, 13, 18, 0.9);
                --mjr-viewer-surface-soft: rgba(255, 255, 255, 0.045);
                --mjr-viewer-border: rgba(255, 255, 255, 0.11);
                --mjr-viewer-border-strong: rgba(255, 255, 255, 0.18);
                --mjr-viewer-shadow: 0 24px 80px rgba(0, 0, 0, 0.42);
                --mjr-viewer-shadow-soft: 0 14px 40px rgba(0, 0, 0, 0.22);
                --mjr-viewer-radius: 22px;
                isolation: isolate;
            }

            .mjr-viewer-overlay::before {
                content: "";
                position: absolute;
                inset: 0;
                pointer-events: none;
                background:
                    radial-gradient(circle at top left, rgba(87, 153, 255, 0.14), transparent 34%),
                    radial-gradient(circle at top right, rgba(78, 224, 196, 0.12), transparent 28%),
                    radial-gradient(circle at bottom center, rgba(255, 184, 107, 0.08), transparent 28%);
                opacity: 0.95;
                z-index: 0;
            }

            .mjr-viewer-overlay > * {
                position: relative;
                z-index: 1;
            }

            .mjr-viewer-header,
            .mjr-viewer-content-row,
            .mjr-filmstrip,
            .mjr-viewer-footer,
            .mjr-viewer-geninfo {
                box-shadow: var(--mjr-viewer-shadow-soft);
            }

            .mjr-viewer-header {
                margin: 18px 18px 0;
                border-radius: calc(var(--mjr-viewer-radius) - 2px);
                border: 1px solid var(--mjr-viewer-border) !important;
                backdrop-filter: blur(20px) saturate(140%);
            }

            .mjr-viewer-header-top {
                min-height: 42px;
            }

            .mjr-viewer-header-area--center {
                padding-inline: 8px;
            }

            .mjr-viewer-mode-buttons {
                padding: 4px;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.045);
                border: 1px solid rgba(255, 255, 255, 0.08);
                box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
            }

            .mjr-viewer-close,
            .mjr-viewer-fs,
            .mjr-viewer-nav-btn {
                border-color: rgba(255, 255, 255, 0.14) !important;
                background: rgba(255, 255, 255, 0.05) !important;
                backdrop-filter: blur(16px) saturate(140%);
                box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
                transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
            }

            .mjr-viewer-close:hover,
            .mjr-viewer-fs:hover,
            .mjr-viewer-nav-btn:hover {
                transform: translateY(-1px);
                background: rgba(255, 255, 255, 0.085) !important;
                border-color: rgba(255, 255, 255, 0.22) !important;
            }

            .mjr-viewer-content-row {
                margin: 14px 18px 0;
                border-radius: calc(var(--mjr-viewer-radius) + 2px);
                border: 1px solid var(--mjr-viewer-border);
                background:
                    linear-gradient(180deg, rgba(19, 24, 31, 0.78), rgba(10, 14, 20, 0.88)),
                    radial-gradient(circle at top, rgba(255, 255, 255, 0.04), transparent 42%);
                overflow: hidden;
                box-shadow: var(--mjr-viewer-shadow);
            }

            .mjr-viewer-content {
                background:
                    radial-gradient(circle at center, rgba(255, 255, 255, 0.035), transparent 55%),
                    linear-gradient(180deg, rgba(7, 10, 14, 0.28), rgba(7, 10, 14, 0.62));
            }

            .mjr-viewer-probe,
            .mjr-viewer-loupe {
                backdrop-filter: blur(14px) saturate(125%);
            }

            .mjr-viewer-geninfo {
                width: ${VIEWER_INFO_PANEL_WIDTH} !important;
                top: 16px !important;
                bottom: 16px !important;
                border-radius: 20px;
                border: 1px solid var(--mjr-viewer-border-strong);
                background: linear-gradient(180deg, rgba(15, 19, 24, 0.92), rgba(9, 12, 16, 0.94)) !important;
                backdrop-filter: blur(22px) saturate(140%);
            }

            .mjr-viewer-geninfo--right {
                right: 16px !important;
            }

            .mjr-viewer-geninfo--left {
                left: 16px !important;
            }

            .mjr-viewer-footer {
                margin: 12px 18px 18px;
                border-radius: 18px;
                border: 1px solid var(--mjr-viewer-border) !important;
                backdrop-filter: blur(18px) saturate(135%);
                justify-content: space-between !important;
                flex-wrap: wrap;
                align-content: center;
            }

            .mjr-viewer-nav {
                padding: 6px;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.08);
            }

            .mjr-viewer-nav-btn {
                width: 42px;
                height: 42px;
                padding: 0 !important;
                border-radius: 999px !important;
                font-size: 22px !important;
                line-height: 1;
            }

            .mjr-viewer-index {
                min-height: 36px;
                padding: 0 14px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.08);
                letter-spacing: 0.02em;
            }

            .mjr-viewer-playerbar {
                flex: 1 1 320px;
                min-width: 260px;
            }

            @media (max-width: 960px) {
                .mjr-viewer-header,
                .mjr-viewer-content-row,
                .mjr-filmstrip,
                .mjr-viewer-footer {
                    margin-left: 10px;
                    margin-right: 10px;
                }

                .mjr-viewer-header {
                    margin-top: 10px;
                }

                .mjr-viewer-footer {
                    margin-bottom: 10px;
                    justify-content: center !important;
                }

                .mjr-viewer-playerbar {
                    min-width: 100%;
                }

                .mjr-viewer-geninfo {
                    width: min(100vw - 24px, 420px) !important;
                    left: 12px !important;
                    right: 12px !important;
                }

                .mjr-viewer-geninfo--left {
                    left: 12px !important;
                }
            }
        `;
        document.head.appendChild(style);
    } catch (e: any) {
        console.debug?.(e);
    }
}
