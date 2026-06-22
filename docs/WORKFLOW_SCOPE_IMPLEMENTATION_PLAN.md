# Workflow Scope Implementation Plan

## Objective

Add a first-class **Workflow** scope next to the existing `All`, `Input`,
`Output`, and `Custom` scopes. The scope should let users browse, classify,
preview, load, save, and organize ComfyUI workflow JSON files with a card grid
similar to ComfyUI's official template browser.

Target UX:

- `Workflow` tab in the Majoor panel.
- Workflow cards with static or animated thumbnails.
- Filters for task/category (`T2I`, `I2I`, `I2V`, `T2V`, `Image Edit`, etc.),
  model family (`Qwen`, `Seedance`, `Flux`, `Wan`, etc.), provider, local/API
  runtime, required custom nodes, and missing models.
- Sort modes similar to templates: default, recent, name, model, task, usage.
- Actions: load workflow into ComfyUI, save current workflow, duplicate, rename,
  move/category assign, delete with write guard, open in folder, inspect nodes,
  and optionally add thumbnail.

## Official ComfyUI Alignment Notes

Sources consulted before planning:

- ComfyUI server routes and comms docs:
  https://docs.comfy.org/development/comfyui-server/comms_overview
- ComfyUI routes docs:
  https://docs.comfy.org/development/comfyui-server/comms_routes
- ComfyUI built-in template docs:
  https://docs.comfy.org/interface/features/template
- Custom-node workflow template docs:
  https://docs.comfy.org/custom-nodes/workflow_templates
- Official workflow templates repository:
  https://github.com/Comfy-Org/workflow_templates

Important constraints from those sources:

- ComfyUI server routes are based on `PromptServer.instance.routes` and
  `aiohttp`; Majoor routes must keep using that pattern.
- ComfyUI already exposes workflow/template/user-data routes, including
  `/workflow_templates`, `/userdata`, `/v2/userdata`, `/prompt`, `/history`,
  `/object_info`, and `/models`.
- ComfyUI custom-node examples are expected under `example_workflows` or
  compatible folder names, JSON only, with optional same-name JPG thumbnails.
- Core template browsing is for official/custom-node examples. Majoor's
  Workflow scope should manage the user's saved workflow library, not override
  the core template browser.
- Frontend host access must stay behind bridge modules such as
  `ui/app/comfyApiBridge.ts` or `ui/app/hostAdapter.ts`.

## Current Repository Audit

### Existing Scope Flow

Current grid scopes are wired through:

- `ui/features/panel/views/tabsView.ts`
- `ui/features/panel/controllers/scopeController.ts`
- `ui/features/panel/controllers/gridController.ts`
- `ui/api/endpoints.ts`
- `mjr_am_backend/routes/search/listing_endpoint.py`
- `mjr_am_backend/routes/search/listing_scopes.py`

The accepted frontend scopes are currently:

- `all`
- `input`
- `output` / `outputs`
- `custom`
- `similar`

The backend listing route rejects unknown scopes, so `workflow` needs explicit
support on both sides.

### Existing Data Model

Current persistence is media-asset oriented:

- `assets.source`: `output`, `input`, `custom`
- `assets.kind`: currently classifies file media types like image/video/audio/3D
- `asset_metadata`: stores workflow/generation data extracted from media
- `assets.workflow_id`, `asset_metadata.workflow_hash`,
  `asset_metadata.workflow_type`, `asset_metadata.has_workflow` already support
  workflow metadata attached to generated files

This is not enough for saved workflow files as browsable entities. A saved
workflow is not just metadata on an image; it needs its own library row,
thumbnail relation, categories, required nodes/models, and load/save actions.

### Existing UI Card Flow

Cards are rendered through:

- `ui/vue/components/grid/AssetCardInner.vue`
- `ui/features/grid/AssetCardRenderer.ts`
- `ui/vue/components/grid/AssetsGrid.vue`
- `ui/vue/components/grid/VirtualAssetGridHost.vue`

