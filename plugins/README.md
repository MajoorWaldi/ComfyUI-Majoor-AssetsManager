# Majoor Assets Manager - Plugin Examples

This directory contains example metadata extractor plugins for the Majoor Assets Manager.

## Available Examples

### 1. WanVideo Extractor (`wanvideo_extractor.py`)
Extracts WanVideo custom node metadata from PNG/WebP files.

**Features:**
- Reads WanVideo-specific PNG chunks
- Extracts motion bucket ID, FPS, augmentation level
- Falls back to standard ComfyUI metadata

**Priority:** 100 (high - runs before generic extractors)

### 2. rgthree Extractor (`rgthree_extractor.py`)
Extracts rgthree custom node metadata.

**Features:**
- Reads rgthree-specific workflow data
- Extracts comparison image references
- Parses context mappings

**Priority:** 50 (medium)

### 3. Custom Node Extractor Template (`custom_node_extractor.py`)
Template for creating custom extractors for any custom node.

**Features:**
- Well-documented template
- Shows all available hooks
- Includes error handling patterns

**Priority:** Configurable

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
