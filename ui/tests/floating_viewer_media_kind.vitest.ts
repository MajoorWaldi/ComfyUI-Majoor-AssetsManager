// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";

import { getFloatingViewerMediaKind } from "../features/viewer/floatingViewerMedia.js";

describe("floating viewer media kind", () => {
    it("detects media kind from Gen Info style asset type", () => {
        expect(getFloatingViewerMediaKind({ type: "video", filename: "clip.bin" })).toBe("video");
        expect(getFloatingViewerMediaKind({ type: "audio", filename: "sound.bin" })).toBe("audio");
    });

    it("keeps Comfy bucket type fallback based on file extension", () => {
        expect(getFloatingViewerMediaKind({ type: "output", filename: "clip.webm" })).toBe("video");
        expect(getFloatingViewerMediaKind({ type: "input", filename: "image.png" })).toBe("image");
    });
});
