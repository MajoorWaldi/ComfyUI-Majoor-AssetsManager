# Migration JS → TypeScript — Tracker

> Mis à jour : 2026-05-26
> Stratégie : renommer `.js` → `.ts` + ajouter annotations TypeScript progressivement par frontière logique.

---

## Résumé global

| Zone          | Total fichiers | Migrés (`.ts`) | Restants (`.js`) |
|---------------|---------------|----------------|-----------------|
| `utils/`      | 14            | **14 ✅**       | 0               |
| `api/`        | 5             | **5 ✅**        | 0               |
| `integration/`| 1             | **1 ✅**        | 0               |
| `stores/`     | 6             | **6 ✅**        | 0               |
| `app/`        | 30            | **30 ✅**       | 0               |
| `vue/`        | 23            | **23 ✅**       | 0               |
| `components/` | 15            | **15 ✅**       | 0               |
| `features/`   | 141           | **141 ✅**      | 0               |
| `entry.ts`    | 1             | **1 ✅**        | 0               |
| **TOTAL**     | **~236**      | **~236 ✅**     | **0**           |

> Fichiers exclus (générés, ne pas toucher) :
> - `js/vue/majoor-ui.umd.js`
> - `js/app/i18n.generated.js`
> - `js_dist/` (tout le dossier — produit par `npm run build`)

---

## Détail par zone

### ✅ `js/utils/` — 14/14 FAIT

| Fichier | TS types | Notes |
|---------|----------|-------|
| `debounce.ts` | ✅ `DebouncedFn<TArgs>` générique | Interface + generic |
| `deleteGuard.ts` | ✅ | `Promise<boolean>` return |
| `dom.ts` | ✅ | JSDoc → annotations TS |
| `events.ts` | ✅ | |
| `extractOutputFiles.ts` | ✅ | |
| `filenames.ts` | ✅ | `validateFilename` retourne `{valid,reason}` |
| `format.ts` | ✅ | `Date \| null` return |
| `ids.ts` | ✅ | |
| `logging.ts` | ✅ | |
| `mediaFps.ts` | ✅ | |
| `path.ts` | ✅ | |
| `safeCall.ts` | ✅ | Generic `safeCall<T>` |
| `tooltipShortcuts.ts` | ✅ | `HTMLElement \| null` param |
| `ttlCache.ts` | ✅ | Interface `TTLCache<K,V>` + generic |

### ✅ `js/api/` — 5/5 FAIT

| Fichier | TS types | Notes |
|---------|----------|-------|
| `client.ts` | ✅ | `ApiResult<T>` typedef, interfaces existantes |
| `clientAuth.ts` | ✅ | |
| `clientOps.ts` | ✅ | |
| `endpoints.ts` | ✅ | `AssetFilterParams`, `ListURLParams` interfaces |
| `fetchUtils.ts` | ✅ | |

### ✅ `js/integration/` — 1/1 FAIT

| Fichier | TS types | Notes |
|---------|----------|-------|
| `comfy_send_to_am.ts` | ✅ | |

### ✅ `js/stores/` — 6/6 FAIT (sessions précédentes)

| Fichier | TS types |
|---------|----------|
| `useRuntimeStore.ts` | ✅ |
| `usePanelStore.ts` | ✅ |
| `runtimeEnrichmentState.ts` | ✅ |
| `panelStateBridge.ts` | ✅ |
| `getOptionalRuntimeStore.ts` | ✅ |
| `getOptionalPanelStore.ts` | ✅ |

### ✅ `js/types/` — 1/1 FAIT

| Fichier | Notes |
|---------|-------|
| `comfyui-frontend.d.ts` | Déclarations de types ComfyUI |

### ✅ `js/app/` — 30/30 FAIT

Tous les fichiers renommés `.ts` + annotations TS sur les exports publics.

