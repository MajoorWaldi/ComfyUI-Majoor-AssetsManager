/**
 * NodeWidgetRenderer — renders a single ComfyUI LGraphNode's widgets
 * as an editable HTML section.
 */

import { getComfyApp } from "../../../app/comfyApiBridge.js";
import { createWidgetInput } from "./widgetAdapters.js";

/** Widget types we skip (too complex for a quick-edit sidebar). */
const SKIP_TYPES = new Set(["imageupload", "button", "hidden"]);

export class NodeWidgetRenderer {
    /**
     * @param {object} node  LGraphNode instance
     * @param {object} [opts]
     * @param {() => void} [opts.onLocate]  Custom locate handler (optional)
     */
    constructor(node, opts = {}) {
        this._node = node;
        this._onLocate = opts.onLocate ?? null;
        this._el = null;
        this._inputMap = new Map(); // widgetName → inputEl
    }

    get el() {
        if (!this._el) this._el = this._render();
        return this._el;
    }

    /** Re-read widget values from the live graph and update inputs. */
    syncFromGraph() {
        if (!this._node?.widgets) return;
        for (const w of this._node.widgets) {
            let input = this._inputMap.get(w.name);
            if (!input) continue;
            // If the stored element is a wrapper, find the actual input inside
            if (input.classList?.contains("mjr-ws-text-wrapper")) {
                input = input.querySelector("textarea") ?? input;
            }
            if (input.type === "checkbox") {
                input.checked = Boolean(w.value);
            } else {
                input.value = w.value != null ? String(w.value) : "";
            }
        }
    }

    dispose() {
        this._el?.remove();
        this._el = null;
        this._inputMap.clear();
    }

    // ── Private ───────────────────────────────────────────────────────────────

    _render() {
        const node = this._node;
        const section = document.createElement("section");
        section.className = "mjr-ws-node";
        section.dataset.nodeId = String(node.id ?? "");

        // Header
        const header = document.createElement("div");
        header.className = "mjr-ws-node-header";

        const title = document.createElement("span");
        title.className = "mjr-ws-node-title";
        title.textContent = node.title || node.type || `Node #${node.id}`;
        header.appendChild(title);

        const locateBtn = document.createElement("button");
        locateBtn.type = "button";
        locateBtn.className = "mjr-icon-btn mjr-ws-locate";
        locateBtn.title = "Locate on canvas";
        const locIcon = document.createElement("i");
        locIcon.className = "pi pi-map-marker";
        locIcon.setAttribute("aria-hidden", "true");
        locateBtn.appendChild(locIcon);
        locateBtn.addEventListener("click", () => this._locateNode());
        header.appendChild(locateBtn);

        section.appendChild(header);

        // Widgets
        const body = document.createElement("div");
        body.className = "mjr-ws-node-body";

        const widgets = node.widgets ?? [];
        let hasVisibleWidget = false;
        for (const w of widgets) {
            const wType = String(w.type || "").toLowerCase();
            if (SKIP_TYPES.has(wType)) continue;
            // Skip hidden widgets (ComfyUI uses w.hidden or w.options.hidden)
            if (w.hidden || w.options?.hidden) continue;

            hasVisibleWidget = true;
            const isText = wType === "text" || wType === "string" || wType === "customtext";
            const row = document.createElement("div");
            row.className = isText
                ? "mjr-ws-widget-row mjr-ws-widget-row--block"
                : "mjr-ws-widget-row";

            const label = document.createElement("label");
            label.className = "mjr-ws-widget-label";
            label.textContent = w.name || "";

            const inputWrap = document.createElement("div");
            inputWrap.className = "mjr-ws-widget-input";
            const inputEl = createWidgetInput(w, () => {
                /* value already written by adapter */
            });
            inputWrap.appendChild(inputEl);
            this._inputMap.set(w.name, inputEl);

            row.appendChild(label);
            row.appendChild(inputWrap);
            body.appendChild(row);
        }

        if (!hasVisibleWidget) {
            const empty = document.createElement("div");
            empty.className = "mjr-ws-node-empty";
            empty.textContent = "No editable parameters";
            body.appendChild(empty);
        }

        section.appendChild(body);
        return section;
    }

    _locateNode() {
        if (this._onLocate) {
            this._onLocate();
            return;
        }
        const node = this._node;
        if (!node) return;
        try {
            const app = getComfyApp();
            const canvas = app?.canvas;
            if (!canvas) return;
            if (typeof canvas.centerOnNode === "function") {
                canvas.centerOnNode(node);
            } else if (canvas.ds && node.pos) {
                const cw = canvas.canvas?.width || canvas.element?.width || 800;
                const ch = canvas.canvas?.height || canvas.element?.height || 600;
                canvas.ds.offset[0] = -node.pos[0] - (node.size?.[0] || 0) / 2 + cw / 2;
                canvas.ds.offset[1] = -node.pos[1] - (node.size?.[1] || 0) / 2 + ch / 2;
                canvas.setDirty?.(true, true);
            }
        } catch (e) {
            console.debug?.("[MFV sidebar] locateNode error", e);
        }
    }
}
