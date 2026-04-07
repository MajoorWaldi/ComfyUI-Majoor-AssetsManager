# Majoor Assets Manager - Installation Guide

**Version**: 2.4.5  
**Last Updated**: April 7, 2026

## Overview
This guide provides detailed instructions for installing and configuring the Majoor Assets Manager for ComfyUI. Follow these steps to get the extension up and running with all its features.

**Recent highlights**: Improved metadata parsing, expanded floating viewer compare modes, better workflow grouping with job and stack IDs, and support for a configurable Index DB directory (useful on network drives or NAS storage).

## Prerequisites

### System Requirements
- ComfyUI installation (≥ 0.13.0 recommended)
- Python 3.10, 3.11, or 3.12 (3.13 compatible)
- At least 500MB free disk space for the extension and dependencies
- Administrator privileges (for installation and optional tool installations)

### Supported Platforms
- **Windows**: 10/11
- **macOS**: 10.15 or higher
- **Linux**: Ubuntu 22.04+, Debian 12+, Fedora, or equivalent

## Quick Installation (Recommended)

### Using ComfyUI Manager
1. Open ComfyUI Manager in your browser
2. Find "Majoor Assets Manager" in the extensions list
3. Click "Install" next to the extension
4. Wait for the installation to complete
5. Restart ComfyUI completely
6. The extension should now be available in the Assets Manager tab

## Manual Installation

### Step 1: Clone the Repository
Open your terminal/command prompt and navigate to your ComfyUI custom_nodes directory:

```bash
cd /path/to/your/ComfyUI/custom_nodes
```

Clone the repository:

```bash
git clone https://github.com/MajoorWaldi/ComfyUI-Majoor-AssetsManager ComfyUI-Majoor-AssetsManager
```

### Step 2: Install Python Dependencies
Navigate to the extension directory and install the required packages:

```bash
cd ComfyUI-Majoor-AssetsManager
pip install -r requirements.txt
```

If you want the optional AI/vector features as well, install the extra vector stack too:

```bash
pip install -r requirements.txt -r requirements-vector.txt
```

