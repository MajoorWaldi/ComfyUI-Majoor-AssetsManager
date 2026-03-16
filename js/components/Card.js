/**
 * Asset Card Component
 * @ts-check
 */

import { buildAssetViewURL, buildViewURL } from "../api/endpoints.js";
import { createFileBadge, createRatingBadge, createTagsBadge, createWorkflowDot } from "./Badges.js";
import { formatDuration, formatDate, formatTime } from "../utils/format.js";
import { APP_CONFIG } from "../app/config.js";
import { createMediaErrorPlaceholder } from "../utils/dom.js";

const AUDIO_THUMB_URL = (() => {
    try {
        return new URL("../assets/audio-thumbnails.png", import.meta.url).href;
    } catch {
        return "";
    }
})();

/**
 * @typedef {Object} Asset
 * @property {number|string} id
 * @property {string} filename
 * @property {string} filepath
 * @property {string} [ext]
 * @property {string} [kind]
 * @property {number} [rating] - 0 to 5
 * @property {Array<string>|string|null} [tags] - Array of strings or JSON string
 * @property {boolean|null} [has_workflow]
 * @property {boolean|null} [has_generation_data]
 * @property {boolean} [has_unknown_nodes]
 * @property {number} [width]
 * @property {number} [height]
 * @property {number} [duration]
 * @property {number} [size]
 * @property {number} [mtime]
 * @property {boolean} [_mjrNameCollision] - Internal flag for visual collision warning
 */

const VIDEO_THUMBS_KEY = "__MJR_VIDEO_THUMBS__";
const VIDEO_THUMB_MAX_PREPARED = 48;
const VIDEO_THUMB_LOAD_TIMEOUT_MS = 5000;
const VIDEO_THUMB_FIRST_FRAME_SEEK_S = 1.0;

/** @returns {"off"|"hover"|"always"} */
const getVideoAutoplayMode = () => {
    try {
        const mode = APP_CONFIG.GRID_VIDEO_AUTOPLAY_MODE;
        if (mode === "hover" || mode === "always") return mode;
    } catch (e) { console.debug?.(e); }
    return "off";
};

const isVideoAutoplayAlways = () => getVideoAutoplayMode() === "always";

export function cleanupVideoThumbsIn(rootEl) {
    try {
        const mgr = getVideoThumbManager();
        const vids = rootEl?.querySelectorAll?.("video.mjr-thumb-media") || [];
        for (const v of vids) {
            try {
                mgr?.unobserve?.(v);
            } catch (e) { console.debug?.(e); }
        }
    } catch (e) { console.debug?.(e); }
}

export function cleanupCardMediaHandlers(rootEl) {
    try {
        if (!rootEl) return;
        const imgs = rootEl?.querySelectorAll?.("img.mjr-thumb-media") || [];
        for (const img of imgs) {
            try {
                img.onerror = null;
                img.onload = null;
            } catch (e) { console.debug?.(e); }
        }
        const vids = rootEl?.querySelectorAll?.("video.mjr-thumb-media") || [];
        for (const video of vids) {
            try {
                video.onerror = null;
            } catch (e) { console.debug?.(e); }
        }
    } catch (e) { console.debug?.(e); }
}

