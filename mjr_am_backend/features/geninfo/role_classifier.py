"""Role classification and workflow-type helpers extracted from parser.py."""

from __future__ import annotations

from typing import Any

from .graph_converter import _inputs, _is_link, _lower, _node_type, _resolve_link, _walk_passthrough

_INPUT_ROLE_PRIORITY: tuple[str, ...] = (
    "first_frame",
    "last_frame",
    "mask/inpaint",
    "depth",
    "control_video",
    "control_image",
    "control",
    "source",
    "style/reference",
    "frame_range",
)


def _extract_workflow_metadata(workflow: Any) -> dict[str, Any]:
    meta = {}
    if isinstance(workflow, dict):
        extra = workflow.get("extra", {})
        if isinstance(extra, dict):
            for key in ("title", "author", "license", "version", "description"):
                if extra.get(key):
                    meta[key] = str(extra[key]).strip()
    return meta


def _subject_role_hints(subject: dict[str, Any] | None) -> set[str]:
    roles: set[str] = set()
    if not isinstance(subject, dict):
        return roles
    title = _lower(subject.get("_meta", {}).get("title", "") or subject.get("title", ""))
    ins = _inputs(subject)
    filename = _lower(str(ins.get("image", "") or ins.get("video", "")))
    _add_subject_role_if_match(roles, "first_frame", title=title, filename=filename, title_tokens=("first", "start"), filename_tokens=("first",))
    _add_subject_role_if_match(roles, "last_frame", title=title, filename=filename, title_tokens=("last", "end"), filename_tokens=("last",))
    _add_subject_role_if_match(roles, "control", title=title, filename=filename, title_tokens=("control",), filename_tokens=())
    _add_subject_role_if_match(roles, "mask/inpaint", title=title, filename=filename, title_tokens=("mask", "inpaint"), filename_tokens=())
    _add_subject_role_if_match(roles, "depth", title=title, filename=filename, title_tokens=("depth",), filename_tokens=())
    _add_subject_role_if_match(
        roles,
        "style/reference",
        title=title,
        filename=filename,
        title_tokens=("reference", "ref", "style"),
        filename_tokens=(),
    )
    return roles


def _contains_any_token(value: str, tokens: tuple[str, ...]) -> bool:
    return any(token in value for token in tokens)


def _add_subject_role_if_match(
    roles: set[str],
    role: str,
    *,
    title: str,
    filename: str,
    title_tokens: tuple[str, ...],
    filename_tokens: tuple[str, ...],
) -> None:
    if _contains_any_token(title, title_tokens) or _contains_any_token(filename, filename_tokens):
        roles.add(role)


def _linked_input_from_frontier(node: dict[str, Any], frontier: set[str]) -> str | None:
    for key, value in _inputs(node).items():
        if not _is_link(value):
            continue
        resolved = _resolve_link(value)
        if not resolved:
            continue
        src_id, _ = resolved
        if str(src_id) in frontier:
            return str(key).lower()
    return None


def _classify_control_or_mask_role(target_type: str, hit_input_name: str, subject_is_video: bool) -> str | None:
    if "ipadapter" in target_type:
        return "style/reference"
    if "controlnet" in target_type:
        return "control_video" if subject_is_video else "control_image"
    if "mask" in hit_input_name or "mask" in target_type or "inpaint" in target_type:
        return "mask/inpaint"
    if "depth" in target_type or "depth" in hit_input_name:
        return "depth"
    return None


def _classify_vace_or_range_role(target_type: str, hit_input_name: str) -> str | None:
    if _is_vace_target_type(target_type):
        edge_role = _frame_edge_role(hit_input_name)
        if "control" in hit_input_name or "reference" in hit_input_name:
            return "control_video"
        return edge_role or "source"
    if _is_frame_range_target_type(target_type):
        return _frame_edge_role(hit_input_name) or "frame_range"
    return None


def _is_vace_target_type(target_type: str) -> bool:
    return "vace" in target_type or "wanvace" in target_type


def _is_frame_range_target_type(target_type: str) -> bool:
    return "starttoend" in target_type or "framerange" in target_type


def _frame_edge_role(hit_input_name: str) -> str | None:
    if "start" in hit_input_name or "first" in hit_input_name:
        return "first_frame"
    if "end" in hit_input_name or "last" in hit_input_name:
        return "last_frame"
    return None


def _classify_generic_source_role(target_type: str, hit_input_name: str) -> str | None:
    edge_role = _edge_role_from_input_name(hit_input_name)
    if edge_role:
        return edge_role
    if _target_type_is_source_like(target_type):
        return "source"
    if _sampler_input_is_source(target_type, hit_input_name):
        return "source"
    return None


def _edge_role_from_input_name(hit_input_name: str) -> str | None:
    if "first" in hit_input_name or "start" in hit_input_name:
        return "first_frame"
    if "last" in hit_input_name or "end" in hit_input_name:
        return "last_frame"
    return None


def _target_type_is_source_like(target_type: str) -> bool:
    return "img2vid" in target_type or "i2v" in target_type or "vaeencode" in target_type


def _sampler_input_is_source(target_type: str, hit_input_name: str) -> bool:
    return "sampler" in target_type and ("image" in hit_input_name or "latent" in hit_input_name)