The current card assumes media-ish assets and computes thumbnail URLs with
`buildAssetViewURL()`. Workflow cards need a separate preview contract, because
JSON cannot be served through `/view` and may use:

- explicit thumbnail image
- animated thumbnail/video/webp preview
- first matching generated output linked by `workflow_id`
- generated graph-map screenshot fallback
- icon fallback when no thumbnail exists

### Existing Backend Architecture

The repo architecture says:

- routes parse HTTP and call services
- features own business logic
- adapters isolate DB/filesystem/ComfyUI boundaries
- write/delete operations must use shared security and audit helpers

Workflow scope should follow that shape:

- `routes/handlers/workflows.py`
- `features/workflows/service.py`
- `features/workflows/indexer.py`
- `features/workflows/classifier.py`
- `features/workflows/models.py`
- `adapters/comfy_user_data.py` or equivalent bridge for ComfyUI user data APIs
- optional DB migration under `adapters/db/migrations`

## Recommended Design

### Storage Strategy

Use a dedicated workflow-library domain instead of forcing workflow JSON rows
into the current media `assets` table.

Recommended tables:

- `workflows`
  - `id`
  - `workflow_id`
  - `name`
  - `description`
  - `filepath`
  - `source`
  - `category`
  - `task`
  - `model_family`
  - `provider`
  - `runs_on`
  - `thumbnail_path`
  - `animated_thumbnail_path`
  - `workflow_hash`
  - `node_count`
  - `link_count`
  - `subgraph_count`
  - `required_nodes_json`
  - `required_models_json`
  - `missing_nodes_json`
  - `missing_models_json`
  - `tags_json`
  - `favorite`
  - `usage_count`
  - `last_loaded_at`
  - `mtime`
  - `size`
  - `created_at`
  - `updated_at`

- `workflow_categories` (optional cache/index only; folder tree remains source of
  truth)
  - `id`
  - `name`
  - `slug`
  - `sort_order`

- optional `workflow_assets`
  - links generated media assets to a workflow row by `workflow_id` or
    `workflow_hash`

Reasoning:

- Avoids breaking code that assumes `assets.kind` is media.
- Keeps workflow-specific filters cheap and explicit.
- Allows thumbnails and model requirements without overloading
  `asset_metadata.metadata_raw`.
- Still allows a compatibility response shaped like grid assets.

### Workflow Library Roots

Support these roots in priority order:

1. ComfyUI user workflows via `/userdata` / `/v2/userdata` when available.
2. Local ComfyUI user folder fallback, usually `ComfyUI/user/<user>/workflows`.
3. Custom-node `example_workflows` as read-only entries under a separate
  category in Workflow scope.

Do not write into arbitrary paths unless the existing write-access, CSRF, and
path guard stack allows it.

### API Surface

Add Majoor routes under `/mjr/am/workflows/*`:

- `GET /mjr/am/workflows`
  - list workflows with filters, sorting, paging
- `GET /mjr/am/workflows/{id}`
  - workflow detail, parsed metadata, nodes, model requirements
- `GET /mjr/am/workflows/{id}/content`
  - safe JSON content fetch for load/inspect
- `POST /mjr/am/workflows/save-current`
  - save a posted frontend workflow JSON into the workflow library
- `POST /mjr/am/workflows/import`
  - import uploaded or referenced workflow JSON
- `POST /mjr/am/workflows/{id}/rename`
- `POST /mjr/am/workflows/{id}/categorize`
- `POST /mjr/am/workflows/{id}/thumbnail`
- `POST /mjr/am/workflows/{id}/duplicate`
- `DELETE /mjr/am/workflows/{id}`

Also extend existing list route:

- `GET /mjr/am/list?scope=workflow`
  - returns workflow-card shaped items for the current grid

### Frontend Host Bridge

Add workflow host operations behind `ui/app/comfyApiBridge.ts` or
`ui/app/hostAdapter.ts`:

- read current graph/workflow safely
- serialize current workflow
- load workflow into ComfyUI using feature-detected public APIs first
- fetch ComfyUI `/workflow_templates` and `/userdata` only through
  `fetchComfyApi()`
