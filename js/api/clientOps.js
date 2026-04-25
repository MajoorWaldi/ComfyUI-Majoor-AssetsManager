/**
 * API client operations extracted from client.js.
 */

import { ENDPOINTS, appendAssetFilterQueryParams } from "./endpoints.js";
import { delay as fetchDelay } from "./fetchUtils.js";
import {
    get,
    post,
    VECTOR_BACKFILL_DEFAULT_POLL_INTERVAL_MS,
    VECTOR_BACKFILL_DEFAULT_POLL_TIMEOUT_MS,
    VECTOR_BACKFILL_MAX_POLL_TIMEOUT_MS,
} from "./client.js";
import { normalizeAssetId, pickRootId } from "../utils/ids.js";

export async function setProbeBackendMode(mode) {
    if (!mode || typeof mode !== "string") {
        return { ok: false, error: "Missing mode", code: "INVALID_INPUT" };
    }
    return post("/mjr/am/settings/probe-backend", { mode });
}

export async function getMetadataFallbackSettings() {
    return get(ENDPOINTS.SETTINGS_METADATA_FALLBACK);
}

export async function setMetadataFallbackSettings({ image, media } = {}) {
    return post(ENDPOINTS.SETTINGS_METADATA_FALLBACK, { image, media });
}

export async function getVectorSearchSettings() {
    return get(ENDPOINTS.SETTINGS_VECTOR_SEARCH);
}

export async function setVectorSearchSettings(settings = true) {
    if (settings && typeof settings === "object") {
        const payload = {};
        if ("enabled" in settings) payload.enabled = !!settings.enabled;
        if ("caption_on_index" in settings) payload.caption_on_index = !!settings.caption_on_index;
        if ("captionOnIndex" in settings) payload.caption_on_index = !!settings.captionOnIndex;
        return post(ENDPOINTS.SETTINGS_VECTOR_SEARCH, payload);
    }
    return post(ENDPOINTS.SETTINGS_VECTOR_SEARCH, { enabled: !!settings });
}

export async function getExecutionGroupingSettings() {
    return get(ENDPOINTS.SETTINGS_EXECUTION_GROUPING);
}

export async function setExecutionGroupingSettings(enabled = true) {
    return post(ENDPOINTS.SETTINGS_EXECUTION_GROUPING, { enabled: !!enabled });
}

export async function getHuggingFaceSettings() {
    return get(ENDPOINTS.SETTINGS_HUGGINGFACE);
}

export async function setHuggingFaceSettings(token = "") {
    return post(ENDPOINTS.SETTINGS_HUGGINGFACE, { token: String(token ?? "").trim() });
}

export async function getAiLoggingSettings() {
    return get(ENDPOINTS.SETTINGS_AI_LOGGING);
}

export async function setAiLoggingSettings(enabled = false) {
    return post(ENDPOINTS.SETTINGS_AI_LOGGING, { enabled: !!enabled });
}

export async function getRouteLoggingSettings() {
    return get(ENDPOINTS.SETTINGS_ROUTE_LOGGING);
}

export async function setRouteLoggingSettings(enabled = false) {
    return post(ENDPOINTS.SETTINGS_ROUTE_LOGGING, { enabled: !!enabled });
}

export async function getStartupLoggingSettings() {
    return get(ENDPOINTS.SETTINGS_STARTUP_LOGGING);
}

export async function setStartupLoggingSettings(enabled = false) {
    return post(ENDPOINTS.SETTINGS_STARTUP_LOGGING, { enabled: !!enabled });
}

export async function getLtxavRgbFallbackSettings() {
    return get(ENDPOINTS.SETTINGS_LTXAV_RGB_FALLBACK);
}

export async function setLtxavRgbFallbackSettings(enabled = false) {
    return post(ENDPOINTS.SETTINGS_LTXAV_RGB_FALLBACK, { enabled: !!enabled });
}

export async function getOutputDirectorySetting() {
    return get(ENDPOINTS.SETTINGS_OUTPUT_DIRECTORY);
}

export async function setOutputDirectorySetting(outputDirectory, options = {}) {
    const value = String(outputDirectory ?? "").trim();
    return post(ENDPOINTS.SETTINGS_OUTPUT_DIRECTORY, { output_directory: value }, options);
}

