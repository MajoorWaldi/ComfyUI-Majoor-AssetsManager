import { describe, expect, it } from "vitest";

import { extractOutputFiles } from "../utils/extractOutputFiles.js";

describe("extractOutputFiles", () => {
    it("extracts raw mp4 filepath strings from nested outputs", () => {
        const output = {
            result: {
                audio: ["D:\\____COMFY_OUTPUTS\\2026-04-07\\LTX-23_Audio\\LTX-23_Audio_00001.mp4"],
            },
        };

        expect(extractOutputFiles(output)).toEqual([
            {
                filename: "LTX-23_Audio_00001.mp4",
                subfolder: "",
                type: "output",
                path: "D:\\____COMFY_OUTPUTS\\2026-04-07\\LTX-23_Audio\\LTX-23_Audio_00001.mp4",
            },
        ]);
    });
});
