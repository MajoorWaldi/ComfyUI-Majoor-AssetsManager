# Database Maintenance

**Version**: 2.4.5  
**Last Updated**: April 7, 2026

Majoor Assets Manager stores its index in an SQLite database. By default this is at `<output>/_mjr_index/assets.sqlite`, but the index directory can be relocated to any local path — useful when your output folder is on a network share. This document covers the maintenance tools available in the UI, the recovery procedures for corruption scenarios, and how to configure the index directory.

**Recent highlights**: Improved corruption detection, automatic health monitoring, and safer rebuild flows.

## Configuring the Index Directory

By default the index lives next to your assets at `<output>/_mjr_index/`. You can move it to any local path without touching your asset files.

### Why you might want to relocate

- **Network drives (NAS/SMB/CIFS)**: SQLite relies on OS-level file locking. Many NAS/SMB implementations do not support these locks reliably, which can cause "database is locked" errors under concurrent access. Moving the index to a fast local SSD while keeping assets on the NAS eliminates this class of error entirely.
- **Separate disk for performance**: Keep assets on a large slow HDD and the index/DB on a fast SSD.
- **Shared ComfyUI install, separate indexes**: Multiple users on the same machine can each point to their own index directory.

### How to configure

**Option 1 — UI (recommended, survives reinstalls):**

1. Open Majoor Settings → Paths → **Majoor: Index Directory**.
2. Enter the full path to the desired directory (it will be created if it does not exist).
3. Save. A toast confirms the change and reminds you to restart ComfyUI.
4. Restart ComfyUI. A fresh scan runs on startup.

The UI persists the path in a sidecar file `.mjr_index_directory_override` next to the extension root. This file takes precedence over the default on every startup.

**Option 2 — Environment variable:**

Set either `MJR_AM_INDEX_DIRECTORY` or `MAJOOR_INDEX_DIRECTORY` in the environment that launches ComfyUI:

```batch
:: Windows — batch launcher
set MJR_AM_INDEX_DIRECTORY=C:\mjr_index
python main.py
```

```bash
# Linux/macOS — shell launcher
export MJR_AM_INDEX_DIRECTORY=/var/local/mjr_index
python main.py
```

Env var overrides the sidecar file and the default. Restart ComfyUI after changing it.

**Priority order** (highest wins):
1. `MJR_AM_INDEX_DIRECTORY` or `MAJOOR_INDEX_DIRECTORY` environment variable
2. `.mjr_index_directory_override` sidecar file (written by the UI)
3. Default: `<output_directory>/_mjr_index/`

### What the index contains

The index directory holds:

| File | Contents |
|---|---|
| `assets.sqlite` | Main index: metadata, ratings, tags, FTS search index, scan journal |
| `assets.sqlite-wal` / `-shm` | SQLite WAL and shared memory (transient, recreated automatically) |
| `vectors.sqlite` | Optional AI embeddings (vector search) |
| `collections/` | Collection JSON files (preserved across Delete DB) |
| `custom_roots.json` | Custom roots configuration (preserved across Delete DB) |

### After changing the index directory

1. Restart ComfyUI to apply the new path.
2. A fresh scan starts automatically.
3. Ratings, tags, and AI vectors from the old database are **not** automatically migrated.
   - To migrate: stop ComfyUI, copy the `.sqlite` files to the new directory, then restart.
4. The old `_mjr_index` directory is not deleted automatically.

---

## Buttons in the Status Panel

Open the Assets Manager panel and expand the **Index Status** section. Two action buttons appear at the bottom:

| Button | Purpose |
|---|---|
| **Reset index** | Clears cached data inside the existing database and triggers a background rescan. Requires the database to be readable. |
| **Delete DB** | Force-deletes the database files from disk (bypassing all DB-dependent checks) and rebuilds from scratch. Works even when the database is corrupted. |

## Reset Index