- check `/object_info` and `/models` for missing requirements

Vue components must receive data/actions through props or stores. They should
not call `window.app`, `globalThis.app`, `LiteGraph`, canvas, or graph objects
directly.

### Card UX Contract

Workflow card fields should be normalized before Vue rendering:

- `id`
- `kind: "workflow"`
- `filename`
- `display_name`
- `description`
- `thumbnail_url`
- `animated_thumbnail_url`
- `task`
- `model_family`
- `provider`
- `runs_on`
- `node_count`
- `subgraph_count`
- `missing_nodes_count`
- `missing_models_count`
- `tags`
- `mtime`
- `favorite`
- `usage_count`

Card behavior:

- show image thumbnail by default
- if animated preview exists, play on hover or respect existing video autoplay
  grid setting
- show task/model/provider chips
- show missing dependency warning chip
- primary click opens detail/preview, not destructive load
- explicit action button loads workflow into ComfyUI, preferring a new workflow
  tab when host API allows it

### Classification Heuristics

Use a deterministic classifier first, then allow user overrides.

Task detection:

- `T2I`: text/prompt nodes + image save nodes, no image/video input dependency
- `I2I`: image loader/input nodes feeding sampler/edit/upscale pipelines
- `I2V`: image input plus video-generation/video-combine nodes
- `T2V`: prompt plus video-generation/video-combine nodes
- `Video Edit`: video loader plus video output
- `Image Edit`: inpaint/control/edit/provider API nodes
- `Upscale`: upscaler/model upscale nodes
- `Audio`: audio loader/output/tts/music nodes
- `3D`: mesh/3D/model loader/export nodes

Model family detection:

- inspect node class names, widget values, model filenames, and loader nodes
- include known families such as `Qwen`, `Flux`, `Wan`, `Seedance`, `LTX`,
  `SDXL`, `SD1.5`, `Hunyuan`, `Kling`, `Veo`, `Grok`, etc.
- keep classifier rules data-driven so new model families can be added without
  rewriting UI code

Dependency detection:

- node classes from workflow JSON vs `/object_info`
- model filenames from loader widgets vs `/models/{folder}` where feasible
- provider/API nodes marked separately from local model requirements

Subgraph requirement:

- When parsing workflow JSON, include native subgraphs:
  - root graph from `app.rootGraph`, `app.graph.rootGraph`, `app.graph`, or
    `app.canvas.graph`
  - `rootGraph.subgraphs`
  - `node.subgraph` when `node.isSubgraphNode?.()` or `node.subgraph` exists
  - serialized `workflow.definitions.subgraphs`
- Qualify node IDs by graph/subgraph identity because IDs are not globally
  unique across subgraphs.

## Implementation Checklist

### Phase 0 - Discovery Spike

- [ ] Fetch and inspect current ComfyUI `/workflow_templates` payload shape.
- [ ] Fetch and inspect current ComfyUI `/v2/userdata?dir=workflows` behavior on
  stable and nightly builds.
- [x] Confirm frontend load workflow public API names in current
  `ComfyUI_frontend`.
- [x] Confirm whether saved workflows live under `user/<user>/workflows` in the
  target install and whether multi-user mode changes that path.
- [x] Inventory local workflow JSON examples and thumbnail conventions.
- [x] Decide whether custom-node `example_workflows` should appear read-only in
  the Workflow tab or stay delegated to ComfyUI Templates.

### Phase 1 - Backend Domain

- [x] Add DB migration for workflow library tables and indexes.
- [x] Add `features/workflows/models.py` for normalized workflow records.
- [x] Add `features/workflows/parser.py` for workflow JSON shape parsing,
  including subgraph traversal.
- [x] Add `features/workflows/classifier.py` for task/model/provider/runs-on
  classification.
