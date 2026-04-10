<script setup>
/**
 * RatingEditor.vue - Interactive star rating editor.
 *
 * Phase 4.1: Replaces createRatingEditor() from RatingEditor.js.
 * Emits rating-change event when rating is updated.
 */
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { updateAssetRating } from "../../../api/client.js";
import { ASSET_RATING_CHANGED_EVENT } from "../../../app/events.js";
import { t } from "../../../app/i18n.js";
import { comfyToast } from "../../../app/toast.js";
import { safeDispatchCustomEvent } from "../../../utils/events.js";
import { normalizeAssetId } from "../../../utils/ids.js";

function clampRating(value) {
    return Math.max(0, Math.min(5, Number(value) || 0));
}

const props = defineProps({
    asset: {
        type: Object,
        required: true,
    },
    modelValue: {
        type: [Number, String],
        default: 0,
    },
    disabled: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(["update:modelValue", "rating-change"]);

const initialRating = clampRating(props.asset?.rating ?? props.modelValue);
const currentRating = ref(initialRating);
const hoveredStar = ref(0);
const saving = ref(false);

let savedRating = initialRating;
let desiredRating = initialRating;
let saveAC = null;

const displayRating = computed(() =>
    hoveredStar.value > 0 ? hoveredStar.value : currentRating.value,
);

const starColor = (starValue) => (starValue <= displayRating.value ? "#FFD45A" : "#555");

const starTransform = (starValue) => (starValue <= displayRating.value ? "scale(1.1)" : "scale(1)");

const retryDelay = (attemptIndex) => Math.min(100 * 2 ** Math.max(0, attemptIndex - 1), 2000);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function syncFromExternal(nextValue) {
    if (saving.value) return;
    const next = clampRating(nextValue);
    savedRating = next;
    desiredRating = next;
    if (next !== currentRating.value) {
        currentRating.value = next;
    }
}

function revertToSavedRating(message = null) {
    currentRating.value = savedRating;
    desiredRating = savedRating;
    emit("update:modelValue", savedRating);
    if (message) {
        comfyToast(message, "error");
    }
}

async function flushSaves() {
    if (saving.value) return;
    saving.value = true;
    const flushStartTime = Date.now();

    try {
        let attempts = 0;
        while (attempts < 10) {
            if (Date.now() - flushStartTime > 30_000) {
                revertToSavedRating(t("toast.ratingUpdateFailed", "Rating update failed"));
                break;
            }

            if (attempts > 0) {
                await wait(retryDelay(attempts));
            }
            attempts += 1;

            const toSave = clampRating(desiredRating);
            const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
            saveAC = ac;

            let result = null;
            try {
                result = await updateAssetRating(props.asset, toSave, ac ? { signal: ac.signal } : {});
            } catch (err) {
                console.error("Failed to update rating:", err);
            }

            if (!result?.ok) {
                if (result?.code === "ABORTED" && desiredRating !== toSave) {
                    continue;
                }
                revertToSavedRating(
                    result?.error || t("toast.ratingUpdateFailed", "Rating update failed"),
                );
                break;
            }

            try {
                const newId = result?.data?.asset_id ?? null;
                if (newId != null && !normalizeAssetId(props.asset.id)) props.asset.id = newId;
            } catch (e) {
                console.debug?.(e);
            }

            savedRating = toSave;
            currentRating.value = toSave;
            try {
                props.asset.rating = toSave;
            } catch (e) {
                console.debug?.(e);
            }
            emit("update:modelValue", toSave);
            emit("rating-change", { assetId: props.asset?.id, rating: toSave });
            safeDispatchCustomEvent(ASSET_RATING_CHANGED_EVENT, {
                assetId: props.asset?.id != null ? String(props.asset.id) : "",
                rating: toSave,
            });

            if (desiredRating === toSave) {
                comfyToast(t("toast.ratingSetN", { n: toSave }), "success", 1000);
                break;
            }
        }

        if (attempts >= 10) {
            revertToSavedRating(t("toast.ratingUpdateFailed", "Rating update failed"));
        }
    } finally {
        saveAC = null;
        saving.value = false;
    }
}

function queueRating(nextRating) {
    if (props.disabled) return;
    const normalized = clampRating(nextRating);
    desiredRating = normalized;
    currentRating.value = normalized;
    hoveredStar.value = 0;
    emit("update:modelValue", normalized);
    try {
        saveAC?.abort?.();
    } catch (e) {
        console.debug?.(e);
    }
    void flushSaves();
}

function handleStarClick(rating) {
    queueRating(rating);
}

function handleStarEnter(rating) {
    if (props.disabled) return;
    hoveredStar.value = rating;
}

function handleStarLeave() {
    hoveredStar.value = 0;
}

function handleKeydown(event) {
    if (props.disabled) return;

    let nextRating = null;
    switch (event.key) {
        case "ArrowRight":
        case "ArrowUp":
            event.preventDefault();
            nextRating = Math.min(5, currentRating.value + 1);
            break;
        case "ArrowLeft":
        case "ArrowDown":
            event.preventDefault();
            nextRating = Math.max(0, currentRating.value - 1);
            break;
        case "Home":
            event.preventDefault();
            nextRating = 0;
            break;
        case "End":
            event.preventDefault();
            nextRating = 5;
            break;
        default:
            if (event.key >= "0" && event.key <= "5") {
                event.preventDefault();
                nextRating = parseInt(event.key, 10);
            }
    }

    if (nextRating !== null && nextRating !== currentRating.value) {
        queueRating(nextRating);
    }
}

onBeforeUnmount(() => {
    try {
        saveAC?.abort?.();
    } catch (e) {
        console.debug?.(e);
    }
});

watch(
    () => props.modelValue,
    (newVal) => {
        syncFromExternal(newVal);
    },
);

watch(
    () => props.asset?.rating,
    (newVal) => {
        syncFromExternal(newVal);
    },
);
</script>

<template>
    <div
        class="mjr-rating-editor"
        :style="{
            display: 'inline-flex',
            gap: '2px',
            pointerEvents: disabled ? 'none' : 'auto',
            opacity: disabled ? 0.6 : 1,
        }"
        :aria-busy="saving"
        :aria-disabled="disabled"
        role="slider"
        :aria-label="t('rating.label', 'Rating')"
        :aria-valuemin="0"
        :aria-valuemax="5"
        :aria-valuenow="currentRating"
        :tabindex="disabled ? -1 : 0"
        @keydown="handleKeydown"
    >
        <button
            v-for="i in 5"
            :key="i"
            type="button"
            class="mjr-rating-star"
            :style="{
                color: starColor(i),
                transform: starTransform(i),
                fontSize: '16px',
                background: 'none',
                border: 'none',
                cursor: disabled ? 'default' : 'pointer',
                padding: '0',
                transition: 'all 0.15s ease',
            }"
            :aria-label="t('rating.setN', { n: i })"
            :aria-pressed="i <= currentRating"
            :disabled="disabled"
            @click="handleStarClick(i)"
            @mouseenter="handleStarEnter(i)"
            @mouseleave="handleStarLeave"
        >
            &#9733;
        </button>
    </div>
</template>

<style scoped>
.mjr-rating-star {
    outline: none;
}

.mjr-rating-star:hover:not(:disabled) {
    transform: scale(1.2);
}

.mjr-rating-star:focus-visible {
    outline: 2px solid var(--focus-outline-color, #4dabf7);
    outline-offset: 2px;
    border-radius: 2px;
}
</style>
