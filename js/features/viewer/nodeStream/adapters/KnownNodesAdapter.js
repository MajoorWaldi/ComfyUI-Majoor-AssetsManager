/**
 * KnownNodesAdapter — higher-priority adapter for well-known ComfyUI nodes.
 *
 * Covers output nodes from popular extensions that produce file-based preview data
 * via `onNodeOutputsUpdated`.  Processing-only nodes (ColorCorrect, Blur, etc.)
 * are handled by the canvas-based Path 2 in the controller — they don't need
 * an adapter because they don't produce file outputs.
 *
 * ## Supported repos
 *
 * - **Comfy-Org (core)**: SaveImage, PreviewImage, SaveAnimatedWEBP/PNG, SaveVideo,
 *   SaveWEBM, SaveGif (all use `images` key, videos add `animated: (True,)`)
 * - **ComfyUI-VideoHelperSuite (VHS)**: VHS_VideoCombine → `gifs` key
 * - **ComfyUI-KJNodes**: SaveImageWithAlpha, SaveImageKJ, PreviewAnimation,
 *   FastPreview, ImageAndMaskPreview, PreviewImageOrMask + 40+ processing nodes
 * - **ComfyUI_essentials**: ImagePreviewFromLatent (inherits SaveImage)
 * - **ComfyUI_LayerStyle**: ImageTaggerSave (OUTPUT_NODE) + 80+ processing nodes
 *   (all processing nodes streamed via canvas Path 2)
 *
 * ## Why this adapter exists
 *
 * The DefaultImageAdapter (priority 0) already handles the standard `{images: [...]}`
 * format.  This adapter exists at priority 5 to:
 *   1. Provide explicit documentation of which nodes are supported
 *   2. Handle any future format variations from these specific extensions
 *   3. Give a named match for debugging (`[NodeStream] matched: known-nodes`)
 */

import { createAdapter } from "./BaseAdapter.js";

// ── Known OUTPUT_NODE class_types by repo ─────────────────────────────────────

/**
 * Core ComfyUI (Comfy-Org) — all use `{"ui": {"images": [...]}}`
 * Videos (SaveVideo, SaveWEBM) also use `images` key + `animated: (True,)` flag
 */
const COMFY_CORE_OUTPUT = new Set([
    "SaveImage",
    "PreviewImage",
    "SaveAnimatedWEBP",
    "SaveAnimatedPNG",
    "SaveVideo",
    "SaveWEBM",
    "SaveGif",
    "SaveImageWebSocket",
]);

/**
 * ComfyUI-KJNodes — image output nodes using `{"ui": {"images": [...]}}`
 */
const KJNODES_OUTPUT = new Set([
    "SaveImageWithAlpha",
    "SaveImageKJ",
    "PreviewAnimation",
    "FastPreview",
    "ImageAndMaskPreview",
    "PreviewImageOrMask",
]);

/**
 * ComfyUI_essentials — inherits SaveImage pattern
 */
const ESSENTIALS_OUTPUT = new Set(["ImagePreviewFromLatent"]);

/**
 * ComfyUI_LayerStyle — only output node: ImageTaggerSave
 * Uses standard `{"ui": {"images": [...]}}` format
 */
const LAYERSTYLE_OUTPUT = new Set(["LayerUtility: ImageTaggerSave"]);

/**
 * ComfyUI-VideoHelperSuite — uses `{"ui": {"gifs": [...]}}`
 * (Handled by VideoAdapter at priority 10, documented here for reference)
 */
const VHS_OUTPUT = new Set(["VHS_VideoCombine"]);

// ── Processing nodes (canvas Path 2) — documented for isKnownProcessingNode ──

/**
 * ComfyUI_LayerStyle — processing nodes returning IMAGE/MASK tensors.
 * Streamed via `executing` event + `node.imgs` (Path 2).
 */
