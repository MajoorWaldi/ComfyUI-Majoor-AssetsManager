"""
Configuration for Majoor Assets Manager.
"""
import logging
import os
import sys
from pathlib import Path

from .utils import env_bool

logger = logging.getLogger(__name__)


def _env_raw(*names: str, default: str | None = None) -> str | None:
    for name in names:
        if not name:
            continue
        try:
            val = os.getenv(name)
        except Exception:
            val = None
        if val is not None and str(val).strip() != "":
            return str(val).strip()
    return default


def _env_int(default: int, *names: str, min_value: int | None = None, max_value: int | None = None) -> int:
    raw = _env_raw(*names)
    if raw is None:
        return default
    try:
        value = int(raw)
    except (TypeError, ValueError):
        logger.warning("Invalid integer for %s=%r, using default=%s", names[0] if names else "<unknown>", raw, default)
        return default
    if min_value is not None and value < min_value:
        logger.warning("Value too small for %s=%s, clamped to %s", names[0] if names else "<unknown>", value, min_value)
        value = min_value
    if max_value is not None and value > max_value:
        logger.warning("Value too large for %s=%s, clamped to %s", names[0] if names else "<unknown>", value, max_value)
        value = max_value
    return value


def _env_float(default: float, *names: str, min_value: float | None = None, max_value: float | None = None) -> float:
    raw = _env_raw(*names)
    if raw is None:
        return default
    try:
        value = float(raw)
    except (TypeError, ValueError):
        logger.warning("Invalid float for %s=%r, using default=%s", names[0] if names else "<unknown>", raw, default)
        return default
    if min_value is not None and value < min_value:
        logger.warning("Value too small for %s=%s, clamped to %s", names[0] if names else "<unknown>", value, min_value)
        value = min_value
    if max_value is not None and value > max_value:
        logger.warning("Value too large for %s=%s, clamped to %s", names[0] if names else "<unknown>", value, max_value)
        value = max_value
    return value


def _env_bool(default: bool, *names: str) -> bool:
    for name in names:
        if not name:
            continue
        try:
            if name in os.environ:
                return env_bool(name, default)
        except Exception:
            continue
    return default

def _resolve_output_root() -> Path:
    resolved = _resolve_output_root_from_env()
    if resolved is not None:
        return resolved
    resolved = _resolve_output_root_from_comfy_cli()
    if resolved is not None:
        return resolved
    resolved = _resolve_output_root_from_folder_paths()
    if resolved is not None:
        return resolved
    return _resolve_output_root_fallback()


def _resolve_output_root_from_env() -> Path | None:
    env_path = _env_raw("MJR_AM_OUTPUT_DIRECTORY", "MAJOOR_OUTPUT_DIRECTORY")
    if not env_path:
        return None
    try:
        return Path(env_path).expanduser().resolve()
    except (OSError, RuntimeError):
        logger.warning("Failed to resolve MAJOOR_OUTPUT_DIRECTORY: %s, using fallback", env_path)
        return None


def _resolve_output_root_from_comfy_cli() -> Path | None:
    try:
        from comfy.cli_args import args as comfy_args  # type: ignore

        cli_out = getattr(comfy_args, "output_directory", None)
        if cli_out:
            return Path(str(cli_out)).expanduser().resolve()
    except Exception:
        return None
    return None


def _resolve_output_root_from_folder_paths() -> Path | None:
    output_dir = _folder_paths_output_dir_from_loaded_module()
    if output_dir is not None:
        return output_dir
    try:
        import folder_paths

        return Path(folder_paths.get_output_directory()).resolve()
    except (ImportError, ModuleNotFoundError):
        logger.warning("folder_paths module not available, using fallback path detection")
    except (AttributeError, TypeError) as exc:
        logger.warning("folder_paths.get_output_directory() failed: %s, using fallback", exc)
    except (OSError, RuntimeError) as exc:
        logger.warning("Failed to resolve output directory from folder_paths: %s, using fallback", exc)
    return None


