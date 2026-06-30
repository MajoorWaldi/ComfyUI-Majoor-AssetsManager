<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { drawWorkflowMinimap, synthesizeWorkflowFromPromptGraph } from "../../../../components/sidebar/utils/minimap.js";
import {
    diffWorkflow,
    getWorkflowContent,
    listWorkflowThumbnailCandidates,
    listWorkflowVersions,
    moveWorkflow,
    setWorkflowThumbnail,
    validateWorkflow,
} from "../../../../api/client.js";
import { loadMajoorSettings, saveMajoorSettings } from "../../../../app/settings.js";
import { MINIMAP_LEGACY_SETTINGS_KEY } from "../../../../app/settingsStore.js";
import { t } from "../../../../app/i18n.js";
import { comfyToast } from "../../../../app/toast.js";
import { centerGraphCanvasOnWorldPoint } from "../../../../app/hostAdapter.js";
import { floatingViewerManager } from "../../../../features/viewer/floatingViewerManager.js";
import { openWorkflowAssetPicker } from "../../../../features/workflows/workflowPickerState.js";

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
const WORKFLOW_TREE_LIMIT = 250;

const SIZE_OPTIONS = Object.freeze([
    { key: "compact", label: "Compact", height: 120 },
    { key: "comfortable", label: "Comfort", height: 160 },
    { key: "expanded", label: "Expanded", height: 220 },
]);

const canvasRef = ref(null);
const categoryDraft = ref("");
const savingCategory = ref(false);
const loadingWorkflowPayload = ref(false);
const lazyWorkflowPayload = ref(null);
const validationLoading = ref(false);
const workflowValidation = ref(null);
const workflowVersions = ref([]);
const workflowDiff = ref(null);
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
    const rawWorkflow = coerceWorkflow(props.asset) || coerceWorkflow(lazyWorkflowPayload.value);
    const promptGraph = coercePromptGraph(props.asset) || coercePromptGraph(lazyWorkflowPayload.value);
    if (!rawWorkflow && !promptGraph) return null;
    return rawWorkflow || synthesizeWorkflowFromPromptGraph(promptGraph);
});

const workflowFilepath = computed(() =>
    String(props.asset?.filepath || props.asset?.path || props.asset?.file_info?.filepath || "").trim(),
);

const workflowTitle = computed(() =>
    String(props.asset?.display_name || props.asset?.name || props.asset?.filename || props.asset?.title || "Workflow").trim(),
);

