/**
 * Shapes for the collections/AI-clustering domain objects passed around
 * CollectionsPopover.vue and AddToCollectionMenu.vue: the backend's
 * collection records, the vector-search "smart suggestion" catalog
 * entries, and the AI-clustering results.
 */
export interface MjrCollectionItem {
    id?: unknown;
    name?: unknown;
    count?: unknown;
    [key: string]: unknown;
}

export interface MjrAddCollectionResult {
    ok?: boolean;
    error?: string;
    data?: {
        added?: number;
        skipped_existing?: number;
        skipped_duplicate?: number;
        [key: string]: unknown;
    };
}

/** One entry from SMART_COLLECTION_IDEAS -- a canned vector-search query offered as a one-click collection. */
export interface MjrSmartCollectionIdea {
    key?: string;
    label?: string;
    iconClass?: string;
    query?: string;
}

/** One AI-detected visual-similarity group from vectorSuggestCollections(). */
export interface MjrCluster {
    cluster_id?: unknown;
    _label?: string;
    size?: unknown;
    sample_assets?: unknown[];
    all_asset_ids?: unknown[];
    [key: string]: unknown;
}
