import { noop, safeCall, safeAddListener } from "../utils/safeCall.js";
import { clamp, clamp01 } from "../features/viewer/state.js";
import { t } from "../app/i18n.js";
import { normalizeVideoFps } from "../utils/mediaFps.js";

const MAX_MINOR_TICKS = 400;
const SEEK_RANGE_MAX = 1000;
const STEP_FLASH_MS = 220;

function setAbortableTimeout(signal, ms, fn) {
    try {
        if (signal?.aborted) return noop;
        const id = setTimeout(
            () => {
                try {
                    if (signal?.aborted) return;
                    fn?.();
                } catch (e) {
                    console.debug?.(e);
                }
            },
            Math.max(0, Math.floor(Number(ms) || 0)),
        );

        const onAbort = () => {
            try {
                clearTimeout(id);
            } catch (e) {
                console.debug?.(e);
            }
        };
        try {
            signal?.addEventListener?.("abort", onAbort, { once: true });
        } catch (e) {
            console.debug?.(e);
        }

        return () => {
            try {
                clearTimeout(id);
            } catch (e) {
                console.debug?.(e);
            }
            try {
                signal?.removeEventListener?.("abort", onAbort);
            } catch (e) {
                console.debug?.(e);
            }
        };
    } catch {
        return noop;
    }
}

function pad2(n) {
    const v = Math.floor(Number(n) || 0);
    return v < 10 ? `0${v}` : String(v);
}

function formatTime(seconds) {
    const s = Number(seconds);
    if (!Number.isFinite(s) || s < 0) return "0:00";
    const total = Math.floor(s);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const sec = total % 60;
    if (h > 0) return `${h}:${pad2(m)}:${pad2(sec)}`;
    return `${m}:${pad2(sec)}`;
}

function createBtn(className, text, title) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `mjr-video-btn ${className || ""}`.trim();
    if (title) b.title = title;
    try {
        b.setAttribute("aria-label", title || text || "Button");
    } catch (e) {
        console.debug?.(e);
    }
    b.textContent = text;
    return b;
}

function createIconBtn(className, iconClass, title, ariaLabel) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `mjr-video-btn ${className || ""}`.trim();
    if (title) b.title = title;
    try {
        b.setAttribute("aria-label", ariaLabel || title || "Button");
    } catch (e) {
        console.debug?.(e);
    }

    const icon = document.createElement("span");
    icon.className = `pi ${iconClass || ""}`.trim();
    icon.setAttribute("aria-hidden", "true");
    b.appendChild(icon);

    return { btn: b, icon };
}

function createNumberInput(className, { min, max, step, value, title, ariaLabel, widthPx } = {}) {
    const i = document.createElement("input");
    i.type = "number";
    i.className = `mjr-video-num ${className || ""}`.trim();
    if (title) i.title = title;
    if (ariaLabel) i.setAttribute("aria-label", ariaLabel);
    if (min != null) i.min = String(min);
    if (max != null) i.max = String(max);
    if (step != null) i.step = String(step);
    if (value != null) i.value = String(value);
    if (widthPx != null) i.style.width = `${widthPx}px`;
    return i;
}

function _resolveVideoControlsVariant(opts) {
    try {
        if (opts?.variant === "preview") return "preview";
        if (opts?.variant === "viewerbar") return "viewerbar";
        return "viewer";
    } catch {
        return "viewer";
    }
}

function _resolveInitialFps(opts) {
    try {
        const v = Number(opts?.initialFps);
        return Number.isFinite(v) && v > 0 ? v : null;
    } catch {
        return null;
    }
}

