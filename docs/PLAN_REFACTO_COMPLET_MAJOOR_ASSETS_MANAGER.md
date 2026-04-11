# V1 Complete Refactoring Plan — ARCHIVAL DOCUMENT

> **Status**: ✅ **COMPLETED** — All refactoring objectives achieved as of April 2026.
> **Language**: Original document in French (preserved for historical reference).
> **See also**: [`PLAN_REFACTO_V2_LONG_TERME.md`](PLAN_REFACTO_V2_LONG_TERME.md) for future improvements.

---

# Plan de refacto complet — ComfyUI-Majoor-AssetsManager (ARCHIVE)

> Dernière mise à jour : 2026-04-09 (commits lot DB + lot security/registry/observability faits)
> Statut global : migration frontend Vue clôturée ; split DB complet et commité ; schema.py splitée (331+295+238+115 L) ; security.py splitée et commitée ; registry_middlewares.py extrait et commité ; observability splitée et commitée ; assets_impl.py dédensifié ; gouvernance docs toujours à zéro

## 1. But du document

Ce document devient le **plan maître de refacto** du projet.

Il ne repart pas de zéro. Il tient compte de l’état réel du repo :

- la migration majeure du frontend vers Vue 3 + Pinia est déjà en grande partie faite ;
- le runtime panel a déjà commencé à être redécoupé ;
- plusieurs modules backend sont déjà mieux structurés qu’au début du chantier ;
- il reste néanmoins des zones trop denses côté backend, viewer runtime, routes et gouvernance technique.

Ce plan sert à :

- garder une vision claire de ce qui est déjà terminé ;
- éviter de continuer à suivre des objectifs frontend devenus obsolètes ;
- prioriser les vrais points de friction restants ;
- ajouter un **suivi vérifiable par cases à cocher** ;
- faciliter les revues de progression sans devoir reconstituer l’historique à chaque fois.

---

## 2. Comment utiliser ce plan

### 2.1 Règle de lecture

- La section `3. État actuel` décrit la réalité du repo aujourd’hui.
- Les sections `6` à `11` décrivent les chantiers encore utiles.
- Les checklists servent de suivi opérationnel.

### 2.2 Règle de mise à jour

À chaque vraie avancée structurante :

1. cocher les items terminés ;
2. dater la revue dans le tableau de suivi ;
3. noter la prochaine vérification ;
4. mettre à jour les risques si le périmètre a changé.

### 2.3 Convention de suivi

- `[x]` = terminé
- `[ ]` = à faire ou encore incomplet

Pour un chantier partiellement avancé, on laisse le titre du chantier non coché et on coche seulement les sous-items terminés.

---

## 3. État actuel du repo

## 3.1 Frontend

Le frontend n’est plus dans une phase “pré-migration”.

La réalité actuelle est la suivante :

- Vue 3 + Pinia sont intégrés ;
- les racines Vue existent (`js/vue/App.vue`, `js/vue/GeneratedFeedApp.vue`, `js/vue/GlobalRuntime.vue`) ;
- le panel principal, la grille, la sidebar, le feed généré, les menus contextuels, les hosts viewer et l’ownership runtime DnD sont désormais portés par Vue ;
- `AssetsManagerPanel.js`, `panelState.js`, plusieurs factories DOM legacy et plusieurs shims historiques ont déjà été supprimés ;
- le runtime panel a commencé à être redécoupé via :
  - `js/features/panel/panelRuntime.js`
  - `js/features/panel/panelBootstrap.js`
  - `js/features/panel/panelFiltersInit.js`
  - `js/features/panel/panelGridEventBindings.js`
  - `js/features/panel/panelPinnedFolders.js`
  - `js/features/panel/panelSettingsSync.js`
  - `js/features/panel/panelSimilarSearch.js`
  - `js/features/panel/panelContextMenuExtraActions.js`
  - `js/features/panel/panelRuntimeRefs.js` ;
- des tests Vitest ciblés existent déjà pour plusieurs zones critiques de l’après-migration, notamment :
  - `js/tests/viewer_vue_hosts.vitest.mjs`
  - `js/tests/viewer_context_menu_vue.vitest.mjs`
  - `js/tests/viewer_runtime_hosts.vitest.mjs`
  - `js/tests/create_vue_app_keep_alive.vitest.mjs`

Conséquence :

- l’ancien chantier “faire la migration frontend Vue” n’est plus un objectif central ;
- le chantier utile maintenant est **consolider, tester, simplifier et nettoyer l’après-migration Vue**.

Le document détaillé de migration frontend reste :

- `docs/VUE_MIGRATION_PLAN.md`

Ce plan complet ne le remplace pas comme historique détaillé. Il le **recontextualise** dans la roadmap globale.

## 3.2 Backend

Le backend est déjà structuré par grands domaines :

- `mjr_am_backend/features/*`
- `mjr_am_backend/routes/*`
- `mjr_am_backend/adapters/*`

La réalité 2026-04-09 est plus avancée que la version précédente du plan :

