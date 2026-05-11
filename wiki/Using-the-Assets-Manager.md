# Using the Assets Manager

## Core Workflow

The extension is designed around a single flow:

1. Select a scope such as Outputs, Inputs, Custom, or Collections.
2. Browse assets in the grid.
3. Narrow the result set with search and filters.
4. Open assets in the viewer for inspection.
5. Organize assets with ratings, tags, and collections.

## Main UI Areas

- Sidebar entry point for the extension
- Asset grid for large-library browsing
- Search and filter controls
- Context actions for rename, delete, open folder, copy path, and staging
- Viewer for detailed preview and analysis

## Scope Model

The extension is built around several scopes:

- Outputs for generated results
- Inputs for reusable source assets
- Custom roots for user-defined directories
- Collections for curated cross-scope groups

Thinking in scopes is important because it affects browsing, indexing, and the meaning of search results.

## Typical Actions

- Double-click an asset to open the viewer
- Right-click to access file and organization actions
- Drag assets to the ComfyUI canvas or operating system
- Create or reopen collections to group related outputs

## High-Value Daily Workflow

A practical workflow for heavy ComfyUI usage looks like this:

1. keep the grid on Outputs while generating
2. use quick search and filters to isolate a run family
3. rate and tag promising assets immediately
4. open finalists in the viewer or MFV for close inspection
5. move final selections into collections for later reuse

That workflow is where the extension provides more value than folder-only browsing.

## Real-Time Usage

Majoor Assets Manager can track new outputs and refresh the UI as generations complete. This is especially useful when comparing several recent runs quickly.

The Majoor Floating Viewer is especially useful here because it reduces context switching during iteration.

## Useful Shortcuts

Common shortcuts worth learning early:

- `Ctrl+S` / `Cmd+S` to trigger an index scan
- `Ctrl+F` or `Ctrl+K` to focus search
- `D` to toggle the details sidebar
- `V` to toggle the floating viewer
- `0` to `5` to apply ratings quickly on selected assets

## Related Docs

- [README](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/README.md)
- [Drag and Drop](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/DRAG_DROP.md)
- [Shortcuts](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/SHORTCUTS.md)
- [Hotkeys and Shortcuts](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/HOTKEYS_SHORTCUTS.md)
