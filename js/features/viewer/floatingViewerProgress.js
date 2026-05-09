import { getRawHostApi, getRawHostApp, waitForRawHostApi } from "../../app/hostAdapter.js";

const PROGRESS_UPDATE_EVENT = "progress-update";
const QUEUE_PROMPT_PATCH_KEY = Symbol.for("mjr.mfv.progress.queuePromptPatch");
const GLOBAL_SERVICE_KEY = "__MJR_MFV_PROGRESS_SERVICE__";

function getGlobalHost() {
    if (typeof globalThis !== "undefined") return globalThis;
    if (typeof window !== "undefined") return window;
    return {};
}

function makeCustomEvent(type, detail) {
    if (typeof CustomEvent === "function") {
        return new CustomEvent(type, { detail });
    }
    const event = typeof Event === "function" ? new Event(type) : { type };
    event.detail = detail;
    return event;
}

export class FloatingViewerPromptExecution {
    constructor(id, getApp = () => getRawHostApp()) {
        this.id = String(id || "");
        this.promptApi = null;
        this.executedNodeIds = [];
        this.totalNodes = 0;
        this.currentlyExecuting = null;
        this.errorDetails = null;
        this._getApp = typeof getApp === "function" ? getApp : () => null;
    }

    setPrompt(prompt) {
        const output = prompt && typeof prompt === "object" ? prompt.output : null;
        this.promptApi = output && typeof output === "object" ? output : null;
        this.totalNodes = this.promptApi ? Object.keys(this.promptApi).length : 0;
    }

    getApiNode(nodeId) {
        return this.promptApi?.[String(nodeId)] || null;
    }

    getNodeLabel(nodeId) {
        const apiNode = this.getApiNode(nodeId);
        let label = apiNode?._meta?.title || apiNode?.class_type || "";
        if (!label) {
            const graphNode = this._getApp?.()?.graph?.getNodeById?.(Number(nodeId));
            label = graphNode?.title || graphNode?.type || "";
        }
        return String(label || "").trim();
    }

    markExecuted(nodeId) {
        const safeNodeId = String(nodeId || "").trim();
        if (!safeNodeId) return;
        if (!this.executedNodeIds.includes(safeNodeId)) {
            this.executedNodeIds.push(safeNodeId);
        }
    }

    executing(nodeId, step, maxSteps) {
        if (nodeId == null) {
            this.currentlyExecuting = null;
            return;
        }
        const nextNodeId = String(nodeId || "").trim();
        if (!nextNodeId) return;

        if (this.currentlyExecuting?.nodeId !== nextNodeId) {
            if (this.currentlyExecuting != null) {
                this.markExecuted(this.currentlyExecuting.nodeId);
            }
            this.currentlyExecuting = {
                nodeId: nextNodeId,
                nodeLabel: this.getNodeLabel(nextNodeId),
                pass: 0,
            };

            const apiNode = this.getApiNode(nextNodeId);
            if (!this.currentlyExecuting.nodeLabel) {
                this.currentlyExecuting.nodeLabel = this.getNodeLabel(nextNodeId);
            }
            if (apiNode?.class_type === "UltimateSDUpscale") {
                this.currentlyExecuting.pass -= 1;
                this.currentlyExecuting.maxPasses = -1;
            } else if (apiNode?.class_type === "IterativeImageUpscale") {
                this.currentlyExecuting.maxPasses = Number(apiNode?.inputs?.steps) || -1;
            }
        }

        if (step != null) {
            const numericStep = Number(step);
            const numericMax = Number(maxSteps);
            if (!Number.isFinite(numericStep)) return;
            if (
                !this.currentlyExecuting.step ||
                numericStep < Number(this.currentlyExecuting.step)
            ) {
                this.currentlyExecuting.pass += 1;
            }
            this.currentlyExecuting.step = numericStep;
            this.currentlyExecuting.maxSteps = Number.isFinite(numericMax) ? numericMax : null;
        }
    }

    error(details) {
        this.errorDetails = details || null;
    }
}

export class FloatingViewerProgressService extends EventTarget {
    constructor({
        getApi = (app) => getRawHostApi(app),
        getApp = () => getRawHostApp(),
        waitForApi = (options) => waitForRawHostApi(options),
    } = {}) {
        super();
        this._getApi = getApi;
        this._getApp = getApp;
        this._waitForApi = waitForApi;
        this.promptsMap = new Map();
        this.currentExecution = null;
        this.lastQueueRemaining = 0;
        this._api = null;
        this._listenerEntries = [];
        this._initPromise = null;
    }