export async function getIndexDirectorySetting() {
    return get(ENDPOINTS.SETTINGS_INDEX_DIRECTORY);
}

export async function setIndexDirectorySetting(indexDirectory, options = {}) {
    const value = String(indexDirectory ?? "").trim();
    return post(ENDPOINTS.SETTINGS_INDEX_DIRECTORY, { index_directory: value }, options);
}

export async function getSecuritySettings() {
    return get("/mjr/am/settings/security");
}

export async function setSecuritySettings(prefs) {
    const body = prefs && typeof prefs === "object" ? prefs : {};
    return post("/mjr/am/settings/security", body);
}

export async function bootstrapSecurityToken() {
    const res = await post("/mjr/am/settings/security/bootstrap-token", {});
    if (res?.ok) {
        try {
            const token = String(res?.data?.token || "").trim();
            if (token) _persistAuthToken(token);
        } catch (e) {
            console.debug?.(e);
        }
    }
    return res;
}

export async function openInFolder(assetOrId) {
    if (assetOrId && typeof assetOrId === "object") {
        const fp = String(
            assetOrId.filepath || assetOrId.path || assetOrId?.file_info?.filepath || "",
        ).trim();
        if (assetOrId.id != null)
            return post("/mjr/am/open-in-folder", { asset_id: normalizeAssetId(assetOrId.id) });
        return post("/mjr/am/open-in-folder", { filepath: fp });
    }
    return post("/mjr/am/open-in-folder", { asset_id: normalizeAssetId(assetOrId) });
}

export async function browserFolderOp(
    { op = "", path = "", name = "", destination = "", recursive = true } = {},
    options = {},
) {
    const body = {
        op: String(op || "")
            .trim()
            .toLowerCase(),
        path: String(path || "").trim(),
    };
    if (name != null && String(name).trim()) body.name = String(name).trim();
    if (destination != null && String(destination).trim())
        body.destination = String(destination).trim();
    if (body.op === "delete") body.recursive = !!recursive;
    return post(ENDPOINTS.BROWSER_FOLDER_OP, body, options);
}

export async function resetIndex(options = {}) {
    const _bool = (value, fallback) =>
        value === undefined || value === null ? fallback : Boolean(value);
    const scope =
        String(options.scope || "output")
            .trim()
            .toLowerCase() || "output";
    const customRootId =
        options.customRootId ??
        options.custom_root_id ??
        options.rootId ??
        options.root_id ??
        options.customRoot ??
        null;
    const body = {
        scope,
        reindex: _bool(options.reindex, true),
        // When scope=all, the backend defaults to a hard DB reset unless explicitly disabled.
        hard_reset_db: _bool(
            options.hardResetDb ??
                options.hard_reset_db ??
                options.deleteDbFiles ??
                options.delete_db_files ??
                options.deleteDb ??
                options.delete_db ??
                undefined,
            scope === "all",
        ),
        clear_scan_journal: _bool(options.clearScanJournal ?? options.clear_scan_journal, true),
        clear_metadata_cache: _bool(
            options.clearMetadataCache ?? options.clear_metadata_cache,
            true,
        ),
        clear_asset_metadata: _bool(
            options.clearAssetMetadata ?? options.clear_asset_metadata,
            true,
        ),
        clear_assets: _bool(options.clearAssets ?? options.clear_assets, true),
        preserve_vectors: _bool(
            options.preserveVectors ??
                options.preserve_vectors ??
                options.keepVectors ??
                options.keep_vectors,
            false,
        ),
        rebuild_fts: _bool(options.rebuildFts ?? options.rebuild_fts, true),
        incremental: _bool(options.incremental, false),
        fast: _bool(options.fast, true),
        background_metadata: _bool(options.backgroundMetadata ?? options.background_metadata, true),
        maintenance_force: _bool(options.maintenanceForce ?? options.maintenance_force, false),
    };
    if (customRootId) {
        body.custom_root_id = String(customRootId);
    }
    return post(ENDPOINTS.INDEX_RESET, body);
}

