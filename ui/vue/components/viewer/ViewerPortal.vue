<script setup lang="ts">
/**
 * ViewerPortal.vue - Vue lifecycle owner for the viewer runtime.
 *
 * Installed from the always-mounted GlobalRuntime Vue app so both the main
 * viewer overlay and the floating viewer runtime remain available even when
 * the Assets Manager sidebar tab has not been opened yet.
 *
 * Calls getViewerInstance() on mount to pre-warm the singleton overlay
 * inside the Vue-owned runtime hosts, and installs the floating viewer
 * global handlers from Vue instead of from a module side-effect.
 */
import { onMounted, onUnmounted } from "vue";
import { getViewerInstance } from "../../../components/Viewer.js";
import { EVENTS } from "../../../app/events.js";
import {
    installFloatingViewerGlobalHandlers,
    teardownFloatingViewerManager,
} from "../../../features/viewer/floatingViewerManager.js";
import FloatingViewerHost from "./FloatingViewerHost.vue";
import ViewerOverlayHost from "./ViewerOverlayHost.vue";
import ViewerContextMenuPortal from "./ViewerContextMenuPortal.vue";
import StudioViewer from "./studio/StudioViewer.vue";
import {
    closeStudioViewer,
    openStudioViewer,
    shouldUseStudioViewer,
} from "../../../features/viewer/studio/studioViewerState.js";

interface OpenViewerEventDetail {
    assets?: unknown[];
    asset?: unknown;
    index?: unknown;
    mode?: unknown;
    handled?: boolean;
}

interface ViewerInstance {
    open?: (assets: unknown[], index: number) => void;
    setMode?: (mode: string) => void;
    dispose?: () => void;
}

let _instance: ViewerInstance | null = null;

function _openFromEvent(event: Event) {
    const detail: OpenViewerEventDetail = (event as CustomEvent)?.detail || {};
    const assets = Array.isArray(detail?.assets)
        ? detail.assets.filter(Boolean)
        : detail?.asset
          ? [detail.asset]
          : [];
    if (!assets.length) return;

    const index = Math.max(0, Math.min(Number(detail?.index) || 0, assets.length - 1));
    const mode = String(detail?.mode || "").trim().toLowerCase();

    // Studio viewer by default (compare modes and 3D included); the
    // "classic viewer" setting goes to the classic runtime below.
    if (shouldUseStudioViewer(assets, index, mode) && openStudioViewer(assets, index, mode)) {
        try {
            (_instance as any)?.close?.();
        } catch (e) {
            console.debug?.(e);
        }
        detail.handled = true;
        return;
    }
    _openClassic(assets, index, mode, detail);
}

function _openClassic(
    assets: unknown[],
    index: number,
    mode: string,
    detail: OpenViewerEventDetail | null = null,
) {
    closeStudioViewer();
    try {
        if (!_instance) _instance = getViewerInstance();
        _instance.open?.(assets, index);
        if (mode === "ab" || mode === "sidebyside") {
            _instance.setMode?.(mode);
        }
        if (detail) detail.handled = true;
    } catch (e) {
        console.debug?.(e);
    }
}

onMounted(() => {
    try {
        installFloatingViewerGlobalHandlers();
    } catch (e) {
        console.debug?.(e);
    }
    try {
        _instance = getViewerInstance();
    } catch (e) {
        console.debug?.(e);
    }
    try {
        window.addEventListener(EVENTS.OPEN_VIEWER, _openFromEvent);
    } catch (e) {
        console.debug?.(e);
    }
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
    try {
        _instance?.dispose?.();
    } catch (e) {
        console.debug?.(e);
    }
    _instance = null;
});
</script>

<template>
    <StudioViewer @open-classic="(p) => _openClassic(p.assets, p.index, p.mode)" />
    <ViewerOverlayHost />
    <FloatingViewerHost />
    <ViewerContextMenuPortal />
</template>
