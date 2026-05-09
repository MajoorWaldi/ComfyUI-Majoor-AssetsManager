import {
    synthesizeWorkflowFromPromptGraph,
} from "../../../components/sidebar/utils/minimap.js";

const OBJECT_INFO_CACHE = new Map();
let OBJECT_INFO_ALL_PROMISE = null;

export async function ensureWorkflowObjectInfo(workflow) {
    const types = Array.from(
        new Set(
            getWorkflowNodes(workflow)
                .map((node) => getNodeType(node))
                .filter(Boolean),
        ),
    );
    if (!types.length) return;
    const missing = types.filter((type) => !OBJECT_INFO_CACHE.has(type));
    if (!missing.length) return;
    try {
        if (!OBJECT_INFO_ALL_PROMISE) {
            OBJECT_INFO_ALL_PROMISE = fetch("/object_info")
                .then((res) => (res?.ok ? res.json() : null))
                .then((data) => {
                    if (data && typeof data === "object") {
                        for (const [key, value] of Object.entries(data)) {
                            OBJECT_INFO_CACHE.set(String(key), value);
                        }
                    }
                    return data;
                })
                .catch(() => null);
        }
        await OBJECT_INFO_ALL_PROMISE;
    } catch {
        // Best-effort only. Saved workflow data still renders without object_info.
    }
}

export function resolveAssetWorkflow(asset) {
    const candidates = _collectWorkflowCandidates(asset);
    for (const candidate of candidates) {
        const parsed = _coerceObject(candidate);
        const workflow = _normalizeWorkflow(parsed);
        if (workflow) return workflow;
    }
    return null;
}

export function getWorkflowNodes(workflow) {
    const nodes = Array.isArray(workflow?.nodes) ? workflow.nodes.filter(Boolean) : [];
    const out = [...nodes];
    const definitions = _getSubgraphDefinitions(workflow);
    for (const node of nodes) {
        const subgraph = _getNodeSubgraph(workflow, node, definitions);
        if (subgraph) out.push(...getWorkflowNodes(subgraph));
    }
    return out;
}

export function findWorkflowNode(workflow, nodeId) {
    const wanted = String(nodeId ?? "");
    if (!wanted) return null;
    if (wanted.includes("::")) {
        const [parentId, ...rest] = wanted.split("::");
        const childId = rest.join("::");
        const parent = findWorkflowNode(workflow, parentId);
        const subgraph = parent ? _getNodeSubgraph(workflow, parent, _getSubgraphDefinitions(workflow)) : null;
        return subgraph ? findWorkflowNode(subgraph, childId) : null;
    }
    const direct =
        (Array.isArray(workflow?.nodes) ? workflow.nodes : []).find(
            (node) => String(node?.id ?? node?.ID ?? "") === wanted,
        ) || null;
    if (direct) return direct;
    for (const node of Array.isArray(workflow?.nodes) ? workflow.nodes : []) {
        const subgraph = _getNodeSubgraph(workflow, node, _getSubgraphDefinitions(workflow));
        const found = subgraph ? findWorkflowNode(subgraph, wanted) : null;
        if (found) return found;
    }
    return null;
}

export function getNodeDisplayName(node) {
    return String(
        node?.title ||
            node?.type ||
            node?.comfyClass ||
            node?.class_type ||
            node?.classType ||
            node?.id ||
            "Node",
    ).trim();
}

export function getNodeType(node) {
    return String(node?.type || node?.class_type || node?.comfyClass || node?.classType || "").trim();
}

export function getNodeParamEntries(node) {
    const entries = [];
    const properties = node?.properties && typeof node.properties === "object" ? node.properties : null;
    const inputs = node?.inputs && typeof node.inputs === "object" ? node.inputs : null;

    if (inputs && !Array.isArray(inputs)) {
        for (const [key, value] of Object.entries(inputs)) {
            if (Array.isArray(value)) continue;
            if (value != null && typeof value === "object") continue;
            entries.push([key, value]);
        }
    }

    for (const { label, value } of getNodeWidgetValueEntries(node)) {
        if (entries.some(([key]) => String(key) === String(label))) continue;
        entries.push([label, value]);
    }

    if (properties) {
        for (const [key, value] of Object.entries(properties)) {
            if (value == null || typeof value === "object") continue;
            entries.push([key, value]);
        }
    }

    return entries.slice(0, 80);
}

