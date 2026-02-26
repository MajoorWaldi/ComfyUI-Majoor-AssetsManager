# Plan de refactoring — Réduction des gros fichiers

> Généré le 2026-02-26. Fichiers analysés : 4 fichiers > 2000 lignes.
> `i18n.generated.js` (2177 lignes) est généré automatiquement — exclu.

---

## Vue d'ensemble

| Fichier | Lignes actuelles | Lignes après | Réduction | Effort |
|---------|-----------------|--------------|-----------|--------|
| `mjr_am_backend/features/geninfo/parser_impl.py` | 3332 | ~240 | **−93 %** | Faible (supprimer du code mort) |
| `mjr_am_backend/routes/handlers/scan.py` | 2279 | ~400 | **−82 %** | Moyen |
| `js/app/settings/SettingsPanel.js` | 2045 | ~300 | **−85 %** | Moyen |
| `js/components/Viewer_impl.js` | 2644 | ~1300 | **−51 %** | Élevé |

---

---

## FIX 1 — `parser_impl.py` (3332 → ~240 lignes)

### Diagnostic

Le travail de refactoring est **déjà fait à 95 %**. Les modules satellites existent déjà :

```
mjr_am_backend/features/geninfo/
├── graph_converter.py    ← contient les vraies implémentations
├── sampler_tracer.py     ← contient les vraies implémentations
├── model_tracer.py       ← contient les vraies implémentations
├── prompt_tracer.py      ← contient les vraies implémentations
├── tts_extractor.py      ← contient les vraies implémentations
├── role_classifier.py    ← contient les vraies implémentations
├── payload_builder.py    ← contient les vraies implémentations
└── parser_impl.py        ← contient ENCORE les vieilles copies + les imports-alias en fin
```

Les lignes 3125–3332 de `parser_impl.py` contiennent déjà les imports-alias vers ces modules :
```python
_sink_group = _gc._sink_group           # ← ligne ~3128
_is_sampler = _st._is_sampler           # ← ligne ~3165
_is_enabled_lora_value = _mt._is_...    # ← ligne ~3200
# ... 190+ aliases
```

**Problème :** le corps du fichier (lignes 138–3119) contient encore les définitions originales qui sont désormais des doublons inutiles.

### Action : supprimer les blocs dupliqués

Chaque bloc ci-dessous est **déjà présent dans le module satellite** indiqué. Il faut supprimer ces lignes de `parser_impl.py` :

| Lignes à supprimer | Contenu | Module satellite |
|--------------------|---------|-----------------|
| 138–310 | Sampler detection (`_is_sampler`, `_is_advanced_sampler`…) | `sampler_tracer.py` |
| 310–495 | Advanced sampler selection + widget extraction | `sampler_tracer.py` |
| 497–575 | Lyrics extraction | `tts_extractor.py` / `payload_builder.py` |
| 577–807 | Prompt utilities + conditioning text collection | `prompt_tracer.py` |
| 808–1197 | Model loaders detection + chain processing | `model_tracer.py` |
| 1200–1384 | Model tracing (clip, vae, size, guidance) | `model_tracer.py` |
| 1386–1396 | `_extract_workflow_metadata()` | `role_classifier.py` |
| 1424–2029 | Role classification + workflow type detection | `role_classifier.py` |
| 2092–2155 | Graph normalization | `graph_converter.py` |
| 2157–2418 | TTS extraction complète | `tts_extractor.py` |
| 2490–2639 | Advanced prompt tracing | `prompt_tracer.py` |
| 2641–2856 | Sampler values extraction | `sampler_tracer.py` |
| 2858–2950 | Model collection & merging | `model_tracer.py` |
| 2952–3119 | Payload assembly & output | `payload_builder.py` |

### Ce qui reste dans `parser_impl.py` après nettoyage (~240 lignes)

```
Lignes 1–63     : Imports standards + constantes globales
Lignes 64–137   : Utilitaires primitifs (_clean_model_id, _field*, _to_int…)
Lignes 2031–2100: API publique — parse_geninfo_from_prompt()
Lignes 3125–3332: Blocs d'imports-alias (CONSERVER — ce sont les re-exports officiels)
```

### Vérification avant suppression

Avant de supprimer chaque bloc, confirmer que la fonction correspondante :
1. Existe dans le module satellite (grep la signature)
2. Est testée (chercher dans `tests/features/`)
3. Est appelée via l'alias dans les fonctions restantes

