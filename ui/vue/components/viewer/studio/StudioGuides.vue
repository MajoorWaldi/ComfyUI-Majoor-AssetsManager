<script setup lang="ts">
/**
 * StudioGuides.vue - composition guides and aspect-ratio mask, drawn in the
 * media's pixel coordinates (the parent box scales with zoom).
 */
import { computed } from "vue";

import {
    aspectRect,
    gridGuides,
    type StudioAspect,
    type StudioGrid,
} from "../../../../features/viewer/studio/studioFx.js";

const props = defineProps<{
    width: number;
    height: number;
    grid: StudioGrid;
    aspect: StudioAspect;
    maskOpacity: number;
}>();

const guides = computed(() => gridGuides(props.width, props.height, props.grid));
const mask = computed(() => aspectRect(props.width, props.height, props.aspect));
const maskPath = computed(() => {
    const m = mask.value;
    if (!m) return "";
    const { width: w, height: h } = props;
    return `M0 0H${w}V${h}H0Z M${m.x} ${m.y}V${m.y + m.h}H${m.x + m.w}V${m.y}Z`;
});
const visible = computed(
    () => props.width > 0 && props.height > 0 && (props.grid !== "off" || !!mask.value),
);
</script>

<template>
    <svg
        v-if="visible"
        class="mjr-studio-guides"
        :viewBox="`0 0 ${width} ${height}`"
        preserveAspectRatio="none"
        aria-hidden="true"
    >
        <path
            v-if="maskPath"
            :d="maskPath"
            fill-rule="evenodd"
            :fill="`rgba(0,0,0,${maskOpacity})`"
        />
        <rect
            v-if="mask"
            :x="mask.x"
            :y="mask.y"
            :width="mask.w"
            :height="mask.h"
            fill="none"
            class="mjr-studio-guides__mask-edge"
            vector-effect="non-scaling-stroke"
        />
        <line
            v-for="(l, i) in guides.lines"
            :key="`l${i}`"
            :x1="l.x1"
            :y1="l.y1"
            :x2="l.x2"
            :y2="l.y2"
            class="mjr-studio-guides__line"
            vector-effect="non-scaling-stroke"
        />
        <rect
            v-for="(r, i) in guides.rects"
            :key="`r${i}`"
            :x="r.x"
            :y="r.y"
            :width="r.w"
            :height="r.h"
            fill="none"
            class="mjr-studio-guides__safe"
            vector-effect="non-scaling-stroke"
        />
    </svg>
</template>