export function getNodeWidgetValueEntries(node) {
    const widgetsValuesRaw = node?.widgets_values;
    if (widgetsValuesRaw && typeof widgetsValuesRaw === "object" && !Array.isArray(widgetsValuesRaw)) {
        return Object.entries(widgetsValuesRaw).map(([label, value], index) => ({ label, value, index }));
    }
    const widgetsValues = Array.isArray(widgetsValuesRaw) ? widgetsValuesRaw : [];
    const widgets = Array.isArray(node?.widgets) ? node.widgets : [];
    const objectInfo = getNodeObjectInfo(node);
    const objectInputNames = getObjectInfoWidgetInputNames(objectInfo);
    const inputSlotNames = getNodeInputSlotNames(node);
    return widgetsValues.map((value, index) => {
        const label =
            widgets[index]?.name ||
            widgets[index]?.label ||
            inputSlotNames[index] ||
            objectInputNames[index] ||
            _guessWidgetLabel(node, index, value) ||
            `param ${index + 1}`;
        return { label, value, index };
    });
}

export function getNodeInputSlotNames(node) {
    const inputs = Array.isArray(node?.inputs) ? node.inputs : [];
    const widgetInputs = inputs.filter(_inputLooksLikeWidget);
    const unlinkedWidgetLikeInputs = inputs.filter(
        (input) => !_inputHasLink(input) && _inputTypeLooksWidgetCapable(input?.type),
    );
    const labelSource = widgetInputs.length
        ? widgetInputs
        : unlinkedWidgetLikeInputs.length
          ? unlinkedWidgetLikeInputs
          : inputs;
    return labelSource.map((input) =>
        String(
            input?.label ||
                input?.localized_name ||
                input?.name ||
                input?.widget?.name ||
                input?.widget?.label ||
                "",
        ).trim(),
    );
}

export function getNodeObjectInfo(node) {
    const type = getNodeType(node);
    return type ? OBJECT_INFO_CACHE.get(type) || null : null;
}

export function getObjectInfoInputNames(info) {
    const order = info?.input_order;
    if (order && typeof order === "object") {
        return [
            ...(Array.isArray(order.required) ? order.required : []),
            ...(Array.isArray(order.optional) ? order.optional : []),
        ].filter(Boolean);
    }
    const input = info?.input;
    if (input && typeof input === "object") {
        return ["required", "optional"]
            .flatMap((section) =>
                input[section] && typeof input[section] === "object"
                    ? Object.keys(input[section])
                    : [],
            )
            .filter(Boolean);
    }
    return [];
}

export function getObjectInfoWidgetInputNames(info) {
    const input = info?.input;
    if (!input || typeof input !== "object") return getObjectInfoInputNames(info);
    const out = [];
    for (const section of ["required", "optional"]) {
        const block = input[section];
        if (!block || typeof block !== "object") continue;
        for (const [name, config] of Object.entries(block)) {
            if (_objectInfoInputLooksWidget(config)) out.push(name);
        }
    }
    return out.length ? out : getObjectInfoInputNames(info);
}

function _inputLooksLikeWidget(input) {
    if (!input || typeof input !== "object") return false;
    if (input.widget === true) return true;
    if (input.widget && typeof input.widget === "object") return true;
    if (typeof input.widget === "string" && input.widget.trim()) return true;
    return false;
}

function _inputHasLink(input) {
    if (!input || typeof input !== "object") return false;
    if (input.link != null) return true;
    if (Array.isArray(input.links) && input.links.length) return true;
    return false;
}

