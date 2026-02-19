function normalizeId(value) {
    try {
        return String(value ?? "").trim();
    } catch {
        return "";
    }
}

export function normalizeAssetId(assetId) {
    return normalizeId(assetId);
}

export function pickRootId(obj) {
    try {
        if (!obj) return "";
        return normalizeId(
            obj.root_id ??
            obj.rootId ??
            obj.custom_root_id ??
            obj.customRootId ??
            obj.customRoot ??
            obj?.file_info?.root_id ??
            obj?.file_info?.rootId ??
            ""
        );
    } catch {
        return "";
    }
}

