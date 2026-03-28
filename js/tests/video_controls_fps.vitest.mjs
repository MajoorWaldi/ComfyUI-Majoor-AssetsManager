import { describe, expect, it } from "vitest";
import { formatFps, normalizeVideoFps, readAssetFps } from "../utils/mediaFps.js";

describe("normalizeVideoFps", () => {
    it("preserves decimal frame rates for viewer sync", () => {
        expect(normalizeVideoFps(29.97)).toBe(29.97);
        expect(normalizeVideoFps("23.976")).toBe(23.976);
    });

    it("falls back safely for invalid values", () => {
        expect(normalizeVideoFps(null, 24)).toBe(24);
        expect(normalizeVideoFps("bad", 30)).toBe(30);
    });

    it("uses the same fps source of truth as file info", () => {
        const asset = {
            fps: null,
            metadata_raw: {
                raw_ffprobe: {
                    video_stream: {
                        avg_frame_rate: "30000/1001",
                    },
                },
            },
        };

        expect(readAssetFps(asset)).toBeCloseTo(29.97002997, 6);
        expect(formatFps(readAssetFps(asset))).toBe("29.97 fps");
    });
});
