# Viewer and MFV

## Viewer

The viewer is the main inspection surface for assets. It supports image and video preview along with several analysis tools.

Common viewer capabilities:
- zoom and pan
- compare modes
- histogram and waveform tools
- false color and zebra overlays
- workflow minimap and generation context

The standard viewer is the better choice when you need deliberate inspection, analysis overlays, or a more complete metadata review surface.

## Majoor Floating Viewer

MFV is a lightweight floating panel optimized for live comparison while generations are happening.

Typical uses:
- watch new generations as they complete
- compare multiple recent outputs
- follow SaveImage and LoadImage-related workflows
- inspect generation info without switching context repeatedly

MFV is the better choice when iteration speed matters more than deep inspection.

## Choosing Between The Two Viewers

Use the standard viewer when you need:

- detailed visual analysis
- scopes such as histogram, waveform, or vectorscope
- more deliberate review of generation details

Use MFV when you need:

- real-time monitoring during generation
- faster compare workflows
- lighter-weight selected-node streaming and floating access

## Common Controls Worth Learning

Across the viewer workflows, a few controls provide most of the value quickly:

- mouse wheel for zoom
- click-drag for pan
- `Esc` to close
- `Space` for video playback
- `V` to toggle MFV
- `C`, `K`, `L`, and `N` inside MFV for compare, preview, live stream, and selected-node streaming

## Related Docs

- [Viewer Feature Tutorial](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/VIEWER_FEATURE_TUTORIAL.md)
- [Shortcuts](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/SHORTCUTS.md)
- [Hotkeys and Shortcuts](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/HOTKEYS_SHORTCUTS.md)
