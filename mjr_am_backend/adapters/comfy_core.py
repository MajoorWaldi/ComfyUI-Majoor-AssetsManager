"""Best-effort adapter for ComfyUI core integration points.

This module is the single backend boundary for optional ComfyUI runtime APIs.
It must stay import-safe in tests and in partial bootstrap states where the
``server`` module or frontend feature flags are not loaded yet.
"""

from __future__ import annotations

import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from ..shared import get_logger

logger = get_logger(__name__)


@dataclass(frozen=True)
class ComfyCoreCapabilities:
    """Snapshot of ComfyUI runtime capabilities visible to Majoor."""

    prompt_server: bool
    app: bool
    routes: bool
    user_manager: bool
    websocket: bool
    queue_info: bool
    feature_flags: dict[str, Any]
    assets: bool
    jobs: bool

    def as_dict(self) -> dict[str, Any]:
        return {
            "prompt_server": self.prompt_server,
            "app": self.app,
            "routes": self.routes,
            "user_manager": self.user_manager,
            "websocket": self.websocket,
            "queue_info": self.queue_info,
            "feature_flags": dict(self.feature_flags),
            "assets": self.assets,
            "jobs": self.jobs,
        }


@dataclass(frozen=True)
class PromptOutputFile:
    path: str
    node_id: str
    node_type: str
    item_type: str


