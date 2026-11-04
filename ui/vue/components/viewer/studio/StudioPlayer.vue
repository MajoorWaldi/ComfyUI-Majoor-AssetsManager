<script setup lang="ts">
/**
 * StudioPlayer.vue - modern video/audio player of the Studio viewer.
 *
 * Built for reviewing generated media: frame-accurate stepping, frame counter,
 * A-B loop, speed, loop, volume, fullscreen and "export this frame".
 * Keyboard shortcuts are handled by the viewer and forwarded through the
 * exposed API so they work wherever the focus is inside the overlay.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { t } from "../../../../app/i18n.js";
import {
    PLAYBACK_RATES,
    formatMediaTime,
    frameAtTime,
    loopWrapTarget,
    normalizeLoop,
    stepFrameTime,
    totalFrames,
} from "../../../../features/viewer/studio/studioMedia.js";

const props = defineProps<{
    src: string;
    kind: "video" | "audio";
    fps?: number | null;
    frameCount?: number | null;
    filename?: string;
    /** Start muted / at this speed (the floating viewer carries them across assets). */
    initialMuted?: boolean;
    initialRate?: number;
    /** Tighter controls for small hosts (floating viewer). */
    compact?: boolean;
}>();

const emit = defineEmits<{ (e: "ended"): void }>();

const media = ref<HTMLVideoElement | HTMLAudioElement | null>(null);
const root = ref<HTMLElement | null>(null);
const track = ref<HTMLElement | null>(null);

const playing = ref(false);
const current = ref(0);
const duration = ref(0);
const bufferedEnd = ref(0);
const volume = ref(1);
const muted = ref(!!props.initialMuted);
const rate = ref(Number(props.initialRate) > 0 ? Number(props.initialRate) : 1);
const loop = ref(true);
const loopA = ref<number | null>(null);
const loopB = ref<number | null>(null);
const hoverPct = ref<number | null>(null);
const scrubbing = ref(false);
const controlsVisible = ref(true);
const error = ref("");
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let rafId = 0;

const fpsValue = computed(() => (props.fps && props.fps > 0 ? props.fps : null));
const frame = computed(() => frameAtTime(current.value, fpsValue.value));
const frames = computed(() => totalFrames(duration.value, fpsValue.value, props.frameCount));
const progressPct = computed(() =>
    duration.value > 0 ? (current.value / duration.value) * 100 : 0,
);
const bufferedPct = computed(() =>
    duration.value > 0 ? (bufferedEnd.value / duration.value) * 100 : 0,
);
const loopRange = computed(() => normalizeLoop({ a: loopA.value, b: loopB.value }, duration.value));
const loopStyle = computed(() => {
    if (!loopRange.value || duration.value <= 0) return null;
    const left = (loopRange.value.a / duration.value) * 100;
    const width = ((loopRange.value.b - loopRange.value.a) / duration.value) * 100;
    return { left: `${left}%`, width: `${width}%` };
});
const hoverTime = computed(() =>
    hoverPct.value == null || duration.value <= 0 ? null : (hoverPct.value / 100) * duration.value,
);

function el(): HTMLMediaElement | null {
    return media.value as HTMLMediaElement | null;
}

function tick() {
    const m = el();
    if (m) {
        current.value = m.currentTime || 0;
        const wrap = loopWrapTarget(
            current.value,
            { a: loopA.value, b: loopB.value },
            duration.value,
        );
        if (wrap != null && playing.value) {
            m.currentTime = wrap;
            current.value = wrap;
        }
    }
    if (playing.value) rafId = requestAnimationFrame(tick);
}

function onPlay() {
    playing.value = true;
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
    scheduleHide();
}
function onPause() {
    playing.value = false;
    cancelAnimationFrame(rafId);
    showControls();
}
function onLoaded() {
    const m = el();
    duration.value = Number.isFinite(m?.duration) ? Number(m?.duration) : 0;
    error.value = "";
    if (m) {
        m.volume = volume.value;
        m.muted = muted.value;
        m.playbackRate = rate.value;
    }
}
function onTimeUpdate() {
    const m = el();
    if (!m) return;
    if (!playing.value) current.value = m.currentTime || 0;
    try {
        const ranges = m.buffered;
        bufferedEnd.value = ranges.length ? ranges.end(ranges.length - 1) : 0;
    } catch {
        bufferedEnd.value = 0;
    }
}
function onEnded() {
    if (loop.value && !loopRange.value) {
        const m = el();
        if (m) {
            m.currentTime = 0;
            void m.play()?.catch?.(() => {});
        }
        return;
    }
    emit("ended");
}
function onError() {
    error.value = t("viewer.studio.mediaError", "This file cannot be played by the browser.");
}

