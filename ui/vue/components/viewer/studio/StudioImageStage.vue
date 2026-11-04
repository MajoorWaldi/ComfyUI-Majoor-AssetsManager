<script setup lang="ts">
/**
 * StudioImageStage.vue - zoomable / pannable image for the Studio viewer.
 *
 * Wheel zooms around the cursor, drag pans, double-click toggles fit <-> 100 %.
 * Zoom is expressed relative to the image's natural size so "100 %" is a
 * pixel-accurate view of the generation.
 *
 * The image sits in a "box" at natural size that carries the zoom/pan
 * transform; review overlays (guides, zebra) go in the `overlay` slot and
 * follow it for free. A second image (B) can be compared: wipe, blend modes
 * or side by side - both share the same transform.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

import {
    compareBlendMode,
    type StudioCompare,
} from "../../../../features/viewer/studio/studioFx.js";

const props = withDefaults(
    defineProps<{
        src: string;
        alt?: string;
        checker?: boolean;
        /** CSS filter applied to the picture (colour tools). */
        mediaFilter?: string;
        compareSrc?: string | null;
        compare?: StudioCompare;
        wipe?: number;
    }>(),
    { alt: "", checker: false, mediaFilter: "", compareSrc: null, compare: "off", wipe: 50 },
);
const emit = defineEmits<{
    (e: "zoom", value: number): void;
    (e: "loaded", size: { width: number; height: number }): void;
    (e: "update:wipe", value: number): void;
}>();

const stage = ref<HTMLElement | null>(null);
const box = ref<HTMLElement | null>(null);
const img = ref<HTMLImageElement | null>(null);
const natural = ref({ w: 0, h: 0 });
const scale = ref(1);
const offset = ref({ x: 0, y: 0 });
const fitMode = ref(true);
const failed = ref(false);
const dragging = ref(false);
const wiping = ref(false);
let drag: { x: number; y: number; ox: number; oy: number; id: number } | null = null;
let resizeObserver: ResizeObserver | null = null;

const MIN_SCALE = 0.05;
const MAX_SCALE = 32;
const SIDE_GAP = 16;

const comparing = computed(() => !!props.compareSrc && props.compare !== "off");
const isSide = computed(() => comparing.value && props.compare === "side");
const isWipe = computed(
    () => comparing.value && (props.compare === "wipe" || props.compare === "wipeV"),
);
const blend = computed(() => (comparing.value ? compareBlendMode(props.compare) : null));
/** Subtract is done by the colour filter (feImage of B), so B is not drawn. */
const showB = computed(() => comparing.value && props.compare !== "subtract");

/** Content width used for fitting (side by side shows two images). */
function contentWidth(): number {
    return isSide.value ? natural.value.w * 2 + SIDE_GAP : natural.value.w;
}

function stageSize() {
    const rect = stage.value?.getBoundingClientRect();
    return { w: rect?.width || 0, h: rect?.height || 0 };
}

function fitScale(): number {
    const { w, h } = stageSize();
    if (!natural.value.w || !natural.value.h || !w || !h) return 1;
    return Math.min(w / contentWidth(), h / natural.value.h);
}

