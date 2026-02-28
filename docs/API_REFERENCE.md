# Majoor API Reference

**Base Path**: `/mjr/am`  
**Version**: 2.3.3  
**Last Updated**: February 28, 2026

---

## Compatibility

### Versioning
- **Current API**: `/mjr/am/*` (unversioned, stable)
- **Version Alias**: `/mjr/am/v1/*` → redirects to `/mjr/am/*` (308 Permanent Redirect)
- **Legacy Alias**: `/majoor/version` → redirects to `/mjr/am/version`

### Authentication
Most endpoints require authentication when ComfyUI auth is enabled:
- **Read operations**: May work without auth (depends on configuration)
- **Write operations**: Require authentication or API token
- **CSRF Protection**: All state-changing endpoints require `X-Requested-With: XMLHttpRequest` or `X-CSRF-Token`

### API Token
For remote access or when `MAJOOR_API_TOKEN` is configured:
```
X-MJR-Token: <your-token>
# OR
Authorization: Bearer <your-token>
```

---

## Table of Contents

- [Health & Diagnostics](#health--diagnostics)
- [Settings & Configuration](#settings--configuration)
- [Search & Discovery](#search--discovery)
- [Asset Operations](#asset-operations)
- [Indexing & Scanning](#indexing--scanning)
- [Collections & Custom Roots](#collections--custom-roots)
- [Viewer & Metadata](#viewer--metadata)
- [Download & Export](#download--export)
- [Database Maintenance](#database-maintenance)
- [Utilities](#utilities)

---

## Health & Diagnostics

### Health Summary
```http
GET /mjr/am/health
```

**Response**: Extension health summary including version, status, and basic metrics.

```json
{
  "ok": true,
  "data": {
    "version": "2.3.3",
    "status": "healthy",
    "indexed_count": 1234,
    "scopes_available": ["output", "input", "custom", "collections"]
  }
}
```

---

### Health Counters
```http
GET /mjr/am/health/counters
```

**Response**: Indexed counters for all scopes.

```json
{
  "ok": true,
  "data": {
    "output": { "count": 1000, "last_scan": "2026-02-28T10:00:00Z" },
    "input": { "count": 200, "last_scan": "2026-02-28T10:00:00Z" },
    "custom": { "count": 34, "last_scan": "2026-02-28T10:00:00Z" },
    "collections": { "count": 5 }
  }
}
```

---

### Database Health
```http
GET /mjr/am/health/db
```

**Response**: Database diagnostics including schema version, integrity status, and statistics.

```json
{
  "ok": true,
  "data": {
    "schema_version": 7,
    "integrity_check": "ok",
    "page_count": 1024,
    "freelist_count": 128,
    "cache_size": 2000
  }
}
```

---

### Runtime Configuration
```http
GET /mjr/am/config
```

**Response**: Current runtime configuration snapshot.

```json
{
  "ok": true,
  "data": {
    "output_directory": "/path/to/output",
    "media_probe_backend": "auto",
    "db_timeout": 30.0,
    "max_connections": 8,
    "safe_mode": true,
    "allow_symlinks": false
  }
}
```

---

### Version Information
```http
GET /mjr/am/version
```

**Response**: Extension version and build information.

```json
{
  "ok": true,
  "data": {
    "version": "2.3.3",
    "branch": "main",
    "build_date": "2026-02-28",
    "python_version": "3.11.0",
    "comfyui_version": "0.13.0"
  }
}
```

---

### Tool Status
```http
GET /mjr/am/tools/status
```

**Response**: Availability status of external tools (ExifTool, FFprobe).

```json
{
  "ok": true,
  "data": {
    "exiftool": { "available": true, "version": "12.40" },
    "ffprobe": { "available": true, "version": "6.0" },
    "backend": "both"
  }
}
```

---

## Settings & Configuration

### Probe Backend Settings
```http
GET  /mjr/am/settings/probe-backend
POST /mjr/am/settings/probe-backend
```

**GET**: Read current probe mode.  
**POST**: Set probe mode.

**Request Body** (POST):
```json
{
  "mode": "auto"  // "auto", "exiftool", "ffprobe", "both"
}
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "mode": "auto",
    "available": ["exiftool", "ffprobe"]
  }
}
```

---

### Output Directory Override
```http
GET  /mjr/am/settings/output-directory
POST /mjr/am/settings/output-directory
```

**GET**: Read output directory override.  
**POST**: Set output directory override.

**Request Body** (POST):
```json
{
  "path": "/path/to/custom/output"
}
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "path": "/path/to/custom/output",
    "exists": true,
    "writable": true
  }
}
```

---

### Metadata Fallback Toggles
```http
GET  /mjr/am/settings/metadata-fallback
POST /mjr/am/settings/metadata-fallback
```

**GET**: Read fallback toggles for metadata extraction.  
**POST**: Set fallback toggles.

**Request Body** (POST):
```json
{
  "image": true,   // Use internal parser if ExifTool fails
  "media": true    // Use hachoir if ffprobe unavailable
}
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "image": true,
    "media": true
  }
}
```

---

## Search & Discovery

### Search with Filters
```http
GET /mjr/am/search
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query (full-text) |
| `scope` | string | Scope: `output`, `input`, `custom`, `collections` |
| `root_id` | string | Custom root ID (for custom scope) |
| `collection_id` | string | Collection ID (for collections scope) |
| `kind` | string | File kind: `image`, `video`, `audio`, `model3d`, `all` |
| `min_rating` | integer | Minimum rating (0-5) |
| `workflow` | boolean | Filter by workflow presence |
| `date_from` | string | Start date (ISO 8601) |
| `date_to` | string | End date (ISO 8601) |
| `size_from` | integer | Minimum file size (bytes) |
| `size_to` | integer | Maximum file size (bytes) |
| `width_from` | integer | Minimum image width |
| `width_to` | integer | Maximum image width |
| `height_from` | integer | Minimum image height |
| `height_to` | integer | Maximum image height |
| `sort` | string | Sort field: `relevance`, `name`, `date`, `size`, `rating` |
| `order` | string | Sort order: `asc`, `desc` |
| `page` | integer | Page number (1-based) |
| `page_size` | integer | Items per page (default: 50) |
| `hide_png_siblings` | boolean | Hide PNGs when video exists |

**Example**:
```http
GET /mjr/am/search?q=fantasy&scope=output&kind=image&min_rating=4&sort=date&order=desc&page=1&page_size=50
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "total": 150,
    "page": 1,
    "page_size": 50,
    "total_pages": 3,
    "items": [
      {
        "id": "asset_123",
        "filename": "fantasy_character.png",
        "path": "/path/to/output/fantasy_character.png",
        "type": "image",
        "size": 2048576,
        "width": 1024,
        "height": 1536,
        "rating": 5,
        "tags": ["fantasy", "character"],
        "created_at": "2026-02-28T10:00:00Z",
        "metadata": {
          "prompt": "A fantasy character...",
          "model": "SDXL",
          "steps": 30
        }
      }
    ]
  }
}
```

---

### List Assets (Paginated)
```http
GET /mjr/am/list
```

**Query Parameters**: Same as search, but without `q` parameter.

**Purpose**: List assets without full-text search (faster for browsing).

---

### Asset Details
```http
GET /mjr/am/asset/{asset_id}
```

**Response**: Full asset details including metadata.

```json
{
  "ok": true,
  "data": {
    "id": "asset_123",
    "filename": "fantasy_character.png",
    "path": "/path/to/output/fantasy_character.png",
    "type": "image",
    "extension": "png",
    "size": 2048576,
    "width": 1024,
    "height": 1536,
    "rating": 5,
    "tags": ["fantasy", "character"],
    "created_at": "2026-02-28T10:00:00Z",
    "modified_at": "2026-02-28T10:00:00Z",
    "metadata": {
      "prompt": "A fantasy character...",
      "negative_prompt": "ugly, blurry",
      "model": "SDXL",
      "sampler": "DPM++ 2M Karras",
      "steps": 30,
      "cfg_scale": 7.0,
      "seed": 123456789,
      "workflow": { ... }
    },
    "thumbnails": {
      "small": "/mjr/am/thumbnail/asset_123?size=small",
      "medium": "/mjr/am/thumbnail/asset_123?size=medium",
      "large": "/mjr/am/thumbnail/asset_123?size=large"
    }
  }
}
```

---

### Metadata Lookup
```http
GET /mjr/am/metadata
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Scope type: `output`, `input`, `custom` |
| `filename` | string | Filename |
| `subfolder` | string | Subfolder path (optional) |
| `root_id` | string | Custom root ID (for custom scope) |

**Example**:
```http
GET /mjr/am/metadata?type=output&filename=image.png&subfolder=2026-02-28
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "filename": "image.png",
    "path": "/path/to/output/2026-02-28/image.png",
    "metadata": { ... }
  }
}
```

---

## Asset Operations

### Update Rating
```http
POST /mjr/am/asset/rating
```

**Request Body**:
```json
{
  "asset_id": "asset_123",
  "rating": 5  // 0-5
}
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "asset_id": "asset_123",
    "rating": 5,
    "synced_to_file": true
  }
}
```

---

### Update Tags
```http
POST /mjr/am/asset/tags
```

**Request Body**:
```json
{
  "asset_id": "asset_123",
  "tags": ["fantasy", "character", "sdxl"]
}
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "asset_id": "asset_123",
    "tags": ["fantasy", "character", "sdxl"],
    "synced_to_file": true
  }
}
```

---

### Rename Asset
```http
POST /mjr/am/asset/rename
```

**Request Body**:
```json
{
  "asset_id": "asset_123",
  "new_filename": "new_name.png"
}
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "asset_id": "asset_123",
    "old_path": "/path/to/old_name.png",
    "new_path": "/path/to/new_name.png"
  }
}
```

**Note**: Requires `MAJOOR_ALLOW_RENAME=1` if Safe Mode is enabled.

---

### Delete Single Asset
```http
POST /mjr/am/asset/delete
```

**Request Body**:
```json
{
  "asset_id": "asset_123"
}
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "asset_id": "asset_123",
    "deleted": true,
    "path": "/path/to/deleted_file.png"
  }
}
```

**Note**: Requires `MAJOOR_ALLOW_DELETE=1` if Safe Mode is enabled.

---

### Bulk Delete Assets
```http
POST /mjr/am/assets/delete
```

**Request Body**:
```json
{
  "asset_ids": ["asset_123", "asset_124", "asset_125"]
}
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "deleted_count": 3,
    "deleted_ids": ["asset_123", "asset_124", "asset_125"],
    "failed": []
  }
}
```

**Note**: Requires `MAJOOR_ALLOW_DELETE=1` if Safe Mode is enabled.

---

### Open in Folder
```http
POST /mjr/am/open-in-folder
```

**Request Body**:
```json
{
  "asset_id": "asset_123"
}
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "asset_id": "asset_123",
    "path": "/path/to/output",
    "opened": true
  }
}
```

**Note**: Requires `MAJOOR_ALLOW_OPEN_IN_FOLDER=1` if Safe Mode is enabled.

---

### Stage to Input
```http
POST /mjr/am/stage-to-input
```

**Request Body**:
```json
{
  "asset_id": "asset_123"
}
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "asset_id": "asset_123",
    "staged_path": "/path/to/input/staged_file.png",
    "staged": true
  }
}
```

**Purpose**: Copy/link asset to ComfyUI input directory for workflow use.

---

## Indexing & Scanning

### Scan Scope/Root
```http
POST /mjr/am/scan
```

**Request Body**:
```json
{
  "scope": "output",      // "output", "input", "custom"
  "root_id": null,        // Custom root ID (for custom scope)
  "incremental": true,    // Incremental scan (default)
  "force": false          // Force full rescan
}
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "scan_id": "scan_123",
    "scope": "output",
    "status": "started",
    "estimated_duration_ms": 5000
  }
}
```

**Note**: Scan runs in background. Status available via health endpoints.

---

### Index Explicit Files
```http
POST /mjr/am/index-files
```

**Request Body**:
```json
{
  "files": [
    {
      "filename": "image.png",
      "subfolder": "2026-02-28",
      "type": "output"
    }
  ],
  "origin": "generation"  // "generation", "manual", "import"
}
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "indexed_count": 1,
    "failed": []
  }
}
```

**Purpose**: Index specific files (used for real-time generation tracking).

---

### Reset Index
```http
POST /mjr/am/index/reset
```

**Request Body**:
```json
{
  "scope": "output",      // Scope to reset
  "clear_assets": true,   // Clear asset records
  "clear_metadata": true, // Clear metadata cache
  "clear_fts": true,      // Clear full-text search index
  "clear_journal": true   // Clear scan journal
}
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "scope": "output",
    "reset": true,
    "rescan_triggered": true
  }
}
```

---

## Collections & Custom Roots

### List Collections
```http
GET /mjr/am/collections
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "collections": [
      {
        "id": "collection_123",
        "name": "Best Characters",
        "item_count": 25,
        "created_at": "2026-02-28T10:00:00Z",
        "modified_at": "2026-02-28T12:00:00Z"
      }
    ]
  }
}
```

---

### Create/Update Collection
```http
POST /mjr/am/collections/create
POST /mjr/am/collections/update
```

**Request Body** (Create):
```json
{
  "name": "Best Characters",
  "items": [
    {
      "asset_id": "asset_123",
      "scope": "output"
    }
  ]
}
```

**Request Body** (Update):
```json
{
  "collection_id": "collection_123",
  "name": "Updated Name",
  "items": [...],
  "add_items": [...],    // Items to add
  "remove_items": [...]  // Items to remove
}
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "collection_id": "collection_123",
    "name": "Updated Name",
    "item_count": 30
  }
}
```

---

### Delete Collection
```http
POST /mjr/am/collections/delete
```

**Request Body**:
```json
{
  "collection_id": "collection_123"
}
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "collection_id": "collection_123",
    "deleted": true
  }
}
```

**Note**: Does not delete assets, only the collection definition.

---

### List Custom Roots
```http
GET /mjr/am/custom-roots
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "roots": [
      {
        "id": "root_123",
        "path": "/path/to/custom/dir",
        "name": "Custom Directory",
        "added_at": "2026-02-28T10:00:00Z"
      }
    ]
  }
}
```

---

### Add Custom Root
```http
POST /mjr/am/custom-roots/add
```

**Request Body**:
```json
{
  "path": "/path/to/custom/dir",
  "name": "Custom Directory"
}
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "root_id": "root_123",
    "path": "/path/to/custom/dir",
    "added": true
  }
}
```

---

### Remove Custom Root
```http
POST /mjr/am/custom-roots/remove
```

**Request Body**:
```json
{
  "root_id": "root_123"
}
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "root_id": "root_123",
    "removed": true
  }
}
```

---

## Viewer & Metadata

### Viewer Info
```http
GET /mjr/am/viewer/info
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `asset_id` | string | Asset ID |

**Example**:
```http
GET /mjr/am/viewer/info?asset_id=asset_123
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "asset_id": "asset_123",
    "filename": "fantasy_character.png",
    "type": "image",
    "width": 1024,
    "height": 1536,
    "metadata": {
      "prompt": "A fantasy character...",
      "model": "SDXL",
      "workflow_minimap": { ... }
    }
  }
}
```

---

## Download & Export

### Download Asset
```http
GET /mjr/am/download
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `asset_id` | string | Asset ID |
| `filename` | string | Filename (for direct download) |
| `type` | string | Scope type |
| `subfolder` | string | Subfolder path |

**Example**:
```http
GET /mjr/am/download?asset_id=asset_123
```

**Response**: File stream with appropriate Content-Type and Content-Disposition headers.

---

### Create Batch ZIP
```http
POST /mjr/am/batch-zip
```

**Request Body**:
```json
{
  "asset_ids": ["asset_123", "asset_124", "asset_125"]
}
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "token": "zip_token_abc123",
    "expires_at": "2026-02-28T11:00:00Z",
    "download_url": "/mjr/am/batch-zip/zip_token_abc123"
  }
}
```

---

### Download Batch ZIP
```http
GET /mjr/am/batch-zip/{token}
```

**Response**: ZIP file stream containing all requested assets.

---

## Database Maintenance

### Optimize Database
```http
POST /mjr/am/db/optimize
```

**Purpose**: Run `PRAGMA optimize` and `ANALYZE` for performance.

**Response**:
```json
{
  "ok": true,
  "data": {
    "optimized": true,
    "duration_ms": 150
  }
}
```

---

### Cleanup Case Duplicates
```http
POST /mjr/am/db/cleanup-case-duplicates
```

**Purpose**: Remove historical path-case duplicates (Windows-specific).

**Response**:
```json
{
  "ok": true,
  "data": {
    "duplicates_removed": 5,
    "kept_canonical": 100
  }
}
```

---

### Force-Delete Database
```http
POST /mjr/am/db/force-delete
```

**Purpose**: Emergency recovery for corrupted databases.

**Response**:
```json
{
  "ok": true,
  "data": {
    "deleted": true,
    "reinitialized": true,
    "rescan_triggered": true
  }
}
```

**Note**: This endpoint bypasses normal DB-dependent security checks for emergency recovery.

---

## Utilities

### Date Histogram
```http
GET /mjr/am/date-histogram
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `month` | string | Month in YYYY-MM format |
| `scope` | string | Scope type |

**Example**:
```http
GET /mjr/am/date-histogram?month=2026-02&scope=output
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "month": "2026-02",
    "days": [
      { "date": "2026-02-01", "count": 50 },
      { "date": "2026-02-02", "count": 75 },
      ...
    ]
  }
}
```

**Purpose**: Calendar histogram for date-based filtering UI.

---

### Duplicate Alerts
```http
GET /mjr/am/duplicates/alerts
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "duplicate_groups": [
      {
        "filename": "image.png",
        "paths": [
          "/path/to/output/image.png",
          "/path/to/output/subfolder/image.png"
        ],
        "count": 2
      }
    ],
    "total_groups": 5,
    "total_duplicates": 10
  }
}
```

---

### Releases Information
```http
GET /mjr/am/releases
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "current_version": "2.3.3",
    "branch": "main",
    "latest_release": {
      "version": "2.3.3",
      "date": "2026-02-28",
      "download_url": "https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/releases/tag/v2.3.3"
    },
    "branches_available": ["main", "dev"],
    "tags_available": ["v2.3.3", "v2.3.2", "v2.3.1"]
  }
}
```

---

## Security Notes

### CSRF Protection
All state-changing endpoints (POST, PUT, PATCH, DELETE) require:
- `X-Requested-With: XMLHttpRequest` header, OR
- `X-CSRF-Token` header with valid token

### Authentication
When ComfyUI auth is enabled:
- Write operations require authenticated user
- API token can be used for remote access
- Token sent via `X-MJR-Token` or `Authorization: Bearer`

### Safe Mode
When Safe Mode is enabled (default):
- Delete operations require `MAJOOR_ALLOW_DELETE=1`
- Rename operations require `MAJOOR_ALLOW_RENAME=1`
- Open in folder requires `MAJOOR_ALLOW_OPEN_IN_FOLDER=1`

### Rate Limiting
Expensive endpoints are rate-limited:
- Search: 10 requests/minute per client
- Scan: 5 requests/minute per client
- Batch ZIP: 3 requests/minute per client
- Metadata: 20 requests/minute per client

Client identity based on IP address (or `X-Forwarded-For` from trusted proxies).

---

## Error Responses

### Standard Error Format
```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }  // Optional additional context
  }
}
```

### Common Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Operation not allowed (Safe Mode) |
| `NOT_FOUND` | 404 | Resource not found |
| `INVALID_REQUEST` | 400 | Invalid request body/parameters |
| `RATE_LIMITED` | 429 | Too many requests |
| `DB_ERROR` | 500 | Database error |
| `FILE_SYSTEM_ERROR` | 500 | File system error |
| `TOOL_UNAVAILABLE` | 503 | External tool not available |

---

## WebSocket Events

### Real-Time Updates
The extension emits ComfyUI API events for real-time updates:

- `mjr-asset-added`: New asset indexed
- `mjr-asset-updated`: Asset metadata updated
- `mjr-scan-complete`: Scan operation completed
- `mjr-enrichment-status`: Metadata enrichment status
- `mjr-db-restore-status`: Database restore status

**Example** (Frontend):
```javascript
api.addEventListener("mjr-asset-added", (event) => {
  const asset = event.detail;
  // Update UI with new asset
});
```

---

*API Reference Version: 2.0*  
*Last Updated: February 28, 2026*  
*Compatible with Majoor Assets Manager v2.3.3+*
