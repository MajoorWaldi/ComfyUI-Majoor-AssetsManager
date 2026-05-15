# Majoor Assets Manager - Hotkeys & Keyboard Shortcuts Guide

**Version**: 2.4.7
**Last Updated**: May 15, 2026

## Overview

This guide covers all active keyboard shortcuts for the Majoor Assets Manager, including the new **Majoor Floating Viewer (MFV)**.

---

## Table of Contents

- [Global / Panel Hotkeys](#global--panel-hotkeys)
- [Grid View Hotkeys](#grid-view-hotkeys)
- [Standard Viewer Hotkeys](#standard-viewer-hotkeys)
- [Majoor Floating Viewer (MFV) Hotkeys](#majoor-floating-viewer-mfv-hotkeys)
- [Video Playback Hotkeys](#video-playback-hotkeys)
- [Drag & Drop Shortcuts](#drag--drop-shortcuts)
- [Mouse Shortcuts](#mouse-shortcuts)

---

## Global / Panel Hotkeys

These shortcuts work globally in the Assets Manager panel.

| Shortcut                | Action                   | Scope                  |
| ----------------------- | ------------------------ | ---------------------- |
| **Ctrl+S** / **Cmd+S**  | Trigger Index Scan       | Global (Panel Focused) |
| **Ctrl+F** / **Ctrl+K** | Focus Search Input       | Global                 |
| **Ctrl+H**              | Clear Search Input       | Global                 |
| **D**                   | Toggle Sidebar (Details) | Grid / Panel           |
| **V**                   | Toggle Floating Viewer   | Grid / Panel           |

---

## Grid View Hotkeys

These shortcuts apply when the asset grid has focus.

### Navigation & Selection

| Shortcut                       | Action               |
| ------------------------------ | -------------------- |
| **Arrow Keys** (↑↓←→)          | Navigate selection   |
| **Enter** / **Space**          | Open Viewer          |
| **V**                          | Open selected asset in Floating Viewer |
| **Ctrl+A** / **Cmd+A**         | Select All           |
| **Ctrl+D** / **Cmd+D**         | Deselect All         |
| **Ctrl+Click** / **Cmd+Click** | Toggle Selection     |
| **Shift+Click**                | Range Selection      |
| **Home**                       | Go to first asset    |
| **End**                        | Go to last asset     |
| **Page Up**                    | Scroll up one page   |
| **Page Down**                  | Scroll down one page |

### Organization & Rating

| Shortcut      | Action                       |
| ------------- | ---------------------------- |
| **0**         | Reset Rating (0 stars)       |
| **1** - **5** | Set Rating (1-5 stars)       |
| **T**         | Edit Tags                    |
| **B**         | Add to Collection (Bookmark) |
| **Shift+B**   | Remove from Collection       |

### File Operations

| Shortcut                           | Action                          |
| ---------------------------------- | ------------------------------- |
| **F2**                             | Rename File                     |
| **Delete**                         | Delete File (with confirmation) |
| **S**                              | Download File                   |
| **Ctrl+Shift+C** / **Cmd+Shift+C** | Copy File Path                  |
| **Ctrl+Shift+E** / **Cmd+Shift+E** | Open in Explorer/Finder         |

---

## Standard Viewer Hotkeys

These shortcuts apply when the **Standard Viewer** overlay is open (double-click on asset).

### General

| Shortcut  | Action                              |
| --------- | ----------------------------------- |
| **Esc**   | Close Viewer                        |
| **F**     | Toggle Fullscreen                   |
| **D**     | Toggle Info Panel (Generation Data) |
| **Space** | Play/Pause Video                    |
| **S**     | Download Original from context menu |

### Navigation

| Shortcut        | Action          | Notes                                     |
| --------------- | --------------- | ----------------------------------------- |
| **Left Arrow**  | Previous Asset  | Default behavior                          |
| **Right Arrow** | Next Asset      | Default behavior                          |
| **Left Arrow**  | Step Frame (-1) | **Only when Video Player bar is focused** |
| **Right Arrow** | Step Frame (+1) | **Only when Video Player bar is focused** |
| **Mouse Wheel** | Zoom In/Out     |                                           |
| **Click+Drag**  | Pan Image       | When zoomed in                            |

### Tools & Analysis

| Shortcut      | Action                                            | Notes             |
| ------------- | ------------------------------------------------- | ----------------- |
| **I**         | Set In Point (video) / Toggle Pixel Probe (image) | Context-sensitive |
| **O**         | Set Out Point                                     | Video only        |
| **C**         | Copy Probed Color (Hex)                           |                   |
| **L**         | Toggle Loupe                                      |                   |
| **Z**         | Toggle Zebra (Exposure)                           |                   |
| **G**         | Cycle Grid Overlays                               |                   |
| **Alt+1**     | Toggle 1:1 Pixel View                             |                   |
| **+** / **-** | Zoom In / Out                                     |                   |

### Enhancement Tools

| Shortcut              | Action                       |
| --------------------- | ---------------------------- |
| **E**                 | Toggle Exposure (EV) Control |
| **M**                 | Toggle Gamma Correction      |
| **1** / **2** / **3** | Isolate R/G/B Channel        |
| **0**                 | Reset to RGB (all channels)  |
| **A**                 | Toggle Alpha Channel View    |
| **Y**                 | Toggle Luma (Y) View         |

### Analysis Overlays

| Shortcut    | Action             |
| ----------- | ------------------ |
| **Shift+Z** | Toggle False Color |
| **Shift+H** | Toggle Histogram   |
| **Shift+W** | Toggle Waveform    |
| **Shift+V** | Toggle Vectorscope |

---

## Majoor Floating Viewer (MFV) Hotkeys

These shortcuts apply when the **Majoor Floating Viewer** panel is open.

### General Controls

| Shortcut | Action                                                    |
| -------- | --------------------------------------------------------- |
| **Esc**  | Close Floating Viewer                                     |
| **V**    | Open or close Floating Viewer                             |
| **C**    | Cycle compare modes: A/B, Side-by-side, Off (Simple mode) |
| **K**    | Toggle KSampler denoising preview on or off               |
| **L**    | Toggle Live Stream final-output following on or off       |
| **N**    | Toggle selected-node Node Stream on or off                |

### Panel And Media Interaction

| Shortcut        | Action                     |
| --------------- | -------------------------- |
| **Mouse Wheel** | Zoom In/Out                |
| **Click+Drag**  | Pan Image (when zoomed)    |
| **Drag Header** | Move the floating panel    |
| **Drag Edges**  | Resize the floating panel  |

Node Stream follows the currently selected compatible node when enabled. Grid compare and Graph Map are available from the MFV toolbar or mode menu rather than dedicated keyboard shortcuts.

### Video Controls (MFV)

| Shortcut        | Action                            |
| --------------- | --------------------------------- |
| **Space**       | Play/Pause the focused MFV player |
| **Left Arrow**  | Step backward one frame           |
| **Right Arrow** | Step forward one frame            |

> Click once on the inline player surface to give it focus before using the playback shortcuts above.

---

## Video Playback Hotkeys

These shortcuts apply when playing video content in the viewer.

### Playback Control

| Shortcut           | Action     |
| ------------------ | ---------- |
| **Space**          | Play/Pause |
| **Click on video** | Play/Pause |

### Frame Navigation

| Shortcut        | Action          | Notes                      |
| --------------- | --------------- | -------------------------- |
| **Left Arrow**  | Previous Frame  | When player bar is focused |
| **Right Arrow** | Next Frame      | When player bar is focused |
| **Home**        | Go to In Point  |                            |
| **End**         | Go to Out Point |                            |

### In/Out Points (Edit Marks)

| Shortcut | Action                         |
| -------- | ------------------------------ |
| **I**    | Set In Point at current frame  |
| **O**    | Set Out Point at current frame |

### Speed Control

| Shortcut | Action                           |
| -------- | -------------------------------- |
| **[**    | Decrease Playback Speed (-0.25x) |
| **]**    | Increase Playback Speed (+0.25x) |
| **\\**   | Reset Speed to Normal (1x)       |

### Audio

Video audio is automatically unmuted after first user interaction (play, seek, or frame step).

---

## Drag & Drop Shortcuts

| Gesture | Action |
| ------- | ------ |
| **S+Drag to OS** | Export without ComfyUI workflow/generation metadata |
| **L+Drop on canvas** | Load selected asset(s) as media loader node(s) instead of importing embedded workflow |

---

## Mouse Shortcuts

### Grid View

| Action                         | Result               |
| ------------------------------ | -------------------- |
| **Click**                      | Select asset         |
| **Double-Click**               | Open in Viewer       |
| **Ctrl+Click** / **Cmd+Click** | Toggle selection     |
| **Shift+Click**                | Range selection      |
| **Right-Click**                | Open context menu    |
| **Drag**                       | Initiate drag & drop |

### Viewer

| Action                  | Result             |
| ----------------------- | ------------------ |
| **Mouse Wheel**         | Zoom in/out        |
| **Click+Drag** (zoomed) | Pan image          |
| **Double-Click**        | Toggle 1:1 zoom    |
| **Right-Click**         | Open context menu  |
| **Middle-Click**        | Reset zoom and pan |

### Floating Viewer

| Action                  | Result                 |
| ----------------------- | ---------------------- |
| **Drag Header**         | Move panel             |
| **Drag Edges**          | Resize panel           |
| **Click Outside**       | Close open MFV popovers |
| **Mouse Wheel**         | Zoom in/out            |
| **Click+Drag** (zoomed) | Pan image              |

---

## Quick Reference Card

### Most Used Shortcuts

```
Grid Navigation:  Arrow keys
Open Viewer:      Enter / Double-click
Rate:             0-5 keys
Search:           Ctrl+F / Ctrl+K
Scan:             Ctrl+S
Download:         S
Tags:             T
Collection:       B
Floating Viewer:  V
Close Viewer:     Esc
Zoom:             Mouse wheel
Pan:              Click+drag
```

### Viewer Essentials

```
Fullscreen:       F
Info Panel:       D
Pixel Probe:      I
Loupe:            L
Zebra:            Z
Grid:             G
1:1 Zoom:         Alt+1
```

### MFV Essentials

```
Toggle MFV:       V
Compare Mode:     C
Live Stream:      L
KSampler Preview: K
Node Stream:      N
Play/Pause:       Space
```

---

## Customization

### Remapping Shortcuts

Currently, shortcuts are hardcoded. Future versions may support customization via:

- Browser extensions
- ComfyUI keymap settings
- Configuration file

### Conflicts with ComfyUI

The following shortcuts may conflict with ComfyUI globals:

- **Ctrl+S**: Also triggers ComfyUI workflow save
- **S**: Download waits for key release so S+drag can still be used for clean export without triggering a download
- **Delete**: Also deletes ComfyUI nodes
- **Ctrl+Z**: ComfyUI undo (not overridden)

When the Assets Manager panel has focus, its shortcuts take precedence.

---

## Accessibility

### Keyboard-Only Navigation

All features are accessible via keyboard:

- Tab through UI elements
- Enter/Space to activate
- Arrow keys to navigate
- Esc to close dialogs

### Screen Reader Support

- ARIA labels on interactive elements
- Status announcements for operations
- Alt text on thumbnails

---

_Hotkeys & Shortcuts Guide Version: 2.4.7_
_Last Updated: May 15, 2026_
_Compatible with Majoor Assets Manager v2.4.4+_
