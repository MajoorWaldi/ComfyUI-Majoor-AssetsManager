/**
 * Loose shape for a ComfyUI workflow graph (the litegraph-serialized JSON
 * embedded in saved images/workflows) and the legacy "prompt graph" API
 * payload format, as read by the workflow minimap and sidebar sections.
 *
 * Both formats are third-party/backend-owned and vary across ComfyUI
 * versions and custom nodes, so this documents the fields actually read
 * here rather than the full litegraph schema.
 */
export interface ComfyWorkflowNodeLike {
    id?: unknown;
    key?: unknown;
    title?: string;
    type?: string;
    class_type?: string;
    name?: string;
    _meta?: { title?: string };
    inputs?: unknown;
    widgets_values?: unknown;
    [key: string]: unknown;
}

export interface ComfyWorkflowLike {
    nodes?: ComfyWorkflowNodeLike[];
    links?: unknown[];
    groups?: unknown[];
    extra?: {
        links?: unknown[];
        groups?: unknown[];
        groupNodes?: unknown[];
        group_nodes?: unknown[];
        synthetic?: boolean;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

/** The legacy `/prompt`-style execution graph: a map of node id -> node record. */
export type ComfyPromptGraphLike = Record<string, ComfyWorkflowNodeLike>;
