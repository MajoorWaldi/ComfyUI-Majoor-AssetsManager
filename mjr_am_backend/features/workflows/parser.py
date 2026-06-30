"""Workflow JSON parsing helpers."""

from __future__ import annotations

from typing import Any

from .models import WorkflowParseStats


def _iter_graph_nodes(graph: dict[str, Any] | None) -> list[dict[str, Any]]:
    if not isinstance(graph, dict):
        return []

    nodes = graph.get("nodes")
    if isinstance(nodes, list):
        return [node for node in nodes if isinstance(node, dict)]

    prompt = graph.get("prompt")
    if isinstance(prompt, dict):
        out: list[dict[str, Any]] = []
        for node_id, node in prompt.items():
            if isinstance(node, dict):
                out.append({"id": node_id, **node})
        return out
    return []


def _iter_nested_subgraphs(nodes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    nested: list[dict[str, Any]] = []
    for node in nodes:
        subgraph = node.get("subgraph")
        if isinstance(subgraph, dict):
            nested.append(subgraph)
    return nested


def _graph_label(graph: dict[str, Any], fallback: str) -> str:
    value = str(
        graph.get("id")
        or graph.get("name")
        or graph.get("title")
        or graph.get("type")
        or fallback
    ).strip()
    return value or fallback


def _node_id(node: dict[str, Any], fallback: int) -> str:
    return str(node.get("id") or node.get("ID") or fallback).strip() or str(fallback)


def parse_workflow(workflow: dict[str, Any]) -> WorkflowParseStats:
    root_nodes = _iter_graph_nodes(workflow)
    qualified_node_ids = [f"root::{_node_id(node, index)}" for index, node in enumerate(root_nodes)]

    definitions = workflow.get("definitions") if isinstance(workflow.get("definitions"), dict) else {}
    raw_subgraphs = definitions.get("subgraphs") if isinstance(definitions, dict) else None
    definition_subgraphs = [g for g in (raw_subgraphs or []) if isinstance(g, dict)] if isinstance(raw_subgraphs, list) else []

    # Include both serialized definition subgraphs and nested runtime subgraph objects.
    pending = [(graph, f"definitions/{_graph_label(graph, str(index))}") for index, graph in enumerate(definition_subgraphs)]
    all_subgraphs: list[dict[str, Any]] = []
    all_nodes = list(root_nodes)
    seen: set[int] = set()

    while pending:
        graph, graph_path = pending.pop(0)
        graph_id = id(graph)
        if graph_id in seen:
            continue
        seen.add(graph_id)
        all_subgraphs.append(graph)

        nodes = _iter_graph_nodes(graph)
        all_nodes.extend(nodes)
        qualified_node_ids.extend(
            f"{graph_path}::{_node_id(node, index)}" for index, node in enumerate(nodes)
        )
        pending.extend(
            (subgraph, f"{graph_path}/{_graph_label(subgraph, str(index))}")
            for index, subgraph in enumerate(_iter_nested_subgraphs(nodes))
        )

    root_nested = [
        (subgraph, f"root/{_node_id(node, index)}")
        for index, node in enumerate(root_nodes)
        if isinstance((subgraph := node.get("subgraph")), dict)
    ]
    pending.extend(root_nested)
    while pending:
        graph, graph_path = pending.pop(0)
        graph_id = id(graph)
        if graph_id in seen:
            continue
        seen.add(graph_id)
        all_subgraphs.append(graph)

        nodes = _iter_graph_nodes(graph)
        all_nodes.extend(nodes)
        qualified_node_ids.extend(
            f"{graph_path}::{_node_id(node, index)}" for index, node in enumerate(nodes)
        )
        pending.extend(
            (subgraph, f"{graph_path}/{_graph_label(subgraph, str(index))}")
            for index, subgraph in enumerate(_iter_nested_subgraphs(nodes))
        )

    links = workflow.get("links")
    return WorkflowParseStats(
        nodes=all_nodes,
        node_count=len(root_nodes),
        link_count=len(links) if isinstance(links, list) else 0,
        subgraph_count=len(all_subgraphs),
        subgraph_node_count=max(0, len(all_nodes) - len(root_nodes)),
        qualified_node_ids=qualified_node_ids,
    )


def workflow_node_text(nodes: list[dict[str, Any]]) -> str:
    parts: list[str] = []
    for node in nodes:
        parts.append(str(node.get("type") or node.get("class_type") or "").strip())
        widgets = node.get("widgets_values")
        if isinstance(widgets, list):
            parts.extend(str(v) for v in widgets[:8] if v is not None)
        inputs = node.get("inputs")
        if isinstance(inputs, dict):
            parts.extend(str(v) for v in inputs.values() if isinstance(v, str))
    return " ".join(parts).lower()
