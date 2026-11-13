<script setup lang="ts">
/**
 * GlobalRuntime.vue - always-mounted Vue runtime owner.
 *
 * Keeps global viewer and drag-and-drop services alive even when the sidebar
 * tab has not been opened yet. This is the Vue-owned home for extension-wide
 * runtime UI/services that must outlive any specific panel mount.
 */
import { defineAsyncComponent, onMounted, onUnmounted, ref } from "vue";
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

// Events that arrived before ViewerPortal finished loading; replayed once it listens.
const pendingEvents: Array<{ type: string; detail: unknown }> = [];

function ensureViewerRuntime(event: Event) {
    const type = String(event?.type || "");
    if (!type) return;
    if (viewerRuntimeActive.value && !pendingEvents.length) return;
    // Keep the same detail object: OPEN_VIEWER reports `handled` back through it.
    pendingEvents.push({ type, detail: (event as CustomEvent)?.detail ?? null });
    viewerRuntimeActive.value = true;
}

function replayPendingEvents() {
    const queued = pendingEvents.splice(0);
    for (const { type, detail } of queued) {
        try {
            window.dispatchEvent(new CustomEvent(type, { detail }));
        } catch (e) {
            console.debug?.(e);
        }
    }
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
    <ViewerPortal v-if="viewerRuntimeActive" @ready="replayPendingEvents" />
</template>
