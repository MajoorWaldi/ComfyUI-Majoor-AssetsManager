import os
import platform
from folder_paths import get_output_directory

OUTPUT_ROOT = get_output_directory()
THUMB_SIZE = (320, 320)
THUMB_CACHE_DIR = os.path.join(OUTPUT_ROOT, "_mjr_thumbs")

# Sidecar JSON files are optional; default to Windows metadata on Windows
_DEFAULT_SIDECAR = platform.system().lower() != "windows"
_SIDECAR_ENV = os.environ.get("MJR_ENABLE_SIDECAR")
if _SIDECAR_ENV is None:
    ENABLE_JSON_SIDECAR = _DEFAULT_SIDECAR
else:
    ENABLE_JSON_SIDECAR = str(_SIDECAR_ENV).strip().lower() not in (
        "0",
        "false",
        "no",
        "off",
    )

METADATA_EXT = ".mjr.json"
COLLECTIONS_DIR = os.path.join(OUTPUT_ROOT, "_mjr_collections")
os.makedirs(COLLECTIONS_DIR, exist_ok=True)
os.makedirs(THUMB_CACHE_DIR, exist_ok=True)
