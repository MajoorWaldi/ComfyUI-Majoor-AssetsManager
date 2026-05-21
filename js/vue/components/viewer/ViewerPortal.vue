<script setup>
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

let _instance = null;

function _openFromEvent(event) {
    const detail = event?.detail || {};
    const assets = Array.isArray(detail?.assets)
        ? detail.assets.filter(Boolean)
        : detail?.asset
          ? [detail.asset]
          : [];
    if (!assets.length) return;

    const index = Math.max(0, Math.min(Number(detail?.index) || 0, assets.length - 1));
    const mode = String(detail?.mode || "").trim().toLowerCase();

    try {
        if (!_instance) _instance = getViewerInstance();
        _instance.open?.(assets, index);
        if (mode === "ab" || mode === "sidebyside") {
            _instance.setMode?.(mode);
        }
        detail.handled = true;
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
    <ViewerOverlayHost />
    <FloatingViewerHost />
    <ViewerContextMenuPortal />
</template>
