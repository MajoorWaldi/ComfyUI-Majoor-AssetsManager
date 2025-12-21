import os
import json
import re
from .config import COLLECTIONS_DIR
from .utils import ensure_dir


def _validate_collection_name(name: str) -> None:
  """
  Validate collection name to prevent path traversal and filesystem issues.
  - Must be 1-100 characters
  - Only alphanumerics, underscores, hyphens, and spaces
  - Cannot be . or ..
  - Cannot contain path separators
  """
  if not name or not isinstance(name, str):
    raise ValueError("Collection name must be a non-empty string")

  if len(name) > 100:
    raise ValueError("Collection name too long (max 100 characters)")

  # Reject path traversal attempts
  if name in (".", "..") or "/" in name or "\\" in name:
    raise ValueError("Invalid collection name: path traversal not allowed")

  # Only allow safe characters: alphanumerics, underscore, hyphen, space
  if not re.match(r"^[a-zA-Z0-9_\- ]+$", name):
    raise ValueError("Collection name contains invalid characters (only alphanumerics, _, -, and spaces allowed)")


def _path(name: str) -> str:
  _validate_collection_name(name)
  return os.path.join(COLLECTIONS_DIR, name + ".json")


def get_collections():
  ensure_dir(COLLECTIONS_DIR)
  out = []
  for f in os.listdir(COLLECTIONS_DIR):
    if f.endswith(".json"):
      out.append(f[:-5])
  return out


def load_collection(name):
  fp = _path(name)
  if not os.path.exists(fp):
    return []
  with open(fp, "r", encoding="utf-8") as f:
    return json.load(f)


def save_collection(name, files):
  ensure_dir(COLLECTIONS_DIR)
  with open(_path(name), "w", encoding="utf-8") as f:
    json.dump(files, f, indent=2)


def add_to_collection(name, path):
  data = load_collection(name)
  if path not in data:
    data.append(path)
  save_collection(name, data)


def remove_from_collection(name, path):
  data = load_collection(name)
  if path in data:
    data.remove(path)
  save_collection(name, data)
