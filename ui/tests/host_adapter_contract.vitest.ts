import { beforeEach, describe, expect, it, vi } from "vitest";

const bridgeState = vi.hoisted(() => {
    let comfyApp: any = null;
    let dialogApi: any = null;
    return {
        reset() {
            comfyApp = null;
            dialogApi = null;
        },
        setApp(app: any) {
            comfyApp = app;
        },
        getApp() {
            return comfyApp;
        },
        setDialogApi(api: any) {
            dialogApi = api;
        },
        getDialogApi() {
            return dialogApi;
        },
    };
});

vi.mock("../app/comfyApiBridge.js", () => ({
    activateBottomPanelTabCompat: vi.fn(() => false),
    activateSidebarTabCompat: vi.fn(() => false),
    fetchComfyApi: vi.fn(async () => new Response(null, { status: 200 })),
    getComfyApi: vi.fn((app?: any) => app?.api || null),
    getComfyApp: vi.fn(() => bridgeState.getApp()),
    getExtensionDialogApi: vi.fn(() => bridgeState.getDialogApi()),
    getExtensionManager: vi.fn(() => null),
    getExtensionToastApi: vi.fn(() => null),
    getSettingValue: vi.fn(() => null),
    getSettingsApi: vi.fn(() => null),
    registerBottomPanelTabCompat: vi.fn(() => false),
    registerCommandCompat: vi.fn(() => false),
    registerKeybindingCompat: vi.fn(() => false),
    registerSidebarTabCompat: vi.fn(() => false),
    setComfyApp: vi.fn((app: any) => {
        bridgeState.setApp(app);
        return app;
    }),
    setSettingValue: vi.fn(() => false),
    waitForComfyApi: vi.fn(async () => null),
    waitForComfyApp: vi.fn(async () => bridgeState.getApp()),
}));

