<script setup lang="ts">
/**
 * StudioViewer.vue - the main viewer, rebuilt for reviewing AI generations.
 *
 * Layout: header (navigation, file, actions) / stage (image or player) +
 * inspector (review, generation data, workflow, file) / filmstrip.
 *
 * It reuses the asset sidebar's components for generation metadata, workflow,
 * rating and tags, so the data shown is identical everywhere.
 *
 * Review tools live in a HUD rail on the left of the stage (channels,
 * exposure/gamma, zebra, scopes, guides, aspect mask, probe, loupe, A/B
 * compare, copy). The classic viewer stays reachable through `open-classic`.
 */
import { computed, nextTick, onBeforeUnmount, reactive, ref, shallowRef, watch } from "vue";

import {
    getAssetMetadata,
    getFileMetadataScoped,
    getViewerInfo,
    updateAssetRating,
} from "../../../../api/client.js";
import { buildAssetViewURL, buildThumbnailURL } from "../../../../api/endpoints.js";
import { ASSET_RATING_CHANGED_EVENT } from "../../../../app/events.js";
import { t } from "../../../../app/i18n.js";
import { comfyToast } from "../../../../app/toast.js";
import { ensureViewerMetadataAsset } from "../../../../features/viewer/genInfo.js";
import {
    defaultStudioTools,
    hasColorFx,
    nextCompareIndex,
    type StudioGrid,
    type StudioScopes,
} from "../../../../features/viewer/studio/studioFx.js";
import { sourceToPngBlob } from "../../../../features/viewer/studio/studioSampler.js";
import {
    assetSummary,
    filmstripWindow,
    resolveAssetFps,
    studioMediaKind,
} from "../../../../features/viewer/studio/studioMedia.js";
import {
    closeStudioViewer,
    goToStudioIndex,
    stepStudioViewer,
    studioViewerState,
} from "../../../../features/viewer/studio/studioViewerState.js";
import RatingEditor from "../../common/RatingEditor.vue";
import TagsEditor from "../../common/TagsEditor.vue";
import SidebarFileInfoSection from "../../panel/sidebar/SidebarFileInfoSection.vue";
import SidebarGenerationSection from "../../panel/sidebar/SidebarGenerationSection.vue";
import SidebarWorkflowSection from "../../panel/sidebar/SidebarWorkflowSection.vue";
import StudioFxDefs from "./StudioFxDefs.vue";
import StudioGuides from "./StudioGuides.vue";
import StudioImageStage from "./StudioImageStage.vue";
import StudioModel3D from "./StudioModel3D.vue";
import StudioPlayer from "./StudioPlayer.vue";
import StudioProbe from "./StudioProbe.vue";
import StudioScopesHud from "./StudioScopes.vue";
import StudioToolRail from "./StudioToolRail.vue";
import StudioZebra from "./StudioZebra.vue";

const emit = defineEmits<{
    (e: "open-classic", payload: { assets: unknown[]; index: number; mode: string }): void;
}>();

type InspectorTab = "generation" | "workflow" | "file";

const overlay = ref<HTMLElement | null>(null);
const imageStage = ref<InstanceType<typeof StudioImageStage> | null>(null);
const player = ref<InstanceType<typeof StudioPlayer> | null>(null);
const toolRail = ref<InstanceType<typeof StudioToolRail> | null>(null);
const inspectorOpen = ref(true);
const tab = ref<InspectorTab>("generation");
const checker = ref(false);
const zoom = ref(1);
const detail = shallowRef<any>(null);
const viewerInfo = shallowRef<any>(null);
let hydrateAbort: AbortController | null = null;

