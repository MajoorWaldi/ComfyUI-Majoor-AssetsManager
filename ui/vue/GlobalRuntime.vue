<script setup>
/**
 * GlobalRuntime.vue - always-mounted Vue runtime owner.
 *
 * Keeps global viewer and drag-and-drop services alive even when the sidebar
 * tab has not been opened yet. This is the Vue-owned home for extension-wide
 * runtime UI/services that must outlive any specific panel mount.
 */
import ViewerPortal from "./components/viewer/ViewerPortal.vue";
import { useDragDrop } from "./composables/useDragDrop.js";

useDragDrop();
</script>

<template>
    <ViewerPortal />
</template>
