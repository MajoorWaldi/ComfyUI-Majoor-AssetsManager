# Majoor Save Image

Sauvegarde un lot d’images dans le dossier de sortie ComfyUI et intègre le workflow, le prompt et les métadonnées Majoor dans chaque PNG.

- `filename_prefix` accepte les placeholders ComfyUI, dont `%date:yyyy-MM-dd%`.
- `generation_time_ms` utilise automatiquement le cycle du prompt avec la valeur `-1`.
- `geninfo_override` reçoit la sortie de **Majoor Gen Info Override**.

Le node respecte l’option ComfyUI qui désactive les métadonnées et n’écrit pas hors du dossier de sortie configuré.
