# Installation and Setup

## Recommended Installation

The preferred installation path is through ComfyUI Manager.

1. Open ComfyUI Manager.
2. Search for Majoor Assets Manager.
3. Install the extension.
4. Restart ComfyUI completely.

## Manual Installation

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager ComfyUI-Majoor-AssetsManager
cd ComfyUI-Majoor-AssetsManager
pip install -r requirements.txt
```

Optional AI and vector features:

```bash
pip install -r requirements.txt -r requirements-vector.txt
```

## Optional Native Tools

For the best metadata and probing experience, install:

- ExifTool
- FFmpeg / ffprobe

Why these matter:

- ExifTool improves metadata extraction and metadata writeback workflows such as ratings and tags synchronization
- ffprobe improves video and audio probing and makes media metadata more complete and reliable

Typical Windows options:
- Scoop
- Chocolatey
- WinGet

Typical macOS option:
- Homebrew

Typical Linux options:
- apt
- dnf
- pacman

Detailed commands are maintained in the repository installation guide:

- [INSTALLATION.md](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/INSTALLATION.md)

## First Launch Checklist

After installation:

1. Restart ComfyUI.
2. Open the Assets Manager sidebar tab.
3. Verify that your outputs and inputs are visible.
4. Open settings and confirm your roots, indexing preferences, and optional features.

Recommended first checks:

- confirm the correct output directory is indexed
- check whether auto-scan on startup matches your workflow
- verify the media probe backend stays on Auto unless you are troubleshooting
- if you use AI features, install optional packages before expecting semantic features to work
- **NAS/SMB users**: set a local Index Directory (Settings → Paths → Majoor: Index Directory) so the SQLite database is not on a network share; SQLite requires reliable file locking that many NAS implementations do not provide

## Common Installation Profiles

### Basic User

Install the extension and Python dependencies only. This gives you browsing, search, viewer workflows, collections, and non-AI features.

### Power User

Add ExifTool and ffprobe. This is the best default if you care about complete metadata extraction and smooth media probing.

### NAS / Network Drive User

Install the extension, add ExifTool and ffprobe, and relocate the index database to a fast local disk so SQLite does not fight with the NAS file-locking layer.

1. Install normally.
2. After first launch, open Settings → Paths → **Majoor: Index Directory**.
3. Set a local path such as `C:\mjr_index` (Windows) or `/var/local/mjr_index` (Linux/macOS).
4. Save, then restart ComfyUI.

Alternatively set `MJR_AM_INDEX_DIRECTORY` in your ComfyUI startup script before starting ComfyUI.

### AI User

Install optional vector and AI dependencies, then allow the first model download. After the required models are cached locally, AI features can work offline.

## Troubleshooting Basics

If the extension starts but does not fully populate assets:

- Verify Python dependencies are installed
- Verify ffprobe and exiftool are available if you rely on media probing and metadata extraction
- Rebuild or refresh the index from the UI if needed

If the UI opens but behaves inconsistently:

- check browser-side settings in the Majoor settings UI
- verify ComfyUI was fully restarted after install or update
- use the database maintenance actions if the index is stale or corrupted

See the canonical docs for details:

- [Installation Guide](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/INSTALLATION.md)
- [Settings Configuration](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/SETTINGS_CONFIGURATION.md)
- [Database Maintenance](https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager/blob/main/docs/DB_MAINTENANCE.md)
