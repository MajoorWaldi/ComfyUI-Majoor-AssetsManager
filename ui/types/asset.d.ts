/**
 * Shared shape for the asset objects passed around the Vue layer (grid cards,
 * sidebar sections, viewer metadata, collections). The backend's asset schema
 * is large and varies by kind (image/video/audio/model3d/workflow/folder), so
 * this intentionally keeps every field optional and falls back to `unknown`
 * for anything not explicitly modeled rather than pretending to be exhaustive.
 *
 * Use this instead of a bare `any` for an `asset` prop/param — it documents
 * the fields components actually read while still accepting the real backend
 * payload without fighting the type checker.
 */
export interface MjrAssetLike {
    id?: unknown;
    filename?: string;
    display_name?: string;
    displayName?: string;
    name?: string;
    title?: string;
    kind?: string;
    source?: string;
    scope?: string;
    type?: string;
    filepath?: string;
    path?: string;
    full_path?: string;
    subfolder?: string;
    root_id?: string;
    rating?: unknown;
    tags?: unknown;
    notes?: string;
    favorite?: unknown;
    width?: unknown;
    height?: unknown;
    duration?: unknown;
    size?: unknown;
    size_bytes?: unknown;
    mtime?: unknown;
    created_at?: unknown;
    generation_time?: unknown;
    file_creation_time?: unknown;
    generation_time_ms?: unknown;
    positive_prompt?: string;
    negative_prompt?: string;
    workflow?: unknown;
    Workflow?: unknown;
    comfy_workflow?: unknown;
    prompt?: unknown;
    Prompt?: unknown;
    metadata_raw?: unknown;
    metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
    task?: string;
    workflow_task?: string;
    model_family?: string;
    workflow_model_family?: string;
    provider?: string;
    workflow_provider?: string;
    runs_on?: string;
    runsOn?: string;
    node_count?: unknown;
    nodeCount?: unknown;
    subgraph_count?: unknown;
    subgraphCount?: unknown;
    missing_nodes?: unknown;
    missingNodes?: unknown;
    missing_models?: unknown;
    missingModels?: unknown;
    missing_nodes_count?: unknown;
    missingNodesCount?: unknown;
    missing_models_count?: unknown;
    missingModelsCount?: unknown;
    usage_count?: unknown;
    usageCount?: unknown;
    last_loaded_at?: unknown;
    lastLoadedAt?: unknown;
    updated_at?: unknown;
    category?: string;
    folder?: string;
    folder_info?: Record<string, unknown>;
    folderInfo?: Record<string, unknown>;
    stack_id?: string;
    stack_asset_count?: unknown;
    file_info?: Record<string, unknown>;
    thumbnail_url?: string;
    graph_map_thumbnail_url?: string;
    thumb_url?: string;
    poster?: string;
    preview_url?: string;
    previewUrl?: string;
    url?: string;
    job_id?: string;
    source_node_id?: string;
    source_node_type?: string;
    workflow_id?: string;
    detected_task?: string;
    detected_model_family?: string;
    detected_provider?: string;
    [key: string]: unknown;
}
