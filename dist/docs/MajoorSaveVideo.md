# Majoor Save Video

Encodes a `VIDEO` input or an `IMAGE` frame batch as MP4/H.264, GIF or animated WebP.

- MP4 metadata is stored in the container.
- GIF and WebP exports can save a first-frame PNG sidecar containing the complete metadata.
- Optional `AUDIO` is muxed into MP4 output.
- Encoding progress is reported through ComfyUI's native progress channel.

Lower CRF values produce higher MP4 quality and larger files. Audio is trimmed to the video duration.
