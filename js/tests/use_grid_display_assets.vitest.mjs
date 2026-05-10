import { describe, expect, it } from "vitest";

import {
    buildDisplayAssets,
    getDisplayGroupKey,
    getRenderableAssets,
    isRenderableAsset,
} from "../vue/grid/useGridDisplayAssets.js";

describe("useGridDisplayAssets", () => {
    it("builds a stable display group key from source/root/subfolder/filename", () => {
        expect(
            getDisplayGroupKey({
                source: "Output",
                root_id: "Root",
                subfolder: "Shots",
                filename: "Image.PNG",
            }),
        ).toBe("output|root|shots|image.png");
    });

    it("collapses duplicate filename groups onto the first representative", () => {
        const first = { id: 1, source: "output", filename: "same.png" };
        const second = { id: 2, source: "output", filename: "same.png" };
        const third = { id: 3, source: "output", filename: "other.png" };

        const output = buildDisplayAssets([first, second, third]);

        expect(output).toEqual([first, third]);
        expect(first._mjrDupStack).toBe(true);
        expect(first._mjrDupMembers.map((asset) => asset.id)).toEqual([1, 2]);
        expect(second._mjrDupStack).toBe(false);
        expect(third._mjrDupStack).toBe(false);
    });

    it("ignores stale duplicate-hidden flags left on asset objects", () => {
        const visible = { id: 1, filename: "visible.png" };
        const hidden = { id: 2, filename: "hidden.png", _mjrDupHidden: true };

        expect(isRenderableAsset(visible)).toBe(true);
        expect(isRenderableAsset(hidden)).toBe(true);
        expect(getRenderableAssets([visible, hidden])).toEqual([visible, hidden]);
    });
});
