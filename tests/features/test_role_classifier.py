"""
Coverage tests for role_classifier.py.
Targets: 30, 37, 71, 80, 89, 91, 93, 95, 101-106, 119-123, 129, 131, 133,
         139, 141, 156, 159, 162, 174, 208, 227-303.
"""
from __future__ import annotations

import pytest

from mjr_am_backend.features.geninfo import role_classifier as rc


# ─── _extract_workflow_metadata ─────────────────────────────────────────────

def test_extract_workflow_metadata_no_extra():
    assert rc._extract_workflow_metadata({}) == {}


def test_extract_workflow_metadata_with_extra():
    wf = {"extra": {"title": "My Workflow", "author": "Test"}}
    meta = rc._extract_workflow_metadata(wf)
    assert meta["title"] == "My Workflow" and meta["author"] == "Test"


def test_extract_workflow_metadata_non_dict():
    assert rc._extract_workflow_metadata(None) == {}
    assert rc._extract_workflow_metadata("string") == {}


# ─── _subject_role_hints ────────────────────────────────────────────────────

def test_subject_role_hints_not_dict():
    assert rc._subject_role_hints(None) == set()


def test_subject_role_hints_first_frame():
    subject = {"_meta": {"title": "First Frame"}, "inputs": {"image": "frame_first.png"}}
    roles = rc._subject_role_hints(subject)
    assert "first_frame" in roles


def test_subject_role_hints_control():
    subject = {"_meta": {"title": "ControlNet Input"}, "inputs": {"image": ""}}
    roles = rc._subject_role_hints(subject)
    assert "control" in roles


def test_subject_role_hints_mask():
    subject = {"_meta": {"title": "Inpaint Mask"}, "inputs": {"image": ""}}
    roles = rc._subject_role_hints(subject)
    assert "mask/inpaint" in roles


def test_subject_role_hints_style_reference():
    subject = {"title": "Reference Style", "inputs": {"image": ""}}
    roles = rc._subject_role_hints(subject)
    assert "style/reference" in roles


# ─── _classify_control_or_mask_role ─────────────────────────────────────────

def test_classify_control_ipadapter():
    assert rc._classify_control_or_mask_role("ipadapterapply", "image", False) == "style/reference"


def test_classify_control_controlnet_image():
    assert rc._classify_control_or_mask_role("controlnetapply", "image", False) == "control_image"


def test_classify_control_controlnet_video():
    assert rc._classify_control_or_mask_role("controlnetapply", "image", True) == "control_video"


def test_classify_control_mask():
    assert rc._classify_control_or_mask_role("inpaintnode", "mask_input", False) == "mask/inpaint"


def test_classify_control_depth():
    assert rc._classify_control_or_mask_role("depthestimator", "depth_image", False) == "depth"


def test_classify_control_none():
    assert rc._classify_control_or_mask_role("somenode", "image", False) is None


# ─── _classify_vace_or_range_role ───────────────────────────────────────────

def test_classify_vace_control():
    assert rc._classify_vace_or_range_role("vacenode", "control_input") == "control_video"


def test_classify_vace_source():
    assert rc._classify_vace_or_range_role("wanvaceencoder", "image") == "source"


def test_classify_frame_range():
    assert rc._classify_vace_or_range_role("starttoendnode", "start_frame") == "first_frame"


def test_classify_none():
    assert rc._classify_vace_or_range_role("saveimage", "image") is None


# ─── _frame_edge_role ───────────────────────────────────────────────────────

def test_frame_edge_role_first():
    assert rc._frame_edge_role("start_frame") == "first_frame"
    assert rc._frame_edge_role("first_image") == "first_frame"


def test_frame_edge_role_last():
    assert rc._frame_edge_role("end_frame") == "last_frame"
    assert rc._frame_edge_role("last_image") == "last_frame"


def test_frame_edge_role_none():
    assert rc._frame_edge_role("image") is None


# ─── _classify_generic_source_role ──────────────────────────────────────────

def test_classify_generic_source_first_frame():
    assert rc._classify_generic_source_role("somenode", "first_image") == "first_frame"


def test_classify_generic_source_last_frame():
    assert rc._classify_generic_source_role("somenode", "last_image") == "last_frame"


def test_classify_generic_source_img2vid():
    assert rc._classify_generic_source_role("img2videncoder", "image") == "source"


def test_classify_generic_source_sampler_image():
    assert rc._classify_generic_source_role("samplernode", "image_input") == "source"


def test_classify_generic_source_none():
    assert rc._classify_generic_source_role("unknownnode", "x") is None


# ─── _classify_downstream_input_role ────────────────────────────────────────

def test_classify_downstream_controlnet():
    role, continue_chain = rc._classify_downstream_input_role("controlnetapply", "image", False)
    assert role == "control_image" and continue_chain is False


def test_classify_downstream_none():
    role, continue_chain = rc._classify_downstream_input_role("unknownnode", "x", False)
    assert role is None and continue_chain is True


# ─── _contains_any_token ────────────────────────────────────────────────────

def test_contains_any_token():
    assert rc._contains_any_token("first frame ref", ("first",)) is True
    assert rc._contains_any_token("normal image", ("first",)) is False


# ─── _detect_input_role ─────────────────────────────────────────────────────

def test_detect_input_role_no_downstream():
    nodes = {"1": {"class_type": "LoadImage", "inputs": {"image": "x.png"}}}
    role = rc._detect_input_role(nodes, "1")
    assert role in {"input", "first_frame", "last_frame", "source"}
