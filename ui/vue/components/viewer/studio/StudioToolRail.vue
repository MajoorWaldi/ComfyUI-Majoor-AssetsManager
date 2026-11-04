<script setup lang="ts">
/**
 * StudioToolRail.vue - vertical review-tool HUD on the left of the stage.
 *
 * Each icon toggles a tool; tools with settings open a floating panel next
 * to the rail. Covers the classic viewer's toolset: channels, exposure /
 * gamma, zebra, scopes, guides, aspect mask, probe, loupe, compare, copy.
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import { t } from "../../../../app/i18n.js";
import {
    COMPARE_MODES,
    type StudioAspect,
    type StudioChannel,
    type StudioCompare,
    type StudioGrid,
    type StudioScopes,
    type StudioTools,
    defaultStudioTools,
} from "../../../../features/viewer/studio/studioFx.js";
import StudioSlider from "./StudioSlider.vue";

const tools = defineModel<StudioTools>("tools", { required: true });
const props = defineProps<{
    isVideo: boolean;
    canAnalyse: boolean;
    canCompare: boolean;
    compareName?: string;
}>();
const emit = defineEmits<{
    (e: "cycle-b", delta: number): void;
    (e: "pin-b"): void;
    (e: "swap"): void;
    (e: "copy"): void;
}>();

type PanelId =
    "channels" | "exposure" | "zebra" | "scopes" | "grid" | "aspect" | "loupe" | "compare" | null;
const panel = ref<PanelId>(null);
const panelTop = ref(0);
const rail = ref<HTMLElement | null>(null);

const CHANNELS: { value: StudioChannel; label: string }[] = [
    { value: "rgb", label: "RGB" },
    { value: "r", label: "R" },
    { value: "g", label: "G" },
    { value: "b", label: "B" },
    { value: "a", label: "A" },
    { value: "l", label: "Luma" },
];
const SCOPES: { value: StudioScopes; label: string }[] = [
    { value: "off", label: "Off" },
    { value: "hist", label: "Histogram" },
    { value: "wave", label: "Waveform" },
    { value: "both", label: "Both" },
];
const GRIDS: { value: StudioGrid; label: string }[] = [
    { value: "off", label: "Off" },
    { value: "thirds", label: "Thirds" },
    { value: "golden", label: "Golden" },
    { value: "center", label: "Center" },
    { value: "safe", label: "Safe areas" },
];
const ASPECTS: { value: StudioAspect; label: string }[] = [
    { value: "off", label: "Off" },
    { value: "16:9", label: "16:9" },
    { value: "9:16", label: "9:16" },
    { value: "1:1", label: "1:1" },
    { value: "4:3", label: "4:3" },
    { value: "2.39", label: "2.39" },
];
const compareModes = computed(() => COMPARE_MODES.filter((m) => !(props.isVideo && m.imageOnly)));

const exposureActive = computed(
    () => Math.abs(tools.value.exposure) > 1e-3 || Math.abs(tools.value.gamma - 1) > 1e-3,
);

function toggle(id: Exclude<PanelId, null>, event: MouseEvent) {
    if (panel.value === id) {
        panel.value = null;
        return;
    }
    const button = event.currentTarget as HTMLElement | null;
    const railTop = rail.value?.getBoundingClientRect().top ?? 0;
    panelTop.value = Math.max(0, (button?.getBoundingClientRect().top ?? railTop) - railTop);
    panel.value = id;
}

function resetColor() {
    const d = defaultStudioTools();
    tools.value.exposure = d.exposure;
    tools.value.gamma = d.gamma;
}
function resetAll() {
    const d = defaultStudioTools();
    Object.assign(tools.value, {
        ...d,
        loupeSize: tools.value.loupeSize,
        loupeZoom: tools.value.loupeZoom,
    });
    panel.value = null;
}
function setCompare(mode: StudioCompare) {
    tools.value.compare = tools.value.compare === mode ? "off" : mode;
}

function onDocPointer(event: PointerEvent) {
    if (!panel.value) return;
    if (rail.value?.contains(event.target as Node)) return;
    panel.value = null;
}
onMounted(() => {
    document.addEventListener("pointerdown", onDocPointer, true);
});
onBeforeUnmount(() => {
    document.removeEventListener("pointerdown", onDocPointer, true);
});

const fmtEv = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(2)} EV`;
const fmtGamma = (v: number) => v.toFixed(2);
const fmtPct = (v: number) => `${Math.round(v * 100)}%`;
const fmtX = (v: number) => `${v}×`;
const fmtPx = (v: number) => `${v}px`;

/** Closes the open settings panel; true when one was open (Escape handling). */
function closePanel(): boolean {
    if (!panel.value) return false;
    panel.value = null;
    return true;
}