```bash
# Exemple de vérification pour sampler_tracer
grep -n "_is_sampler\|_is_advanced_sampler" mjr_am_backend/features/geninfo/sampler_tracer.py
grep -n "_is_sampler\|_is_advanced_sampler" mjr_am_backend/features/geninfo/parser_impl.py
```

### Ordre des opérations

1. Supprimer les blocs TTS (2157–2418) — le plus autonome
2. Supprimer les blocs graph_converter (2092–2155, 1860–2029)
3. Supprimer role_classifier (1386–2029)
4. Supprimer model_tracer (808–1384, 2858–2950)
5. Supprimer prompt_tracer (577–807, 2490–2639)
6. Supprimer sampler_tracer (138–495, 2641–2856)
7. Supprimer payload_builder (2952–3119)
8. Lancer les tests après chaque étape : `pytest tests/features/test_role_classifier.py tests/features/test_sampler_tracer_extra.py …`

---

---

## FIX 2 — `scan.py` (2279 → ~400 lignes)

### Diagnostic

Fichier monolithique : helpers + handlers de route + logique métier mélangés.
Pas encore de modules satellites — tout est à créer.

### Structure actuelle

| Lignes | Section | Type |
|--------|---------|------|
| 1–510 | Imports, constantes, helpers purs | Config + Utils |
| 513–624 | Watcher callbacks + lifecycle | Feature |
| 627–852 | `POST /scan` | Route |
| 854–1204 | `POST /index-files` | Route |
| 1206–1697 | `POST /index/reset` | Route |
| 1699–1950 | `POST /stage-to-input` | Route |
| 1952–1997 | `POST /upload_input` | Route |
| 1999–2279 | `GET+POST /watcher/*` (6 routes) | Routes |

### Nouveaux fichiers à créer

#### `scan_helpers.py` (~450 lignes) — lignes 65–510
Contient :
- `_emit_maintenance_status()` (65–75)
- `_runtime_output_root()` (94–103)
- `_is_db_malformed_result()` (106–117)
- Upload extension whitelist + validation (120–183)
- File upload atomic write (186–265)
- `_schedule_index_task()` (268–279)
- File content comparison (281–331)
- `StageDestination` dataclass (334–360)
- `_resolve_scan_root()` (363–380)
- `_resolve_input_directory()` (460–464)
- Watcher config helpers (467–510)

#### `scan_consistency.py` (~75 lignes) — lignes 383–457
Contient :
- `_run_consistency_check()`
- `_query_consistency_sample()`
- `_collect_missing_asset_rows()`
- `_delete_missing_asset_rows()`
- `_maybe_schedule_consistency_check()`

#### `scan_watcher.py` (~330 lignes) — lignes 513–624 + 2012–2279
Contient :
- Builders de callbacks watcher (index/remove/move)
- `_start_watcher()` / `_stop_watcher()`
- Routes : `GET /watcher/status`, `POST /watcher/flush`, `POST /watcher/toggle`
- Routes : `GET /watcher/settings`, `POST /watcher/settings`, `POST /watcher/scope`

#### `scan_staging.py` (~350 lignes) — lignes 334–360 + 1699–1950
Contient :
- `StageDestination` (déplacer depuis helpers)
- Handler `POST /stage-to-input` complet

#### `scan_upload.py` (~200 lignes) — lignes 186–265 + 1952–1997
Contient :
- Atomic write helper
- Handler `POST /upload_input`

### `scan.py` après refactoring (~400 lignes)
Contient :
- Imports des 5 nouveaux modules
- Handler `POST /scan` (627–852)
- Handler `POST /index-files` (854–1204)
- Handler `POST /index/reset` (1206–1697)
- Registration des routes

### Ordre des opérations

1. Créer `scan_helpers.py` → importer dans `scan.py` (sans casser rien)
2. Créer `scan_consistency.py` → importer dans `scan_helpers.py`
3. Créer `scan_watcher.py` (watcher routes autonomes)
4. Créer `scan_upload.py` (upload handler autonome)
5. Créer `scan_staging.py` (staging handler autonome)
6. Alléger `scan.py` → garder seulement les 3 routes majeures
7. Lancer : `pytest tests/features/test_scan_routes.py tests/features/test_scan_routes_more.py`

