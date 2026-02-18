/**
 * Majoor Vue Adapter
 * Loads the Vue-based UI components.
 */

// Dynamically import the Vue bundle
// Note: ComfyUI loads modules from the js/ root, so we use relative path.
// This file is in js/features/, so we go up one level.

let vueModule = null;
let vueScriptPromise = null;

function getCspNonce() {
    try {
        const explicit = String(globalThis?.__mjrCspNonce || "").trim();
        if (explicit) return explicit;
    } catch {}
    try {
        const meta = document.querySelector('meta[name="csp-nonce"]');
        const value = String(meta?.getAttribute("content") || "").trim();
        if (value) return value;
    } catch {}
    try {
        const script = document.querySelector("script[nonce]");
        const value = String(script?.nonce || script?.getAttribute("nonce") || "").trim();
        if (value) return value;
    } catch {}
    return "";
}

async function loadVueModuleViaScriptTag() {
    if (vueScriptPromise) return vueScriptPromise;
    vueScriptPromise = new Promise((resolve) => {
        try {
            if (globalThis?.MajoorVue) {
                resolve(globalThis.MajoorVue);
                return;
            }
            const existing = document.querySelector('script[data-mjr-vue-bundle="1"]');
            if (existing) {
                existing.addEventListener("load", () => resolve(globalThis?.MajoorVue || null), { once: true });
                existing.addEventListener("error", () => resolve(null), { once: true });
                return;
            }
            const s = document.createElement("script");
            s.src = new URL("../vue/majoor-ui.umd.js", import.meta.url).href;
            s.async = true;
            s.dataset.mjrVueBundle = "1";
            const nonce = getCspNonce();
            if (nonce) s.nonce = nonce;
            s.onload = () => resolve(globalThis?.MajoorVue || null);
            s.onerror = () => resolve(null);
            document.head.appendChild(s);
        } catch {
            resolve(null);
        }
    });
    return vueScriptPromise;
}

export async function loadVueModule() {
    if (vueModule) return vueModule;
    try {
        // Prefer nonce-capable loader for strict CSP deployments.
        vueModule = await loadVueModuleViaScriptTag();
        if (!vueModule) {
            // Fallback for environments where module import is permitted.
            vueModule = await import("../vue/majoor-ui.mjs");
        }
        console.log("[Majoor] Vue module loaded:", vueModule);
        return vueModule;
    } catch (e) {
        console.error("[Majoor] Failed to load Vue module:", e);
        return null;
    }
}

export async function mountVueCard(container, props) {
    const mod = await loadVueModule();
    if (!mod || !mod.mountCard) {
        console.error("Vue mountCard not found");
        return null;
    }
    return mod.mountCard(container, props);
}
