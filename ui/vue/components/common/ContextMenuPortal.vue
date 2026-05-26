<script setup>
/**
 * ContextMenuPortal.vue — Singleton Vue owner for the grid/feed context menu.
 *
 * Both the main sidebar app and the generated feed app mount this component.
 * The first mounted instance becomes the active owner and renders the teleported
 * menu UI; if it unmounts, ownership moves to the next mounted instance.
 */
import { computed, onMounted, onUnmounted, ref } from "vue";
import {
    acquireGridContextMenuPortalOwner,
    isGridContextMenuPortalOwner,
    releaseGridContextMenuPortalOwner,
} from "../../../features/contextmenu/gridContextMenuState.js";
import AddToCollectionMenu from "./AddToCollectionMenu.vue";
import GridContextMenu from "../grid/GridContextMenu.vue";

const portalId = ref("");

const isOwner = computed(() => isGridContextMenuPortalOwner(portalId.value));

onMounted(() => {
    portalId.value = acquireGridContextMenuPortalOwner();
});

onUnmounted(() => {
    releaseGridContextMenuPortalOwner(portalId.value);
    portalId.value = "";
});
</script>

<template>
    <template v-if="isOwner">
        <GridContextMenu />
        <AddToCollectionMenu />
    </template>
</template>