const asset = computed(() => studioViewerState.assets[studioViewerState.index] ?? null);
const shown = computed(() => detail.value ?? asset.value);
const kind = computed(() => studioMediaKind(asset.value));
const mediaUrl = computed(() => (asset.value ? buildAssetViewURL(asset.value) : ""));
const count = computed(() => studioViewerState.assets.length);
const summary = computed(() => assetSummary(shown.value));
const fps = computed(() => resolveAssetFps(shown.value, viewerInfo.value));
const frameCount = computed(() => Number(viewerInfo.value?.frame_count) || null);
const rating = computed(() => Number(shown.value?.rating) || 0);
const tags = computed(() => (Array.isArray(shown.value?.tags) ? shown.value.tags : []));
const filmstrip = computed(() => {
    const { start, end } = filmstripWindow(count.value, studioViewerState.index);
    return studioViewerState.assets
        .slice(start, end)
        .map((a, i) => ({ asset: a, index: start + i }));
});

// ── Review tools (HUD rail) ────────────────────────────────────────────
const tools = reactive(defaultStudioTools());
const filterId = `mjr-studio-fx-${Math.random().toString(36).slice(2, 9)}`;
const compareIndex = ref<number | null>(null);
const tick = ref(0);
let tickTimer: ReturnType<typeof setInterval> | null = null;
let lastFrameTime = -1;

const canAnalyse = computed(() => kind.value === "image" || kind.value === "video");
const bIndex = computed(() => {
    if (!canAnalyse.value) return null;
    const pinned = compareIndex.value;
    const list = studioViewerState.assets;
    const current = studioViewerState.index;
    if (
        pinned != null &&
        pinned !== current &&
        list[pinned] &&
        studioMediaKind(list[pinned]) === kind.value
    )
        return pinned;
    return nextCompareIndex(list, current, 1, (a) => studioMediaKind(a) === kind.value);
});
const canCompare = computed(() => bIndex.value != null);
const compareAsset = computed(() =>
    bIndex.value != null ? studioViewerState.assets[bIndex.value] : null,
);
const comparing = computed(() => tools.compare !== "off" && !!compareAsset.value);
const compareSrc = computed(() =>
    comparing.value && compareAsset.value ? buildAssetViewURL(compareAsset.value) : null,
);
const subtractSrc = computed(() =>
    comparing.value && tools.compare === "subtract" && kind.value === "image"
        ? compareSrc.value
        : null,
);
const mediaFilter = computed(() =>
    canAnalyse.value && (hasColorFx(tools) || subtractSrc.value) ? `url(#${filterId})` : "",
);
const needsTick = computed(() => canAnalyse.value && (tools.zebra || tools.scopes !== "off"));

function getSource() {
    if (kind.value === "image") return imageStage.value?.getSource?.() ?? null;
    if (kind.value === "video") return player.value?.getSource?.() ?? null;
    return null;
}
function getBox() {
    if (kind.value === "image") return imageStage.value?.getBox?.() ?? null;
    if (kind.value === "video") return player.value?.getBox?.() ?? null;
    return null;
}

/** Re-sample zebra / scopes: on image load, and ~8 fps while a video frame changes. */
function bumpTick() {
    tick.value += 1;
}
function stopTicker() {
    if (tickTimer) clearInterval(tickTimer);
    tickTimer = null;
}
watch(
    [needsTick, kind, () => studioViewerState.open],
    ([need, k, open]) => {
        stopTicker();
        if (!need || !open || k !== "video") return;
        lastFrameTime = -1;
        tickTimer = setInterval(() => {
            const v = getSource() as HTMLVideoElement | null;
            const time = v?.currentTime ?? -1;
            if (time !== lastFrameTime) {
                lastFrameTime = time;
                bumpTick();
            }
        }, 120);
    },
    { immediate: true },
);
watch(needsTick, (need) => {
    if (need) void nextTick(bumpTick);
});

function cycleB(delta: number) {
    const from = bIndex.value ?? studioViewerState.index;
    const next = nextCompareIndex(
        studioViewerState.assets,
        from,
        delta,
        (a, i) => i !== studioViewerState.index && studioMediaKind(a) === kind.value,
    );
    if (next != null) compareIndex.value = next;
}
function pinB() {
    compareIndex.value = studioViewerState.index;
    const next = nextCompareIndex(
        studioViewerState.assets,
        studioViewerState.index,
        1,
        (a) => studioMediaKind(a) === kind.value,
    );
    if (next != null) goToStudioIndex(next);
    if (tools.compare === "off") tools.compare = "wipe";
}
function swapAB() {
    const b = bIndex.value;
    if (b == null) return;
    compareIndex.value = studioViewerState.index;
    goToStudioIndex(b);
}
function toggleCompare() {
    if (!canCompare.value) return;
    tools.compare = tools.compare === "off" ? "wipe" : "off";
}

