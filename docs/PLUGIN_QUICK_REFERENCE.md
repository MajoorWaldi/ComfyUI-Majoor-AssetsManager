# Plugin Development Quick Reference

## Quick Start

### 1. Create Plugin File

```python
# my_plugin.py
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

    async def extract(self, filepath):
        data = {"key": "value"}
        return self._create_success_result(data)
```

### 2. Install Plugin

```bash
# Copy to plugin directory
cp my_plugin.py ~/.comfyui/majoor_plugins/extractors/
```

### 3. Reload Plugins

```bash
# Via API
curl -X POST http://localhost:8188/mjr/am/plugins/reload

# Or restart ComfyUI
```

---

## Plugin API

### Required Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | str | Unique identifier (lowercase, underscores) |
| `supported_extensions` | list[str] | File extensions (e.g., `['.png', '.webp']`) |
| `priority` | int | Higher = runs first (100-999 custom, 50-99 format, 1-49 generic) |

### Required Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `extract` | `async def extract(self, filepath: str) -> ExtractionResult` | Main extraction logic |

### Optional Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `metadata` | `ExtractorMetadata` | Auto | Plugin info (version, author, description) |
| `min_compatibility_version` | str | "2.4.4" | Minimum Majoor version |

### Optional Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `can_extract` | `def can_extract(self, filepath: str) -> bool` | Check if can handle file |
| `pre_extract` | `async def pre_extract(self, filepath: str) -> bool` | Pre-extraction validation |
| `post_extract` | `async def post_extract(self, filepath, result)` | Post-extraction enrichment |
| `cleanup` | `async def cleanup(self)` | Cleanup on unload |

### Helper Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `_create_success_result` | `def _create_success_result(self, data, confidence=1.0)` | Create success result |
| `_create_error_result` | `def _create_error_result(self, error)` | Create error result |

---

## ExtractionResult

```python
@dataclass
class ExtractionResult:
    success: bool           # True if extraction succeeded
    data: Dict[str, Any]    # Extracted metadata
    error: Optional[str]    # Error message if failed
    extractor_name: str     # Plugin name
    confidence: float       # 0.0-1.0 confidence score
```

### Standard Metadata Fields

```python
{
    # Standard ComfyUI metadata
    "prompt": str,              # Main prompt
    "negative_prompt": str,     # Negative prompt
    "seed": int,                # Random seed
    "steps": int,               # Sampling steps
    "sampler": str,             # Sampler name
    "cfg": float,               # CFG scale
    "models": list,             # Model names
    "loras": list,              # LoRA info

    # Custom data
    "custom_data": dict,        # Node-specific data
    "workflow": dict,           # Workflow JSON
    "file_info": dict,          # File information
}
```

---

## Plugin Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Discovery                                                 │
│    - Plugin file found in plugin directory                  │
│    - Validated by PluginValidator                           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Loading                                                   │
│    - Module imported                                        │
│    - Extractor classes instantiated                          │
│    - Registered in PluginLoader                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Runtime                                                   │
│    - can_extract() called to check compatibility            │
│    - pre_extract() called for validation                    │
│    - extract() called for extraction                        │
│    - post_extract() called for enrichment                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Cleanup                                                   │
│    - cleanup() called on unload                             │
│    - Resources released                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Security

### Blocked Patterns

The following patterns are **blocked** during validation:

```python
# Code execution
eval()
exec()
compile()

# OS access
os.system()
os.popen()
subprocess.*

# Network access
socket.*
requests.*
urllib.*

# Unsafe deserialization
pickle.load()
marshal.load()

# Dynamic imports
__import__()
importlib.reload()
```

### Allowed Imports

```python
# Standard library (safe)
typing, collections, functools, itertools, pathlib
json, re, hashlib, base64, io, struct
logging, dataclasses, enum, abc, contextlib
asyncio, datetime, time, math

# Third-party (safe)
PIL (Pillow)
numpy
```

---

## Testing

### Unit Test Example

