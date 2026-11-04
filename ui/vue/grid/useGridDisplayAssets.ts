import { toRaw } from "vue";

import {
    getFilenameKey,
    preserveRepresentativeGenerationTime,
} from "../../features/grid/AssetCardRenderer.js";

/**
 * Single source of truth for the "duplicate stack" badge in the Vue grid.
 *
 * A duplicate is the same file name in the same source/root/subfolder (i.e.
 * the same location on disk, typically duplicate index rows or case-only path
 * variants). Files that merely share a name in *different* folders are
 * distinct assets and are never stacked.
 *
 * This runs inside a `computed`, on reactive asset objects that the grid
 * template reads (`_mjrDupStack`, `_mjrDupCount`). Every write is therefore
 * guarded: a field is only assigned when its raw value actually differs, and
 * the members array keeps its identity while membership is unchanged.
 * Unconditional writes (a fresh array each pass, false->true flips) re-trigger
 * the render that called us; in a production build Vue has no recursion
 * limit, so that loop froze the whole ComfyUI tab.
 */

const DUP_FIELDS_TO_DELETE = ["_mjrNameCollisionCount", "_mjrNameCollisionPaths"] as const;

export function getDisplayGroupKey(asset: Record<string, any> | null | undefined): string {
    const filenameKey = getFilenameKey(asset?.filename);
    if (!filenameKey) return "";
    const source = String(asset?.source || asset?.type || "").trim().toLowerCase();
    const rootId = String(asset?.root_id || asset?.custom_root_id || "").trim().toLowerCase();
    const subfolder = String(asset?.subfolder || "").trim().toLowerCase();
    return `${source}|${rootId}|${subfolder}|${filenameKey}`;
}

export function isRenderableAsset(asset: any): boolean {
    return !!asset;
}

function setIfChanged(asset: any, key: string, value: unknown): void {
    const raw = toRaw(asset);
    if (raw?.[key] !== value) asset[key] = value;
}

function deleteIfPresent(asset: any, key: string): void {
    const raw = toRaw(asset);
    if (raw && Object.prototype.hasOwnProperty.call(raw, key)) delete asset[key];
}

function sameMembers(previous: unknown, next: any[]): boolean {
    if (!Array.isArray(previous) || previous.length !== next.length) return false;
    for (let i = 0; i < next.length; i++) {
        if (toRaw(previous[i]) !== toRaw(next[i])) return false;
    }
    return true;
}

function clearDuplicateMarkers(asset: any): void {
    setIfChanged(asset, "_mjrNameCollision", false);
    for (const key of DUP_FIELDS_TO_DELETE) deleteIfPresent(asset, key);
    setIfChanged(asset, "_mjrDupStack", false);
    setIfChanged(asset, "_mjrDupMembers", null);
    setIfChanged(asset, "_mjrDupCount", 0);
}

function markRepresentative(rep: any, bucket: any[]): void {
    for (const key of DUP_FIELDS_TO_DELETE) deleteIfPresent(rep, key);
    setIfChanged(rep, "_mjrNameCollision", false);
    setIfChanged(rep, "_mjrDupStack", true);
    if (!sameMembers(toRaw(rep)?._mjrDupMembers, bucket)) {
        rep._mjrDupMembers = bucket.slice();
    }
    setIfChanged(rep, "_mjrDupCount", bucket.length);
    // Only copies a value onto an empty field, so it is idempotent.
    preserveRepresentativeGenerationTime(rep, bucket);
}

export function buildDisplayAssets(
    assets: any[],
    { collapseDuplicates = true }: { collapseDuplicates?: boolean } = {},
): Record<string, any>[] {
    const list = Array.isArray(assets) ? assets : [];
    if (!collapseDuplicates) {
        // e.g. the "Duplicates - N copies" view: show every copy individually.
        const output: any[] = [];
        for (const asset of list) {
            if (!asset) continue;
            clearDuplicateMarkers(asset);
            output.push(asset);
        }
        return output;
    }

    const buckets = new Map<string, any[]>();
    const output: any[] = [];

    for (const asset of list) {
        if (!asset) continue;
        const groupKey = getDisplayGroupKey(asset);
        if (!groupKey) {
            clearDuplicateMarkers(asset);
            output.push(asset);
            continue;
        }

        let bucket = buckets.get(groupKey);
        if (!bucket) {
            bucket = [];
            buckets.set(groupKey, bucket);
            output.push(asset);
        }
        bucket.push(asset);
    }

    for (const bucket of buckets.values()) {
        const rep = bucket[0];
        for (const member of bucket) {
            if (member !== rep || bucket.length < 2) clearDuplicateMarkers(member);
        }
        if (bucket.length >= 2) markRepresentative(rep, bucket);
    }

    return output;
}

export function getRenderableAssets(assets: unknown[]): Record<string, any>[] {
    return buildDisplayAssets(assets as any[]).filter(isRenderableAsset);
}

/**
 * Plain, cycle-free copies of a duplicate stack's members for the
 * "Duplicates" view. The representative lists itself in `_mjrDupMembers`, so
 * handing the live objects to another view (Pinia state, a second grid) would
 * share and re-mutate the same reactive graph.
 */
export function toDuplicateGroupMembers(members: unknown): Record<string, any>[] {
    const list = Array.isArray(members) ? members : [];
    const out: Record<string, any>[] = [];
    const seen = new Set<string>();
    for (const member of list) {
        if (!member || typeof member !== "object") continue;
        const copy: Record<string, any> = { ...(toRaw(member) as Record<string, any>) };
        delete copy._mjrDupMembers;
        delete copy._mjrDupStack;
        delete copy._mjrDupCount;
        delete copy._mjrDupHidden;
        delete copy._mjrNameCollision;
        delete copy._mjrNameCollisionCount;
        delete copy._mjrNameCollisionPaths;
        const id = String(copy.id ?? "");
        if (id) {
            if (seen.has(id)) continue;
            seen.add(id);
        }
        out.push(copy);
    }
    return out;
}
