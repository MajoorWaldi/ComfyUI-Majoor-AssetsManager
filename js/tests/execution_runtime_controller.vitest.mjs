import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { createExecutionRuntimeController } from "../features/stacks/executionRuntimeController.js";

describe("createExecutionRuntimeController", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        if (typeof globalThis.CustomEvent === "undefined") {
            globalThis.CustomEvent = class CustomEvent {
                constructor(type, init = {}) {
                    this.type = type;
                    this.detail = init.detail;
                }
            };
        }
        if (typeof globalThis.window === "undefined") {
            globalThis.window = {
                dispatchEvent: () => true,
            };
        }
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("indexes the first executed output immediately and buffers the rest until execution end", async () => {
        const post = vi.fn(async () => ({ ok: true, data: {} }));
        const controller = createExecutionRuntimeController({
            post,
            ENDPOINTS: {
                INDEX_FILES: "/index-files",
                STACKS_AUTO_STACK: "/stacks/auto-stack",
                SCAN: "/scan",
            },
            reportError: () => {},
            extractOutputFiles: (output) => output,
            ensureExecutionRuntime: () => ({ active_prompt_id: "job-1" }),
            emitRuntimeStatus: () => {},
            refreshGeneratedFeedHosts: () => {},
            getActiveGridContainer: () => null,
        });

        controller.handleExecutionStart({ detail: { prompt_id: "job-1", timestamp: Date.now() } }, {
            setCurrentJobId: () => {},
        });

        controller.handleExecutedEvent(
            {
                detail: {
                    prompt_id: "job-1",
                    output: [
                        { filename: "first.png", subfolder: "out", type: "output" },
                        { filename: "second.png", subfolder: "out", type: "output" },
                    ],
                },
            },
            { appRef: {} },
        );

        expect(post).toHaveBeenCalledTimes(1);
        expect(post).toHaveBeenNthCalledWith(
            1,
            "/index-files",
            expect.objectContaining({
                origin: "generation",
                prompt_id: "job-1",
                files: [expect.objectContaining({ filename: "first.png" })],
            }),
        );

        controller.handleExecutionEnd(
            { type: "execution_success", detail: { prompt_id: "job-1" } },
            { setCurrentJobId: () => {} },
        );

        await vi.advanceTimersByTimeAsync(500);

        expect(post).toHaveBeenCalledTimes(2);
        expect(post).toHaveBeenNthCalledWith(
            2,
            "/index-files",
            expect.objectContaining({
                origin: "generation",
                prompt_id: "job-1",
                files: [expect.objectContaining({ filename: "second.png" })],
            }),
        );
    });
});