function _mountPreviewControls(video, hostEl) {
    const unsubs = [];
    try {
        // Preview thumbnails should loop continuously (muted).
        video.controls = false;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
    } catch (e) {
        console.debug?.(e);
    }

    const controls = document.createElement("div");
    controls.className = "mjr-video-controls mjr-video-controls--preview";
    try {
        controls.setAttribute("role", "group");
        controls.setAttribute("aria-label", t("video.previewControls", "Video preview controls"));
    } catch (e) {
        console.debug?.(e);
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mjr-video-preview-btn";
    btn.title = t("video.playPause", "Play/Pause");
    try {
        btn.setAttribute("aria-label", t("video.playPause", "Play/Pause"));
    } catch (e) {
        console.debug?.(e);
    }

    const icon = document.createElement("span");
    icon.className = "pi pi-play";
    try {
        icon.setAttribute("aria-hidden", "true");
    } catch (e) {
        console.debug?.(e);
    }
    btn.appendChild(icon);
    controls.appendChild(btn);

    const setIcon = () => {
        try {
            const paused = Boolean(video?.paused);
            icon.className = `pi ${paused ? "pi-play" : "pi-pause"}`;
        } catch (e) {
            console.debug?.(e);
        }
    };

    const tryPlay = () => {
        try {
            const p = video.play?.();
            if (p && typeof p.catch === "function") p.catch(() => {});
        } catch (e) {
            console.debug?.(e);
        }
    };

    const toggle = (e) => {
        try {
            e?.stopPropagation?.();
        } catch (e) {
            console.debug?.(e);
        }
        try {
            if (video.paused) {
                tryPlay();
            } else {
                video.pause?.();
            }
        } catch (e) {
            console.debug?.(e);
        }
        setIcon();
    };

    try {
        hostEl.appendChild(controls);
    } catch (e) {
        console.debug?.(e);
    }

    // Best-effort autoplay.
    try {
        tryPlay();
    } catch (e) {
        console.debug?.(e);
    }
    unsubs.push(safeAddListener(video, "loadedmetadata", () => tryPlay(), { passive: true }));
    unsubs.push(safeAddListener(video, "canplay", () => tryPlay(), { passive: true }));

    unsubs.push(safeAddListener(btn, "click", toggle));
    unsubs.push(safeAddListener(video, "play", setIcon, { passive: true }));
    unsubs.push(safeAddListener(video, "pause", setIcon, { passive: true }));
    unsubs.push(safeAddListener(video, "ended", () => tryPlay(), { passive: true }));
    try {
        setIcon();
    } catch (e) {
        console.debug?.(e);
    }

    return {
        controlsEl: controls,
        destroy: () => {
            try {
                for (const u of unsubs) safeCall(() => u?.());
            } catch (e) {
                console.debug?.(e);
            }
            try {
                controls.remove?.();
            } catch (e) {
                console.debug?.(e);
            }
        },
    };
}

/**
 * Mount custom video controls on top of a <video> element.
 * Must never throw (viewer stability).
 *
 * Viewer variant adds Nuke-style range + frame controls (in/out, step, loop/once).
 *
 * @param {HTMLMediaElement} video
 * @param {{variant?: 'viewer'|'preview'|'viewerbar', mediaKind?: 'video'|'audio', hostEl?: HTMLElement, fullscreenEl?: HTMLElement, initialFps?: number, initialFrameCount?: number, initialPlaybackRate?: number}} opts
 * @returns {{controlsEl: HTMLElement|null, destroy: () => void, setMediaInfo?: (info: {fps?: number, frameCount?: number}) => void, setPlaybackRate?: (rate:number)=>number, getPlaybackRate?: ()=>number, adjustPlaybackRate?: (delta:number)=>number, togglePlay?: ()=>boolean, stepFrames?: (direction:number)=>boolean}}
 */
export function mountVideoControls(video, opts = {}) {
    try {
        const variant = _resolveVideoControlsVariant(opts);
        const mediaKind = String(opts?.mediaKind || "video").toLowerCase();
        const isAudioMedia = mediaKind === "audio";
        const isViewerBar = variant === "viewerbar";
        const advanced = variant !== "preview" && !isAudioMedia;
        // Volume slider is toggled from the sound icon to keep the bar compact.
        const showVolumeSlider = true;
        const initialFps = _resolveInitialFps(opts);
        const hostEl = opts?.hostEl || video?.parentElement;
        if (!video || !hostEl) return { controlsEl: null, destroy: noop };

        // ---------------------------------------------------------------------
        // Preview variant: minimal play/pause overlay + continuous looping
        // ---------------------------------------------------------------------
        if (variant === "preview") {
            return _mountPreviewControls(video, hostEl);
        }

        // We manage looping ourselves (Loop/Once + in/out range); disable native looping to avoid conflicts.
        try {
            video.loop = false;
        } catch (e) {
            console.debug?.(e);
        }

        safeCall(() => hostEl.classList?.add("mjr-video-host"));
        safeCall(() => video.classList?.add("mjr-video-el"));

        safeCall(() => {
            const cs = window.getComputedStyle?.(hostEl);
            if (cs?.position === "static") hostEl.style.position = "relative";
        });

        const controls = document.createElement("div");
        controls.className = `mjr-video-controls mjr-video-controls--${variant}`;
        if (isViewerBar) controls.classList.add("mjr-video-controls--modern");
        controls.dataset.mjrLayout = "regular";
        controls.setAttribute("role", "group");
        controls.setAttribute(
            "aria-label",
            isAudioMedia
                ? t("video.audioControls", "Audio controls")
                : t("video.controls", "Video controls"),
        );

        const rowTop = document.createElement("div");
        rowTop.className = "mjr-video-row mjr-video-row--top";
        const rowBottom = document.createElement("div");
        rowBottom.className = "mjr-video-row mjr-video-row--bottom";
        controls.appendChild(rowTop);
        controls.appendChild(rowBottom);

        const seekWrap = document.createElement("div");
        seekWrap.className = "mjr-video-seek-wrap";

        const seek = document.createElement("input");
        seek.className = "mjr-video-range mjr-video-range--seek";
        seek.type = "range";
        seek.min = "0";
        seek.max = String(SEEK_RANGE_MAX);
        seek.step = "1";
        seek.value = "0";
        seek.setAttribute("aria-label", t("video.seek", "Seek"));
        seek.title = isAudioMedia
            ? t("video.seekThroughAudio", "Seek through audio")
            : t("video.seekThrough", "Seek through video");

        const seekOverlay = document.createElement("div");
        seekOverlay.className = "mjr-video-seek-overlay";

        // Seekbar range zones (more reliable than styling <input type="range"> across browsers).
        // Only used in advanced mode (viewer/viewerbar).
        let seekZones = null;
        let leftTrimZone = null;
        let selectedZone = null;
        let rightTrimZone = null;
        if (advanced) {
            seekZones = document.createElement("div");
            seekZones.className = "mjr-video-seek-zones";

            leftTrimZone = document.createElement("div");
            leftTrimZone.className = "mjr-video-seek-zone mjr-video-seek-zone--leftTrim";

            selectedZone = document.createElement("div");
            selectedZone.className = "mjr-video-seek-zone mjr-video-seek-zone--selected";

            rightTrimZone = document.createElement("div");
            rightTrimZone.className = "mjr-video-seek-zone mjr-video-seek-zone--rightTrim";

            seekZones.appendChild(leftTrimZone);
            seekZones.appendChild(selectedZone);
            seekZones.appendChild(rightTrimZone);
        }

        const tickBar = document.createElement("div");
        tickBar.className = "mjr-video-seek-ticks";
        const labelsBar = document.createElement("div");
        labelsBar.className = "mjr-video-seek-labels";
        const inMark = document.createElement("div");
        inMark.className = "mjr-video-seek-mark mjr-video-seek-mark--in";
        const outMark = document.createElement("div");
        outMark.className = "mjr-video-seek-mark mjr-video-seek-mark--out";
        const playhead = document.createElement("div");
        playhead.className = "mjr-video-seek-playhead";
        const playheadLabel = document.createElement("div");
        playheadLabel.className = "mjr-video-seek-playhead-label";
        seekOverlay.appendChild(tickBar);
        seekOverlay.appendChild(labelsBar);
        seekOverlay.appendChild(playhead);
        seekOverlay.appendChild(playheadLabel);

        // Draggable I/O handles (bigger hit area than the thin markers).
        const inHandle = document.createElement("div");
        inHandle.className = "mjr-video-seek-handle mjr-video-seek-handle--in";
        inHandle.title = t("video.dragSetIn", "Drag to set In");
        inHandle.setAttribute("aria-label", t("video.dragSetIn", "Drag to set In"));

        const outHandle = document.createElement("div");
        outHandle.className = "mjr-video-seek-handle mjr-video-seek-handle--out";
        outHandle.title = t("video.dragSetOut", "Drag to set Out");
        outHandle.setAttribute("aria-label", t("video.dragSetOut", "Drag to set Out"));

        seekWrap.appendChild(seek);
        if (seekZones) seekWrap.appendChild(seekZones);
        seekWrap.appendChild(seekOverlay);
        // Marks are separate from the non-interactive overlay so they can be dragged directly.
        seekWrap.appendChild(inMark);
        seekWrap.appendChild(outMark);
        seekWrap.appendChild(inHandle);
        seekWrap.appendChild(outHandle);

        const timeLabel = document.createElement("span");
        timeLabel.className = "mjr-video-time";
        timeLabel.textContent = "0:00 / 0:00";
        timeLabel.title = t("video.currentTimeTotal", "Current time / Total duration");

        const rangeCountLabel = document.createElement("span");
        rangeCountLabel.className = "mjr-video-range-count";
        rangeCountLabel.textContent = "";
        try {
            rangeCountLabel.style.display = "none";
        } catch (e) {
            console.debug?.(e);
        }

        const timeGroup = document.createElement("div");
        timeGroup.className = "mjr-video-timegroup";
        timeGroup.appendChild(timeLabel);
        if (advanced) timeGroup.appendChild(rangeCountLabel);

        const frameLabel = document.createElement("span");
        frameLabel.className = "mjr-video-frame";
        frameLabel.textContent = "F: 0";
        frameLabel.title = t("video.currentFrame", "Current frame number");

        const playBtn = createBtn(
            "mjr-video-btn--play",
            t("btn.play", "Play"),
            t("video.playPauseSpace", "Play/Pause (Space)"),
        );
        const prevFrameBtn = createBtn(
            "mjr-video-btn--step",
            "<",
            t("video.stepBack", "Step back"),
        );
        const nextFrameBtn = createBtn(
            "mjr-video-btn--step",
            ">",
            t("video.stepForward", "Step forward"),
        );
        const toInBtn = createBtn(
            "mjr-video-btn--jump mjr-video-btn--in",
            "|<",
            t("video.goToIn", "Go to In"),
        );
        const toOutBtn = createBtn(
            "mjr-video-btn--jump mjr-video-btn--out",
            ">|",
            t("video.goToOut", "Go to Out"),
        );

        const setInBtn = createBtn(
            "mjr-video-btn--mark mjr-video-btn--in",
            "I",
            t("video.setInFromCurrent", "Set In from current frame"),
        );
        const setOutBtn = createBtn(
            "mjr-video-btn--mark mjr-video-btn--out",
            "O",
            t("video.setOutFromCurrent", "Set Out from current frame"),
        );
        const loopIcon = createIconBtn(
            "mjr-video-btn--toggle",
            "pi-refresh",
            t("video.loopPlaybackInRange", "Loop playback in range"),
            t("video.loop", "Loop"),
        );
        const loopBtn = loopIcon.btn;

        const inInput = createNumberInput("mjr-video-num--in", {
            min: 0,
            step: 1,
            value: 0,
            title: t("video.inFrame", "In frame"),
            ariaLabel: t("video.inFrame", "In frame"),
            widthPx: 72,
        });
        const outInput = createNumberInput("mjr-video-num--out", {
            min: 0,
            step: 1,
            value: 0,
            title: t("video.outFrame", "Out frame"),
            ariaLabel: t("video.outFrame", "Out frame"),
            widthPx: 72,
        });
        const stepInput = createNumberInput("mjr-video-num--step", {
            min: 1,
            step: 1,
            value: 1,
            title: t("video.frameIncrement", "Frame increment"),
            ariaLabel: t("video.frameIncrement", "Frame increment"),
            widthPx: 56,
        });
        const fpsInput = createNumberInput("mjr-video-num--fps", {
            min: 1,
            step: 0.001,
            value: normalizeVideoFps(initialFps || 30),
            title: t("video.fpsStepping", "FPS (used for frame stepping)"),
            ariaLabel: t("video.fps", "FPS"),
            widthPx: 56,
        });
        const speedSelect = document.createElement("select");
        speedSelect.className = "mjr-video-num mjr-video-num--speed";
        speedSelect.title = t("video.playbackSpeed", "Playback speed");
        speedSelect.setAttribute("aria-label", t("video.playbackSpeed", "Playback speed"));
        speedSelect.style.width = "74px";
        const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
        for (const rate of SPEED_OPTIONS) {
            const opt = document.createElement("option");
            opt.value = String(rate);
            opt.textContent = `${rate}x`;
            speedSelect.appendChild(opt);
        }

        const muteIcon = createIconBtn(
            "mjr-video-btn--mute",
            "pi-volume-up",
            t("video.mute", "Mute"),
            t("video.mute", "Mute"),
        );
        const muteBtn = muteIcon.btn;
        const volumeWrap = document.createElement("div");
        volumeWrap.className = "mjr-video-volume-wrap";
        volumeWrap.style.cssText = "display:none; align-items:center; position:relative;";
        let volume = null;
        if (showVolumeSlider) {
            volume = document.createElement("input");
            volume.className = "mjr-video-range mjr-video-range--volume";
            volume.type = "range";
            volume.min = "0";
            volume.max = "1";
            volume.step = "0.02";
            volume.value = String(clamp01(Number(video.volume) || 0));
            volume.setAttribute("aria-label", t("video.volume", "Volume"));
            volume.title = t("video.volume", "Volume");
            try {
                volume.style.width = "120px";
            } catch (e) {
                console.debug?.(e);
            }
            volumeWrap.appendChild(volume);
        }

        const inGroup = document.createElement("div");
        inGroup.className = "mjr-video-group mjr-video-group--in";
        const inLabel = document.createElement("span");
        inLabel.textContent = "In";
        inLabel.title = t("video.resetInToStart", "Reset In to start");
        inLabel.style.cssText = "cursor:pointer; user-select:none;";
        if (advanced) {
            inGroup.appendChild(inLabel);
            inGroup.appendChild(inInput);
        }

        const outGroup = document.createElement("div");
        outGroup.className = "mjr-video-group mjr-video-group--out";
        const outLabel = document.createElement("span");
        outLabel.textContent = "Out";
        outLabel.title = t("video.resetOutToEnd", "Reset Out to end");
        outLabel.style.cssText = "cursor:pointer; user-select:none;";
        if (advanced) {
            outGroup.appendChild(outLabel);
            outGroup.appendChild(outInput);
        }

        const leftAdjustGroup = document.createElement("div");
        leftAdjustGroup.className = "mjr-video-group mjr-video-group--adjust-left";
        if (advanced) {
            // Requested: keep current frame next to the FPS controls in the bottom row.
            leftAdjustGroup.appendChild(setInBtn);
            leftAdjustGroup.appendChild(document.createTextNode(t("video.step", "Step")));
            leftAdjustGroup.appendChild(stepInput);
            leftAdjustGroup.appendChild(document.createTextNode(t("video.fps", "FPS")));
            leftAdjustGroup.appendChild(fpsInput);
            leftAdjustGroup.appendChild(frameLabel);
        }

        const rightAdjustGroup = document.createElement("div");
        rightAdjustGroup.className = "mjr-video-group mjr-video-group--adjust-right";
        if (advanced) {
            rightAdjustGroup.appendChild(timeGroup);
            rightAdjustGroup.appendChild(loopBtn);
        }
        const speedGroup = document.createElement("div");
        speedGroup.className = "mjr-video-group mjr-video-group--speed";
        speedGroup.appendChild(document.createTextNode(t("video.speed", "Speed")));
        speedGroup.appendChild(speedSelect);

        // Bottom row: center transport, right-side extra controls
        const bottomLeft = document.createElement("div");
        bottomLeft.className = "mjr-video-bottom mjr-video-bottom--left";
        const transport = document.createElement("div");
        transport.className = "mjr-video-transport";
        const bottomRight = document.createElement("div");
        bottomRight.className = "mjr-video-bottom mjr-video-bottom--right";

        if (!isAudioMedia) {
            transport.appendChild(toInBtn);
            transport.appendChild(prevFrameBtn);
        }
        transport.appendChild(playBtn);
        if (!isAudioMedia) {
            transport.appendChild(nextFrameBtn);
            transport.appendChild(toOutBtn);
        }

        if (advanced) bottomLeft.appendChild(leftAdjustGroup);
        if (advanced) bottomRight.appendChild(rightAdjustGroup);
        bottomRight.appendChild(speedGroup);
        bottomRight.appendChild(muteBtn);
        if (advanced) bottomRight.appendChild(setOutBtn);
        if (volume) bottomRight.appendChild(volumeWrap);

        if (isViewerBar) {
            const timelineStrip = document.createElement("div");
            timelineStrip.className = "mjr-video-bar-timeline";
            if (advanced) timelineStrip.appendChild(inGroup);
            timelineStrip.appendChild(seekWrap);
            if (advanced) timelineStrip.appendChild(outGroup);

            const actionsStrip = document.createElement("div");
            actionsStrip.className = "mjr-video-bar-actions";

            const actionsLeft = document.createElement("div");
            actionsLeft.className = "mjr-video-bar-side mjr-video-bar-side--left";
            if (advanced) actionsLeft.appendChild(leftAdjustGroup);

            const actionsCenter = document.createElement("div");
            actionsCenter.className = "mjr-video-bar-center";
            actionsCenter.appendChild(transport);

            const actionsRight = document.createElement("div");
            actionsRight.className = "mjr-video-bar-side mjr-video-bar-side--right";
            if (advanced) actionsRight.appendChild(rightAdjustGroup);
            actionsRight.appendChild(speedGroup);
            actionsRight.appendChild(muteBtn);
            if (advanced) actionsRight.appendChild(setOutBtn);
            if (volume) actionsRight.appendChild(volumeWrap);

            actionsStrip.appendChild(actionsLeft);
            actionsStrip.appendChild(actionsCenter);
            actionsStrip.appendChild(actionsRight);

            controls.replaceChildren(timelineStrip, actionsStrip);
        } else {
            if (advanced) rowTop.appendChild(frameLabel);
            if (advanced) rowTop.appendChild(inGroup);
            rowTop.appendChild(seekWrap);
            if (advanced) rowTop.appendChild(outGroup);
            rowTop.appendChild(timeGroup);

            rowBottom.appendChild(bottomLeft);
            rowBottom.appendChild(transport);
            rowBottom.appendChild(bottomRight);
        }

        // Ensure the controls overlay never triggers viewer panning/zoom handlers.
        const stop = (e) => {
            try {
                e.stopPropagation?.();
            } catch (e) {
                console.debug?.(e);
            }
        };
        const preventStop = (e) => {
            try {
                e.preventDefault?.();
            } catch (e) {
                console.debug?.(e);
            }
            stop(e);
        };

        const unsubs = [];
        const timersAC = (() => {
            try {
                return new AbortController();
            } catch {
                return {
                    signal: { aborted: false, addEventListener: noop, removeEventListener: noop },
                    abort: noop,
                };
            }
        })();
        unsubs.push(() => {
            try {
                timersAC.abort();
            } catch (e) {
                console.debug?.(e);
            }
        });

        const applyResponsiveLayout = () => {
            try {
                const width = Number(hostEl?.clientWidth) || Number(controls?.clientWidth) || 0;
                let layout = "regular";
                if (width > 0 && width < 560) layout = "stacked";
                else if (width > 0 && width < 860) layout = "compact";
                controls.dataset.mjrLayout = layout;
            } catch (e) {
                console.debug?.(e);
            }
        };

        applyResponsiveLayout();

        try {
            if (typeof ResizeObserver === "function" && hostEl) {
                // Coalesce ResizeObserver bursts (e.g. window drag) into a single
                // layout recalc per frame to avoid layout thrash.
                const raf = typeof requestAnimationFrame === "function" ? requestAnimationFrame : null;
                const caf = typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : null;
                let roFrame = 0;
                const scheduleLayout = raf
                    ? () => {
                        if (roFrame) return;
                        roFrame = raf(() => {
                            roFrame = 0;
                            applyResponsiveLayout();
                        });
                    }
                    : () => applyResponsiveLayout();
                const ro = new ResizeObserver(scheduleLayout);
                ro.observe(hostEl);
                unsubs.push(() => {
                    try {
                        if (roFrame && caf) caf(roFrame);
                        ro.disconnect();
                    } catch (e) {
                        console.debug?.(e);
                    }
                });
            }
        } catch (e) {
            console.debug?.(e);
        }
        // Must NOT run in capture phase, otherwise it blocks pointerdown on child controls
        // like the draggable In/Out handles. We stop bubbling instead, and rely on the
        // window-capture guards below to prevent viewer pan/zoom handlers.
        unsubs.push(safeAddListener(controls, "pointerdown", stop));
        unsubs.push(safeAddListener(controls, "dblclick", preventStop, { capture: true }));
        unsubs.push(
            safeAddListener(controls, "wheel", preventStop, { capture: true, passive: false }),
        );

        // We intentionally do NOT stop pointer events at the window capture phase, because that would
        // prevent child controls (like draggable In/Out handles) from receiving pointerdown.
        // Pan/zoom suppression is handled in `viewer/panzoom.js` by ignoring events originating inside
        // `.mjr-video-controls`.
        unsubs.push(
            safeAddListener(
                window,
                "dblclick",
                (e) => {
                    try {
                        if (controls.contains?.(e?.target)) preventStop(e);
                    } catch (e) {
                        console.debug?.(e);
                    }
                },
                { capture: true },
            ),
        );
        unsubs.push(
            safeAddListener(
                window,
                "wheel",
                (e) => {
                    try {
                        if (controls.contains?.(e?.target)) preventStop(e);
                    } catch (e) {
                        console.debug?.(e);
                    }
                },
                { capture: true, passive: false },
            ),
        );

        const state = {
            fps: normalizeVideoFps(initialFps || 30),
            step: 1,
            inFrame: null,
            outFrame: null,
            frameCount: null,
            loop: advanced,
            pingpong: false,
            once: false,
            playbackRate: Math.max(0.25, Math.min(2, Number(opts?.initialPlaybackRate) || 1)),
            _seeking: false,
            _ppReverse: false,
            _ppRafId: null,
            _userInteracted: false,
        };

        // Auto-unmute once the user interacts with the video controls.
        // This bypasses autoplay restrictions: most browsers allow unmuted playback after a user gesture.
        const tryAutoUnmute = () => {
            if (state._userInteracted) return;
            state._userInteracted = true;
            try {
                // Only unmute if the video is currently muted due to autoplay restrictions
                // (not if user explicitly muted via the mute button).
                if (video.muted) {
                    video.muted = false;
                    updateVolumeUI?.();
                }
            } catch (e) {
                console.debug?.(e);
            }
        };

        let _stepFlashCancel = null;
        const flashFrameStep = () => {
            if (!advanced) return;
            try {
                frameLabel.classList.add("is-step");
                try {
                    _stepFlashCancel?.();
                } catch (e) {
                    console.debug?.(e);
                }
                _stepFlashCancel = setAbortableTimeout(timersAC.signal, STEP_FLASH_MS, () => {
                    try {
                        frameLabel.classList.remove("is-step");
                    } catch (e) {
                        console.debug?.(e);
                    }
                });
            } catch (e) {
                console.debug?.(e);
            }
        };
        unsubs.push(() => {
            try {
                _stepFlashCancel?.();
            } catch (e) {
                console.debug?.(e);
            }
            _stepFlashCancel = null;
            try {
                frameLabel?.classList?.remove?.("is-step");
            } catch (e) {
                console.debug?.(e);
            }
        });

        const setToggleBtn = (btn, on) => {
            try {
                if (!btn) return;
                if (on) btn.classList.add("is-on");
                else btn.classList.remove("is-on");
            } catch (e) {
                console.debug?.(e);
            }
        };

        const setPlaybackRate = (nextRate) => {
            try {
                const n = Number(nextRate);
                if (!Number.isFinite(n) || n <= 0) return state.playbackRate;
                const rate = Math.max(0.25, Math.min(2, Math.round(n * 100) / 100));
                state.playbackRate = rate;
                try {
                    video.playbackRate = rate;
                } catch (e) {
                    console.debug?.(e);
                }
                try {
                    if (!speedSelect.matches?.(":focus")) speedSelect.value = String(rate);
                } catch (e) {
                    console.debug?.(e);
                }
                return rate;
            } catch {
                return state.playbackRate;
            }
        };

        const applyLoopOnceUI = () => {
            try {
                setToggleBtn(loopBtn, Boolean(state.loop || state.pingpong));
                try {
                    if (loopIcon?.icon) {
                        if (state.pingpong) {
                            loopIcon.icon.className = "pi pi-sort-alt";
                            loopBtn.title = t(
                                "video.pingpongPlayback",
                                "Ping-pong playback (forward then reverse)",
                            );
                        } else {
                            loopIcon.icon.className = "pi pi-refresh";
                            loopBtn.title = t(
                                "video.loopPlaybackInRange",
                                "Loop playback in range",
                            );
                        }
                    }
                } catch (e) {
                    console.debug?.(e);
                }
            } catch (e) {
                console.debug?.(e);
            }
        };

        const durationFrames = () => {
            try {
                const override = Number(state.frameCount);
                if (Number.isFinite(override) && override > 0)
                    return Math.max(1, Math.floor(override));
                const d = Number(video?.duration);
                const fps = normalizeVideoFps(state.fps, 30);
                if (!Number.isFinite(d) || d <= 0) return 0;
                return Math.max(0, Math.floor(d * fps));
            } catch {
                return 0;
            }
        };

        const currentFrame = (timeOverride = null) => {
            try {
                const sourceTime = timeOverride == null ? video?.currentTime : timeOverride;
                const t = Number(sourceTime);
                const fps = normalizeVideoFps(state.fps, 30);
                if (!Number.isFinite(t) || t < 0) return 0;
                // Use floor rather than round so the frame counter matches the
                // currently displayed frame instead of jumping ahead mid-frame.
                return Math.max(0, Math.floor((t * fps) + 1e-6));
            } catch {
                return 0;
            }
        };

        const frameToTime = (frame) => {
            const fps = normalizeVideoFps(state.fps, 30);
            const f = Math.max(0, Number(frame) || 0);
            return f / fps;
        };

        const normalizeRange = () => {
            try {
                const maxF = durationFrames();
                if (maxF <= 0) return;
                const inF = state.inFrame == null ? 0 : clamp(state.inFrame, 0, maxF);
                const outF = state.outFrame == null ? maxF : clamp(state.outFrame, 0, maxF);
                if (outF < inF) {
                    state.inFrame = outF;
                    state.outFrame = inF;
                } else {
                    state.inFrame = inF;
                    state.outFrame = outF;
                }
            } catch (e) {
                console.debug?.(e);
            }
        };

        const getEffectiveInOut = () => {
            try {
                const maxF = durationFrames();
                const inF = state.inFrame == null ? 0 : clamp(state.inFrame, 0, maxF);
                const outF = state.outFrame == null ? maxF : clamp(state.outFrame, 0, maxF);
                return { inF, outF, maxF };
            } catch {
                return { inF: 0, outF: 0, maxF: 0 };
            }
        };

        const setPlayLabel = () => {
            try {
                const isPlaying = !video?.paused || state._ppReverse;
                playBtn.textContent = isPlaying
                    ? t("video.pause", "Pause")
                    : t("video.play", "Play");
            } catch (e) {
                console.debug?.(e);
            }
        };

        const setMuteLabel = () => {
            try {
                const muted = Boolean(video?.muted) || (Number(video?.volume) || 0) <= 0.001;
                try {
                    muteIcon.icon.className = `pi ${muted ? "pi-volume-off" : "pi-volume-up"}`;
                } catch (e) {
                    console.debug?.(e);
                }
                const muteLabel = muted ? t("video.unmute", "Unmute") : t("video.mute", "Mute");
                muteBtn.title = muteLabel;
                muteBtn.setAttribute("aria-label", muteLabel);
            } catch (e) {
                console.debug?.(e);
            }
        };

        const updateTimeUI = (timeOverride = null) => {
            try {
                const d = Number(video?.duration);
                const sourceTime = timeOverride == null ? video?.currentTime : timeOverride;
                const t = Number(sourceTime);
                const durationOk = Number.isFinite(d) && d > 0;

                timeLabel.textContent = `${formatTime(t)} / ${durationOk ? formatTime(d) : "0:00"}`;
                seek.disabled = !durationOk;

                if (durationOk) {
                    const p = clamp01((t || 0) / d);
                    const v = Math.round(p * 1000);
                    if (!Number.isNaN(v) && !seek.matches?.(":active")) seek.value = String(v);
                    try {
                        playhead.style.left = `${p * 100}%`;
                    } catch (e) {
                        console.debug?.(e);
                    }
                } else {
                    seek.value = "0";
                    try {
                        playhead.style.left = "0%";
                    } catch (e) {
                        console.debug?.(e);
                    }
                }

                if (advanced) {
                    const maxF = durationFrames();
                    const cf = currentFrame(t);
                    frameLabel.textContent = `F: ${cf} / ${maxF}`;
                    try {
                        // Show current frame value on the ruler, anchored to the playhead.
                        const durOk = Number.isFinite(d) && d > 0;
                        if (durOk) {
                            const p = clamp01((t || 0) / d);
                            playheadLabel.style.left = `${p * 100}%`;
                            playheadLabel.textContent = String(cf);
                            playheadLabel.style.display = "";
                        } else {
                            playheadLabel.style.display = "none";
                        }
                    } catch (e) {
                        console.debug?.(e);
                    }
                    if (!inInput.matches?.(":focus")) inInput.value = String(state.inFrame ?? 0);
                    if (!outInput.matches?.(":focus"))
                        outInput.value = String(state.outFrame ?? maxF);

                    // Show selected playback range frame count near timecode (only when trimmed).
                    try {
                        const { inF, outF, maxF: mx } = getEffectiveInOut();
                        const fullRange = inF <= 0 && outF >= mx;
                        const count = Math.max(0, Math.floor(outF) - Math.floor(inF) + 1);
                        if (!fullRange && mx > 0) {
                            rangeCountLabel.textContent = `R: ${count}f`;
                            rangeCountLabel.style.display = "";
                        } else {
                            rangeCountLabel.style.display = "none";
                        }
                    } catch (e) {
                        console.debug?.(e);
                    }
                }
            } catch (e) {
                console.debug?.(e);
            }
        };

        const updateSeekRangeStyle = () => {
            if (!advanced) return;
            try {
                const { inF, outF, maxF } = getEffectiveInOut();
                if (!Number.isFinite(maxF) || maxF <= 0) return;
                const inPct = clamp01(inF / maxF) * 100;
                const outPct = clamp01(outF / maxF) * 100;
                const fullRange = inF <= 0 && outF >= maxF;

                // Prefer overlay zones over range background for cross-browser reliability.
                try {
                    seek.style.background = "";
                } catch (e) {
                    console.debug?.(e);
                }

                try {
                    const inP = clamp01(inPct / 100) * 100;
                    const outP = clamp01(outPct / 100) * 100;
                    const selLeft = Math.min(inP, outP);
                    const selRight = Math.max(inP, outP);
                    if (seekZones && leftTrimZone && selectedZone && rightTrimZone) {
                        // 0..In (leftTrim) is intentionally kept visually neutral (see CSS).
                        leftTrimZone.style.left = "0%";
                        leftTrimZone.style.width = `${selLeft}%`;

                        selectedZone.style.left = `${selLeft}%`;
                        selectedZone.style.width = `${Math.max(0, selRight - selLeft)}%`;

                        rightTrimZone.style.left = `${selRight}%`;
                        rightTrimZone.style.width = `${Math.max(0, 100 - selRight)}%`;

                        try {
                            seekZones.classList.toggle("is-trimmed", !fullRange);
                            seekZones.classList.toggle("is-fullrange", fullRange);
                        } catch (e) {
                            console.debug?.(e);
                        }
                    }
                } catch (e) {
                    console.debug?.(e);
                }
                try {
                    inMark.style.left = `${inPct}%`;
                    outMark.style.left = `${outPct}%`;
                } catch (e) {
                    console.debug?.(e);
                }
                try {
                    inHandle.style.left = `${inPct}%`;
                    outHandle.style.left = `${outPct}%`;
                } catch (e) {
                    console.debug?.(e);
                }

                // Nuke-like tick ruler. Clamp tick density so we don't create thousands of ticks for long clips.
                try {
                    const targetTicks = MAX_MINOR_TICKS; // max minor ticks
                    const minFramesPerTick = Math.max(1, Math.floor(maxF / targetTicks));
                    const framesPerTick = Math.max(
                        minFramesPerTick,
                        Math.floor(Number(state.step) || 1),
                    );
                    const minorPct = (framesPerTick / maxF) * 100;
                    const majorPct = minorPct * 10;
                    if (Number.isFinite(minorPct) && minorPct > 0.02) {
                        const minor = `repeating-linear-gradient(to right, rgba(255,255,255,0.16) 0, rgba(255,255,255,0.16) 1px, transparent 1px, transparent ${minorPct}%)`;
                        const major = `repeating-linear-gradient(to right, rgba(255,255,255,0.28) 0, rgba(255,255,255,0.28) 1px, transparent 1px, transparent ${majorPct}%)`;
                        tickBar.style.backgroundImage = `${major}, ${minor}`;
                    } else {
                        tickBar.style.backgroundImage = "";
                    }

                    // Frame number labels (major ticks). Keep count small to avoid overlap.
                    const rebuildLabels = () => {
                        try {
                            const key = `${maxF}|${framesPerTick}`;
                            if (labelsBar?.dataset?.mjrLabelKey === key) return;
                            labelsBar.dataset.mjrLabelKey = key;
                        } catch (e) {
                            console.debug?.(e);
                        }
                        try {
                            labelsBar.replaceChildren();
                        } catch (e) {
                            console.debug?.(e);
                        }
                        const MAX_LABELS = 22;
                        let majorFrames = Math.max(1, framesPerTick * 10);
                        try {
                            while (majorFrames > 0 && Math.ceil(maxF / majorFrames) > MAX_LABELS)
                                majorFrames *= 2;
                        } catch (e) {
                            console.debug?.(e);
                        }

                        const makeLabel = (frame) => {
                            const s = document.createElement("span");
                            s.className = "mjr-video-seek-label";
                            const pct = clamp01(frame / maxF) * 100;
                            s.style.left = `${pct}%`;
                            s.textContent = String(Math.floor(frame));
                            return s;
                        };

                        try {
                            labelsBar.appendChild(makeLabel(0));
                        } catch (e) {
                            console.debug?.(e);
                        }
                        for (let f = majorFrames; f < maxF; f += majorFrames) {
                            try {
                                labelsBar.appendChild(makeLabel(f));
                            } catch (e) {
                                console.debug?.(e);
                            }
                        }
                        try {
                            labelsBar.appendChild(makeLabel(maxF));
                        } catch (e) {
                            console.debug?.(e);
                        }
                    };
                    rebuildLabels();
                } catch (e) {
                    console.debug?.(e);
                }
            } catch (e) {
                console.debug?.(e);
            }
        };

        const applyRangeChange = ({ prefer = null } = {}) => {
            if (!advanced) return;
            try {
                normalizeRange();
                const { inF, outF } = getEffectiveInOut();
                const cf = currentFrame();
                if (prefer === "in") {
                    goToFrame(inF);
                } else if (prefer === "out") {
                    if (cf > outF) goToFrame(outF);
                } else {
                    // If outside the range, clamp into it (Nuke-like).
                    if (cf < inF) goToFrame(inF);
                    else if (cf > outF) goToFrame(outF);
                }
            } catch (e) {
                console.debug?.(e);
            }
        };

        const resetInToStart = () => {
            try {
                state.inFrame = 0;
                normalizeRange();
                updateTimeUI();
                updateSeekRangeStyle();
                applyRangeChange({ prefer: "in" });
            } catch (e) {
                console.debug?.(e);
            }
        };

        const resetOutToEnd = () => {
            try {
                const { maxF } = getEffectiveInOut();
                state.outFrame = Math.max(0, Number(maxF) || 0);
                normalizeRange();
                updateTimeUI();
                updateSeekRangeStyle();
                applyRangeChange({ prefer: "out" });
            } catch (e) {
                console.debug?.(e);
            }
        };

        const _cancelPingpongReverse = () => {
            try {
                if (state._ppRafId != null) {
                    cancelAnimationFrame(state._ppRafId);
                    state._ppRafId = null;
                }
            } catch (e) {
                console.debug?.(e);
            }
        };
        unsubs.push(_cancelPingpongReverse);

        const _startPingpongReverse = () => {
            try {
                _cancelPingpongReverse();
                state._ppReverse = true;
                video.pause?.();
                setPlayLabel();
                const fps = normalizeVideoFps(state.fps, 30);
                const rate = Math.max(0.25, Number(state.playbackRate) || 1);
                const intervalMs = 1000 / (fps * rate);
                let lastTime = performance.now();

                const stepBack = (now) => {
                    try {
                        if (!state._ppReverse || !state.pingpong) {
                            state._ppReverse = false;
                            setPlayLabel();
                            return;
                        }
                        const dt = now - lastTime;
                        if (dt >= intervalMs) {
                            lastTime = now - (dt % intervalMs);
                            const { inF } = getEffectiveInOut();
                            const cf = currentFrame();
                            if (cf <= inF) {
                                // Reached start — switch to forward
                                state._ppReverse = false;
                                goToFrame(inF);
                                const p = video.play?.();
                                if (p && typeof p.catch === "function") p.catch(() => {});
                                setPlayLabel();
                                updateTimeUI();
                                return;
                            }
                            const stepSize = Math.max(1, Math.floor(Number(state.step) || 1));
                            goToFrame(cf - stepSize);
                            updateTimeUI();
                        }
                        state._ppRafId = requestAnimationFrame(stepBack);
                    } catch (e) {
                        console.debug?.(e);
                        state._ppReverse = false;
                        setPlayLabel();
                    }
                };
                state._ppRafId = requestAnimationFrame(stepBack);
            } catch (e) {
                console.debug?.(e);
                state._ppReverse = false;
            }
        };

        const resetPlayerAll = () => {
            try {
                const maxF = durationFrames();
                state.inFrame = 0;
                state.outFrame = maxF > 0 ? maxF : null;
                state.step = 1;
                state.loop = Boolean(advanced);
                state.pingpong = false;
                state._ppReverse = false;
                _cancelPingpongReverse();
                state.once = false;
                setPlaybackRate(1);
                try {
                    stepInput.value = "1";
                } catch (e) {
                    console.debug?.(e);
                }
                try {
                    if (!speedSelect.matches?.(":focus")) speedSelect.value = "1";
                } catch (e) {
                    console.debug?.(e);
                }
                normalizeRange();
                applyLoopOnceUI();
                updateTimeUI();
                updateSeekRangeStyle();
                applyRangeChange({ prefer: "in" });
            } catch (e) {
                console.debug?.(e);
            }
        };

        const updateVolumeUI = () => {
            try {
                const v = clamp01(Number(video?.volume) || 0);
                try {
                    if (volume && !volume.matches?.(":active")) volume.value = String(v);
                } catch (e) {
                    console.debug?.(e);
                }
                setMuteLabel();
            } catch (e) {
                console.debug?.(e);
            }
        };

        const goToFrame = (frame) => {
            try {
                const { maxF } = getEffectiveInOut();
                const f = clamp(frame, 0, maxF > 0 ? maxF : Infinity);
                video.currentTime = frameToTime(f);
            } catch (e) {
                console.debug?.(e);
            }
            updateTimeUI();
        };

        const stepFrames = (direction) => {
            tryAutoUnmute();
            try {
                const inc = Math.max(1, Math.floor(Number(state.step) || 1));
                const { inF, outF } = getEffectiveInOut();
                const cf = currentFrame();
                let next = cf + direction * inc;
                if (state.loop) {
                    if (next < inF) next = outF;
                    if (next > outF) next = inF;
                } else {
                    next = clamp(next, inF, outF);
                }
                try {
                    video.pause?.();
                } catch (e) {
                    console.debug?.(e);
                }
                goToFrame(next);
                flashFrameStep();
            } catch (e) {
                console.debug?.(e);
            }
        };

        const ensureInRangeBeforePlay = () => {
            if (!advanced) return;
            try {
                normalizeRange();
                const { inF, outF } = getEffectiveInOut();
                const cf = currentFrame();
                if (cf < inF || cf > outF) goToFrame(inF);
            } catch (e) {
                console.debug?.(e);
            }
        };

        const togglePlay = () => {
            tryAutoUnmute();
            try {
                if (state._ppReverse) {
                    // Stop pingpong reverse and pause
                    state._ppReverse = false;
                    _cancelPingpongReverse();
                    setPlayLabel();
                    return;
                }
                if (video.paused) {
                    ensureInRangeBeforePlay();
                    const p = video.play?.();
                    if (p && typeof p.catch === "function") p.catch(() => {});
                } else {
                    video.pause?.();
                }
            } catch (e) {
                console.debug?.(e);
            }
            setPlayLabel();
        };

        // Click on video toggles play/pause (common UX).
        unsubs.push(
            safeAddListener(video, "click", (e) => {
                try {
                    if (e?.target !== video) return;
                } catch (e) {
                    console.debug?.(e);
                }
                togglePlay();
            }),
        );

        unsubs.push(
            safeAddListener(playBtn, "click", (e) => {
                stop(e);
                togglePlay();
            }),
        );
        unsubs.push(
            safeAddListener(prevFrameBtn, "click", (e) => {
                stop(e);
                stepFrames(-1);
            }),
        );
        unsubs.push(
            safeAddListener(nextFrameBtn, "click", (e) => {
                stop(e);
                stepFrames(1);
            }),
        );
        unsubs.push(
            safeAddListener(toInBtn, "click", (e) => {
                stop(e);
                const { inF } = getEffectiveInOut();
                goToFrame(inF);
                flashFrameStep();
            }),
        );
        unsubs.push(
            safeAddListener(toOutBtn, "click", (e) => {
                stop(e);
                const { outF } = getEffectiveInOut();
                goToFrame(outF);
                flashFrameStep();
            }),
        );

        // Seeking (range slider)
        unsubs.push(
            safeAddListener(seek, "pointerdown", () => {
                state._seeking = true;
            }),
        );
        unsubs.push(
            safeAddListener(seek, "pointerup", () => {
                state._seeking = false;
            }),
        );
        unsubs.push(
            safeAddListener(seek, "input", (e) => {
                stop(e);
                tryAutoUnmute();
                try {
                    const d = Number(video?.duration);
                    if (!Number.isFinite(d) || d <= 0) return;
                    const v = Number(seek.value);
                    const p = clamp01((Number.isFinite(v) ? v : 0) / 1000);
                    video.currentTime = p * d;
                } catch (e) {
                    console.debug?.(e);
                }
                updateTimeUI();
            }),
        );

        if (advanced) {
            unsubs.push(
                safeAddListener(setInBtn, "click", (e) => {
                    stop(e);
                    state.inFrame = currentFrame();
                    normalizeRange();
                    updateTimeUI();
                    updateSeekRangeStyle();
                    applyRangeChange({ prefer: "in" });
                }),
            );
            unsubs.push(
                safeAddListener(setOutBtn, "click", (e) => {
                    stop(e);
                    state.outFrame = currentFrame();
                    normalizeRange();
                    updateTimeUI();
                    updateSeekRangeStyle();
                    applyRangeChange({ prefer: "out" });
                }),
            );
            unsubs.push(
                safeAddListener(inInput, "change", (e) => {
                    stop(e);
                    try {
                        const v = Number(inInput.value);
                        state.inFrame = Number.isFinite(v) ? Math.max(0, Math.floor(v)) : null;
                        normalizeRange();
                    } catch (e) {
                        console.debug?.(e);
                    }
                    updateTimeUI();
                    updateSeekRangeStyle();
                    applyRangeChange({ prefer: "in" });
                }),
            );
            unsubs.push(
                safeAddListener(outInput, "change", (e) => {
                    stop(e);
                    try {
                        const v = Number(outInput.value);
                        state.outFrame = Number.isFinite(v) ? Math.max(0, Math.floor(v)) : null;
                        normalizeRange();
                    } catch (e) {
                        console.debug?.(e);
                    }
                    updateTimeUI();
                    updateSeekRangeStyle();
                    applyRangeChange({ prefer: "out" });
                }),
            );
            unsubs.push(
                safeAddListener(stepInput, "change", (e) => {
                    stop(e);
                    try {
                        state.step = Math.max(1, Math.floor(Number(stepInput.value) || 1));
                        stepInput.value = String(state.step);
                    } catch (e) {
                        console.debug?.(e);
                    }
                }),
            );
            unsubs.push(
                safeAddListener(fpsInput, "change", (e) => {
                    stop(e);
                    try {
                        state.fps = normalizeVideoFps(fpsInput.value, 30);
                        fpsInput.value = String(state.fps);
                        normalizeRange();
                    } catch (e) {
                        console.debug?.(e);
                    }
                    updateTimeUI();
                    updateSeekRangeStyle();
                }),
            );
            unsubs.push(
                safeAddListener(loopBtn, "click", (e) => {
                    stop(e);
                    // Cycle: off → loop → pingpong → off
                    if (!state.loop && !state.pingpong) {
                        state.loop = true;
                        state.pingpong = false;
                    } else if (state.loop && !state.pingpong) {
                        state.loop = false;
                        state.pingpong = true;
                    } else {
                        state.loop = false;
                        state.pingpong = false;
                    }
                    if (state.loop || state.pingpong) state.once = false;
                    // Cancel any active pingpong reverse animation
                    if (!state.pingpong) {
                        state._ppReverse = false;
                        _cancelPingpongReverse();
                    }
                    applyLoopOnceUI();
                }),
            );
            unsubs.push(
                safeAddListener(inLabel, "click", (e) => {
                    stop(e);
                    resetInToStart();
                }),
            );
            unsubs.push(
                safeAddListener(outLabel, "click", (e) => {
                    stop(e);
                    resetOutToEnd();
                }),
            );
            unsubs.push(
                safeAddListener(rangeCountLabel, "click", (e) => {
                    stop(e);
                    resetPlayerAll();
                }),
            );
            try {
                rangeCountLabel.title = t("video.resetPlayerControls", "Reset player controls");
                rangeCountLabel.style.cursor = "pointer";
                rangeCountLabel.style.userSelect = "none";
            } catch (e) {
                console.debug?.(e);
            }
        }

        unsubs.push(
            safeAddListener(muteBtn, "click", (e) => {
                stop(e);
                try {
                    video.muted = !video.muted;
                    if (volumeWrap) {
                        volumeWrap.style.display = video.muted ? "none" : "inline-flex";
                    }
                } catch (e) {
                    console.debug?.(e);
                }
                updateVolumeUI();
            }),
        );
        unsubs.push(
            safeAddListener(muteBtn, "contextmenu", (e) => {
                preventStop(e);
                try {
                    if (!volumeWrap) return;
                    const open = volumeWrap.style.display !== "none";
                    volumeWrap.style.display = open ? "none" : "inline-flex";
                } catch (e) {
                    console.debug?.(e);
                }
                updateVolumeUI();
            }),
        );
        unsubs.push(
            safeAddListener(
                window,
                "pointerdown",
                (e) => {
                    try {
                        if (!volumeWrap || volumeWrap.style.display === "none") return;
                        if (muteBtn.contains?.(e?.target) || volumeWrap.contains?.(e?.target))
                            return;
                        volumeWrap.style.display = "none";
                    } catch (e) {
                        console.debug?.(e);
                    }
                },
                { capture: true },
            ),
        );
        if (volume) {
            unsubs.push(
                safeAddListener(volume, "input", (e) => {
                    stop(e);
                    try {
                        const v = clamp01(Number(volume.value) || 0);
                        video.volume = v;
                        if (v > 0.001) video.muted = false;
                    } catch (e) {
                        console.debug?.(e);
                    }
                    updateVolumeUI();
                }),
            );
        }
        unsubs.push(
            safeAddListener(speedSelect, "change", (e) => {
                stop(e);
                try {
                    setPlaybackRate(Number(speedSelect.value) || 1);
                } catch (e) {
                    console.debug?.(e);
                }
            }),
        );
        unsubs.push(
            safeAddListener(video, "ratechange", () => {
                try {
                    setPlaybackRate(Number(video.playbackRate) || state.playbackRate || 1);
                } catch (e) {
                    console.debug?.(e);
                }
            }),
        );
        const enforceRange = () => {
            if (!advanced) return;
            try {
                if (state._seeking) return;
                if (video?.paused) return;

                const { inF, outF, maxF } = getEffectiveInOut();
                if (maxF <= 0) return;
                // Only enforce when the user has a non-full range selected.
                const fullRange = inF <= 0 && outF >= maxF;
                if (fullRange && !state.loop && !state.pingpong && !state.once) return;

                // During pingpong reverse phase, don't enforce normal range logic
                if (state._ppReverse) return;

                const cf = currentFrame();
                const eps = Math.max(1, Math.floor(Number(state.step) || 1));

                if (cf >= outF - eps) {
                    if (state.pingpong) {
                        _startPingpongReverse();
                        return;
                    } else if (state.loop) {
                        goToFrame(inF);
                        try {
                            const p = video.play?.();
                            if (p && typeof p.catch === "function") p.catch(() => {});
                        } catch (e) {
                            console.debug?.(e);
                        }
                    } else if (state.once) {
                        try {
                            video.pause?.();
                        } catch (e) {
                            console.debug?.(e);
                        }
                        goToFrame(outF);
                    } else {
                        // Default behavior when a range is set: stop at Out (Nuke-like playback range).
                        try {
                            video.pause?.();
                        } catch (e) {
                            console.debug?.(e);
                        }
                        goToFrame(outF);
                    }
                } else if (cf < inF) {
                    goToFrame(inF);
                }
            } catch (e) {
                console.debug?.(e);
            }
        };

        const playbackUiSync = {
            rafId: null,
            rvfcId: null,
        };

        const cancelPlaybackUiSync = () => {
            try {
                if (
                    playbackUiSync.rvfcId != null
                    && typeof video?.cancelVideoFrameCallback === "function"
                ) {
                    video.cancelVideoFrameCallback(playbackUiSync.rvfcId);
                }
            } catch (e) {
                console.debug?.(e);
            }
            playbackUiSync.rvfcId = null;
            try {
                if (playbackUiSync.rafId != null && typeof cancelAnimationFrame === "function") {
                    cancelAnimationFrame(playbackUiSync.rafId);
                }
            } catch (e) {
                console.debug?.(e);
            }
            playbackUiSync.rafId = null;
        };

        const tickPlaybackUiSync = (_now = 0, meta = null) => {
            playbackUiSync.rafId = null;
            playbackUiSync.rvfcId = null;
            try {
                safeCall(updateTimeUI, meta?.mediaTime);
                safeCall(enforceRange);
            } catch (e) {
                console.debug?.(e);
            }

            const shouldContinue = Boolean(state._ppReverse) || !video?.paused;
            if (!shouldContinue || timersAC.signal?.aborted) return;

            try {
                if (typeof video?.requestVideoFrameCallback === "function" && !state._ppReverse) {
                    playbackUiSync.rvfcId = video.requestVideoFrameCallback(tickPlaybackUiSync);
                    return;
                }
            } catch (e) {
                console.debug?.(e);
            }

            try {
                if (typeof requestAnimationFrame === "function") {
                    playbackUiSync.rafId = requestAnimationFrame((nextNow) => {
                        tickPlaybackUiSync(nextNow, { mediaTime: Number(video?.currentTime) || 0 });
                    });
                }
            } catch (e) {
                console.debug?.(e);
            }
        };

        const startPlaybackUiSync = () => {
            cancelPlaybackUiSync();
            const shouldContinue = Boolean(state._ppReverse) || !video?.paused;
            if (!shouldContinue || timersAC.signal?.aborted) return;
            tickPlaybackUiSync(0, { mediaTime: Number(video?.currentTime) || 0 });
        };

        unsubs.push(cancelPlaybackUiSync);

        // Keep UI synced with media events.
        unsubs.push(
            safeAddListener(video, "play", () => {
                safeCall(setPlayLabel);
                startPlaybackUiSync();
            }),
        );
        for (const ev of ["pause", "ended"]) {
            unsubs.push(
                safeAddListener(video, ev, () => {
                    cancelPlaybackUiSync();
                    safeCall(setPlayLabel);
                    safeCall(updateTimeUI);
                }),
            );
        }
        for (const ev of ["timeupdate", "loadedmetadata", "durationchange", "seeked"]) {
            unsubs.push(safeAddListener(video, ev, () => safeCall(updateTimeUI)));
        }
        unsubs.push(safeAddListener(video, "timeupdate", enforceRange));
        // `timeupdate` can be too coarse to reliably catch the last frames of short clips.
        // Ensure looping works even when the video reaches its natural end.
        unsubs.push(
            safeAddListener(
                video,
                "ended",
                () => {
                    if (!advanced) return;
                    try {
                        const { inF, outF, maxF } = getEffectiveInOut();
                        const fullRange = inF <= 0 && outF >= maxF;
                        if (state.pingpong && !state._ppReverse) {
                            _startPingpongReverse();
                            return;
                        }
                        if (!state.loop && !fullRange) return;
                        goToFrame(inF);
                        try {
                            const p = video.play?.();
                            if (p && typeof p.catch === "function") p.catch(() => {});
                        } catch (e) {
                            console.debug?.(e);
                        }
                    } catch (e) {
                        console.debug?.(e);
                    }
                },
                { passive: true },
            ),
        );
        if (advanced) {
            unsubs.push(
                safeAddListener(video, "mjr:frameStep", () => {
                    safeCall(flashFrameStep);
                }),
            );
        }
        if (advanced) {
            unsubs.push(
                safeAddListener(video, "loadedmetadata", () => {
                    try {
                        const maxF = durationFrames();
                        if (maxF > 0 && state.inFrame == null && state.outFrame == null) {
                            state.inFrame = 0;
                            state.outFrame = maxF;
                            normalizeRange();
                        }
                    } catch (e) {
                        console.debug?.(e);
                    }
                    updateSeekRangeStyle();
                }),
            );
            unsubs.push(
                safeAddListener(video, "durationchange", () => safeCall(updateSeekRangeStyle)),
            );
        }
        for (const ev of ["volumechange"]) {
            unsubs.push(safeAddListener(video, ev, () => safeCall(updateVolumeUI)));
        }

        // Initial sync
        try {
            state.fps = normalizeVideoFps(fpsInput.value, 30);
            state.step = Math.max(1, Math.floor(Number(stepInput.value) || 1));
            normalizeRange();
            applyLoopOnceUI();
            setPlaybackRate(state.playbackRate);
        } catch (e) {
            console.debug?.(e);
        }
        safeCall(setPlayLabel);
        safeCall(updateTimeUI);
        safeCall(updateSeekRangeStyle);
        safeCall(updateVolumeUI);
        try {
            if (!video?.paused || state._ppReverse) {
                startPlaybackUiSync();
            }
        } catch (e) {
            console.debug?.(e);
        }

        const setMediaInfo = (info = {}) => {
            let oldMax = 0;
            let hadAutoFullOut = false;
            try {
                oldMax = Math.max(0, durationFrames());
                hadAutoFullOut = oldMax > 0 && state.outFrame != null && state.outFrame >= oldMax - 1;
            } catch (e) {
                console.debug?.(e);
            }

            try {
                const fps = Number(info?.fps);
                if (Number.isFinite(fps) && fps > 0) {
                    state.fps = normalizeVideoFps(fps, state.fps || 30);
                    try {
                        if (!fpsInput?.matches?.(":focus")) fpsInput.value = String(state.fps);
                    } catch (e) {
                        console.debug?.(e);
                    }
                }
            } catch (e) {
                console.debug?.(e);
            }
            try {
                const fc = Number(info?.frameCount);
                state.frameCount = Number.isFinite(fc) && fc > 0 ? Math.floor(fc) : null;
            } catch {
                state.frameCount = null;
            }
            try {
                const nextMax = Math.max(0, durationFrames());
                // If the out-point was previously pinned to the media's full extent,
                // keep that behavior when later metadata reveals a larger frame range.
                if (hadAutoFullOut && nextMax > oldMax + 0.5) {
                    state.outFrame = null;
                }
                normalizeRange();
                applyLoopOnceUI();
                updateTimeUI();
                updateSeekRangeStyle();
            } catch (e) {
                console.debug?.(e);
            }
        };

        // Best-effort: initialize from caller-provided media info (metadata/fps hints).
        try {
            if (advanced) {
                const initFps = Number(opts?.initialFps);
                const initFrames = Number(opts?.initialFrameCount);
                if (Number.isFinite(initFps) || Number.isFinite(initFrames)) {
                    setMediaInfo({ fps: initFps, frameCount: initFrames });
                }
            }
        } catch (e) {
            console.debug?.(e);
        }

        // Drag In/Out handles on the seek bar.
        if (advanced) {
            const drag = { active: false, which: null, pointerId: null, ac: null, captureEl: null };

            const frameFromClientX = (clientX) => {
                try {
                    const rect = seekWrap.getBoundingClientRect();
                    const x = clamp((Number(clientX) || 0) - rect.left, 0, rect.width || 1);
                    const pct = rect.width > 0 ? x / rect.width : 0;
                    const { maxF } = getEffectiveInOut();
                    return clamp(Math.round(pct * maxF), 0, maxF);
                } catch {
                    return 0;
                }
            };

            const startDrag = (e, which) => {
                preventStop(e);
                try {
                    drag.ac?.abort?.();
                } catch (e) {
                    console.debug?.(e);
                }
                drag.ac = null;
                drag.active = true;
                drag.which = which;
                drag.pointerId = e.pointerId;

                // Capture on the actual handle so move/up events still fire even if the pointer leaves the seek bar.
                // Some browsers are picky about capturing on non-target elements.
                try {
                    drag.captureEl = e.currentTarget || null;
                } catch {
                    drag.captureEl = null;
                }
                try {
                    drag.captureEl?.setPointerCapture?.(e.pointerId);
                } catch (e) {
                    console.debug?.(e);
                }
                try {
                    seekWrap.setPointerCapture?.(e.pointerId);
                } catch (e) {
                    console.debug?.(e);
                }

                try {
                    const ac = new AbortController();
                    drag.ac = ac;
                    // Use document-level listeners during active drag for robustness.
                    window.addEventListener("pointermove", moveDrag, {
                        passive: false,
                        capture: true,
                        signal: ac.signal,
                    });
                    window.addEventListener("pointerup", endDrag, {
                        passive: false,
                        capture: true,
                        signal: ac.signal,
                    });
                    window.addEventListener("pointercancel", endDrag, {
                        passive: false,
                        capture: true,
                        signal: ac.signal,
                    });
                } catch (e) {
                    console.debug?.(e);
                }

                const f = frameFromClientX(e.clientX);
                if (which === "in") state.inFrame = f;
                else state.outFrame = f;
                normalizeRange();
                updateTimeUI();
                updateSeekRangeStyle();
                applyRangeChange({ prefer: which });
            };

            const moveDrag = (e) => {
                if (!drag.active) return;
                preventStop(e);
                const f = frameFromClientX(e.clientX);
                if (drag.which === "in") state.inFrame = f;
                else state.outFrame = f;
                normalizeRange();
                updateTimeUI();
                updateSeekRangeStyle();
            };

            const endDrag = (e) => {
                if (!drag.active) return;
                preventStop(e);
                drag.active = false;
                try {
                    seekWrap.releasePointerCapture?.(drag.pointerId);
                } catch (e) {
                    console.debug?.(e);
                }
                try {
                    drag.captureEl?.releasePointerCapture?.(drag.pointerId);
                } catch (e) {
                    console.debug?.(e);
                }
                drag.captureEl = null;
                drag.pointerId = null;
                try {
                    applyRangeChange({ prefer: drag.which });
                } catch (e) {
                    console.debug?.(e);
                }
                try {
                    drag.ac?.abort?.();
                } catch (e) {
                    console.debug?.(e);
                }
                drag.ac = null;
            };

            unsubs.push(
                safeAddListener(inHandle, "pointerdown", (e) => startDrag(e, "in"), {
                    passive: false,
                }),
            );
            unsubs.push(
                safeAddListener(outHandle, "pointerdown", (e) => startDrag(e, "out"), {
                    passive: false,
                }),
            );
            // Allow dragging the thin In/Out markers too (Nuke-like).
            unsubs.push(
                safeAddListener(inMark, "pointerdown", (e) => startDrag(e, "in"), {
                    passive: false,
                }),
            );
            unsubs.push(
                safeAddListener(outMark, "pointerdown", (e) => startDrag(e, "out"), {
                    passive: false,
                }),
            );
            unsubs.push(safeAddListener(seekWrap, "pointermove", moveDrag, { passive: false }));
            unsubs.push(safeAddListener(seekWrap, "pointerup", endDrag, { passive: false }));
            unsubs.push(safeAddListener(seekWrap, "pointercancel", endDrag, { passive: false }));
        }

        safeCall(() => hostEl.appendChild(controls));

        return {
            controlsEl: controls,
            setMediaInfo,
            setPlaybackRate: (rate) => {
                try {
                    return setPlaybackRate(rate);
                } catch {
                    return state.playbackRate || 1;
                }
            },
            getPlaybackRate: () => {
                try {
                    return Number(state.playbackRate) || 1;
                } catch {
                    return 1;
                }
            },
            adjustPlaybackRate: (delta) => {
                try {
                    const d = Number(delta);
                    if (!Number.isFinite(d)) return state.playbackRate || 1;
                    return setPlaybackRate((Number(state.playbackRate) || 1) + d);
                } catch {
                    return state.playbackRate || 1;
                }
            },
            togglePlay: () => {
                try {
                    togglePlay();
                    return true;
                } catch {
                    return false;
                }
            },
            stepFrames: (direction) => {
                try {
                    stepFrames(direction);
                    return true;
                } catch {
                    return false;
                }
            },
            setInPoint: () => {
                if (!advanced) return false;
                try {
                    state.inFrame = currentFrame();
                    normalizeRange();
                    updateTimeUI();
                    updateSeekRangeStyle();
                    applyRangeChange({ prefer: "in" });
                    return true;
                } catch {
                    return false;
                }
            },
            setOutPoint: () => {
                if (!advanced) return false;
                try {
                    state.outFrame = currentFrame();
                    normalizeRange();
                    updateTimeUI();
                    updateSeekRangeStyle();
                    applyRangeChange({ prefer: "out" });
                    return true;
                } catch {
                    return false;
                }
            },
            goToIn: () => {
                if (!advanced) return false;
                try {
                    const { inF } = getEffectiveInOut();
                    goToFrame(inF);
                    flashFrameStep();
                    return true;
                } catch {
                    return false;
                }
            },
            goToOut: () => {
                if (!advanced) return false;
                try {
                    const { outF } = getEffectiveInOut();
                    goToFrame(outF);
                    flashFrameStep();
                    return true;
                } catch {
                    return false;
                }
            },
            destroy: () => {
                for (const u of unsubs) safeCall(u);
                safeCall(() => controls.remove());
            },
        };
    } catch {
        return { controlsEl: null, destroy: noop };
    }
}
