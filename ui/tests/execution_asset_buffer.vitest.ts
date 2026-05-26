import { describe, expect, it } from "vitest";

import { createExecutionAssetBuffer } from "../features/stacks/executionAssetBuffer.js";

describe("createExecutionAssetBuffer", () => {
    it("buffers by job id and deduplicates files by output identity", () => {
        const buffer = createExecutionAssetBuffer();

        buffer.add("job-1", [
            { filename: "a.png", subfolder: "x", type: "output", source_node_id: "1" },
        ]);
        const current = buffer.add("job-1", [
            { filename: "a.png", subfolder: "x", type: "output", source_node_type: "SaveImage" },
            { filename: "b.png", subfolder: "x", type: "output" },
        ]);

        expect(current).toHaveLength(2);
        expect(buffer.take("job-1")).toEqual([
            {
                filename: "a.png",
                subfolder: "x",
                type: "output",
                source_node_id: "1",
                source_node_type: "SaveImage",
            },
            { filename: "b.png", subfolder: "x", type: "output" },
        ]);
    });

    it("clears a failed job without affecting others", () => {
        const buffer = createExecutionAssetBuffer();
        buffer.add("job-1", [{ filename: "a.png", type: "output" }]);
        buffer.add("job-2", [{ filename: "b.png", type: "output" }]);

        buffer.clear("job-1");

        expect(buffer.take("job-1")).toEqual([]);
        expect(buffer.take("job-2")).toEqual([{ filename: "b.png", type: "output" }]);
    });
});
