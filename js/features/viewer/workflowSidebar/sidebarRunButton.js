/**
 * sidebarRunButton - standalone "Queue Prompt" button for the MFV toolbar.
 *
 * Builds the prompt explicitly so MFV can force a preview method for this run.
 * Uses api.queuePrompt when available, and falls back to POST /prompt.
 */

import { getComfyApp, getComfyApi } from "../../../app/comfyApiBridge.js";
import { APP_CONFIG } from "../../../app/config.js";
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

/**
 * Create Run/Pause/Stop controls for MFV.
 * @returns {{ el: HTMLDivElement, dispose: () => void }}
 */
export function createRunButton() {
    const wrap = document.createElement("div");
    wrap.className = "mjr-mfv-run-controls";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mjr-icon-btn mjr-mfv-run-btn";
    const label = t("tooltip.queuePrompt", "Queue Prompt (Run)");
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

    let state = STATE.IDLE;
    let queuePending = false;
    let stopPending = false;
    let errorResetTimer = null;

    function clearErrorResetTimer() {
        if (errorResetTimer == null) return;
        clearTimeout(errorResetTimer);
        errorResetTimer = null;
    }

    function setState(newState, { canStop = false } = {}) {
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

    function setStopLabel() {
        const stopLabel = t("tooltip.queueStop", "Stop Generation");
        stopBtn.title = stopLabel;
        stopBtn.setAttribute("aria-label", stopLabel);
    }

    function syncFromProgress(
        snapshot = floatingViewerProgressService.getSnapshot(),
        { authoritative = false } = {},
    ) {
        const queue = Math.max(0, Number(snapshot?.queue) || 0);
        const prompt = snapshot?.prompt || null;
        const hasExecution = Boolean(prompt?.currentlyExecuting);
        // A prompt object that has finished executing (currentlyExecuting == null)
        // and has no error is effectively done — don't treat it as "queued".
        const promptStillActive = Boolean(prompt && (prompt.currentlyExecuting || prompt.errorDetails));
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

    function enterTransientErrorState() {
        queuePending = false;
        stopPending = false;
        clearErrorResetTimer();
        setState(STATE.ERROR, { canStop: false });
        errorResetTimer = setTimeout(() => {
            errorResetTimer = null;
            syncFromProgress();
        }, 1500);
    }

    async function stopCurrentGeneration() {
        const app = getComfyApp();
        // Prefer live app.api for the same auth-context reasons as queueCurrentPrompt.
        const liveApi = (app?.api && typeof app.api.interrupt === "function") ? app.api : null;
        const api = liveApi ?? getComfyApi(app);

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

    async function handleClick() {
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
        } catch (e) {
            console.error?.("[MFV Run]", e);
            enterTransientErrorState();
        }
    }

    async function handleStopClick() {
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
        } catch (e) {
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
    const handleProgressUpdate = (event) => {
        syncFromProgress(event?.detail || floatingViewerProgressService.getSnapshot(), {
            authoritative: true,
        });
    };
    floatingViewerProgressService.addEventListener(PROGRESS_UPDATE_EVENT, handleProgressUpdate);
    void ensureFloatingViewerProgressTracking({ timeoutMs: 4000 }).catch((e) => {
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

export function resolveMfvPreviewMethod(value = APP_CONFIG.MFV_PREVIEW_METHOD) {
    const normalized = String(value || "").trim().toLowerCase();
    if (MFV_PREVIEW_METHODS.has(normalized)) return normalized;
    return "taesd";
}

export function enrichPromptDataForMfv(promptData, previewMethod = APP_CONFIG.MFV_PREVIEW_METHOD) {
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
    promptData,
    { previewMethod = APP_CONFIG.MFV_PREVIEW_METHOD, clientId = null } = {},
) {
    const enriched = enrichPromptDataForMfv(promptData, previewMethod);
    const body = {
        prompt: enriched?.output,
        extra_data: enriched?.extra_data || {},
    };
    const safeClientId = String(clientId || "").trim();
    if (safeClientId) body.client_id = safeClientId;
    return body;
}

function resolveClientId(api, app) {
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

/**
 * Walk all nodes in a ComfyUI graph recursively, including inner nodes of any
 * subgraphs, and invoke callback(node) for each. This mirrors the graph-walk
 * ComfyUI's native queuePrompt performs before/after serialising the prompt.
 */
function _walkAllNodes(graph, callback) {
    for (const node of graph?.nodes ?? []) {
        callback(node);
        // Recurse into ComfyUI subgraph inner nodes.
        if (node.subgraph?.nodes) {
            _walkAllNodes(node.subgraph, callback);
        }
    }
}

/**
 * Queue the current workflow for execution.
 *
 * Tries, in order:
 *   1. app.api.queuePrompt  — live reference on the app object (always has the
 *      current auth session, same source as the native ComfyUI Queue button).
 *   2. api.queuePrompt      — broader detection via getComfyApi() (window.api, …).
 *   3. api.fetchApi         — direct HTTP via ComfyUI's authenticated fetch helper.
 *   4. app.queuePrompt(0)   — native ComfyUI app-level path; handles auth tokens,
 *      beforeQueued/afterQueued and CSRF natively; used only when no direct API
 *      path is available (no preview-method enrichment on this path).
 *   5. fetch (last resort)  — raw fetch with credentials:'include' for cookie auth.
 *
 * Paths 1-3 and 5 manually mirror ComfyUI's beforeQueued/afterQueued widget cycle
 * so that control_after_generate (randomize / increment / decrement) is applied
 * correctly on every run, including inside subgraph inner nodes.
 */
async function queueCurrentPrompt() {
    const app = getComfyApp();
    if (!app) throw new Error("ComfyUI app not available");

    // Resolve API references early so we can choose the path before touching
    // widget state (beforeQueued must not be called twice for the same run).
    const liveApi = (app?.api && typeof app.api.queuePrompt === "function") ? app.api : null;
    const api = liveApi ?? getComfyApi(app);
    const hasApiPath = Boolean(
        (api && typeof api.queuePrompt === "function") ||
        (api && typeof api.fetchApi === "function"),
    );

    // Path 4: delegate entirely to app.queuePrompt which handles beforeQueued,
    // graphToPrompt, afterQueued, and auth internally. Only taken when no direct
    // API path is available because it cannot carry MFV preview-method enrichment.
    if (!hasApiPath && typeof app.queuePrompt === "function") {
        await app.queuePrompt(0);
        return { tracked: true };
    }

    // Paths 1-3 and 5: mirror ComfyUI's native beforeQueued cycle.
    // ComfyUI's queuePrompt walks ALL nodes (including inner subgraph nodes) and
    // calls widget.beforeQueued() before serialising the graph. This is what
    // triggers control_after_generate (randomize / increment / decrement) to
    // update the seed widget value before graphToPrompt reads it.
    const rootGraph = app.rootGraph ?? app.graph;
    _walkAllNodes(rootGraph, (node) => {
        for (const w of node.widgets ?? []) {
            w.beforeQueued?.({ isPartialExecution: false });
        }
    });

    const promptData = typeof app.graphToPrompt === "function"
        ? await app.graphToPrompt()
        : null;
    if (!promptData?.output) throw new Error("graphToPrompt returned empty output");

    let result;

    if (api && typeof api.queuePrompt === "function") {
        // Prefer the live app.api reference — matches the native Queue button's
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
    _walkAllNodes(rootGraph, (node) => {
        for (const w of node.widgets ?? []) {
            w.afterQueued?.({ isPartialExecution: false });
        }
    });
    app.canvas?.draw?.(true, true);

    return result;
}
