# Audit d'intégration ComfyUI — novembre 2026

Audit du code backend (aiohttp / PromptServer / nœuds V3) et frontend (extension
Vue/TS) de Majoor Assets Manager v2.5.3, face aux versions récentes de ComfyUI
(core avec API Assets/Jobs, frontend 1.5x–1.60, sous-graphes, nœuds V3).

Objectif : faire évoluer l'extension **sans conflit** avec le core et avec les
autres custom nodes, et s'appuyer sur les API officielles plutôt que sur des
internes.

## 1. État des lieux

Tous les contrôles existants passent sur la branche :

| Contrôle | Résultat |
| --- | --- |
| `tsc -p tsconfig.json` | OK |
| `vitest run` | 157 fichiers, 858 tests OK |
| `pytest` | 1931 OK, 2 ignorés (torch absent) |
| `ruff` | 5 erreurs d'ordre d'imports → corrigées |

L'architecture d'intégration est déjà saine :

- **Frontend** : une couche unique `ui/app/hostAdapter.ts` → `comfyApiBridge.ts`
  (ADR 0007) isole toutes les API ComfyUI ; commandes, raccourcis, menus
  (`menuCommands`, `getCanvasMenuItems`, `getNodeMenuItems`,
  `getSelectionToolboxCommands`), onglets latéral/bas et toasts passent par
  l'API déclarative d'extension. Les ID de nœuds de sous-graphes (`"12:5"`) sont
  résolus par `graphTraversal.findGraphNodeById`. Les écouteurs
  `execution_start/success/error/interrupted` sont tous enregistrés et retirés.
- **Backend** : `adapters/comfy_core.py` sonde les capacités du core (assets,
  jobs, user manager, websocket) sans import dur ; toutes les routes sont sous
  `/mjr/am/*` ; les middlewares ne s'appliquent qu'aux chemins Majoor (y compris
  le miroir `/api/mjr/am/*` ajouté par `server.py`).
- **Nœuds** : schéma V3 (`comfy_api.latest`, `comfy_entrypoint`) avec
  dégradation à zéro nœud si une dépendance optionnelle manque.

## 2. Problèmes trouvés et corrigés dans cette branche

