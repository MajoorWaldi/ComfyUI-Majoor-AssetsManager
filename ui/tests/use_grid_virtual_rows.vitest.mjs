import { describe, expect, it } from "vitest";

import {
    buildStaticGridRows,
    getGridRowItems,
} from "../vue/grid/useGridVirtualRows.js";

describe("useGridVirtualRows helpers", () => {
    it("builds fixed-width rows from an item list", () => {
        expect(buildStaticGridRows([1, 2, 3, 4, 5], 2)).toEqual([
            { index: 0, items: [1, 2] },
            { index: 1, items: [3, 4] },
            { index: 2, items: [5] },
        ]);
    });

    it("returns items for a virtual row index", () => {
        expect(getGridRowItems(["a", "b", "c", "d"], 1, 3)).toEqual(["d"]);
        expect(getGridRowItems(["a", "b", "c", "d"], 0, 3)).toEqual(["a", "b", "c"]);
    });

    it("guards invalid column counts", () => {
        expect(buildStaticGridRows([1, 2], 0)).toEqual([{ index: 0, items: [1] }, { index: 1, items: [2] }]);
        expect(getGridRowItems([1, 2], 1, 0)).toEqual([2]);
    });
});
