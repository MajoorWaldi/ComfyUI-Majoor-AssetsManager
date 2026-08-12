/**
 * filename_prefix placeholder support for Majoor save nodes (issue #194).
 *
 * ComfyUI core resolves `%date:...%` and `%Node.widget%` placeholders on the
 * frontend via the `Comfy.SaveImageExtraOutput` extension, but only for a
 * hardcoded whitelist of core node types (SaveImage, SaveVideo, ...). Custom
 * save nodes such as MajoorSaveImage/MajoorSaveVideo are not in that list, so
 * the raw placeholder text reaches the server and ends up in filenames.
 *
 * This extension replicates the core behaviour for the Majoor save nodes by
 * installing a `serializeValue` hook on their `filename_prefix` widget. The
 * replacement logic mirrors ComfyUI frontend's `applyTextReplacements` and
 * `formatDate` utilities exactly (same tokens, same sanitization).
 *
 * A server-side fallback for `%date:...%` also exists in nodes.py so API-only
 * workflows are covered even without this extension.
 *
 * This file is loaded for its side-effects (self-registers an extension).
 */

import { getRawHostApp } from "../app/hostAdapter.js";

const EXTENSION_ID = "MajoorAssetsManager.SavePlaceholders";

const TARGET_NODE_TYPES = new Set(["MajoorSaveImage", "MajoorSaveVideo"]);

// Mirrors ComfyUI frontend `formatDate` (src/utils/formatUtil.ts).
const DATE_TOKEN_RE = /dd?|MM?|hh?|mm?|ss?|yyy?y?/g;

function formatDate(text: string, date: Date): string {
    return text.replace(DATE_TOKEN_RE, (token) => {
        if (token === "yyyy") return String(date.getFullYear());
        if (token === "yy") return String(date.getFullYear()).substring(2, 4);
        let value: number;
        switch (token[0]) {
            case "d":
                value = date.getDate();
                break;
            case "M":
                value = date.getMonth() + 1;
                break;
            case "h":
                value = date.getHours();
                break;
            case "m":
                value = date.getMinutes();
                break;
            case "s":
                value = date.getSeconds();
                break;
            default:
                return token;
        }
        return String(value).padStart(token.length, "0");
    });
}

// Same invalid-filename-char sanitization as ComfyUI core.
const INVALID_CHARS_RE = /[/?<>\\:*|"\x00-\x1F\x7F]/g;

function collectGraphNodes(graph: any): any[] {
    const nodes = graph?.nodes ?? graph?._nodes;
    return Array.isArray(nodes) ? nodes : [];
}

// Mirrors ComfyUI frontend `applyTextReplacements`.
function applyTextReplacements(graph: any, value: unknown): string {
    return String(value ?? "").replace(/%([^%]+)%/g, (match, text: string) => {
        const split = String(text).split(".");
        if (split.length !== 2) {
            // Special handling for dates; %width%/%height% etc. are resolved
            // server-side by folder_paths.get_save_image_path.
            if (split[0].startsWith("date:")) {
                return formatDate(split[0].substring(5), new Date());
            }
            return match;
        }
        const nodes = collectGraphNodes(graph);
        let candidates = nodes.filter(
            (n) => n?.properties?.["Node name for S&R"] === split[0],
        );
        if (!candidates.length) {
            candidates = nodes.filter((n) => n?.title === split[0]);
        }
        const node = candidates[0];
        if (!node) return match;
        const widget = Array.isArray(node.widgets)
            ? node.widgets.find((w: any) => w?.name === split[1])
            : null;
        if (!widget) return match;
        return String(widget.value ?? "").replace(INVALID_CHARS_RE, "_");
    });
}

function installSerializeHook(node: any, app: any): void {
    try {
        const widget = Array.isArray(node?.widgets)
            ? node.widgets.find((w: any) => w?.name === "filename_prefix")
            : null;
        if (!widget || typeof widget.serializeValue === "function") return;
        widget.serializeValue = () =>
            applyTextReplacements(node?.graph || app?.graph, widget.value);
    } catch {
        /* defensive — never break node creation */
    }
}

function registerSavePlaceholders(): void {
    const app = getRawHostApp();
    if (!app || typeof app.registerExtension !== "function") {
        // ComfyUI not ready yet — retry shortly (same pattern as the
        // send-to-AM integration).
        setTimeout(registerSavePlaceholders, 100);
        return;
    }
    app.registerExtension({
        name: EXTENSION_ID,
        nodeCreated(node: any) {
            try {
                const nodeType = String(node?.comfyClass || node?.type || "");
                if (!TARGET_NODE_TYPES.has(nodeType)) return;
                installSerializeHook(node, app);
            } catch {
                /* defensive — never break node registration */
            }
        },
    });
}

registerSavePlaceholders();
