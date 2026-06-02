import { describe, expect, it } from "vitest";

import { buildAssetViewURL } from "../api/endpoints.js";

describe("buildAssetViewURL", () => {
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
