<script setup>
/**
 * AssetCardInner.vue — Fragment component rendered inside an imperatively-created
 * `.mjr-asset-card` shell.  Replaces createAssetCard()/createThumbnail() from Card.js.
 *
 * The outer `.mjr-asset-card` element is created by GridView_impl.js (createVueCard)
 * so the VirtualGrid / GridSelectionManager / keyboard / context-menu code can still
 * locate cards via querySelector('.mjr-asset-card') and read card._mjrAsset.
 *
 * Phase 4.2 — full inner card replacement.
 */
import { computed, ref, watch, watchEffect, onUnmounted } from "vue";
import { buildAssetViewURL } from "../../../api/endpoints.js";
import {
    genTimeColor,
    createWorkflowDot,
    normalizeGenerationTimeMs,
} from "../../../components/Badges.js";
import { formatDuration, formatDate, formatTime } from "../../../utils/format.js";
import { MediaBlobCache } from "../../../features/grid/MediaBlobCache.js";
import RatingBadge from "../common/RatingBadge.vue";
import TagsBadge from "../common/TagsBadge.vue";
import GenTimeBadge from "../common/GenTimeBadge.vue";

// ─── Audio thumbnail URL ─────────────────────────────────────────────────────

const AUDIO_THUMB_URL = (() => {
    try {
        return new URL("../../../assets/audio-thumbnails.png", import.meta.url).href;
    } catch {
        return "";
    }
})();

// Audio waveform bars SVG (same bars as Card.js)
const AUDIO_BARS = [
    [2, 10, 3, 12], [8, 4, 3, 24], [14, 8, 3, 16], [20, 2, 3, 28],
    [26, 6, 3, 20], [32, 1, 3, 30], [38, 5, 3, 22], [44, 3, 3, 26],
    [50, 9, 3, 14], [56, 6, 3, 20],
];

/**
 * Load image using the session blob cache for instant re-access.
 * Falls back to direct URL if cache fails.
 */
async function loadImageBlob(url) {
    if (!url) return null;
    try {
        if (MediaBlobCache.hasError(url)) return url;
        const cachedUrl = await MediaBlobCache.acquireUrl(url);
        return cachedUrl || url;
    } catch {
        return url;
    }
}

/**
 * Load video thumbnail using the session blob cache for instant re-access.
 * Falls back to direct URL if cache fails.
 */
async function observeVideoThumb(video) {
    if (!video) return;
    try {
        const src = String(video.dataset?.src || "").trim();
        if (!src || video.getAttribute("src")) return;
        
        // Check if already errored
        if (MediaBlobCache.hasError(src)) {
            video.src = src; // Let browser show error
            return;
        }
        
        // Try to get from blob cache (or fetch + cache)
        const cachedUrl = await MediaBlobCache.acquireUrl(src);
        if (cachedUrl) {
            video.src = cachedUrl;
            video._mjrCachedSrc = src; // Track original URL for release
        } else {
            // Fallback to direct URL if blob cache fails
            video.src = src;
        }
        video.load?.();
    } catch (e) {
        console.debug?.(e);
        // Fallback
        try {
            const src = String(video.dataset?.src || "").trim();
            if (src && !video.getAttribute("src")) {
                video.src = src;
                video.load?.();
            }
        } catch {}
    }
}

function bindVideoThumbHover(thumbEl, video) {
    if (!thumbEl || !video) return;
    const onEnter = () => {
        try {
            video.play?.().catch?.(() => {});
        } catch (e) {
            console.debug?.(e);
        }
    };
    const onLeave = () => {
        try {
            video.pause?.();
            video.currentTime = 0;
        } catch (e) {
            console.debug?.(e);
        }
    };
    thumbEl.addEventListener("mouseenter", onEnter);
    thumbEl.addEventListener("mouseleave", onLeave);
    video._mjrHoverCleanup = () => {
        try {
            thumbEl.removeEventListener("mouseenter", onEnter);
            thumbEl.removeEventListener("mouseleave", onLeave);
        } catch (e) {
            console.debug?.(e);
        }
    };
}

function unobserveVideoThumb(video) {
    if (!video) return;
    try {
        video._mjrHoverCleanup?.();
        video._mjrHoverCleanup = null;
    } catch (e) {
        console.debug?.(e);
    }
}

// ─── Props ───────────────────────────────────────────────────────────────────

const props = defineProps({
    /** shallowReactive asset object from createVueCard() in GridView_impl.js */
    asset: { type: Object, required: true },
});

// ─── Computed from asset ─────────────────────────────────────────────────────

const kind = computed(() => String(props.asset.kind || "image").toLowerCase());
const isImage = computed(() => kind.value === "image");
const isVideo = computed(() => kind.value === "video");
const isAudio = computed(() => kind.value === "audio");
const isModel3D = computed(() => kind.value === "model3d");

const viewUrl = computed(() => buildAssetViewURL(props.asset) || "");
const posterUrl = computed(() =>
    String(props.asset.thumbnail_url || props.asset.thumb_url || props.asset.poster || "").trim(),
);

