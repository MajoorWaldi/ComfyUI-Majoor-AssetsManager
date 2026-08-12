# Majoor Gen Info Override

Construit les métadonnées explicites utilisées par **Majoor Save Image** et **Majoor Save Video**.

Reliez `workflow_context` à un node tardif de la branche de génération pour permettre à Majoor de retrouver les valeurs réellement exécutées du sampler. Les valeurs saisies manuellement restent prioritaires.

Les champs `loras_json` et `custom_info_json` attendent du JSON. Leur contenu est analysé comme des données et n’est jamais exécuté comme du code.