const taskLabel = computed(() => String(props.asset?.task || props.asset?.workflow_task || "").trim());
const modelFamilyLabel = computed(() => String(props.asset?.model_family || props.asset?.workflow_model_family || "").trim());
const providerLabel = computed(() => String(props.asset?.provider || props.asset?.workflow_provider || "").trim());
const runsOnLabel = computed(() => String(props.asset?.runs_on || props.asset?.runsOn || "").trim().toLowerCase());
const runtimeLabel = computed(() => {
    const runsOn = runsOnLabel.value;
    const provider = providerLabel.value;
    if (runsOn === "api" && provider) return `API · ${provider}`;
    if (runsOn) return provider && provider.toLowerCase() !== runsOn ? `${runsOn} · ${provider}` : runsOn;
    return provider;
});
const notesLabel = computed(() => String(props.asset?.notes || "").trim());
const detectedSummary = computed(() =>
    [
        props.asset?.detected_task ? `detected: ${props.asset.detected_task}` : "",
        props.asset?.detected_model_family ? props.asset.detected_model_family : "",
        props.asset?.detected_provider ? props.asset.detected_provider : "",
    ].filter(Boolean).join(" · "),
);
const missingNodes = computed(() => normalizeStringList(props.asset?.missing_nodes || props.asset?.missingNodes));
const missingModels = computed(() => normalizeStringList(props.asset?.missing_models || props.asset?.missingModels));
const workflowTags = computed(() => normalizeStringList(props.asset?.tags || props.asset?.workflow_tags || props.asset?.tags_json));
const visibleWorkflowTags = computed(() => workflowTags.value.slice(0, 3));
const hiddenWorkflowTagCount = computed(() => Math.max(0, workflowTags.value.length - visibleWorkflowTags.value.length));
const validationMissingNodes = computed(() => normalizeStringList(workflowValidation.value?.missing_nodes));
const validationMissingModels = computed(() => normalizeStringList(workflowValidation.value?.missing_models));
const validationWarnings = computed(() => normalizeStringList(workflowValidation.value?.warnings));
const validationSummary = computed(() => {
    const data = workflowValidation.value;
    if (!data) return "";
    const nodes = Number(data.node_count || 0);
    const subgraphs = Number(data.subgraph_count || 0);
    const required = Array.isArray(data.required_nodes) ? data.required_nodes.length : 0;
    return `${nodes} nodes | ${subgraphs} subgraphs | ${required} node types`;
});
const latestVersionLabel = computed(() => {
    const item = workflowVersions.value?.[0];
    if (!item) return "";
    return String(item.filename || "").replace(/\.json$/i, "");
});
const diffSummary = computed(() => {
    const diff = workflowDiff.value;
    if (!diff) return "";
    return `${Number(diff.changed?.length || 0)} changed | ${Number(diff.added?.length || 0)} added | ${Number(diff.removed?.length || 0)} removed`;
});
const usageLabel = computed(() => {
    const count = Number(props.asset?.usage_count || props.asset?.usageCount || 0);
    if (!Number.isFinite(count) || count <= 0) return "";
    return `${Math.floor(count)} use${count === 1 ? "" : "s"}`;
});
const lastLoadedLabel = computed(() => formatUnixDate(props.asset?.last_loaded_at || props.asset?.lastLoadedAt));
const modifiedLabel = computed(() => formatUnixDate(props.asset?.mtime || props.asset?.modified_at || props.asset?.updated_at));
const workflowBadges = computed(() => {
    const badges = [];
    if (props.asset?.favorite) {
        badges.push({ key: "favorite", label: "Favorite", icon: "pi pi-star-fill", tone: "favorite" });
    }
    if (usageLabel.value) {
        badges.push({ key: "usage", label: usageLabel.value, icon: "pi pi-play-circle", tone: "usage" });
    }
    if (lastLoadedLabel.value) {
        badges.push({ key: "last-loaded", label: `Loaded ${lastLoadedLabel.value}`, icon: "pi pi-clock", tone: "loaded" });
    }
    for (const tag of visibleWorkflowTags.value) {
        badges.push({ key: `tag-${tag}`, label: tag, icon: "pi pi-tag", tone: "tag" });
    }
    if (hiddenWorkflowTagCount.value) {
        badges.push({ key: "tags-more", label: `+${hiddenWorkflowTagCount.value} tags`, icon: "pi pi-tags", tone: "tag" });
    }
    return badges;
});

function workflowBadgeStyle(tone) {
    const base = "display:inline-flex;align-items:center;gap:5px;max-width:100%;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:750;line-height:1.1;overflow:hidden";
    if (tone === "favorite") return `${base};background:rgba(255,193,7,0.15);border:1px solid rgba(255,193,7,0.34);color:#ffe082`;
    if (tone === "usage") return `${base};background:rgba(33,150,243,0.14);border:1px solid rgba(33,150,243,0.30);color:#90caf9`;
    if (tone === "loaded") return `${base};background:rgba(76,175,80,0.13);border:1px solid rgba(76,175,80,0.28);color:#a5d6a7`;
    return `${base};background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.14);color:rgba(255,255,255,0.82)`;
}

function normalizeStringList(value) {
    if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
    if (typeof value === "string") {
        const text = value.trim();
        if (!text) return [];
        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) return normalizeStringList(parsed);
        } catch {
            return text.split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
        }
    }
    return [];
}

function formatUnixDate(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return "";
    const ms = n > 10_000_000_000 ? n : n * 1000;
    try {
        return new Date(ms).toLocaleString();
    } catch {
        return "";
    }
}

