import { getRawHostApp } from "../../../app/hostAdapter.js";
import { copyTextToClipboard } from "../../../utils/dom.js";
import { writeWidgetValue } from "../workflowSidebar/widgetAdapters.js";
import {
    getNodeType,
    getNodeWidgetValueEntries,
} from "./workflowGraphMapData.js";

export async function copyNodeJson(node) {
    if (!node) return false;
    const text = JSON.stringify(node, null, 2);
    return copyTextToClipboard(text);
}

export async function copyNodeParamValue(value) {
    return copyTextToClipboard(formatParamClipboardValue(value));
}

export function formatParamClipboardValue(value) {
    if (value == null) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

export function importWorkflowToCanvas(workflow) {
    const app = getRawHostApp();
    if (!workflow || typeof workflow !== "object") return false;
    if (typeof app?.loadGraphData === "function") {
        app.loadGraphData(workflow);
        return true;
    }
    if (typeof app?.canvas?.graph?.configure === "function") {
        app.canvas.graph.configure(workflow);
        app.canvas.graph.setDirtyCanvas?.(true, true);
        return true;
    }
    if (typeof app?.graph?.configure === "function") {
        app.graph.configure(workflow);
        app.graph.setDirtyCanvas?.(true, true);
        return true;
    }
    return false;
}

export function importNodeToCurrentGraph(node) {
    const app = getRawHostApp();
    const graph = app?.graph ?? app?.canvas?.graph ?? null;
    if (!node || !graph || typeof graph.add !== "function") return false;

    const nodeType = String(node?.type || node?.class_type || node?.comfyClass || "").trim();
    const LiteGraph = globalThis?.LiteGraph || globalThis?.window?.LiteGraph || null;
    let created = null;

    try {
        if (LiteGraph && typeof LiteGraph.createNode === "function" && nodeType) {
            created = LiteGraph.createNode(nodeType);
        }
    } catch (e) {
        console.debug?.("[MFV Graph Map] createNode failed", e);
    }

    if (!created) return false;

    try {
        const clone =
            typeof structuredClone === "function"
                ? structuredClone(node)
                : JSON.parse(JSON.stringify(node));
        delete clone.id;
        if (Array.isArray(clone.pos)) {
            clone.pos = [Number(clone.pos[0] || 0) + 32, Number(clone.pos[1] || 0) + 32];
        }
        if (typeof created.configure === "function") {
            created.configure(clone);
        } else {
            Object.assign(created, clone);
        }
        graph.add(created);
        graph.setDirtyCanvas?.(true, true);
        app?.canvas?.setDirty?.(true, true);
        return true;
    } catch (e) {
        console.debug?.("[MFV Graph Map] import node failed", e);
        return false;
    }
}

export function transferNodeParamsToSelectedCanvasNode(sourceNode) {
    const app = getRawHostApp();
    const targetNode = getSingleSelectedCanvasNode(app);
    if (!sourceNode || !targetNode) return { ok: false, count: 0, reason: "no-target" };

    const sourceEntries = getNodeWidgetValueEntries(sourceNode);
    const targetWidgets = Array.isArray(targetNode.widgets) ? targetNode.widgets : [];
    if (!sourceEntries.length || !targetWidgets.length) {
        return { ok: false, count: 0, reason: "no-widgets" };
    }

    const targetByName = new Map();
    targetWidgets.forEach((widget, index) => {
        for (const key of _widgetKeys(widget)) {
            if (!targetByName.has(key)) targetByName.set(key, { widget, index });
        }
    });

    const sourceType = _normalizeType(getNodeType(sourceNode));
    const targetType = _normalizeType(targetNode?.type || targetNode?.comfyClass || targetNode?.class_type);
    const allowPositionFallback = Boolean(sourceType && targetType && sourceType === targetType);
    const usedTargets = new Set();
    let count = 0;

    for (const entry of sourceEntries) {
        const key = _normalizeName(entry.label);
        let target = key ? targetByName.get(key) : null;
        if ((!target || usedTargets.has(target.index)) && allowPositionFallback) {
            const positional = targetWidgets[entry.index];
            if (positional) target = { widget: positional, index: entry.index };
        }
        if (!target || usedTargets.has(target.index)) continue;
        if (writeWidgetValue(target.widget, _cloneValue(entry.value), targetNode)) {
            usedTargets.add(target.index);
            count += 1;
        }
    }

    app?.canvas?.setDirty?.(true, true);
    app?.canvas?.draw?.(true, true);
    app?.graph?.setDirtyCanvas?.(true, true);
    app?.graph?.change?.();

    return {
        ok: count > 0,
        count,
        reason: count > 0 ? "ok" : "no-match",
        targetNode,
    };
}

export function getSingleSelectedCanvasNode(app = getRawHostApp()) {
    const selected = app?.canvas?.selected_nodes ?? app?.canvas?.selectedNodes ?? null;
    if (!selected) return null;
    if (Array.isArray(selected)) return selected.filter(Boolean)[0] || null;
    if (selected instanceof Map) return Array.from(selected.values()).filter(Boolean)[0] || null;
    if (typeof selected === "object") return Object.values(selected).filter(Boolean)[0] || null;
    return null;
}

function _widgetKeys(widget) {
    return [widget?.name, widget?.label, widget?.options?.name, widget?.options?.label]
        .map(_normalizeName)
        .filter(Boolean);
}

function _normalizeName(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");
}

function _normalizeType(value) {
    return String(value ?? "").trim().toLowerCase();
}

function _cloneValue(value) {
    if (value == null || typeof value !== "object") return value;
    try {
        return typeof structuredClone === "function"
            ? structuredClone(value)
            : JSON.parse(JSON.stringify(value));
    } catch {
        return value;
    }
}
