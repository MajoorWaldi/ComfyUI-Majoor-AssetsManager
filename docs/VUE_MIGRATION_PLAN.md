# Vue Migration Plan — ComfyUI-Majoor-AssetsManager

> Last updated: 2026-04-01
> Status: **Phases 0–7 complete for the Vue migration scope. The panel, sidebar, grid, feed, context menus, viewer runtime hosts, and DnD runtime ownership are now Vue-owned. `AssetsManagerPanel.js` is gone, replaced by `panelRuntime.js`; `createSidebar()` and the `js/components/SidebarView.js` shim are deleted. Remaining imperative modules are service/runtime layers kept by design rather than unfinished migration work.**

---

## Overview

This is the working migration plan for converting the extension frontend from
vanilla JavaScript DOM code (~200 files) to Vue 3 + Pinia.  The migration follows
a strict **strangler-fig** strategy: Vue wraps existing DOM code first, then each
surface is replaced component by component.  The backend and API layer are never
touched.

The goal is that at every commit the extension works in ComfyUI.  No big-bang
rewrites, no feature regressions.

---

## Current State (as of 2026-04-01)

### What is done

| Area | Status |
|------|--------|
| Vite 6 build system | ✅ Done |
| Vue 3 + Pinia dependencies | ✅ Done |
| `js_dist/` output dir, `__init__.py` auto-selects it | ✅ Done |
| Pinia panel store (`usePanelStore`) | ✅ Done |
| Pinia runtime store (`useRuntimeStore`) | ✅ Done |
| Vue app factory (`createMjrApp`, `mountKeepAlive`) | ✅ Done |
| Sidebar Vue root (`App.vue` using `mountAssetsManagerPanelRuntime`) | ✅ Done |
| Bottom panel Vue root (`GeneratedFeedApp.vue` calling feed host directly) | ✅ Done |
| Keep-alive mount (no DOM flag hack, clean lifecycle) | ✅ Done |
| Declarative commands array on extension object | ✅ Done |
| `entryUiRegistration.js` rewritten for Vue mounting | ✅ Done |
| `mountAssetsManagerPanelRuntime` + Vue-owned `external` panel contract | ✅ Done |
| `_createHeaderElements()` helper extracted from `_renderPanelImpl` | ✅ Done |
| `StatusSection.vue` renderless wrapper (Phase 2.1) | ✅ Done |
| `HeaderSection.vue` renderless wrapper (Phase 2.2) | ✅ Done |
| `SummaryBarSection.vue` renderless wrapper (Phase 2.3) | ✅ Done |
| `SearchBar.vue` upgraded to reactive Vue template backed by Pinia | ✅ Done |
| `HeaderSection.vue` upgraded to hybrid Vue template (header/search DOM + legacy popovers) | ✅ Done |
| `SummaryBarSection.vue` upgraded to reactive Vue template backed by Pinia counts | ✅ Done |
| `App.vue` uses Vue top-section components via `external` | ✅ Done |
| Phase 3 bridge introduced for legacy controller state → Pinia sync | ✅ Done |
| `scopeController` synced with `usePanelStore` | ✅ Done |
| `sortController`, `filtersController`, `browserNavigationController`, `gridController` read/write Pinia through bridge | ✅ Done |
| `contextController`, `customRootsController`, `sidebarController` synced with `usePanelStore` | ✅ Done |
| `panelRuntime.js` restores selection/sidebar state via bridge-backed reads | ✅ Done |
| `panelState.js` removed | ✅ Done |
| `GridSection.vue` — Vue owns browse+grid-scroll container DOM (Phase 4 strangler-fig) | ✅ Done |
| `AssetsGrid.vue` — Vue-owned main grid shell for the panel; `panelRuntime.js` reuses `external.gridContainer` | ✅ Done |
| `useVirtualGrid.js`, `useAssetsQuery.js`, `useGridSelection.js`, `assetsGridHostState.js`, `useGridKeyboard.js` — unified 4.4 virtualization/query/selection runtime modules | ✅ Done |
| `SidebarSection.vue` — Vue owns sidebar shell lifecycle (Phase 5 strangler-fig) | ✅ Done |
| `ContextMenuPortal.vue` — Vue owns context menu DOM lifecycle (Phase 6 strangler-fig) | ✅ Done |
| `GeneratedFeedApp.vue` uses `GridSection` scroll wrapper + `ContextMenuPortal` (Phase 6 strangler-fig) | ✅ Done |
| `ViewerPortal.vue` — Vue owns viewer overlay lifecycle (Phase 7 strangler-fig) | ✅ Done |
| `useDragDrop.js` composable — DnD init/dispose tied to Vue lifecycle via App.vue (Phase 7 strangler-fig) | ✅ Done |
| `GenTimeBadge.vue`, `RatingBadge.vue`, `TagsBadge.vue` — Vue badge sub-components (Phase 4.1) | ✅ Done |
| `AssetCardInner.vue` — Vue fragment replacing Card.js card content; image/video/audio/model3D (Phase 4.2) | ✅ Done |
| `FolderCard.vue` — Full Vue folder card (Phase 4.2) | ✅ Done |
| `GridView_impl.js` wiring — `_createVueCard`, `onItemUpdated` Vue fast-path, `onItemRecycled` Vue guard, `disposeGrid` Vue cleanup (Phase 4.2) | ✅ Done |
| `useActiveAsset.js` — module singleton `shallowRef` for active sidebar asset; `setActiveAsset`/`clearActiveAsset`/`patchActiveAsset` bridge (Phase 5.0) | ✅ Done |
| `SidebarView.js` — `showAssetInSidebar` calls `setActiveAsset`; `loadMetadataAsync` calls `patchActiveAsset`; DOM-building removed, bridge kept | ✅ Done |
| `SidebarHeaderSection.vue` — Vue close button + filename header (Phase 5.0) | ✅ Done |
| `SidebarPreviewSection.vue`, `SidebarFileInfoSection.vue`, `SidebarFolderSection.vue` — real Vue sidebar sections | ✅ Done |
| `SidebarGenerationSection.vue`, `SidebarWorkflowSection.vue` — full Vue sidebar sections | ✅ Done |
| `AssetSidebarContent.vue` — sidebar content fully Vue-rendered for preview, file info, generation, minimap, and folder sections | ✅ Done |
| `SidebarSection.vue` — now renders `<div ref>` + `AssetSidebarContent.vue`; no longer calls `createSidebar()` (Phase 5.0) | ✅ Done |
| `useGridContextMenu.js` — Vue lifecycle wrapper for `bindGridContextMenu`; watches grid container ref (Phase 6.2) | ✅ Done |
| `GridSection.vue` — `onGridContainerReady` callback + `provide("mjr-grid-container-ref")` for context menu composable (Phase 6.2) | ✅ Done |
| `panelRuntime.js` — wires `external.onGridContainerReady` and the remaining controller/runtime bridge (Phase 6.2+) | ✅ Done |
| `GridContextMenu.vue` — Vue-rendered grid/feed context menu + tags popover; `GridContextMenu.js` reduced to an action/controller bridge (Phase 6.2) | ✅ Done |
| `AddToCollectionMenu.vue` — global add-to-collection menu now renders in Vue; `showAddToCollectionMenu()` is only a bridge | ✅ Done |
| `CollectionsPopover.vue` — collections popover body now renders in Vue; `collectionsController.js` deleted | ✅ Done |
| `feedHost.js` — generated feed host logic extracted; `GeneratedFeedApp.vue` now calls feed host directly | ✅ Done |
| `ViewerMetadataBlock.vue` + `genInfo.js` bridge — viewer metadata blocks now render in Vue; viewer-only sidebar section files deleted | ✅ Done |
| `ViewerContextMenu.vue` + `ViewerContextMenuPortal.vue` — viewer context menu/tags popover now render in Vue; `ViewerContextMenu.js` reduced to an action bridge | ✅ Done |
| `ViewerOverlayHost.vue`, `FloatingViewerHost.vue`, `viewerRuntimeHosts.js` — Vue owns the viewer overlay/floating-viewer DOM hosts instead of body-appends from service modules | ✅ Done |
| `DragDrop.js` + `runtimeState.js` — DnD runtime state no longer uses `window` flags / container expandos; lifecycle remains Vue-owned through `GlobalRuntime.vue` | ✅ Done |
| `panelRuntimeRefs.js` — active grid runtime registry extracted from the panel runtime; realtime/viewer/execution runtime no longer import the panel shell for this | ✅ Done |

