import { describe, expect, it } from "vitest";

import { normalizeMetadataSearchPrefix } from "../features/metadata/metadataSectionCatalog";
import { parsePrefixSearchQuery } from "../features/metadata/prefixSearch";

describe("metadata catalog helpers", () => {
    it("normalizes search aliases", () => {
        expect(normalizeMetadataSearchPrefix("checkpoint")).toBe("model");
        expect(normalizeMetadataSearchPrefix("loras")).toBe("lora");
        expect(normalizeMetadataSearchPrefix("workflow_nodes")).toBe("node");
    });

    it("parses prefixed multi-term queries", () => {
        const parsed = parsePrefixSearchQuery("cat model:flux -lora:bad OR sampler:euler");
        expect(parsed.plainQuery).toBe("cat");
        expect(parsed.mode).toBe("OR");
        expect(parsed.terms).toEqual([
            { field: "model", value: "flux", exclude: false, raw: "model:flux" },
            { field: "lora", value: "bad", exclude: true, raw: "-lora:bad" },
            { field: "sampler", value: "euler", exclude: false, raw: "sampler:euler" },
        ]);
    });
});
