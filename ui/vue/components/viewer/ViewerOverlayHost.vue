<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import {
    registerViewerOverlayHost,
} from "../../../features/viewer/viewerRuntimeHosts.js";

const hostRef = ref(null);
let disposeHostRegistration = null;

onMounted(() => {
    disposeHostRegistration = registerViewerOverlayHost(hostRef.value);
});

onUnmounted(() => {
    disposeHostRegistration?.();
    disposeHostRegistration = null;
});
</script>

<template>
    <div
        ref="hostRef"
        class="mjr-viewer-runtime-host mjr-viewer-runtime-host--main"
        style="position:fixed; inset:0; pointer-events:none; overflow:visible;"
    />
</template>
