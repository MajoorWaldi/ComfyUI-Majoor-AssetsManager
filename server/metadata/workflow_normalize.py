import json
from typing import Any, Dict, Optional


def _ensure_dict_from_json(value: Any) -> Optional[Dict[str, Any]]:
    """
    Accept a dict or a JSON string; return a dict or None.
    """
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            data = json.loads(value)
            if isinstance(data, dict):
                return data
        except Exception:
            return None
    return None


def _normalize_workflow_to_prompt_graph(workflow: Any) -> Optional[Dict[str, Any]]:
    """
    Convert a workflow (dict with 'nodes': [...]) into an id->node map for parsing.
    """
    if workflow is None:
        return None
    if isinstance(workflow, dict) and isinstance(workflow.get("nodes"), list):
        nodes_map: Dict[str, Any] = {}
        for n in workflow.get("nodes", []):
            if not isinstance(n, dict):
                continue
            nid = n.get("id")
            if nid is None:
                continue
            ctype = n.get("class_type") or n.get("type") or n.get("title")
            nodes_map[str(nid)] = {
                "class_type": ctype,
                "inputs": n.get("inputs", {}) or {},
                "_meta": n.get("_meta", {}),
                "title": n.get("title"),
                "widgets_values": n.get("widgets_values"),
            }
        return nodes_map if nodes_map else None

    if isinstance(workflow, dict):
        return {str(k): v for k, v in workflow.items() if isinstance(v, dict)}

    return None


__all__ = ["_ensure_dict_from_json", "_normalize_workflow_to_prompt_graph"]