function applyFit() {
    fitMode.value = true;
    scale.value = fitScale();
    offset.value = {
        x: isSide.value ? -((natural.value.w + SIDE_GAP) / 2) * scale.value : 0,
        y: 0,
    };
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

function wipeFromEvent(event: PointerEvent) {
    const rect = box.value?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    const ratio =
        props.compare === "wipeV"
            ? (event.clientY - rect.top) / rect.height
            : (event.clientX - rect.left) / rect.width;
    emit("update:wipe", Math.round(Math.max(0, Math.min(1, ratio)) * 1000) / 10);
}
function onWipeDown(event: PointerEvent) {
    wiping.value = true;
    (event.currentTarget as HTMLElement)?.setPointerCapture?.(event.pointerId);
    wipeFromEvent(event);
}
function onWipeMove(event: PointerEvent) {
    if (wiping.value) wipeFromEvent(event);
}
function onWipeUp() {
    wiping.value = false;
}

function onLoad(event: Event) {
    const el = event.target as HTMLImageElement;
    natural.value = { w: el.naturalWidth, h: el.naturalHeight };
    failed.value = false;
    emit("loaded", { width: el.naturalWidth, height: el.naturalHeight });
    applyFit();
}

const boxStyle = computed(() => ({
    width: `${natural.value.w}px`,
    height: `${natural.value.h}px`,
    transform: `translate(-50%, -50%) translate(${offset.value.x}px, ${offset.value.y}px) scale(${scale.value})`,
    imageRendering: scale.value >= 2 ? ("pixelated" as const) : ("auto" as const),
    // Lets in-box UI (wipe divider) keep a constant on-screen size.
    "--mjr-inv-scale": String(1 / (scale.value || 1)),
}));
const layersStyle = computed(() => (props.mediaFilter ? { filter: props.mediaFilter } : {}));
const bStyle = computed(() => {
    if (blend.value) return { mixBlendMode: blend.value as any };
    if (isWipe.value) {
        const pct = Math.max(0, Math.min(100, props.wipe));
        return {
            clipPath: props.compare === "wipeV" ? `inset(${pct}% 0 0 0)` : `inset(0 0 0 ${pct}%)`,
        };
    }
    return {};
});
const dividerStyle = computed(() =>
    props.compare === "wipeV" ? { top: `${props.wipe}%` } : { left: `${props.wipe}%` },
);

watch(
    () => props.src,
    () => {
        natural.value = { w: 0, h: 0 };
        failed.value = false;
    },
);
watch(isSide, () => {
    if (fitMode.value) applyFit();
});

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

defineExpose({
    zoomBy,
    fit: applyFit,
    actualSize,
    toggleFitActual,
    getSource: () => (img.value && !failed.value ? img.value : null),
    getBox: () => box.value,
    naturalSize: () => ({ ...natural.value }),
});
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
        <div v-show="!failed" class="mjr-studio-stage__box" :style="boxStyle">
            <div ref="box" class="mjr-studio-stage__layers" :style="layersStyle">
                <img
                    ref="img"
                    :key="src"
                    class="mjr-studio-stage__img"
                    :src="src"
                    :alt="alt"
                    draggable="false"
                    @load="onLoad"
                    @error="failed = true"
                />
                <img
                    v-if="showB && !isSide"
                    :key="`b:${compareSrc}`"
                    class="mjr-studio-stage__img is-b"
                    :src="compareSrc || ''"
                    alt=""
                    draggable="false"
                    :style="bStyle"
                />
            </div>
            <slot name="overlay" :width="natural.w" :height="natural.h" />
            <template v-if="isWipe">
                <div
                    class="mjr-studio-stage__divider"
                    :class="{ 'is-vertical': compare === 'wipeV', 'is-active': wiping }"
                    :style="dividerStyle"
                    @pointerdown.stop="onWipeDown"
                    @pointermove="onWipeMove"
                    @pointerup="onWipeUp"
                    @pointercancel="onWipeUp"
                    @dblclick.stop="emit('update:wipe', 50)"
                >
                    <span class="mjr-studio-stage__divider-grip" />
                </div>
            </template>
            <div
                v-if="showB && isSide"
                class="mjr-studio-stage__side"
                :style="{ left: `calc(100% + ${SIDE_GAP}px)`, filter: mediaFilter || undefined }"
            >
                <img
                    :key="`side:${compareSrc}`"
                    class="mjr-studio-stage__img"
                    :src="compareSrc || ''"
                    alt=""
                    draggable="false"
                />
            </div>
        </div>
        <div v-if="comparing" class="mjr-studio-stage__ab">
            <span>A</span><span class="is-sep">{{ compare === "wipeV" ? "/" : "|" }}</span
            ><span>B</span>
        </div>
        <div v-if="failed" class="mjr-studio-stage__error">
            <i class="pi pi-image" aria-hidden="true" />
            <span>{{ alt }}</span>
        </div>
    </div>
</template>