async function ensureWorkflowPayload() {
    if (workflow.value) return;
    const filepath = workflowFilepath.value;
    if (!filepath) return;
    if (loadingWorkflowPayload.value) return;

    loadingWorkflowPayload.value = true;
    try {
        const result = await getWorkflowContent(filepath, { timeoutMs: 25_000 });
        if (!result?.ok) return;
        const workflowFromApi = result?.data?.workflow || result?.workflow || null;
        const promptFromApi = result?.data?.prompt || result?.prompt || null;
        if (!workflowFromApi && !promptFromApi) return;
        lazyWorkflowPayload.value = {
            workflow: workflowFromApi,
            prompt: promptFromApi,
        };
    } catch (e) {
        console.debug?.(e);
    } finally {
        loadingWorkflowPayload.value = false;
    }
}

const statusLabel = computed(() => (props.asset?.has_generation_data ? "Complete" : "Partial"));
const rawWorkflowJson = computed(() =>
    workflow.value ? JSON.stringify(workflow.value, null, 2) : "",
);

const currentCategory = computed(() => {
    const raw = String(props.asset?.category || props.asset?.subfolder || props.asset?.folder || "").trim();
    return raw.replace(/^\/+|\/+$/g, "");
});

const categorySegments = computed(() =>
    currentCategory.value ? currentCategory.value.split(/[\\/]+/).filter(Boolean) : [],
);
const categoryDisplayName = computed(() => categorySegments.value.at(-1) || currentCategory.value || "Root");
const categoryDisplaySegments = computed(() => categorySegments.value.slice(-1));

function workflowNodeLabel(node, index) {
    const id = node?.id ?? node?.key ?? index + 1;
    return String(
        node?.title ||
            node?._meta?.title ||
            node?.type ||
            node?.class_type ||
            node?.name ||
            `Node ${id}`,
    );
}

function workflowNodeType(node) {
    return String(node?.type || node?.class_type || node?.name || "").trim();
}

function syncCategoryDraft() {
    categoryDraft.value = currentCategory.value;
}

async function saveWorkflowCategory() {
    const filepath = String(props.asset?.filepath || props.asset?.path || props.asset?.file_info?.filepath || "").trim();
    if (!filepath) {
        comfyToast(t("toast.workflowMissingPath", "Workflow file path is missing."), "error");
        return;
    }
    const nextCategory = String(categoryDraft.value || "").trim();
    if (nextCategory === currentCategory.value) return;

    savingCategory.value = true;
    try {
        const result = await moveWorkflow({ filepath, category: nextCategory }, { timeoutMs: 30_000 });
        if (!result?.ok) {
            comfyToast(result?.error || t("toast.workflowMoveFailed", "Failed to move workflow."), "error");
            return;
        }
        categoryDraft.value = String(result?.data?.workflow?.category || nextCategory || "").trim();
        comfyToast(t("toast.workflowCategoryUpdated", "Workflow category updated"), "success", 1800);
    } catch (error) {
        comfyToast(t("toast.workflowMoveFailed", "Failed to move workflow."), "error");
    } finally {
        savingCategory.value = false;
    }
}

async function setWorkflowThumbnailFromLinkedAsset() {
    const filepath = workflowFilepath.value;
    if (!filepath) {
        comfyToast(t("toast.workflowMissingPath", "Workflow file path is missing."), "error");
        return;
    }

    const candidatesRes = await listWorkflowThumbnailCandidates({ filepath, limit: 12 }, { timeoutMs: 15_000 });
    if (!candidatesRes?.ok) {
        comfyToast(candidatesRes?.error || t("toast.workflowLoadFailed", "Failed to load workflow."), "error");
        return;
    }

    const candidates = Array.isArray(candidatesRes.data) ? candidatesRes.data : [];
    if (!candidates.length) {
        comfyToast(
            t("toast.workflowThumbnailNoCandidates", "No linked outputs are available for this workflow yet."),
            "warning",
            2600,
        );
        return;
    }

    const selectedCandidate = await openWorkflowAssetPicker({
        title: t("ctx.setWorkflowThumbnail", "Set workflow thumbnail"),
        workflow: props.asset,
        items: candidates,
    });
    if (!selectedCandidate?.filepath) return;

    const result = await setWorkflowThumbnail(
        { filepath, source_filepath: selectedCandidate.filepath },
        { timeoutMs: 30_000 },
    );
    if (!result?.ok) {
        comfyToast(result?.error || t("toast.workflowSaveFailed", "Failed to save workflow."), "error");
        return;
    }

    comfyToast(t("toast.workflowUpdated", "Workflow updated"), "success", 1800);
    window?.dispatchEvent?.(new CustomEvent("mjr:reload-grid", { detail: { reason: "workflow-thumbnail-sidebar" } }));
}

