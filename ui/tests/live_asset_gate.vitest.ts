import { describe, expect, it } from "vitest";

import { createLiveAssetGate } from "../features/stacks/liveAssetGate.js";

describe("createLiveAssetGate", () => {
    it("defers multi-output assets until stack assignment is available", () => {
        const gate = createLiveAssetGate();
        gate.markPendingJob("job-multi", {
            expectedCount: 2,
            files: [
                { filename: "a.png", subfolder: "gen", type: "output" },
                { filename: "b.png", subfolder: "gen", type: "output" },
            ],
        });

        const pending = gate.prepare({
            filename: "a.png",
            subfolder: "gen",
            type: "output",
            job_id: "job-multi",
        });
        expect(pending.defer).toBe(true);
        expect(pending.detail.job_id).toBe("job-multi");

        const stacked = gate.prepare({
            filename: "a.png",
            subfolder: "gen",
            type: "output",
            job_id: "job-multi",
            stack_id: "42",
        });
        expect(stacked.defer).toBe(false);
        expect(stacked.detail.stack_id).toBe("42");
    });

    it("allows mono-output assets through normal upsert while preserving job id", () => {
        const gate = createLiveAssetGate();
        gate.markPendingJob("job-single", {
            expectedCount: 1,
            files: [{ filename: "solo.png", subfolder: "gen", type: "output" }],
        });

        const prepared = gate.prepare({
            filename: "solo.png",
            subfolder: "gen",
            type: "output",
        });

        expect(prepared.defer).toBe(false);
        expect(prepared.jobId).toBe("job-single");
        expect(prepared.detail.job_id).toBe("job-single");
        expect(prepared.detail.stack_id).toBeUndefined();
    });

    it("stops deferring once the pending job is cleared", () => {
        const gate = createLiveAssetGate();
        gate.markPendingJob("job-clear", {
            expectedCount: 3,
            files: [{ filename: "x.png", subfolder: "gen", type: "output" }],
        });
        gate.clearPendingJob("job-clear");

        const prepared = gate.prepare({
            filename: "x.png",
            subfolder: "gen",
            type: "output",
            job_id: "job-clear",
        });

        expect(prepared.defer).toBe(false);
        expect(prepared.detail.job_id).toBe("job-clear");
    });
});