    getSnapshot() {
        return {
            queue: this.lastQueueRemaining,
            prompt: this.currentExecution,
        };
    }

    getCurrentNodeId() {
        const prompt = this.currentExecution;
        return String(
            prompt?.errorDetails?.node_id || prompt?.currentlyExecuting?.nodeId || "",
        ).trim();
    }

    getOrMakePrompt(id) {
        const safeId = String(id || "").trim() || "unknown";
        let prompt = this.promptsMap.get(safeId);
        if (!prompt) {
            prompt = new FloatingViewerPromptExecution(safeId, this._getApp);
            this.promptsMap.set(safeId, prompt);
        }
        return prompt;
    }

    async ensureInitialized({ api = null, app = null, timeoutMs = 0 } = {}) {
        if (api && this._api === api) return api;
        if (!api && this._api) return this._api;
        if (this._initPromise) return this._initPromise;

        this._initPromise = this._ensureInitializedInternal({ api, app, timeoutMs }).finally(() => {
            this._initPromise = null;
        });
        return this._initPromise;
    }

    async _ensureInitializedInternal({ api = null, app = null, timeoutMs = 0 } = {}) {
        let resolvedApi = api || this._getApi?.(app) || null;
        if (!resolvedApi && timeoutMs > 0 && typeof this._waitForApi === "function") {
            try {
                resolvedApi = await this._waitForApi({ app, timeoutMs });
            } catch (e) {
                console.debug?.(e);
            }
        }
        if (!resolvedApi) return null;
        this._attachApi(resolvedApi);
        return resolvedApi;
    }

    _attachApi(api) {
        if (!api || typeof api.addEventListener !== "function") return;
        if (this._api === api) return;
        this.dispose({ resetPatchedQueuePrompt: false, keepState: true });
        this._api = api;
        this._patchQueuePrompt(api);
        this._attachApiListeners(api);
    }

    _patchQueuePrompt(api) {
        if (!api || typeof api.queuePrompt !== "function") return;
        const existing = api.queuePrompt?.[QUEUE_PROMPT_PATCH_KEY];
        if (existing?.service === this) return;
        if (existing?.service && existing.service !== this) return;

        const originalQueuePrompt = api.queuePrompt;
        const service = this;

        const wrappedQueuePrompt = async function (number, prompt, ...args) {
            let response;
            try {
                response = await originalQueuePrompt.apply(this, [number, prompt, ...args]);
            } catch (error) {
                const promptExecution = service.getOrMakePrompt("error");
                promptExecution.error({ exception_type: "Unknown." });
                service.currentExecution = promptExecution;
                service.dispatchProgressUpdate();
                throw error;
            }

            const promptId = String(response?.prompt_id || response?.promptId || "").trim();
            if (promptId) {
                const promptExecution = service.getOrMakePrompt(promptId);
                promptExecution.setPrompt(prompt);
                if (!service.currentExecution) {
                    service.currentExecution = promptExecution;
                }
                service.dispatchEvent(
                    makeCustomEvent("queue-prompt", {
                        prompt: promptExecution,
                    }),
                );
                service.dispatchProgressUpdate();
            }
            return response;
        };

        Object.defineProperty(wrappedQueuePrompt, QUEUE_PROMPT_PATCH_KEY, {
            configurable: true,
            value: {
                service,
                originalQueuePrompt,
            },
        });

        api.queuePrompt = wrappedQueuePrompt;
    }