export async function setWatcherScope({ scope = "output", customRootId = "" } = {}) {
    const s =
        String(scope || "output")
            .trim()
            .toLowerCase() || "output";
    const rid = String(customRootId || "").trim();
    const body = { scope: s };
    if (rid) body.custom_root_id = rid;
    return post(ENDPOINTS.WATCHER_SCOPE, body);
}

export async function getWatcherStatus(options = {}) {
    return get(ENDPOINTS.WATCHER_STATUS, options);
}

export async function toggleWatcher(enabled = true) {
    return post(ENDPOINTS.WATCHER_TOGGLE, { enabled: !!enabled });
}

export async function getWatcherSettings() {
    return get(ENDPOINTS.WATCHER_SETTINGS);
}

export async function updateWatcherSettings(payload = {}) {
    return post(ENDPOINTS.WATCHER_SETTINGS, payload);
}

export async function getToolsStatus(options = {}) {
    return get(ENDPOINTS.TOOLS_STATUS, options);
}

export async function getRuntimeStatus(options = {}) {
    return get(ENDPOINTS.STATUS, options);
}

/**
 * Emergency force-delete the SQLite database and recreate it.
 * Bypasses DB-dependent security checks (works even when DB is corrupted).
 * Closes connections, force-removes DB files from disk, reinitializes, and triggers a rescan.
 */
export async function forceDeleteDb() {
    return post("/mjr/am/db/force-delete", {});
}

export async function listDbBackups(options = {}) {
    return get(ENDPOINTS.DB_BACKUPS, options);
}

export async function saveDbBackup() {
    return post(ENDPOINTS.DB_BACKUP_SAVE, {});
}

export async function restoreDbBackup({ name = "", useLatest = false } = {}) {
    const body = {};
    if (name) body.name = String(name);
    if (useLatest) body.use_latest = true;
    return post(ENDPOINTS.DB_BACKUP_RESTORE, body);
}

export async function startDuplicatesAnalysis(limit = 250) {
    return post("/mjr/am/duplicates/analyze", {
        limit: Math.max(10, Math.min(5000, Number(limit) || 250)),
    });
}

export async function getDuplicateAlerts(
    { scope = "output", customRootId = "", maxGroups = 6, maxPairs = 10 } = {},
    options = {},
) {
    let url = `/mjr/am/duplicates/alerts?scope=${encodeURIComponent(String(scope || "output"))}`;
    if (customRootId) {
        url += `&custom_root_id=${encodeURIComponent(String(customRootId))}`;
    }
    url += `&max_groups=${encodeURIComponent(String(Math.max(1, Number(maxGroups) || 6)))}`;
    url += `&max_pairs=${encodeURIComponent(String(Math.max(1, Number(maxPairs) || 10)))}`;
    return get(url, options);
}

export async function mergeDuplicateTags(keepAssetId, mergeAssetIds = []) {
    return post("/mjr/am/duplicates/merge-tags", {
        keep_asset_id: Number(keepAssetId) || 0,
        merge_asset_ids: Array.isArray(mergeAssetIds)
            ? mergeAssetIds.map((x) => Number(x) || 0).filter((x) => x > 0)
            : [],
    });
}

export async function deleteAsset(assetOrId) {
    let id, payload;
    if (assetOrId && typeof assetOrId === "object") {
        id = normalizeAssetId(assetOrId.id);
        const fp = String(
            assetOrId.filepath || assetOrId.path || assetOrId?.file_info?.filepath || "",
        ).trim();
        payload = id ? { asset_id: id } : { filepath: fp };
    } else {
        id = normalizeAssetId(assetOrId);
        payload = { asset_id: id };
    }
    const res = await post("/mjr/am/asset/delete", payload);
    if (res?.ok && id) _emitAssetsDeleted([id]);
    return res;
}

export async function deleteAssets(assetIds) {
    const ids = Array.isArray(assetIds)
        ? assetIds.map((x) => normalizeAssetId(x)).filter(Boolean)
        : [];
    const res = await post("/mjr/am/assets/delete", { ids });
    if (res?.ok) _emitAssetsDeleted(ids);
    return res;
}

function _emitAssetsDeleted(ids) {
    try {
        const normalized = (Array.isArray(ids) ? ids : [ids])
            .map((x) => String(x || "").trim())
            .filter(Boolean);
        if (!normalized.length) return;
        window.dispatchEvent(
            new CustomEvent("mjr:assets-deleted", { detail: { ids: normalized } }),
        );
    } catch (e) {
        console.debug?.(e);
    }
}

