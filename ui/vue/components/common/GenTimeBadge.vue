<script setup lang="ts">
/**
 * GenTimeBadge.vue — Generation time badge overlay on asset thumbnails.
 * Replaces createGenTimeBadge() from Badges.js.
 */
import { computed } from "vue";
import { genTimeColor, normalizeGenerationTimeMs, formatGenTime } from "../../../components/Badges.js";

const props = withDefaults(
    defineProps<{ genTimeMs?: number | string }>(),
    { genTimeMs: 0 },
);

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