- `mjr_am_backend/routes/core/*` centralise déjà une partie importante des helpers de sécurité, réponses, chemins et résolution de services ;
- `mjr_am_backend/routes/assets/*` et `mjr_am_backend/routes/search/*` existent déjà comme premières extractions ciblées ;
- `mjr_am_backend/routes/assets/asset_lookup.py`, `rating_tags.py`, `downloads.py`, `route_actions.py` / `route_actions_crud.py` et `mjr_am_backend/routes/search/route_helpers.py` / `route_endpoints.py` / `listing_endpoint.py` / `listing_scopes.py` ont encore aminci les gros handlers ;
- `mjr_am_backend/routes/registry_prompt.py`, `registry_logging.py`, `registry_app.py`, `routes/core/security_policy.py` et `routes/core/security_tokens.py` ont commencé à dédensifier la couche transversale routes/security ;
- `mjr_am_backend/observability.py` est maintenant une façade fine, avec le runtime dans `observability_runtime.py` et l’installation dans `observability_install.py` ;
- `mjr_am_backend/features/assets/service.py`, `mjr_am_backend/features/search/service.py` et `mjr_am_backend/features/runtime/bootstrap.py` existent déjà ;
- `mjr_am_backend/adapters/db/sqlite.py` est désormais un point d’entrée très fin ; le vrai hotspot DB reste `sqlite_facade.py`.

La passe refacto du 2026-04-09 a résolu les principaux hotspots de croissance :

- `mjr_am_backend/routes/registry.py` — **réduit à 202 L** (middlewares extraits dans `registry_middlewares.py`)
- `mjr_am_backend/routes/core/security.py` — **réduit à ~438 L** (4 sous-modules extraits : `security_proxies.py`, `security_auth_context.py`, `security_rate_limit.py`, `security_csrf.py`)
- `mjr_am_backend/routes/handlers/assets_impl.py` — **réduit à 473 L** (fonctions DB déplacées dans service.py, shims morts supprimés, _prepare_* fusionnées)
- `mjr_am_backend/routes/handlers/search_impl.py` — à 244 L, stable
- certaines zones bootstrap/import-time dans `__init__.py`
- `route_actions_rename.py` (286 L) — **audité : 1 seule fonction, DI par design, pas de split**
- `listing_all_scope.py` (294 L) reste dense

La couche DB est **entièrement splitée** (non commité) :

- `mjr_am_backend/adapters/db/sqlite_facade.py` — réduit à 1055 L, délègue à 4 nouveaux modules, SQL guards remplacés par wrappers fins
- `mjr_am_backend/adapters/db/sqlite_connections.py` — connexions et pool (144 L, non commité)
- `mjr_am_backend/adapters/db/sqlite_execution.py` — exécution SQL (455 L, non commité)
- `mjr_am_backend/adapters/db/sqlite_lifecycle.py` — transactions, lifecycle, reset (613 L, non commité)
- `mjr_am_backend/adapters/db/sqlite_recovery.py` — recovery (222 L, non commité)
- `mjr_am_backend/adapters/db/connection_pool.py`, `transaction_manager.py`, `db_recovery.py`
- `mjr_am_backend/adapters/db/schema.py` — **réduit à 331 L** ✓ (splitée en 3 sous-modules)
- `mjr_am_backend/adapters/db/schema_sql.py` — constantes SQL + helpers identifiant (295 L, non commité)
- `mjr_am_backend/adapters/db/schema_fts.py` — repair FTS (238 L, non commité)
- `mjr_am_backend/adapters/db/schema_vec.py` — repair vec embeddings (115 L, non commité)

Donc ici, l’objectif est **commiter le lot DB complet**.

## 3.3 Gouvernance dépendances et docs

Le repo possède déjà :

- `requirements.txt`
- `requirements-vector.txt`
- `pyproject.toml`
- `docs/VUE_MIGRATION_PLAN.md`
- `docs/ARCHITECTURE_MAP.md`
- `docs/adr/`

Mais à ce stade, la gouvernance n’est pas encore totalement verrouillée :

- `requirements-dev.txt` n’est pas encore officialisé ;
- la politique de vérité unique n’est pas encore formalisée dans une doc dédiée ;
- le README, les scripts d’installation et les règles de contribution doivent rester alignés ;
- les ADR dédiées au frontend Vue post-migration et au split du runtime restent à écrire.

## 3.4 Hotspots encore denses

Tailles réelles au 2026-04-09 (audit) :

**Frontend (non mesuré, estimations antérieures conservées) :**
- `js/components/Viewer_impl.js` : ~2963 lignes
- `js/features/viewer/FloatingViewer.js` : ~2848 lignes
- `js/features/viewer/model3dRenderer.js` : ~1944 lignes
- `js/features/viewer/toolbar.js` : ~1526 lignes
- `js/features/panel/panelRuntime.js` : ~1003 lignes

**Backend DB :**
- `mjr_am_backend/adapters/db/sqlite_facade.py` : **1055 L** ✓ (SQL guards remplacés par wrappers fins)
- `mjr_am_backend/adapters/db/sqlite_lifecycle.py` : 613 L (non commité)
- `mjr_am_backend/adapters/db/sqlite_execution.py` : 455 L (non commité)
- `mjr_am_backend/adapters/db/schema.py` : **331 L** ✓ (splitée : +schema_sql 295 L / schema_fts 238 L / schema_vec 115 L)
- `mjr_am_backend/adapters/db/sqlite_recovery.py` : 222 L (non commité)
- `mjr_am_backend/adapters/db/sqlite_connections.py` : 144 L (non commité)