function togglePlay() {
    const m = el();
    if (!m) return;
    if (m.paused) void m.play()?.catch?.(() => {});
    else m.pause();
}

function seek(time: number) {
    const m = el();
    if (!m || !Number.isFinite(time)) return;
    const max = duration.value > 0 ? duration.value : time;
    m.currentTime = Math.max(0, Math.min(time, max));
    current.value = m.currentTime;
}

function stepFrame(delta: number) {
    const m = el();
    if (!m) return;
    if (!m.paused) m.pause();
    seek(stepFrameTime(m.currentTime || 0, fpsValue.value, delta, duration.value));
}

function seekBy(seconds: number) {
    seek((el()?.currentTime || 0) + seconds);
}

function pctFromEvent(event: PointerEvent): number {
    const rect = track.value?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return 0;
    return Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
}

function onTrackPointerDown(event: PointerEvent) {
    if (duration.value <= 0) return;
    scrubbing.value = true;
    (event.currentTarget as HTMLElement)?.setPointerCapture?.(event.pointerId);
    seek((pctFromEvent(event) / 100) * duration.value);
}
function onTrackPointerMove(event: PointerEvent) {
    hoverPct.value = pctFromEvent(event);
    if (scrubbing.value) seek((hoverPct.value / 100) * duration.value);
}
function onTrackPointerUp(event: PointerEvent) {
    scrubbing.value = false;
    (event.currentTarget as HTMLElement)?.releasePointerCapture?.(event.pointerId);
}

