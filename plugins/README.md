# Majoor Assets Manager - Plugin Examples

This directory contains example metadata extractor plugins for the Majoor Assets Manager.

Two plugin layouts are supported:

1. **Blueprint format (recommended)** — a directory containing a declarative
   `blueprint.yaml` (or `blueprint.json`) manifest plus the entrypoint module.
2. **Flat module format (legacy)** — a single `*.py` file dropped into a plugin
   directory. Still supported; new plugins should use the blueprint format.

## Blueprint Layout

```
my_plugin/
    blueprint.yaml          # or blueprint.json
    my_extractor.py         # entrypoint module
```

Manifest fields (v1):

| Field | Required | Notes |
|-------|----------|-------|
| `schema_version` | yes | Currently `1` |
| `name` | yes | Lowercase slug `[a-z][a-z0-9_]+` |
| `version` | yes | Semver, e.g. `1.2.0` |
| `author` | yes | Free text |
| `type` | yes | Only `metadata_extractor` for now |
| `entrypoint.module` | yes | Filename without `.py`, inside the package |
| `entrypoint.class` | yes | Class implementing `MetadataExtractorPlugin` |
| `description`, `license`, `homepage`, `min_majoor_version`, `tags`, `capabilities` | no | Informational |

See `examples/wanvideo/blueprint.json` and `examples/rgthree/blueprint.yaml`
for working manifests.

## Available Examples

### 1. WanVideo Extractor (`examples/wanvideo/`)
Extracts WanVideo custom node metadata from PNG/WebP files. Priority `100`.

### 2. Custom Node Template (`examples/custom_node_template/`)
Documented template for creating custom extractors. Priority `50`.

### 3. rgthree Skeleton (`examples/rgthree/`)
Minimal blueprint demonstrating the YAML manifest variant. Priority `50`.

## Installation

### Option 1: Copy to Global Plugin Directory

```bash
# Windows (PowerShell)
Copy-Item wanvideo_extractor.py ~/.comfyui/majoor_plugins/extractors/

# Linux/macOS
cp wanvideo_extractor.py ~/.comfyui/majoor_plugins/extractors/
```

### Option 2: Copy to Local Plugin Directory

```bash
# Copy to ComfyUI output directory
cp wanvideo_extractor.py <ComfyUI>/output/_mjr_plugins/extractors/
```

### Option 3: Use Bundled Plugins Directory

```bash
# Copy to extension's plugins directory
cp wanvideo_extractor.py <ComfyUI>/custom_nodes/ComfyUI-Majoor-AssetsManager/plugins/
```

## Usage

After installing plugins:

1. **Restart ComfyUI** or reload plugins via API:
   ```bash
   curl -X POST http://localhost:8188/mjr/am/plugins/reload
   ```

2. **List installed plugins**:
   ```bash
   curl http://localhost:8188/mjr/am/plugins/list
   ```

3. **Enable/Disable plugins** via Assets Manager UI:
   - Open Settings → Plugins tab
   - Toggle plugins on/off

## Creating Your Own Plugin

See `custom_node_extractor.py` for a complete template with documentation.

### Quick Start

```python
from mjr_am_backend.features.metadata.plugin_system.base import (
    MetadataExtractorPlugin,
    ExtractionResult,
)

class MyExtractor(MetadataExtractorPlugin):
    @property
    def name(self): return "my_extractor"

    @property
    def supported_extensions(self): return ['.png']

    @property
    def priority(self): return 50

    async def extract(self, filepath: str) -> ExtractionResult:
        # Your extraction logic here
        data = {"key": "value"}
        return self._create_success_result(data)
```

## Troubleshooting

### Plugin Not Loading

1. Check logs for validation errors
2. Verify file is in correct directory
3. Ensure plugin inherits from `MetadataExtractorPlugin`
4. Check for syntax errors

### Extraction Fails

1. Enable debug logging: `MJR_PLUGIN_LOG_LEVEL=DEBUG`
2. Check file permissions
3. Verify file format is supported

### Performance Issues

1. Reduce plugin priority to run later
2. Implement caching in plugin
3. Use `pre_extract()` for quick rejections

## Security Notes

Plugins are validated before loading. The following are blocked:

- `eval()` / `exec()` usage
- `os.system()` / `subprocess` calls
- Network access (socket, requests)
- Unsafe deserialization (pickle, marshal)

See `PLUGIN_SYSTEM_DESIGN.md` for complete security model.

## License

All example plugins are provided under the MIT license.

---

For complete documentation, see:
- `docs/PLUGIN_SYSTEM_DESIGN.md` - Architecture and design
- `docs/PLUGIN_DEVELOPMENT_GUIDE.md` - Development guide (TODO: create)
