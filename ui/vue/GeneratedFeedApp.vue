<script setup>
/**
 * GeneratedFeedApp.vue — Root Vue component for the Generated Feed bottom panel.
 *
 * Vue owns the feed grid scroll wrapper directly in this component and passes
 * it to createGeneratedFeedHost via external.gridWrapper.
 *
 * The VirtualGrid, selection, keyboard, and context menu remain imperative
 * (same decision as Phase 4 main panel grid — no VirtualGrid rewrite).
 */
import { ref, onMounted, onUnmounted } from "vue";
import {
    createGeneratedFeedHost,
    disposeGeneratedFeedHost,
} from "../features/bottomPanel/feed/feedHost.js";
import ContextMenuPortal from "./components/common/ContextMenuPortal.vue";

const containerRef = ref(null);

let host = null;

function normalizeFeedHostLayout(root) {
    if (!root) return;
    const targets = [root, root.parentElement, root.parentElement?.parentElement];
    for (let index = 0; index < targets.length; index += 1) {
        const el = targets[index];
        if (!el || !(el instanceof HTMLElement)) continue;
        try {
            el.style.minHeight = "0";
            if (index <= 1) {
                el.style.height = "100%";
                el.style.width = "100%";
                el.style.overflow = "hidden";
                el.style.display = "flex";
                el.style.flexDirection = "column";
            }
        } catch (e) {
            console.debug?.(e);
        }
    }
}

onMounted(() => {
    if (!containerRef.value) return;
    try {
        normalizeFeedHostLayout(containerRef.value);
        host = createGeneratedFeedHost(containerRef.value);
    } catch (e) {
        console.warn("[Majoor] GeneratedFeedApp.vue: createGeneratedFeedHost failed", e);
    }
});

onUnmounted(() => {
    try {
        disposeGeneratedFeedHost(host);
    } catch {
        /* ignore */
    }
    host = null;
});
</script>

<template>
    <!-- Vue lifecycle owner for the fixed-position context menu DOM elements -->
    <ContextMenuPortal />

    <div
        ref="containerRef"
        class="mjr-vue-feed-root"
        style="height: 100%; width: 100%; min-height: 0; overflow: hidden; display: flex; flex-direction: column; box-sizing: border-box"
    />
</template>
