import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    globalThis.window = {
        location: { href: "http://localhost/" },
    };
});

afterEach(() => {
    vi.useRealTimers();
    delete globalThis.HTMLCanvasElement;
});

describe("NodeStreamController", () => {
    it("streams the selected node canvas preview", async () => {
        const onOutput = vi.fn();
        const node = {
            id: 42,
            comfyClass: "PreviewImage",
            imgs: [{ src: "/view?filename=should_not_emit.png&subfolder=&type=output" }],
        };
        const app = {
            canvas: { selected_nodes: { 42: node } },
            graph: {
                getNodeById(id) {
                    return Number(id) === 42 ? node : null;
                },
            },
        };

        const mod = await import("../features/viewer/nodeStream/NodeStreamController.js");
        mod.initNodeStream({ app, onOutput });
        mod.setNodeStreamActive(true);
        await vi.advanceTimersByTimeAsync(250);

        expect(mod.getNodeStreamActive()).toBe(true);
        expect(mod.getSelectedNodeId()).toBe("42");
        expect(mod.getPinnedNodeId()).toBeNull();
        expect(onOutput).toHaveBeenCalledWith(
            expect.objectContaining({
                filename: "should_not_emit.png",
                type: "output",
                kind: "image",
                _nodeId: "42",
                _source: "canvas",
            }),
        );

        mod.teardownNodeStream(app);
    });

    it("ignores execution-driven output updates in selection-only mode", async () => {
        const onOutput = vi.fn();
        const app = {
            canvas: { selected_nodes: {} },
            graph: {
                getNodeById() {
                    return null;
                },
            },
        };

        const mod = await import("../features/viewer/nodeStream/NodeStreamController.js");
        mod.initNodeStream({ app, onOutput });
        mod.onNodeOutputs(
            new Map([["99", { images: [{ filename: "still_ignored.png", type: "output" }] }]]),
            { app },
        );
        mod.setNodeStreamActive(true);
        await vi.advanceTimersByTimeAsync(100);

        expect(mod.getNodeStreamActive()).toBe(true);
        expect(onOutput).not.toHaveBeenCalled();

        mod.teardownNodeStream(app);
    });

    it("streams the ImageOps preview canvas as a cached data URL and re-emits only on signature change", async () => {
        class MockCanvas {}
        globalThis.HTMLCanvasElement = MockCanvas;

        const canvas = new MockCanvas();
        canvas.width = 320;
        canvas.height = 180;
        canvas.toDataURL = vi.fn(() => "data:image/png;base64,preview");

        const onOutput = vi.fn();
        const node = {
            id: 7,
            comfyClass: "ImageOpsPreview",
            __imageops_state: {
                canvas,
                lastKey: "render-a",
                lastRenderTick: 1,
                nativeDirty: false,
            },
        };
        const app = {
            canvas: { selected_nodes: { 7: node } },
            graph: {
                getNodeById(id) {
                    return Number(id) === 7 ? node : null;
                },
            },
        };

        const mod = await import("../features/viewer/nodeStream/NodeStreamController.js");
        mod.initNodeStream({ app, onOutput });
        mod.setNodeStreamActive(true);
        await vi.advanceTimersByTimeAsync(10);

        expect(onOutput).toHaveBeenCalledWith(
            expect.objectContaining({
                filename: expect.stringMatching(/^imageops_7_[a-f0-9]+\.png$/),
                url: "data:image/png;base64,preview",
                kind: "image",
                width: 320,
                height: 180,
                _nodeId: "7",
                _classType: "ImageOpsPreview",
                _source: "imageops-live-preview",
            }),
        );
        expect(canvas.toDataURL).toHaveBeenCalledTimes(1);

        // Same signature → no re-emit and no re-encode.
        onOutput.mockClear();
        await vi.advanceTimersByTimeAsync(250);
        expect(onOutput).not.toHaveBeenCalled();
        expect(canvas.toDataURL).toHaveBeenCalledTimes(1);

        // Signature changes → emit + encode again.
        node.__imageops_state.lastKey = "render-b";
        await vi.advanceTimersByTimeAsync(250);
        expect(onOutput).toHaveBeenCalledTimes(1);
        expect(canvas.toDataURL).toHaveBeenCalledTimes(2);

        mod.teardownNodeStream(app);
    });
});