const getVideoThumbManager = () => {
    try {
        if (window?.[VIDEO_THUMBS_KEY]) return window[VIDEO_THUMBS_KEY];
    } catch (e) { console.debug?.(e); }

    const playing = new Set();
    const prepared = new Set();
    const observed = new Set();
    const pausedForHide = new Set(); // videos paused on tab-hide, resumed when tab returns
    let cleanupTimer = null;
    let removeVisibilityListener = null;
    let removeSettingsListener = null;

    const pruneSets = () => {
        try {
            for (const v of Array.from(playing)) {
                try {
                    if (!v || !v.isConnected) playing.delete(v);
                } catch (e) { console.debug?.(e); }
            }
        } catch (e) { console.debug?.(e); }
        try {
            for (const v of Array.from(prepared)) {
                try {
                    if (!v || !v.isConnected) prepared.delete(v);
                } catch (e) { console.debug?.(e); }
            }
        } catch (e) { console.debug?.(e); }
        try {
            while (prepared.size > VIDEO_THUMB_MAX_PREPARED) {
                // First entry in Set = least recently used (re-insertion keeps LRU order).
                const lru = prepared.values().next().value;
                prepared.delete(lru);
                try {
                    lru?.pause?.();
                    // Clear stale flags so the evicted element doesn't auto-resume.
                    if (lru) { lru._mjrVisible = false; lru._mjrHovered = false; }
                } catch (e) { console.debug?.(e); }
                try {
                    if (lru?.getAttribute?.("src")) {
                        lru.removeAttribute("src");
                        lru.load?.();
                    }
                } catch (e) { console.debug?.(e); }
            }
        } catch (e) { console.debug?.(e); }
    };

    const waitForLoadedData = (video, timeoutMs = VIDEO_THUMB_LOAD_TIMEOUT_MS) =>
        new Promise((resolve) => {
            if (!video) return resolve(false);
            try {
                if (video.readyState >= 2) return resolve(true);
            } catch (e) { console.debug?.(e); }

            let done = false;
            const finish = (ok) => {
                if (done) return;
                done = true;
                try {
                    video.removeEventListener("loadeddata", onLoaded);
                    video.removeEventListener("loadedmetadata", onMetadata);
                    video.removeEventListener("error", onError);
                } catch (e) { console.debug?.(e); }
                resolve(ok);
            };
            const onLoaded = () => finish(true);
            const onMetadata = () => finish(true);
            const onError = () => finish(false);

            try {
                video.addEventListener("loadeddata", onLoaded, { once: true });
                video.addEventListener("loadedmetadata", onMetadata, { once: true });
                video.addEventListener("error", onError, { once: true });
            } catch {
                return resolve(false);
            }

            try {
                setTimeout(() => finish(false), timeoutMs);
            } catch (e) { console.debug?.(e); }
        });

    const ensureFirstFrame = (video) =>
        new Promise((resolve) => {
            if (!video) return resolve();
            try {
                if (video.readyState < 2) return resolve();
            } catch {
                return resolve();
            }

            let done = false;
            const finish = () => {
                if (done) return;
                done = true;
                try { video.removeEventListener("seeked", onSeeked); } catch (e) { console.debug?.(e); }
                try { video.removeEventListener("error", onSeekError); } catch (e) { console.debug?.(e); }
                try { video.pause(); } catch (e) { console.debug?.(e); }
                resolve();
            };
            const onSeeked = () => finish();
            const onSeekError = () => finish();

            // 1.5s fallback so a stalled seek never blocks the thumbnail pipeline.
            const fallbackTimer = setTimeout(finish, 1500);
            const finishWithTimer = () => { clearTimeout(fallbackTimer); finish(); };
            const onSeekedWithTimer = () => finishWithTimer();
            const onSeekErrorWithTimer = () => finishWithTimer();

            try {
                video.addEventListener("seeked", onSeekedWithTimer, { once: true });
                video.addEventListener("error", onSeekErrorWithTimer, { once: true });
            } catch {
                clearTimeout(fallbackTimer);
                return resolve();
            }

            try {
                // For clips longer than VIDEO_THUMB_FIRST_FRAME_SEEK_S, seek to that position
                // to skip black/fade-in frames.  For shorter clips, seek to 10 % of the
                // duration (min 0.05 s) so we still avoid frame-0 black frames.
                const dur = Number.isFinite(video.duration) && video.duration > 0
                    ? video.duration : null;
                const preferred = (dur !== null && dur <= VIDEO_THUMB_FIRST_FRAME_SEEK_S)
                    ? Math.max(0.05, dur * 0.1)
                    : VIDEO_THUMB_FIRST_FRAME_SEEK_S;
                video.currentTime = dur !== null
                    ? Math.min(preferred, dur - 0.01)
                    : preferred;
            } catch {
                clearTimeout(fallbackTimer);
                return resolve();
            }
        });

    const stopVideo = (video, { releaseSrc = true } = {}) => {
        if (!video) return;
        try {
            video.pause();
        } catch (e) { console.debug?.(e); }
        try {
            video.currentTime = 0;
        } catch (e) { console.debug?.(e); }
        if (releaseSrc) {
            try {
                if (video.getAttribute("src")) {
                    video.removeAttribute("src");
                    video.load();
                }
            } catch (e) { console.debug?.(e); }
        }
        prepared.delete(video);
        try {
            playing.delete(video);
        } catch (e) { console.debug?.(e); }
        try {
            const overlay = video._mjrPlayOverlay || null;
            if (overlay) overlay.style.opacity = "1";
        } catch (e) { console.debug?.(e); }
    };

    const ensurePrepared = async (video) => {
        if (!video) return false;
        const src = video.dataset.src || "";
        if (!src) return false;

        const isNew = !prepared.has(video);
        // Re-insert to refresh LRU position (most recently used = last in Set).
        prepared.delete(video);
        prepared.add(video);
        if (isNew) {
            pruneSets();
            try {
                if (!video.getAttribute("src")) {
                    video.src = src;
                    video.load();
                }
                video.preload = "metadata";
            } catch (e) { console.debug?.(e); }
        }

        const ok = await waitForLoadedData(video);
        if (ok) await ensureFirstFrame(video);
        return ok;
    };

    const playVideo = async (video) => {
        if (!video) return;
        const src = video.dataset.src || "";
        if (!src) return;

        // Refresh insertion order so playing Set acts as LRU.
        playing.delete(video);
        playing.add(video);

        await ensurePrepared(video);

        const overlay = (() => { try { return video._mjrPlayOverlay || null; } catch { return null; } })();
        try {
            const p = video.play();
            if (p && typeof p.then === "function") {
                p.catch(async () => {
                    await ensurePrepared(video);
                    // play() rejected (autoplay policy, missing codec…) — no pause event fires,
                    // so restore the overlay manually.
                    try { if (overlay) overlay.style.opacity = "1"; } catch (e) { console.debug?.(e); }
                });
            }
        } catch {
            await ensurePrepared(video);
            try { if (overlay) overlay.style.opacity = "1"; } catch (e) { console.debug?.(e); }
        }
    };

    const pauseVideo = async (video) => {
        if (!video) return;
        playing.delete(video);
        try {
            video.pause();
        } catch (e) { console.debug?.(e); }
        // Keep a decoded frame visible (prevents "grey tiles" after hover ends).
        await ensurePrepared(video);
    };

    const onVisibility = () => {
        if (document.hidden) {
            // Pause all playing videos; remember them so we can resume on return.
            for (const v of Array.from(playing)) {
                pausedForHide.add(v);
                playing.delete(v);
                try { v.pause(); } catch (e) { console.debug?.(e); }
                try {
                    const overlay = v._mjrPlayOverlay || null;
                    if (overlay) overlay.style.opacity = "1";
                } catch (e) { console.debug?.(e); }
            }
        } else {
            // Tab became visible — resume videos that were paused due to hide.
            const mode = getVideoAutoplayMode();
            for (const v of Array.from(pausedForHide)) {
                pausedForHide.delete(v);
                if (!v.isConnected || !observed.has(v) || !v._mjrVisible) continue;
                const shouldResume = mode === "always" || (mode === "hover" && !!v._mjrHovered);
                if (shouldResume) playVideo(v);
            }
            pausedForHide.clear();
        }
    };

    const applyAutoplayModeToObserved = () => {
        const mode = getVideoAutoplayMode();
        const enabled = mode !== "off";
        const always = mode === "always";
        for (const v of Array.from(observed)) {
            if (!(v instanceof HTMLVideoElement)) continue;
            const overlay = v._mjrPlayOverlay || null;
            if (!enabled) {
                try { v._mjrHovered = false; } catch (e) { console.debug?.(e); }
                try { v._mjrResumeOnVisible = false; } catch (e) { console.debug?.(e); }
                if (v._mjrVisible) pauseVideo(v);
                else stopVideo(v);
                if (overlay) overlay.style.opacity = "1";
                continue;
            }
            const shouldPlay = v._mjrVisible && !document.hidden
                && (always || v._mjrHovered);
            if (shouldPlay) {
                playVideo(v);
                if (overlay) overlay.style.opacity = "0";
            } else {
                pauseVideo(v);
                if (overlay) overlay.style.opacity = "1";
            }
        }
    };

    try {
        document.addEventListener("visibilitychange", onVisibility);
        removeVisibilityListener = () => {
            try {
                document.removeEventListener("visibilitychange", onVisibility);
            } catch (e) { console.debug?.(e); }
            removeVisibilityListener = null;
        };
        // Periodic cleanup for videos detached from DOM (memory leak prevention)
        cleanupTimer = setInterval(() => {
            // 1. Prune sets
            pruneSets();

            // 2. Extra safety: Check if playing videos are still in DOM
            // If Card was removed by virtual scroll but pause() didn't fire, we catch it here.
            const checkSet = (set, isPlaying) => {
                for (const v of Array.from(set)) {
                    if (!v || !v.isConnected) {
                        set.delete(v);
                        if (isPlaying) stopVideo(v);
                        else {
                            // Just unbind
                            try { observer?.unobserve?.(v); } catch (e) { console.debug?.(e); }
                        }
                        try { observed.delete(v); } catch (e) { console.debug?.(e); }
                    }
                }
            };
            checkSet(playing, true);
            checkSet(prepared, false);
        }, 10_000);
        const onSettingsChanged = () => applyAutoplayModeToObserved();
        window.addEventListener?.("mjr-settings-changed", onSettingsChanged);
        removeSettingsListener = () => {
            try {
                window.removeEventListener?.("mjr-settings-changed", onSettingsChanged);
            } catch (e) { console.debug?.(e); }
            removeSettingsListener = null;
        };
    } catch (e) {
        console.debug("[Majoor] Video cleanup error:", e);
    }

    const observer =
        typeof IntersectionObserver !== "undefined"
            ? new IntersectionObserver(
                  (entries) => {
                      for (const entry of entries) {
                          const video = entry.target;
                          if (!(video instanceof HTMLVideoElement)) continue;
                          const overlay = video._mjrPlayOverlay || null;
                          const mode = getVideoAutoplayMode();
                          const autoplayEnabled = mode !== "off";
                          const always = mode === "always";

                          if (!video.isConnected || document.hidden) {
                              try { video._mjrVisible = false; } catch (e) { console.debug?.(e); }
                              playing.delete(video);
                              stopVideo(video);
                              try {
                                  observer?.unobserve?.(video);
                              } catch (e) { console.debug?.(e); }
                              if (overlay) overlay.style.opacity = "1";
                              continue;
                          }

                          const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.2;
                          try { video._mjrVisible = isVisible; } catch (e) { console.debug?.(e); }

                          // "always": play when visible; "hover": play when visible + hovered
                          const shouldPlay = autoplayEnabled && isVisible
                              && (always || !!video._mjrHovered || !!video._mjrResumeOnVisible);

                          if (shouldPlay) {
                              try { video._mjrResumeOnVisible = false; } catch (e) { console.debug?.(e); }
                              playVideo(video);
                              if (overlay) overlay.style.opacity = "0";
                          } else {
                              if (autoplayEnabled) pauseVideo(video);
                              else if (isVisible) pauseVideo(video);
                              else stopVideo(video);
                              if (overlay) overlay.style.opacity = "1";
                          }
                      }
                  },
                  { threshold: [0, 0.2, 0.6] }
              )
            : null;

    const api = {
        _bindVideo(video) {
            if (!video) return;
            try {
                if (video._mjrThumbBound) return;
                video._mjrThumbBound = true;
            } catch (e) { console.debug?.(e); }

            // Authoritative overlay sync: driven by native playback events.
            // This resolves any race between async play() and subsequent stop/pause calls.
            try {
                video.addEventListener("playing", () => {
                    try {
                        const ol = video._mjrPlayOverlay;
                        if (ol) ol.style.opacity = "0";
                    } catch (e) { console.debug?.(e); }
                });
                video.addEventListener("pause", () => {
                    try {
                        const ol = video._mjrPlayOverlay;
                        if (ol) ol.style.opacity = "1";
                    } catch (e) { console.debug?.(e); }
                });
                video.addEventListener("ended", () => {
                    // loop=true means this rarely fires, but guard it anyway.
                    try {
                        const ol = video._mjrPlayOverlay;
                        if (ol) ol.style.opacity = "1";
                    } catch (e) { console.debug?.(e); }
                });
            } catch (e) { console.debug?.(e); }

            try {
                video.addEventListener("error", () => {
                    playing.delete(video);
                    stopVideo(video);
                    try {
                        const overlay = video._mjrPlayOverlay || null;
                        if (overlay) overlay.style.opacity = "1";
                    } catch (e) { console.debug?.(e); }
                });
            } catch (e) { console.debug?.(e); }
        },
        observe(video) {
            if (!observer || !video) return;
            let hadTimer = false;
            try {
                hadTimer = !!video._mjrReleaseTimer;
                if (video._mjrReleaseTimer) {
                    clearTimeout(video._mjrReleaseTimer);
                    video._mjrReleaseTimer = null;
                }
            } catch (e) { console.debug?.(e); }
            // No pending release timer → virtual grid recycled this DOM node for a new asset.
            // Clear stale state so the previous card's playback intent doesn't leak to the new asset.
            if (!hadTimer) {
                try { video._mjrResumeOnVisible = false; } catch (e) { console.debug?.(e); }
                try { video._mjrHovered = false; } catch (e) { console.debug?.(e); }
            }
            try {
                api._bindVideo(video);
                observed.add(video);
                observer.observe(video);
            } catch (e) { console.debug?.(e); }
        },
        unobserve(video) {
            if (!observer || !video) return;
            try {
                observer.unobserve(video);
            } catch (e) { console.debug?.(e); }
            observed.delete(video);
            const wasPlaying = playing.has(video) || !!video._mjrHovered;
            playing.delete(video);
            // Keep current frame during virtual-grid recycle to prevent flicker/disappearing thumbs.
            stopVideo(video, { releaseSrc: false });
            try {
                prepared.delete(video);
            } catch (e) { console.debug?.(e); }
            try { video._mjrVisible = false; } catch (e) { console.debug?.(e); }
            try { video._mjrHovered = false; } catch (e) { console.debug?.(e); }
            try { video._mjrResumeOnVisible = !!wasPlaying; } catch (e) { console.debug?.(e); }
            // Release decoded resources later if the node stays detached.
            try {
                if (video._mjrReleaseTimer) {
                    clearTimeout(video._mjrReleaseTimer);
                    video._mjrReleaseTimer = null;
                }
                video._mjrReleaseTimer = setTimeout(() => {
                    try { video._mjrReleaseTimer = null; } catch (e) { console.debug?.(e); }
                    try {
                        if (video.isConnected || observed.has(video)) return;
                    } catch (e) { console.debug?.(e); }
                    stopVideo(video, { releaseSrc: true });
                }, 15_000);
            } catch (e) { console.debug?.(e); }
            
            // Cleanup hover listeners on parent thumb
            try {
                const thumb = video.parentElement;
                if (thumb && thumb._mjrHoverCleanup) {
                     thumb._mjrHoverCleanup();
                }
            } catch (e) { console.debug?.(e); }
        },
        bindHover(thumb, video) {
            if (!thumb || !video) return;
            try {
                if (thumb._mjrHoverBound) return;
                thumb._mjrHoverBound = true;
            } catch (e) { console.debug?.(e); }

            const showOverlay = (opacity) => {
                try {
                    const overlay = video._mjrPlayOverlay || null;
                    if (overlay) overlay.style.opacity = opacity;
                } catch (e) { console.debug?.(e); }
            };

            const onEnter = () => {
                const mode = getVideoAutoplayMode();
                if (mode === "off") {
                    showOverlay("1");
                    return;
                }
                // In "always" mode the IO handles play; just track hover state.
                try { video._mjrHovered = true; } catch (e) { console.debug?.(e); }
                if (mode === "always") return;
                // "hover" mode: play on enter
                const canPlay = !!video?._mjrVisible && !document.hidden;
                if (canPlay) {
                    showOverlay("0");
                    playVideo(video);
                } else {
                    showOverlay("1");
                }
            };
            const onLeave = () => {
                try { video._mjrHovered = false; } catch (e) { console.debug?.(e); }
                // In "always" mode the IO keeps it playing; don't pause.
                if (isVideoAutoplayAlways()) return;
                showOverlay("1");
                pauseVideo(video);
            };

            try {
                thumb.addEventListener("mouseenter", onEnter);
                thumb.addEventListener("mouseleave", onLeave);
                thumb.addEventListener("focusin", onEnter);
                thumb.addEventListener("focusout", onLeave);
                
                thumb._mjrHoverCleanup = () => {
                    thumb.removeEventListener("mouseenter", onEnter);
                    thumb.removeEventListener("mouseleave", onLeave);
                    thumb.removeEventListener("focusin", onEnter);
                    thumb.removeEventListener("focusout", onLeave);
                    thumb._mjrHoverBound = false;
                    thumb._mjrHoverCleanup = null;
                };
            } catch (e) { console.debug?.(e); }
        },
        dispose() {
            try {
                if (cleanupTimer) clearInterval(cleanupTimer);
            } catch (e) { console.debug?.(e); }
            cleanupTimer = null;
            try {
                removeVisibilityListener?.();
            } catch (e) { console.debug?.(e); }
            try {
                removeSettingsListener?.();
            } catch (e) { console.debug?.(e); }
            try { pausedForHide.clear(); } catch (e) { console.debug?.(e); }
            // Disconnect the IntersectionObserver so it stops firing after dispose.
            // observed.clear() alone does not stop the observer from holding
            // references to previously-observed elements.
            try {
                if (observer) observer.disconnect();
            } catch (e) { console.debug?.(e); }
            try {
                playing.clear();
                prepared.clear();
                observed.clear();
            } catch (e) { console.debug?.(e); }
        }
    };

    try {
        window.addEventListener?.("pagehide", () => api.dispose());
        window[VIDEO_THUMBS_KEY] = api;
    } catch (e) { console.debug?.(e); }
    return api;
};

