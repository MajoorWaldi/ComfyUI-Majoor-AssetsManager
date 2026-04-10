"""Asset route context and target models."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(slots=True)
class AssetRouteContext:
    services: dict[str, Any]
    body: dict[str, Any]


@dataclass(slots=True)
class AssetPathContext:
    services: dict[str, Any]
    body: dict[str, Any]
    asset_id: int | None
    candidate_path: Path


@dataclass(slots=True)
class AssetRenameContext:
    services: dict[str, Any]
    body: dict[str, Any]
    asset_id: int | None
    new_name: str


@dataclass(slots=True)
class AssetIdsContext:
    services: dict[str, Any]
    body: dict[str, Any]
    asset_ids: list[int]


@dataclass(slots=True)
class AssetDeleteTarget:
    services: dict[str, Any]
    matched_asset_id: int | None
    resolved_path: Path
    filepath_where: str
    filepath_params: tuple[Any, ...]


@dataclass(slots=True)
class AssetRenameTarget:
    services: dict[str, Any]
    matched_asset_id: int | None
    current_resolved: Path
    current_filename: str
    current_source: str
    current_root_id: str
    filepath_where: str
    filepath_params: tuple[Any, ...]
    new_name: str


__all__ = [
    "AssetDeleteTarget",
    "AssetIdsContext",
    "AssetPathContext",
    "AssetRenameContext",
    "AssetRenameTarget",
    "AssetRouteContext",
]