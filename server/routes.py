import os
import subprocess
import asyncio
import time  # ← AJOUT
import threading  # ← AJOUT
from pathlib import Path
from typing import Any, Dict, List

try:
    from send2trash import send2trash  # type: ignore
except Exception:
    send2trash = None

from aiohttp import web

import folder_paths
from server import PromptServer
from .utils import (
    IMAGE_EXTS,
    VIDEO_EXTS,
    AUDIO_EXTS,
    MODEL3D_EXTS,
    classify_ext,
    get_system_metadata,
    load_metadata,
)
from .metadata import update_metadata_with_windows
from .generation_metadata import extract_generation_params_from_png
from .config import OUTPUT_ROOT

# ---------------------------------------------------------------------------
# In-memory cache pour le listing des outputs
# Évite de refaire un os.walk complet à chaque auto-refresh.
# ---------------------------------------------------------------------------

_FILE_CACHE: List[Dict[str, Any]] = []
_LAST_SCAN_TS: float = 0.0
_LAST_FOLDER_MTIME: float = 0.0

try:
    _SCAN_MIN_INTERVAL = float(os.environ.get("MJR_SCAN_MIN_INTERVAL", "5.0"))
except Exception:
    _SCAN_MIN_INTERVAL = 5.0  # fallback 5s si variable mal formée / absente

_CACHE_LOCK = threading.Lock()


def _folder_changed(root_path: Path) -> bool:
    """Vérifie rapidement si le dossier a changé (modification de fichier ou ajout)."""
    try:
        # Sur Linux/Mac, mtime du dossier change quand on ajoute/supprime un fichier.
        # Sur Windows, c'est moins fiable pour les sous-dossiers, mais ça aide.
        current_mtime = root_path.stat().st_mtime
        global _LAST_FOLDER_MTIME
        if current_mtime != _LAST_FOLDER_MTIME:
          _LAST_FOLDER_MTIME = current_mtime
          return True
        return False
    except:
        return True


def _get_output_root() -> Path:
    """Utilise le dossier d'output ComfyUI (respecte --output-directory)."""
    return Path(folder_paths.get_output_directory()).resolve()


def _metadata_target(path: Path, kind: str) -> Path:
    """
    Pour les vidÃ©os/audio/3D, on tente un PNG jumeau pour rÃ©cupÃ©rer les mÃ©tadonnÃ©es.
    """
    if kind != "image":
        sibling = path.with_suffix(".png")
        if sibling.exists():
            try:
                sibling.relative_to(_get_output_root())
                return sibling
            except ValueError:
                pass
    return path


