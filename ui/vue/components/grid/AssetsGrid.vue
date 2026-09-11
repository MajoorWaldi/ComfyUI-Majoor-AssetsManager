<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";
import { usePanelStore } from "../../../stores/usePanelStore.js";
import {
    clearActiveGridContainer,
    setActiveGridContainer,
} from "../../../features/panel/panelRuntimeRefs.js";
import { createAssetsQueryController } from "../../composables/useAssetsQuery.js";
import { useGridContextMenu } from "../../composables/useGridContextMenu.js";
import { useGridKeyboard } from "../../composables/useGridKeyboard.js";
import VirtualAssetGridHost from "./VirtualAssetGridHost.vue";
import {
    bindGridHostState as bindGridHostStateRuntime,
    installGridScrollSync,
    restoreGridUiState as restoreGridUiStateRuntime,
} from "./assetsGridHostState.js";
import type { MjrVirtualAssetGridHostExpose } from "../../../types/componentExposes";

const browseSectionRef = ref<HTMLDivElement | null>(null);
const gridWrapperRef = ref<HTMLDivElement | null>(null);
const gridHostRef = ref<MjrVirtualAssetGridHostExpose | null>(null);

const panelStore = usePanelStore();

const gridContainerRef = computed(() => gridHostRef.value?.gridContainer ?? null);

interface AssetsQueryController {
    setVisibility?: () => void;
    dispose?: () => void;
    [key: string]: unknown;
}

let disposeScrollSync: (() => void) | null = null;
let disposeGridHostState: (() => void) | null = null;
let gridHostStateOptions: Record<string, unknown> | null = null;
let assetsQueryController: AssetsQueryController | null = null;
let disposeVisibilityObservers: (() => void) | null = null;

function syncAssetsQueryVisibility() {
    try {
        assetsQueryController?.setVisibility?.();
    } catch (e) {
        console.debug?.(e);
    }
}

function onKeepAliveAttached() {
    // Re-register the grid container in case the global ref was cleared or
    // became stale during the keep-alive detach/reattach cycle.
    try {
        const container = gridContainerRef.value;
        if (container) {
            setActiveGridContainer(container);
        }
    } catch (e) {
        console.debug?.(e);
    }
    syncAssetsQueryVisibility();
}

function installVisibilityObservers() {
    try {
        disposeVisibilityObservers?.();
    } catch (e) {
        console.debug?.(e);
    }

    const cleanups: Array<() => void> = [];
    let visibilityRaf = 0;
    const notifyVisibility = () => {
        if (visibilityRaf) return;
        try {
            visibilityRaf = requestAnimationFrame(() => {
                visibilityRaf = 0;
                syncAssetsQueryVisibility();
            });
        } catch (e) {
            console.debug?.(e);
            visibilityRaf = 0;
            syncAssetsQueryVisibility();
        }
    };

    try {
        window.addEventListener("resize", notifyVisibility);
        cleanups.push(() => window.removeEventListener("resize", notifyVisibility));
    } catch (e) {
        console.debug?.(e);
    }

    try {
        if (typeof ResizeObserver === "function") {
            const resizeObserver = new ResizeObserver(() => {
                notifyVisibility();
            });
            const targets = [
                browseSectionRef.value,
                gridWrapperRef.value,
                browseSectionRef.value?.parentElement || null,
            ].filter((el): el is Element => Boolean(el));
            for (const target of targets) {
                resizeObserver.observe(target);
            }
            cleanups.push(() => resizeObserver.disconnect());
        }
    } catch (e) {
        console.debug?.(e);
    }

    try {
        if (typeof MutationObserver === "function") {
            const mutationObserver = new MutationObserver(() => {
                notifyVisibility();
            });
            const targets = [
                browseSectionRef.value,
                gridWrapperRef.value,
                browseSectionRef.value?.parentElement || null,
            ].filter((el): el is Element => Boolean(el));
            for (const target of targets) {
                mutationObserver.observe(target, {
                    attributes: true,
                    attributeFilter: ["class", "style", "hidden", "aria-hidden"],
                });
            }
            cleanups.push(() => mutationObserver.disconnect());
        }
    } catch (e) {
        console.debug?.(e);
    }

    disposeVisibilityObservers = () => {
        if (visibilityRaf) {
            try {
                cancelAnimationFrame(visibilityRaf);
            } catch (e) {
                console.debug?.(e);
            }
            visibilityRaf = 0;
        }
        while (cleanups.length) {
            const cleanup = cleanups.pop();
            try {
                cleanup?.();
            } catch (e) {
                console.debug?.(e);
            }
        }
    };
}

provide("mjr-grid-container-ref", gridContainerRef);

useGridContextMenu(
    gridContainerRef,
    () => panelStore,
);
useGridKeyboard(gridContainerRef);

function currentGridContainer() {
    return gridContainerRef.value || null;
}

function bindGridHostState(opts: Record<string, unknown> = {}) {
    const container = currentGridContainer();
    if (!container) return;
    gridHostStateOptions = opts;
    try {
        disposeGridHostState?.();
    } catch (e) {
        console.debug?.(e);
    }
    disposeGridHostState = bindGridHostStateRuntime(container, {
        panelStore,
        ...opts,
    }) as (() => void) | null;
}