async function copyToClipboard() {
    const blob = await sourceToPngBlob(getSource());
    const ClipboardItemCtor = (window as any).ClipboardItem;
    if (!blob || !ClipboardItemCtor || !navigator.clipboard?.write) {
        comfyToast(t("viewer.studio.copyFailed", "Could not copy this image"), "error");
        return;
    }
    try {
        await navigator.clipboard.write([new ClipboardItemCtor({ "image/png": blob })]);
        comfyToast(t("viewer.studio.copied", "Copied to clipboard"), "success");
    } catch (e) {
        console.debug?.(e);
        comfyToast(t("viewer.studio.copyFailed", "Could not copy this image"), "error");
    }
}

const SCOPE_CYCLE: StudioScopes[] = ["off", "hist", "wave", "both"];
const GRID_CYCLE: StudioGrid[] = ["off", "thirds", "golden", "center", "safe"];
function cycle<T>(list: T[], value: T): T {
    return list[(list.indexOf(value) + 1) % list.length];
}

watch(
    () => studioViewerState.session,
    () => {
        compareIndex.value = null;
        tools.compare = studioViewerState.compare || "off";
        // A new open request while already open: take focus back from editors.
        void nextTick(() => {
            const active = document.activeElement as HTMLElement | null;
            if (active && overlay.value?.contains(active) && isTypingTarget(active)) active.blur();
            overlay.value?.focus?.({ preventScroll: true });
        });
    },
    { immediate: true },
);

async function hydrate(target: any) {
    hydrateAbort?.abort();
    detail.value = null;
    viewerInfo.value = null;
    if (!target) return;
    const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
    hydrateAbort = ac;
    try {
        const full = await ensureViewerMetadataAsset(target, {
            getAssetMetadata,
            getFileMetadataScoped,
            signal: ac?.signal,
        });
        if (hydrateAbort === ac && asset.value === target) {
            // A copy: full metadata stays out of the grid's asset objects.
            // Rating/tag editors broadcast their changes, so the grid still updates.
            detail.value = full && typeof full === "object" ? full : target;
        }
    } catch (e) {
        console.debug?.(e);
    }
    const k = studioMediaKind(target);
    if ((k === "video" || k === "audio") && target?.id != null) {
        try {
            const res: any = await getViewerInfo(target.id, ac ? { signal: ac.signal } : {});
            if (hydrateAbort === ac && res?.ok) viewerInfo.value = res.data || null;
        } catch (e) {
            console.debug?.(e);
        }
    }
}

watch(asset, (next) => void hydrate(next), { immediate: true });

watch(
    () => studioViewerState.open,
    async (open) => {
        if (open) {
            await nextTick();
            overlay.value?.focus?.();
            window.addEventListener("keydown", onKeydown, true);
        } else {
            window.removeEventListener("keydown", onKeydown, true);
            stopTicker();
            player.value?.release?.();
            hydrateAbort?.abort();
            if (document.fullscreenElement && overlay.value?.contains(document.fullscreenElement)) {
                void document.exitFullscreen?.();
            }
        }
    },
    { immediate: true },
);

onBeforeUnmount(() => {
    window.removeEventListener("keydown", onKeydown, true);
    stopTicker();
    hydrateAbort?.abort();
});

function close() {
    closeStudioViewer();
}

function openClassic(mode = "") {
    const payload = {
        assets: studioViewerState.assets.slice(),
        index: studioViewerState.index,
        mode,
    };
    closeStudioViewer();
    emit("open-classic", payload);
}

function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen?.();
    else void overlay.value?.requestFullscreen?.();
}

function download() {
    if (!mediaUrl.value) return;
    const link = document.createElement("a");
    link.href = mediaUrl.value;
    link.download = String(asset.value?.filename || "");
    link.click();
}