### What remains imperative by design

- **Main asset grid** — Vue-owned through `AssetsGrid.vue` + `VirtualAssetGridHost.vue`; legacy `GridView*` files deleted
- **Generated feed bottom panel** — feed host remains imperative, but the runtime host logic now lives in `feed/feedHost.js` and is called directly from `GeneratedFeedApp.vue`
- **Context menus / popovers** — grid/feed, viewer, add-to-collection, and collections popover DOM are now Vue-rendered
- **Viewer** — media/processing service subtree (`js/features/viewer/` + `js/components/Viewer_impl.js`) remains imperative by design, but runtime ownership/hosts/context menus are now Vue-owned
- **Drag-and-drop** — service subtree in `js/features/dnd/` remains plain JS, but runtime state/listeners are now Vue-owned and no longer rely on `window` flags
- **Top-bar popovers** — all Vue components; legacy factory files deleted ✅

### Build output (as of 2026-04-01)

```
js_dist/
  entry.js                        (thin ESM stub, 0.07 kB — what ComfyUI loads)
  chunks/
    mjr-vue-vendor-*.js           (Vue 3 + Pinia, 110 kB / gzip 34 kB)
    i18n.generated-*.js           (translations, 155 kB / gzip 35 kB)
    entry-*.js                    (all app code + Three.js, 6.7 MB / gzip 4.0 MB)
    FloatingViewer-*.js           (lazy, 71 kB)
    NodeStreamController-*.js     (lazy, 9 kB)
    LiveStreamTracker-*.js        (lazy, 7 kB)
```

