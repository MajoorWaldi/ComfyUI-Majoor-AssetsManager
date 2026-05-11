# Custom Nodes Reference

Majoor Assets Manager provides two ComfyUI nodes that embed **generation timing metadata** directly inside saved files. The asset manager's indexing pipeline then reads this metadata automatically.

**Source**: [`nodes.py`](../nodes.py)

---

## 〽️ Majoor Save Image 💾

**Node name**: `MajoorSaveImage`
**Category**: Majoor
**Display name**: 〽️ Majoor Save Image 💾

Drop-in replacement for ComfyUI's built-in `SaveImage` node. Saves PNG files to the standard output directory with `generation_time_ms` persisted in the PNG text chunks.

### Inputs

| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `images` | IMAGE | ✅ | — | The image batch to save |
| `filename_prefix` | STRING | ✅ | `Majoor` | Filename prefix. Supports ComfyUI formatting placeholders (`%date%`, `%batch_num%`, etc.) |
| `generation_time_ms` | INT | ❌ | `-1` | Generation time in milliseconds. Set to `-1` for automatic detection from the prompt lifecycle |

### Hidden Inputs

| Input | Type | Description |
|-------|------|-------------|
| `prompt` | PROMPT | Full ComfyUI prompt graph (auto-provided) |
| `extra_pnginfo` | EXTRA_PNGINFO | Additional PNG metadata (workflow, etc.) |

### Metadata Written

Each saved PNG contains the following text chunks:

| Key | Content |
|-----|---------|
| `prompt` | Full prompt graph as JSON |
| `workflow` | Full workflow as JSON (via `extra_pnginfo`) |
| `generation_time_ms` | Elapsed time since prompt start, in milliseconds |
| `CreationTime` | ISO 8601 timestamp (`YYYY-MM-DD HH:MM:SS`) |

### Output

Returns a UI result with the list of saved images (filename, subfolder, type) for ComfyUI's preview system.

### Example Usage

1. Connect any image output to the `images` input
2. Optionally set a custom `filename_prefix`
3. Leave `generation_time_ms` at `-1` for automatic timing
4. The node saves PNGs to `ComfyUI/output/` with full metadata

---

## 〽️ Majoor Save Video 🎬

**Node name**: `MajoorSaveVideo`
**Category**: Majoor
**Display name**: 〽️ Majoor Save Video 🎬

Saves a **VIDEO** input or a batch of **IMAGE** frames as a video file. Uses **PyAV** for MP4 encoding (same approach as ComfyUI's native `SaveVideo` node) and **Pillow** for GIF/WebP.

### Inputs

| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `filename_prefix` | STRING | ✅ | `MajoorVideo` | Filename prefix |
| `format` | COMBO | ✅ | `mp4 (h264)` | Output format: `mp4 (h264)`, `gif`, `webp` |
| `images` | IMAGE | ❌ | — | Batch of frames to encode as video |
| `video` | VIDEO | ❌ | — | A VIDEO input (from LoadVideo, CreateVideo, etc.) |
| `frame_rate` | FLOAT | ❌ | `24.0` | Frames per second (1–120). Ignored when `video` input carries its own frame rate |
| `loop_count` | INT | ❌ | `0` | Loop count for GIF/WebP. 0 = infinite loop |
| `generation_time_ms` | INT | ❌ | `-1` | Generation time in ms. `-1` = auto-detect |
| `audio` | AUDIO | ❌ | — | Audio track to mux into the MP4 container |
| `crf` | INT | ❌ | `19` | Constant Rate Factor (0–63). Lower = higher quality, larger file |
| `save_first_frame` | BOOLEAN | ❌ | `true` | Save a PNG sidecar of the first frame with full metadata |

### Hidden Inputs

| Input | Type | Description |
|-------|------|-------------|
| `prompt` | PROMPT | Full ComfyUI prompt graph |
| `extra_pnginfo` | EXTRA_PNGINFO | Additional metadata (workflow, etc.) |

### Input Resolution

At least one of `images` or `video` must be connected:

- **`video` input** (priority): frame tensor, frame rate, and audio are extracted via `video.get_components()`. The `frame_rate` widget is ignored.
- **`images` input** (fallback): frames are taken from the IMAGE batch, and `frame_rate` / `audio` widgets are used.
- **Neither connected**: the node produces no output.

### Metadata Written

#### MP4 (h264)

Metadata is embedded directly in the MP4 container using PyAV with `movflags=use_metadata_tags`:

| Key | Content |
|-----|---------|
| `prompt` | Full prompt graph as JSON |
| `workflow` | Full workflow as JSON |
| `generation_time_ms` | Elapsed time since prompt start, in milliseconds |
| `CreationTime` | ISO 8601 timestamp |

These tags are readable by FFProbe (`ffprobe -show_format_tags`) and ExifTool.

#### GIF / WebP

Animated GIF and WebP formats do not support arbitrary metadata. When `save_first_frame` is enabled (default), a **PNG sidecar** is saved alongside the animation with full metadata in its text chunks. The asset manager indexes this sidecar automatically.

### Video Encoding Details

- **Codec**: libx264, pixel format yuv420p
- **Quality**: controlled by `crf` (default 19)
- **Audio**: AAC codec, supports mono/stereo/5.1 layouts
- **Frame rate**: stored as an exact fraction for precision

### Output

Returns a UI result with the saved video file(s) for ComfyUI's preview system.

### Example Usage

**From IMAGE batch:**
1. Connect a batch of images to `images`
2. Set `format` to `mp4 (h264)`
3. Adjust `frame_rate` and `crf` as needed
4. The node saves an MP4 to `ComfyUI/output/`

**From VIDEO input:**
1. Connect a VIDEO output to `video`
2. The node uses the video's native frame rate and audio
3. Set `format` and `crf` to control encoding

---

## Auto-Detection of `generation_time_ms`

Both nodes support automatic generation time measurement. When `generation_time_ms` is set to `-1` (default), the node computes the elapsed time by reading the prompt start time from Majoor's `runtime_activity` module.

### How It Works

1. When ComfyUI starts executing a prompt, `runtime_activity` records `time.monotonic()` as `last_started_at`
2. When the save node runs, it computes `(time.monotonic() - last_started_at) * 1000` to get milliseconds
3. This value is written into the file metadata

### Manual Override

Connect an INT value to `generation_time_ms` (any value ≥ 0) to override automatic detection. This is useful for:
- Measuring only part of a workflow
- Importing timing from external sources
- Testing and debugging

---

## Extraction Pipeline

When assets are indexed by Majoor Assets Manager, `generation_time_ms` is extracted through the following chain:

### PNG Files

1. `read_png_text_chunks()` reads the `generation_time_ms` text chunk → `PNG:Generation_time_ms`
2. `_merge_png_exif()` merges it into the EXIF data dict
3. `_apply_rating_tags_and_generation_time()` extracts the integer value → `metadata["generation_time_ms"]`
4. `_best_effort_generation_time_ms()` finds it at the top level and returns it for DB storage

### MP4 Files

1. FFProbe reads the container format tags (including `generation_time_ms`)
2. `apply_video_ffprobe_fields()` extracts it from `format.tags.generation_time_ms`
3. `_best_effort_generation_time_ms()` finds it and returns it for DB storage

### Fallback Behavior

When the Majoor save nodes are **not** used (e.g., standard SaveImage or third-party nodes), the asset manager falls back to:
- EXIF `DateTimeOriginal` / `CreateDate` for `generation_time` (date-based, not duration)
- Prompt graph analysis for workflow metadata
- No `generation_time_ms` is stored (column remains NULL)
