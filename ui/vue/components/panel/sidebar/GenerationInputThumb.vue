<script setup>
import { ref } from "vue";
import { ENDPOINTS } from "../../../../api/endpoints.js";
import { openInFolder, post } from "../../../../api/client.js";
import { t } from "../../../../app/i18n.js";
import { comfyToast } from "../../../../app/toast.js";
import { getRawHostApp } from "../../../../app/hostAdapter.js";
import { openGridContextMenu } from "../../../../features/contextmenu/gridContextMenuState.js";
import { createCanvasLoaderNodes } from "../../../../features/dnd/canvasLoaderNode.js";
import { stageToInputDetailed } from "../../../../features/dnd/staging/stageToInput.js";
import { requestViewerOpen } from "../../../../features/viewer/viewerOpenRequest.js";
import { isSafeOpenUrl } from "./generationSectionState.js";

const props = defineProps({
    inputFile: { type: Object, required: true },
});

const currentSrcIndex = ref(0);
const flashOutline = ref(false);

let floatingViewerManagerModulePromise = null;

function loadFloatingViewerManagerModule() {
    if (!floatingViewerManagerModulePromise) {
        floatingViewerManagerModulePromise = import("../../../../features/viewer/floatingViewerManager.js");
    }
    return floatingViewerManagerModulePromise;
}

function currentSource() {
    const candidates = Array.isArray(props.inputFile?.previewCandidates)
        ? props.inputFile.previewCandidates
        : [];
    return candidates[currentSrcIndex.value] || "";
}

function handleMediaError() {
    const candidates = Array.isArray(props.inputFile?.previewCandidates)
        ? props.inputFile.previewCandidates
        : [];
    if (currentSrcIndex.value < candidates.length - 1) {
        currentSrcIndex.value += 1;
    }
}

async function copyPath(event) {
    event?.stopPropagation?.();
    const value = String(props.inputFile?.filepath || props.inputFile?.filename || "").trim();
    if (!value) return;
    try {
        await navigator.clipboard.writeText(value);
        flashOutline.value = true;
        setTimeout(() => {
            flashOutline.value = false;
        }, 350);
    } catch (e) {
        console.debug?.(e);
    }
}

function openPreview(event) {
    event?.stopPropagation?.();
    openInMainViewer();
}

function asAsset() {
    const input = props.inputFile || {};
    const filepath = String(input.filepath || "").trim();
    return {
        filename: input.filename || "",
        name: input.filename || "",
        filepath,
        path: filepath,
        subfolder: input.subfolder || "",
        type: input.type || "input",
        source: input.type || "input",
        kind: inferKind(input),
        root_id: input.root_id || "",
        preview_url: currentSource(),
    };
}

function inferKind(input = props.inputFile || {}) {
    const explicit = String(input.kind || "").trim().toLowerCase();
    if (explicit === "image" || explicit === "video" || explicit === "audio" || explicit === "model3d") return explicit;
    if (input.isVideo) return "video";
    if (input.isAudio) return "audio";
    const filename = String(input.filename || "").toLowerCase();
    if (/\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(filename)) return "video";
    if (/\.(wav|mp3|flac|ogg|m4a|aac|opus)$/i.test(filename)) return "audio";
    if (/\.(glb|gltf|obj|stl|ply|fbx)$/i.test(filename)) return "model3d";
    return "image";
}

