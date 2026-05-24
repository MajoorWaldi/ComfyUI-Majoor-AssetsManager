import { getAssetsBatch } from "../../api/client.js";
import { loadMajoorSettings } from "../../app/settings.js";

const MAX_COLLECTION_NAME_LEN = 128;

export const SMART_COLLECTION_IDEAS = Object.freeze([
    {
        key: "portraits",
        label: "Portraits",
        query: "portrait photo face person closeup",
        iconClass: "pi pi-user",
    },
    {
        key: "landscapes",
        label: "Landscapes",
        query: "landscape nature scenery mountains outdoor",
        iconClass: "pi pi-image",
    },
    {
        key: "anime",
        label: "Anime / Illustration",
        query: "anime illustration manga cartoon drawing",
        iconClass: "pi pi-palette",
    },
    {
        key: "cyberpunk",
        label: "Cyberpunk / Sci-Fi",
        query: "cyberpunk sci-fi futuristic neon city",
        iconClass: "pi pi-bolt",
    },
    {
        key: "fantasy",
        label: "Fantasy",
        query: "fantasy magic medieval dragon castle",
        iconClass: "pi pi-star",
    },
    {
        key: "abstract",
        label: "Abstract",
        query: "abstract art pattern geometric colors",
        iconClass: "pi pi-circle",
    },
]);

export function normalizeCollectionName(value: any): string {
    try {
        const name = String(value ?? "").trim();
        if (!name) return "";
        if (name.length > MAX_COLLECTION_NAME_LEN) return "";
        if (name.includes("\x00")) return "";
        for (let i = 0; i < name.length; i += 1) {
            const code = name.charCodeAt(i);
            if (code <= 31 || code === 127) return "";
        }
        return name;
    } catch {
        return "";
    }
}

export function normalizeCollectionAsset(raw: any): Record<string, any> | null {
    if (!raw || typeof raw !== "object") return null;
    const filepath = String(raw.filepath || "").trim();
    if (!filepath) return null;
    return {
        filepath,
        filename: String(raw.filename || "").trim(),
        subfolder: String(raw.subfolder || "").trim(),
        type:
            String(raw.type || "output")
                .trim()
                .toLowerCase() || "output",
        kind: String(raw.kind || "")
            .trim()
            .toLowerCase(),
        root_id: String(raw.root_id || raw.rootId || raw.custom_root_id || "").trim() || undefined,
    };
}

export function extractCollectionAssetsFromRows(rows: unknown[]): { assets: Record<string, any>[]; missingIds: unknown[] } {
    const assets = [];
    const missingIds = [];
    const seenPaths = new Set();
    for (const row of Array.isArray(rows) ? rows : []) {
        const item = normalizeCollectionAsset(row);
        if (item?.filepath) {
            const key = item.filepath.toLowerCase();
            if (seenPaths.has(key)) continue;
            seenPaths.add(key);
            assets.push(item);
            continue;
        }
        const id = Number((row as any)?.asset_id ?? (row as any)?.id);
        if (Number.isFinite(id) && id > 0) missingIds.push(id);
    }
    return { assets, missingIds };
}

export async function resolveCollectionAssetsByIds(assetIds: unknown[]): Promise<any> {
    const ids = Array.from(
        new Set(
            (Array.isArray(assetIds) ? assetIds : [])
                .map((id) => Number(id))
                .filter((id) => Number.isFinite(id) && id > 0),
        ),
    );
    if (!ids.length) return { ok: true, data: [] };
    const batchRes = await getAssetsBatch(ids);
    if (!batchRes?.ok) {
        return { ok: false, error: String(batchRes?.error || "Failed to fetch assets") };
    }
    const rows = Array.isArray(batchRes?.data)
        ? batchRes.data
        : Array.isArray(batchRes?.data?.assets)
          ? batchRes.data.assets
          : [];
    const { assets } = extractCollectionAssetsFromRows(rows);
    return { ok: true, data: assets };
}

export function autoClusterLabel(cluster: Record<string, any> | null): string {
    const provided = String(cluster?.label || "").trim();
    const genericGroup = !provided || /^group\b/i.test(provided);
    if (!genericGroup) return provided;

    const tags = (Array.isArray(cluster?.dominant_tags) ? cluster.dominant_tags : [])
        .map((x) => String(x || "").trim())
        .filter(Boolean);
    if (tags.length) return tags.slice(0, 2).join(" / ");

    const samples = Array.isArray(cluster?.sample_assets) ? cluster.sample_assets : [];
    const folder = String(
        samples.find((s) => String(s?.subfolder || "").trim())?.subfolder || "",
    ).trim();
    const lastFolder = folder ? folder.split(/[\\/]/).filter(Boolean).pop() : "";

    const kindCount = { image: 0, video: 0, audio: 0, other: 0 };
    for (const sample of samples) {
        const kind = String(sample?.kind || "").toLowerCase();
        if (kind in kindCount) (kindCount as Record<string,number>)[kind] += 1;
        else kindCount.other += 1;
    }
    const dominantKind = Object.entries(kindCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "other";
    const kindLabel =
        dominantKind === "image"
            ? "Images"
            : dominantKind === "video"
              ? "Videos"
              : dominantKind === "audio"
                ? "Audio"
                : "Media";

    const idx = Number(cluster?.cluster_id);
    const suffix = Number.isFinite(idx) ? ` ${idx + 1}` : "";
    if (lastFolder) return `${lastFolder} - ${kindLabel}`;
    return `${kindLabel} Cluster${suffix}`;
}

export function isAiEnabledFromSettings(): boolean {
    try {
        const settings = loadMajoorSettings();
        return !!(settings?.ai?.vectorSearchEnabled ?? true);
    } catch {
        return true;
    }
}
