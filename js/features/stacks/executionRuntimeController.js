import { APP_CONFIG } from "../../app/config.js";
import { EVENTS } from "../../app/events.js";
import { createExecutionAssetBuffer } from "./executionAssetBuffer.js";
import { createJobFinalizeQueue } from "./finalizeQueue.js";
import { createLiveAssetGate } from "./liveAssetGate.js";
import { createTTLCache } from "../../utils/ttlCache.js";

const DEDUPE_TTL_MS = 2000;
const RECENT_FILES_MAX = 2000;
const INDEX_RETRYABLE_CODES = new Set([
    "DB_MAINTENANCE",
    "TIMEOUT",
    "NETWORK_ERROR",
    "SERVICE_UNAVAILABLE",
]);
const INDEX_RETRY_MAX_ATTEMPTS = 8;
const INDEX_RETRY_BASE_DELAY_MS = 1200;
const INDEX_RETRY_MAX_DELAY_MS = 15_000;
const EXECUTION_START_TTL_MS = 10 * 60 * 1000;
const EXECUTION_STARTS_MAX = 500;
const ORPHAN_GENERATION_RETRY_MAX_ATTEMPTS = 6;
const ORPHAN_GENERATION_ABSOLUTE_TIMEOUT_MS = 30_000;
const POST_EXECUTION_BUFFER_FLUSH_FAST_MS = 500;

