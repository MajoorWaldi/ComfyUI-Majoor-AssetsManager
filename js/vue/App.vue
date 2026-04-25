<script setup>
/**
 * App.vue — Root Vue component for the Majoor Assets Manager sidebar panel.
 *
 * Vue owns the panel surfaces; this component just hands their DOM handles to
 * the panel runtime service that wires controllers and side effects.
 */

import { ref, onMounted, onUnmounted } from "vue";
import { mountAssetsManagerPanelRuntime } from "../features/panel/panelRuntime.js";
import { usePanelStore } from "../stores/usePanelStore.js";
import StatusSection from "./components/status/StatusSection.vue";
import HeaderSection from "./components/panel/HeaderSection.vue";
import SummaryBarSection from "./components/panel/SummaryBarSection.vue";
import AssetsGrid from "./components/grid/AssetsGrid.vue";
import SidebarSection from "./components/panel/SidebarSection.vue";
import ContextMenuPortal from "./components/common/ContextMenuPortal.vue";

const containerRef = ref(null);
const statusSectionRef = ref(null);
const headerSectionRef = ref(null);
const summaryBarSectionRef = ref(null);
const assetsGridRef = ref(null);
const sidebarSectionRef = ref(null);

/** Handle returned by the panel runtime mount call. */
let disposeHandle = null;

onMounted(async () => {
    if (!containerRef.value) return;

    const external = {};

    if (statusSectionRef.value) {
        external.statusSection = statusSectionRef.value.statusSection;
        external.statusDot = statusSectionRef.value.statusDot;
        external.statusText = statusSectionRef.value.statusText;
        external.capabilitiesSection = statusSectionRef.value.capabilitiesSection;
    }

    if (headerSectionRef.value) {
        external.headerSection = headerSectionRef.value;
    }

    if (summaryBarSectionRef.value) {
        external.summaryBar = summaryBarSectionRef.value.summaryBar;
        external.updateSummaryBar = summaryBarSectionRef.value.updateSummaryBar;
        external.folderBreadcrumb = summaryBarSectionRef.value.folderBreadcrumb;
    }

    if (assetsGridRef.value) {
        external.browseSection = assetsGridRef.value.browseSection;
        external.gridWrapper = assetsGridRef.value.gridWrapper;
        external.gridContainer = assetsGridRef.value.gridContainer;
        external.onGridContainerReady = (...args) =>
            assetsGridRef.value?.onGridContainerReady?.(...args);
        external.bindGridHostState = (...args) =>
            assetsGridRef.value?.bindGridHostState?.(...args);
        external.restoreGridUiState = (...args) =>
            assetsGridRef.value?.restoreGridUiState?.(...args);
        external.initAssetsQueryController = (...args) =>
            assetsGridRef.value?.initAssetsQueryController?.(...args);
        // Bridge legacy runtime signatures (gridContainer-first) to Vue grid host methods.
        external.loadAssets = (_gridContainer, query = "*", options = {}) =>
            assetsGridRef.value?.loadAssets?.(query, options);
        external.loadAssetsFromList = (_gridContainer, assets = [], options = {}) =>
            assetsGridRef.value?.loadAssetsFromList?.(assets, options);
        external.prepareGridForScopeSwitch = (_gridContainer) =>
            assetsGridRef.value?.prepareGridForScopeSwitch?.();
        external.refreshGrid = (_gridContainer) => assetsGridRef.value?.refreshGrid?.();
        external.captureAnchor = (_gridContainer) => assetsGridRef.value?.captureAnchor?.();
        external.restoreAnchor = (_gridContainer, anchor) =>
            assetsGridRef.value?.restoreAnchor?.(anchor);
        external.hydrateGridFromSnapshot = (_gridContainer, parts = {}, options = {}) =>
            assetsGridRef.value?.hydrateGridFromSnapshot?.(parts, options);
        external.upsertAsset = (_gridContainer, asset) => assetsGridRef.value?.upsertAsset?.(asset);
        external.removeAssets = (_gridContainer, assetIds = [], options = {}) =>
            assetsGridRef.value?.removeAssets?.(assetIds, options);
        external.disposeGrid = (_gridContainer) => assetsGridRef.value?.disposeGrid?.();
    }

    if (sidebarSectionRef.value) {
        external.sidebar = sidebarSectionRef.value.sidebar;
    }

    try {
        disposeHandle = await mountAssetsManagerPanelRuntime(containerRef.value, {
            useComfyThemeUI: true,
            external,
        });
    } catch (e) {
        console.warn("[Majoor] App.vue: mountAssetsManagerPanelRuntime failed", e);
    }

    // Validate persisted custom-root id against backend so we don't render a
    // stale scope pointing at a removed root (would otherwise surface as a
    // silent empty grid + 404).  Fire-and-forget — best effort.
    try {
        const panelStore = usePanelStore();
        panelStore.validatePersistedCustomRoot?.();
    } catch {
        /* ignore */
    }
});

onUnmounted(() => {
    try {
        disposeHandle?.dispose?.();
    } catch {
        /* ignore */
    }
    disposeHandle = null;
});
</script>

<template>
    <StatusSection ref="statusSectionRef" />
    <HeaderSection ref="headerSectionRef" />
    <SummaryBarSection ref="summaryBarSectionRef" />
    <AssetsGrid ref="assetsGridRef" />
    <SidebarSection ref="sidebarSectionRef" />
    <ContextMenuPortal />

    <!--
        Single root element — keeps ComfyUI's sidebar layout expectations intact.
        Height 100% so the panel fills the sidebar area ComfyUI allocates.
        overflow:hidden prevents double scrollbars — the panel manages its own
        internal scroll via VirtualScroller.
    -->
    <div
        ref="containerRef"
        class="mjr-vue-root"
        style="height: 100%; width: 100%; overflow: hidden; box-sizing: border-box"
    />
</template>
