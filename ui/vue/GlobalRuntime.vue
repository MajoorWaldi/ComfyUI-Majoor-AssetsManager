<script setup>
/**
 * GlobalRuntime.vue - always-mounted Vue runtime owner.
 *
 * Keeps global viewer and drag-and-drop services alive even when the sidebar
 * tab has not been opened yet. This is the Vue-owned home for extension-wide
 * runtime UI/services that must outlive any specific panel mount.
 */
import { defineAsyncComponent, nextTick, onMounted, onUnmounted, ref } from "vue";
import { EVENTS } from "../app/events.js";
import { useDragDrop } from "./composables/useDragDrop.js";

const ViewerPortal = defineAsyncComponent(() => import("./components/viewer/ViewerPortal.vue"));
const viewerRuntimeActive = ref(false);
const VIEWER_BOOT_EVENTS = [
    EVENTS.OPEN_VIEWER,
    EVENTS.MFV_OPEN,
    EVENTS.MFV_TOGGLE,
    EVENTS.MFV_LIVE_TOGGLE,
    EVENTS.MFV_PREVIEW_TOGGLE,
    EVENTS.MFV_NODESTREAM_TOGGLE,
    EVENTS.MFV_POPOUT,
];

function ensureViewerRuntime(event) {
    if (viewerRuntimeActive.value) return;
    viewerRuntimeActive.value = true;
    const type = String(event?.type || "");
    const detail = event?.detail || null;
    if (!type || type === EVENTS.OPEN_VIEWER) return;
    void nextTick(() => {
        try {
            window.dispatchEvent(new CustomEvent(type, { detail }));
        } catch (e) {
            console.debug?.(e);
        }
    });
}

useDragDrop();

onMounted(() => {
    for (const eventName of VIEWER_BOOT_EVENTS) {
        try {
            window.addEventListener(eventName, ensureViewerRuntime, { once: false });
        } catch (e) {
            console.debug?.(e);
        }
    }
});

onUnmounted(() => {
    for (const eventName of VIEWER_BOOT_EVENTS) {
        try {
            window.removeEventListener(eventName, ensureViewerRuntime);
        } catch (e) {
            console.debug?.(e);
        }
    }
});
</script>

<template>
    <ViewerPortal v-if="viewerRuntimeActive" />
</template>