def _folder_paths_output_dir_from_loaded_module() -> Path | None:
    try:
        fp_mod = sys.modules.get("folder_paths")
        if fp_mod and hasattr(fp_mod, "get_output_directory"):
            return Path(fp_mod.get_output_directory()).resolve()
    except Exception:
        return None
    return None


def _resolve_output_root_fallback() -> Path:
    try:
        argv_output = _resolve_output_root_from_argv()
        if argv_output is not None:
            return argv_output
        comfy_root = _detect_comfy_root(Path(__file__).resolve())
        if comfy_root is not None:
            output_dir = comfy_root / "output"
            if output_dir.is_dir():
                return output_dir.resolve()
        logger.warning("Output directory not found from ComfyUI hints, creating fallback in current working directory")
        fallback_dir = Path.cwd() / "output"
        fallback_dir.mkdir(exist_ok=True)
        return fallback_dir.resolve()
    except (OSError, RuntimeError) as exc:
        logger.error("All fallback strategies failed: %s", exc)
        return Path.cwd() / "output"


def _resolve_output_root_from_argv() -> Path | None:
    try:
        argv = list(sys.argv or [])
        for i, token in enumerate(argv):
            if token == "--output-directory" and i + 1 < len(argv):
                return Path(str(argv[i + 1])).expanduser().resolve()
            if isinstance(token, str) and token.startswith("--output-directory="):
                return Path(token.split("=", 1)[1]).expanduser().resolve()
    except Exception:
        return None
    return None


def _detect_comfy_root(current_file: Path) -> Path | None:
    for parent in current_file.parents:
        if (parent / "main.py").is_file() and (parent / "folder_paths.py").is_file():
            return parent
    # Typical depth: custom_nodes/<node>/mjr_am_backend/config.py -> project root at parents[3].
    if len(current_file.parents) > 3:
        return current_file.parents[3]
    return None

OUTPUT_ROOT_PATH = _resolve_output_root()
OUTPUT_ROOT = str(OUTPUT_ROOT_PATH)


def get_runtime_output_root() -> str:
    """
    Resolve output root at runtime.

    Priority:
    1) live override from MAJOOR_OUTPUT_DIRECTORY
    2) startup-resolved OUTPUT_ROOT fallback
    """
    env_path = str(_env_raw("MJR_AM_OUTPUT_DIRECTORY", "MAJOOR_OUTPUT_DIRECTORY", default="") or "").strip()
    if env_path:
        try:
            return str(Path(env_path).expanduser().resolve())
        except Exception:
            pass
    try:
        return str(Path(OUTPUT_ROOT).expanduser().resolve())
    except Exception:
        return str(OUTPUT_ROOT)

# Platform detection
IS_WINDOWS = sys.platform == "win32"

# SQLite index configuration
INDEX_DIR_PATH = OUTPUT_ROOT_PATH / "_mjr_index"
INDEX_DIR = str(INDEX_DIR_PATH)
INDEX_DB_PATH = INDEX_DIR_PATH / "assets.sqlite"
INDEX_DB = str(INDEX_DB_PATH)

# Collections (user-curated sets of assets)
COLLECTIONS_DIR_PATH = INDEX_DIR_PATH / "collections"
COLLECTIONS_DIR = str(COLLECTIONS_DIR_PATH)

# Create index directory if it doesn't exist
os.makedirs(INDEX_DIR, exist_ok=True)
os.makedirs(COLLECTIONS_DIR, exist_ok=True)

# External tool overrides (portable vs. system-wide)
EXIFTOOL_BIN = _env_raw("MJR_AM_EXIFTOOL_PATH", "MAJOOR_EXIFTOOL_PATH", "MAJOOR_EXIFTOOL_BIN", default="exiftool")
FFPROBE_BIN = _env_raw("MJR_AM_FFPROBE_PATH", "MAJOOR_FFPROBE_PATH", "MAJOOR_FFPROBE_BIN", default="ffprobe")

