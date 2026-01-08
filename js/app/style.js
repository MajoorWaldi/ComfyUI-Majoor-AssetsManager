export function ensureStyleLoaded({ enabled = true } = {}) {
    if (!enabled) return;
    const id = "mjr-theme-comfy-css";
    if (document.getElementById(id)) return;

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
            } catch {}
        };
        document.head.appendChild(link);
        link.onload = () => {
            try {
                document.documentElement.dataset.mjrThemeComfy = "1";
            } catch {}
        };
    } catch (err) {
        console.warn("Majoor: failed to load Comfy theme CSS", err);
    }
}

