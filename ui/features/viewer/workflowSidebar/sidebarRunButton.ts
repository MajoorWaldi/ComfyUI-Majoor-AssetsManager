/**
 * sidebarRunButton - standalone "Queue Prompt" button for the MFV toolbar.
 *
 * Builds the prompt explicitly so MFV can force a preview method for this run.
 * Uses api.queuePrompt when available, and falls back to POST /prompt.
 */

import { APP_CONFIG } from "../../../app/config.js";
import { getHostRootGraph, walkGraphNodes } from "../../../app/graphTraversal.js";
import { getRawHostApp, interruptHostExecution, queueHostPrompt, refreshHostCanvasGraph } from "../../../app/hostAdapter.js";
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
        // and has no error is effectively done  -  don't treat it as "queued".
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
        const tracked = await interruptHostExecution(getRawHostApp());
        return { tracked };
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
    return APP_CONFIG.MFV_PREVIEW_METHOD || "auto";
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

function _nodeLooksLikeApiNode(node: LooseRecord): boolean {
    const nodeCtor = node?.constructor as LooseRecord | undefined;
    const candidates = [node?.type, node?.comfyClass, node?.class_type, nodeCtor?.type];
    return candidates.some((value: any) => /Api$/i.test(String(value || "").trim()));
}

export function graphContainsApiNode(graph: any): boolean {
    let found = false;
    walkGraphNodes(graph, ({ node }) => {
        if (found) return;
        found = _nodeLooksLikeApiNode(node);
    });
    return found;
}

/**
 * Queue the current workflow for execution.
 *
 * Tries, in order:
 *   1. app.api.queuePrompt   -  live reference on the app object (always has the
 *      current auth session, same source as the native ComfyUI Queue button).
 *   2. api.queuePrompt       -  broader detection via getComfyApi() (window.api, ...).
 *   3. api.fetchApi          -  direct HTTP via ComfyUI's authenticated fetch helper.
 *   4. app.queuePrompt(0)    -  native ComfyUI app-level path; handles API Node
 *      ComfyOrg auth tokens, beforeQueued/afterQueued and CSRF natively. Used
 *      for API Node workflows or when no direct API path is available.
 *   5. fetch (last resort)   -  raw fetch with credentials:'include' for cookie auth.
 *
 * Paths 1-3 and 5 manually mirror ComfyUI's beforeQueued/afterQueued widget cycle
 * so that control_after_generate (randomize / increment / decrement) is applied
 * correctly on every run, including inside subgraph inner nodes.
 */
async function queueCurrentPrompt(): Promise<QueueResult> {
    const app = getRawHostApp();
    if (!app) throw new Error("ComfyUI app not available");

    const rootGraph = getHostRootGraph(app);
    const mustUseNativeQueue = graphContainsApiNode(rootGraph);

    const tracked = await queueHostPrompt({
        app,
        forceNativeQueue: mustUseNativeQueue,
        resolvePromptData(runtimeApp: any) {
            return typeof runtimeApp?.graphToPrompt === "function"
                ? runtimeApp.graphToPrompt()
                : null;
        },
        enrichPromptData(promptData: any) {
            return enrichPromptDataForMfv(promptData);
        },
        buildPromptRequestBody(promptData: any, context: { clientId: string }) {
            return buildPromptRequestBody(promptData, { clientId: context.clientId });
        },
    });
    return { tracked };
}
