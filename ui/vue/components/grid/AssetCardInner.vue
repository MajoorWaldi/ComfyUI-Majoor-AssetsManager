<script setup>
/**
 * AssetCardInner.vue - Fragment component rendered inside an imperatively-created
 * `.mjr-asset-card` shell.  Replaces createAssetCard()/createThumbnail() from Card.js.
 *
 * The outer `.mjr-asset-card` element is created by GridView_impl.js (createVueCard)
 * so the VirtualGrid / GridSelectionManager / keyboard / context-menu code can still
 * locate cards via querySelector('.mjr-asset-card') and read card._mjrAsset.
 *
 * Phase 4.2 - full inner card replacement.
 */
import { computed, inject, ref, watch, watchEffect, onMounted, onBeforeUnmount, onUnmounted } from "vue";
import { buildAssetViewURL } from "../../../api/endpoints.js";
import {
    genTimeColor,
    createWorkflowDot,
    normalizeGenerationTimeMs,
    formatGenTime,
} from "../../../components/Badges.js";
import { formatDuration, formatDate, formatTime } from "../../../utils/format.js";
import { MediaBlobCache } from "../../../features/grid/MediaBlobCache.js";
import { APP_CONFIG } from "../../../app/config.js";
import RatingBadge from "../common/RatingBadge.vue";
import TagsBadge from "../common/TagsBadge.vue";
import GenTimeBadge from "../common/GenTimeBadge.vue";