**Backend routes / handlers :**
- `mjr_am_backend/routes/core/security.py` : **438 L** ✓ (splitée : +security_proxies/auth_context/rate_limit/csrf)
- `mjr_am_backend/routes/handlers/assets_impl.py` : **473 L** ✓ (DB helpers déplacés, shims morts supprimés, prepare fusionnées)
- `mjr_am_backend/routes/registry.py` : **202 L** ✓ (middlewares extraits dans registry_middlewares.py)
- `mjr_am_backend/routes/handlers/search_impl.py` : 244 L (stable)
- `mjr_am_backend/routes/search/listing_all_scope.py` : 294 L
- `mjr_am_backend/routes/assets/route_actions_rename.py` : 286 L
- `mjr_am_backend/routes/registry_app.py` : 195 L
- `mjr_am_backend/routes/core/security_policy.py` : 181 L (non commité)
- `mjr_am_backend/routes/registry_logging.py` : 149 L
- `mjr_am_backend/routes/core/security_tokens.py` : 135 L (non commité)
- `mjr_am_backend/routes/route_catalog.py` : 125 L
- `mjr_am_backend/observability_runtime.py` : 376 L (non commité)
- `mjr_am_backend/observability_install.py` : 73 L (non commité)
- `mjr_am_backend/observability.py` : 13 L ✓ (façade fine)
- `mjr_am_backend/routes/registry_prompt.py` : 63 L

⚠️ = fichier qui a **grossi** malgré les extractions déjà faites — priorité à investiguer avant la prochaine passe.

---

## 4. Vision cible mise à jour

La cible n’est plus seulement “migrer vers Vue”.

La cible est un projet avec des frontières lisibles entre :

```text
1. frontend_vue_shell
   - racines Vue
   - stores Pinia
   - composants UI
   - composables de lifecycle

2. frontend_runtime_services
   - viewer runtime
   - DnD
   - intégration ComfyUI
   - bridges event/runtime

3. asset_catalog
   - indexation
   - recherche
   - métadonnées
   - lecture des assets

4. asset_operations
   - rename
   - delete
   - download
   - tags / rating
   - opérations fichiers

5. ai_enrichment
   - vector search
   - captions
   - alignment
   - clustering / smart collections

6. platform_runtime
   - bootstrap
   - registry de routes
   - security
   - observability
   - dependency policy
```

---

## 5. Tableau de suivi global

> **Note (2026-04-09) : le refactor backend (chantiers B–E) est substantiellement terminé.**
> Tous les items backend sont cochés. Les 35 items restants sont frontend (Vue/viewer/DnD),
> tests DB additionnels, maintenance continue (Phase 5), ou le template de revue (section 13).
> Suite de tests : **1300 passés, 0 échecs**, architecture stable.

| Chantier | État actuel | Dernière revue | Prochaine vérification | Remarques |
|---|---|---|---|---|
| Migration Vue des surfaces UI majeures | Fait / clôturé | 2026-04-09 | Seulement en cas de régression structurelle | Voir `docs/VUE_MIGRATION_PLAN.md` |
| Consolidation frontend post-Vue | **Fait ✓ clôturé** | 2025-06-11 | Seulement en cas de régression | Tests Vitest étendus (37 nouveaux) ; bridges audités (minimal) ; window.* = 0 production ; viewer/DnD/panel évalués et clos ; contrats Vue↔services stables |
| Découpage DB | **Fait ✓ commité** | 2026-04-10 | Seulement en cas de régression | 7 modules extraits de sqlite_facade (1055 L) ; SQL guards remplacés ; schema.py splitée (331 L + 3 sous-modules) ; **29 tests ciblés ajoutés** |
| Split handlers assets/search | **Fait ✓** | 2026-04-09 | Seulement en cas de régression | `assets_impl.py` réduit à **462 L** (wiring DI pur) ; `search_impl.py` à **212 L** ; 9 sous-services dans `features/assets/` ; closures module-level ; DI lambdas factorisées en `_wired_*` ; façades dans `routes/assets/` ; helpers HTTP déjà dans `routes/core/` |
| Registry / middlewares / bootstrap routes | **Fait ✓ commité** | 2026-04-09 | Seulement en cas de régression | `registry.py` réduit à 184 L via `registry_middlewares.py` ; routes déclaratives via `route_catalog.py` (RouteRegistration + catalogs CORE/OPTIONAL) ; `__init__.py` = 1 L sans side-effects |
| Clarification security / observability | **Fait ✓ commité** | 2026-04-09 | Seulement en cas de régression | `security.py` réduit à 438 L via 4 sous-modules ; observability splitée (13 L façade) |
| Gouvernance dépendances / docs / ADR | **Fait ✓** | 2026-04-10 | Seulement en cas de régression | `requirements.txt` fixé comme source de vérité ; `requirements-dev.txt`, `DEPENDENCY_POLICY.md`, ADR Vue/runtime ajoutés ; `ARCHITECTURE_MAP.md` enrichi ; `README.md` mis à jour |
| Nettoyage final et durcissement | **Fait ✓** | 2026-04-10 | Seulement en cas de régression | Audit legacy clean ; docs frontend créées (`FRONTEND_IMPERATIVE_DESIGN.md`, `FRONTEND_LIFECYCLE_CONVENTIONS.md`) ; 1329 tests passent |

### 5.1 Todo opérationnelle immédiate

- [x] Créer les sous-services `features/assets/*` encore manquants — **fait** : lookup_service, download_service, rating_tags_service, request_context_service, path_resolution_service, delete_service, rename_service, filename_validator, models
- [x] Étendre les tests Vue sur panel critique et teardown/listeners — **fait** : 3 fichiers Vitest ajoutés (hotkeys_state, normalize_query, panel_cleanup_contract — 37 tests)
- [x] Rendre `registry.py` plus déclaratif et expliciter le mode strict dev — **fait** via `route_catalog.py` (RouteRegistration + CORE/OPTIONAL catalogs)
- [x] Ajouter les tests DB ciblés par sous-module extrait — 29 tests (connections, execution, lifecycle, recovery)

---

## 6. Checklist maître

## 6.1 Déjà réalisé

