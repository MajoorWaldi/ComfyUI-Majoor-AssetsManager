<script setup lang="ts">
/**
 * StudioViewer.vue - the main viewer, rebuilt for reviewing AI generations.
 *
 * Layout: header (navigation, file, actions) / stage (image or player) +
 * inspector (review, generation data, workflow, file) / filmstrip.
 *
 * It reuses the asset sidebar's components for generation metadata, workflow,
 * rating and tags, so the data shown is identical everywhere. Compare modes
 * (A/B, side-by-side) and 3D models stay in the classic viewer, reached
 * through the `open-classic` event.
 */
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from "vue";

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
import StudioImageStage from "./StudioImageStage.vue";
import StudioPlayer from "./StudioPlayer.vue";

const emit = defineEmits<{
    (e: "open-classic", payload: { assets: unknown[]; index: number; mode: string }): void;
}>();

type InspectorTab = "generation" | "workflow" | "file";

const overlay = ref<HTMLElement | null>(null);
const imageStage = ref<InstanceType<typeof StudioImageStage> | null>(null);
const player = ref<InstanceType<typeof StudioPlayer> | null>(null);
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
const canCompare = computed(() => count.value >= 2);

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
    let handled = true;
    if (key === "Escape") close();
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
    else if ((key === "c" || key === "C") && canCompare.value) openClassic("ab");
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
                        :title="t('viewer.studio.compare', 'Compare with next (C)')"
                        @click="openClassic('ab')"
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
                        :title="
                            t(
                                'viewer.studio.classic',
                                'Open in classic viewer (tools: scopes, loupe, grading)',
                            )
                        "
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
                <section class="mjr-studio__stage">
                    <StudioImageStage
                        v-if="kind === 'image'"
                        ref="imageStage"
                        :key="`img:${mediaUrl}`"
                        :src="mediaUrl"
                        :alt="asset?.filename"
                        :checker="checker"
                        @zoom="zoom = $event"
                    />
                    <StudioPlayer
                        v-else-if="kind === 'video' || kind === 'audio'"
                        ref="player"
                        :key="`media:${mediaUrl}`"
                        :src="mediaUrl"
                        :kind="kind"
                        :fps="fps"
                        :frame-count="frameCount"
                        :filename="asset?.filename"
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
                        <TagsEditor :key="`t:${shown.id}`" :asset="shown" :model-value="tags" />
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