const filename = computed(() => String(props.asset.filename || ""));
const ext = computed(() => {
    const f = filename.value;
    return f.includes(".") ? f.split(".").pop().toUpperCase() : "";
});
const displayName = computed(() => {
    const f = filename.value;
    return f.includes(".") ? f.slice(0, f.lastIndexOf(".")) : f;
});

const rating = computed(() => Number(props.asset.rating) || 0);
const tags = computed(() => props.asset.tags || []);

const genTimeMs = computed(() => {
    const raw = props.asset.generation_time_ms ?? props.asset.metadata?.generation_time_ms ?? 0;
    return normalizeGenerationTimeMs(raw);
});
const genTimeValid = computed(() => genTimeMs.value > 0);
const genTimeSecs = computed(() => (genTimeMs.value / 1000).toFixed(1));
const genTimeColorVal = computed(() => genTimeColor(genTimeMs.value));

const positivePrompt = computed(() => String(props.asset.positive_prompt || "").trim());

const resolution = computed(() => {
    const { width, height } = props.asset;
    return width && height ? `${width}x${height}` : "";
});
const durationStr = computed(() =>
    props.asset.duration ? formatDuration(props.asset.duration) : "",
);

const timestamp = computed(
    () =>
        props.asset.generation_time ||
        props.asset.file_creation_time ||
        props.asset.mtime ||
        props.asset.created_at,
);
const dateStr = computed(() => (timestamp.value ? formatDate(timestamp.value) : ""));
const timeStr = computed(() => (timestamp.value ? formatTime(timestamp.value) : ""));

// File badge collision state
const hasCollision = computed(() => !!props.asset._mjrNameCollision && !props.asset._mjrDupStack);
const fileBadgeBg = computed(() => {
    if (hasCollision.value) return "var(--mjr-badge-duplicate-alert, #ff1744)";
    const map = {
        image: "var(--mjr-badge-image, #2196F3)",
        video: "var(--mjr-badge-video, #F44336)",
        audio: "var(--mjr-badge-audio, #4CAF50)",
        model3d: "var(--mjr-badge-model3d, #9C27B0)",
    };
    return map[kind.value] || "var(--mjr-badge-image, #888)";
});

// ─── Template refs ───────────────────────────────────────────────────────────

const thumbRef = ref(null);
const videoRef = ref(null);
const imgRef = ref(null);
const dotWrapperRef = ref(null);
const imgError = ref(false);
const model3dImgError = ref(false);
const cachedImageSrc = ref("");

// ─── Image thumb lifecycle (blob cache) ───────────────────────────────────────

watch(
    () => [imgRef.value, viewUrl.value],
    async ([img, url]) => {
        if (!img || !url || imgError.value) return;
        try {
            const cached = await loadImageBlob(url);
            if (cached && cached !== cachedImageSrc.value) {
                cachedImageSrc.value = cached;
            }
        } catch {}
    },
    { immediate: true }
);

// ─── Video thumb lifecycle (observe/unobserve) ────────────────────────────────

watch(videoRef, (newEl, oldEl) => {
    if (oldEl) {
        try { unobserveVideoThumb(oldEl); } catch {}
    }
    if (newEl && thumbRef.value) {
        try {
            observeVideoThumb(newEl);
            bindVideoThumbHover(thumbRef.value, newEl);
        } catch {}
    }
});

onUnmounted(() => {
    const v = videoRef.value;
    if (v) {
        try { unobserveVideoThumb(v); } catch {}
    }
});

// ─── Workflow dot (imperative — createWorkflowDot has complex enrichment logic) ──