def _classify_downstream_input_role(target_type: str, hit_input_name: str, subject_is_video: bool) -> tuple[str | None, bool]:
    role = _classify_control_or_mask_role(target_type, hit_input_name, subject_is_video)
    if role:
        return role, False
    role = _classify_vace_or_range_role(target_type, hit_input_name)
    if role:
        return role, False
    role = _classify_generic_source_role(target_type, hit_input_name)
    if role:
        return role, False
    return None, True


def _detect_input_role(nodes_by_id: dict[str, Any], subject_node_id: str) -> str:
    subject_id = str(subject_node_id)
    subject = nodes_by_id.get(subject_id) or nodes_by_id.get(subject_node_id)
    roles = _subject_role_hints(subject if isinstance(subject, dict) else None)
    subject_is_video = isinstance(subject, dict) and ("video" in _lower(_node_type(subject)))
    roles.update(_detect_roles_from_downstream(nodes_by_id, subject_id, subject_is_video))
    for role in _INPUT_ROLE_PRIORITY:
        if role in roles:
            return role
    return "input"


def _detect_roles_from_downstream(nodes_by_id: dict[str, Any], subject_id: str, subject_is_video: bool) -> set[str]:
    roles: set[str] = set()
    frontier: set[str] = {subject_id}
    visited: set[str] = {subject_id}
    for _ in range(8):
        if not frontier:
            break
        next_frontier = _scan_downstream_frontier(nodes_by_id, frontier, visited, subject_is_video, roles)
        visited.update(next_frontier)
        frontier = next_frontier
    return roles


def _scan_downstream_frontier(
    nodes_by_id: dict[str, Any],
    frontier: set[str],
    visited: set[str],
    subject_is_video: bool,
    roles: set[str],
) -> set[str]:
    next_frontier: set[str] = set()
    for nid, node in nodes_by_id.items():
        nid_s = str(nid)
        if nid_s in visited or not isinstance(node, dict):
            continue
        hit_input_name = _linked_input_from_frontier(node, frontier)
        if hit_input_name is None:
            continue
        role, should_expand = _classify_downstream_input_role(_lower(_node_type(node)), hit_input_name, subject_is_video)
        if role:
            roles.add(role)
        if should_expand:
            next_frontier.add(nid_s)
    return next_frontier


def _is_image_loader_node_type(ct: str) -> bool:
    return "loadimage" in ct or "imageloader" in ct


def _is_video_loader_node_type(ct: str) -> bool:
    return "loadvideo" in ct or "videoloader" in ct


def _is_audio_loader_node_type(ct: str) -> bool:
    return "loadaudio" in ct or "audioloader" in ct or ("load" in ct and "audio" in ct)


def _vae_pixel_input_kind(nodes_by_id: dict[str, Any], vae_node: dict[str, Any]) -> str | None:
    vae_ins = _inputs(vae_node)
    pixel_link = vae_ins.get("pixels") or vae_ins.get("image")
    if not _is_link(pixel_link):
        return None
    pix_src_id = _walk_passthrough(nodes_by_id, pixel_link)
    if not pix_src_id:
        return None
    pct = _lower(_node_type(nodes_by_id.get(pix_src_id)))
    if _is_video_loader_node_type(pct):
        return "video"
    if _is_image_loader_node_type(pct):
        return "image"
    return None


def _next_latent_upstream_id(nodes_by_id: dict[str, Any], node: dict[str, Any]) -> str | None:
    for key in ("samples", "latent", "latent_image"):
        value = _inputs(node).get(key)
        if _is_link(value):
            return _walk_passthrough(nodes_by_id, value)
    return None


def _trace_sampler_latent_input_kind(
    nodes_by_id: dict[str, Any],
    sampler_id: str | None,
    has_image_input: bool,
    has_video_input: bool,
) -> tuple[bool, bool]:
    if not sampler_id:
        return has_image_input, has_video_input
    sampler = nodes_by_id.get(sampler_id)
    if not isinstance(sampler, dict):
        return has_image_input, has_video_input
    ins = _inputs(sampler)
    latent_link = ins.get("latent_image") or ins.get("samples") or ins.get("latent")
    if not _is_link(latent_link):
        return has_image_input, has_video_input
    curr_id = _walk_passthrough(nodes_by_id, latent_link)
    hops = 0
    while curr_id and hops < 15:
        hops += 1
        node = nodes_by_id.get(curr_id)
        if not isinstance(node, dict):
            break
        has_image_input, has_video_input, should_stop = _update_inputs_from_latent_node(
            nodes_by_id,
            node,
            has_image_input=has_image_input,
            has_video_input=has_video_input,
        )
        if should_stop:
            break
        curr_id = _next_latent_upstream_id(nodes_by_id, node)
    return has_image_input, has_video_input


def _update_inputs_from_latent_node(
    nodes_by_id: dict[str, Any],
    node: dict[str, Any],
    *,
    has_image_input: bool,
    has_video_input: bool,
) -> tuple[bool, bool, bool]:
    ct = _lower(_node_type(node))
    if "emptylatent" in ct:
        return has_image_input, has_video_input, True
    if "vaeencode" in ct:
        pixel_kind = _vae_pixel_input_kind(nodes_by_id, node)
        if pixel_kind == "video":
            has_video_input = True
        else:
            has_image_input = True
        return has_image_input, has_video_input, True
    if "loadlatent" in ct:
        return True, has_video_input, True
    return has_image_input, has_video_input, False
