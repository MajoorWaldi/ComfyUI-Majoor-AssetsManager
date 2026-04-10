/**
 * WorkflowSidebar — slide-in panel for the Floating Viewer (MFV).
 *
 * Shows editable widgets for the currently selected ComfyUI nodes.
 * Reads from `app.canvas.selected_nodes` via comfyApiBridge.
 * Writes back via widgetAdapters (widget.value + callback).
 */

import { getComfyApp } from "../../../app/comfyApiBridge.js";
import { NodeWidgetRenderer } from "./NodeWidgetRenderer.js";

export class WorkflowSidebar {
    /**
     * @param {object} opts
     * @param {HTMLElement} opts.hostEl  The MFV root element to append to
     * @param {() => void}  [opts.onClose]
     */
    constructor({ hostEl, onClose } = {}) {
        this._hostEl = hostEl;
        this._onClose = onClose ?? null;
        /** @type {NodeWidgetRenderer[]} */
        this._renderers = [];
        this._visible = false;
        this._el = this._build();
    }

    get el() { return this._el; }
    get isVisible() { return this._visible; }

    show() {
        this._visible = true;
        this._el.classList.add("open");
        this.refresh();
    }

    hide() {
        this._visible = false;
        this._el.classList.remove("open");
    }

    toggle() {
        if (this._visible) {
            this.hide();
            this._onClose?.();
        } else {
            this.show();
        }
    }

    /** Re-read selected nodes and rebuild widget sections. */
    refresh() {
        if (!this._visible) return;
        this._clear();
        const nodes = _getSelectedNodes();
        if (!nodes.length) {
            this._showEmpty();
            return;
        }
        for (const node of nodes) {
            const renderer = new NodeWidgetRenderer(node);
            this._renderers.push(renderer);
            this._body.appendChild(renderer.el);
        }
    }

    /** Sync existing renderers from graph values without full rebuild. */
    syncFromGraph() {
        for (const r of this._renderers) r.syncFromGraph();
    }

    dispose() {
        this._clear();
        this._el?.remove();
    }

    // ── Private ───────────────────────────────────────────────────────────────

    _build() {
        const panel = document.createElement("div");
        panel.className = "mjr-ws-sidebar";

        // Header
        const header = document.createElement("div");
        header.className = "mjr-ws-sidebar-header";

        const title = document.createElement("span");
        title.className = "mjr-ws-sidebar-title";
        title.textContent = "Node Parameters";
        header.appendChild(title);

        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "mjr-icon-btn";
        closeBtn.title = "Close sidebar";
        const closeIcon = document.createElement("i");
        closeIcon.className = "pi pi-times";
        closeIcon.setAttribute("aria-hidden", "true");
        closeBtn.appendChild(closeIcon);
        closeBtn.addEventListener("click", () => {
            this.hide();
            this._onClose?.();
        });
        header.appendChild(closeBtn);

        panel.appendChild(header);

        // Scrollable body
        this._body = document.createElement("div");
        this._body.className = "mjr-ws-sidebar-body";
        panel.appendChild(this._body);

        return panel;
    }

    _clear() {
        for (const r of this._renderers) r.dispose();
        this._renderers = [];
        if (this._body) this._body.innerHTML = "";
    }

    _showEmpty() {
        const empty = document.createElement("div");
        empty.className = "mjr-ws-sidebar-empty";
        empty.textContent = "Select nodes on the canvas to edit their parameters";
        this._body.appendChild(empty);
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Read the currently selected nodes from the ComfyUI canvas.
 * Supports multiple ComfyUI versions (object, Map, Array).
 */
function _getSelectedNodes() {
    try {
        const app = getComfyApp();
        const selected =
            app?.canvas?.selected_nodes ??
            app?.canvas?.selectedNodes ??
            null;
        if (!selected) return [];
        if (Array.isArray(selected)) return selected.filter(Boolean);
        if (selected instanceof Map) return Array.from(selected.values()).filter(Boolean);
        if (typeof selected === "object") return Object.values(selected).filter(Boolean);
    } catch (e) {
        console.debug?.("[MFV sidebar] _getSelectedNodes error", e);
    }
    return [];
}
