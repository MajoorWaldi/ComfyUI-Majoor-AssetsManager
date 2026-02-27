/**
 * Viewer Filmstrip — horizontal thumbnail strip at the bottom of the viewer.
 *
 * - Shows one thumbnail per asset in state.assets.
 * - Clicking a thumbnail navigates to that asset (onNavigate callback).
 * - Active thumbnail is highlighted and kept in view (smooth scroll).
 * - Only shown when there are ≥ 2 assets and the viewer is in SINGLE mode.
 * - Images: native <img loading="lazy">. Videos: lazy <video preload="metadata">
 *   loaded via IntersectionObserver, shows first frame.
 */

const ITEM_W = 84;  // px (inner, border not included)
const ITEM_H = 56;  // px
const STRIP_H = 74; // px total (item + vertical padding)
const VIDEO_SEEK_S = 0.001; // seek target to force first-frame display

/** Build an IntersectionObserver that lazy-loads video thumbnails. */
function _makeVideoLazyObserver() {
    try {
        return new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    const video = entry.target;
                    try {
                        const src = video.dataset.lazySrc;
                        if (src && !video.src) {
                            video.src = src;
                        }
                    } catch {}
                    try {
                        _obs?.unobserve(video);
                    } catch {}
                }
            },
            { root: null, rootMargin: "0px 200px 0px 200px", threshold: 0 }
        );
    } catch {
        return null;
    }
}

let _obs = null; // shared observer across rebuild calls

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
            transition: border-color 0.12s ease, opacity 0.12s ease;
        `;

        const kind = String(asset?.kind || "").toLowerCase();
        const url = buildAssetViewURL(asset);

        if (url && kind === "video") {
            // Lazy <video> — loaded only when the item scrolls into view.
            const video = document.createElement("video");
            video.className = "mjr-filmstrip-thumb";
            video.muted = true;
            video.loop = false;
            video.autoplay = false;
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
            video.addEventListener("loadedmetadata", () => {
                try { video.currentTime = VIDEO_SEEK_S; } catch {}
            }, { once: true });
            video.addEventListener("error", () => {
                try { video.style.display = "none"; } catch {}
                _showVideoIcon(item);
            }, { once: true });
            item.appendChild(video);

            // Lazy-load via observer
            try {
                if (!_obs) _obs = _makeVideoLazyObserver();
                _obs?.observe(video);
            } catch {}

            // Small play badge
            _appendVideoBadge(item);

        } else if (url) {
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
            img.addEventListener("error", () => {
                try { img.style.display = "none"; } catch {}
            }, { once: true });
            item.appendChild(img);
        } else {
            // Unknown / no URL — show placeholder
            _showUnknownIcon(item);
        }

        return item;
    };

    function _showVideoIcon(container) {
        const icon = document.createElement("div");
        icon.style.cssText = `
            position: absolute; inset: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: 22px; color: rgba(255,255,255,0.4);
            pointer-events: none;
        `;
        icon.textContent = "▶";
        try { container.appendChild(icon); } catch {}
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
        try { container.appendChild(icon); } catch {}
    }

    function _appendVideoBadge(container) {
        const badge = document.createElement("div");
        badge.style.cssText = `
            position: absolute; bottom: 2px; right: 2px;
            font-size: 7px; line-height: 1;
            background: rgba(0,0,0,0.55); color: rgba(255,255,255,0.8);
            padding: 2px 3px; border-radius: 2px;
            pointer-events: none;
        `;
        badge.textContent = "▶";
        container.appendChild(badge);
    }

    // -------------------------------------------------------------------------
    // rebuild() — call when state.assets changes (viewer open)
    // -------------------------------------------------------------------------
    const rebuild = () => {
        // Disconnect old video observers
        try {
            if (_obs) {
                _obs.disconnect();
                _obs = null;
            }
        } catch {}

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

        // Immediate sync (no animation) for first display
        _applyActive(false);
    };

    // -------------------------------------------------------------------------
    // sync() — call on every updateUI() (index changed)
    // -------------------------------------------------------------------------
    const sync = (opts = {}) => {
        const isSingle = opts.isSingle !== false;
        // Keep filmstrip visible in filmstrip-compare AB mode so user can re-pick B
        const isFilmCompare = onCompare != null && state.compareAsset != null;

        // Hide filmstrip in compare modes (no linear navigation)
        const assets = Array.isArray(state.assets) ? state.assets : [];
        if ((!isSingle && !isFilmCompare) || assets.length < 2) {
            wrapper.style.display = "none";
            return;
        }
        wrapper.style.display = "";
        _applyActive(true);
    };

    function _applyActive(animate) {
        const idx = Number(state.currentIndex) || 0;
        // Find B-side (compare) index for filmstrip-compare mode
        let cmpIdx = -1;
        if (onCompare && state.compareAsset != null) {
            const assets = Array.isArray(state.assets) ? state.assets : [];
            cmpIdx = assets.indexOf(state.compareAsset);
        }
        for (let i = 0; i < _items.length; i++) {
            const isActive = i === idx;
            const isCompare = i === cmpIdx;
            if (isActive) {
                _items[i].style.borderColor = "rgba(255, 255, 255, 0.9)";
                _items[i].style.opacity = "1";
            } else if (isCompare) {
                _items[i].style.borderColor = "rgba(100, 160, 255, 0.9)";
                _items[i].style.opacity = "1";
            } else {
                _items[i].style.borderColor = "transparent";
                _items[i].style.opacity = "0.5";
            }
        }
        // Scroll active item into view
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
            } catch {}
        }
    }

    // -------------------------------------------------------------------------
    // Click — delegated on wrapper (capture to beat overlay dismiss handler)
    // Ctrl/Cmd+Click triggers compare mode (onCompare); plain click navigates.
    // -------------------------------------------------------------------------
    wrapper.addEventListener("click", (e) => {
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
        } catch {}
    }, true);

    // Prevent wheel from bubbling to viewer pan/zoom handler
    wrapper.addEventListener("wheel", (e) => {
        try { e.stopPropagation(); } catch {}
    }, { passive: true, capture: true });

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------
    return { el: wrapper, rebuild, sync };
}
