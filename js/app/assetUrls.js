const BUILT_ASSET_NAMES = new Set(["audio-bg.png", "audio-thumbnails.png"]);

export function builtAssetUrl(name) {
    const safeName = String(name || "").trim();
    if (!BUILT_ASSET_NAMES.has(safeName)) return "";
    try {
        const base = String(import.meta.url || "").includes("/chunks/") ? "../assets/" : "./assets/";
        return new URL(`${base}${safeName}`, import.meta.url).href;
    } catch {
        return `./assets/${safeName}`;
    }
}
