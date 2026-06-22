/**
 * Player bar manager  -  mounts and tears down the unified media controls bar
 * for video/audio assets, including follower video sync and scopes refresh.
 */

import { parseFpsValue, readAssetFps, readAssetFrameCount } from "../../utils/mediaFps.js";

export function createPlayerBarManager({
    state,
    APP_CONFIG,
    VIEWER_MODES,
    overlay,
    navBar,
    playerBarHost,
    singleView,
    abView,
    sideView,
    metadataHydrator,
    isPlayableViewerKind,
    collectPlayableMediaElements,
    pickPrimaryPlayableMedia,
    mountUnifiedMediaControls,
    installFollowerVideoSync,
    getViewerInfo,
    scheduleOverlayRedraw,
    viewerInfoCacheGet,
    viewerInfoCacheSet,
}: Record<string, any>): Record<string, any> {
    function destroyPlayerBar() {
        try {
            if (state._videoControlsDestroy) state._videoControlsDestroy();
        } catch (e: any) {
            console.debug?.(e);
        }
        state._videoControlsDestroy = null;
        state._videoControlsMounted = null;
        state._activeVideoEl = null;
        state._activeVideoAssetId = null;
        state.nativeFps = null;
        try {
            state._videoSyncAbort?.abort?.();
        } catch (e: any) {
            console.debug?.(e);
        }
        state._videoSyncAbort = null;
        try {
            state._videoMetaAbort?.abort?.();
        } catch (e: any) {
            console.debug?.(e);
        }
        state._videoMetaAbort = null;
        try {
            state._videoFpsEventAbort?.abort?.();
        } catch (e: any) {
            console.debug?.(e);
        }
        state._videoFpsEventAbort = null;
        try {
            state._scopesVideoAbort?.abort?.();
        } catch (e: any) {
            console.debug?.(e);
        }
        state._scopesVideoAbort = null;
        try {
            playerBarHost.innerHTML = "";
        } catch (e: any) {
            console.debug?.(e);
        }
        try {
            playerBarHost.style.display = "none";
        } catch (e: any) {
            console.debug?.(e);
        }
        try {
            navBar.style.display = "";
        } catch (e: any) {
            console.debug?.(e);
        }
    }

    async function syncPlayerBar() {
        try {
            const current = state.assets[state.currentIndex];
            const currentAssetId = current?.id ?? null;
            if (!isPlayableViewerKind(current?.kind)) {
                destroyPlayerBar();
                return;
            }

            // Keep the player bar visible for playable media (video/audio) even in compare modes.
            let mediaEl: any = null;
            let allMedia: any[] = [];
            try {
                allMedia = collectPlayableMediaElements({
                    mode: state.mode,
                    VIEWER_MODES,
                    singleView,
                    abView,
                    sideView,
                });
            } catch {
                allMedia = [];
            }
            try {
                mediaEl = pickPrimaryPlayableMedia(allMedia);
            } catch {
                mediaEl = allMedia[0] || null;
            }
            if (!mediaEl) {
                destroyPlayerBar();
                return;
            }

            // Re-mount only if the underlying media element changed.
            if (
                state._activeVideoEl &&
                state._activeVideoEl === mediaEl &&
                state._activeVideoAssetId === currentAssetId &&
                state._videoControlsDestroy
            ) {
                try {
                    navBar.style.display = "none";
                    playerBarHost.style.display = "";
                } catch (e: any) {
                    console.debug?.(e);
                }
                return;
            }

            destroyPlayerBar();

            try {
                navBar.style.display = "none";
            } catch (e: any) {
                console.debug?.(e);
            }
            try {
                playerBarHost.style.display = "";
            } catch (e: any) {
                console.debug?.(e);
            }

            // Try to provide initial FPS/frameCount synchronously so the ruler shows correct values immediately.
            let initialFps = undefined;
            let initialFrameCount = undefined;
            try {
                const pickFromMeta = (assetMeta: any) => {
                    try {
                        const fps = readAssetFps(assetMeta);
                        const frameCount = readAssetFrameCount(assetMeta, fps);
                        return { fps, frameCount };
                    } catch {
                        return { fps: null, frameCount: null };
                    }
                };

                // Prefer the current in-memory asset payload (search results may already include metadata_raw).
                const fromCurrent = pickFromMeta(current);
                if (fromCurrent.fps != null) initialFps = fromCurrent.fps;
                if (fromCurrent.frameCount != null) initialFrameCount = fromCurrent.frameCount;

                // Fallback to cached full metadata if present.
                if (initialFps == null || initialFrameCount == null) {
                    const cached = metadataHydrator?.getCached?.(current?.id);
                    const fromCache = cached?.data
                        ? pickFromMeta(cached.data)
                        : { fps: null, frameCount: null };
                    if (initialFps == null && fromCache.fps != null) initialFps = fromCache.fps;
                    if (initialFrameCount == null && fromCache.frameCount != null)
                        initialFrameCount = fromCache.frameCount;
                }
            } catch (e: any) {
                console.debug?.(e);
            }

            // Last-resort: the media element may have already detected FPS via _attachFpsDetection
            // (synchronous asset-metadata emit fires before this listener is registered).
            // Reading _mjrDetectedFps from the video element bridges that timing gap.
            try {
                if (initialFps == null) {
                    const detected = Number(mediaEl?._mjrDetectedFps);
                    if (Number.isFinite(detected) && detected > 0) initialFps = detected;
                }
            } catch (e: any) {
                console.debug?.(e);
            }

            const mediaKind =
                String(current?.kind || "").toLowerCase() === "audio" ? "audio" : "video";
            const mounted = mountUnifiedMediaControls(mediaEl, {
                variant: "viewerbar",
                hostEl: playerBarHost,
                fullscreenEl: overlay,
                initialFps,
                initialFrameCount,
                initialPlaybackRate: Number(state?.playbackRate) || 1,
                mediaKind,
            });
            state._videoControlsMounted = mounted || null;
            state._videoControlsDestroy = mounted?.destroy || null;
            state._activeVideoEl = mediaEl;
            state._activeVideoAssetId = currentAssetId;
            try {
                state.nativeFps = Number(initialFps) > 0 ? Number(initialFps) : null;
            } catch (e: any) {
                console.debug?.(e);
            }
            try {
                if (mediaKind === "audio") {
                    const p = mediaEl.play?.();
                    if (p && typeof p.catch === "function") p.catch(() => {});
                }
            } catch (e: any) {
                console.debug?.(e);
            }
            try {
                const shouldAutoEnableVideoSound =
                    mediaKind === "video" && state.mode === VIEWER_MODES?.SINGLE;
                if (shouldAutoEnableVideoSound) {
                    mediaEl.muted = false;
                    const p = mediaEl.play?.();
                    if (p && typeof p.catch === "function") p.catch(() => {});
                }
            } catch (e: any) {
                console.debug?.(e);
            }

            // Keep scopes responsive for video only.
            try {
                state._scopesVideoAbort?.abort?.();
            } catch (e: any) {
                console.debug?.(e);
            }
            if (mediaKind === "video") {
                try {
                    const ac = new AbortController();
                    state._scopesVideoAbort = ac;
                    const refresh = () => {
                        try {
                            if (String(state?.scopesMode || "off") === "off") return;
                        } catch (e: any) {
                            console.debug?.(e);
                        }
                        scheduleOverlayRedraw();
                    };
                    mediaEl.addEventListener("seeked", refresh, {
                        signal: ac.signal,
                        passive: true,
                    });
                    mediaEl.addEventListener("loadeddata", refresh, {
                        signal: ac.signal,
                        passive: true,
                    });
                    mediaEl.addEventListener("play", refresh, { signal: ac.signal, passive: true });
                    mediaEl.addEventListener("pause", refresh, {
                        signal: ac.signal,
                        passive: true,
                    });

                    const scopesFps = Math.max(
                        1,
                        Math.min(30, Math.floor(Number(APP_CONFIG.VIEWER_SCOPES_FPS) || 10)),
                    );
                    const interval = 1000 / scopesFps;
                    const tick = () => {
                        if (ac.signal.aborted) return;
                        try {
                            if (document?.hidden) return;
                        } catch (e: any) {
                            console.debug?.(e);
                        }
                        try {
                            if (overlay.style.display === "none") return;
                        } catch (e: any) {
                            console.debug?.(e);
                        }
                        try {
                            if (String(state?.scopesMode || "off") !== "off" && !mediaEl.paused) {
                                const now = performance.now();
                                const last = Number(state?._scopesLastAt) || 0;
                                if (now - last >= interval) {
                                    state._scopesLastAt = now;
                                    scheduleOverlayRedraw();
                                }
                            }
                        } catch (e: any) {
                            console.debug?.(e);
                        }
                        try {
                            requestAnimationFrame(tick);
                        } catch (e: any) {
                            console.debug?.(e);
                        }
                    };
                    try {
                        requestAnimationFrame(tick);
                    } catch (e: any) {
                        console.debug?.(e);
                    }
                } catch (e: any) {
                    console.debug?.(e);
                }
            } else {
                state._scopesVideoAbort = null;
            }

            // Only sync followers for video. Audio compare intentionally keeps secondary tracks silent.
            try {
                state._videoSyncAbort?.abort?.();
            } catch (e: any) {
                console.debug?.(e);
            }
            try {
                state._videoSyncAbort = null;
                if (mediaKind === "video" && allMedia.length > 1) {
                    const followers = allMedia.filter((v: any) => v && v !== mediaEl);
                    state._videoSyncAbort = installFollowerVideoSync(mediaEl, followers);
                }
            } catch (e: any) {
                console.debug?.(e);
            }

            if (mediaKind === "video") {
                // Best-effort: use backend viewer-info to set FPS / frame count for the ruler.
                // Must never throw or block the UI.
                try {
                    const parseFps = (v: any) => {
                        return parseFpsValue(v);
                    };
                    const parseFrameCount = (v: any) => {
                        const n = Number(v);
                        if (!Number.isFinite(n) || n <= 0) return null;
                        return Math.floor(n);
                    };

                    const applyFromViewerInfo = (info: any) => {
                        try {
                            if (!info || typeof info !== "object") return;
                            const fps = parseFps(info?.fps_raw ?? info?.fps ?? info?.frame_rate);
                            const frameCount = parseFrameCount(info?.frame_count);
                            if (fps != null) state.nativeFps = fps;
                            if (fps != null || frameCount != null)
                                mounted?.setMediaInfo?.({ fps, frameCount });
                        } catch (e: any) {
                            console.debug?.(e);
                        }
                    };

                    // Apply cached viewer info immediately if present.
                    try {
                        const cached = viewerInfoCacheGet(current?.id);
                        if (cached) applyFromViewerInfo(cached);
                    } catch (e: any) {
                        console.debug?.(e);
                    }

                    // Fetch fresh in background (cancel if asset changes).
                    try {
                        state._videoMetaAbort?.abort?.();
                    } catch (e: any) {
                        console.debug?.(e);
                    }
                    const ac = new AbortController();
                    state._videoMetaAbort = ac;
                    void (async () => {
                        try {
                            const res = await getViewerInfo(current?.id, { signal: ac.signal });
                            if (!res?.ok || !res.data) return;
                            // Still the same active media element?
                            if (state._activeVideoEl !== mediaEl) return;
                            try {
                                viewerInfoCacheSet(current?.id, res.data);
                            } catch (e: any) {
                                console.debug?.(e);
                            }
                            applyFromViewerInfo(res.data);
                        } catch (e: any) {
                            console.debug?.(e);
                        }
                    })();
                } catch (e: any) {
                    console.debug?.(e);
                }

                // Best-effort: listen for FPS detected from video metadata/runtime in mediaFactory.
                try {
                    state._videoFpsEventAbort?.abort?.();
                } catch (e: any) {
                    console.debug?.(e);
                }
                try {
                    const ac = new AbortController();
                    state._videoFpsEventAbort = ac;
                    window.addEventListener(
                        "mjr:viewer-fps-detected",
                        (e: Event) => {
                            try {
                                const detail = (e as CustomEvent)?.detail || {};
                                const aid = String(detail?.assetId || "");
                                const currentId = String(current?.id ?? "");
                                if (!aid || !currentId || aid !== currentId) return;
                                if (state._activeVideoEl !== mediaEl) return;
                                const fps = Number(detail?.fps);
                                if (!Number.isFinite(fps) || fps <= 0) return;
                                const source = String(detail?.source || "");
                                if (source !== "rvfc" || !(Number(state.nativeFps) > 0)) {
                                    state.nativeFps = fps;
                                }
                                mounted?.setMediaInfo?.({ fps, fpsSource: source });
                            } catch (e: any) {
                                console.debug?.(e);
                            }
                        },
                        { signal: ac.signal, passive: true },
                    );
                } catch (e: any) {
                    console.debug?.(e);
                }
            } else {
                try {
                    state._videoMetaAbort?.abort?.();
                } catch (e: any) {
                    console.debug?.(e);
                }
                state._videoMetaAbort = null;
                try {
                    state._videoFpsEventAbort?.abort?.();
                } catch (e: any) {
                    console.debug?.(e);
                }
                state._videoFpsEventAbort = null;
            }
        } catch {
            destroyPlayerBar();
        }
    }

    return { destroyPlayerBar, syncPlayerBar };
}
