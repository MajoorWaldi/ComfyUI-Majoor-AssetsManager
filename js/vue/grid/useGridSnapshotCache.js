const GRID_SNAPSHOT_CACHE = new Map();
const GRID_SNAPSHOT_CACHE_ENABLED = false;
const GRID_SNAPSHOT_CACHE_MAX = 8;
const GRID_SNAPSHOT_STORAGE_ASSET_LIMIT = 200;
const GRID_SNAPSHOT_STORAGE_KEY = "mjr_grid_snapshot_cache_v2";
const GRID_SNAPSHOT_TTL_MS = 30 * 60 * 1000;
const GRID_SNAPSHOT_PERSIST_DEBOUNCE_MS = 1500;

let gridSnapshotStorageLoaded = false;
let gridSnapshotPersistTimer = null;
let gridSnapshotPersistPending = false;

function isGridSnapshotCacheEnabled() {
    return GRID_SNAPSHOT_CACHE_ENABLED;
}

function clearStoredGridSnapshots() {
    try {
        GRID_SNAPSHOT_CACHE.clear();
        const storage = gridSnapshotStorage();
        storage?.removeItem?.(GRID_SNAPSHOT_STORAGE_KEY);
        globalThis?.sessionStorage?.removeItem?.(GRID_SNAPSHOT_STORAGE_KEY);
    } catch (e) {
        console.debug?.(e);
    }
}

const GRID_SNAPSHOT_ASSET_FIELDS = [
    "id",
    "filename",
    "name",
    "filepath",
    "path",
    "fullpath",
    "full_path",
    "subfolder",
    "source",
    "type",
    "root_id",
    "custom_root_id",
    "kind",
    "ext",
    "size",
    "mtime",
    "generation_time",
    "file_creation_time",
    "created_at",
    "updated_at",
    "indexed_at",
    "width",
    "height",
    "duration",
    "thumbnail_url",
    "thumb_url",
    "poster",
    "url",
    "rating",
    "tags",
    "has_workflow",
    "hasWorkflow",
    "has_generation_data",
    "hasGenerationData",
    "workflow_type",
    "workflowType",
    "generation_time_ms",
    "positive_prompt",
    "enhanced_caption",
    "auto_tags",
    "has_ai_info",
    "has_ai_vector",
    "has_ai_auto_tags",
    "has_ai_enhanced_caption",
    "job_id",
    "stack_id",
    "source_node_id",
    "source_node_type",
    "date",
    "date_exact",
];

function normalizeSnapshotPart(value, fallback = "") {
    try {
        return String(value ?? fallback).trim();
    } catch {
        return String(fallback);
    }
}

export function buildGridSnapshotKey(parts = {}) {
    return JSON.stringify({
        scope: normalizeSnapshotPart(parts.scope || "output", "output"),
        query: normalizeSnapshotPart(parts.query || parts.q || "*", "*"),
        customRootId: normalizeSnapshotPart(parts.customRootId || ""),
        subfolder: normalizeSnapshotPart(parts.subfolder || ""),
        collectionId: normalizeSnapshotPart(parts.collectionId || ""),
        viewScope: normalizeSnapshotPart(parts.viewScope || ""),
        kind: normalizeSnapshotPart(parts.kind || ""),
        workflowOnly: normalizeSnapshotPart(parts.workflowOnly ? "1" : ""),
        minRating: normalizeSnapshotPart(parts.minRating || ""),
        minSizeMB: normalizeSnapshotPart(parts.minSizeMB || ""),
        maxSizeMB: normalizeSnapshotPart(parts.maxSizeMB || ""),
        resolutionCompare: normalizeSnapshotPart(parts.resolutionCompare || ""),
        minWidth: normalizeSnapshotPart(parts.minWidth || ""),
        minHeight: normalizeSnapshotPart(parts.minHeight || ""),
        maxWidth: normalizeSnapshotPart(parts.maxWidth || ""),
        maxHeight: normalizeSnapshotPart(parts.maxHeight || ""),
        workflowType: normalizeSnapshotPart(parts.workflowType || "").toUpperCase(),
        dateRange: normalizeSnapshotPart(parts.dateRange || ""),
        dateExact: normalizeSnapshotPart(parts.dateExact || ""),
        sort: normalizeSnapshotPart(parts.sort || "mtime_desc", "mtime_desc"),
        semanticMode: normalizeSnapshotPart(parts.semanticMode ? "1" : ""),
    });
}

