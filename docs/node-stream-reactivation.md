# Node Stream Reactivation

## Current status

`Node Stream` is intentionally disabled for now.

The single source of truth is:

- `js/features/viewer/nodeStream/nodeStreamFeatureFlag.js`

As long as `NODE_STREAM_FEATURE_ENABLED` stays `false`:

- the Floating Viewer toolbar does not show the Node Stream button,
- the `N` shortcut does nothing,
- `floatingViewerManager` ignores Node Stream activation and payloads,
- `entry.js` does not initialize the controller or expose `window.MajoorNodeStream`,
- `NodeStreamController` stays inert even if called directly.

## Why it was disabled

The feature is being paused until the selection-only behavior is stable enough to
ship again without confusing MFV behavior.

The implementation was kept in the repo on purpose so the next reactivation does
not require rebuilding the feature from scratch.

## Files touched by the temporary shutdown

- `js/features/viewer/nodeStream/nodeStreamFeatureFlag.js`
- `js/features/viewer/nodeStream/NodeStreamController.js`
- `js/features/viewer/FloatingViewer.js`
- `js/features/viewer/floatingViewerManager.js`
- `js/entry.js`
- `js/app/events.js`
- `js/tests/node_stream_controller.vitest.mjs`

## Reactivation checklist

1. Set `NODE_STREAM_FEATURE_ENABLED = true` in `js/features/viewer/nodeStream/nodeStreamFeatureFlag.js`.
2. Confirm the Node Stream toolbar button reappears in the MFV.
3. Confirm the `N` shortcut and `mjr:mfv-nodestream-toggle` event are re-enabled.
4. Confirm `entry.js` initializes the controller and re-exposes `window.MajoorNodeStream`.
5. Replace the current disabled-state tests in `js/tests/node_stream_controller.vitest.mjs` with active behavior tests again.

## Minimum manual smoke tests after reactivation

Use the real local stack and verify these cases from the ComfyUI canvas:

- Core `LoadImage`
- Core `LoadImageMask`
- `LayerUtility: ImageBlend`
- `LayerUtility: ImageBlendAdvance`
- `LayerMask: MaskPreview`
- `MaskPreview+` from `comfyui_essentials`
- `PreviewImageOrMask` and `ImageAndMaskPreview` from `comfyui-kjnodes`
- at least one WAS Suite image node if present locally at that time

## Expected behavior when reactivated

- Selection-only behavior: previews should follow node clicks, not execution events.
- If a selected node has no direct preview, downstream preview/save nodes may be
  used as the preview source.
- The feature should stay compatible with MFV lifecycle teardown/hot-reload.