export async function renameAsset(assetOrId, newName) {
    let id;
    if (assetOrId && typeof assetOrId === "object") {
        id = normalizeAssetId(assetOrId.id);
        const fp = String(
            assetOrId.filepath || assetOrId.path || assetOrId?.file_info?.filepath || "",
        ).trim();
        const res = id
            ? await post("/mjr/am/asset/rename", { asset_id: id, new_name: newName })
            : await post("/mjr/am/asset/rename", { filepath: fp, new_name: newName });
        if (res?.ok && id) {
            try {
                const fresh = await getAssetMetadata(id);
                if (fresh?.ok && fresh?.data) {
                    res.data = { ...(res.data || {}), asset: fresh.data };
                }
            } catch (e) {
                console.debug?.(e);
            }
        }
        return res;
    }
    id = normalizeAssetId(assetOrId);
    const res = await post("/mjr/am/asset/rename", { asset_id: id, new_name: newName });
    if (res?.ok && id) {
        try {
            const fresh = await getAssetMetadata(id);
            if (fresh?.ok && fresh?.data) {
                res.data = { ...(res.data || {}), asset: fresh.data };
            }
        } catch (e) {
            console.debug?.(e);
        }
    }
    return res;
}

// -----------------------------
// Collections
// -----------------------------

export async function listCollections() {
    const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
    let timer = null;
    try {
        if (ac) timer = setTimeout(() => ac.abort(), 10_000);
        return await get("/mjr/am/collections", ac ? { signal: ac.signal } : {});
    } finally {
        if (timer) clearTimeout(timer);
    }
}

export async function createCollection(name) {
    return post("/mjr/am/collections", { name: String(name || "").trim() });
}

export async function deleteCollection(collectionId) {
    const id = String(collectionId || "").trim();
    return post(`/mjr/am/collections/${encodeURIComponent(id)}/delete`, {});
}

export async function addAssetsToCollection(collectionId, assets) {
    const id = String(collectionId || "").trim();
    const list = Array.isArray(assets) ? assets : [];
    return post(`/mjr/am/collections/${encodeURIComponent(id)}/add`, { assets: list });
}

export async function removeFilepathsFromCollection(collectionId, filepaths) {
    const id = String(collectionId || "").trim();
    const list = Array.isArray(filepaths) ? filepaths : [];
    return post(`/mjr/am/collections/${encodeURIComponent(id)}/remove`, { filepaths: list });
}

export async function getCollectionAssets(collectionId) {
    const id = String(collectionId || "").trim();
    return get(`/mjr/am/collections/${encodeURIComponent(id)}/assets`);
}

// â”€â”€ Vector / Semantic Search â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Semantic search by natural-language query via SigLIP2 embeddings.
 * @param {string} query
 * @param {number|{topK?:number, scope?:string, customRootId?:string, subfolder?:string, kind?:string, hasWorkflow?:boolean, minRating?:number, minSizeMB?:number, maxSizeMB?:number, minWidth?:number, minHeight?:number, maxWidth?:number, maxHeight?:number, workflowType?:string, dateRange?:string, dateExact?:string}} [topKOrOptions=20]
 * @returns {Promise<ApiResult<{asset_id:number, score:number}[]>>}
 */
