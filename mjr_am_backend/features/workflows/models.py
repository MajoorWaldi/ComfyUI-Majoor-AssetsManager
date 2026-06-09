"""Workflow domain model helpers."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class WorkflowParseStats:
    """Normalized workflow shape statistics used by listing cards."""

    nodes: list[dict[str, Any]]
    node_count: int
    link_count: int
    subgraph_count: int
    subgraph_node_count: int


@dataclass(frozen=True)
class WorkflowDetectionResult:
    """Structured workflow detection result for library metadata."""

    task: str
    model_family: str
    provider: str
    runs_on: str
    confidence: float = 0.0
    source: str = "text"
    signals: dict[str, Any] | None = None


WorkflowClassification = WorkflowDetectionResult
