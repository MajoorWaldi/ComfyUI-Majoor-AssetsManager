/**
 * Chunked bulk deletion for multi-card grid selections.
 *
 * Routes assets with an id through the bulk `/mjr/am/assets/delete` endpoint
 * in sequential chunks (with a per-id fallback when a whole chunk is rejected),
 * and filepath-only assets (browser grid cards) through single deletes.
 */

import { deleteAsset, deleteAssets } from "../../api/client.js";
import { normalizeAssetId } from "../../utils/ids.js";

const MAX_BULK_ATTEMPTS = 3;

export interface BulkDeleteProgress {
    done: number;
    total: number;
    deleted: number;
    failed: number;
}

export interface BulkDeleteResult {
    deletedIds: string[];
    failedCount: number;
    deletedByFilepath: number;
}

export async function deleteAssetsInChunks(
    assets: any[],
    {
        chunkSize = 500,
        onProgress = null,
    }: { chunkSize?: number; onProgress?: ((progress: BulkDeleteProgress) => void) | null } = {},
): Promise<BulkDeleteResult> {
    const list = Array.isArray(assets)
        ? assets.filter((asset) => asset && typeof asset === "object")
        : [];

    const idAssets: { asset: any; id: string }[] = [];
    const filepathAssets: any[] = [];
    const seen = new Set<string>();
    for (const asset of list) {
        const id = normalizeAssetId(asset?.id);
        if (id && !seen.has(id)) {
            seen.add(id);
            idAssets.push({ asset, id });
        } else if (!id) {
            filepathAssets.push(asset);
        }
    }

    const deletedIds: string[] = [];
    let failedCount = 0;
    let deletedByFilepath = 0;

    for (const asset of filepathAssets) {
        try {
            const res = await deleteAsset(asset);
            if (res?.ok) deletedByFilepath += 1;
            else failedCount += 1;
        } catch {
            failedCount += 1;
        }
    }

    const total = idAssets.length;
    if (!total) return { deletedIds, failedCount, deletedByFilepath };

    const size = Math.max(1, Math.floor(Number(chunkSize) || 500));
    let done = 0;

    const applyBulkResult = (res: any, ids: string[]): "ok" | "rate-limited" | "rejected" => {
        if (res?.ok) {
            const data = res.data || {};
            if (Array.isArray(data?.deleted_ids)) {
                for (const id of data.deleted_ids) deletedIds.push(String(id));
                // Unconfirmed ids (listed as failed or silently dropped) count as failed.
                failedCount += Math.max(0, ids.length - data.deleted_ids.length);
            } else {
                const failedIds = Array.isArray(data?.failed_ids)
                    ? data.failed_ids.map((x: any) => String(x))
                    : [];
                const failedSet = new Set(failedIds);
                for (const id of ids) {
                    if (failedSet.has(id)) failedCount += 1;
                    else deletedIds.push(id);
                }
            }
            return "ok";
        }
        if (String(res?.code || "") === "RATE_LIMITED") {
            // The bulk route's own limit: per-id fallback would only multiply
            // rate-limited single deletes, so count the chunk as failed.
            return "rate-limited";
        }
        return "rejected";
    };

    const deletePerId = async (ids: string[]) => {
        for (const id of ids) {
            try {
                const res = await deleteAsset(id);
                if (res?.ok) deletedIds.push(id);
                else failedCount += 1;
            } catch {
                failedCount += 1;
            }
        }
    };

    const rejectionNamedIds = (res: any, ids: string[]): Set<string> | null => {
        const meta = res?.meta || {};
        const named = new Set(
            [
                ...(Array.isArray(meta?.missing_ids) ? meta.missing_ids : []),
                ...(Array.isArray(meta?.rejected_ids) ? meta.rejected_ids : []),
            ].map((x: any) => String(x)),
        );
        for (const id of ids) {
            if (named.has(id)) return named;
        }
        return null;
    };

    for (let start = 0; start < total; start += size) {
        const chunkIds = idAssets.slice(start, start + size).map((entry) => entry.id);
        let remainder = chunkIds;
        try {
            for (let attempt = 0; attempt < MAX_BULK_ATTEMPTS && remainder.length; attempt++) {
                const res = await deleteAssets(remainder);
                const outcome = applyBulkResult(res, remainder);
                if (outcome === "ok") {
                    remainder = [];
                } else if (outcome === "rate-limited") {
                    failedCount += remainder.length;
                    remainder = [];
                } else {
                    // Validation is all-or-nothing: when the server names the offending
                    // ids, drop them (counted failed) and retry the rest of the chunk.
                    const named = rejectionNamedIds(res, remainder);
                    if (!named) {
                        await deletePerId(remainder);
                        remainder = [];
                    } else {
                        for (const id of remainder) {
                            if (named.has(id)) failedCount += 1;
                        }
                        remainder = remainder.filter((id) => !named.has(id));
                    }
                }
            }
            // Bulk attempts exhausted with ids still unnamed: per-id fallback.
            if (remainder.length) {
                await deletePerId(remainder);
            }
        } catch {
            failedCount += remainder.length;
        }
        done += chunkIds.length;
        try {
            onProgress?.({ done, total, deleted: deletedIds.length, failed: failedCount });
        } catch (e: any) {
            console.debug?.(e);
        }
    }

    return { deletedIds, failedCount, deletedByFilepath };
}
