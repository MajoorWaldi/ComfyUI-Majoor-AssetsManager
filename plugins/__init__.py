# Plugins directory for Majoor Assets Manager

Place custom metadata extractor plugins in this directory.

## Structure

```
plugins/
├── README.md              # This file
├── examples/              # Example plugins
│   ├── wanvideo_extractor.py
│   ├── rgthree_extractor.py
│   └── custom_node_extractor.py
└── your_plugin.py         # Your custom plugins
```

## Plugin Directories

Plugins are discovered from these locations (in order):

1. **Bundled plugins**: `<extension>/plugins/`
2. **Global user plugins**: `~/.comfyui/majoor_plugins/extractors/`
3. **Local plugins**: `<ComfyUI>/output/_mjr_plugins/extractors/`

## Quick Start

1. Create a plugin file (see examples/)
2. Place in this directory
3. Restart ComfyUI or reload via API
4. Plugin is automatically discovered and loaded

## Example Plugin

```python
from mjr_am_backend.features.metadata.plugin_system.base import (
    MetadataExtractorPlugin,
    ExtractionResult,
)

class MyExtractor(MetadataExtractorPlugin):
    @property
    def name(self): return "my_extractor"

    @property
    def supported_extensions(self): return ['.png', '.webp']

    @property
    def priority(self): return 50

    async def extract(self, filepath: str) -> ExtractionResult:
        # Your extraction logic
        return self._create_success_result({"key": "value"})
```

## Documentation

- `docs/PLUGIN_SYSTEM_DESIGN.md` - Full architecture
- `plugins/README.md` - Usage guide
