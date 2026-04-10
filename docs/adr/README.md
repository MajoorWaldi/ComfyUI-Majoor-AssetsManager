# Architecture Decision Records (ADRs)

This folder tracks non-trivial architectural decisions for Majoor Assets Manager.

## Index
- `0001-error-handling-result.md` — Use `Result[T]` everywhere, no UI exceptions.
- `0002-comfyui-server-import-safety.md` — Never import `ComfyUI/server.py` from extension code.
- `0003-frontend-vue-ownership-runtime-bridges.md` — Vue owns major UI surfaces; runtime bridges stay explicit and limited.
- `0004-panel-runtime-split.md` — `panelRuntime` remains an orchestration layer; responsibilities split into focused modules.

