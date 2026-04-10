# Dependency Policy

Date: 2026-04-09

## Goal

Keep one explicit dependency contract per use case and avoid drift between packaging metadata, manual installs, and CI tooling.

## Source Of Truth

- `requirements.txt` is the primary dependency source of truth for the project.
- `requirements.txt` is also the default runtime install contract for the extension.
- `requirements-vector.txt` extends runtime with optional AI/vector dependencies.
- `requirements-dev.txt` is the contributor tooling layer for tests, linting, typing, and security checks.
- `pyproject.toml` mirrors published metadata and optional dependency groups for packaging, but does not replace `requirements.txt` as the source of truth used by users and CI.

## Dependency Roles

### Runtime

Put a dependency in `requirements.txt` only if the extension needs it for normal backend operation.

Examples:
- `aiohttp`
- `aiosqlite`
- `pillow`
- `send2trash`

### Optional AI / Vector

Put a dependency in `requirements-vector.txt` only if it is required for optional AI, vector search, captioning, clustering, or related enrichment features.

This file must include `-r requirements.txt` so it always layers on top of the runtime baseline.

### Dev / Contributor Tooling

Put a dependency in `requirements-dev.txt` only if it is used to develop, test, lint, type-check, or audit the project locally or in CI.

Examples:
- `pytest`
- `ruff`
- `mypy`
- `bandit`
- `pip-audit`

Dev tools must not be added to `requirements.txt` just because CI uses them.

## Update Rules

When adding or changing a dependency:

1. Decide whether it is `runtime`, `vector`, or `dev`.
2. Update `requirements.txt` first when the dependency affects the main project baseline.
3. Update the matching extension file when the dependency is optional or contributor-only.
4. Mirror the change in `pyproject.toml` when it affects published metadata.
5. Update docs if the install story or contributor workflow changed.
6. Run the relevant tests or quality checks for the impacted area.

## CI And Quality Gate Expectations

- Runtime security auditing targets `requirements.txt`.
- Contributor tooling is installed from `requirements-dev.txt` for local development and quality workflows.
- Optional AI/vector installs remain opt-in and must not become implicit in the default setup.

## Non-Goals

- No hidden dependency source in ad hoc scripts.
- No “install everything always” default for end users.
- No divergence between README instructions and the actual files used by installs.

## Quick Commands

```bash
# Runtime only
pip install -r requirements.txt

# Runtime + optional AI/vector features
pip install -r requirements.txt -r requirements-vector.txt

# Contributor tooling
pip install -r requirements-dev.txt
```