<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { drawWorkflowMinimap, synthesizeWorkflowFromPromptGraph } from "../../../../components/sidebar/utils/minimap.js";
import { loadMajoorSettings, saveMajoorSettings } from "../../../../app/settings.js";
import { MINIMAP_LEGACY_SETTINGS_KEY } from "../../../../app/settingsStore.js";
import { t } from "../../../../app/i18n.js";

const props = defineProps({
    asset: { type: Object, required: true },
});

const DEFAULT_SETTINGS = Object.freeze({
    nodeColors: true,
    showLinks: true,
    showGroups: true,
    renderBypassState: true,
    renderErrorState: true,
    showViewport: true,
    showNodeLabels: false,
    size: "comfortable",
});

const DEFAULT_VIEW = Object.freeze({
    zoom: 1,
    centerX: null,
    centerY: null,
    hoveredNodeId: null,
});

const MINIMAP_ZOOM_MIN = 1;
const MINIMAP_ZOOM_MAX = 8;

const SIZE_OPTIONS = Object.freeze([
    { key: "compact", label: "Compact", height: 120 },
    { key: "comfortable", label: "Comfort", height: 160 },
    { key: "expanded", label: "Expanded", height: 220 },
]);

const canvasRef = ref(null);
const showTools = ref(false);
const rawJsonOpen = ref(false);
const minimapSettings = ref(loadWorkflowMinimapSettings());
const minimapView = ref({ ...DEFAULT_VIEW });
const minimapCursor = ref("crosshair");
const hoveredNodeLabel = ref("");

let resizeObserver = null;
let lastRenderInfo = null;
let activePointerId = null;

function clampNumber(value, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
}

function syncResolvedView(nextView) {
    if (!nextView || typeof nextView !== "object") return;
    minimapView.value = {
        ...minimapView.value,
        zoom: clampNumber(nextView.zoom ?? minimapView.value.zoom, MINIMAP_ZOOM_MIN, MINIMAP_ZOOM_MAX),
        centerX: Number.isFinite(Number(nextView.centerX)) ? Number(nextView.centerX) : null,
        centerY: Number.isFinite(Number(nextView.centerY)) ? Number(nextView.centerY) : null,
    };
}

function resetMinimapView() {
    minimapView.value = { ...DEFAULT_VIEW };
    hoveredNodeLabel.value = "";
}

function coerceMetadataRawObject(asset) {
    const raw = asset?.metadata_raw ?? null;
    if (!raw) return null;
    if (typeof raw === "object") return raw;
    if (typeof raw === "string") {
        const text = raw.trim();
        if (!text) return null;
        try {
            const parsed = JSON.parse(text);
            return parsed && typeof parsed === "object" ? parsed : null;
        } catch {
            return null;
        }
    }
    return null;
}

function looksLikePromptGraph(obj) {
    try {
        const entries = Object.entries(obj || {});
        if (!entries.length) return false;
        let hits = 0;
        for (const [, value] of entries.slice(0, 50)) {
            if (!value || typeof value !== "object") continue;
            if (value.inputs && typeof value.inputs === "object") hits += 1;
            if (hits >= 2) return true;
        }
    } catch {
        return false;
    }
    return false;
}

function coerceWorkflow(asset) {
    const metadataRaw = coerceMetadataRawObject(asset);
    const value =
        asset?.workflow ||
        asset?.Workflow ||
        asset?.comfy_workflow ||
        metadataRaw?.workflow ||
        metadataRaw?.Workflow ||
        metadataRaw?.comfy_workflow ||
        null;
    if (!value) return null;
    if (typeof value === "object") return value;
    if (typeof value === "string") {
        const text = value.trim();
        if (!text) return null;
        try {
            return JSON.parse(text);
        } catch {
            return null;
        }
    }
    return null;
}