function _objectInfoInputLooksWidget(config) {
    const tuple = Array.isArray(config) ? config : [];
    const type = tuple[0];
    const options =
        tuple[1] && typeof tuple[1] === "object" && !Array.isArray(tuple[1]) ? tuple[1] : null;
    if (options?.forceInput === true) return false;
    if (options?.rawLink === true) return false;
    if (options?.widgetType && String(options.widgetType).trim()) return true;
    return _inputTypeLooksWidgetCapable(type);
}

function _inputTypeLooksWidgetCapable(type) {
    if (Array.isArray(type)) return true;
    const text = String(type || "").trim().toUpperCase();
    if (!text) return false;
    return (
        text === "INT" ||
        text === "FLOAT" ||
        text === "STRING" ||
        text === "BOOLEAN" ||
        text === "BOOL" ||
        text === "COMBO" ||
        text === "ENUM"
    );
}

function _guessWidgetLabel(node, index, value) {
    const type = getNodeType(node);
    const title = getNodeDisplayName(node);
    const haystack = `${type} ${title}`.toLowerCase();
    const valueText = String(value ?? "").toLowerCase();
    if (haystack.includes("cliptext") || haystack.includes("prompt")) return index === 0 ? "text" : null;
    if (valueText.includes(".safetensors") || valueText.includes(".ckpt")) return "model";
    if (typeof value === "number") {
        if (haystack.includes("sampler") && index === 0) return "seed";
        if (haystack.includes("sampler") && index === 1) return "steps";
        if (haystack.includes("latent") && index === 0) return "width";
        if (haystack.includes("latent") && index === 1) return "height";
    }
    return null;
}

function _collectWorkflowCandidates(asset) {
    const raw = _coerceObject(asset?.metadata_raw);
    const meta = _coerceObject(asset?.metadata);
    return [
        asset?.workflow,
        asset?.Workflow,
        asset?.comfy_workflow,
        raw?.workflow,
        raw?.Workflow,
        raw?.comfy_workflow,
        raw?.comfyui,
        raw?.ComfyUI,
        meta?.workflow,
        meta?.Workflow,
        meta?.comfy_workflow,
        asset?.prompt,
        raw?.prompt,
        raw?.Prompt,
        meta?.prompt,
        meta?.Prompt,
    ].filter((value) => value != null);
}

function _coerceObject(value) {
    if (!value) return null;
    if (typeof value === "object") return value;
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed || !/^[{[]/.test(trimmed)) return null;
    try {
        return JSON.parse(trimmed);
    } catch {
        return null;
    }
}

function _normalizeWorkflow(value) {
    if (!value || typeof value !== "object") return null;
    if (Array.isArray(value.nodes)) return value;
    if (value.workflow && typeof value.workflow === "object" && Array.isArray(value.workflow.nodes)) {
        return value.workflow;
    }
    if (value.prompt && typeof value.prompt === "object") {
        return synthesizeWorkflowFromPromptGraph(value.prompt);
    }
    const synthesized = synthesizeWorkflowFromPromptGraph(value);
    return synthesized && Array.isArray(synthesized.nodes) ? synthesized : null;
}

function _getSubgraphDefinitions(workflow) {
    const defs =
        (Array.isArray(workflow?.definitions?.subgraphs) && workflow.definitions.subgraphs) ||
        (Array.isArray(workflow?.subgraphs) && workflow.subgraphs) ||
        [];
    const map = new Map();
    for (const def of defs) {
        const id = def?.id ?? def?.name ?? null;
        if (id != null) map.set(String(id), def);
    }
    return map;
}

function _getNodeSubgraph(workflow, node, definitions = _getSubgraphDefinitions(workflow)) {
    const candidates = [
        node?.subgraph,
        node?._subgraph,
        node?.subgraph?.graph,
        node?.subgraph?.lgraph,
        node?.properties?.subgraph,
        node?.subgraph_instance,
        node?.subgraph_instance?.graph,
        node?.inner_graph,
        node?.subgraph_graph,
        definitions.get(String(node?.type ?? "")),
    ];
    for (const candidate of candidates) {
        if (candidate && typeof candidate === "object" && Array.isArray(candidate.nodes)) return candidate;
    }
    if (Array.isArray(node?.nodes)) return { nodes: node.nodes };
    return null;
}
