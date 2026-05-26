<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import {
    acquireViewerContextMenuPortalOwner,
    isViewerContextMenuPortalOwner,
    releaseViewerContextMenuPortalOwner,
} from "../../../features/contextmenu/viewerContextMenuState.js";
import ViewerContextMenu from "./ViewerContextMenu.vue";

const portalId = ref("");
const isOwner = computed(() => isViewerContextMenuPortalOwner(portalId.value));

onMounted(() => {
    portalId.value = acquireViewerContextMenuPortalOwner();
});

onUnmounted(() => {
    releaseViewerContextMenuPortalOwner(portalId.value);
    portalId.value = "";
});
</script>

<template>
    <ViewerContextMenu v-if="isOwner" />
</template>