- [x] Add `features/workflows/service.py` for list/detail/import/save/update.
- [x] Add path guards for workflow JSON and thumbnail files.
- [x] Add write operations behind existing CSRF/write-access/security gates.
- [x] Add audit logging for save/import/rename/categorize/thumbnail/delete.
- [x] Add rate limits for list, import, save, and delete operations.
- [x] Add thumbnail serving route with JSON/media content-type hardening.

### Phase 2 - Backend Routes

- [x] Add `routes/handlers/workflows.py`.
- [x] Register workflow routes in `routes/route_catalog.py`.
- [x] Extend `mjr_am_backend/routes/search/listing_endpoint.py` to accept
  `scope=workflow`.
- [x] Add `listing_workflow_scope.py` or equivalent scoped handler.
- [x] Normalize workflow list results into grid-compatible card payloads.
- [x] Add filters: `workflow_task`, `workflow_model`, `workflow_provider`,
  `runs_on`.
- [x] Add filters: `missing`, `favorite`, `tag`.
- [x] Add sort keys: `workflow_default`, `name`, `mtime_desc`, `task`,
  `model_family`, `usage_count`, `last_loaded_at`.
- [x] Add tests for invalid paths, bad JSON, missing thumbnail, and remote
  write denial.

### Phase 3 - Frontend API Client

- [x] Add workflow endpoints to `ui/api/endpoints.ts`.
- [x] Add typed client methods in `ui/api/client.ts` or a workflow-specific API
  module.
- [x] Add `buildWorkflowThumbnailURL()` and avoid using ComfyUI `/view` for JSON
  files.
- [x] Add frontend fetch tests for query construction and error mapping.

### Phase 4 - Scope Integration

- [x] Add `tab.workflow` and `tooltip.tab.workflow` i18n entries.
- [x] Add Workflow button in `ui/features/panel/views/tabsView.ts`.
- [x] Extend allowed scopes in `scopeController.ts`.
- [x] Update `panelStateBridge` tracked state for workflow filters.
- [x] Ensure `gridController.ts` writes `mjrScope=workflow` and workflow filter
  datasets before reload.
- [x] Disable execution stack grouping for `workflow` scope unless explicitly
  needed.
- [x] Update status/summary text for workflow counts.
- [x] Add tests for scope switching and stale custom-root state reset.

### Phase 5 - Workflow Cards

- [x] Add a dedicated `WorkflowCardInner.vue` or branch safely inside
  `AssetCardInner.vue` when `kind === "workflow"`.
- [x] Render static thumbnail, animated preview, graph-map fallback, or icon
  fallback.
- [x] Render task/model/provider/runs-on chips.
- [x] Render dependency warning state.
- [x] Add card action buttons: load, inspect, favorite, menu.
- [x] Keep card dimensions stable with existing virtual grid constraints.
- [x] Add Vue tests for cards with image thumbnail, animated thumbnail, missing
  dependency warning, and no-thumbnail fallback.

### Phase 6 - Workflow Load And Save

- [x] Add bridge method to serialize the current ComfyUI workflow.
- [x] Add bridge method to load a workflow into ComfyUI using feature detection.
- [x] Add "Save current workflow" action in the Workflow tab toolbar/menu.
- [x] Add "Load workflow" card action with confirmation if current graph is
  dirty and ComfyUI exposes a reliable dirty-state signal.
- [x] Increment usage stats and `last_loaded_at` after successful load.
- [x] Add fallback path: download/open JSON if host load API is unavailable.
- [x] Add tests with mocked ComfyUI app/API surfaces.

### Phase 7 - Filters And Organization

- [x] Add task filter menu with common buckets (`T2I`, `I2I`, `I2V`, `T2V`,
  `Image Edit`, `Video Edit`, `Upscale`, `Audio`, `3D`).
- [x] Add model-family filter menu, populated from indexed workflows.
- [x] Add runs-on filter (`local`, `api`, `cloud`, `unknown`).
- [x] Add category editor and category sidebar/list if needed.
- [x] Add drag/drop or menu action to move workflow between categories.
- [x] Add tag support if workflow library should share existing tag UI.
- [x] Add search over name, description, tags, model family, node classes, and
  raw model filenames.