export async function vectorSearch(query, topKOrOptions = 20) {
    const q = String(query || "").trim();
    if (!q) return { ok: false, error: "Empty query" };
    const opts =
        topKOrOptions && typeof topKOrOptions === "object"
            ? topKOrOptions
            : { topK: Number(topKOrOptions) };
    const topK = Math.max(1, Math.min(200, Number(opts?.topK ?? 20) || 20));
    const scope = String(opts?.scope || "").trim();
    const customRootId = String(opts?.customRootId || "").trim();
    let url = `${ENDPOINTS.VECTOR_SEARCH}?q=${encodeURIComponent(q)}&top_k=${topK}`;
    if (scope) url += `&scope=${encodeURIComponent(scope)}`;
    if (customRootId) url += `&custom_root_id=${encodeURIComponent(customRootId)}`;
    url = appendAssetFilterQueryParams(url, {
        subfolder: opts?.subfolder ?? null,
        kind: opts?.kind ?? null,
        hasWorkflow: opts?.hasWorkflow ?? null,
        minRating: opts?.minRating ?? null,
        minSizeMB: opts?.minSizeMB ?? null,
        maxSizeMB: opts?.maxSizeMB ?? null,
        minWidth: opts?.minWidth ?? null,
        minHeight: opts?.minHeight ?? null,
        maxWidth: opts?.maxWidth ?? null,
        maxHeight: opts?.maxHeight ?? null,
        workflowType: opts?.workflowType ?? null,
        dateRange: opts?.dateRange ?? null,
        dateExact: opts?.dateExact ?? null,
    });
    // Model cold-start (SigLIP download/load) can take 60-120s on first use
    return get(url, { timeoutMs: 120_000 });
}

/**
 * Find visually similar assets to a given asset.
 * @param {number|string} assetId
 * @param {number|{topK?:number, scope?:string, customRootId?:string}} [topKOrOptions=20]
 * @returns {Promise<ApiResult<{asset_id:number, score:number}[]>>}
 */
export async function vectorFindSimilar(assetId, topKOrOptions = 20) {
    const id = String(assetId || "").trim();
    if (!id) return { ok: false, error: "Missing asset ID" };
    const opts =
        topKOrOptions && typeof topKOrOptions === "object"
            ? topKOrOptions
            : { topK: Number(topKOrOptions) };
    const topK = Math.max(1, Math.min(200, Number(opts?.topK ?? 20) || 20));
    const scope = String(opts?.scope || "").trim();
    const customRootId = String(opts?.customRootId || "").trim();
    let url = `${ENDPOINTS.VECTOR_SIMILAR}/${encodeURIComponent(id)}?top_k=${topK}`;
    if (scope) url += `&scope=${encodeURIComponent(scope)}`;
    if (customRootId) url += `&custom_root_id=${encodeURIComponent(customRootId)}`;
    return get(url, {
        dedupeKey: `vec:${id}:${topK}:${scope}:${customRootId}`,
    });
}

/**
 * Retrieve the prompt-alignment score for an asset.
 * Returns { ok: true, data: number|null } (0.0-1.0, null if N/A).
 * @param {number|string} assetId
 * @returns {Promise<ApiResult<number|null>>}
 */
export async function vectorGetAlignment(assetId) {
    const id = String(assetId || "").trim();
    if (!id) return { ok: false, error: "Missing asset ID" };
    return get(`${ENDPOINTS.VECTOR_ALIGNMENT}/${encodeURIComponent(id)}`);
}

/**
 * Force re-index a single asset's vector embedding.
 * @param {number|string} assetId
 * @returns {Promise<ApiResult>}
 */
export async function vectorIndexAsset(assetId) {
    const id = String(assetId || "").trim();
    if (!id) return { ok: false, error: "Missing asset ID" };
    return post(`${ENDPOINTS.VECTOR_INDEX}/${encodeURIComponent(id)}`, {});
}

/**
 * Retrieve vector index stats.
 * @returns {Promise<ApiResult<{total:number, avg_score:number|null, model:string}>>}
 */
export async function vectorStats() {
    return get(ENDPOINTS.VECTOR_STATS);
}

/**
 * Backfill missing vector embeddings for already indexed assets.
 * @param {number} [batchSize=64]  Batch size (1-200)
 * @param {{onProgress?:(status:Object)=>void, scope?:string, customRootId?:string, custom_root_id?:string}} [options]
 * @returns {Promise<ApiResult<{processed:number, indexed:number, skipped:number}>>}
 */
