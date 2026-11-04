# Majoor Assets Manager - Viewer Feature Tutorial

**Version**: 2.4.9
**Last Updated**: April 15, 2026

## Overview

For a dedicated Majoor Floating Viewer walkthrough with focused screenshots, see [MFV_GUIDE.md](MFV_GUIDE.md).

The Majoor Assets Manager provides **two viewers**: the **Studio viewer** (main viewer) and the **Majoor Floating Viewer**.

### 0. Studio Viewer (main viewer, default)

Opening an asset (double-click, Enter, context menu) now shows the **Studio viewer**: a clean, review-first view for generated media.

- **Header**: previous / next with `n / N`, file name, resolution · format · duration · size, and actions (zoom, fit, 1:1, transparency checkerboard, compare, download, info panel, fullscreen, close).
- **Image stage**: wheel zooms around the cursor, drag to pan, double-click toggles fit ↔ 100 %, checkerboard to inspect alpha. Above 200 % pixels stay sharp (nearest-neighbour).
- **Player** (video / audio): big play button, scrubber with buffered range and hover time + frame, frame counter `f n / N · fps`, frame-by-frame stepping, A-B loop, loop, speed 0.25×–2×, volume, fullscreen, **save current frame as PNG**. Controls auto-hide while playing. Audio files show a live spectrum. Media is released when you move on.
- **3D models** (GLB, glTF, OBJ, STL, PLY, splats…): orbit with left drag, pan with right drag, zoom with the wheel.
- **Inspector** (right, `Tab`): rating and tags on top, then tabs **Generation** (prompts, models, LoRAs, sampler, seed… — same data as the asset sidebar), **Workflow** (graph preview, load into ComfyUI) and **File**.
- **Filmstrip**: thumbnails of the current list to jump anywhere.

#### Review tools (HUD rail)

Images and videos get a tool rail on the left of the stage. Each icon toggles a tool; tools with settings open a small panel next to the rail (`Esc` closes it). Colour tools run on the GPU, so they also work on playing video.

| Tool | What it does |
| --- | --- |
| **Channels** | RGB, R, G, B, alpha or luma as greyscale |
| **Exposure / gamma** | ±5 EV and display gamma 0.1–3 (double-click a slider to reset) |
| **Zebra** (`Z`) | Stripes over highlights above the threshold (50–100 %) |
| **Scopes** (`S`) | RGB + luma histogram, luma waveform, or both — live on video |
| **Guides** (`G`) | Rule of thirds, golden ratio, centre cross, action / title safe areas |
| **Aspect mask** | Darkens outside 16:9, 9:16, 1:1, 4:3 or 2.39 (adjustable opacity) |
| **Pixel probe** (`P`) | Hex, RGB, luma and pixel coordinates under the cursor |
| **Loupe** (`L`) | Pixel-accurate magnifier; right-click the icon for zoom 2–32× and size |
| **Compare A/B** (`C`) | Wipe ↔, wipe ↕, side by side, difference, add, subtract (images), multiply, screen |
| **Copy** (`Ctrl+C`) | Copies the image or the current video frame to the clipboard as PNG |
| **Reset** (`R`) | Resets every tool |

**Compare**: B is the next asset of the same kind in the list. In the compare panel, `‹ ›` picks another B, **Set B** (`B`) pins the current asset as B and moves on, **Swap** (`X`) exchanges A and B. Drag the wipe line (double-click it to centre it). Videos are kept in sync (play, pause, seek, speed, loops). Raise the exposure in *difference* mode to make subtle changes visible. Opening an A/B or side-by-side compare from the grid or the floating viewer lands here with that mode already on.

| Key | Action |
| --- | --- |
| `←` / `→` | Previous / next asset (`Home` / `End`: first / last) |
| `Space` | Play / pause |
| `,` / `.` | Previous / next frame |
| `Shift+←` / `Shift+→` | Seek −5 s / +5 s |
| `I` / `O` / `U` | Set loop A / set loop B / clear loop |
| `[` / `]` | Slower / faster |
| `M` | Mute |
| `0`–`5` | Set rating |
| `+` / `-`, `Alt+0` | Zoom in / out, fit |
| `C` / `B` / `X` | Compare on/off / set current as B / swap A and B |
| `Z` / `S` / `G` | Zebra / cycle scopes / cycle guides |
| `P` / `L` | Pixel probe / loupe |
| `R` | Reset review tools |
| `Ctrl+C` | Copy image or frame |
| `Tab` | Show / hide the inspector |
| `F` | Fullscreen |
| `Esc` | Close the open tool panel, then the viewer |

