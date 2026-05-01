import { shallowRef } from "vue";

export function defaultAssetKey(asset) {
    if (!asset || typeof asset !== "object") return "";
    return [
        asset.source || asset.type || "output",
        asset.root_id || asset.custom_root_id || "",
        asset.subfolder || "",
        asset.filename || asset.filepath || asset.path || asset.fullpath || asset.full_path || "",
    ]
        .join("|")
        .trim()
        .toLowerCase();
}

export function createAssetCollectionIndex(assets = [], { assetKey = defaultAssetKey } = {}) {
    const byId = new Map();
    const byKey = new Map();

    for (const asset of Array.isArray(assets) ? assets : []) {
        if (!asset || typeof asset !== "object") continue;
        const id = asset.id == null ? "" : String(asset.id);
        const key = assetKey(asset);
        if (id) byId.set(id, asset);
        if (key) byKey.set(key, asset);
    }

    return { byId, byKey };
}

export function syncAssetCollectionState(state, { assetKey = defaultAssetKey } = {}) {
    if (!state || typeof state !== "object") return state;
    const assets = Array.isArray(state.assets) ? state.assets : [];
    const index = createAssetCollectionIndex(assets, { assetKey });
    state.assetIdSet = new Set(index.byId.keys());
    state.seenKeys = new Set(index.byKey.keys());
    return state;
}

export function removeAssetsFromState(state, assetIds = [], { assetKey = defaultAssetKey } = {}) {
    if (!state || typeof state !== "object") return 0;
    const ids = new Set(
        (Array.isArray(assetIds) ? assetIds : [assetIds])
            .map((raw) => {
                if (raw == null) return "";
                if (typeof raw === "object" && raw?.id != null) return String(raw.id);
                return String(raw);
            })
            .map((value) => value.trim())
            .filter(Boolean),
    );
    if (!ids.size) return 0;

    let removed = 0;
    state.assets = (Array.isArray(state.assets) ? state.assets : []).filter((asset) => {
        const id = asset?.id != null ? String(asset.id) : "";
        if (!id || !ids.has(id)) return true;
        removed += 1;
        return false;
    });
    if (removed > 0) syncAssetCollectionState(state, { assetKey });
    return removed;
}

export function useAssetCollection(options = {}) {
    const assetKey = options.assetKey || defaultAssetKey;
    const items = shallowRef([]);
    let byId = new Map();
    let byKey = new Map();

    function rebuildIndex() {
        const index = createAssetCollectionIndex(items.value, { assetKey });
        byId = index.byId;
        byKey = index.byKey;
    }

    function reset(nextItems = []) {
        items.value = [];
        byId = new Map();
        byKey = new Map();
        append(nextItems);
    }

    function append(newAssets = []) {
        const list = Array.isArray(newAssets) ? newAssets : [];
        if (!list.length) return 0;

        const next = items.value.slice();
        let added = 0;

        for (const asset of list) {
            if (!asset || typeof asset !== "object") continue;
            const id = asset.id == null ? "" : String(asset.id);
            const key = assetKey(asset);
            if (id && byId.has(id)) continue;
            if (key && byKey.has(key)) continue;

            next.push(asset);
            if (id) byId.set(id, asset);
            if (key) byKey.set(key, asset);
            added += 1;
        }

        if (added > 0) {
            items.value = next;
        }
        return added;
    }

    function upsert(asset) {
        if (!asset || typeof asset !== "object") return false;
        const id = asset.id == null ? "" : String(asset.id);
        const key = assetKey(asset);
        const existing = (id && byId.get(id)) || (key && byKey.get(key));

        if (existing) {
            const previousId = existing.id == null ? "" : String(existing.id);
            const previousKey = assetKey(existing);
            Object.assign(existing, asset);
            const nextKey = assetKey(existing);
            const nextId = existing.id == null ? "" : String(existing.id);
            if (previousId && previousId !== nextId) byId.delete(previousId);
            if (previousKey && previousKey !== nextKey) byKey.delete(previousKey);
            if (nextKey) byKey.set(nextKey, existing);
            if (nextId) byId.set(nextId, existing);
            items.value = items.value.slice();
            return true;
        }

        return append([asset]) > 0;
    }

    function remove(assetIds = []) {
        const ids = new Set(
            (Array.isArray(assetIds) ? assetIds : [assetIds])
                .map((value) => String(value ?? "").trim())
                .filter(Boolean),
        );
        if (!ids.size) return 0;

        let removed = 0;
        items.value = items.value.filter((asset) => {
            const id = asset?.id == null ? "" : String(asset.id);
            if (!id || !ids.has(id)) return true;
            removed += 1;
            return false;
        });
        if (removed > 0) rebuildIndex();
        return removed;
    }

    function has(asset) {
        if (!asset || typeof asset !== "object") return false;
        const id = asset.id == null ? "" : String(asset.id);
        const key = assetKey(asset);
        return !!((id && byId.has(id)) || (key && byKey.has(key)));
    }

    function getById(id) {
        return byId.get(String(id ?? "")) || null;
    }

    return {
        items,
        append,
        upsert,
        remove,
        reset,
        has,
        getById,
        rebuildIndex,
        get size() {
            return items.value.length;
        },
    };
}
