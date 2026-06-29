const DB_NAME = "mjr-asset-cache";
const DB_VERSION = 1;
const STORE = "snapshots";
const MAX_ENTRIES = 24;
const MAX_ASSETS = 500;
const TTL_MS = 45 * 60 * 1000;

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve) => {
        try {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "key" });
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        } catch {
            resolve(null);
        }
    });
    return dbPromise;
}

function compactAsset(asset: any) {
    if (!asset || typeof asset !== "object") return null;
    return {
        id: asset.id,
        filename: asset.filename,
        filepath: asset.filepath || asset.path,
        subfolder: asset.subfolder || "",
        source: asset.source || asset.type,
        type: asset.type || asset.source,
        root_id: asset.root_id || asset.custom_root_id,
        kind: asset.kind,
        ext: asset.ext,
        size: asset.size,
        mtime: asset.mtime,
        width: asset.width,
        height: asset.height,
        duration: asset.duration,
        rating: asset.rating,
        tags: Array.isArray(asset.tags) ? asset.tags.slice(0, 60) : undefined,
        thumbnail_url: asset.thumbnail_url || asset.thumb_url,
        preview_url: asset.preview_url,
        has_workflow: asset.has_workflow || asset.hasWorkflow,
        workflow_type: asset.workflow_type || asset.workflowType,
        positive_prompt: asset.positive_prompt,
    };
}

function normalizeSnapshot(value: any) {
    if (!value || typeof value !== "object") return null;
    const at = Number(value.at || 0);
    if (!at || Date.now() - at > TTL_MS) return null;
    const assets = Array.isArray(value.assets) ? value.assets.map(compactAsset).filter(Boolean) : [];
    if (!assets.length) return null;
    return { ...value, assets };
}

async function transaction(mode: IDBTransactionMode) {
    const db = await openDb();
    if (!db) return null;
    try {
        return db.transaction(STORE, mode).objectStore(STORE);
    } catch {
        return null;
    }
}

export const PersistentAssetCache = {
    async get(key: string) {
        const store = await transaction("readonly");
        if (!store || !key) return null;
        return await new Promise((resolve) => {
            const req = store.get(key);
            req.onsuccess = () => resolve(normalizeSnapshot(req.result));
            req.onerror = () => resolve(null);
        });
    },
    async put(key: string, snapshot: any) {
        const store = await transaction("readwrite");
        const normalized = normalizeSnapshot({
            ...snapshot,
            key,
            at: snapshot?.at || Date.now(),
            assets: Array.isArray(snapshot?.assets) ? snapshot.assets.slice(0, MAX_ASSETS) : [],
        });
        if (!store || !key || !normalized) return false;
        await new Promise((resolve) => {
            const req = store.put(normalized);
            req.onsuccess = req.onerror = () => resolve(null);
        });
        this.prune();
        return true;
    },
    async prune() {
        const store = await transaction("readwrite");
        if (!store) return;
        const entries: any[] = await new Promise((resolve) => {
            const out: any[] = [];
            const req = store.openCursor();
            req.onsuccess = () => {
                const cursor = req.result;
                if (!cursor) return resolve(out);
                out.push(cursor.value);
                cursor.continue();
            };
            req.onerror = () => resolve(out);
        });
        const stale = entries
            .filter((entry) => !normalizeSnapshot(entry))
            .map((entry) => entry.key);
        const overflow = entries
            .filter((entry) => !stale.includes(entry.key))
            .sort((a, b) => Number(a.at || 0) - Number(b.at || 0))
            .slice(0, Math.max(0, entries.length - MAX_ENTRIES))
            .map((entry) => entry.key);
        for (const key of [...stale, ...overflow]) store.delete(key);
    },
};