def _open_in_explorer(path: Path) -> bool:
    """Ouvre l'explorateur Windows en sÃ©lectionnant le fichier."""
    try:
        # Tentative 1 : forcer une nouvelle fenÃªtre (et focus) via "start".
        start_cmd = f'start "" explorer.exe /select,"{str(path)}"'
        res_start = subprocess.run(
            start_cmd,
            shell=True,
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if res_start.returncode in (0, 1):
            return True

        # Tentative 2 : forme la plus compatible : chaÃ®ne avec /select,"<path>"
        cmd = f'explorer.exe /select,"{str(path)}"'
        res = subprocess.run(
            cmd,
            shell=True,  # explorer.exe requiert souvent le parsing shell pour /select,
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if res.returncode in (0, 1):
            return True

        # Tentative 3 : mode argument list (certains environnements)
        res2 = subprocess.run(
            ["explorer.exe", "/select,", str(path)],
            shell=False,
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return res2.returncode in (0, 1)
    except Exception:
        return False


def _format_size(num_bytes: int) -> str:
    if not isinstance(num_bytes, (int, float)) or num_bytes < 0:
        return ""
    units = ["B", "KB", "MB", "GB", "TB"]
    value = float(num_bytes)
    i = 0
    while value >= 1024.0 and i < len(units) - 1:
        value /= 1024.0
        i += 1
    if value >= 10:
        return f"{value:.1f} {units[i]}"
    return f"{value:.2f} {units[i]}"


def _format_date(ts: float) -> str:
    from datetime import datetime

    try:
        return datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M")
    except Exception:
        return ""


def _build_view_url(filename: str, subfolder: str, kind: str) -> str:
    """
    Construit lâ€™URL /view standard de ComfyUI.
    type=output fonctionne pour image/vidÃ©o/audio/models.
    """
    from urllib.parse import urlencode

    params = {"filename": filename, "type": "output"}
    if subfolder:
        params["subfolder"] = subfolder
    return f"/view?{urlencode(params)}"


def _scan_outputs() -> List[Dict[str, Any]]:
    """
    Parcourt le dossier d'outputs et renvoie une liste de fichiers
    (listing rapide, sans lecture des metadonnees Exif/Windows).
    """
    root = _get_output_root()
    files: List[Dict[str, Any]] = []

    if not root.exists():
        return files

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if not d.startswith(".")]

        for name in filenames:
            lower = name.lower()
            kind = classify_ext(lower)
            if kind == "other":
                continue

            full = Path(dirpath) / name
            try:
                stat = full.stat()
            except OSError:
                continue

            rel = full.relative_to(root)
            subfolder = str(rel.parent) if rel.parent != Path(".") else ""

            mtime = stat.st_mtime
            ext = (Path(name).suffix[1:] or "").upper()

            item: Dict[str, Any] = {
                "filename": name,
                "name": name,
                "subfolder": subfolder,
                "relpath": str(rel).replace("\\", "/"),
                "mtime": mtime,
                "date": _format_date(mtime),
                "size": stat.st_size,
                "size_readable": _format_size(stat.st_size),
                "kind": kind,
                "ext": ext,
                "url": _build_view_url(name, subfolder, kind),
            }

            files.append(item)

    files.sort(key=lambda f: f["mtime"], reverse=True)
    return files


def _scan_outputs_cached(force: bool = False) -> List[Dict[str, Any]]:
    """
    Wrapper autour de _scan_outputs avec cache mémoire.
    Évite de refaire un scan disque complet à chaque auto-refresh.
    """
    global _FILE_CACHE, _LAST_SCAN_TS

    now = time.time()
    # Fast path : cache encore "frais" et pas de force → on renvoie directement
    if not force and _FILE_CACHE and (now - _LAST_SCAN_TS) < _SCAN_MIN_INTERVAL:
        # On renvoie une copie superficielle pour éviter que l'appelant ne modifie
        # la liste interne par accident.
        return list(_FILE_CACHE)

    # On prend un verrou pour éviter les scans concurrents
    with _CACHE_LOCK:
        now = time.time()
        if not force and _FILE_CACHE and (now - _LAST_SCAN_TS) < _SCAN_MIN_INTERVAL:
            return list(_FILE_CACHE)

        # Fast check dossier : si rien n'a changé et on a déjà un cache, on renvoie direct
        root = _get_output_root()
        if not force and _FILE_CACHE and not _folder_changed(root):
            return list(_FILE_CACHE)

        files = _scan_outputs()
        _FILE_CACHE = files
        _LAST_SCAN_TS = now
        return list(_FILE_CACHE)


async def _scan_outputs_async(force: bool = False) -> List[Dict[str, Any]]:
    """Exécute le scan (éventuellement caché) dans un thread pour ne pas bloquer l'event loop."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _scan_outputs_cached, force)


@PromptServer.instance.routes.get("/mjr/filemanager/files")
async def list_files(request: web.Request) -> web.Response:
    # force=1 / true / yes / force → on ignore le cache et on rescane vraiment
    force_param = (request.query.get("force") or "").lower()
    force = force_param in ("1", "true", "yes", "force")

    files = await _scan_outputs_async(force=force)
    return web.json_response({"files": files})


@PromptServer.instance.routes.post("/mjr/filemanager/metadata/batch")
async def batch_metadata(request: web.Request) -> web.Response:
    """
    Charge rating/tags de faÇßon paresseuse pour une liste de fichiers.
    """
    root = _get_output_root()

    try:
        payload = await request.json()
    except Exception:
        return web.json_response({"ok": False, "error": "Invalid JSON"}, status=400)

    items = payload.get("items") or []

    loop = asyncio.get_running_loop()

    def _fetch_batch():
        results: List[Dict[str, Any]] = []
        errors: List[Dict[str, Any]] = []
        for item in items:
            filename = (item or {}).get("filename")
            subfolder = (item or {}).get("subfolder", "")

            if not filename:
                errors.append({"filename": filename, "error": "Missing filename"})
                continue

            target = (root / subfolder / filename).resolve()
            try:
                target.relative_to(root)
            except ValueError:
                continue

            if not target.exists():
                continue

            kind = classify_ext(filename.lower())
            meta_target = _metadata_target(target, kind)
            sys_meta = get_system_metadata(str(meta_target))
            json_meta = load_metadata(str(meta_target))

            results.append(
                {
                    "filename": filename,
                    "subfolder": subfolder,
                    "rating": sys_meta.get("rating") or json_meta.get("rating", 0),
                    "tags": sys_meta.get("tags") or json_meta.get("tags", []),
                }
            )
        return results, errors

    results, errors = await loop.run_in_executor(None, _fetch_batch)

    return web.json_response({"ok": True, "metadatas": results, "errors": errors})


@PromptServer.instance.routes.post("/mjr/filemanager/delete")
async def delete_files(request: web.Request) -> web.Response:
    """
    Supprime une liste de fichiers dans le dossier output.

    Body JSON:
    {
      "items": [
        {"subfolder": "2025-12-03/flux", "filename": "ComfyUI_00001_.png"},
        ...
      ]
    }
    """
    root = _get_output_root()

    try:
        payload = await request.json()
    except Exception:
        return web.json_response(
            {"ok": False, "error": "Invalid JSON body"}, status=400
        )

    items = payload.get("items") or []
    deleted = []
    errors = []

    for item in items:
        filename = (item or {}).get("filename")
        subfolder = (item or {}).get("subfolder", "")

        if not filename:
            continue

        candidate = (root / subfolder / filename).resolve()

        # sÃ©curitÃ©: pas de delete hors du dossier d'output
        try:
            candidate.relative_to(root)
        except ValueError:
            errors.append(
                {
                    "filename": filename,
                    "subfolder": subfolder,
                    "error": "Outside output directory",
                }
            )
            continue

        if not candidate.exists():
            errors.append(
                {"filename": filename, "subfolder": subfolder, "error": "Not found"}
            )
            continue

        try:
            if send2trash:
                send2trash(str(candidate))
            else:
                candidate.unlink()
            deleted.append({"filename": filename, "subfolder": subfolder})
        except Exception as exc:
            errors.append(
                {"filename": filename, "subfolder": subfolder, "error": str(exc)}
            )

    return web.json_response({"ok": True, "deleted": deleted, "errors": errors})


@PromptServer.instance.routes.post("/mjr/filemanager/open_explorer")
async def open_explorer(request: web.Request) -> web.Response:
    """
    Ouvre l'explorateur Windows et sÃ©lectionne le fichier demandÃ©.
    """
    root = _get_output_root()
    try:
        payload = await request.json()
    except Exception:
        return web.json_response({"ok": False, "error": "Invalid JSON body"}, status=400)

    filename = payload.get("filename")
    subfolder = payload.get("subfolder", "")
    if not filename:
        return web.json_response({"ok": False, "error": "Missing filename"}, status=400)

    target = (root / subfolder / filename).resolve()
    try:
        target.relative_to(root)
    except ValueError:
        return web.json_response({"ok": False, "error": "File is outside output directory"}, status=400)

    if not target.exists():
        return web.json_response({"ok": False, "error": "File not found"}, status=404)

    if _open_in_explorer(target):
        return web.json_response({"ok": True})

    # Fallback: open folder if select fails (some Windows setups)
    try:
        subprocess.run(
            ["explorer.exe", str(target.parent)],
            shell=False,
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return web.json_response(
            {"ok": True, "warning": "Opened folder (selection may not be highlighted)"},
            status=200,
        )
    except Exception as exc:
        return web.json_response(
            {"ok": False, "error": f"Failed to open explorer: {exc}"},
            status=500,
        )


# ---------------------------------------------------------------------------
# METADATA / WORKFLOW EXTRACTION
# ---------------------------------------------------------------------------

@PromptServer.instance.routes.get("/mjr/filemanager/metadata")
async def get_metadata(request: web.Request) -> web.Response:
    """
    Endpoint minimal : paramÃ¨tres de gÃ©nÃ©ration extraits du PNG (ou sibling PNG).
    """
    root = _get_output_root()

    filename = request.query.get("filename")
    subfolder = request.query.get("subfolder", "")

    if not filename:
        return web.json_response(
            {"ok": False, "error": "missing filename"}, status=400
        )

    target = (root / subfolder / filename).resolve()

    try:
        target.relative_to(root)
    except ValueError:
        return web.json_response(
            {"ok": False, "error": "File is outside output directory"}, status=400
        )

    if not target.exists():
        return web.json_response(
            {"ok": False, "error": "File not found"}, status=404
        )

    # Si vidÃ©o, forcer la prÃ©sence du PNG sibling
    if target.suffix.lower() == ".mp4":
        png_sibling = target.with_suffix(".png")
        if not png_sibling.exists():
            return web.json_response(
                {"ok": False, "error": "PNG sibling not found for video"}, status=404
            )

    # Si mp4, lecture sur le PNG sibling pour reflÃ©ter les infos de gÃ©nÃ©ration
    if target.suffix.lower() == ".mp4":
        png_sibling = target.with_suffix(".png")
        meta_target = png_sibling if png_sibling.exists() else target
    else:
        meta_target = target

    try:
        params = extract_generation_params_from_png(meta_target)
    except Exception as e:
        # EmpÃªche un 500 et remonte l'erreur cÃ´tÃ© UI pour debug
        return web.json_response(
            {"ok": False, "error": f"metadata parsing failed: {e}"}, status=500
        )

    return web.json_response({"ok": True, "generation": params})


@PromptServer.instance.routes.post("/mjr/filemanager/metadata/update")
async def update_metadata(request: web.Request) -> web.Response:
    """
    Met Ã  jour les mÃ©tadonnÃ©es Windows (rating + tags) pour un fichier d'output.
    """
    root = _get_output_root()

    try:
        payload = await request.json()
    except Exception:
        return web.json_response(
            {"ok": False, "error": "Invalid JSON body"}, status=400
        )

    filename = payload.get("filename")
    subfolder = payload.get("subfolder", "")
    rating = payload.get("rating")
    tags = payload.get("tags") or []

    if not filename:
        return web.json_response(
            {"ok": False, "error": "Missing filename"}, status=400
        )

    target = (root / subfolder / filename).resolve()
    try:
        target.relative_to(root)
    except ValueError:
        return web.json_response(
            {"ok": False, "error": "File is outside output directory"}, status=400
        )

    if not target.exists():
        return web.json_response(
            {"ok": False, "error": "File not found"}, status=404
        )

    try:
        meta = update_metadata_with_windows(str(target), {"rating": rating, "tags": tags})

        # Si on a un sibling PNG, on propage la note/tag pour rester alignÃ©
        sibling = (target.parent / (target.stem + ".png")).resolve()
        if sibling.exists():
            try:
                sibling.relative_to(root)
                update_metadata_with_windows(str(sibling), {"rating": rating, "tags": tags})
            except Exception:
                pass
    except Exception as exc:
        return web.json_response(
            {
                "ok": False,
                "file": {"filename": filename, "subfolder": subfolder},
                "error": str(exc),
            },
            status=500,
        )

    return web.json_response({"ok": True, "rating": meta.get("rating", 0), "tags": meta.get("tags", [])})


