<script setup>
/**
 * StatusSection.vue — Renderless Phase-2 wrapper for the status indicator panel.
 *
 * This component owns the DOM elements created by `createStatusIndicator` and
 * exposes them to the parent so they can be forwarded to the panel runtime
 * via the `external` option. It renders nothing in the Vue tree; the section
 * element is appended into the panel layout by the runtime itself.
 *
 * Migration path:
 *   Phase 2.1  — renderless wrapper, delegates all logic to the existing JS
 *   Phase 3+   — replace internals with reactive Vue template once
 *                all controllers read from usePanelStore
 */
import { onUnmounted } from "vue";
import { createStatusIndicator } from "../../../features/status/StatusDot.js";

// Create the DOM element at setup time so it is ready before onMounted fires
// in the parent App.vue.  getScanContext is intentionally null here — the real
// context function is closed over `state` inside _renderPanelImpl and provided
// when setupStatusPolling is called.
const statusSection = createStatusIndicator({ getScanContext: null });
const statusDot = statusSection.querySelector("#mjr-status-dot");
const statusText = statusSection.querySelector("#mjr-status-text");
const capabilitiesSection = statusSection.querySelector("#mjr-status-capabilities");

onUnmounted(() => {
    // Dispose polling timers when Vue tears down this component (e.g. full panel
    // unmount).  On normal tab-switches the keep-alive pattern keeps this alive,
    // so dispose is only called on real destruction.
    try {
        statusSection?._mjrStatusPollDispose?.();
    } catch {
        /* ignore */
    }
});

defineExpose({ statusSection, statusDot, statusText, capabilitiesSection });
</script>

<template>
    <!-- renderless: DOM is appended into the panel layout by the runtime -->
</template>
