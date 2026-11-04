<script setup lang="ts">
/**
 * StudioProbe.vue - pixel probe (colour under the cursor) and loupe.
 * Maps the pointer onto the media box (which follows zoom/pan) to source pixels.
 */
import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";

import { formatProbe } from "../../../../features/viewer/studio/studioFx.js";
import {
    drawLoupe,
    pixelAt,
    sourceSize,
    type StudioSource,
} from "../../../../features/viewer/studio/studioSampler.js";

const props = defineProps<{
    getSource: () => StudioSource | null;
    getBox: () => HTMLElement | null;
    probe: boolean;
    loupe: boolean;
    loupeSize: number;
    loupeZoom: number;
    /** Same CSS filter as the media, so the loupe shows what the stage shows. */
    mediaFilter?: string;
}>();

const loupeCanvas = ref<HTMLCanvasElement | null>(null);
const pos = ref<{ x: number; y: number } | null>(null);
const info = shallowRef<{ x: number; y: number; hex: string; rgb: string; luma: string } | null>(
    null,
);
let raf = 0;
let pending: PointerEvent | null = null;

function update() {
    raf = 0;
    const event = pending;
    pending = null;
    const box = props.getBox();
    const source = props.getSource();
    if (!event || !box || !source) return;
    const rect = box.getBoundingClientRect();
    const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
    if (!inside || rect.width <= 0 || rect.height <= 0) {
        pos.value = null;
        info.value = null;
        return;
    }
    const { w, h } = sourceSize(source);
    const sx = ((event.clientX - rect.left) / rect.width) * w;
    const sy = ((event.clientY - rect.top) / rect.height) * h;
    pos.value = { x: event.clientX, y: event.clientY };
    if (props.loupe && loupeCanvas.value)
        drawLoupe(loupeCanvas.value, source, sx, sy, props.loupeZoom);
    if (props.probe) {
        const px = pixelAt(source, sx, sy);
        info.value = px
            ? { x: Math.floor(sx), y: Math.floor(sy), ...formatProbe(px[0], px[1], px[2], px[3]) }
            : null;
    }
}

function onMove(event: PointerEvent) {
    pending = event;
    if (!raf) raf = requestAnimationFrame(update);
}

onMounted(() => window.addEventListener("pointermove", onMove, { passive: true }));
onBeforeUnmount(() => {
    window.removeEventListener("pointermove", onMove);
    if (raf) cancelAnimationFrame(raf);
});
</script>

<template>
    <div v-if="pos" class="mjr-studio-probe" aria-hidden="true">
        <div
            v-if="loupe"
            class="mjr-studio-probe__loupe"
            :style="{
                left: `${pos.x + 18}px`,
                top: `${pos.y + 18}px`,
                width: `${loupeSize}px`,
                height: `${loupeSize}px`,
            }"
        >
            <canvas
                ref="loupeCanvas"
                :width="loupeSize"
                :height="loupeSize"
                :style="mediaFilter ? { filter: mediaFilter } : undefined"
            />
            <span class="mjr-studio-probe__cross" />
        </div>
        <div
            v-if="probe && info"
            class="mjr-studio-probe__chip"
            :style="{ left: `${pos.x + 18}px`, top: `${pos.y + (loupe ? loupeSize + 26 : 18)}px` }"
        >
            <span class="mjr-studio-probe__swatch" :style="{ background: info.hex }" />
            <span>{{ info.hex }}</span>
            <span class="is-dim">{{ info.rgb }}</span>
            <span class="is-dim">L {{ info.luma }} · {{ info.x }},{{ info.y }}</span>
        </div>
    </div>
</template>
