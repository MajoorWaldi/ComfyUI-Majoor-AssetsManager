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
});

describe("NodeStreamController (feature disabled)", () => {
    it("stays inactive and emits nothing even if activation is requested", async () => {
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

        expect(mod.getNodeStreamActive()).toBe(false);
        expect(mod.getSelectedNodeId()).toBeNull();
        expect(mod.getPinnedNodeId()).toBeNull();
        expect(onOutput).not.toHaveBeenCalled();

        mod.teardownNodeStream(app);
    });

    it("ignores execution-driven output updates while disabled", async () => {
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

        expect(mod.getNodeStreamActive()).toBe(false);
        expect(onOutput).not.toHaveBeenCalled();

        mod.teardownNodeStream(app);
    });
});
