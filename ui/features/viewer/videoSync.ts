import { APP_CONFIG } from "../../app/config.js";

const _debug = () => {
    try {
        return Boolean(APP_CONFIG?.DEBUG_VIEWER);
    } catch {
        return false;
    }
};

/**
 * Sync a set of follower videos to a leader (one-way). Useful for compare modes where
 * the viewer bar controls a single "active" video.
 *
 * Must never throw. Returns an AbortController to remove listeners.
 */
export function installFollowerVideoSync(
    leader: any,
    followers: any[],
    { threshold = 0.15, correctionCooldownMs = 250 }: { threshold?: number; correctionCooldownMs?: number } = {},
): AbortController | void {
    const ac = new AbortController();
    try {
        if (!leader) return ac;
        const list = Array.isArray(followers) ? followers.filter((v: any) => v && v !== leader) : [];
        if (!list.length) return ac;
        const videos = [leader, ...list].filter(Boolean);

        let syncing = false;
        const expectedPlaybackEvents = new WeakSet();
        const playbackSync: Record<string, any> = {
            source: null,
            rafId: null,
            rvfcId: null,
        };
        let lastPlaybackCorrectionAt = 0;

        const cancelPlaybackSync = () => {
            try {
                const source = playbackSync.source;
                if (
                    playbackSync.rvfcId != null &&
                    typeof source?.cancelVideoFrameCallback === "function"
                ) {
                    source.cancelVideoFrameCallback(playbackSync.rvfcId);
                }
            } catch (e: any) {
                console.debug?.(e);
            }
            playbackSync.rvfcId = null;
            try {
                if (playbackSync.rafId != null && typeof cancelAnimationFrame === "function") {
                    cancelAnimationFrame(playbackSync.rafId);
                }
            } catch (e: any) {
                console.debug?.(e);
            }
            playbackSync.rafId = null;
            playbackSync.source = null;
        };

        const tryPlay = (v: any) => {
            try {
                if (v && v.paused === false) return;
                try {
                    expectedPlaybackEvents.add(v);
                } catch (e: any) {
                    console.debug?.(e);
                }
                const p = v.play?.();
                if (p && typeof p.catch === "function") p.catch(() => {});
            } catch (e: any) {
                console.debug?.(e);
            }
        };

        const nowMs = () => {
            try {
                return typeof performance !== "undefined" && typeof performance.now === "function"
                    ? performance.now()
                    : Date.now();
            } catch {
                return Date.now();
            }
        };

        const syncTimeFrom = (source: any, { force = false } = {}) => {
            if (syncing) return;
            try {
                const t = Number(source?.currentTime) || 0;
                const sourcePlaying = source?.paused === false;
                const now = nowMs();
                const cooldown = Math.max(0, Number(correctionCooldownMs) || 0);
                const allowPlaybackSeek =
                    force || !sourcePlaying || !lastPlaybackCorrectionAt || now - lastPlaybackCorrectionAt >= cooldown;
                let corrected = false;
                for (const f of videos) {
                    if (!f || f === source) continue;
                    try {
                        if (Math.abs((Number(f.currentTime) || 0) - t) > threshold && allowPlaybackSeek) {
                            syncing = true;
                            f.currentTime = t;
                            syncing = false;
                            corrected = true;
                        }
                    } catch {
                        syncing = false;
                    }
                }
                if (sourcePlaying && corrected) lastPlaybackCorrectionAt = now;
            } catch {
                syncing = false;
            }
        };

        const tickPlaybackSync = () => {
            const source = playbackSync.source || leader;
            playbackSync.rafId = null;
            playbackSync.rvfcId = null;
            if (!source || ac.signal.aborted || source.paused) return;
            syncTimeFrom(source);
            try {
                if (typeof source?.requestVideoFrameCallback === "function") {
                    playbackSync.rvfcId = source.requestVideoFrameCallback(tickPlaybackSync);
                    return;
                }
            } catch (e: any) {
                console.debug?.(e);
            }
            try {
                if (typeof requestAnimationFrame === "function") {
                    playbackSync.rafId = requestAnimationFrame(tickPlaybackSync);
                }
            } catch (e: any) {
                console.debug?.(e);
            }
        };

        const startPlaybackSync = (source = leader) => {
            cancelPlaybackSync();
            playbackSync.source = source || leader;
            if (!playbackSync.source || playbackSync.source.paused || ac.signal.aborted) return;
            tickPlaybackSync();
        };

        try {
            ac.signal.addEventListener("abort", cancelPlaybackSync, { once: true });
        } catch (e: any) {
            console.debug?.(e);
        }

        const syncTimeToLeader = (options = {}) => syncTimeFrom(leader, options);

        const syncPlayState = (playing: any, source = leader) => {
            if (syncing) return;
            for (const f of videos) {
                if (!f || f === source) continue;
                try {
                    if (playing) tryPlay(f);
                    else {
                        try {
                            expectedPlaybackEvents.add(f);
                        } catch (e: any) {
                            console.debug?.(e);
                        }
                        f.pause?.();
                    }
                } catch (e: any) {
                    console.debug?.(e);
                }
            }
        };

        const syncVolume = (source = leader) => {
            if (syncing) return;
            for (const f of videos) {
                if (!f || f === source) continue;
                try {
                    f.muted = Boolean(source.muted);
                    f.volume = Number(source.volume) || 0;
                } catch (e: any) {
                    console.debug?.(e);
                }
            }
        };

        const syncRate = (source = leader) => {
            if (syncing) return;
            for (const f of videos) {
                if (!f || f === source) continue;
                try {
                    f.playbackRate = Number(source.playbackRate) || 1;
                } catch (e: any) {
                    console.debug?.(e);
                }
            }
        };

        // Keep followers quiet and prevent native loop fighting the viewer bar loop logic.
        try {
            for (const f of list) {
                try {
                    f.muted = true;
                } catch (e: any) {
                    console.debug?.(e);
                }
                try {
                    f.loop = false;
                } catch (e: any) {
                    console.debug?.(e);
                }
            }
        } catch (e: any) {
            console.debug?.(e);
        }

        // Initial sync (best-effort).
        try {
            syncVolume();
            syncRate();
            syncTimeToLeader();
            if (!leader.paused) {
                syncPlayState(true);
                startPlaybackSync(leader);
            }
        } catch (e: any) {
            console.debug?.(e);
        }

        leader.addEventListener("play", () => syncPlayState(true), {
            signal: ac.signal,
            passive: true,
        });
        leader.addEventListener("play", () => startPlaybackSync(leader), {
            signal: ac.signal,
            passive: true,
        });
        leader.addEventListener("pause", () => {
            cancelPlaybackSync();
            syncPlayState(false);
        }, {
            signal: ac.signal,
            passive: true,
        });
        leader.addEventListener("timeupdate", () => syncTimeToLeader(), {
            signal: ac.signal,
            passive: true,
        });
        leader.addEventListener("seeking", () => syncTimeToLeader({ force: true }), { signal: ac.signal, passive: true });
        leader.addEventListener("seeked", () => syncTimeToLeader({ force: true }), { signal: ac.signal, passive: true });
        leader.addEventListener("ended", () => syncTimeToLeader({ force: true }), { signal: ac.signal, passive: true });
        leader.addEventListener("volumechange", syncVolume, { signal: ac.signal, passive: true });
        leader.addEventListener("ratechange", syncRate, { signal: ac.signal, passive: true });

        for (const media of list) {
            try {
                media.addEventListener("play", () => {
                    if (expectedPlaybackEvents.has(media)) {
                        expectedPlaybackEvents.delete(media);
                        startPlaybackSync(leader);
                        return;
                    }
                    syncTimeFrom(media, { force: true });
                    syncRate(media);
                    syncPlayState(true, media);
                    startPlaybackSync(media);
                }, {
                    signal: ac.signal,
                    passive: true,
                });
                media.addEventListener(
                    "pause",
                    () => {
                        if (expectedPlaybackEvents.has(media)) {
                            expectedPlaybackEvents.delete(media);
                            return;
                        }
                        if (media?.ended) return;
                        cancelPlaybackSync();
                        syncPlayState(false, media);
                    },
                    {
                        signal: ac.signal,
                        passive: true,
                    },
                );
                media.addEventListener("seeking", () => syncTimeFrom(media, { force: true }), {
                    signal: ac.signal,
                    passive: true,
                });
                media.addEventListener("seeked", () => syncTimeFrom(media, { force: true }), {
                    signal: ac.signal,
                    passive: true,
                });
                media.addEventListener("ratechange", () => syncRate(media), {
                    signal: ac.signal,
                    passive: true,
                });
            } catch (e: any) {
                console.debug?.(e);
            }
        }

        // Followers can reach "ended" and pause (we disable native looping on followers).
        // Ensure they keep looping in sync with the controlled leader.
        try {
            for (const f of list) {
                try {
                    f.addEventListener(
                        "ended",
                        () => {
                            if (syncing) return;
                            try {
                                syncing = true;
                                f.currentTime = Number(leader.currentTime) || 0;
                            } catch (e: any) {
                                console.debug?.(e);
                            } finally {
                                syncing = false;
                            }
                            try {
                                if (!leader.paused) tryPlay(f);
                            } catch (e: any) {
                                console.debug?.(e);
                            }
                        },
                        { signal: ac.signal, passive: true },
                    );
                } catch (e: any) {
                    console.debug?.(e);
                }
            }
        } catch (e: any) {
            console.debug?.(e);
        }

        // Followers might load later; resync once metadata is ready.
        try {
            for (const f of list) {
                try {
                    f.addEventListener("loadedmetadata", () => syncTimeToLeader({ force: true }), {
                        signal: ac.signal,
                        passive: true,
                        once: true,
                    });
                } catch (e: any) {
                    console.debug?.(e);
                }
            }
        } catch (e: any) {
            console.debug?.(e);
        }
    } catch (e: any) {
        if (_debug()) {
            try {
                console.warn("[Viewer] follower video sync setup failed", e);
            } catch (e: any) {
                console.debug?.(e);
            }
        }
    }
    return ac;
}