function hashString(value) {
    let hash = 2166136261;
    const text = String(value || "");
    for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function makeAudioWaveformBars(seedText, count = 34) {
    let seed = hashString(seedText) || 1;
    const bars = [];
    for (let i = 0; i < count; i += 1) {
        seed = Math.imul(seed ^ (seed >>> 15), 2246822519) >>> 0;
        const wave = Math.sin((i / Math.max(1, count - 1)) * Math.PI);
        const random = (seed % 1000) / 1000;
        const height = Math.round(18 + wave * 54 + random * 26);
        bars.push({
            height: Math.max(14, Math.min(92, height)),
            opacity: (0.48 + random * 0.42).toFixed(2),
        });
    }
    return bars;
}

/**
 * Load image using the session blob cache for instant re-access.
 * Falls back to direct URL if cache fails.
 */
async function loadImageBlob(url, options = {}) {
    if (!url) return null;
    try {
        if (MediaBlobCache.hasError(url)) return null;
        const cachedUrl = await MediaBlobCache.acquireUrl(url, options);
        return cachedUrl || null;
    } catch {
        return null;
    }
}

function waitForImageBlobLoadWindow() {
    return new Promise((resolve) => setTimeout(resolve, 120));
}

/**
 * Load video thumbnail using the session blob cache for instant re-access.
 * Falls back to direct URL if cache fails.
 */
async function ensureVideoThumbSource(video) {
    if (!video) return;
    try {
        const src = String(video.dataset?.src || "").trim();
        if (!src || video.getAttribute("src")) return;
        const requestId = (Number(video._mjrVideoLoadRequestId || 0) || 0) + 1;
        video._mjrVideoLoadRequestId = requestId;

        // Check if already errored
        if (MediaBlobCache.hasError(src)) {
            video.src = src; // Let browser show error
            video._mjrSourceKey = src;
            return;
        }

        // Try to get from blob cache (or fetch + cache)
        const cachedUrl = await MediaBlobCache.acquireUrl(src);
        if (video._mjrVideoLoadRequestId !== requestId || !video.isConnected) {
            if (cachedUrl) MediaBlobCache.releaseUrl(src);
            return;
        }
        if (cachedUrl) {
            video.src = cachedUrl;
            video._mjrCachedSrc = src; // Track original URL for release
            video._mjrSourceKey = src;
        } else {
            // Fallback to direct URL if blob cache fails
            video.src = src;
            video._mjrSourceKey = src;
        }
        video.load?.();
    } catch (e) {
        console.debug?.(e);
        // Fallback
        try {
            const src = String(video.dataset?.src || "").trim();
            if (src && !video.getAttribute("src")) {
                video.src = src;
                video._mjrSourceKey = src;
                video.load?.();
            }
        } catch {}
    }
}

function releaseVideoThumbSource(video) {
    if (!video) return;
    try {
        video._mjrVideoLoadRequestId = (Number(video._mjrVideoLoadRequestId || 0) || 0) + 1;
        video.pause?.();
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const sourceKey = String(video._mjrCachedSrc || "").trim();
        if (sourceKey) MediaBlobCache.releaseUrl(sourceKey);
        video._mjrCachedSrc = "";
        video._mjrSourceKey = "";
    } catch (e) {
        console.debug?.(e);
    }
    try {
        if (video.getAttribute("src")) {
            video.removeAttribute("src");
            video.load?.();
        }
    } catch (e) {
        console.debug?.(e);
    }
}

function bindVideoThumbHover(thumbEl, video) {
    if (!thumbEl || !video) return;
    const onEnter = async () => {
        try {
            await ensureVideoThumbSource(video);
            if (!video.isConnected) return;
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

function bindVideoAutoplay(video) {
    if (!video) return;
    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                try {
                    if (entry.isIntersecting) {
                        void ensureVideoThumbSource(video).then(() => {
                            try {
                                if (video.isConnected) video.play?.().catch?.(() => {});
                            } catch (e) {
                                console.debug?.(e);
                            }
                        });
                    } else {
                        video.pause?.();
                        video.currentTime = 0;
                    }
                } catch (e) {
                    console.debug?.(e);
                }
            }
        },
        { threshold: 0.25 },
    );
    observer.observe(video);
    video._mjrAutoplayCleanup = () => {
        try {
            observer.unobserve(video);
            observer.disconnect();
        } catch (e) {
            console.debug?.(e);
        }
    };
}

function cleanupVideoBehaviors(video) {
    if (!video) return;
    try {
        video._mjrHoverCleanup?.();
        video._mjrHoverCleanup = null;
        video._mjrAutoplayCleanup?.();
        video._mjrAutoplayCleanup = null;
        video.pause?.();
        video.currentTime = 0;
    } catch (e) {
        console.debug?.(e);
    }
}

function applyVideoMode(thumbEl, video, mode) {
    if (!video) return;
    cleanupVideoBehaviors(video);
    if (mode === "hover") {
        void ensureVideoThumbSource(video);
        bindVideoThumbHover(thumbEl, video);
    } else if (mode === "always") {
        bindVideoAutoplay(video);
    } else {
        void ensureVideoThumbSource(video);
    }
    // "off" - no bindings, video stays paused
}

function unobserveVideoThumb(video) {
    if (!video) return;
    cleanupVideoBehaviors(video);
    releaseVideoThumbSource(video);
}

// --- Props -------------------------------------------------------------------

const props = defineProps({
    /** shallowReactive asset object from createVueCard() in GridView_impl.js */
    asset: { type: Object, required: true },
});
const emit = defineEmits(["workflow-action"]);

// --- Computed from asset -----------------------------------------------------

const kind = computed(() => String(props.asset.kind || "image").toLowerCase());
const isWorkflow = computed(() => kind.value === "workflow");
const isImage = computed(() => kind.value === "image");
const isVideo = computed(() => kind.value === "video");
const isAudio = computed(() => kind.value === "audio");
const isModel3D = computed(() => kind.value === "model3d");

const viewUrl = computed(() => buildAssetViewURL(props.asset) || "");
const explicitThumbnailUrl = computed(() =>
    String(
        props.asset.thumbnail_url ||
        props.asset.graph_map_thumbnail_url ||
        props.asset.thumb_url ||
        props.asset.poster ||
        "",
    ).trim(),
);
const hasPrimaryWorkflowThumbnail = computed(() =>
    Boolean(String(props.asset.thumbnail_url || props.asset.thumb_url || props.asset.poster || "").trim()),
);
const hasGraphMapWorkflowThumbnail = computed(() =>
    isWorkflow.value &&
    !hasPrimaryWorkflowThumbnail.value &&
    Boolean(String(props.asset.graph_map_thumbnail_url || "").trim()),
);
const explicitPreviewUrl = computed(() =>
    String(props.asset.preview_url || props.asset.previewUrl || props.asset.url || "").trim(),
);
const imageUrl = computed(() => viewUrl.value);
const videoUrl = computed(() => explicitPreviewUrl.value || viewUrl.value);
const posterUrl = computed(() =>
    explicitThumbnailUrl.value,
);

const filename = computed(() => String(props.asset.filename || ""));
const rawDisplayName = computed(() =>
    String(props.asset.display_name || props.asset.displayName || props.asset.name || filename.value || "").trim(),
);
const ext = computed(() => {
    const f = filename.value;
    return f.includes(".") ? f.split(".").pop().toUpperCase() : "";
});
const displayName = computed(() => {
    const f = rawDisplayName.value || filename.value;
    return f.includes(".") ? f.slice(0, f.lastIndexOf(".")) : f;
});
const notes = computed(() => String(props.asset.notes || "").trim());
const audioWaveformBars = computed(() =>
    makeAudioWaveformBars(`${props.asset.id || ""}:${filename.value}:${props.asset.duration || ""}`),
);
const audioThumbTitle = computed(() => displayName.value || filename.value || "Audio");
const audioThumbSubtitle = computed(() => {
    const parts = [durationStr.value, ext.value].filter(Boolean);
    return parts.join(" / ") || "Audio";
});
const cardTitle = computed(() => {
    const parts = [filename.value || rawDisplayName.value];
    const subfolder = String(props.asset.subfolder || props.asset.file_info?.subfolder || "").trim();
    const type = String(props.asset.type || props.asset.source || props.asset.file_info?.type || "").trim();
    if (subfolder) parts.push(`Subfolder: ${subfolder}`);
    if (type) parts.push(`Type: ${type}`);
    if (notes.value) parts.push(`Notes: ${notes.value}`);
    return parts.filter(Boolean).join("\n");
});

const rating = computed(() => Number(props.asset.rating) || 0);
const tags = computed(() => props.asset.tags || []);

const genTimeMs = computed(() => {
    const raw = props.asset.generation_time_ms ?? props.asset.metadata?.generation_time_ms ?? 0;
    return normalizeGenerationTimeMs(raw);
});
const genTimeValid = computed(() => genTimeMs.value > 0);
const genTimeFmt = computed(() => formatGenTime(genTimeMs.value));
const genTimeColorVal = computed(() => genTimeColor(genTimeMs.value));

const positivePrompt = computed(() => String(props.asset.positive_prompt || "").trim());
const isLivePlaceholder = computed(
    () =>
        props.asset?._mjrLivePlaceholder === true ||
        props.asset?.is_live_placeholder === true ||
        String(props.asset?.id || "")
            .trim()
            .toLowerCase()
            .startsWith("live:"),
);
const livePlaceholderLabel = computed(
    () => String(props.asset?._mjrLiveLabel || "In progress").trim() || "In progress",
);
const livePlaceholderTitle = computed(() =>
    `${livePlaceholderLabel.value}: waiting for indexed asset data`,
);

const resolution = computed(() => {
    const { width, height } = props.asset;
    return width && height ? `${width}x${height}` : "";
});
const durationStr = computed(() =>
    props.asset.duration ? formatDuration(props.asset.duration) : "",
);
const workflowTask = computed(() =>
    String(props.asset.task || props.asset.workflow_task || "").trim(),
);
const workflowModel = computed(() =>
    String(props.asset.model_family || props.asset.modelFamily || "").trim(),
);
const workflowRunsOn = computed(() =>
    String(props.asset.runs_on || props.asset.runsOn || "").trim(),
);
const workflowNodeCount = computed(() => Number(props.asset.node_count || props.asset.nodeCount || 0) || 0);
const workflowFavorite = computed(() => Boolean(props.asset.favorite));
const workflowSubgraphCount = computed(() =>
    Number(props.asset.subgraph_count || props.asset.subgraphCount || 0) || 0,
);
const workflowMissingNodesCount = computed(() =>
    Number(props.asset.missing_nodes_count || props.asset.missingNodesCount || 0) || 0,
);
const workflowMissingModelsCount = computed(() =>
    Number(props.asset.missing_models_count || props.asset.missingModelsCount || 0) || 0,
);
const workflowHasMissingDeps = computed(
    () => workflowMissingNodesCount.value > 0 || workflowMissingModelsCount.value > 0,
);
const workflowMissingLabel = computed(() => {
    if (!workflowHasMissingDeps.value) return "";
    const parts = [];
    if (workflowMissingNodesCount.value > 0) parts.push(`${workflowMissingNodesCount.value} node`);
    if (workflowMissingModelsCount.value > 0) parts.push(`${workflowMissingModelsCount.value} model`);
    return `Missing: ${parts.join(" / ")}`;
});

const timestamp = computed(
    () =>
        props.asset.generation_time ||
        props.asset.file_creation_time ||
        props.asset.mtime ||
        props.asset.created_at,
);
const dateStr = computed(() => (timestamp.value ? formatDate(timestamp.value) : ""));
const timeStr = computed(() => (timestamp.value ? formatTime(timestamp.value) : ""));
const metaItems = computed(() =>
    [
        resolution.value
            ? { key: "resolution", className: "mjr-meta-res", title: `Resolution: ${resolution.value}`, text: resolution.value }
            : null,
        durationStr.value
            ? { key: "duration", className: "mjr-meta-duration", title: `Duration: ${durationStr.value}`, text: durationStr.value }
            : null,
        dateStr.value
            ? { key: "date", className: "mjr-meta-date", title: `Date: ${dateStr.value}`, text: dateStr.value }
            : null,
        timeStr.value
            ? { key: "time", className: "mjr-meta-date mjr-meta-time-val", title: `Time: ${timeStr.value}`, text: timeStr.value }
            : null,
        genTimeValid.value
            ? {
                  key: "gentime",
                  className: "mjr-meta-gentime",
                  title: genTimeFmt.value.title,
                  text: genTimeFmt.value.text,
                  style: { color: genTimeColorVal.value, fontWeight: "500" },
              }
            : null,
    ].filter(Boolean),
);

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

// --- Stack / dup-stack (Vue-reactive buttons, replacing imperative DOM) ------

const stackService = inject("mjrStackService", null);

const hasStackGroup = computed(() => {
    if (!stackService) return false;
    const stackId = String(props.asset.stack_id || "").trim();
    if (!stackId) return false;
    return Number(props.asset.stack_asset_count || props.asset._mjrFeedGroupCount || 0) > 1;
});
const stackCount = computed(() =>
    Number(props.asset.stack_asset_count || props.asset._mjrFeedGroupCount || 0) || 0,
);

const hasDupStack = computed(() => !!props.asset._mjrDupStack && Number(props.asset._mjrDupCount || 0) >= 2);
const dupCount = computed(() => Number(props.asset._mjrDupCount || 0) || 0);
const showDupStackButton = computed(() => hasDupStack.value && !hasStackGroup.value);
const stackOpening = ref(false);
const dupOpening = ref(false);

async function onStackGroupClick(event) {
    event.preventDefault();
    event.stopPropagation();
    if (stackOpening.value) return;
    stackOpening.value = true;
    try {
        await stackService?.openStackGroup?.(props.asset);
    } catch (err) {
        console.debug?.(err);
    } finally {
        stackOpening.value = false;
    }
}

function onDupStackClick(event) {
    event.preventDefault();
    event.stopPropagation();
    if (dupOpening.value) return;
    dupOpening.value = true;
    try {
        stackService?.openDupGroup?.(props.asset);
    } catch (err) {
        console.debug?.(err);
    } finally {
        dupOpening.value = false;
    }
}

// --- Template refs -----------------------------------------------------------

const thumbRef = ref(null);
const videoRef = ref(null);
const imgRef = ref(null);
const dotWrapperRef = ref(null);
const imgError = ref(false);
const model3dImgError = ref(false);
const cachedImageSrc = ref("");
let imageLoadRequestId = 0;
let imageCachedSourceKey = "";
let imageErrorSourceKey = "";
let model3dErrorSourceKey = "";

function releaseCachedImageSrc() {
    try {
        if (imageCachedSourceKey) MediaBlobCache.releaseUrl(imageCachedSourceKey);
    } catch (e) {
        console.debug?.(e);
    }
    imageCachedSourceKey = "";
}

// --- Image thumb lifecycle (blob cache) ---------------------------------------

watch(
    () => (isWorkflow.value ? explicitThumbnailUrl.value : isImage.value ? imageUrl.value : ""),
    (source) => {
        const key = String(source || "").trim();
        if (!key || key === imageErrorSourceKey) return;
        imgError.value = false;
        imageErrorSourceKey = "";
    },
    { immediate: true },
);

watch(
    () => (isModel3D.value ? posterUrl.value : ""),
    (source) => {
        const key = String(source || "").trim();
        if (!key || key === model3dErrorSourceKey) return;
        model3dImgError.value = false;
        model3dErrorSourceKey = "";
    },
    { immediate: true },
);

watch(
    () => [isImage.value ? imgRef.value : null, isImage.value ? imageUrl.value : ""],
    async ([img, url], _oldValue, onCleanup) => {
        if (!img || !url || imgError.value) return;
        const requestId = (imageLoadRequestId += 1);
        const controller = new AbortController();
        let cancelled = false;
        onCleanup(() => {
            cancelled = true;
            controller.abort();
        });
        try {
            const currentSourceKey = imageCachedSourceKey || String(img.dataset?.mjrSourceKey || "");
            if (cachedImageSrc.value && currentSourceKey === url) return;
            img.dataset.mjrSourceKey = url;
            await waitForImageBlobLoadWindow();
            if (cancelled || requestId !== imageLoadRequestId || !img.isConnected) return;
            const cached = await loadImageBlob(url, { signal: controller.signal });
            if (cancelled || requestId !== imageLoadRequestId || !img.isConnected) {
                if (cached && cached !== url) MediaBlobCache.releaseUrl(url);
                return;
            }
            if (cached && cached !== cachedImageSrc.value) {
                const previousSourceKey = imageCachedSourceKey;
                cachedImageSrc.value = cached;
                imageCachedSourceKey = cached !== url ? url : "";
                if (previousSourceKey && previousSourceKey !== imageCachedSourceKey) {
                    MediaBlobCache.releaseUrl(previousSourceKey);
                }
            } else if (!cached && imageCachedSourceKey && imageCachedSourceKey !== url) {
                releaseCachedImageSrc();
                cachedImageSrc.value = "";
            }
        } catch {}
    },
    { immediate: true }
);

// --- Video autoplay mode (reactive to settings changes) ----------------------

const videoMode = ref(APP_CONFIG.GRID_VIDEO_AUTOPLAY_MODE || "hover");

function onSettingsChangedForVideo() {
    videoMode.value = APP_CONFIG.GRID_VIDEO_AUTOPLAY_MODE || "hover";
}

onMounted(() => {
    window.addEventListener("mjr-settings-changed", onSettingsChangedForVideo);
});

// --- Video thumb lifecycle (observe/unobserve) --------------------------------

watch(videoRef, (newEl, oldEl) => {
    if (oldEl) {
        try { unobserveVideoThumb(oldEl); } catch {}
    }
    if (newEl && thumbRef.value) {
        try {
            applyVideoMode(thumbRef.value, newEl, videoMode.value);
        } catch {}
    }
});

watch(videoMode, (mode) => {
    const video = videoRef.value;
    const thumb = thumbRef.value;
    if (video && thumb) {
        applyVideoMode(thumb, video, mode);
    }
});

onBeforeUnmount(() => {
    window.removeEventListener("mjr-settings-changed", onSettingsChangedForVideo);
    imageLoadRequestId += 1;
    releaseCachedImageSrc();
    const v = videoRef.value;
    if (v) {
        try { unobserveVideoThumb(v); } catch {}
    }
});

onUnmounted(() => {
    window.removeEventListener("mjr-settings-changed", onSettingsChangedForVideo);
});

// --- Workflow dot (imperative - createWorkflowDot has complex enrichment logic) --

watchEffect(() => {
    const wrapper = dotWrapperRef.value;
    if (!wrapper) return;
    // Access reactive asset fields so watchEffect re-runs on changes.
    // We must explicitly read all properties used by createWorkflowDot/detectAiInfo
    // for Vue to detect updates after backfill operations.
    const _a = props.asset;
    // eslint-disable-next-line no-unused-vars
    const _trackWorkflow = _a?.has_workflow ?? _a?.hasWorkflow;
    // eslint-disable-next-line no-unused-vars
    const _trackGenData = _a?.has_generation_data ?? _a?.hasGenerationData;
    // eslint-disable-next-line no-unused-vars
    const _trackAiInfo = _a?.has_ai_info ?? _a?.hasAiInfo ?? _a?.ai_indexed;
    // eslint-disable-next-line no-unused-vars
    const _trackAutoTags = _a?.has_ai_auto_tags ?? _a?.hasAiAutoTags ?? _a?.auto_tags ?? _a?.autoTags;
    // eslint-disable-next-line no-unused-vars
    const _trackCaption = _a?.has_ai_enhanced_caption ?? _a?.hasAiEnhancedCaption ?? _a?.enhanced_caption ?? _a?.enhancedCaption;
    // eslint-disable-next-line no-unused-vars
    const _trackVector = _a?.has_ai_vector ?? _a?.hasAiVector ?? _a?.vector_indexed ?? _a?.vectorIndexed;
    try {
        wrapper.textContent = "";
        const dot = createWorkflowDot(_a);
        if (dot) wrapper.appendChild(dot);
    } catch {}
});

// --- Helpers -----------------------------------------------------------------

function onImgError(event) {
    imgError.value = true;
    try {
        const failedUrl = isWorkflow.value ? explicitThumbnailUrl.value : imageUrl.value;
        imageErrorSourceKey = String(failedUrl || "").trim();
        MediaBlobCache.markError(failedUrl);
    } catch {}
}

function onModel3dImgError() {
    model3dImgError.value = true;
    model3dErrorSourceKey = String(posterUrl.value || "").trim();
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

function emitWorkflowAction(action, event) {
    try {
        event?.preventDefault?.();
        event?.stopPropagation?.();
    } catch (e) {
        console.debug?.(e);
    }
    emit("workflow-action", {
        type: String(action || "").trim().toLowerCase(),
        event,
        asset: props.asset,
    });
}
</script>

<template>
    <!-- -- THUMBNAIL -------------------------------------------------------- -->
    <div class="mjr-thumb" :class="{ 'mjr-thumb-workflow': isWorkflow }" ref="thumbRef">
        <div
            v-if="isLivePlaceholder"
            class="mjr-live-placeholder-wash"
            aria-hidden="true"
        />

        <!-- Workflow -->
        <template v-if="isWorkflow">
            <div class="mjr-workflow-card-actions" @click.stop @dblclick.stop>
                <button
                    type="button"
                    class="mjr-workflow-action-btn"
                    :class="{ 'is-active': workflowFavorite }"
                    :title="workflowFavorite ? 'Remove favorite' : 'Add favorite'"
                    :aria-label="workflowFavorite ? 'Remove favorite' : 'Add favorite'"
                    @click="emitWorkflowAction('favorite', $event)"
                ><i :class="workflowFavorite ? 'pi pi-star-fill' : 'pi pi-star'" /></button>
            </div>
            <img
                v-if="explicitThumbnailUrl && !imgError"
                :class="[
                    'mjr-thumb-media',
                    {
                        'mjr-workflow-graph-map-preview': hasGraphMapWorkflowThumbnail,
                    },
                ]"
                :alt="filename"
                decoding="async"
                loading="lazy"
                :src="explicitThumbnailUrl"
                @error="onImgError"
            />
            <div
                class="mjr-workflow-thumb"
                :class="{
                    'has-thumbnail': explicitThumbnailUrl && !imgError,
                    'has-graph-map': hasGraphMapWorkflowThumbnail && !imgError,
                }"
            >
                <i class="pi pi-sitemap" />
                <div class="mjr-workflow-thumb-title">{{ workflowTask || "Workflow" }}</div>
                <div class="mjr-workflow-thumb-meta">
                    <span v-if="workflowModel">{{ workflowModel }}</span>
                    <span v-if="workflowRunsOn">{{ workflowRunsOn }}</span>
                    <span v-if="workflowNodeCount">{{ workflowNodeCount }} nodes</span>
                    <span v-if="workflowHasMissingDeps" class="mjr-workflow-missing-chip">{{ workflowMissingLabel }}</span>
                </div>
            </div>
        </template>

        <!-- Image -->
        <template v-else-if="isImage">
            <img
                v-if="!imgError"
                ref="imgRef"
                class="mjr-thumb-media"
                :alt="filename"
                decoding="async"
                loading="lazy"
                :src="cachedImageSrc || imageUrl || undefined"
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
                :data-src="videoUrl"
                :poster="posterUrl || undefined"
                muted
                loop
                :autoplay="false"
                playsinline
                preload="none"
                :draggable="false"
                :tabindex="-1"
                style="pointer-events: none"
            />
            <div class="mjr-thumb-play"><i class="pi pi-play" /></div>
        </template>

        <!-- Audio -->
        <template v-else-if="isAudio">
            <img
                v-if="posterUrl"
                class="mjr-thumb-media"
                :src="posterUrl"
                :draggable="false"
                alt=""
            />
            <div class="mjr-audio-thumb" :class="{ 'has-poster': posterUrl }">
                <div class="mjr-audio-thumb-head">
                    <span class="mjr-audio-thumb-icon"><i class="pi pi-volume-up" /></span>
                    <span class="mjr-audio-thumb-kind">{{ ext || "AUDIO" }}</span>
                </div>
                <div class="mjr-audio-thumb-waveform" aria-hidden="true">
                    <span
                        v-for="(bar, i) in audioWaveformBars"
                        :key="i"
                        :style="{ height: `${bar.height}%`, opacity: bar.opacity }"
                    />
                </div>
                <div class="mjr-audio-thumb-meta">
                    <span class="mjr-audio-thumb-title">{{ audioThumbTitle }}</span>
                    <span class="mjr-audio-thumb-subtitle">{{ audioThumbSubtitle }}</span>
                </div>
            </div>
        </template>

        <!-- Model 3D -->
        <template v-else-if="isModel3D">
            <img
                v-if="posterUrl && !model3dImgError"
                class="mjr-thumb-media"
                :src="posterUrl"
                :draggable="false"
                :alt="filename"
                @error="onModel3dImgError"
            />
            <div
                v-else
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
            :title="hasCollision ? `${ext} - duplicate filename (${asset._mjrNameCollisionCount || 2} files)` : `${ext} file`"
            @click="onFileBadgeClick"
        >{{ ext }}{{ hasCollision ? "+" : "" }}</div>

        <!-- Rating badge -->
        <RatingBadge :rating="rating" class="mjr-badge-rating" />

        <!-- Tags badge -->
        <TagsBadge :tags="tags" class="mjr-badge-tags" />

        <!-- Generation time badge -->
        <GenTimeBadge :gen-time-ms="genTimeMs" />

        <!-- Live placeholder state -->
        <div
            v-if="isLivePlaceholder"
            class="mjr-live-pill"
            :title="livePlaceholderTitle"
        >
            <span class="mjr-live-pill-dot" aria-hidden="true" />
            <span>{{ livePlaceholderLabel }}</span>
        </div>

        <!-- Hover info overlay -->
        <div
            v-if="positivePrompt || (isWorkflow && notes) || genTimeValid"
            class="mjr-card-hover-info"
        >
            <div v-if="positivePrompt" class="mjr-hover-prompt">{{ positivePrompt }}</div>
            <div v-if="isWorkflow && notes" class="mjr-hover-prompt mjr-hover-workflow-notes">{{ notes }}</div>
            <div v-if="genTimeValid" class="mjr-hover-gentime">Time {{ genTimeFmt.text }}</div>
        </div>
    </div>

    <!-- -- META ------------------------------------------------------------ -->
    <div
        class="mjr-card-info mjr-card-meta"
        :data-mjr-kind="isWorkflow ? 'workflow' : undefined"
        style="position:relative;padding:6px 8px;min-width:0"
    >
        <div
            class="mjr-card-filename"
            :title="cardTitle"
            style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:4px;padding-right:12px"
        >{{ displayName }}</div>

        <div
            class="mjr-card-meta-row"
            style="font-size:0.85em;opacity:0.7;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:16px"
        >
            <template v-if="isWorkflow">
                <span v-if="workflowTask" class="mjr-meta-workflow-task" :title="`Task: ${workflowTask}`">{{ workflowTask }}</span>
                <span
                    v-if="workflowSubgraphCount"
                    class="mjr-meta-workflow-subgraphs"
                    :title="`${workflowSubgraphCount} subgraph${workflowSubgraphCount > 1 ? 's' : ''}`"
                >{{ workflowSubgraphCount }} sub</span>
                <span
                    v-if="workflowHasMissingDeps"
                    class="mjr-meta-workflow-missing"
                    :title="workflowMissingLabel"
                >{{ workflowMissingLabel }}</span>
            </template>
            <template v-for="(item, index) in metaItems" :key="item.key">
                <span
                    v-if="index > 0"
                    class="mjr-meta-separator"
                    aria-hidden="true"
                    style="opacity:0.55;margin:0 3px"
                >/</span>
                <span
                    :class="item.className"
                    :style="item.style || null"
                    :title="item.title"
                >{{ item.text }}</span>
            </template>
        </div>

        <!-- Workflow dot (imperatively created by createWorkflowDot) -->
        <div
            ref="dotWrapperRef"
            class="mjr-card-dot-wrapper"
            style="position:absolute;right:8px;bottom:6px;z-index:2"
        />
    </div>

    <!-- -- STACK GROUP BUTTON (execution grouping) -------------------------- -->
    <MButton
        v-if="hasStackGroup"
        type="button"
        class="mjr-stack-group-button"
        severity="secondary"
        text
        rounded
        :disabled="stackOpening"
        :aria-busy="stackOpening ? 'true' : 'false'"
        :aria-label="`Open generation group in grid (${stackCount} assets)`"
        :title="`Open generation group in grid (${stackCount} assets)`"
        @click="onStackGroupClick"
        @pointerdown.stop
        @mousedown.stop.prevent
        @touchstart.stop.passive
        @dblclick.stop
        @keydown.stop
        @dragstart.stop.prevent
    >
        <span class="pi pi-clone"></span>
        <span class="mjr-stack-group-button-count">{{ stackCount }}</span>
    </MButton>

    <!-- -- DUPLICATE STACK BUTTON (same-filename copies) -------------------- -->
    <MButton
        v-if="showDupStackButton"
        type="button"
        class="mjr-dup-stack-button"
        severity="secondary"
        text
        rounded
        :disabled="dupOpening"
        :aria-busy="dupOpening ? 'true' : 'false'"
        :aria-label="`${dupCount} duplicate${dupCount > 1 ? 's' : ''} - click to compare all copies`"
        :title="`${dupCount} duplicate${dupCount > 1 ? 's' : ''} - click to compare all copies`"
        @click="onDupStackClick"
        @pointerdown.stop
        @mousedown.stop.prevent
        @touchstart.stop.passive
        @dblclick.stop
        @keydown.stop
        @dragstart.stop.prevent
    >
        <span class="pi pi-copy"></span>
        <span class="mjr-dup-stack-count">{{ dupCount }}</span>
    </MButton>
</template>
