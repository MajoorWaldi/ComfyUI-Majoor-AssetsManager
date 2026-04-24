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
import { floatingViewerManager } from "./floatingViewerManager.js";
import { waitForComfyApi } from "../../app/comfyApiBridge.js";

let _initialized = false;
let _genOutputHandler = null;
let _previewHandler = null;
let _previewWithMetaHandler = null;
let _previewWithMetaFired = false;
let _apiRef = null;
let _currentJobId = null;
let _previewHookGeneration = 0;

async function _hookPreviewApi(app) {
    const hookGeneration = ++_previewHookGeneration;
    try {
        _detachPreviewApiListeners();

        const api = await waitForComfyApi({ app, timeoutMs: 8000 });
        if (hookGeneration !== _previewHookGeneration) return;
        if (!api) {
            console.debug("[Majoor] MFV: ComfyUI API not found - preview streaming disabled");
            return;
        }
        _apiRef = api;

        _previewWithMetaHandler = (e) => {
            _previewWithMetaFired = true;
            try {
                const { blob, nodeId, jobId } = e.detail || {};
                if (!blob || !(blob instanceof Blob)) return;
                if (_currentJobId && jobId && jobId !== _currentJobId) return;
                floatingViewerManager.feedPreviewBlob(blob, {
                    sourceLabel: nodeId ? `Node ${nodeId}` : null,
                });
            } catch (err) {
                console.debug?.("[MFV] b_preview_with_metadata error", err);
            }
        };
        api.addEventListener("b_preview_with_metadata", _previewWithMetaHandler);

        _previewHandler = (e) => {
            try {
                if (_previewWithMetaFired) return;
                const blob = e.detail;
                if (!blob || !(blob instanceof Blob)) return;
                floatingViewerManager.feedPreviewBlob(blob);
            } catch (err) {
                console.debug?.("[MFV] preview blob error", err);
            }
        };
        api.addEventListener("b_preview", _previewHandler);

        console.debug(
            "[Majoor] MFV preview stream hooked to ComfyUI API (b_preview_with_metadata + b_preview fallback)",
        );
    } catch (e) {
        console.debug?.("[Majoor] MFV preview hook failed - preview streaming disabled", e);
    }
}

function _detachPreviewApiListeners() {
    if (_apiRef) {
        if (_previewHandler) {
            try {
                _apiRef.removeEventListener("b_preview", _previewHandler);
            } catch (e) {
                console.debug?.(e);
            }
        }
        if (_previewWithMetaHandler) {
            try {
                _apiRef.removeEventListener("b_preview_with_metadata", _previewWithMetaHandler);
            } catch (e) {
                console.debug?.(e);
            }
        }
    }
    _previewHandler = null;
    _previewWithMetaHandler = null;
    _previewWithMetaFired = false;
    _apiRef = null;
}

export function setCurrentJobId(jobId) {
    _currentJobId = jobId || null;
}

function _pickLatest(files) {
    if (!Array.isArray(files) || !files.length) return null;
    const images = files.filter((f) => {
        const name = String(f?.filename || "").toLowerCase();
        return (
            name.endsWith(".png") ||
            name.endsWith(".jpg") ||
            name.endsWith(".jpeg") ||
            name.endsWith(".webp") ||
            name.endsWith(".avif")
        );
    });
    return images[images.length - 1] ?? files[files.length - 1];
}

export function initLiveStreamTracker(app) {
    if (_genOutputHandler) return;
    _initialized = true;

    _genOutputHandler = (e) => {
        try {
            if (!floatingViewerManager.getLiveActive()) return;
            const latest = _pickLatest(e.detail?.files);
            if (!latest) return;
            floatingViewerManager.upsertWithContent(latest);
        } catch (err) {
            console.debug?.("[MFV] generation output error", err);
        }
    };
    if (typeof window !== "undefined") {
        window.addEventListener(EVENTS.NEW_GENERATION_OUTPUT, _genOutputHandler);
    }

    _hookPreviewApi(app);

    console.debug("[Majoor] LiveStreamTracker initialized");
}

export function teardownLiveStreamTracker(app) {
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

export function isLiveStreamTrackerInitialized() {
    return _initialized;
}
