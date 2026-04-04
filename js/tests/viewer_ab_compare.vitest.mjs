import { beforeEach, describe, expect, it, vi } from "vitest";

class CanvasMock {}

function createSourceCanvas(pixels, width = 2, height = 2) {
    return Object.assign(new CanvasMock(), {
        width,
        height,
        dataset: {},
        style: {},
        _pixels: new Uint8ClampedArray(pixels),
    });
}

function createMediaWithCanvas(canvas) {
    return {
        style: {},
        appendChild: vi.fn(),
        querySelector(selector) {
            if (selector === "canvas.mjr-viewer-media" || selector === "canvas") return canvas;
            return null;
        },
    };
}

describe("viewer A/B compare", () => {
    beforeEach(() => {
        globalThis.HTMLCanvasElement = CanvasMock;
        globalThis.performance = { now: () => 1000 };
        globalThis.requestAnimationFrame = (callback) => {
            callback();
            return 1;
        };
        globalThis.cancelAnimationFrame = vi.fn();
        globalThis.window = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            CSS: { supports: vi.fn(() => false) },
        };
    });

    it("renders subtract mode from both source canvases and restores context", async () => {
        let currentPixels = new Uint8ClampedArray(8);
        let lastPutPixels = null;
        const ctx = {
            globalCompositeOperation: "source-over",
            save: vi.fn(),
            restore: vi.fn(),
            clearRect: vi.fn(() => {
                currentPixels = new Uint8ClampedArray(currentPixels.length);
            }),
            drawImage: vi.fn((source) => {
                currentPixels = new Uint8ClampedArray(source._pixels || []);
            }),
            getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(currentPixels) })),
            putImageData: vi.fn((imageData) => {
                lastPutPixels = new Uint8ClampedArray(imageData.data);
                currentPixels = new Uint8ClampedArray(imageData.data);
            }),
        };

        globalThis.document = {
            createElement: vi.fn((tag) => {
                if (tag === "canvas") {
                    return Object.assign(new CanvasMock(), {
                        className: "",
                        style: {},
                        dataset: {},
                        width: 0,
                        height: 0,
                        getContext: vi.fn(() => ctx),
                    });
                }
                return {
                    className: "",
                    style: {},
                    dataset: {},
                    appendChild: vi.fn(),
                    addEventListener: vi.fn(),
                    setAttribute: vi.fn(),
                };
            }),
        };

        const baseCanvas = createSourceCanvas([
            200, 150, 100, 255, 120, 90, 60, 255,
            180, 140, 90, 255, 90, 70, 40, 255,
        ]);
        const topCanvas = createSourceCanvas([
            50, 20, 10, 255, 20, 10, 5, 255,
            30, 15, 10, 255, 10, 5, 5, 255,
        ]);
        const medias = [createMediaWithCanvas(baseCanvas), createMediaWithCanvas(topCanvas)];
        const abView = {
            innerHTML: "",
            style: {},
            appendChild: vi.fn(),
            getBoundingClientRect: vi.fn(() => ({ width: 2, height: 2, top: 0, left: 0 })),
        };

        const { renderABCompareView } = await import("../features/viewer/abCompare.js");

        renderABCompareView({
            abView,
            state: {
                abCompareMode: "subtract",
                assets: [{ id: 1 }, { id: 2 }],
                currentIndex: 0,
            },
            currentAsset: { id: 1, kind: "image" },
            viewUrl: "/a.png",
            buildAssetViewURL: () => "/b.png",
            createCompareMediaElement: () => medias.shift(),
            destroyMediaProcessorsIn: vi.fn(),
        });

        expect(lastPutPixels).toBeTruthy();
        expect(Array.from(lastPutPixels)).toEqual([
            150, 130, 90, 255, 100, 80, 55, 255,
            150, 125, 80, 255, 80, 65, 35, 255,
        ]);
        expect(ctx.save).toHaveBeenCalledTimes(1);
        expect(ctx.restore).toHaveBeenCalledTimes(1);
    });
});