> **Faster installs with `uv`**: If you have [uv](https://github.com/astral-sh/uv) installed, you can use it as a drop-in replacement for significantly faster dependency resolution:
> ```bash
> uv pip install -r requirements.txt
> ```
> Install `uv` with `pip install uv` or see the [uv documentation](https://docs.astral.sh/uv/) for other methods.

> For AI/vector features with `uv`:
> ```bash
> uv pip install -r requirements.txt -r requirements-vector.txt
> ```

### Step 3: Restart ComfyUI
Stop your ComfyUI server completely and restart it to load the new extension.

## Optional Dependencies (Highly Recommended)

For full functionality including metadata extraction and file tagging, install these external tools:

### Windows Installation

#### Option A: Using Scoop Package Manager
1. Install Scoop if you don't have it:
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   irm get.scoop.sh | iex
   ```

2. Install the required tools:
   ```powershell
   scoop install ffmpeg exiftool
   ```

#### Option B: Using Chocolatey Package Manager
1. Install Chocolatey if you don't have it:
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force
   [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
   iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

2. Install the required tools:
   ```powershell
   choco install -y ffmpeg exiftool
   ```

#### Option C: Using WinGet
```powershell
winget install -e --id Gyan.FFmpeg
winget install -e --id OliverBetz.ExifTool
```

#### Option D: Manual Installation
1. **FFmpeg**: Download from https://www.gyan.dev/ffmpeg/builds/
   - Extract to a folder (e.g., `C:\ffmpeg`)
   - Add `C:\ffmpeg\bin` to your system PATH

2. **ExifTool**: Download from https://exiftool.org/
   - Download `exiftool-#.##.zip`
   - Extract to a folder (e.g., `C:\exiftool`)
   - Add `C:\exiftool` to your system PATH

### macOS Installation

#### Using Homebrew (Recommended)
1. Install Homebrew if you don't have it:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. Install the required tools:
   ```bash
   brew install ffmpeg exiftool
   ```

### Linux Installation

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install -y ffmpeg libimage-exiftool-perl
```

#### Fedora/RHEL
```bash
sudo dnf install -y ffmpeg perl-Image-ExifTool
```

#### Arch Linux
```bash
sudo pacman -S ffmpeg exiftool
```

## Verification Steps

After installation, verify everything is working:

### Step 1: Check Extension Loading
1. Start ComfyUI
2. Look for the Assets Manager tab in the interface
3. Check the console/logs for any error messages during startup

### Step 2: Verify External Tools (if installed)
Open a terminal/command prompt and run:

```bash
exiftool -ver
ffprobe -version
```

Both commands should return version information without errors.

### Step 3: Test Basic Functionality
1. Open the Assets Manager in ComfyUI
2. Switch between different scopes (Outputs, Inputs, Custom, Collections)
3. Perform a simple search to verify indexing is working
4. Try opening the viewer for an asset

## Configuration

### Environment Variables
You can configure the extension using environment variables. Add these to your shell profile or set them before starting ComfyUI:

```bash
# Override default output directory
export MAJOOR_OUTPUT_DIRECTORY="/path/to/your/output"

# Override index database directory (useful on NAS/SMB/network drives)
# By default the index lives at <output>/_mjr_index/
# Move it to a local disk if your output is on a slow or SMB-mounted drive:
export MJR_AM_INDEX_DIRECTORY="/var/local/mjr_index"

# Specify tool paths if not in system PATH
export MAJOOR_EXIFTOOL_PATH="/path/to/exiftool"
export MAJOOR_FFPROBE_PATH="/path/to/ffprobe"

# Set media probe backend (auto, exiftool, ffprobe, both)
export MAJOOR_MEDIA_PROBE_BACKEND="auto"

```

### Windows Batch File Example
Create a batch file to set environment variables and start ComfyUI:

```batch
@echo off
set MAJOOR_MEDIA_PROBE_BACKEND=auto
REM Optional: move the index DB to a local SSD if output is on a network drive
set MJR_AM_INDEX_DIRECTORY=C:\mjr_index

REM Start ComfyUI with the environment variables
cd /d "C:\path\to\ComfyUI"
python main.py --auto-launch
pause
```

### Remote Access Write Permissions
If you open ComfyUI from another machine, Majoor blocks write operations by default unless you explicitly allow them.

Recommended setup: define `MAJOOR_API_TOKEN` on the machine that runs ComfyUI, then send the same token from the remote client.

If no persistent token has been configured yet, Majoor can also bootstrap the first remote session token automatically for a signed-in ComfyUI user over HTTPS. Local loopback browser sessions can also recover a write session automatically after restart/new tab without a separate ComfyUI sign-in step.

Older installs that only kept a legacy token hash are recovered automatically on the first successful bootstrap: Majoor rotates to a fresh persistent token and re-authorizes the current browser session.

Recent builds also expose the main remote security toggles directly in Majoor Settings, so a signed-in ComfyUI user can usually complete the initial setup without editing shell startup scripts manually:

- `Require Token For All Writes`
- `Recommended Remote LAN Setup` to auto-generate a token and apply the safest common LAN defaults in one click
- `Allow HTTP Token Transport` for trusted LAN-only HTTP setups
- `Allow Remote Full Access` if you explicitly want no-token remote writes
- `API Token` for the fixed shared token value

#### Fastest Settings-only path for a trusted LAN
1. Open Majoor Settings in ComfyUI.
2. Turn on `Recommended Remote LAN Setup`.
3. Confirm that the current browser session is authorized.
4. Keep `Allow Remote Full Access` off unless you explicitly want no-token remote writes.

That preset automatically:

- generates a strong API token if none exists yet
- enables `Require Token For All Writes`
- keeps `Allow Remote Full Access` disabled
- enables `Allow HTTP Token Transport` automatically when the current session is plain HTTP on a non-loopback LAN address
- injects the token into the current browser session immediately so write actions work without a manual copy/paste step

Visual confirmation inside Assets Manager:

- the runtime status widget now shows a `Write auth:` line such as `Write auth: active ...ABCD`
- if the browser session is missing authorization while the server still requires a token, the same widget reports that state directly

If you need to authorize a different browser or device, either:

- enter a fixed shared value in `Security -> Majoor: API Token`, or
- open that browser while signed in to ComfyUI and let Majoor bootstrap a session token there

#### Windows batch example
```batch
@echo off
set MAJOOR_API_TOKEN=change-this-to-a-long-random-secret

cd /d "C:\path\to\ComfyUI"
python main.py --listen 0.0.0.0 --port 8188
pause
```

#### Windows PowerShell example
```powershell
$env:MAJOOR_API_TOKEN = "change-this-to-a-long-random-secret"
Set-Location "C:\path\to\ComfyUI"
python main.py --listen 0.0.0.0 --port 8188
```

#### Linux/macOS shell example
```bash
export MAJOOR_API_TOKEN="change-this-to-a-long-random-secret"
cd /path/to/ComfyUI
python main.py --listen 0.0.0.0 --port 8188
```

#### Unsafe fallback
If you really want to allow remote writes without a token, set `MAJOOR_ALLOW_REMOTE_WRITE=1` before starting ComfyUI. This is less safe and should only be used on trusted networks.

```bash
export MAJOOR_ALLOW_REMOTE_WRITE=1
python main.py --listen 0.0.0.0 --port 8188
```

#### Remote client side
- In the ComfyUI UI, open the Majoor settings and set the same token under `Security -> Majoor: API Token`.
- For direct API calls, send either `X-MJR-Token: <token>` or `Authorization: Bearer <token>`.
- Restart ComfyUI after changing environment variables so the new values are picked up.
- On first remote use, if ComfyUI authentication is enabled and no persistent token exists yet, Majoor can provision the initial session token automatically.

## Troubleshooting

### Extension Not Appearing
- Verify the folder is named correctly: `ComfyUI-Majoor-AssetsManager`
- Check that all files were downloaded properly
- Ensure ComfyUI was restarted after installation
- Look for error messages in the ComfyUI console

### Missing Dependencies Error
If you see messages about missing dependencies:
```bash
# Navigate to the extension directory
cd ComfyUI-Majoor-AssetsManager
pip install -r requirements.txt
```

If the error is related to AI/vector search features, install the optional vector stack too:

```bash
pip install -r requirements.txt -r requirements-vector.txt
```

### External Tools Not Found
If metadata extraction isn't working:
1. Verify tools are installed: `exiftool -ver` and `ffprobe -version`
2. Check if tools are in your system PATH
3. Set environment variables to point to the executables directly

### Permission Errors
- Ensure ComfyUI has read/write access to the output directory
- On Windows, run as administrator if needed
- On Unix systems, check file permissions with `ls -la`

### Slow Performance
- The first scan may take time for large directories
- Subsequent scans will be faster due to incremental indexing
- Consider excluding very large directories that don't contain relevant assets

## Post-Installation Setup

### First-Time Usage
1. Open ComfyUI and navigate to the Assets Manager tab
2. The extension will automatically begin indexing your output directory
3. Wait for the initial scan to complete (progress shown in status bar)
4. Use the search bar to find assets
5. Right-click on assets to access context menus

### Adding Custom Directories
1. Right-click in the Assets Manager interface
2. Select "Add Custom Root" 
3. Enter the path to your custom directory
4. The directory will be added to the Custom scope

### Creating Your First Collection
1. Select one or more assets
2. Right-click and choose "Add to Collection"
3. Create a new collection or add to an existing one
4. Access your collections from the Collections tab

## Updates

### Using ComfyUI Manager
Updates will be available through the ComfyUI Manager interface when released.

### Manual Updates
```bash
cd ComfyUI/custom_nodes/ComfyUI-Majoor-AssetsManager
git pull origin main
pip install -r requirements.txt --upgrade
```

If you use AI/vector features, also upgrade the optional vector requirements:

```bash
pip install -r requirements.txt -r requirements-vector.txt --upgrade
```

Remember to restart ComfyUI after updating.

## Uninstallation

### Using ComfyUI Manager
Simply click "Uninstall" in the ComfyUI Manager interface.

### Manual Removal
1. Delete the `ComfyUI-Majoor-AssetsManager` folder from `custom_nodes`
2. Restart ComfyUI
3. The extension will be completely removed

---
*Installation Guide Version: 1.1*  
*Last Updated: April 5, 2026*
