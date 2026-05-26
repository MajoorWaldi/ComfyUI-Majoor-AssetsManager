function ensureFeedSelectionOverrideStyle(): void {
    const overrideId = "mjr-feed-selection-override";
    if (typeof document === "undefined" || document.getElementById(overrideId)) return;
    const style = document.createElement("style");
    style.id = overrideId;
    style.textContent = `
        .mjr-bottom-feed .mjr-asset-card.is-selected,
        .mjr-bottom-feed .mjr-card.is-selected {
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--mjr-accent, #5fb3ff) 78%, #ffffff 22%), 0 0 0 6px color-mix(in srgb, var(--mjr-accent, #5fb3ff) 34%, transparent), 0 0 24px color-mix(in srgb, var(--mjr-accent, #5fb3ff) 52%, transparent), 0 10px 28px rgba(0, 0, 0, 0.32) !important;
            outline: 2px solid color-mix(in srgb, var(--mjr-accent, #5fb3ff) 85%, #ffffff 15%) !important;
            outline-offset: 0 !important;
            border-color: color-mix(in srgb, var(--mjr-accent, #5fb3ff) 62%, var(--mjr-border, rgba(255, 255, 255, 0.12))) !important;
            overflow: visible !important;
            z-index: 12 !important;
        }
    `;
    document.head.appendChild(style);
}

export function ensureStyleLoaded({ enabled = true }: { enabled?: boolean } = {}): void {
    if (!enabled) return;
    const id = "mjr-theme-comfy-css";

    if (document.getElementById(id)) {
        ensureFeedSelectionOverrideStyle();
        return;
    }

    try {
        const href = new URL("../theme/theme-comfy.css", import.meta.url).toString();
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = href;
        link.onerror = () => {
            try {
                link.remove();
            } catch (e) {
                console.debug?.(e);
            }
        };
        document.head.appendChild(link);
        link.onload = () => {
            try {
                document.documentElement.dataset.mjrThemeComfy = "1";
                ensureFeedSelectionOverrideStyle();
            } catch (e) {
                console.debug?.(e);
            }
        };
    } catch (err) {
        console.warn("Majoor: failed to load Comfy theme CSS", err);
    }
}

// Ensure feed selected-state highlight is available even when theme CSS is injected elsewhere.
ensureFeedSelectionOverrideStyle();