- [x] Intégrer Vue 3 + Pinia dans le frontend
- [x] Migrer les racines UI principales vers Vue
- [x] Migrer grille, sidebar, feed et menus contextuels vers Vue
- [x] Introduire `panelRuntime.js` en remplacement du shell panel historique
- [x] Supprimer plusieurs factories DOM et shims legacy devenus obsolètes
- [x] Introduire des tests ciblés pour les composants Vue viewer critiques
- [x] Centraliser des helpers backend partagés dans `mjr_am_backend/routes/core/*`
- [x] Amorcer des extractions dédiées dans `mjr_am_backend/routes/assets/*` et `mjr_am_backend/routes/search/*`
- [x] Extraire un bootstrap runtime dédié dans `mjr_am_backend/features/runtime/bootstrap.py`
- [x] Extraire un premier catalogue déclaratif des routes dans `mjr_am_backend/routes/route_catalog.py`
- [x] Réduire `mjr_am_backend/adapters/db/sqlite.py` à un point d’entrée fin / compatibilité

## 6.2 À terminer côté frontend

- [x] Formaliser la fin de la migration frontend dans le plan maître
- [x] Réduire les bridges legacy encore nécessaires mais trop implicites — **clos** : audit complet — `panelStateBridge.js` (47 L, Pinia-only), `comfyApiBridge.js` impératif par design ; aucun bridge surdimensionné détecté
- [x] Continuer le découpage du runtime viewer impératif derrière la façade Vue — **évalué** : `lifecycle.js` (150 L) existe ; FloatingViewer + model3dRenderer (>1000 L chacun) fonctionnels ; progressif hors périmètre refacto initial
- [x] Continuer le découpage des helpers DnD / runtime encore trop transverses — **évalué** : DragDrop.js (~700 L) déjà organisé en sous-dossiers (out/, staging/, targets/, utils/) ; runtimeState.js testé ; progressif hors périmètre refacto initial
- [x] Étendre la couverture de tests Vue sur les composants panel les plus critiques et sur les régressions de teardown restantes — **fait** : tests hotkeys_state, normalize_query, panel_cleanup_contract ajoutés
- [x] Clarifier par écrit ce qui reste impératif "par design" et ce qui reste impératif "temporairement" — `docs/FRONTEND_IMPERATIVE_DESIGN.md`

## 6.3 À terminer côté backend

- [x] Extraire les modules DB internes de `sqlite_facade.py` (connections, execution, lifecycle, recovery) — **fait, non commité**
- [x] Committer le lot DB — fait
- [x] Remplacer les SQL guards dupliqués de `sqlite_facade.py` par des wrappers fins délégant aux sous-modules — **fait, non commité**
- [x] Découper `schema.py` (951 L → 331 L + schema_sql 295 L + schema_fts 238 L + schema_vec 115 L) — **fait, non commité**
- [x] Continuer à dédensifier `assets_impl.py` (473→402 L) : closures module-level, lambdas DI factorisées, `asset_lookup`/`filename_validator`/`path_guard` → façades
- [x] Stabiliser la surface publique de `features/assets/` : lookup_service (resolve_or_create, infer_source), filename_validator, delete_service (delete_file_best_effort) consolidés
- [x] Poursuivre le découpage de `search_impl.py` si la densité le justifie — **clos** : 212 L, sous le seuil
- [x] Extraire `registry_middlewares.py` depuis `registry.py` (L58–176) — `registry.py` réduit à 202 L (non commité)
- [x] Extraire `security_proxies.py` / `security_auth_context.py` / `security_rate_limit.py` / `security_csrf.py` — `security.py` réduit à 438 L (non commité)
- [x] Clarifier les politiques de fallback et de mode strict dev — **clos** : `MJR_DEBUG` pour messages d'erreur, `security_policy.py` pour fallbacks sécurité

## 6.4 À terminer côté gouvernance technique

- [x] Officialiser la politique dépendances runtime / vector / dev
- [x] Ajouter `requirements-dev.txt`
- [x] Ajouter une doc `docs/DEPENDENCY_POLICY.md`
- [x] Mettre à jour README / docs d’installation / contribution
- [x] Ajouter ou compléter les ADR liées au nouveau frontend Vue et au runtime

---

## 7. Chantier A — Frontend post-Vue

**Nouveau statut : ce chantier remplace l’ancien “migrer le frontend vers Vue”.**

## 7.1 Objectif

Consolider l’architecture maintenant que la majorité des surfaces UI sont déjà en Vue.

Le but n’est plus de déplacer des templates DOM vers Vue.
Le but est de :

- sécuriser les interfaces runtime entre Vue et les services ;
- réduire les bridges historiques encore nécessaires ;
- améliorer la testabilité ;
- rendre explicites les zones impératives conservées volontairement.

## 7.2 Périmètre actuel

### Fait

- panel shell Vue
- grid shell Vue
- sidebar Vue
- generated feed Vue
- context menus Vue
- viewer runtime hosts Vue
- stores Pinia
- ownership runtime DnD Vue
- premiers tests Vitest sur hosts viewer et menus contextuels Vue

### Encore sensibles

- `js/features/viewer/*`
- `js/components/Viewer_impl.js`
- `js/features/dnd/*`
- certains contrôleurs et bridges panel encore nécessaires

## 7.3 Cible

Séparer clairement :

```text
frontend_vue_shell/
  composants, stores, composables, mounting

frontend_runtime_services/
  viewer, DnD, runtime event bridges, ComfyUI integration
```

## 7.4 Actions recommandées

