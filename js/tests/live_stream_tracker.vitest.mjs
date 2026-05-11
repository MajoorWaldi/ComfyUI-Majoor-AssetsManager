import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
    const upsertWithContent = vi.fn();
    const feedPreviewBlob = vi.fn();
    const getLiveActive = vi.fn(() => true);
    const waitForComfyApi = vi.fn();

    let api = null;

    return {
        upsertWithContent,
        feedPreviewBlob,
        getLiveActive,
        waitForComfyApi,
        setApi(nextApi) {
            api = nextApi;
            waitForComfyApi.mockResolvedValue(nextApi);
        },
        reset() {
            api = null;
            upsertWithContent.mockReset();
            feedPreviewBlob.mockReset();
            getLiveActive.mockReset();
            getLiveActive.mockReturnValue(true);
            waitForComfyApi.mockReset();
            waitForComfyApi.mockResolvedValue(api);
        },
    };
});

vi.mock("../app/events.js", () => ({
    EVENTS: {
        NEW_GENERATION_OUTPUT: "mjr:new-generation-output",
    },
}));

vi.mock("../features/viewer/floatingViewerManager.js", () => ({
    floatingViewerManager: {
        getLiveActive: () => state.getLiveActive(),
        upsertWithContent: (...args) => state.upsertWithContent(...args),
        feedPreviewBlob: (...args) => state.feedPreviewBlob(...args),
    },
}));

vi.mock("../app/comfyApiBridge.js", () => ({
    waitForComfyApi: (...args) => state.waitForComfyApi(...args),
}));

function createWindowStub() {
    const listeners = new Map();
    return {
        addEventListener(type, handler) {
            if (!listeners.has(type)) listeners.set(type, new Set());
            listeners.get(type).add(handler);
        },
        removeEventListener(type, handler) {
            listeners.get(type)?.delete(handler);
        },
        dispatchEvent(event) {
            const handlers = Array.from(listeners.get(event?.type) || []);
            for (const handler of handlers) {
                handler(event);
            }
            return true;
        },
    };
}

function installCustomEventShim() {
    globalThis.CustomEvent = class CustomEvent extends Event {
        constructor(type, init = {}) {
            super(type);
            this.detail = init.detail;
        }
    };
}

class FakeApi extends EventTarget {}

async function flushMicrotasks() {
    await Promise.resolve();
    await Promise.resolve();
}

beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    state.reset();
    globalThis.window = createWindowStub();
    installCustomEventShim();
});

afterEach(() => {
    vi.useRealTimers();
    delete globalThis.window;
    delete globalThis.CustomEvent;
});

describe("LiveStreamTracker", () => {
    it("prefers the latest previewable output instead of earlier image-only fallbacks", async () => {
        const api = new FakeApi();
        state.setApi(api);

        const mod = await import("../features/viewer/LiveStreamTracker.js");
        mod.initLiveStreamTracker({});
        await flushMicrotasks();

        window.dispatchEvent(
            new CustomEvent("mjr:new-generation-output", {
                detail: {
                    files: [
                        { filename: "thumb.png", type: "output" },
                        { filename: "final-video.mp4", type: "output" },
                    ],
                },
            }),
        );

        expect(state.upsertWithContent).toHaveBeenCalledWith({
            filename: "final-video.mp4",
            type: "output",
        });

        mod.teardownLiveStreamTracker({});
    });

    it("re-enables plain preview blobs after metadata previews stop arriving", async () => {
        const api = new FakeApi();
        state.setApi(api);

        const mod = await import("../features/viewer/LiveStreamTracker.js");
        mod.initLiveStreamTracker({});
        await flushMicrotasks();

        const metadataBlob = new Blob(["meta"]);
        api.dispatchEvent(
            new CustomEvent("b_preview_with_metadata", {
                detail: { blob: metadataBlob, nodeId: "12" },
            }),
        );

        expect(state.feedPreviewBlob).toHaveBeenCalledWith(metadataBlob, {
            sourceLabel: "Node 12",
        });

        state.feedPreviewBlob.mockClear();

        const fallbackBlob = new Blob(["fallback"]);
        api.dispatchEvent(new CustomEvent("b_preview", { detail: fallbackBlob }));
        expect(state.feedPreviewBlob).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(401);
        api.dispatchEvent(new CustomEvent("b_preview", { detail: fallbackBlob }));

        expect(state.feedPreviewBlob).toHaveBeenCalledWith(fallbackBlob);

        mod.teardownLiveStreamTracker({});
    });
});