class ComfyCoreAdapter:
    """Thin, defensive facade over ComfyUI core modules."""

    def get_prompt_server_class(self) -> Any | None:
        try:
            server_mod = sys.modules.get("server")
            prompt_server = getattr(server_mod, "PromptServer", None)
            return prompt_server if prompt_server is not None else None
        except Exception:
            return None

    def get_prompt_server_instance(self) -> Any | None:
        try:
            prompt_server = self.get_prompt_server_class()
            return getattr(prompt_server, "instance", None) if prompt_server is not None else None
        except Exception:
            return None

    def get_app(self) -> Any | None:
        try:
            return getattr(self.get_prompt_server_instance(), "app", None)
        except Exception:
            return None

    def get_routes(self) -> Any | None:
        try:
            return getattr(self.get_prompt_server_instance(), "routes", None)
        except Exception:
            return None

    def get_user_manager(self) -> Any | None:
        try:
            return getattr(self.get_prompt_server_instance(), "user_manager", None)
        except Exception:
            return None

    def get_queue_info(self) -> dict[str, Any] | None:
        try:
            instance = self.get_prompt_server_instance()
            getter = getattr(instance, "get_queue_info", None)
            if callable(getter):
                value = getter()
                return value if isinstance(value, dict) else None
        except Exception:
            logger.debug("Failed to read ComfyUI queue info", exc_info=True)
        return None

    def get_prompt_history(self, prompt_id: str) -> dict[str, Any]:
        """Return ComfyUI prompt history for one prompt id, or an empty dict."""
        safe_prompt_id = str(prompt_id or "").strip()
        if not safe_prompt_id:
            return {}
        try:
            prompt_queue = getattr(self.get_prompt_server_instance(), "prompt_queue", None)
            getter = getattr(prompt_queue, "get_history", None)
            if not callable(getter):
                return {}
            value = getter(prompt_id=safe_prompt_id)
            return value if isinstance(value, dict) else {}
        except Exception:
            logger.debug("Failed to read ComfyUI history for prompt_id=%s", safe_prompt_id, exc_info=True)
            return {}

    def get_directory_by_type(self, item_type: str) -> str | None:
        """Resolve a ComfyUI file bucket such as output/input/temp."""
        safe_type = str(item_type or "").strip().lower()
        if not safe_type:
            return None
        try:
            import folder_paths  # type: ignore

            getter = getattr(folder_paths, "get_directory_by_type", None)
            if callable(getter):
                value = getter(safe_type)
                if value:
                    return str(value)
        except Exception:
            logger.debug("Failed to resolve ComfyUI directory type=%s", safe_type, exc_info=True)
        return None

    def get_input_directory(self) -> str | None:
        """Return ComfyUI input directory when folder_paths is available."""
        try:
            import folder_paths  # type: ignore

            getter = getattr(folder_paths, "get_input_directory", None)
            if callable(getter):
                value = getter()
                if value:
                    return str(value)
        except Exception:
            logger.debug("Failed to resolve ComfyUI input directory", exc_info=True)
        return None

    def get_output_directory(self) -> str | None:
        """Return ComfyUI output directory when folder_paths is available."""
        try:
            import folder_paths  # type: ignore

            getter = getattr(folder_paths, "get_output_directory", None)
            if callable(getter):
                value = getter()
                if value:
                    return str(value)
        except Exception:
            logger.debug("Failed to resolve ComfyUI output directory", exc_info=True)
        return None

    def get_temp_directory(self) -> str | None:
        """Return ComfyUI temp directory when folder_paths is available."""
        value = self.get_directory_by_type("temp")
        if value:
            return value
        try:
            import folder_paths  # type: ignore

            getter = getattr(folder_paths, "get_temp_directory", None)
            if callable(getter):
                value = getter()
                if value:
                    return str(value)
        except Exception:
            logger.debug("Failed to resolve ComfyUI temp directory", exc_info=True)
        return None

    def output_file_paths_from_history(self, prompt_id: str) -> list[str]:
        """Extract absolute output/temp file paths from a ComfyUI history entry."""
        return [item.path for item in self.output_files_from_history(prompt_id)]

    def output_files_from_history(self, prompt_id: str) -> list[PromptOutputFile]:
        """Extract output/temp files plus their producing node metadata."""
        history = self.get_prompt_history(prompt_id)
        entry = history.get(str(prompt_id or "").strip())
        if not isinstance(entry, dict):
            return []
        outputs = entry.get("outputs")
        if not isinstance(outputs, dict):
            return []
        prompt_graph = self._prompt_graph_from_history_entry(entry)

        refs: list[PromptOutputFile] = []
        seen: set[str] = set()
        for node_id, node_output in outputs.items():
            if not isinstance(node_output, dict):
                continue
            safe_node_id = str(node_id or "").strip()
            node_type = self._node_type_from_prompt_graph(prompt_graph, safe_node_id)
            for items in node_output.values():
                if not isinstance(items, list):
                    continue
                for item in items:
                    path = self._history_item_to_absolute_path(item)
                    if path and path not in seen:
                        seen.add(path)
                        refs.append(
                            PromptOutputFile(
                                path=path,
                                node_id=safe_node_id,
                                node_type=node_type,
                                item_type=str(item.get("type") or "").strip().lower(),
                            )
                        )
        return refs

    @staticmethod
    def _prompt_graph_from_history_entry(entry: dict[str, Any]) -> dict[str, Any]:
        prompt = entry.get("prompt")
        if isinstance(prompt, (list, tuple)) and len(prompt) > 2 and isinstance(prompt[2], dict):
            return prompt[2]
        if isinstance(prompt, dict):
            return prompt
        return {}

    @staticmethod
    def _node_type_from_prompt_graph(prompt_graph: dict[str, Any], node_id: str) -> str:
        try:
            node = prompt_graph.get(str(node_id))
            if isinstance(node, dict):
                return str(node.get("class_type") or node.get("type") or "").strip()
        except Exception:
            return ""
        return ""

    def _history_item_to_absolute_path(self, item: Any) -> str | None:
        if not isinstance(item, dict):
            return None
        item_type = str(item.get("type") or "").strip().lower()
        if item_type not in {"output", "temp"}:
            return None
        filename = str(item.get("filename") or "").strip()
        if not filename:
            return None
        base_dir = self.get_directory_by_type(item_type)
        if not base_dir:
            return None
        try:
            base = Path(base_dir).resolve(strict=False)
            subfolder = str(item.get("subfolder") or "").strip()
            candidate = (base / subfolder / filename).resolve(strict=False)
            if candidate == base or base in candidate.parents:
                return str(candidate)
        except Exception:
            logger.debug("Failed to resolve history item path", exc_info=True)
        return None

    def schedule_task(self, coro: Any) -> bool:
        """Schedule a coroutine on the ComfyUI loop when available."""
        try:
            instance = self.get_prompt_server_instance()
            loop = getattr(instance, "loop", None)
            if loop is not None and callable(getattr(loop, "create_task", None)):
                loop.call_soon_threadsafe(loop.create_task, coro)
                return True
        except Exception:
            logger.debug("Failed to schedule task on ComfyUI loop", exc_info=True)
        try:
            import asyncio

            asyncio.get_running_loop().create_task(coro)
            return True
        except Exception:
            logger.debug("No running loop available for scheduled task", exc_info=True)
        return False

    def send_event(self, event: str, data: Any, sid: str | None = None) -> bool:
        """Send a WebSocket event through PromptServer when available."""
        safe_event = str(event or "").strip()
        if not safe_event:
            return False
        try:
            instance = self.get_prompt_server_instance()
            sender = getattr(instance, "send_sync", None)
            if not callable(sender):
                return False
            sender(safe_event, data, sid)
            return True
        except Exception:
            logger.debug("Failed to emit ComfyUI event %s", safe_event, exc_info=True)
            return False

    def get_feature_flags(self) -> dict[str, Any]:
        try:
            from comfy_api.feature_flags import SERVER_FEATURE_FLAGS  # type: ignore

            if isinstance(SERVER_FEATURE_FLAGS, dict):
                return dict(SERVER_FEATURE_FLAGS)
        except Exception:
            pass
        return {}

    def has_feature(self, name: str) -> bool:
        try:
            return bool(self.get_feature_flags().get(str(name)))
        except Exception:
            return False

    def core_assets_enabled(self) -> bool:
        flags = self.get_feature_flags()
        if "assets" in flags and not bool(flags.get("assets")):
            return False
        try:
            from app.assets.services import list_assets_page  # noqa: F401

            return True
        except Exception:
            return False

    def jobs_available(self) -> bool:
        try:
            from comfy_execution.jobs import get_all_jobs, get_job  # noqa: F401

            return True
        except Exception:
            return False

    def capabilities(self) -> ComfyCoreCapabilities:
        instance = self.get_prompt_server_instance()
        app = getattr(instance, "app", None) if instance is not None else None
        routes = getattr(instance, "routes", None) if instance is not None else None
        user_manager = getattr(instance, "user_manager", None) if instance is not None else None
        send_sync = getattr(instance, "send_sync", None) if instance is not None else None
        queue_getter = getattr(instance, "get_queue_info", None) if instance is not None else None
        flags = self.get_feature_flags()
        return ComfyCoreCapabilities(
            prompt_server=instance is not None,
            app=app is not None,
            routes=routes is not None,
            user_manager=user_manager is not None,
            websocket=callable(send_sync),
            queue_info=callable(queue_getter),
            feature_flags=flags,
            assets=self.core_assets_enabled(),
            jobs=self.jobs_available(),
        )