---

## Migration Principles

1. The extension must work at every step — no broken-in-progress commits.
2. One surface at a time.  Finish one Vue component before starting the next.
3. The Vue component replaces the DOM module — delete the old file when done.
4. State stays in the Pinia store; composables read from the store.
5. All API calls remain in `js/api/client.js` — never move them into components.
6. Never touch the Python backend during the frontend migration.
7. Run `npm run build` and test in ComfyUI after each component migrated.

---

## File Map: DOM → Vue

### Entry / integration layer (keep as-is)

These files stay.  They are the integration boundary between ComfyUI and the
Vue app — they must not be turned into Vue components.

| File | Purpose |
|------|---------|
| `js/entry.js` | Extension registration |
| `js/features/runtime/entryUiRegistration.js` | Sidebar + bottom panel mounting |
| `js/app/comfyApiBridge.js` | ComfyUI compat bridge |
| `js/app/toast.js` | Toast (already prefers `extensionManager.toast`) |
| `js/app/dialogs.js` | Confirm / prompt wrappers |
| `js/api/client.js` | HTTP client with deduplication |
| `js/api/endpoints.js` | URL builders |

### New Vue files (created, expand here)

```
js/
  vue/
    createVueApp.js              ✅ Done — app factory + keep-alive helpers
    App.vue                      ✅ Done — sidebar root (mounts panelRuntime.js)
    GeneratedFeedApp.vue         ✅ Done — bottom panel root
    composables/
      useDragDrop.js             ✅ Done — DnD init/dispose via Vue lifecycle
    components/
      panel/
        SearchBar.vue            ✅ Done
        HeaderSection.vue        ✅ Done
        SummaryBarSection.vue    ✅ Done
      status/
        StatusSection.vue        ✅ Done
      grid/
        GridSection.vue          ✅ Done — scroll container lifecycle
        AssetsGrid.vue           ✅ Done — Vue-owned grid shell (host state, context menu, keyboard, query)
        AssetCardInner.vue       ✅ Done — Vue fragment (image/video/audio/model3D)
        FolderCard.vue           ✅ Done — full Vue folder card
      sidebar/
        SidebarSection.vue       ✅ Done — sidebar shell lifecycle
      viewer/
        ViewerPortal.vue         ✅ Done — viewer overlay lifecycle
        ViewerMetadataBlock.vue  ✅ Done — Vue-rendered viewer metadata blocks
        ViewerContextMenu.vue    ✅ Done — Vue-rendered viewer context menu
      common/
        GenTimeBadge.vue         ✅ Done
        RatingBadge.vue          ✅ Done
        TagsBadge.vue            ✅ Done
        RatingEditor.vue         ✅ Done
        TagsEditor.vue           ✅ Done (placeholder — full replacement pending)
  stores/
    usePanelStore.js             ✅ Done — replaces panelState.js Proxy
    useRuntimeStore.js           ✅ Done — replaces runtimeState.js globals
```

