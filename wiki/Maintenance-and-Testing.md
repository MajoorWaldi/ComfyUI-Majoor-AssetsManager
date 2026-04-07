# Maintenance and Testing

## Database Maintenance

Majoor Assets Manager stores its SQLite index in the `_mjr_index` area. By default this is inside the output directory, but the location can be changed to any local path — useful for network drive setups. The docs provide clear recovery guidance for corruption and rebuild workflows.

Important maintenance actions include:
- reset index
- force delete database and rebuild
- optimize database after heavy scan or delete activity

The docs also explain what is preserved and what is lost during emergency recovery.

## Configuring the Index Directory

If your output directory is on a NAS or SMB share, SQLite may log "database is locked" errors because many NAS implementations do not support OS-level file locking reliably. The fix is to move the index to a local disk.

**From Settings UI**:
Settings → Paths → Majoor: Index Directory → enter a local path → Save → Restart ComfyUI.

**From environment variable**:
```bash
MJR_AM_INDEX_DIRECTORY=/var/local/mjr_index
```

See [DB_MAINTENANCE.md](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/DB_MAINTENANCE.md) for full details including migration notes.

## Testing Strategy

The project uses:
- pytest for backend testing
- Vitest for frontend testing
- a canonical quality gate script for combined verification

The current testing docs also clarify coverage thresholds, Windows batch runners, and where reports are written.

## Recommended Commands

```bash
python scripts/run_quality_gate.py
python -m pytest -q
npm run test:js
```

## Canonical Docs

- [Database Maintenance](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/DB_MAINTENANCE.md)
- [Testing Guide](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/TESTING.md)
- [API Reference](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/API_REFERENCE.md)
