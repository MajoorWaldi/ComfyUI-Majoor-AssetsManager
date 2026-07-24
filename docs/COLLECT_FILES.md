# Collect Files

Collect Files bundles everything needed to reproduce or archive a generated asset into a single ZIP: the asset itself, its workflow, the traced prompt text, and every media input referenced by the workflow.

## What it does

Right-click an asset → **Collect files** (or use the **Collect files** button in the details sidebar). The feature:

1. Reads the workflow and prompt graph embedded in the asset (PNG chunks, video metadata, ...).
2. Traces the generation text prompts (positive/negative) using the same parser as the sidebar generation info — it follows conditioning chains to text encoders (`CLIPTextEncode`, `WanVideoTextEncode`, API nodes, etc.).
3. Resolves every media input referenced by the workflow (LoadImage/LoadVideo/LoadAudio widget values, `sub/file.png [input]` annotations, ...).
4. Writes a ZIP **next to the asset** named `{asset}_collected.zip`.

## ZIP contents

| Entry | Description |
| --- | --- |
| `{asset}.{ext}` | The asset file itself |
| `workflow.json` | The embedded ComfyUI workflow (UI format), when present |
| `prompt_graph.json` | The raw API prompt graph, when present |
| `prompt.json` | The traced generation text: `positive`, `negative` (plus `all_positive_prompts` / `all_negative_prompts` for multi-prompt workflows), when traceable |
| `inputs/…` | A copy of every referenced media input that could be resolved |
| `collected_files.txt` | Manifest: name, path, and status of each input, plus referenced model files with their resolved absolute paths |

Model files (checkpoints, LoRAs, VAEs, ...) are **listed in the manifest with their full paths** but are not copied into the ZIP (they are typically several gigabytes).

## Where the ZIP is written

- By default the ZIP is created **in the same folder as the asset**, so it appears right next to the image in your file explorer.
- If a name collision exists, a ` (2)`, ` (3)`, ... suffix is added — nothing is ever overwritten.
- If the asset folder is not writable (permissions, read-only mounts), the ZIP transparently falls back to `output/_mjr_collected/` and the toast tells you where it went. The operation is designed to never fail on folder permissions.

## Input statuses in the manifest

| Status | Meaning |
| --- | --- |
| `copied` | Input found and copied into `inputs/` |
| `MISSING (not found on disk)` | The workflow references a file that no longer exists |
| `NOT COPIED (outside allowed folders)` | Absolute path outside the ComfyUI output/input/temp/custom roots — listed for reference, never copied (security) |
| `NOT COPIED (read error)` | The file exists but could not be read |

## Security

- The endpoint (`POST /mjr/am/collect-files`) requires the standard write-access token, is CSRF-protected, and rate-limited.
- The target asset path must live inside the ComfyUI output/input directories or a registered custom root.
- Referenced inputs are only copied when they resolve inside allowed roots; arbitrary absolute paths found in workflow metadata are never read.
- Total copied size is capped (4 GB) to avoid runaway archives.

## API

See [API_REFERENCE.md](API_REFERENCE.md#collect-files) for the endpoint payload and response.
