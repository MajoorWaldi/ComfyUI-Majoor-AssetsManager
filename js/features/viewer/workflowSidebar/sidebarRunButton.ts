/**
 * sidebarRunButton - standalone "Queue Prompt" button for the MFV toolbar.
 *
 * Builds the prompt explicitly so MFV can force a preview method for this run.
 * Uses api.queuePrompt when available, and falls back to POST /prompt.
 */

import { APP_CONFIG } from "../../../app/config.js";
import { getRawHostApi, getRawHostApp } from "../../../app/hostAdapter.js";
import { t } from "../../../app/i18n.js";
import {
    ensureFloatingViewerProgressTracking,
    floatingViewerProgressService,
} from "../floatingViewerProgress.js";

const STATE = Object.freeze({
    IDLE: "idle",
    RUNNING: "running",
    STOPPING: "stopping",
    ERROR: "error",
});
const MFV_PREVIEW_METHODS = new Set(["default", "auto", "latent2rgb", "taesd", "none"]);
const PROGRESS_UPDATE_EVENT = "progress-update";

type LooseRecord = Record<string, any>;
type RunState = (typeof STATE)[keyof typeof STATE];
type PromptData = LooseRecord | null | undefined;
type QueueResult = { tracked: boolean };
type WidgetSnapshot = {
    widget: LooseRecord;
    value: unknown;
};
type GraphNodeCallback = (node: LooseRecord) => void;

const tx = (key: string, fallback = ""): string => t(key, fallback, undefined);

/**
 * Create Run/Pause/Stop controls for MFV.
 * @returns {{ el: HTMLDivElement, dispose: () => void }}
 */
