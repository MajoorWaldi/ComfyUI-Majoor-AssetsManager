import {
    synthesizeWorkflowFromPromptGraph,
} from "../../../components/sidebar/utils/minimap.js";
import { fetchHostApi } from "../../../app/hostAdapter.js";
import {
    getWorkflowNodeDisplayName,
    getWorkflowNodeRawType,
    getWorkflowNodeTypeLabel,
} from "./workflowNodeLabeling.js";

const OBJECT_INFO_CACHE = new Map();
let OBJECT_INFO_ALL_PROMISE: any = null;

export async function ensureWorkflowObjectInfo(workflow: any): Promise<unknown> {
    const types = Array.from(
        new Set(
            getWorkflowNodes(workflow)
                .map((node: any) => getNodeType(node))
                .filter(Boolean),
        ),
    );
    if (!types.length) return;
    const missing = types.filter((type: any) => !OBJECT_INFO_CACHE.has(type));
    if (!missing.length) return;
    try {
        if (!OBJECT_INFO_ALL_PROMISE) {
            OBJECT_INFO_ALL_PROMISE = fetchHostApi("/object_info")
                .then((res: any) => (res?.ok ? res.json() : null))
                .then((data: any) => {
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

export function resolveAssetWorkflow(asset: any): any {
    const candidates = _collectWorkflowCandidates(asset);
    const promptGraph = _resolveAssetPromptGraph(asset);
    for (const candidate of candidates) {
        const parsed = _coerceObject(candidate);
        const workflow = _normalizeWorkflow(parsed);
        if (workflow) {
            _decorateWorkflowPromptInputs(workflow, promptGraph);
            _decorateWorkflowSubgraphNames(workflow);
            return workflow;
        }
    }
    return null;
}

export function getWorkflowNodes(workflow: any, options: any = null): unknown[] {
    const includeSubgraphs = options?.includeSubgraphs !== false;
    const nodes = Array.isArray(workflow?.nodes) ? workflow.nodes.filter(Boolean) : [];
    if (!includeSubgraphs) return nodes;
    const out = [...nodes];
    const definitions = _getSubgraphDefinitions(workflow);
    for (const node of nodes) {
        const subgraph = _getNodeSubgraph(workflow, node, definitions);
        if (!subgraph) continue;
        out.push(...getWorkflowNodes(subgraph, options));
    }
    return out;
}

export function findWorkflowNode(workflow: any, nodeId: any, options: any = null): any {
    const includeSubgraphs = options?.includeSubgraphs !== false;
    const wanted = String(nodeId ?? "");
    if (!wanted) return null;
    if (!includeSubgraphs) {
        return (
            (Array.isArray(workflow?.nodes) ? workflow.nodes : []).find(
                (node: any) => String(node?.id ?? node?.ID ?? "") === wanted,
            ) || null
        );
    }
    if (wanted.includes("::")) {
        return _findWorkflowNodeByPath(workflow, wanted.split("::").filter(Boolean));
    }
    const direct =
        (Array.isArray(workflow?.nodes) ? workflow.nodes : []).find(
            (node: any) => String(node?.id ?? node?.ID ?? "") === wanted,
        ) || null;
    if (direct) return direct;
    for (const node of Array.isArray(workflow?.nodes) ? workflow.nodes : []) {
        const subgraph = _getNodeSubgraph(workflow, node, _getSubgraphDefinitions(workflow));
        const found = subgraph ? findWorkflowNode(subgraph, wanted) : null;
        if (found) return found;
    }
    return null;
}

export function getNodeDisplayName(node: any): string {
    return getWorkflowNodeDisplayName(node);
}

export function getNodeType(node: any): string {
    return getWorkflowNodeRawType(node);
}

export function getNodeTypeLabel(node: any) {
    return getWorkflowNodeTypeLabel(node);
}

export function getNodeParamEntries(node: any) {
    const entries = _getNodeValueParamEntries(node);
    const properties = node?.properties && typeof node.properties === "object" ? node.properties : null;

    if (Array.isArray(node?._mjrSubgraphProxyParams)) {
        for (const entry of node._mjrSubgraphProxyParams) {
            const key = String(entry?.label || entry?.key || "").trim();
            if (!key || entries.some(([existingKey]) => String(existingKey) === key)) continue;
            entries.push([key, entry?.value]);
        }
    }

    if (properties) {
        for (const [key, value] of Object.entries(properties)) {
            if (_propertyKeyIsTechnical(key)) continue;
            if (value == null || typeof value === "object") continue;
            entries.push([key, value]);
        }
    }

    return entries.slice(0, 160);
}

function _getNodeValueParamEntries(node: any) {
    const entries = [];
    const promptInputs =
        node?._mjrPromptInputs && typeof node._mjrPromptInputs === "object" ? node._mjrPromptInputs : null;
    const inputs = node?.inputs && typeof node.inputs === "object" ? node.inputs : null;

    if (promptInputs && !Array.isArray(promptInputs)) {
        for (const [key, value] of Object.entries(promptInputs)) {
            if (_valueLooksLikePromptLink(value)) continue;
            entries.push([key, value]);
        }
    }

    if (inputs && !Array.isArray(inputs)) {
        for (const [key, value] of Object.entries(inputs)) {
            if (_valueLooksLikePromptLink(value)) continue;
            if (entries.some(([existingKey]) => String(existingKey) === String(key))) continue;
            entries.push([key, value]);
        }
    }

    for (const { label, value } of getNodeWidgetValueEntries(node)) {
        if (entries.some(([key]) => String(key) === String(label))) continue;
        entries.push([label, value]);
    }

    return entries;
}

export function getNodeWidgetValueEntries(node: any) {
    const widgetsValuesRaw = node?.widgets_values;
    if (_isPlainObjectWidgetsMap(widgetsValuesRaw)) {
        return Object.entries(widgetsValuesRaw).map(([label, value], index) => ({ label, value, index }));
    }
    const widgetsValues = _coerceWidgetValuesArray(widgetsValuesRaw);
    const widgets = Array.isArray(node?.widgets) ? node.widgets : [];
    const objectInfo = getNodeObjectInfo(node);
    const objectInputNames = getObjectInfoWidgetInputNames(objectInfo);
    const inputSlotNames = getNodeInputSlotNames(node);
    return widgetsValues.map((value, index) => {
        const guessedLabel = _guessWidgetLabel(node, index, value);
        const label =
            inputSlotNames[index] ||
            widgets[index]?.name ||
            widgets[index]?.label ||
            objectInputNames[index] ||
            guessedLabel ||
            `param ${index + 1}`;
        return { label, value, index };
    });
}

function _isPlainObjectWidgetsMap(widgetsValuesRaw: any) {
    return Boolean(
        widgetsValuesRaw &&
            typeof widgetsValuesRaw === "object" &&
            !Array.isArray(widgetsValuesRaw) &&
            !_looksArrayLikeWidgetsValues(widgetsValuesRaw),
    );
}

function _coerceWidgetValuesArray(widgetsValuesRaw: any) {
    if (Array.isArray(widgetsValuesRaw)) return widgetsValuesRaw;
    if (!_looksArrayLikeWidgetsValues(widgetsValuesRaw)) return [];
    const length = Math.max(0, Math.floor(Number(widgetsValuesRaw.length) || 0));
    const out = [];
    for (let index = 0; index < length; index += 1) {
        out.push(widgetsValuesRaw[index]);
    }
    return out;
}

function _looksArrayLikeWidgetsValues(widgetsValuesRaw: any) {
    if (!widgetsValuesRaw || typeof widgetsValuesRaw !== "object" || Array.isArray(widgetsValuesRaw)) return false;
    const length = Number(widgetsValuesRaw.length);
    if (!Number.isFinite(length) || length < 0) return false;
    return true;
}

export function getNodeInputSlotNames(node: any) {
    const inputs = Array.isArray(node?.inputs) ? node.inputs : [];
    const widgetInputs = inputs.filter(_inputLooksLikeWidget);
    const labelSource: any[] = [];
    const seen = new Set();
    const addInput = (input: any) => {
        const key = `${String(input?.name || "")}\u0000${String(input?.label || "")}\u0000${String(input?.link ?? "")}`;
        if (seen.has(key)) return;
        seen.add(key);
        labelSource.push(input);
    };
    for (const input of widgetInputs) addInput(input);
    return labelSource.map((input: any) =>
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

function _valueLooksLikePromptLink(value: any) {
    return (
        Array.isArray(value) &&
        value.length === 2 &&
        String(value[0] ?? "").trim() !== "" &&
        Number.isFinite(Number(value[1]))
    );
}

function _propertyKeyIsTechnical(key: any) {
    const text = String(key ?? "").trim();
    const normalized = _normalizeParamName(text);
    if (!normalized) return true;
    return (
        normalized === "cnr_id" ||
        normalized === "ver" ||
        normalized === "node_name_for_s&r" ||
        normalized === "subgraph_name" ||
        normalized === "subgraph_id" ||
        normalized === "enabletabs" ||
        normalized === "tabwidth" ||
        normalized === "tabxoffset" ||
        normalized === "hassecondtab" ||
        normalized === "secondtabtext" ||
        normalized === "secondtaboffset" ||
        normalized === "secondtabwidth" ||
        normalized.startsWith("ue_")
    );
}

export function getNodeObjectInfo(node: any) {
    const type = getNodeType(node);
    return type ? OBJECT_INFO_CACHE.get(type) || null : null;
}

export function getObjectInfoInputNames(info: any) {
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
            .flatMap((section: any) =>
                input[section] && typeof input[section] === "object"
                    ? Object.keys(input[section])
                    : [],
            )
            .filter(Boolean);
    }
    return [];
}

export function getObjectInfoWidgetInputNames(info: any) {
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

function _inputLooksLikeWidget(input: any) {
    if (!input || typeof input !== "object") return false;
    if (input.widget === true) return true;
    if (input.widget && typeof input.widget === "object") return true;
    if (typeof input.widget === "string" && input.widget.trim()) return true;
    if (input.widget_index != null || input.widgetIndex != null) return true;
    return false;
}

function _inputHasLink(input: any) {
    if (!input || typeof input !== "object") return false;
    if (input.link != null) return true;
    if (Array.isArray(input.links) && input.links.length) return true;
    return false;
}

function _objectInfoInputLooksWidget(config: any) {
    const tuple = Array.isArray(config) ? config : [];
    const type = tuple[0];
    const options =
        tuple[1] && typeof tuple[1] === "object" && !Array.isArray(tuple[1]) ? tuple[1] : null;
    if (options?.forceInput === true) return false;
    if (options?.rawLink === true) return false;
    if (options?.widgetType && String(options.widgetType).trim()) return true;
    return _inputTypeLooksWidgetCapable(type);
}

function _inputTypeLooksWidgetCapable(type: any) {
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

function _guessWidgetLabel(node: any, index: any, value: any) {
    const type = getNodeType(node);
    const title = getNodeDisplayName(node);
    const haystack = `${type} ${title}`.toLowerCase();
    const valueText = String(value ?? "").toLowerCase();
    if (haystack.includes("ksamplerselect")) return "sampler_name";
    if (haystack.includes("ksampler")) {
        return [
            "seed",
            "control_after_generate",
            "steps",
            "cfg",
            "sampler_name",
            "scheduler",
            "denoise",
        ][index] || null;
    }
    if (haystack.includes("manualsigmas")) return "sigmas";
    if (haystack.includes("randomnoise")) return index === 0 ? "noise_seed" : index === 1 ? "control_after_generate" : null;
    if (haystack.includes("cfgguider")) return "cfg";
    if (haystack.includes("loraloadermodelonly")) return index === 0 ? "lora_name" : index === 1 ? "strength_model" : null;
    if (haystack.includes("resizeimagesbylongeredge")) return "longer_edge";
    if (haystack.includes("vaedecodetiled")) {
        return ["tile_size", "overlap", "temporal_size", "temporal_overlap"][index] || null;
    }
    if (haystack.includes("textencoderloader") || haystack.includes("text encoder loader")) {
        if (index === 0) return "text_encoder";
        if (index === 1) return "ckpt_name";
        if (index === 2) return "device";
    }
    if (/primitive(?:int|float|string|boolean)|constant/.test(haystack) && index === 0) {
        const titleLabel = _normalizeParamName(title);
        return titleLabel && titleLabel !== _normalizeParamName(type) ? titleLabel : "value";
    }
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

function _collectWorkflowCandidates(asset: any) {
    const raw = _coerceObject(asset?.metadata_raw);
    const meta = _coerceObject(asset?.metadata);
    return [
        asset?.workflow,
        asset?.Workflow,
        asset?.comfy_workflow,
        asset?.workflow_json,
        asset?.template,
        asset?.Template,
        asset?.comfy_template,
        asset?.subgraph,
        asset?.Subgraph,
        asset?.comfy_subgraph,
        raw?.workflow,
        raw?.Workflow,
        raw?.comfy_workflow,
        raw?.workflow_json,
        raw?.template,
        raw?.Template,
        raw?.comfy_template,
        raw?.subgraph,
        raw?.Subgraph,
        raw?.comfy_subgraph,
        raw?.comfyui,
        raw?.ComfyUI,
        meta?.workflow,
        meta?.Workflow,
        meta?.comfy_workflow,
        meta?.workflow_json,
        meta?.template,
        meta?.Template,
        meta?.comfy_template,
        meta?.subgraph,
        meta?.Subgraph,
        meta?.comfy_subgraph,
        asset?.prompt,
        raw?.prompt,
        raw?.Prompt,
        meta?.prompt,
        meta?.Prompt,
    ].filter((value: any) => value != null);
}

function _resolveAssetPromptGraph(asset: any) {
    const raw = _coerceObject(asset?.metadata_raw);
    const meta = _coerceObject(asset?.metadata);
    const candidates = [
        asset?.prompt,
        asset?.Prompt,
        raw?.prompt,
        raw?.Prompt,
        meta?.prompt,
        meta?.Prompt,
    ];
    for (const candidate of candidates) {
        const parsed = _coerceObject(candidate);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    }
    return null;
}

function _coerceObject(value: any) {
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

function _normalizeWorkflow(value: any) {
    if (!value || typeof value !== "object") return null;
    if (Array.isArray(value.nodes)) return value;
    const graphLike = _getFirstGraphLikeObject(value);
    if (graphLike) {
        return graphLike;
    }
    if (value.prompt && typeof value.prompt === "object") {
        return synthesizeWorkflowFromPromptGraph(value.prompt);
    }
    const synthesized = synthesizeWorkflowFromPromptGraph(value);
    return synthesized && Array.isArray(synthesized.nodes) ? synthesized : null;
}

function _getFirstGraphLikeObject(value: any) {
    for (const key of ["workflow", "Workflow", "template", "Template", "subgraph", "Subgraph", "graph", "lgraph"]) {
        const candidate = value?.[key];
        if (candidate && typeof candidate === "object" && Array.isArray(candidate.nodes)) return candidate;
    }
    return null;
}

function _decorateWorkflowSubgraphNames(workflow: any, visited = new WeakSet()) {
    if (!workflow || typeof workflow !== "object") return;
    if (visited.has(workflow)) return;
    visited.add(workflow);
    const definitions = _getSubgraphDefinitions(workflow);
    for (const node of Array.isArray(workflow?.nodes) ? workflow.nodes : []) {
        _applySubgraphDefinitionMetadata(node, definitions);
        const subgraph = _getNodeSubgraph(workflow, node, definitions);
        if (subgraph) {
            _decorateSubgraphProxyParams(node, subgraph);
            _decorateWorkflowSubgraphNames(subgraph, visited);
        }
    }
}

function _decorateWorkflowPromptInputs(workflow: any, promptGraph: any) {
    if (!workflow || typeof workflow !== "object" || !promptGraph || typeof promptGraph !== "object") return;
    const promptNodes = _getPromptNodeEntries(promptGraph);
    if (!promptNodes.length) return;
    _decorateWorkflowPromptInputsInGraph(workflow, promptNodes, new WeakSet());
}

function _decorateWorkflowPromptInputsInGraph(workflow: any, promptNodes: any[], visited: WeakSet<object>) {
    if (!workflow || typeof workflow !== "object" || visited.has(workflow)) return;
    visited.add(workflow);
    const definitions = _getSubgraphDefinitions(workflow);
    for (const node of Array.isArray(workflow?.nodes) ? workflow.nodes : []) {
        const match = _findPromptNodeMatch(node, promptNodes);
        if (match?.inputs && typeof match.inputs === "object" && !Array.isArray(match.inputs)) {
            node._mjrPromptInputs = match.inputs;
        }
        const subgraph = _getNodeSubgraph(workflow, node, definitions);
        if (subgraph) _decorateWorkflowPromptInputsInGraph(subgraph, promptNodes, visited);
    }
}

function _getPromptNodeEntries(promptGraph: any) {
    if (!promptGraph || typeof promptGraph !== "object" || Array.isArray(promptGraph)) return [];
    const entries = [];
    for (const [id, value] of Object.entries(promptGraph)) {
        if (!value || typeof value !== "object" || Array.isArray(value)) continue;
        const classType = String((value as any).class_type || (value as any).type || "").trim();
        const inputs = (value as any).inputs;
        if (!classType || !inputs || typeof inputs !== "object" || Array.isArray(inputs)) continue;
        const leafId = String(id).split(":").pop() || String(id);
        entries.push({ id: String(id), leafId, classType, inputs });
    }
    return entries;
}

function _findPromptNodeMatch(node: any, promptNodes: any[]) {
    const nodeId = String(node?.id ?? node?.ID ?? "").trim();
    const nodeType = _normalizeNodeTypeForPromptMatch(getNodeType(node));
    if (!nodeId || !nodeType) return null;
    const exact = promptNodes.find(
        (entry) => entry.id === nodeId && _normalizeNodeTypeForPromptMatch(entry.classType) === nodeType,
    );
    if (exact) return exact;
    const matches = promptNodes.filter(
        (entry) => entry.leafId === nodeId && _normalizeNodeTypeForPromptMatch(entry.classType) === nodeType,
    );
    return matches.length === 1 ? matches[0] : null;
}

function _normalizeNodeTypeForPromptMatch(value: any) {
    return String(value || "")
        .trim()
        .toLowerCase();
}

function _applySubgraphDefinitionMetadata(node: any, definitions: any) {
    if (!node || typeof node !== "object") return;
    const definitionKey = _getNodeSubgraphDefinitionKeys(node).find((key) => definitions.has(String(key)));
    if (!definitionKey) return;
    const definition = definitions.get(String(definitionKey));
    const name = String(
        definition?.name || definition?.title || node?.subgraph?.name || node?.subgraph_instance?.name || "",
    ).trim();
    if (!name) return;
    const props = node?.properties && typeof node.properties === "object" ? node.properties : (node.properties = {});
    if (!String(props.subgraph_name || "").trim()) props.subgraph_name = name;
    if (!String(props.subgraph_id || "").trim()) props.subgraph_id = definitionKey;
}

function _decorateSubgraphProxyParams(node: any, subgraph: any) {
    const proxyWidgets = Array.isArray(node?.properties?.proxyWidgets) ? node.properties.proxyWidgets : [];
    if (!proxyWidgets.length || !Array.isArray(subgraph?.nodes)) return;
    const nodeById = new Map(
        subgraph.nodes
            .filter(Boolean)
            .map((innerNode: any) => [String(innerNode?.id ?? innerNode?.ID ?? ""), innerNode]),
    );
    const exposedInputNames = _getExposedSubgraphWidgetInputNames(node);
    const inputLabelsByTarget = _buildSubgraphInputLabelsByTarget(subgraph);
    const params = [];
    for (let index = 0; index < proxyWidgets.length; index += 1) {
        const proxy = proxyWidgets[index];
        const innerId = Array.isArray(proxy) ? proxy[0] : proxy?.nodeId ?? proxy?.node_id ?? proxy?.id;
        const widgetName = Array.isArray(proxy) ? proxy[1] : proxy?.widget ?? proxy?.name ?? proxy?.widgetName;
        const innerNode = nodeById.get(String(innerId ?? ""));
        if (!innerNode) continue;
        const innerEntries = getNodeParamEntries(innerNode);
        if (!innerEntries.length) continue;
        const matched =
            innerEntries.find(([key]) => _normalizeParamName(key) === _normalizeParamName(widgetName)) ||
            innerEntries.find(([key]) => _normalizeParamName(key) === "value") ||
            (innerEntries.length === 1 ? innerEntries[0] : null);
        if (!matched) continue;
        const targetKey = `${String(innerId)}:${_getProxyTargetSlot(proxy, widgetName, matched[0])}`;
        const label =
            inputLabelsByTarget.get(targetKey) ||
            inputLabelsByTarget.get(String(innerId)) ||
            _getReadableProxyLabel(innerNode, matched[0], widgetName);
        if (exposedInputNames.size && !exposedInputNames.has(_normalizeParamName(label))) continue;
        params.push({ label, value: matched[1], innerNodeId: innerId, widgetName });
    }
    if (params.length) node._mjrSubgraphProxyParams = params;
}

function _getExposedSubgraphWidgetInputNames(node: any) {
    const inputs = Array.isArray(node?.inputs) ? node.inputs : [];
    const names = new Set();
    for (const input of inputs) {
        if (!_inputLooksLikeWidget(input)) continue;
        const label = String(input?.label || input?.localized_name || input?.name || "").trim();
        if (label) names.add(_normalizeParamName(label));
    }
    return names;
}

function _buildSubgraphInputLabelsByTarget(subgraph: any) {
    const inputs = Array.isArray(subgraph?.inputs) ? subgraph.inputs : [];
    const links = Array.isArray(subgraph?.links) ? subgraph.links : [];
    const map = new Map();
    for (const link of links) {
        const originId = Array.isArray(link) ? link[1] : link?.origin_id ?? link?.originId ?? link?.from;
        if (String(originId) !== "-10") continue;
        const originSlot = Number(Array.isArray(link) ? link[2] : link?.origin_slot ?? link?.originSlot ?? link?.fromSlot);
        const targetId = Array.isArray(link) ? link[3] : link?.target_id ?? link?.targetId ?? link?.to;
        const targetSlot = Number(Array.isArray(link) ? link[4] : link?.target_slot ?? link?.targetSlot ?? link?.toSlot);
        const input = Number.isFinite(originSlot) ? inputs[originSlot] : null;
        const label = String(input?.label || input?.localized_name || input?.name || "").trim();
        if (!label || targetId == null) continue;
        if (_normalizeParamName(label) === "value") continue;
        map.set(String(targetId), label);
        if (Number.isFinite(targetSlot)) map.set(`${String(targetId)}:${targetSlot}`, label);
    }
    return map;
}

function _getProxyTargetSlot(proxy: any, widgetName: any, matchedKey: any) {
    if (proxy && typeof proxy === "object" && !Array.isArray(proxy)) {
        const slot = proxy.target_slot ?? proxy.targetSlot ?? proxy.slot;
        if (Number.isFinite(Number(slot))) return Number(slot);
    }
    void widgetName;
    void matchedKey;
    return 0;
}

function _getReadableProxyLabel(innerNode: any, matchedKey: any, widgetName: any) {
    const title = String(getNodeDisplayName(innerNode) || "").trim();
    const key = String(matchedKey || widgetName || "").trim();
    if (title && key && _normalizeParamName(key) !== "value") return `${title} ${key}`;
    return title || key || "param";
}

function _normalizeParamName(value: any) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");
}

function _getSubgraphDefinitions(workflow: any) {
    const defs = [
        ...(Array.isArray(workflow?.definitions?.subgraphs) ? workflow.definitions.subgraphs : []),
        ...(Array.isArray(workflow?.subgraphs) ? workflow.subgraphs : []),
        ...(Array.isArray(workflow?.rootGraph?.subgraphs) ? workflow.rootGraph.subgraphs : []),
    ];
    const map = new Map();
    for (const def of defs) {
        for (const id of _getSubgraphDefinitionKeys(def)) {
            if (id != null) map.set(String(id), def);
        }
    }
    return map;
}

function _getSubgraphDefinitionKeys(def: any) {
    const props = def?.properties && typeof def.properties === "object" ? def.properties : {};
    return [
        def?.id,
        def?.name,
        def?.title,
        def?.type,
        def?.uuid,
        def?.workflowId,
        def?.workflow_id,
        props.subgraph_id,
        props.subgraphId,
    ].filter((id) => id != null && String(id).trim());
}

function _getNodeSubgraphDefinitionKeys(node: any) {
    const props = node?.properties && typeof node.properties === "object" ? node.properties : {};
    return [
        node?.type,
        node?.class_type,
        node?.subgraph_id,
        node?.subgraphId,
        props.subgraph_id,
        props.subgraphId,
        props.subgraph_name,
    ].filter((id) => id != null && String(id).trim());
}

function _getNodeSubgraph(workflow: any, node: any, definitions = _getSubgraphDefinitions(workflow)) {
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
        ..._getNodeSubgraphDefinitionKeys(node).map((key) => definitions.get(String(key))),
    ];
    for (const candidate of candidates) {
        if (candidate && typeof candidate === "object" && Array.isArray(candidate.nodes)) return candidate;
    }
    if (Array.isArray(node?.nodes)) return { nodes: node.nodes };
    return null;
}

function _findWorkflowNodeByPath(workflow: any, idPath: any[]) {
    let cursorGraph = workflow;
    let resolvedNode = null;
    for (let index = 0; index < idPath.length; index += 1) {
        const idPart = String(idPath[index] ?? "").trim();
        if (!idPart) return null;
        resolvedNode =
            (Array.isArray(cursorGraph?.nodes) ? cursorGraph.nodes : []).find(
                (node: any) => String(node?.id ?? node?.ID ?? "") === idPart,
            ) || null;
        if (!resolvedNode) return null;
        if (index >= idPath.length - 1) break;
        const subgraph = _getNodeSubgraph(cursorGraph, resolvedNode, _getSubgraphDefinitions(cursorGraph));
        if (!subgraph) return null;
        cursorGraph = subgraph;
    }
    return resolvedNode;
}
