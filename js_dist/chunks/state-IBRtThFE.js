//#region js/features/viewer/state.ts
function e(e) {
	let t = Number(e);
	return Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 0;
}
function t(e, t, n) {
	let r = Number(e);
	return Number.isFinite(r) ? Math.max(Number(t), Math.min(Number(n), r)) : Number(t);
}
function n() {
	return {
		assets: [],
		currentIndex: 0,
		mode: "single",
		zoom: 1,
		panX: 0,
		panY: 0,
		targetZoom: 1,
		compareAsset: null,
		channel: "rgb",
		exposureEV: 0,
		gamma: 1,
		analysisMode: "none",
		zebraThreshold: .95,
		abCompareMode: "wipe",
		scopesMode: "off",
		gridMode: 0,
		overlayMaskEnabled: !1,
		overlayMaskOpacity: .65,
		overlayFormat: "image",
		probeEnabled: !1,
		loupeEnabled: !1,
		hudEnabled: !0,
		distractionFree: !1,
		loupeSize: 120,
		loupeMagnification: 8,
		genInfoOpen: !0,
		audioVisualizerMode: "artistic",
		_userInteracted: !1,
		_panHintAt: 0,
		_panHintX: null,
		_panHintY: null,
		_panHintTimer: null,
		_prevBodyOverflow: "",
		_prevFocusedElement: null,
		_lastPointerX: null,
		_lastPointerY: null,
		_mediaW: 0,
		_mediaH: 0,
		_viewportCache: null,
		_probe: null,
		_videoControlsDestroy: null,
		_activeVideoEl: null,
		_abWipePercent: 50,
		_scopesLastAt: 0
	};
}
//#endregion
export { e as n, n as r, t };
