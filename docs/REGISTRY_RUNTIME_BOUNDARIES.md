# Registry package and runtime boundaries

The Registry archive excludes development sources and tools through
`.comfyignore`. `dist/`, `vendor/three/`, locales, example workflows, Python
packages, requirements, license notices, and runtime documentation remain.
`docs/` is intentionally retained: `/mjr/am/docs/{filename}` serves it at runtime.
The frontend is loaded from `dist/`; rebuild it with `npm run build` before a
release. See the [official publishing documentation](https://docs.comfy.org/registry/publishing).

## Media processes

`mjr_am_backend/adapters/tools/external_tools.py` owns media process execution.
Commands use argument lists and no shell. Existing adapter executable checks,
timeouts, ExifTool tag restrictions and write authorization are retained.
FFprobe and FFmpeg inputs must resolve to existing filesystem files, including
mounted shares. URL schemes, option-like inputs, directories and missing files
are rejected. A protocol whitelist also restricts nested FFmpeg/FFprobe inputs.
Filesystem validation is not an authorization check: route-level allowed-root
and write policies still apply.

`local_media.py` shares duration/frame operations with vector indexing. Tool
detection, ExifTool, FFprobe and thumbnail conversions use the process boundary.
Unrelated desktop actions and database recovery processes retain their own
existing guards. Git version detection reads local metadata without launching
Git; missing metadata falls back to environment/channel markers/package version.

## Environment

`mjr_am_shared/runtime_env.py` is the shared environment boundary, placed below
both backend and shared utilities to avoid circular imports. It keeps live
reads, missing versus empty semantics, non-string defaults, and the existing
settings updates. It never logs values. API tokens remain environment-configurable.

## Release checks

The frontend uses `/mjr/am/releases?channel=stable` or `channel=nightly` through
the existing API client. The backend release feature contacts only
`https://api.github.com`, with a timeout and redirects disabled. Channel checks
use the fixed Majoor repository and return only version/marker fields. Existing
tags/branches queries remain compatible. This restriction describes the release
feature, not optional model downloads in other features.

## Registry findings

Packaging and explicit boundaries improve auditability; they do not guarantee
a particular scanner result. Graph/WebAudio connections and SQLite connections
are legitimate operations. Do not rename or obfuscate them to hide signatures.
The remaining Registry findings require the complete `status_reason` payload
and a scan of the actual published archive before they can be classified.