| Fichier | TS types | Statut |
|---------|----------|--------|
| `settingsStore.ts` | ✅ | **FAIT** (session précédente) |
| `runtimeState.ts` | ✅ | **FAIT** (session précédente) |
| `assetUrls.ts` | ✅ `(unknown): string` | **FAIT** |
| `bootstrap.ts` | ✅ async void, ReturnType timer | **FAIT** |
| `comfyApiBridge.ts` | ✅ `MajoorComfyApp`, `MajoorComfyApi` | **FAIT** |
| `config.ts` | ✅ `AppConfig` typedef | **FAIT** |
| `dialogs.ts` | ✅ `MajoorExtensionDialog` retours | **FAIT** |
| `DialogTemplates.ts` | ✅ (renommé) | **FAIT** |
| `events.ts` | ✅ (constantes string) | **FAIT** |
| `hostAdapter.ts` | ✅ types ComfyUI complets | **FAIT** |
| `i18n.ts` | ✅ exports publics annotés | **FAIT** |
| `metrics.ts` | ✅ nombre/bool params | **FAIT** |
| `openMajoorSettings.ts` | ✅ | **FAIT** |
| `settings.ts` | ✅ (re-exports, pas de corps) | **FAIT** |
| `style.ts` | ✅ | **FAIT** |
| `toast.ts` | ✅ `comfyToast(unknown, string, number?, opts?)` | **FAIT** |
| `versionCheck.ts` | ✅ types complets | **FAIT** |
| `settings/MajoorSettingsDialog.ts` | ✅ | **FAIT** |
| `settings/settingsAdvanced.ts` | ✅ `MajoorSettingDefinition` param | **FAIT** |
| `settings/settingsCore.ts` | ✅ | **FAIT** |
| `settings/settingsFeed.ts` | ✅ | **FAIT** |
| `settings/settingsGrid.ts` | ✅ | **FAIT** |
| `settings/SettingsPanel.ts` | ✅ `MajoorSettingDefinition[]` return | **FAIT** |
| `settings/settingsRuntime.ts` | ✅ | **FAIT** |
| `settings/settingsScanning.ts` | ✅ | **FAIT** |
| `settings/settingsSearch.ts` | ✅ | **FAIT** |
| `settings/settingsSecurity.ts` | ✅ | **FAIT** |
| `settings/SettingsStore.ts` | ✅ (Pinia store) | **FAIT** |
| `settings/settingsUtils.ts` | ✅ types primitifs + generic deepMerge | **FAIT** |
| `settings/settingsViewer.ts` | ✅ | **FAIT** |

### ✅ `js/vue/` — 23/23 FAIT

| Fichier | Statut |
|---------|--------|
| `components/panel/summaryBarState.ts` | **FAIT** (session précédente) |
| `components/panel/sidebar/generationSectionState.ts` | **FAIT** (session précédente) |
| `components/grid/gridDomBridge.ts` | **FAIT** (session précédente) |
| `components/grid/assetsGridHostState.ts` | **FAIT** (session précédente) |
| `composables/gridVisibility.ts` | **FAIT** — `Element | null` params |
| `composables/useActiveAsset.ts` | **FAIT** — `setActiveAsset/patchActiveAsset` typés |
| `composables/useAssetsQuery.ts` | **FAIT** — renommé |
| `composables/useDragDrop.ts` | **FAIT** — renommé |
| `composables/useGridContextMenu.ts` | **FAIT** — `unknown` param |
| `composables/useGridKeyboard.ts` | **FAIT** — `HTMLElement | null` |
| `composables/useGridLoader.ts` | **FAIT** — renommé |
| `composables/useGridSelection.ts` | **FAIT** — renommé |
| `composables/useGridState.ts` | **FAIT** — renommé |
| `composables/useVirtualGrid.ts` | **FAIT** — renommé |
| `createVueApp.ts` | **FAIT** — `ReturnType<typeof createApp>` |
| `grid/useAssetCollection.ts` | **FAIT** — `defaultAssetKey` typé |
| `grid/useGridDisplayAssets.ts` | **FAIT** — `unknown[]` params |
| `grid/useGridQuery.ts` | **FAIT** — string params |
| `grid/useGridSnapshotCache.ts` | **FAIT** — clés string |
| `grid/useGridVirtualRows.ts` | **FAIT** — `unknown[][]` return |
| `grid/useInfiniteTrigger.ts` | **FAIT** — renommé |
| `grid/usePagedAssets.ts` | **FAIT** — renommé |
| `majoorPrimeVue.ts` | **FAIT** — `installMajoorPrimeVue` typé |

### ✅ `js/components/` — 15/15 FAIT

| Fichier | Statut |
|---------|--------|
| `Badges.ts` | **FAIT** — `createFileBadge`, `setFileBadgeCollision`, `createRatingBadge`, etc. |
| `RatingEditor.ts` | **FAIT** — params asset + callback |
| `TagsEditor.ts` | **FAIT** — params asset + callback |
| `VideoControls.ts` | **FAIT** — renommé |
| `Viewer.ts` | **FAIT** — renommé |
| `ViewerRuntime.ts` | **FAIT** — `getViewerInstance(): unknown` |
| `Viewer_impl.ts` | **FAIT** — renommé |
| `buttons.ts` | **FAIT** — `createIconButton/createModeButton(string, string)` |
| `sidebar/SidebarView.ts` | **FAIT** — renommé |
| `sidebar/parsers/a1111ParamsParser.ts` | **FAIT** — `(unknown): Record<string,unknown>` |
| `sidebar/parsers/comfyWorkflowParser.ts` | **FAIT** — typed return |
| `sidebar/parsers/geninfoParser.ts` | **FAIT** — `sanitizePromptForDisplay`, etc. |
| `sidebar/utils/dom.ts` | **FAIT** — `createSection`, `createFieldRow` |
| `sidebar/utils/format.ts` | **FAIT** — `formatFileSize(number)` |
| `sidebar/utils/minimap.ts` | **FAIT** — `drawWorkflowMinimap(canvas, workflow, opts?)` |