describe("hostAdapter contract", () => {
    beforeEach(async () => {
        vi.resetModules();
        bridgeState.reset();
    });

    it("uses the current ComfyUI confirm dialog contract", async () => {
        const confirmDialog = vi.fn(async () => true);
        bridgeState.setDialogApi({ confirm: confirmDialog });
        const mod = await import("../app/hostAdapter.js");

        await expect(
            mod.confirm({ message: "Delete this asset?", header: "Legacy title", type: "delete" }),
        ).resolves.toBe(true);
        expect(confirmDialog).toHaveBeenCalledWith({
            title: "Legacy title",
            message: "Delete this asset?",
            type: "delete",
        });
    });

    it("observeHostCanvasSelection uses event path and unsubscribes cleanly", async () => {
        const mod = await import("../app/hostAdapter.js");

        const canvasHost = new EventTarget();
        const appHost = new EventTarget();
        const graphHost = new EventTarget();
        const canvasDom = new EventTarget();

        const app = Object.assign(appHost, {
            canvas: Object.assign(canvasHost, { canvas: canvasDom }),
            graph: graphHost,
        });

        mod.init(app);

        const onSelectionChange = vi.fn();
        const dispose = mod.observeHostCanvasSelection(onSelectionChange, {
            includePointerFallback: true,
        });

        expect(typeof dispose).toBe("function");

        canvasHost.dispatchEvent(new Event("selectionchange"));
        appHost.dispatchEvent(new Event("node-selection-change"));
        canvasDom.dispatchEvent(new Event("pointerup"));

        expect(onSelectionChange).toHaveBeenCalledTimes(3);

        dispose?.();
        canvasHost.dispatchEvent(new Event("selectionchange"));
        canvasDom.dispatchEvent(new Event("pointerup"));

        expect(onSelectionChange).toHaveBeenCalledTimes(3);
    });

    it("observeHostCanvasSelection falls back to LiteGraph callbacks and restores originals", async () => {
        const mod = await import("../app/hostAdapter.js");

        const originalSelected = vi.fn();
        const originalSelectionChange = vi.fn();

        const canvasDom = new EventTarget();
        const canvas: any = {
            onNodeSelected: originalSelected,
            onSelectionChange: originalSelectionChange,
            canvas: canvasDom,
        };
        const app = { canvas, graph: null };
        mod.init(app);

        const onSelectionChange = vi.fn();
        const dispose = mod.observeHostCanvasSelection(onSelectionChange);

        expect(typeof canvas.onNodeSelected).toBe("function");
        expect(typeof canvas.onSelectionChange).toBe("function");
        expect(typeof canvas.onNodeDeselected).toBe("function");

        canvas.onNodeSelected({ id: 1 });
        canvas.onSelectionChange({});
        canvas.onNodeDeselected({ id: 1 });

        expect(originalSelected).toHaveBeenCalledTimes(1);
        expect(originalSelectionChange).toHaveBeenCalledTimes(1);
        expect(onSelectionChange).toHaveBeenCalledTimes(3);

        dispose?.();

        expect(canvas.onNodeSelected).toBe(originalSelected);
        expect(canvas.onSelectionChange).toBe(originalSelectionChange);
        expect(Object.prototype.hasOwnProperty.call(canvas, "onNodeDeselected")).toBe(false);
    });

    it("notifies node graph and root canvas graph through host helpers", async () => {
        const mod = await import("../app/hostAdapter.js");

        const subgraph = {
            setDirtyCanvas: vi.fn(),
            change: vi.fn(),
        };
        const graph = {
            setDirtyCanvas: vi.fn(),
            change: vi.fn(),
            add: vi.fn(),
        };
        const canvas = {
            setDirty: vi.fn(),
            draw: vi.fn(),
            selected_nodes: [{ id: 12 }, { id: 34 }],
        };
        const app = { graph, canvas };
        mod.init(app);

        const node = { id: 99, graph: subgraph };
        expect(mod.notifyHostNodeGraphChanged(node, app)).toBe(true);
        expect(subgraph.setDirtyCanvas).toHaveBeenCalledWith(true, true);
        expect(subgraph.change).toHaveBeenCalled();
        expect(canvas.setDirty).toHaveBeenCalledWith(true, true);
        expect(canvas.draw).toHaveBeenCalledWith(true, true);
        expect(graph.setDirtyCanvas).toHaveBeenCalledWith(true, true);
        expect(graph.change).toHaveBeenCalled();

        expect(mod.getSelectedHostCanvasNodeIds(app)).toEqual(["12", "34"]);
        expect(mod.getFirstSelectedHostCanvasNode(app)).toEqual({ id: 12 });

        const newNode = { id: 777, graph };
        expect(mod.addNodeToHostGraph(newNode, app)).toBe(true);
        expect(graph.add).toHaveBeenCalledWith(newNode);
    });

    it("creates host nodes through the adapter LiteGraph boundary", async () => {
        const mod = await import("../app/hostAdapter.js");

        const created = { type: "LoadImage" };
        const app = {
            LiteGraph: {
                createNode: vi.fn((type: string) => (type === "LoadImage" ? created : null)),
            },
        };
        mod.init(app);

        expect(mod.createHostNode("LoadImage", app)).toBe(created);
        expect(app.LiteGraph.createNode).toHaveBeenCalledWith("LoadImage");
        expect(mod.createHostNode("", app)).toBeNull();
    });

    it("queues prompt through api.queuePrompt path with widget cycle", async () => {
        const mod = await import("../app/hostAdapter.js");

        const widget = {
            value: 10,
            beforeQueued: vi.fn(() => {
                widget.value = 11;
            }),
            afterQueued: vi.fn(),
            callback: vi.fn(),
        };
        const api = {
            queuePrompt: vi.fn(async () => ({ prompt_id: "p-1" })),
        };
        const app = {
            api,
            graphToPrompt: vi.fn(async () => ({ output: { 1: { class_type: "KSampler" } } })),
            graph: {
                _nodes: [{ widgets: [widget] }],
                setDirtyCanvas: vi.fn(),
                change: vi.fn(),
            },
            canvas: {
                setDirty: vi.fn(),
                draw: vi.fn(),
            },
        };

        mod.init(app);

        const tracked = await mod.queueHostPrompt({
            app,
            enrichPromptData: (promptData: any) => ({ ...promptData, extra_data: { preview_method: "taesd" } }),
        });

        expect(tracked).toBe(true);
        expect(api.queuePrompt).toHaveBeenCalledTimes(1);
        expect(widget.beforeQueued).toHaveBeenCalledTimes(1);
        expect(widget.afterQueued).toHaveBeenCalledTimes(1);
        expect(app.canvas.draw).toHaveBeenCalledWith(true, true);
    });

    it("centers node by id through host canvas helper", async () => {
        const mod = await import("../app/hostAdapter.js");

        const centered = vi.fn();
        const app = {
            graph: {
                _nodes: [{ id: 42, pos: [0, 0], size: [100, 80] }],
            },
            canvas: {
                centerOnNode: centered,
            },
        };
        mod.init(app);

        expect(mod.centerHostCanvasNodeById(42, app)).toBe(true);
        expect(centered).toHaveBeenCalledTimes(1);
    });

    it("uses replace mode instead of speculative stable-like tab APIs", async () => {
        const mod = await import("../app/hostAdapter.js");

        const workflow = { nodes: [{ id: 1 }] };
        const app = {
            newWorkflow: vi.fn(),
            loadGraphData: vi.fn(),
        };
        mod.init(app);

        const result = mod.importWorkflowPreferHostTab(workflow, app);

        expect(result).toEqual({ ok: true, mode: "replace" });
        expect(app.newWorkflow).not.toHaveBeenCalled();
        expect(app.loadGraphData).toHaveBeenCalledWith(workflow);
    });

    it("uses replace mode instead of speculative nightly-like tab APIs", async () => {
        const mod = await import("../app/hostAdapter.js");

        const workflow = { nodes: [{ id: 2 }] };
        const openWorkflowInNewTab = vi.fn();
        const app = {
            ui: {
                extensionManager: {
                    workspaceStore: {
                        openWorkflowInNewTab,
                    },
                },
            },
            loadGraphData: vi.fn(),
        };
        mod.init(app);

        const result = mod.importWorkflowPreferHostTab(workflow, app);

        expect(result).toEqual({ ok: true, mode: "replace" });
        expect(openWorkflowInNewTab).not.toHaveBeenCalled();
        expect(app.loadGraphData).toHaveBeenCalledWith(workflow);
    });

    it("falls back to replace mode when no tab API is available", async () => {
        const mod = await import("../app/hostAdapter.js");

        const workflow = { nodes: [{ id: 3 }] };
        const app = {
            loadGraphData: vi.fn(),
        };
        mod.init(app);

        const result = mod.importWorkflowPreferHostTab(workflow, app);

        expect(result).toEqual({ ok: true, mode: "replace" });
        expect(app.loadGraphData).toHaveBeenCalledWith(workflow);
    });

    it("serializes current workflow from graphToPrompt workflow payload", async () => {
        const mod = await import("../app/hostAdapter.js");

        const workflow = { last_node_id: 17, nodes: [{ id: 17 }] };
        const app = {
            graphToPrompt: vi.fn(() => ({ workflow })),
        };
        mod.init(app);

        expect(mod.serializeCurrentHostWorkflow(app)).toEqual(workflow);
    });

    it("falls back to graph.serialize when graphToPrompt workflow is unavailable", async () => {
        const mod = await import("../app/hostAdapter.js");

        const workflow = { last_node_id: 9, nodes: [{ id: 9 }] };
        const app = {
            graphToPrompt: vi.fn(() => ({ output: {} })),
            graph: {
                serialize: vi.fn(() => workflow),
            },
        };
        mod.init(app);

        expect(mod.serializeCurrentHostWorkflow(app)).toEqual(workflow);
    });

    it("loads API prompt graphs with loadApiJson instead of an empty canvas", async () => {
        const mod = await import("../app/hostAdapter.js");
        const api = { "3": { class_type: "KSampler", inputs: { seed: 1 } } };
        const app = { loadApiJson: vi.fn(), loadGraphData: vi.fn() };
        mod.init(app);

        expect(mod.importWorkflowIntoHostCanvas(api, app, { filename: "api.json" })).toBe(true);
        expect(app.loadApiJson).toHaveBeenCalledWith(api, "api.json");
        expect(app.loadGraphData).not.toHaveBeenCalled();

        expect(mod.importWorkflowIntoHostCanvas({ prompt: JSON.stringify(api) }, app)).toBe(true);
        expect(app.loadApiJson).toHaveBeenLastCalledWith(api, "workflow.json");
    });

    it("unwraps { workflow } exports before loading", async () => {
        const mod = await import("../app/hostAdapter.js");
        const ui = { nodes: [{ id: 1, type: "KSampler" }], links: [] };
        const app = { loadGraphData: vi.fn(() => Promise.resolve()) };
        mod.init(app);

        expect(mod.importWorkflowIntoHostCanvas({ workflow: ui }, app)).toBe(true);
        expect(app.loadGraphData).toHaveBeenCalledWith(ui);
        expect(mod.resolveHostWorkflowPayload({ theme: "dark" }).format).toBe("");
    });

    it("prefers the root graph over the active subgraph when serializing", async () => {
        const mod = await import("../app/hostAdapter.js");

        const rootWorkflow = { last_node_id: 3, nodes: [{ id: 1 }, { id: 2 }, { id: 3 }] };
        const app = {
            rootGraph: { serialize: vi.fn(() => rootWorkflow) },
            canvas: { graph: { serialize: vi.fn(() => ({ nodes: [{ id: 99 }] })) } },
            graphToPrompt: vi.fn(),
        };
        mod.init(app);

        expect(mod.serializeCurrentHostWorkflow(app)).toEqual(rootWorkflow);
        expect(app.graphToPrompt).not.toHaveBeenCalled();
    });

    it("does not leak an unhandled rejection from an async graphToPrompt", async () => {
        const mod = await import("../app/hostAdapter.js");

        const rejection = Promise.reject(new Error("boom"));
        const app = { graphToPrompt: vi.fn(() => rejection) };
        mod.init(app);

        expect(mod.serializeCurrentHostWorkflow(app)).toBeNull();
        await expect(rejection).rejects.toThrow("boom");
    });

    it("reads dirty state from the frontend workflow store first", async () => {
        const mod = await import("../app/hostAdapter.js");

        const app = {
            isDirty: true,
            extensionManager: { workflow: { activeWorkflow: { isModified: false } } },
        };
        mod.init(app);
        expect(mod.isHostWorkflowDirty(app)).toBe(false);
    });

    it("reads host dirty state from stable and nightly signal shapes", async () => {
        const mod = await import("../app/hostAdapter.js");

        const stableApp = { isDirty: true };
        mod.init(stableApp);
        expect(mod.isHostWorkflowDirty(stableApp)).toBe(true);

        const nightlyApp = {
            graph: {
                modified: () => 1,
            },
        };
        mod.init(nightlyApp);
        expect(mod.isHostWorkflowDirty(nightlyApp)).toBe(true);
    });
});
