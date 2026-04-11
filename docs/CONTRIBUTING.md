# Contributing to Majoor Assets Manager

Thank you for your interest in contributing to **ComfyUI-Majoor-AssetsManager**! This guide will help you set up your development environment, understand our coding standards, and submit quality contributions.

---

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Contributions](#submitting-contributions)
- [Git Workflow](#git-workflow)
- [Code Quality Gate](#code-quality-gate)
- [Documentation](#documentation)
- [Getting Help](#getting-help)

---

## Development Setup

### Prerequisites

- **Python**: 3.10 - 3.13 (3.14 not yet supported)
- **Node.js**: 18+ (LTS recommended)
- **Git**: 2.30+
- **ComfyUI**: >= 0.13.0 (running instance for testing)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager.git
cd ComfyUI-Majoor-AssetsManager

# 2. Install Python dependencies
pip install -r requirements.txt

# For AI/vector features (optional):
pip install -r requirements.txt -r requirements-vector.txt

# For development tooling (optional but recommended):
pip install -r requirements-dev.txt

# 3. Install Node dependencies
npm install

# 4. Install Git hooks (pre-commit, pre-push quality gates)
npm run hooks:install

# 5. Build frontend (if making JS/Vue changes)
npm run build
```

### Development Workflow

```bash
# Watch mode for frontend development (auto-rebuild)
npm run build:watch

# Run Python tests
pytest

# Run frontend tests
npm run test:js

# Run quality checks (linters, type checkers, security scanners)
npm run quality

# Python-only quality check (faster)
npm run quality:py

# Fix linting issues
npm run lint:py:fix   # Python
npm run lint:js:fix   # JavaScript
npm run format        # Prettier
```

---

## Project Structure

```
majoor-assetsmanager/
├── __init__.py                    # ComfyUI extension entrypoint
├── mjr_am_backend/                # Python backend (aiohttp routes + features)
│   ├── routes/                    # HTTP route handlers
│   ├── features/                  # Business logic (search, index, AI, etc.)
│   └── adapters/                  # External system adapters (DB, FS, tools)
├── mjr_am_shared/                 # Shared utilities (types, errors, logging)
├── js/                            # Frontend source (Vue 3 + vanilla JS)
│   ├── vue/                       # Vue 3 components
│   ├── features/                  # Feature modules (viewer, grid, filters)
│   ├── components/                # Reusable UI components
│   ├── stores/                    # Pinia state management
│   ├── api/                       # Backend HTTP client
│   └── app/                       # Application bootstrap
├── js_dist/                       # Built frontend (Vite output)
├── tests/                         # Python tests (pytest)
│   ├── backend/                   # Backend unit/integration tests
│   ├── features/                  # Feature tests
│   └── security/                  # Security tests
├── docs/                          # Documentation
│   └── adr/                       # Architecture Decision Records
├── scripts/                       # Development/CI scripts
└── plugins/                       # Plugin system examples
```

### Key Architecture Principles

1. **Backend**: Routes → Features → Adapters (clean separation of concerns)
2. **Frontend**: Vue 3 owns major UI surfaces; imperative runtime bridges are explicit and limited
3. **State**: Pinia stores own UI state; localStorage for persistence
4. **Security**: Safe mode by default; write/delete operations require explicit opt-in
5. **Error Handling**: `Result[T]` pattern everywhere — no exceptions bubble to UI

See [`docs/ARCHITECTURE_MAP.md`](docs/ARCHITECTURE_MAP.md) and [`docs/adr/`](docs/adr/) for detailed design decisions.

---

## Coding Standards

### Python

- **Style**: Follow [Black](https://black.readthedocs.io/) formatting (line length: 100)
- **Linting**: [Ruff](https://docs.astral.sh/ruff/) with rules in `pyproject.toml`
- **Type Checking**: [MyPy](https://mypy.readthedocs.io/) + [Pyright](https://github.com/microsoft/pyright) (standard mode)
- **Imports**: Organized by Ruff `I` rule (isort-compatible)
- **Error Handling**: Use `Result[T]` from `mjr_am_shared/result.py` — never raise to UI
- **Security**: Never import `ComfyUI/server.py` (see [ADR-002](docs/adr/0002-comfyui-server-import-safety.md))

**Example**:
```python
from mjr_am_shared.result import Result, Ok, Err

def process_asset(asset_id: str) -> Result[dict]:
    try:
        # ... processing logic
        return Ok({"status": "success", "id": asset_id})
    except Exception as e:
        return Err(f"Failed to process asset {asset_id}: {e}")
```

### JavaScript/Vue

- **Style**: ESLint + Prettier (config in `eslint.config.mjs`, `.prettierrc`)
- **Framework**: Vue 3 Composition API with `<script setup>`
- **State**: Pinia stores for reactive state; no global mutable objects
- **Testing**: Vitest with Happy-DOM for component tests
- **Naming**: camelCase for variables/functions, PascalCase for Vue components

**Example**:
```vue
<script setup>
import { ref, computed } from 'vue'
import { usePanelStore } from '../../stores/usePanelStore.js'

const props = defineProps({
  asset: { type: Object, required: true }
})

const panelStore = usePanelStore()
const isSelected = computed(() =>
  panelStore.selectedIds.includes(props.asset.id)
)
</script>
```

### Commits

- Use [Conventional Commits](https://www.conventionalcommits.org/) format:
  ```
  feat: add multi-pin support in Floating Viewer
  fix: prevent timeout leak in Card.js
  docs: update API reference with vector endpoints
  ```
- Keep commits focused and atomic (one logical change per commit)
- Write clear, descriptive messages (explain "why", not "what")

---

## Testing

### Backend (Python)

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=mjr_am_backend --cov-report=html

# Run specific test file
pytest tests/features/test_sampler_tracer_extra.py

# Run with timeout
pytest --timeout=30
```

**Test organization**:
- `tests/backend/` — Backend unit/integration tests
- `tests/features/` — Feature-specific tests (geninfo parser, metadata extraction)
- `tests/security/` — Security tests (rate limiting, auth)
- `tests/database/` — Database schema and migration tests

### Frontend (JavaScript/Vue)

```bash
# Run all tests
npm run test:js

# Run with coverage
npm run test:js:coverage

# Watch mode
npm run test:js:watch
```

**Test organization**:
- `js/tests/` — Vitest test files
- Test files named `*.vitest.mjs`
- Cover: composables, utilities, security-critical modules

### Coverage Thresholds

| Metric | Python | JavaScript |
|--------|--------|------------|
| Lines | 68% | 30% |
| Branches | Tracked (--cov-branch) | 20% |
| Functions | 70% | 30% |

**Note**: These are minimum thresholds. Security-critical code should have 100% coverage.

---

## Submitting Contributions

### Before You Start

1. **Check existing issues**: See if someone else is working on your idea
2. **Open an issue**: For features, bugs, or significant changes
3. **Discuss approach**: For complex changes, propose design in issue comments

### Pull Request Process

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following coding standards
3. **Add tests** for new features or bug fixes
4. **Run quality gate**: `npm run quality` (must pass)
5. **Update documentation** if behavior changes
6. **Submit PR** with clear description:
   - What changed and why
   - How to test the changes
   - Any breaking changes or migration steps

### PR Checklist

- [ ] Code follows project style guide
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Quality gate passes (`npm run quality`)
- [ ] Documentation updated
- [ ] Commit messages are clear and conventional
- [ ] No merge conflicts with target branch

### Review Process

Mainters will review your PR and may:
- Request changes (address feedback before merging)
- Approve and merge
- Ask for clarification on implementation choices

---

## Git Workflow

### Branch Strategy

- **`main`**: Stable release branch (always deployable)
- **Feature branches**: `feat/feature-name` or `fix/bug-name`
- **Release tags**: `v2.4.5`, `v2.5.0`, etc. (semantic versioning)

### Typical Workflow

```bash
# 1. Create feature branch
git checkout main
git pull origin main
git checkout -b feat/add-new-filter

# 2. Make changes and commit
git add .
git commit -m "feat: add resolution filter to asset queries"

# 3. Push and create PR
git push origin feat/add-new-filter
```

### Pre-Push Quality Gate

The pre-push hook automatically runs:
```bash
python scripts/run_changed_quality_gate.py
```

This checks changed files only (faster than full quality gate).

---

## Code Quality Gate

The quality gate enforces:

### Python Checks
- ✅ UTF-8 text files without BOM
- ✅ Ruff linting (changed files during migration window)
- ✅ MyPy type checking
- ✅ Bandit security linting
- ✅ pip-audit dependency auditing
- ✅ Xenon/Radon complexity checks
- ✅ Backend tests pass

### Frontend Checks
- ✅ ESLint passes
- ✅ Prettier formatting
- ✅ Vitest tests pass
- ✅ npm audit passes

### Running the Gate

```bash
# Full quality gate
npm run quality

# Python only (faster)
npm run quality:py

# Skip tests (for quick checks)
python scripts/run_quality_gate.py --skip-tests

# Tox environment
tox -e quality
```

**Important**: The quality gate **must pass** before PRs are merged.

---

## Documentation

### When to Update Docs

Update documentation when:
- Adding new features or changing behavior
- Modifying API endpoints or configuration
- Introducing breaking changes
- Fixing bugs that affect user-facing behavior

### Documentation Standards

- **Language**: English (all user-facing docs)
- **Format**: Markdown (`.md` files)
- **Location**: `docs/` directory
- **Index**: Update [`docs/DOCUMENTATION_INDEX.md`](docs/DOCUMENTATION_INDEX.md) for new docs

### Types of Documentation

| Document Type | Purpose | Location |
|--------------|---------|----------|
| **User Guides** | How to use features | `docs/*.md` |
| **API Reference** | Backend endpoints | `docs/API_REFERENCE.md` |
| **Architecture** | Design decisions | `docs/adr/` |
| **Configuration** | Settings & env vars | `docs/SETTINGS_CONFIGURATION.md` |
| **Security** | Threat model, hardening | `docs/SECURITY_ENV_VARS.md`, `docs/THREAT_MODEL.md` |

### Architecture Decision Records (ADRs)

For significant architectural decisions:
1. Create `docs/adr/NNNN-short-title.md`
2. Follow ADR template (context, decision, consequences)
3. Reference in `docs/adr/README.md`

See existing ADRs for examples.

---

## Getting Help

### Resources

- **Documentation**: [`docs/DOCUMENTATION_INDEX.md`](docs/DOCUMENTATION_INDEX.md)
- **API Reference**: [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md)
- **Architecture**: [`docs/ARCHITECTURE_MAP.md`](docs/ARCHITECTURE_MAP.md)
- **Changelog**: [`CHANGELOG.md`](CHANGELOG.md)

### Contact

- **GitHub Issues**: [Report bugs or request features](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/issues)
- **GitHub Discussions**: [Ask questions or share ideas](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/discussions)

### Common Questions

**Q: How do I test changes locally?**
```bash
# Rebuild frontend
npm run build

# Restart ComfyUI (extension loads from js_dist/)
# Test in browser, iterate quickly
```

**Q: Can I add a new dependency?**
- **Runtime**: Must be justified and approved (keep minimal)
- **Dev**: Easier to approve (testing, linting tools)
- **Optional**: AI/vector deps in `requirements-vector.txt`

**Q: What if the quality gate fails on CI but passes locally?**
- Check Python/Node version differences
- Ensure all files are committed (CI checks entire repo)
- Run `npm run quality` from clean state

---

## Recognition

Contributors are recognized in:
- GitHub contributors page
- Release notes (for significant contributions)
- This file (optional, add your name below)

### Contributors

- **MajoorWaldi** — Original creator and lead maintainer
- *[Your name here — submit a PR to add yourself!]*

---

## License

By contributing, you agree that your contributions will be licensed under the project's [LICENSE](LICENSE).

Thank you for helping make Majoor Assets Manager better! 🎉
