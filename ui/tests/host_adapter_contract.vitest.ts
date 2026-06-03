import { beforeEach, describe, expect, it, vi } from "vitest";

const bridgeState = vi.hoisted(() => {
    let comfyApp: any = null;
    return {
        reset() {
            comfyApp = null;
        },
        setApp(app: any) {
            comfyApp = app;
        },
        getApp() {
            return comfyApp;
        },
    };
});

vi.mock("../app/comfyApiBridge.js", () => ({
    activateBottomPanelTabCompat: vi.fn(() => false),
    activateSidebarTabCompat: vi.fn(() => false),
    fetchComfyApi: vi.fn(async () => new Response(null, { status: 200 })),
    getComfyApi: vi.fn((app?: any) => app?.api || null),
    getComfyApp: vi.fn(() => bridgeState.getApp()),
    getExtensionDialogApi: vi.fn(() => null),
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

    it("wrapHostQueuePrompt binds once per owner and restore returns original", async () => {
        const mod = await import("../app/hostAdapter.js");

        const original = vi.fn(async (count: number) => ({ prompt_id: String(count) }));
        const api: any = {
            queuePrompt: original,
        };

        const ownerA = { id: "A" };
        const ownerB = { id: "B" };

        const binding = mod.wrapHostQueuePrompt({
            api,
            owner: ownerA,
            createWrapper(originalQueuePrompt: any) {
                return async function (this: any, ...args: any[]) {
                    return originalQueuePrompt.apply(this, args);
                };
            },
        });

        expect(binding).toBeTruthy();
        expect(api.queuePrompt).not.toBe(original);

        const blockedBinding = mod.wrapHostQueuePrompt({
            api,
            owner: ownerB,
            createWrapper(originalQueuePrompt: any) {
                return async function (this: any, ...args: any[]) {
                    return originalQueuePrompt.apply(this, args);
                };
            },
        });

        expect(blockedBinding).toBeNull();

        const result = await api.queuePrompt(7);
        expect(result.prompt_id).toBe("7");
        expect(original).toHaveBeenCalledTimes(1);

        expect(binding.restore()).toBe(true);
        expect(api.queuePrompt).toBe(original);
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
});
