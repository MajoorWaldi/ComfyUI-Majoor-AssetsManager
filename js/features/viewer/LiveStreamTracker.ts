/**
 * LiveStreamTracker - bridges ComfyUI generation events to the Floating Viewer.
 *
 * Two sources feed the MFV:
 *  1. NEW_GENERATION_OUTPUT: when Live Stream is active, shows the latest output
 *     file after workflow execution.
 *  2. b_preview: when KSampler Preview is active, streams denoising-step preview
 *     blobs from the ComfyUI WebSocket API.
 *
 * Canvas node selection is intentionally owned by Node Stream, not Live Stream.
 */

import { EVENTS } from "../../app/events.js";
import { waitForRawHostApi } from "../../app/hostAdapter.js";
import { floatingViewerManager } from "./floatingViewerManager.js";

let _initialized = false;
let _genOutputHandler: any = null;
let _previewHandler: any = null;
let _previewWithMetaHandler: any = null;
let _apiRef: any = null;
let _currentJobId: any = null;
let _previewHookGeneration = 0;
let _previewWithMetaLastAt = 0;

const PREVIEW_META_SUPPRESSION_MS = 400;
const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".bmp"]);
const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"]);
const AUDIO_EXTS = new Set([".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac", ".opus"]);
const MODEL3D_EXTS = new Set([".glb", ".gltf", ".obj", ".fbx", ".stl", ".usdz"]);

function _getFileExt(filename: any) {
    const safeName = String(filename || "").trim().toLowerCase();
    const dotIndex = safeName.lastIndexOf(".");
    return dotIndex >= 0 ? safeName.slice(dotIndex) : "";
}

function _isPreviewableGenerationFile(file: any) {
    const kind = String(
        file?.kind || file?.asset_type || file?.media_type || file?.type || "",
    ).toLowerCase();
    if (kind === "image" || kind === "video" || kind === "audio" || kind === "model3d") {
        return true;
    }
    const ext = _getFileExt(file?.filename || file?.name || "");
    return (
        IMAGE_EXTS.has(ext) ||
        VIDEO_EXTS.has(ext) ||
        AUDIO_EXTS.has(ext) ||
        MODEL3D_EXTS.has(ext)
    );
}

function _hasRecentPreviewWithMeta() {
    return Date.now() - _previewWithMetaLastAt <= PREVIEW_META_SUPPRESSION_MS;
}

async function _hookPreviewApi(app: any) {
    const hookGeneration = ++_previewHookGeneration;
    try {
        _detachPreviewApiListeners();

        const api = await waitForRawHostApi({ app, timeoutMs: 8000 } as any);
        if (hookGeneration !== _previewHookGeneration) return;
        if (!api) {
            console.debug("[Majoor] MFV: ComfyUI API not found - preview streaming disabled");
            return;
        }
        _apiRef = api;

        _previewWithMetaHandler = (e: any) => {
            try {
                const { blob, nodeId, jobId } = e.detail || {};
                // Validate blob before marking the suppression timestamp so that
                // an invalid/missing blob does not silence the b_preview fallback.
                if (!blob || !(blob instanceof Blob)) return;
                _previewWithMetaLastAt = Date.now();
                if (_currentJobId && jobId && jobId !== _currentJobId) return;
                floatingViewerManager.feedPreviewBlob(blob, {
                    sourceLabel: nodeId ? `Node ${nodeId}` : null,
                });
            } catch (err: any) {
                console.debug?.("[MFV] b_preview_with_metadata error", err);
            }
        };
        api.addEventListener("b_preview_with_metadata", _previewWithMetaHandler);

        _previewHandler = (e: any) => {
            try {
                if (_hasRecentPreviewWithMeta()) return;
                const blob = e.detail;
                if (!blob || !(blob instanceof Blob)) return;
                floatingViewerManager.feedPreviewBlob(blob);
            } catch (err: any) {
                console.debug?.("[MFV] preview blob error", err);
            }
        };
        api.addEventListener("b_preview", _previewHandler);

        console.debug(
            "[Majoor] MFV preview stream hooked to ComfyUI API (b_preview_with_metadata + b_preview fallback)",
        );
    } catch (e: any) {
        console.debug?.("[Majoor] MFV preview hook failed - preview streaming disabled", e);
    }
}

function _detachPreviewApiListeners() {
    if (_apiRef) {
        if (_previewHandler) {
            try {
                _apiRef.removeEventListener("b_preview", _previewHandler);
            } catch (e: any) {
                console.debug?.(e);
            }
        }
        if (_previewWithMetaHandler) {
            try {
                _apiRef.removeEventListener("b_preview_with_metadata", _previewWithMetaHandler);
            } catch (e: any) {
                console.debug?.(e);
            }
        }
    }
    _previewHandler = null;
    _previewWithMetaHandler = null;
    _previewWithMetaLastAt = 0;
    _apiRef = null;
}

export function setCurrentJobId(jobId: string | null): void {
    _currentJobId = jobId || null;
}

function _pickLatest(files: any) {
    if (!Array.isArray(files) || !files.length) return null;
    for (let index = files.length - 1; index >= 0; index -= 1) {
        const file = files[index];
        if (_isPreviewableGenerationFile(file)) return file;
    }
    return files[files.length - 1];
}

export function initLiveStreamTracker(app: any): void {
    if (_genOutputHandler) return;
    _initialized = true;

    _genOutputHandler = (e: any) => {
        try {
            if (!floatingViewerManager.getLiveActive()) return;
            const latest = _pickLatest(e.detail?.files);
            if (!latest) return;
            floatingViewerManager.upsertWithContent(latest);
        } catch (err: any) {
            console.debug?.("[MFV] generation output error", err);
        }
    };
    if (typeof window !== "undefined") {
        window.addEventListener(EVENTS.NEW_GENERATION_OUTPUT, _genOutputHandler);
    }

    _hookPreviewApi(app);

    console.debug("[Majoor] LiveStreamTracker initialized");
}

export function teardownLiveStreamTracker(app: any): void {
    void app;
    if (_genOutputHandler) {
        if (typeof window !== "undefined") {
            window.removeEventListener(EVENTS.NEW_GENERATION_OUTPUT, _genOutputHandler);
        }
        _genOutputHandler = null;
    }
    _previewHookGeneration += 1;
    _detachPreviewApiListeners();
    _currentJobId = null;
    _initialized = false;
    console.debug("[Majoor] LiveStreamTracker torn down");
}

export function isLiveStreamTrackerInitialized(): boolean {
    return _initialized;
}
