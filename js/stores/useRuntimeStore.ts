/**
 * Pinia store — Extension runtime state
 *
 * Replaces the Symbol-keyed globalThis object in runtimeState.js with a
 * reactive Pinia store.  Tracks enrichment activity, execution progress,
 * and the ComfyUI API/app references used by realtime listeners.
 *
 * Legacy code that still reads from runtimeState.js can coexist during the
 * incremental migration phase.
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";

interface RuntimeExecutionStatus {
    active_prompt_id?: string | number | null;
    queue_remaining?: number | null;
    progress_node?: string | number | null;
    progress_value?: number | null;
    progress_max?: number | null;
    cached_nodes?: unknown[] | null;
}

export const useRuntimeStore = defineStore("mjr-runtime", () => {
    // ── ComfyUI references ────────────────────────────────────────────────────
    /** The ComfyUI `app` object, set once during extension setup. */
    const comfyApp = ref(null);
    /** The ComfyUI `api` WebSocket client. */
    const comfyApi = ref(null);

    // ── Enrichment state ──────────────────────────────────────────────────────
    const enrichmentActive = ref(false);
    const enrichmentQueueLength = ref(0);

    // ── Execution runtime ─────────────────────────────────────────────────────
    const activePromptId = ref<string | number | null>(null);
    const queueRemaining = ref<number | null>(null);
    const progressNode = ref<string | number | null>(null);
    const progressValue = ref<number | null>(null);
    const progressMax = ref<number | null>(null);
    const cachedNodes = ref<unknown[]>([]);

    // ── Computed ──────────────────────────────────────────────────────────────
    const isExecuting = computed(() => !!activePromptId.value);
    const progressPercent = computed(() => {
        const v = progressValue.value;
        const m = progressMax.value;
        if (!m || m <= 0 || v == null) return 0;
        return Math.round((v / m) * 100);
    });

    // ── Actions ───────────────────────────────────────────────────────────────
    function setComfyApp(app: any) {
        comfyApp.value = app;
    }

    function setComfyApi(api: any) {
        comfyApi.value = api;
    }

    function setEnrichmentState(active: any, queueLength: any) {
        enrichmentActive.value = !!active;
        enrichmentQueueLength.value = Math.max(0, Number(queueLength || 0) || 0);
    }

    function getEnrichmentState() {
        return {
            active: enrichmentActive.value,
            queueLength: enrichmentQueueLength.value,
        };
    }

    function applyExecutionStatus(partial: RuntimeExecutionStatus = {}) {
        if (partial.active_prompt_id !== undefined) activePromptId.value = partial.active_prompt_id;
        if (partial.queue_remaining !== undefined) queueRemaining.value = partial.queue_remaining;
        if (partial.progress_node !== undefined) progressNode.value = partial.progress_node;
        if (partial.progress_value !== undefined) progressValue.value = partial.progress_value;
        if (partial.progress_max !== undefined) progressMax.value = partial.progress_max;
        if (partial.cached_nodes !== undefined) cachedNodes.value = partial.cached_nodes ?? [];
    }

    function resetExecution() {
        activePromptId.value = null;
        queueRemaining.value = null;
        progressNode.value = null;
        progressValue.value = null;
        progressMax.value = null;
        cachedNodes.value = [];
    }

    return {
        // state
        comfyApp,
        comfyApi,
        enrichmentActive,
        enrichmentQueueLength,
        activePromptId,
        queueRemaining,
        progressNode,
        progressValue,
        progressMax,
        cachedNodes,
        // computed
        isExecuting,
        progressPercent,
        // actions
        setComfyApp,
        setComfyApi,
        setEnrichmentState,
        getEnrichmentState,
        applyExecutionStatus,
        resetExecution,
    };
});
