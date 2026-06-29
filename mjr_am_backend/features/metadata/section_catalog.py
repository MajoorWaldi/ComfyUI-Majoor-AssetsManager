"""Declarative metadata section catalog shared by routes and search helpers."""

from __future__ import annotations

from copy import deepcopy
from typing import Any

CATALOG_VERSION = 1
PARSER_FAMILY_VERSION = "geninfo-catalog-v1"

METADATA_SECTION_CATALOG: dict[str, Any] = {
    "version": CATALOG_VERSION,
    "parser_family_version": PARSER_FAMILY_VERSION,
    "sections": [
        {
            "key": "file_info",
            "title": "File Info",
            "kind": "fileinfo",
            "media": ["image", "video", "audio", "model3d"],
            "search_field": "file",
            "aliases": ["filename", "path", "size", "resolution"],
            "paths": ["$.file_info", "$.width", "$.height", "$.duration", "$.resolution"],
            "default_fields": ["filename", "filepath", "size", "width", "height", "duration"],
        },
        {
            "key": "prompt",
            "title": "Prompt",
            "kind": "text",
            "media": ["image", "video", "audio", "model3d"],
            "search_field": "prompt",
            "aliases": ["positive", "negative", "text"],
            "paths": [
                "$.positive_prompt",
                "$.negative_prompt",
                "$.parameters",
                "$.geninfo.positive.value",
                "$.geninfo.negative.value",
            ],
            "default_fields": ["positive_prompt", "negative_prompt"],
        },
        {
            "key": "model",
            "title": "Models",
            "kind": "scalar",
            "media": ["image", "video", "audio", "model3d"],
            "search_field": "model",
            "aliases": ["checkpoint", "ckpt", "vae", "clip"],
            "paths": [
                "$.model",
                "$.checkpoint",
                "$.models",
                "$.geninfo.checkpoint.name",
                "$.geninfo.models",
                "$.geninfo.vae.name",
            ],
            "default_fields": ["checkpoint", "model", "vae", "clip"],
        },
        {
            "key": "sampler",
            "title": "Sampling",
            "kind": "object",
            "media": ["image", "video"],
            "search_field": "sampler",
            "aliases": ["sampling", "scheduler", "steps", "cfg", "seed", "denoise"],
            "paths": [
                "$.sampler",
                "$.scheduler",
                "$.steps",
                "$.cfg",
                "$.seed",
                "$.denoise",
                "$.geninfo.sampler",
                "$.geninfo.scheduler",
                "$.geninfo.steps",
                "$.geninfo.cfg",
                "$.geninfo.seed",
            ],
            "default_fields": ["sampler", "scheduler", "steps", "cfg", "seed", "denoise"],
        },
        {
            "key": "lora",
            "title": "LoRAs",
            "kind": "array",
            "media": ["image", "video"],
            "search_field": "lora",
            "aliases": ["loras", "lycoris"],
            "paths": ["$.loras", "$.lora", "$.geninfo.loras", "$.geninfo.lora"],
            "default_fields": ["name", "strength", "strength_model", "strength_clip"],
        },
        {
            "key": "control",
            "title": "Control",
            "kind": "array",
            "media": ["image", "video"],
            "search_field": "control",
            "aliases": ["controlnet", "adapter", "ipadapter"],
            "paths": ["$.controlnet", "$.control", "$.ipadapter", "$.geninfo.controlnet"],
            "default_fields": ["model", "strength", "start", "end"],
        },
        {
            "key": "upscale",
            "title": "Upscaling",
            "kind": "array",
            "media": ["image", "video"],
            "search_field": "upscale",
            "aliases": ["upscaler", "upscaling", "scale"],
            "paths": ["$.upscaling", "$.upscale", "$.geninfo.upscaling", "$.geninfo.upscale"],
            "default_fields": ["model", "method", "scale"],
        },
        {
            "key": "workflow_nodes",
            "title": "Workflow Nodes",
            "kind": "nodes",
            "media": ["image", "video", "audio", "model3d"],
            "search_field": "node",
            "aliases": ["nodes", "workflow_node", "workflow_nodes"],
            "paths": ["$.workflow.nodes", "$.prompt", "$.geninfo.workflow_nodes"],
            "default_fields": ["type", "title", "params"],
        },
        {
            "key": "tags",
            "title": "Tags",
            "kind": "tags",
            "media": ["image", "video", "audio", "model3d"],
            "search_field": "tag",
            "aliases": ["tags", "rating"],
            "paths": ["$.tags", "$.rating"],
            "default_fields": ["tags", "rating"],
        },
    ],
}


def get_metadata_section_catalog() -> dict[str, Any]:
    return deepcopy(METADATA_SECTION_CATALOG)


def iter_search_aliases() -> dict[str, str]:
    aliases: dict[str, str] = {}
    for section in METADATA_SECTION_CATALOG["sections"]:
        canonical = str(section.get("search_field") or section.get("key") or "").strip()
        if not canonical:
            continue
        aliases[canonical] = canonical
        aliases[str(section.get("key") or "").strip()] = canonical
        for alias in section.get("aliases") or []:
            aliases[str(alias).strip().lower()] = canonical
    return {k: v for k, v in aliases.items() if k}


def paths_for_search_field(field: str) -> list[str]:
    canonical = iter_search_aliases().get(str(field or "").strip().lower(), "")
    if not canonical:
        return []
    for section in METADATA_SECTION_CATALOG["sections"]:
        if section.get("search_field") == canonical:
            return [str(path) for path in section.get("paths") or [] if str(path).startswith("$.")]
    return []