export function compactSnapshotAsset(asset) {
    if (!asset || typeof asset !== "object") return null;
    const out = {};
    for (const field of GRID_SNAPSHOT_ASSET_FIELDS) {
        if (asset[field] !== undefined) out[field] = asset[field];
    }
    if (!out.type && out.source) out.type = out.source;
    if (!out.source && out.type) out.source = out.type;
    if (!out.kind) out.kind = asset.kind || "image";
    if (Array.isArray(out.tags)) out.tags = out.tags.slice(0, 80);
    if (Array.isArray(out.auto_tags)) out.auto_tags = out.auto_tags.slice(0, 80);
    return out;
}

export function normalizeGridSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return null;
    const at = Number(snapshot.at || 0) || 0;
    if (!at || Date.now() - at > GRID_SNAPSHOT_TTL_MS) return null;
    const assets = Array.isArray(snapshot.assets)
        ? snapshot.assets.map(compactSnapshotAsset).filter(Boolean)
        : [];
    if (!assets.length) return null;
    const totalRaw = Number(snapshot.total ?? assets.length);
    const offsetRaw = Number(snapshot.offset ?? assets.length);
    return {
        assets,
        title: normalizeSnapshotPart(snapshot.title || "Cached", "Cached"),
        at,
        total: Number.isFinite(totalRaw) ? Math.max(0, totalRaw) : assets.length,
        offset: Number.isFinite(offsetRaw) ? Math.max(assets.length, offsetRaw) : assets.length,
        done: !!snapshot.done,
        query: normalizeSnapshotPart(snapshot.query || "*", "*"),
    };
}

function gridSnapshotStorage() {
    try {
        return globalThis?.localStorage || null;
    } catch {
        return null;
    }
}

if (!isGridSnapshotCacheEnabled()) {
    clearStoredGridSnapshots();
}

function migrateLegacySessionSnapshots(storage) {
    try {
        const legacy = globalThis?.sessionStorage;
        if (!legacy || !storage) return;
        const raw = legacy.getItem?.(GRID_SNAPSHOT_STORAGE_KEY);
        if (!raw) return;
        if (!storage.getItem?.(GRID_SNAPSHOT_STORAGE_KEY)) {
            storage.setItem(GRID_SNAPSHOT_STORAGE_KEY, raw);
        }
        legacy.removeItem(GRID_SNAPSHOT_STORAGE_KEY);
    } catch (e) {
        console.debug?.(e);
    }
}

function pruneGridSnapshotCache() {
    const now = Date.now();
    for (const [key, snapshot] of GRID_SNAPSHOT_CACHE.entries()) {
        const at = Number(snapshot?.at || 0) || 0;
        if (!at || now - at > GRID_SNAPSHOT_TTL_MS) {
            GRID_SNAPSHOT_CACHE.delete(key);
        }
    }
    while (GRID_SNAPSHOT_CACHE.size > GRID_SNAPSHOT_CACHE_MAX) {
        const oldestKey = GRID_SNAPSHOT_CACHE.keys().next().value;
        if (!oldestKey) break;
        GRID_SNAPSHOT_CACHE.delete(oldestKey);
    }
}

