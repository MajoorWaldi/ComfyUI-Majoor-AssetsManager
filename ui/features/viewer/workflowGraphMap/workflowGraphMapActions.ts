import {
    addNodeToHostGraph,
    getFirstSelectedHostCanvasNode,
    getHostGraph,
    importWorkflowIntoHostCanvas,
    refreshHostCanvasGraph,
} from "../../../app/hostAdapter.js";
import { copyTextToClipboard } from "../../../utils/dom.js";
import { writeWidgetValue } from "../workflowSidebar/widgetAdapters.js";
import {
    getNodeType,
    getNodeWidgetValueEntries,
} from "./workflowGraphMapData.js";

type LooseRecord = Record<string, any>;
type WidgetRecord = LooseRecord;

interface TransferResult {
    ok: boolean;
    count: number;
    reason: "no-target" | "no-widgets" | "ok" | "no-match";
    targetNode?: LooseRecord;
}

export async function copyNodeJson(node: any): Promise<boolean> {
    if (!node) return false;
    const text = JSON.stringify(node, null, 2);
    return copyTextToClipboard(text);
}

export async function copyNodeParamValue(value: any): Promise<boolean> {
    return copyTextToClipboard(formatParamClipboardValue(value));
}

export function formatParamClipboardValue(value: any): string {
    if (value == null) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

export function importWorkflowToCanvas(workflow: any): boolean {
    return importWorkflowIntoHostCanvas(workflow);
}

export function importNodeToCurrentGraph(node: LooseRecord | null | undefined): boolean {
    const graph = getHostGraph();
    if (!node || !graph || typeof graph.add !== "function") return false;

    const nodeType = String(node?.type || node?.class_type || node?.comfyClass || "").trim();
    const root = globalThis as typeof globalThis & { LiteGraph?: any; window?: { LiteGraph?: any } };
    const LiteGraph = root?.LiteGraph || root?.window?.LiteGraph || null;
    let created: LooseRecord | null = null;

    try {
        if (LiteGraph && typeof LiteGraph.createNode === "function" && nodeType) {
            created = LiteGraph.createNode(nodeType);
        }
    } catch (e: any) {
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
        return addNodeToHostGraph(created);
    } catch (e: any) {
        console.debug?.("[MFV Graph Map] import node failed", e);
        return false;
    }
}

export function transferNodeParamsToSelectedCanvasNode(
    sourceNode: LooseRecord | null | undefined,
): TransferResult {
    const targetNode = getSingleSelectedCanvasNode();
    if (!sourceNode || !targetNode) return { ok: false, count: 0, reason: "no-target" };

    const sourceEntries = getNodeWidgetValueEntries(sourceNode);
    const targetWidgets = Array.isArray(targetNode.widgets) ? targetNode.widgets : [];
    if (!sourceEntries.length || !targetWidgets.length) {
        return { ok: false, count: 0, reason: "no-widgets" };
    }

    const targetByName = new Map<string, { widget: WidgetRecord; index: number }>();
    targetWidgets.forEach((widget, index) => {
        for (const key of _widgetKeys(widget)) {
            if (!targetByName.has(key)) targetByName.set(key, { widget, index });
        }
    });

    const sourceType = _normalizeType(getNodeType(sourceNode));
    const targetType = _normalizeType(targetNode?.type || targetNode?.comfyClass || targetNode?.class_type);
    const allowPositionFallback = Boolean(sourceType && targetType && sourceType === targetType);
    const usedTargets = new Set<number>();
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

    refreshHostCanvasGraph();

    return {
        ok: count > 0,
        count,
        reason: count > 0 ? "ok" : "no-match",
        targetNode,
    };
}

export function getSingleSelectedCanvasNode(): LooseRecord | null {
    return (getFirstSelectedHostCanvasNode() as LooseRecord | null) || null;
}

function _widgetKeys(widget: WidgetRecord): string[] {
    return [widget?.name, widget?.label, widget?.options?.name, widget?.options?.label]
        .map(_normalizeName)
        .filter(Boolean);
}

function _normalizeName(value: any): string {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");
}

function _normalizeType(value: any): string {
    return String(value ?? "").trim().toLowerCase();
}

function _cloneValue(value: any): any {
    if (value == null || typeof value !== "object") return value;
    try {
        return typeof structuredClone === "function"
            ? structuredClone(value)
            : JSON.parse(JSON.stringify(value));
    } catch {
        return value;
    }
}
