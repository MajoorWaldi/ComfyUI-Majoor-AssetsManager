<script setup lang="ts">
/**
 * ViewerPortal.vue - Vue lifecycle owner for the viewers.
 *
 * Installed from the always-mounted GlobalRuntime Vue app so both the main
 * (Studio) viewer and the floating viewer runtime remain available even when
 * the Assets Manager sidebar tab has not been opened yet.
 *
 * Routes OPEN_VIEWER requests to the Studio viewer and installs the floating
 * viewer global handlers from Vue instead of from a module side-effect.
 */
import { onMounted, onUnmounted } from "vue";
import { EVENTS } from "../../../app/events.js";
import {
    installFloatingViewerGlobalHandlers,
    teardownFloatingViewerManager,
} from "../../../features/viewer/floatingViewerManager.js";
import FloatingViewerHost from "./FloatingViewerHost.vue";
import StudioViewer from "./studio/StudioViewer.vue";
import { openStudioViewer } from "../../../features/viewer/studio/studioViewerState.js";

const emit = defineEmits<{ ready: [] }>();

interface OpenViewerEventDetail {
    assets?: unknown[];
    asset?: unknown;
    index?: unknown;
    mode?: unknown;
    handled?: boolean;
}

function _openFromEvent(event: Event) {
    const detail: OpenViewerEventDetail = (event as CustomEvent)?.detail || {};
    const assets = Array.isArray(detail?.assets)
        ? detail.assets.filter(Boolean)
        : detail?.asset
          ? [detail.asset]
          : [];
    if (!assets.length) return;

    const index = Math.max(0, Math.min(Number(detail?.index) || 0, assets.length - 1));
    const mode = String(detail?.mode || "")
        .trim()
        .toLowerCase();
    if (openStudioViewer(assets, index, mode)) detail.handled = true;
}

onMounted(() => {
    try {
        installFloatingViewerGlobalHandlers();
    } catch (e) {
        console.debug?.(e);
    }
    try {
        window.addEventListener(EVENTS.OPEN_VIEWER, _openFromEvent);
    } catch (e) {
        console.debug?.(e);
    }
    // Listeners are installed: let GlobalRuntime replay the event that booted us.
    emit("ready");
});

onUnmounted(() => {
    try {
        window.removeEventListener(EVENTS.OPEN_VIEWER, _openFromEvent);
    } catch (e) {
        console.debug?.(e);
    }
    try {
        teardownFloatingViewerManager();
    } catch (e) {
        console.debug?.(e);
    }
});
</script>

<template>
    <StudioViewer />
    <FloatingViewerHost />
</template>