TOOL_LOCATIONS = {
    "exiftool": EXIFTOOL_BIN,
    "ffprobe": FFPROBE_BIN,
}

def get_tool_paths():
    """Return the resolved external tool executable paths."""
    return TOOL_LOCATIONS.copy()

EXIFTOOL_MIN_VERSION = str(_env_raw("MJR_AM_EXIFTOOL_MIN_VERSION", "MAJOOR_EXIFTOOL_MIN_VERSION", default="") or "").strip()
FFPROBE_MIN_VERSION = str(_env_raw("MJR_AM_FFPROBE_MIN_VERSION", "MAJOOR_FFPROBE_MIN_VERSION", default="") or "").strip()

# Media probe backend setting
# Options: "auto" (recommended), "exiftool", "ffprobe", "both"
MEDIA_PROBE_BACKEND = os.getenv("MAJOOR_MEDIA_PROBE_BACKEND", "auto")
MEDIA_PROBE_BACKEND = str(_env_raw("MJR_AM_MEDIA_PROBE_BACKEND", "MAJOOR_MEDIA_PROBE_BACKEND", default="auto") or "auto")

# Tool timeouts.
# 15s/10s are conservative defaults that keep UI responsive while allowing slow media probes.
EXIFTOOL_TIMEOUT = _env_int(15, "MJR_AM_EXIFTOOL_TIMEOUT", "MAJOOR_EXIFTOOL_TIMEOUT", min_value=1, max_value=120)
FFPROBE_TIMEOUT = _env_int(10, "MJR_AM_FFPROBE_TIMEOUT", "MAJOOR_FFPROBE_TIMEOUT", min_value=1, max_value=120)

# Database tuning.
# 2 MiB default metadata JSON cap limits DB bloat from oversized embedded metadata blobs.
DB_TIMEOUT = _env_float(30.0, "MJR_AM_DB_TIMEOUT", "MAJOOR_DB_TIMEOUT", min_value=1.0, max_value=300.0)
DB_MAX_CONNECTIONS = _env_int(8, "MJR_AM_DB_MAX_CONNECTIONS", "MAJOOR_DB_MAX_CONNECTIONS", min_value=1, max_value=64)
DB_QUERY_TIMEOUT = _env_float(60.0, "MJR_AM_DB_QUERY_TIMEOUT", "MAJOOR_DB_QUERY_TIMEOUT", min_value=1.0, max_value=600.0)
TO_THREAD_TIMEOUT_S = _env_float(30.0, "MJR_AM_TO_THREAD_TIMEOUT", "MAJOOR_TO_THREAD_TIMEOUT", min_value=1.0, max_value=300.0)
MAX_METADATA_JSON_BYTES = _env_int(2 * 1024 * 1024, "MJR_AM_MAX_METADATA_JSON_BYTES", "MAJOOR_MAX_METADATA_JSON_BYTES", min_value=64 * 1024, max_value=32 * 1024 * 1024)
METADATA_CACHE_MAX = _env_int(100_000, "MJR_AM_METADATA_CACHE_MAX", "MAJOOR_METADATA_CACHE_MAX", min_value=1000, max_value=5_000_000)
METADATA_CACHE_TTL_SECONDS = _env_float(90.0 * 24.0 * 3600.0, "MJR_AM_METADATA_CACHE_TTL_SECONDS", "MAJOOR_METADATA_CACHE_TTL_SECONDS", min_value=60.0, max_value=3650.0 * 24.0 * 3600.0)
METADATA_CACHE_CLEANUP_INTERVAL_SECONDS = _env_float(300.0, "MJR_AM_METADATA_CACHE_CLEANUP_INTERVAL_SECONDS", "MAJOOR_METADATA_CACHE_CLEANUP_INTERVAL_SECONDS", min_value=5.0, max_value=3600.0)
METADATA_EXTRACT_CONCURRENCY = _env_int(1, "MJR_AM_METADATA_EXTRACT_CONCURRENCY", "MAJOOR_METADATA_EXTRACT_CONCURRENCY", min_value=1, max_value=16)

