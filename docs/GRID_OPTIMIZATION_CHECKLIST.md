# Majoor Assets Manager - Grid Optimization Checklist

Objectif: rendre le panel grid stable, previsible et rapide, surtout pendant la pagination, les updates backend, les changements de scope et la selection.

## 1. Stabiliser le contrat de chargement

Etat: fait pour le contrat critique.

- [x] `appendNextPage` ne doit pas vider la grille pendant la pagination.
- [x] La pagination adaptative doit continuer a charger quand une page recue ajoute 0 carte visible a cause du dedupe/filtrage.
- [x] Les updates backend ne doivent pas forcer un reload si la grille affiche deja des cartes visibles.
- [x] Separer explicitement les chemins `reload`, `appendNextPage`, `refreshHead`, `upsertRealtime`.
- [x] Garantir par tests que `appendNextPage` ne remplace pas toute la grille.
- [x] Garantir que `appendNextPage` ne touche jamais au scroll.
- [x] Garantir que `appendNextPage` ne purge jamais la selection.
- [x] Documenter les invariants de chargement dans le code.

## 2. Unifier l'etat grid

Etat: fait pour les nouveaux chemins, legacy garde en compatibilite.

- [x] Definir une source canonique lisible pour `assets`.
- [x] Definir une source canonique lisible pour `pagination`.
- [x] Definir une source canonique lisible pour `selection`.
- [x] Definir une source canonique lisible pour `viewport`.
- [x] Definir une source canonique lisible pour `context`.
- [x] Reduire completement le role des `dataset` DOM a une couche de compatibilite legacy.
- [x] Encapsuler les methodes `_mjr*` du container derriere une API unique (`_mjrGridApi`).
- [x] Ajouter des tests qui verifient l'etat canonique expose par le loader.

## 3. Proteger scroll et selection

Etat: fait pour pagination et reload partiel.

- [x] Eviter les reloads automatiques qui cassent scroll/selection quand la grille a deja des cartes visibles.
- [x] Sauver/restaurer un anchor visuel, pas seulement `scrollTop`.
- [x] Ne jamais appeler `scrollToSelection` apres pagination normale.
- [x] Garder la selection meme si l'asset selectionne n'est pas encore charge dans la page courante.
- [x] Distinguer "asset pas encore charge" de "resultat complet": prune seulement quand le resultat est complet.
- [x] Ajouter tests scroll + selection apres append.

## 4. Remplacer les reloads automatiques par des upserts

Etat: fait pour les chemins critiques.

- [x] Bloquer le reload automatique sur update index quand des cartes sont visibles.
- [x] Upsert en tete pour nouveaux assets compatibles avec le contexte courant.
- [x] Patch cible pour metadata existante.
- [x] Remove cible pour suppression.
- [x] Reload complet uniquement pour scope, filtre, tri, recherche ou collection.
- [x] Ajouter une API de decisions `reload/appendNextPage/refreshHead/upsertRealtime`.

## 5. Rendre la pagination plus previsible

Etat: fait pour les metriques de base.

- [x] Continuer avec une taille de page plus grande si une page ajoute 0 carte visible.
- [x] Mesurer pages demandees.
- [x] Mesurer assets recus.
- [x] Mesurer assets visibles ajoutes.
- [x] Mesurer assets masques/dedupliques.
- [x] Mesurer temps API.
- [x] Mesurer temps render.
- [x] Ajuster la taille de page selon le "visible yield" minimal: page vide visible => page suivante plus large.

## 6. Durcir la virtual grid

Etat: partiel.

- [x] Stabiliser les hauteurs de lignes via estimation unique par largeur/details.
- [x] Limiter les appels a `measure()` par coalescing `requestAnimationFrame`.
- [x] Adapter l'overscan selon vitesse de scroll.
- [x] Garder l'infinite scroll base sur distance au bas + prefetch controle.
- [x] Verifier que le sentinel ne declenche pas de reload: le chemin Vue utilise `loadNextPage`.

## 7. Ameliorer le cache snapshot

Etat: partiel, cache disque borne et memoire etendue.

- [x] Garder un cache disque borne pour eviter les gros `JSON.stringify`.
- [x] Garder un cache memoire complet des assets charges par contexte.
- [x] Snapshot par contexte exact: scope, sort, filtres, query, root, subfolder.
- [x] Hydratation instantanee puis refresh silencieux sans flash via preserveVisibleUntilReady.
- [x] Interdire le remplacement brutal de la grille apres hydratation snapshot.

## 8. Ajouter observabilite dev

Etat: fait pour le snapshot debug programmatique.

- [x] Ajouter un snapshot debug grid programmatique.
- [x] Exposer offset, total, loaded, visible.
- [x] Exposer selected, active, loading, done.
- [x] Exposer le dernier `reload reason`.
- [x] Exposer le dernier `append reason`.
- [x] Compter les resets.
- [x] Compter les restaurations de scroll.

## 9. Reduire la dependance au DOM legacy

Etat: fait pour les nouveaux chemins grid.

- [x] Faire du DOM une sortie d'affichage, pas une source d'etat.
- [x] Regrouper les API legacy `_mjr*` derriere `_mjrGridApi` pour les nouveaux appels.
- [x] Deplacer les lectures directes du DOM vers des selectors/bridges testes.
- [x] Supprimer progressivement les chemins dupliques Vue/legacy.

## 10. Renforcer les tests de stabilite

Etat: fait pour la stabilite critique.

- [x] Test: pagination adaptative quand plusieurs pages ajoutent 0 carte visible.
- [x] Test: pas de reload sur update backend quand la grille a deja des cartes visibles.
- [x] Test: selection state restore.
- [x] Test: pagination sans perte de scroll.
- [x] Test: reload avec anchor restore.
- [x] Test: selection persistante apres append.
- [x] Test: hidden/duplicate assets qui forcent adaptive paging.
- [x] Test: seul un scope/filter/sort/search/collection switch peut reset.
- [x] Test: snapshot hydrate puis refresh sans flash.

## Regle directrice

- [x] Faire evoluer le grid vers: append/patch first, reload last.