async function inspectWorkflow() {
    await ensureWorkflowPayload();
    if (!workflow.value) {
        comfyToast(t("toast.workflowLoadFailed", "Failed to load workflow."), "error");
        return;
    }
    try {
        await floatingViewerManager.openAssets({
            assets: [{ ...props.asset, workflow: workflow.value, Workflow: workflow.value }],
            index: 0,
            mode: "graph",
        });
    } catch (e) {
        console.debug?.(e);
        comfyToast(t("toast.workflowLoadFailed", "Failed to load workflow."), "error");
    }
}

async function runWorkflowDiagnostics() {
    const filepath = workflowFilepath.value;
    if (!filepath) {
        comfyToast(t("toast.workflowMissingPath", "Workflow file path is missing."), "error");
        return;
    }
    validationLoading.value = true;
    workflowValidation.value = null;
    workflowVersions.value = [];
    workflowDiff.value = null;
    try {
        const [validationRes, versionsRes] = await Promise.all([
            validateWorkflow(filepath, { timeoutMs: 20_000 }),
            listWorkflowVersions(filepath, { timeoutMs: 15_000 }),
        ]);
        if (!validationRes?.ok) {
            comfyToast(validationRes?.error || t("toast.workflowLoadFailed", "Failed to load workflow."), "error");
            return;
        }
        workflowValidation.value = validationRes.data || {};
        workflowVersions.value = Array.isArray(versionsRes?.data?.versions) ? versionsRes.data.versions : [];
        const latest = workflowVersions.value[0];
        if (latest?.filepath) {
            const diffRes = await diffWorkflow(filepath, latest.filepath, { timeoutMs: 15_000 });
            if (diffRes?.ok) workflowDiff.value = diffRes.data || null;
        }
    } catch (e) {
        console.debug?.(e);
        comfyToast(t("toast.workflowLoadFailed", "Failed to load workflow."), "error");
    } finally {
        validationLoading.value = false;
    }
}

const workflowTreeNodes = computed(() => {
    const nodes = Array.isArray(workflow.value?.nodes) ? workflow.value.nodes : [];
    return nodes.slice(0, WORKFLOW_TREE_LIMIT).map((node, index) => {
        const id = node?.id ?? node?.key ?? index + 1;
        const type = workflowNodeType(node);
        return {
            key: String(id),
            label: workflowNodeLabel(node, index),
            icon: "pi pi-circle-fill",
            data: {
                id,
                type,
            },
        };
    });
});

const workflowTreeOverflowCount = computed(() =>
    Math.max(0, Number(workflowStats.value.nodes || 0) - workflowTreeNodes.value.length),
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

function centerMainCanvasOnWorld(worldPoint) {
    centerGraphCanvasOnWorldPoint(worldPoint);
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
    syncCategoryDraft();
    ensureWorkflowPayload();
    renderCanvas();
});

watch(workflow, () => {
    resetMinimapView();
    renderCanvas();
}, { flush: "post" });

watch(
    workflowFilepath,
    () => {
        lazyWorkflowPayload.value = null;
        ensureWorkflowPayload();
    },
    { immediate: true },
);

