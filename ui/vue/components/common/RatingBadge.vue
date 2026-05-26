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

<style scoped>
.mjr-rating-badge {
    position: absolute;
    top: 6px;
    right: 6px;
    background: rgba(0, 0, 0, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 2px 6px;
    border-radius: 6px;
    font-size: 13px;
    letter-spacing: 1px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 10;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
    animation: mjr-fade-in 0.2s ease-out;
}

@keyframes mjr-fade-in {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}
</style>
