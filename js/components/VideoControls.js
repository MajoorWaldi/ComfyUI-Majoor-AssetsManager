const noop = () => {};

function safeCall(fn) {
    try {
        return fn?.();
    } catch {
        return undefined;
    }
}

function safeAddListener(target, event, handler, options) {
    try {
        target?.addEventListener?.(event, handler, options);
        return () => {
            try {
                target?.removeEventListener?.(event, handler, options);
            } catch {}
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

function clamp01(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(1, n));
}

function clamp(v, min, max) {
    const n = Number(v);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
}

function createBtn(className, text, title) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `mjr-video-btn ${className || ""}`.trim();
    if (title) b.title = title;
    b.textContent = text;
    return b;
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

/**
 * Mount custom video controls on top of a <video> element.
 * Must never throw (viewer stability).
 *
 * Viewer variant adds Nuke-style range + frame controls (in/out, step, loop/once).
 *
 * @param {HTMLVideoElement} video
 * @param {{variant?: 'viewer'|'preview', hostEl?: HTMLElement, fullscreenEl?: HTMLElement}} opts
 * @returns {{controlsEl: HTMLElement|null, destroy: () => void}}
 */
export function mountVideoControls(video, opts = {}) {
    try {
        const variant = opts?.variant === "preview" ? "preview" : "viewer";
        const advanced = variant === "viewer";
        const hostEl = opts?.hostEl || video?.parentElement;
        if (!video || !hostEl) return { controlsEl: null, destroy: noop };

        safeCall(() => hostEl.classList?.add("mjr-video-host"));
        safeCall(() => video.classList?.add("mjr-video-el"));

        safeCall(() => {
            const cs = window.getComputedStyle?.(hostEl);
            if (cs?.position === "static") hostEl.style.position = "relative";
        });

        const controls = document.createElement("div");
        controls.className = `mjr-video-controls mjr-video-controls--${variant}`;
        controls.setAttribute("role", "group");
        controls.setAttribute("aria-label", "Video controls");

        const rowTop = document.createElement("div");
        rowTop.className = "mjr-video-row mjr-video-row--top";
        const rowBottom = document.createElement("div");
        rowBottom.className = "mjr-video-row mjr-video-row--bottom";
        controls.appendChild(rowTop);
        controls.appendChild(rowBottom);

        const seek = document.createElement("input");
        seek.className = "mjr-video-range mjr-video-range--seek";
        seek.type = "range";
        seek.min = "0";
        seek.max = "1000";
        seek.step = "1";
        seek.value = "0";
        seek.setAttribute("aria-label", "Seek");

        const timeLabel = document.createElement("span");
        timeLabel.className = "mjr-video-time";
        timeLabel.textContent = "0:00 / 0:00";

        const frameLabel = document.createElement("span");
        frameLabel.className = "mjr-video-frame";
        frameLabel.textContent = "F: 0";

        const playBtn = createBtn("mjr-video-btn--play", "Play", "Play/Pause (Space)");
        const prevFrameBtn = createBtn("mjr-video-btn--step", "<", "Step back");
        const nextFrameBtn = createBtn("mjr-video-btn--step", ">", "Step forward");
        const toInBtn = createBtn("mjr-video-btn--jump", "|<", "Go to In");
        const toOutBtn = createBtn("mjr-video-btn--jump", ">|", "Go to Out");

        const setInBtn = createBtn("mjr-video-btn--mark", "I", "Set In from current frame");
        const setOutBtn = createBtn("mjr-video-btn--mark", "O", "Set Out from current frame");
        const loopBtn = createBtn("mjr-video-btn--toggle", "Loop", "Loop playback in range");
        const onceBtn = createBtn("mjr-video-btn--toggle", "Once", "Play once (stop at Out)");

        const inInput = createNumberInput("mjr-video-num--in", { min: 0, step: 1, value: 0, title: "In frame", ariaLabel: "In frame", widthPx: 72 });
        const outInput = createNumberInput("mjr-video-num--out", { min: 0, step: 1, value: 0, title: "Out frame", ariaLabel: "Out frame", widthPx: 72 });
        const stepInput = createNumberInput("mjr-video-num--step", {
            min: 1,
            step: 1,
            value: 1,
            title: "Frame increment",
            ariaLabel: "Frame increment",
            widthPx: 56
        });
        const fpsInput = createNumberInput("mjr-video-num--fps", {
            min: 1,
            step: 1,
            value: 30,
            title: "FPS (used for frame stepping)",
            ariaLabel: "FPS",
            widthPx: 56
        });

        const muteBtn = createBtn("mjr-video-btn--mute", "Mute", "Mute");
        const volume = document.createElement("input");
        volume.className = "mjr-video-range mjr-video-range--volume";
        volume.type = "range";
        volume.min = "0";
        volume.max = "1";
        volume.step = "0.02";
        volume.value = String(clamp01(Number(video.volume) || 0));
        volume.setAttribute("aria-label", "Volume");

        const fsBtn = createBtn("mjr-video-btn--fs", "FS", "Fullscreen");

        const inGroup = document.createElement("div");
        inGroup.className = "mjr-video-group mjr-video-group--in";
        if (advanced) {
            inGroup.appendChild(document.createTextNode("In"));
            inGroup.appendChild(inInput);
        }

        const outGroup = document.createElement("div");
        outGroup.className = "mjr-video-group mjr-video-group--out";
        if (advanced) {
            outGroup.appendChild(document.createTextNode("Out"));
            outGroup.appendChild(outInput);
        }

        const nukeGroup = document.createElement("div");
        nukeGroup.className = "mjr-video-group mjr-video-group--nuke";
        if (advanced) {
            nukeGroup.appendChild(setInBtn);
            nukeGroup.appendChild(setOutBtn);
            nukeGroup.appendChild(document.createTextNode("Step"));
            nukeGroup.appendChild(stepInput);
            nukeGroup.appendChild(document.createTextNode("FPS"));
            nukeGroup.appendChild(fpsInput);
            nukeGroup.appendChild(loopBtn);
            nukeGroup.appendChild(onceBtn);
        }

        // Top row: In (left) — seek — Out (right) — time — frame
        if (advanced) rowTop.appendChild(inGroup);
        rowTop.appendChild(seek);
        if (advanced) rowTop.appendChild(outGroup);
        rowTop.appendChild(timeLabel);
        if (advanced) rowTop.appendChild(frameLabel);

        // Bottom row: center transport, right-side extra controls
        const bottomLeft = document.createElement("div");
        bottomLeft.className = "mjr-video-bottom mjr-video-bottom--left";
        const transport = document.createElement("div");
        transport.className = "mjr-video-transport";
        const bottomRight = document.createElement("div");
        bottomRight.className = "mjr-video-bottom mjr-video-bottom--right";

        transport.appendChild(toInBtn);
        transport.appendChild(prevFrameBtn);
        transport.appendChild(playBtn);
        transport.appendChild(nextFrameBtn);
        transport.appendChild(toOutBtn);

        if (advanced) bottomRight.appendChild(nukeGroup);
        bottomRight.appendChild(muteBtn);
        bottomRight.appendChild(volume);
        bottomRight.appendChild(fsBtn);

        rowBottom.appendChild(bottomLeft);
        rowBottom.appendChild(transport);
        rowBottom.appendChild(bottomRight);

        // Ensure the controls overlay never triggers viewer panning/zoom handlers.
        const stop = (e) => {
            try {
                e.stopPropagation?.();
                e.stopImmediatePropagation?.();
            } catch {}
        };
        const preventStop = (e) => {
            try {
                e.preventDefault?.();
            } catch {}
            stop(e);
        };

        const unsubs = [];
        unsubs.push(safeAddListener(controls, "pointerdown", stop, { capture: true }));
        unsubs.push(safeAddListener(controls, "dblclick", preventStop, { capture: true }));
        unsubs.push(safeAddListener(controls, "wheel", preventStop, { capture: true, passive: false }));

        // Stop events early (window capture) so viewer pan/zoom capture handlers don't run.
        // This is important because the viewer binds on the content container with `{ capture: true }`.
        const stopIfInControls = (e, { prevent = false } = {}) => {
            try {
                if (!controls?.isConnected) return;
                if (!controls.contains?.(e?.target)) return;
                if (prevent) {
                    try {
                        e.preventDefault?.();
                    } catch {}
                }
                stop(e);
            } catch {}
        };
        unsubs.push(safeAddListener(window, "pointerdown", (e) => stopIfInControls(e, { prevent: false }), { capture: true }));
        unsubs.push(safeAddListener(window, "pointermove", (e) => stopIfInControls(e, { prevent: false }), { capture: true }));
        unsubs.push(safeAddListener(window, "dblclick", (e) => stopIfInControls(e, { prevent: true }), { capture: true }));
        unsubs.push(safeAddListener(window, "wheel", (e) => stopIfInControls(e, { prevent: true }), { capture: true, passive: false }));

        const state = {
            fps: 30,
            step: 1,
            inFrame: null,
            outFrame: null,
            loop: false,
            once: false,
            _seeking: false
        };

        let _stepFlashTimer = null;
        const flashFrameStep = () => {
            if (!advanced) return;
            try {
                frameLabel.classList.add("is-step");
                if (_stepFlashTimer) clearTimeout(_stepFlashTimer);
                _stepFlashTimer = setTimeout(() => {
                    try {
                        frameLabel.classList.remove("is-step");
                    } catch {}
                }, 220);
            } catch {}
        };

        const setToggleBtn = (btn, on) => {
            try {
                if (!btn) return;
                if (on) btn.classList.add("is-on");
                else btn.classList.remove("is-on");
            } catch {}
        };

        const applyLoopOnceUI = () => {
            try {
                setToggleBtn(loopBtn, Boolean(state.loop));
                setToggleBtn(onceBtn, Boolean(state.once));
            } catch {}
        };

        const durationFrames = () => {
            try {
                const d = Number(video?.duration);
                const fps = Math.max(1, Math.floor(Number(state.fps) || 30));
                if (!Number.isFinite(d) || d <= 0) return 0;
                return Math.max(0, Math.floor(d * fps));
            } catch {
                return 0;
            }
        };

        const currentFrame = () => {
            try {
                const t = Number(video?.currentTime);
                const fps = Math.max(1, Math.floor(Number(state.fps) || 30));
                if (!Number.isFinite(t) || t < 0) return 0;
                return Math.max(0, Math.round(t * fps));
            } catch {
                return 0;
            }
        };

        const frameToTime = (frame) => {
            const fps = Math.max(1, Math.floor(Number(state.fps) || 30));
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
            } catch {}
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
                playBtn.textContent = video?.paused ? "Play" : "Pause";
            } catch {}
        };

        const setMuteLabel = () => {
            try {
                const muted = Boolean(video?.muted) || (Number(video?.volume) || 0) <= 0.001;
                muteBtn.textContent = muted ? "Muted" : "Mute";
            } catch {}
        };

        const updateTimeUI = () => {
            try {
                const d = Number(video?.duration);
                const t = Number(video?.currentTime);
                const durationOk = Number.isFinite(d) && d > 0;

                timeLabel.textContent = `${formatTime(t)} / ${durationOk ? formatTime(d) : "0:00"}`;
                seek.disabled = !durationOk;

                if (durationOk) {
                    const p = clamp01((t || 0) / d);
                    const v = Math.round(p * 1000);
                    if (!Number.isNaN(v) && !seek.matches?.(":active")) seek.value = String(v);
                } else {
                    seek.value = "0";
                }

                if (advanced) {
                    frameLabel.textContent = `F: ${currentFrame()}`;
                    const maxF = durationFrames();
                    if (!inInput.matches?.(":focus")) inInput.value = String(state.inFrame ?? 0);
                    if (!outInput.matches?.(":focus")) outInput.value = String(state.outFrame ?? maxF);
                }
            } catch {}
        };

        const updateSeekRangeStyle = () => {
            if (!advanced) return;
            try {
                const { inF, outF, maxF } = getEffectiveInOut();
                if (!Number.isFinite(maxF) || maxF <= 0) return;
                const inPct = clamp01(inF / maxF) * 100;
                const outPct = clamp01(outF / maxF) * 100;
                const a = "rgba(255,255,255,0.14)"; // outside selection
                const b = "rgba(64,160,255,0.45)"; // selected range
                seek.style.background = `linear-gradient(to right, ${a} 0%, ${a} ${inPct}%, ${b} ${inPct}%, ${b} ${outPct}%, ${a} ${outPct}%, ${a} 100%)`;
            } catch {}
        };

        const updateVolumeUI = () => {
            try {
                const v = clamp01(Number(video?.volume) || 0);
                if (!volume.matches?.(":active")) volume.value = String(v);
                setMuteLabel();
            } catch {}
        };

        const goToFrame = (frame) => {
            try {
                const { maxF } = getEffectiveInOut();
                const f = clamp(frame, 0, maxF > 0 ? maxF : Infinity);
                video.currentTime = frameToTime(f);
            } catch {}
            updateTimeUI();
        };

        const stepFrames = (direction) => {
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
                } catch {}
                goToFrame(next);
                flashFrameStep();
            } catch {}
        };

        const ensureInRangeBeforePlay = () => {
            if (!advanced) return;
            try {
                normalizeRange();
                const { inF, outF } = getEffectiveInOut();
                const cf = currentFrame();
                if (cf < inF || cf > outF) goToFrame(inF);
            } catch {}
        };

        const togglePlay = () => {
            try {
                if (video.paused) {
                    ensureInRangeBeforePlay();
                    const p = video.play?.();
                    if (p && typeof p.catch === "function") p.catch(() => {});
                } else {
                    video.pause?.();
                }
            } catch {}
            setPlayLabel();
        };

        // Click on video toggles play/pause (common UX).
        unsubs.push(
            safeAddListener(video, "click", (e) => {
                try {
                    if (e?.target !== video) return;
                } catch {}
                togglePlay();
            })
        );

        unsubs.push(
            safeAddListener(playBtn, "click", (e) => {
                stop(e);
                togglePlay();
            })
        );
        unsubs.push(
            safeAddListener(prevFrameBtn, "click", (e) => {
                stop(e);
                stepFrames(-1);
            })
        );
        unsubs.push(
            safeAddListener(nextFrameBtn, "click", (e) => {
                stop(e);
                stepFrames(1);
            })
        );
        unsubs.push(
            safeAddListener(toInBtn, "click", (e) => {
                stop(e);
                const { inF } = getEffectiveInOut();
                goToFrame(inF);
                flashFrameStep();
            })
        );
        unsubs.push(
            safeAddListener(toOutBtn, "click", (e) => {
                stop(e);
                const { outF } = getEffectiveInOut();
                goToFrame(outF);
                flashFrameStep();
            })
        );

        // Seeking (range slider)
        unsubs.push(
            safeAddListener(seek, "pointerdown", () => {
                state._seeking = true;
            })
        );
        unsubs.push(
            safeAddListener(seek, "pointerup", () => {
                state._seeking = false;
            })
        );
        unsubs.push(
            safeAddListener(seek, "input", (e) => {
                stop(e);
                try {
                    const d = Number(video?.duration);
                    if (!Number.isFinite(d) || d <= 0) return;
                    const v = Number(seek.value);
                    const p = clamp01((Number.isFinite(v) ? v : 0) / 1000);
                    video.currentTime = p * d;
                } catch {}
                updateTimeUI();
            })
        );

        if (advanced) {
            unsubs.push(
                safeAddListener(setInBtn, "click", (e) => {
                    stop(e);
                    state.inFrame = currentFrame();
                    normalizeRange();
                    updateTimeUI();
                    updateSeekRangeStyle();
                })
            );
            unsubs.push(
                safeAddListener(setOutBtn, "click", (e) => {
                    stop(e);
                    state.outFrame = currentFrame();
                    normalizeRange();
                    updateTimeUI();
                    updateSeekRangeStyle();
                })
            );
            unsubs.push(
                safeAddListener(inInput, "change", (e) => {
                    stop(e);
                    try {
                        const v = Number(inInput.value);
                        state.inFrame = Number.isFinite(v) ? Math.max(0, Math.floor(v)) : null;
                        normalizeRange();
                    } catch {}
                    updateTimeUI();
                    updateSeekRangeStyle();
                })
            );
            unsubs.push(
                safeAddListener(outInput, "change", (e) => {
                    stop(e);
                    try {
                        const v = Number(outInput.value);
                        state.outFrame = Number.isFinite(v) ? Math.max(0, Math.floor(v)) : null;
                        normalizeRange();
                    } catch {}
                    updateTimeUI();
                    updateSeekRangeStyle();
                })
            );
            unsubs.push(
                safeAddListener(stepInput, "change", (e) => {
                    stop(e);
                    try {
                        state.step = Math.max(1, Math.floor(Number(stepInput.value) || 1));
                        stepInput.value = String(state.step);
                    } catch {}
                })
            );
            unsubs.push(
                safeAddListener(fpsInput, "change", (e) => {
                    stop(e);
                    try {
                        state.fps = Math.max(1, Math.floor(Number(fpsInput.value) || 30));
                        fpsInput.value = String(state.fps);
                        normalizeRange();
                    } catch {}
                    updateTimeUI();
                    updateSeekRangeStyle();
                })
            );
            unsubs.push(
                safeAddListener(loopBtn, "click", (e) => {
                    stop(e);
                    state.loop = !state.loop;
                    if (state.loop) state.once = false;
                    applyLoopOnceUI();
                })
            );
            unsubs.push(
                safeAddListener(onceBtn, "click", (e) => {
                    stop(e);
                    state.once = !state.once;
                    if (state.once) state.loop = false;
                    applyLoopOnceUI();
                })
            );
        }

        unsubs.push(
            safeAddListener(muteBtn, "click", (e) => {
                stop(e);
                try {
                    video.muted = !video.muted;
                } catch {}
                updateVolumeUI();
            })
        );
        unsubs.push(
            safeAddListener(volume, "input", (e) => {
                stop(e);
                try {
                    const v = clamp01(Number(volume.value) || 0);
                    video.volume = v;
                    if (v > 0.001) video.muted = false;
                } catch {}
                updateVolumeUI();
            })
        );
        unsubs.push(
            safeAddListener(fsBtn, "click", (e) => {
                stop(e);
                try {
                    const el = opts?.fullscreenEl || hostEl;
                    const doc = document;
                    if (doc.fullscreenElement) {
                        doc.exitFullscreen?.().catch?.(() => {});
                        return;
                    }
                    el.requestFullscreen?.().catch?.(() => {});
                } catch {}
            })
        );

        const enforceRange = () => {
            if (!advanced) return;
            try {
                if (!state.loop && !state.once) return;
                if (state._seeking) return;
                if (video?.paused) return;

                const { inF, outF, maxF } = getEffectiveInOut();
                if (maxF <= 0) return;
                const cf = currentFrame();
                const eps = Math.max(1, Math.floor(Number(state.step) || 1));

                if (cf >= outF - eps) {
                    if (state.loop) {
                        goToFrame(inF);
                        try {
                            const p = video.play?.();
                            if (p && typeof p.catch === "function") p.catch(() => {});
                        } catch {}
                    } else if (state.once) {
                        try {
                            video.pause?.();
                        } catch {}
                        goToFrame(outF);
                    }
                } else if (cf < inF) {
                    goToFrame(inF);
                }
            } catch {}
        };

        // Keep UI synced with media events.
        for (const ev of ["play", "pause", "ended"]) {
            unsubs.push(safeAddListener(video, ev, () => safeCall(setPlayLabel)));
        }
        for (const ev of ["timeupdate", "loadedmetadata", "durationchange", "seeked"]) {
            unsubs.push(safeAddListener(video, ev, () => safeCall(updateTimeUI)));
        }
        unsubs.push(safeAddListener(video, "timeupdate", enforceRange));
        if (advanced) {
            unsubs.push(
                safeAddListener(video, "mjr:frameStep", () => {
                    safeCall(flashFrameStep);
                })
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
                    } catch {}
                    updateSeekRangeStyle();
                })
            );
            unsubs.push(safeAddListener(video, "durationchange", () => safeCall(updateSeekRangeStyle)));
        }
        for (const ev of ["volumechange"]) {
            unsubs.push(safeAddListener(video, ev, () => safeCall(updateVolumeUI)));
        }

        // Initial sync
        try {
            state.fps = Math.max(1, Math.floor(Number(fpsInput.value) || 30));
            state.step = Math.max(1, Math.floor(Number(stepInput.value) || 1));
            normalizeRange();
            applyLoopOnceUI();
        } catch {}
        safeCall(setPlayLabel);
        safeCall(updateTimeUI);
        safeCall(updateSeekRangeStyle);
        safeCall(updateVolumeUI);

        safeCall(() => hostEl.appendChild(controls));

        return {
            controlsEl: controls,
            destroy: () => {
                for (const u of unsubs) safeCall(u);
                safeCall(() => controls.remove());
            }
        };
    } catch {
        return { controlsEl: null, destroy: noop };
    }
}
