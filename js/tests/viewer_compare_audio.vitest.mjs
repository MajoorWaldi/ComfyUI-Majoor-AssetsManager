import { beforeEach, describe, expect, it, vi } from "vitest";

function createAudioMedia() {
    const audio = {
        dataset: {},
        muted: false,
        pause: vi.fn(),
    };
    return {
        audio,
        media: {
            style: {},
            querySelector: vi.fn((selector) => {
                if (selector === ".mjr-viewer-audio-src" || selector === "audio") return audio;
                return null;
            }),
        },
    };
}

describe("viewer compare audio safety", () => {
    beforeEach(() => {
        globalThis.document = {
            createElement: vi.fn(() => ({
                style: {},
                className: "",
                appendChild: vi.fn(),
                setAttribute: vi.fn(),
                addEventListener: vi.fn(),
                remove: vi.fn(),
            })),
        };
        globalThis.window = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            CSS: { supports: vi.fn(() => false) },
        };
        globalThis.HTMLCanvasElement = class {};
    });

    it("mutes the secondary audio track in A/B compare", async () => {
        const { renderABCompareView } = await import("../features/viewer/abCompare.js");
        const a = createAudioMedia();
        const b = createAudioMedia();
        const medias = [b.media, a.media];
        const abView = {
            innerHTML: "",
            style: {},
            appendChild: vi.fn(),
            getBoundingClientRect: vi.fn(() => ({ width: 100, height: 100, top: 0, left: 0 })),
        };

        renderABCompareView({
            abView,
            state: { abCompareMode: "wipe" },
            currentAsset: { id: 1, kind: "audio" },
            viewUrl: "/a.mp3",
            buildAssetViewURL: () => "/b.mp3",
            createCompareMediaElement: () => medias.shift(),
            destroyMediaProcessorsIn: vi.fn(),
        });

        expect(a.audio.dataset.mjrCompareRole).toBe("A");
        expect(a.audio.muted).toBe(false);
        expect(b.audio.dataset.mjrCompareRole).toBe("B");
        expect(b.audio.muted).toBe(true);
        expect(b.audio.pause).toHaveBeenCalledTimes(1);
    });

    it("keeps only slot A audible in side-by-side layouts", async () => {
        const { renderSideBySideView } = await import("../features/viewer/sideBySide.js");
        const a = createAudioMedia();
        const b = createAudioMedia();
        const medias = [a.media, b.media];
        const sideView = {
            innerHTML: "",
            style: {},
            appendChild: vi.fn(),
        };

        renderSideBySideView({
            sideView,
            state: {
                assets: [
                    { id: 1, kind: "audio" },
                    { id: 2, kind: "audio" },
                ],
                currentIndex: 0,
            },
            currentAsset: { id: 1, kind: "audio" },
            viewUrl: "/a.mp3",
            buildAssetViewURL: () => "/b.mp3",
            createMediaElement: () => medias.shift(),
            destroyMediaProcessorsIn: vi.fn(),
        });

        expect(a.audio.dataset.mjrCompareRole).toBe("A");
        expect(a.audio.muted).toBe(false);
        expect(b.audio.dataset.mjrCompareRole).toBe("B");
        expect(b.audio.muted).toBe(true);
        expect(b.audio.pause).toHaveBeenCalledTimes(1);
    });
});
