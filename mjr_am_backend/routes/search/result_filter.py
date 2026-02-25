"""Search/runtime filtering helpers extracted from handlers/search.py."""
import os
from pathlib import Path

from mjr_am_backend.config import OUTPUT_ROOT


def search_db_from_services(svc: dict | None):
    return (svc or {}).get("db") if isinstance(svc, dict) else None


def touch_enrichment_pause(services: dict | None, seconds: float = 1.5) -> None:
    try:
        idx = (services or {}).get("index") if isinstance(services, dict) else None
        if idx and hasattr(idx, "pause_enrichment_for_interaction"):
            idx.pause_enrichment_for_interaction(seconds=seconds)
    except Exception:
        pass


def is_under_root(root: str, fp: str) -> bool:
    try:
        root_p = Path(str(root)).resolve()
        fp_p = Path(str(fp)).resolve()
        common = os.path.commonpath([str(fp_p), str(root_p)])
        return Path(common).resolve() == root_p
    except Exception:
        return False


def exclude_under_root(assets: list[dict], root: str) -> list[dict]:
    out: list[dict] = []
    for a in assets or []:
        if not isinstance(a, dict):
            continue
        fp = str((a or {}).get("filepath") or "")
        if fp and is_under_root(root, fp):
            continue
        out.append(a)
    return out


async def runtime_output_root(svc: dict | None) -> str:
    try:
        settings_service = (svc or {}).get("settings") if isinstance(svc, dict) else None
        if settings_service:
            override = await settings_service.get_output_directory()
            if override:
                return str(Path(override).resolve(strict=False))
    except Exception:
        pass
    return str(Path(OUTPUT_ROOT).resolve(strict=False))