    _attachApiListeners(api) {
        this._attachListener(api, "status", (event) => {
            if (!event?.detail?.exec_info) return;
            this.lastQueueRemaining = Number(event.detail.exec_info.queue_remaining) || 0;
            this.dispatchProgressUpdate();
        });

        this._attachListener(api, "execution_start", (event) => {
            const promptId = String(
                event?.detail?.prompt_id || event?.detail?.promptId || "",
            ).trim();
            if (!promptId) return;
            this.currentExecution = this.getOrMakePrompt(promptId);
            this.dispatchProgressUpdate();
        });

        this._attachListener(api, "executing", (event) => {
            if (!this.currentExecution) {
                this.currentExecution = this.getOrMakePrompt("unknown");
            }
            this.currentExecution.executing(event?.detail);
            if (event?.detail == null) {
                this.currentExecution = null;
            }
            this.dispatchProgressUpdate();
        });

        this._attachListener(api, "progress", (event) => {
            const detail = event?.detail || {};
            if (!this.currentExecution) {
                this.currentExecution = this.getOrMakePrompt(detail.prompt_id || detail.promptId);
            }
            this.currentExecution.executing(detail.node, detail.value, detail.max);
            this.dispatchProgressUpdate();
        });

        this._attachListener(api, "execution_cached", (event) => {
            const detail = event?.detail || {};
            if (!this.currentExecution) {
                this.currentExecution = this.getOrMakePrompt(detail.prompt_id || detail.promptId);
            }
            for (const cached of Array.isArray(detail.nodes) ? detail.nodes : []) {
                this.currentExecution.markExecuted(cached);
            }
            this.dispatchProgressUpdate();
        });

        this._attachListener(api, "executed", (event) => {
            const detail = event?.detail || {};
            if (!this.currentExecution) {
                const promptId = String(detail.prompt_id || detail.promptId || "").trim();
                if (promptId) {
                    this.currentExecution = this.getOrMakePrompt(promptId);
                }
            }
        });

        this._attachListener(api, "execution_error", (event) => {
            const detail = event?.detail || {};
            if (!this.currentExecution) {
                this.currentExecution = this.getOrMakePrompt(detail.prompt_id || detail.promptId);
            }
            this.currentExecution?.error(detail);
            this.dispatchProgressUpdate();
        });

        const clearCurrentExecution = () => {
            if (this.currentExecution) {
                this.currentExecution.executing(null);
            }
            this.currentExecution = null;
            this.dispatchProgressUpdate();
        };
        this._attachListener(api, "execution_success", clearCurrentExecution);
        this._attachListener(api, "execution_interrupted", clearCurrentExecution);
    }

    _attachListener(api, type, handler) {
        api.addEventListener(type, handler);
        this._listenerEntries.push({ api, type, handler });
    }

    dispatchProgressUpdate() {
        this.dispatchEvent(makeCustomEvent(PROGRESS_UPDATE_EVENT, this.getSnapshot()));
    }

    dispose({ resetPatchedQueuePrompt = false, keepState = false } = {}) {
        for (const { api, type, handler } of this._listenerEntries.splice(0)) {
            try {
                api?.removeEventListener?.(type, handler);
            } catch (e) {
                console.debug?.(e);
            }
        }

        if (
            resetPatchedQueuePrompt &&
            this._api?.queuePrompt?.[QUEUE_PROMPT_PATCH_KEY]?.service === this
        ) {
            try {
                const original =
                    this._api.queuePrompt[QUEUE_PROMPT_PATCH_KEY]?.originalQueuePrompt || null;
                if (typeof original === "function") {
                    this._api.queuePrompt = original;
                }
            } catch (e) {
                console.debug?.(e);
            }
        }

        this._api = null;
        if (!keepState) {
            this.promptsMap.clear();
            this.currentExecution = null;
            this.lastQueueRemaining = 0;
        }
    }
}

const globalHost = getGlobalHost();

export const floatingViewerProgressService =
    globalHost[GLOBAL_SERVICE_KEY] || new FloatingViewerProgressService();

if (!globalHost[GLOBAL_SERVICE_KEY]) {
    globalHost[GLOBAL_SERVICE_KEY] = floatingViewerProgressService;
}

export function ensureFloatingViewerProgressTracking(options = {}) {
    return floatingViewerProgressService.ensureInitialized(options);
}