export function createRunButton(): { el: HTMLDivElement; dispose: () => void } {
    const wrap = document.createElement("div");
    wrap.className = "mjr-mfv-run-controls";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mjr-icon-btn mjr-mfv-run-btn";
    const label = tx("tooltip.queuePrompt", "Queue Prompt (Run)");
    btn.title = label;
    btn.setAttribute("aria-label", label);

    const icon = document.createElement("i");
    icon.className = "pi pi-play";
    icon.setAttribute("aria-hidden", "true");
    btn.appendChild(icon);

    const stopBtn = document.createElement("button");
    stopBtn.type = "button";
    stopBtn.className = "mjr-icon-btn mjr-mfv-stop-btn";
    const stopIcon = document.createElement("i");
    stopIcon.className = "pi pi-stop";
    stopIcon.setAttribute("aria-hidden", "true");
    stopBtn.appendChild(stopIcon);

    wrap.appendChild(btn);
    wrap.appendChild(stopBtn);

    let state: RunState = STATE.IDLE;
    let queuePending = false;
    let stopPending = false;
    let errorResetTimer: ReturnType<typeof setTimeout> | null = null;

    function clearErrorResetTimer(): void {
        if (errorResetTimer == null) return;
        clearTimeout(errorResetTimer);
        errorResetTimer = null;
    }

    function setState(newState: RunState, { canStop = false }: { canStop?: boolean } = {}): void {
        state = newState;
        btn.classList.toggle("running", state === STATE.RUNNING);
        btn.classList.toggle("stopping", state === STATE.STOPPING);
        btn.classList.toggle("error", state === STATE.ERROR);
        btn.disabled = state === STATE.RUNNING || state === STATE.STOPPING;
        stopBtn.disabled = !canStop || state === STATE.STOPPING;
        stopBtn.classList.toggle("active", canStop && state !== STATE.STOPPING);
        stopBtn.classList.toggle("stopping", state === STATE.STOPPING);
        if (state === STATE.RUNNING || state === STATE.STOPPING) {
            icon.className = "pi pi-spin pi-spinner";
        } else {
            icon.className = "pi pi-play";
        }
    }

    function setStopLabel(): void {
        const stopLabel = tx("tooltip.queueStop", "Stop Generation");
        stopBtn.title = stopLabel;
        stopBtn.setAttribute("aria-label", stopLabel);
    }

    function syncFromProgress(
        snapshot: LooseRecord = floatingViewerProgressService.getSnapshot(),
        { authoritative = false }: { authoritative?: boolean } = {},
    ): void {
        const queue = Math.max(0, Number(snapshot?.queue) || 0);
        const prompt = snapshot?.prompt || null;
        const hasExecution = Boolean(prompt?.currentlyExecuting);
        // A prompt object that has finished executing (currentlyExecuting == null)
        // and has no error is effectively done â€” don't treat it as "queued".
        const promptStillActive = Boolean(
            prompt && (prompt.currentlyExecuting || prompt.errorDetails),
        );
        const hasQueuedPrompt = queue > 0 || promptStillActive;
        const isError = Boolean(prompt?.errorDetails);

        if (authoritative && queue === 0 && !prompt) {
            queuePending = false;
            stopPending = false;
        }

        const canStop = queuePending || stopPending || hasExecution || queue > 0;

        if (hasExecution || hasQueuedPrompt || queue > 0) {
            queuePending = false;
        }

        if (isError) {
            stopPending = false;
            clearErrorResetTimer();
            setState(STATE.ERROR, { canStop: false });
            return;
        }

        if (stopPending) {
            if (!canStop) {
                stopPending = false;
                syncFromProgress(snapshot);
                return;
            }
            setState(STATE.STOPPING, { canStop: false });
            return;
        }

        if (queuePending || hasExecution || hasQueuedPrompt || queue > 0) {
            clearErrorResetTimer();
            setState(STATE.RUNNING, { canStop: true });
            return;
        }

        clearErrorResetTimer();
        setState(STATE.IDLE, { canStop: false });
    }

    function enterTransientErrorState(): void {
        queuePending = false;
        stopPending = false;
        clearErrorResetTimer();
        setState(STATE.ERROR, { canStop: false });
        errorResetTimer = setTimeout(() => {
            errorResetTimer = null;
            syncFromProgress();
        }, 1500);
    }

    async function stopCurrentGeneration(): Promise<QueueResult> {
        const app = getRawHostApp();
        // Prefer live app.api for the same auth-context reasons as queueCurrentPrompt.
        const liveApi = app?.api && typeof app.api.interrupt === "function" ? app.api : null;
        const api = liveApi ?? getRawHostApi(app);

        if (api && typeof api.interrupt === "function") {
            await api.interrupt();
            return { tracked: true };
        }

        if (api && typeof api.fetchApi === "function") {
            const resp = await api.fetchApi("/interrupt", { method: "POST" });
            if (!resp?.ok) throw new Error(`POST /interrupt failed (${resp?.status})`);
            return { tracked: true };
        }

        const resp = await fetch("/interrupt", { method: "POST", credentials: "include" });
        if (!resp.ok) throw new Error(`POST /interrupt failed (${resp.status})`);
        return { tracked: false };
    }

    async function handleClick(): Promise<void> {
        if (state === STATE.RUNNING || state === STATE.STOPPING) return;
        queuePending = true;
        stopPending = false;
        syncFromProgress();
        try {
            const result = await queueCurrentPrompt();
            if (!result?.tracked) {
                queuePending = false;
            }
            syncFromProgress();
        } catch (e: any) {
            console.error?.("[MFV Run]", e);
            enterTransientErrorState();
        }
    }

    async function handleStopClick(): Promise<void> {
        if (state !== STATE.RUNNING) return;
        stopPending = true;
        syncFromProgress();
        try {
            const result = await stopCurrentGeneration();
            if (!result?.tracked) {
                stopPending = false;
                queuePending = false;
            }
            syncFromProgress();
        } catch (e: any) {
            console.error?.("[MFV Stop]", e);
            stopPending = false;
            syncFromProgress();
        } finally {
            // Progress events own the steady-state; this only clears fallback fetch cases.
        }
    }

    setStopLabel();
    stopBtn.disabled = true;

    btn.addEventListener("click", handleClick);
    stopBtn.addEventListener("click", handleStopClick);
    const handleProgressUpdate = (event: Event) => {
        syncFromProgress((event as CustomEvent<LooseRecord>)?.detail || floatingViewerProgressService.getSnapshot(), {
            authoritative: true,
        });
    };
    floatingViewerProgressService.addEventListener(PROGRESS_UPDATE_EVENT, handleProgressUpdate);
    void ensureFloatingViewerProgressTracking({ timeoutMs: 4000 }).catch((e: any) => {
        console.debug?.(e);
    });
    syncFromProgress();

    return {
        el: wrap,
        dispose() {
            clearErrorResetTimer();
            btn.removeEventListener("click", handleClick);
            stopBtn.removeEventListener("click", handleStopClick);
            floatingViewerProgressService.removeEventListener(
                PROGRESS_UPDATE_EVENT,
                handleProgressUpdate,
            );
        },
    };
}