export function createExecutionRuntimeController({
    post,
    ENDPOINTS,
    reportError,
    extractOutputFiles,
    ensureExecutionRuntime,
    emitRuntimeStatus,
    refreshGeneratedFeedHosts,
    getActiveGridContainer: _getActiveGridContainer,
}) {
    const recentFiles = createTTLCache({ ttlMs: DEDUPE_TTL_MS, maxSize: RECENT_FILES_MAX });
    const executionStarts = createTTLCache({
        ttlMs: EXECUTION_START_TTL_MS,
        maxSize: EXECUTION_STARTS_MAX,
    });
    const executionIdleGraceMs = Math.max(
        0,
        Number(APP_CONFIG.EXECUTION_IDLE_GRACE_MS) || 6000,
    );
    const orphanGenerationEntries = new Map();
    const executionAssetBuffer = createExecutionAssetBuffer();
    const liveAssetGate = createLiveAssetGate();
    let lastStacksUpdateSignature = "";
    let lastStacksUpdateAt = 0;
    let postExecutionWorkTimer = null;

    function isJobTrackingDebugEnabled() {
        try {
            if (typeof window === "undefined") return false;
            if (window.__MJR_DEBUG_JOB_TRACKING__ === true) return true;
            return String(window.localStorage?.getItem("mjr.debug.jobTracking") || "").trim() === "1";
        } catch (e) {
            console.debug?.(e);
            return false;
        }
    }

    function debugJobTracking(stage, detail = {}) {
        if (!isJobTrackingDebugEnabled()) return;
        try {
            console.debug("[Majoor][job-tracking]", stage, detail);
        } catch (e) {
            console.debug?.(e);
        }
    }

    function isExecutionGroupingEnabled() {
        return !!APP_CONFIG.EXECUTION_GROUPING_ENABLED;
    }

    function getExecutionRuntimePolicy() {
        const groupingEnabled = isExecutionGroupingEnabled();
        return {
            groupingEnabled,
            useExecutionBuffer: groupingEnabled,
            usePostExecutionScan: !groupingEnabled,
            allowLiveStackFinalize: groupingEnabled,
        };
    }

    function notifyStacksUpdated(detail = {}) {
        debugJobTracking("stacks-updated", {
            targeted_job_id: String(detail?.targeted_job_id || ""),
            stacks: Array.isArray(detail?.stacks)
                ? detail.stacks.map((item) => ({
                      job_id: String(item?.job_id || ""),
                      stack_id: String(item?.stack_id || ""),
                      asset_count: Number(item?.asset_count || 0) || 0,
                  }))
                : [],
        });
        try {
            const targeted = String(detail?.targeted_job_id || "").trim();
            if (targeted) liveAssetGate.clearPendingJob(targeted);
            const stacks = Array.isArray(detail?.stacks) ? detail.stacks : [];
            for (const item of stacks) {
                const jobId = String(item?.job_id || "").trim();
                if (jobId) liveAssetGate.clearPendingJob(jobId);
            }
        } catch (e) {
            console.debug?.(e);
        }
        try {
            const stacks = Array.isArray(detail?.stacks) ? detail.stacks : [];
            const signature = JSON.stringify({
                targeted_job_id: String(detail?.targeted_job_id || ""),
                stacks: stacks.map((item) => ({
                    job_id: String(item?.job_id || ""),
                    stack_id: String(item?.stack_id || ""),
                    asset_count: Number(item?.asset_count || 0) || 0,
                })),
            });
            const now = Date.now();
            if (
                signature &&
                signature === lastStacksUpdateSignature &&
                now - lastStacksUpdateAt < 1500
            ) {
                return;
            }
            lastStacksUpdateSignature = signature;
            lastStacksUpdateAt = now;
        } catch (e) {
            console.debug?.(e);
        }
        try {
            window.dispatchEvent(
                new CustomEvent("mjr:stacks-updated", { detail: { ...(detail || {}) } }),
            );
        } catch (e) {
            console.debug?.(e);
        }
        try {
            refreshGeneratedFeedHosts();
        } catch (e) {
            console.debug?.(e);
        }
    }

    const stackFinalizeQueue = createJobFinalizeQueue({
        defaultDelayMs: 900,
        async postJob(targetJobId) {
            debugJobTracking("auto-stack:start", { job_id: targetJobId });
            try {
                const res = await post(ENDPOINTS.STACKS_AUTO_STACK, {
                    mode: "job_id",
                    job_id: targetJobId,
                });
                if (!res?.ok) {
                    liveAssetGate.clearPendingJob(targetJobId);
                    reportError(
                        new Error(String(res?.error || "Auto stack failed")),
                        "executionRuntime.execution_end.auto_stack",
                    );
                    return;
                }
                debugJobTracking("auto-stack:done", {
                    job_id: targetJobId,
                    stacks: Array.isArray(res?.data?.stacks) ? res.data.stacks.length : 0,
                });
                notifyStacksUpdated(res?.data || { targeted_job_id: targetJobId });
            } catch (error) {
                reportError(error, "executionRuntime.execution_end.auto_stack");
            }
        },
    });

    function rememberExecutionStart(promptId, timestampMs) {
        if (!promptId) return;
        const ts = Number(timestampMs) || Date.now();
        executionStarts.set(String(promptId), ts, { at: ts });
        executionStarts.prune();
    }

    function dedupeFiles(files) {
        recentFiles.prune();
        const fresh = [];
        for (const f of files) {
            const key = `${f.type || ""}|${f.subfolder || ""}|${f.filename || ""}`.toLowerCase();
            if (!recentFiles.has(key)) {
                recentFiles.set(key, true);
                fresh.push(f);
            }
        }
        return fresh;
    }

    function indexRetryDelayMs(attempt) {
        const a = Math.max(1, Number(attempt) || 1);
        const exp = Math.min(6, a - 1);
        return Math.min(INDEX_RETRY_MAX_DELAY_MS, INDEX_RETRY_BASE_DELAY_MS * 2 ** exp);
    }

    function clearPostExecutionWorkTimer() {
        if (postExecutionWorkTimer) {
            clearTimeout(postExecutionWorkTimer);
            postExecutionWorkTimer = null;
        }
    }

    function schedulePostExecutionWork(work, delayMs = executionIdleGraceMs) {
        const waitMs = Math.max(0, Number(delayMs) || 0);
        clearPostExecutionWorkTimer();
        postExecutionWorkTimer = setTimeout(() => {
            postExecutionWorkTimer = null;
            try {
                work?.();
            } catch (error) {
                reportError(error, "executionRuntime.post_execution");
            }
        }, waitMs);
    }

    function shouldRetryIndexResponse(res) {
        const code = String(res?.code || "")
            .trim()
            .toUpperCase();
        return INDEX_RETRYABLE_CODES.has(code);
    }

    function scheduleGenerationIndex(files, attempt = 1, meta = {}) {
        const payloadFiles = Array.isArray(files) ? files : [];
        if (!payloadFiles.length) return;
        const payload = { files: payloadFiles, origin: "generation" };
        if (meta?.prompt_id || meta?.promptId) {
            payload.prompt_id = String(meta.prompt_id || meta.promptId);
        }
        debugJobTracking("index:direct", {
            prompt_id: String(payload.prompt_id || ""),
            attempt,
            files: payloadFiles.map((item) => String(item?.filename || item?.filepath || "")),
        });
        post(ENDPOINTS.INDEX_FILES, payload)
            .then((res) => {
                if (res?.ok) return;
                if (shouldRetryIndexResponse(res) && attempt < INDEX_RETRY_MAX_ATTEMPTS) {
                    const delayMs = indexRetryDelayMs(attempt);
                    setTimeout(
                        () => scheduleGenerationIndex(payloadFiles, attempt + 1, meta),
                        delayMs,
                    );
                    return;
                }
                try {
                    const code = String(res?.code || "INDEX_FAILED");
                    const msg = String(res?.error || "Indexing generated files failed");
                    reportError(new Error(`${code}: ${msg}`), "executionRuntime.executed.index");
                } catch (e) {
                    console.debug?.(e);
                }
            })
            .catch((error) => reportError(error, "executionRuntime.executed.index"));
    }

    function resolveGenerationPromptId(meta = {}) {
        const explicitPromptId = String(meta?.prompt_id || meta?.promptId || "").trim();
        if (explicitPromptId) return explicitPromptId;
        try {
            return String(ensureExecutionRuntime()?.active_prompt_id || "").trim();
        } catch (e) {
            console.debug?.(e);
            return "";
        }
    }

    function orphanGenerationKey(files) {
        if (!Array.isArray(files) || !files.length) return "";
        return files
            .map((item) => String(item?.filepath || item?.filename || ""))
            .filter(Boolean)
            .sort()
            .join("|");
    }

    function enqueueOrphanGenerationIndex(files, meta = {}, attempt = 1) {
        const payloadFiles = Array.isArray(files) ? files : [];
        if (!payloadFiles.length) return;
        const key = orphanGenerationKey(payloadFiles);
        if (!key) {
            scheduleGenerationIndex(payloadFiles, 1, meta);
            return;
        }
        const existing = orphanGenerationEntries.get(key);
        if (existing?.timer) clearTimeout(existing.timer);
        const firstAttemptAt = existing?.firstAttemptAt ?? Date.now();
        if (Date.now() - firstAttemptAt >= ORPHAN_GENERATION_ABSOLUTE_TIMEOUT_MS) {
            scheduleGenerationIndex(payloadFiles, 1, meta);
            return;
        }
        const nextAttempt = Math.max(1, Number(attempt) || 1);
        const delayMs = Math.min(2000, 250 * nextAttempt);
        const timer = setTimeout(() => {
            orphanGenerationEntries.delete(key);
            bufferGenerationIndex(payloadFiles, meta, nextAttempt + 1);
        }, delayMs);
        orphanGenerationEntries.set(key, {
            files: payloadFiles,
            meta,
            attempt: nextAttempt,
            timer,
            firstAttemptAt,
        });
    }

    function flushOrphanGenerationEntries(promptId) {
        const normalizedPromptId = String(promptId || "").trim();
        if (!normalizedPromptId || orphanGenerationEntries.size <= 0) return;
        for (const [key, entry] of Array.from(orphanGenerationEntries.entries())) {
            try {
                if (entry?.timer) clearTimeout(entry.timer);
            } catch (e) {
                console.debug?.(e);
            }
            orphanGenerationEntries.delete(key);
            executionAssetBuffer.add(normalizedPromptId, entry?.files || []);
        }
    }

    function clearOrphanGenerationEntries() {
        for (const [key, entry] of Array.from(orphanGenerationEntries.entries())) {
            try {
                if (entry?.timer) clearTimeout(entry.timer);
            } catch (e) {
                console.debug?.(e);
            }
            orphanGenerationEntries.delete(key);
        }
    }

    function bufferGenerationIndex(files, meta = {}, attempt = 1) {
        const promptId = resolveGenerationPromptId(meta);
        debugJobTracking("buffer:add", {
            prompt_id: promptId,
            explicit_prompt_id: String(meta?.prompt_id || meta?.promptId || ""),
            attempt,
            file_count: Array.isArray(files) ? files.length : 0,
            files: Array.isArray(files)
                ? files.map((item) => String(item?.filename || item?.filepath || ""))
                : [],
        });
        if (!promptId) {
            if (attempt < ORPHAN_GENERATION_RETRY_MAX_ATTEMPTS) {
                enqueueOrphanGenerationIndex(files, meta, attempt);
                return;
            }
            scheduleGenerationIndex(files, 1, meta);
            return;
        }
        executionAssetBuffer.add(promptId, files);
    }

    function scheduleFinalizeExecutionStacks(jobId, delayMs = 900) {
        if (!isExecutionGroupingEnabled()) return;
        debugJobTracking("finalize:schedule", { job_id: String(jobId || ""), delay_ms: delayMs });
        stackFinalizeQueue.schedule(jobId, delayMs);
    }

    function schedulePostExecutionScan(delayMs = 1200) {
        schedulePostExecutionWork(() => {
            post(ENDPOINTS.SCAN, {
                recursive: true,
                incremental: true,
                fast: true,
                background_metadata: true,
            }).catch((error) => reportError(error, "executionRuntime.execution_end.scan"));
        }, delayMs);
    }

    function flushBufferedGenerationIndex(jobId) {
        const policy = getExecutionRuntimePolicy();
        const promptId = String(jobId || "").trim();
        if (!promptId) return;
        const files = executionAssetBuffer.take(promptId);
        debugJobTracking("buffer:flush", {
            prompt_id: promptId,
            file_count: files.length,
            files: files.map((item) => String(item?.filename || item?.filepath || "")),
        });
        if (policy.allowLiveStackFinalize) {
            liveAssetGate.markPendingJob(promptId, { files, expectedCount: files.length });
        }
        if (!files.length) {
            if (policy.allowLiveStackFinalize) {
                scheduleFinalizeExecutionStacks(promptId);
            }
            return;
        }
        post(ENDPOINTS.INDEX_FILES, {
            files,
            origin: "generation",
            prompt_id: promptId,
        })
            .then((res) => {
                if (!res?.ok) {
                    if (policy.allowLiveStackFinalize) {
                        liveAssetGate.clearPendingJob(promptId);
                    }
                    reportError(
                        new Error(String(res?.error || "Indexing generated files failed")),
                        "executionRuntime.executed.index",
                    );
                    return;
                }
                debugJobTracking("index:flush:done", {
                    prompt_id: promptId,
                    file_count: files.length,
                });
                if (policy.allowLiveStackFinalize) {
                    scheduleFinalizeExecutionStacks(promptId, 1800);
                }
            })
            .catch((error) => {
                if (policy.allowLiveStackFinalize) {
                    liveAssetGate.clearPendingJob(promptId);
                }
                reportError(error, "executionRuntime.executed.index");
            });
    }

    function hasBufferedGenerationFiles(jobId) {
        const promptId = String(jobId || "").trim();
        if (!promptId) return false;
        try {
            const bucket = executionAssetBuffer?._jobs?.get?.(promptId);
            return !!bucket && typeof bucket.size === "number" && bucket.size > 0;
        } catch (e) {
            console.debug?.(e);
            return false;
        }
    }

    function prepareLiveAssetEvent(detail) {
        if (!isExecutionGroupingEnabled()) {
            return { detail, jobId: "", defer: false };
        }
        try {
            return liveAssetGate.prepare(detail);
        } catch (e) {
            console.debug?.(e);
            return { detail, jobId: "", defer: false };
        }
    }

    function isRenderableLiveAsset(detail) {
        const kind = String(detail?.kind || "").trim();
        const filename = String(detail?.filename || "").trim();
        const filepath = String(detail?.filepath || "").trim();
        return !!kind && (!!filename || !!filepath);
    }

    function handleExecutedEvent(event, { appRef }) {
        const policy = getExecutionRuntimePolicy();
        if (!policy.useExecutionBuffer) return;
        const outputFiles = dedupeFiles(extractOutputFiles(event?.detail?.output));
        if (!outputFiles.length) return;
        const promptId = event?.detail?.prompt_id || event?.detail?.promptId;
        const sourceNodeId = String(event?.detail?.node || event?.detail?.display_node || "").trim();
        const startTs = promptId ? executionStarts.get(String(promptId)) : null;
        const genTimeMs = startTs ? Math.max(0, Date.now() - startTs) : 0;
        let sourceNodeType = "";
        try {
            if (sourceNodeId && typeof appRef !== "undefined" && appRef?.graph) {
                const graphNode = appRef.graph.getNodeById(Number(sourceNodeId));
                if (graphNode) {
                    sourceNodeType = String(graphNode.type || graphNode.comfyClass || "").trim();
                }
            }
        } catch (e) {
            console.debug?.(e);
        }
        const files = outputFiles.map((f) => ({
            ...f,
            ...(genTimeMs > 0 ? { generation_time_ms: genTimeMs } : {}),
            ...(sourceNodeId ? { source_node_id: sourceNodeId } : {}),
            ...(sourceNodeType ? { source_node_type: sourceNodeType } : {}),
        }));
        debugJobTracking("executed:event", {
            prompt_id: String(promptId || ""),
            source_node_id: sourceNodeId,
            source_node_type: sourceNodeType,
            file_count: files.length,
            files: files.map((item) => String(item?.filename || item?.filepath || "")),
        });
        try {
            window.dispatchEvent(
                new CustomEvent(EVENTS.NEW_GENERATION_OUTPUT, {
                    detail: {
                        files,
                        prompt_id: String(promptId || ""),
                        promptId: String(promptId || ""),
                    },
                }),
            );
        } catch (e) {
            console.debug?.(e);
        }
        const immediateFiles = files.length > 0 ? [files[0]] : [];
        const bufferedFiles = files.length > 1 ? files.slice(1) : [];

        // Prioritize the first renderable asset from each executed payload so the
        // placeholder is replaced by a real card almost immediately, while the
        // remaining outputs continue through the grouped post-execution flow.
        if (immediateFiles.length > 0) {
            scheduleGenerationIndex(immediateFiles, 1, { prompt_id: promptId });
        }
        if (bufferedFiles.length > 0) {
            bufferGenerationIndex(bufferedFiles, { prompt_id: promptId });
        }
    }

    function handleExecutionStart(event, { setCurrentJobId }) {
        const promptId = event?.detail?.prompt_id || event?.detail?.promptId;
        const ts = event?.detail?.timestamp;
        debugJobTracking("execution:start", {
            prompt_id: String(promptId || ""),
            timestamp: Number(ts) || null,
        });
        rememberExecutionStart(promptId, ts);
        clearPostExecutionWorkTimer();
        setCurrentJobId?.(promptId || null);
        emitRuntimeStatus({
            active_prompt_id: promptId || null,
            cached_nodes: [],
            progress_node: null,
            progress_value: null,
            progress_max: null,
        });
        if (promptId) {
            flushOrphanGenerationEntries(promptId);
        }
    }

    function handleExecutionEnd(event, { setCurrentJobId }) {
        const policy = getExecutionRuntimePolicy();
        const promptId = event?.detail?.prompt_id || event?.detail?.promptId;
        debugJobTracking("execution:end", {
            type: String(event?.type || ""),
            prompt_id: String(promptId || ""),
        });
        if (promptId) {
            executionStarts.delete(String(promptId));
        }
        executionStarts.prune();
        setCurrentJobId?.(null);
        emitRuntimeStatus({
            active_prompt_id: null,
            cached_nodes: [],
            progress_node: null,
            progress_value: null,
            progress_max: null,
        });
        if (promptId && String(event?.type || "") !== "execution_success") {
            debugJobTracking("buffer:clear", {
                prompt_id: String(promptId || ""),
                reason: String(event?.type || ""),
            });
            clearPostExecutionWorkTimer();
            executionAssetBuffer.clear(promptId);
            if (policy.allowLiveStackFinalize) {
                liveAssetGate.clearPendingJob(promptId);
            }
            clearOrphanGenerationEntries();
        }
        if (String(event?.type || "") === "execution_success") {
            if (policy.usePostExecutionScan) {
                schedulePostExecutionScan(executionIdleGraceMs);
            } else {
                const flushDelayMs = hasBufferedGenerationFiles(promptId)
                    ? Math.min(executionIdleGraceMs, POST_EXECUTION_BUFFER_FLUSH_FAST_MS)
                    : executionIdleGraceMs;
                schedulePostExecutionWork(() => {
                    if (promptId) {
                        flushOrphanGenerationEntries(promptId);
                    }
                    flushBufferedGenerationIndex(promptId);
                }, flushDelayMs);
            }
        }
    }

    function handleNodeOutputsUpdated(nodeOutputs) {
        if (!isExecutionGroupingEnabled()) return;
        const files = [];
        for (const [, outputs] of nodeOutputs instanceof Map ? nodeOutputs.entries() : []) {
            const found = extractOutputFiles(outputs);
            if (found?.length) {
                for (const f of found) files.push(f);
            }
        }
        if (!files.length || !isExecutionGroupingEnabled()) return;
        debugJobTracking("node-outputs:updated", {
            prompt_id: resolveGenerationPromptId(),
            file_count: files.length,
        });
        bufferGenerationIndex(files, { prompt_id: resolveGenerationPromptId() });
    }

    return {
        notifyStacksUpdated,
        prepareLiveAssetEvent,
        isRenderableLiveAsset,
        handleExecutedEvent,
        handleExecutionStart,
        handleExecutionEnd,
        handleNodeOutputsUpdated,
    };
}
