<script setup lang="ts">
/** StudioZebra.vue - stripes over near-white areas (exposure check). */
import { onMounted, ref, watch } from "vue";

import { computeZebra } from "../../../../features/viewer/studio/studioFx.js";
import {
    sampleImageData,
    type StudioSource,
} from "../../../../features/viewer/studio/studioSampler.js";

const props = defineProps<{
    getSource: () => StudioSource | null;
    threshold: number;
    tick: number;
}>();
const canvas = ref<HTMLCanvasElement | null>(null);
let phase = 0;

function render() {
    const c = canvas.value;
    const sample = sampleImageData(props.getSource(), 480);
    if (!c || !sample) return;
    c.width = sample.width;
    c.height = sample.height;
    phase = (phase + 1) % 8;
    const overlay = computeZebra(sample.data, sample.width, sample.height, props.threshold, phase);
    c.getContext("2d")?.putImageData(new ImageData(overlay, sample.width, sample.height), 0, 0);
}

watch(() => [props.tick, props.threshold], render);
onMounted(render);
</script>

<template>
    <canvas ref="canvas" class="mjr-studio-zebra" aria-hidden="true" />
</template>
