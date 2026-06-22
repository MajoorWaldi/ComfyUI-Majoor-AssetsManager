import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SFC_PATH = join(ROOT, "../vue/components/grid/VirtualAssetGridHost.vue");

describe("VirtualAssetGridHost skeleton layout", () => {
    it("renders skeleton cards as direct grid children instead of stacked row wrappers", () => {
        const source = readFileSync(SFC_PATH, "utf8");

        expect(source).toContain('v-for="idx in skeletonCards"');
        expect(source).not.toContain("skeletonRows");
        expect(source).not.toContain("skeletonRowStyle");
    });
});