```python
import pytest
from my_plugin import MyExtractor

@pytest.mark.asyncio
async def test_extraction(tmp_path):
    extractor = MyExtractor()

    # Create test file
    test_file = tmp_path / "test.png"
    test_file.write_bytes(b"fake png data")

    # Test extraction
    result = await extractor.extract(str(test_file))

    assert result.success is True
    assert "key" in result.data
    assert result.confidence > 0
```

### Debug Logging

```python
# Enable debug logging
export MJR_PLUGIN_LOG_LEVEL=DEBUG

# In plugin code
logger.debug(f"Debug message: {data}")
logger.info(f"Info message: {data}")
logger.warning(f"Warning message: {data}")
logger.error(f"Error message: {error}")
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/mjr/am/plugins/list` | GET | List all plugins |
| `/mjr/am/plugins/{name}/enable` | POST | Enable plugin |
| `/mjr/am/plugins/{name}/disable` | POST | Disable plugin |
| `/mjr/am/plugins/reload` | POST | Reload all plugins |

### Example Requests

```bash
# List plugins
curl http://localhost:8188/mjr/am/plugins/list

# Enable plugin
curl -X POST http://localhost:8188/mjr/am/plugins/my_extractor/enable

# Disable plugin
curl -X POST http://localhost:8188/mjr/am/plugins/my_extractor/disable

# Reload plugins
curl -X POST http://localhost:8188/mjr/am/plugins/reload
```

---

## Troubleshooting

### Plugin Not Loading

| Symptom | Solution |
|---------|----------|
| No error in logs | Check file is in correct directory |
| Syntax error | Fix Python syntax in plugin file |
| Validation failed | Remove blocked patterns |
| Import error | Check import paths are valid |

### Extraction Fails

| Symptom | Solution |
|---------|----------|
| File not found | Verify filepath is absolute |
| Permission denied | Check file permissions |
| Timeout | Optimize extraction logic |
| Low confidence | Improve data extraction |

### Performance Issues

| Symptom | Solution |
|---------|----------|
| Slow extraction | Add caching, optimize logic |
| High memory | Release resources in cleanup() |
| Blocking I/O | Use async operations |

---

## Best Practices

### Code Organization

```python
# Good: Organized extraction logic
class MyExtractor(MetadataExtractorPlugin):
    async def extract(self, filepath):
        if filepath.endswith('.png'):
            return await self._extract_png(filepath)
        elif filepath.endswith('.json'):
            return await self._extract_json(filepath)
        return self._create_error_result("Unsupported format")

    async def _extract_png(self, filepath):
        # PNG-specific logic
        pass

    async def _extract_json(self, filepath):
        # JSON-specific logic
        pass
```

### Error Handling

```python
# Good: Comprehensive error handling
async def extract(self, filepath):
    try:
        # Pre-checks
        if not Path(filepath).exists():
            return self._create_error_result("File not found")

        # Extraction
        data = await self._do_extract(filepath)
        return self._create_success_result(data)

    except FileNotFoundError as e:
        return self._create_error_result(f"File not found: {e}")
    except PermissionError as e:
        return self._create_error_result(f"Permission denied: {e}")
    except Exception as e:
        logger.exception(f"Extraction failed")
        return self._create_error_result(str(e))
```

### Logging

```python
# Good: Appropriate logging levels
logger.debug(f"Processing file: {filepath}")      # Debug info
logger.info(f"Extracted metadata from {filepath}") # Success
logger.warning(f"Missing field: {field}")          # Non-critical issue
logger.error(f"Extraction failed: {error}")        # Critical error
```

---

## Examples

See `plugins/examples/` for complete examples:

- `wanvideo_extractor.py` - WanVideo metadata extraction
- `custom_node_extractor.py` - Template with documentation

---

## Resources

- `docs/PLUGIN_SYSTEM_DESIGN.md` - Full architecture
- `mjr_am_backend/features/metadata/plugin_system/base.py` - API reference
- `plugins/README.md` - Installation guide
