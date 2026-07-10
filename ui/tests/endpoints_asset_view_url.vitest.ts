import { describe, expect, it } from "vitest";

import { buildAssetViewURL } from "../api/endpoints.js";

describe("buildAssetViewURL", () => {
    it("uses the stable asset-id endpoint instead of reconstructing a Windows or NAS path", () => {
        expect(
            buildAssetViewURL({
                id: 165,
                filename: "problem.png",
                filepath: "Z:/ComfyUI/output/Ideogram/problem.png",
                type: "output",
                mtime: 1234,
            }),
        ).toBe("/mjr/am/viewer/asset/165?v=1234");
    });

    it("derives ComfyUI temp bucket URLs from absolute temp paths", () => {
        expect(
            buildAssetViewURL({
                filename: "preview.png",
                filepath: "D:/ComfyUI/temp/previews/preview.png",
                type: "output",
            }),
        ).toBe("/view?filename=preview.png&subfolder=previews&type=temp");
    });
});
