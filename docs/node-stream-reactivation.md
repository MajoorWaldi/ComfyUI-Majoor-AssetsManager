# Node Stream Notes

## Current Status

`Node Stream` is enabled. The single source of truth is:

- `js/features/viewer/nodeStream/nodeStreamFeatureFlag.js`

The active implementation is selection-only: when the MFV Node Stream button is
on, selecting a ComfyUI canvas node streams the best available preview into the
Floating Viewer. It supports standard ComfyUI node previews, downstream preview
nodes, load widgets, and ImageOps live-preview canvases exposed through
`node.__imageops_state.canvas`.

Node Stream is the only MFV feature that follows canvas node selection. Live
Stream is reserved for final generation outputs, and KSampler Preview is
reserved for denoising-step blobs from the ComfyUI API.

If `NODE_STREAM_FEATURE_ENABLED` is set to `false`:

- the Floating Viewer toolbar does not show the Node Stream button,
- the `N` shortcut does nothing,
- `floatingViewerManager` ignores Node Stream activation and payloads,
- `entry.js` does not initialize the controller or expose the inspection-only `window.MajoorNodeStream` helpers,
- `NodeStreamController` stays inert even if called directly.

## Files Involved

- `js/features/viewer/nodeStream/nodeStreamFeatureFlag.js`
- `js/features/viewer/nodeStream/NodeStreamController.js`
- `js/features/viewer/nodeStream/imageOpsPreviewBridge.js`
- `js/features/viewer/FloatingViewer.js`
- `js/features/viewer/floatingViewerManager.js`
- `js/entry.js`
- `js/app/events.js`
- `js/tests/node_stream_controller.vitest.mjs`

## Smoke Tests

Use the real local stack and verify these cases from the ComfyUI canvas:

- Core `LoadImage`
- Core `LoadImageMask`
- `ImageOpsPreview`
- Any ImageOps processing node with an embedded live preview
- `LayerUtility: ImageBlend`
- `LayerUtility: ImageBlendAdvance`
- `LayerMask: MaskPreview`
- `MaskPreview+` from `comfyui_essentials`
- `PreviewImageOrMask` and `ImageAndMaskPreview` from `comfyui-kjnodes`
- at least one WAS Suite image node if present locally

## Expected Behavior

- Selection-only behavior: previews follow node clicks, not execution events.
- If a selected node has no direct preview, downstream preview/save nodes may be
  used as the preview source.
- ImageOps live preview canvases update in the MFV when their render signature changes.
- The feature stays compatible with MFV lifecycle teardown and hot-reload.

## Stream Feature Boundaries

### Live Stream

- Source: `NEW_GENERATION_OUTPUT` events.
- Trigger: workflow execution finishes and ComfyUI reports output files.
- Displays: final generated files only.
- Does not follow selected canvas nodes.
- Limitation: no raw tensor access and no no-queue preview.

### KSampler Preview

- Source: ComfyUI API `b_preview_with_metadata` or legacy `b_preview` events.
- Trigger: sampler denoising during workflow execution.
- Displays: transient preview blobs, usually JPEG/PNG frames.
- Limitation: only available while ComfyUI emits sampler previews.

### Node Stream

- Source: selected ComfyUI canvas node.
- Trigger: user selects a node while Node Stream is active.
- Displays: frontend-observable media such as `node.imgs`, widget `<img>`/`<video>`,
  load-widget filenames, downstream preview/save media, and ImageOps live canvases.
- Public debug surface: `window.MajoorNodeStream.mode`, `.listAdapters()`, and
  `.getKnownNodeSets()` are inspection helpers only; third-party adapter
  registration is not part of the active runtime contract.
- Limitation: cannot read backend tensors (`IMAGE`, `MASK`, `LATENT`) before node
  execution. For ImageOps, the no-queue live path is the frontend canvas, not the
  Python tensor output.
