# Majoor Save Image

Saves an image batch in ComfyUI's output directory and embeds the workflow, prompt and Majoor generation metadata in each PNG.

- `filename_prefix` supports ComfyUI placeholders, including `%date:yyyy-MM-dd%`.
- `generation_time_ms` uses Majoor's prompt lifecycle when set to `-1`.
- `geninfo_override` accepts the output of **Majoor Gen Info Override**.

The node follows ComfyUI's metadata-disable option. Paths are resolved through ComfyUI's output directory helper; this node does not write outside the configured output area.
