import { getRawHostApp } from "../../app/hostAdapter.js";
import { collectGraphVisits, findGraphNodeById, getGraphNodes } from "../../app/graphTraversal.js";
import { writeWidgetValue } from "../viewer/workflowSidebar/widgetAdapters.js";

type LooseRecord = Record<string, any>;
type Candidate = { field: string; label: string; value: any; source: string };

const EXTENSION_ID = "Majoor.GenInfoOverridePicker";
const TARGET_NODE = "MajoorGenInfoOverride";
const AUTO_FILL_BUTTON = "Auto fill from workflow";
const PICK_BUTTON_PREFIX = "Pick";
const FIELD_ALIASES: Record<string, string[]> = {
    positive_prompt: ["positive_prompt", "prompt", "text"],
    negative_prompt: ["negative_prompt", "negative", "negative_text"],
    seed: ["seed", "noise_seed"],
    steps: ["steps"],
    cfg: ["cfg", "cfg_scale"],
    sampler: ["sampler", "sampler_name"],
    scheduler: ["scheduler"],
    model: ["model", "ckpt_name", "checkpoint"],
    vae: ["vae", "vae_name"],
    clip: ["clip", "clip_name"],
};
const PICK_FIELDS: Array<{ field: string; label: string }> = [
    { field: "positive_prompt", label: "prompt" },
    { field: "negative_prompt", label: "negative" },
    { field: "model", label: "model" },
    { field: "vae", label: "vae" },
    { field: "clip", label: "clip" },
    { field: "seed", label: "seed" },
    { field: "steps", label: "steps" },
    { field: "cfg", label: "cfg" },
    { field: "sampler", label: "sampler" },
    { field: "scheduler", label: "scheduler" },
    { field: "denoise", label: "denoise" },
];
const MAX_SEED = 0xffffffffffffffff;

let registered = false;
let executedListenerRegistered = false;

function widgetValue(node: LooseRecord, name: string): any {
    const widget = (node.widgets ?? []).find((w: any) => w?.name === name);
    if (widget && widget.value !== undefined && widget.value !== null && String(widget.value).trim() !== "") {
        return widget.value;
    }
    const values = Array.isArray(node.widgets_values) ? node.widgets_values : [];
    const widgets = Array.isArray(node.widgets) ? node.widgets : [];
    const index = widgets.findIndex((w: any) => w?.name === name);
    return index >= 0 ? values[index] : undefined;
}

