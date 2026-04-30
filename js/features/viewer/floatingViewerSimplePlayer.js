import { readAssetFps } from "../../utils/mediaFps.js";

const DEFAULT_FPS = 30;

function formatDuration(seconds) {
    const s = Number(seconds);
    if (!Number.isFinite(s) || s < 0) return "0:00";
    const total = Math.floor(s);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const sec = total % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${m}:${String(sec).padStart(2, "0")}`;
}

function safePlay(media) {
    try {
        const p = media?.play?.();
        if (p && typeof p.catch === "function") p.catch(() => {});
    } catch (e) {
        console.debug?.(e);
    }
}

function clampFrame(frame, maxFrame) {
    const f = Math.floor(Number(frame) || 0);
    const max = Math.max(0, Math.floor(Number(maxFrame) || 0));
    if (f < 0) return 0;
    if (max > 0 && f > max) return max;
    return f;
}

function frameFromTime(video, fps) {
    const time = Number(video?.currentTime || 0);
    const rate = Number(fps) > 0 ? Number(fps) : DEFAULT_FPS;
    return Math.max(0, Math.floor(time * rate));
}

function maxFrameFromDuration(video, fps) {
    const duration = Number(video?.duration || 0);
    const rate = Number(fps) > 0 ? Number(fps) : DEFAULT_FPS;
    if (!Number.isFinite(duration) || duration <= 0) return 0;
    return Math.max(0, Math.floor(duration * rate));
}

function seekToFrame(video, frame, fps) {
    const rate = Number(fps) > 0 ? Number(fps) : DEFAULT_FPS;
    const maxFrame = maxFrameFromDuration(video, rate);
    const targetFrame = clampFrame(frame, maxFrame);
    const targetTime = targetFrame / rate;
    try {
        video.currentTime = Math.max(0, targetTime);
    } catch (e) {
        console.debug?.(e);
    }
}

function isTimelineMedia(mediaEl) {
    return mediaEl instanceof HTMLMediaElement;
}

function isVideoMedia(kind, mediaEl) {
    if (String(kind || "").toLowerCase() === "video") return true;
    return mediaEl instanceof HTMLVideoElement;
}

function isAudioMedia(kind, mediaEl) {
    if (String(kind || "").toLowerCase() === "audio") return true;
    return mediaEl instanceof HTMLAudioElement;
}

function isAnimatedImageKind(kind) {
    const k = String(kind || "").toLowerCase();
    return k === "gif" || k === "animated-image";
}

function tryBuildStaticSnapshotFromImage(imgEl) {
    try {
        const w = Number(imgEl?.naturalWidth || imgEl?.width || 0);
        const h = Number(imgEl?.naturalHeight || imgEl?.height || 0);
        if (!(w > 0 && h > 0)) return "";
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return "";
        ctx.drawImage(imgEl, 0, 0, w, h);
        return canvas.toDataURL("image/png");
    } catch (e) {
        console.debug?.(e);
        return "";
    }
}

export function mountFloatingViewerSimplePlayer(mediaEl, fileData = null, { kind = "" } = {}) {
    if (!mediaEl || mediaEl._mjrSimplePlayerMounted) return mediaEl?.parentElement || null;
    mediaEl._mjrSimplePlayerMounted = true;

    const fps = readAssetFps(fileData) || DEFAULT_FPS;
    const timelineSupported = isTimelineMedia(mediaEl);
    const videoKind = isVideoMedia(kind, mediaEl);
    const audioKind = isAudioMedia(kind, mediaEl);
    const animatedImage = isAnimatedImageKind(kind);

    const root = document.createElement("div");
    root.className = "mjr-mfv-simple-player";
    root.tabIndex = 0;
    root.setAttribute("role", "group");
    root.setAttribute("aria-label", "Media player");
    if (audioKind) root.classList.add("is-audio");
    if (animatedImage) root.classList.add("is-animated-image");

    const controls = document.createElement("div");
    controls.className = "mjr-mfv-simple-player-controls";

    const seek = document.createElement("input");
    seek.type = "range";
    seek.className = "mjr-mfv-simple-player-seek";
    seek.min = "0";
    seek.max = "1000";
    seek.step = "1";
    seek.value = "0";
    seek.setAttribute("aria-label", "Seek");
    if (!timelineSupported) {
        seek.disabled = true;
        seek.classList.add("is-disabled");
    }

    const row = document.createElement("div");
    row.className = "mjr-mfv-simple-player-row";

    const playPauseBtn = document.createElement("button");
    playPauseBtn.type = "button";
    playPauseBtn.className = "mjr-icon-btn mjr-mfv-simple-player-btn";
    playPauseBtn.setAttribute("aria-label", "Play/Pause");
    const playPauseIcon = document.createElement("i");
    playPauseIcon.className = "pi pi-pause";
    playPauseIcon.setAttribute("aria-hidden", "true");
    playPauseBtn.appendChild(playPauseIcon);

    const stepBackBtn = document.createElement("button");
    stepBackBtn.type = "button";
    stepBackBtn.className = "mjr-icon-btn mjr-mfv-simple-player-btn";
    stepBackBtn.setAttribute("aria-label", "Step back");
    const stepBackIcon = document.createElement("i");
    stepBackIcon.className = "pi pi-step-backward";
    stepBackIcon.setAttribute("aria-hidden", "true");
    stepBackBtn.appendChild(stepBackIcon);

    const stepForwardBtn = document.createElement("button");
    stepForwardBtn.type = "button";
    stepForwardBtn.className = "mjr-icon-btn mjr-mfv-simple-player-btn";
    stepForwardBtn.setAttribute("aria-label", "Step forward");
    const stepForwardIcon = document.createElement("i");
    stepForwardIcon.className = "pi pi-step-forward";
    stepForwardIcon.setAttribute("aria-hidden", "true");
    stepForwardBtn.appendChild(stepForwardIcon);

    const timeLabel = document.createElement("div");
    timeLabel.className = "mjr-mfv-simple-player-time";
    timeLabel.textContent = "0:00 / 0:00";

    const frameLabel = document.createElement("div");
    frameLabel.className = "mjr-mfv-simple-player-frame";
    frameLabel.textContent = "F: 0";
    if (!videoKind) frameLabel.style.display = "none";

    const muteBtn = document.createElement("button");
    muteBtn.type = "button";
    muteBtn.className = "mjr-icon-btn mjr-mfv-simple-player-btn";
    muteBtn.setAttribute("aria-label", "Mute/Unmute");
    const muteIcon = document.createElement("i");
    muteIcon.className = "pi pi-volume-up";
    muteIcon.setAttribute("aria-hidden", "true");
    muteBtn.appendChild(muteIcon);

    if (!videoKind) {
        stepBackBtn.disabled = true;
        stepForwardBtn.disabled = true;
        stepBackBtn.classList.add("is-disabled");
        stepForwardBtn.classList.add("is-disabled");
    }

    row.appendChild(stepBackBtn);
    row.appendChild(playPauseBtn);
    row.appendChild(stepForwardBtn);
    row.appendChild(timeLabel);
    row.appendChild(frameLabel);
    row.appendChild(muteBtn);

    controls.appendChild(seek);
    controls.appendChild(row);

    root.appendChild(mediaEl);
    if (audioKind) {
        const audioBackdrop = document.createElement("div");
        audioBackdrop.className = "mjr-mfv-simple-player-audio-backdrop";
        audioBackdrop.textContent = String(fileData?.filename || "Audio");
        root.appendChild(audioBackdrop);
    }
    root.appendChild(controls);

    try {
        if (mediaEl instanceof HTMLMediaElement) {
            mediaEl.controls = false;
            mediaEl.playsInline = true;
            mediaEl.loop = true;
            mediaEl.muted = true;
            mediaEl.autoplay = true;
        }
    } catch (e) {
        console.debug?.(e);
    }

    const animatedSrc = animatedImage ? String(mediaEl?.src || "") : "";
    let animatedPaused = false;
    let animatedSnapshot = "";

    const updatePlayPauseIcon = () => {
        if (timelineSupported) {
            playPauseIcon.className = mediaEl.paused ? "pi pi-play" : "pi pi-pause";
            return;
        }
        if (animatedImage) {
            playPauseIcon.className = animatedPaused ? "pi pi-play" : "pi pi-pause";
            return;
        }
        playPauseIcon.className = "pi pi-play";
    };

    const updateMuteIcon = () => {
        if (mediaEl instanceof HTMLMediaElement) {
            muteIcon.className = mediaEl.muted ? "pi pi-volume-off" : "pi pi-volume-up";
            return;
        }
        muteIcon.className = "pi pi-volume-off";
        muteBtn.disabled = true;
        muteBtn.classList.add("is-disabled");
    };

    const updateFrameLabel = () => {
        if (!videoKind || !(mediaEl instanceof HTMLVideoElement)) return;
        const current = frameFromTime(mediaEl, fps);
        const max = maxFrameFromDuration(mediaEl, fps);
        frameLabel.textContent = max > 0 ? `F: ${current}/${max}` : `F: ${current}`;
    };

    const updateSeekProgressPaint = () => {
        const pct = Math.max(0, Math.min(100, (Number(seek.value) / 1000) * 100));
        seek.style.setProperty("--mjr-seek-pct", `${pct}%`);
    };

    const updateTimeAndSeek = () => {
        if (!timelineSupported) {
            timeLabel.textContent = animatedImage ? "Animated" : "Preview";
            seek.value = "0";
            updateSeekProgressPaint();
            return;
        }
        const currentTime = Number(mediaEl.currentTime || 0);
        const duration = Number(mediaEl.duration || 0);
        if (Number.isFinite(duration) && duration > 0) {
            const ratio = Math.max(0, Math.min(1, currentTime / duration));
            seek.value = String(Math.round(ratio * 1000));
            timeLabel.textContent = `${formatDuration(currentTime)} / ${formatDuration(duration)}`;
        } else {
            seek.value = "0";
            timeLabel.textContent = `${formatDuration(currentTime)} / 0:00`;
        }
        updateSeekProgressPaint();
    };

    const stopEvent = (e) => {
        try {
            e?.stopPropagation?.();
        } catch {
            // ignore
        }
    };

    const onPlayPause = (e) => {
        stopEvent(e);
        try {
            if (timelineSupported) {
                if (mediaEl.paused) safePlay(mediaEl);
                else mediaEl.pause?.();
            } else if (animatedImage) {
                if (!animatedPaused) {
                    if (!animatedSnapshot)
                        animatedSnapshot = tryBuildStaticSnapshotFromImage(mediaEl);
                    if (animatedSnapshot) mediaEl.src = animatedSnapshot;
                    animatedPaused = true;
                } else {
                    const restartSrc = animatedSrc
                        ? `${animatedSrc}${animatedSrc.includes("?") ? "&" : "?"}mjr_anim=${Date.now()}`
                        : mediaEl.src;
                    mediaEl.src = restartSrc;
                    animatedPaused = false;
                }
            }
        } catch (err) {
            console.debug?.(err);
        }
        updatePlayPauseIcon();
    };

    const onStep = (delta, e) => {
        stopEvent(e);
        if (!videoKind || !(mediaEl instanceof HTMLVideoElement)) return;
        try {
            mediaEl.pause?.();
        } catch (err) {
            console.debug?.(err);
        }
        const current = frameFromTime(mediaEl, fps);
        seekToFrame(mediaEl, current + delta, fps);
        updatePlayPauseIcon();
        updateFrameLabel();
        updateTimeAndSeek();
    };

    const onMute = (e) => {
        stopEvent(e);
        if (!(mediaEl instanceof HTMLMediaElement)) return;
        try {
            mediaEl.muted = !mediaEl.muted;
        } catch (err) {
            console.debug?.(err);
        }
        updateMuteIcon();
    };

    const onSeekInput = (e) => {
        stopEvent(e);
        if (!timelineSupported) return;
        updateSeekProgressPaint();
        const duration = Number(mediaEl.duration || 0);
        if (!Number.isFinite(duration) || duration <= 0) return;
        const ratio = Math.max(0, Math.min(1, Number(seek.value) / 1000));
        try {
            mediaEl.currentTime = duration * ratio;
        } catch (err) {
            console.debug?.(err);
        }
        updateFrameLabel();
        updateTimeAndSeek();
    };

    const stopControlEvent = (e) => stopEvent(e);

    const focusPlayerRoot = (e) => {
        try {
            if (e?.target?.closest?.("button, input, textarea, select")) return;
            root.focus?.({ preventScroll: true });
        } catch (err) {
            console.debug?.(err);
        }
    };

    const onPlayerKeydown = (e) => {
        const key = String(e?.key || "");
        if (!key || e?.altKey || e?.ctrlKey || e?.metaKey) return;

        if (key === " " || key === "Spacebar") {
            e.preventDefault?.();
            onPlayPause(e);
            return;
        }

        if (key === "ArrowLeft") {
            if (!videoKind) return;
            e.preventDefault?.();
            onStep(-1, e);
            return;
        }

        if (key === "ArrowRight") {
            if (!videoKind) return;
            e.preventDefault?.();
            onStep(1, e);
        }
    };

    playPauseBtn.addEventListener("click", onPlayPause);
    stepBackBtn.addEventListener("click", (e) => onStep(-1, e));
    stepForwardBtn.addEventListener("click", (e) => onStep(1, e));
    muteBtn.addEventListener("click", onMute);
    seek.addEventListener("input", onSeekInput);

    controls.addEventListener("pointerdown", stopControlEvent);
    controls.addEventListener("click", stopControlEvent);
    controls.addEventListener("dblclick", stopControlEvent);
    root.addEventListener("pointerdown", focusPlayerRoot);
    root.addEventListener("keydown", onPlayerKeydown);

    if (mediaEl instanceof HTMLMediaElement) {
        mediaEl.addEventListener("play", updatePlayPauseIcon, { passive: true });
        mediaEl.addEventListener("pause", updatePlayPauseIcon, { passive: true });
        mediaEl.addEventListener(
            "timeupdate",
            () => {
                updateFrameLabel();
                updateTimeAndSeek();
            },
            { passive: true },
        );
        mediaEl.addEventListener(
            "seeked",
            () => {
                updateFrameLabel();
                updateTimeAndSeek();
            },
            { passive: true },
        );
        mediaEl.addEventListener(
            "loadedmetadata",
            () => {
                updateFrameLabel();
                updateTimeAndSeek();
            },
            { passive: true },
        );
    }

    safePlay(mediaEl);
    updatePlayPauseIcon();
    updateMuteIcon();
    updateFrameLabel();
    updateTimeAndSeek();

    return root;
}
