<script setup>
/**
 * GenTimeBadge.vue — Generation time badge overlay on asset thumbnails.
 * Replaces createGenTimeBadge() from Badges.js.
 */
import { computed } from "vue";
import { genTimeColor, normalizeGenerationTimeMs, formatGenTime } from "../../../components/Badges.js";

const props = defineProps({
    genTimeMs: { type: [Number, String], default: 0 },
});

const ms = computed(() => normalizeGenerationTimeMs(props.genTimeMs));
const isValid = computed(() => ms.value > 0);
const fmt = computed(() => formatGenTime(ms.value));
const color = computed(() => genTimeColor(ms.value));
</script>

<template>
    <div
        v-if="isValid"
        class="mjr-gentime-badge"
        :title="fmt.title"
        :style="{ color }"
    >
        {{ fmt.text }}
    </div>
</template>

<style scoped>
.mjr-gentime-badge {
    position: absolute;
    bottom: 6px;
    right: 6px;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.015em;
    line-height: 1.1;
    background: rgba(0, 0, 0, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.12);
    pointer-events: none;
    z-index: 10;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    text-shadow:
        0 1px 2px rgba(0, 0, 0, 0.9),
        0 0 10px color-mix(in srgb, currentColor 35%, transparent);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
}
</style>