/**
 * Create asset card element
 * @param {Asset} asset
 * @returns {HTMLDivElement}
 */
export function createAssetCard(asset) {
    const card = document.createElement("div");
    card.className = "mjr-asset-card";
    card.classList.add("mjr-card");
    // Enable dragging (handled via delegated dragstart handler on the grid container).
    card.draggable = true;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Asset ${asset?.filename || ""}`);
    card.setAttribute("aria-selected", "false");
    
    if (asset?.id != null) {
        try {
            card.dataset.mjrAssetId = String(asset.id);
        } catch (e) { console.debug?.(e); }
    }

    // Helpful datasets for cross-card behaviors (selection, siblings hide, name collisions).
    let displayName = asset?.filename || "";
    try {
        const filename = String(asset?.filename || "");
        const ext = (filename.split(".").pop() || "").toUpperCase();
        const stem = filename.includes(".") ? filename.slice(0, filename.lastIndexOf(".")) : filename;
        card.dataset.mjrFilenameKey = filename.trim().toLowerCase();
        card.dataset.mjrExt = ext;
        card.dataset.mjrStem = String(stem || "").trim().toLowerCase();
        
        displayName = stem;
    } catch (e) { console.debug?.(e); }

    const viewUrl = buildAssetViewURL(asset);

    // Thumbnail
    const thumb = createThumbnail(asset, viewUrl);

    // --- Badges (Always created, visibility controlled via parent CSS) ---
    const fileBadge = createFileBadge(
        asset.filename,
        asset.kind,
        !!asset?._mjrNameCollision,
        {
            count: asset?._mjrNameCollisionCount || 0,
            paths: asset?._mjrNameCollisionPaths || [],
        }
    );
    fileBadge.classList.add("mjr-badge-ext"); // Class helper
    try {
        fileBadge.addEventListener("click", (event) => {
            if (!asset?._mjrNameCollision) return;
            event.preventDefault();
            event.stopPropagation();
            const name = String(asset?.filename || "").trim();
            const filenameKey = String(card?.dataset?.mjrFilenameKey || "").trim().toLowerCase();
            card.dispatchEvent?.(
                new CustomEvent("mjr:badge-duplicates-focus", {
                    bubbles: true,
                    detail: {
                        filename: name,
                        filenameKey,
                        count: Number(asset?._mjrNameCollisionCount || 0),
                        paths: Array.isArray(asset?._mjrNameCollisionPaths) ? asset._mjrNameCollisionPaths : [],
                    },
                })
            );
        });
    } catch (e) { console.debug?.(e); }
    thumb.appendChild(fileBadge);

    const ratingBadge = createRatingBadge(asset.rating || 0);
    if (ratingBadge) {
        ratingBadge.classList.add("mjr-badge-rating");
        thumb.appendChild(ratingBadge);
    }

    const tagsBadge = createTagsBadge(asset.tags || []);
    if (tagsBadge) {
        tagsBadge.classList.add("mjr-badge-tags");
        thumb.appendChild(tagsBadge);
    }

    // Store asset reference for sidebar
    card._mjrAsset = asset;
    
    card.appendChild(thumb);

    // --- Info Section (Standard Block) ---
    // We always create the info section structure. 
    // Visibility of children is toggled via CSS classes on the grid container (.mjr-show-filename etc).
    
    const info = document.createElement("div");
    info.classList.add("mjr-card-info");
    info.classList.add("mjr-card-meta"); // Keep old class for any legacy CSS
    // Reset to standard block flow with relative positioning for absolute child (dot)
    info.style.cssText = "position: relative; padding: 6px 8px; min-width: 0;";

    // 1. Filename Row
    const filenameDiv = document.createElement("div");
    filenameDiv.classList.add("mjr-card-filename"); // Helper for settings toggling
    filenameDiv.title = asset.filename;
    filenameDiv.textContent = displayName;
    filenameDiv.style.cssText = "overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 4px; padding-right: 12px;";
    
    info.appendChild(filenameDiv);

    // 2. Metadata Row
    const metaRow = document.createElement("div");
    metaRow.classList.add("mjr-card-meta-row");
    // Standard block with inline items
    // Padding right to prevent text overlap with the absolute dot
    metaRow.style.cssText = "font-size: 0.85em; opacity: 0.7; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 16px;";
    
    // Resolution
    if (asset.width && asset.height) {
        const resSpan = document.createElement("span");
        resSpan.classList.add("mjr-meta-res"); // Toggled via .mjr-show-dimensions
        resSpan.textContent = `${asset.width}x${asset.height}`;
        resSpan.title = `Resolution: ${asset.width} × ${asset.height} pixels`;
        metaRow.appendChild(resSpan);
    }

    // Duration
    if (asset.duration) {
        const durSpan = document.createElement("span");
        durSpan.classList.add("mjr-meta-duration"); // Toggled via .mjr-show-dimensions
        durSpan.textContent = formatDuration(asset.duration);
        durSpan.title = `Duration: ${formatDuration(asset.duration)}`;
        metaRow.appendChild(durSpan);
    }
    
    // Date/Time
    const timestamp = asset.generation_time || asset.file_creation_time || asset.mtime || asset.created_at;
    if (timestamp) {
        // Date
        const dateStr = formatDate(timestamp);
        if (dateStr) {
            const dateSpan = document.createElement("span");
            dateSpan.classList.add("mjr-meta-date"); // Toggled via .mjr-show-date
            dateSpan.textContent = dateStr;
            dateSpan.title = `Date: ${dateStr}`;
            metaRow.appendChild(dateSpan);
        }
        
        // Time
        const timeStr = formatTime(timestamp);
        if (timeStr) {
             const timeSpan = document.createElement("span");
             timeSpan.classList.add("mjr-meta-date"); // Reuse date toggle for now logic-wise
             timeSpan.classList.add("mjr-meta-time-val"); 
             timeSpan.textContent = timeStr;
             timeSpan.title = `Time: ${timeStr}`;
             metaRow.appendChild(timeSpan);
        }
    }

    // Generation Time (EXPERIMENTAL)
    // Uses 'generation_time_ms' from entry.js (workflow execution duration in milliseconds)
    // NOTE: Do NOT use 'generation_time' (EXIF date string) for this - that's a different field!
    const rawGenTime = asset.generation_time_ms ?? asset.metadata?.generation_time_ms ?? 0;
    const genTimeMs = Number.isFinite(Number(rawGenTime)) && Number(rawGenTime) > 0 ? Number(rawGenTime) : 0;
    
    // Only show if we have a valid duration in milliseconds (not a date string)
    // Sanity check: generation time should be < 24 hours (86400000 ms) to avoid confusing with timestamps
    if (genTimeMs > 0 && genTimeMs < 86400000) {
        const genTimeSpan = document.createElement("span");
        genTimeSpan.classList.add("mjr-meta-gentime");
        
        // Color based on generation time (green = fast, yellow = medium, orange = slow)
        const secs = genTimeMs / 1000;
        let color = "#4CAF50"; // Green for < 10s
        if (secs >= 60) color = "#FF9800"; // Orange for >= 60s
        else if (secs >= 30) color = "#FFC107"; // Yellow for >= 30s
        else if (secs >= 10) color = "#8BC34A"; // Light green for >= 10s
        
        genTimeSpan.style.color = color;
        genTimeSpan.style.fontWeight = "500";
        
        const secsDisplay = secs.toFixed(1);
        genTimeSpan.textContent = `${secsDisplay}s`;
        genTimeSpan.title = `Generation time: ${secsDisplay} seconds`;
        
        metaRow.appendChild(genTimeSpan);
    }

    // Workflow Dot (Absolute Positioned for stable right-alignment)
    const workflowDot = createWorkflowDot(asset);
    if (workflowDot) {
        const dotWrapper = document.createElement("div");
        dotWrapper.className = "mjr-card-dot-wrapper";
        // Absolute bottom-right corner of the info box
        // Matches padding (6px bottom, 8px right)
        dotWrapper.style.cssText = "position: absolute; right: 8px; bottom: 6px; z-index: 2;";
        
        dotWrapper.appendChild(workflowDot);
        
        // Append to info container (parent), NOT inside the scrolling metaRow
        info.appendChild(dotWrapper);
    }

    info.appendChild(metaRow);
    card.appendChild(info);

    // Store view URL (click handled by panel event delegation)
    card.dataset.mjrViewUrl = viewUrl;

    return card;
}

/**
 * Create thumbnail for asset
 */
/**
 * @param {Asset} asset 
 * @param {string} viewUrl 
 * @returns {HTMLDivElement}
 */
function createThumbnail(asset, viewUrl) {
    const thumb = document.createElement("div");
    thumb.classList.add("mjr-thumb");

    if (asset.kind === "image") {
        const img = document.createElement("img");
        img.src = viewUrl;
        img.alt = asset.filename || "Asset Image";
        img.classList.add("mjr-thumb-media");
        try {
            img.loading = "lazy";
            img.decoding = "async";
        } catch (e) { console.debug?.(e); }
        
        // Critical: Handle broken images
        img.onerror = () => {
             img.style.display = "none";
             const err = createMediaErrorPlaceholder("pi pi-image");
             thumb.appendChild(err);
        };

        thumb.appendChild(img);
    } else if (asset.kind === "video") {
        // Create video element lazily to avoid eager network/decoder cost on large grids
        const video = document.createElement("video");
        const poster =
            String(asset?.thumbnail_url || asset?.thumb_url || asset?.poster || "").trim() || null;
        video.muted = true;
        video.loop = true;
        video.autoplay = false;
        video.playsInline = true;
        video.preload = "metadata";
        video.classList.add("mjr-thumb-media");
        video.draggable = false;
        video.dataset.src = viewUrl;
        if (poster) video.poster = poster;
        video.controls = false;
        // Avoid capturing clicks (selection is handled at card level); hover is bound on the thumb wrapper.
        video.tabIndex = -1;
        video.style.pointerEvents = "none";
        try {
            video.disablePictureInPicture = true;
        } catch (e) { console.debug?.(e); }
        
        video.onerror = () => {
             video.style.display = "none";
             // Hide the play overlay so it doesn't float over the error placeholder.
             try {
                 const ol = video._mjrPlayOverlay;
                 if (ol) ol.style.display = "none";
             } catch (e) { console.debug?.(e); }
             const err = createMediaErrorPlaceholder("pi pi-video");
             thumb.appendChild(err);
        };

        // Play icon overlay
        const playIcon = document.createElement("div");
        playIcon.textContent = "▶";
        playIcon.classList.add("mjr-thumb-play");

        // Replace the placeholder glyph and autoplay when visible.
        playIcon.textContent = "";
        const playIconEl = document.createElement("i");
        playIconEl.className = "pi pi-play";
        playIcon.appendChild(playIconEl);
        try {
            video._mjrPlayOverlay = playIcon;
        } catch (e) { console.debug?.(e); }
        thumb.appendChild(video);
        thumb.appendChild(playIcon);
        // Observe after insertion for reliable IntersectionObserver behavior.
        const mgr = getVideoThumbManager();
        mgr.observe(video);
        mgr.bindHover(thumb, video);
    } else if (asset.kind === "audio") {
        // Audio thumbnail: background image + transparent waveform overlay
        if (AUDIO_THUMB_URL) {
            const img = document.createElement("img");
            img.src = AUDIO_THUMB_URL;
            img.alt = asset.filename || "Audio";
            img.classList.add("mjr-thumb-media");
            // Critical for audio DnD: avoid dragging the static thumbnail image URL.
            img.draggable = false;
            try {
                img.loading = "lazy";
                img.decoding = "async";
            } catch (e) { console.debug?.(e); }
            img.onerror = () => { img.style.display = "none"; };
            thumb.appendChild(img);
        }

        // Waveform SVG overlay
        const overlay = document.createElement("div");
        overlay.className = "mjr-audio-waveform-overlay";
        try {
            const svgNS = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(svgNS, "svg");
            svg.setAttribute("viewBox", "0 0 64 32");
            svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
            svg.setAttribute("fill", "currentColor");
            svg.setAttribute("opacity", "0.35");
            const bars = [
                [2, 10, 3, 12], [8, 4, 3, 24], [14, 8, 3, 16], [20, 2, 3, 28], [26, 6, 3, 20],
                [32, 1, 3, 30], [38, 5, 3, 22], [44, 3, 3, 26], [50, 9, 3, 14], [56, 6, 3, 20],
            ];
            for (const [x, y, w, h] of bars) {
                const rect = document.createElementNS(svgNS, "rect");
                rect.setAttribute("x", String(x));
                rect.setAttribute("y", String(y));
                rect.setAttribute("width", String(w));
                rect.setAttribute("height", String(h));
                rect.setAttribute("rx", "1.5");
                svg.appendChild(rect);
            }
            overlay.appendChild(svg);
        } catch (e) { console.debug?.(e); }
        overlay.style.cssText = `
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            color: white;
        `;
        try { overlay.querySelector("svg").style.cssText = "width: 60%; max-width: 120px; height: auto; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));"; } catch (e) { console.debug?.(e); }
        thumb.appendChild(overlay);
    } else if (asset.kind === "model3d") {
        // 3D model thumbnail: try sibling PNG (e.g. model.glb.png), fallback to cube icon
        const _buildModel3dFallbackIcon = () => {
            const icon = document.createElement("div");
            icon.className = "mjr-model3d-thumb-icon";
            icon.style.cssText = `
                position: absolute;
                inset: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 6px;
                color: var(--mjr-badge-model3d, #4CAF50);
                pointer-events: none;
            `;
            try {
                const svgNS = "http://www.w3.org/2000/svg";
                const svg = document.createElementNS(svgNS, "svg");
                svg.setAttribute("viewBox", "0 0 24 24");
                svg.setAttribute("fill", "none");
                svg.setAttribute("stroke", "currentColor");
                svg.setAttribute("stroke-width", "1.5");
                svg.setAttribute("stroke-linecap", "round");
                svg.setAttribute("stroke-linejoin", "round");
                svg.style.cssText = "width: 40%; max-width: 56px; height: auto; opacity: 0.85; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4));";
                const top = document.createElementNS(svgNS, "polygon");
                top.setAttribute("points", "12 2 22 8 12 14 2 8");
                svg.appendChild(top);
                const left = document.createElementNS(svgNS, "polyline");
                left.setAttribute("points", "2 8 2 16 12 22 12 14");
                svg.appendChild(left);
                const right = document.createElementNS(svgNS, "polyline");
                right.setAttribute("points", "22 8 22 16 12 22");
                svg.appendChild(right);
                icon.appendChild(svg);
            } catch (e) { console.debug?.(e); }
            const ext = String(asset.filename || "").split(".").pop() || "";
            if (ext) {
                const label = document.createElement("span");
                label.textContent = ext.toUpperCase();
                label.style.cssText = "font-size: 10px; font-weight: 700; letter-spacing: 0.05em; opacity: 0.75; text-transform: uppercase;";
                icon.appendChild(label);
            }
            return icon;
        };
        // Build thumbnail URL for sibling PNG: <filename>.png
        const siblingPngUrl = (() => {
            try {
                const fn = String(asset.filename || "").trim();
                if (!fn) return "";
                const pngName = fn + ".png";
                const sub = String(asset?.subfolder || "").trim();
                const type = String(asset?.type || "output").trim();
                // For custom roots use custom-view, otherwise standard /view
                if (asset?.root_id) {
                    return buildAssetViewURL({ ...asset, filename: pngName, kind: "image" });
                }
                return buildViewURL(pngName, sub || null, type);
            } catch { return ""; }
        })();
        if (siblingPngUrl) {
            const img = document.createElement("img");
            img.src = siblingPngUrl;
            img.alt = asset.filename || "3D Model";
            img.classList.add("mjr-thumb-media");
            try {
                img.loading = "lazy";
                img.decoding = "async";
            } catch (e) { console.debug?.(e); }
            img.onerror = () => {
                img.style.display = "none";
                thumb.appendChild(_buildModel3dFallbackIcon());
            };
            thumb.appendChild(img);
        } else {
            thumb.appendChild(_buildModel3dFallbackIcon());
        }
    }

    return thumb;
}
