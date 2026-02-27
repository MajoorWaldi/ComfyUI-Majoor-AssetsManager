/**
 * Viewer Filmstrip - horizontal thumbnail strip at the bottom of the viewer.
 *
 * - Shows one thumbnail per asset in state.assets.
 * - Clicking a thumbnail navigates to that asset (onNavigate callback).
 * - Active thumbnail is highlighted and kept in view (smooth scroll).
 * - Images: native <img loading="lazy">.
 * - Videos: lazy-loaded <video> with autoplay+loop only when visible.
 * - Audio: lightweight static thumbnail (no audio decode in filmstrip).
 */

const ITEM_W = 84; // px (inner, border not included)
const ITEM_H = 56; // px
const STRIP_H = 74; // px total (item + vertical padding)
const VIDEO_PLAY_MIN_RATIO = 0.45;
const VIDEO_PREFETCH_MARGIN = "0px 240px 0px 240px";
const VIDEO_RELEASE_DELAY_MS = 3500;

const AUDIO_THUMB_URL = (() => {
    try {
        return new URL("../../assets/audio-thumbnails.png", import.meta.url).href;
    } catch {
        return "";
    }
})();

function _clearReleaseTimer(video) {
    try {
        if (video?._mjrFilmstripReleaseTimer) {
            clearTimeout(video._mjrFilmstripReleaseTimer);
            video._mjrFilmstripReleaseTimer = null;
        }
    } catch (e) { console.debug?.(e); }
}

function _ensureVideoSource(video) {
    if (!video) return;
    const src = String(video.dataset.lazySrc || "").trim();
    if (!src) return;
    try {
        const current = String(video.getAttribute("src") || "").trim();
        if (!current) {
            video.src = src;
            video.load();
        }
    } catch (e) { console.debug?.(e); }
}

function _tryPlayVideo(video) {
    if (!video) return;
    try {
        const p = video.play?.();
        if (p && typeof p.catch === "function") {
            p.catch(() => {});
        }
    } catch (e) { console.debug?.(e); }
}

function _pauseVideo(video) {
    if (!video) return;
    try {
        video.pause?.();
    } catch (e) { console.debug?.(e); }
}

function _stopVideo(video, { releaseSrc = true } = {}) {
    if (!video) return;
    _clearReleaseTimer(video);
    _pauseVideo(video);
    try {
        video._mjrFilmstripInView = false;
    } catch (e) { console.debug?.(e); }
    if (!releaseSrc) return;
    try {
        if (video.getAttribute("src")) {
            video.removeAttribute("src");
            video.load();
        }
    } catch (e) { console.debug?.(e); }
}

/**
 * @param {{
 *   state: object,
 *   buildAssetViewURL: (asset: object) => string,
 *   onNavigate: (index: number) => void,
 *   onCompare?: (index: number) => void
 * }} opts
 */