onMounted(() => {
    disposeScrollSync = installGridScrollSync(gridWrapperRef.value, panelStore);
    if (gridWrapperRef.value && Number(panelStore.scrollTop || 0) > 0) {
        gridWrapperRef.value.scrollTop = Number(panelStore.scrollTop || 0);
    }
    installVisibilityObservers();
    try {
        window.addEventListener("mjr:keepalive-attached", onKeepAliveAttached);
        document.addEventListener("visibilitychange", syncAssetsQueryVisibility);
    } catch (e) {
        console.debug?.(e);
    }
    syncAssetsQueryVisibility();
});

onBeforeUnmount(() => {
    try {
        clearActiveGridContainer(currentGridContainer());
    } catch (e) {
        console.debug?.(e);
    }
    try {
        disposeScrollSync?.();
    } catch (e) {
        console.debug?.(e);
    }
    disposeScrollSync = null;
    try {
        disposeVisibilityObservers?.();
    } catch (e) {
        console.debug?.(e);
    }
    disposeVisibilityObservers = null;
    try {
        disposeGridHostState?.();
    } catch (e) {
        console.debug?.(e);
    }
    disposeGridHostState = null;
    try {
        assetsQueryController?.dispose?.();
    } catch (e) {
        console.debug?.(e);
    }
    assetsQueryController = null;
    try {
        window.removeEventListener("mjr:keepalive-attached", onKeepAliveAttached);
        document.removeEventListener("visibilitychange", syncAssetsQueryVisibility);
    } catch (e) {
        console.debug?.(e);
    }
});

watch(
    gridContainerRef,
    (container, previous) => {
        try {
            if (previous && previous !== container) {
                clearActiveGridContainer(previous);
            }
        } catch (e) {
            console.debug?.(e);
        }
        try {
            if (container) {
                setActiveGridContainer(container);
            }
        } catch (e) {
            console.debug?.(e);
        }
    },
    { immediate: true },
);

defineExpose({
    get browseSection() {
        return browseSectionRef.value;
    },
    get gridWrapper() {
        return gridWrapperRef.value;
    },
    get gridContainer() {
        return currentGridContainer();
    },
    onGridContainerReady(container?: unknown) {
        if (container && container !== currentGridContainer()) {
            return currentGridContainer();
        }
        return currentGridContainer();
    },
    bindGridHostState(opts: Record<string, unknown> = {}) {
        bindGridHostState(opts);
        return () => {
            try {
                disposeGridHostState?.();
            } catch (e) {
                console.debug?.(e);
            }
            disposeGridHostState = null;
        };
    },
    restoreGridUiState(initialLoadPromise: unknown, opts: Record<string, unknown> = {}) {
        return restoreGridUiStateRuntime({
            initialLoadPromise,
            gridWrapper: gridWrapperRef.value,
            gridContainer: currentGridContainer(),
            panelStore,
            ...opts,
        });
    },
    initAssetsQueryController(options: Record<string, unknown> = {}) {
        const gridContainer = currentGridContainer();
        if (!gridContainer || !gridWrapperRef.value) return null;
        try {
            assetsQueryController?.dispose?.();
        } catch (e) {
            console.debug?.(e);
        }
        assetsQueryController = createAssetsQueryController({
            gridContainer,
            gridWrapper: gridWrapperRef.value,
            ...options,
        });
        syncAssetsQueryVisibility();
        return assetsQueryController;
    },
    loadAssets(...args: unknown[]) {
        return gridHostRef.value?.loadAssets?.(...args);
    },
    loadAssetsFromList(...args: unknown[]) {
        return gridHostRef.value?.loadAssetsFromList?.(...args);
    },
    prepareGridForScopeSwitch(...args: unknown[]) {
        return gridHostRef.value?.prepareGridForScopeSwitch?.(...args);
    },
    refreshGrid(...args: unknown[]) {
        return gridHostRef.value?.refreshGrid?.(...args);
    },
    captureAnchor(...args: unknown[]) {
        return gridHostRef.value?.captureAnchor?.(...args);
    },
    restoreAnchor(...args: unknown[]) {
        return gridHostRef.value?.restoreAnchor?.(...args);
    },
    hydrateGridFromSnapshot(...args: unknown[]) {
        return gridHostRef.value?.hydrateFromSnapshot?.(...args);
    },
    upsertAsset(...args: unknown[]) {
        return gridHostRef.value?.upsertAsset?.(...args);
    },
    removeAssets(...args: unknown[]) {
        return gridHostRef.value?.removeAssets?.(...args);
    },
    disposeGrid(...args: unknown[]) {
        return gridHostRef.value?.dispose?.(...args);
    },
});
</script>

<template>
    <div
        ref="browseSectionRef"
        class="mjr-am-browse"
        style="flex:1;display:flex;flex-direction:row;overflow:hidden"
    >
        <div
            ref="gridWrapperRef"
            class="mjr-am-grid-scroll"
            style="flex:1;overflow:auto;position:relative"
        >
            <VirtualAssetGridHost
                ref="gridHostRef"
                :scroll-element="gridWrapperRef"
            />
        </div>
    </div>
</template>
