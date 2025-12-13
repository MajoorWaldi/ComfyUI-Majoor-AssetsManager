import os
from typing import Any, Dict, List

import folder_paths

from server import PromptServer
from .utils import (
    classify_ext,
    set_windows_metadata,
    set_exif_metadata,
    _get_exiftool_path,
)


def _iter_generated_files(output_data: Dict[str, Any]) -> List[str]:
    """
    Extract absolute paths for generated files from the ComfyUI execution payload.
    """
    files: List[str] = []
    ui = output_data.get("ui") if isinstance(output_data, dict) else None
    if not isinstance(ui, dict):
        return files

    for category, items in ui.items():
        if not isinstance(items, list):
            continue
        for item in items:
            if not isinstance(item, dict):
                continue
            filename = item.get("filename")
            subfolder = item.get("subfolder", "")
            type_ = item.get("type", "output")
            if not filename:
                continue
            try:
                dir_path = folder_paths.get_directory_by_type(type_)  # type: ignore
            except Exception:
                continue
            if subfolder:
                dir_path = os.path.join(dir_path, subfolder)
            files.append(os.path.join(dir_path, filename))
    return files


def _apply_default_metadata(file_path: str):
    """
    Apply default rating/tags to a generated file (video/image).
    """
    filename_lower = os.path.basename(file_path).lower()
    kind = classify_ext(filename_lower)
    if kind not in ("video", "image"):
        return

    if not os.path.exists(file_path):
        return

    try:
        try:
            set_windows_metadata(file_path, 0, ["ComfyUI"])
        except Exception:
            # Silently ignore to avoid breaking execution
            pass

        if _get_exiftool_path():
            try:
                set_exif_metadata(file_path, 0, ["ComfyUI"])
            except Exception:
                # Ignore exiftool write errors
                pass
    except Exception:
        # Final guard to keep ComfyUI running even if unexpected errors occur
        pass


def on_executed(prompt_id, node_id, output_data):
    """
    Hook invoked by PromptServer after a node execution; primes metadata on generated files.
    """
    if not output_data:
        return
    try:
        files = _iter_generated_files(output_data)
        pushed: List[Dict[str, Any]] = []
        for fp in files:
            _apply_default_metadata(fp)
            try:
                stat = os.stat(fp)
                pushed.append(
                    {
                        "filename": os.path.basename(fp),
                        "subfolder": os.path.dirname(fp).replace(folder_paths.get_output_directory(), "").lstrip("\\/"),
                        "mtime": stat.st_mtime,
                    }
                )
            except Exception:
                continue

        if pushed:
            try:
                PromptServer.instance.send_sync("mjr_new_files", {"files": pushed})
            except Exception:
                pass
    except Exception as e:
        print(f"[Majoor Hook Error] {e}")


# Register hook once
try:
    PromptServer.instance.add_on_executed(on_executed)
except Exception as e:
    print(f"[Majoor] Failed to register on_executed hook: {e}")