function loadGridSnapshotsFromStorage() {
    if (!isGridSnapshotCacheEnabled()) {
        gridSnapshotStorageLoaded = true;
        clearStoredGridSnapshots();
        return;
    }
    if (gridSnapshotStorageLoaded) return;
    gridSnapshotStorageLoaded = true;
    try {
        const storage = gridSnapshotStorage();
        migrateLegacySessionSnapshots(storage);
        const raw = storage?.getItem?.(GRID_SNAPSHOT_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const entries = Array.isArray(parsed?.entries) ? parsed.entries : [];
        for (const entry of entries) {
            if (!Array.isArray(entry) || entry.length < 2) continue;
            const key = String(entry[0] || "");
            const snapshot = normalizeGridSnapshot(entry[1]);
            if (key && snapshot) GRID_SNAPSHOT_CACHE.set(key, snapshot);
        }
        pruneGridSnapshotCache();
    } catch (e) {
        console.debug?.(e);
    }
}

function persistGridSnapshotsToStorageNow() {
    if (!isGridSnapshotCacheEnabled()) {
        clearStoredGridSnapshots();
        return;
    }
    try {
        pruneGridSnapshotCache();
        const storage = gridSnapshotStorage();
        if (!storage) return;
        const entries = Array.from(GRID_SNAPSHOT_CACHE.entries()).map(([key, snapshot]) => [
            key,
            {
                ...snapshot,
                assets: Array.isArray(snapshot?.assets)
                    ? snapshot.assets.slice(0, GRID_SNAPSHOT_STORAGE_ASSET_LIMIT)
                    : [],
            },
        ]);
        storage.setItem(GRID_SNAPSHOT_STORAGE_KEY, JSON.stringify({ entries }));
    } catch (e) {
        console.debug?.(e);
    }
}

function persistGridSnapshotsToStorage() {
    if (!isGridSnapshotCacheEnabled()) {
        clearStoredGridSnapshots();
        gridSnapshotPersistPending = false;
        return;
    }
    gridSnapshotPersistPending = true;
    if (gridSnapshotPersistTimer) return;
    gridSnapshotPersistTimer = setTimeout(() => {
        gridSnapshotPersistTimer = null;
        if (!gridSnapshotPersistPending) return;
        gridSnapshotPersistPending = false;
        persistGridSnapshotsToStorageNow();
    }, GRID_SNAPSHOT_PERSIST_DEBOUNCE_MS);
}

export function flushGridSnapshotsPersist() {
    if (gridSnapshotPersistTimer) {
        clearTimeout(gridSnapshotPersistTimer);
        gridSnapshotPersistTimer = null;
    }
    if (!gridSnapshotPersistPending) return;
    gridSnapshotPersistPending = false;
    persistGridSnapshotsToStorageNow();
}

export function getGridSnapshot(key) {
    if (!isGridSnapshotCacheEnabled()) return null;
    loadGridSnapshotsFromStorage();
    const snapshot = normalizeGridSnapshot(GRID_SNAPSHOT_CACHE.get(key));
    if (!snapshot) {
        GRID_SNAPSHOT_CACHE.delete(key);
        persistGridSnapshotsToStorage();
        return null;
    }
    GRID_SNAPSHOT_CACHE.delete(key);
    GRID_SNAPSHOT_CACHE.set(key, snapshot);
    persistGridSnapshotsToStorage();
    return snapshot;
}

export function hasGridSnapshot(key) {
    if (!isGridSnapshotCacheEnabled()) return false;
    loadGridSnapshotsFromStorage();
    return !!normalizeGridSnapshot(GRID_SNAPSHOT_CACHE.get(key));
}

export function rememberGridSnapshot(key, snapshot) {
    if (!isGridSnapshotCacheEnabled()) return false;
    if (!key || !snapshot || typeof snapshot !== "object") return false;
    const normalized = normalizeGridSnapshot({
        ...snapshot,
        at: snapshot.at || Date.now(),
    });
    if (!normalized) return false;
    GRID_SNAPSHOT_CACHE.delete(key);
    GRID_SNAPSHOT_CACHE.set(key, normalized);
    persistGridSnapshotsToStorage();
    return true;
}

export function resetGridSnapshotCacheForTests() {
    GRID_SNAPSHOT_CACHE.clear();
    gridSnapshotStorageLoaded = false;
    gridSnapshotPersistPending = false;
    if (gridSnapshotPersistTimer) clearTimeout(gridSnapshotPersistTimer);
    gridSnapshotPersistTimer = null;
}
