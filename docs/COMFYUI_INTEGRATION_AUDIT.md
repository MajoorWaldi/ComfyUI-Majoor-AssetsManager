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

## 3. Risques de conflit restants (non modifiés, à décider)

| # | Risque | Gravité | Recommandation |
| --- | --- | --- | --- |
| R1 | La couche de compatibilité `/api/v2/assets/*` occupe un espace de noms qui appartient au core (`/api/...`). Si ComfyUI publie un jour `/api/v2/assets`, les routes du core (enregistrées en premier) masqueront silencieusement celles de Majoor. | Moyenne | Exposer la même surface sous `/mjr/am/compat/assets/*`, garder `/api/v2/assets` comme alias déprécié, puis le retirer. |
| R2 | `api.queuePrompt` est enveloppé (`floatingViewerProgress.ts`) pour suivre les prompts. Fonctionne, mais d'autres extensions font de même et l'ordre d'enveloppement n'est pas garanti. | Faible | Le frontend envoie déjà `execution_start` avec `prompt_id` ; à terme, s'appuyer uniquement sur les événements websocket et l'API Jobs du core (`adapters/comfy_core` détecte déjà `jobs`). |
| R3 | Les middlewares sont insérés en tête de `app.middlewares`. Ils filtrent bien les chemins Majoor, mais l'insertion échoue si l'app est déjà figée (`freeze()`), ce qui est rattrapé et signalé en « degraded » dans `/mjr/am/health`. | Faible | Garder ; surveiller l'étape `security_middlewares` dans le rapport de démarrage. |
| R4 | Doublon fonctionnel avec la barre latérale native « Assets » du frontend (onglet média du core). Les ID (`majoor-assets`) ne se chevauchent pas, mais deux panneaux similaires coexistent. | UX | Proposer un réglage « Remplacer l'onglet Assets natif » plutôt que masquer quoi que ce soit par défaut. |
| R5 | `requires-python = ">=3.10, <3.14"` : bloque les installations ComfyUI en Python 3.14 via le Registry/comfy-cli. | Moyenne | Vérifier les roues `av`, `blake3`, `pywin32` pour 3.14, lancer la CI sur 3.14, puis relever la borne. |
| R6 | `@comfyorg/litegraph@0.17.2` en devDependency : LiteGraph est désormais intégré au frontend et ses types sont exportés par `comfyui-frontend-types`. | Faible | Importer `LGraph`/`LGraphCanvas` depuis `@comfyorg/comfyui-frontend-types` et retirer le paquet séparé. |
| R7 | `import { app } from "../../scripts/app.js"` dans `ui/entry.ts` : shim encore supporté, mais le frontend pousse vers `window.comfyAPI` et a déjà déprécié d'autres modules `scripts/*`. | Faible | `comfyApiBridge` sait déjà attendre l'app ; préférer `window.comfyAPI?.app?.app` avec repli sur l'import. |
| R8 | 913 erreurs de typage dans `tsconfig.test.json` (script « advisory »). | Dette | Les réduire progressivement ; ne bloque pas le runtime. |

## 4. Feuille de route d'évolution (meilleure intégration)

1. **Progression par nœud** — écouter l'événement websocket `progress_state`
   (déclaré dans `comfyui-frontend-types`) pour une progression fiable dans les
   sous-graphes et en exécution parallèle, en complément de `progress`.
2. **API Jobs du core** — utiliser l'historique/les jobs du core (déjà détectés
   par `ComfyCoreCapabilities.jobs`) pour rattacher chaque sortie à son prompt,
   au lieu de reconstruire cet état côté Majoor.
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
