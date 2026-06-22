// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../app/config.js", () => ({
    APP_CONFIG: { DEBUG_VIEWER: false },
}));

function makeMedia({ currentTime = 0, paused = true, playbackRate = 1 } = {}) {
    const el = document.createElement("video");
    let time = currentTime;
    let isPaused = paused;
    let rate = playbackRate;
    let ended = false;

    Object.defineProperty(el, "currentTime", {
        configurable: true,
        get: () => time,
        set: (value) => {
            time = Number(value);
        },
    });
    Object.defineProperty(el, "paused", {
        configurable: true,
        get: () => isPaused,
    });
    Object.defineProperty(el, "playbackRate", {
        configurable: true,
        get: () => rate,
        set: (value) => {
            rate = Number(value);
        },
    });
    Object.defineProperty(el, "ended", {
        configurable: true,
        get: () => ended,
        set: (value) => {
            ended = Boolean(value);
        },
    });
    el.play = vi.fn(() => {
        isPaused = false;
        el.dispatchEvent(new Event("play"));
        return Promise.resolve();
    });
    el.pause = vi.fn(() => {
        isPaused = true;
        el.dispatchEvent(new Event("pause"));
    });
    return el;
}

describe("video sync", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete globalThis.requestAnimationFrame;
        delete globalThis.cancelAnimationFrame;
    });

    it("lets a follower become the source for play, seek, and rate changes", async () => {
        const { installFollowerVideoSync } = await import("../features/viewer/videoSync.js");
        const leader = makeMedia({ currentTime: 0, paused: true, playbackRate: 1 });
        const follower = makeMedia({ currentTime: 3, paused: true, playbackRate: 1.5 });
        const other = makeMedia({ currentTime: 8, paused: true, playbackRate: 1 });

        installFollowerVideoSync(leader, [follower, other], { threshold: 0.01 });

        follower.currentTime = 4.25;
        follower.playbackRate = 1.75;
        follower.dispatchEvent(new Event("ratechange"));
        follower.dispatchEvent(new Event("seeking"));
        follower.play();

        expect(leader.currentTime).toBeCloseTo(4.25, 5);
        expect(other.currentTime).toBeCloseTo(4.25, 5);
        expect(leader.playbackRate).toBe(1.75);
        expect(other.playbackRate).toBe(1.75);
        expect(leader.play).toHaveBeenCalledTimes(1);
        expect(other.play).toHaveBeenCalledTimes(1);
    });

    it("does not bounce a leader pause back through expected follower pause events", async () => {
        const { installFollowerVideoSync } = await import("../features/viewer/videoSync.js");
        const leader = makeMedia({ currentTime: 0, paused: false });
        const follower = makeMedia({ currentTime: 0, paused: false });

        installFollowerVideoSync(leader, [follower], { threshold: 0.01 });
        follower.pause.mockClear();

        leader.pause();

        expect(follower.pause).toHaveBeenCalledTimes(1);
        expect(leader.pause).toHaveBeenCalledTimes(1);
    });

    it("keeps followers aligned continuously during playback", async () => {
        let rafCallback = null;
        globalThis.requestAnimationFrame = vi.fn((cb) => {
            rafCallback = cb;
            return 22;
        });
        globalThis.cancelAnimationFrame = vi.fn();

        const { installFollowerVideoSync } = await import("../features/viewer/videoSync.js");
        const leader = makeMedia({ currentTime: 0, paused: false });
        const follower = makeMedia({ currentTime: 0, paused: false });

        const ac = installFollowerVideoSync(leader, [follower], { threshold: 0.01 });
        leader.currentTime = 1.25;
        rafCallback?.();

        expect(follower.currentTime).toBeCloseTo(1.25, 5);
        expect(globalThis.requestAnimationFrame).toHaveBeenCalled();

        ac.abort();
        expect(globalThis.cancelAnimationFrame).toHaveBeenCalled();
    });
});
