import { describe, expect, it, vi } from "vitest";

import { createJobFinalizeQueue } from "../features/stacks/finalizeQueue.js";

describe("createJobFinalizeQueue", () => {
    it("processes multiple job ids instead of dropping overlaps", async () => {
        vi.useFakeTimers();
        const calls = [];
        const queue = createJobFinalizeQueue({
            defaultDelayMs: 25,
            postJob: async (jobId) => {
                calls.push(jobId);
            },
        });

        queue.schedule("job-a");
        queue.schedule("job-b");

        await vi.advanceTimersByTimeAsync(25);

        expect(calls).toEqual(["job-a", "job-b"]);
        queue.dispose();
        vi.useRealTimers();
    });

    it("coalesces duplicate schedules for the same job id", async () => {
        vi.useFakeTimers();
        const calls = [];
        const queue = createJobFinalizeQueue({
            defaultDelayMs: 50,
            postJob: async (jobId) => {
                calls.push(jobId);
            },
        });

        queue.schedule("job-a");
        queue.schedule("job-a");

        await vi.advanceTimersByTimeAsync(50);

        expect(calls).toEqual(["job-a"]);
        queue.dispose();
        vi.useRealTimers();
    });
});
