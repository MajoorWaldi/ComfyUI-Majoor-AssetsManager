from pathlib import Path

import pytest
from packaging.requirements import Requirement

ROOT = Path(__file__).resolve().parents[1]


def _pillow_lines() -> list[str]:
    lines = (ROOT / "requirements.txt").read_text(encoding="utf-8").splitlines()
    return [line for line in lines if line.startswith("pillow")]


def _pillow_for(python_version: str) -> Requirement:
    matching = [
        req
        for req in map(Requirement, _pillow_lines())
        if req.marker.evaluate({"python_version": python_version})
    ]
    assert len(matching) == 1
    return matching[0]


@pytest.mark.parametrize(
    ("python_version", "version", "allowed"),
    [
        ("3.10", "10.0.0", False),
        ("3.10", "12.3.0", True),
        ("3.10", "13.0.0", False),
        ("3.11", "12.3.0", False),
        ("3.11", "13.0.0", True),
        ("3.14", "12.3.0", False),
        ("3.14", "13.0.0", True),
    ],
)
def test_pillow_security_constraint(python_version, version, allowed):
    # Pillow 13 needs Python 3.11+, so 3.10 is pinned to the latest 12.x.
    assert (version in _pillow_for(python_version).specifier) is allowed


def test_pillow_requirements_match_pyproject():
    pyproject = (ROOT / "pyproject.toml").read_text(encoding="utf-8")
    for line in _pillow_lines():
        assert '"' + line.replace('"', '\\"') + '",' in pyproject