export async function vectorBackfill(batchSize = 64, options = {}) {
    const batch = Math.max(1, Math.min(200, batchSize));
    const onProgress = typeof options?.onProgress === "function" ? options.onProgress : null;
    const scope = String(options?.scope || "")
        .trim()
        .toLowerCase();
    const customRootId = String(options?.customRootId ?? options?.custom_root_id ?? "").trim();
    let startUrl = `${ENDPOINTS.VECTOR_BACKFILL}?batch_size=${batch}&async=1`;
    if (scope) startUrl += `&scope=${encodeURIComponent(scope)}`;
    if (customRootId) startUrl += `&custom_root_id=${encodeURIComponent(customRootId)}`;
    const startRes = await post(startUrl, {}, { timeoutMs: 30_000 });
    if (!startRes?.ok) return startRes;

    const startData = startRes?.data || {};
    const status = String(startData?.status || "").toLowerCase();
    const jobId = String(startData?.backfill_id || "").trim();
    try {
        onProgress?.(startData);
    } catch (e) {
        console.debug?.(e);
    }

    // Backward compatibility with older backend behavior (sync payload).
    if (!jobId || !["queued", "running", "pending"].includes(status)) {
        return startRes;
    }

    const pollIntervalMsRaw = Number(options?.pollIntervalMs);
    const pollTimeoutMsRaw = Number(options?.pollTimeoutMs);
    const pollIntervalMs = Number.isFinite(pollIntervalMsRaw)
        ? Math.max(500, Math.min(10_000, Math.floor(pollIntervalMsRaw)))
        : VECTOR_BACKFILL_DEFAULT_POLL_INTERVAL_MS;
    const pollTimeoutMs = Number.isFinite(pollTimeoutMsRaw)
        ? Math.max(
              10_000,
              Math.min(VECTOR_BACKFILL_MAX_POLL_TIMEOUT_MS, Math.floor(pollTimeoutMsRaw)),
          )
        : VECTOR_BACKFILL_DEFAULT_POLL_TIMEOUT_MS;
    const startedAt = Date.now();
    let lastStatus = null;

    while (Date.now() - startedAt < pollTimeoutMs) {
        await fetchDelay(pollIntervalMs);
        const pollRes = await get(
            `${ENDPOINTS.VECTOR_BACKFILL_STATUS}?backfill_id=${encodeURIComponent(jobId)}`,
            { timeoutMs: 30_000 },
        );
        if (!pollRes?.ok) {
            lastStatus = pollRes;
            continue;
        }

        const data = pollRes?.data || {};
        const st = String(data?.status || "").toLowerCase();
        lastStatus = pollRes;
        try {
            onProgress?.(data);
        } catch (e) {
            console.debug?.(e);
        }

        if (st === "succeeded") {
            return {
                ok: true,
                data: data?.result || {},
                code: null,
                status: 200,
            };
        }

        if (st === "failed") {
            return {
                ok: false,
                error: String(data?.error || "Vector backfill failed"),
                code: String(data?.code || "DB_ERROR"),
                data,
                status: 500,
            };
        }
    }

    const finalStatusRes = await get(
        `${ENDPOINTS.VECTOR_BACKFILL_STATUS}?backfill_id=${encodeURIComponent(jobId)}`,
        { timeoutMs: 30_000 },
    );
    const finalData = finalStatusRes?.data || lastStatus?.data || {};
    const finalState = String(finalData?.status || "").toLowerCase();
    if (finalStatusRes?.ok && ["queued", "running", "pending"].includes(finalState)) {
        try {
            onProgress?.(finalData);
        } catch (e) {
            console.debug?.(e);
        }
        return {
            ok: true,
            code: "PENDING",
            status: 202,
            data: {
                ...finalData,
                pending: true,
                timed_out: true,
                poll_timeout_ms: pollTimeoutMs,
                backfill_id: String(finalData?.backfill_id || jobId),
                status: finalState || "running",
            },
            meta: { pending: true },
        };
    }

    if (finalStatusRes?.ok && finalState === "failed") {
        return {
            ok: false,
            error: String(finalData?.error || "Vector backfill failed"),
            code: String(finalData?.code || "DB_ERROR"),
            data: finalData,
            status: 500,
        };
    }

    return {
        ok: false,
        error: `Vector backfill polling timed out after ${pollTimeoutMs}ms`,
        code: "TIMEOUT",
        data: finalData || null,
        status: 408,
    };
}

/**
 * Retrieve AI-suggested (auto-tag) tags for an asset â€” separate from user tags.
 * @param {number|string} assetId
 * @returns {Promise<ApiResult<string[]>>}
 */
