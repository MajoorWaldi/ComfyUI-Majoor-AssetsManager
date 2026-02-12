Audit et propositions de patch — ComfyUI Majoor Assets Manager
================================================================

Date : 2026-02-12
Contexte : répertoire `ComfyUI-Majoor-AssetsManager` situé sous `custom_nodes`.

Résumé rapide
------------
- Objectif : améliorer compatibilité et réduire les risques de conflits / crashes lors du chargement par ComfyUI.
- Modifications sûres appliquées automatiquement : 4 changements mineurs dans `__init__.py` (voir section "patch appliqué").

Principales découvertes
-----------------------
- Import-time side-effects : `__init__.py` exécute des actions coûteuses (auto-install pip, enregistrement des routes, suppression de fichiers) au moment de l'import. Cela peut bloquer ou corrompre l'hôte (ComfyUI).
- Manipulation globale de `sys.path` et `sys.modules` : insertion en tête de `sys.path` et suppression agressive de modules `backend.*` peut provoquer des collisions avec d'autres paquets appelés `backend`.
- Nom de package top-level `backend` : utiliser un nom générique `backend` pour le sous-paquet est risqué dans un environnement avec d'autres extensions.
- Auto-install pip par défaut : exécuter `pip install` pendant l'import est dangereux et peut provoquer des verrous, des erreurs réseau, ou des modifications non souhaitées.
- Routes auto-enregistrées à l'import : l'enregistrement automatique des routes (`register_all_routes()` sur import) peut s'exécuter avant que ComfyUI soit complètement initialisé.
- Logging vs print : sorties vers stdout (`print`) rendent le debugging difficile dans l'interface de l'hôte.
- WEB_DIRECTORY relatif (`./js`) : chemins relatifs peuvent casser l'accès aux ressources quand le CWD diffère.

Patches appliqués (immédiats)
-----------------------------
Fichier : `__init__.py`
- WEB_DIRECTORY rendu absolu après résolution de `root` (avant : `"./js"`).
- Remplacement de `sys.path.insert(0, ...)` par `sys.path.append(...)` pour éviter de masquer le stdlib.
- Remplacement des `print()` informatifs par un `logging.getLogger("majoor_assets_manager")`.
- Auto-installation pip désactivée par défaut ; opt-in via la variable d'environnement `MJR_AM_AUTO_PIP=1` (auparavant on installait automatiquement sauf si `MJR_AM_NO_AUTO_PIP` était vrai).

Pourquoi ces changements ?
- Ils réduisent l'empreinte au moment de l'import et le risque d'interférer avec d'autres paquets.
- Ils laissent l'initiative d'installation de dépendances à l'utilisateur/administrateur.
- Ils améliorent la robustesse des chemins d'accès aux ressources.

Recommendations détaillées (prochaines étapes)
----------------------------------------------
1) Namespace le package `backend`
   - Renommer `backend/` en `majoor_assets_backend/` (ou `mjr_am.backend`) et adapter tous les imports.
   - Avantage : suppression des conflits avec d'autres modules `backend` présents dans l'environnement.

2) Retarder l'initialisation serveur / enregistrement de routes
   - Ne pas appeler `register_all_routes()` automatiquement sur import.
   - Fournir une fonction publique `init(app_or_prompt_server)` qui :
     - détecte si ComfyUI `PromptServer` est disponible et enregistre les routes proprement,
     - installe middlewares d'observabilité et sécurité de façon non destructive.
   - Documenter l'appel dans README (ou détecter et attendre via hook si ComfyUI expose un event after-start).

3) Remplacer auto-install pip par une commande CLI ou script
   - Ajouter un script `scripts/install-requirements.py` ou une commande Make/PS qui installe les dépendances.
   - Laisser un message clair à l'utilisateur quand une dépendance manque.

4) Limiter modifications de `sys.modules`
   - Si vous devez remplacer un module existant nommé `backend`, vérifiez explicitement `module.__file__` et ne retirez que les modules qui ne proviennent pas du répertoire de l'extension.
   - Documenter clairement ce comportement.

5) Tests et CI
   - Ajouter tests unitaires autour de l'import du package dans un environnement isolé (ex : tox/venv) pour garantir que l'import n'exécute rien de dangereux.
   - Ajouter un check statique qui refuse l'auto-install en environnement CI.

6) Sécurité et content headers
   - Vérifier que l'insertion des middlewares n'affecte pas d'autres endpoints ComfyUI (ne pas enregistrer CSP `default-src 'none'` globalement).

7) Documentation pour l'utilisateur
   - Mettre à jour `README.md` pour expliquer : installation (sans auto-pip), variables d'environnement (`MJR_AM_AUTO_PIP`), comment initialiser manuellement le backend si nécessaire.

Exemples de commandes (recommandées)
------------------------------------
- Pour installer les dépendances manuellement (recommandé) :

```powershell
python -m pip install -r "custom_nodes/ComfyUI-Majoor-AssetsManager/requirements.txt"
```

- Pour autoriser un install automatique (opération dangereuse, opt-in) :

```powershell
$env:MJR_AM_AUTO_PIP = '1'
# relancer ComfyUI après réglage
```

Notes sur rollback
------------------
- Les changements appliqués touchent uniquement `__init__.py`. Pour annuler, restaurer le fichier depuis le contrôle de version.

Fichiers modifiés
-----------------
- `__init__.py` (sécurité/compatibilité d'import)
- Ajout : ce fichier d'audit `AUDIT_AND_PATCHES.md`

Proposition de patchs à fournir (prêtes à implémenter)
----------------------------------------------------
- Refactor : renommer `backend` en `mjr_am_backend` et corriger tous les imports (tests + scripts de migration).
- Refactor : transformer l'init d'API pour être lazy (`init_prompt_server()`), et documenter l'appel.
- Ajouter tests d'import et tests d'intégration légers pour vérifier qu'aucune subprocess/pip n'est lancé à l'import.

Souhaitez-vous que j'implémente l'une des recommandations suivantes maintenant ?
- Renommer et convertir le package `backend` en `mjr_am_backend` (impact important, je ferai les modifications et les imports).
- Refactoriser l'enregistrement des routes pour un initialiseur lazy (moins risqué, je peux l'implémenter partiellement).
- Ajouter un script `scripts/install-requirements.py` et instructions de CI.

