/**
 * NodeWidgetRenderer renders a single ComfyUI LGraphNode's widgets
 * as an editable HTML section.
 */

import { getComfyApp } from "../../../app/comfyApiBridge.js";
import { createWidgetInput } from "./widgetAdapters.js";

const SKIP_TYPES = new Set(["imageupload", "button", "hidden"]);

// Note nodes store their text in node.properties instead of widgets.
const NOTE_TYPE_RE = /\bnote\b|markdown/i;

function _isNoteNode(node) {
    return NOTE_TYPE_RE.test(String(node?.type || ""));
}

function _getNoteText(node) {
    const props = node?.properties ?? {};
    if (typeof props.text === "string") return props.text;
    if (typeof props.value === "string") return props.value;
    if (typeof props.markdown === "string") return props.markdown;
    const w0 = node?.widgets?.[0];
    if (w0 != null && w0.value != null) return String(w0.value);
    return "";
}

function _setNoteText(node, value) {
    const props = node?.properties;
    if (props) {
        if ("text" in props) props.text = value;
        else if ("value" in props) props.value = value;
        else if ("markdown" in props) props.markdown = value;
        else props.text = value;
    }
    const w0 = node?.widgets?.[0];
    if (w0) w0.value = value;
}

// UUID or long hex hash — not a human-readable type name.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_HASH_RE = /^[0-9a-f]{20,}$/i;

function _getNodeDisplayType(node) {
    const type = String(node?.type || "");
    if (UUID_RE.test(type) || HEX_HASH_RE.test(type)) {
        return String(node?.title || "Subgraph").trim() || "Subgraph";
    }
    return type || `Node #${node?.id}`;
}

export class NodeWidgetRenderer {
    /**
     * @param {object} node
     * @param {object} [opts]
     * @param {() => void} [opts.onLocate]
     * @param {boolean} [opts.collapsible]
     * @param {boolean} [opts.expanded]
     * @param {(expanded: boolean) => void} [opts.onToggle]
     * @param {number} [opts.depth]          — 0 = top-level, >0 = inside a subgraph
     */
    constructor(node, opts = {}) {
        this._node = node;
        this._onLocate = opts.onLocate ?? null;
        this._onToggle = typeof opts.onToggle === "function" ? opts.onToggle : null;
        this._collapsible = Boolean(opts.collapsible);
        this._expanded = opts.expanded !== false;
        this._depth = opts.depth ?? 0;
        this._el = null;
        this._body = null;
        this._toggleBtn = null;
        this._inputMap = new Map();
        this._autoFits = [];
        this._noteTextarea = null;
    }

    get el() {
        if (!this._el) this._el = this._render();
        return this._el;
    }

    syncFromGraph() {
        // Note nodes: sync from node.properties.text instead of widgets
        if (this._noteTextarea) {
            const doc = this._el?.ownerDocument || document;
            if (doc?.activeElement !== this._noteTextarea) {
                const text = _getNoteText(this._node);
                if (this._noteTextarea.value !== text) {
                    this._noteTextarea.value = text;
                    this._noteTextarea._mjrAutoFit?.();
                }
            }
            return;
        }
        if (!this._node?.widgets) return;
        const doc = this._el?.ownerDocument || document;
        const activeEl = doc?.activeElement || null;
        for (const w of this._node.widgets) {
            const storedInput = this._inputMap.get(w.name);
            const input = _resolveSyncInput(storedInput);
            if (!input) continue;
            if (input.type === "checkbox") {
                const nextChecked = Boolean(w.value);
                if (input.checked !== nextChecked) input.checked = nextChecked;
                continue;
            }
            const nextValue = w.value != null ? String(w.value) : "";
            if (String(input.value ?? "") === nextValue) continue;
            if (activeEl && input === activeEl) continue;
            input.value = nextValue;
            storedInput?._mjrAutoFit?.();
            input?._mjrAutoFit?.();
        }
    }

    dispose() {
        this._el?.remove();
        this._el = null;
        this._autoFits = [];
        this._inputMap.clear();
    }

    setExpanded(expanded) {
        this._expanded = Boolean(expanded);
        this._applyExpandedState();
        // Trigger textarea autofit now that the body is visible
        if (this._expanded && this._autoFits?.length) {
            requestAnimationFrame(() => {
                for (const fn of this._autoFits) fn();
            });
        }
        this._onToggle?.(this._expanded);
    }