export function resolveMfvPreviewMethod(value: any = APP_CONFIG.MFV_PREVIEW_METHOD): string {
    const normalized = String(value || "")
        .trim()
        .toLowerCase();
    if (MFV_PREVIEW_METHODS.has(normalized)) return normalized;
    return "taesd";
}

export function enrichPromptDataForMfv(
    promptData: PromptData,
    previewMethod: any = APP_CONFIG.MFV_PREVIEW_METHOD,
): LooseRecord {
    const normalizedMethod = resolveMfvPreviewMethod(previewMethod);
    const extraData = {
        ...(promptData?.extra_data || {}),
        extra_pnginfo: {
            ...(promptData?.extra_data?.extra_pnginfo || {}),
        },
    };
    if (promptData?.workflow != null) {
        extraData.extra_pnginfo.workflow = promptData.workflow;
    }
    if (normalizedMethod !== "default") {
        extraData.preview_method = normalizedMethod;
    } else {
        delete extraData.preview_method;
    }
    return {
        ...promptData,
        extra_data: extraData,
    };
}

export function buildPromptRequestBody(
    promptData: PromptData,
    {
        previewMethod = APP_CONFIG.MFV_PREVIEW_METHOD,
        clientId = null,
    }: { previewMethod?: unknown; clientId?: unknown } = {},
): LooseRecord {
    const enriched = enrichPromptDataForMfv(promptData, previewMethod);
    const body: LooseRecord = {
        prompt: enriched?.output,
        extra_data: enriched?.extra_data || {},
    };
    const safeClientId = String(clientId || "").trim();
    if (safeClientId) body.client_id = safeClientId;
    return body;
}

function resolveClientId(api: LooseRecord | null | undefined, app: LooseRecord | null | undefined): string {
    const candidates = [
        api?.clientId,
        api?.clientID,
        api?.client_id,
        app?.clientId,
        app?.clientID,
        app?.client_id,
    ];
    for (const value of candidates) {
        const safe = String(value || "").trim();
        if (safe) return safe;
    }
    return "";
}

function _getGraphNodes(graph: any): LooseRecord[] {
    if (!graph || typeof graph !== "object") return [];
    const graphRecord = graph as LooseRecord;
    if (Array.isArray(graphRecord.nodes)) return graphRecord.nodes.filter(Boolean);
    if (Array.isArray(graphRecord._nodes)) return graphRecord._nodes.filter(Boolean);

    const byId = graphRecord._nodes_by_id ?? graphRecord.nodes_by_id ?? null;
    if (byId instanceof Map) return Array.from(byId.values()).filter(Boolean) as LooseRecord[];
    if (byId && typeof byId === "object") return Object.values(byId).filter(Boolean) as LooseRecord[];

    return [];
}