### DOM files to replace with Vue (remaining migration targets)

#### Top-bar popovers ✅ DONE

| DOM file | Target Vue file | Status |
|----------|----------------|--------|
| `js/features/panel/views/sortPopoverView.js` | `SortPopover.vue` | ✅ Deleted |
| `js/features/panel/views/filterPopoverView.js` | `FilterPopover.vue` | ✅ Deleted |
| `js/features/panel/views/pinnedFoldersPopoverView.js` | `PinnedFoldersPopover.vue` | ✅ Deleted |
| `js/features/panel/views/customPopoverView.js` | `CustomRootsPopover.vue` | ✅ Deleted |
| `js/features/panel/views/messagePopoverView.js` | `MessagePopover.vue` | ✅ Deleted |
| `js/features/panel/views/headerView.js` | `HeaderSection.vue` | ✅ Deleted |
| `js/features/panel/views/searchView.js` | `SearchBar.vue` | ✅ Deleted |
| `js/features/collections/views/collectionsPopoverView.js` | `CollectionsPopover.vue` | ✅ Deleted |
| `AssetsManagerPanel.js _createHeaderElements()` | `HeaderSection.vue` via `external` | ✅ Removed |

#### Asset card (Phase 4.3 — grid engine replacement)

| DOM file | Target Vue file | Complexity |
|----------|----------------|------------|
| `js/features/grid/GridView.js` / `GridView_impl.js` | `js/vue/components/grid/AssetsGrid.vue` | Very High |
| `js/vue/composables/VirtualGrid.js` | composable `useVirtualGrid.js` virtual renderer | Very High |
| `js/vue/composables/useVirtualGrid.js` | unified virtualization/infinite-scroll helpers | — |
| `js/features/grid/RatingTagsHydrator.js` | composable `useCardHydration.js` | Medium |
| `js/features/grid/StackGroupCards.js` | composable `useStackGrouping.js` | Medium |
| `js/features/grid/GridSelectionManager.js` | composable `useGridSelection.js` | Medium |
| `js/features/grid/GridKeyboard.js` | composable `useGridKeyboard.js` | Medium |
| `js/features/grid/MediaBlobCache.js` | keep as-is (service) | — |
| `js/components/Card.js` | delete after AssetsGrid.vue complete | — |
| `js/components/FolderCard.js` | delete after AssetsGrid.vue complete | — |

#### Asset detail sidebar (Phase 5)

| DOM file | Target Vue file | Status |
|----------|----------------|--------|
| `js/components/SidebarView.js` | `useActiveAsset.js` + `SidebarSection.vue` | ✅ Deleted shim; direct sidebar bridge kept in `js/components/sidebar/SidebarView.js` |
| `js/components/sidebar/sections/HeaderSection.js` | `SidebarHeaderSection.vue` | ✅ Deleted |
| `js/components/sidebar/sections/PreviewSection.js` | `SidebarPreviewSection.vue` | ✅ Deleted |
| `js/features/viewer/genInfo.js` | `ViewerMetadataBlock.vue` + sidebar Vue sections | ✅ Vue bridge |
| `js/components/sidebar/sections/RatingTagsSection.js` | inline in `AssetSidebarContent.vue` | ✅ Deleted |
| `js/components/sidebar/sections/FolderDetailsSection.js` | `SidebarFolderSection.vue` | ✅ Deleted |

#### Generated feed + context menus (Phase 6)

| DOM file | Target Vue file | Complexity |
|----------|----------------|------------|
| `js/features/contextmenu/GridContextMenu.js` | `js/vue/components/grid/GridContextMenu.vue` | High |
| `js/features/viewer/ViewerContextMenu.js` | `js/vue/components/viewer/ViewerContextMenu.vue` | High |
| `js/components/contextmenu/MenuCore.js` | absorbed into context menu component | — |

#### Keep as services (never becomes a Vue component)

