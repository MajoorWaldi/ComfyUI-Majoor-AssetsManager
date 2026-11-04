import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    FloatingViewerProgressService,
    formatFloatingViewerMediaProgressText,
} from "../features/viewer/floatingViewerProgress.js";

function ensureCustomEventShim() {
    if (typeof globalThis.CustomEvent === "function") return;
    globalThis.CustomEvent = class CustomEvent extends Event {
        constructor(type, init = {}) {
            super(type);
            (this as any).detail = (init as any).detail;
        }
    } as any;
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Mimics ComfyUI's read-only `/queue` and `/history/{id}` endpoints. The
 * service must learn the prompt graph from these, never by wrapping
 * `api.queuePrompt`.
 */
class FakeApi extends EventTarget {
    queue: Record<string, any> = { queue_running: [], queue_pending: [] };
    history: Record<string, any> = {};
    queuePrompt = vi.fn();

    run(promptId: string, output: Record<string, any>) {
        this.queue.queue_running = [[0, promptId, output, {}, []]];
    }

    async fetchApi(route: string) {
        const json = route === "/queue" ? this.queue : this.history;
        return { ok: true, json: async () => json };
    }
}

describe("floating viewer progress service", () => {
    beforeEach(() => {
        ensureCustomEventShim();
    });

    it("reconstructs queue, node and step progress from ComfyUI events", async () => {
        const api = new FakeApi();
        const service = new FloatingViewerProgressService({
            getApi: () => api,
            getApp: () => ({
                graph: {
                    getNodeById(id) {
                        if (Number(id) === 1) return { title: "KSampler" };
                        return { type: "SaveImage" };
                    },
                },
            }),
        });

        await service.ensureInitialized({ api });

        api.run("prompt-1", {
            1: { class_type: "KSampler", _meta: { title: "KSampler" } },
            2: { class_type: "SaveImage" },
        });
        api.dispatchEvent(
            new CustomEvent("status", {
                detail: { exec_info: { queue_remaining: 3 } },
            }),
        );
        api.dispatchEvent(
            new CustomEvent("execution_start", {
                detail: { prompt_id: "prompt-1" },
            }),
        );
        await flush();
        api.dispatchEvent(
            new CustomEvent("progress", {
                detail: {
                    prompt_id: "prompt-1",
                    node: "1",
                    value: 4,
                    max: 8,
                },
            }),
        );

        let snapshot = service.getSnapshot();
        expect(snapshot.queue).toBe(3);
        expect(snapshot.prompt.totalNodes).toBe(2);
        expect(snapshot.prompt.currentlyExecuting.nodeId).toBe("1");
        expect(snapshot.prompt.currentlyExecuting.nodeLabel).toBe("KSampler");
        expect(snapshot.prompt.currentlyExecuting.step).toBe(4);
        expect(snapshot.prompt.currentlyExecuting.maxSteps).toBe(8);
        expect(snapshot.prompt.currentlyExecuting.pass).toBe(1);

        api.dispatchEvent(
            new CustomEvent("executing", {
                detail: "2",
            }),
        );

        snapshot = service.getSnapshot();
        expect(snapshot.prompt.executedNodeIds).toEqual(["1"]);
        expect(snapshot.prompt.currentlyExecuting.nodeId).toBe("2");
        expect(snapshot.prompt.currentlyExecuting.nodeLabel).toBe("SaveImage");

        service.dispose();
        expect(api.queuePrompt).not.toHaveBeenCalled();
    });

    it("counts cached nodes as executed without replacing the active node", async () => {
        const api = new FakeApi();
        const service = new FloatingViewerProgressService({
            getApi: () => api,
            getApp: () => ({
                graph: {
                    getNodeById(id) {
                        return { title: `Node ${id}` };
                    },
                },
            }),
        });

        await service.ensureInitialized({ api });
        api.run("prompt-1", {
            1: { class_type: "LoadImage" },
            2: { class_type: "VAEDecode" },
            3: { class_type: "KSampler" },
        });
        api.dispatchEvent(
            new CustomEvent("execution_start", {
                detail: { prompt_id: "prompt-1" },
            }),
        );
        await flush();
        api.dispatchEvent(
            new CustomEvent("progress", {
                detail: {
                    prompt_id: "prompt-1",
                    node: "3",
                    value: 2,
                    max: 10,
                },
            }),
        );
        api.dispatchEvent(
            new CustomEvent("execution_cached", {
                detail: {
                    prompt_id: "prompt-1",
                    nodes: ["1", "2"],
                },
            }),
        );

        const snapshot = service.getSnapshot();
        expect(snapshot.prompt.executedNodeIds).toEqual(["1", "2"]);
        expect(snapshot.prompt.currentlyExecuting.nodeId).toBe("3");
        expect(snapshot.prompt.currentlyExecuting.nodeLabel).toBe("KSampler");

        service.dispose();
        expect(api.queuePrompt).not.toHaveBeenCalled();
    });

    it("surfaces execution errors and resets to idle on success", async () => {
        const api = new FakeApi();
        const service = new FloatingViewerProgressService({
            getApi: () => api,
            getApp: () => ({ graph: { getNodeById: () => null } }),
        });

        await service.ensureInitialized({ api });
        api.run("prompt-1", { 1: { class_type: "KSampler" } });
        api.dispatchEvent(
            new CustomEvent("execution_start", {
                detail: { prompt_id: "prompt-1" },
            }),
        );
        api.dispatchEvent(
            new CustomEvent("execution_error", {
                detail: {
                    prompt_id: "prompt-1",
                    exception_type: "BoomError",
                    node_id: "1",
                    node_type: "KSampler",
                },
            }),
        );

        let snapshot = service.getSnapshot();
        expect(snapshot.prompt.errorDetails.exception_type).toBe("BoomError");
        expect(service.getCurrentNodeId()).toBe("1");

        api.dispatchEvent(
            new CustomEvent("execution_success", {
                detail: { prompt_id: "prompt-1" },
            }),
        );

        snapshot = service.getSnapshot();
        expect(snapshot.prompt).toBeNull();

        service.dispose();
        expect(api.queuePrompt).not.toHaveBeenCalled();
    });

    it("never wraps api.queuePrompt and falls back to /history for finished prompts", async () => {
        const api = new FakeApi();
        const original = api.queuePrompt;
        api.history = {
            "prompt-9": { prompt: [0, "prompt-9", { 5: { class_type: "SaveImage" } }, {}, []] },
        };
        const service = new FloatingViewerProgressService({
            getApi: () => api,
            getApp: () => ({ graph: { getNodeById: () => null } }),
        });

        await service.ensureInitialized({ api });
        expect(api.queuePrompt).toBe(original);

        api.dispatchEvent(
            new CustomEvent("execution_start", { detail: { prompt_id: "prompt-9" } }),
        );
        await flush();
        expect(service.getSnapshot().prompt.totalNodes).toBe(1);
        expect(service.getSnapshot().prompt.getNodeLabel("5")).toBe("SaveImage");

        service.dispose();
    });

    it("prefers the core Jobs API when the frontend exposes getJobDetail", async () => {
        const api: any = new FakeApi();
        api.getJobDetail = vi.fn(async (id: string) => ({
            id,
            status: "in_progress",
            workflow: {
                prompt: { 7: { class_type: "VAEDecode" }, 8: { class_type: "SaveImage" } },
            },
        }));
        const fetchSpy = vi.spyOn(api, "fetchApi");
        const service = new FloatingViewerProgressService({
            getApi: () => api,
            getApp: () => ({ graph: { getNodeById: () => null } }),
        });

        await service.ensureInitialized({ api });
        api.dispatchEvent(new CustomEvent("execution_start", { detail: { prompt_id: "job-1" } }));
        await flush();

        expect(api.getJobDetail).toHaveBeenCalledWith("job-1");
        expect(fetchSpy).not.toHaveBeenCalled();
        expect(service.getSnapshot().prompt.totalNodes).toBe(2);

        service.dispose();
    });

    it("formats the media overlay label from current node and steps", () => {
        expect(
            formatFloatingViewerMediaProgressText({
                prompt: {
                    currentlyExecuting: {
                        nodeId: "1",
                        nodeLabel: "KSampler",
                        step: 12,
                        maxSteps: 30,
                    },
                },
            }),
        ).toBe("KSampler - 12/30");

        expect(
            formatFloatingViewerMediaProgressText({
                prompt: {
                    currentlyExecuting: {
                        nodeId: "7",
                        nodeLabel: "UltimateSDUpscale",
                        pass: 2,
                        step: 5,
                        maxSteps: 8,
                    },
                },
            }),
        ).toBe("UltimateSDUpscale #2 - 5/8");

        expect(
            formatFloatingViewerMediaProgressText({
                prompt: {
                    errorDetails: {
                        node_type: "SamplerCustomAdvanced",
                        exception_message: "CUDA out of memory",
                    },
                },
            }),
        ).toBe("SamplerCustomAdvanced - CUDA out of memory");

        expect(
            formatFloatingViewerMediaProgressText({
                prompt: {
                    errorDetails: {
                        node_type: "KSampler",
                        exception_message: ["Invalid latent", "shape mismatch"],
                    },
                },
            }),
        ).toBe("KSampler - Invalid latent | shape mismatch");
    });
});
