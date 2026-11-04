<script setup lang="ts">
/**
 * StudioImageStage.vue - zoomable / pannable image for the Studio viewer.
 *
 * Wheel zooms around the cursor, drag pans, double-click toggles fit <-> 100 %.
 * Zoom is expressed relative to the image's natural size so "100 %" is a
 * pixel-accurate view of the generation.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{ src: string; alt?: string; checker?: boolean }>();
const emit = defineEmits<{
    (e: "zoom", value: number): void;
    (e: "loaded", size: { width: number; height: number }): void;
}>();

const stage = ref<HTMLElement | null>(null);
const natural = ref({ w: 0, h: 0 });
const scale = ref(1);
const offset = ref({ x: 0, y: 0 });
const fitMode = ref(true);
const failed = ref(false);
const dragging = ref(false);
let drag: { x: number; y: number; ox: number; oy: number; id: number } | null = null;
let resizeObserver: ResizeObserver | null = null;

const MIN_SCALE = 0.05;
const MAX_SCALE = 32;

function stageSize() {
    const rect = stage.value?.getBoundingClientRect();
    return { w: rect?.width || 0, h: rect?.height || 0 };
}

function fitScale(): number {
    const { w, h } = stageSize();
    if (!natural.value.w || !natural.value.h || !w || !h) return 1;
    return Math.min(w / natural.value.w, h / natural.value.h);
}

function applyFit() {
    fitMode.value = true;
    scale.value = fitScale();
    offset.value = { x: 0, y: 0 };
    emit("zoom", scale.value);
}

function setScale(next: number, anchor?: { x: number; y: number }) {
    const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next));
    const { w, h } = stageSize();
    const ax = anchor ? anchor.x - w / 2 : 0;
    const ay = anchor ? anchor.y - h / 2 : 0;
    const ratio = clamped / scale.value;
    offset.value = {
        x: ax - (ax - offset.value.x) * ratio,
        y: ay - (ay - offset.value.y) * ratio,
    };
    scale.value = clamped;
    fitMode.value = false;
    emit("zoom", scale.value);
}

function zoomBy(factor: number) {
    setScale(scale.value * factor);
}
function actualSize() {
    setScale(1);
    offset.value = { x: 0, y: 0 };
}
function toggleFitActual() {
    if (fitMode.value) actualSize();
    else applyFit();
}

function onWheel(event: WheelEvent) {
    event.preventDefault();
    const rect = stage.value?.getBoundingClientRect();
    const factor = Math.exp(-event.deltaY * 0.0015);
    setScale(
        scale.value * factor,
        rect ? { x: event.clientX - rect.left, y: event.clientY - rect.top } : undefined,
    );
}

function onPointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    drag = {
        x: event.clientX,
        y: event.clientY,
        ox: offset.value.x,
        oy: offset.value.y,
        id: event.pointerId,
    };
    dragging.value = true;
    (event.currentTarget as HTMLElement)?.setPointerCapture?.(event.pointerId);
}
function onPointerMove(event: PointerEvent) {
    if (!drag) return;
    offset.value = { x: drag.ox + event.clientX - drag.x, y: drag.oy + event.clientY - drag.y };
    if (Math.abs(event.clientX - drag.x) + Math.abs(event.clientY - drag.y) > 2)
        fitMode.value = false;
}
function onPointerUp(event: PointerEvent) {
    if (drag) (event.currentTarget as HTMLElement)?.releasePointerCapture?.(drag.id);
    drag = null;
    dragging.value = false;
}

function onLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    natural.value = { w: img.naturalWidth, h: img.naturalHeight };
    failed.value = false;
    emit("loaded", { width: img.naturalWidth, height: img.naturalHeight });
    applyFit();
}

const imageStyle = computed(() => ({
    width: `${natural.value.w}px`,
    height: `${natural.value.h}px`,
    transform: `translate(-50%, -50%) translate(${offset.value.x}px, ${offset.value.y}px) scale(${scale.value})`,
    imageRendering: scale.value >= 2 ? ("pixelated" as const) : ("auto" as const),
}));

watch(
    () => props.src,
    () => {
        natural.value = { w: 0, h: 0 };
        failed.value = false;
    },
);

onMounted(() => {
    try {
        resizeObserver = new ResizeObserver(() => {
            if (fitMode.value) applyFit();
        });
        if (stage.value) resizeObserver.observe(stage.value);
    } catch (e) {
        console.debug?.(e);
    }
});
onBeforeUnmount(() => resizeObserver?.disconnect());

defineExpose({ zoomBy, fit: applyFit, actualSize, toggleFitActual });
</script>

<template>
    <div
        ref="stage"
        class="mjr-studio-stage"
        :class="{ 'is-checker': checker, 'is-dragging': dragging }"
        @wheel="onWheel"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @dblclick="toggleFitActual"
    >
        <img
            v-show="!failed"
            :key="src"
            class="mjr-studio-stage__img"
            :src="src"
            :alt="alt || ''"
            draggable="false"
            :style="imageStyle"
            @load="onLoad"
            @error="failed = true"
        />
        <div v-if="failed" class="mjr-studio-stage__error">
            <i class="pi pi-image" aria-hidden="true" />
            <span>{{ alt }}</span>
        </div>
    </div>
</template>