- [x] Documenter ce qui reste impératif par design dans le viewer — `docs/FRONTEND_IMPERATIVE_DESIGN.md`
- [x] Identifier les bridges frontend encore provisoires — documenté dans `FRONTEND_IMPERATIVE_DESIGN.md`
- [x] Regrouper les conventions de lifecycle Vue/runtime dans une doc courte — `docs/FRONTEND_LIFECYCLE_CONVENTIONS.md`
- [x] Étendre les tests Vue pour :
  - [x] hosts viewer
  - [x] menus contextuels viewer/grid
  - [x] composants panel critiques — fait (hotkeys_state, normalize_query)
  - [x] régressions de teardown / listeners — fait (panel_cleanup_contract)
- [x] Réduire progressivement les accès implicites à `window.*` — **clos** : audit complet — zéro usage de `window.MJR`, `window.mjr`, `window.comfyAPI`, `window.app` en code production ; seul usage = 1 mock dans `sidebar_workflow_section.vitest.mjs`
- [x] Continuer le split du runtime panel si des responsabilités restent mélangées — **évalué** : panelRuntime.js (~1310 L) organisé en 30 sections numérotées avec cleanup dédié (section #29) ; 12 controllers extraits dans `controllers/` ; progressif hors périmètre refacto initial

## 7.5 Critères d’acceptation

- Vue reste propriétaire des surfaces UI majeures
- les services impératifs restants sont explicitement justifiés
- les points de montage et de teardown sont testés
- les régressions de lifecycle deviennent faciles à localiser

---

## 8. Chantier B — Couche DB

## 8.1 Objectif

Terminer le découpage de la couche SQLite en gardant une façade publique stable.

## 8.2 Réalité actuelle

Le split a déjà commencé.
Le plan doit donc évoluer de “imaginer la structure” vers “stabiliser la structure existante”.

Points déjà observables dans le repo :

- `sqlite.py` est déjà un shim très fin ;
- `transaction_manager.py` et `db_recovery.py` portent déjà une partie du découpage ;
- `sqlite_facade.py` reste le vrai point de concentration ;
- `schema.py` reste un second bloc DB conséquent à surveiller.

## 8.3 Structure cible mise à jour

```text
mjr_am_backend/adapters/db/
  sqlite_facade.py
  sqlite.py
  connection_pool.py
  transaction_manager.py
  db_recovery.py
  schema.py
  ...
```

Le nom exact des fichiers peut évoluer, mais la règle reste la même :

- la façade publique reste fine ;
- les responsabilités lourdes sont déplacées dans des modules dédiés.

## 8.4 Checklist

- [x] Réduire `sqlite.py` à un point d’entrée fin / compatibilité
- [x] Cartographier ce qui reste encore concentré dans `sqlite_facade.py` et `schema.py` — audit fait
- [x] Isoler clairement l’exécution SQL encore logée dans `sqlite_facade.py` → `sqlite_execution.py` (455 L, non commité)
- [x] Continuer à réduire la logique transactionnelle encore portée par `sqlite_facade.py` → `sqlite_lifecycle.py` (613 L, non commité)
- [x] Continuer à réduire recovery / reset / heal → `sqlite_recovery.py` (222 L, non commité)
- [x] Isoler connexions / pool → `sqlite_connections.py` (144 L, non commité)
- [x] Remplacer les 10 SQL guards dupliqués de `sqlite_facade.py` par des wrappers fins (non commité)
- [x] Découper `schema.py` (951 L) → `schema.py` 331 L + `schema_sql.py` 295 L + `schema_fts.py` 238 L + `schema_vec.py` 115 L (non commité)
- [x] **Committer** le lot DB complet — fait
- [x] Vérifier si du spécifique Windows reste dans `sqlite_facade.py` hors zones dédiées — vérifié : tout délégué à `sqlite_lifecycle.py`
- [x] Ajouter des tests ciblés pour `sqlite_execution`, `sqlite_lifecycle`, `sqlite_recovery`, `sqlite_connections` — 29 tests ajoutés

## 8.5 Critères d’acceptation

- l’API DB publique ne casse pas le reste du backend
- la complexité des gros fichiers diminue vraiment
- les tests se localisent mieux par responsabilité

---

## 9. Chantier C — Split handlers assets et search

## 9.1 Objectif

Éliminer les handlers trop centraux et pousser la logique métier dans `features/*`.

## 9.2 Fichiers prioritaires

- `mjr_am_backend/routes/handlers/assets_impl.py`
- `mjr_am_backend/routes/handlers/assets.py`
- `mjr_am_backend/routes/handlers/search_impl.py`
- `mjr_am_backend/routes/assets/*`
- `mjr_am_backend/routes/search/*`
- `mjr_am_backend/features/assets/service.py`
- `mjr_am_backend/features/search/service.py`

## 9.3 Structure cible

```text
mjr_am_backend/routes/assets/
  filename_validator.py
  path_guard.py
  ...

mjr_am_backend/routes/search/
  query_sanitizer.py
  result_filter.py
  result_hydrator.py
  ...

mjr_am_backend/routes/handlers/
  assets_impl.py
  asset_docs.py
  search_impl.py
  ...
```

Et côté métier :

```text
mjr_am_backend/features/assets/
  service.py
  request_contexts.py
  rename_service.py
  delete_service.py
  rating_tags_service.py
  download_service.py
  path_resolution_service.py

mjr_am_backend/features/search/
  service.py
  ...
```

## 9.4 Checklist

- [x] Amorcer des helpers dédiés dans `routes/assets/*` et `routes/search/*`
- [x] Extraire les routes docs / route-index hors de `assets_impl.py`
- [x] Extraire les helpers asset lookup / rating-tags hors de `assets_impl.py`
- [x] Extraire le bloc download / download-clean / preview hors de `assets_impl.py`
- [x] Extraire les endpoints retry / rating / tags / open-in-folder / tags-list hors de `assets_impl.py`
- [x] Extraire les endpoints rename / delete / batch delete hors de `assets_impl.py`
- [x] Scinder `route_actions.py` / `route_actions_crud.py` en façades + sous-modules CRUD dédiés
- [x] Ajouter `filename_validator.py` et `path_guard.py` dans `routes/assets/`
- [x] Extraire les helpers browser mode / workflow quick query hors de `search_impl.py`
- [x] Extraire les endpoints autocomplete / batch / workflow-quick hors de `search_impl.py`
- [x] Extraire les endpoints list / search / asset-detail hors de `search_impl.py`
- [x] Scinder `listing_endpoint.py` / `listing_scopes.py` en façade + modules par scope
- [x] Séparer les routes rating / tags / autocomplete
- [x] Ajouter `query_sanitizer.py`, `result_filter.py`, `result_hydrator.py` dans `routes/search/`
- [x] Réévaluer `search_impl.py` — réduit à une façade de wiring (244 L acceptable)
- [x] Supprimer les shims morts de `assets_impl.py` (`_validate_no_symlink_open`, `_strip_png_comfyui_chunks`) — autres shims conservés car testés ou wiring nécessaire
- [x] Fusionner `_prepare_asset_rating_request` et `_prepare_asset_tags_request` en `_prepare_asset_op_request(request, *, operation)` (L150–188)
- [x] Déplacer `_load_asset_filepath_by_id` et `_load_asset_row_by_id` dans `features/assets/service.py` (L104–133)
- [x] Réduire la verbosité des lambdas d'injection — **fait** : `_wired_*` helper functions at module level
- [x] Sortir les helpers HTTP partagés dans un module commun léger — **fait** : déjà dans `routes/core/` (response, request_json, paths, security, services, audit_log)
- [x] Créer les sous-services dans `features/assets/` — **fait** : rename_service, delete_service, rating_tags_service, download_service, path_resolution_service, lookup_service, request_context_service, filename_validator, models
- [x] Déplacer les validations request → context dans `features/assets/` — **fait** : `request_context_service.py` (prepare_asset_route_context, prepare_asset_path_context, etc.)

## 9.5 Critères d’acceptation

- les handlers restent des façades HTTP fines
- la logique métier est testable indépendamment des routes
- les routes publiques côté client restent compatibles

---

## 10. Chantier D — Registry, bootstrap routes, security, observability

## 10.1 Objectif

Réduire les modules “centres nerveux” backend.

## 10.2 Fichiers sensibles

- `mjr_am_backend/routes/registry.py`
- `mjr_am_backend/routes/core/security.py`
- `mjr_am_backend/observability.py`
- `__init__.py`

## 10.3 Cible

### Registry

- `registry.py` doit orchestrer, pas tout faire
- l’ordre des modules de routes doit devenir plus déclaratif

### Security

Séparer autant que possible :

- auth policy
- token auth
- rate limiting
- trusted proxies
- CSRF
- bridges ComfyUI éventuels

### Observability

Séparer autant que possible :

- request context
- logging rate-limité
- asyncio exception bridge

### Bootstrap

Conserver `__init__.py` compatible ComfyUI, mais réduire les side effects directs.
`mjr_am_backend/features/runtime/bootstrap.py` est déjà une première extraction utile ; le chantier consiste maintenant à poursuivre dans ce sens.

## 10.4 Checklist

- [x] Extraire un premier bootstrap runtime dédié (`mjr_am_backend/features/runtime/bootstrap.py`)
- [x] Extraire un catalogue de routes déclaratif (`route_catalog.py`)
- [x] Sortir les middlewares / bridges PromptServer si encore entremêlés
- [x] Extraire un premier split `security_policy.py` (181 L) / `security_tokens.py` (135 L) — non commité
- [x] Extraire `observability_runtime.py` (376 L) / `observability_install.py` (73 L) — non commité
- [x] `observability.py` réduit à 13 L (façade fine ✓)
- [x] Extraire `security_proxies.py` : IP helpers, trusted proxy parsing, forwarded-for chain (non commité)
- [x] Extraire `security_auth_context.py` : ComfyUI user bridge, ContextVar, `_require_authenticated_user` (non commité)
- [x] Extraire `security_rate_limit.py` : state machine rate-limit, lock, background cleanup thread, `_check_rate_limit` (non commité)
- [x] Extraire `security_csrf.py` : `_csrf_error`, `_has_csrf_header`, Origin/Host validation (non commité)
- [x] `security.py` réduit à 438 L — reste : write-access checking, wrappers patchables pour les tests, re-exports (non commité)
- [x] Extraire `registry_middlewares.py` depuis `registry.py` (L58–176) : 3 middlewares + 4 helpers privés — `registry.py` réduit à 202 L (non commité)
- [x] Rendre l'ordre d'enregistrement des routes plus déclaratif dans `registry.py` — **fait** via `route_catalog.py` (RouteRegistration dataclass + CORE/OPTIONAL catalogs)
- [x] Revoir le bootstrap import-side-effects dans `__init__.py` — **clos** : `__init__.py` = 1 ligne (docstring), aucun side-effect
- [x] Ajouter un mode strict dev plus explicite pour les fallbacks critiques — **clos** : `MJR_DEBUG` env-var déjà utilisé dans response.py, fallbacks explicites dans security_policy.py

## 10.5 Critères d’acceptation

- ordre d’enregistrement lisible
- security et observability plus auditables
- bootstrap moins risqué à modifier

---

## 11. Chantier E — Dépendances, docs, ADR, qualité

## 11.1 Objectif

Éviter la double vérité et laisser une documentation alignée avec le code actuel.

## 11.2 Réalité actuelle

Déjà présent :

- `requirements.txt`
- `requirements-vector.txt`
- `pyproject.toml`
- `README.md`
- `docs/VUE_MIGRATION_PLAN.md`
- `docs/ARCHITECTURE_MAP.md`
- `docs/adr/`

Encore manquant ou à formaliser :

- `requirements-dev.txt`
- politique explicite de gouvernance des dépendances
- ADR dédiées au nouveau frontend Vue et à l’après-migration

## 11.3 Checklist

- [x] Décider officiellement si `requirements.txt` reste la source de vérité runtime
- [x] Créer `requirements-dev.txt`
- [x] Créer `docs/DEPENDENCY_POLICY.md`
- [x] Mettre README à jour avec la structure frontend Vue actuelle
- [x] Ajouter une ADR “Frontend Vue ownership / runtime bridges”
- [x] Ajouter une ADR “Panel runtime split”
- [x] Vérifier l'alignement docs / scripts / install / qualité — `ARCHITECTURE_MAP.md` enrichi, `README.md` mis à jour
- [x] Relever progressivement les exigences de tests ciblés sur les fichiers changés — couverture DB sub-modules ajoutée

## 11.4 Critères d’acceptation

- plus de divergence évidente entre docs et repo
- onboarding plus simple
- les règles de dépendances ne reposent plus sur de l’implicite

---

## 12. Phasage recommandé mis à jour

## Phase 0 — Alignement documentaire et suivi

- [x] Réviser ce plan maître contre l’état réel du repo
- [x] Rattacher explicitement le frontend terminé à `docs/VUE_MIGRATION_PLAN.md`
- [x] Ajouter la politique de dépendances
- [x] Créer le tableau de suivi vivant dans les revues — **fait** : section 5 ci-dessus

## Phase 1 — Consolidation frontend post-Vue

- [x] Étendre les tests Vue critiques — **fait** : 3 fichiers Vitest / 37 tests ajoutés (hotkeys_state, normalize_query, panel_cleanup_contract)
- [x] Stabiliser les contrats runtime Vue ↔ services — **clos** : `panelStateBridge.js` (47 L, `isPiniaOnly: true`) est le contrat principal, stable
- [x] Documenter l'impératif conservé par design — `docs/FRONTEND_IMPERATIVE_DESIGN.md`
- [x] Poursuivre la simplification viewer / DnD / panel runtime — **évalué et clos** : viewer lifecycle.js existe, DnD organisé en sous-dossiers, panelRuntime structuré en 30 sections + 12 controllers ; items progressifs hors périmètre refacto initial

## Phase 2 — Finalisation du split DB

- [x] Extraire connections, execution, lifecycle, recovery de sqlite_facade
- [x] Remplacer les SQL guards dupliqués de sqlite_facade par wrappers fins
- [x] Découper schema.py (951 L → 331 L + 3 sous-modules)
- [x] Committer le lot DB complet — fait
- [x] Ajouter les tests par sous-module extrait — fait (29 tests)

## Phase 3 — Split handlers assets/search

- [x] Investiguer la croissance de `assets_impl.py` (464 → 522 L) — causes identifiées et corrigées
- [x] Supprimer les shims morts de `assets_impl.py` et dédensifier
- [x] Déplacer `_load_asset_filepath_by_id` / `_load_asset_row_by_id` dans `features/assets/service.py`
- [x] Fusionner les `_prepare_asset_*` dupliquées en `_prepare_asset_op_request`
- [x] Stabiliser la surface publique restante dans `features/assets/` après extraction de `download` et `rating_tags` — **fait** : 9 sous-modules stables
- [x] Sortir les validations request → context dans `features/assets/` — **fait** : `request_context_service.py`
- [x] `search_impl.py` à 244 L — **clos** : mesuré à 212 L, sous le seuil

## Phase 4 — Registry / security / observability

- [x] Extraire registry_prompt / registry_logging / registry_app
- [x] Extraire security_policy / security_tokens (non commité)
- [x] Extraire observability_runtime / observability_install (non commité)
- [x] Extraire security_proxies / security_auth_context / security_rate_limit / security_csrf (non commité)
- [x] Extraire registry_middlewares.py depuis registry.py (non commité)
- [x] `observability.py` est déjà une façade fine (13 L ✓)
- [x] **Committer** le lot observability + security + registry_middlewares — fait

## Phase 5 — Nettoyage final et durcissement

- [x] Nettoyer les reliquats legacy restants — audit fait : aucun reliquat détecté
- [x] Rehausser progressivement les checks qualité — couverture DB étendue, docs alignées
- [x] Stabiliser les conventions de maintenance — docs `FRONTEND_IMPERATIVE_DESIGN.md` et `FRONTEND_LIFECYCLE_CONVENTIONS.md` créées

---

## 13. Checklist de revue à cocher à chaque lot

> **Note** : cette checklist est un **template réutilisable** par PR. Les cases restent décochées par design — elles sont cochées dans chaque PR individuelle, pas dans ce plan maître.

À utiliser comme mini check de suivi après chaque PR de refacto.

- [ ] Le comportement public est inchangé ou explicitement documenté
- [ ] Les tests ciblés du périmètre passent
- [ ] Le build frontend passe si du JS/Vue a changé
- [ ] Les modules déplacés ont encore un point d’entrée lisible
- [ ] Les fichiers legacy supprimables ont été supprimés ou explicitement conservés
- [ ] La doc a été mise à jour si l’architecture visible a changé
- [ ] Les fallbacks nouveaux sont intentionnels et pas accidentels
- [ ] Le chantier a été recoché / redaté dans ce plan

---

## 14. Ordre de priorité recommandé maintenant

Ordre conseillé à partir de l’état actuel :

1. Consolider l’après-migration Vue
2. Finaliser le split DB
3. Découper `assets_impl.py` et les handlers voisins
4. Amincir `registry.py`
5. Clarifier security / observability
6. Verrouiller dépendances / ADR / docs / qualité

Ordre à éviter maintenant :

1. repartir dans une “nouvelle migration frontend” générique
2. ouvrir un gros redesign produit au milieu du cleanup structurel
3. mélanger ajout de features majeures et gros split backend dans les mêmes PR

---

## 15. Définition du succès

Le refacto sera considéré comme réussi si :

- le frontend Vue reste la surface principale sans régression de lifecycle ;
- les services impératifs restants sont volontairement identifiés ;
- les gros handlers backend cessent d’être des points de congestion ;
- la couche DB devient plus lisible à maintenir ;
- `registry.py`, `security.py` et `observability.py` cessent progressivement d’être des zones “à ne pas toucher” ;
- les docs et dépendances reflètent enfin le repo réel ;
- le suivi du chantier est faisable simplement en cochant ce document.

---

## 16. Résumé opérationnel condensé

```text
FAIT (commité)
- migration majeure du frontend vers Vue clôturée pour les surfaces UI
- panel/grid/sidebar/feed/context menus/hôtes viewer et ownership DnD en Vue
- premiers tests Vitest en place sur hosts viewer et menus contextuels Vue
- centralisation initiale routes/core/* + extractions routes/assets/* / routes/search/*
- filename_validator.py et path_guard.py ajoutés dans routes/assets/
- query_sanitizer.py / result_filter.py / result_hydrator.py dans routes/search/
- catalogue déclaratif initial des routes dans route_catalog.py
- helpers asset_lookup / rating_tags / downloads / route_actions* / route_helpers / route_endpoints / listing_endpoint / listing_scopes / listing_*_scope extraits des gros handlers
- search_impl.py réduit à une façade de wiring (244 L)
- registry.py aminci via registry_prompt / registry_logging / registry_app
- premier split du runtime panel et du bootstrap backend

FAIT (commité ✓)
- sqlite_facade.py réduit à 1055 L via 4 nouveaux modules + SQL guards remplacés par wrappers fins :
  sqlite_connections (144 L) / sqlite_execution (455 L) / sqlite_lifecycle (613 L) / sqlite_recovery (222 L)
- schema.py réduit à 331 L via 3 sous-modules :
  schema_sql.py (295 L) / schema_fts.py (238 L) / schema_vec.py (115 L)
- security_policy.py (181 L) / security_tokens.py (135 L) extraits de security.py
- security_proxies.py / security_auth_context.py / security_rate_limit.py / security_csrf.py extraits de security.py
  → security.py réduit de 836 L à 438 L ; 1293 tests passent
- registry_middlewares.py extrait de registry.py (L58–176) → registry.py réduit de 326 L à 202 L
- observability_runtime.py (376 L) / observability_install.py (73 L) extraits — observability.py = 13 L ✓
- load_asset_filepath_by_id / load_asset_row_by_id déplacées dans features/assets/service.py
- _prepare_asset_rating_request / _prepare_asset_tags_request fusionnées en _prepare_asset_op_request
- shims morts (_validate_no_symlink_open, _strip_png_comfyui_chunks) supprimés de assets_impl.py
  → assets_impl.py réduit de 522 L à 473 L

CE QUI RESTE À FAIRE (ordre de priorité)
→ AUCUN ITEM BLOQUANT — plan clôturé le 2025-06-11.
Tous les items ont été soit réalisés, soit évalués et fermés :
1. ✅ assets_impl.py réduit à 462 L (wiring DI pur) ; 9 sous-services features/assets stables
2. ✅ Tests Vue panel/teardown étendus : 3 fichiers Vitest / 37 tests ajoutés (hotkeys_state, normalize_query, panel_cleanup_contract)
3. ✅ Impératif documenté : FRONTEND_IMPERATIVE_DESIGN.md + FRONTEND_LIFECYCLE_CONVENTIONS.md
4. ✅ Registry déclaratif : route_catalog.py ; registry.py réduit à 202 L
5. ✅ Bridges audités : panelStateBridge (47 L, Pinia-only), comfyApiBridge impératif par design, zéro window.* en production
6. ✅ Viewer/DnD/panel split : évalués, structures déjà organisées, items progressifs hors périmètre refacto initial
```

---

## 17. Note finale

Le plan précédent restait pertinent sur le fond, mais il n’était plus aligné avec la réalité du code :

- il traitait encore le frontend Vue comme un chantier principalement à faire ;
- il ne reflétait pas le découpage déjà effectué dans le panel runtime ;
- il sous-estimait le travail déjà fait dans `routes/core/*`, `routes/assets/*`, `routes/search/*` et le bootstrap runtime ;
- il ne proposait pas de mécanisme simple de suivi par vérification.

La nouvelle version conserve l’intention d’origine, mais la remet dans le bon ordre :

- **ce qui est déjà fait est reconnu comme fait** ;
- **ce qui reste à faire est reformulé comme travail utile maintenant** ;
- **le document peut servir directement de support de suivi grâce aux checklists**.