# Index dedupe (avoid double-indexing bursts from multiple event sources).
# 2s window catches duplicate watcher + scan events for the same file update burst.
INDEX_DEDUPE_TTL_SECONDS = _env_float(2.0, "MJR_AM_INDEX_DEDUPE_TTL_SECONDS", "MAJOOR_INDEX_DEDUPE_TTL_SECONDS", min_value=0.1, max_value=60.0)
INDEX_DEDUPE_MAX = _env_int(5000, "MJR_AM_INDEX_DEDUPE_MAX", "MAJOOR_INDEX_DEDUPE_MAX", min_value=100, max_value=200_000)

# File watcher (watches for manual file additions in output/custom directories)
# Disable with MJR_ENABLE_WATCHER=0
WATCHER_ENABLED = _env_bool(True, "MJR_AM_ENABLE_WATCHER", "MJR_ENABLE_WATCHER")
# 3000ms absorbs file-write bursts from generators that write temp + final files.
WATCHER_DEFAULT_DEBOUNCE_MS = _env_int(3000, "MJR_AM_WATCHER_DEBOUNCE_MS", "MJR_WATCHER_DEBOUNCE_MS", min_value=0, max_value=120_000)
WATCHER_DEFAULT_DEDUPE_TTL_MS = _env_int(3000, "MJR_AM_WATCHER_DEDUPE_TTL_MS", "MJR_WATCHER_DEDUPE_TTL_MS", min_value=0, max_value=120_000)
WATCHER_DEBOUNCE_MS = WATCHER_DEFAULT_DEBOUNCE_MS
WATCHER_DEDUPE_TTL_MS = WATCHER_DEFAULT_DEDUPE_TTL_MS
# Backward-compatible aliases:
# - MAJOOR_WATCHER_MAX_PENDING_FILES
# - MAJOOR_WATCHER_MIN_FILE_SIZE
# - MAJOOR_WATCHER_MAX_FILE_SIZE
WATCHER_MAX_FILE_SIZE_BYTES = _env_int(
    _env_int(512 * 1024 * 1024, "MJR_AM_WATCHER_MAX_FILE_SIZE_BYTES", "MJR_WATCHER_MAX_FILE_SIZE_BYTES", "MAJOOR_WATCHER_MAX_FILE_SIZE"),
    "MJR_AM_WATCHER_MAX_FILE_SIZE_BYTES",
    "MJR_WATCHER_MAX_FILE_SIZE_BYTES",
    "MAJOOR_WATCHER_MAX_FILE_SIZE",
    min_value=1024,
    max_value=32 * 1024 * 1024 * 1024,
)
WATCHER_MIN_FILE_SIZE_BYTES = _env_int(
    _env_int(100, "MJR_AM_WATCHER_MIN_FILE_SIZE_BYTES", "MJR_WATCHER_MIN_FILE_SIZE_BYTES", "MAJOOR_WATCHER_MIN_FILE_SIZE"),
    "MJR_AM_WATCHER_MIN_FILE_SIZE_BYTES",
    "MJR_WATCHER_MIN_FILE_SIZE_BYTES",
    "MAJOOR_WATCHER_MIN_FILE_SIZE",
    min_value=0,
    max_value=10_000_000,
)
WATCHER_FLUSH_MAX_FILES = _env_int(256, "MJR_AM_WATCHER_FLUSH_MAX_FILES", "MJR_WATCHER_FLUSH_MAX_FILES", min_value=1, max_value=5000)
# Alert if >=512 file events are seen in 60s, then silence alerts for 5 minutes.
WATCHER_STREAM_ALERT_WINDOW_SECONDS = _env_float(60.0, "MJR_AM_WATCHER_STREAM_ALERT_WINDOW_SECONDS", "MJR_WATCHER_STREAM_ALERT_WINDOW_SECONDS", min_value=1.0, max_value=3600.0)
WATCHER_STREAM_ALERT_THRESHOLD = _env_int(512, "MJR_AM_WATCHER_STREAM_ALERT_THRESHOLD", "MJR_WATCHER_STREAM_ALERT_THRESHOLD", min_value=1, max_value=100_000)
WATCHER_STREAM_ALERT_COOLDOWN_SECONDS = _env_float(300.0, "MJR_AM_WATCHER_STREAM_ALERT_COOLDOWN_SECONDS", "MJR_WATCHER_STREAM_ALERT_COOLDOWN_SECONDS", min_value=1.0, max_value=86400.0)
WATCHER_MAX_FLUSH_CONCURRENCY = max(1, _env_int(2, "MJR_AM_WATCHER_MAX_FLUSH_CONCURRENCY", "MJR_WATCHER_MAX_FLUSH_CONCURRENCY", min_value=1, max_value=32))
WATCHER_PENDING_MAX = _env_int(
    _env_int(500, "MJR_AM_WATCHER_PENDING_MAX", "MJR_WATCHER_PENDING_MAX", "MAJOOR_WATCHER_MAX_PENDING_FILES"),
    "MJR_AM_WATCHER_PENDING_MAX",
    "MJR_WATCHER_PENDING_MAX",
    "MAJOOR_WATCHER_MAX_PENDING_FILES",
    min_value=10,
    max_value=50000,
)