### Point d'attention
`POST /index-files` et `POST /index/reset` ont une logique complexe (500+ lignes chacun).
Les laisser dans `scan.py` est acceptable si les helpers sont extraits.
Alternative : créer `scan_index.py` pour ces deux handlers.

---

---

## FIX 3 — `SettingsPanel.js` (2045 → ~300 lignes)

### Diagnostic

La fonction `registerMajoorSettings()` (lignes 558–2028) contient inline **60+ enregistrements de settings** ComfyUI répartis en sections thématiques. Chaque section est auto-contenue et peut être un module.

### Structure actuelle

| Lignes | Section | Type |
|--------|---------|------|
| 1–21 | Imports + constantes | Config |
| 23–153 | `DEFAULT_SETTINGS` (29 catégories) | Data |
| 155–213 | Helpers (`_safeBool`, `deepMerge`…) | Utils |
| 216–325 | Runtime status dashboard | Component |
| 327–517 | `loadMajoorSettings`, `saveMajoorSettings`, `applySettingsToConfig`, `syncBackendSecuritySettings` | Core logic |
| 558–634 | Registration setup + `safeAddSetting` wrapper | Registration |
| 636–716 | `DEFAULT_SETTINGS` / grid size presets | Data utils |
| 717–1220 | **Cards + Badges + Grid/Sidebar sections** | Settings UI |
| 1222–1275 | **Viewer section** | Settings UI |
| 1277–1506 | **Scanning section** | Settings UI |
| 1507–1627 | **Safety + Security section** | Settings UI |
| 1629–1925 | **Advanced section** | Settings UI |
| 1927–1978 | **Search + Env vars section** | Settings UI |
| 1980–2045 | Registration finalization + backend sync | Init |

### Nouveaux fichiers à créer dans `js/app/settings/`

#### `settingsUtils.js` (~60 lignes) — lignes 155–213
```js
export { _safeBool, _safeNum, _safeOneOf, deepMerge,
         normalizeHexColor, resolveGridMinSize, detectGridSizePreset }
```

#### `settingsCore.js` (~200 lignes) — lignes 327–517
```js
export { loadMajoorSettings, saveMajoorSettings,
         applySettingsToConfig, syncBackendSecuritySettings }
```

#### `settingsRuntime.js` (~110 lignes) — lignes 216–325
```js
export { ensureRuntimeStatusDashboard,
         refreshRuntimeStatusDashboard, startRuntimeStatusDashboard }
```

#### `settingsGrid.js` (~550 lignes) — lignes 717–1220
Sections Cards + Card details + Badges + Grid/Sidebar.
```js
export function registerGridSettings(safeAddSetting, t) { ... }
```

#### `settingsViewer.js` (~60 lignes) — lignes 1222–1275
```js
export function registerViewerSettings(safeAddSetting, t) { ... }
```

#### `settingsScanning.js` (~280 lignes) — lignes 1277–1506
```js
export function registerScanningSettings(safeAddSetting, t) { ... }
```

#### `settingsSecurity.js` (~180 lignes) — lignes 1507–1627
```js
export function registerSecuritySettings(safeAddSetting, t) { ... }
```

#### `settingsAdvanced.js` (~350 lignes) — lignes 1629–1925
```js
export function registerAdvancedSettings(safeAddSetting, t) { ... }
```

#### `settingsSearch.js` (~55 lignes) — lignes 1927–1978
```js
export function registerSearchSettings(safeAddSetting, t) { ... }
```

### `SettingsPanel.js` après refactoring (~300 lignes)

```js
import { loadMajoorSettings, saveMajoorSettings, ... } from "./settingsCore.js";
import { ensureRuntimeStatusDashboard, ... }            from "./settingsRuntime.js";
import { registerGridSettings }                          from "./settingsGrid.js";
import { registerViewerSettings }                        from "./settingsViewer.js";
import { registerScanningSettings }                      from "./settingsScanning.js";
import { registerSecuritySettings }                      from "./settingsSecurity.js";
import { registerAdvancedSettings }                      from "./settingsAdvanced.js";
import { registerSearchSettings }                        from "./settingsSearch.js";

export function registerMajoorSettings() {
  // Setup safeAddSetting wrapper (~80 lignes)
  // Appel séquentiel des sections :
  registerGridSettings(safeAddSetting, t);
  registerViewerSettings(safeAddSetting, t);
  registerScanningSettings(safeAddSetting, t);
  registerSecuritySettings(safeAddSetting, t);
  registerAdvancedSettings(safeAddSetting, t);
  registerSearchSettings(safeAddSetting, t);
  // Finalization (~50 lignes)
}
```

