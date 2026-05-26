<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import {
    registerFloatingViewerHost,
} from "../../../features/viewer/viewerRuntimeHosts.js";

const hostRef = ref(null);
let disposeHostRegistration = null;

onMounted(() => {
    disposeHostRegistration = registerFloatingViewerHost(hostRef.value);
});

onUnmounted(() => {
    disposeHostRegistration?.();
    disposeHostRegistration = null;
});
</script>

<template>
    <div
        ref="hostRef"
        class="mjr-viewer-runtime-host mjr-viewer-runtime-host--floating"
        style="position:fixed; inset:0; pointer-events:none; overflow:visible;"
    />
</template>
