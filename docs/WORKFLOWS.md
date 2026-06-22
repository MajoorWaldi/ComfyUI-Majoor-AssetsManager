# Workflows Tab Guide

**Last Updated**: June 11, 2026

## Overview

The **Workflow** tab turns saved ComfyUI workflow JSON files into a browsable library inside Majoor Assets Manager.

It is separate from the normal output/input asset tabs:

- output and input tabs browse media files
- the Workflow tab browses workflow `.json` files
- workflow cards can be loaded back into ComfyUI, inspected in Graph Map, organized, tagged, and assigned thumbnails

This feature follows ComfyUI's server model: the frontend reads and writes workflow data through Majoor HTTP routes, while actual workflow loading is handed back to ComfyUI frontend import APIs when available.

## Where Workflows Come From

Majoor scans these workflow roots when the Workflow tab is opened or refreshed:

- roots configured in **Settings -> Majoor Assets Manager -> Advanced -> Paths / Workflows**
- `MJR_AM_WORKFLOW_DIRECTORIES`, when set with multiple roots separated by the OS path separator
- `MJR_AM_WORKFLOW_DIRECTORY`, when set
- `<ComfyUI>/user/default/workflows`
- `<ComfyUI>/workflows`
- `<custom_nodes>/majoor-assetsmanager/workflows`
- `<custom_nodes>/majoor-assetsmanager/example_workflows`

When you save or import a workflow from the tab, Majoor writes it to the managed workflow root:

- the first configured workflow root, when workflow roots are set in Settings
- `MJR_AM_WORKFLOW_DIRECTORY`, when set
- otherwise `<ComfyUI>/user/default/workflows`
- otherwise the extension-local `workflows/` folder

Workflow categories are stored as safe subfolders under the managed root.

## Opening The Tab

1. Open Majoor Assets Manager.
2. Click the **Workflow** tab in the top scope tabs.
3. Use the search box, sort menu, filters, and card actions just like the rest of the grid.

The Workflow tab adds two toolbar buttons that only appear in this scope:

- **Save current workflow**: serializes the current ComfyUI canvas and stores it as a managed workflow JSON.
- **Pick saved workflow root**: chooses the folder used as the saved workflow root and refreshes the Workflow tab.
- **Import workflow**: imports one or more local `.json` workflow files into the managed workflow library.

## Workflow Cards

Each workflow card summarizes the JSON file and its detected purpose.

Cards can show:

- workflow name and filename
- thumbnail or generated Graph Map preview
- task, model family, provider, and runtime classification
- node count, link count, and subgraph count
- missing node or missing model counts
- category/folder
- favorite state, usage count, tags, and notes

The library parser includes native subgraphs when counting and summarizing workflows.

## Loading A Workflow

Double-click a workflow card, or use **Load workflow** from the context menu.

Majoor will:

1. read the workflow JSON from `/mjr/am/workflows/content`
2. warn if the current ComfyUI canvas appears dirty
3. pass the workflow to the ComfyUI frontend import path when available
4. mark the workflow as loaded so usage sorting can prioritize recently used workflows

If the current ComfyUI frontend does not expose a direct import path, Majoor falls back gracefully and shows a message instead of silently failing.

## Inspecting A Workflow

Use **Inspect** or **Open in Graph Map** to view a workflow without replacing the current canvas.

This opens the Majoor Floating Viewer in Graph Map mode with the workflow attached as the current asset. Use it to:

- pan and zoom the saved workflow
- inspect node labels and simple parameters
- review subgraph structure
- copy node values
- import the full workflow only when you are ready

See [GRAPH_MAP.md](GRAPH_MAP.md) for the full Graph Map walkthrough.

## Organizing Workflows

Workflow organization is stored in the workflow library database and, when applicable, in the managed filesystem layout.

Available actions include:

- **Favorite**: pin useful workflows ahead of normal sorting.
- **Rename workflow**: rename the managed JSON file safely.
- **Set workflow category**: move the workflow JSON into a managed category subfolder.
- **Edit infos**: override task, model family, provider, runtime, and notes.
- **Tags**: attach searchable tags to workflow cards.
- **Duplicate workflow**: create a copy in the managed root.
- **Delete workflow**: delete the JSON and adjacent thumbnail files, subject to write/delete guards.

Write actions use Majoor's normal CSRF/auth checks, write-access guard, audit logging, and workflow write rate limit.

## Thumbnails

A workflow can use:

- an adjacent image thumbnail such as `workflow.png`, `workflow.jpg`, or `workflow.webp`
- an adjacent animated thumbnail such as `workflow.gif`, `workflow.webp`, or `workflow.mp4`
- a generated Graph Map SVG preview when no thumbnail exists
- a linked output asset selected through **Set workflow thumbnail**

Linked thumbnail candidates are discovered from indexed assets with the same `workflow_id` or workflow hash. Video thumbnails are converted to a short animated WebP preview when supported.

You can also right-click a normal media asset and choose **Use as workflow thumbnail** to assign that asset to an existing workflow.

## Search, Sort, And Grouping

The Workflow tab uses the standard grid search flow with workflow-specific metadata.

Search matches common workflow fields:

- filename
- display name
- description
- task
- model family
- provider
- runtime
- category/subfolder

Workflow-specific sort modes include:

- default workflow order: favorites, recently loaded, usage, modified date, name
- name
- task
- model family
- usage count
- last loaded

The grid can also group workflow cards by task, model family, or category depending on the configured workflow grouping setting.

## Backend API Summary

The tab is powered by these Majoor routes:

| Route | Purpose |
| --- | --- |
| `GET /mjr/am/list?scope=workflow` | List workflow cards |
| `GET /mjr/am/workflows/content` | Read workflow JSON and prompt metadata |
| `POST /mjr/am/workflows/save` | Save current/imported workflow JSON |
| `POST /mjr/am/workflows/duplicate` | Duplicate a managed workflow |
| `POST /mjr/am/workflows/move` | Rename or categorize a managed workflow |
| `POST /mjr/am/workflows/delete` | Delete a managed workflow |
| `POST /mjr/am/workflows/mark-loaded` | Update usage metadata after loading |
| `POST /mjr/am/workflows/favorite` | Toggle favorite state |
| `POST /mjr/am/workflows/tags` | Save workflow tags |
| `POST /mjr/am/workflows/info` | Save manual workflow info and notes |
| `GET /mjr/am/workflows/thumbnail-candidates` | Find linked output assets for thumbnails |
| `POST /mjr/am/workflows/thumbnail/set` | Set or convert a workflow thumbnail |
| `GET /mjr/am/workflows/thumbnail` | Serve a workflow thumbnail |
| `GET /mjr/am/workflows/graph-map-thumbnail` | Serve generated Graph Map SVG preview |

See [API_REFERENCE.md](API_REFERENCE.md) for endpoint-level details.

## Limitations

- Only readable JSON workflows are listed.
- Very large workflow files are skipped for safety.
- Write actions are restricted to managed workflow paths.
- Missing nodes and models depend on metadata present in the workflow JSON.
- Loading relies on the ComfyUI frontend import capability available in the current host build.

## Related Docs

- [GRAPH_MAP.md](GRAPH_MAP.md)
- [MFV_GUIDE.md](MFV_GUIDE.md)
- [SEARCH_FILTERING.md](SEARCH_FILTERING.md)
- [SETTINGS_CONFIGURATION.md](SETTINGS_CONFIGURATION.md)
- [API_REFERENCE.md](API_REFERENCE.md)
