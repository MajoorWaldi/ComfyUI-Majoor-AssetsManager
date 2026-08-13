import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
    const upsertWithContent = vi.fn();
    const feedPreviewBlob = vi.fn();
    const getLiveActive = vi.fn(() => true);
    const canAcceptPreviewBlob = vi.fn(() => true);
    const waitForComfyApi = vi.fn();
    const appConfig = { MFV_KJ_PREVIEW_OVERRIDE_ENABLED: true };

    let api = null;

    return {
        upsertWithContent,
        feedPreviewBlob,
        getLiveActive,
        canAcceptPreviewBlob,
        waitForComfyApi,
        appConfig,
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
            canAcceptPreviewBlob.mockReset();
            canAcceptPreviewBlob.mockReturnValue(true);
            waitForComfyApi.mockReset();
            waitForComfyApi.mockResolvedValue(api);
            appConfig.MFV_KJ_PREVIEW_OVERRIDE_ENABLED = true;
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
        canAcceptPreviewBlob: () => state.canAcceptPreviewBlob(),
        upsertWithContent: (...args) => state.upsertWithContent(...args),
        feedPreviewBlob: (...args) => state.feedPreviewBlob(...args),
    },
}));

vi.mock("../app/config.js", () => ({
    APP_CONFIG: state.appConfig,
}));

vi.mock("../app/hostAdapter.js", () => ({
    waitForRawHostApi: (...args) => state.waitForComfyApi(...args),
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

    it("streams KJNodes JPEG preview override frames with node and step context", async () => {
        const api = new FakeApi();
        state.setApi(api);

        const mod = await import("../features/viewer/LiveStreamTracker.js");
        mod.initLiveStreamTracker({});
        await flushMicrotasks();

        api.dispatchEvent(
            new CustomEvent("kj_preview_override", {
                detail: {
                    node_id: "12:7",
                    image: "aGVsbG8=",
                    mime: "image/jpeg",
                    w: 1024,
                    h: 768,
                    step: 3,
                    total: 20,
                },
            }),
        );

        expect(state.feedPreviewBlob).toHaveBeenCalledTimes(1);
        const [blob, options] = state.feedPreviewBlob.mock.calls[0];
        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type).toBe("image/jpeg");
        expect(await blob.text()).toBe("hello");
        expect(options).toEqual({
            source: "kj-preview-override",
            sourceLabel: "KJ Preview Override · Node 12:7 · 3/20",
            nodeId: "12:7",
            mime: "image/jpeg",
            width: 1024,
            height: 768,
            fps: undefined,
            step: 3,
            total: 20,
        });

        mod.teardownLiveStreamTracker({});
    });

    it("supports KJNodes MP4 previews and suppresses binary previews for that execution", async () => {
        const api = new FakeApi();
        state.setApi(api);

        const mod = await import("../features/viewer/LiveStreamTracker.js");
        mod.initLiveStreamTracker({});
        await flushMicrotasks();

        api.dispatchEvent(
            new CustomEvent("kj_preview_override", {
                detail: {
                    node_id: "8",
                    image: "AAAAIGZ0eXA=",
                    mime: "video/mp4",
                    fps: 12,
                    step: 1,
                    total: 8,
                },
            }),
        );

        const [blob, options] = state.feedPreviewBlob.mock.calls[0];
        expect(blob.type).toBe("video/mp4");
        expect(options.fps).toBe(12);

        state.feedPreviewBlob.mockClear();
        api.dispatchEvent(new CustomEvent("b_preview", { detail: new Blob(["fallback"]) }));
        expect(state.feedPreviewBlob).not.toHaveBeenCalled();

        // Moving to another execution node ends KJ's priority so a later
        // sampler without Model Preview Override can use the core preview.
        api.dispatchEvent(new CustomEvent("executing", { detail: "next-node" }));
        api.dispatchEvent(new CustomEvent("b_preview", { detail: new Blob(["next"]) }));
        expect(state.feedPreviewBlob).toHaveBeenCalledTimes(1);

        mod.teardownLiveStreamTracker({});
    });

    it("ignores KJNodes preview override frames when the dedicated setting is disabled", async () => {
        const api = new FakeApi();
        state.setApi(api);
        state.appConfig.MFV_KJ_PREVIEW_OVERRIDE_ENABLED = false;

        const mod = await import("../features/viewer/LiveStreamTracker.js");
        mod.initLiveStreamTracker({});
        await flushMicrotasks();

        api.dispatchEvent(
            new CustomEvent("kj_preview_override", {
                detail: { node_id: "4", image: "aGVsbG8=", mime: "image/webp" },
            }),
        );

        expect(state.feedPreviewBlob).not.toHaveBeenCalled();

        api.dispatchEvent(new CustomEvent("b_preview", { detail: new Blob(["standard"]) }));
        expect(state.feedPreviewBlob).toHaveBeenCalledTimes(1);
        mod.teardownLiveStreamTracker({});
    });

    it("does not decode KJ preview payloads while the viewer rejects preview frames", async () => {
        const api = new FakeApi();
        state.setApi(api);
        state.canAcceptPreviewBlob.mockReturnValue(false);
        const atobSpy = vi.spyOn(globalThis, "atob");

        const mod = await import("../features/viewer/LiveStreamTracker.js");
        mod.initLiveStreamTracker({});
        await flushMicrotasks();
        api.dispatchEvent(
            new CustomEvent("kj_preview_override", {
                detail: { image: "aGVsbG8=", mime: "image/jpeg" },
            }),
        );

        expect(atobSpy).not.toHaveBeenCalled();
        expect(state.feedPreviewBlob).not.toHaveBeenCalled();
        mod.teardownLiveStreamTracker({});
    });
});