```
js/api/client.js
js/api/endpoints.js
js/app/comfyApiBridge.js
js/app/toast.js
js/app/dialogs.js
js/app/i18n.js
js/app/config.js
js/app/metrics.js
js/app/bootstrap.js
js/app/runtimeState.js              ← stays until useRuntimeStore fully wired
js/features/viewer/                 ← entire viewer subtree (complex, Phase 7)
js/features/dnd/                    ← drag-and-drop services (Phase 7)
js/features/stacks/                 ← execution stack logic (Phase 7)
js/utils/                           ← all utilities (keep as-is)
```

---

## Phase-by-Phase Tasks

### Phase 0 — Build infrastructure ✅ DONE

- [x] Vite 6 + `@vitejs/plugin-vue`
- [x] `vite.config.mjs` (IIFE → ESM, external ComfyUI scripts)
- [x] `js_dist/` output, `__init__.py` fallback
- [x] `vue` + `pinia` dependencies
- [x] `js/stores/usePanelStore.js`
- [x] `js/stores/useRuntimeStore.js`
- [x] `js/vue/createVueApp.js` (factory + keep-alive helpers)
- [x] `js/vue/App.vue` (sidebar wrapper)
- [x] `js/vue/GeneratedFeedApp.vue` (bottom panel wrapper)
- [x] `entryUiRegistration.js` uses `mountKeepAlive`
- [x] `entry.js` declarative commands, no `_mjrKeepAliveMounted` hack
- [x] `.gitignore` updated
- [x] Fixed pre-existing bad import in `settingsCore.js`

---

### Phase 2 — Status, header, search, popovers ✅ DONE

**Goal:** Vue components own the lifecycle of all top-section DOM elements.

#### Step 2.1 — StatusSection ✅ DONE
- [x] `js/vue/components/status/StatusSection.vue` — renderless, wraps `createStatusIndicator`
- [x] `App.vue` forwards `external.statusSection/statusDot/statusText/capabilitiesSection`

#### Step 2.2 — HeaderSection ✅ DONE
- [x] `js/vue/components/panel/HeaderSection.vue` — full Vue template; all popovers Vue components; scope tabs reactive via `usePanelStore.scope`
- [x] `App.vue` forwards `external.headerSection`
- [x] `_createHeaderElements()` removed from `AssetsManagerPanel.js` — Vue path is now the only path
- [x] `SearchBar.vue` owns search input/template + shortcut hints
- [x] `SortPopover.vue`, `FilterPopover.vue`, `CollectionsPopover.vue`, `PinnedFoldersPopover.vue`, `CustomRootsPopover.vue`, `MessagePopover.vue` — all wired in `HeaderSection.vue`
- [x] Legacy factory files deleted: `headerView.js`, `searchView.js`, `sortPopoverView.js`, `filterPopoverView.js`, `pinnedFoldersPopoverView.js`, `customPopoverView.js`, `messagePopoverView.js`, `collectionsPopoverView.js`

#### Step 2.3 — SummaryBarSection ✅ DONE
- [x] `js/vue/components/panel/SummaryBarSection.vue` — reactive Pinia-backed counts
- [x] `App.vue` forwards `external.summaryBar/updateSummaryBar/folderBreadcrumb`

#### Step 2.4 — Panel Runtime Export ✅ DONE
- [x] `mountAssetsManagerPanelRuntime(container, { useComfyThemeUI, external })` exported
- [x] `AssetsManagerPanel.js` removed in favor of `panelRuntime.js`

---

### Phase 3 — Wire Pinia stores into controllers ✅ DONE

- [x] Grid, scope, filters, sort, browserNavigation controllers read/write Pinia through bridge
- [x] Context, customRoots, sidebar controllers synced with `usePanelStore`
- [x] `panelHotkeysController` and `ratingHotkeysController` confirmed state-independent
- [x] `panelState.js` deleted
- [x] `npm run build` clean

---

### Phase 4 — Common components + Asset card

**Goal:** asset cards are Vue components; the virtual grid pool reuses reactive card instances.

#### Step 4.1 — Common badge components ✅ DONE
- [x] `js/vue/components/common/GenTimeBadge.vue`
- [x] `js/vue/components/common/RatingBadge.vue`
- [x] `js/vue/components/common/TagsBadge.vue`
- [x] `js/vue/components/common/RatingEditor.vue`
- [x] `js/vue/components/common/TagsEditor.vue`

