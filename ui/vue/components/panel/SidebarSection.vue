<script setup>
/**
 * SidebarSection.vue — Vue lifecycle owner for the asset detail sidebar.
 *
 * Phase 5: This component now renders the actual sidebar DOM (a <div ref>)
 * instead of creating the sidebar imperatively and forwarding the element.
 * Vue owns the content via AssetSidebarContent.vue.
 *
 * The sidebar <div> is still exposed as `external.sidebar` so
 * the panel runtime can:
 *  1. Insert it into the flex layout (applySidebarPosition)
 *  2. Pass it to initializeSidebarController / showAssetInSidebar
 *
 * CSS transitions (open/close width animation) are still applied imperatively
 * by SidebarView.js on the same DOM element — Vue only owns the content inside.
 *
 * Backward-compat properties written by SidebarView.js onto the element:
 *  - _currentAsset, _currentFullAsset, _requestSeq  (read by sidebarController)
 *  - _mjrAbortController (used for runtime listener cleanup)
 * These are set directly on the DOM node; Vue ignores them.
 */
import { ref, onMounted, onUnmounted } from "vue";
import { patchActiveAsset, useActiveAsset } from "../../composables/useActiveAsset.js";
import AssetSidebarContent from "./sidebar/AssetSidebarContent.vue";
import { t } from "../../../app/i18n.js";
import {
    ASSET_RATING_CHANGED_EVENT,
    ASSET_TAGS_CHANGED_EVENT,
} from "../../../app/events.js";

const sidebarEl = ref(null);
const { activeAsset, onUpdateCallback } = useActiveAsset();

// Apply initial closed CSS once the element is in the DOM.
onMounted(() => {
    const el = sidebarEl.value;
    if (!el) return;
    el.style.flex = "0 0 0px";
    el.style.width = "0";
    el.style.maxWidth = "0";
    el.style.minWidth = "0";
    el.style.overflow = "hidden";
    el.style.borderLeft = "none";
    el.style.borderRight = "none";
    // Mirror _requestSeq so sidebarController guards work from the first call.
    el._requestSeq = 0;
    el._currentAsset = null;
    el._currentFullAsset = null;
    el._ratingTagsSection = null;

    const matchesCurrent = (assetId) => {
        const currentId = el._currentAsset?.id ?? el._currentFullAsset?.id ?? activeAsset.value?.id;
        if (currentId == null || assetId == null) return false;
        return String(currentId) === String(assetId);
    };

    const onRatingChanged = (event) => {
        const detail = event?.detail || {};
        const assetId = detail.assetId ?? detail.id ?? null;
        const rating = Number(detail.rating);
        if (!matchesCurrent(assetId) || !Number.isFinite(rating)) return;
        patchActiveAsset({ rating }, onUpdateCallback.value);
        try {
            if (el._currentAsset) el._currentAsset.rating = rating;
            if (el._currentFullAsset) el._currentFullAsset.rating = rating;
        } catch (e) {
            console.debug?.(e);
        }
    };

    const onTagsChanged = (event) => {
        const detail = event?.detail || {};
        const assetId = detail.assetId ?? detail.id ?? null;
        const tags = Array.isArray(detail.tags) ? detail.tags : null;
        if (!matchesCurrent(assetId) || !tags) return;
        patchActiveAsset({ tags }, onUpdateCallback.value);
        try {
            if (el._currentAsset) el._currentAsset.tags = tags;
            if (el._currentFullAsset) el._currentFullAsset.tags = tags;
        } catch (e) {
            console.debug?.(e);
        }
    };

    const cleanupFns = [];
    const abortController = typeof AbortController !== "undefined" ? new AbortController() : null;
    el._mjrAbortController = abortController;
    el.dispose = () => {
        try {
            abortController?.abort?.();
        } catch (e) {
            console.debug?.(e);
        }
        for (const cleanup of cleanupFns.splice(0)) {
            try {
                cleanup?.();
            } catch (e) {
                console.debug?.(e);
            }
        }
    };
    el._dispose = el.dispose;

    const listenerOptions = abortController ? { signal: abortController.signal } : undefined;
    try {
        window.addEventListener(ASSET_RATING_CHANGED_EVENT, onRatingChanged, listenerOptions);
        window.addEventListener(ASSET_TAGS_CHANGED_EVENT, onTagsChanged, listenerOptions);
    } catch (e) {
        console.debug?.(e);
        try {
            window.addEventListener(ASSET_RATING_CHANGED_EVENT, onRatingChanged);
            window.addEventListener(ASSET_TAGS_CHANGED_EVENT, onTagsChanged);
            cleanupFns.push(() =>
                window.removeEventListener(ASSET_RATING_CHANGED_EVENT, onRatingChanged),
            );
            cleanupFns.push(() =>
                window.removeEventListener(ASSET_TAGS_CHANGED_EVENT, onTagsChanged),
            );
        } catch (fallbackError) {
            console.debug?.(fallbackError);
        }
    }
});

onUnmounted(() => {
    try {
        sidebarEl.value?.dispose?.();
    } catch {}
    // Abort any in-flight metadata fetches.
    try {
        sidebarEl.value?._currentFetchAbortController?.abort?.();
    } catch {}
});

// Expose the DOM element so App.vue can forward it to the panel runtime.
defineExpose({
    get sidebar() { return sidebarEl.value; },
});
</script>

<template>
    <div
        ref="sidebarEl"
        class="mjr-inline-sidebar"
        data-position="right"
        style="display:flex;flex-direction:column;background:var(--mjr-surface-1,#262626);transition:width 140ms ease,max-width 140ms ease,flex-basis 140ms ease,border-color 140ms ease;contain:layout paint style"
    >
        <!-- Active asset: render full sidebar content -->
        <AssetSidebarContent
            v-if="activeAsset"
            :asset="activeAsset"
            :on-update="onUpdateCallback"
            :sidebar="sidebarEl"
        />

        <!-- No asset selected: placeholder -->
        <div
            v-else
            class="mjr-sidebar-placeholder"
            style="flex:1;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0.4;font-size:0.85em;text-align:center"
        >
            {{ t("sidebar.placeholderSelectAsset", "Select an asset to view details") }}
        </div>
    </div>
</template>
