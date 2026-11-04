<script setup lang="ts">
/** StudioScopes.vue - RGB/luma histogram and luma waveform HUD. */
import { onMounted, ref, watch } from "vue";

import { t } from "../../../../app/i18n.js";
import {
    computeHistogram,
    computeWaveform,
    type StudioScopes,
} from "../../../../features/viewer/studio/studioFx.js";
import {
    sampleImageData,
    type StudioSource,
} from "../../../../features/viewer/studio/studioSampler.js";

const props = defineProps<{
    getSource: () => StudioSource | null;
    mode: StudioScopes;
    tick: number;
}>();
const hist = ref<HTMLCanvasElement | null>(null);
const wave = ref<HTMLCanvasElement | null>(null);

function drawHistogram(data: Uint8ClampedArray) {
    const c = hist.value;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const h = computeHistogram(data);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.globalCompositeOperation = "lighter";
    const plot = (bins: Uint32Array, color: string) => {
        ctx.fillStyle = color;
        for (let x = 0; x < 256; x++) {
            const v = Math.min(1, bins[x] / h.max) * c.height;
            ctx.fillRect((x / 256) * c.width, c.height - v, c.width / 256 + 0.5, v);
        }
    };
    plot(h.r, "rgba(255,70,70,0.75)");
    plot(h.g, "rgba(70,255,90,0.75)");
    plot(h.b, "rgba(80,140,255,0.75)");
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    for (let x = 0; x < 256; x++) {
        const y = c.height - Math.min(1, h.l[x] / h.max) * c.height;
        if (x === 0) ctx.moveTo(0, y);
        else ctx.lineTo((x / 255) * c.width, y);
    }
    ctx.stroke();
}

function drawWaveform(data: Uint8ClampedArray, width: number, height: number) {
    const c = wave.value;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const w = computeWaveform(data, width, height, 256);
    const img = ctx.createImageData(w.columns, 256);
    for (let col = 0; col < w.columns; col++) {
        for (let v = 0; v < 256; v++) {
            const n = w.bins[col * 256 + v];
            if (!n) continue;
            const a = Math.min(255, 40 + (n / w.max) * 1200);
            const i = ((255 - v) * w.columns + col) * 4;
            img.data[i] = 120;
            img.data[i + 1] = 255;
            img.data[i + 2] = 150;
            img.data[i + 3] = a;
        }
    }
    c.width = w.columns;
    c.height = 256;
    ctx.putImageData(img, 0, 0);
}

function render() {
    if (props.mode === "off") return;
    const sample = sampleImageData(props.getSource(), 256);
    if (!sample) return;
    if (props.mode === "hist" || props.mode === "both") drawHistogram(sample.data);
    if (props.mode === "wave" || props.mode === "both")
        drawWaveform(sample.data, sample.width, sample.height);
}

watch(
    () => [props.tick, props.mode],
    () => requestAnimationFrame(render),
);
onMounted(render);
</script>

<template>
    <div class="mjr-studio-scopes" aria-label="Scopes">
        <div v-if="mode === 'hist' || mode === 'both'" class="mjr-studio-scopes__panel">
            <span class="mjr-studio-scopes__label">{{
                t("viewer.studio.histogram", "Histogram")
            }}</span>
            <canvas ref="hist" width="256" height="110" />
        </div>
        <div v-if="mode === 'wave' || mode === 'both'" class="mjr-studio-scopes__panel">
            <span class="mjr-studio-scopes__label">{{
                t("viewer.studio.waveform", "Waveform")
            }}</span>
            <canvas ref="wave" width="256" height="256" class="is-wave" />
        </div>
    </div>
</template>