watch(currentCategory, () => {
    syncCategoryDraft();
});

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

        <div style="margin-bottom:12px">
            <div style="font-size:16px;font-weight:800;color:rgba(255,255,255,0.94);line-height:1.25;overflow:hidden;text-overflow:ellipsis">
                {{ workflowTitle }}
            </div>
            <div
                v-if="workflowFilepath"
                style="font-size:11px;color:rgba(255,255,255,0.48);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                :title="workflowFilepath"
            >
                {{ workflowFilepath }}
            </div>
            <div
                v-if="workflowBadges.length"
                style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;min-width:0"
                aria-label="Workflow metadata badges"
            >
                <span
                    v-for="badge in workflowBadges"
                    :key="badge.key"
                    :style="workflowBadgeStyle(badge.tone)"
                    :title="badge.label"
                >
                    <i
                        :class="badge.icon"
                        style="font-size:10px;flex:0 0 auto"
                    />
                    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ badge.label }}</span>
                </span>
            </div>
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

        <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:8px;margin-bottom:12px">
            <div
                v-if="taskLabel"
                style="padding:8px 10px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10)"
            >
                <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:0.4px">Task</div>
                <div style="font-size:13px;font-weight:750;color:rgba(255,255,255,0.92);margin-top:3px">{{ taskLabel }}</div>
            </div>
            <div
                v-if="modelFamilyLabel"
                style="padding:8px 10px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10)"
            >
                <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:0.4px">Model</div>
                <div style="font-size:13px;font-weight:750;color:rgba(255,255,255,0.92);margin-top:3px">{{ modelFamilyLabel }}</div>
            </div>
            <div
                v-if="runtimeLabel"
                style="padding:8px 10px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10)"
            >
                <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:0.4px">Runs on</div>
                <div style="font-size:13px;font-weight:750;color:rgba(255,255,255,0.92);margin-top:3px">{{ runtimeLabel }}</div>
            </div>
            <div
                v-if="usageLabel || modifiedLabel"
                style="padding:8px 10px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10)"
            >
                <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:0.4px">Library</div>
                <div style="font-size:12px;font-weight:650;color:rgba(255,255,255,0.84);margin-top:3px">{{ usageLabel || modifiedLabel }}</div>
                <div
                    v-if="usageLabel && modifiedLabel"
                    style="font-size:11px;color:rgba(255,255,255,0.54);margin-top:2px"
                >
                    {{ modifiedLabel }}
                </div>
            </div>
        </div>

        <div
            v-if="missingNodes.length || missingModels.length"
            style="margin-bottom:12px;padding:10px;border-radius:10px;background:rgba(244,67,54,0.08);border:1px solid rgba(244,67,54,0.25)"
        >
            <div style="font-size:10px;font-weight:800;color:#ef9a9a;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:6px">Missing dependencies</div>
            <div
                v-if="missingNodes.length"
                :style="{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '5px',
                    marginBottom: missingModels.length ? '7px' : '0',
                }"
            >
                <span
                    v-for="item in missingNodes"
                    :key="`node-${item}`"
                    style="padding:3px 7px;border-radius:999px;background:rgba(244,67,54,0.16);font-size:10px;font-weight:700;color:#ffcdd2"
                >
                    {{ item }}
                </span>
            </div>
            <div
                v-if="missingModels.length"
                style="display:flex;flex-wrap:wrap;gap:5px"
            >
                <span
                    v-for="item in missingModels"
                    :key="`model-${item}`"
                    style="padding:3px 7px;border-radius:999px;background:rgba(255,152,0,0.16);font-size:10px;font-weight:700;color:#ffe0b2"
                >
                    {{ item }}
                </span>
            </div>
        </div>

        <div
            v-if="notesLabel || detectedSummary"
            style="margin-bottom:12px;padding:10px;border-radius:10px;background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.10)"
        >
            <div
                v-if="notesLabel"
                style="font-size:12px;line-height:1.45;color:rgba(255,255,255,0.82);white-space:pre-wrap"
            >
                {{ notesLabel }}
            </div>
            <div
                v-if="detectedSummary"
                :style="{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.48)',
                    marginTop: notesLabel ? '7px' : '0',
                }"
            >
                {{ detectedSummary }}
            </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:8px;margin-bottom:12px">
            <MButton
                type="button"
                severity="secondary"
                text
                rounded
                style="height:34px;border-radius:9px;border:1px solid rgba(255,255,255,0.12);background:rgba(33,150,243,0.14);color:rgba(255,255,255,0.92);font-size:12px;font-weight:750;display:inline-flex;align-items:center;justify-content:center;gap:7px"
                @click="setWorkflowThumbnailFromLinkedAsset"
            >
                <i class="pi pi-image" />
                <span>{{ t("ctx.setWorkflowThumbnail", "Set workflow thumbnail") }}</span>
            </MButton>
            <MButton
                type="button"
                severity="secondary"
                text
                rounded
                style="height:34px;border-radius:9px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.92);font-size:12px;font-weight:750;display:inline-flex;align-items:center;justify-content:center;gap:7px"
                @click="inspectWorkflow"
            >
                <i class="pi pi-search" />
                <span>{{ t("ctx.inspect", "Inspect") }}</span>
            </MButton>
            <MButton
                type="button"
                severity="secondary"
                text
                rounded
                :disabled="validationLoading"
                style="height:34px;border-radius:9px;border:1px solid rgba(255,255,255,0.12);background:rgba(76,175,80,0.12);color:rgba(255,255,255,0.92);font-size:12px;font-weight:750;display:inline-flex;align-items:center;justify-content:center;gap:7px"
                @click="runWorkflowDiagnostics"
            >
                <i :class="validationLoading ? 'pi pi-spin pi-spinner' : 'pi pi-check-circle'" />
                <span>{{ validationLoading ? 'Checking' : 'Validate' }}</span>
            </MButton>
        </div>

        <div
            v-if="workflowValidation"
            style="margin-bottom:12px;padding:10px;border-radius:10px;background:rgba(76,175,80,0.07);border:1px solid rgba(76,175,80,0.22)"
        >
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px">
                <div style="font-size:10px;font-weight:800;color:#a5d6a7;text-transform:uppercase;letter-spacing:0.4px">Workflow diagnostics</div>
                <div style="font-size:11px;color:rgba(255,255,255,0.62)">{{ validationSummary }}</div>
            </div>
            <div
                v-if="validationMissingNodes.length || validationMissingModels.length"
                style="display:flex;flex-direction:column;gap:6px"
            >
                <div
                    v-if="validationMissingNodes.length"
                    style="display:flex;flex-wrap:wrap;gap:5px"
                >
                    <span
                        v-for="item in validationMissingNodes"
                        :key="`diag-node-${item}`"
                        style="padding:3px 7px;border-radius:999px;background:rgba(244,67,54,0.16);font-size:10px;font-weight:700;color:#ffcdd2"
                    >
                        Missing node: {{ item }}
                    </span>
                </div>
                <div
                    v-if="validationMissingModels.length"
                    style="display:flex;flex-wrap:wrap;gap:5px"
                >
                    <span
                        v-for="item in validationMissingModels"
                        :key="`diag-model-${item}`"
                        style="padding:3px 7px;border-radius:999px;background:rgba(255,152,0,0.16);font-size:10px;font-weight:700;color:#ffe0b2"
                    >
                        Missing model: {{ item }}
                    </span>
                </div>
            </div>
            <div
                v-else
                style="font-size:12px;color:rgba(255,255,255,0.78)"
            >
                No missing dependencies detected by the current ComfyUI runtime.
            </div>
            <div
                v-if="validationWarnings.length"
                style="margin-top:7px;font-size:11px;color:rgba(255,255,255,0.58)"
            >
                {{ validationWarnings.join(' | ') }}
            </div>
            <div
                v-if="latestVersionLabel || diffSummary"
                style="margin-top:8px;font-size:11px;color:rgba(255,255,255,0.62)"
            >
                Latest version: {{ latestVersionLabel || 'none' }}<span v-if="diffSummary"> | Diff: {{ diffSummary }}</span>
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

        <div style="margin-bottom:12px;padding:10px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.10)">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;min-width:0">
                <div style="min-width:0;flex:1 1 auto">
                    <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:0.4px">Category</div>
                    <div
                        :title="currentCategory || 'Root'"
                        style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%"
                    >
                        {{ categoryDisplayName }}
                    </div>
                </div>
                <div
                    v-if="categoryDisplaySegments.length"
                    :title="currentCategory"
                    style="display:flex;flex-wrap:wrap;gap:4px;justify-content:flex-end;min-width:0;max-width:45%"
                >
                    <span
                        v-for="segment in categoryDisplaySegments"
                        :key="segment"
                        style="padding:3px 7px;border-radius:999px;background:rgba(33,150,243,0.12);border:1px solid rgba(33,150,243,0.22);font-size:10px;font-weight:700;color:#90CAF9;text-transform:uppercase;letter-spacing:0.3px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                    >
                        {{ segment }}
                    </span>
                </div>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
                <input
                    v-model="categoryDraft"
                    type="text"
                    :placeholder="t('dialog.workflowCategory', 'Workflow category')"
                    style="flex:1;min-width:0;padding:9px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.12);background:rgba(0,0,0,0.22);color:rgba(255,255,255,0.92);font-size:12px"
                />
                <MButton
                    type="button"
                    severity="secondary"
                    text
                    rounded
                    :disabled="savingCategory"
                    :style="{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: savingCategory ? 'rgba(255,255,255,0.06)' : 'rgba(33,150,243,0.16)',
                        color: 'rgba(255,255,255,0.92)',
                        cursor: savingCategory ? 'wait' : 'pointer',
                        fontSize: '12px',
                        fontWeight: '700',
                        whiteSpace: 'nowrap',
                    }"
                    @click="saveWorkflowCategory"
                >
                    {{ savingCategory ? 'Saving...' : 'Move' }}
                </MButton>
            </div>
        </div>

        <div
            v-if="workflowTreeNodes.length"
            class="mjr-workflow-tree-wrap"
        >
            <div class="mjr-section-title">
                Workflow Nodes
            </div>
            <MTree
                :value="workflowTreeNodes"
                class="mjr-workflow-tree"
                scroll-height="180px"
                :pt="{
                    wrapper: { class: 'mjr-workflow-tree-scroll' },
                    rootChildren: { class: 'mjr-workflow-tree-list' },
                    nodeContent: { class: 'mjr-workflow-tree-node-content' },
                    nodeToggleButton: { class: 'mjr-workflow-tree-toggle' },
                    nodeIcon: { class: 'mjr-workflow-tree-icon' },
                    nodeLabel: { class: 'mjr-workflow-tree-label' },
                }"
            >
                <template #default="{ node }">
                    <span class="mjr-workflow-tree-node">
                        <span class="mjr-workflow-tree-node-name">{{ node.label }}</span>
                        <span
                            v-if="node.data?.type"
                            class="mjr-workflow-tree-node-type"
                        >
                            {{ node.data.type }}
                        </span>
                        <span class="mjr-menu-item-hint">#{{ node.data?.id }}</span>
                    </span>
                </template>
            </MTree>
            <div
                v-if="workflowTreeOverflowCount"
                class="mjr-section-hint"
            >
                +{{ workflowTreeOverflowCount }} more nodes
            </div>
        </div>

        <div
            style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:8px"
        >
            <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">
                <MButton
                    v-for="option in SIZE_OPTIONS"
                    :key="option.key"
                    type="button"
                    severity="secondary"
                    text
                    rounded
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
                </MButton>
            </div>
            <MButton
                type="button"
                class="mjr-btn mjr-icon-btn"
                severity="secondary"
                text
                rounded
                :title="t('tooltip.minimapSettings', 'Minimap settings')"
                style="width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--mjr-border, rgba(255,255,255,0.12));background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.9);cursor:pointer"
                @click="showTools = !showTools"
            >
                <i class="pi pi-sliders-h" />
            </MButton>
        </div>

        <div
            v-if="showTools"
            style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:8px;align-items:stretch;margin-top:10px;margin-bottom:10px"
        >
            <MButton
                v-for="option in toggleOptions"
                :key="option.key"
                type="button"
                severity="secondary"
                text
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
            </MButton>
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
            <span>{{ hoveredNodeLabel || 'Click/drag to navigate | wheel to zoom' }}</span>
            <span>{{ Math.round((minimapView.zoom || 1) * 100) }}% | {{ currentSizeOption.label }}</span>
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