export function createFilmstrip({ state, buildAssetViewURL, onNavigate, onCompare }) {
    // -------------------------------------------------------------------------
    // Root wrapper (scrollable horizontal lane)
    // -------------------------------------------------------------------------
    const wrapper = document.createElement("div");
    wrapper.className = "mjr-filmstrip";
    wrapper.style.cssText = `
        width: 100%;
        height: ${STRIP_H}px;
        overflow-x: auto;
        overflow-y: hidden;
        background: rgba(0, 0, 0, 0.82);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        flex-shrink: 0;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.2) transparent;
        box-sizing: border-box;
        display: none;
    `;

    // Horizontal flex track (grows with item count)
    const track = document.createElement("div");
    track.className = "mjr-filmstrip-track";
    track.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 7px 12px;
        min-height: 100%;
        box-sizing: border-box;
    `;
    wrapper.appendChild(track);

    let _items = [];
    let _obs = null;
    const _videos = new Set();
    let _lastActiveIdx = -1;
    let _lastCompareIdx = -1;

    const _makeVideoObserver = () => {
        try {
            return new IntersectionObserver(
                (entries) => {
                    const stripVisible = wrapper.style.display !== "none";
                    const tabVisible = !document.hidden;
                    for (const entry of entries) {
                        const video = entry.target;
                        if (!(video instanceof HTMLVideoElement)) continue;
                        const inView = entry.isIntersecting || entry.intersectionRatio > 0;
                        try {
                            video._mjrFilmstripInView = inView;
                        } catch (e) { console.debug?.(e); }

                        if (inView) {
                            _clearReleaseTimer(video);
                            _ensureVideoSource(video);
                        }

                        const shouldPlay =
                            inView &&
                            entry.intersectionRatio >= VIDEO_PLAY_MIN_RATIO &&
                            stripVisible &&
                            tabVisible;
                        if (shouldPlay) _tryPlayVideo(video);
                        else _pauseVideo(video);

                        if (!inView) {
                            _clearReleaseTimer(video);
                            try {
                                video._mjrFilmstripReleaseTimer = setTimeout(() => {
                                    try {
                                        if (!video.isConnected) {
                                            _stopVideo(video, { releaseSrc: true });
                                            return;
                                        }
                                        if (!video._mjrFilmstripInView) {
                                            _stopVideo(video, { releaseSrc: true });
                                        }
                                    } catch (e) { console.debug?.(e); }
                                }, VIDEO_RELEASE_DELAY_MS);
                            } catch (e) { console.debug?.(e); }
                        }
                    }
                },
                {
                    root: wrapper,
                    rootMargin: VIDEO_PREFETCH_MARGIN,
                    threshold: [0, VIDEO_PLAY_MIN_RATIO],
                }
            );
        } catch {
            return null;
        }
    };

    const _observeVideo = (video) => {
        if (!video) return;
        try {
            video._mjrFilmstripInView = false;
        } catch (e) { console.debug?.(e); }
        _videos.add(video);
        try {
            if (!_obs) _obs = _makeVideoObserver();
            _obs?.observe?.(video);
        } catch (e) { console.debug?.(e); }
    };

    const _pauseAllVideos = ({ releaseSrc = false } = {}) => {
        for (const video of Array.from(_videos)) {
            _stopVideo(video, { releaseSrc });
        }
    };

    const _resumeVisibleVideos = () => {
        for (const video of Array.from(_videos)) {
            try {
                if (!video?._mjrFilmstripInView) continue;
                if (!video?.isConnected) continue;
                _ensureVideoSource(video);
                _tryPlayVideo(video);
            } catch (e) { console.debug?.(e); }
        }
    };

    const _cleanupVideoResources = ({ releaseSrc = true } = {}) => {
        try {
            _obs?.disconnect?.();
        } catch (e) { console.debug?.(e); }
        _obs = null;
        _pauseAllVideos({ releaseSrc });
        _videos.clear();
    };

    const _prefersReducedMotion = () => {
        try {
            return !!window?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
        } catch {
            return false;
        }
    };

    const _bounceItem = (item, settleScale = 1.08) => {
        if (!item || _prefersReducedMotion()) return;
        try {
            item._mjrFilmstripBounce?.cancel?.();
        } catch (e) { console.debug?.(e); }
        try {
            if (typeof item.animate !== "function") return;
            const peak = Math.min(1.18, settleScale + 0.07);
            const dip = Math.max(1.0, settleScale - 0.03);
            const anim = item.animate(
                [
                    { transform: `scale(${settleScale})` },
                    { transform: `scale(${peak})` },
                    { transform: `scale(${dip})` },
                    { transform: `scale(${settleScale})` },
                ],
                {
                    duration: 420,
                    easing: "cubic-bezier(0.22, 0.9, 0.32, 1.15)",
                }
            );
            item._mjrFilmstripBounce = anim;
            anim.onfinish = () => {
                try {
                    if (item._mjrFilmstripBounce === anim) item._mjrFilmstripBounce = null;
                } catch (e) { console.debug?.(e); }
            };
        } catch (e) { console.debug?.(e); }
    };

    // -------------------------------------------------------------------------
    // Build one thumbnail item
    // -------------------------------------------------------------------------
    const _makeItem = (asset, index) => {
        const item = document.createElement("div");
        item.className = "mjr-filmstrip-item";
        item.dataset.fidx = String(index);
        item.style.cssText = `
            position: relative;
            width: ${ITEM_W}px;
            height: ${ITEM_H}px;
            border-radius: 3px;
            overflow: hidden;
            cursor: pointer;
            flex-shrink: 0;
            border: 2px solid transparent;
            box-sizing: border-box;
            background: rgba(255,255,255,0.07);
            opacity: 0.5;
            transform: scale(1);
            transition: border-color 0.16s ease, opacity 0.16s ease, transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
        `;

        const kind = String(asset?.kind || "").toLowerCase();
        const url = buildAssetViewURL(asset);

        if (url && kind === "video") {
            // Lazy <video>: load only near viewport and play only when visible.
            const video = document.createElement("video");
            video.className = "mjr-filmstrip-thumb";
            video.muted = true;
            video.loop = true;
            video.autoplay = true;
            video.controls = false;
            video.playsInline = true;
            video.preload = "none";
            video.dataset.lazySrc = url;
            video.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
                pointer-events: none;
            `;
            try {
                video.disablePictureInPicture = true;
            } catch (e) { console.debug?.(e); }
            video.addEventListener(
                "loadeddata",
                () => {
                    try {
                        if (video._mjrFilmstripInView && wrapper.style.display !== "none" && !document.hidden) {
                            _tryPlayVideo(video);
                        }
                    } catch (e) { console.debug?.(e); }
                },
                { passive: true }
            );
            video.addEventListener(
                "error",
                () => {
                    try {
                        video.style.display = "none";
                    } catch (e) { console.debug?.(e); }
                    _stopVideo(video, { releaseSrc: true });
                    _showVideoIcon(item);
                },
                { once: true }
            );
            item.appendChild(video);
            _appendVideoBadge(item);
            _observeVideo(video);
            return item;
        }

        if (kind === "audio") {
            const thumbUrl = String(asset?.thumbnail_url || asset?.thumb_url || AUDIO_THUMB_URL || "").trim();
            if (thumbUrl) {
                const img = document.createElement("img");
                img.className = "mjr-filmstrip-thumb";
                img.loading = "lazy";
                img.decoding = "async";
                img.src = thumbUrl;
                img.alt = String(asset?.filename || "Audio");
                img.draggable = false;
                img.style.cssText = `
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                    pointer-events: none;
                `;
                img.addEventListener(
                    "error",
                    () => {
                        try {
                            img.style.display = "none";
                        } catch (e) { console.debug?.(e); }
                        _showAudioIcon(item);
                    },
                    { once: true }
                );
                item.appendChild(img);
            } else {
                _showAudioIcon(item);
            }
            _appendAudioBadge(item);
            return item;
        }

        if (url) {
            // Image (including GIF / WebP)
            const img = document.createElement("img");
            img.className = "mjr-filmstrip-thumb";
            img.loading = "lazy";
            img.decoding = "async";
            img.src = url;
            img.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
                pointer-events: none;
            `;
            img.addEventListener(
                "error",
                () => {
                    try {
                        img.style.display = "none";
                    } catch (e) { console.debug?.(e); }
                },
                { once: true }
            );
            item.appendChild(img);
            return item;
        }

        // Unknown / no URL
        _showUnknownIcon(item);
        return item;
    };

    function _showVideoIcon(container) {
        const icon = document.createElement("div");
        icon.style.cssText = `
            position: absolute; inset: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: 10px; font-weight: 700;
            color: rgba(255,255,255,0.55);
            pointer-events: none;
            letter-spacing: 0.04em;
        `;
        icon.textContent = "VIDEO";
        try {
            container.appendChild(icon);
        } catch (e) { console.debug?.(e); }
    }

    function _showAudioIcon(container) {
        const icon = document.createElement("div");
        icon.style.cssText = `
            position: absolute; inset: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: 10px; font-weight: 700;
            color: rgba(255,255,255,0.45);
            pointer-events: none;
            letter-spacing: 0.04em;
        `;
        icon.textContent = "AUDIO";
        try {
            container.appendChild(icon);
        } catch (e) { console.debug?.(e); }
    }

    function _showUnknownIcon(container) {
        const icon = document.createElement("div");
        icon.style.cssText = `
            position: absolute; inset: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: 18px; color: rgba(255,255,255,0.25);
            pointer-events: none;
        `;
        icon.textContent = "?";
        try {
            container.appendChild(icon);
        } catch (e) { console.debug?.(e); }
    }

    function _appendVideoBadge(container) {
        const badge = document.createElement("div");
        badge.style.cssText = `
            position: absolute; bottom: 2px; right: 2px;
            font-size: 7px; line-height: 1;
            background: rgba(0,0,0,0.55); color: rgba(255,255,255,0.85);
            padding: 2px 3px; border-radius: 2px;
            pointer-events: none;
            letter-spacing: 0.02em;
        `;
        badge.textContent = "VID";
        container.appendChild(badge);
    }

    function _appendAudioBadge(container) {
        const badge = document.createElement("div");
        badge.style.cssText = `
            position: absolute; bottom: 2px; right: 2px;
            font-size: 7px; line-height: 1;
            background: rgba(0,0,0,0.55); color: rgba(255,255,255,0.85);
            padding: 2px 3px; border-radius: 2px;
            pointer-events: none;
            letter-spacing: 0.02em;
        `;
        badge.textContent = "AUD";
        container.appendChild(badge);
    }

    // -------------------------------------------------------------------------
    // rebuild() - call when state.assets changes (viewer open)
    // -------------------------------------------------------------------------
    const rebuild = () => {
        _cleanupVideoResources({ releaseSrc: true });
        track.innerHTML = "";
        _items = [];

        const assets = Array.isArray(state.assets) ? state.assets : [];
        if (assets.length < 2) {
            wrapper.style.display = "none";
            return;
        }

        wrapper.style.display = "";
        for (let i = 0; i < assets.length; i++) {
            const item = _makeItem(assets[i], i);
            track.appendChild(item);
            _items.push(item);
        }

        // Immediate sync (no animation) for first display.
        _applyActive(false);
    };

    // -------------------------------------------------------------------------
    // sync() - call on every updateUI() (index changed)
    // -------------------------------------------------------------------------
    const sync = (opts = {}) => {
        const isSingle = opts.isSingle !== false;
        // Keep filmstrip visible in filmstrip-compare AB mode so user can re-pick B.
        const isFilmCompare = onCompare != null && state.compareAsset != null;

        // Hide filmstrip in compare modes (no linear navigation).
        const assets = Array.isArray(state.assets) ? state.assets : [];
        if ((!isSingle && !isFilmCompare) || assets.length < 2) {
            wrapper.style.display = "none";
            _pauseAllVideos({ releaseSrc: false });
            return;
        }
        wrapper.style.display = "";
        _resumeVisibleVideos();
        _applyActive(true);
    };

    function _applyActive(animate) {
        const idx = Number(state.currentIndex) || 0;
        // Find B-side (compare) index for filmstrip-compare mode.
        let cmpIdx = -1;
        if (onCompare && state.compareAsset != null) {
            const assets = Array.isArray(state.assets) ? state.assets : [];
            cmpIdx = assets.indexOf(state.compareAsset);
        }
        for (let i = 0; i < _items.length; i++) {
            const isActive = i === idx;
            const isCompare = i === cmpIdx;
            if (isActive) {
                _items[i].style.borderColor = "rgba(255, 255, 255, 0.98)";
                _items[i].style.opacity = "1";
                _items[i].style.transform = "scale(1.08)";
                _items[i].style.filter = "saturate(1.12) brightness(1.08)";
                _items[i].style.boxShadow =
                    "0 0 0 1px rgba(255,255,255,0.45), 0 0 18px rgba(160,220,255,0.38), 0 8px 16px rgba(0,0,0,0.38)";
            } else if (isCompare) {
                _items[i].style.borderColor = "rgba(120, 186, 255, 0.98)";
                _items[i].style.opacity = "0.96";
                _items[i].style.transform = "scale(1.04)";
                _items[i].style.filter = "saturate(1.07) brightness(1.03)";
                _items[i].style.boxShadow =
                    "0 0 0 1px rgba(120,186,255,0.38), 0 0 14px rgba(120,186,255,0.32), 0 6px 14px rgba(0,0,0,0.32)";
            } else {
                _items[i].style.borderColor = "transparent";
                _items[i].style.opacity = "0.5";
                _items[i].style.transform = "scale(1)";
                _items[i].style.filter = "none";
                _items[i].style.boxShadow = "none";
            }
        }
        if (idx !== _lastActiveIdx && _items[idx]) _bounceItem(_items[idx], 1.08);
        if (cmpIdx >= 0 && cmpIdx !== _lastCompareIdx && _items[cmpIdx]) _bounceItem(_items[cmpIdx], 1.04);
        _lastActiveIdx = idx;
        _lastCompareIdx = cmpIdx;
        // Scroll active item into view.
        const activeEl = _items[idx];
        if (!activeEl) return;
        try {
            activeEl.scrollIntoView({
                behavior: animate ? "smooth" : "instant",
                block: "nearest",
                inline: "center",
            });
        } catch {
            try {
                const left = activeEl.offsetLeft - wrapper.clientWidth / 2 + activeEl.offsetWidth / 2;
                wrapper.scrollTo({ left: Math.max(0, left), behavior: animate ? "smooth" : "instant" });
            } catch (e) { console.debug?.(e); }
        }
    }

    // -------------------------------------------------------------------------
    // Click - delegated on wrapper (capture to beat overlay dismiss handler).
    // Ctrl/Cmd+Click triggers compare mode (onCompare); plain click navigates.
    // -------------------------------------------------------------------------
    wrapper.addEventListener(
        "click",
        (e) => {
            try {
                e.stopPropagation();
                const item = e.target.closest("[data-fidx]");
                if (!item) return;
                const idx = Number(item.dataset.fidx);
                if (!Number.isFinite(idx) || idx < 0) return;
                const assets = Array.isArray(state.assets) ? state.assets : [];
                if (idx >= assets.length) return;
                if (onCompare && (e.ctrlKey || e.metaKey)) {
                    onCompare(idx);
                } else {
                    onNavigate(idx);
                }
            } catch (e) { console.debug?.(e); }
        },
        true
    );

    // Prevent wheel from bubbling to viewer pan/zoom handler.
    wrapper.addEventListener(
        "wheel",
        (e) => {
            try {
                e.stopPropagation();
            } catch (e) { console.debug?.(e); }
        },
        { passive: true, capture: true }
    );

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------
    return { el: wrapper, rebuild, sync };
}
