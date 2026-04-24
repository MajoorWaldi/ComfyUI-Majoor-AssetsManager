import { createAdapter as I } from "./BaseAdapter-Dv004G6c.js";
const i = /* @__PURE__ */ new Set([
  "SaveImage",
  "PreviewImage",
  "SaveAnimatedWEBP",
  "SaveAnimatedPNG",
  "SaveVideo",
  "SaveWEBM",
  "SaveGif",
  "SaveImageWebSocket"
]), n = /* @__PURE__ */ new Set([
  "SaveImageWithAlpha",
  "SaveImageKJ",
  "PreviewAnimation",
  "FastPreview",
  "ImageAndMaskPreview",
  "PreviewImageOrMask"
]), s = /* @__PURE__ */ new Set(["ImagePreviewFromLatent"]), y = /* @__PURE__ */ new Set(["LayerUtility: ImageTaggerSave"]), L = /* @__PURE__ */ new Set(["VHS_VideoCombine"]), m = /* @__PURE__ */ new Set([
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
  "LayerUtility: ImageToMask"
]), g = /* @__PURE__ */ new Set([
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
  "RoundMask"
]), C = /* @__PURE__ */ new Set([
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
  "TransitionMask+"
]), d = /* @__PURE__ */ new Set([
  ...i,
  ...n,
  ...s,
  ...y
]);
[
  ...m,
  ...g,
  ...C
];
const M = I({
  name: "known-nodes",
  priority: 5,
  description: "Well-known output nodes from core ComfyUI, KJNodes, Essentials, LayerStyle",
  canHandle(o, e) {
    var a;
    if (!d.has(o)) return !1;
    const t = e == null ? void 0 : e.images;
    return Array.isArray(t) && t.length > 0 && !!((a = t[0]) != null && a.filename);
  },
  extractMedia(o, e, t) {
    const a = e == null ? void 0 : e.images;
    if (!Array.isArray(a) || !a.length) return null;
    const l = [];
    for (const r of a)
      r != null && r.filename && l.push({
        filename: r.filename,
        subfolder: r.subfolder || "",
        type: r.type || "output",
        kind: "image",
        _nodeId: t,
        _classType: o,
        _source: "known-nodes"
      });
    return l.length ? l : null;
  }
});
function S() {
  return {
    comfyCore: [...i],
    kjNodes: [...n],
    essentials: [...s],
    layerStyle: [...y],
    vhs: [...L],
    processing: {
      layerStyle: [...m],
      kjNodes: [...g],
      essentials: [...C]
    }
  };
}
export {
  M as KnownNodesAdapter,
  S as getKnownNodeSets
};
