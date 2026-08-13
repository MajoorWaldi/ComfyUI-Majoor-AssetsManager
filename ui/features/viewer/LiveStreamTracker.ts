/**
 * LiveStreamTracker - bridges ComfyUI generation events to the Floating Viewer.
 *
 * Two sources feed the MFV:
 *  1. NEW_GENERATION_OUTPUT: when Live Stream is active, shows the latest output
 *     file after workflow execution.
 *  2. b_preview: when KSampler Preview is active, streams denoising-step preview
 *     blobs from the ComfyUI WebSocket API.
 *  3. kj_preview_override: streams the richer image/animated/video previews
 *     emitted by KJNodes Model Preview Override when enabled in settings.
 *
 * Canvas node selection is intentionally owned by Node Stream, not Live Stream.
 */

import { EVENTS } from "../../app/events.js";
import { APP_CONFIG } from "../../app/config.js";
import { waitForRawHostApi } from "../../app/hostAdapter.js";
import { floatingViewerManager } from "./floatingViewerManager.js";

let _initialized = false;
let _genOutputHandler: any = null;
let _previewHandler: any = null;
let _previewWithMetaHandler: any = null;
let _kjPreviewOverrideHandler: any = null;
let _executionStartHandler: any = null;
let _executionEndHandler: any = null;
let _apiRef: any = null;
let _currentJobId: any = null;
let _previewHookGeneration = 0;
let _previewWithMetaLastAt = 0;
let _kjPreviewRunActive = false;

const PREVIEW_META_SUPPRESSION_MS = 400;
const KJ_PREVIEW_OVERRIDE_EVENT = "kj_preview_override";
const KJ_PREVIEW_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4"]);
const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".jxl", ".gif", ".bmp"]);
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

function _normalizeKjPreviewMime(value: any) {
    const mime = String(value || "image/jpeg")
        .trim()
        .toLowerCase();
    return KJ_PREVIEW_MIME_TYPES.has(mime) ? mime : null;
}

/** Decode KJNodes' raw base64 payload without introducing a data URL. */
export function decodeKjPreviewPayload(detail: any): Blob | null {
    const mime = _normalizeKjPreviewMime(detail?.mime);
    const encoded = String(detail?.image || "").trim();
    if (!mime || !encoded || typeof globalThis.atob !== "function") return null;

    try {
        const binary = globalThis.atob(encoded);
        const chunks: ArrayBuffer[] = [];
        const chunkSize = 32 * 1024;
        for (let offset = 0; offset < binary.length; offset += chunkSize) {
            const slice = binary.slice(offset, offset + chunkSize);
            const buffer = new ArrayBuffer(slice.length);
            const bytes = new Uint8Array(buffer);
            for (let index = 0; index < slice.length; index += 1) {
                bytes[index] = slice.charCodeAt(index);
            }
            chunks.push(buffer);
        }
        return new Blob(chunks, { type: mime });
    } catch {
        return null;
    }
}

function _formatKjPreviewSourceLabel(detail: any) {
    const nodeId = String(detail?.node_id ?? "").trim();
    const step = Number(detail?.step);
    const total = Number(detail?.total);
    const stepLabel =
        Number.isFinite(step) && Number.isFinite(total) && total > 0 ? ` · ${step}/${total}` : "";
    return `KJ Preview Override${nodeId ? ` · Node ${nodeId}` : ""}${stepLabel}`;
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

        _executionStartHandler = () => {
            _kjPreviewRunActive = false;
        };
        _executionEndHandler = () => {
            _kjPreviewRunActive = false;
        };
        api.addEventListener("execution_start", _executionStartHandler);
        api.addEventListener("executing", _executionStartHandler);
        api.addEventListener("execution_success", _executionEndHandler);
        api.addEventListener("execution_error", _executionEndHandler);
        api.addEventListener("execution_interrupted", _executionEndHandler);

        _kjPreviewOverrideHandler = (e: any) => {
            try {
                if (APP_CONFIG.MFV_KJ_PREVIEW_OVERRIDE_ENABLED === false) {
                    _kjPreviewRunActive = false;
                    return;
                }
                if (!floatingViewerManager.canAcceptPreviewBlob()) return;
                const detail = e?.detail || null;
                const blob = decodeKjPreviewPayload(detail);
                if (!blob) return;

                _kjPreviewRunActive = true;
                const nodeId = String(detail?.node_id ?? "").trim();
                floatingViewerManager.feedPreviewBlob(blob, {
                    source: "kj-preview-override",
                    sourceLabel: _formatKjPreviewSourceLabel(detail),
                    nodeId: nodeId || null,
                    mime: blob.type,
                    width: Number(detail?.w) || undefined,
                    height: Number(detail?.h) || undefined,
                    fps: Number(detail?.fps) || undefined,
                    step: Number.isFinite(Number(detail?.step)) ? Number(detail.step) : null,
                    total: Number.isFinite(Number(detail?.total)) ? Number(detail.total) : null,
                });
            } catch (err: any) {
                console.debug?.("[MFV] KJNodes preview override error", err);
            }
        };
        api.addEventListener(KJ_PREVIEW_OVERRIDE_EVENT, _kjPreviewOverrideHandler);

        _previewWithMetaHandler = (e: any) => {
            try {
                if (_kjPreviewRunActive && APP_CONFIG.MFV_KJ_PREVIEW_OVERRIDE_ENABLED !== false)
                    return;
                if (!floatingViewerManager.canAcceptPreviewBlob()) return;
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
                if (_kjPreviewRunActive && APP_CONFIG.MFV_KJ_PREVIEW_OVERRIDE_ENABLED !== false)
                    return;
                if (_hasRecentPreviewWithMeta()) return;
                if (!floatingViewerManager.canAcceptPreviewBlob()) return;
                const blob = e.detail;
                if (!blob || !(blob instanceof Blob)) return;
                floatingViewerManager.feedPreviewBlob(blob);
            } catch (err: any) {
                console.debug?.("[MFV] preview blob error", err);
            }
        };
        api.addEventListener("b_preview", _previewHandler);

        console.debug(
            "[Majoor] MFV preview stream hooked to ComfyUI API (KJ Preview Override + binary previews)",
        );
    } catch (e: any) {
        console.debug?.("[Majoor] MFV preview hook failed - preview streaming disabled", e);
    }
}

function _detachPreviewApiListeners() {
    if (_apiRef) {
        if (_kjPreviewOverrideHandler) {
            try {
                _apiRef.removeEventListener(KJ_PREVIEW_OVERRIDE_EVENT, _kjPreviewOverrideHandler);
            } catch (e: any) {
                console.debug?.(e);
            }
        }
        if (_executionStartHandler) {
            for (const eventType of ["execution_start", "executing"]) {
                try {
                    _apiRef.removeEventListener(eventType, _executionStartHandler);
                } catch (e: any) {
                    console.debug?.(e);
                }
            }
        }
        if (_executionEndHandler) {
            for (const eventType of [
                "execution_success",
                "execution_error",
                "execution_interrupted",
            ]) {
                try {
                    _apiRef.removeEventListener(eventType, _executionEndHandler);
                } catch (e: any) {
                    console.debug?.(e);
                }
            }
        }
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
    _kjPreviewOverrideHandler = null;
    _executionStartHandler = null;
    _executionEndHandler = null;
    _previewHandler = null;
    _previewWithMetaHandler = null;
    _previewWithMetaLastAt = 0;
    _kjPreviewRunActive = false;
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