# Background scan / filesystem listing tuning.
# 30s grace/min-interval prevents immediate rescans after manual actions or list calls.
BG_SCAN_FAILURE_HISTORY_MAX = _env_int(50, "MJR_AM_BG_SCAN_FAILURE_HISTORY_MAX", "MAJOOR_BG_SCAN_FAILURE_HISTORY_MAX", min_value=10, max_value=10000)
SCAN_PENDING_MAX = _env_int(64, "MJR_AM_SCAN_PENDING_MAX", "MAJOOR_SCAN_PENDING_MAX", min_value=1, max_value=10000)
MANUAL_BG_SCAN_GRACE_SECONDS = _env_float(30.0, "MJR_AM_MANUAL_BG_SCAN_GRACE_SECONDS", "MAJOOR_MANUAL_BG_SCAN_GRACE_SECONDS", min_value=0.0, max_value=3600.0)
BG_SCAN_ON_LIST = _env_bool(False, "MJR_AM_BG_SCAN_ON_LIST", "MAJOOR_BG_SCAN_ON_LIST")
BG_SCAN_MIN_INTERVAL_SECONDS = _env_float(30.0, "MJR_AM_BG_SCAN_MIN_INTERVAL_SECONDS", "MAJOOR_BG_SCAN_MIN_INTERVAL_SECONDS", min_value=0.0, max_value=3600.0)
SEARCH_MAX_LIMIT = _env_int(500, "MJR_AM_SEARCH_MAX_LIMIT", "MAJOOR_SEARCH_MAX_LIMIT", min_value=1, max_value=100000)
SEARCH_MAX_OFFSET = _env_int(10_000, "MJR_AM_SEARCH_MAX_OFFSET", "MAJOOR_SEARCH_MAX_OFFSET", min_value=0, max_value=10_000_000)

