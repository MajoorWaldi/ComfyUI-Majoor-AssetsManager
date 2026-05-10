const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_HASH_RE = /^[0-9a-f]{20,}$/i;

function _firstText(...values) {
    for (const value of values) {
        const text = String(value || "").trim();
        if (text) return text;
    }
    return "";
}

export function isOpaqueWorkflowNodeType(type) {
    const text = String(type || "").trim();
    return Boolean(text) && (UUID_RE.test(text) || HEX_HASH_RE.test(text));
}

export function getWorkflowNodeRawType(node) {
    return String(node?.type || node?.class_type || node?.comfyClass || node?.classType || "").trim();
}

export function getWorkflowNodeTitle(node) {
    return _firstText(
        node?.properties?.subgraph_name,
        node?.title,
        node?.properties?.title,
        node?.properties?.name,
        node?.properties?.label,
        node?.name,
        node?.subgraph?.name,
        node?.subgraph_instance?.name,
    );
}

export function getWorkflowNodeDisplayName(node) {
    const type = getWorkflowNodeRawType(node);
    const title = getWorkflowNodeTitle(node);
    if (title && (!type || isOpaqueWorkflowNodeType(type) || title !== type)) return title;
    if (type && !isOpaqueWorkflowNodeType(type)) return type;
    if (title) return title;
    if (type) return "Subgraph";
    return String(node?.id || "Node").trim() || "Node";
}

export function getWorkflowNodeTypeLabel(node) {
    const type = getWorkflowNodeRawType(node);
    if (type && !isOpaqueWorkflowNodeType(type)) return type;
    return type ? "Subgraph" : "Node";
}
