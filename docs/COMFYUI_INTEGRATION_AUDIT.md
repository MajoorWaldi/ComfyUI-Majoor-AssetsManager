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
