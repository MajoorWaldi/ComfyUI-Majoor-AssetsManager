/**
 * Send-to-Asset-Manager menu integration.
 *
 * Adds a right-click "Send to Asset Manager" entry on standard output-producing
 * nodes (SaveImage, PreviewImage, VHS_VideoCombine, …) so users can hand the
 * most recent rendered file off to Majoor without first navigating in the OS
 * file picker. Mirrors the contextual hook pattern recommended by ComfyUI core
 * for third-party integrations.
 *
 * This file is loaded for its side-effects: it self-registers a tiny
 * `app.registerExtension({...})` block separate from the main Vue runtime so
 * a failure here cannot break the asset grid.
 */

import { getComfyApp, getComfyApi } from "../app/comfyApiBridge.js";

const EXTENSION_ID = "MajoorAssetsManager.SendTo";
const MENU_LABEL = "Send to Asset Manager";

// Node class names known to produce viewable / saveable outputs. Keep this
// list conservative — when in doubt, opt out so we don't show a useless menu
// item on text-only or pass-through nodes.
const TARGET_NODE_TYPES = new Set([
    "SaveImage",
    "PreviewImage",
    "VHS_VideoCombine",
    "VHS_SaveImageSequence",
    "Image Save",
    "SaveAnimatedWEBP",
    "SaveAnimatedPNG",
    "SaveAudio",
]);

/**
 * Resolve the most recent output filenames produced by this node from its
 * last execution payload (stored on the node by ComfyUI core when results
 * stream back through the websocket).
 *
 * Returns an array of `{filename, subfolder, type}` records or [] if the
 * node has not produced anything yet.
 */
function collectOutputDescriptors(node) {
    const out = [];
    try {
        const images = node?.imgs && Array.isArray(node.imgs) ? node.imgs : null;
        // Newer ComfyUI versions expose the raw output payload as `node.images`
        // or `node.outputs`. Probe a few well-known locations.
        const candidates = [];
        if (Array.isArray(node?.images)) candidates.push(...node.images);
        if (Array.isArray(node?.output?.images)) candidates.push(...node.output.images);
        if (Array.isArray(node?.output?.gifs)) candidates.push(...node.output.gifs);
        if (Array.isArray(node?.outputs)) {
            for (const o of node.outputs) {
                if (o && Array.isArray(o.images)) candidates.push(...o.images);
                if (o && Array.isArray(o.gifs)) candidates.push(...o.gifs);
            }
        }
        for (const item of candidates) {
            if (!item || typeof item !== "object") continue;
            const filename = String(item.filename || "").trim();
            if (!filename) continue;
            out.push({
                filename,
                subfolder: String(item.subfolder || ""),
                type: String(item.type || "output"),
            });
        }
        if (out.length === 0 && images && images.length) {
            // Fallback: scrape filename from the rendered preview img element.
            for (const img of images) {
                try {
                    const src = img?.src ? new URL(img.src, window.location.origin) : null;
                    if (!src) continue;
                    const filename = src.searchParams.get("filename");
                    if (!filename) continue;
                    out.push({
                        filename,
                        subfolder: src.searchParams.get("subfolder") || "",
                        type: src.searchParams.get("type") || "output",
                    });
                } catch {
                    /* ignore malformed URLs */
                }
            }
        }
    } catch {
        /* defensive — never throw from a menu callback */
    }
    return out;
}

async function sendDescriptorsToAssetManager(descriptors) {
    const app = getComfyApp();
    const api = getComfyApi(app);
    if (!descriptors.length) {
        try {
            app?.extensionManager?.toast?.add?.({
                severity: "warn",
                summary: "Majoor Assets Manager",
                detail: "No output to send (run the node first).",
                life: 3500,
            });
        } catch {
            /* ignore */
        }
        return;
    }
    try {
        const res = await api.fetchApi("/mjr/am/integration/send-from-node", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: descriptors }),
        });
        if (!res.ok && res.status !== 404) {
            throw new Error(`HTTP ${res.status}`);
        }
        // Even when the backend endpoint isn't wired yet (404), opening the
        // sidebar tab gives the user the asset grid where freshly indexed
        // files appear within a couple seconds.
        try {
            app?.extensionManager?.sidebarTab?.toggleSidebarTab?.("majoor-assets");
        } catch {
            /* sidebar API not available */
        }
        app?.extensionManager?.toast?.add?.({
            severity: "success",
            summary: "Majoor Assets Manager",
            detail: `Sent ${descriptors.length} item(s) to the asset grid.`,
            life: 2500,
        });
    } catch (err) {
        app?.extensionManager?.toast?.add?.({
            severity: "error",
            summary: "Majoor Assets Manager",
            detail: `Failed to send: ${err?.message || err}`,
            life: 4000,
        });
    }
}

function registerSendToMenu() {
    const app = getComfyApp();
    if (!app || typeof app.registerExtension !== "function") {
        // ComfyUI not ready yet — retry shortly. The main bundle is loaded
        // before app.js is exposed on globalThis in some Vite builds.
        setTimeout(registerSendToMenu, 100);
        return;
    }
    app.registerExtension({
        name: EXTENSION_ID,
        async beforeRegisterNodeDef(nodeType, nodeData) {
            try {
                const name = String(nodeData?.name || "");
                if (!TARGET_NODE_TYPES.has(name)) {
                    return;
                }
                const prevGetMenu = nodeType.prototype.getExtraMenuOptions;
                nodeType.prototype.getExtraMenuOptions = function (canvas, options) {
                    // Preserve any options injected by other extensions.
                    if (typeof prevGetMenu === "function") {
                        try {
                            prevGetMenu.apply(this, arguments);
                        } catch {
                            /* upstream menu hook should never break ours */
                        }
                    }
                    const self = this;
                    options.push({
                        content: MENU_LABEL,
                        callback: () => {
                            const descriptors = collectOutputDescriptors(self);
                            void sendDescriptorsToAssetManager(descriptors);
                        },
                    });
                };
            } catch {
                /* extension must not crash node registration */
            }
        },
    });
}

registerSendToMenu();