### Phase 8 - Thumbnails

- [x] Detect same-name thumbnail files next to workflow JSON.
- [x] Allow user to select existing media asset as thumbnail.
- [x] Allow first linked output by `workflow_id` / `workflow_hash` as suggested
  thumbnail.
- [x] Add optional animated preview support (`webp`, `gif`, `mp4`) with existing
  grid autoplay setting.
- [x] Add fallback graph-map screenshot generation only if it can be done without
  heavy server-side rendering.
- [x] Harden thumbnail serving to image/video extensions only.

### Phase 9 - Validation And QA

- [x] Python tests for parser/classifier/subgraph traversal.
- [x] Python tests for DB migration and workflow route security.
- [x] Python tests for `/mjr/am/list?scope=workflow`.
- [x] JS tests for tab/scope integration.
- [ ] Vue tests for workflow cards and filters.
- [x] Bridge tests for save/load with stable and nightly ComfyUI API mocks.
- [x] Run `python scripts/run_changed_quality_gate.py`.
- [x] Run `npm run lint:js`.
- [x] Run targeted `vitest` files.
- [x] Run `npm run build` and update `dist/`.
- [ ] Manual test in ComfyUI stable.
- [ ] Manual test in ComfyUI nightly.

## Risks And Mitigations

- **ComfyUI frontend API drift**
  - Mitigation: all host calls go through `comfyApiBridge.ts` /
    `hostAdapter.ts`, with feature detection and fallback download/open modes.

- **Workflow file location differs by user mode**
  - Mitigation: prefer `/userdata` / `/v2/userdata`; filesystem fallback only
    when safely resolved.

- **Saved workflow JSON schemas vary**
  - Mitigation: parser accepts root workflow, API prompt shape, frontend graph
    shape, and `definitions.subgraphs`; unknown fields are preserved.

- **Media grid assumptions break on JSON rows**
  - Mitigation: use dedicated workflow tables and normalize to card payloads,
    instead of storing JSON as regular media `assets`.

- **Dependency checks become slow**
  - Mitigation: cache `/object_info` and `/models` snapshots with TTL; classify
    on index, not on every card render.

- **Delete/move can damage user workflow libraries**
  - Mitigation: keep existing write guard, CSRF, path root checks, audit log,
    and confirmation UI.

## Open Decisions

- [x] Should custom-node `example_workflows` be shown in the Workflow tab, or
  only in ComfyUI's native Templates browser?
  Decision: show them in Workflow scope under a separate read-only category.
- [x] Should Majoor create a dedicated workflow library folder, or only use
  ComfyUI `user/<user>/workflows`?
  Decision: use ComfyUI `user/<user>/workflows` as the workflow library root.
- [x] Should categories be stored as folders, DB metadata, or both?
  Decision: categories are folder-based (filesystem source of truth).
- [x] Should workflow cards share current rating/tags/collections, or use
  workflow-specific favorites/categories first?
  Decision: use workflow-specific favorites/categories first.

Implementation note: workflow favorites are now persisted via
`POST /mjr/am/workflows/favorite` and reflected in workflow card state.
- [x] Should "load workflow" replace the current graph immediately, open a new
  ComfyUI workflow tab if available, or ask every time?
  Decision: open a new ComfyUI workflow tab when available; otherwise fallback
  to current-canvas import with confirmation when dirty-state is detectable.
- [x] Should thumbnails be manually assigned only, or generated from graph-map /
  first linked output automatically?
  Decision: default thumbnail source is latest linked output by `workflow_id`,
  with optional manual assignment and optional graph-map generation fallback.

## First Implementation Slice

Recommended first slice:

1. Add read-only `scope=workflow` listing from a configured workflow directory.
2. Parse workflow JSON and classify task/model family locally.
3. Add Workflow tab and workflow cards with static thumbnail fallback.
4. Add load workflow action through a bridge with safe fallback.
5. Add save-current/import/delete only after the read-only browser is stable.

This slice proves the UX and parser without introducing destructive operations
or a large migration at the same time.