function formatProgressText(detail) {
    const queue = Math.max(0, Number(detail?.queue) || 0);
    const prompt = detail?.prompt || null;

    if (prompt?.errorDetails) {
        const exceptionType = String(
            prompt.errorDetails?.exception_type || "Execution error",
        ).trim();
        const nodeId = String(prompt.errorDetails?.node_id || "").trim();
        const nodeType = String(prompt.errorDetails?.node_type || "").trim();
        return [exceptionType, nodeId, nodeType].filter(Boolean).join(" ");
    }

    if (prompt?.currentlyExecuting) {
        const current = prompt.currentlyExecuting;
        let progressText = `(${queue}) `;
        if (!prompt.totalNodes) {
            progressText += "??%";
        } else {
            const percent = (prompt.executedNodeIds.length / prompt.totalNodes) * 100;
            progressText += `${Math.round(percent)}%`;
        }

        let stepsLabel = "";
        if (current.step != null && current.maxSteps) {
            const stepPercent = (Number(current.step) / Number(current.maxSteps)) * 100;
            if (current.pass > 1 || current.maxPasses != null) {
                stepsLabel += `#${current.pass}`;
                if (current.maxPasses && current.maxPasses > 0) {
                    stepsLabel += `/${current.maxPasses}`;
                }
                stepsLabel += " - ";
            }
            stepsLabel += `${Math.round(stepPercent)}%`;
        }

        const nodeLabel = String(current.nodeLabel || "").trim();
        if (nodeLabel || stepsLabel) {
            progressText += ` - ${nodeLabel || "???"}${stepsLabel ? ` (${stepsLabel})` : ""}`;
        }
        return progressText;
    }

    if (queue > 0) {
        return `(${queue}) Running... in another tab`;
    }
    return "Idle";
}

export function formatFloatingViewerMediaProgressText(detail) {
    const prompt = detail?.prompt || null;

    if (prompt?.errorDetails) {
        const errorDetails = prompt?.errorDetails || {};
        const nodeLabel = String(
            prompt?.currentlyExecuting?.nodeLabel ||
                errorDetails?.node_type ||
                errorDetails?.node_id ||
                "Execution",
        ).trim();
        const rawMessage =
            errorDetails?.exception_message ??
            errorDetails?.error ??
            errorDetails?.message ??
            errorDetails?.detail ??
            errorDetails?.reason ??
            "";
        const normalizedMessage = Array.isArray(rawMessage)
            ? rawMessage
                  .map((item) => String(item || "").trim())
                  .filter(Boolean)
                  .join(" | ")
            : String(rawMessage || "").trim();
        const compactMessage = normalizedMessage.replace(/\s+/g, " ").trim();
        if (compactMessage) {
            return `${nodeLabel} - ${compactMessage}`;
        }
        return `${nodeLabel} - Error`;
    }

    const current = prompt?.currentlyExecuting || null;
    if (!current) return "";

    const nodeLabel = String(current.nodeLabel || current.nodeId || "Node").trim();
    const step = Number(current.step);
    const maxSteps = Number(current.maxSteps);
    if (Number.isFinite(step) && Number.isFinite(maxSteps) && maxSteps > 0) {
        if (current.pass > 1) {
            return `${nodeLabel} #${current.pass} - ${step}/${maxSteps}`;
        }
        return `${nodeLabel} - ${step}/${maxSteps}`;
    }
    return nodeLabel;
}

function applyFloatingViewerProgressState(viewer, detail) {
    if (!viewer?._progressEl && !viewer?._mediaProgressEl) return;

    const prompt = detail?.prompt || null;
    const currentNodeId = String(
        prompt?.errorDetails?.node_id || prompt?.currentlyExecuting?.nodeId || "",
    ).trim();

    let nodesWidth = "0%";
    let stepsWidth = "0%";
    const isError = !!prompt?.errorDetails;

    if (prompt?.currentlyExecuting) {
        if (prompt.totalNodes > 0) {
            const percent = (prompt.executedNodeIds.length / prompt.totalNodes) * 100;
            nodesWidth = `${Math.max(2, Math.round(percent * 100) / 100)}%`;
        }

        const step = Number(prompt.currentlyExecuting?.step);
        const maxSteps = Number(prompt.currentlyExecuting?.maxSteps);
        if (Number.isFinite(step) && Number.isFinite(maxSteps) && maxSteps > 0) {
            stepsWidth = `${Math.max(0, Math.min(100, (step / maxSteps) * 100))}%`;
        }
    } else if (isError) {
        nodesWidth = "100%";
        stepsWidth = "100%";
    }

    viewer._progressCurrentNodeId = currentNodeId || null;
    if (viewer._progressEl) {
        viewer._progressNodesEl.style.width = nodesWidth;
        viewer._progressStepsEl.style.width = stepsWidth;
        viewer._progressTextEl.textContent = formatProgressText(detail);
        viewer._progressEl.classList.toggle("is-error", isError);
        viewer._progressEl.classList.toggle("is-clickable", Boolean(currentNodeId));
        viewer._progressEl.title = currentNodeId
            ? "Execution progress - click to center active node"
            : "Execution progress";
    }

    if (viewer._mediaProgressEl) {
        const mediaLabel = formatFloatingViewerMediaProgressText(detail);
        viewer._mediaProgressTextEl.textContent = mediaLabel;
        viewer._mediaProgressEl.title = mediaLabel || "";
        viewer._mediaProgressEl.classList.toggle("is-error", isError);
        viewer._mediaProgressEl.classList.toggle("is-visible", Boolean(mediaLabel));
    }
}