async function setRating(value: number) {
    const target = asset.value;
    if (!target) return;
    const next = Math.max(0, Math.min(5, value));
    const res: any = await updateAssetRating(target, next);
    if (!res?.ok) {
        comfyToast(res?.error || t("toast.ratingUpdateFailed", "Rating update failed"), "error");
        return;
    }
    target.rating = next;
    detail.value = detail.value ? { ...detail.value, rating: next } : target;
    window.dispatchEvent(
        new CustomEvent(ASSET_RATING_CHANGED_EVENT, {
            detail: { assetId: target.id != null ? String(target.id) : "", rating: next },
        }),
    );
}

function isTypingTarget(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    return !!el?.closest?.("input, textarea, select, [contenteditable='true']");
}

function onKeydown(event: KeyboardEvent) {
    if (!studioViewerState.open) return;
    if (isTypingTarget(event.target)) {
        if (event.key === "Escape") (event.target as HTMLElement)?.blur?.();
        return;
    }
    const isMedia = kind.value === "video" || kind.value === "audio";
    const key = event.key;
    const lower = key.length === 1 ? key.toLowerCase() : key;
    const plain = !event.ctrlKey && !event.metaKey && !event.altKey;
    const tool = canAnalyse.value && plain;
    let handled = true;
    if (key === "Escape" && toolRail.value?.closePanel?.()) {
        /* closed the open tool panel */
    } else if (key === "Escape") close();
    else if (lower === "c" && (event.ctrlKey || event.metaKey) && canAnalyse.value)
        void copyToClipboard();
    else if (key === "ArrowLeft" && !event.shiftKey) stepStudioViewer(-1);
    else if (key === "ArrowRight" && !event.shiftKey) stepStudioViewer(1);
    else if (key === "ArrowLeft" && event.shiftKey && isMedia) player.value?.seekBy?.(-5);
    else if (key === "ArrowRight" && event.shiftKey && isMedia) player.value?.seekBy?.(5);
    else if (key === "Home") goToStudioIndex(0);
    else if (key === "End") goToStudioIndex(count.value - 1);
    else if (key === " " && isMedia) player.value?.togglePlay?.();
    else if (key === "," && isMedia) player.value?.stepFrame?.(-1);
    else if (key === "." && isMedia) player.value?.stepFrame?.(1);
    else if ((key === "i" || key === "I") && isMedia) player.value?.setLoopA?.();
    else if ((key === "o" || key === "O") && isMedia) player.value?.setLoopB?.();
    else if ((key === "u" || key === "U") && isMedia) player.value?.clearLoop?.();
    else if ((key === "m" || key === "M") && isMedia) player.value?.toggleMute?.();
    else if (key === "]" && isMedia) player.value?.cycleRate?.(1);
    else if (key === "[" && isMedia) player.value?.cycleRate?.(-1);
    else if (key === "Tab") inspectorOpen.value = !inspectorOpen.value;
    else if (key === "f" || key === "F") toggleFullscreen();
    else if ((key === "+" || key === "=") && kind.value === "image")
        imageStage.value?.zoomBy?.(1.25);
    else if (key === "-" && kind.value === "image") imageStage.value?.zoomBy?.(0.8);
    else if (key === "0" && kind.value === "image" && event.altKey) imageStage.value?.fit?.();
    else if (/^[0-5]$/.test(key) && !event.ctrlKey && !event.metaKey && !event.altKey)
        void setRating(Number(key));
    else if (lower === "c" && plain && canCompare.value) toggleCompare();
    else if (lower === "b" && plain && canCompare.value) pinB();
    else if (lower === "x" && plain && comparing.value) swapAB();
    else if (lower === "z" && tool) tools.zebra = !tools.zebra;
    else if (lower === "s" && tool) tools.scopes = cycle(SCOPE_CYCLE, tools.scopes);
    else if (lower === "g" && plain && canAnalyse.value) tools.grid = cycle(GRID_CYCLE, tools.grid);
    else if (lower === "p" && tool) tools.probe = !tools.probe;
    else if (lower === "l" && tool) tools.loupe = !tools.loupe;
    else if (lower === "r" && tool)
        Object.assign(tools, defaultStudioTools(), {
            loupeSize: tools.loupeSize,
            loupeZoom: tools.loupeZoom,
        });
    else handled = false;
    if (handled) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
    }
}

