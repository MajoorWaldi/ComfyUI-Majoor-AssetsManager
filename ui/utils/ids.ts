function normalizeId(value: unknown): string {
    try {
        return String(value ?? "").trim();
    } catch {
        return "";
    }
}

let _fallbackUniqueIdCounter = 0;

function _tryBuildRandomHex(byteCount: number): string {
    const size = Math.max(4, Number(byteCount) || 0);
    try {
        const cryptoApi = globalThis.crypto;
        if (!cryptoApi?.getRandomValues) return "";
        const buffer = new Uint8Array(size);
        cryptoApi.getRandomValues(buffer);
        return Array.from(buffer, (value) => value.toString(16).padStart(2, "0")).join("");
    } catch {
        return "";
    }
}

export function createSecureToken(prefix = "", byteCount = 16): string {
    const randomHex = _tryBuildRandomHex(byteCount);
    if (!randomHex) {
        throw new Error("Secure token generation requires crypto.getRandomValues().");
    }
    return `${String(prefix || "")}${randomHex}`;
}

export function createUniqueId(prefix = "", byteCount = 8): string {
    const randomHex = _tryBuildRandomHex(byteCount);
    if (randomHex) {
        return `${String(prefix || "")}${randomHex}`;
    }
    _fallbackUniqueIdCounter += 1;
    return `${String(prefix || "")}${Date.now().toString(36)}_${_fallbackUniqueIdCounter.toString(36)}`;
}

export function normalizePositiveIntId(value: unknown): string {
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

export function normalizeAssetId(assetId: unknown): string {
    return normalizePositiveIntId(assetId);
}

export function pickRootId(obj: unknown): string {
    try {
        if (!obj) return "";
        const o = obj as Record<string, unknown>;
        const fi = o.file_info as Record<string, unknown> | undefined;
        return normalizeId(
            o.root_id ??
                o.rootId ??
                o.custom_root_id ??
                o.customRootId ??
                o.customRoot ??
                fi?.root_id ??
                fi?.rootId ??
                "",
        );
    } catch {
        return "";
    }
}