#### Step 4.2 — AssetCard + FolderCard + grid wiring ✅ DONE
- [x] `js/vue/components/grid/AssetCardInner.vue` — fragment (two roots) mounted inside imperative shell
  - image / video / audio / model3D templates
  - `watch(videoRef)` for IntersectionObserver lifecycle
  - `watchEffect` for workflow dot (imperative `createWorkflowDot`)
  - File badge collision dispatch (`mjr:badge-duplicates-focus`)
- [x] `js/vue/components/grid/FolderCard.vue` — full card with `.mjr-asset-card` root
- [x] `GridView_impl.js` — `_createVueCard()` creates per-card `createApp` with `shallowReactive` asset
- [x] `GridView_impl.js` — `onItemUpdated` Vue fast-path: `Object.assign(card._mjrReactiveAsset, asset)` triggers reactive re-render without DOM rebuild
- [x] `GridView_impl.js` — `onItemRecycled` skips `cleanupVideoThumbsIn` / `cleanupCardMediaHandlers` for Vue cards
- [x] `GridView_impl.js` — `disposeGrid` unmounts all Vue card apps from `state.vueCardApps`
- [x] `js/components/Card.js` — exports `observeVideoThumb`, `bindVideoThumbHover`, `unobserveVideoThumb` thin wrappers
- [x] Fixed `../../app/i18n.js` → `../../../app/i18n.js` in all `js/vue/components/common/*.vue` files
- [x] `npm run build` passes

#### Step 4.3 — Vue-owned grid shell ✅ DONE
- [x] Create `js/vue/components/grid/AssetsGrid.vue` as the Vue-owned main-panel grid shell while keeping the current GridView engine
- [x] `App.vue` renders `<AssetsGrid />` as the Vue-owned grid shell
- [x] Primary path now reuses `external.gridContainer` from `AssetsGrid.vue`; imperative panel fallback remains for non-Vue callers

#### Step 4.4 — Full grid engine replacement ✅ DONE
- [x] `js/vue/composables/useAssetsQuery.js` — queued reload, anchor restore, auto-load, and UI-restore orchestration extracted from the panel runtime
- [x] `js/vue/composables/useAssetsQuery.js` — counters update handler + search input binding extracted from the panel runtime
- [x] `js/vue/composables/useGridSelection.js` — selection event sync + selection restore helper extracted from the panel runtime
- [x] `js/vue/components/grid/assetsGridHostState.js` — Vue-owned grid host runtime for scroll persistence, grid stats, selection sync, and restore callbacks
- [x] `js/vue/composables/useGridKeyboard.js` — Vue-owned lifecycle wrapper for the legacy grid keyboard engine
- [x] `js/vue/composables/useVirtualGrid.js` — unified virtualization + infinite-scroll/upsert runtime (replaces `VirtualScroller.js` + `InfiniteScroll.js`)
- [x] `js/vue/composables/useGridState.js` — reactive asset list, pagination, and selection source of truth
- [x] `js/vue/composables/useGridLoader.js` — API loading, list hydration, upsert batching, anchor restore, and snapshot cache
- [x] `js/vue/components/grid/VirtualAssetGridHost.vue` — shared Vue grid host used by the main panel and generated feed
- [x] `js/vue/components/grid/AssetsGrid.vue`
  - Uses `@tanstack/vue-virtual` for row-windowed rendering
  - Exposes the grid API through `_mjr*` container methods and component methods
  - Keeps `useAssetsQuery.js`, `useGridSelection.js`, and `useGridKeyboard.js` wired against the Vue-owned container
- [x] `js/features/grid/gridApi.js` — compatibility facade for panel/feed/runtime callers
- [x] Delete `GridRuntime.js` and `VirtualGridCore.js`
- [x] Delete `GridView.js`, `GridView_impl.js`, `js/vue/composables/VirtualGrid.js`
- [x] Delete `js/components/Card.js`, `FolderCard.js`

**Phase 4 exit criteria:**
- Asset grid renders in Vue with same scrolling performance
- Selection, keyboard navigation, multi-select all work
- Context menu still fires
- Build passes, no complexity violations

---

### Phase 5 — Asset detail sidebar ✅ DONE

