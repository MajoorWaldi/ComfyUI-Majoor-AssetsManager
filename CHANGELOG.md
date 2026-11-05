# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### New Features
- **Bulk star rating across a selection**: new batch route `POST /mjr/am/assets/rating` (`{ids, rating}`, max 500 ids, 10 req/min, per-id partial results) and the 0-5 hotkeys plus the grid "Set rating" submenu now rate multi-card selections in one batched, chunked request instead of one request per card (progress toast on large selections, `N rated, M failed` summary on partial failures, single-card behaviour unchanged).
- **Majoor Save Image formats**: `format` now offers `png 16-bit`, `exr` and `avif` (ComfyUI Save Image (Advanced) encoders) with `input_color_space` and AVIF `crf` options. The node also returns its `images` like the core Save Image node.
- **Majoor Save Video formats**: MP4, MKV and WebM containers with H.264 or AV1 (`mp4 (av1)`, `mkv (h264)`, `mkv (av1)`, `webm (av1)`). 10-bit and HDR (HLG / PQ) videos keep their bit depth and colour space. The node returns the encoded `images`.
- **EXR / TIFF / SVG / BMP / AVI / M4V indexing**: these formats are now indexed. EXR and TIFF are served to the viewer as a JPEG preview (EXR tone-mapped from scene-linear to sRGB); add `?original=1` to `/mjr/am/viewer/asset/{id}` for the source file. SVG is served sandboxed.
- **`.opus` audio**: files written by ComfyUI's Save Audio (Opus) are indexed, played and mined for workflow/prompt metadata.
- **Configurable write rate limits**: the single-asset delete cap (`MJR_AM_DELETE_RATE_LIMIT`, default 20) and the rating/tags write cap (`MJR_AM_ASSET_WRITE_RATE_LIMIT`, default 30) are now environment knobs (requests per 60 s window, clamped to 1–10000), so bulk curation on a trusted instance no longer hits `RATE_LIMITED` partway through a multi-card selection. (#273, #276). Thanks @johnbuck.
- **JPEG and TIFF metadata**: ComfyUI/WAS-style `Prompt:` / `Workflow:` EXIF text and A1111 `parameters` are now read from JPEG and TIFF files (previously only PNG, WebP and AVIF).

### Fixed
- **Security alerts**: workflow JSON reads are confined to the configured workflow roots at the read itself (CodeQL `py/path-injection`), and the dev-only `minimatch` is raised to 11.x (Dependabot #34).
- **Missing-file download log**: a `/mjr/am/download` 404 (file deleted or moved outside Majoor) is logged at info level and names the file, instead of a bare warning.
- **Python 3.10 install**: `pillow` is pinned to 13.x on Python 3.11+ and to 12.x on 3.10, where 13 is not available, so `pip install -r requirements.txt` works again there.
- **Sidebar badge counts temp previews**: one generation with a compare/preview node showed a badge of 3. Temp preview files no longer increment the badge.
- **Rating/tag writes no longer pile up duplicate XMP/IPTC entries**: saving tags such as `["cat"]`, `["cat","dog"]`, `["dog"]` in sequence used to append to `XMP:Subject`/`IPTC:Keywords` (and add joined `"a; b"` items) instead of replacing the list, so files accumulated every previous tag set. List values are now written as plain assignments and the rating/tags write no longer copies existing tags back over the new values; after any number of saves the file holds exactly the latest tag set, and PNG `prompt`/`workflow` chunks are preserved. (#272, #275). Thanks @johnbuck.
- **Gen info on modern workflows**: workflow JSON now resolves links inside subgraphs (dict-form links), bridges subgraph inputs/outputs, expands nested subgraphs, keeps linked widgets aligned with `widgets_values` (including the `control_after_generate` value), and names widgets from the live node schema. Sampler detection on ComfyUI's bundled templates goes from 147 to 223 of 224, models from 148 to 224.
- **Sampler selector nodes**: `SamplerEulerAncestral`, `SamplerDPMPP_2M_SDE`, ... now provide the sampler name.
- **Per-output gen info**: when one prompt writes several files from different branches, each file now gets the gen info of the node that produced it.
- **Output nodes**: `SaveAnimatedPNG`, `SaveWEBM`, `SaveSVGNode`, `SaveGaussianSplat`, `SavePointCloud` and the 3D previews are recognised as sinks; model-merging savers such as `ImageOnlyCheckpointSave` no longer are.
- **MKV / WebM metadata**: Matroska uppercases tag names; generation time and execution ids are now read case-insensitively (exiftool and ffprobe paths).
- **AVIF / WebP Majoor keys**: generation time, geninfo override and execution ids stored in EXIF text tags are read back.
- **Single-node prompts** are recognised as prompt graphs.
- **Live asset kind**: `opus`, `aac`, `m4a`, `aiff` and `exr` outputs are classified correctly in the realtime listener.
- **Majoor Save Video** first-frame PNG now honours `--disable-metadata`.
- **Double grid reload**: a global `mjr:reload-grid` event was handled by both the panel and the assets query controller, so every request (for example after each generation) reloaded the grid twice. Only the controller handles it now.
- **Reload during maintenance**: the DB maintenance guard (restore, reset, delete) was bypassed by the controller listener; the grid no longer reloads while maintenance is active.
- **Grid paging rate limit**: `/mjr/am/list` limited the local UI to 50 requests per minute, which paging, prefetch and per-generation reloads could exceed on fast workflows. Local clients are no longer throttled; remote clients still are.
- **Trashed images reappearing as live**: the recursive scan descended into hidden folders such as send2trash's per-volume `.Trash-<uid>` (Unix) and `$RECYCLE.BIN` / `System Volume Information` (Windows), and the internal `_mjr_index`, so deleted images reappeared in the grid after a rescan. The walker now skips hidden and internal folders (shared name list with the watcher); the scan root itself may still sit under a dot-path. (#271, #274). Thanks @johnbuck.
- **Multi-card delete**: the grid menu's "Delete N files..." and the Delete/Backspace key now send multi-card selections through the bulk `assets/delete` endpoint in sequential chunks of 500, instead of one rate-limited single-delete request per card. Rate-limited batches are reported as failed; offending entries named by the server (`meta.missing_ids` / `meta.rejected_ids`, now attached additively to `POST /mjr/am/assets/delete` errors) are dropped and the rest retried with a bounded number of bulk attempts; the per-file fallback only runs when the server names no entry (or the retries run out). The `mjr:assets-deleted` event reports only the ids the server actually deleted. (#277, #280). Thanks @johnbuck.

## [2.5.3] - 2026-09-27

### Fixed
- **`mjr_am_backend.adapters.tools` missing from Registry installs**: `.comfyignore`'s unanchored `tools/` pattern also matched `mjr_am_backend/adapters/tools/`, stripping the ExifTool/FFProbe adapters out of every Registry-published package and causing `ModuleNotFoundError: No module named 'mjr_am_backend.adapters.tools'` at startup. The pattern is now anchored to the repo-root `/tools/` dev-scripts folder only.

### New Features (viewer)
- **Studio viewer (new default main viewer)**: a simpler, modern viewer for reviewing generations — header with navigation and file summary, zoom/pan image stage with transparency checkerboard, a new video/audio player (frame stepping, frame counter, A-B loop, speed, volume, fullscreen, save frame as PNG, auto-hiding controls), an inspector with rating, tags and the same Generation / Workflow / File data as the asset sidebar, and a filmstrip. Keyboard-first (see the viewer tutorial). *Viewer → Use the classic viewer* switches back entirely.

- **Floating viewer: Studio player and refreshed look**: in Simple mode, video and audio now play in the Studio player (compact, width-aware controls; same frame stepping, A-B loop, speed, volume, fullscreen and frame export as the main viewer), keeping the floating viewer's keyboard forwarding, mute/speed persistence and media release. The floating window gets the Studio styling (flat buttons that light up on hover or when active, softer window chrome, neutral stage). Compare modes keep their synchronised players; *Use the classic viewer* also restores the legacy floating player.

- **Studio viewer: every tool of the classic viewer, as a HUD**: a tool rail on the left of the stage brings channels (R/G/B/alpha/luma), exposure and gamma, zebra, histogram / waveform scopes, composition guides (thirds, golden, centre, safe areas), aspect-ratio masks, pixel probe, loupe, copy to clipboard and A/B compare (wipe ↔/↕, side by side, difference, add, subtract, multiply, screen) with B selection, pin and swap. Colour tools run on the GPU and work on playing video; video compare keeps both players in sync. 3D models and the grid's A/B / side-by-side actions now open in the Studio viewer too, and audio files show a live spectrum. New shortcuts: `C`, `B`, `X`, `Z`, `S`, `G`, `P`, `L`, `R`, `Ctrl+C`.

### Removed
- **Classic viewer**: the Studio viewer is now the only main viewer. The classic overlay (toolbar, panzoom, A/B and side-by-side engine, scopes, loupe, probe, grading pipeline, WebGL video processor, filmstrip and its context menu) and about 20 000 lines of code, styles and tests are gone. Everything it did is in the Studio viewer's tool rail; the grid's A/B / side-by-side actions open the Studio viewer with that compare mode on.
- **Viewer settings**: *Use the classic viewer*, *Pan without zoom* and *Disable WebGL video* (classic-only) are removed, with the internal `videoGradeThrottleFps`, `scopesFps`, `metaTtlMs` and `metaMaxEntries` options. Existing values in saved settings are simply ignored.
- The unused *viewerbar* variant of the legacy video controls (the floating viewer's compare modes keep the regular variant).

### Changed
- **Floating viewer: one player everywhere**: A/B, side-by-side and grid compare now also use the Studio player for the primary video / audio (the other slots stay bare, synced elements). The legacy video controls (in/out, Nuke-style bar, ~2 000 lines, their styles and tests) are gone; the asset sidebar keeps its small preview controls. GIF / animated WebP keep their own simple player.

### Fixed (follow-ups)
- **Floating viewer compare modes ignored the Studio player's video**: zoom, pan, exposure / channel tone and the overlay guides only addressed bare media elements, so in A/B, side-by-side and grid the primary video (the Studio player) stayed untouched while the other slots changed. The player's video now takes part in all of them.
- **Floating viewer A/B divider drew over the player controls**: it now stops above the control bar (and extends fully again when the controls auto-hide).
- **Studio compare of different sizes**: B keeps its own aspect ratio instead of being stretched to A's frame (wipe, blend and side by side).
- **Floating viewer topbar button position**: the *Viewer* button sometimes landed at the far end of the actionbar after reloading the interface. The Run group is rendered asynchronously inside the actionbar and its late arrival was never observed; the button now re-anchors next to Run as soon as it appears.
- **Floating viewer A/B hid the player**: with the Studio player on A, the B layer covered the right half of its controls. A now sits on top and only its picture is clipped at the divider, so the controls stay visible and usable everywhere.
- **Light dismiss in the Studio viewer**: clicking the empty area around the image or video (not the picture, a tool, the inspector or the player bar) closes the viewer again, as the classic viewer did. Dragging to pan never closes it.
- **Grid selection after closing the viewer**: the Studio viewer now tells the grid which asset you ended on (selection, scroll and focus), as the classic viewer did.
- **Studio viewer shortcuts after navigating**: moving to another asset focused the tag field, so the next shortcuts were typed into it. The inspector's tag editor no longer grabs focus.
- **Search by part of a file name**: typing `F` (or `flow`) only found names with a *word starting* with it (`Flux…`, `field…`), never `sunflower.png` or `ComfyUI_…`. Single-word searches now also list file names that contain the text (ranked after word matches); `_` and `%` are matched literally. Multi-word and quoted searches are unchanged.
- **Sidecar JSON added after a file was indexed** is now picked up: the watcher maps a new/changed `<file>.json` / `<stem>.json` to its media, invalidates that file's metadata cache and scan journal, and forces a re-extraction (a non-incremental re-index no longer trusts an existing metadata row when the cache was invalidated).
- **Duplicate index rows for one file (Windows)**: rows whose paths differ only by case or separator (left by older versions) are merged at startup, keeping the highest rating, all tags, the stack cover, execution ids and the embedding.
- **Generated feed** drops items deleted from the UI or removed on disk.
- **Floating viewer shortcuts** (`v`, `k`, `l`, `c`) only act when the pointer or focus is in the viewer (or from its pop-out), instead of swallowing those keys page-wide while it is open.
- Types now come from `@comfyorg/comfyui-frontend-types` (dropped the separate `@comfyorg/litegraph` package); removed 5 dead frontend files; fixed an order-dependent backend test that leaked an input-directory override.

### Fixed (search, JSON, viewers)
- **Search errors while typing**: queries such as `at-7`, `(2)`, `AND`, `NOT x`, a single letter or a lone `"` returned "Invalid search query syntax" because every token was filtered out (stopword, 1-char, operator word) and an empty FTS `MATCH` was sent. Search now falls back to the raw words, treats punctuation-only input as browse-all, and keeps non-Latin scripts (Cyrillic, CJK...) that were stripped before; only Latin accents are folded, matching the FTS5 tokenizer.
- **Sidecar JSON for images, videos and audio**: `<file>.<ext>.json` or `<stem>.json` next to a media file now provides its workflow / prompt / generation data when nothing is embedded (previously 3D models only). Embedded metadata always wins; UTF-8 BOM is accepted.
- **Workflow tab listed non-workflows and version snapshots**: every `*.json` under a workflow root became a card, including `.history/<name>/<stamp>.json` version snapshots and arbitrary JSON (settings, node configs). Hidden folders are skipped and only UI graph exports, API prompt graphs and `{workflow}`/`{prompt}` wrappers are listed (`workflow_format`: `ui`/`api`). BOM-prefixed workflows are no longer silently dropped; stale rows are purged (workflow index version 5).
- **API-format workflows opened as an empty canvas**: they are now loaded with ComfyUI's `app.loadApiJson`; `{workflow: ...}` exports are unwrapped.
- **Floating viewer leaked media players**: re-rendering (every generation in Live mode) and disposing only paused videos before detaching them; Chromium caps live media players, so videos could stop playing. Media is now released (src, `<source>`, `load()`), as the main viewer already did.

### Fixed (duplicate stacks)
- **Clicking a duplicate-stack badge froze ComfyUI**: three passes (`displayAssets`, the per-card ref callback `syncRenderedDuplicateCards`, the live-upsert dedupe) each rewrote `_mjrDupStack` / `_mjrDupMembers` on reactive assets read by the grid template, with a fresh array on every pass and conflicting representatives. The ref callback ran on every render (a new closure each time), so every write scheduled another render: an endless update loop (production Vue has no recursion limit). Duplicate stacks are now computed in one place with change-guarded writes, card refs are stable, and the other passes no longer touch these fields.
- **"Corrupted" duplicate stacks**: stacks were also built from the file name alone across folders, so unrelated files sharing a name (e.g. frame grabs `at-7.958s.png` from different videos) were stacked, hidden from the grid and given another file's generation time. A duplicate is now the same name in the same source/root/subfolder only.
- **Duplicates view collapsed back to one card**: the "Duplicates - N copies" view re-grouped its own members; it now lists every copy, using cycle-free copies of the members.

### Fixed (asset sync)
- **Renamed / moved files lost their ratings, tags and collections**: the `assets_fts` triggers ran a plain `UPDATE`/`DELETE` on an external-content FTS5 table, so every filename/subfolder change failed with "database disk image is malformed" (and could start a needless DB recovery). The watcher then fell back to delete + re-index, creating a new asset id. Triggers now use FTS5's `'delete'` command (update trigger limited to `filename, subfolder`); existing databases are repaired and the FTS index rebuilt automatically at startup.
- **Outputs missed after a generation**: ComfyUI calls `on_prompt_end` before it stores the prompt history, so post-execution ingestion could read an empty history and index nothing (prompts queued from the API, another tab or another device). Ingestion now waits briefly for the history entry.
- **Scan prune could wipe user data**: a stat error (offline share, permission hiccup) counted as "file deleted". Like ComfyUI core's reconciler, only a confirmed absence removes an asset, and an unreadable scan root is never pruned. The `pruned` count no longer includes cascade/trigger rows.
- **Stale cards after external deletes/moves**: files removed or moved outside Majoor (watcher, scan prune) now emit `mjr-assets-removed` / `mjr-asset-updated`, so open grids update in place.
- **Background scans never refreshed the grid**: `mjr-scan-complete` now carries `origin` and `needs_refresh`; the grid reloads once when live events could not cover the change, and a finished directory scan shows one ComfyUI core toast ("N new, M removed"). Per-generation index runs stay silent (live cards + sidebar badge).

### Changed (ComfyUI integration)
- **Compat assets API moved to `/mjr/am/compat/assets/*`**: the read-only OpenAPI-aligned surface no longer squats ComfyUI core's `/api` namespace. The old `/api/v2/assets/*` paths are only registered when `MJR_AM_LEGACY_API_V2_ASSETS=1` (deprecated).
- **Python 3.14**: `requires-python` is now `>=3.10, <3.15`; CI runs the full suite on 3.14.
- **Execution tracking without wrapping `api.queuePrompt`**: the floating viewer progress reads the running prompt from ComfyUI's Jobs API (`GET /api/jobs/{id}`), then `/queue` and `/history/{id}` on older cores, driven by websocket events. No more conflicts with other extensions that wrap `queuePrompt`.
- **Optional: hide ComfyUI's native Assets tab** (`Majoor.Integration.HideNativeAssetsTab`, off by default). Uses the official `getSidebarTabs`/`unregisterSidebarTab` API and restores the tab when turned off.
- **Workflow serialization** uses the root graph instead of the async `graphToPrompt()`; dirty state reads the frontend workflow store.
- **Typed aiohttp request keys** (`web.RequestKey`) — no more `NotAppKeyWarning` on aiohttp ≥ 3.13.
- **Notifications on ComfyUI core toasts only**: Majoor now uses the typed ToastManager API (`success/error/info/warning/loading`) instead of the deprecated `add()` (kept as fallback for older frontends). Long operations (DB restore/reset, vector backfill) show one `loading` toast updated in place instead of stacking a toast per step; links become native toast action buttons; in-progress toasts are dismissed on teardown. Toasts no longer disappear if ComfyUI removes `add()`. The Majoor message center stays as a read-only history (release notes, toast log, shortcuts) and no longer pops open by itself.
- **Frontend test typing**: `tsconfig.test.json` now type-checks with 0 errors (was 913) and runs in CI.

## [2.5.2] - 2026-09-27

### Changed
- **Automatic GitHub Releases**: The registry publish workflow now packs the node with `comfy-cli`, cuts a matching GitHub Release with the packed archive attached, and un-drafts it once the Comfy Registry publish succeeds.

## [2.5.1] - 2026-09-04

### New Features
- **KJNodes Model Preview Override in Floating Viewer**: Added live display support for previews emitted by KJNodes' **Model Preview Override** node during generation. MFV accepts JPEG, PNG, animated WebP, and MP4 payloads, preserves node, step, dimension, and FPS context, prioritizes the KJNodes stream over duplicate ComfyUI binary previews for the active node, and safely returns to the standard preview stream afterward. The new **Show KJNodes Model Preview Override in MFV** setting is available under Settings → Majoor Assets Manager → Floating Viewer and is enabled by default; the MFV **KSampler Preview** toggle must also be enabled.
- **Top bar Viewer button toggle**: New **Show Viewer button in the top bar** setting (Settings → Majoor Assets Manager → Floating Viewer, enabled by default) to show or hide the Viewer toggle button in the ComfyUI top bar. The change applies live and the `V` shortcut keeps working when the button is hidden.
- **Folder browsing in Input / Output scopes** (#188): Subfolders under the Input and Output roots can now appear as folder cards in the grid — open a folder to browse its content, navigate back with the `..` parent entry, drag-and-drop assets onto a folder card to move them, and create subfolders from the right-click menu. Opt in with the new **Show folders in Input / Output panels** setting (Settings → Majoor Assets Manager → Browser, disabled by default — the grid keeps the classic flat listing until enabled). Thanks @bsawang.
- **Collect Files**: New right-click action and details-sidebar button that bundles an asset, its workflow JSON, the traced prompt text (positive/negative), and every media input referenced by the workflow into a `{asset}_collected.zip` created next to the file, with a manifest listing each input and model path. Falls back to `output/_mjr_collected/` when the asset folder is not writable. See `docs/COLLECT_FILES.md`.

### Fixed
- **Prototype-pollution guard in bundled state patching**: Upgraded Pinia to 4.0.2 so its recursive state merge uses own-property checks for both source and destination objects, resolving CodeQL alert #96 in the generated Vue vendor bundle.
- **Majoor Save filename_prefix placeholders** (#194): `%date:yyyyMMdd%`-style placeholders (and `%NodeName.widget%` references) in the `filename_prefix` of Majoor Save Image / Majoor Save Video were written literally into filenames because ComfyUI's frontend only resolves them for its own core save nodes. Placeholders are now resolved on the frontend for Majoor save nodes (matching core node semantics), with a server-side `%date:...%` fallback in the nodes themselves so API-driven workflows are covered too.
- **Floating Viewer audio compare sync**: audio players are now time/play/volume/rate-synchronized in A|B, side-by-side, and grid compare modes, matching video behaviour.
- **Floating Viewer audio player visuals**: the unified audio player now shows the same styled backdrop (gradient + filename) as the simple player instead of an empty area behind the controls.
- **Top bar Viewer button stability**: the button slot position check now ignores stray text/comment nodes emitted by the host UI, preventing needless DOM re-insertion cycles.
- **Full-text search on prompts restored** (#175): since the v18/v19 tag-normalization migrations, the search index column `metadata_text` was never populated, so prompts, negative prompts, model/LoRA names, and Majoor GenInfo overrides (including custom info blocks) were not searchable. The indexer now persists this text on every metadata write, and migration v21 automatically backfills already-indexed assets on startup — no index reset required.
- **"Allow Remote Full Access" now effective with a configured token** (#167): an auto-generated API token always exists after first startup, which silently disabled the `Allow Remote Full Access` toggle — remote LAN clients without a token were blocked with "Write access is blocked" spam and no working opt-out. The toggle (and `MAJOOR_ALLOW_REMOTE_WRITE=1`) now permits tokenless remote writes even when a token is configured, unless `Require Token For All Writes` is enabled.
- **False-positive route collision warning** (#167): the startup warning `Potential route path collisions detected before registration: /embeddings` was caused by comparing ComfyUI's own core routes against themselves via the shared route table. Collision detection now only considers Majoor-owned route paths.

## [2.5.0] - 2026-07-09

### New Features
- **LTX Director and Ideogram 4 workflow metadata**: Added generation info support for LTX Director and Ideogram 4 workflows, including dedicated prompt extraction and sidebar display.
- **Viewer playback speeds**: Added 3x, 5x, and 10x playback speeds.
- **Generation source file actions**: Added a context menu for source files in the generation sidebar, with viewer, floating viewer, folder, and asset-loading actions.
- **Find Similar action menu**: Replaced the direct Find Similar button with a popover menu for Find Similar, Find Duplicate, Generated with same save node, and Generated from same workflow.
- **Experimental JPEG XL support**: Added optional `.jxl` indexing, previews, drag-and-drop, viewer support, MIME handling, and a persistent setting. JPEG XL support remains disabled by default.
- **Native subgraph support in Graph Map**: Added recursive expansion of nested ComfyUI subgraphs, including subgraphs that reference root-level definitions.
- **Extended file technical metadata**: Added bit depth, pixel format, encoder, and color-space information to the asset sidebar.

### Improved
- **Asset sidebar UI**: Polished the asset sidebar generation info layout and workflow metadata presentation.
- **Video viewer rendering**: Improved video viewer rendering behavior.
- **Toolbar active states**: Popover and settings buttons now highlight consistently while their menu/dialog is open, including Messages and updates, Find Similar, Filter, Sort, Collections, Pinned folders, and Settings.
- **Message history UX**: Automatically closes the Messages and updates history panel after an auto-opened tracked process completes, while preserving manually opened history panels.
- **Majoor Save metadata persistence**: Persisted Asset ID, Job ID, Source Node, Node Type, and Workflow ID in saved asset metadata alongside generation time.
- **Runtime metadata ingestion**: Outputs now receive prompt, workflow, GenInfo, job, and source-node metadata directly from ComfyUI history after execution.
- **Rodin 3D output grouping**: Rodin GLB packages and previews now inherit execution context and can be stacked by job.
- **Output color management**: Majoor Save images now include an sRGB ICC profile, while MP4 output is explicitly tagged as BT.709.
- **Generation prompt selection**: GenInfo prompts now take precedence over stale paths or denormalized prompt values.
- **LTX Director prompt extraction**: Global prompts are now extracted from timeline metadata.
- **Workflow thumbnail matching**: Matching now relies on workflow hashes instead of potentially ambiguous workflow IDs.
- **Top-bar Viewer integration**: Improved MFV button placement and compatibility checks for supported ComfyUI top-bar structures.
- **Graph Map navigation**: Added deeper zoom support for inspecting dense nested subgraphs.

### Fixed
- **Tags shortcuts**: Fixed tags shortcut behavior.
- **Viewer playback state**: Fixed playback speed persistence and arrow-key navigation.
- **Floating Viewer controls**: Fixed Floating Viewer mute/speed persistence and rating hotkeys. Thanks @Aivanis.
- **Generation prompt tracing**: Fixed a generation prompt tracing bug.
- **Generation source file viewer loading**: Fixed source file preview/viewer loading paths that could show "Failed to load image".
- **Filter popover dismissal**: Fixed the Filter popover not closing when clicking outside.
- **Viewer generation info stability**: Fixed intermittent Generation Info rendering in the viewer.
- **Open in folder action**: Fixed requests so they work with either a filepath or an asset ID.
- **Floating Viewer loading**: Fixed loader initialization and retry behavior covered by new regression tests.
- **Subgraph workflow parsing**: Prevented prompt nodes from being mixed with serialized subgraph UI nodes.
- **Generation information display**: Requested metadata rows now remain visible when their value is unavailable.

---

## [2.4.9] - 2026-06-25

### Improved
- **Graph Map UI and Parsing**: Improved Graph Map node UI and widget parsing for clearer node inspection and more reliable node details. See [docs/GRAPH_MAP.md](docs/GRAPH_MAP.md).
- **GenInfo Metadata Parsing**: Improved metadata parsing for GenInfo display accuracy and consistency. See [docs/VIEWER_FEATURE_TUTORIAL.md](docs/VIEWER_FEATURE_TUTORIAL.md) and [docs/MFV_GUIDE.md](docs/MFV_GUIDE.md).
- **Quick Media Filters**: Added direct filter shortcut buttons to quickly display Images, Videos, Audio, or 3D assets. See [docs/SEARCH_FILTERING.md](docs/SEARCH_FILTERING.md).
- **Drag and Drop Features**: Improved drag-and-drop behavior, node compatibility handling, and clean export workflow. See [docs/DRAG_DROP.md](docs/DRAG_DROP.md).

### New Features
- **Configurable Workflow Roots**: Added a Settings option for Workflow tab roots and a Workflow-tab toolbar button to pick the saved workflow root directly beside the save/import actions. See [docs/WORKFLOWS.md](docs/WORKFLOWS.md) and [docs/SETTINGS_CONFIGURATION.md](docs/SETTINGS_CONFIGURATION.md).
- **Workflow Tab Library**: Added a dedicated Workflow tab guide and documented the full workflow library behavior: save/import current workflows, load them back into ComfyUI, inspect them in Graph Map, organize categories, set thumbnails, and edit workflow metadata. See [docs/WORKFLOWS.md](docs/WORKFLOWS.md).
- **Majoor GenInfo Override Node**: Added a new `Majoor GenInfo Override` node to inject custom/manual GenInfo data through Majoor Save nodes. See [docs/CUSTOM_NODES.md](docs/CUSTOM_NODES.md).

### Message Center
- **Workflow Tab Guide Announcement**: Added a built-in Message Center entry linking directly to the Workflow tab guide.

### Refactoring, Code Quality & Fixes
- **Frontend TypeScript Refactor**: Continued major UI code refactoring to TypeScript to align with ComfyUI frontend evolution. See [docs/MIGRATION_TS_TRACKER.md](docs/MIGRATION_TS_TRACKER.md).
- **Easier AI Settings Access**: Improved access to AI settings via a dedicated button in the Assets Manager panel and in the Floating Viewer. See [docs/SETTINGS_CONFIGURATION.md](docs/SETTINGS_CONFIGURATION.md).
- **ComfyUI Frontend Integration**: Improved Majoor Assets Manager integration with the ComfyUI frontend for smoother interoperability and UI consistency. See [docs/FRONTEND_LIFECYCLE_CONVENTIONS.md](docs/FRONTEND_LIFECYCLE_CONVENTIONS.md).
- **Code Improvements and Bug Fixes**: General code improvements and multiple bug fixes across UI and integration layers.

---

## [2.4.8] - 2026-05-18

### Improvements & Code Quality
- **Code Corrections and Improvements**: Applied frontend code corrections, interaction cleanup, and targeted maintainability improvements across the Assets Manager UI.
- **Settings Access and Clarification**: Clarified settings behavior and improved access to settings from the panel gear icon and the Floating Viewer.

### Drag and Drop
- **Drag and Drop Bug Fixes and Clarifications**: Fixed regressions in drag-and-drop handling, clarified canvas/node drop behavior, staging behavior, visual feedback, and interaction with ComfyUI's native workflow drop handling.

### Graph Map & Floating Viewer
- **Workflow Inspection in Floating Viewer**: The Floating Viewer can now inspect embedded workflows without opening them on the canvas.
- **Graph Map Node Actions**: Added workflow graph inspection tools for copying nodes, copying node attributes, and transferring node attributes to a similar selected node on the ComfyUI graph canvas.

### Documentation
- **Graph Map Guide**: Added a dedicated Graph Map documentation page with screenshots, workflow map usage notes, and a focused explanation of node detail actions.
- **README Presentation**: Added Graph Map presentation content and screenshot references to the main README.

### Message Center
- **Graph Map Announcement**: Added a built-in Message Center entry linking directly to the Graph Map guide.

---

## [2.4.7] - 2026-05-01

### Performance
- **Grid Performance Improvements**: Improved grid responsiveness, scrolling stability, and asset loading behavior for large libraries.

### Major Features — Majoor Floating Viewer
- **MFV is now an advanced viewer**: The Floating Viewer is no longer a light viewer only; it now provides a richer workflow surface for inspecting, comparing, and controlling generation assets.
- **Node Stream**: Follow selected node previews directly inside the Floating Viewer, including supported live preview sources.
- **Node Parameters**: Open the workflow node sidebar from the viewer and inspect node parameters without leaving the MFV.
- **Edit Nodes from the Viewer**: Edit node widgets directly inside the Floating Viewer, including prompts and common workflow parameters.

### Toolbox
- **New Toolbox Tools**: Added new tools to the toolbox for faster access to common asset and workflow operations.

### Code Quality & Fixes
- **Code Corrections**: Applied code corrections and cleanup across the frontend/backend integration surface for better maintainability.

---

## [2.4.6] - 2026-04-20

### Bug Fixes & Performance
- **Bug Fixes**: Various bug fixes
- **Performance and Fluidity**: Performance and fluidity improvements

### Improved
- **Concatenate Support**: Improved concatenate support for default and custom nodes — by Forsion07

### API & Integrations
- **Api Node Helpers**: Add support helpers for Api Node
- **Ernie Image Helper**: Add support helper for Ernie Image

### Settings & Defaults
- **Live Stream disabled by default**: MFV Live Stream (green button) is now OFF by default; can be re-enabled permanently via Settings → Majoor Assets Manager › Viewer
- **Live Stream & KSampler Preview configurable by default**: Both toggles can be set as the default state via Settings → Viewer; when Live Stream is active, clicking a Load Image node or a generation end automatically opens the Floating Viewer

---

## [2.4.5] - 2026-04-10

### New Features — Floating Viewer
- **Multi-Pin References (A/B/C/D)**: Pin up to 4 images simultaneously with toggle buttons; pinned slots hold their content while unpinned slots follow Live Stream
- **Node Parameters Sidebar**: View and edit workflow node widgets (prompts, seeds, samplers) directly inside the Floating Viewer
- **Run Button in Viewer**: Queue prompt from the viewer toolbar without switching back to the canvas
- **Expandable Text Areas**: Collapse/expand long text inputs with a toggle button
- **Sidebar Position Setting**: Choose right, left, or bottom placement for the Node Parameters sidebar via Settings; applies immediately without reload
- **Toolbar Layout**: Run and Node Parameters buttons placed at far right for ergonomic access
- **Topbar MFV Button**: New Viewer toggle button in the ComfyUI top action bar — open or close the Floating Viewer without opening the sidebar; highlights when the viewer is active

### New Features — Custom Nodes
- **Majoor Save Image 💾**: Drop-in replacement for the built-in SaveImage node that persists `generation_time_ms` in PNG text chunks alongside prompt and workflow metadata; supports auto-detection of generation time from the prompt lifecycle
- **Majoor Save Video 🎬**: Save IMAGE batches or VIDEO inputs as MP4 (h264 via PyAV), GIF, or WebP; embeds `generation_time_ms`, prompt, and workflow directly in the MP4 container metadata; optional PNG sidecar for first frame; supports audio muxing and configurable CRF quality
- **Generation Time Extraction**: The metadata extraction pipeline now reads `generation_time_ms` from PNG text chunks and MP4 container format tags, so the value survives index resets and re-indexing

### Improved
- **MFV Gen Info Overlay Placement**: Keep Gen Info as the original overlay and automatically place it above the inline player controls when the player is visible
- **MFV Simple Player Keyboard Controls**: Support focused playback shortcuts with Space for play/pause and Left/Right for frame-by-frame stepping

### Bug Fixes & Issue Resolutions
- **Realtime Vector Indexing**: Fixed newly generated assets not always entering automatic vector indexing after save/index events
- **Grid Reload Stability**: Fixed unnecessary full refreshes and parasitic reloads triggered by ambiguous settings sync and window events
- **Pagination Freeze at Bottom**: Fixed cases where scrolling could stall when a page returned results that were fully deduplicated or hidden
- **MFV Video Overlay Overlap**: Fixed Gen Info overlapping inline video player controls in simple player mode
- **GenInfo Pipeline Accuracy**: Fixed sampler pass deduping and rgthree Any Switch tracing so multi-pass workflow metadata stays in the correct order

---

## [2.4.4] - 2026-04-05

### Improved
- Refactor frontend in Vue to match ComfyUI frontend evolution

### Documentation
- Sync documentation with the current repository layout and commands
- Update published documentation and user guide to version 2.4.4
- Refresh plugin compatibility examples and reference material

---

## [2.4.3] - 2026-03-29

### Improved
- Improve assets metadata parsing
- Add Grid Compare capability in floating viewer up to 4 Assets
- Add ping pong loop in main Viewer player
- Add job id and stack id in DB for better assets management
- Stack assets generated from same workflow job with same job ID
- Code refactor for maintainability
- Various bug fixes
- Add generated feed feature
- Add lite version of grid in bottom tab

---

## [2.4.2] - 2026-03-17

### Major Features

#### 3D Model Viewing Support
- **Basic 3D Model Thumbnail Rendering** — Implemented 3D model thumbnail rendering with fallback icon support
- **Viewer Mode Selection** — Updated viewer logic to handle 3D model assets
- **3D Model Interactions** — Added checks for 3D model interactions in the viewer
- **Drag & Drop Extension** — Extended drag & drop support to include 3D model assets

#### Toast History Tab
- **History Tab Implementation** — Added new history tab to message popover alongside messages and shortcuts
- **Recent Toast Notifications** — Display recent toast notifications in the history panel
- **Clear History** — Included clear button to remove toast history
- **Unread Indicator** — Added unread indicator to history tab when there are new entries
- **Layout Updates** — Updated message popover layout and styling to accommodate new tab

#### Enhanced Floating Viewer
- **Document Picture-in-Picture** — Implemented PiP for always-on-top secondary monitor support
- **Pop-out Functionality** — Enhanced with fallback to `window.open()` for compatibility
- **Transitions & Interactions** — Refined pop-in/out transitions and user interface interactions
- **Media Loading** — Optimized media loading and error handling for various scenarios
- **Keyboard Shortcuts** — Improved keyboard shortcut integration and behavior
- **CSS Animations** — Updated animations and z-index hierarchy for better visual presentation
- **Backend Logging** — Enhanced logging for request handling

### Bug Fixes & Resilience

#### Stability Improvements
- **Card.js Timeout Leak** — Fixed potential timeout leak in Card.js
- **AssetsManagerPanel Reload** — Enhanced reload logic for better stability
- **FloatingViewer Drag** — Optimized drag interactions
- **Plugin Loader** — Refined plugin loader and manager for hot-reload safety
- **Registry Configuration** — Improved configuration handling
- **File Existence Checks** — Removed redundant file existence checks in assets_impl
- **Asset Renaming** — Implemented rate limiting for asset renaming

---

## [2.4.1] - 2026-03-09

### Added
- Added CLIP-based semantic search engine with AI toggle, prompt alignment scoring in GenInfo panel, smart collection suggestions, and auto-tagging pipeline
- Added support for rgthree and easy use custom node parsing
- Added shortcut guide tab to message popover in panel
- Added linked model entry function for upscaler model extraction

### Fixed
- Fixed download form viewers issues
- Fixed workflow filter bugs
- Fixed MFV memory leaks and hot-reload listener accumulation
- Fixed SQL placeholder count unbounded in generation-time batch query (capped at 500)
- Fixed numpy array dtype consistency (float32) in vector operations

### Improved
- Enhanced compare overlay functionality
- Improved text search performance and accuracy
- Enhanced geninfo extraction for upscalers and samplers
- Enhanced tag handling and agenda calendar functionality
- Refactored upscaler model extraction logic

### Documentation
- Added comprehensive AI features guide and new documentation

## [2.4.0] - 2026-02-28

### Major Features

#### Majoor Floating Viewer (MFV) — NEW! 🎯
A lightweight floating viewer panel for real-time generation comparison:
- **Live Stream Mode** — Automatically follows new generations from Save/Load nodes
- **Compare Modes** — Simple, A/B Compare, and Side-by-Side views
- **Real-time Preview** — Watch generations as they complete
- **Node Tracking** — Click on LoadImage/SaveImage nodes to preview their content
- **Pan & Zoom** — Mouse wheel zoom and click-drag pan for detailed inspection
- **Gen Info Overlay** — Display prompt, seed, model, and LoRA for each generation
- **Draggable Panel** — Position anywhere on screen, resizable
- **Keyboard Shortcuts** — Quick mode switching and controls

### Refactoring & Code Quality

#### Major Code Refactoring
- **Inline Styles → CSS Classes** — Moved all static inline styles to theme-comfy.css
- **Component Separation** — Better modularization of viewer components
- **Improved Error Handling** — Added proper error logging and user feedback
- **Code Cleanup** — Removed dead code, improved naming, added documentation
- **Performance Optimization** — Reduced redundant parsing, improved caching

### Bug Fixes

#### Critical Fixes
- **CSS File Corruption** — Fixed null character corruption in theme-comfy.css
- **Gen Info Display** — Fixed field extraction and HTML escaping
- **Memory Leaks** — Fixed event listener cleanup in viewer components
- **Race Conditions** — Fixed async hydration in Floating Viewer
- **Duplicate CSS Rules** — Removed duplicate fullscreen rules

#### General Stability
- Multiple bug fixes across indexing and metadata parsing
- Fixed viewer overlay lifecycle management
- Fixed dropdown positioning and event handling
- Fixed cache invalidation issues

### Linux Support

#### Cross-Platform Compatibility
- **Full Linux Support** — Tested on Ubuntu 22.04+, Fedora, Debian
- **Path Handling** — Fixed Windows-style path separators for Linux
- **File Permissions** — Proper handling of Linux file permissions
- **Case Sensitivity** — Fixed case-sensitive file system issues
- **Dependencies** — Updated requirements.txt for Linux compatibility

### Test Coverage

#### New Test Suites
- **Unit Tests** — Added tests for geninfo parser, metadata extraction
- **Integration Tests** — Viewer component testing
- **Frontend Tests** — Vitest configuration for JavaScript testing
- **Backend Tests** — pytest for Python backend services
- **CI/CD** — GitHub Actions workflows for automated testing

#### Test Files Added
- `tests/parser/test_geninfo_flux.py` — GenInfo parser tests
- `tests/features/test_sampler_tracer_extra.py` — Sampler tracer tests
- `tests/features/test_role_classifier.py` — Role classifier tests
- `tests/metadata/test_extractors_helpers.py` — Metadata extractor tests
- `tests/database/test_schema_heal.py` — Database schema tests
- `vitest.config.mjs` — Frontend test configuration

### Technical Changes

#### Dependencies
- Added Vitest for frontend testing
- Updated mypy configuration for better type checking
- Added pre-commit hooks for code quality

#### Architecture
- Separated viewer concerns (FloatingViewer, floatingViewerManager, LiveStreamTracker)
- Improved metadata pipeline (genInfo.js hydration)
- Better event-driven architecture for viewer lifecycle

---

## [2.3.3] - 2026-02-13
### Added / Improved
- Enhanced metadata extraction for the AC-Step (Ace Step) custom node.
- Drag & Drop: stage dropped audio files to the node input (audio file staging).
- Added new filtering/sorting capabilities:
  - Filter by workflow type (I2I, I2V, T2I, T2V, V2V, FLF, UPSCL, INPT, TTS, A2A).
  - Filter by file size (weight).
  - Filter by image resolution/size.
- Added a settings option to configure the output path directly from the UI.
- Added grid settings to configure video preview behavior.
- Refactored frontend/backend integration paths for better ComfyUI compatibility.
### Fixed
- Fixed drag & drop issues for images and videos.
- Enhanced index status functionality and various bug fixes.
- Fixed multiple UI/filtering issues and improved overall stability.

---

## [2.3.2] - 2026-02-09
### Added / Improved
- Added language support for Chinese, Korean, Russian, Hindi, Spanish, French, and English. 🌍
- Added audio support for workflows such as AC-STEP, Stable Audio, and TTS. 🎵
- Improved metadata extraction. 🧠
- Improved UI design. 🎨
- Added database management. 🗄️

### Fixed
- Fixed multiple bugs across the extension. 🐛

---

## [2.3.1] - 2026-02-07
### Added / Improved
- UI parameters for **API token** and remote access: added settings in the UI to configure an API token and enable remote access to the Assets Manager (secure-by-default). 🔐

### Notes
- This is a non-breaking, minor patch focused on remote access configuration and UI exposure of token settings.

---

## [2.3.0] - 2026-02-07
### Added / Improved
- Improved GenInfo display in the Viewer: side-by-side generation info panel and clearer parameter presentation. 🔧
- Improved metadata parsing for complex workflows (better handling for nested/custom node graphs). 🧩
- Viewer enhancements: side-by-side generation info and better workflow minimap rendering. 👀
- Added "Reset Index" action to re-scan and rebuild the index. ✅
- Configurable settings for card display and grid layout (card size, density, details). ⚙️

### Fixed
- Multiple bug fixes across indexing, metadata parsing, and viewer interactions. 🐛

---

For previous history, see earlier tags/releases on GitHub.