### 1. Majoor Floating Viewer (MFV) — NEW! 🎉

A lightweight, draggable floating panel for **real-time generation comparison**:

- **Live Stream Mode**: Automatically follows final generation outputs and is **enabled by default**
- **KSampler Preview**: Streams denoising-step previews during execution and is **enabled by default**
- **Compare Modes**: Simple, A/B Compare, Side-by-Side, Grid Compare (up to 4 assets)
- **Multi-Pin References (A/B/C/D)**: Pin up to 4 images simultaneously for comparison
- **Node Parameters Sidebar**: Edit workflow node widgets directly in the viewer
- **Run Button**: Queue prompt from viewer toolbar without switching to canvas
- **Node Stream**: Click nodes to preview available frontend media, including ImageOps live previews
- **Real-time Updates**: Watch generations as they complete
- **Portable**: Move anywhere on screen, resize, dock

**Best for**: Real-time workflow monitoring, quick comparisons, node preview, parameter tweaking

---

## Table of Contents

### Majoor Floating Viewer (MFV)

- [Opening the Floating Viewer](#opening-the-floating-viewer)
- [Live Stream Mode](#live-stream-mode)
- [Compare Modes](#compare-modes)
- [Multi-Pin References (A/B/C/D)](#multi-pin-references-abcd)
- [Node Parameters Sidebar](#node-parameters-sidebar)
- [Sidebar Position Setting](#sidebar-position-setting)
- [Node Stream](#node-stream)
- [MFV Controls](#mfv-controls)
- [MFV Keyboard Shortcuts](#mfv-keyboard-shortcuts)

### Both viewers

- [Troubleshooting](#troubleshooting-viewer-issues)
- [Best Practices](#best-practices)

---

## Majoor Floating Viewer (MFV)

### Opening the Floating Viewer

There are several ways to open the Majoor Floating Viewer:

#### Method 1: Toolbar Button

1. Open the Assets Manager panel
2. Click the **MFV** button in the toolbar (icon: stacked images)
3. The MFV panel appears on screen

#### Method 2: Context Menu

1. Right-click on any asset in the grid
2. Select **"Open in Floating Viewer"**
3. The MFV panel opens with that asset

#### Method 3: Node Stream

1. Open the MFV
2. Enable **Node Stream** or press **N**
3. Click a node in ComfyUI to show its available preview media

#### Method 4: Keyboard Shortcut

- Press **V** while the Assets Manager panel is hovered or focused to toggle the Floating Viewer

### Live Stream Mode

**Live Stream Mode** tracks final generation outputs after workflow execution.

**Default behavior**:

- **Live Stream** starts **enabled by default**
- **KSampler Preview** also starts **enabled by default**
- You can change both in **Settings → Majoor Assets Manager › Viewer**
- KJNodes **Model Preview Override** frames are supported; disable only that source with **Show KJNodes Model Preview Override in MFV** under the Floating Viewer settings.

#### Enabling Live Stream

1. Open the Floating Viewer
2. Click the **Live Stream** button (icon: broadcast tower)
3. Or press **L** to toggle

#### How It Works

- Monitors ComfyUI generation output events
- Automatically switches to newly generated output files
- Does not follow canvas node selection; use **Node Stream** for selected nodes
- No manual refresh needed after execution completes

#### Use Cases

- **Workflow Development**: Watch final outputs as runs complete
- **Batch Generation**: Monitor progress across multiple prompts
- **Parameter Tuning**: Compare completed runs
- **Queue Monitoring**: Keep the latest output visible while prompts execute

### Compare Modes

The MFV supports a single-asset view plus three comparison workflows:

#### Simple Mode (Default)

- Single image display
- Full resolution preview
- Standard navigation

**Shortcut**: Press **C** until Simple mode is active again

#### A/B Compare Mode

- Toggle between two images rapidly
- Click asset to set as A or B
- Useful for subtle difference detection

**How to Use**:

1. Enable A/B Compare mode (press **C** from Simple mode)
2. Click first asset → Set as A
3. Click second asset → Set as B
4. Use **C** again later to move on to Side-by-Side or back to Simple mode

**Use Cases**:

- Compare different sampler results
- Check before/after edits
- Evaluate parameter changes

#### Side-by-Side Mode

- Display both images simultaneously
- Split view (vertical or horizontal)
- Synchronized zoom and pan

**How to Use**:

1. Enable Side-by-Side mode (press **C** until Side-by-Side is active)
2. Select two assets
3. Both display side by side
4. Use the mode button or toolbar controls if you want to move into Grid compare

**Use Cases**:

- Direct visual comparison
- Composition analysis
- Color grading comparison

### Multi-Pin References (A/B/C/D)

The Multi-Pin system lets you pin up to **4 reference images** simultaneously for comparison.

#### How It Works

1. Open the Floating Viewer
2. In the toolbar, locate the **A B C D** toggle buttons next to the mode button
3. Click a letter to **pin** the currently displayed image to that slot
4. Click the same letter again to **unpin** it
5. Multiple slots can be active at the same time

#### Pin Behavior

- **Pinned slots are locked**: When Live Stream brings in a new generation, pinned slots keep their content while unpinned slots update automatically
- **Compare with pins**: In A/B or Side-by-Side mode, pin A as a reference and let B follow live generations to compare every new result against a fixed baseline
- **Multi-pin in Grid Compare**: Pin A, B, C, and D to lock 4 images for simultaneous comparison in Grid Compare mode

#### Use Cases

- **Baseline comparison**: Pin your best result in slot A and iterate freely
- **Parameter sweep**: Pin 4 different sampler results and compare visually
- **Before/after editing**: Pin the original in A, the edited version in B

---

### Node Parameters Sidebar

The **Node Parameters** sidebar displays and lets you edit the ComfyUI node widgets directly inside the Floating Viewer.

#### Opening the Sidebar

1. Open the Floating Viewer
2. Click the **Node Parameters** button (sliders icon) in the toolbar — it is located at the far right of the toolbar
3. The sidebar slides open on the right (default position)

#### What It Shows

- All widgets from the workflow node that produced the current image
- Grouped by node: each node section has a colored header showing the node title
- Widget types supported: text fields, number inputs, combo/dropdown selectors, toggles

#### Editing Widgets

- **Text fields**: Click and type. Long text (prompts) use a resizable text area
    - Click the **expand** button (↕) to toggle between collapsed (80px) and expanded (680px) height
    - Text labels appear above the text area for better readability
- **Numbers**: Type a value or use the stepper
- **Combos**: Select from the dropdown list
- Changes are applied back to the ComfyUI graph in real time

#### Run Button

The **Run** (▶) button at the far right of the toolbar queues the current workflow, allowing you to iterate without switching back to the ComfyUI canvas.

#### Use Cases

- **Prompt iteration**: Edit the positive/negative prompt and re-run without leaving the viewer
- **Seed tweaking**: Change the seed value and queue immediately
- **Sampler comparison**: Switch samplers from the sidebar and compare outputs
- **CFG tuning**: Adjust CFG scale, run, and compare final outputs via Live Stream

---

### Sidebar Position Setting

You can change where the Node Parameters sidebar appears inside the Floating Viewer.

#### Changing the Position

1. Go to **Settings → Majoor Assets Manager › Viewer**
2. Find **Node Parameters sidebar position**
3. Select one of:
    - **right** (default) — sidebar opens on the right side
    - **left** — sidebar opens on the left side
    - **bottom** — sidebar opens at the bottom as a horizontal panel
4. The change applies **immediately** — no page reload required

#### Recommendations

- **Right** works best for most layouts and screen sizes
- **Left** is useful when your ComfyUI canvas is on the right
- **Bottom** is ideal for wide screens or when you prefer a short, wide parameter panel

---

### Node Stream

**Node Stream** lets you preview selected node content when the frontend already has media for that node.

#### Enabling Node Stream

1. Open the Floating Viewer
2. Click the **Node Stream** button (icon: node graph)
3. Or press **N** to toggle

#### How It Works

- Click **LoadImage** / loader nodes -> preview the loaded media
- Click **SaveImage** / preview nodes -> preview an existing generated preview/output
- Click ImageOps nodes -> preview the embedded live canvas when available
- Click other intermediate nodes -> preview only if they expose `node.imgs`, widget media, or a downstream preview/save node

#### Limitations

- Node Stream cannot read raw backend tensors (`IMAGE`, `MASK`, `LATENT`) before execution.
- Python node outputs become available only after ComfyUI executes the node.
- ImageOps live previews are frontend canvases, so they can update without queueing but are not the backend tensor itself.
- If no frontend media exists for the selected node or downstream path, the MFV has nothing to display.

#### Use Cases

- **Debugging**: Check available intermediate previews
- **Workflow Building**: Verify node connections
- **Quality Control**: Inspect outputs at each stage
- **Teaching**: Show workflow data flow

### MFV Controls

#### Panel Controls

- **Move**: Drag from panel header
- **Resize**: Drag panel edges or corners
- **Close**: Click X button or press **Esc**
- **Minimize**: Click minimize button (optional)

#### Zoom & Pan

- **Zoom In**: Mouse wheel up or **Up Arrow**
- **Zoom Out**: Mouse wheel down or **Down Arrow**
- **Reset Zoom**: Press **0** (fit to screen)
- **Actual Size**: Press **1** (1:1 pixel)
- **Pan**: Click and drag when zoomed in

#### Navigation

- **Previous Asset**: **Left Arrow** when the inline player is not focused
- **Next Asset**: **Right Arrow** when the inline player is not focused
- **First Asset**: **Home**
- **Last Asset**: **End**

### MFV Keyboard Shortcuts

#### General

| Shortcut | Action                                                    |
| -------- | --------------------------------------------------------- |
| **Esc**  | Close Floating Viewer                                     |
| **C**    | Cycle compare modes: A/B, Side-by-side, Off (Simple mode) |
| **K**    | Toggle KSampler denoising preview on or off               |
| **L**    | Toggle Live Stream final-output following on or off       |
| **N**    | Toggle Node Stream selected-node previewing               |

#### Video Controls

| Shortcut        | Action                               |
| --------------- | ------------------------------------ |
| **Space**       | Play/Pause the focused inline player |
| **Left Arrow**  | Step backward one frame              |
| **Right Arrow** | Step forward one frame               |

> Tip: click once on the MFV media player to focus it, then use the playback keys above. The Gen Info overlay remains visible and automatically sits above the player controls when they are present.

See [HOTKEYS_SHORTCUTS.md](HOTKEYS_SHORTCUTS.md) for complete shortcut list.

---

## Troubleshooting Viewer Issues

### Performance Problems

- **Slow Rendering**: Reduce enhancement effects or close other applications
- **Memory Issues**: Close viewer tabs when not actively using them
- **Codec Problems**: Install appropriate codecs for video files
- **Browser Compatibility**: Ensure using supported browsers

### Tool Malfunctions

- **Missing Tools**: The review tools apply to images and videos only (3D models and audio have their own controls)
- **Unresponsive Controls**: Refresh the viewer or browser
- **Display Issues**: Check browser zoom level and display settings
- **Audio Problems**: Check system audio settings for video files

### File-Specific Issues

- **Unsupported Formats**: Convert to supported formats if needed
- **Corrupted Files**: Verify file integrity
- **Large Files**: Be patient with initial loading of large files
- **Network Issues**: Ensure stable connection for remote files

## Best Practices

### Efficient Viewing

- Use keyboard shortcuts for faster navigation
- Apply analysis tools systematically
- Take advantage of export features for sharing
- Use A/B compare (`C`) to evaluate parameter changes

### Quality Assessment

- Use pixel probe for detailed inspection
- Use the exposure and channel tools to check tones
- Use zebra patterns to protect highlights
- Use the histogram and waveform scopes for objective checks

### Workflow Integration

- Combine viewer tools with rating system
- Use export features for review workflows
- Integrate with collection management
- Apply consistent analysis methodology

### Performance Optimization

- Close viewers when not actively using them
- Use lower resolution previews when possible
- Organize assets into collections to reduce load times
- Keep frequently accessed assets in smaller collections

---

_Viewer Feature Tutorial Version: 2.4.9_
_Last Updated: April 14, 2026_