**Goal:** the right-hand sidebar panel is Vue.

#### Step 5.1 — Sidebar shell ✅ DONE
- [x] `js/vue/composables/useActiveAsset.js` — module singleton `shallowRef` bridge; `setActiveAsset` / `clearActiveAsset` / `patchActiveAsset`
- [x] `js/vue/components/panel/SidebarSection.vue` — renders `<div ref>` + `AssetSidebarContent.vue`; exposes `get sidebar()` DOM node for legacy controller contract
- [x] `js/vue/components/panel/sidebar/AssetSidebarContent.vue` — full Vue sidebar content; no imperative DOM slots
- [x] `SidebarView.js` — `showAssetInSidebar` calls `setActiveAsset`; async `loadMetadataAsync` calls `patchActiveAsset`; DOM building removed

#### Step 5.2 — Sidebar sections ✅ DONE
- [x] `SidebarHeaderSection.vue` — filename + close button with `(Esc)` tooltip
- [x] `SidebarPreviewSection.vue`
- [x] `SidebarFileInfoSection.vue`
- [x] `SidebarGenerationSection.vue`
- [x] `SidebarRatingTagsSection.vue` — inline in `AssetSidebarContent.vue` (RatingEditor + TagsEditor)
- [x] `SidebarWorkflowSection.vue`
- [x] `SidebarFolderSection.vue`
- [x] `HeaderSection.js`, `PreviewSection.js`, `RatingTagsSection.js`, `FolderDetailsSection.js` — deleted
- [x] `GenerationSection.js`, `WorkflowMinimapSection.js`, `FileInfoSection.js` — deleted after `genInfo.js` moved to `ViewerMetadataBlock.vue`
- [x] `SidebarView.js` — bridge kept only for `showAssetInSidebar` / `closeSidebar`; `createSidebar()` removed

**Phase 5 exit criteria:**
- Clicking an asset opens the Vue sidebar
- Sidebar updates when active asset changes (reactive)
- Rating/tags save correctly
- Workflow minimap renders

---

### Phase 6 — Generated feed bottom panel + context menus ✅ DONE

**Goal:** `GeneratedFeedApp.vue` renders real Vue; context menus are Vue components.

#### Step 6.1 — Feed grid
- [x] `GeneratedFeedApp.vue` renders the extracted feed host directly and owns the feed scroll wrapper lifecycle
- [x] Live push still reuses `pushGeneratedAsset` / `refreshGeneratedFeedHosts` through `feedHost.js`
- [x] Delete `js/features/bottomPanel/GeneratedFeedTab.js`

#### Step 6.2 — Context menu ✅ DONE
- [x] `js/vue/composables/useGridContextMenu.js` — `watch(gridContainerRef)` + `onUnmounted` ties `bindGridContextMenu` lifecycle to Vue
- [x] `AssetsGrid.vue` wires `useGridContextMenu(gridContainerRef, () => panelStore)`
- [x] `panelRuntime.js` wires `external.onGridContainerReady` after grid host setup
- [x] `js/vue/components/grid/GridContextMenu.vue` — full Vue context menu replacing DOM building in `GridContextMenu.js`
- [x] `js/features/contextmenu/GridContextMenu.js` reduced to action/controller bridge (no imperative menu DOM building)

**Phase 6 exit criteria:**
- Bottom panel shows generated assets in real-time
- Context menu works in both grid and feed panel

---

### Phase 7 — Viewer, drag-and-drop, full cleanup ✅ DONE

**Migration scope complete. Remaining work below is optional service decomposition, not blocked Vue migration.**

Done:
- [x] `ViewerPortal.vue` — Vue owns viewer lifecycle (pre-warm on mount, dispose on unmount)
- [x] `ViewerOverlayHost.vue` + `FloatingViewerHost.vue` — Vue owns the main viewer/floating-viewer DOM hosts
- [x] `useDragDrop.js` — DnD init/dispose tied to Vue global runtime lifecycle
- [x] `js/features/dnd/runtimeState.js` — DnD internal state moved out of `window` globals / DOM expandos
- [x] `ViewerMetadataBlock.vue` + `genInfo.js` bridge — viewer metadata sections render in Vue
- [x] `ViewerContextMenu.vue` + `ViewerContextMenuPortal.vue` — viewer context menu DOM renders in Vue
- [x] `FloatingViewer.js` controls now call the floating-viewer controller directly (event-bus fallback only for compat)