const LAYERSTYLE_PROCESSING = new Set([
    // Color correction
    "LayerColor: ColorCorrectBrightnessAndContrast",
    "LayerColor: ColorCorrectHSV",
    "LayerColor: ColorCorrectLAB",
    "LayerColor: ColorCorrectRGB",
    "LayerColor: ColorCorrectYUV",
    "LayerColor: ColorCorrectAutoAdjust",
    "LayerColor: ColorCorrectAutoAdjustV2",
    "LayerColor: ColorCorrectAutoBrightness",
    "LayerColor: ColorCorrectColorBalance",
    "LayerColor: ColorCorrectColorTemperature",
    "LayerColor: ColorCorrectExposure",
    "LayerColor: ColorCorrectGamma",
    "LayerColor: ColorCorrectLevels",
    "LayerColor: ColorCorrectShadowAndHighlight",
    "LayerColor: ColorCorrectLUTapply",
    // Color mapping / gradients
    "LayerColor: GradientMap",
    "LayerColor: GradientOverlay",
    "LayerColor: GradientOverlayV2",
    "LayerColor: ColorOverlay",
    "LayerColor: ColorOverlayV2",
    "LayerColor: ColorNegative",
    "LayerColor: ColorAdapter",
    // Filters & effects
    "LayerFilter: GaussianBlur",
    "LayerFilter: GaussianBlurV2",
    "LayerFilter: AddGrain",
    "LayerFilter: ChannelShake",
    "LayerFilter: FilmPost",
    "LayerFilter: FilmPostV2",
    "LayerFilter: Halftone",
    "LayerFilter: HDREffects",
    "LayerFilter: MotionBlur",
    "LayerFilter: DistortDisplace",
    "LayerFilter: LightLeak",
    // Layer style effects
    "LayerStyle: DropShadow",
    "LayerStyle: DropShadowV2",
    "LayerStyle: DropShadowV3",
    "LayerStyle: InnerShadow",
    "LayerStyle: InnerShadowV2",
    "LayerStyle: InnerGlow",
    "LayerStyle: InnerGlowV2",
    "LayerStyle: OuterGlow",
    // Blending & composition
    "LayerUtility: ImageBlend",
    "LayerUtility: ImageBlendV2",
    "LayerUtility: ImageBlendV3",
    "LayerUtility: ImageBlendAdvance",
    "LayerUtility: ImageBlendAdvanceV2",
    "LayerUtility: ImageBlendAdvanceV3",
    "LayerUtility: ImageCompositeHandleMask",
    "LayerUtility: ImageCombineAlpha",
    "LayerUtility: ImageRemoveAlpha",
    "LayerUtility: ImageOpacity",
    "LayerUtility: ImageShift",
    // Canvas & crop
    "LayerUtility: ExtendCanvas",
    "LayerUtility: ExtendCanvasV2",
    "LayerUtility: CropByMask",
    "LayerUtility: CropByMaskV2",
    "LayerUtility: CropByMaskV3",
    // Transform
    "LayerUtility: ImageScaleRestore",
    "LayerUtility: ImageScaleRestoreV2",
    "LayerUtility: ImageScaleByAspectRatio",
    "LayerUtility: ImageScaleByAspectRatioV2",
    "LayerUtility: LayerImageTransform",
    // Mask nodes
    "LayerMask: MaskByColor",
    "LayerMask: MaskGradient",
    "LayerMask: MaskInvert",
    "LayerMask: MaskStroke",
    "LayerMask: MaskGrain",
    "LayerMask: MaskGrow",
    "LayerMask: MaskMotionBlur",
    "LayerMask: MaskEdgeShrink",
    "LayerMask: MaskEdgeUltraDetail",
    "LayerMask: MaskEdgeUltraDetailV2",
    "LayerMask: MaskEdgeUltraDetailV3",
    "LayerMask: CreateGradientMask",
    // Channel
    "LayerUtility: ImageChannelSplit",
    "LayerUtility: ImageChannelMerge",
    "LayerUtility: ImageToMask",
]);

/**
 * ComfyUI-KJNodes — processing nodes returning IMAGE/MASK tensors.
 * Streamed via `executing` event + `node.imgs` (Path 2).
 */
