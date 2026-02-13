# Majoor API Reference

## Compatibility
- Base prefix: `/mjr/am`
- Version alias: `/mjr/am/v1/*` (redirects to `/mjr/am/*`)
- Legacy alias kept for compatibility: `/majoor/version`

## Core Endpoints
| Method | Path | Purpose |
|---|---|---|
| `GET` | `/mjr/am/health` | Extension health summary |
| `GET` | `/mjr/am/health/counters` | Indexed counters |
| `GET` | `/mjr/am/health/db` | DB health/diagnostics |
| `GET` | `/mjr/am/config` | Runtime config snapshot |
| `GET` | `/mjr/am/version` | Extension version info |
| `GET` | `/mjr/am/tools/status` | ExifTool/ffprobe availability |

## Settings
| Method | Path | Purpose |
|---|---|---|
| `POST` | `/mjr/am/settings/probe-backend` | Set probe mode (`auto`, `exiftool`, `ffprobe`, `both`) |
| `GET` | `/mjr/am/settings/output-directory` | Read output directory override |
| `POST` | `/mjr/am/settings/output-directory` | Set output directory override |
| `GET` | `/mjr/am/settings/metadata-fallback` | Read fallback toggles (`image`, `media`) |
| `POST` | `/mjr/am/settings/metadata-fallback` | Set fallback toggles (`image`, `media`) |

## Search/List
| Method | Path | Purpose |
|---|---|---|
| `GET` | `/mjr/am/search` | Search with filters/scope |
| `GET` | `/mjr/am/list` | Paginated asset list |
| `GET` | `/mjr/am/asset/{asset_id}` | Asset details by id |
| `GET` | `/mjr/am/metadata` | Metadata lookup by file reference |

## Indexing/Scan
| Method | Path | Purpose |
|---|---|---|
| `POST` | `/mjr/am/scan` | Scan a scope/root |
| `POST` | `/mjr/am/index-files` | Index explicit files |
| `POST` | `/mjr/am/index/reset` | Reset/rebuild index |

## Asset Operations (Sensitive)
| Method | Path | Purpose |
|---|---|---|
| `POST` | `/mjr/am/open-in-folder` | Open asset location in OS |
| `POST` | `/mjr/am/asset/rating` | Update rating |
| `POST` | `/mjr/am/asset/tags` | Update tags |
| `POST` | `/mjr/am/asset/rename` | Rename asset file |
| `POST` | `/mjr/am/asset/delete` | Delete asset file |
| `POST` | `/mjr/am/assets/delete` | Bulk delete assets |
| `POST` | `/mjr/am/stage-to-input` | Copy/link asset to input |

## Collections/Custom Roots
| Method | Path | Purpose |
|---|---|---|
| `GET` | `/mjr/am/collections` | List collections |
| `POST` | `/mjr/am/collections/*` | Create/update/delete collections |
| `GET` | `/mjr/am/custom-roots` | List custom roots |
| `POST` | `/mjr/am/custom-roots` | Add/remove custom roots |

## Maintenance and Utilities
| Method | Path | Purpose |
|---|---|---|
| `POST` | `/mjr/am/db/optimize` | DB optimize/cleanup |
| `POST` | `/mjr/am/db/cleanup-case-duplicates` | Remove historical path-case duplicates (Windows) |
| `POST` | `/mjr/am/db/force-delete` | Emergency DB rebuild |
| `GET` | `/mjr/am/download` | Stream/download asset |
| `POST` | `/mjr/am/batch-zip` | Build batch ZIP token |
| `GET` | `/mjr/am/batch-zip/{token}` | Download generated ZIP |
| `GET` | `/mjr/am/date-histogram` | Calendar histogram |
| `GET` | `/mjr/am/duplicates/alerts` | Duplicate alerts |

## Security Notes
- State-changing routes require CSRF protection checks.
- Write routes are guarded by Safe Mode / operation gates.
- Optional API token: `X-MJR-Token` or `Authorization: Bearer <token>`.