# Filesystem listing cache (used by filesystem fallback search/list).
# 1.5s TTL smooths repeated UI queries without serving stale lists for long.
FS_LIST_CACHE_MAX = _env_int(32, "MJR_AM_FS_LIST_CACHE_MAX", "MAJOOR_FS_LIST_CACHE_MAX", min_value=1, max_value=10000)
FS_LIST_CACHE_TTL_SECONDS = _env_float(1.5, "MJR_AM_FS_LIST_CACHE_TTL_SECONDS", "MAJOOR_FS_LIST_CACHE_TTL_SECONDS", min_value=0.1, max_value=3600.0)
# Scanner batching (bounded transactions)
# Tweak only if you know your workload; larger batches reduce transaction overhead but increase lock time.
SCAN_BATCH_SMALL_THRESHOLD = _env_int(100, "MJR_AM_SCAN_BATCH_SMALL_THRESHOLD", "MAJOOR_SCAN_BATCH_SMALL_THRESHOLD", min_value=1, max_value=1_000_000)
SCAN_BATCH_MED_THRESHOLD = _env_int(1000, "MJR_AM_SCAN_BATCH_MED_THRESHOLD", "MAJOOR_SCAN_BATCH_MED_THRESHOLD", min_value=1, max_value=1_000_000)
SCAN_BATCH_LARGE_THRESHOLD = _env_int(10000, "MJR_AM_SCAN_BATCH_LARGE_THRESHOLD", "MAJOOR_SCAN_BATCH_LARGE_THRESHOLD", min_value=1, max_value=1_000_000)
# Default to fewer DB transactions for typical directories (~100-500 files).
SCAN_BATCH_SMALL = _env_int(100, "MJR_AM_SCAN_BATCH_SMALL", "MAJOOR_SCAN_BATCH_SMALL", min_value=1, max_value=10000)
SCAN_BATCH_MED = _env_int(150, "MJR_AM_SCAN_BATCH_MED", "MAJOOR_SCAN_BATCH_MED", min_value=1, max_value=10000)
SCAN_BATCH_LARGE = _env_int(250, "MJR_AM_SCAN_BATCH_LARGE", "MAJOOR_SCAN_BATCH_LARGE", min_value=1, max_value=10000)
# Initial 1000 is optimistic for startup scans; runtime can downshift with lock pressure.
SCAN_BATCH_INITIAL = _env_int(1000, "MJR_AM_SCAN_BATCH_INITIAL", "MAJOOR_SCAN_BATCH_INITIAL", min_value=1, max_value=100000)
SCAN_BATCH_MIN = _env_int(100, "MJR_AM_SCAN_BATCH_MIN", "MAJOOR_SCAN_BATCH_MIN", min_value=1, max_value=10000)

# Search limits
SEARCH_MAX_QUERY_LENGTH = _env_int(512, "MJR_AM_SEARCH_MAX_QUERY_LENGTH", "MJR_SEARCH_MAX_QUERY_LENGTH", min_value=16, max_value=8192)
SEARCH_MAX_TOKENS = _env_int(
    16,
    "MJR_AM_SEARCH_MAX_TOKENS",
    "MJR_SEARCH_MAX_TOKENS",
    "MAJOOR_SEARCH_MAX_TOKENS",
    min_value=1,
    max_value=128,
)
SEARCH_MAX_TOKEN_LENGTH = _env_int(
    64,
    "MJR_AM_SEARCH_MAX_TOKEN_LENGTH",
    "MJR_SEARCH_MAX_TOKEN_LENGTH",
    "MAJOOR_SEARCH_MAX_TOKEN_LENGTH",
    min_value=1,
    max_value=512,
)
SEARCH_MAX_BATCH_IDS = _env_int(200, "MJR_AM_SEARCH_MAX_BATCH_IDS", "MJR_SEARCH_MAX_BATCH_IDS", min_value=1, max_value=5000)
SEARCH_MAX_FILEPATH_LOOKUP = _env_int(5000, "MJR_AM_SEARCH_MAX_FILEPATH_LOOKUP", "MJR_SEARCH_MAX_FILEPATH_LOOKUP", min_value=1, max_value=100000)
SCAN_BATCH_XL = _env_int(400, "MJR_AM_SCAN_BATCH_XL", "MAJOOR_SCAN_BATCH_XL", min_value=1, max_value=20000)

# Scanner limits
# Hard cap protects UI payload size when many entries are eligible for enrichment.
MAX_TO_ENRICH_ITEMS = _env_int(10000, "MJR_AM_MAX_TO_ENRICH_ITEMS", "MAJOOR_MAX_TO_ENRICH_ITEMS", min_value=1, max_value=1_000_000)