function _getNodeSubgraphs(node: LooseRecord): LooseRecord[] {
    const candidates = [
        node?.subgraph,
        node?._subgraph,
        node?.subgraph?.graph,
        node?.subgraph?.lgraph,
        node?.properties?.subgraph,
        node?.subgraph_instance,
        node?.subgraph_instance?.graph,
        node?.inner_graph,
        node?.subgraph_graph,
    ].filter((graph): graph is LooseRecord => Boolean(graph && _getGraphNodes(graph).length > 0));

    if (Array.isArray(node?.nodes) && node.nodes.length > 0) {
        candidates.push({ nodes: node.nodes });
    }

    return candidates;
}

/**
 * Walk all nodes in a ComfyUI graph recursively, including inner nodes of any
 * subgraphs, and invoke callback(node) for each. This mirrors the graph-walk
 * ComfyUI's native queuePrompt performs before/after serialising the prompt.
 */
function _walkAllNodes(
    graph: any,
    callback: GraphNodeCallback,
    visited: Set<unknown> = new Set(),
): void {
    if (!graph || visited.has(graph)) return;
    visited.add(graph);

    for (const node of _getGraphNodes(graph)) {
        callback(node);
        for (const subgraph of _getNodeSubgraphs(node)) {
            _walkAllNodes(subgraph, callback, visited);
        }
    }
}

function _cloneQueuedWidgetValue<T>(value: T): T {
    if (value == null || typeof value !== "object") return value;
    try {
        return typeof structuredClone === "function"
            ? structuredClone(value)
            : JSON.parse(JSON.stringify(value));
    } catch {
        return value;
    }
}

function _captureQueuedWidgetSnapshots(graph: any): WidgetSnapshot[] {
    const snapshots: WidgetSnapshot[] = [];
    _walkAllNodes(graph, (node: any) => {
        for (const widget of node.widgets ?? []) {
            snapshots.push({
                widget,
                value: _cloneQueuedWidgetValue(widget?.value),
            });
        }
    });
    return snapshots;
}

function _restoreQueuedWidgetSnapshots(
    app: LooseRecord | null | undefined,
    snapshots: WidgetSnapshot[] | null,
): void {
    for (const entry of Array.isArray(snapshots) ? snapshots : []) {
        const widget = entry?.widget;
        if (!widget || typeof widget !== "object") continue;
        const restoredValue = _cloneQueuedWidgetValue(entry?.value);
        try {
            widget.value = restoredValue;
        } catch (e: any) {
            console.debug?.(e);
            continue;
        }
        try {
            widget.callback?.(restoredValue);
        } catch (e: any) {
            console.debug?.(e);
        }
    }
    try {
        app?.canvas?.draw?.(true, true);
    } catch (e: any) {
        console.debug?.(e);
    }
}

function _nodeLooksLikeApiNode(node: LooseRecord): boolean {
    const nodeCtor = node?.constructor as LooseRecord | undefined;
    const candidates = [node?.type, node?.comfyClass, node?.class_type, nodeCtor?.type];
    return candidates.some((value: any) => /Api$/i.test(String(value || "").trim()));
}

export function graphContainsApiNode(graph: any): boolean {
    let found = false;
    _walkAllNodes(graph, (node: any) => {
        if (found) return;
        found = _nodeLooksLikeApiNode(node);
    });
    return found;
}

/**
 * Queue the current workflow for execution.
 *
 * Tries, in order:
 *   1. app.api.queuePrompt  â€” live reference on the app object (always has the
 *      current auth session, same source as the native ComfyUI Queue button).
 *   2. api.queuePrompt      â€” broader detection via getComfyApi() (window.api, â€¦).
 *   3. api.fetchApi         â€” direct HTTP via ComfyUI's authenticated fetch helper.
 *   4. app.queuePrompt(0)   â€” native ComfyUI app-level path; handles API Node
 *      ComfyOrg auth tokens, beforeQueued/afterQueued and CSRF natively. Used
 *      for API Node workflows or when no direct API path is available.
 *   5. fetch (last resort)  â€” raw fetch with credentials:'include' for cookie auth.
 *
 * Paths 1-3 and 5 manually mirror ComfyUI's beforeQueued/afterQueued widget cycle
 * so that control_after_generate (randomize / increment / decrement) is applied
 * correctly on every run, including inside subgraph inner nodes.
 */
