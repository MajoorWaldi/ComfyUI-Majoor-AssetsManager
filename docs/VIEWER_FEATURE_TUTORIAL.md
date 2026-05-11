# Majoor Assets Manager - Viewer Feature Tutorial

**Version**: 2.4.5
**Last Updated**: April 15, 2026

## Overview

For a dedicated Majoor Floating Viewer walkthrough with focused screenshots, see [MFV_GUIDE.md](MFV_GUIDE.md).

The Majoor Assets Manager provides **two viewer experiences**:

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

### 2. Standard Viewer

A full-featured overlay viewer with **advanced analysis tools**:

- **Enhancement Tools**: Exposure, gamma, channel isolation
- **Analysis Tools**: False color, zebra, histogram, waveform, vectorscope
- **Visual Overlays**: Grid, pixel probe, loupe
- **Video Controls**: Timeline, in/out points, speed control

**Best for**: Detailed analysis, quality inspection, metadata review

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

### Standard Viewer

- [Opening the Standard Viewer](#opening-the-standard-viewer)
- [Viewer Layout](#viewer-layout)
- [Viewer Navigation](#viewer-navigation)
- [Image Enhancement Tools](#image-enhancement-tools)
- [Analysis Tools](#analysis-tools)
- [Visual Overlays](#visual-overlays)
- [Professional Analysis Tools (Scopes)](#professional-analysis-tools-scopes)
- [Video-Specific Features](#video-specific-features)
- [Export Capabilities](#export-capabilities)
- [Standard Viewer Hotkeys](#standard-viewer-hotkeys)

### Both Viewers

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

## Standard Viewer

## Viewer Navigation

### Basic Navigation

- **Zoom**: Use mouse wheel to zoom in/out
- **Pan**: Click and drag to move around the image
- **Fit to Screen**: Automatically scales image to fit window
- **Actual Size**: View image at 1:1 pixel ratio (Alt+1)

### Asset Navigation

- **Next/Previous**: Navigate between assets in the current set
- **Keyboard Arrows**: Use arrow keys to move between assets
- **Direct Selection**: Click on thumbnails if available

## Image Enhancement Tools

### Exposure Adjustment (EV)

The exposure adjustment tool allows you to modify the brightness of your image:

1. **Accessing the Tool**:
    - Locate the exposure control in the toolbar
    - Usually represented by a sun or EV icon

2. **Adjusting Exposure**:
    - Adjust exposure compensation from -5 to +5 EV
    - Real-time preview shows changes immediately
    - Use to evaluate details in shadows/highlights
    - Preserves color relationships while adjusting brightness

3. **Use Cases**:
    - Revealing details in underexposed areas
    - Recovering highlights in overexposed regions
    - Comparing exposure differences between assets
    - Evaluating dynamic range

### Gamma Correction

Gamma correction adjusts the midtone brightness:

1. **Accessing the Tool**:
    - Find the gamma control in the toolbar
    - Usually labeled with γ or gamma symbol

2. **Adjusting Gamma**:
    - Adjust gamma curve from 0.25 to 4.0
    - Alters midtone brightness without affecting highlights/shadows as much
    - Real-time application with live preview
    - Useful for fine-tuning contrast in specific tonal ranges

3. **Use Cases**:
    - Enhancing midtone contrast
    - Adjusting overall tonal balance
    - Fine-tuning for display characteristics
    - Preparing for different output conditions

### Channel Isolation

The viewer allows you to isolate different color channels:

1. **Available Channels**:
    - **RGB**: View all color channels combined
    - **R**: View only red channel information
    - **G**: View only green channel information
    - **B**: View only blue channel information
    - **Alpha**: View transparency/alpha channel
    - **Luma**: View luminance information only

2. **Using Channel Isolation**:
    - Select the desired channel from the toolbar
    - Observe the isolated channel information
    - Compare between different channels
    - Identify channel-specific issues

3. **Use Cases**:
    - Identifying color channel imbalances
    - Detecting channel-specific noise
    - Analyzing alpha channel transparency
    - Evaluating luminance distribution

## Analysis Tools

### False Color Mode

False color mode helps identify exposure issues:

1. **Activating False Color**:
    - Enable false color mode from the toolbar
    - Usually represented by a color palette icon

2. **Interpreting Results**:
    - Identifies overexposed and underexposed areas
    - Highlights clipped highlights (typically white/magenta)
    - Shows blocked shadows (typically blue/black)
    - Helps evaluate dynamic range and exposure

3. **Use Cases**:
    - Checking for highlight clipping
    - Identifying shadow detail loss
    - Evaluating overall exposure balance
    - Comparing exposure between different assets

### Zebra Patterns (Z)

Zebra patterns indicate areas approaching clipping:

1. **Enabling Zebra**:
    - Activate zebra patterns from the toolbar
    - Usually labeled with "Z" or zebra icon

2. **Understanding Zebra**:
    - Displays 100% IRE (95% for Rec.2020) areas as zebra stripes
    - Helps identify areas approaching clipping
    - Adjustable threshold levels
    - Useful for maintaining highlight detail

3. **Use Cases**:
    - Protecting highlight detail
    - Setting optimal exposure levels
    - Comparing exposure between shots
    - Quality control for consistent exposure

## Visual Overlays

### Grid Overlays (G)

Grid overlays assist with composition:

1. **Available Grid Types**:
    - **Off**: No grid overlay
    - **Thirds**: Rule of thirds grid lines
    - **Center**: Center crosshair
    - **Safe Area**: TV broadcast safe area guides
    - **Golden Ratio**: Golden ratio composition guides

2. **Using Grid Overlays**:
    - Cycle through grid types using "G" key
    - Assess compositional balance
    - Align elements to grid lines
    - Compare compositions between assets

3. **Use Cases**:
    - Composition analysis
    - Alignment verification
    - Rule of thirds evaluation
    - Broadcast compliance checking

### Pixel Probe (I)

Pixel probe provides detailed pixel information:

1. **Activating Pixel Probe**:
    - Enable pixel probe from toolbar or press "I"
    - Hover over image to see information

2. **Information Provided**:
    - Exact pixel coordinates
    - RGB/RGBA values at cursor position
    - Hex color code
    - Luminance value information

3. **Use Cases**:
    - Color accuracy verification
    - Detail inspection
    - Color sampling
    - Quality assessment at pixel level

### Loupe Magnification (L)

Loupe provides magnified view of specific areas:

1. **Using Loupe**:
    - Activate loupe from toolbar or press "L"
    - Hover over area of interest
    - View magnified representation

2. **Features**:
    - Adjustable magnification level
    - Shows fine detail at pixel level
    - Helpful for quality assessment
    - Real-time magnification

3. **Use Cases**:
    - Quality inspection
    - Artifact detection
    - Detail analysis
    - Sharpness evaluation

## Professional Analysis Tools (Scopes)

### Histogram

The histogram shows tonal distribution:

1. **Accessing Histogram**:
    - Enable from scopes section
    - Shows RGB channel distribution

2. **Interpretation**:
    - X-axis represents tonal range (shadows to highlights)
    - Y-axis represents pixel count
    - Separate curves for R, G, B channels
    - Identifies tonal distribution patterns

3. **Use Cases**:
    - Exposure evaluation
    - Contrast analysis
    - Color balance assessment
    - Dynamic range evaluation

### Waveform

The waveform shows luminance distribution:

1. **Accessing Waveform**:
    - Enable from scopes section
    - Shows luminance across image

2. **Interpretation**:
    - Horizontal axis represents image width
    - Vertical axis represents luminance levels
    - Brighter areas appear higher in the display
    - Darker areas appear lower in the display

3. **Use Cases**:
    - Exposure evaluation
    - Luminance distribution analysis
    - Highlight/shadow placement
    - Consistency checking

### Vectorscope

The vectorscope shows color information:

1. **Accessing Vectorscope**:
    - Enable from scopes section
    - Shows color information in chromaticity diagram

2. **Interpretation**:
    - Shows color saturation and hue
    - Identifies color distribution
    - Reveals color casts or imbalances
    - Shows skin tone placement

3. **Use Cases**:
    - Color balance correction
    - Skin tone evaluation
    - Saturation assessment
    - Color cast identification

## Video-Specific Features

### Video Playback Controls

- **Play/Pause**: Standard play/pause functionality
- **Loop/Once**: Toggle between continuous and single playback
- **Speed Control**: Adjustable playback speed (0.25x to 4x)
- **Frame Stepping**: Precise frame-by-frame navigation (Left/Right Arrow keys when player bar is focused)

### Timeline Features

- **Seek Bar**: Drag to jump to specific points in video
- **Current Time**: Display of current playback position
- **Duration**: Total video duration display
- **Frame Counter**: Current frame number display

### In/Out Points

- **Set In Point**: Mark start of desired segment (I key)
- **Set Out Point**: Mark end of desired segment (O key)
- **Segment Playback**: Play only the marked segment
- **Clear Points**: Remove In/Out markers

### Hardware Acceleration (WebGL)

The viewer automatically detects WebGL support to enable GPU-accelerated video rendering:

- **Benefits**: Real-time Exposure, Gamma, and Zebra analysis on 4K videos without CPU load
- **Fallback**: If WebGL is unavailable, it automatically switches to a robust CPU-based renderer (Canvas 2D)

## Export Capabilities

### Save Current Frame

- Capture current video frame as PNG
- Preserves full resolution and quality
- Saves to default output directory
- Includes generation metadata if available

### Copy to Clipboard

- Copy current view to system clipboard
- Best-effort format selection
- May not work on all platforms
- Useful for quick sharing

### Download Original

- Download the original asset file
- Maintains original format and quality
- Preserves embedded metadata
- Safe file transfer protocol

## Viewer Hotkeys

All viewer hotkeys are captured and don't affect ComfyUI or browser:

- **Esc**: Close viewer
- **0-5**: Set rating (single view)
- **Left/Right Arrow**: Step video frames (when player bar is focused)
- **F**: Toggle fullscreen
- **Z**: Toggle zebra patterns
- **G**: Cycle through grid overlays
- **I**: Toggle pixel probe
- **L**: Toggle loupe magnification
- **C**: Copy last probed color hex value
- **Alt+1**: Toggle 1:1 zoom

## Comparison Integration

The viewer seamlessly integrates with the comparison feature:

- Switch between single view and comparison modes
- Maintain analysis tools during comparison
- Apply enhancements to both compared assets
- Use analysis tools on comparison results

## Troubleshooting Viewer Issues

### Performance Problems

- **Slow Rendering**: Reduce enhancement effects or close other applications
- **Memory Issues**: Close viewer tabs when not actively using them
- **Codec Problems**: Install appropriate codecs for video files
- **Browser Compatibility**: Ensure using supported browsers

### Tool Malfunctions

- **Missing Tools**: Verify WebGL support in your browser
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
- Use comparison modes for parameter evaluation

### Quality Assessment

- Use pixel probe for detailed inspection
- Apply false color to check exposure
- Use zebra patterns to protect highlights
- Employ scopes for professional analysis

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

_Viewer Feature Tutorial Version: 2.4.5_
_Last Updated: April 14, 2026_
