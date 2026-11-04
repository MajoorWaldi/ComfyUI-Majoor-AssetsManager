<script setup lang="ts">
/**
 * StudioModel3D.vue - 3D model preview (GLB, OBJ, STL, splats...) inside the
 * Studio viewer, reusing the shared Three.js renderer of the classic viewer.
 */
import { onBeforeUnmount, onMounted, ref } from "vue";

import { createModel3DMediaElement } from "../../../../features/viewer/model3dRenderer.js";

const props = defineProps<{ asset: any; src: string }>();
const host = ref<HTMLElement | null>(null);
let element: HTMLElement | null = null;

function destroy() {
    try {
        element?.querySelectorAll?.("canvas").forEach((c: any) => {
            c?._mjrProc?.destroy?.();
            c._mjrProc = null;
        });
    } catch (e) {
        console.debug?.(e);
    }
    element?.remove();
    element = null;
}

onMounted(() => {
    if (!host.value || !props.src) return;
    try {
        element = createModel3DMediaElement(props.asset, props.src, {
            hostClassName: "mjr-model3d-host mjr-studio-model3d__host",
            canvasClassName: "mjr-model3d-render-canvas mjr-studio-model3d__canvas",
            hintText: "Rotate: left drag  Pan: right drag  Zoom: wheel or middle drag",
            disableViewerTransform: true,
        });
        if (element) host.value.appendChild(element);
    } catch (e) {
        console.debug?.(e);
    }
});
onBeforeUnmount(destroy);
</script>

<template>
    <div ref="host" class="mjr-studio-model3d" @wheel.stop @pointerdown.stop @contextmenu.prevent />
</template>