defineExpose({ closePanel });
</script>

<template>
    <div ref="rail" class="mjr-studio-rail" @pointerdown.stop @wheel.stop @dblclick.stop>
        <div
            class="mjr-studio-rail__bar"
            role="toolbar"
            :aria-label="t('viewer.studio.tools', 'Review tools')"
        >
            <template v-if="canAnalyse">
                <MButton
                    type="button"
                    class="mjr-studio-rail__btn"
                    :class="{ 'is-on': tools.channel !== 'rgb', 'is-open': panel === 'channels' }"
                    :title="t('viewer.studio.channels', 'Channels')"
                    @click="toggle('channels', $event)"
                >
                    <i class="pi pi-palette" aria-hidden="true" />
                    <span v-if="tools.channel !== 'rgb'" class="mjr-studio-rail__tag">{{
                        tools.channel.toUpperCase()
                    }}</span>
                </MButton>
                <MButton
                    type="button"
                    class="mjr-studio-rail__btn"
                    :class="{ 'is-on': exposureActive, 'is-open': panel === 'exposure' }"
                    :title="t('viewer.studio.exposure', 'Exposure / gamma')"
                    @click="toggle('exposure', $event)"
                >
                    <i class="pi pi-bolt" aria-hidden="true" />
                </MButton>
                <MButton
                    type="button"
                    class="mjr-studio-rail__btn"
                    :class="{ 'is-on': tools.zebra, 'is-open': panel === 'zebra' }"
                    :title="t('viewer.studio.zebra', 'Zebra highlights (Z)')"
                    @click="toggle('zebra', $event)"
                >
                    <i class="pi pi-exclamation-triangle" aria-hidden="true" />
                </MButton>
                <MButton
                    type="button"
                    class="mjr-studio-rail__btn"
                    :class="{ 'is-on': tools.scopes !== 'off', 'is-open': panel === 'scopes' }"
                    :title="t('viewer.studio.scopes', 'Scopes (S)')"
                    @click="toggle('scopes', $event)"
                >
                    <i class="pi pi-chart-bar" aria-hidden="true" />
                </MButton>
                <span class="mjr-studio-rail__sep" />
            </template>
            <MButton
                type="button"
                class="mjr-studio-rail__btn"
                :class="{ 'is-on': tools.grid !== 'off', 'is-open': panel === 'grid' }"
                :title="t('viewer.studio.grid', 'Guides (G)')"
                @click="toggle('grid', $event)"
            >
                <i class="pi pi-th-large" aria-hidden="true" />
            </MButton>
            <MButton
                type="button"
                class="mjr-studio-rail__btn"
                :class="{ 'is-on': tools.aspect !== 'off', 'is-open': panel === 'aspect' }"
                :title="t('viewer.studio.aspect', 'Aspect ratio mask')"
                @click="toggle('aspect', $event)"
            >
                <i class="pi pi-stop" aria-hidden="true" />
            </MButton>
            <template v-if="canAnalyse">
                <span class="mjr-studio-rail__sep" />
                <MButton
                    type="button"
                    class="mjr-studio-rail__btn"
                    :class="{ 'is-on': tools.probe }"
                    :title="t('viewer.studio.probe', 'Pixel probe (P)')"
                    @click="tools.probe = !tools.probe"
                >
                    <i class="pi pi-map-marker" aria-hidden="true" />
                </MButton>
                <MButton
                    type="button"
                    class="mjr-studio-rail__btn"
                    :class="{ 'is-on': tools.loupe, 'is-open': panel === 'loupe' }"
                    :title="t('viewer.studio.loupe', 'Loupe (L) - right-click for settings')"
                    @click="tools.loupe = !tools.loupe"
                    @contextmenu.prevent="toggle('loupe', $event)"
                >
                    <i class="pi pi-search-plus" aria-hidden="true" />
                </MButton>
            </template>
            <template v-if="canCompare">
                <span class="mjr-studio-rail__sep" />
                <MButton
                    type="button"
                    class="mjr-studio-rail__btn"
                    :class="{ 'is-on': tools.compare !== 'off', 'is-open': panel === 'compare' }"
                    :title="t('viewer.studio.compareTool', 'Compare A/B (C)')"
                    @click="toggle('compare', $event)"
                >
                    <i class="pi pi-clone" aria-hidden="true" />
                </MButton>
            </template>
            <span class="mjr-studio-rail__sep" />
            <MButton
                v-if="canAnalyse"
                type="button"
                class="mjr-studio-rail__btn"
                :title="t('viewer.studio.copy', 'Copy image / frame to clipboard')"
                @click="emit('copy')"
            >
                <i class="pi pi-copy" aria-hidden="true" />
            </MButton>
            <MButton
                type="button"
                class="mjr-studio-rail__btn"
                :title="t('viewer.studio.resetTools', 'Reset all tools (R)')"
                @click="resetAll"
            >
                <i class="pi pi-refresh" aria-hidden="true" />
            </MButton>
        </div>

        <div
            v-if="panel"
            class="mjr-studio-rail__panel"
            :style="{ top: `${panelTop}px` }"
            role="dialog"
        >
            <template v-if="panel === 'channels'">
                <div class="mjr-studio-rail__title">
                    {{ t("viewer.studio.channels", "Channels") }}
                </div>
                <div class="mjr-studio-seg">
                    <MButton
                        v-for="c in CHANNELS"
                        :key="c.value"
                        type="button"
                        :class="{ 'is-on': tools.channel === c.value }"
                        @click="tools.channel = c.value"
                        >{{ c.label }}</MButton
                    >
                </div>
            </template>
            <template v-else-if="panel === 'exposure'">
                <div class="mjr-studio-rail__title">
                    {{ t("viewer.studio.exposure", "Exposure / gamma") }}
                </div>
                <StudioSlider
                    v-model="tools.exposure"
                    :label="t('viewer.studio.ev', 'Exposure')"
                    :min="-5"
                    :max="5"
                    :step="0.05"
                    :default-value="0"
                    :format="fmtEv"
                />
                <StudioSlider
                    v-model="tools.gamma"
                    :label="t('viewer.studio.gamma', 'Gamma')"
                    :min="0.1"
                    :max="3"
                    :step="0.01"
                    :default-value="1"
                    :format="fmtGamma"
                />
                <MButton type="button" class="mjr-studio-btn is-text" @click="resetColor">{{
                    t("viewer.studio.reset", "Reset")
                }}</MButton>
            </template>
            <template v-else-if="panel === 'zebra'">
                <div class="mjr-studio-rail__title">
                    {{ t("viewer.studio.zebra", "Zebra highlights (Z)") }}
                </div>
                <div class="mjr-studio-seg">
                    <MButton
                        type="button"
                        :class="{ 'is-on': !tools.zebra }"
                        @click="tools.zebra = false"
                        >Off</MButton
                    >
                    <MButton
                        type="button"
                        :class="{ 'is-on': tools.zebra }"
                        @click="tools.zebra = true"
                        >On</MButton
                    >
                </div>
                <StudioSlider
                    v-model="tools.zebraThreshold"
                    :label="t('viewer.studio.threshold', 'Threshold')"
                    :min="0.5"
                    :max="1"
                    :step="0.01"
                    :default-value="0.95"
                    :format="fmtPct"
                />
            </template>
            <template v-else-if="panel === 'scopes'">
                <div class="mjr-studio-rail__title">
                    {{ t("viewer.studio.scopes", "Scopes (S)") }}
                </div>
                <div class="mjr-studio-seg is-wrap">
                    <MButton
                        v-for="s in SCOPES"
                        :key="s.value"
                        type="button"
                        :class="{ 'is-on': tools.scopes === s.value }"
                        @click="tools.scopes = s.value"
                        >{{ s.label }}</MButton
                    >
                </div>
            </template>
            <template v-else-if="panel === 'grid'">
                <div class="mjr-studio-rail__title">
                    {{ t("viewer.studio.grid", "Guides (G)") }}
                </div>
                <div class="mjr-studio-seg is-wrap">
                    <MButton
                        v-for="g in GRIDS"
                        :key="g.value"
                        type="button"
                        :class="{ 'is-on': tools.grid === g.value }"
                        @click="tools.grid = g.value"
                        >{{ g.label }}</MButton
                    >
                </div>
            </template>
            <template v-else-if="panel === 'aspect'">
                <div class="mjr-studio-rail__title">
                    {{ t("viewer.studio.aspect", "Aspect ratio mask") }}
                </div>
                <div class="mjr-studio-seg is-wrap">
                    <MButton
                        v-for="a in ASPECTS"
                        :key="a.value"
                        type="button"
                        :class="{ 'is-on': tools.aspect === a.value }"
                        @click="tools.aspect = a.value"
                        >{{ a.label }}</MButton
                    >
                </div>
                <StudioSlider
                    v-model="tools.maskOpacity"
                    :label="t('viewer.studio.opacity', 'Opacity')"
                    :min="0"
                    :max="1"
                    :step="0.05"
                    :default-value="0.65"
                    :format="fmtPct"
                />
            </template>
            <template v-else-if="panel === 'loupe'">
                <div class="mjr-studio-rail__title">
                    {{ t("viewer.studio.loupeTitle", "Loupe") }}
                </div>
                <StudioSlider
                    v-model="tools.loupeZoom"
                    :label="t('viewer.studio.magnification', 'Magnification')"
                    :min="2"
                    :max="32"
                    :step="1"
                    :default-value="8"
                    :format="fmtX"
                />
                <StudioSlider
                    v-model="tools.loupeSize"
                    :label="t('viewer.studio.size', 'Size')"
                    :min="80"
                    :max="320"
                    :step="10"
                    :default-value="140"
                    :format="fmtPx"
                />
            </template>
            <template v-else-if="panel === 'compare'">
                <div class="mjr-studio-rail__title">
                    {{ t("viewer.studio.compareTool", "Compare A/B (C)") }}
                </div>
                <div class="mjr-studio-seg is-wrap">
                    <MButton
                        v-for="m in compareModes"
                        :key="m.value"
                        type="button"
                        :class="{ 'is-on': tools.compare === m.value }"
                        @click="setCompare(m.value)"
                        >{{ m.label }}</MButton
                    >
                </div>
                <div class="mjr-studio-rail__b">
                    <span class="mjr-studio-rail__b-label">B</span>
                    <MButton
                        type="button"
                        class="mjr-studio-btn"
                        :title="t('viewer.studio.prevB', 'Previous B')"
                        @click="emit('cycle-b', -1)"
                        ><i class="pi pi-chevron-left" aria-hidden="true"
                    /></MButton>
                    <span class="mjr-studio-rail__b-name" :title="compareName">{{
                        compareName || "—"
                    }}</span>
                    <MButton
                        type="button"
                        class="mjr-studio-btn"
                        :title="t('viewer.studio.nextB', 'Next B')"
                        @click="emit('cycle-b', 1)"
                        ><i class="pi pi-chevron-right" aria-hidden="true"
                    /></MButton>
                </div>
                <div class="mjr-studio-seg">
                    <MButton
                        type="button"
                        :title="t('viewer.studio.pinB', 'Use the current asset as B (B)')"
                        @click="emit('pin-b')"
                        ><i class="pi pi-bookmark" aria-hidden="true" />
                        {{ t("viewer.studio.pinBShort", "Set B") }}</MButton
                    >
                    <MButton
                        type="button"
                        :title="t('viewer.studio.swap', 'Swap A and B (X)')"
                        @click="emit('swap')"
                        ><i class="pi pi-arrow-right-arrow-left" aria-hidden="true" />
                        {{ t("viewer.studio.swapShort", "Swap") }}</MButton
                    >
                </div>
                <StudioSlider
                    v-if="tools.compare === 'wipe' || tools.compare === 'wipeV'"
                    v-model="tools.wipe"
                    :label="t('viewer.studio.wipe', 'Wipe')"
                    :min="0"
                    :max="100"
                    :step="1"
                    :default-value="50"
                    :format="(v: number) => `${v}%`"
                />
            </template>
        </div>
    </div>
</template>
