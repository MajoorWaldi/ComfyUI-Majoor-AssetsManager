import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();
const postMock = vi.fn();

vi.mock("../api/client.js", () => ({
    get: getMock,
    post: postMock,
}));

vi.mock("../api/endpoints.js", () => ({
    ENDPOINTS: {
        METADATA: "/mjr/am/metadata",
        STAGE_TO_INPUT: "/mjr/am/stage-to-input",
        WORKFLOW_QUICK: "/mjr/am/workflow-quick",
    },
    buildCustomViewURL: () => "/view",
    buildViewURL: () => "/view",
}));

describe("canvas drag/drop loader creation", () => {
    beforeEach(async () => {
        getMock.mockReset();
        postMock.mockReset();
        postMock.mockImplementation((_url, body) => {
            const filename = body?.files?.[0]?.filename || "one.png";
            return Promise.resolve({
                ok: true,
                data: {
                    staged: [
                        {
                            name: filename,
                            subfolder: "assets",
                            path: `C:/input/assets/${filename}`,
                        },
                    ],
                },
            });
        });
        getMock.mockResolvedValue({ ok: true, workflow: { nodes: [], links: [] } });

        const { setComfyApp } = await import("../app/comfyApiBridge.js");
        setComfyApp(makeApp());
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    function makeApp() {
        const graph = {
            added: [],
            add: vi.fn(function add(node) {
                this.added.push(node);
            }),
            getNodeOnPos: vi.fn(() => null),
            setDirtyCanvas: vi.fn(),
        };
        const canvasEl = {
            getBoundingClientRect: () => ({ left: 0, top: 0, right: 800, bottom: 600 }),
        };
        return {
            graph,
            canvas: {
                canvas: canvasEl,
                graph,
                ds: { scale: 1, offset: [0, 0] },
                setDirty: vi.fn(),
            },
            loadGraphData: vi.fn(),
        };
    }

    function makeDropEvent(payload) {
        const data = new Map([["application/x-mjr-asset", JSON.stringify(payload)]]);
        return {
            clientX: 120,
            clientY: 80,
            target: {},
            dataTransfer: {
                types: ["application/x-mjr-asset"],
                getData: (type) => data.get(type) || "",
                setData: (type, value) => data.set(type, value),
                dropEffect: "",
            },
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            stopImmediatePropagation: vi.fn(),
        };
    }

    it("L+drop on empty canvas creates a loader node and skips workflow import", async () => {
        const createdNode = {
            type: "LoadImage",
            widgets: [{ name: "image", type: "combo", value: "", options: { values: [] } }],
        };
        vi.stubGlobal("LiteGraph", {
            createNode: vi.fn((type) => (type === "LoadImage" ? createdNode : null)),
        });

        const { createDragDropRuntimeHandlers } = await import("../features/dnd/DragDrop.js");
        const { getComfyApp } = await import("../app/comfyApiBridge.js");
        const handlers = createDragDropRuntimeHandlers();

        handlers.onKeyDown({ key: "l", target: {} });
        await handlers.onDrop(makeDropEvent({ filename: "one.png", type: "output", kind: "image" }));
        handlers.onKeyUp({ key: "l" });

        const app = getComfyApp();
        expect(getMock).not.toHaveBeenCalled();
        expect(app.loadGraphData).not.toHaveBeenCalled();
        expect(globalThis.LiteGraph.createNode).toHaveBeenCalledWith("LoadImage");
        expect(app.graph.add).toHaveBeenCalledWith(createdNode);
        expect(createdNode.pos).toEqual([120, 80]);
        expect(createdNode.widgets[0].value).toBe("assets/one.png");
    });

    it("normal empty-canvas drop creates a loader when no valid workflow exists", async () => {
        getMock.mockResolvedValue({ ok: true, workflow: null, data: { workflow: null } });
        const createdNode = {
            type: "LoadImage",
            widgets: [{ name: "image", type: "combo", value: "", options: { values: [] } }],
        };
        vi.stubGlobal("LiteGraph", {
            createNode: vi.fn((type) => (type === "LoadImage" ? createdNode : null)),
        });

        const { createDragDropRuntimeHandlers } = await import("../features/dnd/DragDrop.js");
        const { getComfyApp } = await import("../app/comfyApiBridge.js");
        const handlers = createDragDropRuntimeHandlers();

        await handlers.onDrop(makeDropEvent({ filename: "one.png", type: "output", kind: "image" }));

        const app = getComfyApp();
        expect(getMock).toHaveBeenCalled();
        expect(app.loadGraphData).not.toHaveBeenCalled();
        expect(app.graph.add).toHaveBeenCalledWith(createdNode);
        expect(createdNode.widgets[0].value).toBe("assets/one.png");
    });

    it("L+drop creates loader nodes for the current multi-selection", async () => {
        const nodes = [];
        vi.stubGlobal("LiteGraph", {
            createNode: vi.fn((type) => {
                const node = {
                    type,
                    widgets: [{ name: "image", type: "combo", value: "", options: { values: [] } }],
                };
                nodes.push(node);
                return node;
            }),
        });
        window.__MJR_LAST_SELECTION_GRID__ = {
            _mjrGetSelectedAssets: () => [
                { filename: "one.png", type: "output", kind: "image" },
                { filename: "two.png", type: "output", kind: "image" },
            ],
        };

        const { createDragDropRuntimeHandlers } = await import("../features/dnd/DragDrop.js");
        const { getComfyApp } = await import("../app/comfyApiBridge.js");
        const handlers = createDragDropRuntimeHandlers();

        handlers.onKeyDown({ key: "l", target: {} });
        await handlers.onDrop(makeDropEvent({ filename: "one.png", type: "output", kind: "image" }));
        handlers.onKeyUp({ key: "l" });

        const app = getComfyApp();
        expect(getMock).not.toHaveBeenCalled();
        expect(app.graph.add).toHaveBeenCalledTimes(2);
        expect(nodes.map((node) => node.pos)).toEqual([
            [120, 80],
            [210, 80],
        ]);
        expect(nodes.map((node) => node.widgets[0].value)).toEqual([
            "assets/one.png",
            "assets/two.png",
        ]);
    });

    it("sanitizes and filters multi payloads carried by DataTransfer", async () => {
        const nodes = [];
        vi.stubGlobal("LiteGraph", {
            createNode: vi.fn((type) => {
                const node = {
                    type,
                    widgets: [{ name: "image", type: "combo", value: "", options: { values: [] } }],
                };
                nodes.push(node);
                return node;
            }),
        });

        const { createDragDropRuntimeHandlers } = await import("../features/dnd/DragDrop.js");
        const handlers = createDragDropRuntimeHandlers();
        const event = makeDropEvent({ filename: "one.png", type: "output", kind: "image" });
        event.dataTransfer.types.push("application/x-mjr-assets");
        event.dataTransfer.setData(
            "application/x-mjr-assets",
            JSON.stringify({
                items: [
                    { filename: "one.png", type: "output", kind: "image" },
                    { filename: "../bad.png", type: "output", kind: "image" },
                    { filename: "folder", type: "output", kind: "folder" },
                    { filename: "two.png", type: "output", kind: "image" },
                ],
            }),
        );

        handlers.onKeyDown({ key: "l", target: {} });
        await handlers.onDrop(event);
        handlers.onKeyUp({ key: "l" });

        expect(postMock).toHaveBeenCalledTimes(2);
        expect(nodes.map((node) => node.widgets[0].value)).toEqual([
            "assets/one.png",
            "assets/two.png",
        ]);
    });
});