function thumbUrl(a: any): string {
    return buildThumbnailURL(a, 192) || "";
}
</script>

<template>
    <Teleport to="body">
        <div
            v-if="studioViewerState.open"
            ref="overlay"
            class="mjr-assets-manager mjr-studio"
            :class="{ 'is-inspector-closed': !inspectorOpen }"
            role="dialog"
            aria-modal="true"
            :aria-label="t('viewer.studio.title', 'Viewer')"
            tabindex="-1"
        >
            <header class="mjr-studio__header">
                <div class="mjr-studio__nav">
                    <MButton
                        type="button"
                        class="mjr-studio-btn"
                        :title="t('viewer.studio.prev', 'Previous (←)')"
                        :disabled="count < 2"
                        @click="stepStudioViewer(-1)"
                    >
                        <i class="pi pi-chevron-left" aria-hidden="true" />
                    </MButton>
                    <span class="mjr-studio__counter"
                        >{{ studioViewerState.index + 1 }} / {{ count }}</span
                    >
                    <MButton
                        type="button"
                        class="mjr-studio-btn"
                        :title="t('viewer.studio.next', 'Next (→)')"
                        :disabled="count < 2"
                        @click="stepStudioViewer(1)"
                    >
                        <i class="pi pi-chevron-right" aria-hidden="true" />
                    </MButton>
                </div>
                <div class="mjr-studio__title">
                    <span
                        class="mjr-studio__filename"
                        :title="shown?.filepath || shown?.filename"
                        >{{ shown?.filename }}</span
                    >
                    <span class="mjr-studio__summary">{{ summary }}</span>
                </div>
                <div class="mjr-studio__actions">
                    <template v-if="kind === 'image'">
                        <span
                            class="mjr-studio-chip"
                            :title="
                                t(
                                    'viewer.studio.zoomHint',
                                    'Wheel to zoom, double-click for fit / 100 %',
                                )
                            "
                            >{{ Math.round(zoom * 100) }}%</span
                        >
                        <MButton
                            type="button"
                            class="mjr-studio-btn"
                            :title="t('viewer.studio.fit', 'Fit')"
                            @click="imageStage?.fit()"
                        >
                            <i class="pi pi-arrows-alt" aria-hidden="true" />
                        </MButton>
                        <MButton
                            type="button"
                            class="mjr-studio-btn is-text"
                            :title="t('viewer.studio.actualSize', 'Actual size')"
                            @click="imageStage?.actualSize()"
                            >1:1</MButton
                        >
                        <MButton
                            type="button"
                            class="mjr-studio-btn"
                            :class="{ 'is-on': checker }"
                            :title="t('viewer.studio.checker', 'Transparency checkerboard')"
                            @click="checker = !checker"
                        >
                            <i class="pi pi-th-large" aria-hidden="true" />
                        </MButton>
                    </template>
                    <MButton
                        v-if="canCompare"
                        type="button"
                        class="mjr-studio-btn"
                        :class="{ 'is-on': comparing }"
                        :title="t('viewer.studio.compare', 'Compare A/B (C)')"
                        @click="toggleCompare"
                    >
                        <i class="pi pi-clone" aria-hidden="true" />
                    </MButton>
                    <MButton
                        type="button"
                        class="mjr-studio-btn"
                        :title="t('viewer.studio.download', 'Download')"
                        @click="download"
                    >
                        <i class="pi pi-download" aria-hidden="true" />
                    </MButton>
                    <MButton
                        type="button"
                        class="mjr-studio-btn"
                        :title="t('viewer.studio.classic', 'Open in the classic viewer')"
                        @click="openClassic('')"
                    >
                        <i class="pi pi-sliders-h" aria-hidden="true" />
                    </MButton>
                    <MButton
                        type="button"
                        class="mjr-studio-btn"
                        :class="{ 'is-on': inspectorOpen }"
                        :title="t('viewer.studio.inspector', 'Generation info (Tab)')"
                        @click="inspectorOpen = !inspectorOpen"
                    >
                        <i class="pi pi-info-circle" aria-hidden="true" />
                    </MButton>
                    <MButton
                        type="button"
                        class="mjr-studio-btn"
                        :title="t('viewer.studio.fullscreen', 'Fullscreen (F)')"
                        @click="toggleFullscreen"
                    >
                        <i class="pi pi-window-maximize" aria-hidden="true" />
                    </MButton>
                    <MButton
                        type="button"
                        class="mjr-studio-btn is-close"
                        :title="t('viewer.studio.close', 'Close (Esc)')"
                        @click="close"
                    >
                        <i class="pi pi-times" aria-hidden="true" />
                    </MButton>
                </div>
            </header>

            <main class="mjr-studio__body">
                <section class="mjr-studio__stage" :class="{ 'has-rail': canAnalyse }">
                    <StudioFxDefs
                        v-if="mediaFilter"
                        :filter-id="filterId"
                        :channel="tools.channel"
                        :exposure="tools.exposure"
                        :gamma="tools.gamma"
                        :subtract-src="subtractSrc"
                    />
                    <StudioImageStage
                        v-if="kind === 'image'"
                        ref="imageStage"
                        :key="`img:${mediaUrl}`"
                        v-model:wipe="tools.wipe"
                        :src="mediaUrl"
                        :alt="asset?.filename"
                        :checker="checker"
                        :media-filter="mediaFilter"
                        :compare-src="compareSrc"
                        :compare="tools.compare"
                        :class="{ 'is-probing': tools.probe || tools.loupe }"
                        @zoom="zoom = $event"
                        @loaded="bumpTick"
                    >
                        <template #overlay="{ width, height }">
                            <StudioZebra
                                v-if="tools.zebra"
                                :get-source="getSource"
                                :threshold="tools.zebraThreshold"
                                :tick="tick"
                            />
                            <StudioGuides
                                :width="width"
                                :height="height"
                                :grid="tools.grid"
                                :aspect="tools.aspect"
                                :mask-opacity="tools.maskOpacity"
                            />
                        </template>
                    </StudioImageStage>
                    <StudioPlayer
                        v-else-if="kind === 'video' || kind === 'audio'"
                        ref="player"
                        :key="`media:${mediaUrl}`"
                        v-model:wipe="tools.wipe"
                        :src="mediaUrl"
                        :kind="kind"
                        :fps="fps"
                        :frame-count="frameCount"
                        :filename="asset?.filename"
                        :media-filter="mediaFilter"
                        :compare-src="compareSrc"
                        :compare="tools.compare"
                        :class="{ 'is-probing': tools.probe || tools.loupe }"
                    >
                        <template #overlay="{ width, height }">
                            <StudioZebra
                                v-if="tools.zebra"
                                :get-source="getSource"
                                :threshold="tools.zebraThreshold"
                                :tick="tick"
                            />
                            <StudioGuides
                                :width="width"
                                :height="height"
                                :grid="tools.grid"
                                :aspect="tools.aspect"
                                :mask-opacity="tools.maskOpacity"
                            />
                        </template>
                    </StudioPlayer>
                    <StudioModel3D
                        v-else-if="kind === 'model3d'"
                        :key="`3d:${mediaUrl}`"
                        :asset="asset"
                        :src="mediaUrl"
                    />
                    <div v-else class="mjr-studio__unsupported">
                        <i class="pi pi-file" aria-hidden="true" />
                        <span>{{
                            t("viewer.studio.unsupported", "No preview for this file type.")
                        }}</span>
                        <MButton
                            type="button"
                            class="mjr-studio-btn is-text"
                            @click="openClassic('')"
                        >
                            {{ t("viewer.studio.classicShort", "Classic viewer") }}
                        </MButton>
                    </div>

                    <StudioToolRail
                        v-if="canAnalyse"
                        ref="toolRail"
                        v-model:tools="tools"
                        :is-video="kind === 'video'"
                        :can-analyse="canAnalyse"
                        :can-compare="canCompare"
                        :compare-name="compareAsset?.filename"
                        @cycle-b="cycleB"
                        @pin-b="pinB"
                        @swap="swapAB"
                        @copy="copyToClipboard"
                    />
                    <StudioScopesHud
                        v-if="canAnalyse && tools.scopes !== 'off'"
                        :get-source="getSource"
                        :mode="tools.scopes"
                        :tick="tick"
                    />
                    <StudioProbe
                        v-if="canAnalyse && (tools.probe || tools.loupe)"
                        :get-source="getSource"
                        :get-box="getBox"
                        :probe="tools.probe"
                        :loupe="tools.loupe"
                        :loupe-size="tools.loupeSize"
                        :loupe-zoom="tools.loupeZoom"
                        :media-filter="subtractSrc ? '' : mediaFilter"
                    />
                </section>

                <aside v-if="inspectorOpen && shown" class="mjr-studio__inspector" @keydown.stop>
                    <div class="mjr-studio__review">
                        <div class="mjr-studio__review-row">
                            <span class="mjr-studio__label">{{
                                t("sidebar.rating", "Rating")
                            }}</span>
                            <RatingEditor
                                :key="`r:${shown.id}`"
                                :asset="shown"
                                :model-value="rating"
                                :size="40"
                            />
                        </div>
                        <TagsEditor
                            :key="`t:${shown.id}`"
                            :asset="shown"
                            :model-value="tags"
                            :autofocus="false"
                        />
                    </div>
                    <nav class="mjr-studio__tabs" role="tablist">
                        <MButton
                            type="button"
                            role="tab"
                            :class="{ 'is-active': tab === 'generation' }"
                            @click="tab = 'generation'"
                            >{{ t("viewer.studio.tabGeneration", "Generation") }}</MButton
                        >
                        <MButton
                            type="button"
                            role="tab"
                            :class="{ 'is-active': tab === 'workflow' }"
                            @click="tab = 'workflow'"
                            >{{ t("viewer.studio.tabWorkflow", "Workflow") }}</MButton
                        >
                        <MButton
                            type="button"
                            role="tab"
                            :class="{ 'is-active': tab === 'file' }"
                            @click="tab = 'file'"
                            >{{ t("viewer.studio.tabFile", "File") }}</MButton
                        >
                    </nav>
                    <div class="mjr-studio__tab-body">
                        <SidebarGenerationSection
                            v-if="tab === 'generation'"
                            :key="`g:${shown.id}`"
                            :asset="shown"
                        />
                        <SidebarWorkflowSection
                            v-else-if="tab === 'workflow'"
                            :key="`w:${shown.id}`"
                            :asset="shown"
                        />
                        <SidebarFileInfoSection v-else :key="`f:${shown.id}`" :asset="shown" />
                    </div>
                </aside>
            </main>

            <footer
                v-if="count > 1"
                class="mjr-studio__filmstrip"
                role="listbox"
                :aria-label="t('viewer.studio.filmstrip', 'Filmstrip')"
            >
                <MButton
                    v-for="item in filmstrip"
                    :key="`${item.index}:${item.asset?.id ?? item.asset?.filename}`"
                    type="button"
                    role="option"
                    class="mjr-studio__thumb"
                    :class="{ 'is-current': item.index === studioViewerState.index }"
                    :aria-selected="item.index === studioViewerState.index"
                    :title="item.asset?.filename"
                    @click="goToStudioIndex(item.index)"
                >
                    <img
                        v-if="thumbUrl(item.asset)"
                        :src="thumbUrl(item.asset)"
                        alt=""
                        loading="lazy"
                        draggable="false"
                    />
                    <i v-else class="pi pi-file" aria-hidden="true" />
                    <i
                        v-if="studioMediaKind(item.asset) === 'video'"
                        class="pi pi-play mjr-studio__thumb-badge"
                        aria-hidden="true"
                    />
                </MButton>
            </footer>
        </div>
    </Teleport>
</template>