### 2.1 `graphToPrompt()` appelé de façon synchrone (frontend)
`serializeCurrentHostWorkflow()` (utilisé par le bouton d'en-tête du panneau)
appelait `app.graphToPrompt()` et lisait `.workflow` directement. Depuis le
frontend 1.x, `graphToPrompt` est **asynchrone** (`Promise<{output, workflow}>`,
confirmé dans `comfyui-frontend-types@1.60`). Conséquences : sérialisation
complète des widgets lancée pour rien à chaque appel, résultat ignoré, rejet de
promesse potentiellement non géré.

Correctif : on sérialise d'abord le **graphe racine** (`getHostRootGraph`), ce
qui évite aussi d'exporter seulement le sous-graphe ouvert ; `graphToPrompt` ne
reste qu'en repli pour les anciens hôtes synchrones, et une promesse retournée
est neutralisée proprement. Tests ajoutés dans
`ui/tests/host_adapter_contract.vitest.ts`.

### 2.2 État « modifié » du workflow
`isHostWorkflowDirty()` ne lisait que des drapeaux historiques. Il interroge
désormais d'abord `app.extensionManager.workflow.activeWorkflow.isModified`,
le signal officiel du store de workflows, puis retombe sur les anciens.

### 2.3 Types officiels du frontend absents
`@comfyorg/comfyui-frontend-types@1.57.3` a été publié **sans `index.d.ts`**
(seulement `package.json` + `LICENSE` ; idem 1.56.0). Avec `skipLibCheck`, le
type `OfficialComfyApp` réexporté par `ui/types/comfyui-frontend.d.ts`
devenait silencieusement inutilisable. Mise à jour vers `^1.60.0` (contient
bien les déclarations) ; `tsc` reste vert.

### 2.4 Clés de requête aiohttp
aiohttp ≥ 3.13 émet `NotAppKeyWarning` pour `request["mjr_user_id"]`,
`request["mjr_stats"]`, etc. Nouveau module `mjr_am_backend/request_keys.py` :
utilise `web.RequestKey` quand il existe, sinon la clé texte historique (ComfyUI
n'exige que `aiohttp>=3.11`). Tous les lecteurs/écrivains passent par ces
constantes, ce qui évite aussi toute collision avec les clés d'autres
extensions sur l'objet requête partagé.

### 2.5 Lint
Imports non triés dans 5 fichiers (`ruff --fix`) qui faisaient échouer
`npm run quality:py`.

## 3. Risques de conflit — état

| # | Risque | Statut |
| --- | --- | --- |
| R1 | `/api/v2/assets/*` occupait l'espace de noms du core (`/api/...`) et pouvait être masqué sans erreur. | **Corrigé** : surface déplacée vers `/mjr/am/compat/assets/*` ; l'ancien chemin n'est enregistré que si `MJR_AM_LEGACY_API_V2_ASSETS=1` (déprécié, avertissement au démarrage). |
| R2 | `api.queuePrompt` était enveloppé pour suivre les prompts ; l'ordre d'enveloppement avec d'autres extensions n'est pas garanti. | **Corrigé** : plus aucune interception. Sur `execution_start` (websocket), le prompt est lu via l'API Jobs du core (`api.getJobDetail` → `GET /api/jobs/{id}`, champ `workflow.prompt`), puis `/queue` et `/history/{id}` pour les anciens cores. `wrapHostQueuePrompt` a été retiré. |
| R3 | Middlewares insérés en tête de `app.middlewares` (filtrés sur les chemins Majoor ; échec rattrapé si l'app est figée). | Inchangé, sans risque : surveiller l'étape `security_middlewares` dans `/mjr/am/health`. |
| R4 | Doublon fonctionnel avec l'onglet « Assets » natif. | **Corrigé (opt-in)** : réglage `Majoor.Integration.HideNativeAssetsTab` (désactivé par défaut) qui masque l'onglet natif via `getSidebarTabs`/`unregisterSidebarTab` et le restaure à l'identique quand on le désactive. |
| R5 | `requires-python <3.14` bloquait Python 3.14. | **Corrigé** : `>=3.10, <3.15` ; suite complète validée sous 3.14 (1931 tests OK) ; 3.14 ajouté à la matrice CI et à `tox`. |
| R6 | `@comfyorg/litegraph` séparé alors que le frontend exporte ses types. | Ouvert (faible). |
| R7 | `import { app } from "../../scripts/app.js"` (shim encore supporté). | Ouvert (faible). |
| R8 | 913 erreurs de typage dans `tsconfig.test.json`. | **Corrigé** : 0 erreur ; ajouté à la CI (`python-tests.yml`). Un vrai bug de test trouvé au passage (clé `stubs` dupliquée dans `asset_card_inner.vitest.ts`). |

## 3 bis. Audit du système de notifications

| Constat | Avant | Après |
| --- | --- | --- |
| API utilisée | `extensionManager.toast.add()` uniquement, **dépréciée** par ComfyUI (`ToastManager` 1.60). | API typée `success/error/info/warning/loading(title, {description, duration, action, closable, id})` ; `add()` seulement en repli pour les anciens frontends. |
| Détection | `getExtensionToastApi` exigeait `toast.add` : le jour où ComfyUI le retire, **tous les toasts Majoor disparaissent en silence**. | Accepte l'API typée ou `add()`. Test dédié. |
| Opérations longues (restauration/réinitialisation de la base, backfill vectoriel) | Chaque étape (`started`, `running`, …) **empilait un nouveau toast**. | Un seul toast `loading`, mis à jour en place via le même `ToastId`, puis remplacé par le résultat final (succès ou erreur). |
| Toasts persistants | `life` omis. | Durée maximale sûre (2³¹−1 ms) au lieu de `Infinity`, qui serait ramené à 0 par `setTimeout` et fermerait le toast immédiatement. |
| Liens d'action (`actionUrl`) | Ignorés dans le toast. | Bouton d'action natif, limité aux liens `http(s)` et aux chemins relatifs du même site (`javascript:` refusé). |
| Contournements | `genInfoOverridePicker.ts` appelait `toast.add()` directement ; `comfyAlert` utilisait `addAlert`/`add`. | Tout passe par `comfyToast` ou l'API typée. |
| Code mort | Repli `app.ui.toast` (API inexistante dans le frontend actuel), `_dismissAllFallbackErrorToasts` vide, CSS `.mjr-toast*` des anciens toasts DOM. | Supprimés. |
| Démontage | Les toasts en cours restaient affichés. | `dismissTrackedToasts()` à l'arrêt de l'extension. |
| Centre de messages (cloche) | S'ouvrait tout seul lors d'une réinitialisation ou d'un backfill. | Conservé comme **historique consultable** (notes de version, journal, raccourcis), car ComfyUI n'offre pas de boîte de réception aux extensions ; il ne s'ouvre plus de lui-même. |

## 3 ter. Nouveaux assets, suppressions et scans (comparaison avec ComfyUI core)

Comment fait le core (`app/assets`, `comfy_execution/asset_enrichment.py`) :
- il enregistre les sorties **au moment où `executed` est émis**, y compris pour les exécutions servies depuis le cache, sans attendre de scan disque ;
- un fichier disparu est marqué `is_missing` et **récupéré** s'il revient avec le même hash ; un état illisible est « instable » et ne supprime rien ;
- les scans de fond sont mis en pause pendant une génération et signalés par les événements `assets.seed.*`.

| Constat Majoor | Gravité | Correctif |
| --- | --- | --- |
| Triggers `assets_fts` (FTS5 à contenu externe) écrits avec `UPDATE`/`DELETE` : **chaque renommage ou déplacement échouait** (« database disk image is malformed »). Le watcher retombait sur supprimer + réindexer, d'où un nouvel id et la **perte des notes, tags et collections**, plus une fausse « récupération de base corrompue ». | Critique | Triggers avec la commande FTS5 `'delete'`, mise à jour limitée à `filename, subfolder` ; réparation automatique des bases existantes au démarrage, avec reconstruction de l'index (`'rebuild'`). |
| `on_prompt_end` est appelé **avant** `PromptQueue.task_done()` (`main.py` du core) : l'ingestion post-génération pouvait lire un historique vide et n'indexer rien. Le frontend ne couvre que le client qui a lancé le prompt (`executed` n'est envoyé qu'à lui). | Haute | Attente de l'entrée d'historique (backoff 0,05 à 3,2 s, environ 6 s au maximum). |
| Prune de scan : une erreur de `stat` (partage réseau, permission) comptait comme « fichier supprimé », et les données utilisateur étaient effacées. | Haute | Existence à trois états (présent / absent / inconnu) ; racine illisible = aucun prune. |
| Suppressions et déplacements détectés par le watcher ou le prune : aucun événement, cartes périmées dans la grille. | Moyenne | `mjr-assets-removed` (ids) et `mjr-asset-updated` (nouveau chemin) ; le frontend réutilise le retrait en place des suppressions faites depuis l'interface. |
| Scan de fond terminé : aucun rafraîchissement de grille ni notification ; compteur `pruned` gonflé par les cascades. | Moyenne | `mjr-scan-complete` porte `origin` et `needs_refresh` ; un seul rechargement si nécessaire ; un toast natif « N nouveaux, M retirés » pour un scan de dossier ; silence pour les indexations par génération, déjà couvertes par les cartes en direct et le badge. |

Vérifié sans changement :
- le badge de la barre latérale et le flux de génération dédupliquent chaque asset ;
- l'indexation vectorielle automatique est dédupliquée ;
- le rechargement après `mjr-core-execution-assets-ready` sert à finaliser les piles d'exécution et il est différé quand la grille est cachée.

Pistes restantes :
- marquage « manquant » réversible façon core, plutôt qu'une suppression définitive, pour récupérer un fichier qui revient ; cela demande une migration de schéma ;
- retirer aussi du flux de génération les éléments supprimés hors de l'interface ;
- un seul événement par nouvel asset au lieu de `mjr-asset-added` plus `mjr.asset.indexed` (chacun doublé par l'enveloppe `mjr.event`).

## 3 quater. Piles de doublons : gel de ComfyUI et piles « corrompues »

**Symptôme.** Un clic sur le badge de doublons (icône de copie suivie d'un nombre) gèle tout l'onglet ComfyUI ; certaines piles empilent des images qui n'ont rien à voir entre elles.

**Cause du gel : une boucle de rendu Vue infinie.**
1. Le template de `VirtualAssetGridHost.vue` lit `asset._mjrDupStack` et `asset._mjrDupCount`, et passe `:ref="getCardRef(asset)"`, qui crée une nouvelle fonction à chaque rendu. Vue rappelle donc les refs à chaque rendu (`null`, puis l'élément).
2. `bindCardRef` appelait `syncRenderedDuplicateCards`, qui remettait `_mjrDupStack` à `false` sur tous les membres puis à `true` sur une carte principale, et assignait un nouveau tableau `_mjrDupMembers`.
3. En parallèle, le `computed` `displayAssets` faisait l'inverse, avec une autre carte principale (`bucket[0]` contre `selectStackRepresentative`).
4. Chaque écriture relançait le rendu du parent, donc les refs, donc de nouvelles écritures. En production, Vue n'a pas de limite de récursion : l'onglet tourne à l'infini.

La vue « doublons » déclenchait la boucle à coup sûr : elle affiche N cartes de même nom, aussitôt re-regroupées. Un test le reproduit : **31 rendus en 5 passages** avec l'ancien code, contre zéro rendu supplémentaire après correctif.

**Cause de la « corruption ».** Quatre définitions du doublon coexistaient :
- `AssetCardRenderer` et `displayAssets` : même nom dans le même source / racine / sous-dossier ;
- `useVirtualGrid.dedupeAssetsByKey` et `syncRenderedDuplicateCards` : **nom seul, tous dossiers confondus**.

Ces deux derniers retiraient de `state.assets` des fichiers distincts d'autres dossiers et les rangeaient sous une mauvaise carte. Celle-ci recevait au passage le temps de génération d'une autre image (`preserveRepresentativeGenerationTime`).

**Correctif**
- `buildDisplayAssets` est la seule source de vérité. Ses écritures sont gardées (assignation seulement si la valeur brute change, tableau des membres conservé tant que la composition ne change pas), avec une option `collapseDuplicates`.
- `syncRenderedDuplicateCards` ne touche plus l'état réactif.
- Une seule fonction de ref par carte (`getCardRef`).
- `dedupeAssetsByKey` ne retire plus que les vrais doublons (même id ou même clé).
- `AssetCardRenderer.appendAssets` ne retire plus de copies : il ne fait que compter.
- La vue « doublons » (scope `similar`) liste toutes les copies, avec des membres copiés sans cycle (`toDuplicateGroupMembers`).

**À suivre.** Une pile « même dossier, même nom » correspond à plusieurs lignes en base pour un même fichier. C'est possible avec des index créés par d'anciennes versions, par exemple des variantes de casse sous Windows : les insertions actuelles normalisent le chemin. Une fusion de ces lignes, qui conserverait notes, tags et collections, reste à faire comme opération de maintenance explicite.

## 3 quinquies. Recherche, fichiers JSON, sidecars et viewers

### Recherche (FTS5)
Testée sur un vrai index avec des noms piégeux.

| Requête | Avant | Après |
| --- | --- | --- |
| `at-7` (frappe en cours), `(2)`, `AND`, `NEAR`, `NOT x`, `x` | erreur « Invalid search query syntax » | résultats |
| `"` seul (début d'une phrase) | erreur | tout afficher |
| `портрет`, `猫の写真` | caractères supprimés, donc erreur | recherche dans l'écriture d'origine |

Cause : `_sanitize_fts_query` retirait les mots-outils, les jetons d'un caractère et les opérateurs, puis tous les caractères non ASCII. Quand il ne restait rien, SQLite recevait un `MATCH ''` invalide.

Correctif :
- jetons `\w+` dans toutes les écritures ;
- repli sur les termes bruts quand le filtrage vide tout ;
- requête sans caractère de mot traitée comme « tout afficher » ;
- retrait des accents limité au latin, comme `unicode61`.

Les mots réservés en minuscules sont des mots ordinaires pour FTS5, ses opérateurs n'existant qu'en majuscules.

### Sidecars JSON
- Avant : uniquement pour la 3D (`<fichier>.json`).
- Maintenant : pour toutes les images, vidéos et fichiers audio (module `features/metadata/sidecar.py`). On cherche `<fichier>.<ext>.json`, puis `<nom>.json`. Le fichier peut contenir un workflow UI, un prompt API ou un wrapper `{workflow, prompt}` (valeurs éventuellement sous forme de chaîne JSON), plus `parameters`, `geninfo` et `generation_time_ms`. Taille maximale 10 Mo, BOM accepté.
- Les métadonnées intégrées au fichier restent prioritaires.
- Un JSON sans rapport (des réglages, par exemple) n'est pas pris pour un sidecar.

Limite connue : un sidecar ajouté **après** l'indexation n'est pris en compte qu'au prochain scan forcé, car la date de modification du média ne change pas.

### Reconnaissance des JSON de workflows (onglet Workflow)
Vérifié sur un vrai dossier :
- les instantanés `.history/<nom>/<date>.json` apparaissaient comme workflows ;
- un `settings.json` quelconque apparaissait comme workflow ;
- un workflow avec BOM disparaissait ;
- un prompt API s'affichait avec 0 nœud puis s'ouvrait sur un canvas vide.

Correctif :
- parcours qui ignore les dossiers et fichiers cachés ;
- `workflow_json_format()` (`ui`, `api` ou rien), qui accepte aussi un workflow vide et les wrappers ;
- lecture en `utf-8-sig` ;
- les JSON invalides sortent de l'index ;
- ouverture côté frontend par `app.loadApiJson` pour le format API ;
- `loadGraphData`, devenu asynchrone, n'a plus de rejet non géré.

### Viewers
- **Viewer principal** : les médias sont correctement libérés (`destroyMediaProcessorsIn` : pause, retrait de `src`, `load()`), et les écouteurs globaux sont retirés.
- **Viewer flottant** : il ne faisait que mettre en pause avant `replaceChildren()` et `dispose()`. Une `<video>` détachée garde son lecteur, et Chromium en limite le nombre (environ 75). En mode Live, qui se réaffiche à chaque génération, les lecteurs s'accumulaient. Ils sont maintenant libérés (`releaseFloatingViewerMediaIn`) ; `hide()` continue seulement de mettre en pause, pour pouvoir réafficher.
- **À décider** : quand il est visible, le viewer flottant intercepte en phase de capture les touches simples `v`, `k`, `l` et `c` sur toute la page, hors champs de saisie. Aucun raccourci ComfyUI par défaut n'est touché, mais un raccourci personnalisé sur ces touches serait masqué. On pourrait limiter l'interception aux moments où le focus est dans le viewer.

## 3 sexies. Correctifs de suivi

| Point ouvert | Correctif |
| --- | --- |
| Un sidecar ajouté **après** l'indexation était ignoré. Le cache de métadonnées est indexé par l'état du média seul, et une réindexation non incrémentale sautait les assets ayant déjà des métadonnées « riches ». | Le watcher traite les `.json` (`sidecar_media_paths`) : il invalide le cache et le journal du média (`invalidate_cached_metadata`), puis le réindexe en mode non incrémental (`build_sidecar_reindex_callback`). Le raccourci « métadonnées riches » ne s'applique plus qu'en mode incrémental. |
| Lignes en double pour un même fichier (casse ou séparateur différents sous Windows, héritage d'anciennes versions), affichées en fausses piles de doublons. | `adapters/db/schema_dedupe.py`, au démarrage, sous Windows seulement : fusion vers l'orthographe canonique, avec note maximale, union des tags (via `INSERT` pour mettre à jour la recherche), couverture de pile, identifiants d'exécution et embedding. Ne fait rien si l'index est propre. |
| Le flux de génération gardait les éléments supprimés. | `removeGeneratedAssets()`, appelé sur `ASSETS_DELETED` (suppression depuis l'interface ou sur le disque). |
| Les raccourcis `v`, `k`, `l` et `c` du viewer flottant étaient interceptés sur toute la page. | Actifs seulement si la souris ou le focus sont dans le viewer, ou depuis sa fenêtre pop-out. |
| R6 : paquet `@comfyorg/litegraph` séparé. | Types repris de `@comfyorg/comfyui-frontend-types`, paquet retiré. |
| 5 fichiers frontend morts (signalés par knip). | Supprimés. |
| Test dépendant de l'ordre (`test_comfy_core_adapter_reads_input_output_directories`). | La fixture laissait fuir `MJR_AM_INPUT_DIRECTORY` (restaurée par `monkeypatch.delenv` en fin de test) ; corrigé. |

Reste volontairement inchangé : l'import `../../scripts/app.js` (R7), un shim toujours supporté par ComfyUI.

## 4. Feuille de route d'évolution (meilleure intégration)

1. **Progression par nœud** — écouter l'événement websocket `progress_state`
   (déclaré dans `comfyui-frontend-types`) pour une progression fiable dans les
   sous-graphes et en exécution parallèle, en complément de `progress`.
2. **API Jobs du core** — déjà utilisée pour la progression (R2) ; étendre à
   `api.getJobAssets` pour rattacher chaque sortie à son prompt.
3. **API Assets du core** — quand `capabilities.assets` est vrai, synchroniser
   les tags/notes avec `/api/assets` (lecture seule d'abord), afin que les
   assets soient visibles dans les deux panneaux sans double indexation.
4. **Multi-utilisateur** — brancher `onAuthUserResolved` (nouveau hook
   d'extension) pour rafraîchir les réglages par utilisateur au lieu de sonder.
5. **Barre d'actions** — `actionBarButtons` / `topbarBadges` remplacent proprement
   le bouton MFV injecté dans la barre supérieure (`teardownTopBarMfvButton`).
6. **Mode Nodes 2.0 (Vue)** — vérifier que le flux de nœuds (`nodeStream`) et
   les menus contextuels fonctionnent quand le canvas LiteGraph n'appelle plus
   `onDrawForeground` ; privilégier les données d'exécution aux hooks de dessin.

## 5. Règles pour rester sans conflit

- Ne jamais enregistrer de route hors de `/mjr/am/*` (ni sous `/api/*`).
- Toute nouvelle API ComfyUI passe par `hostAdapter.ts` (front) ou
  `adapters/comfy_core.py` (back), avec détection de capacité et repli.
- Préfixer réglages (`Majoor.*`), commandes (`mjr.*`), événements websocket
  (`mjr-*` / `mjr.*`) et clés de requête (`request_keys.py`).
- Ne pas modifier de prototypes LiteGraph ni d'objets globaux du core ; un
  enveloppement inévitable doit être réversible (cf. `wrapHostQueuePrompt`).
- Reconstruire `dist/` (`npm run build`) à chaque modification de `ui/`.
