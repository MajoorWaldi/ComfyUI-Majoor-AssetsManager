<script setup>
import { ref } from "vue";
import { isSafeOpenUrl } from "./generationSectionState.js";

const props = defineProps({
    inputFile: { type: Object, required: true },
});

const currentSrcIndex = ref(0);
const flashOutline = ref(false);

function currentSource() {
    const candidates = Array.isArray(props.inputFile?.previewCandidates)
        ? props.inputFile.previewCandidates
        : [];
    return candidates[currentSrcIndex.value] || "";
}

function handleMediaError() {
    const candidates = Array.isArray(props.inputFile?.previewCandidates)
        ? props.inputFile.previewCandidates
        : [];
    if (currentSrcIndex.value < candidates.length - 1) {
        currentSrcIndex.value += 1;
    }
}

async function copyPath(event) {
    event?.stopPropagation?.();
    const value = String(props.inputFile?.filepath || props.inputFile?.filename || "").trim();
    if (!value) return;
    try {
        await navigator.clipboard.writeText(value);
        flashOutline.value = true;
        setTimeout(() => {
            flashOutline.value = false;
        }, 350);
    } catch (e) {
        console.debug?.(e);
    }
}

function openPreview(event) {
    event?.stopPropagation?.();
    const src = currentSource();
    if (!isSafeOpenUrl(src)) return;
    try {
        window.open(src, "_blank", "noopener,noreferrer");
    } catch (e) {
        console.debug?.(e);
    }
}

function handleVideoOver(event) {
    event.target?.play?.().catch?.(() => {});
}

function handleVideoOut(event) {
    try {
        event.target?.pause?.();
    } catch (e) {
        console.debug?.(e);
    }
}
</script>

<template>
    <div
        :title="`${inputFile.filename} (click to copy, double-click to open in new tab)`"
        :style="{
            width: '64px',
            height: '64px',
            background: '#222',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: flashOutline ? '2px solid rgba(76, 175, 80, 0.9)' : '',
            outlineOffset: flashOutline ? '1px' : '',
        }"
        @click="copyPath"
        @dblclick="openPreview"
    >
        <video
            v-if="inputFile.isVideo"
            :src="currentSource()"
            muted
            loop
            playsinline
            preload="metadata"
            style="width:100%;height:100%;object-fit:cover"
            @error="handleMediaError"
            @mouseover="handleVideoOver"
            @mouseout="handleVideoOut"
        />
        <img
            v-else
            :src="currentSource()"
            style="width:100%;height:100%;object-fit:cover"
            @error="handleMediaError"
        >

        <div
            v-if="inputFile.role && inputFile.role !== 'secondary'"
            style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.7);color:white;font-size:8px;padding:2px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
        >
            {{ inputFile.roleLabel }}
        </div>

        <div
            v-else-if="inputFile.isVideo"
            title="Video file"
            style="position:absolute;color:white;opacity:0.7;font-size:16px;pointer-events:none"
        >
            &#9654;
        </div>
    </div>
</template>
