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
            fps: 8,
            metadata_raw: {
                fps: 12,
                frame_rate: 16,
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

    it("falls back to legacy fps fields when ffprobe fps is unavailable", () => {
        expect(readAssetFps({ metadata_raw: { fps_raw: "24000/1001" } })).toBeCloseTo(
            23.97602397,
            6,
        );
        expect(readAssetFps({ metadata_raw: { frame_rate: "15" }, fps: 8 })).toBe(15);
        expect(readAssetFps({ fps: 8 })).toBe(8);
    });
});
