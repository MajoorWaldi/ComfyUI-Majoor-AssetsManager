<script setup lang="ts">
/**
 * StudioSlider.vue - compact pointer/keyboard slider for the Studio tool HUD.
 * Double-click resets to `defaultValue`.
 */
import { computed, ref } from "vue";

const props = withDefaults(
    defineProps<{
        label: string;
        min: number;
        max: number;
        step?: number;
        defaultValue?: number;
        format?: (value: number) => string;
    }>(),
    { step: 0.01, defaultValue: undefined, format: undefined },
);
const model = defineModel<number>({ required: true });

const track = ref<HTMLElement | null>(null);
const dragging = ref(false);

const pct = computed(() => ((model.value - props.min) / (props.max - props.min)) * 100);
const display = computed(() => (props.format ? props.format(model.value) : String(model.value)));

function snap(value: number): number {
    const stepped = Math.round((value - props.min) / props.step) * props.step + props.min;
    return Number(Math.max(props.min, Math.min(props.max, stepped)).toFixed(4));
}

function fromPointer(event: PointerEvent) {
    const rect = track.value?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    model.value = snap(props.min + ratio * (props.max - props.min));
}

function onDown(event: PointerEvent) {
    dragging.value = true;
    (event.currentTarget as HTMLElement)?.setPointerCapture?.(event.pointerId);
    fromPointer(event);
}
function onMove(event: PointerEvent) {
    if (dragging.value) fromPointer(event);
}
function onUp() {
    dragging.value = false;
}
function onKey(event: KeyboardEvent) {
    const big = event.shiftKey ? 10 : 1;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown")
        model.value = snap(model.value - props.step * big);
    else if (event.key === "ArrowRight" || event.key === "ArrowUp")
        model.value = snap(model.value + props.step * big);
    else return;
    event.preventDefault();
    event.stopPropagation();
}
function reset() {
    if (props.defaultValue != null) model.value = props.defaultValue;
}
</script>

<template>
    <div
        class="mjr-studio-slider"
        :title="defaultValue != null ? 'Double-click to reset' : undefined"
        @dblclick="reset"
    >
        <div class="mjr-studio-slider__head">
            <span>{{ label }}</span>
            <span class="mjr-studio-slider__value">{{ display }}</span>
        </div>
        <div
            ref="track"
            class="mjr-studio-slider__track"
            role="slider"
            tabindex="0"
            :aria-label="label"
            :aria-valuemin="min"
            :aria-valuemax="max"
            :aria-valuenow="model"
            @pointerdown="onDown"
            @pointermove="onMove"
            @pointerup="onUp"
            @pointercancel="onUp"
            @keydown="onKey"
        >
            <div class="mjr-studio-slider__fill" :style="{ width: `${pct}%` }" />
            <div class="mjr-studio-slider__knob" :style="{ left: `${pct}%` }" />
        </div>
    </div>
</template>