| Fichier | Statut |
|---------|--------|
| `WorkflowSidebar.ts` | **FAIT** |
| `WorkflowNodesTab.ts` | **FAIT** |
| `widgetAdapters.ts` | **FAIT** |
| `sidebarRunButton.ts` | **FAIT** |
| `NodeWidgetRenderer.ts` | **FAIT** |

### ✅ `js/features/viewer/workflowGraphMap/` — 4/4 FAIT

| Fichier | Statut |
|---------|--------|
| `workflowNodeLabeling.ts` | **FAIT** |
| `workflowGraphMapActions.ts` | **FAIT** |
| `workflowGraphMapData.ts` | **FAIT** — session 2026-05-26 |
| `WorkflowGraphMapPanel.ts` | **FAIT** — renommé |

### ✅ `js/features/viewer/` — 70/70 FAIT (session 2026-05-26)

Tous les `.js` renommés en `.ts` et annotés :
- `FloatingViewer.ts`, `FloatingViewer.impl.ts`, `LiveStreamTracker.ts`, `ViewerCanvas.ts`
- `ViewerContextMenu.ts`, `ViewerKeyboard.ts`, `ViewerState.ts`, `ViewerToolbar.ts`
- `abCompare.ts`, `audioVisualizer.ts`, `filmstrip.ts`, `floatingViewer*.ts` (9 fichiers)
- `frameExport.ts`, `genInfo.ts`, `grid.ts`, `imagePreloader.ts`, `imageProcessor.ts`
- `keyboard.ts`, `lifecycle.ts`, `loupe.ts`, `mediaFactory.ts`, `mediaPlayer.ts`, `metadata.ts`
- `model3dCore.ts`, `model3dLoaders.ts`, `model3dRenderer.impl.ts`, `model3dRenderer.ts`, `model3dSupport.ts`
- `panzoom.ts`, `playerBarManager.ts`, `probe.ts`, `processorUtils.ts`, `scopes.ts`
- `sideBySide.ts`, `state.ts`, `toolbar.ts`, `toolbarActions.ts`, `toolbarControls.ts`
- `videoProcessor.ts`, `videoProcessorWebGL.ts`, `videoSync.ts`
- `viewerInstanceManager.ts`, `viewerOpenRequest.ts`, `viewerOverlayDismiss.ts`
- `viewerRuntimeHosts.ts`, `viewerShell.ts`, `viewerThemeStyles.ts`
- `nodeStream/` (6 fichiers + 4 adapters)

### ✅ `js/features/panel/` — 29/29 FAIT (session 2026-05-26)

Tous les `.js` renommés en `.ts` et annotés (`Record<string,unknown>` pour les params destructurés complexes).

### ✅ `js/entry.ts` — FAIT (session 2026-05-26)

---

## Ordre de migration recommandé

1. ✅ `utils/` + `api/` + `integration/` — **FAIT**
2. ✅ `app/` — **FAIT**
3. ✅ `vue/` — **FAIT**
4. ✅ `components/` — **FAIT**
5. ✅ `features/grid/` + `features/status/` + `features/stacks/` — **FAIT**
6. ✅ `features/runtime/` + `features/dnd/` — **FAIT**
7. ✅ `features/panel/` — **FAIT**
8. ✅ `features/viewer/` — **FAIT**
9. ✅ `entry.ts` — **FAIT**

**Migration JS → TypeScript terminée.** 236/236 fichiers source migrés.

---

## Notes techniques

- **tsconfig** : `allowJs: true`, `checkJs: true`, `strict: false`, `moduleResolution: "Bundler"`
- **Imports** : garder l'extension `.js` dans les imports (Bundler résout `.js` → `.ts`)
- **Convention** : supprimer les JSDoc `@param`/`@returns` quand remplacés par annotations TS
- **Build** : `npm run build` génère `js_dist/` — ne pas modifier `js_dist/` directement
- **Lint** : `npm run lint:js` obligatoire après conversion, `lint:js:ox` + `typecheck:js` en audit