export async function vectorGetAutoTags(assetId) {
    const id = String(assetId || "").trim();
    if (!id) return { ok: false, error: "Missing asset ID" };
    return get(`${ENDPOINTS.VECTOR_AUTO_TAGS}/${encodeURIComponent(id)}`);
}

/**
 * Generate and persist a Florence-2 caption for an image asset.
 * @param {number|string} assetId
 * @returns {Promise<ApiResult<string>>}
 */
export async function vectorGenerateCaption(assetId) {
    const id = String(assetId || "").trim();
    if (!id) return { ok: false, error: "Missing asset ID" };
    return post(`${ENDPOINTS.VECTOR_CAPTION}/${encodeURIComponent(id)}`, {});
}

/**
 * Backward-compatible alias for previous naming.
 * @deprecated Use vectorGenerateCaption
 */
export async function vectorGenerateEnhancedPrompt(assetId) {
    return vectorGenerateCaption(assetId);
}

/**
 * Hybrid FTS + semantic search (Google-like).
 * Supports inline filters and explicit filter params.
 * @param {string} query  Raw search query (filters parsed server-side)
 * @param {Object} [params]
 * @param {number} [params.topK=50]
 * @param {string} [params.scope="output"]
 * @param {string} [params.customRootId]
 * @returns {Promise<ApiResult<Array>>}
 */
export async function hybridSearch(
    query,
    {
        topK = 50,
        scope = "output",
        customRootId = "",
        subfolder = null,
        kind = null,
        hasWorkflow = null,
        minRating = null,
        minSizeMB = null,
        maxSizeMB = null,
        minWidth = null,
        minHeight = null,
        maxWidth = null,
        maxHeight = null,
        workflowType = null,
        dateRange = null,
        dateExact = null,
    } = {},
) {
    const q = String(query || "").trim();
    if (!q) return { ok: false, error: "Empty query" };
    let url = `${ENDPOINTS.HYBRID_SEARCH}?q=${encodeURIComponent(q)}&top_k=${Math.max(1, Math.min(200, topK))}&scope=${encodeURIComponent(scope)}`;
    if (customRootId) url += `&custom_root_id=${encodeURIComponent(customRootId)}`;
    url = appendAssetFilterQueryParams(url, {
        subfolder,
        kind,
        hasWorkflow,
        minRating,
        minSizeMB,
        maxSizeMB,
        minWidth,
        minHeight,
        maxWidth,
        maxHeight,
        workflowType,
        dateRange,
        dateExact,
    });
    // Model cold-start (SigLIP download/load) can take 60-120s on first use
    return get(url, { timeoutMs: 120_000 });
}

/**
 * Fetch assets flagged by the library audit (missing tags, low alignment, etc.).
 * @param {Object} [params]
 * @param {string} [params.filter="incomplete"]  "incomplete"|"low_alignment"|"no_tags"|"no_rating"|"no_workflow"
 * @param {string} [params.sort="alignment_asc"]  "alignment_asc"|"alignment_desc"|"completeness_asc"|"newest"|"oldest"
 * @param {string} [params.scope="output"]
 * @param {string} [params.customRootId]
 * @param {number} [params.limit=200]
 * @returns {Promise<ApiResult<Array>>}
 */
export async function getAuditAssets({
    filter = "incomplete",
    sort = "alignment_asc",
    scope = "output",
    customRootId = "",
    limit = 200,
} = {}) {
    let url = `${ENDPOINTS.AUDIT}?filter=${encodeURIComponent(filter)}&sort=${encodeURIComponent(sort)}&scope=${encodeURIComponent(scope)}&limit=${Math.max(1, Math.min(500, limit))}`;
    if (customRootId) url += `&custom_root_id=${encodeURIComponent(customRootId)}`;
    return get(url);
}

/**
 * Cluster all indexed embeddings into suggested collections.
 * @param {number} [k=8]  Number of clusters
 * @returns {Promise<ApiResult<Array<{cluster_id:number, label:string, size:number, sample_assets:Array, dominant_tags:string[]}>>>}
 */
export async function vectorSuggestCollections(k = 8) {
    return post(ENDPOINTS.VECTOR_SUGGEST_COLLECTIONS, { k: Math.max(2, Math.min(20, k)) });
}