function createMenuItem(label, iconClass, action, { disabled = false } = {}) {
    return {
        id: `mjr-generation-source-${String(label).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        type: "item",
        label,
        iconClass,
        rightHint: "",
        tone: String(label).toLowerCase().includes("floating") ? "floating-viewer" : "",
        disabled,
        action,
    };
}

function createSeparator() {
    return {
        id: "mjr-generation-source-separator",
        type: "separator",
    };
}

function canOpenPreview() {
    return isSafeOpenUrl(currentSource()) || !!props.inputFile?.filename || !!props.inputFile?.filepath;
}

function openInMainViewer() {
    const asset = asAsset();
    if (requestViewerOpen({ asset, index: 0 })) return;
    const src = currentSource();
    if (!isSafeOpenUrl(src)) return;
    try {
        window.open(src, "_blank", "noopener,noreferrer");
    } catch (e) {
        console.debug?.(e);
    }
}

async function openInFloatingViewer() {
    try {
        const { floatingViewerManager } = await loadFloatingViewerManagerModule();
        await floatingViewerManager.openAssets({ assets: [asAsset()], index: 0 });
    } catch (e) {
        console.debug?.(e);
        comfyToast(t("toast.viewerOpenFailed", "Failed to open viewer."), "error");
    }
}

async function openSourceFolder() {
    const result = await openInFolder(asAsset());
    if (!result?.ok) {
        comfyToast(result?.error || t("toast.openFolderFailed", "Failed to open folder."), "error");
        return;
    }
    comfyToast(t("toast.openedInFolder", "Opened in folder"), "info", 1600);
}

async function loadAssetToCanvas() {
    const asset = asAsset();
    const payload = {
        filename: asset.filename,
        subfolder: asset.subfolder,
        type: asset.type || "input",
        root_id: asset.root_id || undefined,
        kind: asset.kind,
    };
    const staged = await stageToInputDetailed({
        post,
        endpoint: ENDPOINTS.STAGE_TO_INPUT,
        payload,
        index: false,
    });
    if (!staged?.relativePath) {
        comfyToast(t("toast.loadAssetFailed", "Failed to load asset."), "error");
        return;
    }
    const count = createCanvasLoaderNodes({
        app: getRawHostApp(),
        items: [
            {
                payload,
                relativePath: staged.relativePath,
                droppedExt: String(payload.filename || "").split(".").pop() || "",
            },
        ],
        event: null,
    });
    if (!count) {
        comfyToast(t("toast.loadAssetFailed", "Failed to load asset."), "error");
        return;
    }
    const kindLabel = asset.kind ? asset.kind.charAt(0).toUpperCase() + asset.kind.slice(1) : "Asset";
    comfyToast(t("toast.assetLoadedToCanvas", "{kind} loader added to canvas.", { kind: kindLabel }), "success", 1800);
}

function handleContextMenu(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const kind = inferKind();
    const loadLabel =
        kind === "video"
            ? t("ctx.loadVideo", "Load video")
            : kind === "audio"
                ? t("ctx.loadAudio", "Load audio")
                : kind === "model3d"
                    ? t("ctx.loadModel3d", "Load 3D model")
                    : t("ctx.loadImage", "Load image");
    openGridContextMenu({
        x: event?.clientX || 0,
        y: event?.clientY || 0,
        items: [
            createMenuItem(t("ctx.openInViewer", "Open in viewer"), "pi pi-eye", openInMainViewer, {
                disabled: !canOpenPreview(),
            }),
            createMenuItem(t("ctx.openInFloatingViewer", "Open in Floating Viewer"), "pi pi-window-maximize", openInFloatingViewer, {
                disabled: !canOpenPreview(),
            }),
            createMenuItem(t("ctx.openInFolder", "Open in folder"), "pi pi-folder-open", openSourceFolder, {
                disabled: !props.inputFile?.filepath,
            }),
            createSeparator(),
            createMenuItem(loadLabel, "pi pi-plus-circle", loadAssetToCanvas, {
                disabled: !props.inputFile?.filename,
            }),
            createMenuItem(t("ctx.copyPath", "Copy path"), "pi pi-copy", copyPath, {
                disabled: !(props.inputFile?.filepath || props.inputFile?.filename),
            }),
        ],
    });
}

function handleVideoOver(event) {
    event.target?.play?.().catch?.(() => {});
}

function handleVideoOut(event) {
    try {
        event.target?.pause?.();
    } catch (e) {
        console.debug?.(e);
    }
}

function isAudioFile() {
    return !!props.inputFile?.isAudio;
}
</script>

<template>
    <div
        :title="`${inputFile.filename} (click to copy, double-click to open in new tab)`"
        :style="{
            width: '64px',
            height: '64px',
            background: '#222',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: flashOutline ? '2px solid rgba(76, 175, 80, 0.9)' : '',
            outlineOffset: flashOutline ? '1px' : '',
        }"
        @click="copyPath"
        @dblclick="openPreview"
        @contextmenu="handleContextMenu"
    >
        <video
            v-if="inputFile.isVideo"
            :src="currentSource()"
            muted
            loop
            playsinline
            preload="metadata"
            style="width:100%;height:100%;object-fit:cover"
            @error="handleMediaError"
            @mouseover="handleVideoOver"
            @mouseout="handleVideoOut"
        />
        <div
            v-else-if="isAudioFile()"
            style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;background:linear-gradient(135deg, rgba(0,188,212,0.28), rgba(156,39,176,0.20));color:white;padding:6px;text-align:center"
        >
            <div style="font-size:18px;line-height:1">♪</div>
            <div style="font-size:8px;font-weight:700;max-width:54px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                {{ inputFile.filename }}
            </div>
        </div>
        <img
            v-else
            :src="currentSource()"
            style="width:100%;height:100%;object-fit:cover"
            @error="handleMediaError"
        >

        <div
            v-if="inputFile.role && inputFile.role !== 'secondary'"
            style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.7);color:white;font-size:8px;padding:2px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
        >
            {{ inputFile.roleLabel }}
        </div>

        <div
            v-else-if="inputFile.isVideo"
            title="Video file"
            style="position:absolute;color:white;opacity:0.7;font-size:16px;pointer-events:none"
        >
            Play
        </div>
    </div>
</template>