### Ordre des opérations

1. Créer `settingsUtils.js` → importer dans `SettingsPanel.js`
2. Créer `settingsCore.js` → importer dans `SettingsPanel.js`
3. Créer `settingsRuntime.js` → importer dans `SettingsPanel.js`
4. Extraire `settingsScanning.js` (la plus autonome, API calls propres)
5. Extraire `settingsSecurity.js`
6. Extraire `settingsAdvanced.js`
7. Extraire `settingsGrid.js` (la plus grosse — faire en dernier)
8. Extraire `settingsViewer.js` et `settingsSearch.js`
9. Tester manuellement : ouvrir le panneau Settings dans ComfyUI, vérifier chaque section

### Point d'attention
Chaque `register*Settings()` reçoit `safeAddSetting` et `t` (i18n) en paramètres.
Si une section accède à `APP_CONFIG`, passer en paramètre ou importer `config.js` directement.
Éviter de passer l'état global entier — préférer les paramètres explicites.

---

---

## FIX 4 — `Viewer_impl.js` (2644 → ~1300 lignes)

### Diagnostic

Le fichier importe déjà 15 modules depuis `js/features/viewer/`. Il reste orchestrateur central mais contient encore des sous-systèmes extractables.

### Imports actuels depuis `js/features/viewer/`

```js
import { createViewerLifecycle }          from "./lifecycle.js";
import { createDefaultViewerState, ... }  from "./ViewerState.js";
import { createViewerToolbar }            from "./ViewerToolbar.js";
import { installViewerKeyboard }          from "./ViewerKeyboard.js";
import { installFollowerVideoSync }       from "./videoSync.js";
import { createViewerGrid }               from "./grid.js";
import { installViewerProbe }             from "./probe.js";
import { createViewerLoupe }              from "./loupe.js";
import { renderABCompareView }            from "./abCompare.js";
import { renderSideBySideView }           from "./sideBySide.js";
import { createViewerMetadataHydrator }   from "./metadata.js";
import { createViewerPanZoom, ... }       from "./ViewerCanvas.js";
import { drawScopesLight }                from "./scopes.js";
import { ensureViewerMetadataAsset, ... } from "./genInfo.js";
import { ViewerContextMenu }              from "./ViewerContextMenu.js";
```

### Nouveaux fichiers à créer dans `js/features/viewer/`

#### Phase 1 — Extractions faciles (peu de couplage)

**`frameExport.js`** (~130 lignes) — source : lignes 1124–1253
```js
export function createFrameExporter(getGradeParams, state, VIEWER_MODES) {
  return {
    exportCurrentFrame,    // Export PNG/clipboard
    getExportSourceCanvas, // Composition AB/side/single
  };
}
```
Dépendances : uniquement canvas/blob APIs. Zéro couplage externe.

**`imagePreloader.js`** (~70 lignes) — source : lignes 1569–1638
```js
export function createImagePreloader(buildAssetViewURL, IMAGE_PRELOAD_EXTENSIONS) {
  return {
    preloadAdjacentAssets,
    preloadImageForAsset,
    trackPreloadRef,
  };
}
```
Dépendances : `buildAssetViewURL` (from endpoints.js), constante d'extensions.

**`viewerInstanceManager.js`** (~25 lignes) — source : lignes 2622–2644
```js
let _instance = null;
export function getViewerInstance(createViewer) {
  // cleanup + create + mount
  return _instance;
}
```
Dépendances : uniquement `createViewer` (from Viewer_impl.js).

#### Phase 2 — Extraction intermédiaire

**`playerBarManager.js`** (~310 lignes) — source : lignes 1640–1951
```js
export function createPlayerBarManager({ state, lifecycle, APP_CONFIG,
    mountUnifiedMediaControls, installFollowerVideoSync, getViewerInfo }) {
  return { syncPlayerBar, destroyPlayerBar };
}
```
Dépendances : `mediaPlayer.js`, `videoSync.js`, `client.js`, `APP_CONFIG`.

#### Phase 3 — Extractions optionnelles (si refactoring radical souhaité)