Completed cleanup:
- [x] Remove `renderAssetsManager()` alias
- [x] Remove `AssetsManagerPanel.js`
- [x] Remove `createSidebar()` and the `js/components/SidebarView.js` shim

Optional post-migration follow-up:
- [ ] Rewrite `FloatingViewer.js` / `Viewer_impl.js` media stages as declarative Vue templates instead of imperative service DOM
- [ ] Rewrite DnD staging/target helpers as composables instead of service helpers
- [ ] Reduce remaining integration compatibility exports if older ComfyUI support is ever dropped

---

## How to Add a New Vue Component

1. Create the `.vue` file in `js/vue/components/<area>/`.
2. Write it in Composition API (`<script setup>`).
3. Import paths from `js/vue/components/common/` use `../../../` to reach `js/`.
4. Import the Pinia store if you need shared state: `const store = usePanelStore()`.
5. Import API calls directly from `js/api/client.js` if needed (or via a composable).
6. Import it in the parent Vue component (`App.vue` or another SFC).
7. Remove the corresponding DOM file and its imports.
8. Run `npm run build` — fix any resolve errors.
9. Run `python -m radon cc mjr_am_backend mjr_am_shared -s --min C` — must be empty.
10. Test in ComfyUI.

---

## Composable Conventions

Name composables `use<Feature>.js` and place them in `js/vue/composables/`.

Each composable:
- Returns reactive refs and actions (never raw DOM refs)
- Cleans up in `onUnmounted` (event listeners, timers, abort controllers)
- Calls API via `js/api/client.js` (never `fetch` directly)
- Does not mutate `usePanelStore` directly — emits events or returns actions

---

## Build Commands

```bash
npm run build          # production build → js_dist/
npm run build:watch    # rebuild on save (dev loop)
npm run build:dev      # dev build with source maps
npm run test:js        # Vitest unit tests
npm run lint:js        # ESLint
```

After every build, `js_dist/entry.js` is what ComfyUI loads.  The `chunks/`
subdirectory is served automatically because `WEB_DIRECTORY` points to `js_dist/`
and aiohttp's static file handler serves subdirectories recursively.

---

## Risk Register

| Risk | Mitigation |
|------|-----------|
| Grid perf regression when moving to Vue | Use TanStack Virtual; benchmark before/after |
| Listener leaks during tab-switch cycles | All composables clean up in `onUnmounted` |
| Split-brain state (Proxy + Pinia coexist in Phase 3) | Wire one controller at a time; delete panelState.js only at end of Phase 3 |
| Two Vue instances if externalization fails | Vue is bundled (not external) — self-contained, no mismatch |
| Three.js chunk too large | Split `three` into its own `manualChunks` entry in `vite.config.mjs` |
| Per-card `createApp` memory overhead (Phase 4.2) | VirtualGrid pool recycles cards; `Object.assign` on shallowReactive avoids unmount/remount |

---

## Phase Progress Tracker

| Phase | Name | Status |
|-------|------|--------|
| 0 | Build infrastructure | ✅ Done |
| 1 | Vue app shell (wrappers) | ✅ Done |
| 2 | Status, header, search, popovers | ✅ Done |
| 3 | Wire Pinia into controllers | ✅ Done |
| 4.1 | Common badge components | ✅ Done |
| 4.2 | AssetCardInner, FolderCard, grid wiring | ✅ Done |
| 4.3 | Vue-owned grid shell (AssetsGrid.vue + panel gridContainer reuse) | ✅ Done |
| 4.4 | Full grid engine replacement (composables + virtualizer) | ✅ Done |
| 5.0 | Sidebar shell → Vue-rendered (header + rating/tags Vue; rest hybrid) | ✅ Done |
| 5.x | Sidebar remaining sections full Vue (preview, fileinfo, generation, minimap) | ✅ Done |
| 6.1 | Bottom panel feed internals | ✅ Done |
| 6.2 | Context menu full Vue rendering | ✅ Done |
| 7 (wrap) | Viewer + DnD strangler-fig wrappers | ✅ Done |
| 7 (full) | Viewer + DnD full replacement, final cleanup | ✅ Done |