function pushCandidate(out: Candidate[], seen: Set<string>, field: string, value: any, source: string): void {
    if (value === undefined || value === null || String(value).trim() === "") return;
    const text = String(value).trim();
    const key = `${field}:${text}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ field, label: field.replace(/_/g, " "), value, source });
}

function candidateMatchesField(field: string, widgetName: string, nodeLabel: string): boolean {
    const normalized = widgetName.toLowerCase();
    const aliases = FIELD_ALIASES[field] ?? [field];
    if (aliases.some((alias) => normalized === alias || normalized.includes(alias))) return true;
    if (field === "positive_prompt" && normalized === "text" && nodeLabel.toLowerCase().includes("positive")) return true;
    if (field === "negative_prompt" && (normalized.includes("negative") || nodeLabel.toLowerCase().includes("negative"))) return true;
    return false;
}

function collectCandidates(runtimeApp: any, targetField: string | null = null): Candidate[] {
    const out: Candidate[] = [];
    const seen = new Set<string>();
    for (const { graph, label } of collectGraphVisits(runtimeApp)) {
        for (const node of getGraphNodes(graph)) {
            if (String(node?.comfyClass || node?.type || "") === TARGET_NODE) continue;
            const nodeLabel = String(node?.title || node?.comfyClass || node?.type || `Node ${node?.id ?? ""}`).trim();
            const source = label === "Workflow" ? nodeLabel : `${label} / ${nodeLabel}`;
            for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
                for (const alias of aliases) {
                    pushCandidate(out, seen, field, widgetValue(node, alias), source);
                }
            }
            const widgets = Array.isArray(node.widgets) ? node.widgets : [];
            const values = Array.isArray(node.widgets_values) ? node.widgets_values : [];
            widgets.forEach((widget: any, index: number) => {
                const name = String(widget?.name || "").toLowerCase();
                const value = widget?.value ?? values[index];
                if (name.includes("positive") || (name === "text" && String(nodeLabel).toLowerCase().includes("positive"))) {
                    pushCandidate(out, seen, "positive_prompt", value, source);
                } else if (name.includes("negative")) {
                    pushCandidate(out, seen, "negative_prompt", value, source);
                }
                if (targetField && candidateMatchesField(targetField, name, nodeLabel)) {
                    pushCandidate(out, seen, targetField, value, `${source} / ${widget?.name || `widget ${index + 1}`}`);
                }
            });
        }
    }
    if (!targetField) return out.slice(0, 80);
    return out.filter((candidate) => candidate.field === targetField).slice(0, 120);
}

function targetWidget(node: LooseRecord, field: string): any {
    return (node.widgets ?? []).find((w: any) => w?.name === field);
}

function normalizeOverrideWidgetOptions(node: LooseRecord): void {
    const seedWidget = targetWidget(node, "seed");
    if (!seedWidget) return;
    seedWidget.options = {
        ...(seedWidget.options ?? {}),
        min: -1,
        max: MAX_SEED,
        control_after_generate: false,
    };
}

function payloadValueForField(payload: LooseRecord, field: string): any {
    if (field === "positive_prompt") return payload?.prompt ?? payload?.positive_prompt;
    if (field === "negative_prompt") return payload?.negative_prompt ?? payload?.negative;
    if (field === "loras_json" && Array.isArray(payload?.loras)) return JSON.stringify(payload.loras);
    if (field === "custom_info_json" && Array.isArray(payload?.custom_info)) return JSON.stringify(payload.custom_info);
    return payload?.[field];
}

function applyPayloadToWidgets(node: LooseRecord, payload: LooseRecord): number {
    if (!node || !payload || typeof payload !== "object") return 0;
    normalizeOverrideWidgetOptions(node);
    let count = 0;
    const fields = [
        "positive_prompt",
        "negative_prompt",
        "seed",
        "steps",
        "cfg",
        "sampler",
        "scheduler",
        "model",
        "vae",
        "clip",
        "denoise",
        "loras_json",
        "workflow_notes",
        "custom_info_json",
    ];
    for (const field of fields) {
        const value = payloadValueForField(payload, field);
        if (value === undefined || value === null) continue;
        const widget = targetWidget(node, field);
        if (!widget) continue;
        writeOverrideWidgetValue(widget, value, node, field);
        syncVisibleWidgetInput(widget, value);
        count += 1;
    }
    return count;
}

function writeOverrideWidgetValue(widget: any, value: any, node: LooseRecord, field: string): void {
    if (field !== "seed") {
        writeWidgetValue(widget, value, node);
        return;
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;
    widget.options = { ...(widget.options ?? {}), min: -1, max: MAX_SEED, control_after_generate: false };
    widget.value = Math.trunc(numeric);
    try {
        widget.callback?.(widget.value, getRawHostApp()?.canvas ?? null, node, null, widget);
    } catch {
        // Seed display sync must not fail the executed hook.
    }
}

function syncVisibleWidgetInput(widget: any, value: any): void {
    const text = String(value ?? "");
    const candidates = [
        widget?.inputEl,
        widget?.element,
        widget?.el,
        widget?.cachedDeepestByFrame?.widget?.inputEl,
        widget?.cachedDeepestByFrame?.widget?.element,
        widget?.cachedDeepestByFrame?.widget?.el,
    ];
    for (const element of candidates) {
        if (!element || typeof element !== "object") continue;
        if ("value" in element) {
            try {
                element.value = text;
            } catch {
                // Best effort for host-provided widget DOM.
            }
        }
    }
}

function syncNodeFromExecutedMessage(node: LooseRecord, message: any, runtimeApp: any): void {
    const payload = extractExecutedOverridePayload({ detail: { output: message } });
    if (!payload) return;
    const count = applyPayloadToWidgets(node, payload);
    if (!count) return;
    try {
        node.setSize?.(node.computeSize?.());
        node.graph?.setDirtyCanvas?.(true, true);
        node.graph?.change?.();
        runtimeApp?.graph?.setDirtyCanvas?.(true, true);
        runtimeApp?.graph?.change?.();
        runtimeApp?.canvas?.setDirty?.(true, true);
        runtimeApp?.canvas?.draw?.(true, true);
    } catch {
        // Rendering refresh is best-effort across ComfyUI frontend versions.
    }
}

function applyCandidate(node: LooseRecord, candidate: Candidate, targetField: string | null = null): void {
    const field = targetField || candidate.field;
    const widget = targetWidget(node, field);
    if (!widget) return;
    writeOverrideWidgetValue(widget, candidate.value, node, field);
    syncVisibleWidgetInput(widget, candidate.value);
}

function isEmptyWidget(widget: any): boolean {
    return !widget || widget.value === undefined || widget.value === null || String(widget.value).trim() === "";
}

function autoFillFromWorkflow(node: LooseRecord, runtimeApp: any): number {
    const candidates = collectCandidates(runtimeApp);
    let count = 0;
    for (const field of Object.keys(FIELD_ALIASES)) {
        const widget = targetWidget(node, field);
        if (!widget || !isEmptyWidget(widget)) continue;
        const candidate = candidates.find((item) => item.field === field);
        if (!candidate) continue;
        writeOverrideWidgetValue(widget, candidate.value, node, field);
        syncVisibleWidgetInput(widget, candidate.value);
        count += 1;
    }
    runtimeApp?.graph?.setDirtyCanvas?.(true, true);
    runtimeApp?.graph?.change?.();
    runtimeApp?.extensionManager?.toast?.add?.({
        severity: count ? "success" : "warn",
        summary: "Majoor Gen Info",
        detail: count ? `Filled ${count} empty override fields.` : "No empty matching fields found.",
        life: 3000,
    });
    return count;
}

function ensurePickerWidgets(node: LooseRecord, runtimeApp: any): void {
    if (!node || String(node?.comfyClass || node?.type || "") !== TARGET_NODE) return;
    normalizeOverrideWidgetOptions(node);
    if ((node.widgets ?? []).some((widget: any) => widget?.name === AUTO_FILL_BUTTON)) return;
    if (typeof node.addWidget !== "function") return;
    node.addWidget("button", AUTO_FILL_BUTTON, null, () => autoFillFromWorkflow(node, runtimeApp));
    for (const item of PICK_FIELDS) {
        const buttonName = `${PICK_BUTTON_PREFIX} ${item.label}`;
        if ((node.widgets ?? []).some((widget: any) => widget?.name === buttonName)) continue;
        node.addWidget("button", buttonName, null, () => showPicker(node, runtimeApp, item.field));
    }
    try {
        node.setSize?.(node.computeSize?.());
        runtimeApp?.graph?.setDirtyCanvas?.(true, true);
    } catch {
        // Layout refresh is best-effort across ComfyUI frontend versions.
    }
}

function extractExecutedOverridePayload(event: any): LooseRecord | null {
    const output = event?.detail?.output;
    const raw = output?.majoor_geninfo_override ?? output?.ui?.majoor_geninfo_override;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return value && typeof value === "object" ? value : null;
}

function registerExecutedVisualSync(runtimeApp: any): void {
    if (executedListenerRegistered) return;
    const api = runtimeApp?.api;
    if (!api || typeof api.addEventListener !== "function") return;
    executedListenerRegistered = true;
    api.addEventListener("executed", (event: any) => {
        const nodeId = event?.detail?.node ?? event?.detail?.display_node;
        const payload = extractExecutedOverridePayload(event);
        if (!nodeId || !payload) return;
        const node = findGraphNodeById(runtimeApp, nodeId);
        if (!node || String(node?.comfyClass || node?.type || "") !== TARGET_NODE) return;
        const count = applyPayloadToWidgets(node, payload);
        if (!count) return;
        runtimeApp?.graph?.setDirtyCanvas?.(true, true);
        runtimeApp?.graph?.change?.();
    });
}

function showPicker(node: LooseRecord, runtimeApp: any, targetField: string | null = null): void {
    const candidates = collectCandidates(runtimeApp, targetField);
    if (!candidates.length) {
        runtimeApp?.extensionManager?.toast?.add?.({
            severity: "warn",
            summary: "Majoor Gen Info",
            detail: targetField ? `No widget value found for ${targetField}.` : "No workflow parameters found.",
            life: 3000,
        });
        return;
    }
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;z-index:1000000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center";
    const panel = document.createElement("div");
    panel.style.cssText = "width:min(720px,92vw);max-height:80vh;overflow:auto;background:#202020;color:#eee;border:1px solid #555;border-radius:8px;padding:12px;box-shadow:0 16px 48px rgba(0,0,0,.55);font:12px sans-serif";
    const title = targetField ? `Pick ${targetField.replace(/_/g, " ")}` : "Pick Gen Info from workflow";
    panel.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><strong></strong><button data-close style="background:#333;color:#eee;border:1px solid #555;border-radius:4px;padding:4px 8px;cursor:pointer">Close</button></div>`;
    const strong = panel.querySelector("strong");
    if (strong) strong.textContent = title;
    for (const candidate of candidates) {
        const row = document.createElement("button");
        row.type = "button";
        row.style.cssText = "width:100%;display:grid;grid-template-columns:130px 1fr 150px;gap:8px;text-align:left;background:#2b2b2b;color:#eee;border:1px solid #3d3d3d;border-radius:5px;padding:7px;margin:5px 0;cursor:pointer";
        row.innerHTML = `<span style="color:#7ec8ff">${candidate.label}</span><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></span><span style="opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></span>`;
        row.children[1].textContent = String(candidate.value);
        row.children[2].textContent = candidate.source;
        row.onclick = () => {
            applyCandidate(node, candidate, targetField);
            overlay.remove();
        };
        panel.appendChild(row);
    }
    overlay.appendChild(panel);
    panel.querySelector("[data-close]")?.addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
}