**`domStructure.js`** (~550 lignes) — source : lignes 48–596
Construction complète de l'arbre DOM du viewer (overlay, header, content, footer).
```js
export function createViewerDOM(deps) {
  // Retourne { overlay, singleView, abView, sideView, genInfoLeft, genInfoRight, ... }
}
```
⚠️ Extraction risquée : fort couplage interne, à faire en dernier.

**`genInfoPanel.js`** (~250 lignes) — source : lignes 871–1120
```js
export function createGenInfoPanelRenderer(state, lifecycle, metadataHydrator) {
  return { renderGenInfoPanel, stopGenInfoFetch };
}
```
⚠️ Couplé à state + lifecycle — refactoring délicat.

### Ce qui reste dans `Viewer_impl.js` après Phase 1+2 (~1800 lignes)

| Lignes (approx.) | Section |
|-----------------|---------|
| 1–43 | Imports + constantes |
| 48–710 | DOM init + panzoom + mediaFactory |
| 712–869 | Overlay redraw orchestration |
| 871–1120 | GenInfo panel rendering |
| 1259–1368 | Badges rendering |
| 1370–1508 | Mode management + `updateUI()` |
| 1510–1567 | Asset rendering (single/AB/side) |
| 1640–1951 | → extrait dans `playerBarManager.js` |
| 1953–2061 | Image processing/grading |
| 2030–2221 | Navigation orchestration |
| 2223–2443 | Lifecycle + cleanup |
| 2446–2611 | Public API |

Après Phase 3 (~1300 lignes) si `domStructure.js` et `genInfoPanel.js` extraits.

### Ordre des opérations

1. Extraire `frameExport.js` — aucun risque
2. Extraire `imagePreloader.js` — aucun risque
3. Extraire `viewerInstanceManager.js` — aucun risque
4. Extraire `playerBarManager.js` — refactoring modéré
5. (Optionnel) `genInfoPanel.js`
6. (Optionnel) `domStructure.js`
7. Tester : ouvrir viewer, tester A/B, side-by-side, export PNG, vidéo, navigation clavier

---

---

## Récapitulatif des nouveaux fichiers à créer

### Backend Python

| Fichier | Lignes ~  | Priorité |
|---------|-----------|----------|
| Supprimer lignes 138–3119 dans `parser_impl.py` | (suppression) | **URGENTE** |
| `scan_helpers.py` | 450 | Haute |
| `scan_consistency.py` | 75 | Haute |
| `scan_watcher.py` | 330 | Haute |
| `scan_upload.py` | 200 | Moyenne |
| `scan_staging.py` | 350 | Moyenne |

### Frontend JS

| Fichier | Lignes ~ | Priorité |
|---------|----------|----------|
| `js/app/settings/settingsUtils.js` | 60 | **Immédiate** |
| `js/app/settings/settingsCore.js` | 200 | **Immédiate** |
| `js/app/settings/settingsRuntime.js` | 110 | Haute |
| `js/app/settings/settingsScanning.js` | 280 | Haute |
| `js/app/settings/settingsSecurity.js` | 180 | Haute |
| `js/app/settings/settingsAdvanced.js` | 350 | Haute |
| `js/app/settings/settingsGrid.js` | 550 | Moyenne |
| `js/app/settings/settingsViewer.js` | 60 | Basse |
| `js/app/settings/settingsSearch.js` | 55 | Basse |
| `js/features/viewer/frameExport.js` | 130 | Haute |
| `js/features/viewer/imagePreloader.js` | 70 | Haute |
| `js/features/viewer/viewerInstanceManager.js` | 25 | Haute |
| `js/features/viewer/playerBarManager.js` | 310 | Moyenne |
| `js/features/viewer/genInfoPanel.js` | 250 | Optionnel |
| `js/features/viewer/domStructure.js` | 550 | Optionnel |

---

## Règles à respecter pendant le refactoring

1. **Toujours tester après chaque extraction** — ne pas tout faire d'un coup
2. **Pas de dépendances circulaires** — les nouveaux modules importent uniquement des helpers, jamais l'orchestrateur
3. **Ne pas changer la logique métier** — déplacer du code, pas le réécrire
4. **Conserver les re-exports** — les fichiers facades (`GridView.js`, `Viewer.js`, etc.) restent intacts
5. **Commenter les imports** dans l'orchestrateur pour documenter la provenance