const KJNODES_PROCESSING = new Set([
    "ColorMatch",
    "ColorMatchV2",
    "ImageConcanate",
    "ImageConcatFromBatch",
    "ImageConcatMulti",
    "ImageGridComposite2x2",
    "ImageGridComposite3x3",
    "ImageBatchTestPattern",
    "ImageGrabPIL",
    "Screencap_mss",
    "AddLabel",
    "ImagePass",
    "ImageResizeKJ",
    "ImageResizeKJv2",
    "ImageUpscaleWithModelBatched",
    "CrossFadeImages",
    "CrossFadeImagesMulti",
    "TransitionImagesMulti",
    "TransitionImagesInBatch",
    "ImageBatchJoinWithTransition",
    "ImageBatchRepeatInterleaving",
    "ImageBatchExtendWithOverlap",
    "ImageBatchFilter",
    "ImageBatchMulti",
    "ImageAddMulti",
    "ImageNormalize_Neg1_To_1",
    "RemapImageRange",
    "ReverseImageBatch",
    "ShuffleImageBatch",
    "ReplaceImagesInBatch",
    "GetImagesFromBatchIndexed",
    "GetImageRangeFromBatch",
    "InsertImagesToBatchIndexed",
    "ImageCropByMask",
    "ImageCropByMaskAndResize",
    "ImageCropByMaskBatch",
    "ImageUncropByMask",
    "ImagePadForOutpaintMasked",
    "ImagePadForOutpaintTargetSize",
    "ImagePadKJ",
    "ImagePrepForICLora",
    "PadImageBatchInterleaved",
    "LoadAndResizeImage",
    "SplitImageChannels",
    "MergeImageChannels",
    "DrawMaskOnImage",
    "ImageNoiseAugmentation",
    // Mask nodes
    "ColorToMask",
    "BlockifyMask",
    "CreateGradientMask",
    "CreateTextMask",
    "CreateAudioMask",
    "CreateFadeMask",
    "CreateFadeMaskAdvanced",
    "CreateFluidMask",
    "CreateShapeMask",
    "CreateVoronoiMask",
    "CreateMagicMask",
    "GrowMaskWithBlur",
    "OffsetMask",
    "RemapMaskRange",
    "ResizeMask",
    "RoundMask",
]);

/**
 * ComfyUI_essentials — processing nodes.
 */
const ESSENTIALS_PROCESSING = new Set([
    "ImageResize+",
    "ImageCrop+",
    "ImageFlip+",
    "ImageDesaturate+",
    "ImagePosterize+",
    "ImageEnhanceDifference+",
    "ImageExpandBatch+",
    "ImageFromBatch+",
    "ImageRemoveBackground+",
    "MaskBlur+",
    "MaskPreview+",
    "TransitionMask+",
]);

/** Merge all image-output node sets (excluding VHS which uses gifs key) */
const ALL_IMAGE_OUTPUT = new Set([
    ...COMFY_CORE_OUTPUT,
    ...KJNODES_OUTPUT,
    ...ESSENTIALS_OUTPUT,
    ...LAYERSTYLE_OUTPUT,
]);

/** Merge all processing node sets for isKnownProcessingNode */
const ALL_PROCESSING = new Set([
    ...LAYERSTYLE_PROCESSING,
    ...KJNODES_PROCESSING,
    ...ESSENTIALS_PROCESSING,
]);

// ── Adapter ───────────────────────────────────────────────────────────────────

export const KnownNodesAdapter = createAdapter({
    name: "known-nodes",
    priority: 5,
    description: "Well-known output nodes from core ComfyUI, KJNodes, Essentials, LayerStyle",

    canHandle(classType, outputs) {
        if (!ALL_IMAGE_OUTPUT.has(classType)) return false;
        const images = outputs?.images;
        return Array.isArray(images) && images.length > 0 && !!images[0]?.filename;
    },

    extractMedia(classType, outputs, nodeId) {
        const images = outputs?.images;
        if (!Array.isArray(images) || !images.length) return null;
        const results = [];
        for (const item of images) {
            if (!item?.filename) continue;
            results.push({
                filename: item.filename,
                subfolder: item.subfolder || "",
                type: item.type || "output",
                kind: "image",
                _nodeId: nodeId,
                _classType: classType,
                _source: "known-nodes",
            });
        }
        return results.length ? results : null;
    },
});

// ── Export utilities ───────────────────────────────────────────────────────────

/**
 * Check if a class_type is a known processing node (canvas Path 2).
 * Useful for UI hints ("this node is supported via canvas preview").
 */
export function isKnownProcessingNode(classType) {
    return ALL_PROCESSING.has(classType);
}

/**
 * Check if a class_type is a known output node from any supported repo.
 */
export function isKnownOutputNode(classType) {
    return ALL_IMAGE_OUTPUT.has(classType) || VHS_OUTPUT.has(classType);
}

/**
 * Get all known node sets for debugging / UI listing.
 */
export function getKnownNodeSets() {
    return {
        comfyCore: [...COMFY_CORE_OUTPUT],
        kjNodes: [...KJNODES_OUTPUT],
        essentials: [...ESSENTIALS_OUTPUT],
        layerStyle: [...LAYERSTYLE_OUTPUT],
        vhs: [...VHS_OUTPUT],
        processing: {
            layerStyle: [...LAYERSTYLE_PROCESSING],
            kjNodes: [...KJNODES_PROCESSING],
            essentials: [...ESSENTIALS_PROCESSING],
        },
    };
}