export function registerGenInfoOverridePicker(appRef: any = null): void {
    if (registered) return;
    const runtimeApp = appRef || getRawHostApp();
    if (!runtimeApp || typeof runtimeApp.registerExtension !== "function") {
        setTimeout(() => registerGenInfoOverridePicker(appRef), 100);
        return;
    }
    registered = true;
    registerExecutedVisualSync(runtimeApp);
    runtimeApp.registerExtension({
        name: EXTENSION_ID,
        async nodeCreated(node: any) {
            ensurePickerWidgets(node, runtimeApp);
        },
        async beforeRegisterNodeDef(nodeType: any, nodeData: any) {
            if (String(nodeData?.name || "") !== TARGET_NODE) return;
            const prevCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                const result = prevCreated?.apply?.(this, arguments as any);
                ensurePickerWidgets(this, runtimeApp);
                return result;
            };
            const prevExecuted = nodeType.prototype.onExecuted;
            nodeType.prototype.onExecuted = function (message: any) {
                const result = prevExecuted?.apply?.(this, arguments as any);
                syncNodeFromExecutedMessage(this, message, runtimeApp);
                return result;
            };
            const prev = nodeType.prototype.getExtraMenuOptions;
            nodeType.prototype.getExtraMenuOptions = function (_canvas: any, options: any[]) {
                prev?.apply?.(this, arguments as any);
                options.push({
                    content: "Pick Gen Info from workflow",
                    callback: () => showPicker(this, runtimeApp),
                });
                for (const item of PICK_FIELDS) {
                    options.push({
                        content: `Pick ${item.label}`,
                        callback: () => showPicker(this, runtimeApp, item.field),
                    });
                }
                options.push({
                    content: AUTO_FILL_BUTTON,
                    callback: () => autoFillFromWorkflow(this, runtimeApp),
                });
            };
        },
    });
    setTimeout(() => {
        for (const { graph } of collectGraphVisits(runtimeApp)) {
            for (const node of getGraphNodes(graph)) {
                ensurePickerWidgets(node, runtimeApp);
            }
        }
    }, 0);
}
