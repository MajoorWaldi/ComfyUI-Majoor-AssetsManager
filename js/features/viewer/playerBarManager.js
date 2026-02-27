/**
 * Player bar manager — mounts and tears down the unified media controls bar
 * for video/audio assets, including follower video sync and scopes refresh.
 */

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
}) {
    function destroyPlayerBar() {
        try {
            if (state._videoControlsDestroy) state._videoControlsDestroy();
        } catch (e) { console.debug?.(e); }
        state._videoControlsDestroy = null;
        state._videoControlsMounted = null;
        state._activeVideoEl = null;
        try {
            state._videoSyncAbort?.abort?.();
        } catch (e) { console.debug?.(e); }
        state._videoSyncAbort = null;
        try {
            state._videoMetaAbort?.abort?.();
        } catch (e) { console.debug?.(e); }
        state._videoMetaAbort = null;
        try {
            state._videoFpsEventAbort?.abort?.();
        } catch (e) { console.debug?.(e); }
        state._videoFpsEventAbort = null;
        try {
            state._scopesVideoAbort?.abort?.();
        } catch (e) { console.debug?.(e); }
        state._scopesVideoAbort = null;
        try {
            playerBarHost.innerHTML = "";
        } catch (e) { console.debug?.(e); }
        try {
            playerBarHost.style.display = "none";
        } catch (e) { console.debug?.(e); }
        try {
            navBar.style.display = "";
        } catch (e) { console.debug?.(e); }
    }

    async function syncPlayerBar() {
        try {
            const current = state.assets[state.currentIndex];
            if (!isPlayableViewerKind(current?.kind)) {
                destroyPlayerBar();
                return;
            }

            // Keep the player bar visible for playable media (video/audio) even in compare modes.
            let mediaEl = null;
            let allMedia = [];
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
            if (state._activeVideoEl && state._activeVideoEl === mediaEl && state._videoControlsDestroy) {
                try {
                    navBar.style.display = "none";
                    playerBarHost.style.display = "";
                } catch (e) { console.debug?.(e); }
                return;
            }

            destroyPlayerBar();

            try {
                navBar.style.display = "none";
            } catch (e) { console.debug?.(e); }
            try {
                playerBarHost.style.display = "";
            } catch (e) { console.debug?.(e); }

            // Try to provide initial FPS/frameCount synchronously so the ruler shows correct values immediately.
            let initialFps = undefined;
            let initialFrameCount = undefined;
            try {
                const parseFps = (v) => {
                    const n = Number(v);
                    if (Number.isFinite(n) && n > 0) return n;
                    const s = String(v || "").trim();
                    if (!s) return null;
                    if (s.includes("/")) {
                        const [a, b] = s.split("/");
                        const na = Number(a);
                        const nb = Number(b);
                        if (Number.isFinite(na) && Number.isFinite(nb) && nb !== 0) return na / nb;
                    }
                    const f = Number.parseFloat(s);
                    if (Number.isFinite(f) && f > 0) return f;
                    return null;
                };
                const parseFrameCount = (v) => {
                    const n = Number(v);
                    if (!Number.isFinite(n) || n <= 0) return null;
                    return Math.floor(n);
                };

                const pickFromMeta = (assetMeta) => {
                    try {
                        const raw = assetMeta?.metadata_raw;
                        if (!raw || typeof raw !== "object") return { fps: null, frameCount: null };
                        const ff = raw?.raw_ffprobe || {};
                        const vs = ff?.video_stream || {};
                        const fpsRaw = raw?.fps ?? vs?.avg_frame_rate ?? vs?.r_frame_rate;
                        const fps = parseFps(fpsRaw);
                        const frameCount = parseFrameCount(vs?.nb_frames ?? vs?.nb_read_frames ?? raw?.frame_count ?? raw?.frames);
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
                    const fromCache = cached?.data ? pickFromMeta(cached.data) : { fps: null, frameCount: null };
                    if (initialFps == null && fromCache.fps != null) initialFps = fromCache.fps;
                    if (initialFrameCount == null && fromCache.frameCount != null) initialFrameCount = fromCache.frameCount;
                }
            } catch (e) { console.debug?.(e); }

            // Last-resort: the media element may have already detected FPS via _attachFpsDetection
            // (synchronous asset-metadata emit fires before this listener is registered).
            // Reading _mjrDetectedFps from the video element bridges that timing gap.
            try {
                if (initialFps == null) {
                    const detected = Number(mediaEl?._mjrDetectedFps);
                    if (Number.isFinite(detected) && detected > 0) initialFps = detected;
                }
            } catch (e) { console.debug?.(e); }

            const mediaKind = String(current?.kind || "").toLowerCase() === "audio" ? "audio" : "video";
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
            try {
                state.nativeFps = Number(initialFps) > 0 ? Number(initialFps) : null;
            } catch (e) { console.debug?.(e); }
            try {
                if (mediaKind === "audio") {
                    const p = mediaEl.play?.();
                    if (p && typeof p.catch === "function") p.catch(() => {});
                }
            } catch (e) { console.debug?.(e); }

            // Keep scopes responsive for video only.
            try {
                state._scopesVideoAbort?.abort?.();
            } catch (e) { console.debug?.(e); }
            if (mediaKind === "video") {
                try {
                    const ac = new AbortController();
                    state._scopesVideoAbort = ac;
                    const refresh = () => {
                        try {
                            if (String(state?.scopesMode || "off") === "off") return;
                        } catch (e) { console.debug?.(e); }
                        scheduleOverlayRedraw();
                    };
                    mediaEl.addEventListener("seeked", refresh, { signal: ac.signal, passive: true });
                    mediaEl.addEventListener("loadeddata", refresh, { signal: ac.signal, passive: true });
                    mediaEl.addEventListener("play", refresh, { signal: ac.signal, passive: true });
                    mediaEl.addEventListener("pause", refresh, { signal: ac.signal, passive: true });

                    const scopesFps = Math.max(1, Math.min(30, Math.floor(Number(APP_CONFIG.VIEWER_SCOPES_FPS) || 10)));
                    const interval = 1000 / scopesFps;
                    const tick = () => {
                        if (ac.signal.aborted) return;
                        try {
                            if (document?.hidden) return;
                        } catch (e) { console.debug?.(e); }
                        try {
                            if (overlay.style.display === "none") return;
                        } catch (e) { console.debug?.(e); }
                        try {
                            if (String(state?.scopesMode || "off") !== "off" && !mediaEl.paused) {
                                const now = performance.now();
                                const last = Number(state?._scopesLastAt) || 0;
                                if (now - last >= interval) {
                                    state._scopesLastAt = now;
                                    scheduleOverlayRedraw();
                                }
                            }
                        } catch (e) { console.debug?.(e); }
                        try {
                            requestAnimationFrame(tick);
                        } catch (e) { console.debug?.(e); }
                    };
                    try {
                        requestAnimationFrame(tick);
                    } catch (e) { console.debug?.(e); }
                } catch (e) { console.debug?.(e); }
            } else {
                state._scopesVideoAbort = null;
            }

            // If multiple videos are visible (compare modes), keep them synced to the controlled one.
            try {
                state._videoSyncAbort?.abort?.();
            } catch (e) { console.debug?.(e); }
            try {
                if (allMedia.length > 1) {
                    const followers = allMedia.filter((v) => v && v !== mediaEl);
                    state._videoSyncAbort = installFollowerVideoSync(mediaEl, followers);
                }
            } catch (e) { console.debug?.(e); }

            // Best-effort: use backend viewer-info to set FPS / frame count for the ruler.
            // Must never throw or block the UI.
            try {
                const parseFps = (v) => {
                    const n = Number(v);
                    if (Number.isFinite(n) && n > 0) return n;
                    const s = String(v || "").trim();
                    if (!s) return null;
                    // Fraction forms like "30000/1001"
                    if (s.includes("/")) {
                        const [a, b] = s.split("/");
                        const na = Number(a);
                        const nb = Number(b);
                        if (Number.isFinite(na) && Number.isFinite(nb) && nb !== 0) return na / nb;
                    }
                    const f = Number.parseFloat(s);
                    if (Number.isFinite(f) && f > 0) return f;
                    return null;
                };
                const parseFrameCount = (v) => {
                    const n = Number(v);
                    if (!Number.isFinite(n) || n <= 0) return null;
                    return Math.floor(n);
                };

                const applyFromViewerInfo = (info) => {
                    try {
                        if (!info || typeof info !== "object") return;
                        const fps = parseFps(info?.fps ?? info?.fps_raw ?? info?.frame_rate);
                        const frameCount = parseFrameCount(info?.frame_count);
                        if (fps != null || frameCount != null) mounted?.setMediaInfo?.({ fps, frameCount });
                    } catch (e) { console.debug?.(e); }
                };

                // Apply cached viewer info immediately if present.
                try {
                    const cached = viewerInfoCacheGet(current?.id);
                    if (cached) applyFromViewerInfo(cached);
                } catch (e) { console.debug?.(e); }

                // Fetch fresh in background (cancel if asset changes).
                try {
                    state._videoMetaAbort?.abort?.();
                } catch (e) { console.debug?.(e); }
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
                        } catch (e) { console.debug?.(e); }
                        applyFromViewerInfo(res.data);
                    } catch (e) { console.debug?.(e); }
                })();
            } catch (e) { console.debug?.(e); }

            // Best-effort: listen for FPS detected from video metadata/runtime in mediaFactory.
            try {
                state._videoFpsEventAbort?.abort?.();
            } catch (e) { console.debug?.(e); }
            try {
                const ac = new AbortController();
                state._videoFpsEventAbort = ac;
                window.addEventListener(
                    "mjr:viewer-fps-detected",
                    (e) => {
                        try {
                            const detail = e?.detail || {};
                            const aid = String(detail?.assetId || "");
                            const currentId = String(current?.id ?? "");
                            if (!aid || !currentId || aid !== currentId) return;
                            if (state._activeVideoEl !== mediaEl) return;
                            const fps = Number(detail?.fps);
                            if (!Number.isFinite(fps) || fps <= 0) return;
                            state.nativeFps = fps;
                            mounted?.setMediaInfo?.({ fps });
                        } catch (e) { console.debug?.(e); }
                    },
                    { signal: ac.signal, passive: true }
                );
            } catch (e) { console.debug?.(e); }
        } catch {
            destroyPlayerBar();
        }
    }

    return { destroyPlayerBar, syncPlayerBar };
}
