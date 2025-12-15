import json
import os
import shutil
import subprocess
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from .workflow_normalize import _normalize_workflow_to_prompt_graph, _ensure_dict_from_json
from ..utils import _get_exiftool_path


def _prompt_graph_to_workflow_video(prompt_graph: Dict[str, Any]) -> Dict[str, Any]:
    """
    Minimal prompt-graph -> workflow reconstruction (duplicated here to avoid circular imports).
    """
    nodes = []
    links = []
    max_id = -1
    last_link_id = 0

    def as_int(val, default=None):
        try:
            return int(val)
        except Exception:
            return default

    def extract_link(val):
        if isinstance(val, (list, tuple)) and len(val) >= 2 and isinstance(val[0], (str, int)):
            return val[0], val[1]
        return None, None

    for nid, node in (prompt_graph or {}).items():
        if not isinstance(node, dict):
            continue
        nid_int = as_int(nid, nid)
        if isinstance(nid_int, int):
            max_id = max(max_id, nid_int)

        inputs_dict = node.get("inputs", {}) if isinstance(node.get("inputs"), dict) else {}
        inputs_arr = []
        for idx, (iname, ival) in enumerate(inputs_dict.items()):
            entry = {"name": iname, "type": "ANY"}
            src_id, src_slot = extract_link(ival)
            if src_id is not None:
                last_link_id += 1
                link_id = last_link_id
                try:
                    src_id = int(src_id)
                except Exception:
                    pass
                try:
                    src_slot = int(src_slot)
                except Exception:
                    src_slot = 0
                dest_id = nid_int if isinstance(nid_int, int) else (nid if nid is not None else 0)
                links.append([link_id, src_id, src_slot, dest_id, idx, "ANY"])
                entry["link"] = link_id
            else:
                entry["value"] = ival
            inputs_arr.append(entry)

        node_entry = {
            "id": nid_int,
            "class_type": node.get("class_type"),
            "type": node.get("class_type") or node.get("title") or "Unknown",
            "inputs": inputs_arr,
            "outputs": [],
        }
        if node.get("title"):
            node_entry["title"] = node.get("title")
        if node.get("widgets_values") is not None:
            node_entry["widgets_values"] = node.get("widgets_values")
        nodes.append(node_entry)

    workflow = {
        "last_node_id": max_id if max_id >= 0 else 0,
        "last_link_id": last_link_id,
        "links": links,
        "nodes": nodes,
        "version": 1,
    }
    return workflow


def _balanced_json_from_text(text: str, start_idx: int, max_chars: int = 2_000_000) -> Optional[str]:
    """
    Simple balanced-brace scanner starting at `start_idx` (expected to be '{').
    Stops when depth returns to zero or when exceeding `max_chars`.
    Ignores braces inside quoted strings.
    """
    if start_idx < 0 or start_idx >= len(text) or text[start_idx] != "{":
        return None

    depth = 0
    in_str = False
    escape = False
    limit = min(len(text), start_idx + max_chars)

    for i in range(start_idx, limit):
        ch = text[i]
        if in_str:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_str = False
            continue

        if ch == '"':
            in_str = True
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start_idx : i + 1]
    return None


