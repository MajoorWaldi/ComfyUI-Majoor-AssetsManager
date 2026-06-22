<script setup>
/**
 * RatingBadge.vue — Display-only rating badge (stars).
 *
 * Phase 4.1: Replaces createRatingBadge() from Badges.js.
 * This is a display-only component. For interactive rating, use RatingEditor.vue.
 */
import { computed } from "vue";
import { t } from "../../../app/i18n.js";

const props = defineProps({
    rating: {
        type: [Number, String],
        default: 0,
        validator: (value) => {
            const num = Number(value);
            return Number.isInteger(num) && num >= 0 && num <= 5;
        },
    },
});

const ratingValue = computed(() => Math.max(0, Math.min(5, Number(props.rating) || 0)));
const hasRating = computed(() => ratingValue.value > 0);
const ratingTitle = computed(() =>
    t("rating.title", "Rating: {n} star{n, plural, one {} other {s}}", { n: ratingValue.value }),
);
</script>

<template>
    <div
        v-if="hasRating"
        class="mjr-rating-badge"
        :title="ratingTitle"
    >
        <span
            v-for="i in ratingValue"
            :key="i"
            :style="{
                color: 'var(--mjr-rating-color, var(--mjr-star-active, #FFD45A))',
                marginRight: i < ratingValue ? '2px' : '0',
            }"
        >
            ★
        </span>
    </div>
</template>
