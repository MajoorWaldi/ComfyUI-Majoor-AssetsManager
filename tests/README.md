# Tests - Majoor Assets Manager

Test suite for ComfyUI-Majoor-AssetsManager.

---

## Test Structure

```
tests/
├── conftest.py                  # Pytest fixtures & shared setup
├── README.md                    # Test documentation
├── run_tests_all.bat            # Windows full-suite runner
├── __init__.py
├── assets/                      # Asset fixtures and media samples
├── compat/                      # Backward-compatibility coverage
├── config/                      # Configuration tests and runner
├── core/                        # Core route and path helpers
├── database/                    # Schema and SQLite behavior
├── features/                    # Main feature, service, and route coverage
├── metadata/                    # Metadata extraction coverage
├── parser/                      # Parser-focused regression samples
├── quality/                     # Quality-gate tests
├── rating_tags/                 # Ratings, tags, and sync behavior
├── regressions/                 # Targeted regression coverage
├── routes/                      # Route-level scenarios
└── security/                    # Security-specific tests
```

---

## Running Tests

### All tests (Windows)

Double-click `run_tests.bat` in the project root, or:

```bash
cd ComfyUI/custom_nodes/ComfyUI-Majoor-AssetsManager
python -m pytest tests/ -q
```

### Single test file

```bash
python -m pytest tests/core/test_routes.py -v
```

### Single folder

```bash
python -m pytest tests/metadata/ -v
```

### Single test function

```bash
python -m pytest tests/core/test_routes.py::test_routes -v
```

### With coverage
```bash
pytest tests/ --cov=mjr_am_backend --cov=mjr_am_shared --cov-report=html
```

---

## Test Categories

### `core/` - Core functionality

- Result pattern (Ok/Err)
- IndexService scan/search
- FTS5 full-text search
- API route handlers
- End-to-end integration

### `metadata/` - Metadata extraction

- ExifTool/FFprobe extraction
- PNG/WEBP/video generation info
- Workflow JSON parsing
- Quality score calculations

### `rating_tags/` - Ratings & tags

- Rating/tag extraction from files
- OS file sync
- Import operations

### `assets/` - Assets & search

- Batch operations
- Delete operations
- FTS5 search
- Staging deduplication

### `database/` - Database & schema

- Schema migration/healing
- SQLite query patterns
- Geninfo self-healing

### `config/` - Config & security

- CSRF protection
- Origin validation
- Rate limiting
- Path traversal prevention
- Settings persistence

### `features/` - Feature tests

- Collections CRUD
- Multi-file ZIP export
- Date histogram
- Viewer grid masks

### `regressions/` - Regression tests

- Audit issue fixes
- Scan batching regressions
- Logging system

---

## Writing Tests

### Test isolation
Each test should be independent using in-memory databases:

```python
@pytest.mark.asyncio
async def test_example():
    db = Sqlite(":memory:")
    await migrate_schema(db)
    # ... test logic
    await db.aclose()
```

### Result pattern
Always verify the Result pattern:

```python
def test_service_result():
    result = service.do_something()

    assert isinstance(result, Result)
    if result.ok:
        assert result.data is not None
    else:
        assert result.error is not None
```

### Mock external tools
Don't depend on ExifTool/FFprobe availability:

```python
class MockExifTool:
    def is_available(self):
        return False
```

---

## Fixtures

Common fixtures are defined in `conftest.py`:

- `test_db` - In-memory SQLite with schema
- `temp_dir` - Temporary directory for test files
- `mock_exiftool` - Mocked ExifTool adapter

---

## Resources

- [pytest docs](https://docs.pytest.org/)
- [Coverage.py](https://coverage.readthedocs.io/)

---

Last updated: April 5, 2026
