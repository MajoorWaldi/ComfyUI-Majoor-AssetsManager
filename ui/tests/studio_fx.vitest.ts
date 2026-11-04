import { describe, expect, it } from "vitest";

import {
    aspectRect,
    channelMatrix,
    compareBlendMode,
    computeHistogram,
    computeWaveform,
    computeZebra,
    defaultStudioTools,
    exposureSlope,
    formatProbe,
    gammaExponent,
    gridGuides,
    hasColorFx,
    nextCompareIndex,
    sampleSize,
} from "../features/viewer/studio/studioFx.js";

describe("studio colour fx", () => {
    it("builds channel isolation matrices", () => {
        expect(channelMatrix("rgb")).toBeNull();
        const r = channelMatrix("r")!.split(" ").map(Number);
        expect(r).toHaveLength(20);
        // Every output colour row reads the red input only.
        expect([r[0], r[5], r[10]]).toEqual([1, 1, 1]);
        expect([r[1], r[2], r[6], r[12]]).toEqual([0, 0, 0, 0]);
        expect(r.slice(15)).toEqual([0, 0, 0, 1, 0]);
        const a = channelMatrix("a")!.split(" ").map(Number);
        expect([a[3], a[8], a[13]]).toEqual([1, 1, 1]);
        expect(a.slice(15)).toEqual([0, 0, 0, 0, 1]);
        const l = channelMatrix("l")!.split(" ").map(Number);
        expect(l[0] + l[1] + l[2]).toBeCloseTo(1, 5);
    });

    it("maps exposure and gamma", () => {
        expect(exposureSlope(0)).toBe(1);
        expect(exposureSlope(1)).toBe(2);
        expect(exposureSlope(-2)).toBe(0.25);
        expect(exposureSlope(Number.NaN)).toBe(1);
        expect(gammaExponent(2)).toBe(0.5);
        expect(gammaExponent(0)).toBe(1);
        expect(hasColorFx(defaultStudioTools())).toBe(false);
        expect(hasColorFx({ ...defaultStudioTools(), exposure: 0.5 })).toBe(true);
        expect(hasColorFx({ ...defaultStudioTools(), channel: "g" })).toBe(true);
    });

    it("maps blend compare modes", () => {
        expect(compareBlendMode("difference")).toBe("difference");
        expect(compareBlendMode("add")).toBe("plus-lighter");
        expect(compareBlendMode("wipe")).toBeNull();
        expect(compareBlendMode("subtract")).toBeNull();
    });
});

describe("studio guides", () => {
    it("fits aspect masks inside the frame", () => {
        expect(aspectRect(1000, 1000, "off")).toBeNull();
        expect(aspectRect(1920, 1920, "16:9")).toEqual({ x: 0, y: 420, w: 1920, h: 1080 });
        const tall = aspectRect(1600, 900, "9:16")!;
        expect(tall.h).toBe(900);
        expect(tall.w).toBeCloseTo(506.25, 5);
        expect(tall.x).toBeCloseTo((1600 - 506.25) / 2, 5);
    });

    it("draws thirds, centre and safe areas", () => {
        expect(gridGuides(300, 300, "off").lines).toHaveLength(0);
        const thirds = gridGuides(300, 600, "thirds");
        expect(thirds.lines).toHaveLength(4);
        expect(thirds.lines[0]).toEqual({ x1: 100, y1: 0, x2: 100, y2: 600 });
        expect(thirds.lines[2]).toEqual({ x1: 0, y1: 200, x2: 300, y2: 200 });
        const safe = gridGuides(1000, 500, "safe");
        expect(safe.rects).toHaveLength(2);
        expect(safe.rects[0].x).toBeCloseTo(50, 6);
        expect(safe.rects[0].y).toBeCloseTo(25, 6);
        expect(safe.rects[0].w).toBeCloseTo(900, 6);
    });
});

describe("studio scopes and zebra", () => {
    // 2x1 image: pure white, pure black (both opaque) + 1 transparent pixel.
    const data = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255]);

    it("computes histograms", () => {
        const h = computeHistogram(data);
        expect(h.r[255]).toBe(1);
        expect(h.r[0]).toBe(1);
        expect(h.l[255]).toBe(1);
        expect(computeHistogram(new Uint8ClampedArray([9, 9, 9, 0])).r[9]).toBe(0);
    });

    it("computes a luma waveform per column", () => {
        const w = computeWaveform(data, 2, 1, 256);
        expect(w.columns).toBe(2);
        expect(w.bins[0 * 256 + 255]).toBe(1);
        expect(w.bins[1 * 256 + 0]).toBe(1);
    });

    it("stripes only the highlights", () => {
        const z = computeZebra(data, 2, 1, 0.9);
        expect(z[3]).toBeGreaterThan(0);
        expect(z[7]).toBe(0);
    });

    it("downsizes samples and formats probes", () => {
        expect(sampleSize(1024, 512, 256)).toEqual({ w: 256, h: 128 });
        expect(sampleSize(100, 50, 256)).toEqual({ w: 100, h: 50 });
        expect(formatProbe(255, 128, 0, 255)).toEqual({
            hex: "#FF8000",
            rgb: "255, 128, 0",
            luma: "57%",
        });
        expect(formatProbe(0, 0, 0, 10).rgb).toContain("α 10");
    });
});

describe("compare B selection", () => {
    const list = ["img", "vid", "img", "img"];
    const isImg = (v: string) => v === "img";

    it("steps to the next matching item and wraps", () => {
        expect(nextCompareIndex(list, 0, 1, isImg)).toBe(2);
        expect(nextCompareIndex(list, 3, 1, isImg)).toBe(0);
        expect(nextCompareIndex(list, 0, -1, isImg)).toBe(3);
    });

    it("never returns the start and handles no match", () => {
        expect(nextCompareIndex(["img"], 0, 1)).toBeNull();
        expect(nextCompareIndex(list, 1, 1, (v) => v === "vid")).toBeNull();
    });
});
