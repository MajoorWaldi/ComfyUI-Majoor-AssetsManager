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
 * @returns {HTMLElement}
 */
export function createWidgetInput(widget, onChange) {
    const type = String(widget?.type || "").toLowerCase();
    switch (type) {
        case "number":
            return _numberInput(widget, onChange);
        case "combo":
            return _comboInput(widget, onChange);
        case "text":
        case "string":
        case "customtext":
            return _textInput(widget, onChange);
        case "toggle":
            return _toggleInput(widget, onChange);
        default:
            // Unsupported / complex widget type — show read-only value
            return _readonlyInput(widget);
    }
}

/**
 * Write a value into a ComfyUI widget and trigger its callback.
 * Returns true on success.
 */
export function writeWidgetValue(widget, newValue) {
    if (!widget) return false;
    const type = String(widget.type || "").toLowerCase();

    if (type === "number") {
        const n = Number(newValue);
        if (Number.isNaN(n)) return false;
        const opts = widget.options ?? {};
        const min = opts.min ?? -Infinity;
        const max = opts.max ?? Infinity;
        widget.value = Math.min(max, Math.max(min, n));
    } else if (type === "toggle") {
        widget.value = Boolean(newValue);
    } else {
        widget.value = newValue;
    }

    try { widget.callback?.(widget.value); } catch (e) { console.debug?.(e); }
    try {
        const app = getComfyApp();
        app?.canvas?.setDirty?.(true, true);
        app?.graph?.setDirtyCanvas?.(true, true);
    } catch (e) { console.debug?.(e); }
    return true;
}

// ── Private builders ──────────────────────────────────────────────────────────

function _numberInput(widget, onChange) {
    const input = document.createElement("input");
    input.type = "number";
    input.className = "mjr-ws-input";
    input.value = widget.value ?? "";
    const opts = widget.options ?? {};
    if (opts.min != null) input.min = String(opts.min);
    if (opts.max != null) input.max = String(opts.max);
    if (opts.step != null) input.step = String(opts.step);
    // Real-time: write on every keystroke (skip invalid partial states like "-" or ".").
    input.addEventListener("input", () => {
        const raw = input.value;
        if (raw === "" || raw === "-" || raw === "." || raw.endsWith(".")) return;
        writeWidgetValue(widget, raw);
        onChange?.(widget.value);
    });
    // On blur/Enter: sync display with possibly-clamped widget value.
    input.addEventListener("change", () => {
        if (writeWidgetValue(widget, input.value)) {
            input.value = widget.value;
            onChange?.(widget.value);
        }
    });
    return input;
}

function _comboInput(widget, onChange) {
    const select = document.createElement("select");
    select.className = "mjr-ws-input";
    let values = widget.options?.values ?? [];
    if (typeof values === "function") {
        try { values = values() ?? []; } catch { values = []; }
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
        if (writeWidgetValue(widget, select.value)) onChange?.(widget.value);
    });
    return select;
}

function _textInput(widget, onChange) {
    const COLLAPSED_MAX = 80;

    const wrapper = document.createElement("div");
    wrapper.className = "mjr-ws-text-wrapper";

    const textarea = document.createElement("textarea");
    textarea.className = "mjr-ws-input mjr-ws-textarea";
    textarea.value = widget.value ?? "";
    textarea.rows = 2;

    const expandBtn = document.createElement("button");
    expandBtn.type = "button";
    expandBtn.className = "mjr-ws-expand-btn";
    expandBtn.textContent = "Expand";
    expandBtn.style.display = "none";

    let expanded = false;

    const autoFit = () => {
        textarea.style.height = "auto";
        const full = textarea.scrollHeight;
        if (expanded) {
            textarea.style.height = full + "px";
            textarea.style.maxHeight = "none";
            expandBtn.textContent = "Collapse";
        } else {
            textarea.style.height = Math.min(full, COLLAPSED_MAX) + "px";
            textarea.style.maxHeight = COLLAPSED_MAX + "px";
            expandBtn.textContent = "Expand";
        }
        expandBtn.style.display = full > COLLAPSED_MAX ? "" : "none";
    };

    textarea.addEventListener("change", () => {
        if (writeWidgetValue(widget, textarea.value)) onChange?.(widget.value);
    });
    // Real-time: write on every keystroke.
    textarea.addEventListener("input", () => {
        writeWidgetValue(widget, textarea.value);
        autoFit();
    });

    expandBtn.addEventListener("click", () => {
        expanded = !expanded;
        autoFit();
    });

    wrapper.appendChild(textarea);
    wrapper.appendChild(expandBtn);

    // Initial fit after insertion
    requestAnimationFrame(autoFit);

    return wrapper;
}

function _toggleInput(widget, onChange) {
    const label = document.createElement("label");
    label.className = "mjr-ws-toggle-label";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "mjr-ws-checkbox";
    input.checked = Boolean(widget.value);
    input.addEventListener("change", () => {
        if (writeWidgetValue(widget, input.checked)) onChange?.(widget.value);
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