watchEffect(() => {
    const wrapper = dotWrapperRef.value;
    if (!wrapper) return;
    // Access reactive asset fields so watchEffect re-runs on changes.
    const _a = props.asset; // reactive tracking
    try {
        wrapper.textContent = "";
        const dot = createWorkflowDot(_a);
        if (dot) wrapper.appendChild(dot);
    } catch {}
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function onImgError(event) {
    imgError.value = true;
    try { MediaBlobCache.markError(viewUrl.value); } catch {}
}

function onFileBadgeClick(event) {
    if (!hasCollision.value) return;
    event.preventDefault();
    event.stopPropagation();
    const card = event.target?.closest?.(".mjr-asset-card");
    if (!card) return;
    card.dispatchEvent(
        new CustomEvent("mjr:badge-duplicates-focus", {
            bubbles: true,
            detail: {
                filename: filename.value,
                filenameKey: filename.value.toLowerCase(),
                count: Number(props.asset._mjrNameCollisionCount || 0),
                paths: Array.isArray(props.asset._mjrNameCollisionPaths)
                    ? props.asset._mjrNameCollisionPaths
                    : [],
            },
        }),
    );
}
</script>

<template>
    <!-- ── THUMBNAIL ──────────────────────────────────────────────────────── -->
    <div class="mjr-thumb" ref="thumbRef">

        <!-- Image -->
        <template v-if="isImage">
            <img
                v-if="!imgError"
                ref="imgRef"
                class="mjr-thumb-media"
                :alt="filename"
                loading="lazy"
                decoding="async"
                :src="cachedImageSrc || viewUrl"
                @error="onImgError"
            />
            <div v-if="imgError" class="mjr-media-error-placeholder">
                <i class="pi pi-image" />
            </div>
        </template>

        <!-- Video -->
        <template v-else-if="isVideo">
            <video
                ref="videoRef"
                class="mjr-thumb-media"
                :data-src="viewUrl"
                :poster="posterUrl || undefined"
                muted
                loop
                :autoplay="false"
                playsinline
                preload="metadata"
                :draggable="false"
                :tabindex="-1"
                style="pointer-events: none"
            />
            <div class="mjr-thumb-play"><i class="pi pi-play" /></div>
        </template>

        <!-- Audio -->
        <template v-else-if="isAudio">
            <img
                v-if="AUDIO_THUMB_URL"
                class="mjr-thumb-media"
                :src="AUDIO_THUMB_URL"
                :draggable="false"
                loading="lazy"
                alt=""
            />
            <div
                class="mjr-audio-waveform-overlay"
                style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;color:white"
            >
                <svg
                    viewBox="0 0 64 32"
                    preserveAspectRatio="xMidYMid meet"
                    fill="currentColor"
                    opacity="0.35"
                    style="width:60%;max-width:120px;height:auto;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5))"
                >
                    <rect
                        v-for="([x, y, w, h], i) in AUDIO_BARS"
                        :key="i"
                        :x="x" :y="y" :width="w" :height="h"
                        rx="1.5"
                    />
                </svg>
            </div>
        </template>

        <!-- Model 3D -->
        <template v-else-if="isModel3D">
            <div
                class="mjr-model3d-thumb-icon"
                style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.7)"
            >
                <i class="pi pi-box" style="font-size:2.5rem" />
            </div>
        </template>

        <!-- File extension badge -->
        <div
            class="mjr-file-badge mjr-badge-ext"
            :data-mjr-ext="ext"
            :data-mjr-badge-bg="fileBadgeBg"
            :style="{
                position: 'absolute', top: '6px', left: '6px', zIndex: 10,
                background: fileBadgeBg, color: '#fff',
                padding: '2px 5px', borderRadius: '4px',
                fontSize: '10px', fontWeight: '700',
                pointerEvents: hasCollision ? 'auto' : 'none',
                cursor: hasCollision ? 'pointer' : 'default',
            }"
            :title="hasCollision ? `${ext} — duplicate filename (${asset._mjrNameCollisionCount || 2} files)` : `${ext} file`"
            @click="onFileBadgeClick"
        >{{ ext }}{{ hasCollision ? "+" : "" }}</div>

        <!-- Rating badge -->
        <RatingBadge :rating="rating" class="mjr-badge-rating" />

        <!-- Tags badge -->
        <TagsBadge :tags="tags" class="mjr-badge-tags" />

        <!-- Generation time badge -->
        <GenTimeBadge :gen-time-ms="genTimeMs" />

        <!-- Hover info overlay -->
        <div
            v-if="positivePrompt || genTimeValid"
            class="mjr-card-hover-info"
        >
            <div v-if="positivePrompt" class="mjr-hover-prompt">{{ positivePrompt }}</div>
            <div v-if="genTimeValid" class="mjr-hover-gentime">⏱ {{ genTimeSecs }}s</div>
        </div>
    </div>

    <!-- ── META ──────────────────────────────────────────────────────────── -->
    <div class="mjr-card-info mjr-card-meta" style="position:relative;padding:6px 8px;min-width:0">
        <div
            class="mjr-card-filename"
            :title="filename"
            style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:4px;padding-right:12px"
        >{{ displayName }}</div>

        <div
            class="mjr-card-meta-row"
            style="font-size:0.85em;opacity:0.7;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:16px"
        >
            <span v-if="resolution" class="mjr-meta-res" :title="`Resolution: ${resolution}`">
                {{ resolution }}
            </span>
            <span v-if="durationStr" class="mjr-meta-duration" :title="`Duration: ${durationStr}`">
                {{ durationStr }}
            </span>
            <span v-if="dateStr" class="mjr-meta-date" :title="`Date: ${dateStr}`">
                {{ dateStr }}
            </span>
            <span v-if="timeStr" class="mjr-meta-date mjr-meta-time-val" :title="`Time: ${timeStr}`">
                {{ timeStr }}
            </span>
            <span
                v-if="genTimeValid"
                class="mjr-meta-gentime"
                :style="{ color: genTimeColorVal, fontWeight: '500' }"
                :title="`Generation time: ${genTimeSecs} seconds`"
            >{{ genTimeSecs }}s</span>
        </div>

        <!-- Workflow dot (imperatively created by createWorkflowDot) -->
        <div
            ref="dotWrapperRef"
            class="mjr-card-dot-wrapper"
            style="position:absolute;right:8px;bottom:6px;z-index:2"
        />
    </div>
</template>
