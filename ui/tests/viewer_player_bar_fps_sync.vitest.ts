import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPlayerBarManager } from "../features/viewer/playerBarManager.js";

function createAsset(id, fpsRaw) {
    return {
        id,
        kind: "video",
        metadata_raw: {
            raw_ffprobe: {
                video_stream: {
                    avg_frame_rate: fpsRaw,
                },
            },
        },
    };
}

describe("playerBarManager FPS sync", () => {
    let state;
    let overlay;
    let navBar;
    let playerBarHost;
    let mediaEl;
    let mountUnifiedMediaControls;

    beforeEach(() => {
        globalThis.window = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        };
        globalThis.requestAnimationFrame = vi.fn(() => 1);
        state = {
            assets: [createAsset(1001, "25/2"), createAsset(1002, "25/1")],
            currentIndex: 0,
            mode: "single",
            nativeFps: null,
            _videoControlsDestroy: null,
            _videoControlsMounted: null,
            _activeVideoEl: null,
            _activeVideoAssetId: null,
            _videoSyncAbort: null,
            _videoMetaAbort: null,
            _videoFpsEventAbort: null,
            _scopesVideoAbort: null,
        };
        overlay = { style: { display: "" } };
        navBar = { style: { display: "" } };
        playerBarHost = { style: { display: "none" }, innerHTML: "" };
        mediaEl = {
            paused: true,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            play: vi.fn(),
        };
        mountUnifiedMediaControls = vi.fn((_video, opts) => ({
            destroy: vi.fn(),
            setMediaInfo: vi.fn(),
            _opts: opts,
        }));
    });

    it("re-mounts controls when the asset changes even if the media element is reused", async () => {
        const manager = createPlayerBarManager({
            state,
            APP_CONFIG: { VIEWER_SCOPES_FPS: 8 },
            VIEWER_MODES: { SINGLE: "single" },
            overlay,
            navBar,
            playerBarHost,
            singleView: null,
            abView: null,
            sideView: null,
            metadataHydrator: { getCached: vi.fn(() => null) },
            isPlayableViewerKind: () => true,
            collectPlayableMediaElements: () => [mediaEl],
            pickPrimaryPlayableMedia: () => mediaEl,
            mountUnifiedMediaControls,
            installFollowerVideoSync: vi.fn(() => ({ abort: vi.fn() })),
            getViewerInfo: vi.fn(async () => ({ ok: true, data: {} })),
            scheduleOverlayRedraw: vi.fn(),
            viewerInfoCacheGet: vi.fn(() => null),
            viewerInfoCacheSet: vi.fn(),
        });

        await manager.syncPlayerBar();
        expect(mountUnifiedMediaControls).toHaveBeenCalledTimes(1);
        expect(mountUnifiedMediaControls.mock.calls[0][1]).toEqual(
            expect.objectContaining({ initialFps: 12.5, initialFrameCount: undefined }),
        );

        state.currentIndex = 1;
        await manager.syncPlayerBar();

        expect(mountUnifiedMediaControls).toHaveBeenCalledTimes(2);
        expect(mountUnifiedMediaControls.mock.calls[1][1]).toEqual(
            expect.objectContaining({ initialFps: 25, initialFrameCount: undefined }),
        );
        expect(state._activeVideoAssetId).toBe(1002);
        expect(state.nativeFps).toBe(25);
    });

    it("keeps compare audio secondary tracks out of follower sync", async () => {
        const audioA = {
            paused: true,
            muted: false,
            volume: 1,
            playbackRate: 1,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            play: vi.fn(() => ({ catch: vi.fn() })),
        };
        const audioB = {
            paused: true,
            muted: true,
            volume: 1,
            playbackRate: 1,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            play: vi.fn(() => ({ catch: vi.fn() })),
        };
        const installFollowerVideoSync = vi.fn(() => ({ abort: vi.fn() }));
        const getViewerInfo = vi.fn(async () => ({ ok: true, data: {} }));

        state.assets = [
            { id: 2001, kind: "audio" },
            { id: 2002, kind: "audio" },
        ];
        state.currentIndex = 0;
        state.mode = "ab";

        const manager = createPlayerBarManager({
            state,
            APP_CONFIG: { VIEWER_SCOPES_FPS: 8 },
            VIEWER_MODES: { SINGLE: "single", AB_COMPARE: "ab" },
            overlay,
            navBar,
            playerBarHost,
            singleView: null,
            abView: null,
            sideView: null,
            metadataHydrator: { getCached: vi.fn(() => null) },
            isPlayableViewerKind: () => true,
            collectPlayableMediaElements: () => [audioA, audioB],
            pickPrimaryPlayableMedia: () => audioA,
            mountUnifiedMediaControls,
            installFollowerVideoSync,
            getViewerInfo,
            scheduleOverlayRedraw: vi.fn(),
            viewerInfoCacheGet: vi.fn(() => null),
            viewerInfoCacheSet: vi.fn(),
        });

        await manager.syncPlayerBar();

        expect(mountUnifiedMediaControls).toHaveBeenCalledWith(
            audioA,
            expect.objectContaining({ mediaKind: "audio" }),
        );
        expect(audioA.play).toHaveBeenCalledTimes(1);
        expect(installFollowerVideoSync).not.toHaveBeenCalled();
        expect(getViewerInfo).not.toHaveBeenCalled();
        expect(state._videoSyncAbort).toBeNull();
    });

    it("auto-enables sound for single-view videos in the player bar", async () => {
        const manager = createPlayerBarManager({
            state,
            APP_CONFIG: { VIEWER_SCOPES_FPS: 8 },
            VIEWER_MODES: { SINGLE: "single" },
            overlay,
            navBar,
            playerBarHost,
            singleView: null,
            abView: null,
            sideView: null,
            metadataHydrator: { getCached: vi.fn(() => null) },
            isPlayableViewerKind: () => true,
            collectPlayableMediaElements: () => [mediaEl],
            pickPrimaryPlayableMedia: () => mediaEl,
            mountUnifiedMediaControls,
            installFollowerVideoSync: vi.fn(() => ({ abort: vi.fn() })),
            getViewerInfo: vi.fn(async () => ({ ok: true, data: {} })),
            scheduleOverlayRedraw: vi.fn(),
            viewerInfoCacheGet: vi.fn(() => null),
            viewerInfoCacheSet: vi.fn(),
        });

        mediaEl.muted = true;
        mediaEl.paused = true;

        await manager.syncPlayerBar();

        expect(mediaEl.muted).toBe(false);
        expect(mediaEl.play).toHaveBeenCalledTimes(1);
    });
});
