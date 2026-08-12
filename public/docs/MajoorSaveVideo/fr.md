# Majoor Save Video

Encode une entrée `VIDEO` ou un lot de frames `IMAGE` en MP4/H.264, GIF ou WebP animé.

- Les métadonnées MP4 sont intégrées au conteneur.
- Les GIF et WebP peuvent recevoir un PNG sidecar de la première frame avec les métadonnées complètes.
- Une entrée `AUDIO` optionnelle peut être multiplexée dans le MP4.
- La progression d’encodage est transmise au système natif de ComfyUI.

Une valeur CRF plus faible augmente la qualité et la taille du MP4. L’audio est limité à la durée de la vidéo.
