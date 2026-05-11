// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
    class ProgressService extends EventTarget {
        getSnapshot() {
            return { queue: 0, prompt: null };
        }
    }

    const progressService = new ProgressService();
    const ensureFloatingViewerProgressTracking = vi.fn(async () => null);
    let app = null;

    return {
        progressService,
        ensureFloatingViewerProgressTracking,
        setApp(nextApp) {
            app = nextApp;
        },
        getApp() {
            return app;
        },
    };
});

vi.mock("../app/comfyApiBridge.js", () => ({
    getComfyApp: () => state.getApp(),
    getComfyApi: () => state.getApp()?.api || null,
}));

vi.mock("../app/config.js", () => ({
    APP_CONFIG: {
        MFV_PREVIEW_METHOD: "taesd",
    },
}));

vi.mock("../app/i18n.js", () => ({
    t: (_key, fallback) => fallback,
}));

vi.mock("../features/viewer/floatingViewerProgress.js", () => ({
    ensureFloatingViewerProgressTracking: (...args) =>
        state.ensureFloatingViewerProgressTracking(...args),
    floatingViewerProgressService: state.progressService,
}));

async function flushMicrotasks() {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
}

describe("sidebarRunButton execution failures", () => {
    it("restores widget values when queueing fails after beforeQueued", async () => {
        const widget = {
            value: 10,
            beforeQueued: vi.fn(() => {
                widget.value = 11;
            }),
            afterQueued: vi.fn(),
            callback: vi.fn(),
        };

        state.setApp({
            api: {
                queuePrompt: vi.fn(async () => {
                    throw new Error("queue failed");
                }),
            },
            graph: {
                _nodes: [{ widgets: [widget] }],
            },
            graphToPrompt: vi.fn(async () => ({
                output: { 1: { class_type: "KSampler" } },
            })),
            canvas: {
                draw: vi.fn(),
            },
        });

        const { createRunButton } = await import(
            "../features/viewer/workflowSidebar/sidebarRunButton.js"
        );
        const handle = createRunButton();
        const runBtn = handle.el.querySelector(".mjr-mfv-run-btn");

        runBtn.click();

        await flushMicrotasks();

        expect(state.getApp().api.queuePrompt).toHaveBeenCalledTimes(1);
        expect(widget.value).toBe(10);

        expect(widget.beforeQueued).toHaveBeenCalledTimes(1);
        expect(widget.afterQueued).not.toHaveBeenCalled();
        expect(widget.callback).toHaveBeenCalledWith(10);
        expect(state.getApp().canvas.draw).toHaveBeenCalledWith(true, true);

        handle.dispose();
    });
});
