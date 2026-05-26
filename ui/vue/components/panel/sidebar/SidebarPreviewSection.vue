<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { buildAssetViewURL } from "../../../../api/endpoints.js";
import { formatFileSize, formatShortDate } from "../../../../components/sidebar/utils/format.js";
import { mountVideoControls } from "../../../../components/VideoControls.js";

const props = defineProps({
    asset: { type: Object, required: true },
    showPreviewThumb: { type: Boolean, default: true },
});

const previewContainerRef = ref(null);
let videoControlsHandle = null;

const viewUrl = computed(() => buildAssetViewURL(props.asset) || "");
const ext = computed(() => {
    const name = String(props.asset?.filename || "");
    const idx = name.lastIndexOf(".");
    if (idx === -1) return "";
    return name.slice(idx + 1).toUpperCase();
});
const metaText = computed(() => {
    const parts = [];
    if (ext.value) parts.push(ext.value);
    if (props.asset?.kind) parts.push(String(props.asset.kind).toLowerCase());
    const size = formatFileSize(props.asset?.size);
    if (size) parts.push(size);
    const date = formatShortDate(props.asset?.mtime);
    if (date) parts.push(date);
    return parts.join(" • ");
});

function cleanupVideoControls() {
    try {
        videoControlsHandle?.destroy?.();
    } catch (e) {
        console.debug?.(e);
    }
    videoControlsHandle = null;
}

function tryPlay(video) {
    try {
        const promise = video?.play?.();
        if (promise && typeof promise.catch === "function") promise.catch(() => {});
    } catch (e) {
        console.debug?.(e);
    }
}

function setupVideoControls() {
    cleanupVideoControls();
    if (!props.showPreviewThumb || String(props.asset?.kind || "").toLowerCase() !== "video") return;
    const host = previewContainerRef.value;
    const video = host?.querySelector?.("video");
    if (!host || !video) return;
    tryPlay(video);
    try {
        videoControlsHandle = mountVideoControls(video, { variant: "preview", hostEl: host });
    } catch (e) {
        console.debug?.(e);
    }
}

watch(() => [props.asset, props.showPreviewThumb], () => {
    cleanupVideoControls();
}, { flush: "post" });

watch(viewUrl, () => {
    setTimeout(() => {
        setupVideoControls();
    }, 0);
});

onMounted(() => {
    setupVideoControls();
});

onBeforeUnmount(() => {
    cleanupVideoControls();
});
</script>

<template>
    <div class="mjr-sidebar-preview">
        <div
            v-if="showPreviewThumb"
            ref="previewContainerRef"
            style="
                width: 100%;
                aspect-ratio: 1;
                background: black;
                border-radius: 8px;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            "
        >
            <img
                v-if="asset.kind === 'image'"
                :src="viewUrl"
                style="max-width: 100%; max-height: 100%; object-fit: contain"
            />

            <video
                v-else-if="asset.kind === 'video'"
                :src="viewUrl"
                :muted="true"
                :autoplay="true"
                :loop="true"
                playsinline
                preload="metadata"
                style="max-width: 100%; max-height: 100%; object-fit: contain"
            />

            <audio
                v-else-if="asset.kind === 'audio'"
                :src="viewUrl"
                controls
                preload="metadata"
                style="width: 92%; max-width: 560px"
            />

            <div
                v-else
                style="color: rgba(255, 255, 255, 0.4); font-size: 14px"
            >
                {{ String(asset.kind || "PREVIEW").toUpperCase() }}
            </div>
        </div>

        <div
            class="mjr-sidebar-preview-meta"
            style="
                margin-top: 10px;
                font-size: 12px;
                color: var(--mjr-muted, rgba(255, 255, 255, 0.65));
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                align-items: center;
                line-height: 1.3;
                padding-bottom: 12px;
                border-bottom: 1px solid var(--mjr-border, rgba(255, 255, 255, 0.12));
            "
        >
            {{ metaText }}
        </div>
    </div>
</template>
