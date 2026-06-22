import { createImageProcessor, drawMediaError } from "./imageProcessor.js";
import { createVideoProcessor } from "./videoProcessor.js";
import { createAudioVisualizer } from "./audioVisualizer.js";
import { createModel3DMediaElement, isModel3DAsset } from "./model3dRenderer.js";
import {
    safeAddListener as defaultSafeAddListener,
    safeCall as defaultSafeCall,
} from "../../utils/safeCall.js";
import { APP_CONFIG } from "../../app/config.js";
import { builtAssetUrl } from "../../app/assetUrls.js";
import { readAssetFps } from "../../utils/mediaFps.js";


export function createViewerMediaFactory({
    overlay,
    state,
    mediaTransform,
    updateMediaNaturalSize,
    clampPanToBounds,
    applyTransform,
    scheduleOverlayRedraw,
    getGradeParams,
    isDefaultGrade,
    tonemap,
    maxProcPixels,
    maxProcPixelsVideo,
    disableWebGL,
    videoGradeThrottleFps,
    safeAddListener,
    safeCall,
}: Record<string, any> = {}): Record<string, any> {
    const _safeCall = safeCall || defaultSafeCall;
    const _safeAddListener = safeAddListener || defaultSafeAddListener;

    const _extOf = (asset: any) => {
        try {
            const ext = String(asset?.ext || "")
                .trim()
                .toLowerCase();
            if (ext) return ext.startsWith(".") ? ext : `.${ext}`;
        } catch (e: any) {
            console.debug?.(e);
        }
        try {
            const name = String(asset?.filename || asset?.filepath || "").trim();
            const idx = name.lastIndexOf(".");
            if (idx >= 0) return name.slice(idx).toLowerCase();
        } catch (e: any) {
            console.debug?.(e);
        }
        return "";
    };

    // Formats that may be animated (GIF, animated WebP). Rendering through the
    // image processor (canvas) would only show a single frame.
    const _shouldUseNativeImageEl = (asset: any) => {
        const ext = _extOf(asset);
        return ext === ".gif" || ext === ".webp";
    };

    const _createNativeImageEl = (asset: any, url: any) => {
        const img = document.createElement("img");
        img.className = "mjr-viewer-media";
        try {
            if (asset?.id != null && img?.dataset) img.dataset.mjrAssetId = String(asset.id);
        } catch (e: any) {
            console.debug?.(e);
        }
        img.alt = String(asset?.filename || "") || "image";
        try {
            img.decoding = "async";
        } catch (e: any) {
            console.debug?.(e);
        }
        try {
            img.loading = "eager";
        } catch (e: any) {
            console.debug?.(e);
        }
        try {
            img.draggable = false;
        } catch (e: any) {
            console.debug?.(e);
        }
        img.src = url;
        img.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            display: block;
            transform: ${mediaTransform?.() || ""};
            transform-origin: center center;
        `;

        const onLoad = () => {
            try {
                requestAnimationFrame(() => {
                    try {
                        if (!state?._userInteracted) {
                            updateMediaNaturalSize?.();
                            clampPanToBounds?.();
                            applyTransform?.();
                        }
                    } catch (e: any) {
                        console.debug?.(e);
                    }
                });
            } catch (e: any) {
                console.debug?.(e);
            }
            try {
                scheduleOverlayRedraw?.();
            } catch (e: any) {
                console.debug?.(e);
            }
        };

        const onError = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.className = "mjr-viewer-media";
                try {
                    if (asset?.id != null && canvas?.dataset)
                        canvas.dataset.mjrAssetId = String(asset.id);
                } catch (e: any) {
                    console.debug?.(e);
                }
                _seedNaturalSizeFromAsset(canvas, asset);
                canvas.style.cssText = `
                    max-width: 100%;
                    max-height: 100%;
                    display: block;
                    transform: ${mediaTransform?.() || ""};
                    transform-origin: center center;
                `;
                drawMediaError(canvas, "Failed to load image");
                img.replaceWith(canvas);
            } catch (e: any) {
                console.debug?.(e);
            }
        };

        try {
            img.addEventListener("load", onLoad, { once: true });
        } catch (e: any) {
            console.debug?.(e);
        }
        try {
            img.addEventListener("error", onError, { once: true });
        } catch (e: any) {
            console.debug?.(e);
        }

        return img;
    };

    const _seedNaturalSizeFromAsset = (canvas: any, asset: any) => {
        try {
            if (!canvas || !(canvas instanceof HTMLCanvasElement)) return;
            const w = Number(asset?.width) || 0;
            const h = Number(asset?.height) || 0;
            if (!(w > 0 && h > 0)) return;
            // Hint used before processors are ready; processors will overwrite with true natural size.
            if (!Number((canvas as any)._mjrNaturalW) && !Number((canvas as any)._mjrNaturalH)) {
                (canvas as any)._mjrNaturalW = w;
                (canvas as any)._mjrNaturalH = h;
            }
        } catch (e: any) {
            console.debug?.(e);
        }
    };

    const _fpsFromAssetMeta = (asset: any) => {
        try {
            return readAssetFps(asset);
        } catch {
            return null;
        }
    };

    const _emitDetectedFps = (video: any, asset: any, fps: any, source = "metadata") => {
        try {
            const n = Number(fps);
            if (!Number.isFinite(n) || n <= 0) return;
            const rounded = Math.round(n * 1000) / 1000;
            const lastSource = String(video?._mjrDetectedFpsSource || "");
            if (source === "rvfc" && lastSource && lastSource !== "rvfc") return;
            const last = Number(video?._mjrDetectedFps || 0) || 0;
            if (last > 0 && Math.abs(last - rounded) < 0.01) return;
            video._mjrDetectedFps = rounded;
            video._mjrDetectedFpsSource = String(source || "metadata");
            window.dispatchEvent(
                new CustomEvent("mjr:viewer-fps-detected", {
                    detail: {
                        fps: rounded,
                        source: String(source || "metadata"),
                        assetId: asset?.id != null ? String(asset.id) : "",
                    },
                }),
            );
        } catch (e: any) {
            console.debug?.(e);
        }
    };

    const _attachFpsDetection = (video: any, asset: any) => {
        let hasMetadataFps = false;
        try {
            const fromMeta = _fpsFromAssetMeta(asset);
            if (fromMeta) {
                hasMetadataFps = true;
                _emitDetectedFps(video, asset, fromMeta, "asset-metadata");
            }
        } catch (e: any) {
            console.debug?.(e);
        }

        try {
            video.addEventListener(
                "loadedmetadata",
                () => {
                    try {
                        const fromMeta = _fpsFromAssetMeta(asset);
                        if (fromMeta) {
                            hasMetadataFps = true;
                            _emitDetectedFps(video, asset, fromMeta, "loadedmetadata");
                        }
                    } catch (e: any) {
                        console.debug?.(e);
                    }
                },
                { once: true },
            );
        } catch (e: any) {
            console.debug?.(e);
        }

        // Runtime estimate via media timestamps (best effort, modern browsers only).
        try {
            if (hasMetadataFps) return;
            if (typeof video?.requestVideoFrameCallback !== "function") return;
            let prevMediaTime: any = null;
            let samples = 0;
            let acc = 0;
            const maxSamples = 10;
            let emitted = false;
            const onFrame = (_now: any, meta: any) => {
                try {
                    if (hasMetadataFps || emitted) return;
                    const mt = Number(meta?.mediaTime);
                    if (Number.isFinite(mt) && mt >= 0) {
                        if (prevMediaTime != null) {
                            const dt = mt - prevMediaTime;
                            if (dt > 0 && dt < 1) {
                                acc += dt;
                                samples += 1;
                            }
                        }
                        prevMediaTime = mt;
                    }
                    if (samples >= maxSamples) {
                        const avg = acc / Math.max(1, samples);
                        const fps = avg > 0 ? 1 / avg : 0;
                        if (Number.isFinite(fps) && fps > 1) {
                            emitted = true;
                            _emitDetectedFps(video, asset, fps, "rvfc");
                        }
                    }
                    if (samples < maxSamples && !emitted) {
                        video.requestVideoFrameCallback(onFrame);
                    }
                } catch (e: any) {
                    console.debug?.(e);
                }
            };
            video.requestVideoFrameCallback(onFrame);
        } catch (e: any) {
            console.debug?.(e);
        }
    };

    const _createAudioElement = (asset: any, url: any, { compare = false } = {}) => {
        const wrap = document.createElement("div");
        wrap.className = "mjr-viewer-audio-shell";

        if (!compare) {
            const header = document.createElement("div");
            header.className = "mjr-viewer-audio-header";
            const icon = document.createElement("span");
            icon.className = "mjr-viewer-audio-icon";
            icon.innerHTML = '<i class="pi pi-volume-up" aria-hidden="true"></i>';
            const text = document.createElement("div");
            text.className = "mjr-viewer-audio-title-wrap";
            const title = document.createElement("div");
            title.className = "mjr-viewer-audio-title";
            title.textContent = String(asset?.display_name || asset?.displayName || asset?.filename || "Audio");
            const meta = document.createElement("div");
            meta.className = "mjr-viewer-audio-meta";
            const ext = String(asset?.filename || "").split(".").pop() || "audio";
            meta.textContent = String(ext || "audio").toUpperCase();
            text.appendChild(title);
            text.appendChild(meta);
            header.appendChild(icon);
            header.appendChild(text);
            wrap.appendChild(header);
        }

        const viz = document.createElement("canvas");
        viz.className = "mjr-viewer-audio-viz";

        const audio = document.createElement("audio");
        audio.className = "mjr-viewer-audio-src";
        audio.src = url;
        audio.controls = false;
        audio.autoplay = true;
        audio.preload = "metadata";

        try {
            const vizProc = createAudioVisualizer({
                canvas: viz,
                audioEl: audio,
                mode: state?.audioVisualizerMode,
                pauseDuringExecution: true,
            });
            // Keep lifecycle compatibility: audio cleanup + canvas processor cleanup.
            (audio as any)._mjrAudioViz = vizProc;
            (viz as any)._mjrProc = vizProc;
        } catch {
            (audio as any)._mjrAudioViz = null;
            (viz as any)._mjrProc = null;
        }

        wrap.appendChild(viz);
        wrap.appendChild(audio);
        return wrap;
    };

    function createMediaElement(asset: any, url: any) {
        const container = document.createElement("div");
        container.className = "mjr-video-host";
        container.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        `;

        const kind = String(asset?.kind || "").toLowerCase();
        if (isModel3DAsset(asset) || kind === "model3d") {
            return createModel3DMediaElement(asset, url, {
                hostClassName: "mjr-model3d-host mjr-viewer-model3d-host",
                canvasClassName: "mjr-viewer-media mjr-model3d-render-canvas",
                pauseDuringExecution: true,
                scheduleOverlayRedraw,
                onReady: () => {
                    try {
                        requestAnimationFrame(() => {
                            try {
                                if (!state?._userInteracted) {
                                    updateMediaNaturalSize?.();
                                    clampPanToBounds?.();
                                    applyTransform?.();
                                }
                            } catch (e: any) {
                                console.debug?.(e);
                            }
                        });
                    } catch (e: any) {
                        console.debug?.(e);
                    }
                    try {
                        scheduleOverlayRedraw?.();
                    } catch (e: any) {
                        console.debug?.(e);
                    }
                },
            });
        }
        if (kind && kind !== "image" && kind !== "video" && kind !== "audio") {
            const canvas = document.createElement("canvas");
            canvas.className = "mjr-viewer-media";
            try {
                if (asset?.id != null && canvas?.dataset)
                    canvas.dataset.mjrAssetId = String(asset.id);
            } catch (e: any) {
                console.debug?.(e);
            }
            _seedNaturalSizeFromAsset(canvas, asset);
            canvas.style.cssText = `
                max-width: 100%;
                max-height: 100%;
                display: block;
                transform: ${mediaTransform?.() || ""};
                transform-origin: center center;
            `;
            try {
                drawMediaError(canvas, `Unsupported file type: ${kind}`);
            } catch (e: any) {
                console.debug?.(e);
            }
            return canvas;
        }

        if (kind === "audio") return _createAudioElement(asset, url, { compare: false });

        if (kind === "video") {
            const canvas = document.createElement("canvas");
            canvas.className = "mjr-viewer-media";
            try {
                if (asset?.id != null && canvas?.dataset)
                    canvas.dataset.mjrAssetId = String(asset.id);
            } catch (e: any) {
                console.debug?.(e);
            }
            _seedNaturalSizeFromAsset(canvas, asset);
            canvas.style.cssText = `
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                display: block;
                transform: ${mediaTransform?.() || ""};
                transform-origin: center center;
            `;

            const video = document.createElement("video");
            video.className = "mjr-viewer-video-src";
            video.src = url;
            video.controls = false;
            // Default: loop videos in the viewer. If custom controls are mounted, they may disable native looping.
            video.loop = true;
            video.playsInline = true;
            video.muted = true;
            video.autoplay = true;
            // Use "auto" preload for smoother playback (buffers more video ahead)
            video.preload = "auto";
            // Hint for async decoding to improve playback fluidity
            try {
                if ("decode" in HTMLVideoElement.prototype) {
                    (video as any).decoding = "async";
                }
            } catch {
                // Ignore if not supported
            }
            video.style.cssText =
                "position:absolute; width:1px; height:1px; opacity:0; pointer-events:none;";
            _attachFpsDetection(video, asset);

            try {
                (canvas as any)._mjrProc = createVideoProcessor({
                    canvas,
                    videoEl: video,
                    disableWebGL: disableWebGL || !!APP_CONFIG.VIEWER_DISABLE_WEBGL_VIDEO,
                    pauseDuringExecution: true,
                    getGradeParams,
                    isDefaultGrade,
                    tonemap,
                    maxProcPixelsVideo: maxProcPixelsVideo,
                    throttleFps: videoGradeThrottleFps,
                    safeAddListener: _safeAddListener,
                    safeCall: _safeCall,
                    onReady: () => {
                        try {
                            requestAnimationFrame(() => {
                                try {
                                    // Refit only if the user hasn't already interacted (zoom/pan).
                                    if (!state?._userInteracted) {
                                        updateMediaNaturalSize?.();
                                        clampPanToBounds?.();
                                        applyTransform?.();
                                    }
                                } catch (e: any) {
                                    console.debug?.(e);
                                }
                            });
                        } catch (e: any) {
                            console.debug?.(e);
                        }
                        try {
                            scheduleOverlayRedraw?.();
                        } catch (e: any) {
                            console.debug?.(e);
                        }
                    },
                });
                (canvas as any)._mjrProc?.setParams?.(getGradeParams?.());
            } catch (e: any) {
                console.debug?.(e);
            }

            try {
                video.addEventListener(
                    "canplay",
                    () => {
                        try {
                            const p = video.play?.();
                            if (p && typeof p.catch === "function") {
                                p.catch(() => {
                                    try {
                                        drawMediaError(
                                            canvas,
                                            "Autoplay blocked (press Space / Play)",
                                        );
                                    } catch (e: any) {
                                        console.debug?.(e);
                                    }
                                });
                            }
                        } catch {
                            try {
                                drawMediaError(canvas, "Autoplay blocked (press Space / Play)");
                            } catch (e: any) {
                                console.debug?.(e);
                            }
                        }
                    },
                    { once: true },
                );
            } catch (e: any) {
                console.debug?.(e);
            }

            container.appendChild(canvas);
            container.appendChild(video);
            return container;
        }

        if (_shouldUseNativeImageEl(asset)) {
            return _createNativeImageEl(asset, url);
        }

        const canvas = document.createElement("canvas");
        canvas.className = "mjr-viewer-media";
        try {
            if (asset?.id != null && canvas?.dataset) canvas.dataset.mjrAssetId = String(asset.id);
        } catch (e: any) {
            console.debug?.(e);
        }
        _seedNaturalSizeFromAsset(canvas, asset);
        canvas.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            display: block;
            transform: ${mediaTransform?.() || ""};
            transform-origin: center center;
        `;
        try {
            (canvas as any)._mjrProc = createImageProcessor({
                canvas,
                url,
                getGradeParams,
                isDefaultGrade,
                tonemap,
                maxProcPixels: maxProcPixels,
                onReady: () => {
                    try {
                        // Refit only if the user hasn't already interacted (zoom/pan).
                        requestAnimationFrame(() => {
                            try {
                                if (!state?._userInteracted) {
                                    updateMediaNaturalSize?.();
                                    clampPanToBounds?.();
                                    applyTransform?.();
                                }
                            } catch (e: any) {
                                console.debug?.(e);
                            }
                        });
                    } catch (e: any) {
                        console.debug?.(e);
                    }
                    try {
                        scheduleOverlayRedraw?.();
                    } catch (e: any) {
                        console.debug?.(e);
                    }
                },
            });
            (canvas as any)._mjrProc?.setParams?.(getGradeParams?.());
        } catch (e: any) {
            console.debug?.(e);
        }
        return canvas;
    }

    // Create media element for compare modes (A/B and side-by-side).
    // Important: the returned element fills the container so both layers share identical sizing/centering.
    function createCompareMediaElement(asset: any, url: any) {
        const kind = String(asset?.kind || "").toLowerCase();
        if (isModel3DAsset(asset) || kind === "model3d") {
            return createModel3DMediaElement(asset, url, {
                hostClassName: "mjr-model3d-host mjr-viewer-model3d-host",
                canvasClassName: "mjr-viewer-media mjr-model3d-render-canvas",
                pauseDuringExecution: true,
                scheduleOverlayRedraw,
                onReady: () => {
                    try {
                        requestAnimationFrame(() => {
                            try {
                                if (!state?._userInteracted) {
                                    updateMediaNaturalSize?.();
                                    clampPanToBounds?.();
                                    applyTransform?.();
                                }
                            } catch (e: any) {
                                console.debug?.(e);
                            }
                        });
                    } catch (e: any) {
                        console.debug?.(e);
                    }
                    try {
                        scheduleOverlayRedraw?.();
                    } catch (e: any) {
                        console.debug?.(e);
                    }
                },
            });
        }
        if (kind && kind !== "image" && kind !== "video" && kind !== "audio") {
            const canvas = document.createElement("canvas");
            canvas.className = "mjr-viewer-media";
            try {
                if (asset?.id != null && canvas?.dataset)
                    canvas.dataset.mjrAssetId = String(asset.id);
            } catch (e: any) {
                console.debug?.(e);
            }
            _seedNaturalSizeFromAsset(canvas, asset);
            canvas.style.cssText = `
                max-width: 100%;
                max-height: 100%;
                display: block;
                transform: ${mediaTransform?.() || ""};
                transform-origin: center center;
            `;
            try {
                drawMediaError(canvas, `Unsupported file type: ${kind}`);
            } catch (e: any) {
                console.debug?.(e);
            }
            return canvas;
        }

        if (kind === "audio") return _createAudioElement(asset, url, { compare: true });

        if (kind === "video") {
            const wrap = document.createElement("div");
            wrap.style.cssText =
                "width:100%; height:100%; position:relative; display:flex; align-items:center; justify-content:center;";

            const canvas = document.createElement("canvas");
            canvas.className = "mjr-viewer-media";
            try {
                if (asset?.id != null && canvas?.dataset)
                    canvas.dataset.mjrAssetId = String(asset.id);
            } catch (e: any) {
                console.debug?.(e);
            }
            _seedNaturalSizeFromAsset(canvas, asset);
            canvas.style.cssText = `
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                display: block;
                transform: ${mediaTransform?.() || ""};
                transform-origin: center center;
            `;

            const video = document.createElement("video");
            video.className = "mjr-viewer-video-src";
            video.src = url;
            video.controls = false;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.autoplay = true;
            // Use "auto" preload for smoother playback (buffers more video ahead)
            video.preload = "auto";
            // Hint for async decoding to improve playback fluidity
            try {
                if ("decode" in HTMLVideoElement.prototype) {
                    (video as any).decoding = "async";
                }
            } catch {
                // Ignore if not supported
            }
            video.style.cssText =
                "position:absolute; width:1px; height:1px; opacity:0; pointer-events:none;";
            _attachFpsDetection(video, asset);

            try {
                (canvas as any)._mjrProc = createVideoProcessor({
                    canvas,
                    videoEl: video,
                    pauseDuringExecution: true,
                    getGradeParams,
                    isDefaultGrade,
                    tonemap,
                    maxProcPixelsVideo: maxProcPixelsVideo,
                    throttleFps: videoGradeThrottleFps,
                    safeAddListener: _safeAddListener,
                    safeCall: _safeCall,
                    onReady: () => {
                        try {
                            // Refit after the processor updates natural size (important in compare modes).
                            requestAnimationFrame(() => {
                                try {
                                    if (!state?._userInteracted) {
                                        updateMediaNaturalSize?.();
                                        clampPanToBounds?.();
                                        applyTransform?.();
                                    }
                                } catch (e: any) {
                                    console.debug?.(e);
                                }
                            });
                        } catch (e: any) {
                            console.debug?.(e);
                        }
                        try {
                            scheduleOverlayRedraw?.();
                        } catch (e: any) {
                            console.debug?.(e);
                        }
                    },
                });
                (canvas as any)._mjrProc?.setParams?.(getGradeParams?.());
            } catch (e: any) {
                console.debug?.(e);
            }

            wrap.appendChild(canvas);
            wrap.appendChild(video);
            return wrap;
        }

        if (_shouldUseNativeImageEl(asset)) {
            return _createNativeImageEl(asset, url);
        }

        const canvas = document.createElement("canvas");
        canvas.className = "mjr-viewer-media";
        try {
            if (asset?.id != null && canvas?.dataset) canvas.dataset.mjrAssetId = String(asset.id);
        } catch (e: any) {
            console.debug?.(e);
        }
        _seedNaturalSizeFromAsset(canvas, asset);
        canvas.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            display: block;
            transform: ${mediaTransform?.() || ""};
            transform-origin: center center;
        `;
        try {
            (canvas as any)._mjrProc = createImageProcessor({
                canvas,
                url,
                getGradeParams,
                isDefaultGrade,
                tonemap,
                maxProcPixels: maxProcPixels,
                onReady: () => {
                    try {
                        // Refit after the processor updates natural size (important in compare modes).
                        requestAnimationFrame(() => {
                            try {
                                if (!state?._userInteracted) {
                                    updateMediaNaturalSize?.();
                                    clampPanToBounds?.();
                                    applyTransform?.();
                                }
                            } catch (e: any) {
                                console.debug?.(e);
                            }
                        });
                    } catch (e: any) {
                        console.debug?.(e);
                    }
                    try {
                        scheduleOverlayRedraw?.();
                    } catch (e: any) {
                        console.debug?.(e);
                    }
                },
            });
            (canvas as any)._mjrProc?.setParams?.(getGradeParams?.());
        } catch (e: any) {
            console.debug?.(e);
        }
        return canvas;
    }

    // Update visible media transforms when pan/zoom changes.
    const applyTransformToVisibleMedia = () => {
        try {
            const t = mediaTransform?.() || "";
            const els = overlay?.querySelectorAll?.(".mjr-viewer-media") || [];
            for (const el of els) {
                try {
                    if (el?._mjrDisableViewerTransform) continue;
                    el.style.transform = t;
                } catch (e: any) {
                    console.debug?.(e);
                }
            }
        } catch (e: any) {
            console.debug?.(e);
        }
    };

    return {
        createMediaElement,
        createCompareMediaElement,
        applyTransformToVisibleMedia,
    };
}