_ADAPTER = ComfyCoreAdapter()


def get_comfy_core() -> ComfyCoreAdapter:
    return _ADAPTER


def send_event(event: str, data: Any, sid: str | None = None) -> bool:
    return _ADAPTER.send_event(event, data, sid)


def get_capabilities() -> dict[str, Any]:
    return _ADAPTER.capabilities().as_dict()


def get_prompt_output_paths(prompt_id: str) -> list[str]:
    return _ADAPTER.output_file_paths_from_history(prompt_id)


def get_prompt_output_files(prompt_id: str) -> list[PromptOutputFile]:
    return _ADAPTER.output_files_from_history(prompt_id)


def get_workflow_id_for_prompt(prompt_id: str) -> str | None:
    """Best-effort extraction of the workflow id associated with a prompt.

    ComfyUI's frontend stores a stable workflow identifier inside the prompt's
    ``extra_data`` payload (``extra_pnginfo.workflow.id`` or ``workflow.id``).
    Older clients omit it, so we return ``None`` when nothing is available.
    """
    safe_prompt_id = str(prompt_id or "").strip()
    if not safe_prompt_id:
        return None
    try:
        history = _ADAPTER.get_prompt_history(safe_prompt_id)
    except Exception:
        return None
    entry = history.get(safe_prompt_id) if isinstance(history, dict) else None
    if not isinstance(entry, dict):
        return None

    # ComfyUI stores the prompt graph + extra_data at entry["prompt"]; the
    # layout is `[number, prompt_id, graph, extra_data, outputs_to_execute]`.
    prompt_tuple = entry.get("prompt")
    extra_data: Any = None
    if isinstance(prompt_tuple, (list, tuple)) and len(prompt_tuple) >= 4:
        extra_data = prompt_tuple[3]
    elif isinstance(entry.get("extra_data"), dict):
        extra_data = entry.get("extra_data")

    if not isinstance(extra_data, dict):
        return None

    # Common locations, in order of preference.
    candidates: list[Any] = []
    workflow = extra_data.get("workflow")
    if isinstance(workflow, dict):
        candidates.append(workflow.get("id"))
    extra_pnginfo = extra_data.get("extra_pnginfo")
    if isinstance(extra_pnginfo, dict):
        wf = extra_pnginfo.get("workflow")
        if isinstance(wf, dict):
            candidates.append(wf.get("id"))
    candidates.append(extra_data.get("workflow_id"))

    for value in candidates:
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return None


def get_input_directory() -> str | None:
    return _ADAPTER.get_input_directory()


def get_output_directory() -> str | None:
    return _ADAPTER.get_output_directory()


def get_temp_directory() -> str | None:
    return _ADAPTER.get_temp_directory()


def schedule_task(coro: Any) -> bool:
    return _ADAPTER.schedule_task(coro)


__all__ = [
    "ComfyCoreAdapter",
    "ComfyCoreCapabilities",
    "PromptOutputFile",
    "get_capabilities",
    "get_comfy_core",
    "get_input_directory",
    "get_output_directory",
    "get_temp_directory",
    "get_prompt_output_files",
    "get_prompt_output_paths",
    "get_workflow_id_for_prompt",
    "send_event",
    "schedule_task",
]
