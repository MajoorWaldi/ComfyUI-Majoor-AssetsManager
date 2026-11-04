import { describe, expect, it, vi } from "vitest";

import {
    pauseFloatingViewerMediaIn,
    releaseFloatingViewerMediaIn,
} from "../features/viewer/floatingViewerMedia.js";

function fakeVideo() {
    const sources = [{ remove: vi.fn() }];
    return {
        pause: vi.fn(),
        load: vi.fn(),
        removeAttribute: vi.fn(),
        querySelectorAll: vi.fn(() => sources),
        sources,
    };
}

function root(media: any[]) {
    return { querySelectorAll: vi.fn(() => media) };
}

describe("floating viewer media lifecycle", () => {
    it("release frees the player (src + <source> + load), not just pauses", () => {
        const video = fakeVideo();

        releaseFloatingViewerMediaIn(root([video]));

        expect(video.pause).toHaveBeenCalled();
        expect(video.removeAttribute).toHaveBeenCalledWith("src");
        expect(video.sources[0].remove).toHaveBeenCalled();
        expect(video.load).toHaveBeenCalled();
    });

    it("pause (used by hide) keeps the source so the viewer can be shown again", () => {
        const video = fakeVideo();

        pauseFloatingViewerMediaIn(root([video]));

        expect(video.pause).toHaveBeenCalled();
        expect(video.removeAttribute).not.toHaveBeenCalled();
        expect(video.load).not.toHaveBeenCalled();
    });

    it("tolerates missing roots and odd elements", () => {
        expect(() => releaseFloatingViewerMediaIn(null)).not.toThrow();
        expect(() => releaseFloatingViewerMediaIn(root([{}]))).not.toThrow();
    });
});
