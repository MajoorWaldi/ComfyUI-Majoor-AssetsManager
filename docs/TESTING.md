# Testing

**Version**: 2.3.3  
**Last Updated**: February 28, 2026

This project uses **pytest** (backend) and **Vitest** (frontend) for comprehensive test coverage. On Windows, batch runners are provided for convenience and generate both:
- JUnit XML (`.xml`)
- Styled HTML report (`.html`)

Reports are written to:
- `tests/__reports__/`

Open the index:
- `tests/__reports__/index.html`

## Test Coverage

### Backend (Python)
- Core functionality (index, search, routes)
- Metadata extraction (ExifTool, FFprobe, geninfo)
- Database operations (schema, migrations)
- Security (CSRF, auth, path validation)
- Feature tests (collections, batch ZIP, viewer)
- Regression tests

### Frontend (JavaScript)
- Vue.js components
- API client
- UI utilities
- Event handling
- Drag & drop

---

## Quick Commands

### All Tests (Cross-Platform)
```bash
# From repo root
python -m pytest -q

# With verbose output
python -m pytest -v

# With coverage
pytest tests/ --cov=mjr_am_backend --cov-report=html
```

### Single Test File
```bash
python -m pytest tests/core/test_index.py -v
```

### Single Test Folder
```bash
python -m pytest tests/metadata/ -v
```

### Single Test Function
```bash
python -m pytest tests/core/test_index.py::test_scan_recursive -v
```

### Frontend Tests
```bash
# Run JavaScript tests
npm run test:js

# Watch mode
npm run test:js:watch
```

### Canonical Quality Gate
```bash
# Full repo gate
python scripts/run_quality_gate.py

# Fast Python-only gate (useful before pushing)
python scripts/run_quality_gate.py --python-only --skip-tests

# Tox wrapper for the fast Python-only gate
tox -e quality
```

The canonical gate runs encoding/BOM checks, `ruff`, `mypy`, `bandit`, `pip-audit`, xenon/radon complexity checks, backend tests, frontend tests, and `npm audit`. The `pip-audit` step audits `requirements.txt` directly so the local package itself does not need to be published on PyPI for the gate to pass. CI uses the same script for the Python quality job so local and CI behavior stay aligned.

The Python coverage gate currently enforces a minimum combined backend/shared coverage threshold of `60%`, which gives the CI pipeline a regression floor without making legacy cleanup block unrelated work.

During the migration to stricter quality thresholds, `ruff` is enforced on changed Python files while repository-wide hygiene, security, and complexity checks continue to run across the repo. This keeps the gate hard for new work without turning legacy cleanup into a single big-bang change.

## Batch runners (Windows)

From the repo root:

- Full suite: `run_tests.bat` (delegates to `tests/run_tests_all.bat`)
- Quick suite (skips `test_comfy_output`): `run_tests_quick.bat`
- Metadata / parser suite: `run_tests_parser.bat`

Category runners:

- `tests/config/run_tests_config.bat`
- `tests/core/run_tests_core.bat`
- `tests/database/run_tests_database.bat`
- `tests/features/run_tests_features.bat`
- `tests/metadata/run_tests_metadata.bat`
- `tests/rating_tags/run_tests_rating_tags.bat`
- `tests/regressions/run_tests_regressions.bat`

All batch runners support `/nopause` for non-interactive runs:

```bat
run_tests_quick.bat /nopause
```

## Test artifacts (DB/WAL/SHM)

Some tests create SQLite files. Pytest temp files are stored under:
- `tests/__pytest_tmp__/`

This includes `*.db`, `*.db-wal`, `*.db-shm`, and other runtime artifacts.

## Parser samples (metadata extraction)

`tests/metadata/test_parser_folder_scan.py` scans **every file** under:
- `tests/parser/` (recursive)

If you don't want to commit large samples, you can point the test to an external folder:

```powershell
$env:MJR_TEST_PARSER_DIR = "C:\path\to\parser"
python -m pytest tests/metadata/test_parser_folder_scan.py -q
```

