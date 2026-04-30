/**
 * widgetAdapters — pure functions to convert a ComfyUI LGraphNode widget
 * into an HTML input element and to write values back.
 *
 * No module state — every function is stateless.
 */

import { getComfyApp } from "../../../app/comfyApiBridge.js";

/**
 * Create an HTML input element matching a ComfyUI widget type.
 * @param {object} widget  LGraphNode widget ({ name, type, value, options, callback })
 * @param {(newValue: unknown) => void} onChange  Called when the user edits the input
 * @param {object|null} [node]  Parent LGraphNode — passed to widget.callback for proper ComfyUI compat
 * @returns {HTMLElement}
 */
export function createWidgetInput(widget, onChange, node = null) {
    const type = String(widget?.type || "").toLowerCase();
    switch (type) {
        case "number":
        case "int":
        case "float":
            return _numberInput(widget, onChange, node);
        case "combo":
            return _comboInput(widget, onChange, node);
        case "text":
        case "string":
        case "customtext":
            return _textInput(widget, onChange, node);
        case "toggle":
        case "boolean":
            return _toggleInput(widget, onChange, node);
        default:
            return _readonlyInput(widget);
    }
}

/**
 * Write a value into a ComfyUI widget and trigger its callback + canvas repaint.
 * @param {object} widget
 * @param {unknown} newValue
 * @param {object|null} [node]  Parent LGraphNode
 * @returns {boolean}
 */
export function writeWidgetValue(widget, newValue, node = null) {
    if (!widget) return false;
    const type = String(widget.type || "").toLowerCase();

    if (type === "number" || type === "int" || type === "float") {
        const n = Number(newValue);
        if (Number.isNaN(n)) return false;
        const opts = widget.options ?? {};
        const min = opts.min ?? -Infinity;
        const max = opts.max ?? Infinity;
        let clamped = Math.min(max, Math.max(min, n));
        // Round integers
        if (type === "int" || opts.precision === 0 || opts.round === 1) {
            clamped = Math.round(clamped);
        }
        widget.value = clamped;
    } else if (type === "toggle" || type === "boolean") {
        widget.value = Boolean(newValue);
    } else {
        widget.value = newValue;
    }

    // Sync ComfyUI's own DOM element for this widget.
    // customtext/string widgets use widget.inputEl (a textarea positioned on the canvas).
    // Without this, the canvas widget DOM shows the old value even though widget.value changed.
    // Called AFTER the callback so it reflects the final snapped/clamped value.

    try {
        const app = getComfyApp();
        const canvas = app?.canvas ?? null;
        const resolvedNode = node ?? widget?.parent ?? null;
        // Save value before callback: LiteGraph number callbacks snap widget.value to
        // multiples of step2 (e.g. 1025 → 1024 for step2=16). We restore afterwards so
        // the sidebar always writes the exact value the user typed/clicked.
        const savedValue = widget.value;
        // Call with full LiteGraph/ComfyUI signature: (value, canvas, node, event, widget)
        widget.callback?.(widget.value, canvas, resolvedNode, null, widget);
        // Restore exact value (bypasses step2 snapping while keeping callback side-effects).
        if (type === "number" || type === "int" || type === "float") {
            widget.value = savedValue;
        }
        _syncWidgetDomElement(widget);
        canvas?.setDirty?.(true, true);
        canvas?.draw?.(true, true);
        // Notify the node's own graph (may be an inner subgraph graph, different from root).
        const nodeGraph = resolvedNode?.graph ?? null;
        if (nodeGraph && nodeGraph !== app?.graph) {
            nodeGraph.setDirtyCanvas?.(true, true);
            nodeGraph.change?.();
        }
        // Always notify root graph (triggers ComfyUI workflow tracking).
        app?.graph?.setDirtyCanvas?.(true, true);
        app?.graph?.change?.();
    } catch (e) {
        console.debug?.("[MFV] writeWidgetValue", e);
    }
    return true;
}

// ── Private builders ──────────────────────────────────────────────────────────

/**
 * Push widget.value into ComfyUI's own DOM element for this widget.
 * ComfyUI creates a real textarea/input DOM node for customtext/string widgets
 * (widget.inputEl) and positions it on top of the canvas. Updating widget.value
 * alone does not refresh that element — we must set its value directly.
 */