The **Reset index** button calls `POST /mjr/am/scan/reset` with flags to clear assets, metadata, FTS index, and scan journal, then triggers a full rescan.

If the database is corrupted, the reset will fail because security-preference queries cannot execute on a malformed database. When this happens:

- The status dot turns red.
- A toast appears: *"Reset failed -- database is corrupted. Use the Delete DB button to force-delete and rebuild."*

## Delete DB (Emergency Recovery)

The **Delete DB** button calls `POST /mjr/am/db/force-delete`. It is designed to work even when the database is completely unreadable.

### How it works

1. **CSRF check only** -- no database-dependent security queries are run.
2. **Adapter reset (fast path)** -- tries `db.areset()` first. If this succeeds the database is wiped through the adapter and a rescan starts immediately.
3. **Manual file deletion (fallback)** -- if the adapter reset fails (typical for severe corruption):
   - Calls `db.close()` to release connections.
   - Runs `gc.collect()` twice with a short delay to release Windows file handles.
   - Deletes `assets.sqlite`, `assets.sqlite-wal`, `assets.sqlite-shm`, and `assets.sqlite-journal` with up to 6 retries per file.
4. **Re-initialization** -- creates a fresh database with all tables, indexes, and triggers.
5. **Background rescan** -- triggers a full non-incremental scan of the output directory.

### Confirmation dialog

Before proceeding, the UI first asks whether existing AI vectors should be kept, then shows a simple confirmation dialog in the ComfyUI Manager style for the selected action.

### What is lost

- Star ratings
- Custom tags
- Cached metadata (prompts, models, generation parameters)
- Scan journal / history

### What is preserved

- Original image/video/audio files (never touched)
- Collections (stored as separate JSON files in `_mjr_index/collections/`)
- Custom roots configuration (`_mjr_index/custom_roots.json`)
- All ComfyUI settings (stored in `localStorage`)

## Automatic Corruption Detection

The status polling loop (every few seconds) checks health counters via `GET /mjr/am/health/counters`. If the response error contains keywords like "malformed", "corrupt", or "disk image":

- The status dot turns red.
- The status text shows **"Database is corrupted"** with a hint to use the Delete DB button.
- A one-time toast notification appears with the same guidance.

The toast fires only once per session to avoid spamming. It resets after a successful Delete DB operation.

## Database Optimize

An additional endpoint `POST /mjr/am/db/optimize` runs `PRAGMA optimize` and `ANALYZE` on the database. This is useful after large scans or bulk deletes to keep query performance optimal. It is best-effort and never throws errors to the UI.

## Manual Recovery

If the Delete DB button reports that files could not be deleted (another process holds a lock):

1. Stop ComfyUI completely.
2. Navigate to `<output>/_mjr_index/`.
3. Delete `assets.sqlite` and any sibling files (`-wal`, `-shm`, `-journal`).
4. Restart ComfyUI.
5. The database will be recreated automatically on startup and a scan will populate it.

## Related Files

| File | Role |
|---|---|
| `mjr_am_backend/routes/handlers/db_maintenance.py` | `/db/optimize` and `/db/force-delete` endpoints |
| `mjr_am_backend/adapters/db/sqlite.py` | DB adapter with malformed detection and online recovery |
| `js/features/status/StatusDot.js` | Frontend status polling, corruption detection, Reset/Delete buttons |
| `js/api/client.js` | `forceDeleteDb()` API call |

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MJR_AM_INDEX_DIRECTORY` / `MAJOOR_INDEX_DIRECTORY` | `<output>/_mjr_index/` | Override the index database directory |
| `MAJOOR_DB_TIMEOUT` | `30.0` | SQLite busy timeout (seconds) |
| `MAJOOR_DB_MAX_CONNECTIONS` | `8` | Maximum concurrent DB connections |
| `MAJOOR_DB_QUERY_TIMEOUT` | `60.0` | Per-query timeout (seconds) |
