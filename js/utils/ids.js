function normalizeId(value) {
    try {
        return String(value ?? "").trim();
    } catch {
        return "";
    }
}

export function normalizePositiveIntId(value) {
    const raw = normalizeId(value);
    if (!raw) return "";
    if (!/^\d+$/.test(raw)) return "";
    try {
        const parsed = Number(raw);
        if (!Number.isSafeInteger(parsed) || parsed <= 0) return "";
        return String(parsed);
    } catch {
        return "";
    }
}

export function normalizeAssetId(assetId) {
    return normalizePositiveIntId(assetId);
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
                "",
        );
    } catch {
        return "";
    }
}