async function queueCurrentPrompt(): Promise<QueueResult> {
    const app = getRawHostApp();
    if (!app) throw new Error("ComfyUI app not available");

    // Resolve API references early so we can choose the path before touching
    // widget state (beforeQueued must not be called twice for the same run).
    const liveApi = app?.api && typeof app.api.queuePrompt === "function" ? app.api : null;
    const api = liveApi ?? getRawHostApi(app);
    const hasApiPath = Boolean(
        (api && typeof api.queuePrompt === "function") ||
        (api && typeof api.fetchApi === "function"),
    );

    const rootGraph = app.rootGraph ?? app.graph;
    const mustUseNativeQueue = graphContainsApiNode(rootGraph);

    // Path 4: delegate entirely to app.queuePrompt which handles beforeQueued,
    // graphToPrompt, afterQueued, and auth internally. API Node workflows need
    // this because ComfyUI injects auth_token_comfy_org during native queueing.
    if ((mustUseNativeQueue || !hasApiPath) && typeof app.queuePrompt === "function") {
        await app.queuePrompt(0);
        return { tracked: true };
    }

    let widgetSnapshots: WidgetSnapshot[] | null = null;

    // Paths 1-3 and 5: mirror ComfyUI's native beforeQueued cycle.
    // ComfyUI's queuePrompt walks ALL nodes (including inner subgraph nodes) and
    // calls widget.beforeQueued() before serialising the graph. This is what
    // triggers control_after_generate (randomize / increment / decrement) to
    // update the seed widget value before graphToPrompt reads it.
    try {
        widgetSnapshots = _captureQueuedWidgetSnapshots(rootGraph);
        _walkAllNodes(rootGraph, (node: any) => {
            for (const w of node.widgets ?? []) {
                w.beforeQueued?.({ isPartialExecution: false });
            }
        });

        const promptData =
            typeof app.graphToPrompt === "function" ? await app.graphToPrompt() : null;
        if (!promptData?.output) throw new Error("graphToPrompt returned empty output");

        let result;

        if (api && typeof api.queuePrompt === "function") {
            // Prefer the live app.api reference â€” matches the native Queue button's
            // auth context and avoids stale cached references after session renewal.
            await api.queuePrompt(0, enrichPromptDataForMfv(promptData));
            result = { tracked: true };
        } else if (api && typeof api.fetchApi === "function") {
            const resp = await api.fetchApi("/prompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    buildPromptRequestBody(promptData, {
                        clientId: resolveClientId(api, app),
                    }),
                ),
            });
            if (!resp?.ok) throw new Error(`POST /prompt failed (${resp?.status})`);
            result = { tracked: true };
        } else {
            const resp = await fetch("/prompt", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    buildPromptRequestBody(promptData, {
                        clientId: resolveClientId(null, app),
                    }),
                ),
            });
            if (!resp.ok) throw new Error(`POST /prompt failed (${resp.status})`);
            result = { tracked: false };
        }

        // Mirror ComfyUI's afterQueued cycle and redraw the canvas so that widget
        // displays (e.g. the new seed value) reflect the post-queue state immediately.
        _walkAllNodes(rootGraph, (node: any) => {
            for (const w of node.widgets ?? []) {
                w.afterQueued?.({ isPartialExecution: false });
            }
        });
        app.canvas?.draw?.(true, true);

        return result;
    } catch (error: any) {
        _restoreQueuedWidgetSnapshots(app, widgetSnapshots);
        throw error;
    }
}
