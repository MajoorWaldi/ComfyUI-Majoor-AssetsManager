/**
 * Bulk star rating helper: rate many selected assets through the batch
 * endpoint in sequential chunks (server caps ids per request at 500).
 */

import { updateAssetsRatingBulk } from "../../api/client.js";
import { ASSET_RATING_CHANGED_EVENT } from "../../app/events.js";
import { t } from "../../app/i18n.js";
import { comfyToast } from "../../app/toast.js";

export const BULK_RATING_CHUNK_SIZE = 500;

export function chunkAssetIds(assetIds: any, chunkSize = BULK_RATING_CHUNK_SIZE): string[][] {
    const size = Math.max(1, Math.floor(Number(chunkSize) || BULK_RATING_CHUNK_SIZE));
    const ids = (Array.isArray(assetIds) ? assetIds : []).map((id) => String(id)).filter(Boolean);
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += size) {
        chunks.push(ids.slice(i, i + size));
    }
    return chunks;
}

function _dispatchRatingChanged(assetId: any, rating: any) {
    try {
        window.dispatchEvent(
            new CustomEvent(ASSET_RATING_CHANGED_EVENT, {
                detail: { assetId: String(assetId), rating },
            }),
        );
    } catch (e) {
        console.debug?.(e);
    }
}

export type BulkRatingResult = { rated: string[]; failed: string[]; superseded?: boolean };

// Runs are serialized latest-wins: a new run waits for the in-flight one, and a
// queued run superseded by a newer call sends nothing (no requests, no toasts).
let _chainTail: Promise<unknown> = Promise.resolve();
let _activeRuns = 0;
let _latestRunId = 0;

export async function rateAssetsInBulk(assetIds: any, rating: any): Promise<BulkRatingResult> {
    const runId = ++_latestRunId;
    const waited = _activeRuns > 0;
    const previous = _chainTail;
    _activeRuns += 1;
    const run = (async (): Promise<BulkRatingResult> => {
        try {
            if (waited) {
                try {
                    await previous;
                } catch (e) {
                    console.debug?.(e);
                }
                if (runId !== _latestRunId) {
                    return { rated: [], failed: [], superseded: true };
                }
            }
            return await _sendBulkRating(assetIds, rating);
        } finally {
            _activeRuns -= 1;
        }
    })();
    _chainTail = run.catch(() => {});
    return run;
}

async function _sendBulkRating(assetIds: any, rating: any): Promise<BulkRatingResult> {
    const chunks = chunkAssetIds(assetIds);
    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const rated: string[] = [];
    const failed: string[] = [];
    let done = 0;
    let appliedRating = rating;

    for (const chunk of chunks) {
        let result: any = null;
        try {
            result = await updateAssetsRatingBulk(chunk, rating);
        } catch (e) {
            console.debug?.(e);
        }
        if (!result?.ok) {
            failed.push(...chunk);
            done += chunk.length;
        } else {
            const rawAppliedRating = result?.data?.rating;
            if (typeof rawAppliedRating === "number" && Number.isFinite(rawAppliedRating)) {
                appliedRating = rawAppliedRating;
            }
            const updatedIds = Array.isArray(result?.data?.updated_ids)
                ? result.data.updated_ids
                : [];
            const updatedSet = new Set(updatedIds.map((id: any) => String(id)));
            const failedSet = new Set(
                (Array.isArray(result?.data?.failed) ? result.data.failed : [])
                    .map((entry: any) => (entry?.id != null ? String(entry.id) : ""))
                    .filter(Boolean),
            );
            for (const id of updatedIds) {
                const assetId = String(id);
                rated.push(assetId);
                _dispatchRatingChanged(assetId, appliedRating);
            }
            // Chunk ids the server reported as neither updated nor failed still
            // count as failed so no requested id vanishes from the summary.
            for (const id of chunk) {
                const assetId = String(id);
                if (!updatedSet.has(assetId) && !failedSet.has(assetId)) failedSet.add(assetId);
            }
            failed.push(...failedSet);
            done += chunk.length;
        }
        if (chunks.length > 1 && chunk !== chunks[chunks.length - 1]) {
            comfyToast(
                t("toast.ratingBulkProgress", "Rating assets ({done}/{total})...", {
                    done,
                    total,
                }),
                "info",
                1500,
            );
        }
    }

    if (rated.length && failed.length) {
        comfyToast(
            t("toast.ratingBulkPartial", "{rated} rated, {failed} failed", {
                rated: rated.length,
                failed: failed.length,
            }),
            "warning",
            2500,
        );
    } else if (failed.length) {
        comfyToast(t("toast.ratingUpdateFailed", "Failed to update rating"), "error");
    } else {
        comfyToast(
            t("toast.ratingSetN", "Rating set to {n} stars", { n: appliedRating }),
            "success",
            1500,
        );
    }

    return { rated, failed };
}