function centerFloatingViewerProgressNode(viewer, nodeId) {
    const safeNodeId = String(nodeId || "").trim();
    if (!safeNodeId) return false;
    try {
        const app = getComfyApp();
        const graph = app?.graph || null;
        const canvas = app?.canvas || null;
        const node = graph?.getNodeById?.(Number(safeNodeId)) || null;
        if (!node || typeof canvas?.centerOnNode !== "function") return false;
        canvas.centerOnNode(node);
        return true;
    } catch (e) {
        console.debug?.(e);
        return false;
    }
}

export function buildFloatingViewerProgressBar(viewer) {
    const root = document.createElement("div");
    root.className = "mjr-mfv-progress";
    root.setAttribute("role", "status");
    root.setAttribute("aria-live", "polite");

    const nodesBar = document.createElement("div");
    nodesBar.className = "mjr-mfv-progress-bar mjr-mfv-progress-bar--nodes";

    const stepsBar = document.createElement("div");
    stepsBar.className = "mjr-mfv-progress-bar mjr-mfv-progress-bar--steps";

    const overlay = document.createElement("div");
    overlay.className = "mjr-mfv-progress-overlay";
    overlay.setAttribute("aria-hidden", "true");

    const text = document.createElement("span");
    text.className = "mjr-mfv-progress-text";
    text.textContent = "Idle";

    root.appendChild(nodesBar);
    root.appendChild(stepsBar);
    root.appendChild(overlay);
    root.appendChild(text);

    root.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        if (!centerFloatingViewerProgressNode(viewer, viewer._progressCurrentNodeId)) return;
        event.preventDefault();
        event.stopPropagation();
    });

    viewer._progressEl = root;
    viewer._progressNodesEl = nodesBar;
    viewer._progressStepsEl = stepsBar;
    viewer._progressTextEl = text;

    if (viewer._progressUpdateHandler) {
        floatingViewerProgressService.removeEventListener(
            PROGRESS_UPDATE_EVENT,
            viewer._progressUpdateHandler,
        );
    }
    viewer._progressUpdateHandler = (event) => {
        applyFloatingViewerProgressState(
            viewer,
            event?.detail || floatingViewerProgressService.getSnapshot(),
        );
    };

    floatingViewerProgressService.addEventListener(
        PROGRESS_UPDATE_EVENT,
        viewer._progressUpdateHandler,
    );
    void ensureFloatingViewerProgressTracking({ timeoutMs: 4000 }).catch((e) => {
        console.debug?.(e);
    });
    applyFloatingViewerProgressState(viewer, floatingViewerProgressService.getSnapshot());

    return root;
}

export function buildFloatingViewerMediaProgressOverlay(viewer) {
    const root = document.createElement("div");
    root.className = "mjr-mfv-media-progress";
    root.setAttribute("aria-hidden", "true");

    const text = document.createElement("span");
    text.className = "mjr-mfv-media-progress-text";
    root.appendChild(text);

    viewer._mediaProgressEl = root;
    viewer._mediaProgressTextEl = text;
    applyFloatingViewerProgressState(viewer, floatingViewerProgressService.getSnapshot());
    return root;
}

export function disposeFloatingViewerProgressBar(viewer) {
    if (viewer?._progressUpdateHandler) {
        try {
            floatingViewerProgressService.removeEventListener(
                PROGRESS_UPDATE_EVENT,
                viewer._progressUpdateHandler,
            );
        } catch (e) {
            console.debug?.(e);
        }
    }
    viewer._progressUpdateHandler = null;
    viewer._progressCurrentNodeId = null;
    viewer._progressEl = null;
    viewer._progressNodesEl = null;
    viewer._progressStepsEl = null;
    viewer._progressTextEl = null;
    viewer._mediaProgressEl = null;
    viewer._mediaProgressTextEl = null;
}