function coercePromptGraph(asset) {
    const metadataRaw = coerceMetadataRawObject(asset);
    const value =
        asset?.prompt || asset?.Prompt || metadataRaw?.prompt || metadataRaw?.Prompt || null;
    if (!value) return null;
    if (typeof value === "object") return looksLikePromptGraph(value) ? value : null;
    if (typeof value === "string") {
        const text = value.trim();
        if (!text) return null;
        try {
            const parsed = JSON.parse(text);
            return looksLikePromptGraph(parsed) ? parsed : null;
        } catch {
            return null;
        }
    }
    return null;
}

function loadWorkflowMinimapSettings() {
    try {
        const main = loadMajoorSettings?.();
        const stored = main?.workflowMinimap;
        if (stored && typeof stored === "object") {
            return { ...DEFAULT_SETTINGS, ...stored };
        }
    } catch (e) {
        console.debug?.(e);
    }

    try {
        const raw = localStorage?.getItem?.(MINIMAP_LEGACY_SETTINGS_KEY);
        if (!raw) return { ...DEFAULT_SETTINGS };
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return { ...DEFAULT_SETTINGS };
        const merged = { ...DEFAULT_SETTINGS, ...parsed };
        try {
            const next = loadMajoorSettings();
            next.workflowMinimap = { ...next.workflowMinimap, ...merged };
            saveMajoorSettings(next);
            localStorage?.removeItem?.(MINIMAP_LEGACY_SETTINGS_KEY);
        } catch (e) {
            console.debug?.(e);
        }
        return merged;
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

function persistWorkflowMinimapSettings(nextSettings) {
    try {
        const next = loadMajoorSettings();
        next.workflowMinimap = { ...next.workflowMinimap, ...nextSettings };
        saveMajoorSettings(next);
    } catch (e) {
        console.debug?.(e);
    }
}

const workflow = computed(() => {
    const rawWorkflow = coerceWorkflow(props.asset);
    const promptGraph = coercePromptGraph(props.asset);
    if (!rawWorkflow && !promptGraph) return null;
    return rawWorkflow || synthesizeWorkflowFromPromptGraph(promptGraph);
});

const statusLabel = computed(() => (props.asset?.has_generation_data ? "Complete" : "Partial"));
const rawWorkflowJson = computed(() =>
    workflow.value ? JSON.stringify(workflow.value, null, 2) : "",
);

const workflowStats = computed(() => {
    const current = workflow.value;
    if (!current) {
        return {
            nodes: 0,
            links: 0,
            groups: 0,
            source: "",
        };
    }
    const nodes = Array.isArray(current?.nodes) ? current.nodes.length : 0;
    const links =
        (Array.isArray(current?.links) && current.links.length) ||
        (Array.isArray(current?.extra?.links) && current.extra.links.length) ||
        0;
    const groups =
        (Array.isArray(current?.groups) && current.groups.length) ||
        (Array.isArray(current?.extra?.groups) && current.extra.groups.length) ||
        (Array.isArray(current?.extra?.groupNodes) && current.extra.groupNodes.length) ||
        (Array.isArray(current?.extra?.group_nodes) && current.extra.group_nodes.length) ||
        0;
    return {
        nodes,
        links,
        groups,
        source: current?.extra?.synthetic ? "Synthetic" : "Embedded",
    };
});

const currentSizeOption = computed(() => {
    const currentKey = String(minimapSettings.value?.size || "comfortable");
    return SIZE_OPTIONS.find((item) => item.key === currentKey) || SIZE_OPTIONS[1];
});

const canvasHeight = computed(() => `${currentSizeOption.value.height}px`);

const toggleOptions = computed(() => [
    { key: "showNodeLabels", label: "Node Labels", iconClass: "pi pi-tag" },
    { key: "nodeColors", label: "Node Colors", iconClass: "pi pi-palette" },
    { key: "showLinks", label: "Show Links", iconClass: "pi pi-share-alt" },
    { key: "showGroups", label: "Show Frames/Groups", iconClass: "pi pi-th-large" },
    { key: "renderBypassState", label: "Render Bypass State", iconClass: "pi pi-ban" },
    {
        key: "renderErrorState",
        label: "Render Error State",
        iconClass: "pi pi-exclamation-triangle",
    },
    { key: "showViewport", label: "Show Viewport", iconClass: "pi pi-window-maximize" },
]);

function renderCanvas() {
    const canvas = canvasRef.value;
    const currentWorkflow = workflow.value;
    if (!canvas || !currentWorkflow) return;

    const width = Math.max(1, canvas.clientWidth || 320);
    const height = Math.max(1, canvas.clientHeight || 120);
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lastRenderInfo =
        drawWorkflowMinimap(canvas, currentWorkflow, {
            ...minimapSettings.value,
            view: minimapView.value,
        }) || null;
    syncResolvedView(lastRenderInfo?.resolvedView);
}

function getMainCanvasState() {
    const app = window?.app || null;
    const graphCanvas = app?.canvas || null;
    const ds = graphCanvas?.ds || null;
    const canvas = graphCanvas?.canvas || graphCanvas?.el || null;
    if (!graphCanvas || !ds || !canvas) return null;
    const scale = Number(ds?.scale);
    const width = Number(canvas?.width || canvas?.clientWidth || 0);
    const height = Number(canvas?.height || canvas?.clientHeight || 0);
    if (!Number.isFinite(scale) || scale <= 0 || !(width > 0) || !(height > 0)) return null;
    return { app, graphCanvas, ds, canvas, scale, width, height };
}

function setMainCanvasOffset(ds, x, y) {
    if (Array.isArray(ds?.offset)) {
        ds.offset[0] = x;
        ds.offset[1] = y;
        return;
    }
    if (ds?.offset && typeof ds.offset === "object") {
        ds.offset.x = x;
        ds.offset.y = y;
    }
}

function markMainCanvasDirty(app, graphCanvas) {
    try {
        graphCanvas?.setDirty?.(true, true);
    } catch (e) {
        console.debug?.(e);
    }
    try {
        app?.graph?.setDirtyCanvas?.(true, true);
    } catch (e) {
        console.debug?.(e);
    }
}

function centerMainCanvasOnWorld(worldPoint) {
    if (!worldPoint) return;
    const state = getMainCanvasState();
    if (!state) return;
    const dpr = Math.max(1, Number(window.devicePixelRatio) || 1);
    const offsetX = -Number(worldPoint.x) + state.width * 0.5 / (state.scale * dpr);
    const offsetY = -Number(worldPoint.y) + state.height * 0.5 / (state.scale * dpr);
    if (!Number.isFinite(offsetX) || !Number.isFinite(offsetY)) return;
    setMainCanvasOffset(state.ds, offsetX, offsetY);
    markMainCanvasDirty(state.app, state.graphCanvas);
}

function getCanvasLocalPoint(event) {
    const canvas = canvasRef.value;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect?.();
    if (!rect) return null;
    return {
        x: Number(event?.clientX) - rect.left,
        y: Number(event?.clientY) - rect.top,
    };
}

function getWorldPointFromEvent(event) {
    const local = getCanvasLocalPoint(event);
    if (!local || !lastRenderInfo?.canvasToWorld) return null;
    return {
        local,
        world: lastRenderInfo.canvasToWorld(local.x, local.y),
    };
}

function updateHoverState(event) {
    const local = getCanvasLocalPoint(event);
    const hit = local && lastRenderInfo?.hitTestNode ? lastRenderInfo.hitTestNode(local.x, local.y) : null;
    const nextId = hit?.id !== null && hit?.id !== undefined ? String(hit.id) : null;
    const currentId =
        minimapView.value.hoveredNodeId !== null && minimapView.value.hoveredNodeId !== undefined
            ? String(minimapView.value.hoveredNodeId)
            : null;
    hoveredNodeLabel.value = hit?.label || "";
    if (nextId === currentId) return;
    minimapView.value = {
        ...minimapView.value,
        hoveredNodeId: nextId,
    };
    renderCanvas();
}

function navigateToMinimapPoint(worldPoint) {
    if (!worldPoint) return;
    centerMainCanvasOnWorld(worldPoint);
    minimapView.value = {
        ...minimapView.value,
        centerX: Number(worldPoint.x),
        centerY: Number(worldPoint.y),
    };
    renderCanvas();
}

function onMinimapPointerDown(event) {
    if (Number(event?.button ?? 0) !== 0) return;
    const point = getWorldPointFromEvent(event);
    if (!point) return;
    activePointerId = event.pointerId ?? 1;
    minimapCursor.value = "grabbing";
    canvasRef.value?.setPointerCapture?.(activePointerId);
    navigateToMinimapPoint(point.world);
    updateHoverState(event);
    event.preventDefault?.();
    event.stopPropagation?.();
}

function onMinimapPointerMove(event) {
    if (activePointerId !== null && event.pointerId === activePointerId) {
        const point = getWorldPointFromEvent(event);
        if (point) navigateToMinimapPoint(point.world);
        event.preventDefault?.();
        event.stopPropagation?.();
        return;
    }
    updateHoverState(event);
}

function endMinimapPointerInteraction(event) {
    if (activePointerId !== null && event?.pointerId === activePointerId) {
        canvasRef.value?.releasePointerCapture?.(activePointerId);
        activePointerId = null;
        minimapCursor.value = "crosshair";
    }
    if (event?.type === "pointerleave") {
        hoveredNodeLabel.value = "";
        if (minimapView.value.hoveredNodeId !== null) {
            minimapView.value = {
                ...minimapView.value,
                hoveredNodeId: null,
            };
            renderCanvas();
        }
    }
}

function onMinimapWheel(event) {
    const point = getWorldPointFromEvent(event);
    const resolvedView = lastRenderInfo?.resolvedView;
    if (!point || !resolvedView) return;
    const delta = clampNumber(Number(event?.deltaY) || 0, -240, 240);
    const factor = Math.exp(-delta * 0.0025);
    const nextZoom = clampNumber(
        (Number(minimapView.value.zoom) || 1) * factor,
        MINIMAP_ZOOM_MIN,
        MINIMAP_ZOOM_MAX,
    );
    if (Math.abs(nextZoom - (Number(minimapView.value.zoom) || 1)) < 0.001) {
        event.preventDefault?.();
        event.stopPropagation?.();
        return;
    }
    const visibleW = Math.max(1, Number(lastRenderInfo?.bounds?.width || 1) / nextZoom);
    const visibleH = Math.max(1, Number(lastRenderInfo?.bounds?.height || 1) / nextZoom);
    const fracX = clampNumber(
        (Number(point.world.x) - Number(resolvedView.viewMinX || 0)) / Math.max(1, Number(resolvedView.visibleW || 1)),
        0,
        1,
    );
    const fracY = clampNumber(
        (Number(point.world.y) - Number(resolvedView.viewMinY || 0)) / Math.max(1, Number(resolvedView.visibleH || 1)),
        0,
        1,
    );
    minimapView.value = {
        ...minimapView.value,
        zoom: nextZoom,
        centerX: Number(point.world.x) + (0.5 - fracX) * visibleW,
        centerY: Number(point.world.y) + (0.5 - fracY) * visibleH,
    };
    renderCanvas();
    updateHoverState(event);
    event.preventDefault?.();
    event.stopPropagation?.();
}

function onMinimapDoubleClick(event) {
    const point = getWorldPointFromEvent(event);
    resetMinimapView();
    if (point) centerMainCanvasOnWorld(point.world);
    renderCanvas();
    event.preventDefault?.();
    event.stopPropagation?.();
}

function toggleSetting(key) {
    minimapSettings.value = {
        ...minimapSettings.value,
        [key]: !minimapSettings.value?.[key],
    };
    persistWorkflowMinimapSettings(minimapSettings.value);
}

function setMinimapSize(sizeKey) {
    if (!SIZE_OPTIONS.some((item) => item.key === sizeKey)) return;
    minimapSettings.value = {
        ...minimapSettings.value,
        size: sizeKey,
    };
    persistWorkflowMinimapSettings(minimapSettings.value);
}

onMounted(() => {
    if (canvasRef.value && typeof ResizeObserver === "function") {
        resizeObserver = new ResizeObserver(() => renderCanvas());
        resizeObserver.observe(canvasRef.value);
    }
    renderCanvas();
});

watch(workflow, () => {
    resetMinimapView();
    renderCanvas();
}, { flush: "post" });

watch(minimapSettings, () => {
    renderCanvas();
}, { deep: true, flush: "post" });

watch(showTools, () => {
    renderCanvas();
}, { flush: "post" });

onBeforeUnmount(() => {
    try {
        resizeObserver?.disconnect?.();
    } catch (e) {
        console.debug?.(e);
    }
    resizeObserver = null;
    activePointerId = null;
});
</script>

<template>
    <div
        v-if="workflow"
        class="mjr-sidebar-section"
        style="background:var(--comfy-menu-bg, rgba(0,0,0,0.2));border:1px solid var(--border-color, rgba(255,255,255,0.14));border-radius:8px;padding:12px;min-width:300px"
    >
        <div
            style="font-size:13px;font-weight:600;color:var(--fg-color, #eaeaea);margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px"
        >
            ComfyUI Workflow
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">
            <div
                style="padding:4px 9px;border-radius:999px;background:rgba(33,150,243,0.14);border:1px solid rgba(33,150,243,0.30);font-size:11px;font-weight:700;color:#90CAF9;text-transform:uppercase;letter-spacing:0.4px"
            >
                {{ statusLabel }}
            </div>
            <div
                v-if="workflowStats.source"
                style="padding:4px 9px;border-radius:999px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);font-size:11px;font-weight:600;color:rgba(255,255,255,0.82)"
            >
                {{ workflowStats.source }}
            </div>
        </div>

        <div
            style="display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:8px;margin-bottom:12px"
        >
            <div style="padding:8px 10px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10)">
                <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:0.4px">Nodes</div>
                <div style="font-size:18px;font-weight:700;color:rgba(255,255,255,0.94);margin-top:2px">{{ workflowStats.nodes }}</div>
            </div>
            <div style="padding:8px 10px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10)">
                <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:0.4px">Links</div>
                <div style="font-size:18px;font-weight:700;color:rgba(255,255,255,0.94);margin-top:2px">{{ workflowStats.links }}</div>
            </div>
            <div style="padding:8px 10px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10)">
                <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:0.4px">Groups</div>
                <div style="font-size:18px;font-weight:700;color:rgba(255,255,255,0.94);margin-top:2px">{{ workflowStats.groups }}</div>
            </div>
        </div>

        <div
            style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:8px"
        >
            <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">
                <button
                    v-for="option in SIZE_OPTIONS"
                    :key="option.key"
                    type="button"
                    :title="`${option.label} minimap`"
                    :style="{
                        appearance: 'none',
                        border: minimapSettings.size === option.key ? '1px solid rgba(33,150,243,0.55)' : '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '999px',
                        padding: '4px 10px',
                        background: minimapSettings.size === option.key ? 'rgba(33,150,243,0.18)' : 'rgba(255,255,255,0.04)',
                        color: minimapSettings.size === option.key ? '#90CAF9' : 'rgba(255,255,255,0.78)',
                        fontSize: '11px',
                        fontWeight: minimapSettings.size === option.key ? '700' : '600',
                        cursor: 'pointer',
                    }"
                    @click="setMinimapSize(option.key)"
                >
                    {{ option.label }}
                </button>
            </div>
            <button
                type="button"
                class="mjr-btn mjr-icon-btn"
                :title="t('tooltip.minimapSettings', 'Minimap settings')"
                style="width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--mjr-border, rgba(255,255,255,0.12));background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.9);cursor:pointer"
                @click="showTools = !showTools"
            >
                <i class="pi pi-sliders-h" />
            </button>
        </div>

        <div
            v-if="showTools"
            style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:8px;align-items:stretch;margin-top:10px;margin-bottom:10px"
        >
            <button
                v-for="option in toggleOptions"
                :key="option.key"
                type="button"
                :style="{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 10px',
                    borderRadius: '10px',
                    border: minimapSettings?.[option.key] ? '1px solid rgba(76,175,80,0.40)' : '1px solid rgba(255,255,255,0.12)',
                    background: minimapSettings?.[option.key] ? 'rgba(76,175,80,0.10)' : 'rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.92)',
                    textAlign: 'left',
                }"
                @click="toggleSetting(option.key)"
            >
                <span
                    :style="{
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: minimapSettings?.[option.key] ? 'rgba(76,175,80,0.95)' : 'rgba(255,255,255,0.08)',
                        border: minimapSettings?.[option.key] ? '1px solid rgba(76,175,80,0.35)' : '1px solid rgba(255,255,255,0.12)',
                        flex: '0 0 auto',
                    }"
                >
                    <i
                        class="pi pi-check"
                        :style="{ fontSize: '12px', opacity: minimapSettings?.[option.key] ? '1' : '0' }"
                    />
                </span>
                <i
                    :class="option.iconClass"
                    style="font-size:18px;opacity:0.9;width:18px"
                />
                <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
                    <div style="font-size:13px;font-weight:600">
                        {{ option.label }}
                    </div>
                    <div style="font-size:11px;color:rgba(255,255,255,0.58)">
                        {{ minimapSettings?.[option.key] ? 'On' : 'Off' }}
                    </div>
                </div>
            </button>
        </div>

        <div style="display:flex;gap:10px;align-items:stretch;margin-top:10px">
            <canvas
                ref="canvasRef"
                :style="{
                    width: '100%',
                    height: canvasHeight,
                    cursor: minimapCursor,
                    touchAction: 'none',
                    borderRadius: '10px',
                    marginTop: '0',
                    background: 'linear-gradient(180deg, rgba(7, 12, 18, 0.95) 0%, rgba(10, 16, 24, 0.92) 100%)',
                    border: '1px solid var(--mjr-border, rgba(255,255,255,0.12))',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)',
                }"
                @pointerdown="onMinimapPointerDown"
                @pointermove="onMinimapPointerMove"
                @pointerup="endMinimapPointerInteraction"
                @pointercancel="endMinimapPointerInteraction"
                @pointerleave="endMinimapPointerInteraction"
                @wheel="onMinimapWheel"
                @dblclick="onMinimapDoubleClick"
            />
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:8px;font-size:11px;color:rgba(255,255,255,0.58)">
            <span>{{ hoveredNodeLabel || 'Click/drag to navigate · wheel to zoom' }}</span>
            <span>{{ Math.round((minimapView.zoom || 1) * 100) }}% · {{ currentSizeOption.label }}</span>
        </div>

        <details
            :open="rawJsonOpen"
            style="margin-top:10px"
            @toggle="rawJsonOpen = $event.target.open"
        >
            <summary
                style="cursor:pointer;color:var(--mjr-muted, rgba(255,255,255,0.65));font-size:12px;user-select:none"
            >
                Show raw JSON
            </summary>
            <pre
                style="background:rgba(0,0,0,0.5);padding:10px;border-radius:6px;font-size:11px;overflow:auto;max-height:180px;margin:10px 0 0 0;color:#90CAF9;font-family:'Consolas', 'Monaco', monospace"
            >{{ rawWorkflowJson }}</pre>
        </details>
    </div>
</template>
