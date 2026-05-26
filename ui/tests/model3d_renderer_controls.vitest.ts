import { describe, expect, it } from "vitest";

import { buildModel3DMouseButtons } from "../features/viewer/model3dRenderer.js";

const MOUSE = {
    ROTATE: "rotate",
    DOLLY: "dolly",
    PAN: "pan",
};

describe("buildModel3DMouseButtons", () => {
    it("matches ComfyUI Load3D defaults", () => {
        const buttons = buildModel3DMouseButtons({ button: 0 }, MOUSE);
        expect(buttons).toEqual({
            LEFT: "rotate",
            MIDDLE: "dolly",
            RIGHT: "pan",
        });
    });

    it("keeps the same mapping even with modifiers", () => {
        const buttons = buildModel3DMouseButtons({ button: 1 }, MOUSE);
        const modified = buildModel3DMouseButtons(
            { button: 2, altKey: true, ctrlKey: true, metaKey: true },
            MOUSE,
        );
        expect(buttons.MIDDLE).toBe("dolly");
        expect(buttons.RIGHT).toBe("pan");
        expect(modified).toEqual(buttons);
    });
});
