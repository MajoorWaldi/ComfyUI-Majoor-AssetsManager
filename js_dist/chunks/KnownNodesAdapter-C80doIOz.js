//#region js/features/viewer/nodeStream/adapters/BaseAdapter.ts
function e(e) {
	return {
		priority: 0,
		description: "",
		canHandle: () => !1,
		extractMedia: () => null,
		...e
	};
}
//#endregion
//#region js/features/viewer/nodeStream/adapters/KnownNodesAdapter.ts
var t = new Set([
	"SaveImage",
	"PreviewImage",
	"SaveAnimatedWEBP",
	"SaveAnimatedPNG",
	"SaveVideo",
	"SaveWEBM",
	"SaveGif",
	"SaveImageWebSocket"
]), n = new Set([
	"SaveImageWithAlpha",
	"SaveImageKJ",
	"PreviewAnimation",
	"FastPreview",
	"ImageAndMaskPreview",
	"PreviewImageOrMask"
]), r = new Set(["ImagePreviewFromLatent"]), i = new Set(["LayerUtility: ImageTaggerSave"]), a = new Set(["VHS_VideoCombine"]), o = new Set(/* @__PURE__ */ "LayerColor: ColorCorrectBrightnessAndContrast.LayerColor: ColorCorrectHSV.LayerColor: ColorCorrectLAB.LayerColor: ColorCorrectRGB.LayerColor: ColorCorrectYUV.LayerColor: ColorCorrectAutoAdjust.LayerColor: ColorCorrectAutoAdjustV2.LayerColor: ColorCorrectAutoBrightness.LayerColor: ColorCorrectColorBalance.LayerColor: ColorCorrectColorTemperature.LayerColor: ColorCorrectExposure.LayerColor: ColorCorrectGamma.LayerColor: ColorCorrectLevels.LayerColor: ColorCorrectShadowAndHighlight.LayerColor: ColorCorrectLUTapply.LayerColor: GradientMap.LayerColor: GradientOverlay.LayerColor: GradientOverlayV2.LayerColor: ColorOverlay.LayerColor: ColorOverlayV2.LayerColor: ColorNegative.LayerColor: ColorAdapter.LayerFilter: GaussianBlur.LayerFilter: GaussianBlurV2.LayerFilter: AddGrain.LayerFilter: ChannelShake.LayerFilter: FilmPost.LayerFilter: FilmPostV2.LayerFilter: Halftone.LayerFilter: HDREffects.LayerFilter: MotionBlur.LayerFilter: DistortDisplace.LayerFilter: LightLeak.LayerStyle: DropShadow.LayerStyle: DropShadowV2.LayerStyle: DropShadowV3.LayerStyle: InnerShadow.LayerStyle: InnerShadowV2.LayerStyle: InnerGlow.LayerStyle: InnerGlowV2.LayerStyle: OuterGlow.LayerUtility: ImageBlend.LayerUtility: ImageBlendV2.LayerUtility: ImageBlendV3.LayerUtility: ImageBlendAdvance.LayerUtility: ImageBlendAdvanceV2.LayerUtility: ImageBlendAdvanceV3.LayerUtility: ImageCompositeHandleMask.LayerUtility: ImageCombineAlpha.LayerUtility: ImageRemoveAlpha.LayerUtility: ImageOpacity.LayerUtility: ImageShift.LayerUtility: ExtendCanvas.LayerUtility: ExtendCanvasV2.LayerUtility: CropByMask.LayerUtility: CropByMaskV2.LayerUtility: CropByMaskV3.LayerUtility: ImageScaleRestore.LayerUtility: ImageScaleRestoreV2.LayerUtility: ImageScaleByAspectRatio.LayerUtility: ImageScaleByAspectRatioV2.LayerUtility: LayerImageTransform.LayerMask: MaskByColor.LayerMask: MaskGradient.LayerMask: MaskInvert.LayerMask: MaskStroke.LayerMask: MaskGrain.LayerMask: MaskGrow.LayerMask: MaskMotionBlur.LayerMask: MaskEdgeShrink.LayerMask: MaskEdgeUltraDetail.LayerMask: MaskEdgeUltraDetailV2.LayerMask: MaskEdgeUltraDetailV3.LayerMask: CreateGradientMask.LayerUtility: ImageChannelSplit.LayerUtility: ImageChannelMerge.LayerUtility: ImageToMask".split(".")), s = new Set(/* @__PURE__ */ "ColorMatch.ColorMatchV2.ImageConcanate.ImageConcatFromBatch.ImageConcatMulti.ImageGridComposite2x2.ImageGridComposite3x3.ImageBatchTestPattern.ImageGrabPIL.Screencap_mss.AddLabel.ImagePass.ImageResizeKJ.ImageResizeKJv2.ImageUpscaleWithModelBatched.CrossFadeImages.CrossFadeImagesMulti.TransitionImagesMulti.TransitionImagesInBatch.ImageBatchJoinWithTransition.ImageBatchRepeatInterleaving.ImageBatchExtendWithOverlap.ImageBatchFilter.ImageBatchMulti.ImageAddMulti.ImageNormalize_Neg1_To_1.RemapImageRange.ReverseImageBatch.ShuffleImageBatch.ReplaceImagesInBatch.GetImagesFromBatchIndexed.GetImageRangeFromBatch.InsertImagesToBatchIndexed.ImageCropByMask.ImageCropByMaskAndResize.ImageCropByMaskBatch.ImageUncropByMask.ImagePadForOutpaintMasked.ImagePadForOutpaintTargetSize.ImagePadKJ.ImagePrepForICLora.PadImageBatchInterleaved.LoadAndResizeImage.SplitImageChannels.MergeImageChannels.DrawMaskOnImage.ImageNoiseAugmentation.ColorToMask.BlockifyMask.CreateGradientMask.CreateTextMask.CreateAudioMask.CreateFadeMask.CreateFadeMaskAdvanced.CreateFluidMask.CreateShapeMask.CreateVoronoiMask.CreateMagicMask.GrowMaskWithBlur.OffsetMask.RemapMaskRange.ResizeMask.RoundMask".split(".")), c = new Set([
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
]), l = new Set([
	"LTXVDrawTracks",
	"LTXVHDRDecodePostprocess",
	"LTXVTiledVAEDecode",
	"LTXVSparseTrackEditor",
	"LTXDirector",
	"LTXDirectorGuide"
]), u = new Set([
	...t,
	...n,
	...r,
	...i
]);
new Set([
	...o,
	...s,
	...c,
	...l
]);
var d = e({
	name: "known-nodes",
	priority: 5,
	description: "Well-known output nodes from core ComfyUI, KJNodes, Essentials, LayerStyle",
	canHandle(e, t) {
		if (!u.has(e)) return !1;
		let n = t?.images;
		return Array.isArray(n) && n.length > 0 && !!n[0]?.filename;
	},
	extractMedia(e, t, n) {
		let r = t?.images;
		if (!Array.isArray(r) || !r.length) return null;
		let i = [];
		for (let t of r) t?.filename && i.push({
			filename: t.filename,
			subfolder: t.subfolder || "",
			type: t.type || "output",
			kind: "image",
			_nodeId: n,
			_classType: e,
			_source: "known-nodes"
		});
		return i.length ? i : null;
	}
});
function f() {
	return {
		comfyCore: [...t],
		kjNodes: [...n],
		essentials: [...r],
		layerStyle: [...i],
		vhs: [...a],
		processing: {
			layerStyle: [...o],
			kjNodes: [...s],
			essentials: [...c],
			ltxv: [...l]
		}
	};
}
//#endregion
export { d as KnownNodesAdapter, f as getKnownNodeSets, e as t };