    _render() {
        const node = this._node;
        const section = document.createElement("section");
        section.className = "mjr-ws-node";
        section.dataset.nodeId = String(node.id ?? "");
        if (this._depth > 0) {
            section.dataset.depth = String(this._depth);
            section.classList.add("mjr-ws-node--nested");
        }

        const header = document.createElement("div");
        header.className = "mjr-ws-node-header";

        if (this._collapsible) {
            this._header = header;
            const toggleBtn = document.createElement("button");
            toggleBtn.type = "button";
            toggleBtn.className = "mjr-icon-btn mjr-ws-node-toggle";
            toggleBtn.title = this._expanded ? "Collapse node" : "Expand node";
            toggleBtn.addEventListener("click", (event) => {
                event.stopPropagation();
                this.setExpanded(!this._expanded);
            });
            header.appendChild(toggleBtn);
            this._toggleBtn = toggleBtn;
            header.addEventListener("click", (event) => {
                if (event.target.closest("button")) return;
                this.setExpanded(!this._expanded);
            });
            header.title = this._expanded ? "Collapse node" : "Expand node";
        }

        const titleWrap = document.createElement("div");
        titleWrap.className = "mjr-ws-node-title-wrap";

        const typeText = document.createElement("span");
        typeText.className = "mjr-ws-node-type";
        typeText.textContent = _getNodeDisplayType(node);
        titleWrap.appendChild(typeText);

        const customTitle = String(node.title || "").trim();
        if (customTitle && customTitle !== node.type) {
            const title = document.createElement("span");
            title.className = "mjr-ws-node-title";
            title.textContent = customTitle;
            titleWrap.appendChild(title);
        }

        header.appendChild(titleWrap);

        const locateBtn = document.createElement("button");
        locateBtn.type = "button";
        locateBtn.className = "mjr-icon-btn mjr-ws-locate";
        locateBtn.title = "Locate on canvas";
        locateBtn.innerHTML = '<i class="pi pi-map-marker" aria-hidden="true"></i>';
        locateBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            this._locateNode();
        });
        header.appendChild(locateBtn);

        section.appendChild(header);

        const body = document.createElement("div");
        body.className = "mjr-ws-node-body";

        // Note nodes store text in node.properties.text — widgets array is empty.
        if (_isNoteNode(node)) {
            const textarea = document.createElement("textarea");
            textarea.className = "mjr-ws-input mjr-ws-textarea mjr-ws-note-textarea";
            textarea.value = _getNoteText(node);
            textarea.rows = 4;
            const autoFit = () => {
                textarea.style.height = "auto";
                textarea.style.height = textarea.scrollHeight + "px";
            };
            textarea.addEventListener("input", () => {
                _setNoteText(node, textarea.value);
                // Sync ComfyUI's own DOM element for this widget if it exists.
                const w0 = node?.widgets?.[0];
                const domEl = w0?.inputEl ?? w0?.element ?? w0?.el ?? null;
                if (domEl != null && "value" in domEl && domEl.value !== textarea.value) {
                    domEl.value = textarea.value;
                }
                autoFit();
                try {
                    const app = getComfyApp();
                    const canvas = app?.canvas ?? null;
                    canvas?.setDirty?.(true, true);
                    canvas?.draw?.(true, true);
                    const nodeGraph = node?.graph ?? null;
                    if (nodeGraph && nodeGraph !== app?.graph) {
                        nodeGraph.setDirtyCanvas?.(true, true);
                        nodeGraph.change?.();
                    }
                    app?.graph?.change?.();
                } catch (_) {}
            });
            textarea._mjrAutoFit = autoFit;
            this._noteTextarea = textarea;
            this._autoFits.push(autoFit);
            body.appendChild(textarea);
            this._body = body;
            section.appendChild(body);
            this._el = section;
            this._applyExpandedState();
            requestAnimationFrame(autoFit);
            return section;
        }

        const widgets = node.widgets ?? [];
        let hasVisibleWidget = false;
        for (const w of widgets) {
            const wType = String(w.type || "").toLowerCase();
            if (SKIP_TYPES.has(wType)) continue;
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
            const inputEl = createWidgetInput(w, () => {}, node);
            inputWrap.appendChild(inputEl);
            this._inputMap.set(w.name, inputEl);
            // Collect autoFit functions from text wrappers so we can re-run them on expand
            const autoFit = inputEl._mjrAutoFit ?? inputEl.querySelector?.("textarea")?._mjrAutoFit;
            if (autoFit) this._autoFits.push(autoFit);

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

        this._body = body;
        section.appendChild(body);
        // Assign _el before calling _applyExpandedState so its guard passes.
        this._el = section;
        this._applyExpandedState();
        return section;
    }

    _applyExpandedState() {
        if (!this._el || !this._body) return;
        this._el.classList.toggle("is-collapsible", this._collapsible);
        this._el.classList.toggle("is-collapsed", this._collapsible && !this._expanded);
        if (this._toggleBtn) {
            const iconClass = this._expanded ? "pi pi-chevron-down" : "pi pi-chevron-right";
            this._toggleBtn.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i>`;
            this._toggleBtn.title = this._expanded ? "Collapse node" : "Expand node";
            this._toggleBtn.setAttribute("aria-expanded", String(this._expanded));
        }
        if (this._header) {
            this._header.title = this._expanded ? "Collapse node" : "Expand node";
        }
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

function _resolveSyncInput(input) {
    if (!input) return null;
    if (input.classList?.contains?.("mjr-ws-text-wrapper")) {
        return input.querySelector?.("textarea") ?? input;
    }
    return input;
}