function _syncWidgetDomElement(widget) {
    const strVal = String(widget.value ?? "");
    // ComfyUI customtext: widget.inputEl is the canvas-overlay textarea.
    // For PromotedWidgetView (subgraph exposed widgets), there is no direct inputEl:
    // the real DOM textarea lives on cachedDeepestByFrame.widget.inputEl.
    const el =
        widget?.inputEl ??
        widget?.element ??
        widget?.el ??
        widget?.cachedDeepestByFrame?.widget?.inputEl ??
        widget?.cachedDeepestByFrame?.widget?.element ??
        widget?.cachedDeepestByFrame?.widget?.el ??
        null;
    if (el != null && "value" in el && el.value !== strVal) {
        el.value = strVal;
    }
}

function _numberInput(widget, onChange, node) {
    const input = document.createElement("input");
    input.type = "number";
    input.className = "mjr-ws-input";
    input.value = widget.value ?? "";
    const opts = widget.options ?? {};
    const wtype = String(widget?.type || "").toLowerCase();
    const isInt = wtype === "int" || opts.precision === 0 || opts.round === 1;

    if (opts.min != null) input.min = String(opts.min);
    if (opts.max != null) input.max = String(opts.max);

    // Arrow step: always 1 for integers so the spinner increments by 1.
    // options.step2 (the LiteGraph snap multiplier) is intentionally ignored here
    // because writeWidgetValue restores widget.value after the callback, bypassing snap.
    if (isInt) {
        input.step = "1";
    } else {
        const precision = opts.precision;
        input.step = precision != null ? String(Math.pow(10, -precision)) : "any";
    }

    // Real-time: write on every keystroke / arrow click.
    input.addEventListener("input", () => {
        const raw = input.value;
        if (raw === "" || raw === "-" || raw === "." || raw.endsWith(".")) return;
        writeWidgetValue(widget, raw, node);
        onChange?.(widget.value);
    });
    // On blur / Enter: snap display to the clamped/rounded widget value.
    input.addEventListener("change", () => {
        if (writeWidgetValue(widget, input.value, node)) {
            input.value = String(widget.value);
            onChange?.(widget.value);
        }
    });
    return input;
}

function _comboInput(widget, onChange, node) {
    const select = document.createElement("select");
    select.className = "mjr-ws-input";
    let values = widget.options?.values ?? [];
    if (typeof values === "function") {
        try {
            values = values() ?? [];
        } catch {
            values = [];
        }
    }
    if (!Array.isArray(values)) values = [];
    for (const v of values) {
        const opt = document.createElement("option");
        const label = typeof v === "string" ? v : (v?.content ?? v?.value ?? v?.text ?? String(v));
        opt.value = label;
        opt.textContent = label;
        if (label === String(widget.value)) opt.selected = true;
        select.appendChild(opt);
    }
    select.addEventListener("change", () => {
        if (writeWidgetValue(widget, select.value, node)) onChange?.(widget.value);
    });
    return select;
}

function _textInput(widget, onChange, node) {
    const wrapper = document.createElement("div");
    wrapper.className = "mjr-ws-text-wrapper";

    const textarea = document.createElement("textarea");
    textarea.className = "mjr-ws-input mjr-ws-textarea";
    textarea.value = widget.value ?? "";
    textarea.rows = 2;

    const autoFit = () => {
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";
    };

    textarea.addEventListener("change", () => {
        if (writeWidgetValue(widget, textarea.value, node)) onChange?.(widget.value);
    });
    textarea.addEventListener("input", () => {
        writeWidgetValue(widget, textarea.value, node);
        onChange?.(widget.value);
        autoFit();
    });

    wrapper.appendChild(textarea);
    wrapper._mjrAutoFit = autoFit;
    textarea._mjrAutoFit = autoFit;

    requestAnimationFrame(autoFit);

    return wrapper;
}

function _toggleInput(widget, onChange, node) {
    const label = document.createElement("label");
    label.className = "mjr-ws-toggle-label";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "mjr-ws-checkbox";
    input.checked = Boolean(widget.value);
    input.addEventListener("change", () => {
        if (writeWidgetValue(widget, input.checked, node)) onChange?.(widget.value);
    });
    label.appendChild(input);
    return label;
}

function _readonlyInput(widget) {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "mjr-ws-input mjr-ws-readonly";
    input.value = widget.value != null ? String(widget.value) : "";
    input.readOnly = true;
    input.tabIndex = -1;
    return input;
}