function setRate(next: number) {
    rate.value = next;
    const m = el();
    if (m) m.playbackRate = next;
}
function cycleRate(direction = 1, wrap = false) {
    const list = PLAYBACK_RATES as readonly number[];
    const idx = list.indexOf(rate.value);
    let nextIdx = (idx < 0 ? list.indexOf(1) : idx) + direction;
    if (wrap) nextIdx = (nextIdx + list.length) % list.length;
    setRate(list[Math.max(0, Math.min(list.length - 1, nextIdx))]);
}
function toggleMute() {
    muted.value = !muted.value;
    const m = el();
    if (m) m.muted = muted.value;
}
const volumeDragging = ref(false);
function onVolumePointer(event: PointerEvent) {
    if (event.type === "pointerdown") {
        volumeDragging.value = true;
        (event.currentTarget as HTMLElement)?.setPointerCapture?.(event.pointerId);
    } else if (!volumeDragging.value) {
        return;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const value = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 1;
    setVolume(Math.round(Math.max(0, Math.min(1, value)) * 20) / 20);
}
function setVolume(next: number) {
    volume.value = next;
    const m = el();
    if (m) {
        m.volume = volume.value;
        if (volume.value > 0 && muted.value) {
            muted.value = false;
            m.muted = false;
        }
    }
}
function setLoopA() {
    loopA.value = current.value;
    if (loopB.value != null && loopB.value <= loopA.value) loopB.value = null;
}
function setLoopB() {
    loopB.value = current.value;
    if (loopA.value == null) loopA.value = 0;
}
function clearLoop() {
    loopA.value = null;
    loopB.value = null;
}
function toggleFullscreen() {
    const target = root.value;
    if (!target) return;
    if (document.fullscreenElement) void document.exitFullscreen?.();
    else void target.requestFullscreen?.();
}

async function exportFrame() {
    const m = el();
    if (props.kind !== "video" || !(m instanceof HTMLVideoElement) || !m.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = m.videoWidth;
    canvas.height = m.videoHeight;
    canvas.getContext("2d")?.drawImage(m, 0, 0);
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const base = String(props.filename || "frame").replace(/\.[^.]+$/, "");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${base}_f${String(frame.value).padStart(5, "0")}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function showControls() {
    controlsVisible.value = true;
    scheduleHide();
}
function scheduleHide() {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
        if (playing.value && !scrubbing.value && props.kind === "video")
            controlsVisible.value = false;
    }, 2200);
}

/** Release the decoder and stream (a detached, merely paused element keeps them). */
function releaseMedia() {
    const m = el();
    if (!m) return;
    try {
        m.pause();
        m.removeAttribute("src");
        m.load();
    } catch (e) {
        console.debug?.(e);
    }
}

watch(
    () => props.src,
    () => {
        clearLoop();
        current.value = 0;
        duration.value = 0;
        bufferedEnd.value = 0;
        error.value = "";
    },
);

/** Autoplay; when the browser refuses sound, retry muted (still visible). */
function autoplay() {
    const m = el();
    if (!m) return;
    m.muted = muted.value;
    m.playbackRate = rate.value;
    const attempt = m.play?.();
    if (attempt && typeof attempt.catch === "function") {
        attempt.catch(() => {
            if (m.muted) return;
            muted.value = true;
            m.muted = true;
            void m.play?.()?.catch?.(() => {});
        });
    }
}

onMounted(autoplay);

onBeforeUnmount(() => {
    cancelAnimationFrame(rafId);
    if (hideTimer) clearTimeout(hideTimer);
    releaseMedia();
});

defineExpose({
    togglePlay,
    play: autoplay,
    stepFrame,
    seekBy,
    cycleRate,
    toggleMute,
    setLoopA,
    setLoopB,
    clearLoop,
    toggleFullscreen,
    exportFrame,
    release: releaseMedia,
});
</script>

<template>
    <div
        ref="root"
        class="mjr-studio-player"
        :class="{
            'is-audio': kind === 'audio',
            'is-compact': compact,
            'controls-hidden': !controlsVisible,
        }"
        @pointermove="showControls"
    >
        <video
            v-if="kind === 'video'"
            ref="media"
            class="mjr-studio-player__media"
            :src="src"
            playsinline
            preload="auto"
            @click="togglePlay"
            @dblclick="toggleFullscreen"
            @play="onPlay"
            @pause="onPause"
            @loadedmetadata="onLoaded"
            @timeupdate="onTimeUpdate"
            @progress="onTimeUpdate"
            @ended="onEnded"
            @error="onError"
        />
        <div v-else class="mjr-studio-player__audio-art" @click="togglePlay">
            <i class="pi pi-volume-up" aria-hidden="true" />
            <span>{{ filename }}</span>
            <audio
                ref="media"
                :src="src"
                preload="auto"
                @play="onPlay"
                @pause="onPause"
                @loadedmetadata="onLoaded"
                @timeupdate="onTimeUpdate"
                @progress="onTimeUpdate"
                @ended="onEnded"
                @error="onError"
            />
        </div>

        <MButton
            v-if="!playing && !error"
            type="button"
            class="mjr-studio-player__big-play"
            :aria-label="t('viewer.studio.play', 'Play')"
            @click="togglePlay"
        >
            <i class="pi pi-play" aria-hidden="true" />
        </MButton>
        <div v-if="error" class="mjr-studio-player__error">{{ error }}</div>

        <div class="mjr-studio-player__controls" @pointerdown.stop>
            <div
                ref="track"
                class="mjr-studio-player__track"
                role="slider"
                :aria-label="t('viewer.studio.seek', 'Seek')"
                :aria-valuemin="0"
                :aria-valuemax="duration"
                :aria-valuenow="current"
                @pointerdown="onTrackPointerDown"
                @pointermove="onTrackPointerMove"
                @pointerup="onTrackPointerUp"
                @pointerleave="hoverPct = null"
            >
                <div class="mjr-studio-player__buffered" :style="{ width: `${bufferedPct}%` }" />
                <div v-if="loopStyle" class="mjr-studio-player__loop" :style="loopStyle" />
                <div class="mjr-studio-player__progress" :style="{ width: `${progressPct}%` }" />
                <div class="mjr-studio-player__thumb" :style="{ left: `${progressPct}%` }" />
                <div
                    v-if="hoverTime != null"
                    class="mjr-studio-player__hover"
                    :style="{ left: `${hoverPct}%` }"
                >
                    {{ formatMediaTime(hoverTime)
                    }}<template v-if="fpsValue">
                        · f{{ frameAtTime(hoverTime, fpsValue) }}</template
                    >
                </div>
            </div>

            <div class="mjr-studio-player__row">
                <MButton
                    type="button"
                    class="mjr-studio-btn"
                    :title="t('viewer.studio.playPause', 'Play / pause (Space)')"
                    @click="togglePlay"
                >
                    <i :class="playing ? 'pi pi-pause' : 'pi pi-play'" aria-hidden="true" />
                </MButton>
                <template v-if="kind === 'video'">
                    <MButton
                        type="button"
                        class="mjr-studio-btn"
                        :title="t('viewer.studio.prevFrame', 'Previous frame (,)')"
                        @click="stepFrame(-1)"
                    >
                        <i class="pi pi-step-backward" aria-hidden="true" />
                    </MButton>
                    <MButton
                        type="button"
                        class="mjr-studio-btn"
                        :title="t('viewer.studio.nextFrame', 'Next frame (.)')"
                        @click="stepFrame(1)"
                    >
                        <i class="pi pi-step-forward" aria-hidden="true" />
                    </MButton>
                </template>

                <span class="mjr-studio-player__time">
                    {{ formatMediaTime(current) }}
                    <span class="is-dim">/ {{ formatMediaTime(duration) }}</span>
                </span>
                <span
                    v-if="kind === 'video' && fpsValue"
                    class="mjr-studio-chip"
                    :title="t('viewer.studio.frame', 'Frame')"
                >
                    f {{ frame }}<template v-if="frames"> / {{ frames - 1 }}</template> ·
                    {{ Math.round(fpsValue * 100) / 100 }} fps
                </span>

                <span class="mjr-studio-player__spacer" />

                <div
                    class="mjr-studio-player__group"
                    :title="t('viewer.studio.abLoop', 'A-B loop (I / O, U to clear)')"
                >
                    <MButton
                        type="button"
                        class="mjr-studio-btn is-text"
                        :class="{ 'is-on': loopA != null }"
                        @click="setLoopA"
                        >A</MButton
                    >
                    <MButton
                        type="button"
                        class="mjr-studio-btn is-text"
                        :class="{ 'is-on': loopB != null }"
                        @click="setLoopB"
                        >B</MButton
                    >
                    <MButton
                        v-if="loopA != null || loopB != null"
                        type="button"
                        class="mjr-studio-btn"
                        :title="t('viewer.studio.clearLoop', 'Clear A-B loop')"
                        @click="clearLoop"
                    >
                        <i class="pi pi-times" aria-hidden="true" />
                    </MButton>
                </div>
                <MButton
                    type="button"
                    class="mjr-studio-btn"
                    :class="{ 'is-on': loop }"
                    :title="t('viewer.studio.loop', 'Loop')"
                    @click="loop = !loop"
                >
                    <i class="pi pi-replay" aria-hidden="true" />
                </MButton>
                <MButton
                    type="button"
                    class="mjr-studio-btn is-text"
                    :class="{ 'is-on': rate !== 1 }"
                    :title="t('viewer.studio.speed', 'Speed ([ / ])')"
                    @click="cycleRate(1, true)"
                    >{{ rate }}×</MButton
                >
                <div class="mjr-studio-player__group">
                    <MButton
                        type="button"
                        class="mjr-studio-btn"
                        :title="t('viewer.studio.mute', 'Mute (M)')"
                        @click="toggleMute"
                    >
                        <i
                            :class="muted || volume === 0 ? 'pi pi-volume-off' : 'pi pi-volume-up'"
                            aria-hidden="true"
                        />
                    </MButton>
                    <div
                        class="mjr-studio-player__volume"
                        role="slider"
                        :aria-label="t('viewer.studio.volume', 'Volume')"
                        :aria-valuemin="0"
                        :aria-valuemax="1"
                        :aria-valuenow="muted ? 0 : volume"
                        @pointerdown="onVolumePointer"
                        @pointermove="onVolumePointer"
                        @pointerup="volumeDragging = false"
                    >
                        <div
                            class="mjr-studio-player__volume-fill"
                            :style="{ width: `${(muted ? 0 : volume) * 100}%` }"
                        />
                    </div>
                </div>
                <MButton
                    v-if="kind === 'video'"
                    type="button"
                    class="mjr-studio-btn"
                    :title="t('viewer.studio.exportFrame', 'Save this frame as PNG')"
                    @click="exportFrame"
                >
                    <i class="pi pi-camera" aria-hidden="true" />
                </MButton>
                <MButton
                    v-if="kind === 'video'"
                    type="button"
                    class="mjr-studio-btn"
                    :title="t('viewer.studio.fullscreen', 'Fullscreen (F)')"
                    @click="toggleFullscreen"
                >
                    <i class="pi pi-window-maximize" aria-hidden="true" />
                </MButton>
            </div>
        </div>
    </div>
</template>
