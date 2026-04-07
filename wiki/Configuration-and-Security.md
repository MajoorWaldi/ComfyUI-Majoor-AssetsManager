# Configuration and Security

## Configuration

Runtime behavior is controlled through extension settings and selected environment variables.

Important areas include:
- probe backend selection
- indexing behavior
- index database directory
- root and custom path setup
- metadata extraction tools
- AI model bootstrap and optional HuggingFace access
- remote access and write authorization

## Index Database Directory

By default, the SQLite index lives at `<output>/_mjr_index/assets.sqlite`. You can relocate it to any local path without touching your asset files.

### Why you might want to move it

**Network drive (NAS/SMB/CIFS) users**: SQLite relies on OS-level file locking that many NAS/SMB implementations do not support reliably. This causes "database is locked" errors under concurrent access. Moving the index to a local SSD while keeping assets on the NAS eliminates this problem entirely.

**Separate disk for performance**: Keep large/slow asset storage and a fast index DB on separate volumes.

### How to change the index directory

**From the UI (recommended)**:

1. Open Majoor Settings → Paths → **Majoor: Index Directory**.
2. Enter the full path to the desired directory (created automatically if it does not exist).
3. Save. A toast confirms the save and reminds you to restart ComfyUI.
4. Restart ComfyUI. A fresh scan runs automatically on startup.

**Via environment variable**:

```batch
:: Windows
set MJR_AM_INDEX_DIRECTORY=C:\mjr_index
```
```bash
# Linux/macOS
export MJR_AM_INDEX_DIRECTORY=/var/local/mjr_index
```

**Priority order** (highest to lowest):
1. `MJR_AM_INDEX_DIRECTORY` or `MAJOOR_INDEX_DIRECTORY` environment variable
2. `.mjr_index_directory_override` sidecar file (written by the UI)
3. Default: `<output_directory>/_mjr_index/`

### What the index contains

| File | Contents |
|---|---|
| `assets.sqlite` | Ratings, tags, metadata, FTS index, scan journal |
| `vectors.sqlite` | Optional AI embeddings |
| `collections/` | Collection JSON files (preserved across Delete DB) |
| `custom_roots.json` | Custom roots config (preserved across Delete DB) |

> Ratings, tags, and AI vectors are not migrated automatically when you change the directory. To migrate, stop ComfyUI, copy the `.sqlite` files to the new directory, then restart.

## Security Model

The backend is designed with a compatibility-first local model and explicit controls for remote write access.

Key points:
- loopback writes remain allowed by default
- remote writes require explicit authorization
- strict auth mode is available through environment configuration

## Privacy And Offline Clarification

Recent docs separate local AI inference concerns from remote write-security concerns.

Important distinction:
- the HuggingFace token is about model downloads and Hub access
- the Majoor API token is about protecting remote write operations to the local backend

This distinction matters because users often read "token" as "cloud AI upload". The project docs now explicitly separate those concerns.

## Repository Security Policy

The repository also includes a standard GitHub security policy file, but the operational security model for the extension is described more concretely in the docs listed below.

## Canonical Docs

- [Privacy and Offline Guide](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/PRIVACY_OFFLINE.md)
- [Settings Configuration](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/SETTINGS_CONFIGURATION.md)
- [Security Environment Variables](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/SECURITY_ENV_VARS.md)
- [Threat Model](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/THREAT_MODEL.md)
- [Security Policy](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/SECURITY.md)