def _extract_json_from_video(path: Path) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    """
    Extract prompt/workflow JSON from a video container using exiftool.
    Returns (prompt_graph, raw_workflow).
    """
    exe = _get_exiftool_path() if callable(_get_exiftool_path) else None
    found_prompt = None
    found_workflow = None

    try:
        exif_timeout = float(os.environ.get("MJR_META_EXIFTOOL_TIMEOUT", "12"))
    except Exception:
        exif_timeout = 12.0
    exif_timeout = max(1.0, min(exif_timeout, 60.0))

    try:
        ffprobe_timeout = float(os.environ.get("MJR_META_FFPROBE_TIMEOUT", "8"))
    except Exception:
        ffprobe_timeout = 8.0
    ffprobe_timeout = max(1.0, min(ffprobe_timeout, 30.0))

    def parse_vhs_json(json_str: str):
        nonlocal found_prompt, found_workflow
        try:
            payload = json.loads(json_str)
            if not isinstance(payload, dict):
                return
            if "workflow" in payload:
                wf = payload["workflow"]
                if isinstance(wf, str):
                    wf = _ensure_dict_from_json(wf)
                if isinstance(wf, dict) and wf.get("nodes"):
                    found_workflow = wf
            if "prompt" in payload:
                pr = payload["prompt"]
                if isinstance(pr, str):
                    pr = _ensure_dict_from_json(pr)
                if isinstance(pr, dict):
                    first = next(iter(pr.values()), None)
                    if isinstance(first, dict) and "inputs" in first:
                        found_prompt = pr
            if found_workflow is None and isinstance(payload.get("nodes"), list):
                found_workflow = payload
                if found_prompt is None:
                    found_prompt = _normalize_workflow_to_prompt_graph(payload)
            if found_prompt is None:
                if any(isinstance(v, dict) and "inputs" in v for v in payload.values() if isinstance(v, dict)):
                    found_prompt = payload
        except Exception:
            pass

    def recursive_scan(obj):
        nonlocal found_prompt, found_workflow
        if found_prompt and found_workflow:
            return
        if isinstance(obj, dict):
            for k, v in obj.items():
                key_norm = str(k).lower()
                key_interesting = key_norm in (
                    "comment",
                    "usercomment",
                    "description",
                    "parameters",
                    "xpcomment",
                    "userdata",
                    "user_data",
                    "xmp:comment",
                    "xmp:description",
                    "xmp:usercomment",
                    "itemlist:comment",
                    "itemlist:description",
                    "itemlist:usercomment",
                )
                if isinstance(v, str):
                    s = v.strip()
                    if s.startswith("{"):
                        parse_vhs_json(s)
                    elif any(tok in s for tok in ('"prompt"', '"workflow"', '"nodes"', '"extra_pnginfo"', '"class_type"', '"inputs"')):
                        start = s.find("{")
                        if start != -1:
                            candidate = _balanced_json_from_text(s, start)
                            if candidate:
                                parse_vhs_json(candidate)
                    elif key_interesting:
                        # If the value is not obvious JSON but comes from a comment-like field, try to locate balanced JSON anyway
                        start = s.find("{")
                        if start != -1:
                            candidate = _balanced_json_from_text(s, start)
                            if candidate:
                                parse_vhs_json(candidate)
                elif isinstance(v, (dict, list)):
                    recursive_scan(v)
            return
        if isinstance(obj, list):
            for v in obj:
                recursive_scan(v)
            return
        if isinstance(obj, str):
            s = obj.strip()
            if s.startswith("{"):
                parse_vhs_json(s)
            elif any(tok in s for tok in ('"prompt"', '"workflow"', '"nodes"')):
                start = s.find("{")
                if start != -1:
                    candidate = _balanced_json_from_text(s, start)
                    if candidate:
                        parse_vhs_json(candidate)

    if not found_prompt and not found_workflow:
        ffprobe = shutil.which("ffprobe")
        if ffprobe:
            try:
                cmd = [
                    ffprobe,
                    "-v",
                    "error",
                    "-print_format",
                    "json",
                    "-show_entries",
                    "format_tags:stream_tags",
                    str(path),
                ]
                out = subprocess.check_output(cmd, stderr=subprocess.DEVNULL, timeout=ffprobe_timeout)
                data = json.loads(out) if out else {}
                tags = (data.get("format") or {}).get("tags") or {}
                recursive_scan(tags)
                for stream in data.get("streams") or []:
                    recursive_scan(stream.get("tags") or {})
            except subprocess.TimeoutExpired:
                print(f"[Majoor] ffprobe timeout on {path.name} after {ffprobe_timeout}s")
            except Exception as e:
                print(f"[Majoor] ffprobe error on {path.name}: {e}")

    if exe and not (found_prompt and found_workflow):
        try:
            cmd = [
                exe,
                "-j",
                "-Comment",
                "-UserComment",
                "-Description",
                "-XPComment",
                "-Parameters",
                "-XMP:Comment",
                "-XMP:Description",
                "-XMP:UserComment",
                "-ItemList:Comment",
                "-ItemList:Description",
                "-ItemList:UserComment",
                str(path),
            ]
            out = subprocess.check_output(cmd, stderr=subprocess.DEVNULL, timeout=exif_timeout)
            data_list = json.loads(out) if out else []
            if data_list:
                recursive_scan(data_list[0])
        except subprocess.TimeoutExpired:
            print(f"[Majoor] ExifTool (light) timeout on {path.name} after {exif_timeout}s")
        except Exception:
            pass

    if exe and not (found_prompt and found_workflow):
        try:
            cmd = [exe, "-j", "-g", "-ee", str(path)]
            out = subprocess.check_output(cmd, stderr=subprocess.DEVNULL, timeout=exif_timeout)
            data_list = json.loads(out) if out else []
            if data_list:
                recursive_scan(data_list[0])
        except subprocess.TimeoutExpired:
            print(f"[Majoor] ExifTool timeout on {path.name} after {exif_timeout}s")
        except Exception as e:
            print(f"[Majoor] ExifTool error on {path.name}: {e}")

    if not found_prompt and not found_workflow:
        try:
            size = path.stat().st_size
        except Exception:
            size = 0

        try:
            scan_budget = int(os.environ.get("MJR_META_SCAN_BYTES", str(1 * 1024 * 1024)))
        except Exception:
            scan_budget = 1 * 1024 * 1024
        scan_budget = max(512 * 1024, min(scan_budget, 16 * 1024 * 1024))
        blob = b""
        try:
            with open(path, "rb") as f:
                head = f.read(scan_budget)
                blob += head
                if size > scan_budget:
                    try:
                        f.seek(max(0, size - scan_budget))
                        tail = f.read(scan_budget)
                        blob += tail
                    except Exception:
                        pass
        except Exception as e:
            print(f"[Majoor] raw scan failed for {path.name}: {e}")
            blob = b""

        if blob:
            try:
                text_blob = blob.decode("utf-8", errors="ignore")
            except Exception:
                text_blob = ""

            if text_blob:
                keywords = ['"prompt"', '"workflow"', '"nodes"']
                for kw in keywords:
                    pos = text_blob.find(kw)
                    while pos != -1 and not (found_prompt and found_workflow):
                        start = text_blob.rfind("{", 0, pos)
                        if start == -1:
                            pos = text_blob.find(kw, pos + len(kw))
                            continue
                        candidate = _balanced_json_from_text(text_blob, start)
                        if candidate:
                            parse_vhs_json(candidate)
                            if found_prompt and found_workflow:
                                break
                        pos = text_blob.find(kw, pos + len(kw))

    if found_workflow and not found_prompt:
        found_prompt = _normalize_workflow_to_prompt_graph(found_workflow)
    # Fallback: if only a prompt graph was found, reconstruct a minimal workflow
    if found_workflow is None and isinstance(found_prompt, dict):
        found_workflow = _prompt_graph_to_workflow_video(found_prompt)

    return found_prompt, found_workflow


__all__ = ["_extract_json_from_video"]
